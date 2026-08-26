/**
 * The film camera model.
 *
 * Scroll does not move the camera. Scroll moves a TARGET; the camera is
 * a physical object that chases it with mass, damping and inertia — so
 * it leans into acceleration, settles after deceleration, and never
 * teleports. On top of that sits an operator: a human holding the rig,
 * breathing, micro-correcting, letting the lens drift.
 *
 * Layers, in order of authority:
 *
 *   1  DOLLY      critically-damped spring toward the scroll target,
 *                 with a velocity clamp so a flung scrollbar becomes a
 *                 fast push-in rather than a jump cut
 *   2  EASE       acceleration and deceleration are asymmetric — the
 *                 rig takes longer to stop than to start, like a real
 *                 dolly on track
 *   3  SWAY       head sway coupled to speed: the faster you walk, the
 *                 more the horizon rolls, phase-locked to a slow gait
 *   4  HANDHELD   two-octave value noise on position and rotation,
 *                 amplitude falling as speed rises (an operator braces
 *                 when moving, floats when still)
 *   5  BREATH     idle-only: a 0.22 Hz rise and fall, plus a slow lens
 *                 drift, so a stationary frame is never dead
 *   6  FOV        speed widens the lens (push-in energy), framing a
 *                 building narrows it (a subtle lens compression that
 *                 makes the façade feel monumental)
 *
 * Every amplitude below is deliberately small. The brief is cinematic,
 * not nauseating: total angular sway never exceeds ~1.1°, and all of it
 * is disabled under prefers-reduced-motion.
 */

import { valueNoise } from "./rng";

export interface CameraTuning {
  /** spring stiffness of the dolly, 1/s */
  stiffness: number;
  /** how much harder the rig resists stopping than starting */
  brakeBias: number;
  /** metres/second the dolly will never exceed */
  maxSpeed: number;
  /** metres of positional handheld noise at rest */
  handheldPos: number;
  /** radians of rotational handheld noise at rest */
  handheldRot: number;
  /** radians of head roll at full speed */
  swayRoll: number;
  /** metres of vertical gait bob at full speed */
  swayBob: number;
  /** breathing amplitude in metres */
  breath: number;
  /** base field of view in degrees */
  fov: number;
  /** degrees the lens widens at full speed */
  fovSpeed: number;
  /** degrees the lens narrows when framing a building */
  fovFocus: number;
  /** radians of slow idle lens drift */
  drift: number;
}

export const DEFAULT_TUNING: CameraTuning = {
  stiffness: 4.0,
  brakeBias: 2.0,
  maxSpeed: 120,
  handheldPos: 0.028,
  handheldRot: 0.0016,
  swayRoll: 0.011,
  swayBob: 0.035,
  breath: 0.021,
  fov: 46,
  fovSpeed: 5.5,
  fovFocus: 3.2,
  drift: 0.0038,
};

export const MOBILE_TUNING: CameraTuning = {
  ...DEFAULT_TUNING,
  stiffness: 4.4,
  handheldPos: 0.016,
  handheldRot: 0.0009,
  swayRoll: 0.007,
  swayBob: 0.022,
  fov: 62,
  fovSpeed: 4,
  fovFocus: 2.2,
  drift: 0.0022,
};

/** Reduced motion: the dolly still moves, nothing else does. */
export const CALM_TUNING: CameraTuning = {
  ...DEFAULT_TUNING,
  stiffness: 4.6,
  brakeBias: 1,
  handheldPos: 0,
  handheldRot: 0,
  swayRoll: 0,
  swayBob: 0,
  breath: 0,
  fovSpeed: 0,
  fovFocus: 0,
  drift: 0,
};

export interface OperatorOutput {
  /** lateral offset, metres */
  offsetX: number;
  /** vertical offset, metres */
  offsetY: number;
  /** yaw offset, radians */
  yaw: number;
  /** pitch offset, radians */
  pitch: number;
  /** roll, radians */
  roll: number;
}

const out: OperatorOutput = { offsetX: 0, offsetY: 0, yaw: 0, pitch: 0, roll: 0 };

/**
 * Evaluate the operator at time `t` for a rig moving at `speed01`
 * (0..1 normalised) and an idle factor `idle01` (1 = fully stopped).
 * Returns a shared object — read it immediately, never store it.
 */
export function operator(
  t: number,
  speed01: number,
  idle01: number,
  tuning: CameraTuning
): OperatorOutput {
  // Handheld noise: strongest at rest, braced when moving.
  const hh = 1 - speed01 * 0.55;
  const nx = valueNoise(t * 0.62, 11) - 0.5 + (valueNoise(t * 1.71, 23) - 0.5) * 0.4;
  const ny = valueNoise(t * 0.53 + 40, 31) - 0.5 + (valueNoise(t * 1.43, 47) - 0.5) * 0.4;
  const nyaw = valueNoise(t * 0.41 + 80, 53) - 0.5;
  const npitch = valueNoise(t * 0.37 + 120, 67) - 0.5;

  // Gait: a walking rig rolls and bobs, twice per stride.
  const gait = t * (1.1 + speed01 * 2.4);
  const roll = Math.sin(gait) * tuning.swayRoll * speed01;
  const bob = Math.abs(Math.sin(gait * 1.0)) * tuning.swayBob * speed01;

  // Breathing: only when the rig has settled.
  const breath = Math.sin(t * 1.38) * tuning.breath * idle01;
  // Slow lens drift while idle — the operator is alive, not a tripod.
  const drift = (valueNoise(t * 0.12, 91) - 0.5) * tuning.drift * idle01;

  out.offsetX = nx * tuning.handheldPos * hh * 2;
  out.offsetY = ny * tuning.handheldPos * hh * 1.4 + bob + breath;
  out.yaw = nyaw * tuning.handheldRot * hh * 2 + drift;
  out.pitch = npitch * tuning.handheldRot * hh * 1.5 + drift * 0.6;
  out.roll = roll + nyaw * tuning.handheldRot * hh;
  return out;
}

/**
 * Asymmetric dolly step. Returns the new position.
 *
 * While the scroll is actively driving, the rig pushes hard to keep up
 * (`stiffness`). The moment the scroll stops, the rig switches to a
 * softer spring (`stiffness / brakeBias`) and COASTS in — which is what
 * makes a dolly feel like it has mass instead of like a lerp.
 *
 * `driving` must be decided by the CALLER from the scroll input, not
 * inferred here from a smoothed velocity: a smoothed signal takes a few
 * frames to fall below any threshold, and those frames are exactly the
 * ones where the coast is supposed to begin.
 *
 * The step is a first-order exponential approach, so it is
 * unconditionally stable and can never overshoot: a dolly eases in, it
 * does not bounce.
 */
export function dollyStep(
  current: number,
  target: number,
  driving: boolean,
  dt: number,
  tuning: CameraTuning
): number {
  const delta = target - current;
  const k = driving ? tuning.stiffness : tuning.stiffness / tuning.brakeBias;
  const step = delta * (1 - Math.exp(-dt * k));
  const maxStep = tuning.maxSpeed * dt;
  return current + Math.max(-maxStep, Math.min(maxStep, step));
}

/** Smooth 0..1 ramp. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
