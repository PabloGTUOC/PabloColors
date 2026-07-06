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
  if (msg.includes('busy') || msg.includes('claimInterface') || msg.includes('claim')) return new USBError('busy', msg);
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
  private claimedInterface = 0;
  private inEndpoint = 0;
  private outEndpoint = 0;
  private rxBuffer = new Uint8Array(0);

  async connect(): Promise<string> {
    if (!isWebUSBSupported()) throw new USBError('not-supported', 'WebUSB is not available');

    const device = await navigator.usb.requestDevice({ filters: [{ vendorId: FUJI_VENDOR_ID }] });
    await device.open();

    // Always select configuration — required after a stale session or first connect
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const iface = device.configuration!.interfaces[0]!;

    try {
      await device.claimInterface(iface.interfaceNumber);
    } catch (err) {
      await device.close();
      const msg = err instanceof Error ? err.message : String(err);
      // On macOS the PTP kernel driver auto-claims the interface when the camera connects.
      // The user must quit Image Capture / Photos and set the camera to PC Connection mode.
      throw new USBError(
        'busy',
        'Unable to claim the camera interface. ' +
        'On Mac: quit Image Capture and Photos, then reconnect the camera. ' +
        'On the camera: set USB mode to "USB RAW Conv./Remote Control" (PC Connection).',
      );
    }

    this.claimedInterface = iface.interfaceNumber;

    for (const endpoint of iface.alternate.endpoints) {
      if (endpoint.type === 'bulk') {
        if (endpoint.direction === 'in') this.inEndpoint = endpoint.endpointNumber;
        if (endpoint.direction === 'out') this.outEndpoint = endpoint.endpointNumber;
      }
    }

    this.device = device;
    this.rxBuffer = new Uint8Array(0);
    return device.productName ?? 'Unknown Camera';
  }

  async disconnect(): Promise<void> {
    this.rxBuffer = new Uint8Array(0);
    if (!this.device) return;
    try {
      await this.device.releaseInterface(this.claimedInterface);
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

  private async recvChunk(): Promise<Uint8Array> {
    if (!this.device) throw new USBError('other', 'Not connected');
    const result = await withTimeout<USBInTransferResult>(
      this.device.transferIn(this.inEndpoint, 65536),
      TIMEOUT_MS,
    );
    if (!result.data) throw new USBError('other', 'Empty USB response');
    const dv = result.data;
    return new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
  }

  private appendRxBuffer(chunk: Uint8Array) {
    const newBuf = new Uint8Array(this.rxBuffer.byteLength + chunk.byteLength);
    newBuf.set(this.rxBuffer, 0);
    newBuf.set(chunk, this.rxBuffer.byteLength);
    this.rxBuffer = newBuf;
  }

  private async readNextContainer(): Promise<PTPContainerData> {
    // Ensure we have at least the header (12 bytes)
    while (this.rxBuffer.byteLength < 12) {
      const chunk = await this.recvChunk();
      this.appendRxBuffer(chunk);
    }

    const view = new DataView(this.rxBuffer.buffer, this.rxBuffer.byteOffset, this.rxBuffer.byteLength);
    const totalLength = view.getUint32(0, true);

    // Ensure we have the full container
    while (this.rxBuffer.byteLength < totalLength) {
      const chunk = await this.recvChunk();
      this.appendRxBuffer(chunk);
    }

    // Slice out the container data
    const containerBuf = this.rxBuffer.buffer.slice(
      this.rxBuffer.byteOffset,
      this.rxBuffer.byteOffset + totalLength
    );

    // Consume from rxBuffer
    this.rxBuffer = this.rxBuffer.subarray(totalLength);

    return unpackContainer(containerBuf);
  }

  /** Send a command and receive the response container */
  async sendCommand(container: PTPContainerData): Promise<PTPContainerData> {
    try {
      await this.send(packContainer(container));
      const first = await this.readNextContainer();
      if (first.type === PTP_TYPE.Data) {
        // Data-In transaction: read the subsequent Response container
        const resp = await this.readNextContainer();
        first.code = resp.code;
        first.params = resp.params;
      }
      return first;
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

      return await this.readNextContainer();
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
