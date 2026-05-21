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
  [FilmSimulation.Provia]:            0x0001,
  [FilmSimulation.Velvia]:            0x0002,
  [FilmSimulation.Astia]:             0x0003,
  [FilmSimulation.ClassicChrome]:     0x0010,
  [FilmSimulation.Reala]:             0x0022,
  [FilmSimulation.ProNegHi]:          0x0013,
  [FilmSimulation.ProNegStd]:         0x0012,
  [FilmSimulation.ClassicNeg]:        0x0023,
  [FilmSimulation.Nostalgic]:         0x0026,
  [FilmSimulation.Eterna]:            0x0020,
  [FilmSimulation.EternaBleachBypass]:0x0021,
  [FilmSimulation.AcrossYe]:          0x0201,
  [FilmSimulation.AcrossR]:           0x0202,
  [FilmSimulation.AcrossG]:           0x0203,
  [FilmSimulation.Acros]:             0x0200,
  [FilmSimulation.Monochrome]:        0x0300,
  [FilmSimulation.MonochromeYe]:      0x0301,
  [FilmSimulation.MonochromeR]:       0x0302,
  [FilmSimulation.MonochromeG]:       0x0303,
  [FilmSimulation.Sepia]:             0x0004,
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
  FluorescentD = 'FL_D',
  FluorescentN = 'FL_N',
  FluorescentW = 'FL_W',
  FluorescentWW = 'FL_WW',
  Incandescent = 'INCANDESCENT',
  Underwater = 'UNDERWATER',
  ColorTemp = 'COLOR_TEMP',
  Custom1 = 'CUSTOM1',
  Custom2 = 'CUSTOM2',
  Custom3 = 'CUSTOM3',
}

// Wire values for WB (read as int16, masked to 0xFFFF for lookup)
export const WB_WIRE: Record<WhiteBalance, number> = {
  [WhiteBalance.Auto]:        0x0001,
  [WhiteBalance.AutoWhite]:   0x0010,
  [WhiteBalance.AutoAmbient]: 0x0011,
  [WhiteBalance.Daylight]:    0x0002,
  [WhiteBalance.Shade]:       0x0008,
  [WhiteBalance.FluorescentD]:0x0003,
  [WhiteBalance.FluorescentN]:0x0004,
  [WhiteBalance.FluorescentW]:0x0005,
  [WhiteBalance.FluorescentWW]:0x0006,
  [WhiteBalance.Incandescent]:0x0007,
  [WhiteBalance.Underwater]:  0x000B,
  [WhiteBalance.ColorTemp]:   0x000F,
  [WhiteBalance.Custom1]:     0x0100,
  [WhiteBalance.Custom2]:     0x0200,
  [WhiteBalance.Custom3]:     0x0300,
};

export const WIRE_TO_WB: Map<number, WhiteBalance> = new Map(
  Object.entries(WB_WIRE).map(([k, v]) => [v, k as WhiteBalance])
);

export enum DynamicRange { DR100 = 100, DR200 = 200, DR400 = 400 }

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
