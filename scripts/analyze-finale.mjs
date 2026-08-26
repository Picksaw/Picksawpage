/**
 * Observatory + accessibility analyser.
 *
 * The finale has to actually resolve the journey (be above the weather,
 * show the real city, prove the visit), and the whole experience has to
 * remain usable without a mouse, without motion, and without sound.
 *
 *   node scripts/analyze-finale.mjs
 */

import { readFileSync } from "node:fs";
import { build } from "esbuild";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const obs = readFileSync("src/components/journey/city/Observatory.tsx", "utf8");
const ui = readFileSync("src/components/journey/ObservatoryUI.tsx", "utf8");
const journeySrc = readFileSync("src/components/journey/Journey.tsx", "utf8");
const home = readFileSync("src/pages/HomePage.tsx", "utf8");
const texts = readFileSync("src/config/siteTexts.ts", "utf8");
const cam = readFileSync("src/components/journey/lib/cameraModel.ts", "utf8");
const css = readFileSync("src/index.css", "utf8");

const say = (s = "") => console.log(s);
const num = (v, d = 1) => v.toFixed(d);
let failures = 0;
function check(label, ok, detail) {
  if (!ok) failures++;
  say(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
}

const dir = mkdtempSync(join(tmpdir(), "picksaw-fin-"));
const lf = join(dir, "layout.mjs");
await build({
  entryPoints: ["src/components/journey/lib/cityLayout.ts"],
  bundle: true, format: "esm", platform: "node", outfile: lf, logLevel: "error",
});
const L = await import(pathToFileURL(lf).href);

// ── the destination ───────────────────────────────────────────────────────
say("\nTHE OBSERVATORY");
// pathPoint shares its return object; retain via the allocating variant
const p = L.pathPointAt(L.OBSERVATORY_S);
const start = L.pathPointAt(0);
say(`  position             s=${L.OBSERVATORY_S} m`);
say(`  elevation gain       ${num(p.y - start.y)} m above the gate`);
check("sits at the end of the walk", L.OBSERVATORY_S === L.JOURNEY_LENGTH, `${L.OBSERVATORY_S}`);
check("the district climbs to it", p.y - start.y > 2, `${num(p.y - start.y)} m`);

check("giant glass windows on three sides", (obs.match(/material=\{glass\}/g) ?? []).length >= 3);
check("glass has mullions and rails", /mull-/.test(obs) && /rail-/.test(obs));
check("rain runs down the OUTSIDE of the glass", /rain running down the OUTSIDE/.test(obs));
check("you are above the weather", /journey\.inObservatory/.test(obs));

// ── the holographic map ───────────────────────────────────────────────────
say("\nHOLOGRAPHIC CITY MAP");
check("map exists", /HOLOGRAPHIC CITY/.test(obs));
check("map is built from the REAL layout", /pathPoint\(plot\.s\)/.test(obs));
check("one tower per template", /for \(const plot of HERO_PLOTS\)/.test(obs));
check("filler massing so it reads as a city", /filler massing/.test(obs));
check("towers assemble from the ground up", /wp\.y \*= grow/.test(obs));
check("holo has scanlines", /scan = sin\(\(vHeight \* 40\.0\)/.test(obs));
check("holo has a travelling sweep", /float sweep = smoothstep/.test(obs));
check("edges read as wireframe", /float edge = smoothstep\(0\.36, 0\.5/.test(obs));

// ── visited buildings illuminate ──────────────────────────────────────────
say("\nVISITED BUILDINGS ILLUMINATE");
const visited = readFileSync("src/components/journey/lib/visited.ts", "utf8");
const portals = readFileSync("src/components/journey/city/Portals.tsx", "utf8");
check("a visit store exists", /export const visitedStore/.test(visited));
check("portals record the visit", /visitedStore\.add\(item\.id\)/.test(portals));
check("visit is recorded on real approach", /if \(a > 0\.55 && !announced\.current\)/.test(portals));
check("map reads the store every frame", /visitedStore\.has\(plot\.templateId\)/.test(obs));
check("towers ease up rather than snapping", /cur \+ \(want - cur\) \* Math\.min\(1, dt \* 2\.2\)/.test(obs));
check("visited towers use the gold accent", /uVisited.*ffd9a0/s.test(obs));
check("the count is shown to the visitor", /observatoryCount/.test(ui));

// ── the line ──────────────────────────────────────────────────────────────
say("\nTHE PAYOFF");
const line = texts.match(/observatoryLine: "([^"]+)"/)[1];
say(`  EN                   "${line}"`);
check("the exact line is present",
  line === "Every building you walked through is a real template.", line);
check("translated to Farsi", /observatoryLine: "هر ساختمانی/.test(texts));
check("line arrives before the CTA", ui.indexOf("observatoryLine") < ui.indexOf("contactTitle"));
check("line is staged with a delay", /delay: 0\.5, duration: 1\.1/.test(ui));

// ── colour script ─────────────────────────────────────────────────────────
say("\nCOLOUR SCRIPT  (clarity after chaos)");
const palette = readFileSync("src/components/journey/lib/palette.ts", "utf8");
check("finale grade exists", /FINALE_FOG/.test(palette) && /FINALE_AMB/.test(palette));
check("observatory calms the grade", /_fog\.lerp\(FINALE_FOG, observatory\)/.test(palette));
check("moon clears at the finale", /_moon\.lerp\(MOON_CLEAR, observatory\)/.test(palette));
check("calm blue key light", /color="#8fc4ff"/.test(obs));
check("soft gold fill", /color="#ffd9a0"/.test(obs));
check("glass tint is calm blue", /uTint.*16324a/s.test(obs));

// ── UI philosophy ─────────────────────────────────────────────────────────
say("\nUI PHILOSOPHY  (mounted, not floating)");
check("panel is mounted, not a floating card", /panel-mounted/.test(ui));
check("panel has a lit bevel and a stand-off shadow",
  /inset 0 1px 0 rgba\(190, 225, 255/.test(css) && /0 18px 46px -16px/.test(css));
check("panel catches the lightning", /bolt-lit/.test(ui));
check("typography catches the lightning", /bolt-text/.test(ui));
check("CTA sits at the sill line", /bottom-0/.test(ui) && /pb-10/.test(ui));
check("no full-screen scrim over the world", !/fixed inset-0/.test(ui));

// ── microinteractions ─────────────────────────────────────────────────────
say("\nMICROINTERACTIONS");
const panelHook = readFileSync("src/components/journey/useMountedPanel.ts", "utf8");
const portalsSrc = readFileSync("src/components/journey/city/Portals.tsx", "utf8");
const magnetic = readFileSync("src/components/ui/MagneticButton.tsx", "utf8");
const cursor = readFileSync("src/components/CursorFX.tsx", "utf8");
check("magnetic buttons", /useSpring/.test(magnetic) && /strength/.test(magnetic));
check("button ripples", /ripples\.map/.test(magnetic));
check("button reflection sweep", /reflect-sweep/.test(magnetic));
check("cursor depth field", /radial-gradient/.test(cursor) && /mix-blend-screen/.test(cursor));
check("cursor ripples on the world", /picksaw:splash/.test(cursor));
check("glass reflection tracks the pointer", /--px/.test(panelHook) && /--px/.test(css));
check("hover parallax by layer depth", /parallax-layer/.test(css) && /--depth/.test(ui));
check("parallax costs no re-render", /style\.setProperty/.test(panelHook) && !/useState/.test(panelHook));
check("parallax respects reduced motion", /prefers-reduced-motion/.test(panelHook));
check("electric sparks on portal hover", /electric crackle around the frame/.test(portalsSrc));
check("sparks stutter rather than glide", /float stutter = step\(0\.35/.test(portalsSrc));
check("soft scale animations", /whileTap/.test(magnetic));

// ── accessibility ─────────────────────────────────────────────────────────
say("\nACCESSIBILITY");
check("reduced motion is respected by default", /!reduced \|\| optedIn/.test(home));
check("calm mode is genuinely still", /handheldPos: 0,[\s\S]*?swayRoll: 0,[\s\S]*?breath: 0,/.test(cam));
check("calm mode keeps the dolly usable", /stiffness: 4\.6/.test(cam));
check("reduced-motion visitors may opt in", /enterCityCalm/.test(home) && /enterCityCalm/.test(texts));
check("lightning is disabled under reduced motion",
  /if \(quality\.reducedMotion\) return null/.test(readFileSync("src/components/journey/city/Lightning.tsx", "utf8")));

check("keyboard navigation exists", /window\.addEventListener\("keydown", onKey\)/.test(journeySrc));
for (const key of ["ArrowRight", "ArrowLeft", "Home", "End", "Enter", "PageDown", "PageUp"]) {
  check(`  ${key} handled`, new RegExp(`"${key}"`).test(journeySrc));
}
check("keys never hijack form fields", /INPUT\|TEXTAREA\|SELECT/.test(journeySrc));
check("keys respect contentEditable", /isContentEditable/.test(journeySrc));
check("keys stand down while a modal is open", /if \(selectedRef\.current\) return;/.test(journeySrc));

check("skip-cinematic button exists", /skipCinematic/.test(journeySrc));
check("skip button is reachable by keyboard", /focus-visible:opacity-100/.test(journeySrc));
check("skip button has a description", /title=\{t\.skipCinematicHint\}/.test(journeySrc));
check("original skip-to-content link intact", /skipLink/.test(readFileSync("src/App.tsx", "utf8")));

// contrast of the payoff line: white on a dark, fogged frame
say("\nCONTRAST");
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const bodyOnGlass = ratio("#ffffff", "#0a0e1a");
const mutedOnGlass = ratio("#94a3b8", "#0a0e1a");
say(`  white on glass       ${num(bodyOnGlass, 2)}:1`);
say(`  muted on glass       ${num(mutedOnGlass, 2)}:1`);
check("payoff line exceeds AAA", bodyOnGlass >= 7, `${num(bodyOnGlass, 2)}:1`);
check("secondary text exceeds AA", mutedOnGlass >= 4.5, `${num(mutedOnGlass, 2)}:1`);

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
rmSync(dir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
