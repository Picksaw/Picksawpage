/**
 * Shared render-quality policy for the fullscreen journey canvases
 * (home walk + about walk).
 *
 * ── Resolution ────────────────────────────────────────────────
 * The caps track the device instead of fighting it:
 *  - Touch devices  → up to 2× (true retina sharpness; dpr 3+ phones
 *    still save 33%+ of fill versus native).
 *  - Fine-pointer   → up to 1.75× so retina laptops are crisp, while a
 *    plain 1× monitor keeps the original 1.25 supersample exactly.
 *
 * ── Adaptive controller (useJourneyQuality) ───────────────────
 * Two axes, ordered by how little you notice them:
 *
 *   1. `dpr`      backing-store scale, from the sharp cap down to 1.0
 *                 (native CSS pixels — never below, so the picture is
 *                 never upscaled).
 *   2. `lodBias`  multiplier on the city's LOD switch distances. At 1.0
 *                 a building only swaps to a simpler mesh once its
 *                 measured deviation is under half a pixel; below 1.0 it
 *                 swaps sooner, trading a pixel or two of geometry
 *                 detail for frames. This is the axis a weak machine
 *                 spends once resolution has run out.
 *
 * Declining spends dpr first, then lodBias; recovering gives them back
 * in the opposite order. A strong device therefore sits at its sharp
 * cap with a bias of 1.0 forever — both inclines are no-ops there.
 *
 * Sampling uses the *page* frame rate (rAF), so it sees the storm
 * canvas, the DOM and compositing too — what the visitor actually
 * experiences — rather than only the WebGL loop. Hysteresis:
 *
 *   fps < 46 for ~1 s  → step down
 *   fps ≥ 57 for ~3 s  → step up
 *   46–57 fps          → hold — no oscillation, no realloc thrash
 *
 * Sampling never runs under the intro loader, so the loader's own
 * animation cannot drag quality down.
 *
 * ── Software rendering ────────────────────────────────────────
 * A browser with GPU acceleration unavailable (or a GPU on the
 * blocklist) rasterises WebGL on the CPU. That is 10–50× slower and no
 * amount of adaptation starting from the top gets there in time, so it
 * is detected up front from the renderer string and the controller
 * starts at the bottom tier instead of crawling down for 15 seconds.
 */

import { useEffect, useRef, useState } from "react";

/** Lowest render scale the adaptive controller may descend to. */
export const JOURNEY_DPR_MIN = 1;

/** Floor allowed only when WebGL is being software-rasterised: there,
 *  holding a frame rate matters more than the last pixel of sharpness. */
export const JOURNEY_DPR_MIN_SOFTWARE = 0.75;

/** Highest render scale the adaptive controller may climb to. */
export function journeyDprMax(isCoarsePointer: boolean): number {
  if (typeof window === "undefined") return 1.25;
  const device = window.devicePixelRatio || 1;
  return isCoarsePointer
    ? Math.min(Math.max(device, 1), 2)
    : Math.min(Math.max(device, 1.25), 1.75);
}

/* ── controller tuning ─────────────────────────────────────────── */

const SAMPLE_MS = 500; // one fps window
const DECLINE_FPS = 46; // below this the page is not holding ~60
const INCLINE_FPS = 57; // at/above this we have real headroom
const BAD_WINDOWS = 2; // ~1 s of sustained bad fps before stepping down
const LONG_WINDOW_MS = 1200; // …a single this-long bad window is proof enough
const GOOD_WINDOWS = 6; // ~3 s of sustained good fps before stepping up
const DECLINE_GAP_MS = 700; // min gap between two quality changes
const INCLINE_GAP_MS = 3000; // extra patience before giving quality back
const DPR_STEP_DOWN = 0.25;
const DPR_STEP_UP = 0.1;
const BIAS_MIN = 0.25;
const BIAS_STEP_DOWN = 0.25;
const BIAS_STEP_UP = 0.15;

const round2 = (v: number) => Math.round(v * 100) / 100;

