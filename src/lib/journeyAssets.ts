import { TEMPLATE_IMAGE_MAP } from "../config/templateImages";

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

export type AssetGroupId = "road" | "models" | "gallery" | "audio";

export interface AssetGroupProgress {
  id: AssetGroupId;
  label: string;
  loaded: number;
  total: number;
}

export interface AssetLoadProgress {
  loaded: number;
  total: number;
  ratio: number;
  current: string;
  groups: AssetGroupProgress[];
  errors: string[];
}

interface AssetTask {
  id: string;
  label: string;
  href: string;
  group: AssetGroupId;
  kind: "image" | "fetch";
}

const GROUP_LABELS: Record<AssetGroupId, string> = {
  road: "Wet road textures",
  models: "Neon city buildings",
  gallery: "Template gallery previews",
  audio: "Storm ambience",
};

const TASKS: AssetTask[] = [
  { id: "road-diffuse", label: "Road surface", href: JOURNEY_ROAD_MAPS.map, group: "road", kind: "image" },
  { id: "road-normal", label: "Road rain normals", href: JOURNEY_ROAD_MAPS.normalMap, group: "road", kind: "image" },
  { id: "road-roughness", label: "Road reflections", href: JOURNEY_ROAD_MAPS.roughnessMap, group: "road", kind: "image" },
  { id: "road-ao", label: "Road shadow map", href: JOURNEY_ROAD_MAPS.aoMap, group: "road", kind: "image" },
  { id: "model-milad", label: "Milad tower", href: JOURNEY_MODEL_URLS[0], group: "models", kind: "fetch" },
  { id: "model-ny", label: "New York building", href: JOURNEY_MODEL_URLS[1], group: "models", kind: "fetch" },
  { id: "model-realistic", label: "Realistic tower", href: JOURNEY_MODEL_URLS[2], group: "models", kind: "fetch" },
  { id: "model-lowrise", label: "Low-rise office", href: JOURNEY_MODEL_URLS[3], group: "models", kind: "fetch" },
  { id: "model-azadi", label: "Azadi tower finale", href: JOURNEY_MODEL_URLS[4], group: "models", kind: "fetch" },
  ...Object.entries(TEMPLATE_IMAGE_MAP).map(([key, href]) => ({
    id: `gallery-${key}`,
    label: `${key[0].toUpperCase()}${key.slice(1)} preview`,
    href,
    group: "gallery" as const,
    kind: "image" as const,
  })),
  { id: "audio-rain", label: "Rain loop", href: `${base}audio/rain-loop.ogg`, group: "audio", kind: "fetch" },
];

const preloaded = new Set<string>();
let criticalPromise: Promise<void> | null = null;
let completed = new Set<string>();
let errors: string[] = [];
let lastProgress: AssetLoadProgress = makeProgress("Preparing storm systems");
const subscribers = new Set<(progress: AssetLoadProgress) => void>();

function makeProgress(current: string): AssetLoadProgress {
  const groups = (Object.keys(GROUP_LABELS) as AssetGroupId[]).map((id) => {
    const groupTasks = TASKS.filter((task) => task.group === id);
    return {
      id,
      label: GROUP_LABELS[id],
      loaded: groupTasks.filter((task) => completed.has(task.id)).length,
      total: groupTasks.length,
    };
  });
  const loaded = completed.size;
  const total = TASKS.length;
  return {
    loaded,
    total,
    ratio: total ? loaded / total : 1,
    current,
    groups,
    errors: [...errors],
  };
}

function emit(current: string) {
  lastProgress = makeProgress(current);
  subscribers.forEach((fn) => fn(lastProgress));
}

function addPreload(href: string, as: "image" | "fetch" | "audio") {
  if (typeof document === "undefined" || preloaded.has(href)) return;
  preloaded.add(href);

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (as === "fetch") link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer = 0;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

async function loadImage(task: AssetTask) {
  addPreload(task.href, "image");
  await withTimeout(
    new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = () => {
        const decode = img.decode?.();
        if (decode) decode.then(() => resolve()).catch(() => resolve());
        else resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load ${task.label}`));
      img.src = task.href;
      if (img.complete) resolve();
    }),
    15000,
    task.label,
  );
}

async function loadFetch(task: AssetTask) {
  addPreload(task.href, task.group === "audio" ? "audio" : "fetch");
  await withTimeout(
    fetch(task.href, { cache: "force-cache" }).then((res) => {
      if (!res.ok) throw new Error(`${task.label} returned ${res.status}`);
      // Pull the body now so later GLTF/audio loaders hit a warm HTTP cache.
      return res.arrayBuffer();
    }),
    25000,
    task.label,
  );
}

async function runTask(task: AssetTask) {
  if (completed.has(task.id)) return;
  emit(`Loading ${GROUP_LABELS[task.group]} · ${task.label}`);
  try {
    if (task.kind === "image") await loadImage(task);
    else await loadFetch(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : `Failed to load ${task.label}`;
    errors.push(message);
  } finally {
    completed.add(task.id);
    emit(`Loaded ${task.label}`);
  }
}

async function runWithConcurrency(tasks: AssetTask[], concurrency: number) {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (index < tasks.length) {
      const task = tasks[index++];
      await runTask(task);
    }
  });
  await Promise.all(workers);
}

/** Warm only the road texture set immediately during the intro loader. */
export function preloadJourneyRoad() {
  for (const href of JOURNEY_ROAD_URLS) {
    addPreload(href, "image");
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = href;
  }
}

/** Warm the 3D model requests without importing three/drei into the loader. */
export function preloadJourneyModels() {
  for (const href of JOURNEY_MODEL_URLS) addPreload(href, "fetch");
}

/**
 * Blocks the intro until the Journey's network-heavy assets are warm.
 * The page remains on the ghost card and scrolling stays locked until this
 * resolves, so the first scroll should not reveal missing road/buildings.
 */
export function preloadCriticalSiteAssets(onProgress?: (progress: AssetLoadProgress) => void) {
  if (onProgress) {
    subscribers.add(onProgress);
    onProgress(lastProgress);
  }

  preloadJourneyRoad();
  preloadJourneyModels();

  if (!criticalPromise) {
    emit("Preparing storm systems");
    const road = TASKS.filter((task) => task.group === "road");
    const rest = TASKS.filter((task) => task.group !== "road");
    criticalPromise = (async () => {
      // Road first: it is small, visible early, and should always be ready
      // by the time the loader releases scroll.
      await runWithConcurrency(road, 4);
      await runWithConcurrency(rest, 4);
      emit(errors.length ? "Loaded with cached fallbacks" : "All systems ready");
    })();
  }

  return criticalPromise.finally(() => {
    if (onProgress) subscribers.delete(onProgress);
  });
}
