import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLINIC_TEXTS } from '../config/texts';

gsap.registerPlugin(ScrollTrigger);

export const EditorialIntro: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-36 bg-linen-surface/60 backdrop-blur-[2px] border-y border-[#332635]/10 relative overflow-hidden"
      dir="rtl"
    >
      {/* Editorial Decorative Large Lettermark in Background */}
      <span
        className="font-['Cinzel'] text-[180px] md:text-[280px] font-bold text-[#332635]/[0.03] absolute -bottom-16 -left-12 select-none pointer-events-none leading-none -z-0"
        aria-hidden="true"
      >
        L
      </span>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-baseline">
          {/* Label Side (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-[1.5px] bg-[#9B7B8D]" />
                <span className="text-xs font-bold tracking-[0.3em] text-[#9B7B8D] uppercase font-['Outfit']">
                  {CLINIC_TEXTS.INTRO_LABEL}
                </span>
              </div>
              <div className="w-16 h-[1.5px] bg-[#332635]/25" />
            </div>

            <div className="hidden lg:block mt-24 space-y-2">
              <span className="text-xs text-[#777176] font-mono tracking-widest block">
                {CLINIC_TEXTS.INTRO_SIDE_LABEL}
              </span>
              <p className="text-xs text-[#777176]/80 font-light leading-relaxed">
                {CLINIC_TEXTS.INTRO_SIDE_DESC}
              </p>
            </div>
          </div>

          {/* Statement Side (8 cols) */}
          <div ref={textRef} className="lg:col-span-8 space-y-8">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-light text-[#332635] leading-[1.2] tracking-tight">
              {CLINIC_TEXTS.INTRO_TITLE_1}
              <br />
              <span className="font-normal text-[#241A27] underline decoration-[#D8B6BE] decoration-wavy decoration-1 underline-offset-8">
                {CLINIC_TEXTS.INTRO_TITLE_2}
              </span>
            </h2>

            <p className="text-lg sm:text-xl md:text-2xl text-[#777176] font-light leading-relaxed max-w-2xl">
              {CLINIC_TEXTS.INTRO_SUBTEXT}
            </p>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#332635]/10">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#332635] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.INTRO_POINT_1}</span>
              </div>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-[#332635] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#9B7B8D]" />
                <span>{CLINIC_TEXTS.INTRO_POINT_2}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
