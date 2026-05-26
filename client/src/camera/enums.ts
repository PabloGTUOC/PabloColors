// Ported from FilmKit src/profile/enums.ts

export enum FilmSimulation {
  Provia = 'PROVIA',
  Velvia = 'VELVIA',
  Astia = 'ASTIA',
  ClassicChrome = 'CLASSIC_CHROME',
  Reala = 'REALA',
  ProNegHi = 'PRO_NEG_HI',
  ProNegStd = 'PRO_NEG_STD',
  ClassicNeg = 'CLASSIC_NEG',
  Nostalgic = 'NOSTALGIC_NEG',
  Eterna = 'ETERNA',
  EternaBleachBypass = 'ETERNA_BLEACH_BYPASS',
  AcrossYe = 'ACROS_YE',
  AcrossR = 'ACROS_R',
  AcrossG = 'ACROS_G',
  Acros = 'ACROS',
  Monochrome = 'MONOCHROME',
  MonochromeYe = 'MONOCHROME_YE',
  MonochromeR = 'MONOCHROME_R',
  MonochromeG = 'MONOCHROME_G',
  Sepia = 'SEPIA',
}

// Wire values for film simulations (confirmed X100VI via Wireshark)
export const FILM_SIM_WIRE: Record<FilmSimulation, number> = {
  [FilmSimulation.Provia]: 0x01,
  [FilmSimulation.Velvia]: 0x02,
  [FilmSimulation.Astia]: 0x03,
  [FilmSimulation.ClassicChrome]: 0x0B,
  [FilmSimulation.Reala]: 0x14,
  [FilmSimulation.ProNegHi]: 0x04,
  [FilmSimulation.ProNegStd]: 0x05,
  [FilmSimulation.ClassicNeg]: 0x11,
  [FilmSimulation.Nostalgic]: 0x13,
  [FilmSimulation.Eterna]: 0x10,
  [FilmSimulation.EternaBleachBypass]: 0x12,
  [FilmSimulation.AcrossYe]: 0x0D,
  [FilmSimulation.AcrossR]: 0x0E,
  [FilmSimulation.AcrossG]: 0x0F,
  [FilmSimulation.Acros]: 0x0C,
  [FilmSimulation.Monochrome]: 0x06,
  [FilmSimulation.MonochromeYe]: 0x07,
  [FilmSimulation.MonochromeR]: 0x08,
  [FilmSimulation.MonochromeG]: 0x09,
  [FilmSimulation.Sepia]: 0x0A,
};

export const WIRE_TO_FILM_SIM: Map<number, FilmSimulation> = new Map(
  Object.entries(FILM_SIM_WIRE).map(([k, v]) => [v, k as FilmSimulation])
);

export const MONOCHROME_SIMS = new Set([
  FilmSimulation.AcrossYe,
  FilmSimulation.AcrossR,
  FilmSimulation.AcrossG,
  FilmSimulation.Acros,
  FilmSimulation.Monochrome,
  FilmSimulation.MonochromeYe,
  FilmSimulation.MonochromeR,
  FilmSimulation.MonochromeG,
  FilmSimulation.Sepia,
]);

export enum GrainEffect { Off = 0, Weak = 1, Strong = 2 }
export enum GrainSize { Small = 0, Large = 1 }
export enum EffectLevel { Off = 0, Weak = 1, Strong = 2 }

export enum WhiteBalance {
  Auto = 'AUTO',
  AutoWhite = 'AUTO_WHITE',
  AutoAmbient = 'AUTO_AMBIENT',
  Daylight = 'DAYLIGHT',
  Shade = 'SHADE',
  Fluorescent1 = 'FL1',
  Fluorescent2 = 'FL2',
  Fluorescent3 = 'FL3',
  Incandescent = 'INCANDESCENT',
  Underwater = 'UNDERWATER',
  ColorTemp = 'COLOR_TEMP',
  Custom1 = 'CUSTOM1',
  Custom2 = 'CUSTOM2',
  Custom3 = 'CUSTOM3',
}

// Wire values for WB (read as int16, masked to 0xFFFF for lookup)
export const WB_WIRE: Record<WhiteBalance, number> = {
  [WhiteBalance.Auto]: 0x0002,
  [WhiteBalance.AutoWhite]: 0x8020,
  [WhiteBalance.AutoAmbient]: 0x8021,
  [WhiteBalance.Daylight]: 0x0004,
  [WhiteBalance.Shade]: 0x8006,
  [WhiteBalance.Fluorescent1]: 0x8001,
  [WhiteBalance.Fluorescent2]: 0x8002,
  [WhiteBalance.Fluorescent3]: 0x8003,
  [WhiteBalance.Incandescent]: 0x0006,
  [WhiteBalance.Underwater]: 0x0008,
  [WhiteBalance.ColorTemp]: 0x8007,
  [WhiteBalance.Custom1]: 0x800C,  // placeholder — to be verified via diagnostic query
  [WhiteBalance.Custom2]: 0x800D,  // placeholder — to be verified via diagnostic query
  [WhiteBalance.Custom3]: 0x800E,  // placeholder — to be verified via diagnostic query
};

export const WIRE_TO_WB = new Map<number, WhiteBalance>([
  [0x0002, WhiteBalance.Auto],
  [0x8020, WhiteBalance.AutoWhite],
  [0x8021, WhiteBalance.AutoAmbient],
  [0x0004, WhiteBalance.Daylight],
  [0x8006, WhiteBalance.Shade],
  [0x8001, WhiteBalance.Fluorescent1],
  [0x8002, WhiteBalance.Fluorescent2],
  [0x8003, WhiteBalance.Fluorescent3],
  [0x0006, WhiteBalance.Incandescent],
  [0x0008, WhiteBalance.Underwater],
  [0x8007, WhiteBalance.ColorTemp],
  [0x800C, WhiteBalance.Custom1],
  [0x800D, WhiteBalance.Custom2],
  [0x800E, WhiteBalance.Custom3],
]);

export enum DynamicRange { Auto = 0, DR100 = 100, DR200 = 200, DR400 = 400 }

export enum DRangePriority { Off = 0, Auto = 1, Weak = 2, Strong = 3 }


export enum Scenario {
  Portrait = 'portrait',
  Family = 'family',
  Street = 'street',
  Travel = 'travel',
  Nature = 'nature',
  Indoors = 'indoors',
  LowLight = 'low_light',
  BlackAndWhite = 'black_and_white',
  Other = 'other',
}
