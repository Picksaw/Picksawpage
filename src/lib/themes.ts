/**
 * themes.ts — the atmosphere system.
 *
 * The site ships as a night thunderstorm ("storm"), and the visitor can
 * retime the whole world to sunrise or sunset, each with clear or cloudy
 * weather. A single ThemeParams object drives EVERY surface that paints
 * the atmosphere:
 *
 *   • the 2D storm canvas (sky gradient, sun, clouds, rain, lightning)
 *   • the WebGL city (fog, lights, building + window colors, street lamps)
 *   • the wet-road shader (puddles dry up, lane lines change colour)
 *   • the ground mist (cool blue ↔ warm gold volumes)
 *   • the DOM UI accent (CSS `--accent` / `--page-bg` variables)
 *
 * Consumers keep a *live, eased* copy (createLiveTheme / easeTheme) and
 * lerp toward the selected theme every frame, so switching themes plays
 * as a smooth cinematic transition instead of a hard cut.
 */

import type { ThemeId } from "./themeStore";

export type { ThemeId };

/** rgb triplet, 0–255 */
export type V3 = [number, number, number];

export interface SunParams {
  /** screen position as fractions of the viewport */
  x: number;
  y: number;
  /** disc radius in px, normalised to an 860px-tall viewport */
  r: number;
  core: V3;
  edge: V3;
  glow: V3;
  discAlpha: number;
  glowAlpha: number;
  /** glow extent as a multiple of the disc radius */
  glowR: number;
}

export interface ThemeParams {
  id: ThemeId;

  // ── 2D sky canvas ──────────────────────────────────────────────
  skyTop: V3;
  skyMid: V3;
  skyBottom: V3;
  /** sky at peak scroll-driven storm intensity (storm theme only) */
  skyTopActive: V3;
  skyMidActive: V3;
  cloudTint: V3;
  /** multiplier on every cloud puff's alpha */
  cloudAlpha: number;
  /** 0..1 — how many extra cloud puffs join the cover */
  cloudCover: number;
  cloudSpeed: number;
  sun: SunParams | null;
  /** warm haze around the sun / horizon, 0..1 */
  haze: number;
  /** 0..1 — rain streaks, splashes and ripples */
  rain: number;
  rainColor: V3;
  /** 1 = lightning strikes are allowed */
  lightning: number;
  flashColor: V3;
  /** 0..1 strength of the edge vignette */
  vignette: number;

  // ── WebGL environment ──────────────────────────────────────────
  fog: V3;
  fogNear: number;
  fogFar: number;
  exposure: number;
  ambient: V3;
  ambientI: number;
  sunLight: V3;
  sunI: number;
  sunPos: V3;
  /** cyan/blue accent point lights in the street */
  fill1: V3;
  fill1I: number;
  fill2: V3;
  fill2I: number;
  /** moving street lamps */
  street: V3;
  streetI: number;
  /** 0 = keep the storm's multi-colour lamps, 1 = unify on `street` */
  streetTint: number;

  // ── city materials ─────────────────────────────────────────────
  /** how far every building is darkened toward `buildingShadow` */
  buildingDarkMix: number;
  buildingShadow: V3;
  /** multiplier on the night-time window glow */
  windowEmissive: number;
  /** 0 = storm cyan glow … 1 = warm daylight/dusk tint */
  warmth: number;
  warmGlow: V3;
  /** the foundation blocks under each building */
  concrete: V3;

  // ── road shader ────────────────────────────────────────────────
  roadRain: number;
  roadBright: number;
  roadTint: V3;
  roadLine: V3;
  roadLineMix: number;

  // ── ground mist ────────────────────────────────────────────────
  mist: V3;
  mistGlow: V3;
  mistAmount: number;

  // ── DOM / CSS ──────────────────────────────────────────────────
  accent: V3;
  accentSoft: V3;
  pageBg: V3;
  /** legibility scrim between the sky canvas and the page content */
  scrim: number;

  // ── holographic surfaces (3D logo + ghost card) ───────────────
  /** deep tone of the holo P / foil ramp */
  holoDeep: V3;
  /** bright tone of the holo P (smoke highlights, orb, foil peak) */
  holoBright: V3;
}

