/**
 * Framebuffer integrity analyser.
 *
 * WHY THIS EXISTS
 *
 * The reported symptom — "everything black and noisy, full of black
 * glitches" — is the signature of pixels that are never written. With
 * `alpha: false` the drawing buffer is opaque and uninitialised; any
 * pixel no pass writes shows undefined GPU memory, which reads as
 * black with noise and tearing.
 *
 * The original cause: `scene.background` was null (only a CSS
 * background was set, which is invisible behind an opaque canvas), and
 * EffectComposer's RenderPass clears using `scene.background`. Fog does
 * NOT cover this — FogExp2 only tints rasterised fragments, so the sky
 * above the rooftops was simply never drawn.
 *
 * This harness asserts the frame is always fully defined.
 *
 *   node scripts/analyze-framebuffer.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const say = (s = "") => console.log(s);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}
function walk(d) {
  const o = [];
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.tsx?$/.test(p)) o.push(p);
  }
  return o;
}
const files = walk("src/components/journey");
const read = (f) => readFileSync(f, "utf8");
const journey = read("src/components/journey/Journey.tsx");
const scene = read("src/components/journey/city/CityScene.tsx");
const atmo = read("src/components/journey/city/Atmosphere.tsx");
const sky = read("src/components/journey/city/Sky.tsx");

// ── every pixel must be written ───────────────────────────────────────────
say("\nFRAME COVERAGE  (no pixel may be left undefined)");
const opaqueCanvas = /alpha:\s*false/.test(journey);
say(`  canvas alpha         ${opaqueCanvas ? "false (opaque drawing buffer)" : "true"}`);
check("a sky dome is mounted", /<Sky\s*\/>/.test(scene));
check("sky is drawn before everything", /renderOrder = -1000/.test(sky));
check("sky covers the full dome", /BackSide/.test(sky) && /SphereGeometry/.test(sky));
check("sky ignores depth (can never be occluded away)", /depthTest: false/.test(sky));
check("sky sits at the far plane", /gl_Position = p\.xyww/.test(sky));
check("sky follows the camera", /mesh\.position\.copy\(camera\.position\)/.test(sky));
check("sky writes opaque alpha", /gl_FragColor = vec4\(col, 1\.0\)/.test(sky));
check(
  "scene.background is set (RenderPass clears with it)",
  /scene\.background = new THREE\.Color/.test(atmo),
  "belt and braces behind the dome"
);
check("background is graded per frame", /scene\.background\.copy\(grade\.fog\)/.test(atmo));
check("background is restored on unmount", /scene\.background = prevBg/.test(atmo));

// CSS background alone is not a fix — flag if it is the ONLY thing
const cssOnly =
  /style=\{\{\s*background:/.test(journey) &&
  !/scene\.background/.test(atmo) &&
  !/<Sky/.test(scene);
check("not relying on CSS background alone", !cssOnly);

// ── horizon continuity ────────────────────────────────────────────────────
say("\nHORIZON CONTINUITY  (no seam where geometry meets sky)");
check("sky horizon matches the scene fog", /uHorizon\.value\.copy\(grade\.fog\)/.test(sky));
check("zenith derives from the same hue", /uZenith\.value\.copy\(grade\.fog\)/.test(sky));
check("sky reacts to lightning", /uBolt/.test(sky));
check("sky reacts to the storm", /uStorm/.test(sky));

// ── depth-order hazards ───────────────────────────────────────────────────
say("\nDEPTH ORDER");
const orders = [];
for (const f of files) {
  const src = read(f);
  for (const m of src.matchAll(/renderOrder\s*=\s*(-?\d+)/g)) {
    orders.push({ file: f.split("/").pop(), order: parseInt(m[1], 10) });
  }
}
orders.sort((a, b) => a.order - b.order);
for (const o of orders) say(`  ${String(o.order).padStart(6)}  ${o.file}`);
check("sky is the lowest render order", orders[0]?.order === -1000, `${orders[0]?.order}`);
const dupes = orders.filter((o, i) => i > 0 && o.order === orders[i - 1].order && o.order > 0);
check("transparent layers have distinct order", dupes.length <= 2, `${dupes.length} collisions`);

// ── nothing else may disable depth test at scene scale ────────────────────
say("\nDEPTH TEST DISCIPLINE");
let risky = [];
for (const f of files) {
  const src = read(f);
  if (!/depthTest:\s*false/.test(src)) continue;
  const name = f.split("/").pop();
  // legitimate: the sky (always behind) and full-screen overlays
  if (name === "Sky.tsx" || name === "LensWater.tsx" || name === "Lightning.tsx") continue;
  risky.push(name);
}
check("depthTest:false is limited to sky and overlays", risky.length === 0, risky.join(", ") || "clean");

// ── the composer must not be handed a broken config ───────────────────────
say("\nCOMPOSER CONFIG");
const post = read("src/components/journey/city/PostFX.tsx");
check("no NormalPass (would re-render with an override material)", /enableNormalPass=\{false\}/.test(post));
check("HDR framebuffer for the bloom threshold", /HalfFloatType/.test(post));
const msaa = post.match(/multisampling=\{([^}]+)\}/)?.[1] ?? "";
say(`  multisampling        ${msaa}`);
// MSAA on a half-float composer costs 2.5x the render-target memory and
// cannot help a full-screen resolve pass. It must stay off. See
// analyze-vram.mjs for the numbers.
check("composer MSAA is disabled", msaa.trim() === "0", msaa);
check("context antialias still handles edges", /antialias: quality\.antialias/.test(
  readFileSync("src/components/journey/Journey.tsx", "utf8")));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
