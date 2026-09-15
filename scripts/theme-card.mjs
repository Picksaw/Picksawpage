import puppeteer from "puppeteer";
import { existsSync } from "node:fs";
const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const URL = process.argv[2] || "http://localhost:5173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  headless: true, executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: ["--no-sandbox", "--no-zygote", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--disable-dev-shm-usage", "--force-color-profile=srgb",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-features=CalculateNativeWinOcclusion"],
});
const p = await browser.newPage();
await p.bringToFront();
await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
await p.evaluateOnNewDocument(() => localStorage.setItem("picksaw:theme", "sunrise-clear"));
await p.goto(URL, { waitUntil: "domcontentloaded" });
const TS = [8];
let prev = 0;
for (const t of TS) {
  await sleep((t - prev) * 1000);
  prev = t;
  const info = await p.evaluate(() => ({
    y: window.scrollY,
    h: document.documentElement.scrollHeight,
  })).catch(() => null);
  await p.screenshot({ path: `scripts/mobile-audit/out/themes/card-t${t}.png` });
  console.log("t=", t, JSON.stringify(info));
}
await browser.close();
