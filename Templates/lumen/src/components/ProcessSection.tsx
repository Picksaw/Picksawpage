import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { Eye } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface ProcessSectionProps {
  onOpenProcessDetail: () => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ onOpenProcessDetail }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (stepsContainerRef.current) {
        gsap.fromTo(
          stepsContainerRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.18,
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
      id="process"
      ref={sectionRef}
      className="py-24 md:py-36 bg-linen-surface/55 backdrop-blur-[2px] border-t border-[#332635]/10 relative overflow-hidden"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-20 text-center max-w-xl mx-auto">
          <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit'] block mb-2">
            {CLINIC_TEXTS.PROCESS_LABEL}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
            {CLINIC_TEXTS.PROCESS_TITLE}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#777176] font-light leading-relaxed">
            {CLINIC_TEXTS.PROCESS_SUBTEXT}
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenProcessDetail}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-all shadow-sm cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-[#D8B6BE]" />
              <span>مشاهده راهنمای کامل در پنجره</span>
            </button>
          </div>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div
          ref={stepsContainerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {CLINIC_CONFIG.PROCESS_STEPS.map((step) => (
            <div
              key={`step-${step.number}`}
              onClick={onOpenProcessDetail}
              className="relative p-7 rounded-3xl bg-rose-wash border border-[#332635]/10 shadow-sm flex flex-col justify-between space-y-6 group hover:border-[#9B7B8D] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div>
                {/* Step Top Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-[#332635]/8">
                  <span className="font-['Outfit'] text-2xl font-light text-[#9B7B8D] group-hover:text-[#332635] transition-colors">
                    {step.number}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D8B6BE] group-hover:bg-[#332635] transition-colors" />
                </div>

                {/* Step Title & Details */}
                <div className="mt-5 space-y-2">
                  <h3 className="text-xl font-medium text-[#241A27]">
                    {step.title}
                  </h3>
                  <p className="text-xs text-[#9B7B8D] font-normal">
                    {step.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[#777176] font-light leading-relaxed pt-2">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#9B7B8D] font-mono flex items-center justify-between">
                <span>مرحله {step.number}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#332635] font-sans text-[10px]">
                  مشاهده جزئیات
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
