import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

/**
 * ElectricBorder — animated lightning that crackles around the edge of
 * an element, ported from the CodePen "Electric Border (iOS Safe)" by
 * BalintFerenczy: https://codepen.io/BalintFerenczy/pen/yyYErXa
 *
 * The original draws on a fixed-size canvas that overshoots the card so
 * the bolts can wander outside the edges. This port measures its host,
 * scales for devicePixelRatio, pauses when off-screen, respects
 * prefers-reduced-motion, and boosts intensity while `active` is set
 * (used for the card hover state). Themed to the site's electric cyan.
 */

interface ElectricBorderOptions {
  color: string;
  speed: number;
  lineWidth: number;
  radius: number;
  overscan: number;
  displacement: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  amplitude: number;
  frequency: number;
  baseFlatness: number;
  getActive: () => boolean;
}

const DEFAULT_OPTIONS: Omit<ElectricBorderOptions, "getActive"> = {
  color: "#4fd8ff",
  speed: 1.15,
  lineWidth: 1.4,
  radius: 24,
  overscan: 0.09, // canvas extends 9% beyond each side of the card (matches bolt wander)
  displacement: 0.09, // bolt wander, as a fraction of the card's min dimension
  octaves: 10,
  lacunarity: 1.6,
  gain: 0.7,
  amplitude: 0.075,
  frequency: 10,
  baseFlatness: 0,
};

class ElectricBorderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private opts: ElectricBorderOptions;
  private raf = 0;
  private running = false;
  private visible = true;
  private time = 0;
  private last = performance.now();
  private intensity = 0;
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  private ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, opts: ElectricBorderOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = opts;

    if (typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(canvas);
    }
    this.resize();
  }

  /* ── noise primitives (identical to the original pen) ─────────── */

  private random(x: number) {
    return (Math.sin(x * 12.9898) * 43758.5453) % 1;
  }

  private noise2D(x: number, y: number) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;

    const a = this.random(i + j * 57);
    const b = this.random(i + 1 + j * 57);
    const c = this.random(i + (j + 1) * 57);
    const d = this.random(i + 1 + (j + 1) * 57);

    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);

    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
  }

  private octavedNoise(
    x: number,
    octaves: number,
    lacunarity: number,
    gain: number,
    baseAmplitude: number,
    baseFrequency: number,
    time = 0,
    seed = 0,
    baseFlatness = 1.0
  ) {
    let y = 0;
    let amplitude = baseAmplitude;
    let frequency = baseFrequency;

    for (let i = 0; i < octaves; i++) {
      let octaveAmplitude = amplitude;
      if (i === 0) octaveAmplitude *= baseFlatness;
      y += octaveAmplitude * this.noise2D(frequency * x + seed * 100, time * frequency * 0.3);
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return y;
  }

  /* ── rounded-rect perimeter, arc-length parameterized ─────────── */

  private getCornerPoint(
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    arcLength: number,
    progress: number
  ) {
    const angle = startAngle + progress * arcLength;
    return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  }

  private getRoundedRectPoint(
    t: number,
    left: number,
    top: number,
    width: number,
    height: number,
    radius: number
  ) {
    const straightWidth = width - 2 * radius;
    const straightHeight = height - 2 * radius;
    const cornerArc = (Math.PI * radius) / 2;
    const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;

    const distance = t * totalPerimeter;
    let accumulated = 0;

    // Top edge
    if (distance <= accumulated + straightWidth) {
      const progress = (distance - accumulated) / straightWidth;
      return { x: left + radius + progress * straightWidth, y: top };
    }
    accumulated += straightWidth;

    // Top-right corner
    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return this.getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, progress);
    }
    accumulated += cornerArc;

    // Right edge
    if (distance <= accumulated + straightHeight) {
      const progress = (distance - accumulated) / straightHeight;
      return { x: left + width, y: top + radius + progress * straightHeight };
    }
    accumulated += straightHeight;

    // Bottom-right corner
    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return this.getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, progress);
    }
    accumulated += cornerArc;

    // Bottom edge
    if (distance <= accumulated + straightWidth) {
      const progress = (distance - accumulated) / straightWidth;
      return { x: left + width - radius - progress * straightWidth, y: top + height };
    }
    accumulated += straightWidth;

    // Bottom-left corner
    if (distance <= accumulated + cornerArc) {
      const progress = (distance - accumulated) / cornerArc;
      return this.getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, progress);
    }
    accumulated += cornerArc;

    // Left edge
    if (distance <= accumulated + straightHeight) {
      const progress = (distance - accumulated) / straightHeight;
      return { x: left, y: top + height - radius - progress * straightHeight };
    }
    accumulated += straightHeight;

    // Top-left corner
    const progress = (distance - accumulated) / cornerArc;
    return this.getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, progress);
  }

  /* ── lifecycle ─────────────────────────────────────────────────── */

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this.cssW = rect.width;
    this.cssH = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    const w = Math.round(rect.width * this.dpr);
    const h = Math.round(rect.height * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (!this.running) this.frame(performance.now());
    }
  }

  start() {
    this.running = true;
    this.sync();
  }

  stop() {
    this.running = false;
    this.sync();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.sync();
  }

  private sync() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.running && this.visible) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    this.frame(now);
  };

  renderStatic(time = 2.3) {
    this.time = time;
    this.frame(performance.now());
  }

  dispose() {
    this.stop();
    this.ro?.disconnect();
  }

  /* ── drawing ───────────────────────────────────────────────────── */

  private frame(now: number) {
    const ctx = this.ctx;
    if (!ctx || this.cssW <= 0 || this.cssH <= 0) return;

    const dt = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    this.time += dt * this.opts.speed;
    this.intensity += ((this.opts.getActive() ? 1 : 0) - this.intensity) * 0.06;

    const o = this.opts.overscan;
    const cardW = this.cssW / (1 + 2 * o);
    const cardH = this.cssH / (1 + 2 * o);
    const left = (this.cssW - cardW) / 2;
    const top = (this.cssH - cardH) / 2;
    const radius = Math.min(this.opts.radius, Math.min(cardW, cardH) / 2);
    const disp = Math.min(cardW, cardH) * this.opts.displacement;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    const perimeter = 2 * (cardW + cardH) + 2 * Math.PI * radius;
    const samples = Math.max(160, Math.floor(perimeter / 2));

    const lw = this.opts.lineWidth * (1 + this.intensity * 0.85);

    // Soft additive bloom pass, then the crisp core stroke.
    ctx.globalCompositeOperation = "lighter";
    this.strokePath(samples, left, top, cardW, cardH, radius, disp, lw * 3, 0.08 + this.intensity * 0.1);
    ctx.globalCompositeOperation = "source-over";
    this.strokePath(samples, left, top, cardW, cardH, radius, disp, lw, 0.92);
  }

  private strokePath(
    samples: number,
    left: number,
    top: number,
    width: number,
    height: number,
    radius: number,
    scale: number,
    lineWidth: number,
    alpha: number
  ) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const point = this.getRoundedRectPoint(progress, left, top, width, height, radius);
      const xNoise = this.octavedNoise(
        progress * 8,
        this.opts.octaves,
        this.opts.lacunarity,
        this.opts.gain,
        this.opts.amplitude,
        this.opts.frequency,
        this.time,
        0,
        this.opts.baseFlatness
      );
      const yNoise = this.octavedNoise(
        progress * 8,
        this.opts.octaves,
        this.opts.lacunarity,
        this.opts.gain,
        this.opts.amplitude,
        this.opts.frequency,
        this.time,
        1,
        this.opts.baseFlatness
      );

      const x = point.x + xNoise * scale;
      const y = point.y + yNoise * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    ctx.strokeStyle = this.opts.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

