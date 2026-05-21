// Ported from FilmKit src/ptp/container.ts
// Mirrors fuji_usb.py container packing

import { PTP_TYPE } from './constants';

export interface PTPContainerData {
  type: number;
  code: number;
  transactionId: number;
  params: number[];
  data?: Uint8Array;
}

/** Reads the total length from the first 4 bytes of a PTP response */
export function containerLength(buf: ArrayBuffer): number {
  return new DataView(buf).getUint32(0, true);
}

/** Packs a PTP command or data container into a Uint8Array */
export function packContainer(container: PTPContainerData): Uint8Array {
  const headerLen = 12;

  if (container.data) {
    // Data container: 12-byte header + payload
    const total = headerLen + container.data.byteLength;
    const buf = new ArrayBuffer(total);
    const view = new DataView(buf);
    view.setUint32(0, total, true);
    view.setUint16(4, container.type, true);
    view.setUint16(6, container.code, true);
    view.setUint32(8, container.transactionId, true);
    new Uint8Array(buf).set(container.data, 12);
    return new Uint8Array(buf);
  } else {
    // Command container: 12-byte header + up to 5 × uint32 params
    const paramBytes = container.params.length * 4;
    const total = headerLen + paramBytes;
    const buf = new ArrayBuffer(total);
    const view = new DataView(buf);
    view.setUint32(0, total, true);
    view.setUint16(4, container.type, true);
    view.setUint16(6, container.code, true);
    view.setUint32(8, container.transactionId, true);
    for (let i = 0; i < container.params.length; i++) {
      view.setUint32(12 + i * 4, container.params[i]!, true);
    }
    return new Uint8Array(buf);
  }
}

/** Parses a PTP response buffer */
export function unpackContainer(buf: ArrayBuffer): PTPContainerData {
  const view = new DataView(buf);
  const totalLength = view.getUint32(0, true);
  const type = view.getUint16(4, true);
  const code = view.getUint16(6, true);
  const transactionId = view.getUint32(8, true);

  if (type === PTP_TYPE.Data) {
    // DATA containers: everything after header is payload
    const data = new Uint8Array(buf, 12, totalLength - 12);
    return { type, code, transactionId, params: [], data };
  } else {
    // RESPONSE containers: up to 5 uint32 params after header
    const params: number[] = [];
    const paramCount = Math.min((totalLength - 12) / 4, 5);
    for (let i = 0; i < paramCount; i++) {
      params.push(view.getUint32(12 + i * 4, true));
    }
    return { type, code, transactionId, params };
  }
}
