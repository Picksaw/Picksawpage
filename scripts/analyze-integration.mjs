/**
 * Integration analyser.
 *
 * The absolute rule was "preserve all existing template links and
 * functionality". Rewriting the hero into a 3D district is exactly the
 * kind of change that silently breaks an anchor, a route or a modal, so
 * this checks the seams: every internal anchor resolves, every route is
 * reachable, every external link survives, and both render modes expose
 * the same content.
 *
 *   node scripts/analyze-integration.mjs
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
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}
const files = walk("src");
const all = files.map((f) => ({ f, s: readFileSync(f, "utf8") }));
const corpus = all.map((x) => x.s).join("\n");

// ── internal anchors ──────────────────────────────────────────────────────
say("\nINTERNAL ANCHORS");
const anchors = new Set(
  [...corpus.matchAll(/id="([a-z][\w-]*)"/g)].map((m) => m[1])
);
const targets = new Set([
  ...[...corpus.matchAll(/href="#([a-z][\w-]*)"/g)].map((m) => m[1]),
  ...[...corpus.matchAll(/scrollToTarget\("#([a-z][\w-]*)"\)/g)].map((m) => m[1]),
]);
say(`  ids defined          ${[...anchors].join(", ")}`);
say(`  anchors referenced   ${[...targets].join(", ")}`);
for (const t of targets) {
  check(`#${t} resolves`, anchors.has(t), anchors.has(t) ? "" : "NO SUCH ID");
}

// the skip link must work in BOTH render modes
const home = readFileSync("src/pages/HomePage.tsx", "utf8");
const topOutsideBranch =
  home.indexOf('id="top"') > 0 &&
  home.indexOf('id="top"') < home.indexOf("{journey ?");
check("skip-link target exists in journey mode too", topOutsideBranch,
  topOutsideBranch ? "declared before the mode branch" : "only in the fallback hero");

// ── routes ────────────────────────────────────────────────────────────────
say("\nROUTES");
const app = readFileSync("src/App.tsx", "utf8");
// `path` may sit on its own line in a multi-line <Route>
const routes = [...app.matchAll(/<Route\s+path="([^"]+)"|<Route\s*\n\s*path="([^"]+)"/g)].map(
  (m) => m[1] ?? m[2]
);
say(`  routes               ${routes.join(", ")}`);
check("home route present", routes.includes("/"));
check("feed route present", routes.includes("/feed"));
check("catch-all present", routes.includes("*"));
const feedLinks = [...corpus.matchAll(/href="#\/feed"/g)].length;
say(`  links to the feed    ${feedLinks}`);
check("feed is reachable from the UI", feedLinks > 0, `${feedLinks} links`);

// ── template links ────────────────────────────────────────────────────────
say("\nTEMPLATE LINKS");
const cfg = readFileSync("src/config/templatesConfig.ts", "utf8");
const ids = [...cfg.matchAll(/id:\s*"([a-z]+)"/g)].map((m) => m[1]);
const urls = [...cfg.matchAll(/url:\s*"([^"]+)"/g)].map((m) => m[1]);
const imgs = [...cfg.matchAll(/imageKey:\s*"([a-z]+)"/g)].map((m) => m[1]);
const imgMap = readFileSync("src/config/templateImages.ts", "utf8");
check("6 templates configured", ids.length === 6, ids.join(", "));
check("every template has a URL", urls.length === ids.length);
check("every URL is https", urls.every((u) => u.startsWith("https://")));
for (const k of imgs) {
  check(`  image mapped: ${k}`, new RegExp(`${k}:\\s*"`).test(imgMap));
}
check("preview modal still opens the live site", /src=\{item\.url\}/.test(readFileSync("src/components/PreviewModal.tsx", "utf8")));
check("preview modal offers the direct link", /href=\{item\.url\}/.test(readFileSync("src/components/PreviewModal.tsx", "utf8")));

// ── both modes expose the same content ────────────────────────────────────
say("\nRENDER MODES");
check("journey mode mounts the city", /<Journey lang=\{lang\} \/>/.test(home));
check("fallback mode keeps the classic grid", /<TemplatesUniverse lang=\{lang\} \/>/.test(home));
/**
 * Trust / Process / Contact are corridor stations now, so the DOM
 * copies exist only in the classic layout. Exactly one occurrence —
 * two would mean the hallway renders them and the page renders them
 * again underneath.
 */