export const THEMES: Record<ThemeId, ThemeParams> = {
  // ══════════════════════════════════════════════════════════════
  //  STORM — the original night: thunder, rain, neon cyan
  // ══════════════════════════════════════════════════════════════
  storm: {
    id: "storm",
    skyTop: [5, 7, 18],
    skyMid: [9, 11, 26],
    skyBottom: [3, 4, 12],
    skyTopActive: [11, 12, 27],
    skyMidActive: [6, 8, 33],
    cloudTint: [70, 88, 140],
    cloudAlpha: 1,
    cloudCover: 0.55,
    cloudSpeed: 1,
    sun: null,
    haze: 0,
    rain: 1,
    rainColor: [150, 190, 235],
    lightning: 1,
    flashColor: [200, 224, 255],
    vignette: 0.55,

    fog: [6, 8, 15],
    fogNear: 12,
    fogFar: 66,
    exposure: 1,
    ambient: [255, 255, 255],
    ambientI: 0.5,
    sunLight: [234, 246, 255],
    sunI: 1.4,
    sunPos: [-3, 5, 4],
    fill1: [79, 216, 255],
    fill1I: 22,
    fill2: [42, 108, 255],
    fill2I: 9,
    street: [79, 216, 255],
    streetI: 15,
    streetTint: 0,

    buildingDarkMix: 0.5,
    buildingShadow: [5, 7, 10],
    windowEmissive: 1,
    warmth: 0,
    warmGlow: [26, 68, 102],
    concrete: [5, 6, 8],

    roadRain: 1,
    roadBright: 0.6,
    roadTint: [0.01 * 255, 0.04 * 255, 0.07 * 255],
    roadLine: [0.05 * 255, 0.5 * 255, 0.8 * 255],
    roadLineMix: 0.7,

    mist: [0.56 * 255, 0.68 * 255, 0.9 * 255],
    mistGlow: [0.11 * 255, 0.36 * 255, 0.5 * 255],
    mistAmount: 1,

    accent: [79, 216, 255],
    accentSoft: [159, 232, 255],
    pageBg: [6, 8, 15],
    scrim: 0,

    holoDeep: [14, 63, 110],
    holoBright: [140, 224, 255],
  },

  // ══════════════════════════════════════════════════════════════
  //  SUNRISE · CLEAR — pale gold dawn, long shadows, dry streets
  // ══════════════════════════════════════════════════════════════
  "sunrise-clear": {
    id: "sunrise-clear",
    skyTop: [111, 157, 207],
    skyMid: [246, 196, 155],
    skyBottom: [255, 231, 194],
    skyTopActive: [111, 157, 207],
    skyMidActive: [246, 196, 155],
    cloudTint: [255, 228, 206],
    cloudAlpha: 0.8,
    cloudCover: 0.3,
    cloudSpeed: 0.7,
    sun: {
      x: 0.82,
      y: 0.19,
      r: 52,
      core: [255, 248, 232],
      edge: [255, 206, 138],
      glow: [255, 190, 110],
      discAlpha: 0.96,
      glowAlpha: 0.85,
      glowR: 16,
    },
    haze: 0.6,
    rain: 0,
    rainColor: [255, 220, 170],
    lightning: 0,
    flashColor: [255, 224, 180],
    vignette: 0.16,

    fog: [248, 214, 178],
    fogNear: 16,
    fogFar: 100,
    exposure: 1.12,
    ambient: [255, 235, 214],
    ambientI: 0.85,
    sunLight: [255, 209, 150],
    sunI: 2.7,
    sunPos: [8, 2.4, 3],
    fill1: [255, 190, 120],
    fill1I: 1.2,
    fill2: [120, 150, 220],
    fill2I: 1.2,
    street: [255, 180, 110],
    streetI: 0,
    streetTint: 1,

    buildingDarkMix: 0.1,
    buildingShadow: [112, 96, 84],
    windowEmissive: 0.16,
    warmth: 0.85,
    warmGlow: [255, 210, 150],
    concrete: [150, 138, 124],

    roadRain: 0,
    roadBright: 1.0,
    roadTint: [0.06 * 255, 0.05 * 255, 0.04 * 255],
    roadLine: [0.85 * 255, 0.8 * 255, 0.66 * 255],
    roadLineMix: 0.35,

    mist: [238, 214, 185],
    mistGlow: [200, 150, 80],
    mistAmount: 0.4,

    accent: [232, 150, 56],
    accentSoft: [255, 216, 164],
    pageBg: [28, 38, 58],
    scrim: 0.55,

    holoDeep: [150, 86, 22],
    holoBright: [255, 226, 168],
  },

  // ══════════════════════════════════════════════════════════════
  //  SUNRISE · CLOUDY — soft overcast dawn, diffused milky sun
  // ══════════════════════════════════════════════════════════════
  "sunrise-cloudy": {
    id: "sunrise-cloudy",
    skyTop: [112, 120, 142],
    skyMid: [186, 176, 178],
    skyBottom: [216, 200, 188],
    skyTopActive: [112, 120, 142],
    skyMidActive: [186, 176, 178],
    cloudTint: [198, 190, 192],
    cloudAlpha: 1.15,
    cloudCover: 0.95,
    cloudSpeed: 0.45,
    sun: {
      x: 0.78,
      y: 0.22,
      r: 104,
      core: [255, 236, 214],
      edge: [240, 214, 196],
      glow: [240, 205, 180],
      discAlpha: 0.24,
      glowAlpha: 0.5,
      glowR: 11,
    },
    haze: 0.42,
    rain: 0,
    rainColor: [230, 220, 210],
    lightning: 0,
    flashColor: [255, 230, 200],
    vignette: 0.26,

    fog: [196, 188, 184],
    fogNear: 10,
    fogFar: 52,
    exposure: 1.05,
    ambient: [238, 230, 222],
    ambientI: 1.05,
    sunLight: [255, 214, 178],
    sunI: 1.1,
    sunPos: [8, 3, 3],
    fill1: [200, 200, 220],
    fill1I: 0.8,
    fill2: [180, 170, 180],
    fill2I: 0.6,
    street: [255, 190, 130],
    streetI: 0,
    streetTint: 1,

    buildingDarkMix: 0.22,
    buildingShadow: [92, 84, 84],
    windowEmissive: 0.3,
    warmth: 0.6,
    warmGlow: [255, 214, 170],
    concrete: [138, 130, 126],

    roadRain: 0,
    roadBright: 0.78,
    roadTint: [0.04 * 255, 0.04 * 255, 0.05 * 255],
    roadLine: [0.7 * 255, 0.66 * 255, 0.58 * 255],
    roadLineMix: 0.3,

    mist: [200, 196, 194],
    mistGlow: [150, 120, 96],
    mistAmount: 1.15,

    accent: [214, 148, 90],
    accentSoft: [240, 200, 165],
    pageBg: [34, 36, 44],
    scrim: 0.5,

    holoDeep: [116, 92, 66],
    holoBright: [236, 220, 196],
  },

  // ══════════════════════════════════════════════════════════════
  //  SUNSET · CLEAR — golden hour melting into indigo dusk
  // ══════════════════════════════════════════════════════════════
  "sunset-clear": {
    id: "sunset-clear",
    skyTop: [58, 56, 104],
    skyMid: [228, 118, 80],
    skyBottom: [255, 172, 96],
    skyTopActive: [58, 56, 104],
    skyMidActive: [228, 118, 80],
    cloudTint: [255, 170, 120],
    cloudAlpha: 0.7,
    cloudCover: 0.3,
    cloudSpeed: 0.6,
    sun: {
      x: 0.16,
      y: 0.19,
      r: 58,
      core: [255, 236, 205],
      edge: [255, 150, 80],
      glow: [255, 120, 60],
      discAlpha: 0.96,
      glowAlpha: 0.95,
      glowR: 18,
    },
    haze: 0.72,
    rain: 0,
    rainColor: [255, 190, 140],
    lightning: 0,
    flashColor: [255, 200, 150],
    vignette: 0.28,

    fog: [222, 140, 96],
    fogNear: 13,
    fogFar: 78,
    exposure: 1.06,
    ambient: [255, 205, 175],
    ambientI: 0.7,
    sunLight: [255, 150, 90],
    sunI: 2.4,
    sunPos: [-8, 1.8, 3],
    fill1: [255, 120, 70],
    fill1I: 6,
    fill2: [86, 70, 200],
    fill2I: 3.5,
    street: [255, 178, 105],
    streetI: 13,
    streetTint: 1,

    buildingDarkMix: 0.38,
    buildingShadow: [48, 30, 44],
    windowEmissive: 0.75,
    warmth: 0.8,
    warmGlow: [255, 178, 110],
    concrete: [96, 72, 68],

    roadRain: 0,
    roadBright: 0.74,
    roadTint: [0.05 * 255, 0.025 * 255, 0.01 * 255],
    roadLine: [0.95 * 255, 0.55 * 255, 0.2 * 255],
    roadLineMix: 0.6,

    mist: [205, 128, 100],
    mistGlow: [150, 70, 40],
    mistAmount: 0.75,

    accent: [255, 138, 72],
    accentSoft: [255, 196, 150],
    pageBg: [36, 22, 40],
    scrim: 0.45,

    holoDeep: [156, 50, 18],
    holoBright: [255, 196, 132],
  },

  // ══════════════════════════════════════════════════════════════
  //  SUNSET · CLOUDY — moody bruised dusk, lamps already lit
  // ══════════════════════════════════════════════════════════════
  "sunset-cloudy": {
    id: "sunset-cloudy",
    skyTop: [44, 42, 74],
    skyMid: [150, 82, 92],
    skyBottom: [206, 124, 92],
    skyTopActive: [44, 42, 74],
    skyMidActive: [150, 82, 92],
    cloudTint: [128, 102, 118],
    cloudAlpha: 1.2,
    cloudCover: 1,
    cloudSpeed: 0.5,
    sun: {
      x: 0.22,
      y: 0.24,
      r: 92,
      core: [236, 180, 150],
      edge: [210, 110, 90],
      glow: [200, 80, 70],
      discAlpha: 0.3,
      glowAlpha: 0.6,
      glowR: 12,
    },
    haze: 0.55,
    rain: 0,
    rainColor: [230, 170, 160],
    lightning: 0,
    flashColor: [240, 180, 150],
    vignette: 0.4,

    fog: [150, 104, 100],
    fogNear: 10,
    fogFar: 50,
    exposure: 1,
    ambient: [222, 190, 180],
    ambientI: 0.6,
    sunLight: [228, 122, 92],
    sunI: 1.1,
    sunPos: [-8, 2.2, 3],
    fill1: [200, 90, 80],
    fill1I: 4,
    fill2: [60, 56, 140],
    fill2I: 3,
    street: [255, 170, 100],
    streetI: 15,
    streetTint: 1,

    buildingDarkMix: 0.46,
    buildingShadow: [34, 24, 36],
    windowEmissive: 0.95,
    warmth: 0.65,
    warmGlow: [255, 170, 105],
    concrete: [72, 60, 64],

    roadRain: 0,
    roadBright: 0.64,
    roadTint: [0.04 * 255, 0.02 * 255, 0.02 * 255],
    roadLine: [0.85 * 255, 0.45 * 255, 0.22 * 255],
    roadLineMix: 0.62,

    mist: [150, 110, 112],
    mistGlow: [120, 50, 44],
    mistAmount: 1.2,

    accent: [236, 110, 96],
    accentSoft: [248, 178, 158],
    pageBg: [26, 22, 34],
    scrim: 0.55,

    holoDeep: [128, 44, 58],
    holoBright: [255, 182, 160],
  },
};

