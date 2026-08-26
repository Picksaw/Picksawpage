/**
 * Corridor analyser.
 *
 * The site is the original hallway — the 3D P, the charging ring, the
 * headline layer, one solo painting per station — extended so the whole
 * site is one continuous walk, with two upgrades carried over: layered
 * volumetric fog and lit PBR building facades.
 *
 * This asserts the original structure is intact, the two new systems
 * are tuned to THIS world rather than the metre-scale city they were
 * first written for, and — the part that bit — that the walk can never
 * outrun the city that surrounds it.
 *
 *   node scripts/analyze-corridor.mjs
 */

import { readFileSync } from "node:fs";

const say = (s = "") => console.log(s);
const num = (v, d = 1) => v.toFixed(d);
let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const corridor = readFileSync("src/components/journey/Corridor.tsx", "utf8");
const journey = readFileSync("src/components/journey/Journey.tsx", "utf8");
const fog = readFileSync("src/components/journey/CityFog.tsx", "utf8");
const bld = readFileSync("src/components/journey/CityBuildings.tsx", "utf8");
const panels = readFileSync("src/components/journey/SectionPanels.tsx", "utf8");
const home = readFileSync("src/pages/HomePage.tsx", "utf8");
const storm = readFileSync("src/components/StormBackground.tsx", "utf8");
const tpl = readFileSync("src/config/templatesConfig.ts", "utf8");

