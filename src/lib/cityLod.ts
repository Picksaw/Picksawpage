/**
 * cityLod — error-bounded level-of-detail for the boulevard's buildings.
 *
 * WHY
 * ───
 * The city's street blocks are high-detail source models: one of them is
 * 48,358 triangles and the boulevard draws 21 copies of it, so a single
 * frame submits ~1M triangles for buildings that are a few hundred pixels
 * tall. That geometry cost is what pins the frame rate — and it is spent
 * on detail smaller than one pixel, i.e. detail nobody can see.
 *
 * THE RULE THIS MODULE ENFORCES
 * ─────────────────────────────
 * A simplified index buffer may only replace the original at distances
 * where its *measured* deviation is smaller than `TARGET_PX` CSS pixels.
 * The deviation is not estimated: meshoptimizer reports the absolute
 * world-space error it actually achieved, and the switch distance falls
 * straight out of that number and the live camera:
 *
 *     pixels = error · H / (2 · d · tan(fov/2))
 *     ⇒ d    = error · H / (2 · TARGET_PX · tan(fov/2))
 *
 * Several levels are generated per mesh, so the model steps down as it
 * recedes instead of taking one big jump. Closer than the first level's
 * distance the ORIGINAL geometry is used, untouched.
 *
 * Strictly best-effort. No worker, no WASM, non-indexed geometry, a
 * failed simplification — every path yields "no LOD" and the scene keeps
 * rendering the original geometry for the whole session.
 */

import * as THREE from "three";
import LodWorker from "./lod.worker?worker&inline";

/** Maximum on-screen deviation a simplified LOD may introduce, in CSS
 *  pixels. Half a pixel is below the resolving power of any display. */
export const TARGET_PX = 0.5;

/** Below this many triangles a mesh is already cheap; simplifying buys
 *  nothing and only adds bookkeeping. */
const MIN_TRIS = 700;

/**
 * Error ceilings for the LOD chain, in world units. Each entry asks the
 * simplifier for the deepest cut that stays inside that deviation; the
 * level that actually results — and therefore the distance at which it
 * engages — is derived from the error the simplifier reports back, so a
 * target the model cannot meet simply lands farther away instead of
 * looking worse. Ordered finest first.
 *
 * Two levels, chosen by measuring the real models rather than guessing.
 * The detailed façades simplify hard at the fine ceiling (48,358 tris →
 * 29,155 at 0.004, engaging ~6 units out on a 720px viewport, which
 * already covers the whole visible boulevard). But the plainer shells
 * barely move at 0.004 — the 2,304-triangle block only collapses at
 * 0.04 — and those shells are drawn 21–35 times each, so skipping the
 * coarse pass lost a third of the city's total saving. A third and
 * fourth ceiling bought 1–15% beyond these two while doubling the build
 * time again, so they are not worth it.
 */
const LOD_TARGETS = [0.004, 0.04];

/** A level that removes less than this fraction of the triangles is not
 *  worth swapping for. */
const MIN_SAVING = 0.3;

/** Ratio applied to the switch distance when stepping back to a finer
 *  level, so a building near a boundary cannot oscillate. */
export const LOD_HYSTERESIS = 0.85;

export interface LodLevel {
  /** Simplified index buffer over the SAME vertex buffer. */
  index: THREE.BufferAttribute;
  /** Measured absolute deviation, world units. */
  errorWorld: number;
  tris: number;
}

export interface MeshLod {
  /** The mesh's own index attribute — restored when close. */
  hiIndex: THREE.BufferAttribute;
  trisHi: number;
  /** Coarsest last, so a linear scan can pick the right one. */
  levels: LodLevel[];
}

interface Pending {
  resolve: (lod: MeshLod | null) => void;
  hi: THREE.BufferAttribute;
  tris: number;
  key: string;
}

class LodBuilder {
  private worker: Worker | null = null;
  private nextId = 1;
  private inflight = new Map<number, Pending>();
  private cache = new Map<string, MeshLod | null>();
  private broken = false;

