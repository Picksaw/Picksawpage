/**
 * City composition analyser.
 *
 * Renders nothing — it evaluates the layout maths that Phase 1 is
 * responsible for, so composition problems (repetitive spacing, flat
 * skylines, buildings colliding with the street, empty frames) are
 * caught numerically instead of by eye.
 *
 *   node scripts/analyze-city.mjs
 */

import { build } from "esbuild";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "picksaw-"));
const outfile = join(dir, "layout.mjs");

await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile,
  logLevel: "error",
});

const L = await import(pathToFileURL(outfile).href);

const say = (s = "") => console.log(s);
const num = (v, d = 1) => v.toFixed(d);

let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── path ───────────────────────────────────────────────────────────────────
say("\nCURVED PATH");
let maxLat = 0;
let maxHeading = 0;
let straightRun = 0;
let worstStraight = 0;
for (let s = 0; s <= L.JOURNEY_LENGTH; s += 2) {
  maxLat = Math.max(maxLat, Math.abs(L.pathX(s)));
  const h = Math.abs(L.pathHeading(s));
  maxHeading = Math.max(maxHeading, h);
  if (h < 0.02) {
    straightRun += 2;
    worstStraight = Math.max(worstStraight, straightRun);
  } else straightRun = 0;
}
say(`  lateral drift        ±${num(maxLat)} m`);
say(`  max heading          ${num((maxHeading * 180) / Math.PI)}°`);
say(`  longest straight run ${worstStraight} m`);
check("street genuinely curves", maxLat > 8, `${num(maxLat)} m of drift`);
check("no long straight corridor", worstStraight < 120, `${worstStraight} m straight`);
check("bends stay comfortable", (maxHeading * 180) / Math.PI < 22, `${num((maxHeading * 180) / Math.PI)}°`);

// ── hero plots ─────────────────────────────────────────────────────────────
say("\nHERO PLOTS");
const gaps = [];
for (let i = 1; i < L.HERO_PLOTS.length; i++) {
  gaps.push(L.HERO_PLOTS[i].s - L.HERO_PLOTS[i - 1].s);
}
const uniqueGaps = new Set(gaps.map((g) => Math.round(g)));
for (const p of L.HERO_PLOTS) {
  say(
    `  ${p.templateId.padEnd(9)} s=${String(Math.round(p.s)).padStart(4)}m  ` +
      `${p.side < 0 ? "left " : "right"}  ${num(p.width)}×${num(p.height)}m  ` +
      `${p.district.quarter}`
  );
}
check("every template has a plot", L.HERO_PLOTS.length === 6, `${L.HERO_PLOTS.length} plots`);
check("plot spacing is irregular", uniqueGaps.size === gaps.length, `${uniqueGaps.size}/${gaps.length} unique gaps`);
const sides = L.HERO_PLOTS.map((p) => p.side).join(",");
check("plots alternate sides", !/(-1,-1,-1)|(1,1,1)/.test(sides), sides);
const kinds = new Set(L.HERO_PLOTS.map((p) => p.district.kind));
check("multiple district personalities", kinds.size >= 4, [...kinds].join(", "));

// ── filler city ────────────────────────────────────────────────────────────
say("\nCITY MASSING");
const city = L.buildCity(4);
say(`  buildings generated  ${city.length}`);

const heights = city.map((b) => b.height);
const hMin = Math.min(...heights);
const hMax = Math.max(...heights);
const hAvg = heights.reduce((a, b) => a + b, 0) / heights.length;
const hStd = Math.sqrt(heights.reduce((a, b) => a + (b - hAvg) ** 2, 0) / heights.length);
say(`  height range         ${num(hMin)} – ${num(hMax)} m (avg ${num(hAvg)}, sd ${num(hStd)})`);
check("varied building heights", hStd > 12, `sd ${num(hStd)} m`);
check("has genuine towers", hMax > 90, `tallest ${num(hMax)} m`);
check("has low-rise too", hMin < 26, `shortest ${num(hMin)} m`);

// spacing rhythm along the street line
const row0 = city.filter((b) => b.row === 0).sort((a, b) => a.s - b.s);
const rowGaps = [];
for (let i = 1; i < row0.length; i++) rowGaps.push(row0[i].s - row0[i - 1].s);
const gapAvg = rowGaps.reduce((a, b) => a + b, 0) / rowGaps.length;
const gapStd = Math.sqrt(rowGaps.reduce((a, b) => a + (b - gapAvg) ** 2, 0) / rowGaps.length);
say(`  street-line spacing  avg ${num(gapAvg)} m, sd ${num(gapStd)} m`);
check("spacing is non-repetitive", gapStd > 6, `sd ${num(gapStd)} m`);

