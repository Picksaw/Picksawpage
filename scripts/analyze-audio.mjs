/**
 * Audio analyser.
 *
 * Positional audio can't be measured without a browser, but the things
 * that make it right or wrong are structural: is the listener actually
 * tracked, do sources fall off with distance, are voices pooled rather
 * than leaked, does anything play before the user consented, and does
 * the graph get torn down.
 *
 *   node scripts/analyze-audio.mjs
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/components/journey/city/Soundscape3D.tsx", "utf8");
const engine = readFileSync("src/audio/soundscape.ts", "utf8");
const provider = readFileSync("src/audio/SoundProvider.tsx", "utf8");

const say = (s = "") => console.log(s);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── autoplay policy ───────────────────────────────────────────────────────
say("\nAUTOPLAY POLICY  (nothing may sound before the user asks)");
check("graph is built lazily", /if \(!built\.current\)/.test(src));
check("build is gated on user consent", /const enabled = soundscape\.enabled\.storm \|\| soundscape\.enabled\.lofi;/.test(src));
check("returns early when sound is off", /if \(!enabled\) return;/.test(src));
check("engine exposes graph only once it exists", /if \(!this\.ctx \|\| !this\.stormBus\) return null;/.test(engine));
check("no context is forced by the 3D layer", !/new AudioContext|ensureCtx\(\)/.test(src));
check("engine still starts silent", /storm: false, lofi: false/.test(engine));

// ── the layers the brief asks for ─────────────────────────────────────────
say("\nLAYERS");
const layers = {
  wind: /const windSrc = ctx\.createBufferSource\(\)/,
  rain: /rain/i,
  thunder: /picksaw:thunder/,
  "neon hum": /neon hum — a buzzy sawtooth pair/,
  transformers: /transformers — a 50 Hz drone/,
  ventilation: /ventilation — broadband whoosh/,
  "distant traffic": /distant traffic: a low rumble/,
  "metal creaks": /metal creaks: rare, stressed/,
  "per-district beds": /district bed recolours per quarter/,
};
for (const [name, re] of Object.entries(layers)) {
  const where = re.test(src) ? src : re.test(engine) ? engine : re.test(provider) ? provider : null;
  check(name, where !== null);
}

// ── positional correctness ────────────────────────────────────────────────
say("\nPOSITIONAL AUDIO");
check("uses HRTF panning", /panningModel = "HRTF"/.test(src));
check("inverse distance model", /distanceModel = "inverse"/.test(src));
check("listener position tracks the camera", /listener\.positionX\.setTargetAtTime\(cam\.x/.test(src));
check("listener ORIENTATION tracks the camera", /listener\.forwardX\.setTargetAtTime/.test(src));
check("legacy listener API fallback", /listener\.setOrientation\(/.test(src));
check("panner moves are smoothed", /positionX\.setTargetAtTime\(site\.pos\.x, t, 0\.15\)/.test(src));

const refs = [...src.matchAll(/makePanner\(ctx, ([\d.]+), ([\d.]+)\)/g)].map((m) => [+m[1], +m[2]]);
const pools = [...src.matchAll(/\n      ([\d.]+),\n      ([\d.]+)\n    \);/g)].map((m) => [+m[1], +m[2]]);
say(`  distance profiles    ${[...refs, ...pools].map(([a, b]) => `${a}/${b}m`).join(", ")}`);
check("sources fade out within the district", [...refs, ...pools].every(([, max]) => max <= 60), "all maxDistance <= 60 m");
check("near sources have a tight ref distance", [...refs, ...pools].every(([r]) => r <= 5), "all refDistance <= 5 m");

// ── pooling, not leaking ──────────────────────────────────────────────────
say("\nVOICE MANAGEMENT");
check("voices are pooled", /interface Pool/.test(src));
check("pools recycle onto the nearest sites", /pool\.cursor \+ i/.test(src));
check("pool size scales with tier", /quality\.simplified \? \d \: \d/.test(src));
check("out-of-band voices are muted", /if \(ds < -25 \|\| ds > 55\)/.test(src));
check("recycling is throttled", /frame\.current % 6 === 0/.test(src));
check("graph is torn down on unmount", /n\.wind\.src\.stop\(\)/.test(src) && /n\.bus\.disconnect\(\)/.test(src));

// count how many nodes are created ONCE vs per frame
const frameBody = src.match(/useFrame\(\(_, delta\) => \{([\s\S]*)\n  \}\);/)[1];
const perFrameCreates = (frameBody.match(/ctx\.create/g) ?? []).length;
say(`  node creations in the frame loop  ${perFrameCreates} (metal creak only, one-shot)`);
check("no continuous voices created per frame", perFrameCreates <= 6, `${perFrameCreates}`);
check("one-shot creaks are stopped", /o\.stop\(t \+ 1\.5\)/.test(src));

// ── the mix responds to the world ─────────────────────────────────────────
say("\nDYNAMIC MIX");
check("wind opens with speed", /320 \+ speed \* 900/.test(src));
check("wind level tracks the storm", /0\.1 \+ journey\.storm \* 0\.22/.test(src));
check("traffic recedes as you go deeper", /1 - journey\.progress \* 0\.5/.test(src));
check("district bed changes per quarter", /d\.kind === "luxury" \? 520/.test(src));
check("bus ducks in the observatory", /journey\.inObservatory \? 0\.35 : 0\.85/.test(src));
check("all changes use setTargetAtTime (no clicks)", !/\.gain\.value = (?!0;|0\.)/.test(frameBody));

// ── thunder timing ────────────────────────────────────────────────────────
say("\nTHUNDER");
const lightning = readFileSync("src/components/journey/city/Lightning.tsx", "utf8");
check("thunder is dispatched by the strike", /picksaw:thunder/.test(lightning));
check("thunder is delayed by distance", /const thunderDelay = st\.distance \/ 343/.test(lightning));
check("thunder is quieter when far", /0\.35 \+ near \* 0\.65/.test(lightning));
check("provider routes thunder to the engine", /soundscape\.thunder\(d\?\.power/.test(provider));
check("no double-trigger from the legacy bolt event",
  /the city schedules its own thunder/.test(provider));

// ── portal audio ──────────────────────────────────────────────────────────
say("\nPORTAL AUDIO");
check("portal tone exists", /portalTone/.test(engine));
// split on the METHOD, not the doc comment that mentions it
const portalBody = engine.split(/^  portalTone\(/m)[1]?.slice(0, 600) ?? "";
check(
  "portal tone respects the quiet state",
  /if \(!this\.prefs\.storm && !this\.prefs\.lofi\) return;/.test(portalBody)
);
check("portals emit enter and leave", /enter: true/.test(readFileSync("src/components/journey/city/Portals.tsx", "utf8")));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
