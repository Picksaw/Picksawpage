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

/** Touch/narrow detector used by individual effects to lower quality. */
export function isMobileLikeDevice(): boolean {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const noHover = window.matchMedia("(hover: none)").matches;
  const narrow = window.matchMedia("(max-width: 767px)").matches;
  return coarse || noHover || narrow || navigator.maxTouchPoints > 0;
}

/** Conservative hardware hint for devices that usually struggle with WebGL. */
export function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return nav.deviceMemory !== undefined && nav.deviceMemory <= 2;
}

export function shouldUseRichJourney(): boolean {
  // Mobile keeps the 3D look; only fall back when motion is reduced or WebGL
  // is unavailable.
  return !prefersReducedMotion() && hasWebGL();
}
