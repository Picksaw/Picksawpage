import { useEffect, useRef } from "react";
import {
  dispatchLightning,
  dispatchStormLevel,
} from "../lib/stormEvents";
import {
  getStorm,
  setBolt,
  stormIntensity,
} from "../lib/stormStore";
import { reportFrameCost } from "../lib/perfProbe";
import { getTheme, subscribeTheme } from "../lib/themeStore";
import {
  THEMES,
  createLiveTheme,
  easeTheme,
  rgbCss,
  type ThemeParams,
  type V3,
} from "../lib/themes";

// ============================================================
// StormBackground — cinematic atmosphere canvas.
// ------------------------------------------------------------
// Themes (lib/themes.ts) retime the whole sky:
//   • storm   — the original night: rain, lightning, blue clouds
//   • sunrise / sunset × clear / cloudy — sun discs, warm haze,
//     tinted cloud cover, dry air
// Every colour / opacity is eased per frame toward the selected
// theme, so switching is a crossfade, not a cut.
//
// Depth layers (kept from V2.1):
//   FAR   — fine distant rain, thin/faint/slow, no interaction
//   MID   — medium rain, slight parallax, gentle cursor wind
//   NEAR  — foreground rain repelled by the cursor
// ============================================================

type LayerName = "far" | "mid" | "near";

interface LayerDef {
  layer: LayerName;
  share: number; // fraction of total drop budget
  opacity: [number, number];
  thickness: [number, number];
  speed: [number, number];
  len: [number, number];
}

const LAYERS: LayerDef[] = [
  // fine distant rain
  { layer: "far", share: 0.45, opacity: [0.08, 0.18], thickness: [0.4, 0.8], speed: [3.5, 6], len: [10, 20] },
  // medium rain — parallax layer
  { layer: "mid", share: 0.33, opacity: [0.14, 0.34], thickness: [0.8, 1.6], speed: [6, 10], len: [16, 34] },
  // foreground rain — hero drops
  { layer: "near", share: 0.22, opacity: [0.22, 0.5], thickness: [1.4, 2.8], speed: [10, 16], len: [26, 52] },
];

// Bucket style table, precomputed once: 3 layers × 2 buckets = 6.
const LAYER_DEFS: { layer: LayerName; style: { op: number; th: number } }[] = [];
for (const def of LAYERS) {
  for (let b = 0; b < 2; b++) {
    const L = b;
    LAYER_DEFS.push({
      layer: def.layer,
      style: {
        op: def.opacity[0] + (def.opacity[1] - def.opacity[0]) * L,
        th: def.thickness[0] + (def.thickness[1] - def.thickness[0]) * L,
      },
    });
  }
}

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  layer: LayerName;
  bucketIndex: number; // 0..5 — direct index into bucket arrays
  repelled: boolean; // participates in cursor repulsion?
}

interface Splash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
}

interface Bolt {
  segments: { x: number; y: number }[];
  branches: { x: number; y: number }[][];
  life: number;
  maxLife: number;
  intensity: number;
  glow: number;
}

interface CloudPuff {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  variant: number;
  /** cloud-cover value (0..1) at which this puff joins the sky */
  minCover: number;
}

