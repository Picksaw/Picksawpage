# Templates integration — portfolio projects as picksaw.ir routes

The six standalone portfolio projects live under `Templates/` and deploy as
real sub-directories of the main site:

| route | source | stack |
|---|---|---|
| `picksaw.ir/verda/` | `Templates/verda` | React 19 + Vite 7 + Tailwind 4 + GSAP + Lenis (singlefile) |
| `picksaw.ir/lumina/` | `Templates/lumina` | React 19 + Vite 7 + Tailwind 4 + GSAP (singlefile) |
| `picksaw.ir/pulse/` | `Templates/pulse` | React 19 + Vite 7 + Tailwind 4 + GSAP + Lenis (singlefile) |
| `picksaw.ir/clarity/` | `Templates/clarity` | React 19 + Vite 7 + Tailwind 4 + GSAP + Lenis (singlefile) |
| `picksaw.ir/lumen/` | `Templates/lumen` | React 19 + Vite 7 + Tailwind 4 + GSAP + Lenis (singlefile) |
| `picksaw.ir/aurora/` | `Templates/aurora` | fully static HTML + CDN libs (Tailwind browser, GSAP, Lenis) |

## Why sub-directories

The site deploys to **GitHub Pages** (`.github/workflows/deploy.yml` →
`./dist` artifact). Each project lands in `dist/<name>/index.html`, so
`https://picksaw.ir/verda` 301-redirects to the trailing-slash directory
index — **direct navigation and refresh work natively**, with zero SPA
fallback tricks and zero hash routes. The main app (`/`) and its
`#/about`, `#/feed` hash routes are untouched.

This layout gives perfect runtime isolation for free: each page loads
only its own single-file bundle — no shared CSS/JS/global state between
projects, and none with the main site. The projects keep their own
`package.json`/`package-lock.json` and their own dependency versions
(build isolation); nothing is hoisted into the main app.

## Build

`npm run build` now chains:

1. `vite build` — main app → `dist/`
2. `scripts/postbuild-404.mjs` — standalone storm `404.html`
3. `scripts/build-templates.mjs` — for every `Templates/<name>`:
   `npm ci` (if `node_modules` missing; lockfiles preserved) → `npm run build`
   → copy `Templates/<name>/dist` → `dist/<name>/`. `aurora` is copied
   as-is (`index.html`, `content.js`, `media.js`, `assets/`).

The GitHub Action needs no changes — it runs `npm run build`.

**Base path mechanics (why no `--base` flag):** all five Vite projects
use `viteSingleFile()`, whose *recommended build config* pins
`base: "./"` in its plugin `config` hook — it overrides even the CLI
`--base`. That relative base is exactly what makes the integration work:
all emitted and runtime asset URLs are document-relative, so each page
resolves its files under its own route. Absolute `"/images/…"` strings
in the four resolver-less projects were converted to `"./images/…"`
(mechanical, dev/server-identical at their original roots).
`Templates/clarity` needs nothing at all: its
`src/utils/imageResolver.ts` was written for sub-directory deploys and
with base `"./"` emits relative paths automatically — its sources are
byte-identical to the uploaded originals.

## What was changed (and only this)

Inside `Templates/<name>/`:

- asset strings `"/images/…"` → `"./images/…"` in `src/**` (verda,
  lumina, pulse, lumen) — no visual change
- `index.html` head: bilingual `<title>` (`Verda — … | Picksaw`),
  bilingual descriptions with creator attribution, canonical
  `https://picksaw.ir/<name>/`, absolute OG/Twitter image + URL +
  site_name + locale, `CreativeWork` JSON-LD
  (creator **Amirehsan Ashoori / امیراحسان عاشوری**, publisher
  **Picksaw / پیکسا**), and a semantic `<noscript>` block (React SPAs
  only) so the pages are crawlable without JavaScript
- nothing else — every component, animation, style and asset is the
  uploaded original

In the main app:

- `src/config/templatesConfig.ts` — template `url`s now local routes
  (`/verda/` …), so the journey paintings, PreviewModal and “Open live
  site” button all open the integrated pages (PreviewModal iframes them
  same-origin)
- `src/components/PreviewModal.tsx` + journey focus bar — address label
  renders local routes as `picksaw.ir/<name>`
- `public/sitemap.xml`, `public/llms.txt`, `public/llms-full.txt`,
  `index.html` JSON-LD item list — subdomains → new canonical paths
- `index.html` head is otherwise untouched (existing bilingual SEO kept)

## Verify

```bash
npm run build
node scripts/mobile-audit/serve.mjs dist 4173 &          # GH-Pages-like static server
node scripts/mobile-audit/routes-audit.mjs               # desktop pass
node scripts/mobile-audit/routes-audit.mjs --mobile      # dpr-3 touch phone pass
```

The audit does direct navigation + reload for every route, checks
rendering, broken images, horizontal overflow, canonicals, console and
network errors (same-origin). Browser for the harness: extract
`@sparticuz/chromium` to /tmp per `scripts/mobile-audit/MOBILE_OPTIMIZATION.md`
or run `scripts/mobile-audit/setup-browser.mjs`-style decompression.

## Known pre-existing items (present in the original projects too)

- **Clarity** references `public/images/instagram-2..6.webp` (plus
  `.jpg/.png` fallback probes) but the upload only contains
  `instagram-1.webp` — the missing tiles were missing in the original
  deploy as well. Drop the files into `Templates/clarity/public/images/`
  and rebuild to complete the Instagram grid.
- **Lumina**'s before/after smile gallery deliberately hotlinks
  `images.pexels.com` (primary source, not a fallback) — unchanged.
- **Aurora** loads Tailwind (browser JIT), GSAP, ScrollTrigger, Lenis and
  Google Fonts from CDNs by design — unchanged; requires internet access
  like the original deployment.

## Migration status

Original repositories remain the source of truth — nothing here deletes
or rewrites them. After this deploys and every route is verified live on
picksaw.ir, the old repos/subdomains can be archived; until then they
stay untouched. The `*.picksaw.ir` subdomains may optionally be kept as
redirects to the canonical paths.