export const THEME_ORDER: ThemeId[] = [
  "storm",
  "sunrise-clear",
  "sunrise-cloudy",
  "sunset-clear",
  "sunset-cloudy",
];

// ── easing helpers ────────────────────────────────────────────────────────

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function lerpColor(out: V3, target: V3, t: number): V3 {
  out[0] = lerp(out[0], target[0], t);
  out[1] = lerp(out[1], target[1], t);
  out[2] = lerp(out[2], target[2], t);
  return out;
}

export function rgbCss(c: V3, alpha = 1): string {
  return alpha >= 1
    ? `rgb(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0})`
    : `rgba(${c[0] | 0}, ${c[1] | 0}, ${c[2] | 0}, ${alpha})`;
}

function cloneV3(c: V3): V3 {
  return [c[0], c[1], c[2]];
}

/** A mutable copy of a theme's params — per-frame eased toward a target. */
export function createLiveTheme(id: ThemeId = "storm"): ThemeParams {
  const p = THEMES[id];
  return {
    ...p,
    skyTop: cloneV3(p.skyTop),
    skyMid: cloneV3(p.skyMid),
    skyBottom: cloneV3(p.skyBottom),
    skyTopActive: cloneV3(p.skyTopActive),
    skyMidActive: cloneV3(p.skyMidActive),
    cloudTint: cloneV3(p.cloudTint),
    rainColor: cloneV3(p.rainColor),
    flashColor: cloneV3(p.flashColor),
    fog: cloneV3(p.fog),
    ambient: cloneV3(p.ambient),
    sunLight: cloneV3(p.sunLight),
    sunPos: cloneV3(p.sunPos) as V3,
    fill1: cloneV3(p.fill1),
    fill2: cloneV3(p.fill2),
    street: cloneV3(p.street),
    buildingShadow: cloneV3(p.buildingShadow),
    warmGlow: cloneV3(p.warmGlow),
    concrete: cloneV3(p.concrete),
    roadTint: cloneV3(p.roadTint),
    roadLine: cloneV3(p.roadLine),
    mist: cloneV3(p.mist),
    mistGlow: cloneV3(p.mistGlow),
    accent: cloneV3(p.accent),
    accentSoft: cloneV3(p.accentSoft),
    pageBg: cloneV3(p.pageBg),
    holoDeep: cloneV3(p.holoDeep),
    holoBright: cloneV3(p.holoBright),
    sun: p.sun
      ? { ...p.sun, core: cloneV3(p.sun.core), edge: cloneV3(p.sun.edge), glow: cloneV3(p.sun.glow) }
      : null,
  };
}

