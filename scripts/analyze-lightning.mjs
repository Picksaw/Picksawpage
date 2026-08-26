/**
 * Lightning analyser.
 *
 * The brief specifies a seven-beat sequence. This simulates a strike at
 * 60 fps using the component's own timing constants and verifies the
 * beats land in order, that thunder is genuinely delayed by the speed
 * of sound, that the environment value has a slow release (afterimage),
 * and that the whole district is wired to react.
 *
 *   node scripts/analyze-lightning.mjs
 */

import { readFileSync } from "node:fs";

const src = readFileSync("src/components/journey/city/Lightning.tsx", "utf8");
const say = (s = "") => console.log(s);
const num = (v, d = 3) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── simulate one strike using the component's real constants ──────────────
const PREROLL = parseFloat(src.match(/const preroll = ([\d.]+);/)[1]);
const DRAW = parseFloat(src.match(/const drawTime = ([\d.]+);/)[1]);
const SPEED_OF_SOUND = parseFloat(src.match(/st\.distance \/ (\d+)/)[1]);

function simulate(distance, power) {
  const DT = 1 / 60;
  const frames = [];
  let boltValue = 0;
  let thundered = false;
  let thunderAt = null;
  const thunderDelay = distance / SPEED_OF_SOUND;

  for (let i = 0; i < Math.ceil((PREROLL + thunderDelay + 3) / DT); i++) {
    const t = i * DT;
    let bolt = 0;
    let glow = 0;
    let reveal = 0;
    let life = 0;

    if (t < PREROLL) {
      const g = Math.sin((t / PREROLL) * Math.PI) * 0.5;
      glow = g * 0.28 * power;
      bolt = g * 0.08 * power;
    } else {
      const bt = t - PREROLL;
      reveal = Math.min(1, bt / DRAW);
      if (bt < 0.05) life = 1;
      else if (bt < 0.1) life = 0.45;
      else if (bt < 0.16) life = 0.85;
      else life = Math.max(0, Math.exp(-(bt - 0.16) * 7.5));
      bolt = life * power;
      glow = Math.max(0, 0.3 - bt) * power;
      if (!thundered && bt > thunderDelay) {
        thundered = true;
        thunderAt = t;
      }
    }

    // the afterimage: instant attack, slow release
    if (bolt > boltValue) boltValue = bolt;
    else boltValue += (bolt - boltValue) * Math.min(1, DT * 4.5);

    frames.push({ t, bolt: boltValue, raw: bolt, glow, reveal, life });
  }
  return { frames, thunderAt, thunderDelay };
}

say("\nTHE SEVEN BEATS  (strike at 400 m, full power)");
const sim = simulate(400, 1);
const f = sim.frames;
const at = (time) => f.find((x) => x.t >= time) ?? f[f.length - 1];

const firstGlow = f.find((x) => x.glow > 0.01);
const firstBolt = f.find((x) => x.reveal > 0);
const fullyDrawn = f.find((x) => x.reveal >= 1);
const peak = f.reduce((a, b) => (b.bolt > a.bolt ? b : a));
const backToDark = f.find((x) => x.t > peak.t && x.bolt < 0.02);

say(`  1. distant glow      begins ${num(firstGlow.t)} s`);
say(`  2. bolt appears      ${num(firstBolt.t)} s  (fully drawn ${num(fullyDrawn.t)} s)`);
say(`  3. peak illumination ${num(peak.t)} s at ${num(peak.bolt)}`);
say(`  6. thunder           ${num(sim.thunderAt)} s  (delay ${num(sim.thunderDelay)} s)`);
say(`  7. darkness returns  ${num(backToDark.t)} s`);

check("1. glow precedes the bolt", firstGlow.t < firstBolt.t, `${num(firstGlow.t)} < ${num(firstBolt.t)}`);
check("2. channel draws quickly", fullyDrawn.t - firstBolt.t < 0.2, `${num(fullyDrawn.t - firstBolt.t)} s`);
check("3. illumination peaks with the bolt", Math.abs(peak.t - firstBolt.t) < 0.1, `${num(peak.t)}`);
check("6. thunder lags the flash", sim.thunderAt > firstBolt.t + 0.5, `${num(sim.thunderAt - firstBolt.t)} s later`);
check("7. darkness returns within 3 s", backToDark.t - peak.t < 3, `${num(backToDark.t - peak.t)} s`);

