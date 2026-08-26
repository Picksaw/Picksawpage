/**
 * VRAM budget analyser.
 *
 * WHY THIS EXISTS
 *
 * The reported black/glitching frames survived four fixes because none
 * of them addressed the real constraint: the scene was asking for more
 * GPU memory than a mainstream GPU will give it.
 *
 *   post-processing buffers  RGBA16F at full backing resolution
 *   x 4x MSAA                five surfaces instead of two
 *   at DPR 2                 2880x1800 on an ordinary laptop screen
 *   = 396 MB of render targets, plus ~85 MB of textures
 *
 * Integrated GPUs begin evicting well below that. An eviction or a
 * failed allocation shows up exactly as reported: black frames with
 * glitching, because sampling an evicted texture returns garbage.
 *
 * This harness costs the whole scene and enforces a budget.
 *
 *   node scripts/analyze-vram.mjs
 */

import { readFileSync } from "node:fs";

const say = (s = "") => console.log(s);
const mb = (b) => (b / 1048576).toFixed(1);
let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

const post = readFileSync("src/components/journey/city/PostFX.tsx", "utf8");
const qsrc = readFileSync("src/components/journey/lib/quality.ts", "utf8");
const atlas = readFileSync("src/components/journey/lib/facadeTextures.ts", "utf8");
const portals = readFileSync("src/components/journey/city/Portals.tsx", "utf8");

// ── config as actually written ────────────────────────────────────────────
const msaa = parseInt(post.match(/multisampling=\{(\d+)\}/)?.[1] ?? "0", 10);
const halfFloat = /HalfFloatType/.test(post);
const bytesPerPx = halfFloat ? 8 : 4;
const TILE = parseInt(atlas.match(/const TILE = (\d+);/)[1], 10);
const COLS = parseInt(atlas.match(/ATLAS_COLS = (\d+)/)[1], 10);
const atlasSize = TILE * COLS;

say("\nCONFIGURATION");
say(`  composer format      ${halfFloat ? "RGBA16F (8 B/px)" : "RGBA8 (4 B/px)"}`);
say(`  composer MSAA        ${msaa}x`);
say(`  facade atlas         ${atlasSize}x${atlasSize} x3 maps`);

// ── per-tier cost ─────────────────────────────────────────────────────────
function preset(tier) {
  const base = qsrc.match(/const BASE: Quality = \{([\s\S]*?)\n\};/)[1];
  const block = tier === "high" ? base
    : qsrc.match(new RegExp(`\\n  ${tier}: \\{([\\s\\S]*?)\\n  \\},`))[1];
  const num = (k, src) => {
    const m = src.match(new RegExp(`${k}:\\s*([\\d.]+)`));
    return m ? parseFloat(m[1]) : null;
  };
  const dprM = (block.match(/dpr:\s*\[([\d.]+),\s*([\d.]+)\]/) ??
                base.match(/dpr:\s*\[([\d.]+),\s*([\d.]+)\]/));
  return {
    dprMax: parseFloat(dprM[2]),
    shadow: num("shadowMapSize", block) ?? num("shadowMapSize", base),
    shadows: !/shadows:\s*false/.test(block),
  };
}

// static textures, shared by every tier
const atlasBytes = atlasSize * atlasSize * 4 * 1.334 * 3;
const groundBytes = 512 * 512 * 4 * 1.334 * 5;
const logoW = parseInt(portals.match(/c\.width = (\d+);\n  c\.height = \d+;/)?.[1] ?? "512", 10);
const logoH = parseInt(portals.match(/c\.width = \d+;\n  c\.height = (\d+);/)?.[1] ?? "128", 10);
const prevMatch = [...portals.matchAll(/c\.width = (\d+);\s*\n\s*c\.height = (\d+);/g)];
const prevW = prevMatch[1] ? +prevMatch[1][1] : 256;
const prevH = prevMatch[1] ? +prevMatch[1][2] : 320;
const portalBytes = (logoW * logoH + prevW * prevH) * 4 * 6;

