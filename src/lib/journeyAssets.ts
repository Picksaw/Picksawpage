const base = import.meta.env.BASE_URL;

export const JOURNEY_ROAD_MAPS = {
  // Optimized 1K WebP set: ~430 KB total instead of ~9 MB of 2K JPGs.
  map: `${base}road/optimized/aerial_asphalt_01_diff_1k.webp`,
  normalMap: `${base}road/optimized/aerial_asphalt_01_nor_gl_1k.webp`,
  roughnessMap: `${base}road/optimized/aerial_asphalt_01_rough_1k.webp`,
  aoMap: `${base}road/optimized/aerial_asphalt_01_ao_1k.webp`,
} as const;

export const JOURNEY_ROAD_URLS = Object.values(JOURNEY_ROAD_MAPS);

export const JOURNEY_MODEL_URLS = [
  `${base}milad_tower.glb`,
  `${base}new_york_background_building_1.glb`,
  `${base}realistic_building.glb`,
  `${base}low_rise_wall_to_wall_office_building.glb`,
  `${base}azadi_tower.glb`,
] as const;

const preloaded = new Set<string>();

function addPreload(href: string, as: "image" | "fetch") {
  if (typeof document === "undefined" || preloaded.has(href)) return;
  preloaded.add(href);

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (as === "fetch") link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

/** Warm only the road texture set immediately during the intro loader. */
export function preloadJourneyRoad() {
  for (const href of JOURNEY_ROAD_URLS) {
    addPreload(href, "image");
    // Safari is more reliable at reusing image-decoder cache when an Image
    // object is also created; harmless on Chromium/Firefox.
    const img = new Image();
    img.decoding = "async";
    img.src = href;
  }
}

/** Warm the 3D model requests without importing three/drei into the loader. */
export function preloadJourneyModels() {
  for (const href of JOURNEY_MODEL_URLS) addPreload(href, "fetch");
}
