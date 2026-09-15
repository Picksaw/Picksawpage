/**
 * path.ts — the journey's spatial layout math.
 *
 * The site can host more than one scrolling walk (home gallery + the
 * standalone About walk). Each walk is described by a WalkLayout: where
 * the framed windows stand, where the camera stops, and where the finale
 * landmark sits. Rendering (Corridor) and draw gating
 * (JourneyElectricBorder) consume the same layout without a circular
 * import.
 */
import * as THREE from "three";
import { TEMPLATES } from "../../config/templatesConfig";

const N = TEMPLATES.length;
export const FOCUS_DIST = 4.2;

export const HEADLINE_Z = -13;

/** Window plane position along the road (camera faces -z). */
export const paintingZ = (i: number) => -24 - i * 8;

/** The home journey is the entire website: after the templates, the real
 *  site sections (stats / process / contact) ride as extra stations.
 *  About now lives on its own /about walk. */
export const EXTRA_SECTIONS = 3;
export const TOTAL_STATIONS = N + EXTRA_SECTIONS;

export interface WalkLayout {
  /** Human id, used for debug keys. */
  id: "home" | "about";
  /** Number of framed windows along the road. */
  frameCount: number;
  /** Plane z of frame i. */
  frameZ: (i: number) => number;
  /** Camera stand z of every focus station (windows, then finale). */
  stations: number[];
  /** Position of the big finale landmark at the end of the road. */
  finaleZ: number;
  /** Scroll spacer height in vh — drives total walk length. */
  spacerVh: number;
  /** Framed window index currently in focus, -1 when none. */
  focusedIndex: (progress: number) => number;
  cameraZ: (progress: number) => number;
}

/** How close to the finale landmark the walk's last station stands — the
 *  gate is a distant hazy giant at the end of a long boulevard. */
export const FINALE_STAND = 46;

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function makeCameraZ(stations: number[]) {
  return (progress: number): number => {
    const u = Math.max(0, Math.min(1, progress)) * (stations.length - 1);
    const k = Math.min(stations.length - 2, Math.floor(u));
    const t = smoothstep(u - k);
    return THREE.MathUtils.lerp(stations[k], stations[k + 1], t);
  };
}

/* ------------------------------------------------------------------ */
/* Home walk                                                          */
/* ------------------------------------------------------------------ */

/** Milad Tower — the finale landmark standing in the middle of the road,
 *  past the last window. Shared with Corridor's city builder.
 *  ~12 building rows beyond the gallery — "10 buildings away".
 *  (Azadi Tower is NOT here: it is a back-row side building — see
 *  makeCity in Corridor.) */
export const FINALE_Z = paintingZ(TOTAL_STATIONS - 1) - 72; // = -160

const homeStations: number[] = [
  4.6, // the P + ring
  HEADLINE_Z + FOCUS_DIST, // the headline layer
  ...Array.from({ length: TOTAL_STATIONS }, (_, i) => paintingZ(i) + FOCUS_DIST),
  FINALE_Z + FINALE_STAND, // the finale: face the tower
];

export const homeLayout: WalkLayout = {
  id: "home",
  frameCount: TOTAL_STATIONS,
  frameZ: paintingZ,
  stations: homeStations,
  finaleZ: FINALE_Z,
  spacerVh: 100 + 100 + N * 92 + 55 + 300,

  /** Painting index for the focus bar: -1 outside the gallery zone. */
  focusedIndex(progress: number): number {
    const u = progress * (homeStations.length - 1);
    const idx = Math.round(u) - 2;
    if (u < 1.55) return -1; // never lose focus at the end of the corridor
    return Math.max(0, Math.min(TOTAL_STATIONS - 1, idx));
  },

  cameraZ: makeCameraZ(homeStations),
};

/* ------------------------------------------------------------------ */
/* About walk                                                         */
/* ------------------------------------------------------------------ */

export const ABOUT_FRAMES = 6;
export const aboutFrameZ = (i: number) => -16 - i * 8;
/** Past the last window, same boulevard gap as the home finale. */
export const ABOUT_FINALE_Z = aboutFrameZ(ABOUT_FRAMES - 1) - 68; // = -124

const aboutStations: number[] = [
  ...Array.from({ length: ABOUT_FRAMES }, (_, i) => aboutFrameZ(i) + FOCUS_DIST),
  ABOUT_FINALE_Z + FINALE_STAND,
];

export const aboutLayout: WalkLayout = {
  id: "about",
  frameCount: ABOUT_FRAMES,
  frameZ: aboutFrameZ,
  stations: aboutStations,
  finaleZ: ABOUT_FINALE_Z,
  spacerVh: 80 + ABOUT_FRAMES * 92 + 250,

  focusedIndex(progress: number): number {
    const u = progress * (aboutStations.length - 1);
    return Math.max(0, Math.min(ABOUT_FRAMES - 1, Math.round(u)));
  },

  cameraZ: makeCameraZ(aboutStations),
};

/* ------------------------------------------------------------------ */
/* Shared layer curves (back-compat named exports)                    */
/* ------------------------------------------------------------------ */

export const stations = homeStations;
export const cameraZ = homeLayout.cameraZ;
export const focusedIndex = homeLayout.focusedIndex;

/** How visible a layer is — fades to zero well before the next appears.
 *  Long, smooth fade-out when going *through* a window so the frame never
 *  sits opaque covering the whole phone screen. It starts fading at ~2.8u
 *  before the plane and is gone by -0.8u past it, with smoothstep easing.
 *  Fade-in is also eased over 3.5u.
 */
export function layerOpacity(camZ: number, layerZ: number): number {
  const d = camZ - layerZ; // positive while approaching, 0 at plane, negative after passing
  // fully passed → invisible
  if (d <= -0.8) return 0;
  // fade OUT as we go through: -0.8 → 2.8  (0 → 1)
  if (d <= 2.8) {
    const t = clamp01((d + 0.8) / 3.6);
    return smoothstep(t);
  }
  // fully visible plateau
  if (d <= 5.5) return 1;
  // fade IN while approaching: 5.5 → 9.0 (1 → 0)
  if (d <= 9.0) {
    const t = clamp01((9.0 - d) / 3.5);
    return smoothstep(t);
  }
  return 0;
}
