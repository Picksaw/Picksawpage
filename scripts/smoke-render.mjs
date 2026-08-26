/**
 * Real render smoke test.
 *
 * Builds the app as a classic (non-module) IIFE — jsdom will not execute
 * `type="module"` scripts — and mounts it in jsdom.
 *
 * jsdom has no WebGL, so the 3D city cannot draw. That is the point: the
 * DOM chrome (header, dock, footer, CTAs, hero copy) is plain React and
 * MUST render regardless. If it does not, the fault is in the app, not
 * the renderer — which is the case the user described: "no template
 * buttons, no P, no texts".
 *
 *   node scripts/smoke-render.mjs
 */
import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "picksaw-render-"));
const outfile = join(dir, "app.js");

await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  format: "iife",
  platform: "browser",
  outfile,
  loader: { ".css": "empty", ".woff2": "empty", ".woff": "empty", ".png": "empty", ".webp": "empty", ".ogg": "empty" },
  // Vite replaces import.meta.env at build time; esbuild does not, so
  // supply the whole object the app actually reads.
  define: {
    "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({
      BASE_URL: "/", DEV: true, PROD: false, MODE: "development",
      VITE_ADMIN_API_BASE: "",
    }),
  },
  jsx: "automatic",
  logLevel: "error",
});
const js = readFileSync(outfile, "utf8");

const msgs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => msgs.push(["jsdomError", e.detail?.stack ?? e.message]));
vc.on("error", (...a) => msgs.push(["error", a.map(String).join(" ")]));
vc.on("warn", (...a) => msgs.push(["warn", a.map(String).join(" ")]));

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/", virtualConsole: vc,
});
const { window } = dom;

window.matchMedia = (q) => ({ matches: false, media: q, onchange: null,
  addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false });
window.HTMLCanvasElement.prototype.getContext = () => null;
window.scrollTo = () => {};
window.scrollBy = () => {};
window.IntersectionObserver = class {
  constructor(cb){ this._cb = cb; }
  observe(el){ this._cb([{ isIntersecting: true, target: el, intersectionRatio: 1 }], this); }
  unobserve(){} disconnect(){} takeRecords(){ return []; }
};
window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  // jsdom does not expose these on its window; React 19 and three both use them
  window.TextEncoder = window.TextEncoder ?? TextEncoder;
  window.TextDecoder = window.TextDecoder ?? TextDecoder;
window.AudioContext = class { constructor(){ this.state="suspended"; this.currentTime=0; this.destination={}; this.sampleRate=48000; } };
window.addEventListener("error", (e) => msgs.push(["window.error", `${e.message} @ ${e.filename}:${e.lineno}`]));
window.addEventListener("unhandledrejection", (e) => msgs.push(["rejection", String(e.reason?.stack ?? e.reason)]));

const s = window.document.createElement("script");
s.textContent = js;
window.document.body.appendChild(s);

await new Promise((r) => setTimeout(r, 700));

const doc = window.document;
const root = doc.getElementById("root");
const text = (root?.textContent ?? "").replace(/\s+/g, " ").trim();

console.log("\nRENDER SMOKE TEST  (jsdom, no WebGL)\n");
console.log(`  #root children       ${root ? root.children.length : "NO ROOT"}`);
console.log(`  total elements       ${doc.querySelectorAll("*").length}`);
console.log(`  buttons              ${doc.querySelectorAll("button").length}`);
console.log(`  links                ${doc.querySelectorAll("a").length}`);
console.log(`  canvases             ${doc.querySelectorAll("canvas").length}`);
console.log(`  visible text length  ${text.length}`);
console.log(`  text sample          "${text.slice(0, 160)}"`);

let failures = 0;
const check = (label, ok, detail) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
};

console.log("\nTHE APP MOUNTED?");
check("#root has children", (root?.children.length ?? 0) > 0, `${root?.children.length ?? 0}`);
check("the wordmark rendered", /picksaw/i.test(text));
check("interactive controls exist", doc.querySelectorAll("button, a").length > 0,
  `${doc.querySelectorAll("button,a").length} controls`);
check("substantial copy rendered", text.length > 150, `${text.length} chars`);

console.log("\nERRORS DURING MOUNT");
if (msgs.length === 0) console.log("  none");
else msgs.slice(0, 10).forEach(([k, v]) => console.log(`  [${k}] ${String(v).slice(0, 400)}`));

rmSync(dir, { recursive: true, force: true });
dom.window.close();
console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
