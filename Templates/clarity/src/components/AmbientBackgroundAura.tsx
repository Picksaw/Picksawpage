import React, { useEffect, useRef } from 'react';

export const AmbientBackgroundAura: React.FC = () => {
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    targetProgress: 0,
    currentProgress: 0,
    rafId: 0,
    isScrolling: false,
    scrollTimeout: 0,
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    // Mobile uses zero-JS static CSS gradients for maximum 120 FPS performance
    if (prefersReducedMotion || isMobile) return;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      stateRef.current.targetProgress = Math.min(1, Math.max(0, scrollY / docHeight));
      stateRef.current.isScrolling = true;

      window.clearTimeout(stateRef.current.scrollTimeout);
      stateRef.current.scrollTimeout = window.setTimeout(() => {
        stateRef.current.isScrolling = false;
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const renderLoop = () => {
      const state = stateRef.current;
      const diff = Math.abs(state.targetProgress - state.currentProgress);

      if (diff > 0.001 || state.isScrolling) {
        state.currentProgress += (state.targetProgress - state.currentProgress) * 0.08;
        const p = state.currentProgress;

        if (orb1Ref.current) {
          orb1Ref.current.style.transform = `translate3d(${(p * 60).toFixed(1)}px, ${(p * 180).toFixed(1)}px, 0)`;
        }
        if (orb2Ref.current) {
          orb2Ref.current.style.transform = `translate3d(${(-p * 50).toFixed(1)}px, ${(p * 220).toFixed(1)}px, 0)`;
        }
        if (orb3Ref.current) {
          orb3Ref.current.style.transform = `translate3d(${(p * 60).toFixed(1)}px, ${(p * 190).toFixed(1)}px, 0)`;
        }
      }

      state.rafId = requestAnimationFrame(renderLoop);
    };

    stateRef.current.rafId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (stateRef.current.rafId) {
        cancelAnimationFrame(stateRef.current.rafId);
      }
      window.clearTimeout(stateRef.current.scrollTimeout);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* 1. Base Pristine Soft Canvas */}
      <div className="absolute inset-0 bg-[#E4F0F6]" />

      {/* 2. Mobile Pure CSS Ambient Glows (Ultra-lightweight, 120 FPS guaranteed) */}
      <div
        className="block md:hidden absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 85% 10%, rgba(207, 232, 243, 0.7) 0%, transparent 50%), radial-gradient(circle at 15% 45%, rgba(240, 216, 220, 0.5) 0%, transparent 45%), radial-gradient(circle at 80% 85%, rgba(159, 207, 224, 0.4) 0%, transparent 50%)',
        }}
      />

      {/* 3. Desktop High-Performance Fluid Mesh Orbs (Hardware-accelerated) */}
      <div
        ref={orb1Ref}
        className="hidden md:block absolute -top-[10%] -right-[8%] w-[45vw] max-w-[600px] h-[45vw] max-h-[600px] rounded-full blur-[80px] opacity-60 transform-gpu"
        style={{
          background: 'radial-gradient(circle, rgba(207, 232, 243, 0.9) 0%, rgba(159, 207, 224, 0.5) 50%, transparent 75%)',
          willChange: 'transform',
        }}
      />

      <div
        ref={orb2Ref}
        className="hidden md:block absolute top-[30%] -left-[10%] w-[42vw] max-w-[550px] h-[42vw] max-h-[550px] rounded-full blur-[85px] opacity-50 transform-gpu"
        style={{
          background: 'radial-gradient(circle, rgba(240, 216, 220, 0.85) 0%, rgba(217, 166, 174, 0.35) 50%, transparent 75%)',
          willChange: 'transform',
        }}
      />

      <div
        ref={orb3Ref}
        className="hidden md:block absolute top-[60%] -right-[10%] w-[44vw] max-w-[580px] h-[44vw] max-h-[580px] rounded-full blur-[90px] opacity-45 transform-gpu"
        style={{
          background: 'radial-gradient(circle, rgba(159, 207, 224, 0.7) 0%, rgba(207, 232, 243, 0.4) 50%, transparent 75%)',
          willChange: 'transform',
        }}
      />
    </div>
  );
};
