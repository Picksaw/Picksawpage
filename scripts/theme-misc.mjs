// Misc QA: menu open, gallery stations, mobile — all fresh loads.
import puppeteer from "puppeteer";
import { existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
const URL = process.argv[2] || "http://localhost:5173/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function page({ theme, mobile }) {
  const p = await browser.newPage();
  await p.bringToFront();
  if (mobile) await p.setViewport({ width: 390, height: 780, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  else await p.setViewport({ width: 900, height: 600, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((t) => localStorage.setItem("picksaw:theme", t), theme);
  p.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 200)));
  await p.goto(URL, { waitUntil: "domcontentloaded" });
  return p;
}

// 1. menu open (storm)
{
  const p = await page({ theme: "storm" });
  await sleep(10000);
  await p.click('button[aria-haspopup="menu"]');
  await sleep(700);
  await p.screenshot({ path: "scripts/mobile-audit/out/themes/misc-menu.png" });
  console.log("shot menu");
  await p.close();
}

// 2. sunrise-clear gallery station
{
  const p = await page({ theme: "sunrise-clear" });
  await sleep(11000);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.3));
  await sleep(11000);
  await p.screenshot({ path: "scripts/mobile-audit/out/themes/misc-sunrise-gallery.png" });
  console.log("shot sunrise gallery");
  await p.close();
}

// 3. storm gallery (compare painting border/halo)
{
  const p = await page({ theme: "storm" });
  await sleep(11000);
  await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.3));
  await sleep(11000);
  await p.screenshot({ path: "scripts/mobile-audit/out/themes/misc-storm-gallery.png" });
  console.log("shot storm gallery");
  await p.close();
}

// 4. mobile sunset
{
  const p = await page({ theme: "sunset-clear", mobile: true });
  await sleep(12000);
  await p.screenshot({ path: "scripts/mobile-audit/out/themes/misc-mobile-sunset.png" });
  console.log("shot mobile sunset");
  await p.close();
}

// 5. mobile sunrise-clear, menu open
{
  const p = await page({ theme: "sunrise-clear", mobile: true });
  await sleep(12000);
  await p.click('button[aria-haspopup="menu"]');
  await sleep(700);
  await p.screenshot({ path: "scripts/mobile-audit/out/themes/misc-mobile-menu.png" });
  console.log("shot mobile menu");
  await p.close();
}

await browser.close();
console.log("done");