interface ElectricBorderProps {
  /** Bolt color — defaults to the site's electric cyan. */
  color?: string;
  /** Animation speed multiplier. */
  speed?: number;
  /** Core stroke width in CSS px. */
  lineWidth?: number;
  /** Hover/focus boost — the bolt flares brighter while true. */
  active?: boolean;
  className?: string;
}

/**
 * Renders the animated bolt layer over its host. The root must be
 * positioned (absolute inset-0 over the card works best) — the canvas
 * is drawn 18% larger than the host so bolts can flick past its edges.
 */
export default function ElectricBorder({
  color = "#4fd8ff",
  speed = 1.15,
  lineWidth = 1.4,
  active = false,
  className,
}: ElectricBorderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ElectricBorderEngine | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ElectricBorderEngine(canvas, {
      ...DEFAULT_OPTIONS,
      color,
      speed,
      lineWidth,
      getActive: () => activeRef.current,
    });
    engineRef.current = engine;

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => engine.setVisible(entry.isIntersecting), {
            rootMargin: "120px",
          })
        : null;
    io?.observe(canvas);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      engine.renderStatic();
    } else {
      engine.start();
    }

    return () => {
      io?.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, [color, speed, lineWidth]);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-10", className)}>
      {/* overscanned canvas — lets bolts wander outside the card edge */}
      <canvas
        ref={canvasRef}
        className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2"
      />
      {/* glow layers hugging the card edge (from the pen) */}
      <div className="absolute inset-0 rounded-3xl border-2 border-electric/50 opacity-60 blur-[1px] transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-0 rounded-3xl border-2 border-electric-soft/60 opacity-60 blur-[4px] transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-0 scale-105 rounded-3xl bg-gradient-to-br from-electric/25 via-transparent to-electric/25 opacity-20 blur-[32px]" />
    </div>
  );
}
