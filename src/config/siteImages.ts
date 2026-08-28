/**
 * Site image assets config.
 * Change file paths here; replace actual files in public/images/ locally.
 * After npm build, Vite copies public/images/ to dist/, so images load.
 */
const base = import.meta.env.BASE_URL;

export const SITE_IMAGES = {
  logo: `${base}images/picksaw-logo.png`,
  icon: `${base}images/picksaw-icon.png`,
  gameIcon: `${base}images/stormblade-icon.png`,
} as const;
