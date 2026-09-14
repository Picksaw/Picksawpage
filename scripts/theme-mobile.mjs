// Mobile-only QA (fresh browser to keep memory low).
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

const p = await browser.newPage();
await p.bringToFront();
await p.setViewport({ width: 390, height: 780, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await p.evaluateOnNewDocument(() => localStorage.setItem("picksaw:theme", "sunset-clear"));
p.on("pageerror", (e) => console.log("PAGE EXCEPTION:", String(e).slice(0, 200)));
await p.goto(URL, { waitUntil: "domcontentloaded" });
await sleep(12000);
await p.screenshot({ path: "scripts/mobile-audit/out/themes/mobile-sunset.png" });
console.log("shot mobile sunset");

await p.click('button[aria-haspopup="menu"]');
await sleep(800);
await p.screenshot({ path: "scripts/mobile-audit/out/themes/mobile-menu.png" });
console.log("shot mobile menu");
await p.click('[role="menuitemradio"]:nth-child(2)'); // sunrise clear
await sleep(9000);
await p.screenshot({ path: "scripts/mobile-audit/out/themes/mobile-sunrise.png" });
console.log("shot mobile sunrise");

await browser.close();
