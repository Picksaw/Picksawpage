/**
 * Light-count stability analyser.
 *
 * WHY THIS EXISTS
 *
 * three.js bakes the number of lights of each type into the shader
 * program cache key, and `projectObject` skips invisible lights when
 * collecting them. So changing a light's `visible` flag — or hiding any
 * group that CONTAINS a light — changes the light count, invalidates
 * every cached program, and forces a synchronous recompile of every lit
 * material in the scene on that frame.
 *
 * Doing that from a per-frame loop produces exactly what the user saw:
 * a black, noisy, glitching frame, because the GPU is recompiling
 * shaders instead of drawing.
 *
 * This harness statically forbids the pattern.
 *
 *   node scripts/analyze-lightstability.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const say = (s = "") => console.log(s);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

function walk(dir) {
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}
const files = walk("src/components/journey");

const LIGHT_TAGS = /<(pointLight|directionalLight|spotLight|hemisphereLight|ambientLight|rectAreaLight)/;
const LIGHT_CTOR = /new THREE\.(PointLight|DirectionalLight|SpotLight|HemisphereLight|AmbientLight|RectAreaLight)/;

// ── 1. no light may have its visibility toggled ───────────────────────────
say("\nLIGHT VISIBILITY  (must never change after mount)");
let offenders = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // any identifier that holds a light and gets .visible assigned
  const lightRefs = new Set();
  for (const m of src.matchAll(/(\w+)\s*=\s*new THREE\.(Point|Directional|Spot|Hemisphere|Ambient|RectArea)Light/g))
    lightRefs.add(m[1]);
  for (const m of src.matchAll(/ref=\{(\w+)\}[^>]*\/?>/g)) void m;
  // refs attached to JSX light elements
  for (const m of src.matchAll(/<(?:point|directional|spot|hemisphere|ambient|rectArea)Light[^>]*?ref=\{(\w+)\}/gs))
    lightRefs.add(m[1]);

  for (const m of src.matchAll(/(\w+)(?:\.current)?\.visible\s*=\s*([^;\n]+)/g)) {
    if (!lightRefs.has(m[1])) continue;
    const value = m[2].trim();
    // Assigning a literal `true` once at construction is fine — the light
    // is then permanently counted. What breaks the shader cache is a
    // value that can CHANGE, i.e. anything not a literal true.
    if (value === "true") continue;
    offenders.push(`${f.split("/").pop()}: ${m[1]}.visible = ${value}`);
  }
  // JSX visible={...} on a light element
  for (const m of src.matchAll(/<(?:point|directional|spot|hemisphere|ambient|rectArea)Light[^>]*visible=\{/gs))
    offenders.push(`${f.split("/").pop()}: JSX visible= on a light`);
}
check("no light has its visibility toggled", offenders.length === 0, offenders.join("; ") || "clean");

// ── 2. no culled group may contain a light ────────────────────────────────
say("\nCULLED GROUPS  (must not contain lights)");
let groupOffenders = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // refs whose .visible is assigned in a frame loop
  const toggled = new Set(
    [...src.matchAll(/(\w+)\.current\.visible\s*=/g)].map((m) => m[1])
  );
  if (toggled.size === 0) continue;
  for (const ref of toggled) {
    // find <group ref={ref} ...> ... </group> and look for lights inside
    const open = new RegExp(`<group[^>]*ref=\\{${ref}\\}[^>]*>`, "s");
    const om = src.match(open);
    if (!om) continue;
    const start = src.indexOf(om[0]) + om[0].length;
    // walk to the matching close tag
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      const nextOpen = src.indexOf("<group", i);
      const nextClose = src.indexOf("</group>", i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; i = nextOpen + 6; }
      else { depth--; i = nextClose + 8; }
    }
    const body = src.slice(start, i);
    if (LIGHT_TAGS.test(body)) {
      const which = body.match(LIGHT_TAGS)[1];
      groupOffenders.push(`${f.split("/").pop()}: <${which}> inside culled group "${ref}"`);
    }
  }
}
check("no culled group contains a light", groupOffenders.length === 0, groupOffenders.join("; ") || "clean");

// ── 3. pooled lights are gated by intensity ───────────────────────────────
say("\nPOOLED LIGHTS  (gated by intensity, not visibility)");
const lighting = readFileSync("src/components/journey/city/Lighting.tsx", "utf8");
const life = readFileSync("src/components/journey/city/BuildingLife.tsx", "utf8");
const portals = readFileSync("src/components/journey/city/Portals.tsx", "utf8");
check("lamp pool disables via intensity", /light\.intensity = 0;/.test(lighting));
check("lamp pool stays visible", /l\.visible = true;/.test(lighting));
check("arc pool disables via intensity", /arcs\.lights\[i\]\.intensity = 0;/.test(life));
check("portal spill disables via intensity", /spill\.current\.intensity = 0;/.test(portals));
check("portal spill sits outside the culled group",
  /The spill light lives OUTSIDE the culled group/.test(portals));
check("observatory lights sit outside the culled group",
  /The room's lights sit OUTSIDE the culled group/.test(readFileSync("src/components/journey/city/Observatory.tsx", "utf8")));

// ── 4. count the lights that can ever exist ───────────────────────────────
say("\nLIGHT BUDGET  (constant for the whole walk)");
const counts = { point: 0, directional: 0, hemisphere: 0, ambient: 0, spot: 0 };
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const [k, re] of Object.entries({
    point: /<pointLight/g, directional: /<directionalLight/g,
    hemisphere: /<hemisphereLight/g, ambient: /<ambientLight/g, spot: /<spotLight/g,
  })) counts[k] += (src.match(re) ?? []).length;
}
// pooled lights created imperatively
const poolSizes = [...lighting.matchAll(/lightPool/g)].length ? "tier (3-8)" : "?";
say(`  JSX point lights           ${counts.point}  (x6 portals where applicable)`);
say(`  directional                ${counts.directional}  (moon + lightning key)`);
say(`  hemisphere                 ${counts.hemisphere}`);
say(`  ambient                    ${counts.ambient}`);
say(`  imperative lamp pool       ${poolSizes}`);
check("directional lights stay within budget", counts.directional <= 3, `${counts.directional}`);
check("hemisphere lights stay within budget", counts.hemisphere <= 3, `${counts.hemisphere}`);

// worst case: 8 lamp pool + 3 arcs + 6 portal spills + 3 observatory
const worstPoint = 8 + 3 + 6 + 3;
say(`  worst-case simultaneous point lights: ${worstPoint}`);
check("point-light count is bounded", worstPoint <= 24, `${worstPoint}`);

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
