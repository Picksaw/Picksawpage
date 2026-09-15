import puppeteer from "puppeteer";
import { existsSync } from "node:fs";

const browser = await puppeteer.launch({
  headless: true,
  executablePath: existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: [
    "--no-sandbox", "--no-zygote",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--disable-dev-shm-usage",
    "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows", "--disable-features=CalculateNativeWinOcclusion",
  ],
});
const page = await browser.newPage();
await page.bringToFront();
await page.setViewport({ width: 800, height: 520, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 300)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(process.argv[2] || "http://localhost:5173/", { waitUntil: "domcontentloaded" });
await sleep(8000);

console.log("visibility:", await page.evaluate(() => document.visibilityState));

async function band() {
  return page.evaluate(() => {
    const cv = document.querySelector("canvas");
    const cx = cv.getContext("2d");
    const w = 40, h = 10;
    const d = cx.getImageData(((cv.width - w) / 2) | 0, (cv.height * 0.08) | 0, w, h).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });
}

console.log("storm band:", await band());
await page.click('button[aria-haspopup="menu"]');
await sleep(400);
const items = await page.$$('[role="menuitemradio"]');
console.log("menu items:", items.length);
await items[1].click();
for (let i = 0; i < 12; i++) {
  await sleep(1000);
  console.log(`t+${i + 1}s theme=`, await page.evaluate(() => document.documentElement.dataset.theme), "band:", await band());
}

await page.screenshot({ path: "scripts/mobile-audit/out/themes/debug-sunrise.png" });
await browser.close();
