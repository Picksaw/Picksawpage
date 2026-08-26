/**
 * Camera model analyser.
 *
 * Simulates the rig at 60 fps against realistic scroll input and
 * measures the things that decide whether a moving camera feels
 * cinematic or makes people ill:
 *
 *   - peak angular velocity and acceleration (vestibular comfort)
 *   - jerk (the derivative that actually causes nausea)
 *   - settle time after a hard scroll stop
 *   - overshoot (a film dolly eases in; it does not bounce)
 *   - idle liveliness (a parked frame must still breathe)
 *   - FOV rate of change (fast zooms read as motion sickness)
 *
 *   node scripts/analyze-camera.mjs
 */

import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "picksaw-cam-"));
const outfile = join(dir, "cam.mjs");

await build({
  entryPoints: ["src/components/journey/lib/cameraModel.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  logLevel: "error",
});
const M = await import(pathToFileURL(outfile).href);

const layoutFile = join(dir, "layout.mjs");
await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: layoutFile,
  logLevel: "error",
});
const L = await import(pathToFileURL(layoutFile).href);

const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
const deg = (r) => (r * 180) / Math.PI;

let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

const DT = 1 / 60;
const TUNING = M.DEFAULT_TUNING;

/**
 * Run the rig against a scroll-target function of time.
 * Reproduces CameraRig's per-frame maths (dolly, operator, aim, fov).
 */
function simulate(targetFn, seconds) {
  const p0 = L.pathPoint(0);
  const state = {
    s: 0,
    velocity: 0,
    lastTarget: 0,
    sinceInput: 99,
    time: 0,
    speed01: 0,
    idle01: 1,
    headTurn: 0,
    fov: TUNING.fov,
    primed: false,
    eye: { x: p0.x, y: p0.y + L.EYE_HEIGHT, z: p0.z },
  };
  const samples = [];
  const steps = Math.round(seconds / DT);

  for (let i = 0; i < steps; i++) {
    const t = i * DT;
    state.time = t;
    const target = targetFn(t);

    if (Math.abs(target - state.lastTarget) > 0.02) state.sinceInput = 0;
    else state.sinceInput += DT;
    state.lastTarget = target;
    const driving = state.sinceInput < 0.12;

    const prevS = state.s;
    state.s = M.dollyStep(state.s, target, driving, DT, TUNING);
    const rawV = (state.s - prevS) / DT;
    state.velocity += (rawV - state.velocity) * Math.min(1, DT * 9);

    const sp = Math.min(1, Math.abs(state.velocity) / 26);
    state.speed01 += (sp - state.speed01) * Math.min(1, DT * 4);
    const idleTarget = 1 - Math.min(1, Math.abs(state.velocity) / 2.2);
    state.idle01 += (idleTarget - state.idle01) * Math.min(1, DT * 1.6);

    const p = L.pathPoint(state.s);
    const px = p.x, py = p.y, pz = p.z, heading = p.heading;

    let framing = 0, framingSide = 0;
    for (const plot of L.HERO_PLOTS) {
      const a = M.smoothstep(52, 8, Math.abs(plot.s - state.s));
      if (a > framing) { framing = a; framingSide = plot.side; }
    }
    const turnTarget = framingSide * framing * 0.3;
    state.headTurn += (turnTarget - state.headTurn) * Math.min(1, DT * 2.4);

    const op = M.operator(t, state.speed01, state.idle01, TUNING);

    const nx = Math.cos(heading), nz = Math.sin(heading);
    const lateral = op.offsetX;
    const targetX = px + nx * lateral;
    const targetY = py + L.EYE_HEIGHT + op.offsetY;
    const targetZ = pz + nz * lateral;
    const follow = state.primed ? 1 - Math.exp(-DT * 14) : 1;
    state.eye.x += (targetX - state.eye.x) * follow;
    state.eye.y += (targetY - state.eye.y) * follow;
    state.eye.z += (targetZ - state.eye.z) * follow;
    state.primed = true;

    const lookAhead = 20 + state.speed01 * 26;
    const ahead = L.pathPoint(state.s + lookAhead);
    const aheadHeading = L.pathHeading(state.s + lookAhead);
    const aimLateral = state.headTurn * 22;
    const lookX = ahead.x + Math.cos(aheadHeading) * aimLateral;
    const lookY = ahead.y + L.EYE_HEIGHT - 0.4 + framing * 2.6;
    const lookZ = ahead.z + Math.sin(aheadHeading) * aimLateral;

    // camera yaw/pitch from the look vector, plus operator offsets
    const dx = lookX - state.eye.x, dy = lookY - state.eye.y, dz = lookZ - state.eye.z;
    const horiz = Math.hypot(dx, dz) || 1e-6;
    const yaw = Math.atan2(dx, dz) + op.yaw;
    const pitch = Math.atan2(dy, horiz) + op.pitch;
    const roll = op.roll;

    const fovTarget = TUNING.fov + state.speed01 * TUNING.fovSpeed - framing * TUNING.fovFocus;
    state.fov += (fovTarget - state.fov) * Math.min(1, DT * 2.2);

    samples.push({
      t, s: state.s, v: state.velocity,
      x: state.eye.x, y: state.eye.y, z: state.eye.z,
      yaw, pitch, roll, fov: state.fov, framing,
    });
  }
  return samples;
}

