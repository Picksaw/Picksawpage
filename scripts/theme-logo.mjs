import puppeteer from "puppeteer";
import { existsSync } from "node:fs";
const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const URL = process.argv[2] || "http://localhost:5173/";
const IDS = (process.argv[3] || "storm,sunrise-clear,sunset-clear").split(",");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({
  headless: true, executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: ["--no-sandbox", "--no-zygote", "--use-gl=angle", "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader", "--disable-dev-shm-usage", "--force-color-profile=srgb",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-features=CalculateNativeWinOcclusion"],
});
for (const id of IDS) {
  const p = await browser.newPage();
  await p.bringToFront();
  await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  if (id !== "storm")
    await p.evaluateOnNewDocument((t) => localStorage.setItem("picksaw:theme", t), id);
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(9000);
  await p.screenshot({ path: `scripts/mobile-audit/out/themes/logo-${id}.png` });
  console.log("shot", id);
  await p.close();
}
await browser.close();
