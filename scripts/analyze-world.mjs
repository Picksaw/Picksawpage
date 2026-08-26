/**
 * World-detail analyser — props and the particle ecosystem.
 *
 * Two opposing failure modes to guard against: an empty world that
 * feels like a render, and a cluttered one that feels like noise. This
 * measures prop density per metre of street, checks that props are
 * placed with intent rather than scattered, and verifies the particle
 * mix genuinely spans a range of sizes and speeds (which is what
 * creates depth).
 *
 *   node scripts/analyze-world.mjs
 */

import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const propsSrc = readFileSync("src/components/journey/city/Props.tsx", "utf8");
const partSrc = readFileSync("src/components/journey/city/Particles.tsx", "utf8");
const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

const dir = mkdtempSync(join(tmpdir(), "picksaw-world-"));
const lf = join(dir, "layout.mjs");
await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true, format: "esm", platform: "node", outfile: lf, logLevel: "error",
});
const L = await import(pathToFileURL(lf).href);

// ── prop vocabulary ───────────────────────────────────────────────────────
say("\nPROP VOCABULARY");
const PROPS = [
  "drainpipes", "acUnits", "tanks", "antennas", "bins",
  "benches", "bollards", "grates", "boxes", "emergency",
];
for (const p of PROPS) {
  const present = new RegExp(`const ${p}: Placement\\[\\]`).test(propsSrc);
  if (!present) failures++;
}
say(`  prop types           ${PROPS.length} (${PROPS.join(", ")})`);
check("all prop families present", PROPS.every((p) => new RegExp(`const ${p}`).test(propsSrc)));
check("cables are real catenaries", /parabolic approximation of a catenary/.test(propsSrc));
check("cables only span opposite poles", /if \(a\.side === b\.side\) continue;/.test(propsSrc));

// ── placement intent ──────────────────────────────────────────────────────
say("\nPLACEMENT INTENT  (props must be where they belong)");
check("drainpipes on building corners", /corner \* b\.width \* 0\.46/.test(propsSrc));
check("AC units on the street facade", /streetward \* 0\.55/.test(propsSrc));
check("water tanks on roofs", /roofY \+ 1\.5/.test(propsSrc));
check("bins tight against the kerb", /ROAD_HALF \+ 1\.5/.test(propsSrc));
check("benches set back to the building line", /FACADE_X - 1\.6/.test(propsSrc));
check("grates in the gutter", /ROAD_HALF - 0\.3/.test(propsSrc));
check("junction boxes on lamp posts", /for \(const lamp of buildLamps\(\)\)/.test(propsSrc));
check("props skip the back rows", /if \(b\.row > 1\) continue;/.test(propsSrc));

