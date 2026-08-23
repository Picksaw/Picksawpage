import { useEffect, useRef } from "react";

// ============================================================
// StormBackground — performance-optimized storm canvas
// ------------------------------------------------------------
// Mobile FPS fixes in this version:
//  1. NO ctx.shadowBlur — it's extremely slow on phone GPUs.
//     Bolt glow is now faked with layered stroke widths.
//  2. Rain strokes are BATCHED into 5 depth buckets — instead of
//     one beginPath/stroke per drop (~440), we do 5 strokes/frame.
//  3. Gradients are CACHED and reused, not rebuilt every frame
//     (sky rebuilt only when storm changes, flash/vignette on
//     resize, haze only when the mouse moves, clouds are
//     pre-rendered sprites drawn with drawImage).
//  4. Lower render resolution + capped DPR on phones, fewer
//     drops/clouds/bolt segments on mobile.
//  5. Adaptive framerate: if a frame still takes >22ms to draw,
//     the loop drops to ~30fps (movement is time-based, so the
//     storm keeps the same speed).
//  6. prefers-reduced-motion = static sky, no animation loop.
// ============================================================

// How many depth buckets to split rain into for batched strokes.
const RAIN_BUCKETS = 5;

// Per-bucket style (computed once). Far drops = thin/faint/slow,
// near drops = thick/bright/fast.
const bucketStyles: { opacity: number; thickness: number }[] = Array.from(
  { length: RAIN_BUCKETS },
  (_, b) => {
    const L = (b + 0.5) / RAIN_BUCKETS;
    return {
      opacity: 0.1 + L * 0.45,
      thickness: 0.4 + L * 1.7,
    };
  }
);

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  bucket: number;
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

// Pre-render a single cloud puff to a sprite once.
// Drawing sprites with drawImage is far cheaper than building a
// radial gradient + full-canvas fill for every cloud every frame.
function makeCloudSprite(size: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const cx = c.getContext("2d");
  if (cx) {
    const g = cx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(70, 85, 130, 1)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    cx.fillStyle = g;
    cx.fillRect(0, 0, size, size);
  }
  return c;
}

function createDrop(w: number, h: number, fromTop: boolean, bucket: number): Drop {
  const L = (bucket + 0.5) / RAIN_BUCKETS;
  return {
    x: Math.random() * w * 1.2 - w * 0.1,
    y: fromTop ? -Math.random() * h * 0.4 : Math.random() * h,
    len: (16 + L * 34) * (0.75 + Math.random() * 0.5),
    speed: (5 + L * 13) * (0.85 + Math.random() * 0.3),
    bucket,
  };
}

