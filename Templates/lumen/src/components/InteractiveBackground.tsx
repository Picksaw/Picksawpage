import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  orbitRadius: number;
  shape: 'circle' | 'diamond' | 'ring' | 'star';
}

export const InteractiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track scroll position & velocity
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let scrollProgress = 0;
    let scrollTimeout: number | undefined;

    // Mouse coordinates
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = totalHeight > 0 ? currentScrollY / totalHeight : 0;

      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Sensitive velocity capture
      scrollVelocity = Math.min(Math.max(delta * 0.15, -20), 20);

      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        scrollVelocity = 0;
      }, 150);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Refined high-visibility LUMEN palette
    const colors = [
      { r: 216, g: 182, b: 190 }, // Soft Rose #D8B6BE
      { r: 155, g: 123, b: 141 }, // Muted Mauve #9B7B8D
      { r: 72, g: 54, b: 75 },    // Deep Plum Accent #48364B
      { r: 240, g: 200, b: 210 }, // Radiant Rose Light
      { r: 190, g: 160, b: 175 }, // Soft Mauve
    ];

    let particles: Particle[] = [];

    const initParticles = () => {
      const count = width < 768 ? 32 : 65;
      particles = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const shapes: ('circle' | 'diamond' | 'ring' | 'star')[] = ['circle', 'diamond', 'ring', 'star'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const c = colors[Math.floor(Math.random() * colors.length)];
        const color = `rgba(${c.r}, ${c.g}, ${c.b}, `;
        const baseAlpha = 0.35 + Math.random() * 0.35; // Increased visibility

        particles.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 2.5 + Math.random() * (shape === 'ring' ? 9 : 5),
          color,
          alpha: baseAlpha,
          baseAlpha,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          angle: Math.random() * Math.PI * 2,
          speed: 0.004 + Math.random() * 0.008,
          orbitRadius: 20 + Math.random() * 45,
          shape,
        });
      }
    };

    initParticles();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let smoothVelocity = 0;
    let globalTime = 0;

    const render = () => {
      globalTime += 0.015;

      smoothVelocity += (scrollVelocity - smoothVelocity) * 0.12;
      scrollVelocity *= 0.93;

      ctx.clearRect(0, 0, width, height);

      // 1. Dynamic Ambient Light Glow Mesh
      const gradCenterX = width * (0.3 + 0.4 * Math.sin(scrollProgress * Math.PI + globalTime * 0.2));
      const gradCenterY = height * (0.4 + 0.3 * Math.cos(scrollProgress * Math.PI * 1.5 + globalTime * 0.15));
      const gradRadius = Math.max(width, height) * 0.7;

      const radialGrad = ctx.createRadialGradient(
        gradCenterX,
        gradCenterY,
        10,
        gradCenterX,
        gradCenterY,
        gradRadius
      );

      const scrollEnergy = Math.abs(smoothVelocity) * 0.09;
      const auraAlpha = 0.12 + Math.min(scrollEnergy * 0.15, 0.25);

      radialGrad.addColorStop(0, `rgba(216, 182, 190, ${auraAlpha})`);
      radialGrad.addColorStop(0.35, `rgba(155, 123, 141, ${auraAlpha * 0.7})`);
      radialGrad.addColorStop(0.7, `rgba(72, 54, 75, ${auraAlpha * 0.3})`);
      radialGrad.addColorStop(1, 'rgba(236, 226, 216, 0)');

      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Harmonic Light Waves (Active when scrolling)
      if (!prefersReducedMotion) {
        ctx.save();
        const lineCount = 4;
        for (let i = 0; i < lineCount; i++) {
          ctx.beginPath();
          const waveOffset = (i * (height / lineCount) + (scrollProgress * 400)) % height;
          const freq = 0.0018 + i * 0.0006;
          const amp = 20 + Math.abs(smoothVelocity) * 5;

          const waveAlpha = 0.08 + Math.min(scrollEnergy * 0.1, 0.18);
          ctx.strokeStyle = `rgba(155, 123, 141, ${waveAlpha})`;
          ctx.lineWidth = 1.2;

          for (let x = 0; x < width; x += 15) {
            const y = waveOffset + Math.sin(x * freq + globalTime * 1.5 + i) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Render Particles & Interconnected Constellations
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          const scrollBoostY = smoothVelocity * 1.1;
          const scrollBoostX = Math.sin(p.angle + scrollProgress * 6) * smoothVelocity * 0.7;

          p.angle += p.speed + Math.abs(smoothVelocity) * 0.01;
          p.x = p.baseX + Math.cos(p.angle) * p.orbitRadius + scrollBoostX;
          p.y = p.baseY + Math.sin(p.angle) * p.orbitRadius + scrollBoostY;

          // Wrap around edges gracefully
          if (p.x < -30) p.baseX = width + 20;
          if (p.x > width + 30) p.baseX = -20;
          if (p.y < -30) p.baseY = height + 20;
          if (p.y > height + 30) p.baseY = -20;

          // Mouse interaction
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 190) {
            const force = (190 - dist) / 190;
            p.x += (dx / dist) * force * 2;
            p.y += (dy / dist) * force * 2;
          }

          // Active brightening during scroll
          p.alpha = p.baseAlpha + Math.min(Math.abs(smoothVelocity) * 0.04, 0.4);
        }

        // Draw connections between nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 130) {
            const lineAlpha = (1 - cdist / 130) * (0.12 + Math.min(scrollEnergy * 0.15, 0.25));
            ctx.beginPath();
            ctx.strokeStyle = `rgba(155, 123, 141, ${lineAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Draw individual glowing node
        ctx.save();
        ctx.translate(p.x, p.y);

        // Soft outer glow halo
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.8);
        haloGrad.addColorStop(0, `${p.color}${p.alpha * 0.7})`);
        haloGrad.addColorStop(1, `${p.color}0)`);
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.strokeStyle = `${p.color}${Math.min(p.alpha * 1.3, 1)})`;
        ctx.lineWidth = 1.2;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'diamond') {
          const s = p.size * 1.3;
          ctx.rotate(p.angle * 0.5 + smoothVelocity * 0.04);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.7, 0);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.7, 0);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'ring') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          const s = p.size * 1.2;
          ctx.rotate(p.angle * 0.3);
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.lineTo(s * 0.3, -s * 0.3);
          ctx.lineTo(s, 0);
          ctx.lineTo(s * 0.3, s * 0.3);
          ctx.lineTo(0, s);
          ctx.lineTo(-s * 0.3, s * 0.3);
          ctx.lineTo(-s, 0);
          ctx.lineTo(-s * 0.3, -s * 0.3);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
