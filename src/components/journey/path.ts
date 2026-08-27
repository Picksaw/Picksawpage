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

export const stations: number[] = [
  4.6, // the P + ring
  HEADLINE_Z + FOCUS_DIST, // the headline layer
  ...Array.from(
    { length: TOTAL_STATIONS },
    (_, i) => paintingZ(i) + FOCUS_DIST,
  ),
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

/** How visible a layer is — fades to zero well before the next appears. */
export function layerOpacity(camZ: number, layerZ: number): number {
  const d = camZ - layerZ; // positive while approaching
  if (d <= 0.2) return clamp01(d / 1.2); // fade as the camera reaches it
  return clamp01((8.4 - d) / 2.2); // fully hidden by 8.4 units away
}
