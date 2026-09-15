/**
 * Renders public/og-image.jpg (1200×630), icon-192.png, icon-512.png
 * and apple-touch-icon.png (180) from og.html using the local headless
 * Chromium — no network fonts, exact brand lettering via local Sora.
 * Run: node scripts/seo-assets/render-seo-assets.mjs
 */
import puppeteer from "puppeteer";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: ["--no-sandbox", "--no-zygote", "--force-color-profile=srgb", "--disable-dev-shm-usage"],
});
const p = await browser.newPage();
await p.setViewport({ width: 1300, height: 1100, deviceScaleFactor: 1 });
await p.goto("file://" + path.join(root, "scripts/seo-assets/og.html"), { waitUntil: "load" });
await sleep(400);

// OG card at exactly 1200×630 (some scrapers reject oversize images)
await p.screenshot({
  path: path.join(root, "public", "og-image.png"),
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});
console.log("wrote public/og-image.png");

// app icons at 2× crispness
await p.setViewport({ width: 1300, height: 1100, deviceScaleFactor: 2 });
await sleep(300);
const shots = [
  ["icon-512.png", { x: 0, y: 650, width: 512, height: 512 }],
  ["icon-192.png", { x: 560, y: 650, width: 192, height: 192 }],
  ["apple-touch-icon.png", { x: 560, y: 880, width: 180, height: 180 }],
];
for (const [name, clip] of shots) {
  await p.screenshot({ path: path.join(root, "public", name), clip, type: "png" });
  console.log("wrote public/" + name);
}
await browser.close();
