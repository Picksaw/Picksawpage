/**
 * themeStore — selected atmosphere ("storm" by default, otherwise a
 * sunrise/sunset × clear/cloudy combination).
 *
 * Mirrors the storm-store pattern: a tiny external store with mutable
 * access + subscriptions, so the 2D canvas, the WebGL world and the DOM
 * chrome all read one source of truth without React re-renders. The
 * selection persists in localStorage and is reflected onto
 * <html data-theme="…"> for the CSS variable layer.
 */

import { useSyncExternalStore } from "react";

export type ThemeId =
  | "storm"
  | "sunrise-clear"
  | "sunrise-cloudy"
  | "sunset-clear"
  | "sunset-cloudy";

export const THEME_EVENT = "picksaw:theme";
const STORAGE_KEY = "picksaw:theme";

const VALID: ThemeId[] = [
  "storm",
  "sunrise-clear",
  "sunrise-cloudy",
  "sunset-clear",
  "sunset-cloudy",
];

function loadInitial(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (raw && VALID.includes(raw)) return raw;
  } catch {
    /* private mode etc. */
  }
  return "storm";
}

let current: ThemeId = loadInitial();

const listeners = new Set<() => void>();

function applyDocument(id: ThemeId) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = id;
  }
}

// Apply before first paint of React (module is imported at startup).
applyDocument(current);

export function getTheme(): ThemeId {
  return current;
}

export function setTheme(id: ThemeId) {
  if (current === id) return;
  current = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  applyDocument(id);
  for (const l of listeners) l();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { id } }));
  }
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React hook — re-renders only when the chosen theme changes. */
export function useThemeId(): ThemeId {
  return useSyncExternalStore(
    subscribeTheme,
    getTheme,
    // SSR snapshot — always storm
    () => "storm" as ThemeId,
  );
}
