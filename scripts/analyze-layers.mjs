/**
 * DOM layer analyser.
 *
 * The 3D district is not alone on the page. The original site painted a
 * full-screen 2D storm canvas behind everything, and that canvas is
 * still mounted, still opaque, and still animating at 60 fps while the
 * WebGL city runs on top of it.
 *
 * Two full-screen canvases compositing every frame — one of them a 2D
 * context doing thousands of per-frame path strokes — is both a large
 * wasted cost and a correctness hazard: the browser must composite the
 * WebGL layer over an independently-animating opaque layer, and any
 * stacking/paint mismatch shows up as tearing and black flashes.
 *
 *   node scripts/analyze-layers.mjs
 */

import { readFileSync } from "node:fs";

const say = (s = "") => console.log(s);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

const app = readFileSync("src/App.tsx", "utf8");
const storm = readFileSync("src/components/StormBackground.tsx", "utf8");
const journey = readFileSync("src/components/journey/Journey.tsx", "utf8");

say("\nFULL-SCREEN LAYERS");
const stormOpaque = /getContext\("2d",\s*\{\s*alpha:\s*false\s*\}\)/.test(storm);
const stormFixed = /fixed inset-0 z-0/.test(storm);
const cityZ = journey.match(/fixed inset-0 z-\[(\d+)\]/)?.[1];
say(`  StormBackground      2D canvas, opaque=${stormOpaque}, ${stormFixed ? "fixed inset-0 z-0" : "?"}`);
say(`  Journey city         WebGL canvas, fixed inset-0 z-[${cityZ}]`);
say(`  film grain overlay   fixed inset-0 z-[80]`);

check("the city signals when it owns the frame", /setCityActive/.test(journey));
check("the flag is dropped when the walk ends", /setCityActive\(!faded\)/.test(journey));
check("the flag is dropped on unmount", /return \(\) => setCityActive\(false\)/.test(journey));
check("the 2D storm canvas parks itself", /subscribeCityActive/.test(storm));
check("parking cancels its rAF loop", /cancelAnimationFrame\(animId\);\n        \}\n        canvas\.style\.visibility = "hidden"/.test(storm));
check("parking hides the layer entirely", /canvas\.style\.visibility = "hidden"/.test(storm));
check("it resumes when the city stands down", /canvas\.style\.visibility = "";/.test(storm));
check("tab refocus cannot restart it under the city", /!reducedMotion && !cityOwnsFrame/.test(storm));
check("the subscription is cleaned up", /offCity\(\)/.test(storm));

say("\nCOST OF THE REDUNDANT LAYER");
const drops = storm.match(/share:\s*([\d.]+)/g) ?? [];
say(`  rain layers          ${drops.length}`);
const strokes = (storm.match(/ctx\.stroke\(\)/g) ?? []).length;
const fills = (storm.match(/ctx\.fillRect|ctx\.fill\(\)/g) ?? []).length;
say(`  per-frame 2D calls   ~${strokes} stroke sites, ${fills} fill sites`);
say(`  parked under the city ${/subscribeCityActive/.test(storm)}`);
void app;

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
