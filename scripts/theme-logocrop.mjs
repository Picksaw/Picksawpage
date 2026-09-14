import puppeteer from "puppeteer";
import { existsSync } from "node:fs";
const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const URL = process.argv[2] || "http://localhost:5173/";
const id = process.argv[3] || "sunrise-clear";
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
await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 2 });
if (id !== "storm")
  await p.evaluateOnNewDocument((t) => localStorage.setItem("picksaw:theme", t), id);
await p.goto(URL, { waitUntil: "domcontentloaded" });
await sleep(9000);
await p.screenshot({
  path: `scripts/mobile-audit/out/themes/crop-${id}.png`,
  clip: { x: 0, y: 0, width: 220, height: 90 },
});
console.log("crop", id);
await browser.close();