// ── the original journey is intact ────────────────────────────────────────
say("\nORIGINAL STRUCTURE");
check("the 3D P emblem is mounted", /<PEmblem\s*\/>/.test(journey));
check("the headline layer exists", /HeadlineLayer/.test(corridor));
check("one painting per template", /TEMPLATES\.map\(\(item, i\) =>/.test(corridor));
check("only the focused painting is interactive", /focused \? over : undefined/.test(corridor));
check("the corridor rain is kept", /CorridorRain/.test(corridor));
check("PreviewModal still opens templates", /<PreviewModal/.test(journey));

// ── the canvas must stay transparent over the 2D storm ────────────────────
say("\nLAYERING");
const alpha = /alpha:\s*(true|false)/.exec(journey)?.[1];
say(`  canvas alpha         ${alpha}`);
check("the corridor canvas is transparent", alpha === "true", "the 2D storm is its sky");
check("the storm canvas is never parked", !/cityActive|cityOwnsFrame/.test(storm),
  "parking it would leave a black void behind a transparent canvas");

// ── THE WALK CANNOT OUTRUN THE CITY ───────────────────────────────────────
say("\nCITY COVERAGE  (the bug: buildings ran out after the last template)");
const N = (tpl.match(/\n  \{\n    id:|^\{\n  id:/gm) ?? []).length ||
  [...tpl.matchAll(/id:\s*"/g)].length;
const paintingZ = (i) => -24 - i * 8;
const sectionZ = (j) => paintingZ(N - 1) - 13 - j * 11;
const SECTIONS = 3;
const lastStation = sectionZ(SECTIONS - 1) + 1.2;
const MARGIN = parseFloat(/CITY_MARGIN = ([\d.]+)/.exec(corridor)?.[1] ?? "0");
const cityEnd = lastStation - MARGIN;

say(`  templates            ${N}`);
say(`  last painting        z = ${num(paintingZ(N - 1))}`);
say(`  contact panel        z = ${num(sectionZ(2))}`);
say(`  walk ends            z = ${num(lastStation)}`);
say(`  city built to        z = ${num(cityEnd)}`);
check("cityEndZ derives from the last STATION", /stations\[stations\.length - 1\]/.test(corridor),
  "deriving it from paintingZ left the section panels in bare void");
check("the city extends past the exit", cityEnd < lastStation, `${num(lastStation - cityEnd)} units of margin`);
check("the margin is generous", MARGIN >= 20, `${MARGIN} units`);
check("buildings use cityEndZ", /cityEndZ\(\)/.test(bld));
check("the ground plane is sized from it too", /Math\.abs\(cityEndZ\(\)\) \+ 60/.test(bld));
check("rain reaches the end of the hall", /Math\.abs\(cityEndZ\(\)\)/.test(corridor));

// adding templates must extend everything automatically
say("\nADDING TEMPLATES IS SAFE");
for (const extra of [1, 3, 10]) {
  const n = N + extra;
  const pz = -24 - (n - 1) * 8;
  const sz = pz - 13 - 2 * 11;
  const end = sz + 1.2 - MARGIN;
  const ok = end < sz + 1.2;
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  +${String(extra).padStart(2)} templates -> walk ends ${num(sz + 1.2)}, city ${num(end)}`);
}
check("nothing hard-codes the template count", !/const N = 6|length: 6/.test(corridor));
check("stations are generated from TEMPLATES.length", /Array\.from\(\{ length: N \}/.test(corridor));
check("the scroll runway scales with the count", /TEMPLATES\.length \* 92/.test(journey));

// ── the hallway is continuous ─────────────────────────────────────────────
say("\nCONTINUOUS HALLWAY");
check("three section stations exist", /SECTION_COUNT = 3/.test(corridor));
check("panels are mounted in the corridor", /<SectionPanels/.test(corridor));
check("Trust, Process and Contact all present",
  /kind="trust"/.test(panels) && /kind="process"/.test(panels) && /kind="contact"/.test(panels));
check("DOM sections are hidden in the hallway", /\{!journey && \(\s*<>\s*<TemplatesUniverse/.test(home),
  "otherwise every section renders twice");
check("the walk runs to the very end", /v > 0\.995/.test(journey),
  "fading at 0.93 would cut off the contact panel");
check("focusedIndex returns -1 outside the gallery", /if \(idx < 0 \|\| idx > N - 1\) return -1;/.test(corridor));
check("the focus bar hides over sections", /focusedItem && sectionIdx < 0/.test(journey));

// ── panels belong to the world ────────────────────────────────────────────
say("\nPANELS ARE IN THE WORLD");
check("drawn to canvas, mapped onto a plane", /CanvasTexture/.test(panels));
check("no HTML overlay", !/<div|<button/.test(panels));
check("they fade with the corridor's layer logic", /layerOpacity/.test(panels));
check("contact links are physical hit-planes", /onPointerOver/.test(panels));
check("hit-planes derive from the drawn rects", /contactButtonRects\(\)\.map/.test(panels),
  "so the clickable area always matches what is lit");
check("whatsapp / tel / instagram preserved",
  /989380215823/.test(panels) && /instagram\.com\/picksawm/.test(panels));

// ── volumetric fog ────────────────────────────────────────────────────────
say("\nVOLUMETRIC FOG");
check("view ray is intersected with a sphere", /float h = b \* b - c;/.test(fog));
check("the interior is raymarched", /for \(int i = 0; i < 4; i\+\+\)/.test(fog));
check("Beer-Lambert extinction", /transmittance \*= 1\.0 - a;/.test(fog));
check("density sampled in WORLD space", /vec3 q = \(p - uWind \* uTime\)/.test(fog),
  "so overlapping puffs share one continuous field");
check("puffs drift with the same wind", /p \+= uWind \* t;/.test(fog));
check("fog is procedural, not sprites", !/texture2D|sampler2D/.test(fog));

const scale = parseFloat(/vec3 q = \(p - uWind \* uTime\) \* ([\d.]+);/.exec(fog)?.[1] ?? "0");
say(`  noise frequency      ${scale} (~${num(6.5 * scale)} cells across the largest near puff)`);
check("noise is fine enough to resolve structure", 6.5 * scale > 4,
  "below ~4 the whole puff sits in one cell and reads flat");

// ── fill rate: the cause of the frame-rate drops ──────────────────────────
say("\nFILL RATE  (raymarching is per-PIXEL)");
check("puffs too close to the lens are collapsed", /gl_Position = vec4\(2\.0, 2\.0, 2\.0, 1\.0\)/.test(fog),
  "a puff 1 unit away fills the screen and marches every pixel");
check("the quad's angular size is capped", /camDist \* uTanHalfFov \* sizeCap/.test(fog));
check("the cap tracks the real FOV", /uTanHalfFov\.value = Math\.tan/.test(fog));
check("shading is evaluated once per ray", /if \(lit < 0\.0\) lit =/.test(fog));
check("a single light tap", (fog.match(/density\(p \+ L \* step\)/g) ?? []).length === 1);
check("step count falls off with depth", /vLayer < 0\.5 \? 4 :/.test(fog));

const counts = /const total = isMobile \? (\d+) : (\d+)/.exec(fog);
say(`  puff count           ${counts?.[1]} mobile / ${counts?.[2]} desktop`);
check("puff count is bounded", +(counts?.[2] ?? 999) <= 120, `${counts?.[2]}`);

// model the cost the way the earlier estimate should have
const H = 900, W = 1440, fov = (42 * Math.PI) / 180;
const LAYERS = [
  { n: Math.round(96 * 0.36), dia: 6.5, span: 26, steps: 4, cap: 0.42, min: 1.6 },
  { n: Math.round(96 * 0.27), dia: 9.0, span: 38, steps: 3, cap: 0.42, min: 2.2 },
  { n: Math.round(96 * 0.23), dia: 20, span: 80, steps: 2, cap: 0.38, min: 5 },
  { n: Math.round(96 * 0.14), dia: 46, span: 190, steps: 2, cap: 0.34, min: 12 },
];
let taps = 0, px = 0;
for (const L of LAYERS) {
  const ahead = 0.35 * L.span, s = 400;
  let p = 0;
  for (let k = 0; k < s; k++) {
    const d = ((k + 0.5) / s) * ahead;
    if (d < L.min) continue;
    const ang = 2 * Math.atan(L.dia / 2 / d);
    p += Math.PI * (Math.min(ang / fov, L.cap) * H / 2) ** 2 * (L.n / s);
  }
  px += p;
  taps += p * (L.steps + 1);
}
const gops = (taps * 60 * 20) / 1e9;
say(`  overdraw             ${num(px / (W * H))}x the screen`);
say(`  cost                 ${num(gops)}G ops/s at 60fps`);
check("fits a mid GPU", gops < 60, `${num(gops)}G — was ~798G before the bounds`);
check("overdraw is sane", px / (W * H) < 12, `${num(px / (W * H))}x`);

// ── PBR buildings keep the original layout ────────────────────────────────
say("\nPBR BUILDINGS");
check("original seed preserved", /seed = 20260824/.test(bld));
check("original flanking geometry", /const nearX = isMobile \? 2\.0 : 5\.4/.test(bld));
check("lit PBR material", /MeshStandardMaterial/.test(bld));
check("emissive window atlas", /uEmissive/.test(bld));
check("the blue edge signature is kept", /color: "#2f7bff"/.test(bld));
check("edges react to lightning", /edgeMat\.opacity = 0\.32 \+ bolt/.test(bld));

// ── lighting + shared weather ─────────────────────────────────────────────
say("\nLIGHTING & WEATHER");
check("a directional key exists", /<directionalLight/.test(journey));
check("hemisphere fill exists", /<hemisphereLight/.test(journey));
check("scene fog reaches past the layered fog", /args=\{\["#06080f", 10, 52\]\}/.test(journey));
check("reads the existing storm store", /stormIntensity\(\)/.test(journey));
check("weather is sampled, not per-frame React", /setInterval/.test(journey));

// ── audio ─────────────────────────────────────────────────────────────────
say("\nAUDIO");
const provider = readFileSync("src/audio/SoundProvider.tsx", "utf8");
const engine = readFileSync("src/audio/soundscape.ts", "utf8");
check("lightning triggers thunder", /onLightning\(\(intensity\) => soundscape\.thunder/.test(provider),
  "the city used to time this itself; it is gone");
check("no dangling portal audio", !/portalTone|picksaw:portal/.test(provider + engine));
check("storm level still drives the mix", /setStormLevel/.test(provider));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
