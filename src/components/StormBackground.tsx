import { useEffect, useRef } from "react";

interface Drop {
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
  thickness: number;
  layer: number;
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
}

function createDrop(w: number, h: number, fromTop = true): Drop {
  const layer = Math.random();
  return {
    x: Math.random() * w * 1.2 - w * 0.1,
    y: fromTop ? -Math.random() * h * 0.4 : Math.random() * h,
    len: 16 + layer * 34,
    speed: 5 + layer * 13,
    opacity: 0.1 + layer * 0.45,
    thickness: 0.4 + layer * 1.7,
    layer,
  };
}

function createCloud(w: number, h: number): CloudPuff {
  return {
    x: Math.random() * w,
    y: Math.random() * h * 0.55,
    r: 150 + Math.random() * 300,
    speed: 2.5 + Math.random() * 8,
    opacity: 0.025 + Math.random() * 0.045,
  };
}

function buildBolt(w: number, h: number): Bolt {
  const startX = w * (0.12 + Math.random() * 0.76);
  const segments: { x: number; y: number }[] = [{ x: startX, y: -10 }];
  const branches: { x: number; y: number }[][] = [];
  let x = startX;
  let y = 0;
  const targetY = h * (0.35 + Math.random() * 0.45);
  const segs = 12 + Math.floor(Math.random() * 12);

  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    y = t * targetY;
    x += (Math.random() - 0.5) * 80 * (1 + t * 0.55);
    segments.push({ x, y });

    if (Math.random() < 0.35 && i > 2) {
      const branch: { x: number; y: number }[] = [{ x, y }];
      let bx = x;
      let by = y;
      const bLen = 3 + Math.floor(Math.random() * 5);
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
    let time = 0;
    let mouseX = 0.5;
    // Scroll-driven storm intensity: 0 = chill rain, 1 = full storm
    let scrollTarget = 0;
    let storm = 0;

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.min(Math.floor((w * h) / 2600), 440);
      while (drops.length < targetCount) drops.push(createDrop(w, h, false));
      if (drops.length > targetCount) drops = drops.slice(0, targetCount);

      if (clouds.length === 0) {
        for (let i = 0; i < 7; i++) clouds.push(createCloud(w, h));
      }
    };

    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX / w;
    };

    const drawSky = (storm: number) => {
      // Sky darkens/deepens as the storm builds
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgb(${5 + storm * 6},${7 + storm * 4},${18 + storm * 8})`);
      g.addColorStop(0.4, `rgb(${9 - storm * 3},${11 - storm * 3},${26 + storm * 6})`);
      g.addColorStop(1, "rgb(3,4,12)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      clouds.forEach((c) => {
        // clouds drift faster and grow denser during storms
        c.x += c.speed * (0.14 + storm * 0.4);
        if (c.x - c.r > w) c.x = -c.r;
        const cg = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
        cg.addColorStop(0, `rgba(70, 85, 130, ${c.opacity + 0.02 + storm * 0.05})`);
        cg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cg;
        ctx.fillRect(0, 0, w, h);
      });

      const haze = ctx.createRadialGradient(
        w * mouseX,
        h * 0.15,
        0,
        w * 0.5,
        h * 0.2,
        w * 0.8
      );
      haze.addColorStop(0, "rgba(55, 75, 125, 0.06)");
      haze.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
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

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const drawPath = (pts: { x: number; y: number }[], width: number, color: string) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };

      // soft wide glow — subtle atmospheric illumination
      ctx.shadowColor = `rgba(180, 210, 255, ${a * 0.7})`;
      ctx.shadowBlur = 55 * bolt.glow;
      drawPath(bolt.segments, 6, `rgba(160, 195, 255, ${a * 0.18})`);
      bolt.branches.forEach((b) => drawPath(b, 3, `rgba(160, 195, 255, ${a * 0.12})`));

      // mid line
      ctx.shadowBlur = 20 * bolt.glow;
      drawPath(bolt.segments, 2.5, `rgba(210, 230, 255, ${a * 0.5})`);
      bolt.branches.forEach((b) => drawPath(b, 1.3, `rgba(210, 230, 255, ${a * 0.35})`));

      // thin bright core — eye-catching without being harsh
      ctx.shadowBlur = 8;
      drawPath(bolt.segments, 1.2, `rgba(255, 255, 255, ${a * 0.9})`);
      bolt.branches.forEach((b) => drawPath(b, 0.7, `rgba(255, 255, 255, ${a * 0.7})`));

      ctx.restore();
    };

    const frame = () => {
      if (!running) return;
      time++;

      // Smoothly ease storm toward scroll target
      storm += (scrollTarget - storm) * 0.03;

      // No lightning until you've scrolled a bit; ramps with storm
      const stormActive = storm > 0.12;
      const stormChance = stormActive
        ? (0.001 + (Math.sin(time * 0.003) * 0.5 + 0.5) * 0.006) * storm
        : 0;

      drawSky(storm);

      // subtle flash overlay — always present at low level, spikes on lightning
      if (flash > 0) {
        const fg = ctx.createRadialGradient(w * 0.5, 0, 0, w * 0.5, h * 0.25, h * 1.1);
        fg.addColorStop(0, `rgba(200, 218, 255, ${flash * 0.32})`);
        fg.addColorStop(0.5, `rgba(120, 150, 220, ${flash * 0.1})`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
        flash *= 0.9;
        if (flash < 0.005) flash = 0;
      }

      // ambient sky pulse — very subtle brightness wave
      const skyPulse = Math.sin(time * 0.008) * 0.008 + 0.008;
      ctx.fillStyle = `rgba(100, 130, 180, ${skyPulse})`;
      ctx.fillRect(0, 0, w, h);

      // storm cadence — only when scrolled into the storm
      stormTimer++;
      if (stormActive && (stormTimer > nextStorm || Math.random() < stormChance)) {
        const count = 1 + Math.floor(Math.random() * (1 + Math.round(storm * 2)));
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            if (!running) return;
            bolts.push(buildBolt(w, h));
            flash = Math.max(flash, (0.3 + Math.random() * 0.4) * storm);
          }, i * (30 + Math.random() * 100));
        }
        stormTimer = 0;
        // storms grow more frequent as storm intensifies
        nextStorm = 260 - storm * 160 + Math.random() * 160;
      }

      // draw bolts
      bolts = bolts.filter((b) => {
        b.life++;
        drawBolt(b);
        return b.life < b.maxLife;
      });

      // rain — chill at top, faster & windier as the storm builds
      // speed multiplier: 0.55 (gentle drizzle) → ~1.8 (driving rain)
      const speedMul = 0.55 + storm * 1.25;
      const windBase = Math.sin(time * 0.0018) * (1.2 + storm * 2.5);
      const windMouse = (mouseX - 0.5) * 2.5;
      const wind = windBase + windMouse;

      ctx.lineCap = "round";
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.y += d.speed * speedMul;
        d.x += wind * (0.3 + d.speed * 0.045);

        if (d.y > h + 14 || d.x < -30 || d.x > w + 30) {
          drops[i] = createDrop(w, h, true);
          if (Math.random() < 0.08 * (0.4 + d.layer * 0.6)) {
            splashes.push({
              x: drops[i].x + (Math.random() - 0.5) * 16,
              y: h - 1 - Math.random() * 8,
              life: 0,
              maxLife: 7 + Math.random() * 9,
              radius: 2 + Math.random() * 4,
            });
          }
          continue;
        }

        const x2 = d.x + wind * 1.3;
        const y2 = d.y + d.len * 0.75;

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(165, 192, 235, ${d.opacity * 0.7})`;
        ctx.lineWidth = d.thickness;
        ctx.stroke();
      }

      // ground splashes
      splashes = splashes.filter((s) => {
        s.life++;
        const t = s.life / s.maxLife;
        const r = s.radius * (0.4 + t * 1.8);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, r * 2.2, r * 0.35, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(175, 200, 245, ${(1 - t) * 0.32})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        return s.life < s.maxLife;
      });

      // vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.9);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // grain
      if (Math.random() < 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${0.005 + Math.random() * 0.01})`;
        for (let g = 0; g < 12; g++) {
          ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
        }
      }

      animId = requestAnimationFrame(frame);
    };

    resize();
    updateScroll();
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
