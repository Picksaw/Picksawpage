/**
 * Deterministic RNG helpers for the City of Templates.
 *
 * Every piece of the district (building placement, silhouette variation,
 * window seeds, prop scatter) is generated from a fixed seed so the city
 * is identical on every visit and on every device — the layout can be
 * art-directed, not re-rolled.
 */

/** mulberry32 — fast, well-distributed, 32-bit seeded PRNG. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Rng {
  (): number;
  /** uniform in [min, max) */
  range(min: number, max: number): number;
  /** integer in [min, max] */
  int(min: number, max: number): number;
  /** true with probability p */
  chance(p: number): boolean;
  /** random element */
  pick<T>(list: readonly T[]): T;
  /** biased toward the centre (sum of 3 uniforms) — good for heights */
  bell(min: number, max: number): number;
}

export function rng(seed: number): Rng {
  const next = makeRng(seed) as Rng;
  next.range = (min, max) => min + next() * (max - min);
  next.int = (min, max) => Math.floor(min + next() * (max - min + 1));
  next.chance = (p) => next() < p;
  next.pick = (list) => list[Math.floor(next() * list.length) % list.length];
  next.bell = (min, max) => {
    const t = (next() + next() + next()) / 3;
    return min + t * (max - min);
  };
  return next;
}

/** Stable 1-D value noise — smooth, repeatable, no allocations. */
export function valueNoise(x: number, seed = 1): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    let t = Math.imul(n ^ seed, 0x27d4eb2d);
    t ^= t >>> 15;
    return (t >>> 0) / 4294967296;
  };
  const a = h(i);
  const b = h(i + 1);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/** Two-octave value noise in 0..1 — used for skyline height fields. */
export function fbm(x: number, seed = 1): number {
  return valueNoise(x, seed) * 0.65 + valueNoise(x * 2.37 + 11.3, seed + 7) * 0.35;
}
