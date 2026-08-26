/**
 * The wetness model.
 *
 * A soaked city is not "the same materials, darker". Water changes
 * surfaces in four specific, physically-grounded ways, and doing all
 * four is what separates "rainy" from "wet":
 *
 *   1  ALBEDO DARKENS. A water film traps light by internal reflection,
 *      so diffuse reflectance drops — porous materials (concrete) drop
 *      far more than sealed ones (marble).
 *   2  ROUGHNESS COLLAPSES. Water fills the microsurface. Rough
 *      concrete goes from 0.9 to nearly mirror-smooth where it pools.
 *   3  SPECULAR RISES. A water film has IOR 1.33 over the substrate,
 *      which lifts F0 and makes grazing angles blaze.
 *   4  IT POOLS UNEVENLY. Water collects in low spots and runs down
 *      vertical faces in streaks. Uniform wetness reads as plastic.
 *
 * This module supplies the GLSL that implements all four, so every
 * surface in the district — road, sidewalk, façades, props — can share
 * one consistent water response.
 */

/**
 * Shared GLSL: procedural puddle mask + the wetness BRDF adjustment.
 * Inject into any material's fragment shader before `main`.
 */
export const WETNESS_GLSL = /* glsl */ `
  // ── hash / noise ──
  float wetHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float wetNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(wetHash(i), wetHash(i + vec2(1.0, 0.0)), f.x),
      mix(wetHash(i + vec2(0.0, 1.0)), wetHash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }
  float wetFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * wetNoise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  /**
   * Puddle mask in world XZ. Returns 0..1 depth of standing water.
   * Puddles are large low-frequency basins with eroded edges — never
   * circles, never a repeating tile.
   */
  float puddleMask(vec2 worldXZ, float wetness) {
    float basin = wetFbm(worldXZ * 0.055);
    float detail = wetFbm(worldXZ * 0.31);
    // low ground holds water; the threshold falls as the storm soaks in
    float level = mix(0.62, 0.4, wetness);
    float d = smoothstep(level, level - 0.16, basin - detail * 0.12);
    return clamp(d, 0.0, 1.0);
  }

  /**
   * Vertical water streaks for facades and props. The "up" argument is
   * how vertical the surface is (1 = wall, 0 = floor).
   */
  float rainStreaks(vec2 uv, float up, float time) {
    float columns = wetNoise(vec2(uv.x * 42.0, 0.0));
    float flow = wetFbm(vec2(uv.x * 26.0, uv.y * 3.2 - time * 0.06));
    float streak = smoothstep(0.45, 0.9, columns) * flow;
    // streaks gather toward the bottom of a face
    streak *= mix(0.35, 1.0, 1.0 - uv.y);
    return streak * up;
  }

  /**
   * Apply water to a surface.
   *   albedo     in/out diffuse colour
   *   roughness  in/out
   *   f0         in/out specular reflectance at normal incidence
   *   wet        0..1 how wet this pixel is (puddle depth or film)
   *   porosity   0..1 how much this material darkens (concrete high,
   *              polished stone low)
   */
  void applyWetness(inout vec3 albedo, inout float roughness, inout float f0,
                    float wet, float porosity) {
    // 1 — porous materials darken far more than sealed ones
    albedo *= mix(1.0, mix(0.72, 0.34, porosity), wet);
    // 2 — water fills the microsurface
    roughness = mix(roughness, mix(roughness * 0.35, 0.045, wet), wet);
    roughness = clamp(roughness, 0.02, 1.0);
    // 3 — a water film sits at IOR 1.33 → F0 ≈ 0.02, but the film is
    //     smooth so the *apparent* specular rises sharply
    f0 = mix(f0, 0.045, wet);
  }
`;

/** Porosity per material family — how much water darkens it. */
export const POROSITY = {
  asphalt: 0.85,
  concrete: 0.78,
  brick: 0.72,
  marble: 0.22,
  glass: 0.05,
  metal: 0.15,
  paint: 0.35,
} as const;

/**
 * Base PBR values, DRY. The wetness model moves these; nothing should
 * hard-code a wet value, or the district cannot dry out for the
 * observatory finale.
 */
export const DRY_MATERIALS = {
  asphalt: { roughness: 0.92, metalness: 0.0, f0: 0.04 },
  concrete: { roughness: 0.88, metalness: 0.0, f0: 0.035 },
  marble: { roughness: 0.24, metalness: 0.02, f0: 0.05 },
  glass: { roughness: 0.06, metalness: 0.0, f0: 0.08 },
  metal: { roughness: 0.38, metalness: 0.9, f0: 0.9 },
  paintedMetal: { roughness: 0.45, metalness: 0.35, f0: 0.06 },
} as const;
