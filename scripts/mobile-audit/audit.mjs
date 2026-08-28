// Mobile audit — emulated phone (viewport, touch, DPR, CPU + network throttle),
// measures load timings, transfer weight, FPS idle & while scrolling,
// long tasks, console errors, horizontal overflow.
//
// Usage: node scripts/mobile-audit/audit.mjs [--out dir] [--cpu 4]
//        [--net fast3g|slow4g|none] [--path /#/] [--noscroll] [--waitasset 60]
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const bool = (name) => args.includes(`--${name}`);

const OUT = flag("out", "scripts/mobile-audit/out");
const CPU = Number(flag("cpu", "4"));
const NET = flag("net", "fast3g");
const PATH_ = flag("path", "/#/");
const WAIT_ASSET = Number(flag("waitasset", "90")); // max seconds to wait for city assets
mkdirSync(OUT, { recursive: true });

const NETS = {
  // ≈ Chrome DevTools presets
  fast3g: { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 },
  slow4g: { offline: false, downloadThroughput: (4 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8, latency: 100 },
  none: null,
};

const BASE = "http://127.0.0.1:4173";

// Chromium from @sparticuz/chromium (npm-tarball build; the Chrome CDN is
// unreachable here). One-time setup: node scripts/mobile-audit/setup-browser.mjs
const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;

if (!EXECUTABLE) {
  console.error("No /tmp/chromium — run: node scripts/mobile-audit/setup-browser.mjs");
  process.exit(1);
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: {
    ...process.env,
    LD_LIBRARY_PATH: "/tmp/al2023/lib",
    FONTCONFIG_PATH: "/tmp/fonts",
  },
  args: [
    // sparticuz-style flags (software GL) minus the process-fidelity killers
    "--no-sandbox",
    "--no-zygote",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--allow-running-insecure-content",
    "--disable-web-security",
    "--disable-site-isolation-trials",
    "--disable-features=AudioServiceOutOfProcess,IsolateOrigins,site-per-process",
    "--font-render-hinting=none",
    "--disable-dev-shm-usage",
  ],
});

const page = await browser.newPage();

// Moto G Power-ish — a common mid/low Android
await page.emulate({
  viewport: { width: 355, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 },
  userAgent:
    "Mozilla/5.0 (Linux; Android 11; Moto G Power (2021)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
});

const client = await page.createCDPSession();
await client.send("Network.enable");
await client.send("Page.enable");
await client.send("Emulation.setCPUThrottlingRate", { rate: CPU });
if (NETS[NET]) {
  await client.send("Network.emulateNetworkConditions", NETS[NET]);
}

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning")
    errors.push(`${m.type()}: ${m.text().slice(0, 300)}`);
});

// in-page perf instrumentation, installed before app scripts run
await page.evaluateOnNewDocument(() => {
  window.__t0 = performance.now();
  window.__longTasks = 0;
  window.__deltas = [];
  window.__bytes = 0;
  try {
    new PerformanceObserver((l) => (window.__longTasks += l.getEntries().length)).observe({
      entryTypes: ["longtask"],
    });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__bytes += e.transferSize || 0;
    }).observe({ type: "resource", buffered: true });
  } catch {}
  window.__fpsLoop = () => {
    const t = performance.now();
    if (window.__last) window.__deltas.push(t - window.__last);
    window.__last = t;
    requestAnimationFrame(window.__fpsLoop);
  };
  requestAnimationFrame(window.__fpsLoop);
  window.__mark = (name) => (window[name] = performance.now());
});

const t0 = Date.now();
await page.goto(BASE + PATH_, { waitUntil: "domcontentloaded", timeout: 120000 });

// wait for the intro to finish (app content becomes visible)
const ready = await page.waitForFunction(
  () => {
    const el = document.querySelector("main");
    return !!el && el.getClientRects().length > 0;
  },
  { timeout: 60000, polling: 500 }
).then(() => true).catch(() => false);

