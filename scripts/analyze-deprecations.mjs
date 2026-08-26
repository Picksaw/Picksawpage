/**
 * Deprecated-API analyser.
 *
 * WHY THIS EXISTS
 *
 * three.js deprecations are not cosmetic here. `PCFSoftShadowMap` was
 * removed in r185 and the renderer silently downgrades it to
 * `PCFShadowMap` on the first shadow pass — and that downgrade counts
 * as a shadow-map TYPE CHANGE, on which three walks the entire scene
 * graph setting `needsUpdate = true` on every material it finds:
 *
 *     if (typeChanged) {
 *       scene.traverse(o => { if (o.material) o.material.needsUpdate = true; });
 *     }
 *
 * Every one of those materials then recompiles, mid-frame. The console
 * showed 84 of these warnings, each burst recompiling every facade,
 * road and prop shader — which is exactly what "some buildings catch
 * the black glitch" looks like.
 *
 * A deprecation warning is therefore a correctness bug in this project,
 * not noise. This harness fails the build on the ones that bite.
 *
 *   node scripts/analyze-deprecations.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const say = (s = "") => console.log(s);
let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

function walk(d) {
  const o = [];
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (/\.tsx?$/.test(p)) o.push(p);
  }
  return o;
}
const files = walk("src");

/** Each entry says what actually goes wrong, not just "it is deprecated". */
const DEPRECATED = [
  ["THREE\\.PCFSoftShadowMap", "downgrades to PCFShadowMap, and the type change recompiles EVERY material"],
  ["THREE\\.LinearEncoding", "removed; use colorSpace"],
  ["THREE\\.sRGBEncoding", "removed; use SRGBColorSpace"],
  ["outputEncoding", "removed; use outputColorSpace"],
  ["THREE\\.Geometry\\b", "removed in r125; use BufferGeometry"],
  ["\\.useLegacyLights", "removed in r165"],
  ["physicallyCorrectLights", "removed; lighting is always physical now"],
  ["THREE\\.Face3", "removed"],
];

say("\nDEPRECATED THREE.JS APIS IN src/");
const found = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // ignore matches inside comments that explain the deprecation
  const code = src
    .split("\n")
    .filter((l) => !/^\s*(\*|\/\/)/.test(l))
    .join("\n");
  for (const [api, why] of DEPRECATED) {
    if (new RegExp(api).test(code)) {
      found.push(`${f.split("/").pop()}: ${api.replace(/\\/g, "")} — ${why}`);
    }
  }
}
if (found.length === 0) say("  none");
else found.forEach((x) => say("  " + x));
check("no deprecated three.js APIs in use", found.length === 0, `${found.length} found`);

// ── the specific trap that caused the reported bug ────────────────────────
say("\nSHADOW MAP TYPE STABILITY");
const journey = readFileSync("src/components/journey/Journey.tsx", "utf8");
const all = files.map((f) => readFileSync(f, "utf8")).join("\n");

const assignments = [...all.matchAll(/shadowMap\.type\s*=\s*THREE\.(\w+)/g)].map((m) => m[1]);
say(`  assigned                ${assignments.join(", ") || "(never — three's default, which is safe)"}`);
check("shadow type assigned at most once", assignments.length <= 1, `${assignments.length} assignments`);
check(
  "uses a supported constant",
  assignments.every((a) => a !== "PCFSoftShadowMap"),
  assignments.join(",") || "not assigned"
);

const frameBodies = [...all.matchAll(/useFrame\([\s\S]*?\n  \}\);/g)].map((m) => m[0]);
check(
  "shadow type is never set in a frame loop",
  !frameBodies.some((b) => /shadowMap\.type/.test(b)),
  `${frameBodies.length} frame loop(s) inspected`
);

// ── anything else that forces a global recompile ──────────────────────────
say("\nGLOBAL RECOMPILE TRIGGERS");
for (const [name, re] of [
  ["shadowMap.type", /shadowMap\.type\s*=/],
  ["shadowMap.enabled", /shadowMap\.enabled\s*=/],
  ["renderer.outputColorSpace", /outputColorSpace\s*=/],
  ["renderer.toneMapping", /\.toneMapping\s*=(?!\s*Exposure)/],
]) {
  check(`${name} is never set per frame`, !frameBodies.some((b) => re.test(b)));
}
// toneMappingExposure IS safe to animate — it is a uniform, not a define
check(
  "tone mapping itself is not animated",
  !frameBodies.some((b) => /\.toneMapping\s*=(?!\s*Exposure)/.test(b)),
  "exposure is a uniform and costs nothing; the mode is a shader define"
);

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
void journey;
process.exit(failures === 0 ? 0 : 1);