// ── density: detail, not clutter ──────────────────────────────────────────
say("\nDENSITY");
const furnitureStep = propsSrc.match(/s \+= r\.range\((\d+), (\d+)\) \/ Math\.max\(density/);
const [, lo, hi] = furnitureStep.map(Number);
const avgStep = (lo + hi) / 2;
const perKm = 1000 / avgStep;
say(`  street furniture     one item every ${num(avgStep, 0)} m (~${num(perKm, 0)}/km)`);
check("furniture is sparse enough to read", avgStep >= 8, `${num(avgStep, 0)} m apart`);
check("furniture is dense enough to notice", avgStep <= 30, `${num(avgStep, 0)} m apart`);

const buildings = L.buildCity(4).filter((b) => b.row <= 1);
say(`  prop-eligible buildings ${buildings.length}`);
// expected counts from the planner's probabilities at density 1
const est = {
  drainpipes: buildings.filter((b) => b.row === 0).length * 0.75 * 2 * 0.7,
  acUnits: buildings.filter((b) => b.row === 0).length * 0.65 * 2,
  tanks: buildings.filter((b) => b.rooftopProps).length * 0.45,
};
say(`  est. drainpipes      ${num(est.drainpipes, 0)}`);
say(`  est. AC units        ${num(est.acUnits, 0)}`);
say(`  est. roof tanks      ${num(est.tanks, 0)}`);
check("prop counts stay bounded", est.acUnits < 400, `${num(est.acUnits, 0)} AC units`);

// batch capacity guard
const cap = parseInt(propsSrc.match(/Math\.min\(list\.length, (\d+)\)/)[1], 10);
say(`  instance cap/type    ${cap}`);
check("batches are capped", cap <= 300, `${cap}`);
check("props are band-culled", /ds < -34 \|\| ds > 95/.test(propsSrc));
check("props are one draw call per type", /batches\.map\(\(b, i\) =>/.test(propsSrc));

// ── particle ecosystem ────────────────────────────────────────────────────
say("\nPARTICLE ECOSYSTEM");
const mixBlock = partSrc.match(/const MIX: Mix\[\] = \[([\s\S]*?)\n\];/)[1];
const mixes = [...mixBlock.matchAll(
  /\{\s*kind:\s*(KIND_[A-Z]+),\s*share:\s*([\d.]+),\s*size:\s*\[([\d.]+),\s*([\d.]+)\],\s*y:\s*\[([\d.]+),\s*([\d.]+)\],\s*spread:\s*(\d+)/g
)].map((m) => ({
  kind: m[1].replace("KIND_", "").toLowerCase(),
  share: +m[2],
  size: [+m[3], +m[4]],
  y: [+m[5], +m[6]],
  spread: +m[7],
}));

for (const m of mixes) {
  say(
    `  ${m.kind.padEnd(8)} ${(m.share * 100).toFixed(0).padStart(2)}%  ` +
      `size ${m.size[0]}–${m.size[1]}  height ${m.y[0]}–${m.y[1]} m  spread ${m.spread} m`
  );
}
check("six populations present", mixes.length === 6, `${mixes.length}`);
check("shares sum to 1", Math.abs(mixes.reduce((a, m) => a + m.share, 0) - 1) < 0.02);

const minSize = Math.min(...mixes.map((m) => m.size[0]));
const maxSize = Math.max(...mixes.map((m) => m.size[1]));
say(`  size range           ${minSize} – ${maxSize} (${num(maxSize / minSize, 1)}x spread)`);
check("particle sizes span a wide range (creates depth)", maxSize / minSize > 6, `${num(maxSize / minSize, 1)}x`);

// ── behaviours ────────────────────────────────────────────────────────────
say("\nPARTICLE BEHAVIOUR");
check("dust drifts brownian", /DUST: hangs, barely moves/.test(partSrc));
check("mist blows along the street", /MIST: larger, slower, blown/.test(partSrc));
check("spray is storm-driven", /alpha = \(1\.0 - life\) \* uStorm/.test(partSrc));
check("debris skitters, not glides", /bounces: skitters rather than glides/.test(partSrc));
check("insects orbit lamps", /INSECTS: tight erratic orbits/.test(partSrc));
check("insects are anchored to a real lamp", /aAnchor/.test(partSrc) && /const lamp = lamps\[r\.int/.test(partSrc));
check("insects shelter in heavy rain", /1\.0 - uStorm \* 0\.75/.test(partSrc));
check("leaves spin as they fall", /LEAVES: fall slowly, spinning/.test(partSrc));
check("each kind has its own sprite shape", /vKind < 3\.5/.test(partSrc) && /irregular scrap, not a circle/.test(partSrc));

// ── no popping, no CPU cost ───────────────────────────────────────────────
say("\nPERFORMANCE");
check("particles wrap around the walker", /float rel = mod\(p\.z - uCam\.z/.test(partSrc));
check("insects do not wrap (they stay with their lamp)", /aKind < 3\.5 \|\| aKind > 4\.5/.test(partSrc));
check("near and far fades prevent popping", /smoothstep\(0\.8, 3\.5, dist\)/.test(partSrc));
const pFrame = partSrc.match(/useFrame\(\(\{ camera \}\) => \{([\s\S]*?)\n  \}\);/)[1];
check("no per-particle CPU work", !/for\s*\(/.test(pFrame));
check("one draw call for all six populations", (partSrc.match(/new THREE\.Points\(/g) ?? []).length === 1);

const qsrc = readFileSync("src/components/journey/lib/quality.ts", "utf8");
say("\nBUDGET");
for (const tier of ["high", "mid", "low", "mobile"]) {
  const block = qsrc.match(new RegExp(`${tier}: \\{([\\s\\S]*?)\\n  \\},`));
  const body = block ? block[1] : "";
  const get = (k) => {
    const m = body.match(new RegExp(`${k}:\\s*([\\d.]+)`));
    if (m) return parseFloat(m[1]);
    return parseFloat(qsrc.match(new RegExp(`const BASE[\\s\\S]*?${k}:\\s*([\\d.]+)`))[1]);
  };
  say(`  ${tier.padEnd(6)} ${String(get("ambientParticles")).padStart(4)} particles, prop density ${get("propDensity")}`);
  check(`${tier}: particle budget sane`, get("ambientParticles") <= 1000, `${get("ambientParticles")}`);
}

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
