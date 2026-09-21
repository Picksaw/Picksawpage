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
 * The policy now tracks the device instead of fighting it:
 *
 *  - Touch devices  → up to 2× (true retina sharpness; devices with
 *    dpr 3+ still save 33%+ of fill versus native).
 *  - Fine-pointer   → up to 1.75× so retina laptops are crisp too,
 *    while plain 1× monitors keep the original 1.25 supersample
 *    exactly as before (4K desktops stay fill-rate friendly).
 *
 * Every FPS optimization is kept: the drei <PerformanceMonitor> still
 * walks the backing store DOWN the moment the framerate dips and back
 * up when there is headroom — it simply starts from a sharp ceiling
 * now. The floor is 1.0 (native CSS resolution): a genuine emergency
 * mode for weak GPUs that never looks pixelated.
 */

/** Lowest render scale the adaptive monitor may descend to. */
export const JOURNEY_DPR_MIN = 1;

/** Highest render scale the adaptive monitor may climb to. */
export function journeyDprMax(isCoarsePointer: boolean): number {
  if (typeof window === "undefined") return 1.25;
  const device = window.devicePixelRatio || 1;
  return isCoarsePointer
    ? Math.min(Math.max(device, 1), 2)
    : Math.min(Math.max(device, 1.25), 1.75);
}