const COLOR_KEYS: (keyof ThemeParams)[] = [
  "skyTop",
  "skyMid",
  "skyBottom",
  "skyTopActive",
  "skyMidActive",
  "cloudTint",
  "rainColor",
  "flashColor",
  "fog",
  "ambient",
  "sunLight",
  "fill1",
  "fill2",
  "street",
  "buildingShadow",
  "warmGlow",
  "concrete",
  "roadTint",
  "roadLine",
  "mist",
  "mistGlow",
  "accent",
  "accentSoft",
  "pageBg",
  "holoDeep",
  "holoBright",
];

const NUMBER_KEYS: (keyof ThemeParams)[] = [
  "cloudAlpha",
  "cloudCover",
  "cloudSpeed",
  "haze",
  "rain",
  "lightning",
  "vignette",
  "fogNear",
  "fogFar",
  "exposure",
  "ambientI",
  "sunI",
  "fill1I",
  "fill2I",
  "streetI",
  "streetTint",
  "buildingDarkMix",
  "windowEmissive",
  "warmth",
  "roadRain",
  "roadBright",
  "roadLineMix",
  "mistAmount",
  "scrim",
];

/**
 * Ease `live` toward the theme `target`. Call once per frame with the
 * frame delta; ~1.6s transitions. Mutates and returns `live`.
 */
