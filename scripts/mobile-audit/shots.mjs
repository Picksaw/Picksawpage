// Screenshot + layout QA across the journey stations and every page,
// on phone / small-phone / desktop viewports. Saves PNGs and a JSON
// report of programmatic layout checks (overflow, element collisions).
import puppeteer from "puppeteer";
import { mkdirSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
if (!EXECUTABLE) { console.error("run setup-browser.mjs first"); process.exit(1); }

const OUT = "scripts/mobile-audit/out/shots";
mkdirSync(OUT, { recursive: true });

const SAMPLE_POSTS = {
  posts: [
    { id: "p1", type: "video", title: "Stormblade trailer cut", description: "Neon streets, one blade.", tags: ["3d", "trailer"], mediaUrl: "https://example.com/v.mp4", color: "#4fd8ff", icon: "⚡", createdAt: Date.now() - 86400000, likes: 12 },
    { id: "p2", type: "music", title: "Rain on concrete", description: "Lofi storm session 01.", tags: ["lofi"], mediaUrl: "https://example.com/m.mp3", color: "#9fe8ff", icon: "♪", createdAt: Date.now() - 172800000, likes: 34 },
    { id: "p3", type: "image", title: "Azadi at midnight", description: "Tower study.", tags: ["photo"], mediaUrl: "/images/aurora.webp", color: "#2a6cff", icon: "◈", createdAt: Date.now() - 259200000, likes: 7 },
  ],
};

const launch = async () =>
  puppeteer.launch({
    headless: true,
    executablePath: EXECUTABLE,
    env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
    args: ["--no-sandbox", "--no-zygote", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
  });

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844, dpr: 3 }, // iPhone 14 Pro-ish
  { name: "small", width: 320, height: 568, dpr: 2 }, // iPhone SE — the tight case
  { name: "android", width: 355, height: 740, dpr: 2.625 },
];

const UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Mobile Safari/537.36";

const browser = await launch();
const results = [];

