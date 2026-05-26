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

export enum DynamicRange { Auto = 0, DR100 = 100, DR200 = 200, DR400 = 400 }

export enum DRangePriority { Off = 0, Auto = 1, Weak = 2, Strong = 3 }

export interface RecipeSettings {
  filmSimulation: FilmSimulation;
  grainEffect: GrainEffect;
  grainSize: GrainSize;
  colorChromeEffect: EffectLevel;
  colorChromeFxBlue: EffectLevel;
  whiteBalance: WhiteBalance;
  wbColorTemp?: number;
  wbShiftRed: number;
  wbShiftBlue: number;
  dynamicRange: DynamicRange;
  dRangePriority: DRangePriority;
  highlightTone: number;
  shadowTone: number;
  color: number;
  sharpness: number;
  noiseReduction: number;
  clarity: number;
  smoothSkin: EffectLevel;
  exposureBias: number;
}

export interface Recipe {
  id: string;
  name: string;
  scenario: Scenario;
  description?: string;
  tags: string[];
  samplePhotoPath?: string;
  createdAt: string;
  updatedAt: string;
  settings: RecipeSettings;
}

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
