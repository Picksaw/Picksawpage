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

// ============================================================
// StormBackground V2.1 — three-depth-layer cinematic storm
// ------------------------------------------------------------
// Depth layers:
//   FAR   — fine distant rain, thin/faint/slow, no interaction
//   MID   — medium rain, slight parallax, gentle cursor wind
//   NEAR  — foreground rain: thick/bright/fast drops that are
//           repelled by the cursor and catch lightning reflections
//
// Lightning: strikes every 8–20s; each spikes a `--bolt` CSS var
// that illuminates the whole UI. The var is only written while a
// strike is actually decaying (writing it every frame forces a
// full-page style recalc — the #1 scroll-fps killer in V2.0).
//
// Perf budget (learned via dev-mode FPS meter):
//   • --bolt CSS var writes gated to lightning windows only
//   • scrollHeight cached (refreshed every ~2s, not per frame)
//   • rain buckets are precomputed numeric arrays (no string keys)
//   • zero per-frame allocations beyond 6 small path arrays
//   • cards no longer use backdrop-filter (see index.css .glass)
//   • adaptive framerate, cached gradients, mobile profile,
//     reduced-motion static sky — all kept from V1
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
  sprite: HTMLCanvasElement;
}

function makeCloudSprite(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (cx) {
    const g = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(70, 88, 140, 1)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    cx.fillStyle = g;
    cx.fillRect(0, 0, size, size);
  }
  return c;
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

export default function StormBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    // Perf: mobile starts at a FULL 60 fps budget with a leaner particle
    // set; the governor below only drops to 30/20 fps if the frame cost
    // proves it (previously mobile was pinned to 30 fps from the start).
    let frameCount = 0;
    let renderEveryN = 1;
    let emaCost = 6;
    let cachedMaxScroll = 1;
    let isScrolling = false;
    let scrollIdleTimer = 0;

    // cached gradients
    let skyGrad: CanvasGradient | null = null;
    let lastSkyBucket = -1;
    let flashGrad: CanvasGradient | null = null;
    let vignetteGrad: CanvasGradient | null = null;

    const cloudSprites = [makeCloudSprite(160), makeCloudSprite(240), makeCloudSprite(360)];

    const createCloud = (): CloudPuff => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.55,
      r: (isMobile ? 120 : 150) + Math.random() * (isMobile ? 220 : 300),
      speed: 2.5 + Math.random() * 8,
      opacity: 0.025 + Math.random() * 0.045,
      sprite: cloudSprites[(Math.random() * cloudSprites.length) | 0],
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
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2) * (isMobile ? 0.75 : 1);
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

      if (clouds.length === 0) {
        const count = isMobile ? 4 : 7;
        for (let i = 0; i < count; i++) clouds.push(createCloud());
      }

      cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;

      lastSkyBucket = -1;
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

    const onScroll = () => {
      if (!isMobile) return;
      isScrolling = true;
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => {
        isScrolling = false;
      }, 160);
    };

    // click-splash ripples — spawned by the global ClickFX layer
    const onSplash = (e: Event) => {
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      if (ripples.length < 8) {
        ripples.push({ x, y, life: 0, maxLife: 26, radius: 4 });
      }
    };

    const getSkyGradient = (s: number): CanvasGradient => {
      const bucket = Math.round(s * 20);
      if (!skyGrad || bucket !== lastSkyBucket) {
        lastSkyBucket = bucket;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, `rgb(${5 + s * 6},${7 + s * 5},${18 + s * 9})`);
        g.addColorStop(0.4, `rgb(${9 - s * 3},${11 - s * 3},${26 + s * 7})`);
        g.addColorStop(1, "rgb(3,4,12)");
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

    const frame = () => {
      if (!running) return;
      animId = requestAnimationFrame(frame);

      const now = performance.now();
      let dt = now - lastT;
      lastT = now;
      if (dt > 64) dt = 64;
      if (dt < 0) dt = 0;
      const dtN = dt / 16.667;
      elapsed += dt / 1000;
      frameCount++;

      const stride = isMobile && isScrolling ? Math.max(renderEveryN, 3) : renderEveryN;
      if (frameCount % stride !== 0) return;
      const t0 = performance.now();

      // ── storm level (scroll + overrides) ────────────────────
      // scrollHeight forces layout — refresh the cache rarely.
      if (frameCount % 120 === 0) {
        cachedMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      }
      const scrollTarget = cachedMaxScroll > 0 ? Math.min(window.scrollY / cachedMaxScroll, 1) : 0;
      const storm = getStorm();
      storm.level = storm.level + (scrollTarget - storm.level) * Math.min(1, dtN * 0.03);
      const s = stormIntensity();

      if (elapsed - lastStormDispatch > 0.25) {
        lastStormDispatch = elapsed;
        dispatchStormLevel(s);
      }

      // ── lightning cadence: every 8–20s ──────────────────────
      if (elapsed >= nextBoltAt) {
        const intense = Math.random() < 0.07; // rare intense event
        strike(intense);
        nextBoltAt = elapsed + 8 + Math.random() * 12;
      }

      // ── sky ──────────────────────────────────────────────────
      ctx.fillStyle = getSkyGradient(s);
      ctx.fillRect(0, 0, w, h);

      for (const c of clouds) {
        c.x += c.speed * (0.14 + s * 0.4) * dtN;
        if (c.x - c.r > w) c.x = -c.r;
        ctx.globalAlpha = Math.min(1, c.opacity + 0.02 + s * 0.05 + flash * 0.08);
        ctx.drawImage(c.sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
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
      const speedMul = 0.55 + s * 1.3;
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
          if (isNear && Math.random() < 0.1 && splashes.length < (isMobile ? 14 : 30)) {
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
        ctx.strokeStyle = `rgba(150, 190, 235, ${Math.min(0.9, def.style.op * boost)})`;
        ctx.lineWidth = def.style.th;
        ctx.stroke();
      }

      // ── ground splashes ──────────────────────────────────────
      splashes = splashes.filter((sp) => {
        sp.life += dtN;
        const t = sp.life / sp.maxLife;
        if (t >= 1) return false;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, sp.radius * (1 + t * 2.4), sp.radius * 0.35 * (1 + t * 2.4), 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(140, 190, 240, ${(1 - t) * 0.24})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return true;
      });

      // ── click ripples (hidden detail) ────────────────────────
      ripples = ripples.filter((rp) => {
        rp.life += dtN;
        const t = rp.life / rp.maxLife;
        if (t >= 1) return false;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.radius + t * 46, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(120, 210, 255, ${(1 - t) * 0.35})`;
        ctx.lineWidth = 1.6 - t;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, (rp.radius + t * 46) * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(200, 240, 255, ${(1 - t) * 0.22})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return true;
      });

      // ── vignette ─────────────────────────────────────────────
      ctx.fillStyle = vignetteGrad!;
      ctx.fillRect(0, 0, w, h);

      // ── --bolt CSS var — ONLY while a strike is decaying ────
      // (a per-frame write forces a full-page style recalc)
      if (boltCssDirty) {
        boltCss *= Math.pow(0.9, dtN);
        if (boltCss <= 0.004) {
          boltCss = 0;
          boltCssDirty = false;
        }
        setBolt(boltCss);
        document.documentElement.style.setProperty("--bolt", boltCss.toFixed(3));
      }

      // ── adaptive framerate ───────────────────────────────────
      const cost = performance.now() - t0;
      reportFrameCost("storm", cost);
      emaCost = emaCost * 0.9 + cost * 0.1;
      if (frameCount % 90 === 0) {
        // Two-way governor: drop to 30/20 fps on frames that cost >11ms,
        // climb back to 60 fps when we have headroom (<7 ms).
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

    resize();

    if (reducedMotion) {
      // Static painted sky — one frame, no loop, still beautiful
      ctx.fillStyle = getSkyGradient(0.25);
      ctx.fillRect(0, 0, w, h);
      for (const c of clouds) {
        ctx.globalAlpha = c.opacity + 0.04;
        ctx.drawImage(c.sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = vignetteGrad!;
      ctx.fillRect(0, 0, w, h);
    } else {
      animId = requestAnimationFrame(frame);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("picksaw:splash", onSplash as EventListener);
    }
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.clearTimeout(scrollIdleTimer);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("picksaw:splash", onSplash as EventListener);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
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