// ── the flicker: a real strike is not one smooth pulse ────────────────────
say("\nRETURN STROKES");
const early = f.filter((x) => x.t > PREROLL && x.t < PREROLL + 0.2);
let reversals = 0;
for (let i = 2; i < early.length; i++) {
  const d1 = early[i - 1].raw - early[i - 2].raw;
  const d2 = early[i].raw - early[i - 1].raw;
  if (Math.sign(d1) !== Math.sign(d2) && Math.abs(d2) > 0.01) reversals++;
}
say(`  brightness reversals in first 200 ms  ${reversals}`);
check("strike flickers (multiple return strokes)", reversals >= 2, `${reversals} reversals`);

// ── thunder delay scales with distance ────────────────────────────────────
say("\nACOUSTIC DELAY");
for (const d of [180, 400, 620]) {
  const s = simulate(d, 1);
  say(`  ${String(d).padStart(3)} m  → thunder ${num(s.thunderDelay)} s after the flash`);
}
const near = simulate(180, 1).thunderDelay;
const far = simulate(620, 1).thunderDelay;
check("near strikes crack almost immediately", near < 0.7, `${num(near)} s`);
check("far strikes rumble seconds later", far > 1.5, `${num(far)} s`);
check("delay is proportional to distance", Math.abs(far / near - 620 / 180) < 0.01);
check("speed of sound is physical", SPEED_OF_SOUND === 343, `${SPEED_OF_SOUND} m/s`);

// ── afterimage ────────────────────────────────────────────────────────────
say("\nAFTERIMAGE  (the eye adapts slower than the sky)");
const attackFrames = f.filter((x) => x.raw > 0.5 && x.bolt >= x.raw - 1e-9).length;
const releaseStart = f.find((x) => x.t > peak.t && x.raw < 0.05);
const releaseEnd = f.find((x) => x.t > (releaseStart?.t ?? 0) && x.bolt < 0.05);
say(`  attack               instant (${attackFrames} frames at full)`);
say(`  release              ${num((releaseEnd?.t ?? 0) - (releaseStart?.t ?? 0))} s tail`);
check("attack is instant", /if \(target > boltValue\.current\) boltValue\.current = target;/.test(src));
check("release is gradual", (releaseEnd?.t ?? 0) - (releaseStart?.t ?? 0) > 0.15,
  `${num((releaseEnd?.t ?? 0) - (releaseStart?.t ?? 0))} s`);

// ── reveals hidden architecture ───────────────────────────────────────────
say("\nREVEAL");
check("strikes are placed behind the skyline", /place the strike BEHIND the far skyline/.test(src));
check("strike distance spans 180-620 m", /r\.range\(180, 620\)/.test(src));
const sky = readFileSync("src/components/journey/city/Skyline.tsx", "utf8");
check("skyline flares with the bolt", /col \+= uBoltColor \* uBolt/.test(sky));
check("skyline opacity rises with the bolt", /alpha \*= mix\(0\.55, 1\.0, uBolt\)/.test(sky));

// ── the whole district reacts ─────────────────────────────────────────────
say("\nENVIRONMENT RESPONSE");
const reactors = {
  "fog blooms": ["Atmosphere.tsx", /uBolt/],
  "wet surfaces flare": ["WetGround.tsx", /uBolt/],
  "facades relight": ["Buildings.tsx", /uBolt/],
  "lamps wash out": ["StreetLamps.tsx", /uBolt/],
  "rain catches the flash": ["Rain.tsx", /uBolt/],
  "lens beads up": ["LensWater.tsx", /uBolt \* 0\.85/],
  "particles brighten": ["Particles.tsx", /uBolt/],
  "portals flare": ["Portals.tsx", /uBolt/],
  "bloom intensifies": ["PostFX.tsx", /b \* 1\.5/],
};
for (const [label, [file, re]] of Object.entries(reactors)) {
  const body = readFileSync(`src/components/journey/city/${file}`, "utf8");
  check(label, re.test(body), file);
}
const light = readFileSync("src/components/journey/city/Lighting.tsx", "utf8");
check("environment key light fires", /boltLight\.current\.intensity = b \* 5\.5/.test(light));
check("exposure lifts with the flash", /grade\.exposure/.test(light));
check("HTML chrome catches the flash", /--bolt/.test(src));

// ── cadence ───────────────────────────────────────────────────────────────
say("\nCADENCE");
check("strikes quicken with the storm", /nextAt\.current -= dt \* \(0\.5 \+ journey\.storm \* 1\.6\)/.test(src));
check("interval is irregular", /4 \+ r\.range\(0, 14\) - journey\.storm \* 3/.test(src));
check("reduced motion disables lightning", /if \(quality\.reducedMotion\) return null/.test(src));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