function isCoarse(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/* ── software rendering detection ──────────────────────────────── */

const SOFTWARE_MARKERS = [
  "swiftshader",
  "software",
  "llvmpipe",
  "softpipe",
  "basic renderers",
  "microsoft basic",
  "warp",
];

let softwareCache: boolean | null = null;

/**
 * True when the browser is rasterising WebGL on the CPU. Read once from
 * the unmasked renderer string; returns false if the extension is
 * unavailable, which is the safe answer (assume a real GPU).
 */
export function isSoftwareRendering(gl?: WebGLRenderingContext | null): boolean {
  if (softwareCache !== null) return softwareCache;
  let ctx: WebGLRenderingContext | null = gl ?? null;
  if (!ctx && typeof document !== "undefined") {
    try {
      ctx = document
        .createElement("canvas")
        .getContext("webgl2") as WebGLRenderingContext | null;
    } catch {
      ctx = null;
    }
  }
  if (!ctx) return (softwareCache = false);
  let owned = false;
  try {
    if (!gl) owned = true;
    const ext = ctx.getExtension("WEBGL_debug_renderer_info");
    const name = String(
      ext
        ? ctx.getParameter(ext.UNMASKED_RENDERER_WEBGL)
        : ctx.getParameter(ctx.RENDERER),
    ).toLowerCase();
    softwareCache = SOFTWARE_MARKERS.some((m) => name.includes(m));
  } catch {
    softwareCache = false;
  }
  // A probe context is a real GPU resource and browsers cap how many a
  // page may hold — release it as soon as the string has been read.
  if (owned) {
    try {
      ctx.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      /* nothing to do */
    }
  }
  return softwareCache;
}

export interface JourneyQuality {
  dpr: number;
  /** Multiplier on the city's LOD switch distances. 1 = pixel-exact. */
  lodBias: number;
  /** WebGL is being software-rasterised. */
  software: boolean;
}

/**
 * Adaptive quality for the journey canvases.
 *
 * @param active  false while the intro loader covers the canvas (or the
 *                canvas would otherwise be idle) — sampling is
 *                suspended and the last chosen quality is kept.
 * @param gl      the renderer's context, for software detection.
 */
export function useJourneyQuality(
  active: boolean,
  gl?: WebGLRenderingContext | null,
): JourneyQuality {
  const maxRef = useRef<number | null>(null);
  const softRef = useRef<boolean | null>(null);
  if (maxRef.current === null) maxRef.current = journeyDprMax(isCoarse());
  if (softRef.current === null) softRef.current = isSoftwareRendering(gl);
  const max = maxRef.current;
  const software = softRef.current;
  const dprMin = software ? JOURNEY_DPR_MIN_SOFTWARE : JOURNEY_DPR_MIN;

  // A CPU rasteriser never reaches the sharp cap — start at the tier it
  // can actually hold instead of spending 15 s discovering that.
  const [dpr, setDpr] = useState(software ? dprMin : max);
  const [lodBias, setLodBias] = useState(software ? BIAS_MIN : 1);

  useEffect(() => {
    if (!active) return;

    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();
    let lastChange = performance.now() + 1500; // grace after activation
    let bad = 0;
    let good = 0;
    let warmup = true;

    const resetWindow = () => {
      frames = 0;
      windowStart = performance.now();
      bad = 0;
      good = 0;
      warmup = true;
      lastChange = performance.now() + 800;
    };

    const onVisibility = () => {
      // returning from a hidden tab must not look like 0 fps
      if (!document.hidden) resetWindow();
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) {
        windowStart = performance.now();
        frames = 0;
        return;
      }
      frames++;
      const now = performance.now();
      const elapsed = now - windowStart;
      if (elapsed < SAMPLE_MS) return;

      const fps = (frames * 1000) / elapsed;
      frames = 0;
      windowStart = now;

      if (warmup) {
        // first window after activation — asset streaming / first paint
        warmup = false;
        return;
      }

      if (fps < DECLINE_FPS) {
        // one very long window (a few frames over >1.2 s) already
        // proves the page cannot hold 60 — don't wait for a second
        bad += elapsed >= LONG_WINDOW_MS ? 2 : 1;
        good = 0;
      } else if (fps >= INCLINE_FPS) {
        good++;
        bad = 0;
      } else {
        // dead band — hold the current quality
        bad = 0;
        good = 0;
      }

      if (bad >= BAD_WINDOWS && now - lastChange >= DECLINE_GAP_MS) {
        lastChange = now;
        bad = 0;
        setDpr((d) => {
          if (d > dprMin) return Math.max(dprMin, round2(d - DPR_STEP_DOWN));
          // resolution exhausted — spend geometry detail instead
          setLodBias((b) => Math.max(BIAS_MIN, round2(b - BIAS_STEP_DOWN)));
          return d;
        });
      } else if (good >= GOOD_WINDOWS && now - lastChange >= INCLINE_GAP_MS) {
        lastChange = now;
        good = 0;
        setLodBias((b) => {
          if (b < 1) return Math.min(1, round2(b + BIAS_STEP_UP));
          // geometry budget restored — sharpen again
          setDpr((d) => Math.min(max, round2(d + DPR_STEP_UP)));
          return b;
        });
      }
    };

    resetWindow();
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, max, dprMin]);

  return { dpr, lodBias, software };
}
