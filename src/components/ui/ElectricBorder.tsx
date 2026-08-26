import { useEffect, useRef } from "react";
import { cn } from "../../utils/cn";

/**
 * ElectricBorder — animated lightning that crackles around the edge of
 * an element, ported from the CodePen "Electric Border (iOS Safe)" by
 * BalintFerenczy: https://codepen.io/BalintFerenczy/pen/yyYErXa
 *
 * The drawing core lives in `ElectricPainter` (no DOM dependencies) so
 * the exact same bolt math drives BOTH the DOM template cards here and
 * the WebGL corridor frames in the 3D Journey (see
 * `journey/JourneyElectricBorder.tsx`).
 */

export interface ElectricPainterOptions {
  /** logical card width in px */
  width: number;
  /** logical card height in px */
  height: number;
  color: string;
  speed: number;
  lineWidth: number;
  radius: number;
  /** canvas extension beyond each card edge, as a fraction (matches bolt wander) */
  overscan: number;
  /** bolt wander, as a fraction of the card's min dimension */
  displacement: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  amplitude: number;
  frequency: number;
  baseFlatness: number;
}

/**
 * Pure drawing core — holds the noise engine + rounded-rect perimeter
 * math and renders frames into any 2D context. No DOM, no rAF: the
 * DOM component and the WebGL journey both drive it.
 */
export class ElectricPainter {
  private time = 0;
  private intensity = 0;
  private active = false;
  readonly canvasWidth: number;
  readonly canvasHeight: number;

  constructor(private readonly opts: ElectricPainterOptions) {
    this.canvasWidth = opts.width * (1 + 2 * opts.overscan);
    this.canvasHeight = opts.height * (1 + 2 * opts.overscan);
  }

  /** Flare the bolt (hover/focus) — intensity eases toward it. */
  setActive(active: boolean) {
    this.active = active;
  }

  /** Jump the animation clock (used for the static reduced-motion frame). */
  seek(time: number) {
    this.time = time;
  }

  /** Advance the animation by dtMs (capped) and ease hover intensity. */
  advance(dtMs: number) {
    this.time += (Math.min(dtMs, 100) / 1000) * this.opts.speed;
    this.intensity += ((this.active ? 1 : 0) - this.intensity) * 0.06;
  }

  /** Draw the current frame. ctx must be sized canvasWidth × canvasHeight
   *  (in its own pixel space) with an identity transform. */
  render(ctx: CanvasRenderingContext2D) {
    const o = this.opts;
    const left = o.width * o.overscan;
    const top = o.height * o.overscan;
    const radius = Math.min(o.radius, Math.min(o.width, o.height) / 2);
    const disp = Math.min(o.width, o.height) * o.displacement;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    const perimeter = 2 * (o.width + o.height) + 2 * Math.PI * radius;
    const samples = Math.max(160, Math.floor(perimeter / 2));
    const lw = o.lineWidth * (1 + this.intensity * 0.85);

    // Soft additive bloom pass, then the crisp core stroke.
    ctx.globalCompositeOperation = "lighter";
    this.strokePath(ctx, samples, left, top, radius, disp, lw * 3, 0.08 + this.intensity * 0.1);
    ctx.globalCompositeOperation = "source-over";
    this.strokePath(ctx, samples, left, top, radius, disp, lw, 0.92);
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

  /* ── drawing passes ────────────────────────────────────────────── */

  private strokePath(
    ctx: CanvasRenderingContext2D,
    samples: number,
    left: number,
    top: number,
    radius: number,
    scale: number,
    lineWidth: number,
    alpha: number
  ) {
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const point = this.getRoundedRectPoint(progress, left, top, this.opts.width, this.opts.height, radius);
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

/** DOM orchestrator: measures the host, scales for devicePixelRatio,
 *  runs the rAF loop and pauses when off-screen. Drawing is delegated
 *  to ElectricPainter. */
class ElectricBorderEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private opts: ElectricBorderOptions;
  private painter: ElectricPainter | null = null;
  private raf = 0;
  private running = false;
  private visible = true;
  private last = performance.now();
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

  /* ── lifecycle ─────────────────────────────────────────────────── */

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.painter = new ElectricPainter({
      width: rect.width / (1 + 2 * this.opts.overscan),
      height: rect.height / (1 + 2 * this.opts.overscan),
      color: this.opts.color,
      speed: this.opts.speed,
      lineWidth: this.opts.lineWidth,
      radius: this.opts.radius,
      overscan: this.opts.overscan,
      displacement: this.opts.displacement,
      octaves: this.opts.octaves,
      lacunarity: this.opts.lacunarity,
      gain: this.opts.gain,
      amplitude: this.opts.amplitude,
      frequency: this.opts.frequency,
      baseFlatness: this.opts.baseFlatness,
    });

    const w = Math.round(this.painter.canvasWidth * this.dpr);
    const h = Math.round(this.painter.canvasHeight * this.dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (!this.running) this.renderStatic();
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
    if (!this.painter) return;
    this.painter.seek(time);
    this.draw();
  }

  dispose() {
    this.stop();
    this.ro?.disconnect();
  }

  /* ── drawing ───────────────────────────────────────────────────── */

  private draw() {
    const ctx = this.ctx;
    if (!ctx || !this.painter) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.painter.render(ctx);
  }

  private frame(now: number) {
    if (!this.painter) return;
    const dt = Math.min((now - this.last) / 1000, 0.1) * 1000;
    this.last = now;
    this.painter.setActive(this.opts.getActive());
    this.painter.advance(dt);
    this.draw();
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
