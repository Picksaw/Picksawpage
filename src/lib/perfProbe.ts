/**
 * perfProbe — headless/real-browser FPS instrumentation.
 *
 * Enabled ONLY with `?perf=1` in the URL query (e.g. /?perf=1#/).
 * Zero cost when disabled (every call returns at one branch).
 *
 * What it collects (read via window.__perf.report() or the CDP console):
 *   • fps            — rolling per-second frame rate from rAF
 *   • frameMs        — per-frame delta (includes GPU wait)
 *   • longTasks      — count of >50ms main-thread tasks
 *   • jsCost         — moving avg (ms/frame) of the site's own JS work,
 *                      per named component (storm, border, emblem, …)
 *   • canvases       — live inventory: CSS size, backing-store size, kind
 *   • gl             — three.js renderer stats (draw calls, tris, textures)
 *                      for each registered WebGL context
 */

export interface PerfGlStats {
  name: string;
  calls: number;
  triangles: number;
  textures: number;
  programs: number;
  width: number;
  height: number;
  pixelRatio: number;
}

export interface PerfReport {
  fps: number;
  avgFrameMs: number;
  p95FrameMs: number;
  longTasks: number;
  jsCost: Record<string, number>;
  canvases: { cssW: number; cssH: number; pxW: number; pxH: number; kind: string }[];
  gl: PerfGlStats[];
}

interface GlEntry {
  name: string;
  renderer: unknown;
}

interface SceneEntry {
  name: string;
  scene: unknown;
  renderer: unknown;
}

/** Structural view of a three.js Object3D (no three import here). */
interface ObjLike {
  id: number;
  type: string;
  name: string;
  visible: boolean;
  children?: ObjLike[];
}
type SceneLike = ObjLike;

class PerfProbe {
  private frames = 0;
  private last = 0;
  private lastReport = 0;
  private raf = 0;
  private longTasks = 0;
  private jsCost: Record<string, number> = {};
  private glEntries: GlEntry[] = [];
  private scenes: SceneEntry[] = [];
  private meta: Record<string, unknown> = {};
  private deltas: number[] = [];

