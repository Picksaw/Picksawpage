/**
 * postbuild-404 — writes a standalone dist/404.html for servers that
 * serve a real 404 document for unknown URLs (GitHub Pages does).
 *
 * It is fully self-contained (inline CSS + SVG, zero external requests)
 * on purpose: the site builds with base "./", so a 404 page served from
 * a deep mistyped path must not depend on relative asset URLs.
 *
 * The SPA's own styled 404 (src/pages/NotFoundPage.tsx) covers in-app
 * (hash) navigation; this file catches everything else and points back
 * to the site root.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");

const RAIN = Array.from({ length: 14 }, (_, i) => {
  const left = (i * 7.3 + ((i * i * 13) % 11)) % 100;
  const h = 12 + ((i * 31) % 22);
  const d = (i * 0.13) % 1.1;
  const dur = 0.5 + ((i * 19) % 30) / 100;
  const o = 0.18 + ((i * 7) % 10) / 26;
  return `<span style="left:${left.toFixed(1)}%;height:${h}vh;animation-delay:${d.toFixed(2)}s;animation-duration:${dur.toFixed(2)}s;opacity:${o.toFixed(2)}"></span>`;
}).join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="404 — this page got lost in the storm." />
<meta name="theme-color" content="#020617" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
<title>404 — Picksaw</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: #04060c;
    color: #e2e8f0;
    font-family: "Sora", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Vazirmatn", sans-serif;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 2rem 1.5rem; overflow: hidden; position: relative;
  }
  .glow {
    position: absolute; left: 50%; top: 50%; width: 520px; height: 520px;
    transform: translate(-50%, -50%); border-radius: 50%;
    background: rgba(79, 216, 255, 0.08); filter: blur(130px); pointer-events: none;
  }
  .rain { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .rain span {
    position: absolute; top: -15%; width: 1.5px; border-radius: 2px;
    background: linear-gradient(180deg, transparent, rgba(159, 232, 255, 0.55));
    animation: fall linear infinite;
  }
  @keyframes fall {
    0% { transform: translateY(-20vh); opacity: 0; }
    12% { opacity: 1; }
    100% { transform: translateY(120vh); opacity: 0.2; }
  }
  main { position: relative; z-index: 1; }
  .p { display: block; margin: 0 auto 1.25rem; filter: drop-shadow(0 0 22px rgba(159, 232, 255, 0.8)); }
  h1 {
    font-size: clamp(4.5rem, 14vw, 7.5rem); font-weight: 700; letter-spacing: -0.02em;
    color: #fff; text-shadow: 0 0 26px rgba(159, 232, 255, 0.55);
  }
  .title { margin-top: 0.75rem; font-size: 1.15rem; font-weight: 600; color: #e2e8f0; }
  .title.fa { font-family: "Vazirmatn", "Sora", ui-sans-serif, system-ui, sans-serif; }
  .body { margin-top: 0.75rem; max-width: 26rem; font-size: 0.9rem; line-height: 1.7; color: #94a3b8; }
  .body.fa { font-family: "Vazirmatn", "Sora", ui-sans-serif, system-ui, sans-serif; }
  a.home {
    display: inline-flex; align-items: center; gap: 0.5rem; margin-top: 2.25rem;
    padding: 0.8rem 1.6rem; border-radius: 0.9rem; text-decoration: none;
    color: #04060c; font-weight: 700; font-size: 0.95rem;
    background: linear-gradient(135deg, #9fe8ff, #4fd8ff);
    box-shadow: 0 0 24px rgba(79, 216, 255, 0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  a.home:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(79, 216, 255, 0.55); }
  .hint { margin-top: 2rem; font-size: 0.65rem; letter-spacing: 0.24em; text-transform: uppercase; color: #475569; }
  .wordmark {
    position: absolute; bottom: 1.5rem; left: 0; right: 0; z-index: 1;
    font-size: 0.8rem; font-weight: 700; color: #64748b;
  }
  .wordmark b { color: #4fd8ff; }
</style>
</head>
<body>
<div class="glow" aria-hidden="true"></div>
<div class="rain" aria-hidden="true">${RAIN}</div>
<main>
  <svg class="p" width="84" height="84" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M38 96V26h26c11 0 19 8 19 18s-8 18-19 18H38" stroke="#4fd8ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  <h1>404</h1>
  <p class="title">Lost in the storm</p>
  <p class="title fa">در طوفان گم شد</p>
  <p class="body">The page you&rsquo;re looking for dissolved in the rain somewhere between the towers.</p>
  <p class="body fa">صفحه‌ای که دنبالش بودی، بین برج‌ها در باران حل شد.</p>
  <a class="home" href="./">Back to the safe side &larr;</a>
  <p class="hint">Error 404 &mdash; the bolt missed this page</p>
</main>
<div class="wordmark">Pick<b>saw</b></div>
</body>
</html>
`;

mkdirSync(dist, { recursive: true });
writeFileSync(path.join(dist, "404.html"), html);
console.log("postbuild: wrote dist/404.html (standalone storm 404)");