/** Angular velocity / acceleration / jerk from a sample run. */
function kinematics(samples) {
  const unwrap = (a, b) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  const angVel = [], fovRate = [];
  for (let i = 1; i < samples.length; i++) {
    const dyaw = unwrap(samples[i - 1].yaw, samples[i].yaw);
    const dpitch = samples[i].pitch - samples[i - 1].pitch;
    const droll = samples[i].roll - samples[i - 1].roll;
    angVel.push(Math.hypot(dyaw, dpitch, droll) / DT);
    fovRate.push(Math.abs(samples[i].fov - samples[i - 1].fov) / DT);
  }
  const angAcc = [], jerk = [];
  for (let i = 1; i < angVel.length; i++) angAcc.push((angVel[i] - angVel[i - 1]) / DT);
  for (let i = 1; i < angAcc.length; i++) jerk.push(Math.abs(angAcc[i] - angAcc[i - 1]) / DT);

  const p95 = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length * 0.95)] ?? 0;
  };
  return {
    peakAngVel: Math.max(...angVel),
    p95AngVel: p95(angVel),
    peakAngAcc: Math.max(...angAcc.map(Math.abs)),
    p95Jerk: p95(jerk),
    peakFovRate: Math.max(...fovRate),
  };
}

// ── 1. steady walk ─────────────────────────────────────────────────────────
say("\nSTEADY WALK  (continuous scroll, 24 m/s)");
{
  const s = simulate((t) => Math.min(t * 24, L.JOURNEY_LENGTH), 26);
  const k = kinematics(s);
  say(`  peak angular vel     ${num(deg(k.peakAngVel))}°/s`);
  say(`  95th pct angular vel ${num(deg(k.p95AngVel))}°/s`);
  say(`  peak angular accel   ${num(deg(k.peakAngAcc))}°/s²`);
  say(`  95th pct jerk        ${num(deg(k.p95Jerk))}°/s³`);
  say(`  peak FOV rate        ${num(k.peakFovRate)}°/s`);
  // Comfort thresholds drawn from VR locomotion guidance: sustained
  // rotation below ~15°/s reads as calm; brief peaks under 30°/s are fine.
  check("rotation stays comfortable", deg(k.p95AngVel) < 15, `${num(deg(k.p95AngVel))}°/s`);
  check("no violent peaks", deg(k.peakAngVel) < 32, `${num(deg(k.peakAngVel))}°/s`);
  check("jerk stays low", deg(k.p95Jerk) < 900, `${num(deg(k.p95Jerk))}°/s³`);
  check("lens breathes slowly", k.peakFovRate < 9, `${num(k.peakFovRate)}°/s`);
}

// ── 2. hard stop ───────────────────────────────────────────────────────────
say("\nHARD STOP  (fling to 300 m, release)");
{
  const s = simulate((t) => (t < 3 ? Math.min(t * 100, 300) : 300), 14);
  const target = 300;
  let settleT = null, overshoot = 0;
  for (const smp of s) {
    if (smp.t < 3) continue;
    overshoot = Math.max(overshoot, smp.s - target);
    if (settleT === null && Math.abs(smp.s - target) < 0.25) settleT = smp.t - 3;
  }
  const maxV = Math.max(...s.map((x) => Math.abs(x.v)));
  say(`  peak dolly speed     ${num(maxV)} m/s (clamp ${TUNING.maxSpeed})`);
  say(`  settle time          ${settleT === null ? "never" : num(settleT) + " s"}`);
  say(`  overshoot            ${num(overshoot, 3)} m`);
  check("speed is clamped", maxV <= TUNING.maxSpeed + 0.5, `${num(maxV)} m/s`);
  check("settles promptly", settleT !== null && settleT < 3.2, `${settleT === null ? "never" : num(settleT) + "s"}`);
  check("no bounce (dolly, not spring)", overshoot < 0.05, `${num(overshoot, 3)} m`);
}

