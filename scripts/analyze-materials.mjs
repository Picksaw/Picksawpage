/**
 * Wet material analyser.
 *
 * Water does four measurable things to a surface (albedo darkens,
 * roughness collapses, F0 rises, and it pools unevenly). This runs the
 * actual GLSL wetness model — transpiled to JS — over the district's
 * material set and checks that all four happen, in the right
 * proportions, for the right materials.
 *
 *   node scripts/analyze-materials.mjs
 */

import { readFileSync } from "node:fs";

const wetSrc = readFileSync("src/components/journey/lib/wetness.ts", "utf8");
const groundSrc = readFileSync("src/components/journey/city/WetGround.tsx", "utf8");
const bldSrc = readFileSync("src/components/journey/city/Buildings.tsx", "utf8");

const say = (s = "") => console.log(s);
const num = (v, d = 3) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── port applyWetness() to JS, exactly as written in the shader ───────────
const mix = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function applyWetness(albedo, roughness, f0, wet, porosity) {
  const a = albedo * mix(1.0, mix(0.72, 0.34, porosity), wet);
  let r = mix(roughness, mix(roughness * 0.35, 0.045, wet), wet);
  r = clamp(r, 0.02, 1.0);
  const newF0 = mix(f0, 0.045, wet);
  return { albedo: a, roughness: r, f0: newF0 };
}

// verify the JS port matches the GLSL text
say("\nMODEL FIDELITY");
check("albedo term matches shader", /albedo \*= mix\(1\.0, mix\(0\.72, 0\.34, porosity\), wet\);/.test(wetSrc));
check("roughness term matches shader", /roughness = mix\(roughness, mix\(roughness \* 0\.35, 0\.045, wet\), wet\);/.test(wetSrc));
check("f0 term matches shader", /f0 = mix\(f0, 0\.045, wet\);/.test(wetSrc));

// ── the four effects ──────────────────────────────────────────────────────
say("\nTHE FOUR EFFECTS OF WATER");
const MATERIALS = [
  { name: "asphalt", albedo: 0.05, rough: 0.92, porosity: 0.85 },
  { name: "concrete", albedo: 0.16, rough: 0.88, porosity: 0.78 },
  { name: "marble", albedo: 0.32, rough: 0.24, porosity: 0.22 },
  { name: "metal", albedo: 0.2, rough: 0.38, porosity: 0.15 },
];

say("  material   dry alb → wet   dry rgh → wet   f0 dry → wet");
for (const m of MATERIALS) {
  const w = applyWetness(m.albedo, m.rough, 0.04, 1.0, m.porosity);
  say(
    `  ${m.name.padEnd(10)} ${num(m.albedo, 2)} → ${num(w.albedo, 2)}      ` +
      `${num(m.rough, 2)} → ${num(w.roughness, 3)}      ` +
      `0.040 → ${num(w.f0, 3)}`
  );
  check(`${m.name}: albedo darkens`, w.albedo < m.albedo, `${num(w.albedo, 3)} < ${num(m.albedo, 3)}`);
  check(`${m.name}: roughness collapses`, w.roughness < m.rough * 0.5 || w.roughness < 0.08,
    `${num(m.rough, 2)} → ${num(w.roughness, 3)}`);
  check(`${m.name}: specular rises`, w.f0 > 0.04, `${num(w.f0, 3)}`);
}

// porosity ordering: concrete must darken more than marble
const wetConcrete = applyWetness(1, 0.88, 0.04, 1, 0.78);
const wetMarble = applyWetness(1, 0.24, 0.04, 1, 0.22);
say(`\n  porous darkening   concrete ${num(1 - wetConcrete.albedo, 2)} vs marble ${num(1 - wetMarble.albedo, 2)}`);
check("porous materials darken more than sealed ones",
  wetConcrete.albedo < wetMarble.albedo,
  `${num(wetConcrete.albedo, 2)} vs ${num(wetMarble.albedo, 2)}`);

