import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

gsap.registerPlugin(ScrollTrigger);

// Bespoke geometric glyphs for the 3 pillars
const PrecisionGlyph = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#9B7B8D]">
    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    <circle cx="16" cy="16" r="4" fill="#D8B6BE" />
    <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
    <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="1.5" />
    <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="1.5" />
    <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const BalanceGlyph = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#9B7B8D]">
    <path d="M6 24 C10 14, 22 14, 26 24" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="16" cy="12" r="4" fill="#D8B6BE" />
    <line x1="4" y1="26" x2="28" y2="26" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
  </svg>
);

const NaturalGlyph = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#9B7B8D]">
    <path d="M16 4 C16 16, 26 20, 26 26 C26 28, 24 30, 20 30 C12 30, 6 22, 6 16 C6 10, 12 4, 16 4 Z" fill="#D8B6BE" fillOpacity="0.6" stroke="currentColor" strokeWidth="1.2" />
    <path d="M16 10 C16 18, 12 24, 10 26" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const glyphs = [PrecisionGlyph, BalanceGlyph, NaturalGlyph];

export const PhilosophySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      itemsRef.current.forEach((el) => {
        if (!el) return;

        gsap.fromTo(
          el,
          { opacity: 0.3, y: 35 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              end: 'bottom 40%',
              toggleActions: 'play reverse play reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-36 bg-linen-surface/65 backdrop-blur-[2px] border-y border-[#332635]/10 relative"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-20 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit'] block mb-3">
            {CLINIC_TEXTS.PHILOSOPHY_LABEL}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
            {CLINIC_TEXTS.PHILOSOPHY_TITLE}
          </h2>
          <div className="w-16 h-[1.5px] bg-[#332635]/25 mx-auto mt-5" />
        </div>

        {/* Sequential Connected Principles */}
        <div className="space-y-16 md:space-y-24 relative">
          {/* Subtle connected vertical axis line */}
          <div
            className="hidden md:block absolute right-12 lg:right-16 top-8 bottom-8 w-[1.5px] bg-gradient-to-b from-[#332635]/5 via-[#9B7B8D]/35 to-[#332635]/5 pointer-events-none"
            aria-hidden="true"
          />

          {CLINIC_CONFIG.PHILOSOPHY.map((item, index) => {
            const GlyphComponent = glyphs[index % glyphs.length];
            return (
              <div
                key={item.id}
                ref={(el) => { itemsRef.current[index] = el; }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-center relative group"
              >
                {/* Concept Keyword & Glyph (4 cols) */}
                <div className="md:col-span-4 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-mauve-wash/85 border border-[#332635]/10 flex items-center justify-center shrink-0 shadow-xs group-hover:border-[#9B7B8D] transition-colors">
                    <GlyphComponent />
                  </div>
                  <div>
                    <span className="font-['Cinzel'] text-xs font-mono text-[#9B7B8D] tracking-widest block">
                      0{index + 1}
                    </span>
                    <h3 className="text-4xl sm:text-5xl lg:text-6xl font-light text-[#332635] tracking-tight">
                      {item.keyword}
                    </h3>
                  </div>
                </div>

                {/* Title & Description (8 cols) */}
                <div className="md:col-span-8 space-y-3 pr-0 md:pr-8 md:border-r border-[#332635]/15">
                  <h4 className="text-xl sm:text-2xl font-medium text-[#241A27]">
                    {item.title}
                  </h4>
                  <p className="text-base sm:text-lg text-[#777176] font-light leading-relaxed max-w-2xl">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
