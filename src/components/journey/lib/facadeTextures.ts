/**
 * Façade texture atlas.
 *
 * One 2048×2048 canvas holds every façade variant the city needs:
 * 4 columns × 4 rows of tiles, each tile a different window rhythm,
 * lighting mood and district personality. Buildings pick a tile and
 * scale their UVs so every window ends up the same physical size in
 * metres, whatever the building's proportions.
 *
 * Three maps come out of the same layout:
 *   albedo     dark stone/concrete/glass with window frames
 *   emissive   the lit windows only (fed to the bloom pass)
 *   roughness  window glass smooth, masonry rough, wet streaks
 *
 * Cost: three canvases, built once, ~4 MB VRAM total. Nothing is
 * fetched over the network, so the district never waits on a texture.
 */

import * as THREE from "three";
import { rng } from "./rng";
import { DISTRICTS, type DistrictKind } from "./cityLayout";

export const ATLAS_COLS = 4;
export const ATLAS_ROWS = 4;
export const ATLAS_TILES = ATLAS_COLS * ATLAS_ROWS;

/** Which district each atlas tile belongs to. */
export const TILE_DISTRICT: DistrictKind[] = [
  "beauty", "beauty", "beauty", "dental",
  "dental", "dental", "luxury", "luxury",
  "luxury", "studio", "studio", "studio",
  "future", "future", "future", "beauty",
];

/** Tile index for a district — pick with a seed for variety. */
export function tileFor(kind: DistrictKind, seed: number): number {
  const candidates: number[] = [];
  for (let i = 0; i < ATLAS_TILES; i++) if (TILE_DISTRICT[i] === kind) candidates.push(i);
  if (candidates.length === 0) return 0;
  return candidates[seed % candidates.length];
}

export interface FacadeAtlas {
  albedo: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  dispose(): void;
}

/**
 * Tile size.
 *
 * 512 gave a 2048x2048 atlas, and THREE of those (albedo, emissive,
 * roughness) with mipmaps is ~64 MB of VRAM on their own. The tiles are
 * only ever seen on building facades at a distance, through fog and
 * rain, so 256 is indistinguishable in situ and costs a quarter as
 * much. Windows stay crisp because their grid is metre-accurate in the
 * shader, not baked at texture resolution.
 */
const TILE = 256;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex: string, k: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

