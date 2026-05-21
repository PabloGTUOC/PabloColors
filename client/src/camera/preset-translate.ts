// Ported from FilmKit src/profile/preset-translate.ts
// Handles bidirectional translation between camera wire values and UI values
// for preset properties D18E–D1A5 ONLY (not d185 625-byte profile)

import {
  FilmSimulation, GrainEffect, GrainSize, EffectLevel, WhiteBalance, DynamicRange,
  FILM_SIM_WIRE, WIRE_TO_FILM_SIM, WB_WIRE, WIRE_TO_WB, MONOCHROME_SIMS,
} from './enums';
import { PROP, PROP_WRITE_ORDER, SENTINEL_DEFAULT } from './constants';

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
  highlightTone: number;
  shadowTone: number;
  color: number;
  sharpness: number;
  noiseReduction: number;
  clarity: number;
  smoothSkin: EffectLevel;
  exposureBias: number;
}

// NR proprietary lookup: camera wire value → UI step (-4 to +4)
// Copied from FilmKit's NR_ENCODE / NR_DECODE tables
const NR_WIRE_TO_UI: Map<number, number> = new Map([
  [0x0000, 0], [0x0001, 1], [0x0002, 2], [0x0003, 3], [0x0004, 4],
  [0x8000, 0], [0x8001, -1], [0x8002, -2], [0x8003, -3], [0x8004, -4],
]);

const NR_UI_TO_WIRE: Map<number, number> = new Map([
  [4, 0x0004], [3, 0x0003], [2, 0x0002], [1, 0x0001], [0, 0x0000],
  [-1, 0x8001], [-2, 0x8002], [-3, 0x8003], [-4, 0x8004],
]);

// Effects: wire is 1-indexed (1=Off, 2=Weak, 3=Strong); UI is 0-indexed (0=Off, 1=Weak, 2=Strong)
function effectFromWire(v: number): EffectLevel {
  return Math.max(0, v - 1) as EffectLevel;
}
function effectToWire(v: EffectLevel): number {
  return v + 1;
}

// Tone: wire is ×10; 0x8000 sentinel means "use camera default" (preserve, do not write as 0)
function toneFromWire(v: number): number {
  if (v === SENTINEL_DEFAULT) return 0; // display 0 if camera default
  // interpret as signed 16-bit
  const signed = v > 0x7FFF ? v - 0x10000 : v;
  return signed / 10;
}
function toneToWire(v: number): number {
  return Math.round(v * 10) & 0xFFFF;
}

// Exposure bias: ×10 encoding, stored as signed 16-bit
function exposureFromWire(v: number): number {
  const signed = v > 0x7FFF ? v - 0x10000 : v;
  return signed / 10;
}
function exposureToWire(v: number): number {
  return Math.round(v * 10) & 0xFFFF;
}