  constructor() {
    const loop = (t: number) => {
      if (this.last > 0) {
        const d = t - this.last;
        this.frames++;
        this.deltas.push(d);
        if (this.deltas.length > 300) this.deltas.shift();
      }
      this.last = t;
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    try {
      const po = new PerformanceObserver((list) => {
        this.longTasks += list.getEntries().length;
      });
      po.observe({ entryTypes: ["longtask"] });
    } catch {
      /* longtask unsupported — fine */
    }
  }

  /** Components push their per-frame JS cost here (ms). */
  addJsCost(name: string, ms: number) {
    const prev = this.jsCost[name] ?? ms;
    this.jsCost[name] = prev * 0.9 + ms * 0.1;
  }

  /** Register a three.js WebGLRenderer for stats. */
  registerGl(name: string, renderer: unknown) {
    this.glEntries.push({ name, renderer });
  }

  /**
   * Register a three.js scene + renderer so a subsystem can be muted at
   * runtime (perf attribution: hide one branch, re-measure fps).
   */
  registerScene(name: string, scene: unknown, renderer: unknown) {
    this.scenes.push({ name, scene, renderer });
  }

  /** List the named objects of a registered scene. */
  objects(name = "journey"): { id: number; type: string; path: string; visible: boolean }[] {
    const entry = this.scenes.find((s) => s.name === name);
    if (!entry) return [];
    const root = entry.scene as SceneLike;
    const out: { id: number; type: string; path: string; visible: boolean }[] = [];
    const walk = (obj: ObjLike, path: string) => {
      const label = `${path}/${obj.name || obj.type}`;
      out.push({ id: obj.id, type: obj.type, path: label, visible: obj.visible });
      obj.children?.forEach((c) => walk(c, label));
    };
    walk(root, "");
    return out;
  }

  /**
   * Force `visible` on every object whose path matches `match` (a
   * substring of the label path). Returns how many matched.
   */
  set(match: string, visible: boolean, name = "journey"): number {
    const entry = this.scenes.find((s) => s.name === name);
    if (!entry) return 0;
    let hits = 0;
    const walk = (obj: ObjLike, path: string) => {
      const label = `${path}/${obj.name || obj.type}`;
      if (label.toLowerCase().includes(match.toLowerCase())) {
        obj.visible = visible;
        hits++;
      }
      obj.children?.forEach((c) => walk(c, label));
    };
    walk(entry.scene as SceneLike, "");
    return hits;
  }


  /** Free-form instrumentation bag (LOD tables, build timings, …). */
  setMeta(name: string, value: unknown) {
    this.meta[name] = value;
  }

  getMeta() {
    return this.meta;
  }

  /** The registered scene object itself (debug tooling). */
  scene(name = "journey"): unknown {
    return this.scenes.find((s) => s.name === name)?.scene ?? null;
  }

  /**
   * Geometry census of a registered scene, grouped by geometry uuid:
   * how many times one buffer is drawn and how many triangles that
   * costs per frame. This is what finds over-tessellated models.
   */
  census(name = "journey"): {
    key: string;
    draws: number;
    visibleDraws: number;
    trisPerDraw: number;
    trisPerFrame: number;
    matType: string;
  }[] {
    const entry = this.scenes.find((s) => s.name === name);
    if (!entry) return [];
    const map = new Map<
      string,
      { key: string; draws: number; visibleDraws: number; trisPerDraw: number; trisPerFrame: number; matType: string }
    >();
    const walk = (obj: ObjLike) => {
      const o = obj as ObjLike & {
        isMesh?: boolean;
        geometry?: {
          uuid?: string;
          name?: string;
          index?: { count: number };
          attributes?: { position?: { count: number } };
        };
        material?: { type?: string };
      };
      if (o.isMesh && o.geometry) {
        const tris = o.geometry.index
          ? o.geometry.index.count / 3
          : (o.geometry.attributes?.position?.count ?? 0) / 3;
        const key = `${o.geometry.name || o.geometry.uuid || "?"}`;
        const matType = o.material?.type ?? "?";
        const rec = map.get(key) ?? {
          key, draws: 0, visibleDraws: 0, trisPerDraw: tris, trisPerFrame: 0, matType,
        };
        rec.draws++;
        if (o.visible) { rec.visibleDraws++; rec.trisPerFrame += tris; }
        map.set(key, rec);
      }
      obj.children?.forEach(walk);
    };
    walk(entry.scene as SceneLike);
    return [...map.values()].sort((a, b) => b.trisPerFrame - a.trisPerFrame);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
  }

  report(): PerfReport {
    const now = performance.now();
    const span = Math.max(1, now - this.lastReport);
    const fps = Math.round((this.frames * 1000) / span);
    this.frames = 0;
    this.lastReport = now;

    const deltas = [...this.deltas].sort((a, b) => a - b);
    const avg = deltas.length ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
    const p95 = deltas.length ? deltas[Math.floor(deltas.length * 0.95)] : 0;
    this.deltas.length = 0;

    const canvases = Array.from(document.querySelectorAll("canvas")).map((c) => {
      let kind = "2d";
      try {
        if (c.getContext("webgl2") || c.getContext("webgl")) kind = "webgl";
      } catch {
        /* ignore */
      }
      const r = c.getBoundingClientRect();
      return {
        cssW: Math.round(r.width),
        cssH: Math.round(r.height),
        pxW: c.width,
        pxH: c.height,
        kind,
      };
    });

    const gl = this.glEntries.map((e) => {
      const r = e.renderer as {
        info?: {
          render?: { calls: number; triangles: number };
          memory?: { textures: number; geometries: number };
          programs?: unknown[];
        };
        drawingBufferWidth?: number;
        drawingBufferHeight?: number;
        getPixelRatio?: () => number;
      };
      return {
        name: e.name,
        calls: r?.info?.render?.calls ?? -1,
        triangles: r?.info?.render?.triangles ?? -1,
        textures: r?.info?.memory?.textures ?? -1,
        programs: r?.info?.programs?.length ?? -1,
        width: r?.drawingBufferWidth ?? -1,
        height: r?.drawingBufferHeight ?? -1,
        pixelRatio: r?.getPixelRatio?.() ?? -1,
      };
    });

    return {
      fps,
      avgFrameMs: Math.round(avg * 100) / 100,
      p95FrameMs: Math.round(p95 * 100) / 100,
      longTasks: this.longTasks,
      jsCost: Object.fromEntries(
        Object.entries(this.jsCost).map(([k, v]) => [k, Math.round(v * 100) / 100])
      ),
      canvases,
      gl,
    };
  }
}

declare global {
  interface Window {
    __perf?: {
      report: () => PerfReport;
      addJsCost: (name: string, ms: number) => void;
      registerGl: (name: string, renderer: unknown) => void;
      registerScene: (name: string, scene: unknown, renderer: unknown) => void;
      objects: (
        name?: string
      ) => { id: number; type: string; path: string; visible: boolean }[];
      set: (match: string, visible: boolean, name?: string) => number;
      census: (name?: string) => {
        key: string; draws: number; visibleDraws: number;
        trisPerDraw: number; trisPerFrame: number; matType: string;
      }[];
      setMeta: (name: string, value: unknown) => void;
      meta: () => Record<string, unknown>;
      scene: (name?: string) => unknown;
    };
  }
}

let probe: PerfProbe | null = null;

/** Call once at startup. No-op unless the URL has ?perf=1. */
export function initPerfProbe(): boolean {
  if (probe || typeof window === "undefined") return false;
  const active = new URLSearchParams(window.location.search).has("perf");
  if (!active) return false;
  probe = new PerfProbe();
  window.__perf = {
    report: () => probe!.report(),
    addJsCost: (n, ms) => probe!.addJsCost(n, ms),
    registerGl: (n, r) => probe!.registerGl(n, r),
    registerScene: (n, sc, r) => probe!.registerScene(n, sc, r),
    objects: (n) => probe!.objects(n),
    set: (m, v, n) => probe!.set(m, v, n),
    census: (n) => probe!.census(n),
    setMeta: (n, v) => probe!.setMeta(n, v),
    meta: () => probe!.getMeta(),
    scene: (n) => probe!.scene(n),
  };
  return true;
}

/** Report this frame's JS cost from a render loop (no-op when probe off). */
export function reportFrameCost(name: string, ms: number) {
  window.__perf?.addJsCost(name, ms);
}

/** Stash instrumentation data (no-op when probe off). */
export function reportPerfMeta(name: string, value: unknown) {
  window.__perf?.setMeta(name, value);
}

/** Register a three.js renderer with the probe (no-op when probe off). */
export function registerPerfGl(name: string, renderer: unknown) {
  window.__perf?.registerGl(name, renderer);
}

/**
 * Register a scene + renderer for runtime subsystem muting (no-op when
 * the probe is off). Used by the perf harness to attribute frame cost
 * to individual branches of the walk: mute one, re-measure.
 */
export function registerPerfScene(name: string, scene: unknown, renderer: unknown) {
  window.__perf?.registerScene(name, scene, renderer);
}
