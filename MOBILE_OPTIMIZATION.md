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

- **Adaptive resolution** (`Journey.tsx`, `AboutJourney.tsx` →
  `src/lib/renderQuality.ts`): *(superseded 2026-09-24 — the drei
  `<PerformanceMonitor>` below was replaced by `useJourneyDpr`, see
  "60 fps recovery pass" at the end of this file)* the monitor walked the
  canvas DPR between a 1.0 floor and a device-aware cap — phones render
  at up to 2× (retina-crisp; the fixed 1.25 cap was visibly blurry on
  dpr 2–3.5 screens), plain 1× desktops keep their 1.25 supersample,
  retina laptops cap at 1.75. Strong devices never dip, weak devices
  trade a hair of sharpness for framerate instead of jank.
- **Idle the 3D loop when covered**: `frameloop="demand"` while the opaque
  intro loader or the live-preview modal is up (the last presented frame
  stays on screen). Loading was the most thermal moment of the visit.
- **Ghost-card draw-call gate**: each walk's card (the home P, the About A)
  goes `visible=false` on its group once the camera dives past it —
  transparent planes still burn fill-rate for the rest of the scroll.
- **Storm canvas mobile DPR**: 1.5× (was a flat 1.0, which smeared the
  bolts on dpr 2–3 phones) — it sits behind the WebGL canvas and its rain
  is soft-focus anyway; the adaptive `renderEveryN` framerate throttle,
  not the pixel count, remains the perf guard.

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

---

## 60 fps recovery pass — 2026-09-24

Context: the blur fix (commit `e3a18de`) correctly raised the render
caps so phones/retina screens stop looking soft — but every canvas now
*starts* at its sharp ceiling, and the old drei `<PerformanceMonitor>`
reacted far too slowly when a device can't hold 60 fps there. It only
sampled inside the WebGL loop, needed six 500 ms windows before each
0.25 step, and on a PC grinding at ~6 fps that meant **15–90 s of
slideshow before the first decline** — plus, after `flipflops` flips it
stops sampling entirely, stranding whatever scale it happened to be on.
Reports came in of ~6 fps on desktop right after the blur fix.

### What changed

1. **New adaptive controller — `useJourneyDpr` (`src/lib/renderQuality.ts`)**
   - samples the *page* rAF frame rate (journey + storm + DOM +
     compositing = what the visitor actually sees) instead of WebGL-loop
     ticks;
   - hysteresis band instead of flip-flops:
     - fps < 46 sustained ~1 s → −0.25 (a single ≥1.2 s bad window
       counts as two — a dead page proves itself immediately);
     - fps ≥ 57 sustained ~3 s → +0.10 (never past the sharp cap);
     - 46–57 fps → hold — no oscillation, no buffer realloc thrash;
   - worst case to the 1.0 floor ≈ 3 s (was 15–90 s), and it never
     stops sampling (no fallback death); tab switches and the intro
     loader can't fake a bad window;
   - strong devices sit at the sharp cap permanently — behavior on
     hardware that holds 60 is identical to the blur fix;
   - replaces `<PerformanceMonitor>` in `Journey.tsx` + `AboutJourney.tsx`.

2. **Storm rain-rate is now frame-time aware (`StormBackground.tsx`)** —
   the old throttle only watched its own JS paint cost, so it never shed
   rain while the WebGL journey or compositing was the thing missing
   vsync. It now also watches the real frame delta: sustained >26 ms →
   paint every 2nd/3rd frame (background rain rate only — never
   resolution); back to every frame after sustained <17.2 ms. The check
   is time-based (900 ms), so it still fires promptly on pages that are
   already crawling.

3. **Emblem border painter at 30 Hz on every device (`GhostCard.tsx`)** —
   the bolt painter (2D draw + texture upload — several ms per frame on
   desktop) was gated at 30 Hz only on mobile. The animation clock still
   advances every frame, so only the sample rate is halved — the same
   budget phones have shipped with since the mobile pass, invisible
   behind the fake-bloom glow.

4. **Nothing renders under the opaque intro loader anymore** —
   `AboutJourney` used to run `frameloop="always"` behind the loader
   (the home walk already idled); it now uses `demand` until
   `introDone` (wired `App → AboutPage → AboutJourney`), and the storm
   canvas skips simulation + painting while the loader covers the
   screen (`<StormBackground covered={!introDone} />`).

### Quality promise