  private ensureWorker(): Worker | null {
    if (this.broken) return null;
    if (this.worker) return this.worker;
    try {
      const w = new LodWorker();
      w.onmessage = (
        e: MessageEvent<{ id: number; indices?: Uint32Array; error: number }>,
      ) => {
        const p = this.inflight.get(e.data.id);
        if (!p) return;
        this.inflight.delete(e.data.id);
        p.resolve(
          e.data.indices && e.data.error > 0
            ? {
                hiIndex: p.hi,
                trisHi: p.tris,
                levels: [
                  {
                    index: new THREE.BufferAttribute(e.data.indices, 1),
                    errorWorld: e.data.error,
                    tris: e.data.indices.length / 3,
                  },
                ],
              }
            : null,
        );
      };
      w.onerror = () => {
        // No LODs for the rest of this session — originals everywhere.
        this.broken = true;
        for (const p of this.inflight.values()) p.resolve(null);
        this.inflight.clear();
      };
      this.worker = w;
      return w;
    } catch {
      this.broken = true;
      return null;
    }
  }

  /** One worker round-trip. Never rejects. */
  private run(
    geometry: THREE.BufferGeometry,
    targetIndexCount: number,
    targetError: number,
    lockBorder = true,
    weld = false,
  ): Promise<{ index: THREE.BufferAttribute; errorWorld: number; tris: number } | null> {
    const index = geometry.index;
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
    const w = this.ensureWorker();
    if (!index || !pos || !w) return Promise.resolve(null);

    // Tightly packed xyz — the simplifier wants stride 3.
    const positions = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      positions[i * 3] = pos.getX(i);
      positions[i * 3 + 1] = pos.getY(i);
      positions[i * 3 + 2] = pos.getZ(i);
    }
    const src = index.array as Uint16Array | Uint32Array;
    const indices = src instanceof Uint32Array ? src : new Uint32Array(src);

    const id = this.nextId++;
    return new Promise((resolve) => {
      this.inflight.set(id, {
        resolve: () => {},
        hi: index,
        tris: index.count / 3,
        key: geometry.uuid,
      });
      const rec = this.inflight.get(id)!;
      rec.resolve = (lod) =>
        resolve(
          lod
            ? {
                index: lod.levels[0].index,
                errorWorld: lod.levels[0].errorWorld,
                tris: lod.levels[0].tris,
              }
            : null,
        );
      w.postMessage(
        { id, positions, indices, targetIndexCount, targetError, lockBorder, weld },
        [positions.buffer, indices.buffer],
      );
    });
  }

  /**
   * Build the whole LOD chain for one geometry. Cached per geometry —
   * the boulevard reuses five prototypes dozens of times.
   */
  request(geometry: THREE.BufferGeometry): Promise<MeshLod | null> {
    const key = geometry.uuid;
    const hit = this.cache.get(key);
    if (hit !== undefined) return Promise.resolve(hit);

    const index = geometry.index;
    const tris = index ? index.count / 3 : 0;
    if (!index || tris < MIN_TRIS) {
      this.cache.set(key, null);
      return Promise.resolve(null);
    }

    const promise = (async (): Promise<MeshLod | null> => {
      const levels: LodLevel[] = [];
      for (const target of LOD_TARGETS) {
        const res = await this.run(geometry, 48, target, false);
        if (!res) continue;
        // Skip a level that does not earn its keep, and any that ended
        // up no finer than one we already have.
        const last = levels[levels.length - 1];
        if (res.tris > tris * (1 - MIN_SAVING)) continue;
        if (last && res.tris >= last.tris * 0.7) continue;
        levels.push({ index: res.index, errorWorld: res.errorWorld, tris: res.tris });
      }
      const lod = levels.length ? { hiIndex: index, trisHi: tris, levels } : null;
      this.cache.set(key, lod); // replace the placeholder with the result
      return lod;
    })();

    // Placeholder so concurrent callers share one build; stats() skips it.
    this.cache.set(key, promise as unknown as MeshLod | null);
    return promise;
  }

  /** Tuning sweep: what does the simplifier achieve at each ceiling? */
  async sweep(
    geometry: THREE.BufferGeometry,
    targets: number[],
    lockBorder = true,
    weld = false,
  ): Promise<{ target: number; tris: number; error: number }[]> {
    const out: { target: number; tris: number; error: number }[] = [];
    for (const target of targets) {
      const res = await this.run(geometry, 48, target, lockBorder, weld);
      out.push({
        target,
        tris: res ? res.tris : (geometry.index?.count ?? 0) / 3,
        error: res ? res.errorWorld : 0,
      });
    }
    return out;
  }

  /** Everything built so far — used by the perf probe. */
  stats() {
    return [...this.cache.values()].flatMap((v) =>
      v && !isPromiseLike(v)
        ? [
            {
              trisHi: v.trisHi,
              levels: v.levels.map((l) => ({
                tris: l.tris,
                errorWorld: Math.round(l.errorWorld * 10000) / 10000,
              })),
            },
          ]
        : [],
    );
  }

  /** Meshes still waiting on the worker. */
  pendingCount() {
    return [...this.cache.values()].filter(isPromiseLike).length;
  }
}

