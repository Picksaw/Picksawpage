/**
 * The City of Templates — layout & composition.
 *
 * WORLD SCALE IS REAL METRES.
 *   eye height        1.70 m
 *   roadway           12.0 m kerb to kerb
 *   sidewalk           4.5 m each side
 *   façade to façade  21.0 m
 *   near buildings    14 – 68 m tall
 *   far towers        90 – 210 m tall, 120 – 420 m away
 *
 * The street is a CURVE, not a corridor. It drifts left and right so
 * new architecture is revealed gradually as you round each bend, and
 * so no two stations ever frame the same silhouette. Buildings are
 * placed with jittered, non-repeating spacing on an asymmetric skyline
 * field — one side is always taller than the other, and the tall side
 * swaps three times over the walk.
 *
 * Everything below is pure data, generated once from a fixed seed.
 */

import { rng, fbm } from "./rng";
import { TEMPLATES } from "../../../config/templatesConfig";

// ── world constants ────────────────────────────────────────────────────────

export const EYE_HEIGHT = 1.7;
export const ROAD_HALF = 6.0;
export const SIDEWALK = 4.5;
/** distance from street centreline to the building line */
export const FACADE_X = ROAD_HALF + SIDEWALK;
export const KERB_HEIGHT = 0.16;

/** where the walk begins (the gate) and ends (the observatory) */
export const START_S = 0;
export const OBSERVATORY_S = 640;
export const JOURNEY_LENGTH = OBSERVATORY_S;

// ── the curved path ────────────────────────────────────────────────────────

/**
 * Lateral offset of the street centreline at arc position `s`.
 * Three incommensurate waves → a road that bends like a real one and
 * never repeats over the length of the district.
 */
export function pathX(s: number): number {
  return (
    Math.sin(s * 0.00731) * 15.5 +
    Math.sin(s * 0.01974 + 1.7) * 6.2 +
    Math.sin(s * 0.00382 + 4.1) * 9.0
  );
}

/**
 * Elevation. The district climbs as you walk it, gently at first and
 * then decisively over the last third, so arriving at the observatory
 * is arriving ABOVE the city you just walked through — the fog and the
 * rooftops end up below the sill.
 *
 * The undulation is kept small (±1.1 m) so the dolly never pitches.
 */
export function pathY(s: number): number {
  const t = Math.max(0, Math.min(1, s / JOURNEY_LENGTH));
  // ease-in climb: flat through the approach, steep into the finale
  const climb = t * t * (3 - 2 * t) * 14 + t * 4;
  return Math.sin(s * 0.0052 + 0.6) * 1.1 + climb;
}

/** dx/ds — the street's heading. Small angles, so this is ~the tangent. */
export function pathHeading(s: number): number {
  const h = 0.5;
  return Math.atan2(pathX(s + h) - pathX(s - h), 2 * h);
}

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  heading: number;
}

const _pp: PathPoint = { x: 0, y: 0, z: 0, heading: 0 };

/**
 * World position of the street centreline at `s`.
 *
 * By default this returns a SHARED object to keep the per-frame path
 * lookups allocation-free — read it immediately, never retain it, and
 * never hold two results at once. Callers that need to keep the value
 * (or compare two positions) must pass their own `out`.
 */
export function pathPoint(s: number, out?: PathPoint): PathPoint {
  const t = out ?? _pp;
  t.x = pathX(s);
  t.y = pathY(s);
  t.z = -s;
  t.heading = pathHeading(s);
  return t;
}

/** Allocating variant, for setup code and anything that retains. */
export function pathPointAt(s: number): PathPoint {
  return pathPoint(s, { x: 0, y: 0, z: 0, heading: 0 });
}

/** Point offset perpendicular to the street: +lateral = right-hand side. */
export function pathOffset(s: number, lateral: number, out: { x: number; y: number; z: number }) {
  const p = pathPoint(s);
  const h = p.heading;
  // right-hand normal of a path heading mostly along -Z
  out.x = p.x + Math.cos(h) * lateral;
  out.y = p.y;
  out.z = p.z + Math.sin(h) * lateral;
  return out;
}

// ── districts ──────────────────────────────────────────────────────────────

export type DistrictKind =
  | "beauty"
  | "dental"
  | "luxury"
  | "studio"
  | "future";

