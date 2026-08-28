/** WebGL/performance probes (cached) — used by rich 3D entry points. */
let cachedWebGl: boolean | null = null;

export function hasWebGL(): boolean {
  if (cachedWebGl !== null) return cachedWebGl;
  try {
    const c = document.createElement("canvas");
    cachedWebGl = !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    cachedWebGl = false;
  }
  return cachedWebGl;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Touch/narrow devices can render WebGL at rest but often lose frames badly
 * while the browser is also doing momentum scrolling/compositing. Keep the
 * scroll-driven 3D journey for desktop-class input and serve the lightweight
 * native page to phones/tablets.
 */
export function isMobileLikeDevice(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  return coarse || noHover || narrow || navigator.maxTouchPoints > 0;
}

/** Conservative hardware hint for devices that usually share mobile GPUs. */
export function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory !== undefined && nav.deviceMemory <= 2;
}

export function shouldUseRichJourney(): boolean {
  // Check cheap media/hardware guards first so mobile never even opens a
  // probe WebGL context during startup.
  return !prefersReducedMotion() && !isMobileLikeDevice() && !isLowPowerDevice() && hasWebGL();
}
