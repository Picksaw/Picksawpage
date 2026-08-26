/**
 * Geometry analyser — world-space footprints, not intentions.
 *
 * Every other harness checks the layout DATA. This one checks what the
 * meshes actually occupy once three.js has applied scale and rotation,
 * because those are different things and the difference is where the
 * bugs live.
 *
 * It exists because a plan-view render caught something no numeric test
 * had: `width` and `depth` were being placed as if width ran along the
 * street, but a box scaled (w, h, d) puts w on local X, which lands
 * PERPENDICULAR to a street running down -Z. Fourteen buildings had
 * their corners inside the sidewalk and three overlapped each other.
 * The data was right; the meshes were rotated 90 degrees wrong.
 *
 *   node scripts/analyze-geometry.mjs
 */

import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "picksaw-geo-"));
const of = join(dir, "l.mjs");
await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true, format: "esm", platform: "node", outfile: of, logLevel: "error",
});
const L = await import(pathToFileURL(of).href);

const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

/** three.js Y-rotation applied to a box's four ground corners. */
function corners(x, z, sx, sz, rotY) {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  return [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]].map(([lx, lz]) => {
    const px = lx * sx;
    const pz = lz * sz;
    return [x + px * c + pz * s, z - px * s + pz * c];
  });
}

/** Distance from a point to the street centreline, as a polyline. */
const CL = [];
for (let s = -220; s <= 920; s += 0.5) CL.push([L.pathX(s), -s]);
function distToStreet(x, z) {
  let best = Infinity;
  for (let i = 1; i < CL.length; i++) {
    const [x0, z0] = CL[i - 1];
    const [x1, z1] = CL[i];
    const dx = x1 - x0;
    const dz = z1 - z0;
    const t = Math.max(0, Math.min(1, ((x - x0) * dx + (z - z0) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - (x0 + dx * t), z - (z0 + dz * t)));
  }
  return best;
}

const ROAD = L.ROAD_HALF;
const FACADE = L.FACADE_X;
const city = L.buildCity(4);

// ── orientation ───────────────────────────────────────────────────────────
say("\nMESH ORIENTATION  (frontage must run ALONG the street)");
let wrongWay = 0;
let judged = 0;
for (const b of city) {
  const cs = corners(b.x, b.z, b.width, b.depth, b.rotY);
  const h = L.pathHeading(b.s);
  const tx = Math.sin(h);
  const tz = -Math.cos(h);
  let lo = Infinity;
  let hi = -Infinity;
  for (const [x, z] of cs) {
    const d = (x - L.pathX(b.s)) * tx + (z + b.s) * tz;
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  const along = hi - lo;
  // Only judge buildings whose plan is clearly elongated: a near-square
  // footprint has no distinguishable frontage, so calling it "wrong way"
  // would be measuring rounding, not orientation.
  if (Math.abs(b.width - b.depth) < 3) continue;
  judged++;
  if (Math.abs(along - b.width) > Math.abs(along - b.depth)) wrongWay++;
}
say(`  elongated buildings judged: ${judged}/${city.length}`);
say(`  frontage running the wrong way: ${wrongWay}`);
check("width is frontage, depth runs back", wrongWay === 0, `${wrongWay} of ${judged} rotated 90°`);

// ── the corridor is clear ─────────────────────────────────────────────────
say("\nCORRIDOR CLEARANCE");
let onRoad = 0;
let onWalk = 0;
let nearest = Infinity;
for (const b of city) {
  for (const [x, z] of corners(b.x, b.z, b.width, b.depth, b.rotY)) {
    const d = distToStreet(x, z);
    nearest = Math.min(nearest, d);
    if (d < ROAD) onRoad++;
    else if (d < FACADE - 0.2) onWalk++;
  }
}
say(`  roadway half-width   ${ROAD} m`);
say(`  facade line          ${FACADE} m`);
say(`  nearest mesh corner  ${num(nearest)} m`);
check("no building stands in the road", onRoad === 0, `${onRoad} corners`);
check("no building stands on the sidewalk", onWalk === 0, `${onWalk} corners`);
check("the corridor is fully open", nearest >= FACADE - 0.25, `${num(nearest)} m`);

// ── buildings do not intersect each other ─────────────────────────────────
say("\nMASS INTERSECTION");
function overlaps(a, b) {
  // separating-axis test on two rotated rectangles
  const A = corners(a.x, a.z, a.width, a.depth, a.rotY);
  const B = corners(b.x, b.z, b.width, b.depth, b.rotY);
  for (const poly of [A, B]) {
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = poly[i];
      const [x1, z1] = poly[(i + 1) % 4];
      const nx = -(z1 - z0);
      const nz = x1 - x0;
      let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
      for (const [x, z] of A) { const d = x * nx + z * nz; aMin = Math.min(aMin, d); aMax = Math.max(aMax, d); }
      for (const [x, z] of B) { const d = x * nx + z * nz; bMin = Math.min(bMin, d); bMax = Math.max(bMax, d); }
      if (aMax < bMin + 0.01 || bMax < aMin + 0.01) return false;
    }
  }
  return true;
}
const sorted = [...city].sort((a, b) => a.s - b.s);
let clashes = 0;
let worstPair = null;
for (let i = 0; i < sorted.length; i++) {
  for (let j = i + 1; j < sorted.length && sorted[j].s - sorted[i].s < 90; j++) {
    if (sorted[i].side !== sorted[j].side) continue;
    if (sorted[i].row !== sorted[j].row) continue;
    if (overlaps(sorted[i], sorted[j])) {
      clashes++;
      if (!worstPair) worstPair = [sorted[i], sorted[j]];
    }
  }
}
say(`  same-row same-side intersections: ${clashes}`);
check(
  "buildings on a row do not interpenetrate",
  clashes <= 2,
  worstPair ? `e.g. s=${worstPair[0].s.toFixed(0)} and s=${worstPair[1].s.toFixed(0)}` : "none"
);

// ── hero plots ────────────────────────────────────────────────────────────
say("\nHERO PLOTS  (+Z must point toward the street)");
let heroBad = 0;
for (const p of L.HERO_PLOTS) {
  const o = { x: 0, y: 0, z: 0 };
  L.pathOffset(p.s, p.side * p.lateral, o);
  const rotY = -L.pathHeading(p.s) + (p.side > 0 ? -Math.PI / 2 : Math.PI / 2);
  const c = Math.cos(rotY);
  const s2 = Math.sin(rotY);
  const at = (lz) => [o.x + lz * s2, o.z + lz * c];

  // main mass sits BACK from the street at local -depth/2
  const [mx, mz] = at(-p.depth * 0.5);
  let mass = Infinity;
  for (const [x, z] of corners(mx, mz, p.width, p.depth, rotY)) mass = Math.min(mass, distToStreet(x, z));
  // the canopy is the furthest element reaching toward the pavement
  const [cx, cz] = at(2.6);
  const canopy = distToStreet(cx, cz);

  const massOk = mass >= FACADE - 0.6;
  const canopyOk = canopy >= ROAD && canopy < FACADE;
  if (!massOk || !canopyOk) heroBad++;
  say(
    `  ${p.templateId.padEnd(8)} mass ${num(mass, 1).padStart(5)} m · canopy ${num(canopy, 1)} m` +
      `  ${massOk && canopyOk ? "" : "  *** " + (massOk ? "canopy" : "mass") + " misplaced ***"}`
  );
}
check("every hero mass sits behind the facade line", heroBad === 0, `${heroBad} misplaced`);
check("every canopy overhangs the sidewalk, not the road", heroBad === 0);

// ── lamps ─────────────────────────────────────────────────────────────────
say("\nSTREET FURNITURE");
let lampBad = 0;
for (const l of L.buildLamps()) {
  const d = distToStreet(l.x, l.z);
  if (d < ROAD - 0.1 || d > FACADE) lampBad++;
}
check("every lamp stands on a sidewalk", lampBad === 0, `${lampBad} misplaced`);

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