export interface DistrictStyle {
  kind: DistrictKind;
  /** display name of the quarter */
  quarter: string;
  /** façade base colour */
  facade: string;
  /** trim / frame colour */
  trim: string;
  /** window emission colour */
  windowColor: string;
  /** neon + signage colour */
  accent: string;
  /** secondary accent, used sparingly */
  accent2: string;
  /** 0 = matte concrete, 1 = polished stone/glass */
  polish: number;
  /** 0 = solid mass, 1 = mostly glazing */
  glazing: number;
  /** silhouette bias: 0 = squat & wide, 1 = slender towers */
  verticality: number;
  /** how much the façade steps back as it rises */
  setback: number;
  /** proportion of windows lit at night */
  occupancy: number;
  /** lamp light colour for this quarter */
  lamp: string;
}

export const DISTRICTS: Record<DistrictKind, DistrictStyle> = {
  beauty: {
    kind: "beauty",
    quarter: "Verdant Row",
    facade: "#241d22",
    trim: "#d8c3bd",
    windowColor: "#ffd9c8",
    accent: "#ff9ec4",
    accent2: "#ffd2a8",
    polish: 0.72,
    glazing: 0.5,
    verticality: 0.35,
    setback: 0.55,
    occupancy: 0.42,
    lamp: "#ffc48a",
  },
  dental: {
    kind: "dental",
    quarter: "Clarity Court",
    facade: "#1b232b",
    trim: "#e6f2f8",
    windowColor: "#dff4ff",
    accent: "#7fe6ff",
    accent2: "#ffffff",
    polish: 0.85,
    glazing: 0.68,
    verticality: 0.45,
    setback: 0.3,
    occupancy: 0.55,
    lamp: "#cfe8ff",
  },
  luxury: {
    kind: "luxury",
    quarter: "Lumina Quarter",
    facade: "#16161c",
    trim: "#c9a45c",
    windowColor: "#ffe2b0",
    accent: "#f2c477",
    accent2: "#fff0d0",
    polish: 0.92,
    glazing: 0.42,
    verticality: 0.8,
    setback: 0.7,
    occupancy: 0.3,
    lamp: "#ffcf94",
  },
  studio: {
    kind: "studio",
    quarter: "Pulse Works",
    facade: "#14161b",
    trim: "#3d4654",
    windowColor: "#bfe9ff",
    accent: "#4fd8ff",
    accent2: "#ff5fa8",
    polish: 0.3,
    glazing: 0.55,
    verticality: 0.5,
    setback: 0.25,
    occupancy: 0.62,
    lamp: "#a8d8ff",
  },
  future: {
    kind: "future",
    quarter: "Lumen Site",
    facade: "#12141a",
    trim: "#5a6270",
    windowColor: "#9fd6ff",
    accent: "#8fb4ff",
    accent2: "#ffb347",
    polish: 0.22,
    glazing: 0.3,
    verticality: 0.6,
    setback: 0.2,
    occupancy: 0.12,
    lamp: "#bcd2f0",
  },
};

// ── hero plots: one per template ───────────────────────────────────────────

export interface HeroPlot {
  index: number;
  templateId: string;
  district: DistrictStyle;
  /** arc position of the entrance */
  s: number;
  /** -1 = left side of the street, +1 = right */
  side: -1 | 1;
  /** distance from centreline to the façade plane */
  lateral: number;
  width: number;
  depth: number;
  height: number;
  /** how far the camera stands back from the façade when framing it */
  framing: number;
  seed: number;
}

/** Category assignment — each template gets a quarter with its own soul. */
const TEMPLATE_DISTRICT: Record<string, DistrictKind> = {
  verda: "beauty",
  lumina: "luxury",
  clarity: "dental",
  pulse: "studio",
  aurora: "beauty",
  lumen: "future",
};

/** Deliberately uneven spacing — the walk must never feel metered. */
const PLOT_GAPS = [78, 96, 82, 104, 88];
/** Strict alternation: the visitor's head turns left, right, left… */
const PLOT_SIDES: (-1 | 1)[] = [-1, 1, -1, 1, -1, 1];

export const HERO_PLOTS: HeroPlot[] = (() => {
  const r = rng(0x5eed1);
  const out: HeroPlot[] = [];
  let s = 74;
  TEMPLATES.forEach((tpl, i) => {
    const kind = TEMPLATE_DISTRICT[tpl.id] ?? "studio";
    const d = DISTRICTS[kind];
    const width = 22 + d.verticality * 6 + r.range(-2.5, 3.5);
    out.push({
      index: i,
      templateId: tpl.id,
      district: d,
      s,
      side: PLOT_SIDES[i % PLOT_SIDES.length],
      lateral: FACADE_X + r.range(0, 1.4),
      width,
      depth: 20 + r.range(0, 10),
      height: 26 + d.verticality * 34 + r.range(-4, 10),
      framing: 15.5 + r.range(0, 2.5),
      seed: 1000 + i * 977,
    });
    s += PLOT_GAPS[i % PLOT_GAPS.length];
  });
  return out;
})();

