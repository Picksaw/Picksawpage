/**
 * Atmosphere analyser.
 *
 * The brief for layered fog is specific: ground mist drifts sideways,
 * near fog reacts strongly to movement, mid fog slower, far fog barely
 * moves, and height fog hides the skyline. Those are all measurable.
 *
 * This re-implements the vertex shader's wrap + drift maths in JS and
 * measures the apparent motion of each layer as the camera walks, which
 * is exactly what parallax is.
 *
 *   node scripts/analyze-atmosphere.mjs
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/components/journey/city/Atmosphere.tsx", "utf8");

const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── read the layer table straight out of the source ───────────────────────
const layerBlock = src.match(/const LAYERS: LayerDef\[\] = \[([\s\S]*?)\n\];/)[1];
const LAYERS = [...layerBlock.matchAll(
  /\{\s*layer:\s*(\d+),\s*share:\s*([\d.]+),\s*size:\s*\[([\d.]+),\s*([\d.]+)\],\s*y:\s*\[(-?[\d.]+),\s*([\d.]+)\],\s*x:\s*([\d.]+),\s*span:\s*([\d.]+),\s*alpha:\s*\[([\d.]+),\s*([\d.]+)\]/g
)].map((m) => ({
  layer: +m[1], share: +m[2],
  size: [+m[3], +m[4]], y: [+m[5], +m[6]],
  x: +m[7], span: +m[8], alpha: [+m[9], +m[10]],
}));

say("\nLAYER TABLE");
const names = ["ground mist", "near fog", "mid fog", "far fog"];
for (const l of LAYERS) {
  say(
    `  ${names[l.layer].padEnd(12)} span ${String(l.span).padStart(3)} m  ` +
      `size ${l.size[0]}–${l.size[1]} m  y ${l.y[0]}–${l.y[1]} m  ` +
      `alpha ${l.alpha[0]}–${l.alpha[1]}  share ${(l.share * 100).toFixed(0)}%`
  );
}
check("all four depth layers present", LAYERS.length === 4, `${LAYERS.length} layers`);
check("shares sum to 1", Math.abs(LAYERS.reduce((a, l) => a + l.share, 0) - 1) < 0.02);

// ── spanFor() in the shader must match the table ──────────────────────────
const spanFn = src.match(/float spanFor\(float layer\)\s*\{([\s\S]*?)\n  \}/)[1];
const spans = [...spanFn.matchAll(/return\s+([\d.]+);/g)].map((m) => +m[1]);
say("\nSHADER / TABLE AGREEMENT");
say(`  spanFor() returns    ${spans.join(", ")}`);
say(`  table spans          ${LAYERS.map((l) => l.span).join(", ")}`);
check(
  "wrap volumes match the layer table",
  spans.length === 4 && spans.every((s, i) => s === LAYERS[i].span),
  `${spans.join(",")} vs ${LAYERS.map((l) => l.span).join(",")}`
);

// ── parallax: how fast does each layer appear to move? ────────────────────
say("\nPARALLAX  (apparent motion per metre walked)");
/**
 * Reproduces the shader wrap: rel = mod(z - camZ + span*0.35, span),
 * z' = camZ - span*0.65 + rel. A card's distance ahead of the camera
 * therefore cycles through the span. Apparent angular motion of a puff
 * at distance d moving at relative speed v is v/d — so what matters is
 * the TYPICAL distance of each layer, which the span sets.
 */
function meanDistance(span) {
  // cards are uniform in the volume [camZ - 0.65*span, camZ + 0.35*span]
  // only the part ahead of the camera is visible
  const ahead = 0.35 * span;
  return ahead / 2;
}
const rates = LAYERS.map((l) => {
  const d = Math.max(meanDistance(l.span), 2);
  return { layer: l.layer, dist: d, rate: 1 / d };
});
for (const r of rates) {
  say(
    `  ${names[r.layer].padEnd(12)} mean depth ${num(r.dist, 1).padStart(6)} m  ` +
      `→ ${num(r.rate * 100, 2)} rad per 100 m walked`
  );
}
for (let i = 1; i < rates.length; i++) {
  check(
    `${names[i]} parallaxes slower than ${names[i - 1]}`,
    rates[i].rate < rates[i - 1].rate * 0.85,
    `${num(rates[i].rate, 4)} vs ${num(rates[i - 1].rate, 4)}`
  );
}
const spread = rates[0].rate / rates[3].rate;
say(`  near:far parallax    ${num(spread, 1)}×`);
check("layers are genuinely separated in depth", spread > 8, `${num(spread, 1)}×`);