function isPromiseLike(v: unknown): boolean {
  return !!v && typeof (v as Promise<unknown>).then === "function";
}

export const lodBuilder = new LodBuilder();

/**
 * Multiplier turning a world-space deviation into the camera distance at
 * which it shrinks to exactly `TARGET_PX` pixels:
 *
 *     pixels = error · H / (2 · d · tan(fov/2))   ⇒   d = error · k
 *
 * Call once per frame (one tan), then multiply per building per level.
 */
export function lodPixelFactor(viewportHeightPx: number, fovDeg: number): number {
  const halfTan = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  if (!(halfTan > 0)) return Infinity;
  return viewportHeightPx / (2 * TARGET_PX * halfTan);
}

/**
 * Master switch — for A/B measuring the LOD's cost, and for the
 * `?nolod=1` debug URL. Off means every mesh keeps its own geometry for
 * the whole session, i.e. exactly the pre-LOD behaviour.
 */
let enabled =
  typeof window === "undefined" ||
  !new URLSearchParams(window.location.search).has("nolod");

export function setLodEnabled(v: boolean) {
  enabled = v;
}
export function isLodEnabled() {
  return enabled;
}

/**
 * Global multiplier on every LOD switch distance, driven by the
 * adaptive quality controller (see lib/renderQuality.ts).
 *
 * 1.0 is the pixel-exact policy: a mesh only swaps once its measured
 * deviation is under half a pixel. Below 1.0 meshes swap sooner, which
 * is the axis a machine that cannot hold 60 fps at native resolution
 * spends — geometry detail in exchange for frames.
 */
let bias = 1;
export function setLodBias(v: number) {
  bias = v;
}
export function getLodBias() {
  return bias;
}

/**
 * Debug surface, mounted only when the perf probe is active (`?perf=1`).
 * Lets the harness sweep simplifier targets against the real models.
 */
export function mountLodDebug(getScene: () => THREE.Object3D | null) {
  if (typeof window === "undefined" || !window.__perf) return;
  const geometries = () => {
    const list: { uuid: string; tris: number; verts: number; name: string }[] = [];
    const seen = new Set<string>();
    getScene()?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.geometry?.index || seen.has(m.geometry.uuid)) return;
      seen.add(m.geometry.uuid);
      list.push({
        uuid: m.geometry.uuid,
        tris: m.geometry.index.count / 3,
        verts: m.geometry.getAttribute("position")?.count ?? 0,
        name: m.name || m.geometry.name || "(anon)",
      });
    });
    return list.sort((a, b) => b.tris - a.tris);
  };
  (window as unknown as Record<string, unknown>).__picksawLod = {
    set: setLodEnabled,
    get: isLodEnabled,
    stats: () => lodBuilder.stats(),
    geometries,
    sweep: (uuid: string, targets: number[], lockBorder = true, weld = false) => {
      const found: { geo: THREE.BufferGeometry | null } = { geo: null };
      getScene()?.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.geometry?.uuid === uuid) found.geo = m.geometry;
      });
      return found.geo
        ? lodBuilder.sweep(found.geo, targets, lockBorder, weld)
        : Promise.resolve([]);
    },
  };
}