export function easeTheme(
  live: ThemeParams,
  target: ThemeParams,
  dt: number,
  rate = 2.2,
): ThemeParams {
  const k = 1 - Math.exp(-dt * rate);

  for (const key of COLOR_KEYS) {
    lerpColor(live[key] as V3, target[key] as V3, k);
  }
  for (const key of NUMBER_KEYS) {
    const a = live[key] as number;
    const b = target[key] as number;
    (live as unknown as Record<string, number>)[key] = lerp(a, b, k);
  }
  // sun position is a V3 too
  lerpColor(live.sunPos as V3, target.sunPos as V3, k);

  // sun presence fades in/out so the storm ↔ day crossfade is seamless
  if (target.sun) {
    if (!live.sun) {
      const s = target.sun;
      live.sun = {
        ...s,
        core: cloneV3(s.core),
        edge: cloneV3(s.edge),
        glow: cloneV3(s.glow),
        discAlpha: 0,
        glowAlpha: 0,
      };
    }
    const s = live.sun;
    const t = target.sun;
    s.x = lerp(s.x, t.x, k);
    s.y = lerp(s.y, t.y, k);
    s.r = lerp(s.r, t.r, k);
    s.glowR = lerp(s.glowR, t.glowR, k);
    s.discAlpha = lerp(s.discAlpha, t.discAlpha, k);
    s.glowAlpha = lerp(s.glowAlpha, t.glowAlpha, k);
    lerpColor(s.core, t.core, k);
    lerpColor(s.edge, t.edge, k);
    lerpColor(s.glow, t.glow, k);
  } else if (live.sun) {
    live.sun.discAlpha = lerp(live.sun.discAlpha, 0, k);
    live.sun.glowAlpha = lerp(live.sun.glowAlpha, 0, k);
    if (live.sun.glowAlpha < 0.008) live.sun = null;
  }

  return live;
}
