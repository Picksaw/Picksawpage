// Render-scale verification: emulates a dpr-3 touch phone, loads the built
// site, and reports the effective render scale (backing px / CSS px) of
// every canvas — the 3D journey canvas should start at 2.00, the storm
// 2D canvas at 1.50, never below 1.00.
//
// Usage:
//   npm run build && npx vite preview --port 4173 &
//   node scripts/verify-dpr.mjs [url] [outPng] [settleMs] [scrollFrac]
//
// One-time browser setup: npm i --no-save @sparticuz/chromium, then
// decompress node_modules/@sparticuz/chromium/bin/*.br to /tmp (chromium
// itself, al2023 libs, fonts, swiftshader) — see scripts/mobile-audit/.
import puppeteer from "puppeteer";

const url = process.argv[2] || "http://localhost:4173/#/";

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
  viewport: {
    width: 390,
    height: 844,
    deviceScaleFactor: 3, // typical mid/high-end phone
    isMobile: true,
    hasTouch: true,
  },
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});

page.on("console", (m) => {
  const t = m.text();
  if (!t.includes("THREE.WebGLRenderer")) console.log("[page]", t.slice(0, 160));
});
page.on("pageerror", (e) => console.log("[pageerror]", String(e).slice(0, 300)));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
// some asset fetches never settle (networkidle is unreliable here) — just
// let the app boot, the intro lift, and a few frames render (SwiftShader
// is slow, so be generous)
await new Promise((r) => setTimeout(r, Number(process.argv[4] || 45000)));

// optional: scroll this fraction of the page (drives the journey camera)
const scrollFrac = Number(process.argv[5] || 0);
if (scrollFrac > 0) {
  await page.evaluate((p) => {
    const max =
      document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * p);
  }, scrollFrac);
  await new Promise((r) => setTimeout(r, 8000)); // camera + fade settle
}

const info = await page.evaluate(() => {
  const dpr = window.devicePixelRatio;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const canvases = [...document.querySelectorAll("canvas")].map((c) => ({
    id: c.id || "(none)",
    parent: c.parentElement?.className?.toString().slice(0, 50) || "",
    backing: `${c.width}×${c.height}`,
    css: `${c.clientWidth}×${c.clientHeight}`,
    scale: (c.width / Math.max(1, c.clientWidth)).toFixed(2),
  }));
  return { devicePixelRatio: dpr, coarsePointer: coarse, canvases };
});
console.log(JSON.stringify(info, null, 2));

const out = process.argv[3] || "scripts/verify-phone-home.png";
await page.screenshot({ path: out });
await browser.close();
console.log("screenshot:", out);