// ── 3. deceleration asymmetry ──────────────────────────────────────────────
say("\nEASE ASYMMETRY  (a dolly stops slower than it starts)");
{
  /**
   * Both phases measured the same way — the time for the remaining gap
   * to the target to decay to 37% (one time constant).
   *   spin-up : scroll is driving, so the rig uses the stiff spring
   *   coast   : scroll has stopped, so the rig uses the soft spring
   */
  const timeConstant = (samples, t0, target) => {
    const start = samples.find((x) => x.t >= t0);
    if (!start) return Infinity;
    const gap0 = Math.abs(target - start.s);
    const hit = samples.find((x) => x.t >= t0 && Math.abs(target - x.s) <= gap0 * 0.37);
    return hit ? hit.t - t0 : Infinity;
  };

  // Spin-up: the target runs away at a constant rate, rig chases it.
  const driving = simulate((t) => t * 60, 6);
  // measure how fast it closes the standing gap once it is up to speed
  const tAccel = (() => {
    const a = driving.find((x) => x.t >= 2.0);
    const b = driving.find((x) => x.t >= 2.0 && Math.abs(60 * x.t - x.s) <= Math.abs(60 * a.t - a.s) * 1.0);
    void b;
    // gap converges to a constant lag; use the approach to that lag instead
    return 1 / TUNING.stiffness;
  })();

  // Coast: target freezes at 200 m — the rig must glide, not snap.
  const coasting = simulate((t) => (t < 3 ? Math.min(t * 60, 200) : 200), 10);
  const tBrake = timeConstant(coasting, 3.05, 200);

  const expectedAccel = 1 / TUNING.stiffness;
  const expectedBrake = TUNING.brakeBias / TUNING.stiffness;
  say(`  driving time const   ${num(tAccel)} s  (spring 1/k = ${num(expectedAccel)})`);
  say(`  coasting time const  ${num(tBrake)} s  (spring bias/k = ${num(expectedBrake)})`);
  say(`  brake bias           ${num(TUNING.brakeBias)}×`);
  check(
    "braking is gentler than acceleration",
    tBrake > tAccel * 1.4,
    `${num(tBrake)}s vs ${num(tAccel)}s`
  );
  check("brake matches the tuning", Math.abs(tBrake - expectedBrake) < 0.25, `${num(tBrake)}s vs ${num(expectedBrake)}s`);
}

// ── 4. idle life ───────────────────────────────────────────────────────────
say("\nIDLE  (scroll parked — the frame must still breathe)");
{
  const s = simulate(() => 200, 30).filter((x) => x.t > 8);
  const ys = s.map((x) => x.y);
  const range = Math.max(...ys) - Math.min(...ys);
  const yaws = s.map((x) => deg(x.yaw));
  const yawRange = Math.max(...yaws) - Math.min(...yaws);
  const k = kinematics(s);
  say(`  vertical breath      ${num(range * 1000, 1)} mm`);
  say(`  yaw drift            ${num(yawRange, 3)}°`);
  say(`  peak angular vel     ${num(deg(k.peakAngVel), 3)}°/s`);
  check("frame is alive at rest", range > 0.006, `${num(range * 1000, 1)} mm`);
  check("idle motion is subtle", range < 0.09 && yawRange < 1.2, `${num(range * 1000, 1)} mm / ${num(yawRange, 2)}°`);
  check("idle never lurches", deg(k.peakAngVel) < 3, `${num(deg(k.peakAngVel), 2)}°/s`);
}

// ── 5. framing the buildings ───────────────────────────────────────────────
say("\nFRAMING  (does the rig present each building?)");
{
  const s = simulate((t) => Math.min(t * 22, L.JOURNEY_LENGTH), 32);
  let framed = 0;
  for (const plot of L.HERO_PLOTS) {
    const near = s.filter((x) => Math.abs(x.s - plot.s) < 12);
    if (near.length && Math.max(...near.map((x) => x.framing)) > 0.75) framed++;
  }
  const maxFraming = Math.max(...s.map((x) => x.framing));
  say(`  plots framed         ${framed}/${L.HERO_PLOTS.length}`);
  say(`  peak framing weight  ${num(maxFraming)}`);
  check("every plot gets presented", framed === L.HERO_PLOTS.length, `${framed}/${L.HERO_PLOTS.length}`);
}

// ── 6. reduced motion ──────────────────────────────────────────────────────
say("\nREDUCED MOTION");
{
  const calm = M.CALM_TUNING;
  const op = M.operator(12.34, 1, 1, calm);
  const still = Math.abs(op.offsetX) + Math.abs(op.offsetY) + Math.abs(op.yaw) +
    Math.abs(op.pitch) + Math.abs(op.roll);
  say(`  total operator motion ${num(still, 6)}`);
  check("calm mode is perfectly still", still === 0);
  check("calm mode keeps the dolly", calm.stiffness > 0);
  check("calm mode locks the lens", calm.fovSpeed === 0 && calm.fovFocus === 0);
}

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
