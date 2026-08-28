/**
 * path.ts — the journey's spatial layout math.
 *
 * Shared by Corridor (rendering) and JourneyElectricBorder (draw gating)
 * without a circular import: the walk path, station positions and the
 * solo-layer opacity curve live here.
 */
import * as THREE from "three";
import { TEMPLATES } from "../../config/templatesConfig";

const N = TEMPLATES.length;
const FOCUS_DIST = 4.2;

export const HEADLINE_Z = -13;
export const paintingZ = (i: number) => -24 - i * 8;

/** The journey is the entire website: after the templates, the real
 *  site sections (stats / process / contact) ride as extra stations. */
export const EXTRA_SECTIONS = 3;
export const TOTAL_STATIONS = N + EXTRA_SECTIONS;

/** Azadi Tower — the finale landmark standing in the middle of the road,
 *  past the last painting. Shared with Corridor's city builder.
 *  ~12 building rows beyond the gallery — "10 buildings away". */
export const AZADI_Z = paintingZ(TOTAL_STATIONS - 1) - 72; // = -160

/** How close to Azadi the walk's final station stands — the gate is a
 *  distant hazy giant at the end of a long boulevard. Must keep the
 *  finale stop AHEAD of the last section's stop (-83.8) so the camera
 *  never walks backwards. */
export const FINALE_STAND = 46;

export const stations: number[] = [
  4.6, // the P + ring
  HEADLINE_Z + FOCUS_DIST, // the headline layer
  ...Array.from(
    { length: TOTAL_STATIONS },
    (_, i) => paintingZ(i) + FOCUS_DIST,
  ),
  AZADI_Z + FINALE_STAND, // the finale: face the Azadi Tower
];

/** Painting index for the focus bar: -1 outside the gallery zone. */
export function focusedIndex(progress: number): number {
  const u = progress * (stations.length - 1);
  const idx = Math.round(u) - 2;
  if (u < 1.55) return -1; // never lose focus at the end of the corridor
  return Math.max(0, Math.min(TOTAL_STATIONS - 1, idx));
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function cameraZ(progress: number): number {
  const u = Math.max(0, Math.min(1, progress)) * (stations.length - 1);
  const k = Math.min(stations.length - 2, Math.floor(u));
  const t = smoothstep(u - k);
  return THREE.MathUtils.lerp(stations[k], stations[k + 1], t);
}

/** How visible a layer is — fades to zero well before the next appears.
 *  New curve: longer, smooth fade-out when going *through* a painting so
 *  the frame never sits opaque covering the whole phone screen. It starts
 *  fading at ~2.8u before the plane and is gone by -0.8u past it, with
 *  smoothstep easing. Fade-in is also eased over 3.5u.
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
