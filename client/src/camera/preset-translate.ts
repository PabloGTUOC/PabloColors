// Ported from FilmKit src/profile/preset-translate.ts
// Handles bidirectional translation between camera wire values and UI values
// for preset properties D18E–D1A5 ONLY (not d185 625-byte profile)

import {
  FilmSimulation, GrainEffect, GrainSize, EffectLevel, WhiteBalance, DynamicRange, DRangePriority,
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

/// NR proprietary lookup: camera wire value → UI step (-4 to +4)
const NR_WIRE_TO_UI: Map<number, number> = new Map([
  [0x8000, -4],
  [0x7000, -3],
  [0x4000, -2],
  [0x3000, -1],
  [0x2000,  0],
  [0x1000,  1],
  [0x0000,  2],
  [0x6000,  3],
  [0x5000,  4],
]);

const NR_UI_TO_WIRE: Map<number, number> = new Map([
  [-4, 0x8000],
  [-3, 0x7000],
  [-2, 0x4000],
  [-1, 0x3000],
  [ 0, 0x2000],
  [ 1, 0x1000],
  [ 2, 0x0000],
  [ 3, 0x6000],
  [ 4, 0x5000],
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

// WB Shift: stored as signed 16-bit
function wbShiftFromWire(v: number): number {
  const signed = v > 0x7FFF ? v - 0x10000 : v;
  return signed;
}
function wbShiftToWire(v: number): number {
  return v & 0xFFFF;
}

/** Decode a map of prop ID → raw uint value (from GetDevicePropValue) into UI RecipeSettings */
export function translatePresetToUI(props: Map<number, number>): RecipeSettings {
  console.log('translatePresetToUI props:', Array.from(props.entries()).map(([k, v]) => `0xD${k.toString(16).slice(1).toUpperCase()}: 0x${v.toString(16).toUpperCase()} (${v})`));
  const filmSim = WIRE_TO_FILM_SIM.get(props.get(PROP.FilmSimulation) ?? 0x0001) ?? FilmSimulation.Provia;

  const grainRaw = props.get(PROP.GrainEffect) ?? 1; // Default to Off (1)
  let grainEffect = GrainEffect.Off;
  let grainSize = GrainSize.Small;
  if (grainRaw === 2) {
    grainEffect = GrainEffect.Weak;
    grainSize = GrainSize.Small;
  } else if (grainRaw === 3) {
    grainEffect = GrainEffect.Strong;
    grainSize = GrainSize.Small;
  } else if (grainRaw === 4) {
    grainEffect = GrainEffect.Weak;
    grainSize = GrainSize.Large;
  } else if (grainRaw === 5) {
    grainEffect = GrainEffect.Strong;
    grainSize = GrainSize.Large;
  }

  const wbRaw = props.get(PROP.WhiteBalance) ?? 0x0001;
  const wb = WIRE_TO_WB.get(wbRaw & 0xFFFF) ?? WhiteBalance.Auto;

  const drRaw = props.get(PROP.DynamicRange) ?? 100;
  const dr = ([0, 100, 200, 400].includes(drRaw) ? drRaw : 100) as DynamicRange;

  const drPrioRaw = props.get(PROP.DRangePriority) ?? 0;
  const drPrio = ([0, 1, 2, 3].includes(drPrioRaw) ? drPrioRaw : 0) as DRangePriority;

  return {
    filmSimulation: filmSim,
    grainEffect,
    grainSize,
    colorChromeEffect: effectFromWire(props.get(PROP.ColorChromeEffect) ?? 1),
    colorChromeFxBlue: effectFromWire(props.get(PROP.ColorChromeFxBlue) ?? 1),
    whiteBalance: wb,
    wbColorTemp: wb === WhiteBalance.ColorTemp ? props.get(PROP.WbColorTemp) : undefined,
    wbShiftRed: wbShiftFromWire(props.get(PROP.WbShiftRed) ?? 0),
    wbShiftBlue: wbShiftFromWire(props.get(PROP.WbShiftBlue) ?? 0),
    dynamicRange: dr,
    dRangePriority: drPrio,
    highlightTone: toneFromWire(props.get(PROP.HighlightTone) ?? 0),
    shadowTone: toneFromWire(props.get(PROP.ShadowTone) ?? 0),
    color: toneFromWire(props.get(PROP.Color) ?? 0),
    sharpness: toneFromWire(props.get(PROP.Sharpness) ?? 0),
    noiseReduction: NR_WIRE_TO_UI.get((props.get(PROP.NoiseReduction) ?? 0) & 0xFFFF) ?? 0,
    clarity: toneFromWire(props.get(PROP.Clarity) ?? 0),
    smoothSkin: effectFromWire(props.get(PROP.SmoothSkin) ?? 1),
    exposureBias: 0, // Not stored in custom preset slots
  };
}

/** Convert UI RecipeSettings into an ordered array of [propId, wireValue] pairs for SetDevicePropValue */
export function translateUIToPresetProps(settings: RecipeSettings): Array<[number, number]> {
  const isMonochrome = MONOCHROME_SIMS.has(settings.filmSimulation);

  // Grain: flat enum 1-5
  let grainWire = 1; // Off
  if (settings.grainEffect === GrainEffect.Weak) {
    grainWire = settings.grainSize === GrainSize.Large ? 4 : 2;
  } else if (settings.grainEffect === GrainEffect.Strong) {
    grainWire = settings.grainSize === GrainSize.Large ? 5 : 3;
  }

  const propMap = new Map<number, number>([
    [PROP.FilmSimulation,    FILM_SIM_WIRE[settings.filmSimulation]],
    [PROP.GrainEffect,       grainWire],
    [PROP.ColorChromeEffect, effectToWire(settings.colorChromeEffect)],
    [PROP.ColorChromeFxBlue, effectToWire(settings.colorChromeFxBlue)],
    [PROP.WhiteBalance,      WB_WIRE[settings.whiteBalance]],
    [PROP.WbShiftRed,        wbShiftToWire(settings.wbShiftRed)],
    [PROP.WbShiftBlue,       wbShiftToWire(settings.wbShiftBlue)],
    [PROP.DynamicRange,      settings.dynamicRange],
    [PROP.DRangePriority,    settings.dRangePriority],
    [PROP.HighlightTone,     toneToWire(settings.highlightTone)],
    [PROP.ShadowTone,        toneToWire(settings.shadowTone)],
    [PROP.Sharpness,         toneToWire(settings.sharpness)],
    [PROP.NoiseReduction,    NR_UI_TO_WIRE.get(settings.noiseReduction) ?? 0x2000],
    [PROP.Clarity,           toneToWire(settings.clarity)],
    [PROP.SmoothSkin,        effectToWire(settings.smoothSkin)],
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