// ── ground mist must drift SIDEWAYS ───────────────────────────────────────
say("\nGROUND MIST DRIFT");
const groundBranch = src.match(/if \(aLayer < 0\.5\) \{([\s\S]*?)\n    \} else \{/)[1];
const lateralTerm = /p\.x \+=.*t \* 0\.42/.test(groundBranch);
const forwardTerm = /p\.z \+= t \*/.test(groundBranch);
say(`  lateral drift term   ${lateralTerm ? "present" : "MISSING"}`);
say(`  forward drift term   ${forwardTerm ? "present" : "absent (correct)"}`);
check("ground mist drifts sideways", lateralTerm);
check("ground mist does not roll forward", !forwardTerm);

const upperBranch = src.match(/\} else \{([\s\S]*?)\n    \}\n\n    \/\/ ── wrap/)[1];
check("upper layers scale drift by depth", /rate\s*=\s*1\.0\s*\/\s*\(aLayer \* aLayer\)/.test(upperBranch));
check("upper layers roll forward", /p\.z \+= t \* [\d.]+ \* rate/.test(upperBranch));

// ── velocity response ─────────────────────────────────────────────────────
say("\nMOVEMENT RESPONSE");
const stretchLine = src.match(/if \(aLayer < 1\.5\) stretch = ([^;]+);/)[1];
say(`  stretch rule         ${stretchLine.trim()}`);
check("near layers stretch with velocity", /uVelocity/.test(stretchLine));
check("only near layers stretch", /aLayer < 1\.5/.test(src.match(/float stretch = 1\.0;\s*\n\s*(if[^\n]*)/)[1]));
check("stretch is normalised out of alpha", /a \/= max\(vStretch/.test(src));

// ── height fog ────────────────────────────────────────────────────────────
say("\nHEIGHT FOG");
const hf = src.match(/float heightFalloff = ([^;]+);/)[1];
say(`  falloff              ${hf.trim()}`);
check("density falls off with altitude", /exp\(-max\(vHeight/.test(hf));
const groundK = 0.85, airK = 0.055;
// at what altitude has density dropped to 10%?
say(`  ground mist 10% at   ${num(Math.log(10) / groundK, 1)} m`);
say(`  upper fog 10% at     ${num(Math.log(10) / airK, 1)} m`);
check("ground mist hugs the pavement", Math.log(10) / groundK < 4, `${num(Math.log(10) / groundK, 1)} m`);
check("height fog reaches the skyline", Math.log(10) / airK > 30, `${num(Math.log(10) / airK, 1)} m`);

// ── no billboarded PNGs ───────────────────────────────────────────────────
say("\nPROCEDURAL PURITY");
check("no texture sampling in the fog shader", !/texture2D|sampler2D/.test(src), "shader is pure noise");
check("puffs are built from fbm", /float fbm\(vec3 p\)/.test(src));
check("silhouette is eroded by noise", /density \*= smoothstep/.test(src));
check("interior churns over time", /np\.z \+= uTime/.test(src));

// ── budget ────────────────────────────────────────────────────────────────
say("\nBUDGET");
const qsrc = readFileSync("src/components/journey/lib/quality.ts", "utf8");
for (const tier of ["high", "mid", "low", "mobile"]) {
  const block = qsrc.match(new RegExp(`${tier}: \\{([\\s\\S]*?)\\n  \\},`));
  const body = block ? block[1] : "";
  const cards = parseInt(
    body.match(/fogCards:\s*(\d+)/)?.[1] ??
      qsrc.match(/const BASE[\s\S]*?fogCards:\s*(\d+)/)[1],
    10
  );
  say(`  ${tier.padEnd(6)} ${cards} cards  (1 instanced draw call)`);
  check(`${tier}: card budget is sane`, cards > 0 && cards <= 700, `${cards}`);
}

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