async function runViewport(vp) {
  const page = await browser.newPage();
  await page.emulate({
    viewport: { width: vp.width, height: vp.height, isMobile: true, hasTouch: true, deviceScaleFactor: vp.dpr },
    userAgent: UA,
  });
  const client = await page.createCDPSession();
  await client.send("Network.enable");
  await client.send("Network.emulateNetworkConditions", { offline: false, downloadThroughput: 100 * 1024 * 1024 / 8, uploadThroughput: 10 * 1024 * 1024 / 8, latency: 10 });

  // stub the posts API (sandbox has no egress to api.picksaw.ir)
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (req.url().includes("/api/posts")) {
      req.respond({ status: 200, contentType: "application/json", body: JSON.stringify(SAMPLE_POSTS) });
    } else req.continue();
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));

  const layoutCheck = async () =>
    page.evaluate(() => {
      const de = document.documentElement;
      const out = { overflowX: de.scrollWidth > de.clientWidth + 1, scrollW: de.scrollWidth, clientW: de.clientWidth };
      // focus bar vs dock collision
      const bar = document.querySelector(".pointer-events-auto.flex.items-center.gap-4, .pointer-events-auto.flex.items-center");
      const dock = document.querySelector(".fixed.safe-bottom") || document.querySelector(".fixed.bottom-5, .fixed[class*='safe-bottom']");
      if (bar && dock) {
        const a = bar.getBoundingClientRect();
        const b = dock.getBoundingClientRect();
        out.barVsDock = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom) ? "OVERLAP" : "ok";
      }
      // any fixed/absolute element spilling outside the viewport horizontally
      // (ignore elements clipped by an overflow-hidden ancestor — those are
      // intentional decorative bleeds, not real overflow)
      let spill = 0;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 1 && (r.left < -8 || r.right > de.clientWidth + 8)) {
          let clipped = false;
          let a = el.parentElement;
          while (a && a !== document.body) {
            const s = getComputedStyle(a);
            if (s.overflow !== "visible" || s.overflowX !== "visible") { clipped = true; break; }
            a = a.parentElement;
          }
          if (!clipped) spill++;
        }
      }
      out.spillingEls = spill;
      return out;
    });

  const scrollToProgress = async (p) => {
    await page.evaluate((p) => {
      const el = document.getElementById("templates");
      const top = el.offsetTop + (el.offsetHeight - window.innerHeight) * p;
      window.scrollTo(0, top);
    }, p);
    await new Promise((r) => setTimeout(r, 1800)); // camera lerp settles
  };

  const shot = async (name, check = true) => {
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png` });
    const layout = check ? await layoutCheck() : null;
    results.push({ vp: vp.name, shot: name, layout });
    console.log(`${vp.name} ${name}: ${layout ? JSON.stringify(layout) : "no-check"}`);
  };

  // ── the journey ────────────────────────────────────────────
  await page.goto("http://127.0.0.1:4173/?perf=1#/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => {
    const el = document.querySelector("main");
    return !!el && el.getClientRects().length > 0;
  }, { timeout: 60000, polling: 400 }).catch(() => {});
  // let the city stream in (local server = fast)
  await page.waitForFunction(() => {
    const r = performance.getEntriesByType("resource");
    return r.filter((e) => e.name.endsWith(".glb") && e.responseEnd > 0).length >= 5;
  }, { timeout: 90000, polling: 1000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));

  const stations = {
    "00-p": 0,
    "01-headline": 1 / 12,
    "02-painting": 2 / 12,
    "03-painting": 3 / 12,
    "04-painting": 4 / 12,
    "05-painting": 5 / 12,
    "06-painting": 6 / 12,
    "07-painting": 7 / 12,
    "08-stats": 9 / 12,   // extra section stations
    "09-process": 10 / 12,
    "10-contact": 11 / 12,
    "11-finale": 0.995,
  };
  for (const [name, p] of Object.entries(stations)) {
    await scrollToProgress(p);
    await shot(name);
  }

  // open a painting's live preview (tap the focused Open button)
  await scrollToProgress(2.6 / 12);
  const opened = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const b = btns.find((x) => x.textContent?.toLowerCase().includes("open live") || x.textContent?.toLowerCase().includes("باز کردن"));
    b?.click();
    return !!b;
  });
  await new Promise((r) => setTimeout(r, 2500));
  await shot("12-preview-modal");
  await page.keyboard.press("Escape");
  await new Promise((r) => setTimeout(r, 800));

  // ── feed page ──────────────────────────────────────────────
  await page.goto("http://127.0.0.1:4173/?perf=1#/feed", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));
  await shot("20-feed-top");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
  await shot("21-feed-mid");

  // open a post modal
  const openedPost = await page.evaluate(() => {
    const card = document.querySelector("[data-post], .group.cursor-pointer, article");
    card?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return !!card;
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot("22-post-modal");
  await page.keyboard.press("Escape");

  // ── RTL (Farsi) ────────────────────────────────────────────
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.match(/فارسی|FA|فار/) || b.getAttribute("aria-label")?.toLowerCase().includes("language"));
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 1200));
  await shot("23-feed-rtl");
  await page.goto("http://127.0.0.1:4173/?perf=1#/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForFunction(() => document.querySelector("main")?.getClientRects().length > 0, { timeout: 30000, polling: 400 }).catch(() => {});
  await scrollToProgress(2.5 / 12);
  await shot("24-journey-rtl");

  // ── 404 ────────────────────────────────────────────────────
  await page.goto("http://127.0.0.1:4173/?perf=1#/nope-nope", { waitUntil: "domcontentloaded", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  await shot("25-404");

  results.push({ vp: vp.name, errors: errors.slice(0, 12) });
  await page.close();
}

for (const vp of VIEWPORTS) await runViewport(vp);

writeFileSync(`${OUT}/report.json`, JSON.stringify(results, null, 2));
console.log("DONE →", `${OUT}/`);
await browser.close();
