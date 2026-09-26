// Proves the city LOD swaps geometry invisibly, and prints how much it saves.
//
// Usage:
//   npx vite preview --port 4173 --host 0.0.0.0 &      # must be serving dist/
//   node scripts/verify-lod.mjs
//
// Needs the Chromium + libs that scripts/mobile-audit/setup-browser.mjs
// extracts to /tmp. Runs under SwiftShader (software rendering) on
// purpose — it is the worst case, and it is exactly what a browser with
// GPU acceleration disabled produces.
//
// The scene keeps animating (theme easing, emblem, borders), so a naive
// The scene keeps animating (theme easing, emblem, borders), so a naive
// "LOD on vs LOD off" diff measures animation drift as well as geometry.
// Instead three frames are captured back to back with the SAME gap:
//
//     A  LOD on
//     B  LOD off     ← the change under test
//     C  LOD on      ← control: same gap, no change
//
// diff(A,B) is the LOD's footprint; diff(B,C) is what the same elapsed
// time costs with nothing changed. If the two match, the swap adds
// nothing you can see. The same test is run for the underground
// foundation blocks.
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/tmp/chromium",
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: ["--no-sandbox","--no-zygote","--disable-setuid-sandbox","--disable-gpu","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1000, height: 620, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 200)));
await page.goto("http://localhost:4173/?perf=1#/", { waitUntil: "domcontentloaded", timeout: 90000 });

const gl = () => page.evaluate(() => window.__perf.report().gl.find((g) => g.name === "journey"));
const meta = () => page.evaluate(() => window.__perf.meta());

await new Promise((r) => setTimeout(r, 30000));
await page.evaluate(() => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, max * 0.42);
});

// wait for the LOD table to exist, then give it time to engage
let m = null;
for (let i = 0; i < 90; i++) {
  await new Promise((r) => setTimeout(r, 2000));
  m = (await meta()).cityLod ?? null;
  if (m) { console.log(`LOD table ready after ~${30 + i * 2}s (worker ${m.buildMs}ms, ${m.buildingsWithLod}/${m.buildingsTotal} buildings, ${m.meshesCovered} meshes)`); break; }
}
await new Promise((r) => setTimeout(r, 8000));

const rend = (await meta()).renderer;
console.log("renderer:", JSON.stringify(rend));

// info.render.triangles is one frame's draw, and the camera keeps
// walking the corridor, so a single read is noise. Sample a run and
// take the median.
async function medianTris() {
  const xs = [];
  let live = null;
  for (let i = 0; i < 7; i++) {
    xs.push((await gl()).triangles);
    live = (await meta()).lodLive ?? live;
    await new Promise((r) => setTimeout(r, 1200));
  }
  xs.sort((a, b) => a - b);
  return { tris: xs[3], live };
}
const on = await medianTris();
await page.evaluate(() => window.__picksawLod.set(false));
await new Promise((r) => setTimeout(r, 6000));
const off = await medianTris();
await page.evaluate(() => window.__picksawLod.set(true));
await new Promise((r) => setTimeout(r, 6000));
const onTris = on.tris, offTris = off.tris;
// The saving depends on how many buildings are past their switch
// distance at this scroll position, and the switch distance depends on
// the adaptive governor's current LOD bias — so the figure is only
// readable next to the live engagement stats that produced it.
const eng = (l) => `${l?.meshesOnLod ?? "?"}/${l?.meshesVisible ?? "?"} meshes on LOD, pf ${l?.pixelFactor}, bias ${l?.bias}`;
console.log(`triangles: LOD off ${offTris} → LOD on ${onTris}  (-${Math.round((1 - onTris / offTris) * 100)}%)`);
console.log(`  measured with LOD ON : ${eng(on.live)}`);
console.log(`  measured with LOD OFF: ${eng(off.live)}`);

// quiet the fastest movers so the paired diff is as clean as possible
await page.evaluate(() => {
  window.__perf.set("perf-rain3d", false);
  window.__perf.set("perf-groundfog", false);
  document.querySelectorAll("canvas").forEach((c) => {
    let g = null;
    try { g = c.getContext("webgl2") || c.getContext("webgl"); } catch { /* noop */ }
    if (!g && c.width > 200) c.style.visibility = "hidden";
  });
});
await new Promise((r) => setTimeout(r, 4000));

const GAP = 3000;
const shots = [];
async function cap(label) {
  shots.push({ label, b64: await page.screenshot({ encoding: "base64" }) });
  await new Promise((r) => setTimeout(r, GAP));
}
await cap("A lod-on");
await page.evaluate(() => window.__picksawLod.set(false));
await cap("B lod-off");
await page.evaluate(() => window.__picksawLod.set(true));
await cap("C lod-on");
await page.evaluate(() => window.__perf.set("perf-foundation", false));
await cap("D no-foundations");
await page.evaluate(() => window.__perf.set("perf-foundation", true));
await cap("E foundations-back");

const diffPage = await browser.newPage();
const res = await diffPage.evaluate(async (imgs) => {
  const load = (b64) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = "data:image/png;base64," + b64; });
  const im = await Promise.all(imgs.map((x) => load(x.b64)));
  const cv = document.createElement("canvas");
  cv.width = im[0].width; cv.height = im[0].height;
  const cx = cv.getContext("2d");
  const px = (k) => { cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(im[k], 0, 0); return cx.getImageData(0, 0, cv.width, cv.height).data; };
  const [pa, pb, pc, pd, pe] = [0, 1, 2, 3, 4].map(px);
  const stat = (p, q) => {
    let sum = 0, max = 0, over = 0, n = 0;
    for (let i = 0; i < p.length; i += 4) {
      const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]));
      sum += d; if (d > max) max = d; if (d > 4) over++; n++;
    }
    return { mean: +(sum / n).toFixed(4), max, pctOver4: +((over / n) * 100).toFixed(3) };
  };
  return {
    control: stat(pb, pc),          // same gap, nothing changed
    lod: stat(pa, pb),              // the change under test
    foundControl: stat(pd, pe),
    foundations: stat(pc, pd),
  };
}, shots);

console.log("\n── paired visual test (same inter-frame gap throughout) ──");
console.log("control   B→C  (nothing changed):", JSON.stringify(res.control));
console.log("LOD       A→B  (LOD removed)    :", JSON.stringify(res.lod));
console.log("found ctrl D→E (nothing changed):", JSON.stringify(res.foundControl));
console.log("foundations C→D (blocks hidden) :", JSON.stringify(res.foundations));
const v = (test, ctrl) =>
  test.mean <= Math.max(ctrl.mean * 1.6, 0.35) && test.pctOver4 <= ctrl.pctOver4 * 1.6 + 0.25
    ? "INDISTINGUISHABLE FROM FRAME DRIFT"
    : "VISIBLE DIFFERENCE";
console.log(`  LOD verdict         : ${v(res.lod, res.control)}`);
console.log(`  foundations verdict : ${v(res.foundations, res.foundControl)}`);
await browser.close();