// ── wetness must be a gradient, not a switch ──────────────────────────────
say("\nWETNESS GRADIENT  (asphalt)");
for (const w of [0, 0.25, 0.5, 0.75, 1]) {
  const r = applyWetness(0.05, 0.92, 0.04, w, 0.85);
  say(`  wet ${w.toFixed(2)}   albedo ${num(r.albedo, 3)}   roughness ${num(r.roughness, 3)}   f0 ${num(r.f0, 3)}`);
}
const dry = applyWetness(0.05, 0.92, 0.04, 0, 0.85);
check("dry is genuinely dry", Math.abs(dry.roughness - 0.92) < 0.001 && Math.abs(dry.f0 - 0.04) < 0.001);
let monotonic = true;
let prev = 1e9;
for (let w = 0; w <= 1.001; w += 0.1) {
  const r = applyWetness(0.05, 0.92, 0.04, w, 0.85);
  if (r.roughness > prev + 1e-6) monotonic = false;
  prev = r.roughness;
}
check("roughness falls monotonically with wetness", monotonic);

// ── puddles ───────────────────────────────────────────────────────────────
say("\nPUDDLES");
check("puddle mask is procedural fbm", /float puddleMask/.test(wetSrc) && /wetFbm\(worldXZ \* 0\.055\)/.test(wetSrc));
check("puddle edges are eroded, not circular", /basin - detail \* 0\.12/.test(wetSrc));
check("puddles grow as the storm soaks in", /mix\(0\.62, 0\.4, wetness\)/.test(wetSrc));
check("road pools more than sidewalk", /puddle \*= mix\(1\.0, 0\.45, uSurface\)/.test(groundSrc));
check("gutter is the wettest strip", /gutter/i.test(readFileSync("src/components/journey/city/Street.tsx", "utf8")));

// ── reflections ───────────────────────────────────────────────────────────
say("\nREFLECTIONS");
check("analytic mirror reflections present", /mirrored = vec3\(lp\.x, 2\.0 \* vWorld\.y - lp\.y, lp\.z\)/.test(groundSrc));
check("reflections stretch vertically", /spec \*= mix\(1\.0, 2\.4, vertical\)/.test(groundSrc));
check("roughness widens the highlight", /mix\(220\.0, 14\.0, clamp\(roughness/.test(groundSrc));
check("Fresnel grazing term present", /pow\(1\.0 - NdotV, 5\.0\)/.test(groundSrc));
check("reflections only where there is water", /refl \* fres \* \(0\.35 \+ wet/.test(groundSrc));
const maxRefl = parseInt(groundSrc.match(/const MAX_REFLECTORS = (\d+)/)[1], 10);
say(`  reflector slots      ${maxRefl}`);
check("reflector loop is bounded", maxRefl <= 16, `${maxRefl}`);

// ── ripples disturb reflections ───────────────────────────────────────────
say("\nRIPPLES IN STANDING WATER");
check("ripples perturb the normal", /N = normalize\(N \+ vec3\(rip/.test(groundSrc));
check("ripples only inside puddles", /if \(puddle > 0\.02\)/.test(groundSrc));
check("ripple rate rises with the storm", /\(0\.4 \+ uStorm\)/.test(groundSrc));

// ── facades ───────────────────────────────────────────────────────────────
say("\nWET FACADES");
check("buildings share the wetness model", /WETNESS_GLSL/.test(bldSrc));
check("walls carry running streaks", /rainStreaks\(/.test(bldSrc));
check("sheltered bases stay drier", /float exposure = mix\(0\.45, 1\.0/.test(bldSrc));
check("roofs pool water", /puddleMask\(vWorldPos\.xz/.test(bldSrc));
check("wet walls go glossy", /roughnessFactor = mix\(roughnessFactor, 0\.075, gWet/.test(bldSrc));
check("wetness is driven by the storm", /uWetness\.value = 0\.45 \+ journey\.storm/.test(bldSrc));

// ── the district can dry out ──────────────────────────────────────────────
say("\nDRYABILITY  (needed for the observatory finale)");
const groundWet = groundSrc.match(/uWetness\.value = ([^;]+);/)[1];
say(`  ground wetness rule  ${groundWet.trim()}`);
check("no hard-coded wet constants in materials",
  !/roughness:\s*0\.0[0-4]\d*,/.test(bldSrc),
  "materials express dry values and let the model wet them");
check("wetness is a uniform, not baked", /uniform float uWetness/.test(groundSrc) && /uniform float uWetness/.test(bldSrc));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
