import React, { useEffect, useRef } from "react";
import { SITE_CONTENT, ProcessDetail } from "../config/contentConfig";
import gsap from "gsap";
import { Plus } from "lucide-react";

interface ProcessSectionProps {
  onOpenProcessModal?: (step: ProcessDetail) => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ onOpenProcessModal }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (progressBarRef.current && sectionRef.current) {
        gsap.fromTo(
          progressBarRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            transformOrigin: "right center",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "center 40%",
              scrub: 0.6,
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
      aria-label="مراحل مراجعه به کلینیک"
      className="py-16 md:py-24 bg-[#EEF5F7] border-b border-[#0B1F2A]/10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-[#E88B7B]" />
            <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
              {SITE_CONTENT.PROCESS_SECTION.LABEL}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B1F2A] tracking-tight mb-4">
            {SITE_CONTENT.PROCESS_SECTION.TITLE}
          </h2>
          <p className="text-sm sm:text-base text-[#7B858A] leading-relaxed">
            {SITE_CONTENT.PROCESS_SECTION.SUBTITLE}
          </p>
        </div>

        {/* Desktop Horizontal Timeline */}
        <div className="hidden md:block relative">
          {/* Base Background Line */}
          <div className="absolute top-10 left-8 right-8 h-[2px] bg-[#0B1F2A]/10 -z-0" />

          {/* Animated Connecting Line */}
          <div
            ref={progressBarRef}
            className="absolute top-10 left-8 right-8 h-[2px] bg-[#E88B7B] -z-0 origin-right"
          />

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-4 gap-6 relative z-10">
            {SITE_CONTENT.PROCESS_SECTION.STEPS.map((step) => (
              <div
                key={step.number}
                onClick={() => onOpenProcessModal?.(step)}
                className="group flex flex-col items-center text-center p-4 cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`مشاهده جزئیات مرحله ${step.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenProcessModal?.(step);
                  }
                }}
              >
                {/* Numbered Node */}
                <div className="w-20 h-20 bg-[#F7F6F2] border-2 border-[#0B1F2A]/20 group-hover:border-[#E88B7B] group-hover:bg-[#0B1F2A] group-hover:text-white transition-all duration-300 flex flex-col items-center justify-center mb-6 shadow-xs">
                  <span className="font-number text-xl font-bold text-[#0B1F2A] group-hover:text-[#E88B7B] transition-colors">
                    {step.number}
                  </span>
                  <span className="text-[10px] text-[#7B858A] group-hover:text-white/80 font-medium">
                    {step.persianNumber}
                  </span>
                </div>

                {/* Step Content */}
                <span className="text-[10px] tracking-wider text-[#7B858A] uppercase font-editorial mb-1">
                  {step.latin}
                </span>
                <h3 className="text-lg font-bold text-[#0B1F2A] mb-2 group-hover:text-[#16394A] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-[#7B858A] leading-relaxed max-w-[220px] mb-3">
                  {step.shortDescription}
                </p>

                <span className="text-[11px] font-medium text-[#E88B7B] inline-flex items-center gap-1 group-hover:underline">
                  <Plus className="w-3 h-3" />
                  <span>جزئیات مرحله</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Vertical Timeline */}
        <div className="md:hidden relative border-r-2 border-[#0B1F2A]/15 pr-6 mr-3 space-y-8">
          {SITE_CONTENT.PROCESS_SECTION.STEPS.map((step) => (
            <div
              key={step.number}
              onClick={() => onOpenProcessModal?.(step)}
              className="relative group cursor-pointer"
              role="button"
              tabIndex={0}
            >
              {/* Node Marker on Right Edge */}
              <div className="absolute -right-[33px] top-0 w-4 h-4 bg-[#F7F6F2] border-2 border-[#0B1F2A] group-hover:border-[#E88B7B] group-hover:bg-[#E88B7B] transition-colors" />

              <div className="bg-[#F7F6F2] p-5 border border-[#0B1F2A]/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-number text-base font-bold text-[#E88B7B]">
                    {step.number}
                  </span>
                  <span className="text-[10px] text-[#7B858A] uppercase font-editorial">
                    {step.latin}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0B1F2A] mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-[#7B858A] leading-relaxed mb-2">
                  {step.shortDescription}
                </p>
                <span className="text-[11px] font-semibold text-[#E88B7B] inline-flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  <span>مشاهده جزئیات مرحله</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
