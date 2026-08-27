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

class PerfProbe {
  private frames = 0;
  private last = 0;
  private lastReport = 0;
  private raf = 0;
  private longTasks = 0;
  private jsCost: Record<string, number> = {};
  private glEntries: GlEntry[] = [];
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
  };
  return true;
}

/** Report this frame's JS cost from a render loop (no-op when probe off). */
export function reportFrameCost(name: string, ms: number) {
  window.__perf?.addJsCost(name, ms);
}

/** Register a three.js renderer with the probe (no-op when probe off). */
export function registerPerfGl(name: string, renderer: unknown) {
  window.__perf?.registerGl(name, renderer);
}