function buildBolt(w: number, h: number, isMobile: boolean): Bolt {
  const startX = w * (0.12 + Math.random() * 0.76);
  const segments: { x: number; y: number }[] = [{ x: startX, y: -10 }];
  const branches: { x: number; y: number }[][] = [];
  let x = startX;
  let y = 0;
  const targetY = h * (0.35 + Math.random() * 0.45);
  const segs = isMobile
    ? 8 + Math.floor(Math.random() * 8)
    : 12 + Math.floor(Math.random() * 12);
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
      const bLen = isMobile
        ? 2 + Math.floor(Math.random() * 4)
        : 3 + Math.floor(Math.random() * 5);
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

    // Phone / touch-primary device → run the leaner profile.
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let drops: Drop[] = [];
    let splashes: Splash[] = [];
    let bolts: Bolt[] = [];
    let clouds: CloudPuff[] = [];
    let flash = 0;
    let stormTimer = 0;
    let nextStorm = 120 + Math.random() * 180;
    let animId = 0;
    let running = true;
    let elapsed = 0; // seconds since start — drives all time-based waves
    let lastT = performance.now();
    let mouseX = 0.5;
    let scrollTarget = 0;
    let storm = 0;

    // Adaptive framerate: measure real draw cost; if it's too slow,
    // render every 2nd rAF (~30fps) — movement is dt-based so the
    // storm keeps the exact same speed either way.
    let frameCount = 0;
    let renderEveryN = isMobile ? 2 : 1;
    let emaCost = 10;

    // Cached gradients — created once, reused every frame.
    let skyGrad: CanvasGradient | null = null;
    let lastSkyBucket = -1;
    let flashGrad: CanvasGradient | null = null;
    let vignetteGrad: CanvasGradient | null = null;
    let hazeGrad: CanvasGradient | null = null;
    let lastHazeX = -1;

    const cloudSprites = [makeCloudSprite(160), makeCloudSprite(240), makeCloudSprite(360)];

    function createCloud(w: number, h: number): CloudPuff {
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.55,
        r: (isMobile ? 120 : 150) + Math.random() * (isMobile ? 220 : 300),
        speed: 2.5 + Math.random() * 8,
        opacity: 0.025 + Math.random() * 0.045,
        sprite: cloudSprites[(Math.random() * cloudSprites.length) | 0],
      };
    }

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
    };

    const resize = () => {
      // Phones: cap DPR lower AND render at 75% resolution (the
      // soft background hides the tiny upscale) → far fewer pixels.
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2) * (isMobile ? 0.75 : 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const divisor = isMobile ? 3600 : 2600;
      const cap = isMobile ? 240 : 440;
      const targetCount = Math.min(Math.floor((w * h) / divisor), cap);
      while (drops.length < targetCount) {
        drops.push(createDrop(w, h, false, Math.floor(Math.random() * RAIN_BUCKETS)));
      }
      if (drops.length > targetCount) drops = drops.slice(0, targetCount);

      if (clouds.length === 0) {
        const count = isMobile ? 5 : 7;
        for (let i = 0; i < count; i++) clouds.push(createCloud(w, h));
      }

      // Rebuild the cached gradients (they depend on canvas size).
      lastSkyBucket = -1;
      skyGrad = null;
      flashGrad = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.25, h * 1.1);
      flashGrad.addColorStop(0, "rgba(200, 218, 255, 0.32)");
      flashGrad.addColorStop(0.5, "rgba(120, 150, 220, 0.1)");
      flashGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      vignetteGrad = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      vignetteGrad.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGrad.addColorStop(1, "rgba(0,0,0,0.5)");
      updateScroll();
    };

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX / w;
    };

    // Sky gradient only changes when `storm` changes noticeably →
    // rebuild on 0.05 buckets instead of every frame.
    const getSkyGradient = (s: number): CanvasGradient => {
      const bucket = Math.round(s * 20);
      if (!skyGrad || bucket !== lastSkyBucket) {
        lastSkyBucket = bucket;
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, `rgb(${5 + s * 6},${7 + s * 4},${18 + s * 8})`);
        g.addColorStop(0.4, `rgb(${9 - s * 3},${11 - s * 3},${26 + s * 6})`);
        g.addColorStop(1, "rgb(3,4,12)");
        skyGrad = g;
      }
      return skyGrad;
    };

    const drawBolt = (bolt: Bolt) => {
      const t = bolt.life / bolt.maxLife;
      // Subtle flickering: quick flash in, hold, flicker, fade
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

      // Fake glow via layered strokes (NO shadowBlur — huge GPU win):
      // wide soft halo → mid → thin bright core.
      drawPath(bolt.segments, 11 * bolt.glow, `rgba(160, 195, 255, ${a * 0.09})`);
      for (const b of bolt.branches) drawPath(b, 5 * bolt.glow, `rgba(160, 195, 255, ${a * 0.06})`);

      drawPath(bolt.segments, 3.2, `rgba(210, 230, 255, ${a * 0.5})`);
      for (const b of bolt.branches) drawPath(b, 1.6, `rgba(210, 230, 255, ${a * 0.35})`);

      drawPath(bolt.segments, 1.4, `rgba(255, 255, 255, ${a * 0.92})`);
      for (const b of bolt.branches) drawPath(b, 0.8, `rgba(255, 255, 255, ${a * 0.7})`);
    };

    const frame = () => {
      if (!running) return;
      animId = requestAnimationFrame(frame);

      const now = performance.now();
      let dt = now - lastT;
      lastT = now;
      if (dt > 64) dt = 64; // clamp after tab switches
      if (dt < 0) dt = 0;
      const dtN = dt / 16.667; // normalized: 1 ≈ one 60fps frame
      elapsed += dt / 1000;
      frameCount++;

      // Adaptive framerate: skip physics+draw on alternating rAFs
      // when rendering is slow. dt-based movement keeps speeds identical.
      if (frameCount % renderEveryN !== 0) return;

      const t0 = performance.now();

      // Smoothly ease storm toward scroll target
      storm += (scrollTarget - storm) * Math.min(1, dtN * 0.03);

      // No lightning until you've scrolled a bit; ramps with storm
      const stormActive = storm > 0.12;
      const stormChance = stormActive
        ? (0.001 + (Math.sin(elapsed * 0.18) * 0.5 + 0.5) * 0.006) * storm
        : 0;

      // ── Sky ──────────────────────────────────────────────
      ctx.fillStyle = getSkyGradient(storm);
      ctx.fillRect(0, 0, w, h);

      // Clouds drift faster and grow denser during storms
      for (const c of clouds) {
        c.x += c.speed * (0.14 + storm * 0.4) * dtN;
        if (c.x - c.r > w) c.x = -c.r;
        ctx.globalAlpha = Math.min(1, c.opacity + 0.02 + storm * 0.05);
        ctx.drawImage(c.sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      ctx.globalAlpha = 1;

      // Haze follows the cursor — desktop only, gradient rebuilt only
      // when the mouse actually moves (it's cached per position).
      if (!isMobile) {
        if (!hazeGrad || Math.abs(mouseX - lastHazeX) > 0.01) {
          lastHazeX = mouseX;
          hazeGrad = ctx.createRadialGradient(
            w * mouseX,
            h * 0.15,
            0,
            w * 0.5,
            h * 0.2,
            w * 0.8
          );
          hazeGrad.addColorStop(0, "rgba(55, 75, 125, 0.06)");
          hazeGrad.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = hazeGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Lightning flash overlay (cached gradient × globalAlpha) ──
      if (flash > 0) {
        ctx.globalAlpha = Math.min(1, flash);
        ctx.fillStyle = flashGrad!;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        flash *= Math.pow(0.9, dtN);
        if (flash < 0.005) flash = 0;
      }

      // Ambient sky pulse — desktop only
      if (!isMobile) {
        const skyPulse = Math.sin(elapsed * 0.48) * 0.008 + 0.008;
        ctx.fillStyle = `rgba(100, 130, 180, ${skyPulse})`;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Storm cadence / bolt spawning ────────────────────
      stormTimer++;
      if (stormActive && (stormTimer > nextStorm || Math.random() < stormChance)) {
        const count = isMobile
          ? 1 + Math.floor(Math.random() * Math.round(storm * 2))
          : 1 + Math.floor(Math.random() * (1 + Math.round(storm * 2)));
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (!running) return;
            bolts.push(buildBolt(w, h, isMobile));
            flash = Math.max(flash, (0.3 + Math.random() * 0.4) * storm);
          }, i * (40 + Math.random() * 100));
        }
        stormTimer = 0;
        // Storms grow more frequent as storm intensifies
        nextStorm = 260 - storm * 160 + Math.random() * 160;
      }

      // ── Bolts ────────────────────────────────────────────
      bolts = bolts.filter((b) => {
        b.life += dtN; // time-based so 30fps bolts flicker identically
        drawBolt(b);
        return b.life < b.maxLife;
      });

      // ── Rain (batched: 5 strokes total instead of ~440) ──
      const speedMul = 0.55 + storm * 1.25;
      const windBase = Math.sin(elapsed * 0.108) * (1.2 + storm * 2.5);
      const wind = windBase + (mouseX - 0.5) * 2.5;

      const bucketPaths: { x: number; y: number; x2: number; y2: number }[][] = Array.from(
        { length: RAIN_BUCKETS },
        () => []
      );

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed * speedMul * dtN;
        d.x += wind * (0.3 + d.speed * 0.045) * dtN;

        if (d.y > h + 14 || d.x < -30 || d.x > w + 30) {
          const nd = createDrop(w, h, true, d.bucket);
          d.x = nd.x;
          d.y = nd.y;
          d.len = nd.len;
          d.speed = nd.speed;
          const depth = (d.bucket + 0.5) / RAIN_BUCKETS;
          if (
            Math.random() < 0.08 * (0.4 + depth * 0.6) &&
            splashes.length < (isMobile ? 20 : 40)
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

        bucketPaths[d.bucket].push({
          x: d.x,
          y: d.y,
          x2: d.x + wind * 1.3,
          y2: d.y + d.len * 0.75,
        });
      }

      ctx.lineCap = "round";
      for (let b = 0; b < RAIN_BUCKETS; b++) {
        const pts = bucketPaths[b];
        if (pts.length === 0) continue;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[i].x2, pts[i].y2);
        }
        ctx.strokeStyle = `rgba(165, 192, 235, ${bucketStyles[b].opacity * 0.7})`;
        ctx.lineWidth = bucketStyles[b].thickness;
        ctx.stroke();
      }

      // ── Ground splashes ─────────────────────────────────
      splashes = splashes.filter((s) => {
        s.life += dtN;
        const t = s.life / s.maxLife;
        const r = s.radius * (0.4 + t * 1.8);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, r * 2.2, r * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(175, 200, 245, ${(1 - t) * 0.32})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return s.life < s.maxLife;
      });

      // ── Vignette (cached gradient) ──────────────────────
      ctx.fillStyle = vignetteGrad!;
      ctx.fillRect(0, 0, w, h);

      // Film grain — desktop only
      if (!isMobile && Math.random() < 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${0.005 + Math.random() * 0.01})`;
        for (let g = 0; g < 12; g++) {
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
      }

      // Adaptive framerate decision
      const cost = performance.now() - t0;
      emaCost = emaCost * 0.9 + cost * 0.1;
      if (frameCount % 90 === 0) {
        renderEveryN = emaCost > 22 ? 2 : 1;
      }
    };

    resize();

    if (reducedMotion) {
      // Static sky only — no animation loop at all.
      ctx.fillStyle = getSkyGradient(0);
      ctx.fillRect(0, 0, w, h);
      for (const c of clouds) {
        ctx.globalAlpha = Math.min(1, c.opacity + 0.02);
        ctx.drawImage(c.sprite, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = vignetteGrad!;
      ctx.fillRect(0, 0, w, h);
      return () => {
        running = false;
      };
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    animId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
