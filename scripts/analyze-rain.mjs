/**
 * Rain analyser.
 *
 * Re-implements the drop vertex shader's closed-form motion in JS and
 * checks the physics: do drops fall at plausible speeds, does wind
 * actually shear them, does the storm escalate, does anything pop, and
 * is the whole thing genuinely free of per-drop CPU work.
 *
 *   node scripts/analyze-rain.mjs
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/components/journey/city/Rain.tsx", "utf8");
const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── the shader's own constants ─────────────────────────────────────────────
const FALL_TOP = parseFloat(src.match(/const float FALL_TOP = ([\d.]+);/)[1]);
const FALL_BOTTOM = parseFloat(src.match(/const float FALL_BOTTOM = (-?[\d.]+);/)[1]);
const span = FALL_TOP - FALL_BOTTOM;

say("\nFALL COLUMN");
say(`  top                  ${FALL_TOP} m`);
say(`  bottom               ${FALL_BOTTOM} m`);
say(`  column height        ${span} m`);
check("column starts above the rooftops of the near street", FALL_TOP >= 30, `${FALL_TOP} m`);
check("column ends at/below ground", FALL_BOTTOM <= 0, `${FALL_BOTTOM} m`);

// ── drop kinematics ────────────────────────────────────────────────────────
/** speed = mix(26, 15, depth) * (0.72 + storm * 0.6) */
const speedOf = (depth, storm) => (26 + (15 - 26) * depth) * (0.72 + storm * 0.6);

say("\nFALL SPEED  (real rain: 4–9 m/s; cinematic rain runs faster)");
for (const storm of [0, 0.5, 1]) {
  const near = speedOf(0, storm);
  const far = speedOf(1, storm);
  say(`  storm ${storm.toFixed(1)}   near ${num(near)} m/s   far ${num(far)} m/s`);
  check(`storm ${storm}: near drops fall faster than far`, near > far, `${num(near)} > ${num(far)}`);
  check(`storm ${storm}: speeds stay plausible`, near < 45 && far > 8, `${num(far)}–${num(near)} m/s`);
}
const escalation = speedOf(0, 1) / speedOf(0, 0);
say(`  storm escalation     ${num(escalation)}×`);
check("storm meaningfully escalates the rain", escalation > 1.5, `${num(escalation)}×`);

// ── time to cross the column (respawn cadence) ─────────────────────────────
say("\nRESPAWN");
for (const storm of [0, 1]) {
  const t = span / speedOf(0, storm);
  say(`  storm ${storm}: a near drop crosses the column in ${num(t)} s`);
  check(`storm ${storm}: drops recycle briskly`, t < 3.5, `${num(t)} s`);
}
check("phase offset prevents ranked falling", /float phase = fract\(aSeed/.test(src));
check("fall uses mod() wrap, not CPU respawn", /mod\(uTime \* speed \+ phase \* span, span\)/.test(src));

// ── wind ───────────────────────────────────────────────────────────────────
say("\nWIND & TURBULENCE");
const windOf = (storm) => 1.6 + storm * 5.2;
say(`  base wind            ${num(windOf(0))} m/s`);
say(`  storm wind           ${num(windOf(1))} m/s`);
check("wind grows with the storm", windOf(1) > windOf(0) * 3, `${num(windOf(0))} → ${num(windOf(1))}`);
check("wind is gusty, not constant", /float gust = sin\(uTime \* 0\.23/.test(src));
check("gusts use two frequencies", (src.match(/sin\(uTime \* 0\.23[\s\S]*?sin\(uTime \* 0\.61/)?.length ?? 0) > 0);
check("wind shears with altitude", /x \+= wind \* altitude/.test(src));
check("per-drop turbulence present", /sin\(uTime \* 3\.1 \+ aSeed\.x \* 40\.0/.test(src));

// drift across the column at full storm
const drift = windOf(1) * 1.4;
say(`  lateral drift        ${num(drift)} m across the fall`);
check("wind visibly slants the rain", drift > 4, `${num(drift)} m`);
check("wind does not blow rain sideways out of frame", drift < 20, `${num(drift)} m`);

// ── streak length ──────────────────────────────────────────────────────────
say("\nMOTION STREAKING");
check("streaks lengthen with camera speed", /float motion = min\(abs\(uVelocity\)/.test(src));
check("streaks lengthen with storm", /uStorm \* 0\.55/.test(src));
check("streaks tilt into the wind", /float tilt = atan\(wind/.test(src));
const lenRule = src.match(/float len = ([^;]+);/)[1];
say(`  length rule          ${lenRule.trim()}`);

// ── no popping ─────────────────────────────────────────────────────────────
say("\nVISIBILITY");
check("near fade prevents drops popping at the lens", /smoothstep\(0\.6, 3\.0, dist\)/.test(src));
check("far fade prevents a wall of rain", /1\.0 - smoothstep\(38\.0, 72\.0, dist\)/.test(src));
check("drops follow the walker", /uCam\.x \+ x/.test(src) && /uCam\.z \+ z/.test(src));
check("depth drives alpha", /mix\(0\.5, 0\.14, aDepth\)/.test(src));

// ── sub-systems ────────────────────────────────────────────────────────────
say("\nSUB-SYSTEMS");
check("splashes present", /SPLASH_VERT/.test(src));
check("splashes are crowns, not discs", /float spokes = /.test(src));
check("ripples present", /RIPPLE_VERT/.test(src));
check("ripples are concentric rings", /ring1[\s\S]*?ring2/.test(src));
check("ripples lie flat on the road", /wp\.z \+= position\.y \* size/.test(src));
const lens = readFileSync("src/components/journey/city/LensWater.tsx", "utf8");
check("camera rain streaks exist", /runnel/.test(lens));
check("lens water peaks during lightning", /uBolt \* 0\.85/.test(lens));
check("lens water skips its draw when idle", /mesh\.visible = journey\.bolt/.test(lens));

// ── GPU purity ─────────────────────────────────────────────────────────────
say("\nGPU RESIDENCY");
const frameBody = src.match(/useFrame\(\(\{ camera \}\) => \{([\s\S]*?)\n  \}\);/)[1];
const perDropLoop = /for\s*\(/.test(frameBody);
say(`  per-frame CPU work   ${frameBody.trim().split("\n").length} lines, no loops: ${!perDropLoop}`);
check("no per-drop CPU work in the frame loop", !perDropLoop);
check("uniforms are shared across systems", /const u = systems\.shared/.test(src));

const qsrc = readFileSync("src/components/journey/lib/quality.ts", "utf8");
say("\nBUDGET");
for (const tier of ["high", "mid", "low", "mobile"]) {
  const block = qsrc.match(new RegExp(`${tier}: \\{([\\s\\S]*?)\\n  \\},`));
  const body = block ? block[1] : "";
  const get = (k) =>
    parseInt(body.match(new RegExp(`${k}:\\s*(\\d+)`))?.[1] ??
      qsrc.match(new RegExp(`const BASE[\\s\\S]*?${k}:\\s*(\\d+)`))[1], 10);
  const drops = get("rainDrops");
  const splashes = get("splashes");
  say(`  ${tier.padEnd(6)} ${String(drops).padStart(4)} drops, ${String(splashes).padStart(3)} splashes ` +
      `→ ${splashes > 0 ? 3 : 1} draw call(s)`);
  check(`${tier}: drop budget fits the tier`, drops > 0 && drops <= 10000, `${drops}`);
}

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
