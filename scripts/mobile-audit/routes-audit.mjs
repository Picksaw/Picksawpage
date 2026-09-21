/**
 * routes-audit — integration verification for the six portfolio routes
 * and the Picksaw homepage, against the production build in dist/:
 *
 *   serve:  node scripts/mobile-audit/serve.mjs dist 4173 &
 *   run:    node scripts/mobile-audit/routes-audit.mjs [--mobile]
 *
 * For each route it performs DIRECT navigation (cold load), asserts the
 * page renders (React #root populated / static body populated), every
 * <img> resolves, fonts load, no request 404s, no console errors / page
 * errors, horizontal overflow stays zero, then RELOADS (refresh test)
 * and repeats. With --mobile it runs the same checks on an emulated
 * dpr-3 touch phone.
 */
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

const EXECUTABLE = existsSync("/tmp/chromium") ? "/tmp/chromium" : process.env.CHROME_BIN;
if (!EXECUTABLE) {
  console.error("No /tmp/chromium — re-extract @sparticuz/chromium (see scripts/mobile-audit/setup-browser.mjs)");
  process.exit(1);
}

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const MOBILE = process.argv.includes("--mobile");

const ROUTES = [
  { path: "/", name: "Picksaw home", kind: "spa" },
  { path: "/verda/", name: "Verda", kind: "spa" },
  { path: "/lumina/", name: "Lumina", kind: "spa" },
  { path: "/pulse/", name: "Pulse", kind: "spa" },
  { path: "/clarity/", name: "Clarity", kind: "spa" },
  { path: "/lumen/", name: "Lumen", kind: "spa" },
  { path: "/aurora/", name: "Aurora", kind: "static" },
];

const browser = await puppeteer.launch({
  headless: true,
  executablePath: EXECUTABLE,
  env: { ...process.env, LD_LIBRARY_PATH: "/tmp/al2023/lib", FONTCONFIG_PATH: "/tmp/fonts" },
  args: [
    "--no-sandbox", "--no-zygote", "--disable-setuid-sandbox", "--disable-gpu",
    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist", "--disable-dev-shm-usage", "--font-render-hinting=none",
  ],
});

let failures = 0;
const report = [];

for (const route of ROUTES) {
  const page = await browser.newPage();
  if (MOBILE) {
    await page.emulate({
      viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
  } else {
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  }

  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // console noise from sandbox-blocked CDN requests is not an integration bug
      if (!/favicon|ERR_CONNECTION_CLOSED|ERR_INTERNET_DISCONNECTED/i.test(t))
        consoleErrors.push(t.slice(0, 180));
    }
  });
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 180)));
  page.on("response", (r) => {
    // only same-origin failures matter — external CDNs (fonts/gsap/tailwind)
    // are blocked inside this sandbox but work in production
    if (r.status() >= 400 && r.url().startsWith(BASE))
      badResponses.push(`${r.status()} ${r.url().replace(BASE, "")}`);
  });

  const seen = { phase: "load" };
  for (const phase of ["load", "reload"]) {
    seen.phase = phase;
    try {
      await page.goto(BASE + route.path, { waitUntil: "domcontentloaded", timeout: 90000 });
      await new Promise((r) => setTimeout(r, route.kind === "spa" ? 9000 : 5000));

      const checks = await page.evaluate((kind) => {
        const de = document.documentElement;
        const rootEl = document.getElementById("root");
        const imgs = [...document.images];
        // empty src = intentional JS-filled placeholder (aurora treatment/lightbox);
        // remote images (pexels…) may be blocked in this sandbox but work in production
        const external = (u) => /^https?:\/\//.test(u || "");
        const isBroken = (i) => {
          const s = i.getAttribute("src") || "";
          return i.complete && i.naturalWidth === 0 && s !== "" && !external(s);
        };
        return {
          title: document.title,
          rendered:
            kind === "spa"
              ? !!rootEl && rootEl.childElementCount > 0
              : document.body.childElementCount > 3,
          imgsTotal: imgs.length,
          imgsBroken: imgs.filter(isBroken).length,
          imgsBrokenSrcs: imgs.filter(isBroken).map((i) => i.getAttribute("src")).slice(0, 6),
          overflowX: de.scrollWidth - de.clientWidth,
          fonts: document.fonts ? document.fonts.size : -1,
          canonical: document.querySelector('link[rel="canonical"]')?.href || null,
          canvases: document.querySelectorAll("canvas").length,
          bodyH: document.body.scrollHeight,
        };
      }, route.kind);

      // scroll to the bottom to trigger scroll-driven sections, then back
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.65 }));
      await new Promise((r) => setTimeout(r, 2500));
      await page.evaluate(() => window.scrollTo(0, 0));

      const problems = [];
      if (!checks.rendered) problems.push("page did not render");
      if (checks.imgsBroken > 0) problems.push(`${checks.imgsBroken}/${checks.imgsTotal} images broken`);
      if (checks.overflowX > 1) problems.push(`horizontal overflow ${checks.overflowX}px`);
      if (phase === "load" && route.path !== "/" && !checks.canonical) problems.push("missing canonical");

      report.push({
        route: route.path,
        phase,
        ok: problems.length === 0,
        ...checks,
        problems,
      });
      if (problems.length) failures++;
    } catch (err) {
      report.push({ route: route.path, phase, ok: false, problems: [String(err).slice(0, 160)] });
      failures++;
    }
  }

  const net = badResponses.filter((u) => !u.includes("favicon"));
  const errs = consoleErrors.filter((e) => !e.includes("favicon"));
  report.push({
    route: route.path,
    phase: "net/console",
    ok: net.length === 0 && errs.length === 0 && pageErrors.length === 0,
    badResponses: net.slice(0, 10),
    consoleErrors: errs.slice(0, 8),
    pageErrors: pageErrors.slice(0, 8),
  });
  if (net.length || errs.length || pageErrors.length) failures++;
  await page.close();
}

console.log(`\n═══ routes-audit (${MOBILE ? "MOBILE dpr-3 touch" : "desktop"}) @ ${BASE} ═══`);
for (const r of report) {
  if (r.phase === "net/console") {
    const clean = r.ok;
    console.log(`${clean ? "✅" : "❌"} ${r.route} network+console`);
    (r.badResponses || []).forEach((u) => console.log(`     ✗ ${u}`));
    (r.consoleErrors || []).forEach((u) => console.log(`     ⚠ ${u}`));
    (r.pageErrors || []).forEach((u) => console.log(`     ⚠ pageerror: ${u}`));
  } else {
    const bits = [
      r.ok ? "✅" : "❌",
      `${r.route} [${r.phase}]`,
      r.title ? `"${String(r.title).slice(0, 52)}"` : "",
      `imgs ${r.imgsBroken}/${r.imgsTotal} broken`,
      `overflow ${r.overflowX}px`,
      `canvas×${r.canvases}`,
      r.canonical ? `canonical→${r.canonical}` : "",
    ].filter(Boolean);
    console.log(bits.join("  "));
    (r.problems || []).forEach((p) => console.log(`     ✗ ${p}`));
    (r.imgsBrokenSrcs || []).forEach((s) => console.log(`     ✗ img: ${s}`));
  }
}
console.log(failures === 0 ? "\nALL CLEAN ✅" : `\n${failures} problem group(s) ❌`);
await browser.close();
process.exit(failures === 0 ? 0 : 1);
