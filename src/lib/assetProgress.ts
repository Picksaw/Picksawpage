/**
 * assetProgress — a tiny store that feeds the detailed loading screen.
 *
 * The 3D city's models (5 GLBs, ~28MB) and the wet-asphalt road set
 * (4×2K JPGs, ~8.5MB) stream in AFTER first paint (see AssetPrimer).
 * Each download reports byte-level progress here; the Loader reads this
 * store (via useSyncExternalStore) to render a real percentage, stage
 * labels and a per-asset breakdown.
 *
 * Zero cost when the 3D journey isn't active (no primer → no entries):
 * the Loader then falls back to a purely visual ramp.
 */
import { useSyncExternalStore } from "react";

export type AssetKey =
  | "azadi"
  | "milad"
  | "skyline"
  | "block"
  | "lowrise"
  | "asphalt";

export interface AssetEntry {
  /** download has started (fetch in flight or already complete) */
  started: boolean;
  /** bytes received so far */
  loaded: number;
  /** total bytes once known (0 = unknown yet) */
  total: number;
  /** fully downloaded AND parsed into the shared loader cache */
  done: boolean;
  /** last byte value that was published (emits are throttled) */
  notified: number;
}

export interface Snapshot {
  version: number;
  coreReady: boolean;
  assets: Record<AssetKey, AssetEntry>;
}

const empty = (): AssetEntry => ({ started: false, loaded: 0, total: 0, done: false, notified: 0 });

/**
 * NOTE: useSyncExternalStore compares snapshots by Object.is, so every
 * emit must publish a NEW top-level snapshot object (the asset entries
 * themselves are mutated in place — that's fine, only the root identity
 * needs to change to trigger re-renders).
 */
let current: Snapshot = {
  version: 0,
  coreReady: false,
  assets: {
    azadi: empty(),
    milad: empty(),
    skyline: empty(),
    block: empty(),
    lowrise: empty(),
    asphalt: empty(),
  },
};

const listeners = new Set<() => void>();

function emit() {
  current = {
    version: current.version + 1,
    coreReady: current.coreReady,
    assets: current.assets,
  };
  for (const l of listeners) l();
}

const state = (): Snapshot => current;

/** The app shell has mounted — the "core" step of the loader is done. */
export function markCoreReady() {
  if (current.coreReady) return;
  current.coreReady = true;
  emit();
}

/** The fetch for this asset is in flight (no byte info yet). */
export function markAssetStarted(key: AssetKey) {
  const a = current.assets[key];
  if (a.started || a.done) return;
  a.started = true;
  emit();
}

export function reportAssetProgress(key: AssetKey, loaded: number, total: number) {
  const a = current.assets[key];
  if (a.done) return;
  a.started = true;
  const prevTotal = a.total;
  if (total > 0) a.total = Math.max(a.total, total);
  a.loaded = Math.max(a.loaded, total > 0 ? Math.min(loaded, total) : loaded);
  // FileLoader emits a progress event per chunk — publish only when the
  // visible position actually moved (~0.4% of the file or 64KB).
  const step = Math.max(64 * 1024, a.total * 0.004);
  if (a.loaded - a.notified < step && a.total === prevTotal) return;
  a.notified = a.loaded;
  emit();
}

export function markAssetDone(key: AssetKey) {
  const a = current.assets[key];
  if (a.done) return;
  a.done = true;
  if (a.total > 0) a.loaded = a.total;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Re-render the caller on every progress update. */
export function useAssetProgress(): Snapshot {
  return useSyncExternalStore(subscribe, state, state);
}

export interface ProgressSummary {
  /** 0..1 across all tracked assets (byte-weighted) */
  fraction: number;
  /** every registered asset fully done */
  allDone: boolean;
  /** nothing registered at all (no 3D journey → synthetic ramp) */
  none: boolean;
  /** some asset is downloading but its total size is unknown */
  indeterminate: boolean;
}

export function summarize(): ProgressSummary {
  let total = 0;
  let loaded = 0;
  let any = false;
  let indeterminate = false;
  for (const key of Object.keys(current.assets) as AssetKey[]) {
    const a = current.assets[key];
    if (!a.started && !a.done) continue;
    any = true;
    if (a.done) {
      // tiny placeholder weight so finished unknown-size assets still count
      total += 1;
      loaded += 1;
    } else if (a.total > 0) {
      total += a.total;
      loaded += a.loaded;
    } else {
      indeterminate = true;
      total += 1;
      loaded += 0.5;
    }
  }
  return {
    fraction: total > 0 ? Math.min(1, loaded / total) : 0,
    allDone: any && loaded >= total,
    none: !any,
    indeterminate,
  };
}
