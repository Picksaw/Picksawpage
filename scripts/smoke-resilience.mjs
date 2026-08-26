/**
 * Resilience smoke test.
 *
 * Mounts the real app under hostile conditions and asserts the site
 * still renders. Each scenario reproduces a way the page previously
 * went completely blank.
 *
 *   node scripts/smoke-resilience.mjs
 */
import { build } from "esbuild";
import { JSDOM, VirtualConsole } from "jsdom";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "picksaw-res-"));
const outfile = join(dir, "app.js");
await build({
  entryPoints: ["src/main.tsx"], bundle: true, format: "iife", platform: "browser", outfile,
  loader: { ".css":"empty", ".woff2":"empty", ".woff":"empty", ".png":"empty", ".webp":"empty", ".ogg":"empty" },
  define: { "process.env.NODE_ENV": '"development"',
    "import.meta.env": JSON.stringify({ BASE_URL:"/", DEV:true, PROD:false, MODE:"development", VITE_ADMIN_API_BASE:"" }) },
  jsx: "automatic", logLevel: "error",
});
const js = readFileSync(outfile, "utf8");

async function mount({ label, breakIO = false, breakWebGL = true, rerenderStorm = false, waitMs = 3200 }) {
  const msgs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => msgs.push(e.detail?.message ?? e.message));
  vc.on("error", (...a) => msgs.push(a.map(String).join(" ").slice(0, 160)));

  const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
    runScripts: "dangerously", pretendToBeVisual: true, url: "http://localhost/", virtualConsole: vc,
  });
  const { window } = dom;
  window.matchMedia = (q) => ({ matches:false, media:q, addEventListener(){}, removeEventListener(){},
    addListener(){}, removeListener(){}, dispatchEvent:()=>false });
  window.scrollTo = () => {}; window.scrollBy = () => {};
  window.HTMLCanvasElement.prototype.getContext = breakWebGL ? () => null : () => ({});
  if (!breakIO) {
    window.IntersectionObserver = class {
      constructor(cb){ this._cb = cb; }
      observe(el){ this._cb([{ isIntersecting:true, target:el, intersectionRatio:1 }], this); }
      unobserve(){} disconnect(){} takeRecords(){ return []; }
    };
  }
  window.ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
  // jsdom does not expose these on its window; React 19 and three both use them
  window.TextEncoder = window.TextEncoder ?? TextEncoder;
  window.TextDecoder = window.TextDecoder ?? TextDecoder;
  window.AudioContext = class { constructor(){ this.state="suspended"; this.currentTime=0; this.destination={}; this.sampleRate=48000; } };

  const s = window.document.createElement("script");
  s.textContent = js;
  window.document.body.appendChild(s);

  // simulate a component re-rendering App faster than the intro
  if (rerenderStorm) {
    const t = setInterval(() => {
      window.dispatchEvent(new window.Event("resize"));
    }, 60);
    setTimeout(() => clearInterval(t), waitMs);
  }

  await new Promise((r) => setTimeout(r, waitMs));

  const doc = window.document;
  const root = doc.getElementById("root");
  const text = (root?.textContent ?? "").replace(/\s+/g, " ").trim();
  // the intro gate: is the site still hidden?
  const hidden = [...doc.querySelectorAll("div")].some((d) => d.style?.visibility === "hidden");
  const result = {
    label, elements: doc.querySelectorAll("*").length,
    controls: doc.querySelectorAll("button, a").length,
    chars: text.length, hidden, errors: msgs.length,
  };
  dom.window.close();
  return result;
}

const scenarios = [
  { label: "baseline (no WebGL)",            breakWebGL: true, waitMs: 3200 },
  { label: "no IntersectionObserver",        breakIO: true, waitMs: 3200 },
  { label: "App re-rendering every 60ms",    rerenderStorm: true, waitMs: 6000 },
  { label: "no IO + constant re-render",     breakIO: true, rerenderStorm: true, waitMs: 6000 },
];

console.log("\nRESILIENCE  (the site must render under all of these)\n");
console.log("  scenario                        elems  controls  chars  hidden  errors");
let failures = 0;
for (const sc of scenarios) {
  const r = await mount(sc);
  const ok = r.elements > 50 && r.controls > 0 && r.chars > 150 && !r.hidden;
  if (!ok) failures++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"} ${r.label.padEnd(29)} ${String(r.elements).padStart(4)}` +
    `  ${String(r.controls).padStart(7)}  ${String(r.chars).padStart(5)}` +
    `  ${r.hidden ? "YES!!" : "no   "}   ${r.errors}`
  );
}

console.log("\n  'hidden' = the intro gate never opened, so the whole site is invisible.");
rmSync(dir, { recursive: true, force: true });
console.log(`\n${failures === 0 ? "ALL SCENARIOS PASSED" : `${failures} SCENARIO(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
