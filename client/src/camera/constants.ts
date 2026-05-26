// Ported from FilmKit src/ptp/constants.ts
// All encodings confirmed via Wireshark USB captures on X100VI

// Standard PTP operations
export const PTP_OP = {
  GetDeviceInfo:      0x1001,
  OpenSession:        0x1002,
  CloseSession:       0x1003,
  GetDevicePropDesc:  0x1014,
  GetDevicePropValue: 0x1015,
  SetDevicePropValue: 0x1016,
} as const;

// Fujifilm vendor extensions (RAW conversion — not used in MVP)
export const FUJI_OP = {
  SendObjectInfo: 0x900C,
  SendObject:     0x900D,
} as const;

// PTP response codes
export const PTP_RC = {
  OK:                    0x2001,
  SessionAlreadyOpen:    0x201E,
  SessionNotOpen:        0x2003,
  OperationNotSupported: 0x2005,
  DevicePropNotSupported:0x200A,
} as const;

// PTP container types
export const PTP_TYPE = {
  Command:  0x0001,
  Data:     0x0002,
  Response: 0x0003,
} as const;

// Fujifilm X100VI device properties
// Preset slot selector & name
export const PROP_SLOT_SELECT = 0xD18C;  // write 1–7 to switch active slot
export const PROP_SLOT_NAME   = 0xD18D;  // PTP string — preset name

// Recipe properties (D18E–D1A5)
// IMPORTANT: These encodings differ from the d185 625-byte profile format
export const PROP = {
  DynamicRange:        0xD190,
  DRangePriority:      0xD191,
  FilmSimulation:      0xD192,
  GrainEffect:         0xD195,
  ColorChromeEffect:   0xD196,
  ColorChromeFxBlue:   0xD197,
  SmoothSkin:          0xD198,
  WhiteBalance:        0xD199,
  WbShiftRed:          0xD19A,
  WbShiftBlue:         0xD19B,
  WbColorTemp:         0xD19C,
  HighlightTone:       0xD19D,
  ShadowTone:          0xD19E,
  Color:               0xD19F,
  Sharpness:           0xD1A0,
  NoiseReduction:      0xD1A1,
  Clarity:             0xD1A2,
} as const;

// Ordered list for slot writes — order matters per FilmKit
export const PROP_WRITE_ORDER = [
  PROP.DynamicRange,
  PROP.DRangePriority,
  PROP.FilmSimulation,
  PROP.GrainEffect,
  PROP.ColorChromeEffect,
  PROP.ColorChromeFxBlue,
  PROP.SmoothSkin,
  PROP.WhiteBalance,
  PROP.WbColorTemp,
  PROP.WbShiftRed,
  PROP.WbShiftBlue,
  PROP.HighlightTone,
  PROP.ShadowTone,
  PROP.Color,
  PROP.Sharpness,
  PROP.NoiseReduction,
  PROP.Clarity,
] as const;

// Sentinel value meaning "use camera default" for tone-type properties
export const SENTINEL_DEFAULT = 0x8000;

// Fujifilm vendor ID for requestDevice filter
export const FUJI_VENDOR_ID = 0x04CB;
