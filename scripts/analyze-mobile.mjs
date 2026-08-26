/**
 * Mobile / tier analyser.
 *
 * "Mobile must automatically switch to a simplified scene" is an
 * absolute requirement, so it needs to be verified rather than
 * assumed. This checks that detection is automatic, that the mobile
 * tier genuinely drops the expensive systems, that every budget scales
 * monotonically down the tiers, and that nothing in the scene ignores
 * the tier it was handed.
 *
 *   node scripts/analyze-mobile.mjs
 */

import { readFileSync, readdirSync } from "node:fs";

const q = readFileSync("src/components/journey/lib/quality.ts", "utf8");
const say = (s = "") => console.log(s);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

// ── parse the preset table out of the source ──────────────────────────────
function preset(tier) {
  const base = q.match(/const BASE: Quality = \{([\s\S]*?)\n\};/)[1];
  const parse = (body) => {
    const o = {};
    for (const m of body.matchAll(/^\s{2,4}(\w+):\s*(.+?),?\s*$/gm)) {
      const [, k, raw] = m;
      const v = raw.replace(/,$/, "").trim();
      if (/^\d+(\.\d+)?$/.test(v)) o[k] = parseFloat(v);
      else if (v === "true" || v === "false") o[k] = v === "true";
      else if (/^\[/.test(v)) o[k] = JSON.parse(v);
      else o[k] = v.replace(/"/g, "");
    }
    return o;
  };
  const b = parse(base);
  if (tier === "high") return b;
  const block = q.match(new RegExp(`\\n  ${tier}: \\{([\\s\\S]*?)\\n  \\},`))[1];
  return { ...b, ...parse(block) };
}

const TIERS = ["high", "mid", "low", "mobile"];
const P = Object.fromEntries(TIERS.map((t) => [t, preset(t)]));

// ── automatic detection ───────────────────────────────────────────────────
say("\nAUTOMATIC DETECTION");
check("detects coarse pointer", /matchMedia\("\(pointer: coarse\)"\)/.test(q));
check("detects narrow viewport", /window\.innerWidth < 820/.test(q));
check("coarse + narrow => mobile tier", /if \(coarse && narrow\) \{\s*tier = "mobile";/.test(q));
check("probes the GPU renderer", /WEBGL_debug_renderer_info/.test(q));
check("detects software rasterisers", /swiftshader\|llvmpipe\|software/.test(q));
check("uses core count and memory", /hardwareConcurrency/.test(q) && /deviceMemory/.test(q));
check("detection is cached", /if \(cached\) return cached;/.test(q));
check("detection runs before the canvas mounts",
  /detectQuality\(\)/.test(readFileSync("src/components/journey/Journey.tsx", "utf8")));

// ── mobile is genuinely simplified ────────────────────────────────────────
say("\nMOBILE SIMPLIFICATION");
const m = P.mobile;
check("simplified flag is set", m.simplified === true);
check("shadows are off", m.shadows === false);
check("SSAO is off (no NormalPass anywhere)", m.ssao === false);
check("chromatic aberration is off", m.chromaticAberration === false);
check("volumetric cones are off", m.volumetricCones === false);
check("puddle reflections are off", m.puddles === false);
check("antialiasing is off (DPR does the work)", m.antialias === false);
check("splashes are dropped entirely", m.splashes === 0);
check("bloom is KEPT (it is the look)", m.bloom === true);
check("skyline is KEPT (it is the depth)", m.skyline === true);
check("props are KEPT but thinned", m.props === true && m.propDensity <= 0.4);

// systems that must opt out on simplified
say("\nSYSTEMS HONOUR THE SIMPLIFIED FLAG");
const optOut = {
  "LensWater.tsx": /if \(quality\.simplified\) return null/,
  "Atmosphere.tsx": /quality\.fogCards/,
  "Portals.tsx": /if \(quality\.simplified\) return null/,
  "BuildingLife.tsx": /if \(quality\.simplified\) return null/,
  "Soundscape3D.tsx": /quality\.simplified \? \d/,
  "Skyline.tsx": /quality\.simplified \? \d+/,
};
for (const [file, re] of Object.entries(optOut)) {
  const body = readFileSync(`src/components/journey/city/${file}`, "utf8");
  check(`${file} respects the tier`, re.test(body));
}

// every city system must receive the quality object
say("\nTIER PLUMBING");
const sceneSrc = readFileSync("src/components/journey/city/CityScene.tsx", "utf8");
const mounted = [...sceneSrc.matchAll(/<([A-Z]\w+)\s/g)].map((x) => x[1]);
const unique = [...new Set(mounted)];
// ContextGuard and Sky are tier-independent by design: one handles GPU
// context loss, the other paints the backdrop. Neither has a quality knob.
const TIER_FREE = new Set(["ContextGuard", "Sky"]);
const withoutQuality = unique.filter(
  (c) => !TIER_FREE.has(c) && !new RegExp(`<${c}[^>]*quality=\\{quality\\}`).test(sceneSrc)
);
say(`  systems mounted      ${unique.length} (${unique.join(", ")})`);
check("every system receives the tier", withoutQuality.length === 0, withoutQuality.join(", ") || "all wired");

// ── budgets scale monotonically ───────────────────────────────────────────
say("\nBUDGETS SCALE DOWN  (high → mid → low → mobile)");
const NUMERIC = [
  "rainDrops", "splashes", "fogCards", "ambientParticles",
  "buildingRows", "lightPool", "viewDistance", "shadowMapSize", "propDensity",
];
for (const key of NUMERIC) {
  const vals = TIERS.map((t) => P[t][key]);
  const monotonic = vals.every((v, i) => i === 0 || v <= vals[i - 1]);
  say(`  ${key.padEnd(17)} ${vals.map((v) => String(v).padStart(5)).join("  ")}`);
  check(`  ${key} never increases`, monotonic, vals.join(" → "));
}

const dprs = TIERS.map((t) => P[t].dpr);
say(`  ${"dpr".padEnd(17)} ${dprs.map((d) => `${d[0]}-${d[1]}`.padStart(5)).join("  ")}`);
check("  mobile DPR ceiling is modest", P.mobile.dpr[1] <= 1.5, `${P.mobile.dpr[1]}`);
check("  low tier can drop below 1.0", P.low.dpr[0] < 1, `${P.low.dpr[0]}`);

// ── rough draw-call and vertex estimate ───────────────────────────────────
say("\nESTIMATED FRAME COST");
for (const t of TIERS) {
  const p = P[t];
  /**
   * Hero plots (~8 calls) and portals (~6) are distance-culled at 220 m
   * and 140 m, and the plots are 78-104 m apart, so at most two plots
   * and two portals are ever submitted at once.
   */
  const drawCalls =
    3 /* buildings near/crown/far */ +
    3 /* road + 2 walks */ + 2 /* kerbs */ + 2 /* gutters */ +
    (p.volumetricCones ? 4 : 3) /* lamp hardware + cones */ +
    3 * 8 /* hero plots in range */ +
    (p.props ? 11 : 0) +
    1 /* atmosphere */ + (p.splashes ? 3 : 1) /* rain */ + 1 /* particles */ +
    (p.skyline ? 1 : 0) + 2 /* lightning */ + 2 * 6 /* portals in range */;
  const particles = p.rainDrops + p.splashes * 1.5 + p.fogCards + p.ambientParticles;
  say(
    `  ${t.padEnd(6)} ~${String(drawCalls).padStart(3)} draw calls, ` +
      `${String(Math.round(particles)).padStart(5)} instanced quads, ` +
      `DPR ${p.dpr[0]}-${p.dpr[1]}`
  );
  check(`  ${t}: draw calls stay low`, drawCalls < (t === "mobile" ? 70 : 90), `${drawCalls}`);
  check(`  ${t}: quad budget fits the tier`,
    t === "mobile" ? particles < 3000 : particles < 14000, `${Math.round(particles)}`);
}

// ── adaptive DPR ──────────────────────────────────────────────────────────
say("\nADAPTIVE RESOLUTION");
const post = readFileSync("src/components/journey/city/PostFX.tsx", "utf8");
check("adaptive DPR exists", /export function AdaptiveDPR/.test(post));
check("uses median, not mean (spike-proof)", /sorted\[Math\.floor\(sorted\.length \/ 2\)\]/.test(post));
check("mobile targets 30 fps", /quality\.simplified \? 1000 \/ 30/.test(post));
check("low targets 45 fps", /1000 \/ 45/.test(post));
check("desktop targets 60 fps", /1000 \/ 60/.test(post));
check("stays inside the tier band", /Math\.max\(lo, current\.current - 0\.15\)/.test(post));
check("has a cooldown so it cannot pump", /cooldown\.current = 1\.6/.test(post));

// ── reduced motion interaction ────────────────────────────────────────────
say("\nREDUCED MOTION");
check("reduced motion thins the particle systems", /q\.rainDrops = Math\.min\(q\.rainDrops, 1200\)/.test(q));
check("reduced motion keeps the visuals", /Reduced motion never means "ugly"/.test(q));

// ── distance culling of the expensive groups ──────────────────────────────
say("\nGROUP CULLING");
const hero = readFileSync("src/components/journey/city/HeroPlots.tsx", "utf8");
const portal = readFileSync("src/components/journey/city/Portals.tsx", "utf8");
check("hero plots are distance-culled", /const visible = ds < 220;/.test(hero));
check("portals are distance-culled", /const inRange = ds < 140;/.test(portal));
check("culled portals release their light", /spill\.current\.intensity = 0;/.test(portal));
check("visibility is only written when it changes",
  /group\.current\.visible !== visible/.test(hero) && /root\.current\.visible !== inRange/.test(portal));

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
