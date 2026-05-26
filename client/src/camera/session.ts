// Ported from FilmKit src/ptp/session.ts
// Serialized command queue prevents concurrent USB conflicts

import { Transport, USBError } from './transport';
import { PTP_TYPE, PTP_OP, PTP_RC, PROP_SLOT_SELECT, PROP_SLOT_NAME, PROP, PROP_WRITE_ORDER } from './constants';
import type { PTPContainerData } from './container';
import { translatePresetToUI, translateUIToPresetProps } from './preset-translate';
import type { RecipeSettings } from './preset-translate';

export interface SlotInfo {
  slot: number;
  name: string;
  settings?: RecipeSettings;
}

export class WriteWarning {
  constructor(public propId: number, public message: string) {}
}

export class CameraSession {
  private transport = new Transport();
  private txId = 1;
  private queue: Array<() => Promise<void>> = [];
  private running = false;
  private sessionOpen = false;

  private nextTx(): number {
    return this.txId++;
  }

  /** Enqueue an operation — only one runs at a time */
  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try { resolve(await fn()); }
        catch (err) { reject(err); }
      });
      if (!this.running) void this.drain();
    });
  }

  private async drain(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const fn = this.queue.shift()!;
      await fn();
    }
    this.running = false;
  }

  private cmd(code: number, params: number[] = []): PTPContainerData {
    return { type: PTP_TYPE.Command, code, transactionId: this.nextTx(), params };
  }

  private async openSession(): Promise<void> {
    if (this.sessionOpen) return;
    const resp = await this.transport.sendCommand(this.cmd(PTP_OP.OpenSession, [1]));
    if (resp.code !== PTP_RC.OK && resp.code !== PTP_RC.SessionAlreadyOpen) {
      // Stale session recovery: close, reset, retry
      await this.transport.sendCommand(this.cmd(PTP_OP.CloseSession));
      await this.transport.sendCommand(this.cmd(PTP_OP.OpenSession, [1]));
    }
    this.sessionOpen = true;
  }

  /** Connect the USB device and open a PTP session */
  async connect(): Promise<string> {
    return this.enqueue(async () => {
      const modelName = await this.transport.connect();
      await this.openSession();
      return modelName;
    });
  }

  /** Disconnect and close the PTP session */
  async disconnect(): Promise<void> {
    return this.enqueue(async () => {
      if (this.sessionOpen) {
        this.transport.fireCloseSession();
        this.sessionOpen = false;
      }
      await this.transport.disconnect();
    });
  }

  isConnected(): boolean {
    return this.transport.isConnected();
  }

  /** Decode raw prop bytes by length heuristic — PTP string, uint32, uint16, or hex */
  private decodePropValue(data: Uint8Array): number | string {
    if (data.length === 0) return 0;
    if (data.length === 1 && data[0] === 0) return '';

    // PTP string: first byte is character count (including null terminator), then UTF-16LE chars
    const charCount = data[0]!;
    if (charCount > 0 && data.length >= 1 + charCount * 2) {
      let str = '';
      for (let i = 0; i < charCount - 1; i++) {
        const view = new DataView(data.buffer, data.byteOffset + 1 + i * 2, 2);
        str += String.fromCharCode(view.getUint16(0, true));
      }
      return str;
    }

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (data.length === 4) return view.getUint32(0, true);
    if (data.length === 2) return view.getUint16(0, true);
    if (data.length === 1) return data[0]!;
    return 0;
  }

  private async getPropRaw(propId: number): Promise<Uint8Array> {
    const resp = await this.transport.sendCommand(this.cmd(PTP_OP.GetDevicePropValue, [propId]));
    return resp.data ?? new Uint8Array(0);
  }

  private async getPropNum(propId: number): Promise<number> {
    const data = await this.getPropRaw(propId);
    const val = this.decodePropValue(data);
    return typeof val === 'number' ? val : 0;
  }

  private async getPropString(propId: number): Promise<string> {
    const data = await this.getPropRaw(propId);
    if (data.length === 0) return '';
    if (data.length === 1 && data[0] === 0) return '';
    const val = this.decodePropValue(data);
    return typeof val === 'string' ? val : '';
  }

  private async setPropNum(propId: number, value: number, byteSize: 2 | 4 = 2): Promise<boolean> {
    const buf = new ArrayBuffer(byteSize);
    const view = new DataView(buf);
    if (byteSize === 4) view.setUint32(0, value, true);
    else view.setUint16(0, value, true);

    try {
      const resp = await this.transport.sendDataCommand(
        this.cmd(PTP_OP.SetDevicePropValue, [propId]),
        new Uint8Array(buf),
      );
      return resp.code === PTP_RC.OK;
    } catch {
      return false; // non-fatal
    }
  }

  private async setPropString(propId: number, value: string): Promise<boolean> {
    // PTP string: uint8 charCount (including null), then UTF-16LE chars, then null terminator
    const chars = [...value, '\0'];
    const buf = new ArrayBuffer(1 + chars.length * 2);
    const view = new DataView(buf);
    view.setUint8(0, chars.length);
    for (let i = 0; i < chars.length; i++) {
      view.setUint16(1 + i * 2, chars[i]!.charCodeAt(0), true);
    }

    try {
      const resp = await this.transport.sendDataCommand(
        this.cmd(PTP_OP.SetDevicePropValue, [propId]),
        new Uint8Array(buf),
      );
      return resp.code === PTP_RC.OK;
    } catch {
      return false;
    }
  }

  /** Read all 7 slots and return their names + settings */
  readAllSlots(): Promise<SlotInfo[]> {
    return this.enqueue(async () => {
      const slots: SlotInfo[] = [];

      for (let slot = 1; slot <= 7; slot++) {
        await this.setPropNum(PROP_SLOT_SELECT, slot);
        await new Promise(r => setTimeout(r, 100)); // Allow camera state to settle
        const name = await this.getPropString(PROP_SLOT_NAME);

        const props = new Map<number, number>();
        for (const propId of PROP_WRITE_ORDER) {
          props.set(propId, await this.getPropNum(propId));
        }

        slots.push({ slot, name, settings: translatePresetToUI(props) });
      }

      return slots;
    });
  }

  /** Read a single slot */
  readSlot(slot: number): Promise<SlotInfo> {
    return this.enqueue(async () => {
      await this.setPropNum(PROP_SLOT_SELECT, slot);
      await new Promise(r => setTimeout(r, 100)); // Allow camera state to settle
      const name = await this.getPropString(PROP_SLOT_NAME);

      const props = new Map<number, number>();
      for (const propId of PROP_WRITE_ORDER) {
        props.set(propId, await this.getPropNum(propId));
      }

      return { slot, name, settings: translatePresetToUI(props) };
    });
  }

  /** Write a recipe to a slot — non-fatal prop failures become WriteWarnings */
  writeSlot(slot: number, name: string, settings: RecipeSettings): Promise<WriteWarning[]> {
    return this.enqueue(async () => {
      const warnings: WriteWarning[] = [];

      await this.setPropNum(PROP_SLOT_SELECT, slot);
      await new Promise(r => setTimeout(r, 100)); // Allow camera state to settle

      const nameOk = await this.setPropString(PROP_SLOT_NAME, name);
      if (!nameOk) warnings.push(new WriteWarning(PROP_SLOT_NAME, 'Failed to write slot name'));

      for (const [propId, value] of translateUIToPresetProps(settings)) {
        const ok = await this.setPropNum(propId, value);
        if (!ok) {
          warnings.push(new WriteWarning(propId, `Failed to write prop 0x${propId.toString(16).toUpperCase()}`));
        }
        await new Promise(r => setTimeout(r, 30)); // 30ms inter-write delay to allow camera state to settle
      }

      return warnings;
    });
  }
}

export const cameraSession = new CameraSession();
