// Quick validation: p-station, all 5 themes (software-rendered CI —
// small viewport, fixed crossfade settle; no canvas readback polling).
import puppeteer from "puppeteer";
import { mkdirSync, existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const OUT = "scripts/mobile-audit/out/themes";
mkdirSync(OUT, { recursive: true });
const IDS = ["storm", "sunrise-clear", "sunrise-cloudy", "sunset-clear", "sunset-cloudy"];

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
const page = await browser.newPage();
await page.bringToFront();
await page.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 200)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(process.argv[2] || "http://localhost:5173/", { waitUntil: "domcontentloaded" });
await sleep(10000);

for (const id of IDS) {
  await page.click('button[aria-haspopup="menu"]');
  await sleep(400);
  const items = await page.$$('[role="menuitemradio"]');
  await items[IDS.indexOf(id)].click();
  await sleep(13000); // crossfade at ~4fps software rendering
  await page.screenshot({ path: `${OUT}/quick-${id}-p.png` });
  console.log("shot", id);
}

await browser.close();
