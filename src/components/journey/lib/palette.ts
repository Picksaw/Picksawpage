/**
 * The colour script.
 *
 *   beginning   deep blue · charcoal · silver
 *   middle      cool cyan with warm amber contrast
 *   lightning   icy white washes the whole frame
 *   finale      calm blue · soft gold · clarity after chaos
 *
 * Nothing here is ever oversaturated: the district is lit by a cold
 * moon and a handful of sodium lamps, and the accent colours only earn
 * their brightness where a light source justifies them.
 */

import * as THREE from "three";

export const COLORS = {
  /** the void the city sits in */
  night: "#05070d",
  fogNear: "#0a1020",
  fogFar: "#0d1526",

  moon: "#a8c6ff",
  moonWarm: "#cddcff",

  sodium: "#ffb46a",
  sodiumDeep: "#ff9a45",

  cyan: "#4fd8ff",
  cyanSoft: "#9fe8ff",
  ice: "#eaf6ff",

  asphalt: "#0b0d12",
  asphaltWet: "#070910",
  concrete: "#171a21",
  concreteWet: "#101319",
  marble: "#1a1d26",
  silver: "#c8d4e2",

  gold: "#ffd9a0",
  calmBlue: "#16324a",
} as const;

const c = (hex: string) => new THREE.Color(hex);

/** Cached colour objects — never allocate inside a frame loop. */
export const C = {
  night: c(COLORS.night),
  fogNear: c(COLORS.fogNear),
  fogFar: c(COLORS.fogFar),
  moon: c(COLORS.moon),
  sodium: c(COLORS.sodium),
  cyan: c(COLORS.cyan),
  ice: c(COLORS.ice),
  gold: c(COLORS.gold),
  calmBlue: c(COLORS.calmBlue),
};

export interface Grade {
  /** scene fog / horizon colour */
  fog: THREE.Color;
  /** ambient sky tint */
  ambient: THREE.Color;
  /** moonlight colour */
  moon: THREE.Color;
  /** how much warm accent light is allowed in the mix, 0..1 */
  warmth: number;
  /** overall exposure multiplier */
  exposure: number;
}

const _fog = new THREE.Color();
const _amb = new THREE.Color();
const _moon = new THREE.Color();
const _grade: Grade = {
  fog: _fog,
  ambient: _amb,
  moon: _moon,
  warmth: 0,
  exposure: 1,
};

const ACT1_FOG = c("#070b16");
const ACT2_FOG = c("#0b1524");
const ACT3_FOG = c("#101d2e");
const FINALE_FOG = c("#0e2135");

const ACT1_AMB = c("#26364f");
const ACT2_AMB = c("#2b4260");
const FINALE_AMB = c("#38546f");

const MOON_COLD = c("#93b6ff");
const MOON_CLEAR = c("#c3d8ff");

/**
 * Grade the frame from journey progress (0..1) plus the live lightning
 * value. Returns a shared, mutated object — read it, never store it.
 */
export function gradeAt(progress: number, bolt = 0, observatory = 0): Grade {
  const p = Math.max(0, Math.min(1, progress));

  // three acts: approach → district → finale
  if (p < 0.45) {
    const t = p / 0.45;
    _fog.copy(ACT1_FOG).lerp(ACT2_FOG, t);
    _amb.copy(ACT1_AMB).lerp(ACT2_AMB, t);
  } else {
    const t = (p - 0.45) / 0.55;
    _fog.copy(ACT2_FOG).lerp(ACT3_FOG, t);
    _amb.copy(ACT2_AMB).lerp(ACT2_AMB, t);
  }

  _moon.copy(MOON_COLD);

  // clarity after chaos — the observatory calms and warms the grade
  if (observatory > 0) {
    _fog.lerp(FINALE_FOG, observatory);
    _amb.lerp(FINALE_AMB, observatory);
    _moon.lerp(MOON_CLEAR, observatory);
  }

  // lightning washes everything icy white
  if (bolt > 0.001) {
    const b = Math.min(1, bolt);
    _fog.lerp(C.ice, b * 0.55);
    _amb.lerp(C.ice, b * 0.4);
    _moon.lerp(C.ice, b * 0.8);
  }

  _grade.warmth = 0.25 + 0.5 * Math.min(1, p * 1.6) - observatory * 0.15;
  _grade.exposure = 1 + bolt * 0.35 + observatory * 0.08;
  return _grade;
}