function drawTile(
  albedo: CanvasRenderingContext2D,
  emissive: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  tile: number
) {
  const col = tile % ATLAS_COLS;
  const row = Math.floor(tile / ATLAS_COLS);
  const ox = col * TILE;
  const oy = row * TILE;
  const d = DISTRICTS[TILE_DISTRICT[tile]];
  const r = rng(7000 + tile * 613);

  // window grid for this tile: 8 bays × 8 floors, occasionally denser
  const cols = r.chance(0.35) ? 10 : 8;
  const rows = r.chance(0.3) ? 10 : 8;
  const cw = TILE / cols;
  const ch = TILE / rows;

  // ── albedo: base masonry with vertical tonal banding ──
  const g = albedo.createLinearGradient(ox, oy, ox, oy + TILE);
  g.addColorStop(0, shade(d.facade, 1.18));
  g.addColorStop(0.55, shade(d.facade, 0.95));
  g.addColorStop(1, shade(d.facade, 0.72));
  albedo.fillStyle = g;
  albedo.fillRect(ox, oy, TILE, TILE);

  // masonry grain
  for (let i = 0; i < 900; i++) {
    const a = r.range(0.015, 0.055);
    albedo.fillStyle = r.chance(0.5) ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
    albedo.fillRect(ox + r.range(0, TILE), oy + r.range(0, TILE), r.range(2, 26), r.range(1, 5));
  }

  // pilasters / structural columns between bays
  albedo.fillStyle = shade(d.trim, 0.24);
  for (let x = 0; x <= cols; x++) {
    albedo.fillRect(ox + x * cw - cw * 0.06, oy, cw * 0.12, TILE);
  }
  // floor slabs
  albedo.fillStyle = shade(d.facade, 0.55);
  for (let y = 0; y <= rows; y++) {
    albedo.fillRect(ox, oy + y * ch - ch * 0.05, TILE, ch * 0.1);
  }

  // ── roughness: masonry rough (bright), glass smooth (dark) ──
  rough.fillStyle = "rgb(215,215,215)";
  rough.fillRect(ox, oy, TILE, TILE);
  for (let i = 0; i < 400; i++) {
    const v = Math.round(r.range(150, 235));
    rough.fillStyle = `rgb(${v},${v},${v})`;
    rough.fillRect(ox + r.range(0, TILE), oy + r.range(0, TILE), r.range(4, 40), r.range(2, 10));
  }

  // ── emissive starts black ──
  emissive.fillStyle = "#000000";
  emissive.fillRect(ox, oy, TILE, TILE);

  const [wr, wg, wb] = hexToRgb(d.windowColor);
  const [ar, ag, ab] = hexToRgb(d.accent);

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const px = ox + x * cw + cw * 0.16;
      const py = oy + y * ch + ch * 0.18;
      const pw = cw * 0.68;
      const ph = ch * 0.6;

      // glass pane in albedo — dark, slightly reflective
      albedo.fillStyle = `rgba(${Math.round(wr * 0.1)},${Math.round(wg * 0.12)},${Math.round(
        wb * 0.16
      )},1)`;
      albedo.fillRect(px, py, pw, ph);
      // frame
      albedo.strokeStyle = shade(d.trim, 0.3);
      albedo.lineWidth = 2;
      albedo.strokeRect(px, py, pw, ph);

      // glass is smooth in the roughness map
      rough.fillStyle = `rgb(${Math.round(40 + (1 - d.polish) * 70)},${Math.round(
        40 + (1 - d.polish) * 70
      )},${Math.round(40 + (1 - d.polish) * 70)})`;
      rough.fillRect(px, py, pw, ph);

      // is this window lit?
      if (!r.chance(d.occupancy)) continue;

      const warm = r.chance(0.72);
      const bright = r.range(0.35, 1);
      const cr = warm ? wr : ar;
      const cg2 = warm ? wg : ag;
      const cb = warm ? wb : ab;

      const eg = emissive.createLinearGradient(px, py, px, py + ph);
      eg.addColorStop(0, `rgba(${cr},${cg2},${cb},${bright})`);
      eg.addColorStop(1, `rgba(${Math.round(cr * 0.6)},${Math.round(cg2 * 0.6)},${Math.round(cb * 0.7)},${bright * 0.55})`);
      emissive.fillStyle = eg;
      emissive.fillRect(px, py, pw, ph);

      // interior clutter silhouettes — a lit room is never a flat rectangle
      emissive.fillStyle = `rgba(0,0,0,${r.range(0.25, 0.6)})`;
      const blinds = r.chance(0.4);
      if (blinds) {
        const lines = Math.floor(r.range(3, 7));
        for (let i = 0; i < lines; i++) {
          emissive.fillRect(px, py + (ph / lines) * i, pw, ph / lines / 2.4);
        }
      } else {
        emissive.fillRect(px + r.range(0, pw * 0.5), py + ph * r.range(0.4, 0.75), pw * r.range(0.12, 0.4), ph * 0.5);
      }

      // warm glow bleeding onto the surrounding masonry
      albedo.fillStyle = `rgba(${cr},${cg2},${cb},0.05)`;
      albedo.fillRect(px - 4, py - 4, pw + 8, ph + 8);
    }
  }

  // ── vertical rain streaks over everything (wet city) ──
  for (let i = 0; i < 60; i++) {
    const sx = ox + r.range(0, TILE);
    const sw = r.range(1, 5);
    const sh = r.range(60, TILE);
    const sy = oy + r.range(0, TILE - sh);
    albedo.fillStyle = `rgba(10,14,20,${r.range(0.05, 0.16)})`;
    albedo.fillRect(sx, sy, sw, sh);
    // streaks are smoother than dry masonry
    rough.fillStyle = `rgba(90,90,90,${r.range(0.25, 0.6)})`;
    rough.fillRect(sx, sy, sw, sh);
  }

  // grime gathering at the base of the tile
  const grime = albedo.createLinearGradient(ox, oy + TILE * 0.78, ox, oy + TILE);
  grime.addColorStop(0, "rgba(0,0,0,0)");
  grime.addColorStop(1, "rgba(0,0,0,0.5)");
  albedo.fillStyle = grime;
  albedo.fillRect(ox, oy + TILE * 0.78, TILE, TILE * 0.22);
}

let cached: FacadeAtlas | null = null;

export function getFacadeAtlas(): FacadeAtlas {
  if (cached) return cached;

  const size = TILE * ATLAS_COLS;
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    return c;
  };
  const ca = mk();
  const ce = mk();
  const cr = mk();
  const albedo = ca.getContext("2d")!;
  const emissive = ce.getContext("2d")!;
  const rough = cr.getContext("2d")!;

  for (let t = 0; t < ATLAS_TILES; t++) drawTile(albedo, emissive, rough, t);

  const tex = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    // 4 is ample for surfaces this oblique; 8 doubles the sample cost
    t.anisotropy = 4;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  };

  cached = {
    albedo: tex(ca, true),
    emissive: tex(ce, true),
    roughness: tex(cr, false),
    dispose() {
      cached?.albedo.dispose();
      cached?.emissive.dispose();
      cached?.roughness.dispose();
      cached = null;
    },
  };
  return cached;
}
