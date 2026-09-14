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
for (const [id, out] of [["sunrise-clear", "final-sunrise.png"], ["sunset-clear", "final-sunset.png"]]) {
  const p = await browser.newPage();
  await p.bringToFront();
  await p.setViewport({ width: 1100, height: 700, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((t) => localStorage.setItem("picksaw:theme", t), id);
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  await sleep(10000);
  await p.screenshot({ path: `scripts/mobile-audit/out/themes/${out}` });
  console.log("shot", out);
  await p.close();
}
await browser.close();
