import type Lenis from "lenis";

/**
 * Lenis singleton — smooth scroll spine of the site.
 * Initialized once in App; anything that needs programmatic
 * scrolling (CTAs, skip links) goes through here.
 */
let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

export function getLenis() {
  return lenis;
}

export function scrollToTarget(target: string | HTMLElement, offset = -96) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 });
    return;
  }
  // Fallback (reduced motion / no lenis yet)
  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}
