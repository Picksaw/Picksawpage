/**
 * Template preview image config.
 * Uses the Vite base path so WAMP/subfolder deployments do not accidentally
 * request `/images/...` from the domain root.
 */
const base = import.meta.env.BASE_URL;

export const TEMPLATE_IMAGE_MAP: Record<string, string> = {
  verda: `${base}images/verda.webp`,
  lumina: `${base}images/lumina.webp`,
  clarity: `${base}images/clarity.webp`,
  pulse: `${base}images/pulse.webp`,
  aurora: `${base}images/aurora.webp`,
  lumen: `${base}images/lumen.webp`,
} as const;