/** Camera station for plot `i` — stands on the opposite sidewalk. */
export function plotStation(plot: HeroPlot): number {
  return plot.s;
}

/** Which district owns arc position `s` (nearest hero plot). */
export function districtAt(s: number): DistrictStyle {
  let best = HERO_PLOTS[0];
  let bestD = Infinity;
  for (const p of HERO_PLOTS) {
    const d = Math.abs(p.s - s);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best.district;
}

// ── filler architecture ────────────────────────────────────────────────────

export type RoofKind = "flat" | "tiered" | "mansard" | "sawtooth" | "crown";

export interface BuildingSpec {
  id: number;
  s: number;
  side: -1 | 1;
  /** depth row: 0 = on the street, 1..n = behind */
  row: number;
  x: number;
  y: number;
  z: number;
  rotY: number;
  width: number;
  depth: number;
  height: number;
  district: DistrictStyle;
  roof: RoofKind;
  /** extra crown block: [width scale, depth scale, height] */
  crown: [number, number, number] | null;
  antennaH: number;
  /** window grid, in real metres */
  floorHeight: number;
  bayWidth: number;
  occupancy: number;
  /** per-building noise seed for window flicker + facade variation */
  seed: number;
  /** how much of the façade is a glazed curtain wall (0..1) */
  glazing: number;
  /** ground-floor shopfront light */
  shopfront: boolean;
  /** rooftop water tank / AC cluster */
  rooftopProps: boolean;
}

/**
 * Asymmetric skyline field. Returns a 0..1 height multiplier for a side
 * of the street at position `s`. The dominant side swaps along the walk
 * so the composition is never mirrored.
 */
function skylineField(s: number, side: number): number {
  const base = fbm(s * 0.012 + (side > 0 ? 31.7 : 4.3), side > 0 ? 91 : 17);
  // Dominance wave: the tall side swaps three times across the walk, and
  // the swing is sharpened so one side genuinely towers over the other
  // instead of both drifting toward the average.
  const raw = Math.sin(s * 0.0165 + 0.9);
  const dom = Math.sign(raw) * Math.pow(Math.abs(raw), 0.42) * 0.5 + 0.5;
  const bias = side > 0 ? dom : 1 - dom;
  return Math.min(1, base * 0.22 + bias * 0.95);
}

/** Distance from `s` to the nearest hero plot on the same side. */
function heroClearance(s: number, side: number): number {
  let best = Infinity;
  for (const p of HERO_PLOTS) {
    if (p.side !== side) continue;
    best = Math.min(best, Math.abs(p.s - s) - p.width * 0.5);
  }
  return best;
}

/**
 * The layout is deterministic, so it is also cacheable.
 *
 * Six systems need the building list and seven need the lamp list.
 * Generating them per-consumer meant walking the whole 640 m district
 * a dozen times at mount, for identical results. These caches make
 * every consumer after the first free — and, just as importantly,
 * guarantee that every system is looking at the SAME city.
 *
 * Returned arrays are shared. Never mutate them; sort a copy.
 */
const cityCache = new Map<number, BuildingSpec[]>();
let lampCache: LampSpec[] | null = null;
/** buildings pre-sorted by arc position — the order most consumers want */
const sortedCityCache = new Map<number, BuildingSpec[]>();

export function buildCity(rows: number): BuildingSpec[] {
  const hit = cityCache.get(rows);
  if (hit) return hit;
  const built = generateCity(rows);
  cityCache.set(rows, built);
  return built;
}

/** buildCity(), sorted by `s`. Shared — do not mutate. */
export function buildCitySorted(rows: number): BuildingSpec[] {
  const hit = sortedCityCache.get(rows);
  if (hit) return hit;
  const sorted = [...buildCity(rows)].sort((a, b) => a.s - b.s);
  sortedCityCache.set(rows, sorted);
  return sorted;
}

function generateCity(rows: number): BuildingSpec[] {
  const r = rng(0xc17a11);
  const out: BuildingSpec[] = [];
  let id = 0;
  const off = { x: 0, y: 0, z: 0 };

  for (let row = 0; row < rows; row++) {
    for (const side of [-1, 1] as const) {
      // rows behind the street line are sparser and set further back
      const lateralBase = FACADE_X + row * (row === 1 ? 26 : 30);
      let s = -40 + r.range(0, 18) + row * 13;
      /** frontage of the previous building on this row, for separation */
      let prevWidth = 0;
      let prevDepth = 0;
      let prevS = -Infinity;

      while (s < JOURNEY_LENGTH + 90) {
        const clear = heroClearance(s, side);
        // never collide with a hero plot on the street line
        if (row === 0 && clear < 16) {
          s += 8;
          continue;
        }

        const field = skylineField(s, side);
        const district = districtAt(s);

        // width & spacing vary continuously — no metronome
        const width =
          (row === 0 ? 13 : 17) + r.bell(0, 1) * (row === 0 ? 16 : 26) + field * 8;
        const depth = 16 + r.range(0, 16) + row * 6;

        // Silhouette: near rows are mid-rise, back rows carry the towers.
        // A slice of the street line stays deliberately LOW (2–4 storey
        // shophouses) so the skyline has troughs to make peaks read.
        const rowBoost = row === 0 ? 0 : row === 1 ? 14 : 34;
        const vert = district.verticality;
        const lowRise = row === 0 && r.chance(0.3);
        let height = lowRise
          ? 8 + r.range(0, 8) + field * 4
          : 12 +
            field * (34 + vert * 30) +
            rowBoost +
            r.bell(0, 1) * (18 + row * 22) +
            (row >= 2 && r.chance(0.22) ? r.range(30, 90) : 0);

        /**
         * Enforce the dominance wave.
         *
         * The random terms above (row boost, bell curve, the occasional
         * tower bonus) are large enough to drown the skyline field, so
         * the two sides kept averaging out to roughly equal — which is
         * exactly the mirrored composition the field exists to prevent.
         * Scaling the finished height by the side's dominance makes the
         * asymmetry survive the randomness while keeping the variety.
         */
        const raw = Math.sin(s * 0.0165 + 0.9);
        const dom = Math.sign(raw) * Math.pow(Math.abs(raw), 0.42) * 0.5 + 0.5;
        const dominance = side > 0 ? dom : 1 - dom;
        height *= 0.52 + dominance * 0.78;

        const lateral =
          lateralBase + r.range(0, row === 0 ? 2.2 : 14) + (1 - field) * 3;

        /**
         * Guarantee separation from the previous building on this row.
         *
         * Advancing by the previous building's own width is only enough
         * when the next one is no wider. Where it is wider, push it
         * clear — otherwise wide neighbours interpenetrate, which reads
         * as one malformed mass rather than two buildings.
         *
         * Frontage alone is the right measure only for the shallow
         * street line. The back rows are deep (40-50 m) and sit on a
         * curve, so neighbours meet at different headings and their
         * corners swing well outside their frontage. There the
         * separation has to use the footprint's half-diagonal.
         */
        const reach = (w: number, d: number) =>
          row === 0 ? w * 0.5 : Math.hypot(w, d) * 0.5;
        const needed =
          reach(prevWidth, prevDepth) + reach(width, depth) + (row === 0 ? 3 : 2);
        if (prevS > -Infinity && s - prevS < needed) s = prevS + needed;

        pathOffset(s, side * (lateral + depth * 0.5), off);
        const heading = pathHeading(s);
        /**
         * Orientation.
         *
         * `width` is FRONTAGE (along the street) and `depth` is how far
         * the building runs back from it — that is what the placement
         * maths above assumes when it advances by `width` and offsets
         * laterally by `depth / 2`.
         *
         * A three.js box scaled (w, h, d) puts w on local X and d on
         * local Z. With only `-heading` applied, local X lands on world
         * X, which is PERPENDICULAR to a street running down -Z — the
         * opposite of the intent. The extra quarter turn puts frontage
         * along the street where it belongs.
         */
        const rotY = -heading + Math.PI / 2 + r.range(-0.035, 0.035);

        const tall = height > 46;
        const roof: RoofKind = tall
          ? r.pick(["crown", "tiered", "flat"] as const)
          : r.pick(["flat", "flat", "tiered", "mansard", "sawtooth"] as const);

        out.push({
          id: id++,
          s,
          side,
          row,
          x: off.x,
          y: off.y,
          z: off.z,
          rotY,
          width,
          depth,
          height,
          district,
          roof,
          crown:
            roof === "tiered" || roof === "crown"
              ? [
                  0.62 + r.range(0, 0.16),
                  0.62 + r.range(0, 0.16),
                  height * (0.12 + r.range(0, 0.16)),
                ]
              : null,
          antennaH: tall && r.chance(0.55) ? r.range(6, 18) : 0,
          floorHeight: 3.4 + r.range(0, 0.7),
          bayWidth: 2.6 + r.range(0, 1.3),
          occupancy: Math.max(
            0.06,
            Math.min(0.92, district.occupancy + r.range(-0.16, 0.2) - row * 0.06)
          ),
          seed: r.int(1, 100000),
          glazing: Math.max(0, Math.min(1, district.glazing + r.range(-0.2, 0.2))),
          shopfront: row === 0 && r.chance(0.55),
          rooftopProps: row <= 1 && r.chance(0.65),
        });

        /**
         * Jittered advance.
         *
         * A real street has near-continuous frontage punctuated by the
         * occasional alley, so row 0 packs tight and only sometimes
         * opens a gap.
         *
         * `s` is the CENTRE of each building, so advancing by this
         * building's full width already leaves half a width of headroom
         * for the next one — which is exactly enough as long as the
         * next building is no wider than this one. When it is wider,
         * the loop below pushes it clear.
         */
        const gap =
          row === 0
            ? r.chance(0.18)
              ? r.range(9, 20) // alley / side street
              : r.range(1.2, 5)
            : r.range(10, 40);
        prevWidth = width;
        prevDepth = depth;
        prevS = s;
        s += width + gap;
      }
    }
  }
  return out;
}

// ── distant skyline (revealed by lightning) ────────────────────────────────

export interface FarTower {
  x: number;
  y: number;
  z: number;
  w: number;
  d: number;
  h: number;
  seed: number;
  /** 0..1 how far into the haze it sits */
  depth: number;
}

export function buildSkyline(count: number): FarTower[] {
  const r = rng(0x5c711e);
  const out: FarTower[] = [];
  for (let i = 0; i < count; i++) {
    const s = r.range(-120, JOURNEY_LENGTH + 220);
    const side = r.chance(0.5) ? -1 : 1;
    const dist = r.range(150, 460);
    const p = pathPoint(s);
    const depth = (dist - 150) / 310;
    out.push({
      x: p.x + side * dist,
      y: 0,
      z: p.z - r.range(0, 160),
      w: 16 + r.range(0, 34) + depth * 22,
      d: 16 + r.range(0, 34),
      h: 70 + r.range(0, 90) + depth * 70,
      seed: r.int(1, 100000),
      depth,
    });
  }
  return out;
}

// ── street furniture ───────────────────────────────────────────────────────

export interface LampSpec {
  s: number;
  side: -1 | 1;
  x: number;
  y: number;
  z: number;
  rotY: number;
  height: number;
  color: string;
  seed: number;
}

/**
 * Street lamps: staggered left/right so their pools of light interleave
 * down the street instead of forming a symmetrical tunnel.
 */
export function buildLamps(): LampSpec[] {
  if (lampCache) return lampCache;
  const r = rng(0x1a3d);
  const out: LampSpec[] = [];
  const off = { x: 0, y: 0, z: 0 };
  let s = 18;
  let side: -1 | 1 = -1;
  while (s < JOURNEY_LENGTH + 40) {
    const d = districtAt(s);
    pathOffset(s, side * (ROAD_HALF + 1.1), off);
    out.push({
      s,
      side,
      x: off.x,
      y: off.y,
      z: off.z,
      rotY: -pathHeading(s),
      height: 7.2 + r.range(0, 1.4),
      color: d.lamp,
      seed: r.int(1, 99999),
    });
    // stagger: alternate sides, uneven pitch
    side = side === -1 ? 1 : -1;
    s += 15 + r.range(0, 7);
  }
  lampCache = out;
  return out;
}

/** buildLamps(), sorted by `s`. Shared — do not mutate. */
let sortedLampCache: LampSpec[] | null = null;
export function buildLampsSorted(): LampSpec[] {
  if (!sortedLampCache) sortedLampCache = [...buildLamps()].sort((a, b) => a.s - b.s);
  return sortedLampCache;
}

export const CITY_METRICS = {
  EYE_HEIGHT,
  ROAD_HALF,
  SIDEWALK,
  FACADE_X,
  JOURNEY_LENGTH,
  OBSERVATORY_S,
};
