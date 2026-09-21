/**
 * Smart Local & Remote Image Path Resolver
 * 
 * Ensures that whether an image is specified as "/images/hero.webp",
 * "images/hero.webp", "hero.webp", or a remote URL, it resolves correctly
 * in dev, preview, production build, and sub-directory deployments.
 */

export function resolveImagePath(pathStr?: string): string {
  if (!pathStr || typeof pathStr !== 'string') return '';
  const trimmed = pathStr.trim();
  if (!trimmed) return '';

  // Return remote URLs and data URIs directly
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Get Vite's base URL (defaults to '/')
  const metaEnv = (import.meta as unknown as { env?: { BASE_URL?: string } }).env;
  const baseUrl = metaEnv?.BASE_URL || '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Standardize path: if user passed "/images/hero.webp" or "hero.webp"
  let cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  // If path doesn't start with "images/" and doesn't contain a slash, check if it's an image name
  if (!cleanPath.includes('/') && /\.(webp|jpg|jpeg|png|svg|avif|gif)$/i.test(cleanPath)) {
    cleanPath = `images/${cleanPath}`;
  }

  return `${cleanBase}${cleanPath}`;
}

/**
 * Generates an array of fallback candidate URLs to try in order.
 * e.g., for "doctor.webp" -> ["/images/doctor.webp", "/images/doctor.jpg", "/images/doctor.png", fallbackSrc]
 */
export function getImageCandidates(
  src?: string,
  webpSrc?: string,
  fallbackSrc?: string
): string[] {
  const candidates: string[] = [];

  const addCandidate = (p?: string) => {
    if (!p) return;
    const resolved = resolveImagePath(p);
    if (resolved && !candidates.includes(resolved)) {
      candidates.push(resolved);
    }
  };

  // 1. If webpSrc is explicitly provided, prioritize WebP for maximum speed
  if (webpSrc) {
    addCandidate(webpSrc);
  }

  // 2. Primary src
  if (src) {
    addCandidate(src);
  }

  // 3. If a local path was given (e.g., "/images/doctor.webp"), auto-generate common extension variants
  const primary = webpSrc || src || '';
  if (primary && !primary.startsWith('http') && !primary.startsWith('data:')) {
    const basePath = primary.replace(/\.(webp|jpg|jpeg|png|avif)$/i, '');
    addCandidate(`${basePath}.webp`);
    addCandidate(`${basePath}.jpg`);
    addCandidate(`${basePath}.png`);
    addCandidate(`${basePath}.jpeg`);
  }

  // 4. Remote or static fallback source if local file is missing
  if (fallbackSrc) {
    addCandidate(fallbackSrc);
  }

  return candidates;
}