// asymmetry: is one side consistently taller than the other?
let asymSamples = 0;
let asymWins = 0;
for (let s = 0; s < L.JOURNEY_LENGTH; s += 40) {
  const near = (side) =>
    city
      .filter((b) => b.side === side && Math.abs(b.s - s) < 45)
      .reduce((m, b) => Math.max(m, b.height), 0);
  const l = near(-1);
  const r = near(1);
  if (l === 0 || r === 0) continue;
  asymSamples++;
  if (Math.abs(l - r) / Math.max(l, r) > 0.2) asymWins++;
}
const asymPct = (asymWins / asymSamples) * 100;
say(`  asymmetric skyline   ${num(asymPct)}% of stations`);
check("skyline is asymmetric", asymPct > 55, `${num(asymPct)}%`);

// nothing blocks the roadway
let intrusions = 0;
for (const b of city) {
  const lateral = Math.hypot(b.x - L.pathX(b.s), b.z + b.s);
  if (lateral - b.depth * 0.5 < L.ROAD_HALF + L.SIDEWALK - 1.5) intrusions++;
}
check("nothing intrudes on the street", intrusions === 0, `${intrusions} intrusions`);

// hero plots are clear of filler
let heroClashes = 0;
for (const p of L.HERO_PLOTS) {
  for (const b of city) {
    if (b.row !== 0 || b.side !== p.side) continue;
    if (Math.abs(b.s - p.s) < (b.width + p.width) * 0.5 - 4) heroClashes++;
  }
}
check("hero plots are unobstructed", heroClashes === 0, `${heroClashes} clashes`);

// ── what you actually see ──────────────────────────────────────────────────
say("\nFRAME COMPOSITION  (46° lens, 140 m draw band)");
/**
 * Measures how much of the horizontal frame architecture actually
 * occupies — the honest question is "is the frame full?", not "how many
 * building centres sit inside the cone". Each building contributes the
 * angular interval it subtends; the intervals are unioned and clipped
 * to the lens.
 */
const FOV = (46 * Math.PI) / 180;
const HALF = FOV / 2;
let worstCover = Infinity;
let worstAt = 0;
let coverSum = 0;
let silhouetteSum = 0;
let samples = 0;

for (let s = 0; s < L.JOURNEY_LENGTH; s += 15) {
  const eye = L.pathPoint(s);
  const ex = eye.x;
  const ez = eye.z;
  const ahead = L.pathPoint(s + 26);
  const heading = Math.atan2(ahead.x - ex, ahead.z - ez);

  const spans = [];
  let tallest = 0;
  for (const b of city) {
    const dx = b.x - ex;
    const dz = b.z - ez;
    const dist = Math.hypot(dx, dz);
    if (dist > 140 || dist < 3) continue;
    // signed bearing relative to the look direction
    let bearing = Math.atan2(dx, dz) - heading;
    while (bearing > Math.PI) bearing -= Math.PI * 2;
    while (bearing < -Math.PI) bearing += Math.PI * 2;
    const ext = Math.atan2(Math.max(b.width, b.depth) * 0.5, dist);
    const lo = Math.max(-HALF, bearing - ext);
    const hi = Math.min(HALF, bearing + ext);
    if (hi <= lo) continue;
    spans.push([lo, hi]);
    // apparent height in the frame (how much silhouette it throws up)
    tallest = Math.max(tallest, Math.atan2(b.height - 1.7, dist));
  }

  spans.sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cur = -Infinity;
  for (const [lo, hi] of spans) {
    const start = Math.max(lo, cur);
    if (hi > start) {
      covered += hi - start;
      cur = hi;
    }
  }
  const pct = (covered / FOV) * 100;
  coverSum += pct;
  silhouetteSum += (tallest * 180) / Math.PI;
  samples++;
  if (pct < worstCover) {
    worstCover = pct;
    worstAt = s;
  }
}

say(`  avg frame coverage   ${num(coverSum / samples)}%`);
say(`  weakest station      ${num(worstCover)}% @ s=${worstAt} m`);
say(`  avg silhouette rise  ${num(silhouetteSum / samples)}° above the eye`);
check("frame is never empty", worstCover > 45, `${num(worstCover)}% at s=${worstAt}`);
check("frame is well filled", coverSum / samples > 70, `avg ${num(coverSum / samples)}%`);
check("architecture towers over you", silhouetteSum / samples > 25, `${num(silhouetteSum / samples)}°`);

// ── lamps ──────────────────────────────────────────────────────────────────
say("\nSTREET LAMPS");
const lamps = L.buildLamps();
let alternating = true;
for (let i = 1; i < lamps.length; i++) if (lamps[i].side === lamps[i - 1].side) alternating = false;
say(`  lamps                ${lamps.length}`);
check("lamps stagger sides", alternating);
check("lamp pitch is sane", lamps.length > 25 && lamps.length < 60, `${lamps.length} lamps`);

// ── skyline ────────────────────────────────────────────────────────────────
say("\nDISTANT SKYLINE");
const sky = L.buildSkyline(90);
const dists = sky.map((t) => Math.abs(t.x - L.pathX(-t.z)));
say(`  towers               ${sky.length}`);
say(`  distance range       ${num(Math.min(...dists))} – ${num(Math.max(...dists))} m`);
check("skyline is far away", Math.min(...dists) > 100, `nearest ${num(Math.min(...dists))} m`);

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
