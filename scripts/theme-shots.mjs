// Theme visual QA — loads once, then switches atmosphere through the
// real header menu and captures each journey station.
// Usage: node scripts/theme-shots.mjs [url]
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const URL = process.argv[2] || "http://localhost:5173/";
const OUT = "scripts/mobile-audit/out/themes";
mkdirSync(OUT, { recursive: true });

const THEMES = [
  "storm",
  "sunrise-clear",
  "sunrise-cloudy",
  "sunset-clear",
  "sunset-cloudy",
];
const STATIONS = [
  ["p", 0.0],
  ["headline", 0.1],
  ["gallery", 0.3],
  ["finale", 0.9],
];

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: [
    "--no-sandbox",
    "--no-zygote",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--disable-dev-shm-usage",
    "--force-color-profile=srgb",
    // headless background throttling would freeze the rAF crossfades
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-features=CalculateNativeWinOcclusion",
  ],
});

const page = await browser.newPage();
await page.bringToFront();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 200)));
page.on("console", (m) => {
  if (m.type() === "error") console.log("PAGE ERR:", m.text().slice(0, 160));
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Poll the 2D atmosphere canvas until its top-band pixels stop moving
// (the theme crossfade has converged) or we hit the timeout.
async function waitSettled(timeoutMs = 12000) {
  await page.waitForFunction(
    () => {
      const cv = document.querySelector("canvas");
      if (!cv) return false;
      const cx = cv.getContext("2d");
      if (!cx) return false;
      const w = 24;
      const grab = () => {
        const d = cx.getImageData((cv.width - w) >> 1, (cv.height * 0.08) | 0, w, w).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        return [r / n, g / n, b / n];
      };
      return new Promise((resolve) => {
        const a = grab();
        setTimeout(() => {
          const b = grab();
          resolve(Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1.2);
        }, 350);
      });
    },
    { timeout: timeoutMs, polling: 500 },
  ).catch(() => {});
  await sleep(600);
}

async function chooseTheme(id) {
  await page.click('button[aria-haspopup="menu"]');
  await sleep(350);
  const idx = THEMES.indexOf(id);
  const items = await page.$$('[role="menuitemradio"]');
  if (!items[idx]) throw new Error("menu item missing for " + id);
  await items[idx].click();
  await waitSettled();
}

async function scrollTo(frac) {
  await page.evaluate((f) => window.scrollTo(0, document.documentElement.scrollHeight * f), frac);
  await sleep(3500); // camera dolly settle
}

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name);
}

await page.goto(URL, { waitUntil: "domcontentloaded" });
await sleep(7000); // intro + first models

for (const [station, frac] of STATIONS) {
  if (frac > 0) await scrollTo(frac);
  for (const id of THEMES) {
    await chooseTheme(id);
    await shot(`${id}-${station}`);
  }
}

// the menu itself
await page.evaluate(() => window.scrollTo(0, 0));
await sleep(2500);
await page.click('button[aria-haspopup="menu"]');
await sleep(600);
await shot("menu-open");

await browser.close();
console.log("done →", OUT);
