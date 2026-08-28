/**
 * Site image assets config.
 * Change file paths here; replace actual files in public/images/ locally.
 * After npm build, Vite copies public/images/ to dist/, so images load.
 */
export const SITE_IMAGES = {
  logo: "/images/picksaw-logo.png",
  icon: "/images/picksaw-icon.png",
  gameIcon: "/images/stormblade-icon.png",
} as const;