Unchanged from the blur fix: caps stay at touch ≤ 2×, fine-pointer
≤ 1.75×, floor 1.0 (native CSS resolution — never pixelated). No
resolution, texture, AA or shader was lowered anywhere; the only
"rate" changes are background rain and the border repaint, both
already proven visually lossless on phones.

### Verification

`scripts/perf-audit.mjs` (new) drives `?perf=1` in headless Chromium
and prints fps / per-component JS cost / canvas inventory / three.js
stats. On an emulated dpr-2 desktop the journey render scale now walks
1.75 → 1.25 → 1.0 within the first sample windows (the old monitor
stayed pinned at the ceiling for minutes under the same conditions).
`npx tsc --noEmit` + `npx vite build` clean; home and /about render
without console errors on desktop and iPhone viewports.

---

## The "40 fps in Chrome, 6 fps in Edge" pass

### The diagnosis

Both browsers are Chromium, so a 6–7× gap is not a browser difference — it
is **GPU acceleration**. When Edge cannot get a GPU context, WebGL falls
back to SwiftShader (software rasterization), which is roughly two orders
of magnitude slower per pixel than a real GPU. Chrome had acceleration;
Edge did not. Nothing in the codebase detected this case, so the same
full-quality scene ran on both and one of them crawled.

The sandbox's own Chromium runs under SwiftShader, so every measurement
below was taken in exactly the failing configuration rather than a proxy
for it.

### What changed

1. **Software-renderer detection (`src/lib/renderQuality.ts`)** —
   `isSoftwareRendering(gl)` reads `WEBGL_debug_renderer_info` and matches
   `swiftshader | software | llvmpipe | softpipe | basic renderers |
   microsoft basic | warp`. It releases its own probe context via
   `WEBGL_lose_context`, caches the answer, and returns `false` on any
   failure, so a browser that blocks the extension is simply treated as
   normal hardware.

2. **A two-axis adaptive governor replaces the DPR-only one** —
   `useJourneyQuality` now spends **render scale first, then the LOD
   budget**, and returns them in reverse once frames recover. A software
   renderer starts at the low tier immediately (`pixelRatio 0.75`)
   instead of spending ~15 s crawling down to it. Decline thresholds:
   46 fps over two windows; incline: 57 fps over six.

3. **City LOD (`src/lib/cityLod.ts`, `src/lib/lod.worker.ts`)** — meshoptimizer's
   simplifier runs in a **Web Worker** (`?worker&inline`) at load time and
   builds one alternate **index buffer** per unique mesh. Swapping a level
   reuses the same vertex buffer and the same draw call, so the draw-call
   count and the material are untouched.

4. **Street lights drop out entirely in the two daylight themes** —
   `MovingStreetLights` now hides its group when `streetI <= 0.01`. Two
   shipped themes set `streetI: 0`, so their four point lights were
   contributing exactly nothing visually while still costing a
   `NUM_POINT_LIGHTS` term in every lit shader. Hiding them recompiles a
   cheaper variant at zero visual cost. The default `storm` theme
   (`streetI: 15`) is unchanged.

5. **`Window3D` only writes style when a value actually changed** — an
   overlay section that is off-screen used to reassign eight style
   properties every frame. A `last` ref tracks `w, h, op, blur, shift,
   scale, focus, display`, so an idle section now writes nothing.

6. **Tailwind source scoping (`src/index.css`)** — automatic source
   detection was walking `.agents/skills/**` and emitting utilities from
   markdown and CSV files. Now `@import "tailwindcss" source(none)` plus
   two explicit `@source` lines.

### The no-quality-loss rule

Every LOD switch is gated on a measured pixel budget, not a guessed
distance. The simplifier reports the **world-space** deviation of the
coarse mesh from the original (`ErrorAbsolute`), and the projected size
of that deviation is

```
pixels = error · H / (2 · d · tan(fov/2))
⇒ switch distance = error · k · lodBias,  k = H / (2 · TARGET_PX · tan(fov/2))
```

With `TARGET_PX = 0.5`, a level is only used once its worst deviation
covers **less than half a pixel** on the current viewport. The distance
used is `dz` only, so the true distance for a side building is larger —
the switch happens strictly *later* than the budget allows. Levels are
held with `LOD_HYSTERESIS = 0.85` so a building sitting on a boundary
cannot flicker.

