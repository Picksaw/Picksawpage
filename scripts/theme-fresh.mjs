// Per-theme fresh load (software CI) — injects the chosen atmosphere in
// localStorage, waits for load + render, screenshots the p station.
import puppeteer from "puppeteer";
import { mkdirSync, existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const OUT = "scripts/mobile-audit/out/themes";
mkdirSync(OUT, { recursive: true });
const IDS = (process.argv[3] || "sunrise-cloudy,sunset-clear,sunset-cloudy").split(",");

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: [
    "--no-sandbox", "--no-zygote",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--disable-dev-shm-usage", "--force-color-profile=srgb",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-features=CalculateNativeWinOcclusion",
  ],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const id of IDS) {
  const page = await browser.newPage();
  await page.bringToFront();
  await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 200)));
  await page.evaluateOnNewDocument((t) => localStorage.setItem("picksaw:theme", t), id);
  await page.goto(process.argv[2] || "http://localhost:5173/", { waitUntil: "domcontentloaded" });
  await sleep(11000);
  await page.screenshot({ path: `${OUT}/fresh-${id}-p.png` });
  console.log("shot", id);
  await page.close();
}

await browser.close();