/** Decode a map of prop ID → raw uint value (from GetDevicePropValue) into UI RecipeSettings */
export function translatePresetToUI(props: Map<number, number>): RecipeSettings {
  const filmSim = WIRE_TO_FILM_SIM.get(props.get(PROP.FilmSimulation) ?? 0x0001) ?? FilmSimulation.Provia;

  const grainRaw = props.get(PROP.GrainEffect) ?? 0;
  const grainStrengthWire = (grainRaw >> 8) & 0xFF;
  const grainSizeWire = grainRaw & 0xFF;

  const wbRaw = props.get(PROP.WhiteBalance) ?? 0x0001;
  const wb = WIRE_TO_WB.get(wbRaw & 0xFFFF) ?? WhiteBalance.Auto;

  const drRaw = props.get(PROP.DynamicRange) ?? 100;
  const dr = ([100, 200, 400].includes(drRaw) ? drRaw : 100) as DynamicRange;

  return {
    filmSimulation: filmSim,
    grainEffect: Math.max(0, grainStrengthWire - 1) as GrainEffect,
    grainSize: (grainSizeWire === 1 ? GrainSize.Large : GrainSize.Small),
    colorChromeEffect: effectFromWire(props.get(PROP.ColorChromeEffect) ?? 1),
    colorChromeFxBlue: effectFromWire(props.get(PROP.ColorChromeFxBlue) ?? 1),
    whiteBalance: wb,
    wbColorTemp: wb === WhiteBalance.ColorTemp ? props.get(PROP.WbColorTemp) : undefined,
    wbShiftRed: props.get(PROP.WbShiftRed) ?? 0,
    wbShiftBlue: props.get(PROP.WbShiftBlue) ?? 0,
    dynamicRange: dr,
    highlightTone: toneFromWire(props.get(PROP.HighlightTone) ?? 0),
    shadowTone: toneFromWire(props.get(PROP.ShadowTone) ?? 0),
    color: toneFromWire(props.get(PROP.Color) ?? 0),
    sharpness: toneFromWire(props.get(PROP.Sharpness) ?? 0),
    noiseReduction: NR_WIRE_TO_UI.get(props.get(PROP.NoiseReduction) ?? 0) ?? 0,
    clarity: toneFromWire(props.get(PROP.Clarity) ?? 0),
    smoothSkin: effectFromWire(props.get(PROP.SmoothSkin) ?? 1),
    exposureBias: exposureFromWire(props.get(PROP.ExposureBias) ?? 0),
  };
}

/** Convert UI RecipeSettings into an ordered array of [propId, wireValue] pairs for SetDevicePropValue */
export function translateUIToPresetProps(settings: RecipeSettings): Array<[number, number]> {
  const isMonochrome = MONOCHROME_SIMS.has(settings.filmSimulation);

  // Grain: high byte = strength (1-indexed), low byte = size (0=Small, 1=Large)
  const grainStrengthWire = settings.grainEffect + 1;
  const grainSizeWire = settings.grainSize === GrainSize.Large ? 1 : 0;
  const grainWire = (grainStrengthWire << 8) | grainSizeWire;

  const propMap = new Map<number, number>([
    [PROP.FilmSimulation,    FILM_SIM_WIRE[settings.filmSimulation]],
    [PROP.GrainEffect,       grainWire],
    [PROP.ColorChromeEffect, effectToWire(settings.colorChromeEffect)],
    [PROP.ColorChromeFxBlue, effectToWire(settings.colorChromeFxBlue)],
    [PROP.WhiteBalance,      WB_WIRE[settings.whiteBalance]],
    [PROP.WbShiftRed,        settings.wbShiftRed],
    [PROP.WbShiftBlue,       settings.wbShiftBlue],
    [PROP.DynamicRange,      settings.dynamicRange],
    [PROP.HighlightTone,     toneToWire(settings.highlightTone)],
    [PROP.ShadowTone,        toneToWire(settings.shadowTone)],
    [PROP.Sharpness,         toneToWire(settings.sharpness)],
    [PROP.NoiseReduction,    NR_UI_TO_WIRE.get(settings.noiseReduction) ?? 0],
    [PROP.Clarity,           toneToWire(settings.clarity)],
    [PROP.SmoothSkin,        effectToWire(settings.smoothSkin)],
    [PROP.ExposureBias,      exposureToWire(settings.exposureBias)],
  ]);

  // Color temp only settable when WB mode is already ColorTemp
  if (settings.whiteBalance === WhiteBalance.ColorTemp && settings.wbColorTemp != null) {
    propMap.set(PROP.WbColorTemp, settings.wbColorTemp);
  }

  // Monochrome sims: reject Color, ColorChrome, ColorChromeFxBlue writes
  if (!isMonochrome) {
    propMap.set(PROP.Color, toneToWire(settings.color));
  }

  // Return in FilmKit-mandated write order
  const result: Array<[number, number]> = [];
  for (const propId of PROP_WRITE_ORDER) {
    const val = propMap.get(propId);
    if (val !== undefined) result.push([propId, val]);
  }
  return result;
}