Every failure path — no worker, no WASM, non-indexed geometry, fewer
than `MIN_TRIS` triangles, less than `MIN_SAVING` reduction, or a
non-positive error — resolves to `null` and leaves the mesh exactly as it
was before this pass.

Only two levels are built, chosen by measuring the real models: the
detailed façades simplify hard at `0.004` (48,358 → 29,155 triangles),
but the plainer shells barely move there and only collapse at `0.04`
(2,304 → 16). Those shells are drawn 21–35 times each, so skipping the
coarse pass lost a third of the total saving. A third and fourth ceiling
bought 1–15% beyond these two while doubling build time again.

### Quality promise

No resolution cap was lowered, no texture downscaled, no effect dropped
and no shader simplified. The LOD is the only geometry change, and it is
provably sub-pixel. On hardware that holds 60 fps the governor sits at
its ceiling and the scene looks exactly as it did.

### Verification

`scripts/verify-lod.mjs` (new) runs the scene under SwiftShader at
1000×620, scroll 0.42, and captures a **paired A/B/A** sequence — LOD on,
LOD off, LOD on — with the same 3 s gap between every frame, plus the
same for the underground foundation blocks. Because the scene keeps
animating, a naive "before vs after" diff measures animation drift as
well as geometry; the paired design gives each change its own control.

```
renderer: SwiftShader Device (Subzero) — software: true
triangles: LOD off 1,004,910 → LOD on 652,914  (-35%)
  measured with LOD ON : 46/56 meshes on LOD, pf 404, bias 0.25
  measured with LOD OFF:  0/56 meshes on LOD, pf 404, bias 0.25

control   B→C (nothing changed) : mean 4.8435  max 231  pctOver4 6.039
LOD       A→B (LOD removed)     : mean 4.6858  max 231  pctOver4 5.685
found ctrl D→E (nothing changed): mean 1.4137  max 212  pctOver4 2.810
foundations C→D (blocks hidden) : mean 1.4193  max 212  pctOver4 2.855
  LOD verdict         : INDISTINGUISHABLE FROM FRAME DRIFT
  foundations verdict : INDISTINGUISHABLE FROM FRAME DRIFT
```

The LOD's pixel delta is *smaller than its own control*, so the swap adds
nothing that frame drift does not already produce.

An independent head-to-head at 1280×720, sampling each arm from a fresh
page load (`?perf=1` vs `?perf=1&nolod=1`), agrees on the same saving:

| | triangles | avg frame | p95 frame | draw calls |
|---|---|---|---|---|
| LOD off | 1,068,852 | 2178 ms | 4917 ms | 192 |
| LOD on  |   695,077 |  732 ms | 4567 ms | 192 |

**−35.0% triangles, 2.97× faster average frame, identical draw-call
count.** These absolute milliseconds are software-rendering figures —
roughly 100× slower than a real GPU — so only the ratio is meaningful.

`npx tsc --noEmit -p tsconfig.json` exits 0 and `npx vite build` is
clean; `dist/index.html` is 2,032.68 kB (674.55 kB gzip). The `<style>`
block fell from 447,625 to 312,718 bytes (−135 kB) and the build from
~30 s to ~8.6 s once Tailwind stopped scanning `.agents/skills/`. All 717
remaining selectors are app-traceable.

### Not done, and why

- **The foundation blocks stay.** Hiding them is also measured
  indistinguishable, but it saves only ~420 triangles (~4%) for 35 draw
  calls, and the proof covers one scroll position and one theme. Not
  worth the risk for that little.
- **Street lights cannot be masked per object.** `WebGLRenderer.projectObject`
  calls `currentRenderState.pushLight(object)` unconditionally, so
  three.js has no per-object light layers to hook. The daylight-theme
  hide above is the available win; the default `storm` theme still pays
  for its four lights.
- **`buildMs` is not a wall-clock figure under SwiftShader.** It read
  246 ms, 383 ms, 27.7 s and 39 s across runs purely from CPU
  starvation — the worker competes with the rasterizer for cores. On
  GPU-accelerated hardware the CPU is free and the sub-second figure
  applies. The build is off the main thread and the scene is fully
  correct without it, so a slow build costs nothing but the saving.
- **~19.7 MB of GLBs in `public/` appear unreferenced** (`building_02.glb`,
  `sci-fi_building_11.glb`, `sci-fi_building.glb`,
  `game_ready_mid_poly_building_1.glb`). They are never loaded at
  runtime, so they cost bandwidth and not fps; confirm no other importer
  before deleting.
