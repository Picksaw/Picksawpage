/**
 * Ambient life analyser.
 *
 * The brief for living buildings is "no obvious loops — everything
 * should feel organic". That is a testable claim: if every animated
 * element derives its timing from incommensurate frequencies, the
 * combined signal has no short period, and an autocorrelation of the
 * simulated brightness will show no strong peak.
 *
 * This reproduces the window-life and neon shader maths in JS and
 * measures the actual periodicity.
 *
 *   node scripts/analyze-life.mjs
 */

import { readFileSync } from "node:fs";

const bld = readFileSync("src/components/journey/city/Buildings.tsx", "utf8");
const life = readFileSync("src/components/journey/city/BuildingLife.tsx", "utf8");

const say = (s = "") => console.log(s);
const num = (v, d = 3) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── port the window-life shader to JS ─────────────────────────────────────
const fract = (x) => x - Math.floor(x);
const step = (e, x) => (x >= e ? 1 : 0);
const mix = (a, b, t) => a + (b - a) * t;
function lifeHash(x, y, seed) {
  return fract(Math.sin(x * 41.7 + y * 289.3 + seed) * 24631.7);
}

function windowLife(cx, cy, seed, t) {
  const h1 = lifeHash(cx, cy, seed);
  const h2 = lifeHash(cx + 17.3, cy + 17.3, seed);
  const h3 = lifeHash(cx + 91.7, cy + 91.7, seed);

  const period = 90 + h1 * 240;
  const occupancy = step(0.22, fract(t / period + h2));
  const drift = 0.78 + 0.22 * Math.sin(t * (0.08 + h3 * 0.14) + h1 * 6.283);
  let flicker = 1;
  if (h3 > 0.94) {
    const f = Math.sin(t * (14 + h1 * 22)) * Math.sin(t * (37 + h2 * 30));
    flicker = 0.35 + 0.65 * step(-0.25, f);
  }
  return occupancy * drift * flicker;
}

// ── does the facade ever repeat? ──────────────────────────────────────────
say("\nWINDOW LIFE  (is there an observable loop?)");
const DT = 1 / 30;
const DURATION = 600; // ten minutes of simulated time
const N = Math.floor(DURATION / DT);

// aggregate brightness of a 10x10 patch of windows — what the eye sees
const signal = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const t = i * DT;
  let sum = 0;
  for (let x = 0; x < 10; x++)
    for (let y = 0; y < 10; y++) sum += windowLife(x, y, 137, t);
  signal[i] = sum / 100;
}

const mean = signal.reduce((a, b) => a + b, 0) / N;
const variance = signal.reduce((a, b) => a + (b - mean) ** 2, 0) / N;
say(`  mean brightness      ${num(mean)}`);
say(`  std deviation        ${num(Math.sqrt(variance))}`);
check("facade brightness genuinely varies", Math.sqrt(variance) > 0.004, `sd ${num(Math.sqrt(variance), 4)}`);
check("facade is not fully lit", mean < 0.95, `${num(mean)}`);
check("facade is not dead", mean > 0.25, `${num(mean)}`);

/**
 * Autocorrelation.
 *
 * A smooth signal always correlates strongly with itself at short lags
 * — that is smoothness, not repetition. A genuine LOOP is different: it
 * shows up as a local maximum in the autocorrelation AFTER the initial
 * decay, i.e. the signal comes back to a state it already visited.
 * So the test is for secondary peaks, not for raw correlation.
 */
const lags = [];
for (let lagS = 0.5; lagS < 180; lagS += 0.5) {
  const lag = Math.round(lagS / DT);
  if (lag >= N * 0.6) break;
  let cov = 0;
  for (let i = 0; i + lag < N; i++) cov += (signal[i] - mean) * (signal[i + lag] - mean);
  lags.push({ lagS, r: cov / (N - lag) / variance });
}

// how quickly does the correlation decay? (the "memory" of the signal)
const decayTo = (target) => lags.find((l) => l.r < target)?.lagS ?? Infinity;
say(`  correlation half-life ${num(decayTo(0.5), 1)} s`);
say(`  decorrelates (<0.2) by ${num(decayTo(0.2), 1)} s`);

// secondary peaks — the actual signature of a loop
let secondary = 0;
let secondaryAt = 0;
for (let i = 2; i < lags.length - 2; i++) {
  const isLocalMax =
    lags[i].r > lags[i - 1].r &&
    lags[i].r > lags[i - 2].r &&
    lags[i].r > lags[i + 1].r &&
    lags[i].r > lags[i + 2].r;
  // only count peaks after the signal has already decorrelated once
  if (isLocalMax && lags[i].lagS > decayTo(0.35) && lags[i].r > secondary) {
    secondary = lags[i].r;
    secondaryAt = lags[i].lagS;
  }
}
say(`  strongest recurrence  r=${num(secondary)} at ${num(secondaryAt, 1)} s`);
check(
  "signal decorrelates (no frozen facade)",
  decayTo(0.2) < 120,
  `<0.2 by ${num(decayTo(0.2), 1)}s`
);
check(
  "no loop recurrence within 3 minutes",
  secondary < 0.45,
  `r=${num(secondary)} at ${num(secondaryAt, 1)}s`
);

