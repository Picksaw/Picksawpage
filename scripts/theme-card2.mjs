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
p.on("console", (m) => { if (/card|corridor|p-?emblem|html|error/i.test(m.text())) console.log("[page]", m.text().slice(0, 200)); });
await sleep(13000);
const state = await p.evaluate(() => {
  const find = (re) => [...document.querySelectorAll("*")].filter((e) => re.test(e.textContent || "") && e.children.length === 0).slice(0, 3)
    .map((e) => {
      const cs = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return { tag: e.tagName, cls: (e.className?.baseVal ?? e.className ?? "").toString().slice(0, 60),
        vis: cs.visibility, op: cs.opacity, disp: cs.display,
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] };
    });
  return {
    amir: find(/AmirEhsan/i),
    ghost: find(/GHOST CLASS/i),
    htmlWraps: [...document.querySelectorAll("div")].filter((d) => getComputedStyle(d).transform !== "none" && (d.style?.transform?.includes("matrix3d"))).slice(0, 5)
      .map((e) => ({ cls: (e.className?.baseVal ?? e.className ?? "").toString().slice(0, 50), t: e.style.transform.slice(0, 90), disp: getComputedStyle(e).display, op: getComputedStyle(e).opacity })),
  };
});
console.log(JSON.stringify(state, null, 1));
await p.screenshot({ path: "scripts/mobile-audit/out/themes/card-t13.png" });
await browser.close();
