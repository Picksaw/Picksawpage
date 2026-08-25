/**
 * stormEvents — tiny decoupled event layer.
 * The storm canvas dispatches lightning/storm-level events on window;
 * the soundscape engine and the floating dock orb react to them
 * without any direct imports between them.
 */

export const LIGHTNING_EVENT = "picksaw:lightning";
export const STORM_LEVEL_EVENT = "picksaw:stormlevel";

export function dispatchLightning(intensity: number) {
  window.dispatchEvent(
    new CustomEvent(LIGHTNING_EVENT, { detail: { intensity } })
  );
}

export function dispatchStormLevel(level: number) {
  window.dispatchEvent(
    new CustomEvent(STORM_LEVEL_EVENT, { detail: { level } })
  );
}

export function onLightning(cb: (intensity: number) => void) {
  const handler = (e: Event) =>
    cb((e as CustomEvent<{ intensity: number }>).detail?.intensity ?? 0.7);
  window.addEventListener(LIGHTNING_EVENT, handler);
  return () => window.removeEventListener(LIGHTNING_EVENT, handler);
}

export function onStormLevel(cb: (level: number) => void) {
  const handler = (e: Event) =>
    cb((e as CustomEvent<{ level: number }>).detail?.level ?? 0);
  window.addEventListener(STORM_LEVEL_EVENT, handler);
  return () => window.removeEventListener(STORM_LEVEL_EVENT, handler);
}