// individual windows must not march in lockstep
let identical = 0;
const samples = 40;
for (let a = 0; a < samples; a++) {
  for (let b = a + 1; b < samples; b++) {
    let same = true;
    for (let i = 0; i < 200; i++) {
      const t = i * 0.7;
      if (Math.abs(windowLife(a, 0, 137, t) - windowLife(b, 0, 137, t)) > 1e-6) {
        same = false;
        break;
      }
    }
    if (same) identical++;
  }
}
check("no two windows share a schedule", identical === 0, `${identical} identical pairs`);

// ── shader features ───────────────────────────────────────────────────────
say("\nWINDOW BEHAVIOUR");
check("slow occupancy cycles present", /float period = 90\.0 \+ h1 \* 240\.0/.test(bld));
check("brightness drifts continuously", /float drift = 0\.78/.test(bld));
check("some tubes fail and flicker", /if \(h3 > 0\.94\)/.test(bld));
check("occupant shadows cross panes", /shadowMask/.test(bld));
check("periods are per-window, not global", /lifeHash\(cell/.test(bld));

// ── neon ──────────────────────────────────────────────────────────────────
say("\nNEON SIGNAGE");
check("dropout + restrike behaviour", /if \(phase > 0\.93\)/.test(life));
check("restrike stutters", /float stutter = step\(0\.45, fract\(t \* 18\.0/.test(life));
check("mains buzz present", /0\.93 \+ 0\.07 \* sin\(uTime \* 41\.0/.test(life));
check("some signs have a dead segment", /float dead = step\(0\.86/.test(life));
check("tube has core + halo profile", /float core = /.test(life) && /float halo = /.test(life));

// neon dropout periods must differ per sign
function neonLit(seed, t) {
  const h = (x) => fract(Math.sin(x * 78.233 + seed * 41.7) * 43758.5453);
  const dropCycle = 14 + h(1) * 40;
  const phase = fract(t / dropCycle + h(2));
  let lit = 1;
  if (phase > 0.93) {
    const tt = (phase - 0.93) / 0.07;
    lit = mix(step(0.45, fract(tt * 18 + h(3) * 5)), 1, Math.max(0, Math.min(1, (tt - 0.6) / 0.4)));
  }
  return lit * (0.93 + 0.07 * Math.sin(t * 41 + seed * 9));
}
const periods = [];
for (let s = 0; s < 12; s++) {
  const h = (x) => fract(Math.sin(x * 78.233 + s * 41.7) * 43758.5453);
  periods.push(14 + h(1) * 40);
}
const uniquePeriods = new Set(periods.map((p) => Math.round(p * 10)));
say(`  dropout periods      ${periods.map((p) => p.toFixed(0)).join(", ")} s`);
check("every sign has its own period", uniquePeriods.size === periods.length, `${uniquePeriods.size}/${periods.length}`);
void neonLit;

// ── mechanical life ───────────────────────────────────────────────────────
say("\nMECHANICAL LIFE");
check("rooftop fans present", /rooftop extractor fans/i.test(life) || /FanSpec/.test(life));
check("some fans are seized", /seized/.test(life));
check("fans have individual rpm", /rpm: r\.range/.test(life));
check("steam vents present", /STEAM_VERT/.test(life));
check("steam bends downwind", /wind = \(0\.6 \+ uStorm \* 2\.4\)/.test(life));
check("steam billows internally", /float turb = n2/.test(life));
check("transformer arcs present", /transformer arcs/i.test(life));
check("arcs fire irregularly", /st\.next = 9 \+ Math\.random\(\) \* 34/.test(life));
check("arcs stutter as they die", /const stutter = Math\.random\(\) < 0\.45/.test(life));

// ── performance ───────────────────────────────────────────────────────────
say("\nPERFORMANCE");
const frameBody = life.match(/useFrame\(\(_, delta\) => \{([\s\S]*?)\n  \}\);/)[1];
const allocs = (frameBody.match(/new THREE\./g) ?? []).length;
say(`  allocations in frame loop  ${allocs}`);
check("no allocations in the frame loop", allocs === 0);
check("life is culled to a band around the walker", /ds < -BAND_BACK \|\| ds > BAND_FWD/.test(life));
check("arc pool is bounded", /quality\.simplified \? 0 : 3/.test(life));
check("blades respect instance capacity", /bladeN < fans\.bladeCapacity/.test(life));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