function makeCloudSprite(size: number, tint: V3): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (cx) {
    const [r, g, b] = tint;
    const grad = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 1)`);
    grad.addColorStop(1, `rgba(${r | 0}, ${g | 0}, ${b | 0}, 0)`);
    cx.fillStyle = grad;
    cx.fillRect(0, 0, size, size);
  }
  return c;
}

/** Tinted cloud-sprite sets, lazily built per quantized theme tint
 *  (a crossfade only ever rebuilds 2–3 sets). */
class CloudSpriteCache {
  private sets = new Map<string, HTMLCanvasElement[]>();
  get(tint: V3): HTMLCanvasElement[] {
    const key = `${tint[0] >> 5}-${tint[1] >> 5}-${tint[2] >> 5}`;
    let set = this.sets.get(key);
    if (!set) {
      set = [
        makeCloudSprite(160, tint),
        makeCloudSprite(240, tint),
        makeCloudSprite(360, tint),
      ];
      this.sets.set(key, set);
      // trivial LRU cap — transitions are the only churn source
      if (this.sets.size > 18) {
        const first = this.sets.keys().next().value;
        if (first !== undefined) this.sets.delete(first);
      }
    }
    return set;
  }
}

function buildBolt(w: number, h: number, isMobile: boolean): Bolt {
  const startX = w * (0.12 + Math.random() * 0.76);
  const segments: { x: number; y: number }[] = [{ x: startX, y: -10 }];
  const branches: { x: number; y: number }[][] = [];
  let x = startX;
  let y = 0;
  const targetY = h * (0.35 + Math.random() * 0.45);
  const segs = isMobile ? 8 + Math.floor(Math.random() * 8) : 12 + Math.floor(Math.random() * 12);
  const branchChance = isMobile ? 0.22 : 0.35;

  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    y = t * targetY;
    x += (Math.random() - 0.5) * 80 * (1 + t * 0.55);
    segments.push({ x, y });

    if (Math.random() < branchChance && i > 2) {
      const branch: { x: number; y: number }[] = [{ x, y }];
      let bx = x;
      let by = y;
      const bLen = isMobile ? 2 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 5);
      const dir = Math.random() > 0.5 ? 1 : -1;
      for (let j = 0; j < bLen; j++) {
        bx += dir * (18 + Math.random() * 42);
        by += 12 + Math.random() * 38;
        branch.push({ x: bx, y: by });
      }
      branches.push(branch);
    }
  }

  return {
    segments,
    branches,
    life: 0,
    maxLife: 8 + Math.random() * 14,
    intensity: 0.6 + Math.random() * 0.35,
    glow: 0.7 + Math.random() * 0.5,
  };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (edge0: number, edge1: number, v: number) => {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
const mix3 = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export default function StormBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // eased atmosphere — crossfades toward the selected theme
    const live: ThemeParams = createLiveTheme(getTheme());

    let w = 0;
    let h = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    let splashes: Splash[] = [];
    let ripples: Splash[] = [];
    let bolts: Bolt[] = [];
    let clouds: CloudPuff[] = [];
    let flash = 0;
    let boltCss = 0; // drives --bolt (only written while > 0)
    let boltCssDirty = false;
    let animId = 0;
    let running = true;
    let elapsed = 0;
    let themeCarry = 0; // real time accrued across skipped frames
    let lastT = performance.now();

    // cursor field — repulsion + wind
    let mx = -9999;
    let my = -9999;
    let pmx = -9999;
    let cursorVX = 0;

    // lightning cadence — every 8–20s
    let nextBoltAt = 2.5 + Math.random() * 5;
    let lastStormDispatch = 0;

    // adaptive framerate + cached layout
    let frameCount = 0;
    let renderEveryN = 1;
    let emaCost = 6;
    let cachedMaxScroll = 1;

    // cached gradients
    let skyGrad: CanvasGradient | null = null;
    let lastSkyKey = "";
    let flashGrad: CanvasGradient | null = null;
    let vignetteGrad: CanvasGradient | null = null;
    const cleanupExtra: Array<() => void> = [];

    const spriteCache = new CloudSpriteCache();

    // ── sun sprite cache ───────────────────────────────────────
    // Rasterising 3 full-screen radial gradients every frame is one of
    // the heaviest 2D operations on slow renderers. The sun + its haze
    // only move/change colour during a theme crossfade (~2.5s), so we
    // bake them to offscreen sprites while transitioning and then just
    // drawImage the cached bitmaps each frame (near-zero steady cost).
    const hazeSprites = new Map<string, HTMLCanvasElement>();
    const qkey = (v: V3) => `${v[0] >> 4}-${v[1] >> 4}-${v[2] >> 4}`;
    const glowSprite = (tint: V3): HTMLCanvasElement => {
      const key = qkey(tint);
      let s = hazeSprites.get(key);
      if (!s) {
        const HS = 256;
        s = document.createElement("canvas");
        s.width = s.height = HS;
        const hx = s.getContext("2d")!;
        const g = hx.createRadialGradient(HS / 2, HS / 2, 0, HS / 2, HS / 2, HS / 2);
        g.addColorStop(0, rgbCss(tint, 0.16));
        g.addColorStop(0.5, rgbCss(tint, 0.06));
        g.addColorStop(1, rgbCss(tint, 0));
        hx.fillStyle = g;
        hx.fillRect(0, 0, HS, HS);
        hazeSprites.set(key, s);
        if (hazeSprites.size > 12)
          hazeSprites.delete(hazeSprites.keys().next().value!);
      }
      return s;
    };
    let sunSprite: HTMLCanvasElement | null = null;
    let sunSpriteKey = "";
    let sunBuildUntil = 0;

    const makeSunSprite = (p: ThemeParams): HTMLCanvasElement => {
      const sun = p.sun!;
      const S = isMobile ? 384 : 512;
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const sx = c.getContext("2d")!;
      const half = S / 2;
      const R = sun.r * Math.max(0.62, h / 860);
      const gR = Math.max(R * sun.glowR, R * 4);
      // sprite side = the bloom diameter; map the disc radius inside it
      const uR = (R / gR) * half;
      const bloom = sx.createRadialGradient(half, half, R * 0.2 * (half / gR), half, half, half);
      bloom.addColorStop(0, rgbCss(sun.edge, 0.5 * sun.glowAlpha));
      bloom.addColorStop(0.18, rgbCss(sun.glow, 0.4 * sun.glowAlpha));
      bloom.addColorStop(0.55, rgbCss(sun.glow, 0.12 * sun.glowAlpha));
      bloom.addColorStop(1, rgbCss(sun.glow, 0));
      sx.fillStyle = bloom;
      sx.fillRect(0, 0, S, S);
      if (sun.discAlpha > 0.012) {
        const disc = sx.createRadialGradient(half, half, 0, half, half, uR);
        disc.addColorStop(0, rgbCss(sun.core, sun.discAlpha));
        disc.addColorStop(0.7, rgbCss(sun.edge, sun.discAlpha * 0.95));
        disc.addColorStop(1, rgbCss(sun.edge, 0));
        sx.fillStyle = disc;
        sx.beginPath();
        sx.arc(half, half, uR, 0, Math.PI * 2);
        sx.fill();
      }
      return c;
    };

    // cloud-cover thresholds — the first few always sail, extras join
    // only under cloudy weather
    const COVER_STEPS = isMobile
      ? [0, 0, 0, 0.55, 0.8, 0.95]
      : [0, 0, 0, 0, 0.3, 0.45, 0.6, 0.8, 0.95];

    const createCloud = (i: number): CloudPuff => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.55,
      r: (isMobile ? 120 : 150) + Math.random() * (isMobile ? 220 : 300),
      speed: 2.5 + Math.random() * 8,
      opacity: 0.025 + Math.random() * 0.045,
      variant: (Math.random() * 3) | 0,
      minCover: COVER_STEPS[i % COVER_STEPS.length],
    });

    function createDrop(layerIdx: number, bucketIdx: number, fromTop: boolean): Drop {
      const def = LAYERS[layerIdx];
      const r = (a: number, b: number) => a + Math.random() * (b - a);
      return {
        x: Math.random() * w * 1.2 - w * 0.1,
        y: fromTop ? -Math.random() * h * 0.4 : Math.random() * h,
        len: r(def.len[0], def.len[1]),
        speed: r(def.speed[0], def.speed[1]),
        layer: def.layer,
        bucketIndex: layerIdx * 2 + bucketIdx,
        repelled: def.layer !== "far",
      };
    }

    const resize = () => {
      // Mobile: 1.5× (was a flat 1.0, which smeared the bolts on dpr 2–3
      // phones). The adaptive renderEveryN guard below still throttles
      // the framerate on weak devices — sharpness no longer pays for it.
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const divisor = isMobile ? 5600 : 2800;
      const cap = isMobile ? 170 : 340;
      const targetCount = Math.min(Math.floor((w * h) / divisor), cap);

      drops = [];
      LAYERS.forEach((layer, layerIdx) => {
        const count = Math.round(targetCount * layer.share);
        for (let i = 0; i < count; i++) {
          drops.push(createDrop(layerIdx, Math.random() < 0.5 ? 0 : 1, false));
        }
      });

      const count = isMobile ? 6 : 9;
      if (clouds.length === 0) {
        for (let i = 0; i < count; i++) clouds.push(createCloud(i));
      }

      cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;

      lastSkyKey = "";
      skyGrad = null;
      flashGrad = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.25, h * 1.1);
      flashGrad.addColorStop(0, "rgba(200, 224, 255, 0.34)");
      flashGrad.addColorStop(0.5, "rgba(120, 160, 230, 0.1)");
      flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.95);
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0.55)");
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pmx > -9998) cursorVX = cursorVX * 0.7 + (e.clientX - pmx) * 0.3;
      pmx = e.clientX;
      mx = e.clientX;
      my = e.clientY;
    };
    const onPointerLeave = () => {
      mx = -9999;
      my = -9999;
      cursorVX = 0;
    };

    // click-splash ripples — spawned by the global ClickFX layer
    const onSplash = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      if (ripples.length < 8) {
        ripples.push({ x, y, life: 0, maxLife: 26, radius: 4 });
      }
    };

    /** Draw the sun disc, its glow and the warm atmospheric haze.
     *  Steady-state is two cached drawImage blits; the baked sprites are
     *  only rebuilt during the ~2.8 s theme crossfade. */
    const drawSun = (p: ThemeParams) => {
      const sun = p.sun;
      if (!sun || sun.glowAlpha < 0.012) {
        sunSprite = null; // force a rebuild once the sun fades back in
        return;
      }
      const px = sun.x * w;
      const py = sun.y * h;
      const R = sun.r * Math.max(0.62, h / 860);
      const gR = Math.max(R * sun.glowR, R * 4);

      // wide atmospheric haze halo (cached soft radial tinted with glow)
      if (p.haze > 0.01) {
        const hD = Math.max(w, h) * 1.5;
        ctx.save();
        ctx.globalAlpha = p.haze * sun.glowAlpha;
        ctx.drawImage(glowSprite(sun.glow), px - hD / 2, py - hD / 2, hD, hD);
        ctx.restore();
      }

      // tight bloom + disc (rebuilt while the crossfade is in flight)
      const now = performance.now();
      const key = [
        sun.x.toFixed(3), sun.y.toFixed(3), R.toFixed(1), sun.glowR.toFixed(2),
        sun.discAlpha.toFixed(2), sun.glowAlpha.toFixed(2),
        qkey(sun.core), qkey(sun.edge), qkey(sun.glow),
      ].join("|");
      if (!sunSprite || key !== sunSpriteKey || now < sunBuildUntil) {
        sunSprite = makeSunSprite(p);
        sunSpriteKey = key;
      }
      const gD = gR * 2;
      ctx.drawImage(sunSprite, px - gD / 2, py - gD / 2, gD, gD);
    };

    const getSkyGradient = (s: number, p: ThemeParams): CanvasGradient => {
      const top = mix3(p.skyTop, p.skyTopActive, s);
      const mid = mix3(p.skyMid, p.skyMidActive, s);
      const bottom = p.skyBottom;
      const key = `${Math.round(s * 20)}-${top.map((v) => v | 0).join(",")}-${mid
        .map((v) => v | 0)
        .join(",")}-${bottom.map((v) => v | 0).join(",")}`;
      if (!skyGrad || key !== lastSkyKey) {
        lastSkyKey = key;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, rgbCss(top));
        g.addColorStop(0.4, rgbCss(mid));
        g.addColorStop(1, rgbCss(bottom));
        skyGrad = g;
      }
      return skyGrad;
    };

    const drawBolt = (bolt: Bolt) => {
      const t = bolt.life / bolt.maxLife;
      const alpha =
        t < 0.08
          ? (t / 0.08) * 0.8
          : t < 0.25
            ? 0.7 + Math.random() * 0.3
            : t < 0.4
              ? 0.3 + Math.random() * 0.5
              : Math.max(0, (1 - (t - 0.4) / 0.6) * 0.6);

      const a = alpha * bolt.intensity;
      if (a <= 0.008) return;

      const drawPath = (pts: { x: number; y: number }[], width: number, color: string) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      drawPath(bolt.segments, 11 * bolt.glow, `rgba(120, 200, 255, ${a * 0.1})`);
      for (const b of bolt.branches) drawPath(b, 5 * bolt.glow, `rgba(120, 200, 255, ${a * 0.07})`);
      drawPath(bolt.segments, 3.2, `rgba(190, 235, 255, ${a * 0.55})`);
      for (const b of bolt.branches) drawPath(b, 1.6, `rgba(190, 235, 255, ${a * 0.35})`);
      drawPath(bolt.segments, 1.4, `rgba(255, 255, 255, ${a * 0.95})`);
      for (const b of bolt.branches) drawPath(b, 0.8, `rgba(255, 255, 255, ${a * 0.7})`);
    };

    const strike = (intense: boolean) => {
      const count = intense
        ? 2 + Math.floor(Math.random() * 2)
        : isMobile
          ? 1
          : 1 + (Math.random() < 0.3 ? 1 : 0);
      let peak = 0;
      for (let i = 0; i < count; i++) {
        window.setTimeout(() => {
          if (!running) return;
          const bolt = buildBolt(w, h, isMobile);
          bolts.push(bolt);
          const f = (0.35 + Math.random() * 0.4) * (intense ? 1.35 : 1);
          flash = Math.max(flash, Math.min(1, f));
          peak = Math.max(peak, bolt.intensity * (intense ? 1.15 : 1));
          if (i === 0) {
            dispatchLightning(peak * (intense ? 1.2 : 1));
            boltCss = Math.min(1, 0.85 * (intense ? 1.2 : 1));
            boltCssDirty = true;
          }
        }, i * (60 + Math.random() * 140));
      }
    };

    /** One full painted frame (also used by the reduced-motion path).
     *  themeDt is uncapped-by-sim real elapsed seconds (clamped to 0.5s)
     *  so the atmosphere crossfade finishes even on very low-fps devices. */
    const paintFrame = (dtN: number, themeDt: number) => {
      // ── atmosphere crossfade ─────────────────────────────────
      easeTheme(live, THEMES[getTheme()], themeDt, 2.2);

      // ── storm level (scroll + overrides), storm themes only ──
      if (frameCount % 120 === 0) {
        cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      }
      const scrollTarget = cachedMaxScroll > 0 ? Math.min(window.scrollY / cachedMaxScroll, 1) : 0;
      const storm = getStorm();
      storm.level = storm.level + (scrollTarget - storm.level) * Math.min(1, dtN * 0.03);
      // rain factor silences the whole storm channel in daylight themes
      const s = stormIntensity() * live.rain;

      if (elapsed - lastStormDispatch > 0.25) {
        lastStormDispatch = elapsed;
        dispatchStormLevel(s);
      }

      // ── lightning cadence — storm weather only ───────────────
      if (live.lightning > 0.5) {
        if (elapsed >= nextBoltAt) {
          const intense = Math.random() < 0.07;
          strike(intense);
          nextBoltAt = elapsed + 8 + Math.random() * 12;
        }
      } else {
        // stay armed for the moment a storm theme returns
        nextBoltAt = Math.max(nextBoltAt, elapsed + 3);
      }

      // ── sky ──────────────────────────────────────────────────
      ctx.fillStyle = getSkyGradient(s, live);
      ctx.fillRect(0, 0, w, h);

      // ── sun + warm haze (behind the clouds) ──────────────────
      drawSun(live);

      // ── clouds ───────────────────────────────────────────────
      const sprites = spriteCache.get(live.cloudTint);
      const windDrift = 0.06 + live.cloudSpeed * 0.12 + s * 0.45;
      for (const c of clouds) {
        c.x += c.speed * windDrift * dtN;
        if (c.x - c.r > w) c.x = -c.r;
        const coverFade = smooth(c.minCover - 0.12, c.minCover, live.cloudCover);
        const a =
          Math.min(1, c.opacity + 0.02 + s * 0.05 + flash * 0.08) *
          live.cloudAlpha *
          coverFade;
        if (a > 0.002) {
          ctx.globalAlpha = Math.min(1, a);
          ctx.drawImage(sprites[c.variant], c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
        }
      }
      ctx.globalAlpha = 1;

      // ── flash overlay ────────────────────────────────────────
      if (flash > 0) {
        ctx.globalAlpha = Math.min(1, flash);
        ctx.fillStyle = flashGrad!;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        flash *= Math.pow(0.88, dtN);
        if (flash < 0.005) flash = 0;
      }

      // ── bolts ────────────────────────────────────────────────
      bolts = bolts.filter((b) => {
        b.life += dtN;
        drawBolt(b);
        return b.life < b.maxLife;
      });

      // ── rain — three layers, 6 numeric buckets ───────────────
      if (live.rain > 0.01) {
        const speedMul = (0.55 + s * 1.3) * Math.max(0.25, live.rain);
        const windBase = Math.sin(elapsed * 0.108) * (1.2 + s * 2.5);
        const cursorWind = isMobile ? 0 : Math.max(-3, Math.min(3, cursorVX * 0.06));
        cursorVX *= Math.pow(0.94, dtN);

        const REPULSION_R = isMobile ? 0 : 110;
        const R2 = REPULSION_R * REPULSION_R;
        const R_MID = REPULSION_R * 0.55;
        const R_MID2 = R_MID * R_MID;

        const b0: { x: number; y: number; x2: number; y2: number }[] = [];
        const b1: { x: number; y: number; x2: number; y2: number }[] = [];
        const b2: { x: number; y: number; x2: number; y2: number }[] = [];
        const b3: { x: number; y: number; x2: number; y2: number }[] = [];
        const b4: { x: number; y: number; x2: number; y2: number }[] = [];
        const b5: { x: number; y: number; x2: number; y2: number }[] = [];
        const bucketPaths = [b0, b1, b2, b3, b4, b5];

        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          const isNear = d.layer === "near";
          const isMid = d.layer === "mid";

          d.y += d.speed * speedMul * dtN;

          let wind = windBase;
          if (isNear) wind += cursorWind * 1.6;
          if (isMid) wind += cursorWind * 0.6 + Math.sin(elapsed * 0.31 + i) * 0.15;

          if (d.repelled && mx > -100) {
            const dx = d.x - mx;
            const dy = d.y - my;
            const dist2 = dx * dx + dy * dy;
            if (isNear ? dist2 < R2 : dist2 < R_MID2) {
              const dist = Math.sqrt(dist2) || 1;
              const force = (1 - dist / (isNear ? REPULSION_R : R_MID)) * (isNear ? 2.6 : 1.1);
              d.x += (dx / dist) * force * dtN * 3.2;
              wind += (dx / dist) * force * 0.9;
            }
          }

          d.x += wind * (0.3 + d.speed * 0.045) * dtN;

          if (d.y > h + 16 || d.x < -40 || d.x > w + 40) {
            const nd = createDrop((d.bucketIndex / 2) | 0, d.bucketIndex % 2, true);
            d.x = nd.x;
            d.y = nd.y;
            d.len = nd.len;
            d.speed = nd.speed;
            if (
              live.rain > 0.5 &&
              isNear &&
              Math.random() < 0.1 &&
              splashes.length < (isMobile ? 14 : 30)
            ) {
              splashes.push({
                x: d.x + (Math.random() - 0.5) * 16,
                y: h - 1 - Math.random() * 8,
                life: 0,
                maxLife: 7 + Math.random() * 9,
                radius: 2 + Math.random() * 4,
              });
            }
            continue;
          }

          bucketPaths[d.bucketIndex].push({
            x: d.x,
            y: d.y,
            x2: d.x + wind * 1.3,
            y2: d.y + d.len * 0.75,
          });
        }

        ctx.lineCap = "round";
        const [rr, gg, bb] = live.rainColor;
        for (let b = 0; b < 6; b++) {
          const pts = bucketPaths[b];
          if (pts.length === 0) continue;
          const def = LAYER_DEFS[b];
          const boost =
            def.layer === "near" ? 1 + flash * 1.8 : def.layer === "mid" ? 1 + flash * 0.7 : 1;
          ctx.beginPath();
          for (let i = 0; i < pts.length; i++) {
            const p = pts[i];
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x2, p.y2);
          }
          ctx.strokeStyle = `rgba(${rr | 0}, ${gg | 0}, ${bb | 0}, ${Math.min(
            0.9,
            def.style.op * boost * live.rain,
          )})`;
          ctx.lineWidth = def.style.th;
          ctx.stroke();
        }
      }

      // ── ground splashes ──────────────────────────────────────
      if (live.rain > 0.02) {
        splashes = splashes.filter((sp) => {
          sp.life += dtN;
          const t = sp.life / sp.maxLife;
          if (t >= 1) return false;
          ctx.beginPath();
          ctx.ellipse(sp.x, sp.y, sp.radius * (1 + t * 2.4), sp.radius * 0.35 * (1 + t * 2.4), 0, 0, Math.PI * 2);
          ctx.strokeStyle = rgbCss(live.rainColor, (1 - t) * 0.24 * live.rain);
          ctx.lineWidth = 1;
          ctx.stroke();
          return true;
        });
      }

      // ── click ripples — tinted with the atmosphere accent ────
      ripples = ripples.filter((rp) => {
        rp.life += dtN;
        const t = rp.life / rp.maxLife;
        if (t >= 1) return false;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius + t * 46, 0, Math.PI * 2);
        ctx.strokeStyle = rgbCss(live.accent, (1 - t) * 0.35);
        ctx.lineWidth = 1.6 - t;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, (rp.radius + t * 46) * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = rgbCss(live.accentSoft, (1 - t) * 0.22);
        ctx.lineWidth = 1;
        ctx.stroke();
        return true;
      });

      // ── vignette (theme strength; baked at 0.55) ─────────────
      if (live.vignette > 0.005) {
        ctx.globalAlpha = Math.min(1, live.vignette / 0.55);
        ctx.fillStyle = vignetteGrad!;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // ── --bolt CSS var — ONLY while a strike is decaying ────
      if (boltCssDirty) {
        boltCss *= Math.pow(0.9, dtN);
        if (boltCss <= 0.004) {
          boltCss = 0;
          boltCssDirty = false;
        }
        setBolt(boltCss);
        document.documentElement.style.setProperty("--bolt", boltCss.toFixed(3));
      }
    };

    const frame = () => {
      if (!running) return;
      animId = requestAnimationFrame(frame);

      const now = performance.now();
      let dt = now - lastT;
      lastT = now;
      if (dt < 0) dt = 0;
      // real elapsed seconds for the theme crossfade (independent of the
      // simulation's 64ms clamp — slow frames must not freeze the fade)
      themeCarry += Math.min(dt, 500) / 1000;
      if (dt > 64) dt = 64;
      const dtN = dt / 16.667;
      elapsed += dt / 1000;
      frameCount++;

      if (frameCount % renderEveryN !== 0) return;
      const t0 = performance.now();

      paintFrame(dtN, themeCarry);
      themeCarry = 0;

      // ── adaptive framerate ───────────────────────────────────
      const cost = performance.now() - t0;
      reportFrameCost("storm", cost);
      emaCost = emaCost * 0.9 + cost * 0.1;
      if (frameCount % 90 === 0) {
        if (emaCost > 11 && renderEveryN < 3) renderEveryN++;
        else if (emaCost < 7 && renderEveryN > 1) renderEveryN--;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animId);
      } else if (!reducedMotion) {
        running = true;
        lastT = performance.now();
        animId = requestAnimationFrame(frame);
      }
    };

    /** Static painted sky for reduced-motion visitors. */
    const paintStatic = () => {
      easeTheme(live, THEMES[getTheme()], 10, 2.2); // snap straight to the theme
      ctx.fillStyle = getSkyGradient(0.25 * live.rain, live);
      ctx.fillRect(0, 0, w, h);
      drawSun(live);
      const sprites = spriteCache.get(live.cloudTint);
      for (const c of clouds) {
        const coverFade = smooth(c.minCover - 0.12, c.minCover, live.cloudCover);
        ctx.globalAlpha = (c.opacity + 0.04) * live.cloudAlpha * coverFade;
        ctx.drawImage(sprites[c.variant], c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      ctx.globalAlpha = 1;
      if (live.vignette > 0.005) {
        ctx.globalAlpha = Math.min(1, live.vignette / 0.55);
        ctx.fillStyle = vignetteGrad!;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    };

    const onResize = () => {
      resize();
      if (reducedMotion) paintStatic();
    };

    resize();

    // keep the baked sun sprites refreshing through a theme crossfade
    const markSunDirty = () => {
      sunBuildUntil = performance.now() + 2800;
      sunSprite = null;
    };
    cleanupExtra.push(subscribeTheme(markSunDirty));

    if (reducedMotion) {
      // One frame, no loop — repainted whenever the atmosphere changes.
      paintStatic();
      cleanupExtra.push(subscribeTheme(paintStatic));
    } else {
      animId = requestAnimationFrame(frame);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("picksaw:splash", onSplash as EventListener);
    }

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("picksaw:splash", onSplash as EventListener);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cleanupExtra.forEach((fn) => fn());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
