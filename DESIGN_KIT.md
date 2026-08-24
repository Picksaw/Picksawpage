# Picksaw — 3D Interactive Upgrade Kit

Everything installed on **2026-08-24** to transform Picksaw into a refined 3D interactive
site with detailed micro-interactions. The storm theme stays — it gets a third dimension.

---

## 1. Runtime libraries (npm dependencies)

| Package | Role |
|---|---|
| `three` | Core 3D engine (WebGL) |
| `@react-three/fiber` | React renderer for three.js — write 3D as components |
| `@react-three/drei` | Batteries-included helpers: `Float`, `Environment`, `MeshDistortMaterial`, `Text3D`, camera rigs, loaders… |
| `@react-three/postprocessing` | Cinematic effects: `Bloom`, `ChromaticAberration`, `DepthOfField`, `Noise`, `Vignette` |
| `postprocessing` | Effect engine required by the above |
| `motion` | Micro-interactions & page transitions (successor of framer-motion; import from `motion/react`) |
| `gsap` + `@gsap/react` | Frame-perfect timelines, scroll-triggered sequences (`useGSAP` hook) |
| `lenis` | Buttery smooth scrolling — pairs perfectly with scroll intensity (rain intensifies as you scroll!) |

**Verified:** typecheck ✓ and production build ✓ with the whole stack bundled.
Measured impact on the single-file build: **412 kB → 482 kB (+70 kB, 140 kB gzipped)**
— tree-shaking only pulls in what you import, so keep imports surgical.

### Recommended pattern for Picksaw

```tsx
// A 3D scene that replaces/augments StormBackground
import { Canvas } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

<Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6] }}>
  <ambientLight intensity={0.2} />
  <Float speed={2} rotationIntensity={0.5}>
    {/* template preview "cards" floating in the storm */}
  </Float>
  <Environment preset="city" />
  <EffectComposer>
    <Bloom intensity={0.6} luminanceThreshold={0.2} />
  </EffectComposer>
</Canvas>
```

```tsx
// Micro-interaction on any element (magnetic CTA, pressable card)
import { motion, useMotionValue, useSpring } from "motion/react";
import Lenis from "lenis";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
```

**Performance rules (StormBackground already follows these — keep them):**
- `dpr={[1, 1.5]}` cap, fewer particles on mobile, respect `prefers-reduced-motion`
- Lazy-mount the Canvas only when in view (`useInView` hook already exists in `src/hooks/`)
- One `Lenis` instance at the app root; drive rain intensity from its scroll value

---

## 2. UI/UX Pro Max (`.agents/skills/ui-ux-pro-max/`)

The **UI/UX Pro Max skill** for AI coding assistants, installed via `ui-ux-pro-max-cli`.
It lives in `.agents/skills/` (universal format — works with Claude, Cursor, and others)
and includes a curated stack database, notably `.agents/skills/ui-ux-pro-max/data/stacks/threejs.csv`.

> Any AI agent working in this repo should read `.agents/skills/ui-ux-pro-max/SKILL.md`
> before designing UI — it encodes hard rules for refined, high-craft interfaces.

Update later with: `npx ui-ux-pro-max-cli@latest update`

---

## 3. DESIGN.md — PlayStation design language (primary)

From the **awesome-design-md** curated collection (VoltAgent). The system's DNA:
alternating dark/light full-bleed "chapters" that scroll like a console-launch trailer,
quiet chrome, imagery doing the heavy lifting, and one signature accent (`#0070d1`).

- `DESIGN.md` — active design system (playstation)
- `design-md/playstation.md` — gaming-grade premium dark ⭐ current pick
- `design-md/linear.app.md` — the reference for subtle micro-interaction craft
- `design-md/vercel.md` — minimal dark precision (geometric, high-contrast)

Swap anytime: copy any system from
`design-md/<name>.md` over `DESIGN.md` (70+ systems available:
https://github.com/VoltAgent/awesome-design-md).

---

## 4. 21st.dev — component marketplace (`@21st-dev/cli`, devDependency)

Installed as the `21st` command via `npx 21st <cmd>`. Component marketplace for
React/Tailwind — 3D cards, buttons, text effects, registries.

- **Needs login (one-time, from your machine):** `npx 21st login` → browser sign-in.
  The sandbox can't reach `api.21st.dev`, so run this locally.
- Install a component: `npx 21st add <user>/<slug>`
- Search: `npx 21st search "3d card" --json`
- Free without login: `npx 21st logo <query>` (brand SVGs)
- Editor MCP (AI-native component access): `npx @21st-dev/cli@latest init`

---

## 5. Suggested build order for the redesign

1. **Smooth scroll spine** — Lenis at root; feed its scroll progress to the existing
   storm intensity logic (replaces raw scroll listener).
2. **Hero → 3D** — replace flat hero with a fiber Canvas: floating template cards in
   the storm, `Float` + `Bloom`, mouse-parallax camera.
3. **Micro-interactions pass** — magnetic buttons, cursor-follow glow, springy cards,
   staggered reveals via `motion`; keep 150–250 ms, `cubic-bezier(0.22, 1, 0.36, 1)`.
4. **Template grid** — 3D tilt cards (`motion` springs) with `ChromaticAberration` on hover.
5. **Post-FX polish** — `EffectComposer` with Bloom + Vignette + subtle Noise for filmic grade.
6. **QA** — mobile FPS budget, `prefers-reduced-motion` fallbacks, single-file bundle size.

> ⚠️ This repo builds with `vite-plugin-singlefile` — all JS inlines into one HTML.
> The full stack only adds ~70 kB, but if 3D grows, consider lazy `import()` of the
> Canvas chunk (still inlined, but parsed on demand).
