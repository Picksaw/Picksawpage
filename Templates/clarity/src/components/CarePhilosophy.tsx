import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLINIC_TEXT } from '../config/clinicText';

gsap.registerPlugin(ScrollTrigger);

export const CarePhilosophy: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      itemRefs.current.forEach((el) => {
        if (!el) return;

        ScrollTrigger.create({
          trigger: el,
          start: 'top 65%',
          end: 'bottom 35%',
          toggleClass: { targets: el, className: 'is-active' },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="philosophy"
      ref={containerRef}
      className="py-20 lg:py-28 relative bg-[#F6E3E6]"
      aria-label="فلسفه مراقبت در کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl text-right mb-16 lg:mb-20">
          <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
            {CLINIC_TEXT.philosophy.sectionSub}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight mt-2">
            {CLINIC_TEXT.philosophy.sectionTitle}
          </h2>
          <p className="text-sm text-[#69767C] mt-2">
            {CLINIC_TEXT.philosophy.sectionDesc}
          </p>
        </div>

        {/* 3 Vertical Principles */}
        <div className="space-y-16 lg:space-y-24 max-w-4xl">
          {CLINIC_TEXT.philosophy.items.map((item, index) => (
            <div
              key={item.numEn}
              ref={(el) => { itemRefs.current[index] = el; }}
              className="philosophy-item transition-all duration-500 opacity-60 hover:opacity-100 [&.is-active]:opacity-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start border-b border-[#CFE8F3]/50 pb-12">
                
                {/* Oversized Number */}
                <div className="md:col-span-3 text-right">
                  <span className="font-latin text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#9FCFE0] transition-colors duration-500 [.is-active_&]:text-[#203A43]">
                    {item.numEn}
                  </span>
                  <div className="text-xs font-medium text-[#69767C] mt-1">
                    اصل {item.num}
                  </div>
                </div>

                {/* Principle Title & Subtitle */}
                <div className="md:col-span-4 text-right">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#203A43] tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-[#D9A6AE] mt-1">
                    {item.subtitle}
                  </p>
                </div>

                {/* Principle Description */}
                <div className="md:col-span-5 text-right">
                  <p className="text-sm sm:text-base text-[#69767C] leading-relaxed transition-colors duration-500 [.is-active_&]:text-[#203A43]/90">
                    {item.copy}
                  </p>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
