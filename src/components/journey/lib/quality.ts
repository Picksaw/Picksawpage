/**
 * Quality tiers — one place that decides how heavy the city is allowed
 * to be on this device.
 *
 *   high    desktop dGPU        90–120 fps target
 *   mid     desktop iGPU        60 fps target
 *   low     laptop / weak iGPU  45–60 fps target
 *   mobile  phones & tablets    30 fps target, simplified scene
 *
 * Detection is done once, synchronously, before the Canvas mounts, so
 * every system can size its buffers correctly on first build. Nothing
 * ever resizes a buffer mid-flight; the adaptive layer only touches DPR
 * and a couple of cheap toggles.
 */

export type Tier = "mobile" | "low" | "mid" | "high";

export interface Quality {
  tier: Tier;
  /** simplified scene: fewer systems, cheaper shaders, no post FX stack */
  simplified: boolean;
  isMobile: boolean;
  reducedMotion: boolean;

  /**
   * [min, max] device pixel ratio — the adaptive loop moves inside this.
   *
   * The ceiling is a MEMORY decision as much as a sharpness one: the
   * post-processing buffers are RGBA16F at the full backing resolution,
   * so cost grows with the square of DPR. Above ~1.5 the render targets
   * alone run to hundreds of megabytes.
   */
  dpr: [number, number];
  antialias: boolean;

  shadows: boolean;
  shadowMapSize: number;
  /** how far the moon shadow camera reaches, in metres */
  shadowDistance: number;

  postprocessing: boolean;
  bloom: boolean;
  /**
   * Screen-space AO is permanently off and the flag is kept only so the
   * tier table stays readable. SSAO requires a NormalPass, which
   * re-renders the whole scene with an override material and destroys
   * every custom shader in the district. See the note in PostFX.tsx.
   */
  ssao: false;
  chromaticAberration: boolean;

  /** rain drop budget (GPU instanced streaks) */
  rainDrops: number;
  splashes: number;
  /** atmospheric fog card budget across all depth layers */
  fogCards: number;
  /** ambient particle budget (dust / spray / debris / insects) */
  ambientParticles: number;

  /** how many depth rows of real buildings flank the street */
  buildingRows: number;
  /** procedural far skyline behind the district */
  skyline: boolean;
  /** environment props: cables, pipes, benches, AC units… */
  props: boolean;
  propDensity: number;
  /** volumetric light cones on street lamps */
  volumetricCones: boolean;
  /** screen-space-ish puddle reflections */
  puddles: boolean;
  /** number of real-time point lights allowed in the moving light pool */
  lightPool: number;
  /** metres of view distance before the fog fully hides geometry */
  viewDistance: number;
}

const BASE: Quality = {
  tier: "high",
  simplified: false,
  isMobile: false,
  reducedMotion: false,
  dpr: [1, 1.5],
  antialias: true,
  shadows: true,
  shadowMapSize: 2048,
  shadowDistance: 120,
  postprocessing: true,
  bloom: true,
  ssao: false,
  chromaticAberration: true,
  rainDrops: 9000,
  splashes: 900,
  fogCards: 620,
  ambientParticles: 900,
  buildingRows: 4,
  skyline: true,
  props: true,
  propDensity: 1,
  volumetricCones: true,
  puddles: true,
  lightPool: 8,
  viewDistance: 320,
};

const PRESETS: Record<Tier, Quality> = {
  high: BASE,
  mid: {
    ...BASE,
    tier: "mid",
    dpr: [1, 1.35],
    shadowMapSize: 1536,
    shadowDistance: 90,
    ssao: false,
    rainDrops: 5200,
    splashes: 520,
    fogCards: 380,
    ambientParticles: 520,
    buildingRows: 3,
    propDensity: 0.75,
    lightPool: 6,
    viewDistance: 260,
  },
  low: {
    ...BASE,
    tier: "low",
    dpr: [0.85, 1.3],
    antialias: false,
    shadowMapSize: 1024,
    shadowDistance: 60,
    ssao: false,
    chromaticAberration: false,
    rainDrops: 3000,
    splashes: 260,
    fogCards: 240,
    ambientParticles: 280,
    buildingRows: 2,
    propDensity: 0.5,
    volumetricCones: true,
    puddles: false,
    lightPool: 4,
    viewDistance: 200,
  },
  mobile: {
    ...BASE,
    tier: "mobile",
    simplified: true,
    isMobile: true,
    dpr: [0.75, 1.35],
    antialias: false,
    shadows: false,
    shadowMapSize: 512,
    shadowDistance: 40,
    postprocessing: true,
    bloom: true,
    ssao: false,
    chromaticAberration: false,
    rainDrops: 1800,
    splashes: 0,
    fogCards: 150,
    ambientParticles: 140,
    buildingRows: 2,
    skyline: true,
    props: true,
    propDensity: 0.3,
    volumetricCones: false,
    puddles: false,
    lightPool: 3,
    viewDistance: 170,
  },
};

function gpuHint(): { renderer: string; weak: boolean } {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return { renderer: "", weak: true };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "")
      : String(gl.getParameter(gl.RENDERER) ?? "");
    const r = renderer.toLowerCase();
    const weak =
      /swiftshader|llvmpipe|software|mesa offscreen|microsoft basic/.test(r) ||
      /intel.*(hd|uhd) graphics (6|5|4)/.test(r);
    return { renderer, weak };
  } catch {
    return { renderer: "", weak: false };
  }
}

let cached: Quality | null = null;

export function detectQuality(): Quality {
  if (cached) return cached;

  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const narrow = typeof window !== "undefined" && window.innerWidth < 820;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cores = (navigator.hardwareConcurrency as number | undefined) ?? 4;
  const mem =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const { renderer, weak } = gpuHint();
  const r = renderer.toLowerCase();

  let tier: Tier;
  if (coarse && narrow) {
    tier = "mobile";
  } else if (weak || cores <= 2 || mem <= 2) {
    tier = "low";
  } else if (/rtx|radeon rx|geforce (gtx )?(1[6-9]|[2-9]\d)|apple m[1-9]|arc a/.test(r)) {
    tier = cores >= 8 ? "high" : "mid";
  } else if (/intel|uhd|iris|adreno|mali|apple gpu/.test(r)) {
    tier = cores >= 8 ? "mid" : "low";
  } else {
    tier = cores >= 8 && mem >= 8 ? "high" : cores >= 4 ? "mid" : "low";
  }

  const q: Quality = { ...PRESETS[tier], reducedMotion, isMobile: coarse };

  // Reduced motion never means "ugly" — it means calm. Keep the visuals,
  // drop the movement-heavy systems.
  if (reducedMotion) {
    q.rainDrops = Math.min(q.rainDrops, 1200);
    q.ambientParticles = Math.min(q.ambientParticles, 120);
    q.chromaticAberration = false;
  }

  cached = q;
  return q;
}

/** Test seam / dev-panel override. */
export function overrideQuality(tier: Tier | null) {
  cached = tier ? { ...PRESETS[tier], reducedMotion: cached?.reducedMotion ?? false } : null;
}
