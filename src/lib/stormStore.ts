/**
 * stormStore — shared mutable storm state with lightweight subscriptions.
 * Avoids React re-renders for per-frame values (level, bolt) while letting
 * the storm canvas, audio engine, and UI read/write one source of truth.
 */

type Listener = () => void;

interface StormState {
  /** 0..1 eased storm intensity driven by scroll */
  level: number;
  /** temporary override (easter egg) — 0..1, or -1 for none */
  override: number;
  /** 0..1 current lightning brightness (spikes and decays) */
  bolt: number;
  /** dev panel visible */
  devMode: boolean;
}

const state: StormState = { level: 0, override: -1, bolt: 0, devMode: false };
const listeners = new Set<Listener>();

export function getStorm() {
  return state;
}

/** Effective storm intensity (override wins while active). */
export function stormIntensity() {
  return state.override >= 0 ? state.override : state.level;
}

function emit() {
  for (const l of listeners) l();
}

export function subscribeStorm(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function setStormLevel(level: number) {
  state.level = level;
  emit();
}

/** Easter egg / dev override. Pass -1 to clear. Auto-clears after ms. */
export function setStormOverride(value: number, autoClearMs = 0) {
  state.override = value;
  emit();
  if (value >= 0 && autoClearMs > 0) {
    window.setTimeout(() => {
      if (state.override === value) {
        state.override = -1;
        emit();
      }
    }, autoClearMs);
  }
}

export function setBolt(v: number) {
  state.bolt = v;
}

export function setDevMode(on: boolean) {
  state.devMode = on;
  emit();
}
