/**
 * Lighting analyser.
 *
 * Checks the parts of the lighting hierarchy that are decided by maths
 * rather than by taste: shadow-map resolution, whether the recycled
 * light pool ever leaves a lamp dark, how many lamps are lit at once,
 * and whether the bloom threshold actually separates emitters from lit
 * surfaces.
 *
 *   node scripts/analyze-lighting.mjs
 */

import { build } from "esbuild";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "picksaw-light-"));
const lf = join(dir, "layout.mjs");
const qf = join(dir, "quality.mjs");
await build({ entryPoints: ["src/components/journey/lib/cityLayout.ts"], bundle: true, format: "esm", platform: "node", outfile: lf, logLevel: "error" });
await build({ entryPoints: ["src/components/journey/lib/quality.ts"], bundle: true, format: "esm", platform: "node", outfile: qf, logLevel: "error" });
const L = await import(pathToFileURL(lf).href);

const say = (s = "") => console.log(s);
const num = (v, d = 2) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// Quality presets are behind a DOM probe, so read the source table.
const qsrc = readFileSync("src/components/journey/lib/quality.ts", "utf8");
function preset(name) {
  const re = new RegExp(`${name}:\\s*{([\\s\\S]*?)\\n  },`, "m");
  const m = qsrc.match(re) ?? qsrc.match(new RegExp(`const BASE[^{]*{([\\s\\S]*?)\\n};`, "m"));
  const body = m ? m[1] : "";
  const get = (k, fallback) => {
    const mm = body.match(new RegExp(`${k}:\\s*([0-9.]+)`));
    if (mm) return parseFloat(mm[1]);
    const base = qsrc.match(new RegExp(`const BASE[\\s\\S]*?${k}:\\s*([0-9.]+)`));
    return base ? parseFloat(base[1]) : fallback;
  };
  return {
    shadowMapSize: get("shadowMapSize", 2048),
    shadowDistance: get("shadowDistance", 120),
    lightPool: get("lightPool", 8),
    viewDistance: get("viewDistance", 320),
  };
}

// ── shadow resolution ──────────────────────────────────────────────────────
say("\nSHADOW MAP BUDGET");
for (const tier of ["high", "mid", "low"]) {
  const p = preset(tier);
  // CameraRig uses shadowDistance * 0.5 as the half-extent
  const extent = p.shadowDistance; // full width = 2 * (distance/2)
  const texelsPerMetre = p.shadowMapSize / extent;
  say(
    `  ${tier.padEnd(5)} ${p.shadowMapSize}px over ${extent} m  →  ${num(texelsPerMetre)} texels/m ` +
      `(${num(100 / texelsPerMetre)} cm per texel)`
  );
  check(
    `${tier}: shadows are sharp enough`,
    texelsPerMetre >= 15,
    `${num(100 / texelsPerMetre)} cm/texel`
  );
}

// ── light pool coverage ────────────────────────────────────────────────────
say("\nSTREET LAMP POOL");
const lamps = [...L.buildLamps()].sort((a, b) => a.s - b.s);
say(`  lamps in district    ${lamps.length}`);

for (const tier of ["high", "mid", "low", "mobile"]) {
  const p = preset(tier);
  const pool = p.lightPool;
  let worstLit = Infinity;
  let worstAt = 0;
  let missed = 0;
  let samples = 0;

  for (let s = 0; s < L.JOURNEY_LENGTH; s += 5) {
    // reproduce Lighting.tsx's cursor: first lamp at or after s - 24
    let cursor = 0;
    while (cursor < lamps.length - 1 && lamps[cursor].s < s - 24) cursor++;

    // lamps the pool will actually light
    let lit = 0;
    for (let i = 0; i < pool; i++) {
      const idx = cursor + i;
      if (idx >= lamps.length) break;
      const ds = lamps[idx].s - s;
      if (ds < -28 || ds > 90) continue;
      lit++;
    }
    // lamps that SHOULD be lit but fall outside the pool window
    const wanted = lamps.filter((l) => l.s - s >= -28 && l.s - s <= 55).length;
    const covered = Math.min(wanted, lit);
    if (covered < Math.min(wanted, 3)) missed++;
    samples++;
    if (lit < worstLit) {
      worstLit = lit;
      worstAt = s;
    }
  }
  say(
    `  ${tier.padEnd(6)} pool ${pool}  → min ${worstLit} lamps lit @ s=${worstAt}m, ` +
      `${missed}/${samples} starved stations`
  );
  check(`${tier}: street is never unlit`, worstLit >= 2, `${worstLit} lamps at s=${worstAt}`);
  check(`${tier}: pool keeps up with the walk`, missed === 0, `${missed} starved stations`);
}

// ── lamp spacing vs light radius ───────────────────────────────────────────
say("\nPOOLS OF LIGHT");
const gaps = [];
for (let i = 1; i < lamps.length; i++) gaps.push(lamps[i].s - lamps[i - 1].s);
const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
const maxGap = Math.max(...gaps);
const RADIUS = 30; // light.distance in Lighting.tsx
say(`  lamp pitch           avg ${num(avgGap)} m, max ${num(maxGap)} m`);
say(`  light radius         ${RADIUS} m`);
check("pools overlap into a lit street", maxGap < RADIUS * 1.8, `max gap ${num(maxGap)} m`);
check("pools stay distinct (not a wash)", avgGap > 8, `avg gap ${num(avgGap)} m`);

// ── bloom threshold separation ─────────────────────────────────────────────
say("\nSELECTIVE BLOOM");
const postSrc = readFileSync("src/components/journey/city/PostFX.tsx", "utf8");
const thresh = parseFloat(postSrc.match(/luminanceThreshold=\{([0-9.]+)\}/)?.[1] ?? "NaN");
const lampSrc = readFileSync("src/components/journey/city/StreetLamps.tsx", "utf8");
const headEmissive = parseFloat(lampSrc.match(/emissiveIntensity:\s*([0-9.]+)/)?.[1] ?? "NaN");

// A moonlit concrete façade: albedo ~0.16, key ~1.05 → well under 0.5.
const litSurface = 0.16 * 1.05 + 0.06;
say(`  bloom threshold      ${thresh}`);
say(`  brightest lit surface ~${num(litSurface)} (moonlit concrete)`);
say(`  lamp head emissive   ${headEmissive}`);
check("threshold clears lit surfaces", thresh > litSurface * 1.6, `${thresh} vs ${num(litSurface)}`);
check("emitters exceed threshold", headEmissive > thresh, `${headEmissive} vs ${thresh}`);

// ── tone mapping ───────────────────────────────────────────────────────────
say("\nTONE MAPPING");
const lightSrc = readFileSync("src/components/journey/city/Lighting.tsx", "utf8");
check("ACES Filmic is enabled", /ACESFilmicToneMapping/.test(lightSrc));
check("soft shadows enabled", /PCFSoftShadowMap/.test(lightSrc));
check("shadow frustum follows the walker", /moonTarget\.current\.position\.set/.test(lightSrc));
check("moon target is attached", /moon\.current\.target\s*=\s*moonTarget\.current/.test(lightSrc));
// SSAO is intentionally absent: it needs a NormalPass, which re-renders
// the scene with an override material and breaks every custom shader.
check("no NormalPass in the stack", /enableNormalPass=\{false\}/.test(postSrc));
check("the omission is documented", /NO NORMAL PASS/.test(postSrc));
check("contact comes from real shadows instead", /PCFSoftShadowMap/.test(lightSrc));
check("output colour space set", /outputColorSpace/.test(lightSrc));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
