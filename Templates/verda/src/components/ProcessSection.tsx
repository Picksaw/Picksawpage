import React, { useEffect, useRef, useState } from 'react';
import { CONTENT_CONFIG, ProcessStepDetail } from '../config/content.config';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ProcessSectionProps {
  onOpenStepDetails?: (stepNum: string) => void;
}

export const ProcessSection: React.FC<ProcessSectionProps> = ({ onOpenStepDetails }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps: ProcessStepDetail[] = CONTENT_CONFIG.PROCESS.STEPS;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'bottom 40%',
        onUpdate: (self) => {
          const stepIndex = Math.min(
            steps.length - 1,
            Math.floor(self.progress * steps.length)
          );
          setActiveStep(stepIndex);
        },
      });
    }, section);

    return () => ctx.revert();
  }, [steps.length]);

  const handleStepClick = (idx: number, num: string) => {
    setActiveStep(idx);
    if (onOpenStepDetails) {
      onOpenStepDetails(num);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-24 sm:py-32 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 relative z-10"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
            <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
              {CONTENT_CONFIG.PROCESS.SECTION_LABEL}
            </span>
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#252923] tracking-tight font-vazir">
            {CONTENT_CONFIG.PROCESS.TITLE}
          </h2>
          <p className="text-sm sm:text-base text-[#70756D] mt-3 font-light">
            {CONTENT_CONFIG.PROCESS.DESCRIPTION}
          </p>
        </div>

        {/* Desktop: Horizontal Flow */}
        <div className="hidden lg:block relative z-20">
          {/* Base connector line */}
          <div className="absolute top-10 right-10 left-10 h-[1.5px] bg-[#D9D0BC]/60 -z-0">
            {/* Active progress line */}
            <div
              className="h-full bg-[#9CAF88] transition-all duration-700 origin-right"
              style={{
                width: `${((activeStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const isActive = idx <= activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div
                  key={step.num}
                  onClick={() => handleStepClick(idx, step.num)}
                  className="flex flex-col items-center text-center cursor-pointer group"
                  role="button"
                  tabIndex={0}
                  aria-label={`مشاهده راهنمای مرحله ${step.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStepClick(idx, step.num);
                    }
                  }}
                >
                  {/* Step Circle Indicator */}
                  <div
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-500 bg-[#E9EFE0] shadow-xs ${
                      isCurrent
                        ? 'border-[#9CAF88] shadow-md scale-105 ring-4 ring-[#9CAF88]/15'
                        : isActive
                        ? 'border-[#344236] text-[#344236]'
                        : 'border-[#D9D0BC] text-[#70756D]/50'
                    }`}
                  >
                    <span
                      className={`text-lg font-bold font-editorial ${
                        isCurrent ? 'text-[#344236]' : isActive ? 'text-[#344236]' : 'text-[#70756D]/60'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span className="text-[9px] font-editorial tracking-wider text-[#70756D]/70">
                      STEP
                    </span>
                  </div>

                  {/* Step Title & Description */}
                  <h3
                    className={`text-lg font-bold mt-6 mb-2 transition-colors duration-300 ${
                      isCurrent ? 'text-[#344236]' : 'text-[#252923]'
                    }`}
                  >
                    {step.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-[#70756D] leading-relaxed font-light">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile & Tablet: Vertical Timeline */}
        <div className="lg:hidden relative pr-6 sm:pr-8 border-r-2 border-[#D9D0BC]/70 space-y-10 z-20">
          {steps.map((step, idx) => {
            const isCurrent = idx === activeStep;
            return (
              <div
                key={step.num}
                onClick={() => handleStepClick(idx, step.num)}
                className="relative cursor-pointer group"
              >
                <div
                  className={`absolute -right-[31px] sm:-right-[39px] top-1 w-6 h-6 rounded-full border-2 bg-[#E9EFE0] transition-all duration-300 flex items-center justify-center z-10 ${
                    isCurrent
                      ? 'border-[#9CAF88] bg-[#9CAF88]'
                      : 'border-[#D9D0BC]'
                  }`}
                >
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-[#E9EFE0]" />}
                </div>

                <div className="bg-[#E9EFE0] p-5 rounded-2xl border border-[#D9D0BC]/70 shadow-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#9CAF88] font-editorial">
                      {step.enNum}
                    </span>
                    <span className="text-xs text-[#70756D]">•</span>
                    <span className="text-xs font-medium text-[#70756D]">{step.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#252923] mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-[#70756D] leading-relaxed font-light">
                    {step.description}
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