// wait for the journey's heavy assets (5 GLBs + 4 road WebPs) — the whole
// point of the load test — capped at WAIT_ASSET seconds.
const assetsDone = await page
  .waitForFunction(
    () => {
      const r = performance.getEntriesByType("resource");
      const glb = r.filter((e) => e.name.endsWith(".glb") && e.responseEnd > 0);
      const road = r.filter((e) => e.name.includes("road/") && e.name.endsWith(".webp") && e.responseEnd > 0);
      return glb.length >= 5 && road.length >= 4;
    },
    { timeout: WAIT_ASSET * 1000, polling: 1000 }
  )
  .then(() => true)
  .catch(() => false);

const nav = await page.evaluate(() => {
  const n = performance.getEntriesByType("navigation")[0];
  const paint = performance.getEntriesByType("paint");
  const fcp = paint.find((p) => p.name === "first-contentful-paint");
  let lcp = 0;
  try {
    const entries = performance.getEntriesByType("largest-contentful-paint");
    lcp = entries.length ? entries[entries.length - 1].startTime : 0;
  } catch {}
  const resources = performance.getEntriesByType("resource");
  const byType = {};
  let lastByte = 0;
  for (const r of resources) {
    const k = /\.(glb|webp|jpe?g|png|ogg|woff2?|html|js|css)$/i.exec(r.name)?.[1]?.toLowerCase() || "other";
    byType[k] = byType[k] || { count: 0, bytes: 0, ms: 0 };
    byType[k].count++;
    byType[k].bytes += r.transferSize || 0;
    byType[k].ms = Math.max(byType[k].ms, Math.round(r.responseEnd - r.startTime));
    lastByte = Math.max(lastByte, r.responseEnd || 0);
  }
  return {
    ttfb: Math.round(n?.responseStart || 0),
    fcp: Math.round(fcp?.startTime || 0),
    lcp: Math.round(lcp),
    dcl: Math.round(n?.domContentLoadedEventEnd || 0),
    load: Math.round(n?.loadEventEnd || 0),
    lastResourceMs: Math.round(lastByte),
    bytes: window.__bytes,
    longTasks: window.__longTasks,
    byType,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    innerHeight: window.innerHeight,
    visualViewportH: window.visualViewport?.height,
  };
});

// ── idle FPS (5s) ─────────────────────────────────────────────
const idle = await page.evaluate(
  () =>
    new Promise((res) => {
      window.__deltas = [];
      setTimeout(() => {
        const d = window.__deltas.slice(5); // skip warmup
        const total = d.reduce((a, b) => a + b, 0);
        res({ fps: d.length && total ? Math.round((1000 * d.length) / total) : 0 });
      }, 5000);
    })
);

// ── scroll FPS (synthesized touch flings through the journey) ─
async function scrollFps() {
  await page.evaluate(() => (window.__deltas = []));
  const session = client;
  // a long, smooth swipe up the page — like a thumb drag
  const speed = 900 + Math.random() * 200;
  await session
    .send("Input.synthesizeScrollGesture", {
      x: 178,
      y: 600,
      yDistance: -1200,
      speed,
      gestureSourceType: "touch",
    })
    .catch(() => {});
  const r = await page.evaluate(() => {
    const d = window.__deltas;
    const total = d.reduce((a, b) => a + b, 0);
    if (!d.length || !total) return { fps: 0, p95: 0, frames: 0 };
    const sorted = [...d].sort((a, b) => a - b);
    return {
      fps: Math.round((1000 * d.length) / total),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
      frames: d.length,
    };
  });
  return r;
}
const scroll1 = await scrollFps();
const scroll2 = await scrollFps();
const scroll3 = await scrollFps();

// probe report (three.js stats) if available
const probe = await page.evaluate(() => (window.__perf ? window.__perf.report() : null));

const report = {
  device: "Moto G Power 355x740 dpr2.625",
  cpuThrottle: CPU,
  network: NET,
  path: PATH_,
  wallClockSec: ((Date.now() - t0) / 1000).toFixed(1),
  ready,
  assetsDone,
  nav,
  idleFps: idle.fps,
  scrollFps: [scroll1, scroll2, scroll3],
  probe,
  errors: errors.slice(0, 30),
  horizontalOverflow: nav.scrollWidth > nav.clientWidth,
};

writeFileSync(`${OUT}/report-${Date.now()}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
