/**
 * Shared pixel-budget policy for the fullscreen journey canvases
 * (home walk + about walk).
 *
 * Why this exists: the FPS optimization pass pinned the WebGL backing
 * store to a fixed ≤1.25× render scale. That is invisible on a 1×
 * desktop monitor, but phones pack 2–3.5 device pixels per CSS pixel,
 * so the browser upscaled the canvas 2–3× and the whole site — city,
 * paintings, ghost cards — looked out of focus.
 *
 * The caps track the device instead of fighting it:
 *
 *  - Touch devices  → up to 2× (true retina sharpness; devices with
 *    dpr 3+ still save 33%+ of fill versus native).
 *  - Fine-pointer   → up to 1.75× so retina laptops are crisp too,
 *    while plain 1× monitors keep the original 1.25 supersample
 *    exactly as before (4K desktops stay fill-rate friendly).
 *
 * ── Adaptive controller (useJourneyDpr) ───────────────────────────
 *
 * The original drei <PerformanceMonitor> had two problems in the
 * field:
 *
 *  1. SLOW REACTION — it only sampled inside the WebGL loop, one fps
 *     average per `ms` window, and it needed a full `iterations`
 *     (6) averages before acting: on a device grinding at 5–10 fps
 *     that is one step every ~3 s, so a retina PC started at 1.75×
 *     crawled down one 0.25 step at a time — the visitor watched a
 *     slideshow for 15–60 s before it recovered. Worse, the probe
 *     only runs when the canvas renders, so "idle" canvases never
 *     declined at all.
 *  2. FLIP-FLOP DEATH — alternating incline/decline increments
 *     `flipped`; after `flipflops` the monitor permanently stops
 *     sampling, stranding whatever scale it happened to be on.
 *
 * This controller samples the *page* frame rate (rAF — includes the
 * storm canvas, DOM and compositing, i.e. what the visitor actually
 * sees) and applies hysteresis:
 *
 *   fps < 46 for ~1 s  → step down 0.25 (≥1.25 in ≥1200 ms windows
 *                        proves itself in a single window)
 *   fps ≥ 57 for ~3 s  → step up 0.10 (never past the sharp cap)
 *   46–57 fps          → hold — no oscillation, no realloc thrash
 *   floor               → 1.0 (native CSS resolution, never pixelated)
 *
 * A strong device sits at its sharp cap forever (the incline is a
 * no-op there); a weak device sheds scale in ~2–4 s instead of
 * 15–60 s, and the 46–57 dead-band means it settles once instead of
 * bouncing. Sampling never runs under the intro loader, so the
 * loader's own animation can't drag the scale down.
 */

import { useEffect, useRef, useState } from "react";

/** Lowest render scale the adaptive controller may descend to. */
export const JOURNEY_DPR_MIN = 1;

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
const DECLINE_GAP_MS = 700; // min gap between two scale changes
const INCLINE_GAP_MS = 3000; // extra patience before re-sharpening
const STEP_DOWN = 0.25;
const STEP_UP = 0.1;

const round2 = (v: number) => Math.round(v * 100) / 100;

function isCoarse(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
  );
}

/**
 * Adaptive render scale for the journey canvases.
 *
 * @param active  false while the intro loader covers the canvas (or the
 *                canvas would otherwise be idle) — sampling is suspended,
 *                the last chosen scale is kept.
 */
export function useJourneyDpr(active: boolean): number {
  const maxRef = useRef<number | null>(null);
  if (maxRef.current === null) maxRef.current = journeyDprMax(isCoarse());
  const max = maxRef.current;

  const [dpr, setDpr] = useState(max);

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
        // dead band — hold the current scale
        bad = 0;
        good = 0;
      }

      if (bad >= BAD_WINDOWS && now - lastChange >= DECLINE_GAP_MS) {
        setDpr((d) => Math.max(JOURNEY_DPR_MIN, round2(d - STEP_DOWN)));
        lastChange = now;
        bad = 0;
      } else if (good >= GOOD_WINDOWS && now - lastChange >= INCLINE_GAP_MS) {
        setDpr((d) => Math.min(max, round2(d + STEP_UP)));
        lastChange = now;
        good = 0;
      }
    };

    resetWindow();
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, max]);

  return dpr;
}
