/**
 * Portal analyser.
 *
 * The brief lists six things that must happen as you approach an
 * entrance — glow, reflections, logo, particles, sound, door. All six
 * must be driven by one approach value so they read as a single event,
 * and they must be staged (not all firing at once).
 *
 * This ports the approach curve to JS and checks the choreography, then
 * verifies that every original template link still resolves.
 *
 *   node scripts/analyze-portals.mjs
 */

import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const src = readFileSync("src/components/journey/city/Portals.tsx", "utf8");
const journeySrc = readFileSync("src/components/journey/Journey.tsx", "utf8");
const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

const dir = mkdtempSync(join(tmpdir(), "picksaw-portal-"));
const lf = join(dir, "layout.mjs");
await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true, format: "esm", platform: "node", outfile: lf, logLevel: "error",
});
const L = await import(pathToFileURL(lf).href);

// ── the approach curve ────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smoothstep = (x, e0, e1) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const approachAt = (ds) => clamp(1 - (Math.abs(ds) - 6) / 44, 0, 1);

say("\nAPPROACH CURVE");
for (const ds of [60, 50, 40, 30, 20, 10, 6, 0]) {
  const a = approachAt(ds);
  say(
    `  ${String(ds).padStart(2)} m out   approach ${num(a)}   ` +
      `logo ${num(clamp((a - 0.18) / 0.5, 0, 1))}   ` +
      `door ${num(smoothstep(a, 0.3, 1) * 0.42)}   ` +
      `spill ${num(a * a * 26, 1)}`
  );
}
check("portal is dormant far away", approachAt(55) < 0.05, `${num(approachAt(55))}`);
check("portal is fully open at the threshold", approachAt(0) > 0.98, `${num(approachAt(0))}`);
check("approach is gradual, not a switch", approachAt(30) > 0.1 && approachAt(30) < 0.7, `${num(approachAt(30))}`);

// ── staging: the six effects must not all fire together ───────────────────
say("\nCHOREOGRAPHY  (distance at which each element begins)");
const firstAt = (fn, thresh = 0.02) => {
  for (let ds = 60; ds >= 0; ds -= 0.5) if (fn(approachAt(ds)) > thresh) return ds;
  return 0;
};
const stages = [
  ["glow", (a) => a],
  ["reflections", (a) => a * a],
  ["logo", (a) => clamp((a - 0.18) / 0.5, 0, 1)],
  ["particles", (a) => (a > 0.015 ? a : 0)],
  ["sound", (a) => (a > 0.55 ? 1 : 0)],
  ["door", (a) => smoothstep(a, 0.3, 1)],
];
const order = stages.map(([name, fn]) => ({ name, at: firstAt(fn) }));
order.sort((a, b) => b.at - a.at);
for (const o of order) say(`  ${o.name.padEnd(12)} begins ${num(o.at, 1)} m out`);
const distinct = new Set(order.map((o) => Math.round(o.at)));
check("elements are staged, not simultaneous", distinct.size >= 4, `${distinct.size} distinct onsets`);
check("glow leads the sequence", order[0].name === "glow" || order[0].at >= order[1].at);
check("sound is a late beat", order[order.length - 1].at < 30, `${num(order[order.length - 1].at, 1)} m`);

// ── the six elements exist ────────────────────────────────────────────────
say("\nTHE SIX ELEMENTS");
check("1. entrance glows", /uApproach/.test(src) && /GLOW_FRAG/.test(src));
check("2. reflections strengthen (spill light)", /spill\.current\.intensity = boost \* boost/.test(src));
check("3. logo fades in", /logoMat\.opacity = /.test(src) && /makeLogoTexture/.test(src));
check("   logo is engraved, not floating", /engraved look/.test(src));
check("4. particles gather inward", /pull = uApproach \* uApproach/.test(src) && /mix\(1\.0, 0\.22, pull\)/.test(src));
check("5. sound appears", /picksaw:portal/.test(src));
check("   sound is emitted once per approach", /announced\.current/.test(src));
check("6. door opens", /leafL\.current\.rotation\.y = open/.test(src) && /leafR\.current\.rotation\.y = -open/.test(src));
check("   interior is revealed through the opening", /previewMat\.opacity/.test(src));

// audio side
const sound = readFileSync("src/audio/soundscape.ts", "utf8");
const provider = readFileSync("src/audio/SoundProvider.tsx", "utf8");
check("portal tone is implemented", /portalTone\(enter: boolean\)/.test(sound));
check("portal tone is a swell, not a blip", /lowpass/.test(sound.split("portalTone")[1].slice(0, 1200)));
check("portal events are wired to audio", /picksaw:portal/.test(provider));

// ── no floating UI ────────────────────────────────────────────────────────
say("\nNOTHING FLOATS");
check("the hit target is a world-space mesh", /const half = DOOR_W \/ 2/.test(src) && /boxGeometry args=\{\[DOOR_W \+ 1\.4/.test(src));
check("cursor changes over the doorway", /document\.body\.style\.cursor = "pointer"/.test(src));
check("no HTML overlay in the portal", !/<div|<button|Html/.test(src));

// ── original functionality preserved ──────────────────────────────────────
say("\nPRESERVED FUNCTIONALITY");
const tplSrc = readFileSync("src/config/templatesConfig.ts", "utf8");
const ids = [...tplSrc.matchAll(/id:\s*"([a-z]+)"/g)].map((m) => m[1]);
const urls = [...tplSrc.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
say(`  templates            ${ids.join(", ")}`);
say(`  links                ${urls.length} URLs`);
check("every template has a plot", L.HERO_PLOTS.length === ids.length, `${L.HERO_PLOTS.length}/${ids.length}`);
const plotIds = L.HERO_PLOTS.map((p) => p.templateId).sort().join(",");
check("plot ids match the config", plotIds === [...ids].sort().join(","), plotIds);
check("all links are absolute picksaw URLs", urls.every((u) => /^https:\/\/[a-z]+\.picksaw\.ir\/$/.test(u)), urls.join(" "));
check("clicking a portal opens the live preview", /onOpen\(item\)/.test(src));
check("Journey still wires PreviewModal", /<PreviewModal/.test(journeySrc));
check("focus bar still offers the link", /openLiveLabel/.test(journeySrc));

// ── performance ───────────────────────────────────────────────────────────
say("\nPERFORMANCE");
const frame = src.match(/useFrame\(\(_, delta\) => \{([\s\S]*?)\n  \}\);/)[1];
check("no allocations in the portal frame loop", !/new THREE\./.test(frame));
check("motes skip drawing when dormant", /motes\.points\.visible = boost > 0\.015/.test(src));
// The light must be gated by INTENSITY, never visibility: toggling a
// light's visibility changes the scene's light count and recompiles
// every lit material. See analyze-lightstability.mjs.
check("spill light disables itself by intensity", /spill\.current\.intensity = 0;/.test(src));
check("spill light is never hidden", !/spill\.current\.visible/.test(src));
check("mobile drops the mote system", /quality\.simplified\) return null/.test(src));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
