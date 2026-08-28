# Mobile optimization pass — 2026-08

Goal: the site loads and runs on phones as close to the PC experience as
possible — same look, same content, no removals — just faster and smoother.

Everything below is **visually lossless or layout-corrective only**.

## What changed

### 1. Asset diet (~34 MB → ~13.3 MB streamed after first paint)

| asset | before | after | how |
|---|---|---|---|
| 5 city GLBs (azadi, milad, NY, realistic, lowrise) | 25.2 MB | 8.1 MB | meshopt (`EXT_meshopt_compression`) + WebP textures via `scripts/compress-assets.mjs` |
| road set (4×2K JPG) | 8.9 MB | 4.9 MB | same 2K resolution, WebP (normal map q95 + 4:4:4) |
| painting screenshots (3 oversized) | 2.2 MB | 0.15 MB | resized to 1440w (above the 960px painting canvas) + WebP q92; originals kept where already smaller |
| stormblade-icon.png | 2.2 MB | 188 KB | 288×288 (max rendered size is 96 CSS px = 288 @3x) |

Total streamed after first paint: **~34 MB → ~13.3 MB**.

Geometry verification (`gltf-transform inspect`, original vs compressed):
identical vertex counts, bounding boxes match to 1e-4 units, materials
and material NAMES preserved (Corridor's neon-window logic keys on them),
textures stay at their original resolution. Meshopt quantization error is
sub-millimetre at city scale.

Decoder wiring: drei's `useGLTF` decodes meshopt by default; `AssetPrimer`
now installs the same `MeshoptDecoder` on its raw `GLTFLoader`. Road URLs
moved from `.jpg` → `.webp` in `AssetPrimer.ASPHALT_URLS` + `PuddleMaterial`.

Re-run after replacing models/textures: `node scripts/compress-assets.mjs`
(needs `npm i --no-save @gltf-transform/cli` — dev tool only, not a dep).

### 2. Runtime smoothness on phones

- **Adaptive resolution** (`Journey.tsx`): drei `<PerformanceMonitor>` walks
  the canvas DPR between 0.75 and the 1.25 cap — strong phones never dip,
  weak phones trade a hair of sharpness for framerate instead of jank.
- **Idle the 3D loop when covered**: `frameloop="demand"` while the opaque
  intro loader or the live-preview modal is up (the last presented frame
  stays on screen). Loading was the most thermal moment of the visit.
- **P-emblem draw-call gate**: the ghost card group goes `visible=false`
  once the camera dives past it (transparent planes still burn fill-rate).
- **Storm canvas mobile DPR**: flat 1.0 (was up to 1.125) — it sits behind
  the WebGL canvas, its rain is soft-focus anyway.

### 3. Layout / scaling fixes (mobile-only, look preserved on desktop)

- **Focus bar ↔ storm-orb dock collision** (all painting stations, phones):
  the action bar now lifts to `bottom + 5.5rem` below `sm:`, clear of the
  56px orb. Same for the headline CTAs.
- **Notch & gesture-bar safety**: `viewport-fit=cover` + `env(safe-area-*)`
  padding for the header, dock, journey UI layers and modals.
- **PostModal/AdminPanel heights**: `90vh/80vh` → paired with `dvh`
  equivalents so the mobile URL bar can't push modals off-screen;
  AdminPanel body scrolls (`overflow-y-auto`) instead of clipping on
  small phones.
- **iOS input zoom**: form fields pinned to 16px on `pointer: coarse` so
  focusing a field doesn't zoom the page.
- **Touch polish**: `touch-action: manipulation` on controls (no 300 ms
  double-tap delay), no grey tap flash, `overscroll-behavior-y: contain`
  (no accidental pull-to-refresh mid-journey), `text-size-adjust: 100%`.
- **Feed images**: `loading="lazy" decoding="async"` on post cards.

## Testing harness (`scripts/mobile-audit/`)

Emulated-phone QA on a real Chromium (software GL — the Chrome CDN is
blocked in this environment, so the browser comes from the
`@sparticuz/chromium` npm tarball):

```bash
npm i --no-save @sparticuz/chromium
node scripts/mobile-audit/setup-browser.mjs     # once per session (/tmp)
npm run build && node scripts/mobile-audit/serve.mjs dist 4173 &
node scripts/mobile-audit/audit.mjs --cpu 4 --net fast3g --path "/?perf=1#/"
node scripts/mobile-audit/shots.mjs             # 3 viewports × 26 scenes
node scripts/mobile-audit/analyze.mjs           # blank-frame detection
```

- `audit.mjs` — throttled load + scroll metrics (FCP/DCL, long tasks,
  per-type transfer, rAF stats, three.js draw stats via `?perf=1`).
- `shots.mjs` — walks every journey station + feed + modals + RTL + 404 on
  iPhone/SE/Android viewports; asserts no horizontal overflow and no
  element collisions; saves PNGs.
- `analyze.mjs` — flags uniform/black frames (canvas failed to render).

Latest results (Moto-G-class emulation, Fast-3G + 4× CPU):
all ~13.3 MB of journey assets land in ~76 s (was 34 MB ≈ 3× that),
no horizontal overflow on any viewport, no element collisions, city
renders (≈594 k triangles, ~127 draw calls), per-frame JS cost ≈ 0.8 ms
(storm) + ~2 ms (emblem border) on a throttled CPU.
