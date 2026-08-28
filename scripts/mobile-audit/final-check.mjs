// Final functional verification on the finished build:
//   1. journey renders after the intro lifts (frameloop resume works)
//   2. the compressed city streams + parses (draw calls & triangles > 0)
//   3. scroll through stations — camera moves, paintings appear
//   4. preview modal opens and the canvas idles (frameloop demand)
//   5. no page errors, no horizontal overflow at any station
import puppeteer from "puppeteer";
import { existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: ["--no-sandbox", "--no-zygote", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.emulate({
  viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));

await page.goto("http://127.0.0.1:4173/?perf=1#/", { waitUntil: "domcontentloaded", timeout: 60000 });

// intro done?
const intro = await page.waitForFunction(
  () => !!document.querySelector("main") && document.querySelector("main").getClientRects().length > 0,
  { timeout: 60000, polling: 400 }
).then(() => true).catch(() => false);

// assets landed?
const assets = await page.waitForFunction(() => {
  const r = performance.getEntriesByType("resource");
  return r.filter((e) => e.name.endsWith(".glb") && e.responseEnd > 0).length >= 5
      && r.filter((e) => e.name.includes("road/") && e.responseEnd > 0).length >= 4;
}, { timeout: 120000, polling: 1000 }).then(() => true).catch(() => false);

await new Promise((r) => setTimeout(r, 2500));

// canvas alive + city rendered?
const probe1 = await page.evaluate(() => (window.__perf ? window.__perf.report() : null));

// walk the journey, sampling probe at three stations
const stations = [0.1, 0.35, 0.75];
let overflow = [];
for (const p of stations) {
  await page.evaluate((p) => {
    const el = document.getElementById("templates");
    window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * p);
  }, p);
  await new Promise((r) => setTimeout(r, 2200));
  const o = await page.evaluate(() => {
    const de = document.documentElement;
    return { over: de.scrollWidth > de.clientWidth + 1, w: de.scrollWidth };
  });
  overflow.push(o);
}
const probe2 = await page.evaluate(() => (window.__perf ? window.__perf.report() : null));

// open the preview modal → canvas should idle
await page.evaluate(() => {
  const el = document.getElementById("templates");
  window.scrollTo(0, el.offsetTop + (el.offsetHeight - window.innerHeight) * (2.6 / 12));
});
await new Promise((r) => setTimeout(r, 2000));
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => /open live|باز کردن/i.test(x.textContent || ""));
  b?.click();
});
await new Promise((r) => setTimeout(r, 2500));
const modalOpen = await page.evaluate(() => !!document.querySelector('[role="dialog"] iframe'));
const probe3 = await page.evaluate(() => (window.__perf ? window.__perf.report() : null));

// idle-fps during modal (rAF deltas measured inside the page)
const modalIdle = await page.evaluate(() => new Promise((res) => {
  const t0 = performance.now(); let frames = 0;
  const loop = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(loop); else res(frames); };
  requestAnimationFrame(loop);
}));

const report = {
  intro, assets, modalOpen,
  glStart: probe1?.gl?.[0] ? { calls: probe1.gl[0].calls, tris: probe1.gl[0].triangles, dpr: probe1.gl[0].pixelRatio } : null,
  glWalk: probe2?.gl?.[0] ? { calls: probe2.gl[0].calls, tris: probe2.gl[0].triangles } : null,
  glModal: probe3?.gl?.[0] ? { calls: probe3.gl[0].calls, tris: probe3.gl[0].triangles } : null,
  modalIdleRaf3s: modalIdle,
  overflow,
  errors: errors.slice(0, 10),
};
console.log(JSON.stringify(report, null, 2));
await browser.close();
