// Perf audit: loads the built site in headless Chromium (SwiftShader),
// lets the intro lift, then samples window.__perf (?perf=1) — FPS, per-
// component JS cost, canvas backing-store inventory and three.js stats.
//
// Usage:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/perf-audit.mjs [--url ...] [--dpr 1|2] [--w 1920] [--h 1080]
//                               [--scroll 0.35] [--samples 4] [--wait 14000]
//
// One-time browser setup: npm i --no-save @sparticuz/chromium && node scripts/mobile-audit/setup-browser.mjs
import puppeteer from "puppeteer";

const argv = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const url = opt("url", "http://localhost:4173/?perf=1#/");
const dpr = Number(opt("dpr", 1));
const W = Number(opt("w", 1920));
const H = Number(opt("h", 1080));
const scrollFrac = Number(opt("scroll", 0));
const samples = Number(opt("samples", 4));
const waitMs = Number(opt("wait", 14000));
const sampleEveryMs = Number(opt("every", 5000));

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/tmp/chromium",
  env: {
    ...process.env,
    LD_LIBRARY_PATH: "/tmp/al2023/lib",
    FONTCONFIG_PATH: "/tmp/fonts",
  },
  args: [
    "--no-sandbox",
    "--no-zygote",
    "--disable-setuid-sandbox",
    "--disable-gpu",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--disable-dev-shm-usage",
    "--font-render-hinting=none",
  ],
});

const page = await browser.newPage();
await page.emulate({
  viewport: { width: W, height: H, deviceScaleFactor: dpr },
  userAgent:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
});

page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await new Promise((r) => setTimeout(r, waitMs));

if (scrollFrac > 0) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * p);
  }, scrollFrac);
  await new Promise((r) => setTimeout(r, 6000));
}

const hasProbe = await page.evaluate(() => !!window.__perf);
if (!hasProbe) {
  console.error("no window.__perf — load with ?perf=1");
  await browser.close();
  process.exit(1);
}

for (let i = 0; i < samples; i++) {
  const report = await page.evaluate(() => window.__perf.report());
  console.log(`--- sample ${i + 1}/${samples} ---`);
  console.log(
    JSON.stringify(
      {
        fps: report.fps,
        avgFrameMs: report.avgFrameMs,
        p95FrameMs: report.p95FrameMs,
        longTasks: report.longTasks,
        jsCost: report.jsCost,
        canvases: report.canvases,
        gl: report.gl,
      },
      null,
      2,
    ),
  );
  if (i < samples - 1) await new Promise((r) => setTimeout(r, sampleEveryMs));
}

await browser.close();