say("\nSTATIC TEXTURES");
say(`  facade atlas         ${mb(atlasBytes).padStart(7)} MB`);
say(`  ground maps          ${mb(groundBytes).padStart(7)} MB`);
say(`  portal plates        ${mb(portalBytes).padStart(7)} MB  (${logoW}x${logoH}, ${prevW}x${prevH} x6)`);
const staticBytes = atlasBytes + groundBytes + portalBytes;
say(`  subtotal             ${mb(staticBytes).padStart(7)} MB`);
check("static textures stay modest", staticBytes < 48 * 1048576, `${mb(staticBytes)} MB`);

// ── worst realistic viewport ──────────────────────────────────────────────
const VIEWS = [["laptop 1440x900", 1440, 900], ["desktop 1920x1080", 1920, 1080]];
say("\nTOTAL VRAM PER TIER  (worst realistic viewport)");
say("  tier    view                dpr   targets   bloom  shadow   TOTAL");

for (const tier of ["high", "mid", "low", "mobile"]) {
  const p = preset(tier);
  for (const [label, vw, vh] of VIEWS) {
    if (tier === "mobile" && vw > 1500) continue;
    const W = Math.round(vw * p.dprMax);
    const H = Math.round(vh * p.dprMax);
    const one = W * H * bytesPerPx;
    const targets = msaa > 0 ? one * 2 + one * 2 * msaa : one * 2;
    let bloom = 0;
    for (let i = 1; i <= 7; i++) { const d = 2 ** i; bloom += (W / d) * (H / d) * bytesPerPx * 2; }
    const shadow = p.shadows ? p.shadow * p.shadow * 4 : 0;
    const total = targets + bloom + shadow + staticBytes;
    const ok = total < 220 * 1048576;
    if (!ok) failures++;
    say(
      `  ${ok ? "PASS" : "FAIL"} ${tier.padEnd(6)} ${label.padEnd(18)} ${p.dprMax.toFixed(2)}` +
      ` ${mb(targets).padStart(8)} ${mb(bloom).padStart(7)} ${mb(shadow).padStart(7)}` +
      ` ${mb(total).padStart(8)} MB`
    );
  }
}

say("\n  Budget: 220 MB. Integrated GPUs commonly evict above ~256 MB,");
say("  and an evicted texture samples as garbage — black, glitching frames.");

// ── the specific traps ────────────────────────────────────────────────────
say("\nKNOWN TRAPS");
check("no MSAA on a half-float composer", !(msaa > 0 && halfFloat),
  msaa > 0 ? `${msaa}x MSAA x 8 B/px multiplies target cost 2.5x` : "none");
check("DPR ceiling is bounded", preset("high").dprMax <= 1.6, `high tier ${preset("high").dprMax}`);
check("facade atlas is not oversized", atlasSize <= 1024, `${atlasSize}px`);
check("no NormalPass", /enableNormalPass=\{false\}/.test(post));

// ── context loss recovery ─────────────────────────────────────────────────
say("\nCONTEXT LOSS RECOVERY");
let guard = "";
try { guard = readFileSync("src/components/journey/city/ContextGuard.tsx", "utf8"); } catch { /* absent */ }
const journey = readFileSync("src/components/journey/Journey.tsx", "utf8");
check("a context guard exists", guard.length > 0);
check("listens for webglcontextlost", /webglcontextlost/.test(guard));
check("calls preventDefault (REQUIRED for restore)", /e\.preventDefault\(\)/.test(guard));
check("listens for webglcontextrestored", /webglcontextrestored/.test(guard));
check("reports creation failure", /webglcontextcreationerror/.test(guard));
check("the scene remounts on restore", /setContextKey/.test(journey));
check("loss is logged, not silent", /console\.warn/.test(guard));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