const panels = readFileSync("src/components/journey/SectionPanels.tsx", "utf8");
for (const [section, kind] of [
  ["TrustStats", "trust"],
  ["ProcessTimeline", "process"],
  ["ContactSection", "contact"],
]) {
  const count = [...home.matchAll(new RegExp(`<${section} lang=\\{lang\\} \\/>`, "g"))].length;
  check(`${section}: exactly one DOM copy (classic only)`, count === 1, `${count} occurrences`);
  check(`${section}: has a hallway station`, new RegExp(`kind="${kind}"`).test(panels));
}
check("the DOM copies are behind the !journey gate", /\{!journey && \(/.test(home));
check("fallback is used when WebGL is absent", /hasWebGL\(\)/.test(home));

// ── external links ────────────────────────────────────────────────────────
say("\nEXTERNAL LINKS");
const externals = [
  ["game", /https:\/\/stormblade\.picksaw\.ir/],
  ["instagram", /https:\/\/www\.instagram\.com\/picksawm\//],
  ["whatsapp", /wa\.me\//],
  ["phone", /tel:\$\{PHONE/],
];
for (const [name, re] of externals) check(`${name} link preserved`, re.test(corpus));
check("external links open safely", /rel=\{?"?noopener noreferrer/.test(corpus));

// ── admin / feed pipeline ─────────────────────────────────────────────────
say("\nADMIN & FEED");
check("posts API intact", /fetchPosts|createPostApi|deletePostApi/.test(app));
check("admin auth intact", /useAdmin/.test(app));
check("login modal intact", /<LoginModal/.test(app));
check("admin panel intact", /<AdminPanel/.test(app));
check("post modal intact", /<PostModal/.test(app));

// ── the journey cannot trap the user ──────────────────────────────────────
say("\nESCAPE HATCHES");
const j = readFileSync("src/components/journey/Journey.tsx", "utf8");
check("canvas is removed at the end of the walk", /visibility: faded \? "hidden" : "visible"/.test(j));
check("canvas stops rendering when hidden", /frameloop=\{faded \? "never" : "always"\}/.test(j));
check("pointer events released when faded", /pointerEvents: faded \? "none" : undefined/.test(j));
check("the walk hands the page back", /setFaded/.test(j));
check("the fade releases the canvas", /faded \? "none" : undefined/.test(j));
check("modal closes on Escape", /e\.key === "Escape"/.test(readFileSync("src/components/PreviewModal.tsx", "utf8")));
check("modal restores scroll", /getLenis\(\)\?\.start\(\)/.test(readFileSync("src/components/PreviewModal.tsx", "utf8")));

// ── leaks ─────────────────────────────────────────────────────────────────
say("\nCLEANUP");
const cityFiles = all.filter((x) => x.f.includes("journey/city"));
let noDispose = [];
for (const { f, s } of cityFiles) {
  const makes = /new THREE\.(BufferGeometry|BoxGeometry|PlaneGeometry|ShaderMaterial|MeshStandardMaterial|CanvasTexture|InstancedBufferGeometry)/.test(s);
  const disposes = /\.dispose\(\)/.test(s);
  if (makes && !disposes) noDispose.push(f.split("/").pop());
}
check("every system disposes its GPU resources", noDispose.length === 0, noDispose.join(", ") || "all clean");

let noCleanup = [];
for (const { f, s } of all) {
  for (const m of s.matchAll(/window\.addEventListener\("([^"]+)"/g)) {
    if (!new RegExp(`removeEventListener\\("${m[1]}"`).test(s)) {
      noCleanup.push(`${f.split("/").pop()}:${m[1]}`);
    }
  }
}
check("every window listener is removed", noCleanup.length === 0, noCleanup.join(", ") || "all clean");

say(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
