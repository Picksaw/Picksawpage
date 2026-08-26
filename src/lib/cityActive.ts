/**
 * cityActive — is the 3D district currently painting the whole frame?
 *
 * The original site paints a full-screen 2D storm canvas behind
 * everything. When the WebGL city is up it covers that canvas
 * completely, so keeping it animating is pure waste: two opaque
 * full-screen layers compositing every frame, one of them a 2D context
 * redrawing thousands of rain segments.
 *
 * The city raises this flag while it owns the frame; StormBackground
 * parks itself in response and resumes the moment the city stands down
 * (reduced motion, no WebGL, the /feed route, or the end of the walk).
 */

type Listener = (active: boolean) => void;

let active = false;
const listeners = new Set<Listener>();

export function isCityActive() {
  return active;
}

export function setCityActive(next: boolean) {
  if (active === next) return;
  active = next;
  for (const l of listeners) l(active);
}

export function subscribeCityActive(l: Listener) {
  listeners.add(l);
  l(active);
  return () => {
    listeners.delete(l);
  };
}
