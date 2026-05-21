// Ported from FilmKit src/ptp/transport.ts

/// <reference types="@types/w3c-web-usb" />
import { FUJI_VENDOR_ID, PTP_TYPE } from './constants';
import { packContainer, unpackContainer } from './container';
import type { PTPContainerData } from './container';

const CHUNK_SIZE = 512 * 1024;
const TIMEOUT_MS = 5000;

export class USBError extends Error {
  constructor(public code: 'not-supported' | 'cancelled' | 'security' | 'busy' | 'other', message: string) {
    super(message);
    this.name = 'USBError';
  }
}

export function isWebUSBSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

function mapUSBError(err: unknown): USBError {
  if (err instanceof USBError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('cancelled') || msg.includes('No device selected')) return new USBError('cancelled', msg);
  if (msg.includes('SecurityError')) return new USBError('security', msg);
  if (msg.includes('busy')) return new USBError('busy', msg);
  return new USBError('other', msg);
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new USBError('other', 'USB operation timed out')), ms)),
  ]);
}

export class Transport {
  private device: USBDevice | null = null;
  private inEndpoint = 0;
  private outEndpoint = 0;

  async connect(): Promise<string> {
    if (!isWebUSBSupported()) throw new USBError('not-supported', 'WebUSB is not available');

    const device = await navigator.usb.requestDevice({ filters: [{ vendorId: FUJI_VENDOR_ID }] });
    await device.open();

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const iface = device.configuration!.interfaces[0]!;
    await device.claimInterface(iface.interfaceNumber);

    for (const endpoint of iface.alternate.endpoints) {
      if (endpoint.type === 'bulk') {
        if (endpoint.direction === 'in') this.inEndpoint = endpoint.endpointNumber;
        if (endpoint.direction === 'out') this.outEndpoint = endpoint.endpointNumber;
      }
    }

    this.device = device;
    return device.productName ?? 'Unknown Camera';
  }

  async disconnect(): Promise<void> {
    if (!this.device) return;
    try {
      await this.device.releaseInterface(0);
      await this.device.close();
    } catch { /* ignore close errors */ }
    this.device = null;
  }

  isConnected(): boolean {
    return this.device !== null;
  }

  private async send(data: Uint8Array): Promise<void> {
    if (!this.device) throw new USBError('other', 'Not connected');
    for (let offset = 0; offset < data.byteLength; offset += CHUNK_SIZE) {
      const chunk = data.slice(offset, offset + CHUNK_SIZE);
      await withTimeout(this.device.transferOut(this.outEndpoint, chunk), TIMEOUT_MS);
    }
  }

  private async recv(): Promise<ArrayBuffer> {
    if (!this.device) throw new USBError('other', 'Not connected');
    const result = await withTimeout<USBInTransferResult>(
      this.device.transferIn(this.inEndpoint, 65536),
      TIMEOUT_MS,
    );
    if (!result.data) throw new USBError('other', 'Empty USB response');
    const dv = result.data;
    return dv.buffer.slice(dv.byteOffset, dv.byteOffset + dv.byteLength) as ArrayBuffer;
  }

  /** Send a command and receive the response container */
  async sendCommand(container: PTPContainerData): Promise<PTPContainerData> {
    try {
      await this.send(packContainer(container));
      const buf = await this.recv();
      return unpackContainer(buf);
    } catch (err) {
      throw mapUSBError(err);
    }
  }

  /** Send a command followed by a data phase, then receive the response */
  async sendDataCommand(command: PTPContainerData, data: Uint8Array): Promise<PTPContainerData> {
    try {
      await this.send(packContainer(command));

      const dataContainer: PTPContainerData = {
        type: PTP_TYPE.Data,
        code: command.code,
        transactionId: command.transactionId,
        params: [],
        data,
      };
      await this.send(packContainer(dataContainer));

      const buf = await this.recv();
      return unpackContainer(buf);
    } catch (err) {
      throw mapUSBError(err);
    }
  }

  /** Fire-and-forget close — safe to call on page unload */
  fireCloseSession(): void {
    if (!this.device) return;
    const container = packContainer({
      type: PTP_TYPE.Command,
      code: 0x1003, // CloseSession
      transactionId: 0,
      params: [],
    });
    void this.device.transferOut(this.outEndpoint, container.buffer as ArrayBuffer).catch(() => {});
  }
}
