import React from 'react';
import { Sparkles, MessageSquare, Compass, HeartHandshake } from 'lucide-react';
import { CLINIC_TEXT } from '../config/clinicText';

const STEP_ICONS = [MessageSquare, Compass, Sparkles, HeartHandshake];

export const Process: React.FC = () => {
  return (
    <section
      id="process"
      className="py-20 lg:py-28 relative bg-[#E4F0F6]"
      aria-label="مراحل مراجعه و مراقبت در کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="text-right max-w-xl mb-16 lg:mb-20">
          <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
            {CLINIC_TEXT.process.sectionSub}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight mt-2">
            {CLINIC_TEXT.process.sectionTitle}
          </h2>
          <p className="text-sm text-[#69767C] mt-2 leading-relaxed">
            {CLINIC_TEXT.process.sectionDesc}
          </p>
        </div>

        {/* Process Steps: Horizontal on Desktop, Vertical on Mobile */}
        <div className="relative">
          
          {/* Subtle connecting line across desktop */}
          <div className="hidden lg:block absolute top-1/2 -translate-y-8 right-12 left-12 h-[1.5px] bg-[#CFE8F3] -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 relative z-10">
            {CLINIC_TEXT.process.steps.map((step, index) => {
              const Icon = STEP_ICONS[index] || Sparkles;
              return (
                <div
                  key={step.numEn}
                  className="group relative flex flex-col items-start text-right p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#F6E3E6] border border-[#CFE8F3] hover:border-[#9FCFE0] shadow-[0_4px_20px_rgba(32,58,67,0.03)] hover:shadow-[0_8px_30px_rgba(32,58,67,0.06)] transition-all duration-300"
                >
                  {/* Step Number Badge */}
                  <div className="w-full flex items-center justify-between mb-6">
                    <span className="font-latin text-2xl font-extrabold text-[#9FCFE0] group-hover:text-[#203A43] transition-colors">
                      {step.numEn}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#CFE8F3]/50 text-[#203A43] flex items-center justify-center group-hover:bg-[#F0D8DC]/50 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-[#203A43] mb-2">
                    {step.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-[#69767C] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
