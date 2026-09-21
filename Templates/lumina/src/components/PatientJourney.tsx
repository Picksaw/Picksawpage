import React from 'react';
import { PATIENT_JOURNEY_STEPS } from '../data/content';
import { Sparkles, Calendar, MessageSquareText, Compass, CheckCircle } from 'lucide-react';

interface PatientJourneyProps {
  onOpenBooking: () => void;
}

export const PatientJourney: React.FC<PatientJourneyProps> = ({ onOpenBooking }) => {
  const getStepIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Calendar className="w-5 h-5 text-[#7FE7FF]" />;
      case 1:
        return <MessageSquareText className="w-5 h-5 text-[#7FE7FF]" />;
      case 2:
        return <Compass className="w-5 h-5 text-[#7FE7FF]" />;
      case 3:
      default:
        return <CheckCircle className="w-5 h-5 text-[#7FE7FF]" />;
    }
  };

  return (
    <section id="journey" className="relative py-24 sm:py-32 bg-[#060e1a] overflow-hidden scroll-mt-20">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 right-1/3 w-[36rem] h-[36rem] rounded-full bg-[#5DB8FF]/8 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مراحل شفاف و بدون دغدغه</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            مسیر شما تا لبخند جدید
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            فرآیندی شفاف، برنامه‌ریزی‌شده و مطمئن از اولین تماس تا تحقق لبخند ایده‌آل شما.
          </p>
        </div>

        {/* Steps Container with Visual Connecting Line */}
        <div className="relative">
          
          {/* Connecting glowing line for desktop */}
          <div className="hidden lg:block absolute top-1/2 right-10 left-10 h-[2px] -translate-y-12 bg-gradient-to-l from-[#5DB8FF]/10 via-[#7FE7FF]/40 to-[#5DB8FF]/10 z-0" />

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {PATIENT_JOURNEY_STEPS.map((step, index) => (
              <div
                key={step.step}
                className="group relative rounded-3xl p-7 bg-gradient-to-b from-white/[0.08] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.04] border border-white/10 hover:border-[#5DB8FF]/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Step Number & Icon Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 border border-[#5DB8FF]/30 flex items-center justify-center group-hover:scale-110 group-hover:border-[#7FE7FF] transition-all duration-300 shadow-[0_0_20px_rgba(93,184,255,0.15)]">
                      {getStepIcon(index)}
                    </div>

                    <span className="text-2xl font-black text-[#5DB8FF]/40 group-hover:text-[#7FE7FF] transition-colors farsi-num">
                      {step.step}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-[#7FE7FF] transition-colors">
                    {step.title}
                  </h3>

                  {/* Primary text from prompt */}
                  <p className="text-sm font-semibold text-slate-200 mb-3">
                    «{step.desc}»
                  </p>

                  {/* Extended description */}
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    {step.details}
                  </p>
                </div>

                {/* Bottom Step Indicator */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>مرحله {index + 1} از ۴</span>
                  <span className="w-2 h-2 rounded-full bg-[#5DB8FF]/40 group-hover:bg-[#7FE7FF] group-hover:shadow-[0_0_8px_#7FE7FF] transition-all" />
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Action button at end of journey */}
        <div className="mt-12 text-center">
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] hover:opacity-90 shadow-lg cursor-pointer transition-all hover:scale-105"
          >
            <Calendar className="w-4 h-4" />
            <span>شروع اولین گام — رزرو آنلاین مشاوره</span>
          </button>
        </div>

      </div>
    </section>
  );
};
