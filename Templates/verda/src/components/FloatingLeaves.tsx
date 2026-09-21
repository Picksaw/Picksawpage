import React, { useEffect, useRef } from 'react';

interface LeafParticle {
  x: number;
  y: number;
  type: number;
  size: number;
  angle: number;
  angularVelocity: number;
  baseSpeedX: number;
  baseSpeedY: number;
  vx: number;
  vy: number;
  swayPhase: number;
  swaySpeed: number;
  swayRadius: number;
  opacity: number;
  colorGrad: { top: string; mid: string; bot: string };
}

export const FloatingLeaves: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const updateCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Wind Physics
    let targetWindX = 0;
    let targetWindY = 0;
    let currentWindX = 0;
    let currentWindY = 0;
    let lastScrollY = window.scrollY;
    let lastScrollTime = performance.now();

    const triggerWind = (deltaY: number) => {
      const now = performance.now();
      const dt = Math.max(now - lastScrollTime, 10);
      lastScrollTime = now;

      // Scroll speed
      const scrollSpeed = deltaY / dt;
      const intensity = Math.min(Math.abs(scrollSpeed) * 3.5 + 2.5, 24);
      const dirY = deltaY >= 0 ? -1 : 1;
      const dirX = (Math.sin(now * 0.005) > 0 ? 1 : -1) * 0.8;

      targetWindX = dirX * intensity * 1.8;
      targetWindY = dirY * intensity * 2.8;
    };

    const handleWindowScroll = () => {
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;
      if (Math.abs(deltaY) > 0.5) {
        triggerWind(deltaY);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      triggerWind(e.deltaY * 0.5);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        triggerWind(4);
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Refined color schemes from VERDA palette
    const colorSchemes = [
      { top: '#9CAF88', mid: '#7C9469', bot: '#4B5E3E' }, // Sage Green
      { top: '#A8BC94', mid: '#879F70', bot: '#556A45' }, // Soft Sage
      { top: '#869D73', mid: '#657C53', bot: '#384B2F' }, // Olive Sage
      { top: '#B5C4A3', mid: '#95AA83', bot: '#617551' }, // Warm Pale Sage
    ];

    // High quantity of background leaves distributed throughout the entire viewport
    const LEAF_COUNT = 48;
    const leaves: LeafParticle[] = [];

    for (let i = 0; i < LEAF_COUNT; i++) {
      const scheme = colorSchemes[i % colorSchemes.length];
      leaves.push({
        x: Math.random() * width,
        y: Math.random() * height,
        type: i % 3,
        size: 16 + Math.random() * 24, // 16px to 40px
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.02,
        baseSpeedX: (Math.random() - 0.5) * 0.35,
        baseSpeedY: 0.15 + Math.random() * 0.45,
        vx: 0,
        vy: 0,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.015 + Math.random() * 0.02,
        swayRadius: 0.5 + Math.random() * 1.0,
        opacity: 0.22 + Math.random() * 0.26, // visible soft opacity 0.22 to 0.48
        colorGrad: scheme,
      });
    }

    // Leaf drawing helper functions
    const drawSlenderLeaf = (ctx: CanvasRenderingContext2D, size: number, grad: CanvasGradient) => {
      const w = size * 0.45;
      const h = size;
      ctx.beginPath();
      ctx.moveTo(0, -h / 2);
      ctx.bezierCurveTo(w * 1.3, -h * 0.2, w * 1.3, h * 0.25, 0, h / 2);
      ctx.bezierCurveTo(-w * 1.3, h * 0.25, -w * 1.3, -h * 0.2, 0, -h / 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Veins
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.4);
      ctx.lineTo(0, h * 0.4);
      ctx.moveTo(0, -h * 0.15);
      ctx.lineTo(w * 0.55, -h * 0.25);
      ctx.moveTo(0, h * 0.1);
      ctx.lineTo(w * 0.55, 0);
      ctx.moveTo(0, -h * 0.05);
      ctx.lineTo(-w * 0.55, -h * 0.15);
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(-w * 0.55, h * 0.1);
      ctx.strokeStyle = 'rgba(251, 250, 244, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    const drawCurvedLeaf = (ctx: CanvasRenderingContext2D, size: number, grad: CanvasGradient) => {
      const w = size * 0.55;
      const h = size * 0.9;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, -h * 0.45);
      ctx.bezierCurveTo(w * 0.85, -h * 0.3, w * 0.95, h * 0.3, -w * 0.3, h * 0.45);
      ctx.bezierCurveTo(-w * 0.95, h * 0.15, -w * 0.75, -h * 0.2, -w * 0.4, -h * 0.45);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-w * 0.35, -h * 0.35);
      ctx.quadraticCurveTo(w * 0.2, 0, -w * 0.25, h * 0.35);
      ctx.strokeStyle = 'rgba(251, 250, 244, 0.45)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    const drawOvalLeaf = (ctx: CanvasRenderingContext2D, size: number, grad: CanvasGradient) => {
      const w = size * 0.52;
      const h = size * 0.85;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -h * 0.35);
      ctx.lineTo(0, h * 0.35);
      ctx.moveTo(0, -h * 0.1);
      ctx.lineTo(w * 0.35, -h * 0.2);
      ctx.moveTo(0, 0);
      ctx.lineTo(-w * 0.35, -h * 0.1);
      ctx.moveTo(0, h * 0.15);
      ctx.lineTo(w * 0.3, h * 0.05);
      ctx.strokeStyle = 'rgba(251, 250, 244, 0.4)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    };

    let lastFrameTime = performance.now();

    const animate = (time: number) => {
      const delta = Math.min((time - lastFrameTime) / 1000, 0.05);
      lastFrameTime = time;

      // Decay wind force smoothly back to 0 when scrolling stops
      targetWindX *= 0.92;
      targetWindY *= 0.92;
      currentWindX += (targetWindX - currentWindX) * 0.12;
      currentWindY += (targetWindY - currentWindY) * 0.12;

      const windSpeed = Math.hypot(currentWindX, currentWindY);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        // 1. Resting ambient sway
        leaf.swayPhase += leaf.swaySpeed;
        const naturalSwayX = Math.sin(leaf.swayPhase) * leaf.swayRadius;
        const naturalSwayY = Math.cos(leaf.swayPhase * 0.7) * (leaf.swayRadius * 0.3);

        // 2. Wind turbulence response
        const drag = 0.8 + (leaf.size / 30) * 0.4;
        leaf.vx += (currentWindX * drag - leaf.vx) * 0.1;
        leaf.vy += (currentWindY * drag - leaf.vy) * 0.1;

        // Coordinates update
        leaf.x += (leaf.baseSpeedX + naturalSwayX + leaf.vx) * 60 * delta;
        leaf.y += (leaf.baseSpeedY + naturalSwayY + leaf.vy) * 60 * delta;

        // 3. Angular rotation: at rest very slow, during windy air spins actively with the breeze
        const restingSpin = leaf.angularVelocity;
        const windSpin = (currentWindX * 0.025 + currentWindY * 0.02) * (i % 2 === 0 ? 1 : -1);
        leaf.angle += (restingSpin + windSpin) * 60 * delta;

        // 4. Wrap around screen edges
        const margin = leaf.size * 2.5;
        if (leaf.x < -margin) leaf.x = width + margin;
        if (leaf.x > width + margin) leaf.x = -margin;
        if (leaf.y < -margin) leaf.y = height + margin;
        if (leaf.y > height + margin) leaf.y = -margin;

        // 5. Draw
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle);

        // Flutter scale when windy
        const flutter = 1 + Math.sin(leaf.swayPhase * 2.5) * (0.04 + windSpeed * 0.025);
        ctx.scale(1, flutter);

        ctx.globalAlpha = leaf.opacity;

        const grad = ctx.createLinearGradient(0, -leaf.size / 2, 0, leaf.size / 2);
        grad.addColorStop(0, leaf.colorGrad.top);
        grad.addColorStop(0.55, leaf.colorGrad.mid);
        grad.addColorStop(1, leaf.colorGrad.bot);

        if (leaf.type === 0) {
          drawSlenderLeaf(ctx, leaf.size, grad);
        } else if (leaf.type === 1) {
          drawCurvedLeaf(ctx, leaf.size, grad);
        } else {
          drawOvalLeaf(ctx, leaf.size, grad);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('scroll', handleWindowScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] w-full h-full select-none"
      style={{
        backgroundColor: 'transparent',
      }}
    />
  );
};
