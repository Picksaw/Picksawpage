import React from 'react';
import { CLINIC_INFO } from '../data/content';
import { Phone, Sparkles, ArrowUpLeft, MessageCircle } from 'lucide-react';

interface FinalCTAProps {
  onOpenContact: (topic?: string) => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenContact }) => {
  return (
    <section className="relative py-28 sm:py-36 overflow-hidden bg-gradient-to-b from-[#07111F] via-[#081527] to-[#07111F]">
      {/* Dynamic ambient cyan & blue light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[30rem] rounded-full bg-radial from-[#5DB8FF]/15 via-[#7FE7FF]/5 to-transparent blur-[160px] pointer-events-none animate-pulse-glow" />
      
      {/* Decorative subtle stars / sparkle elements */}
      <div className="absolute top-12 right-1/4 w-1.5 h-1.5 rounded-full bg-[#7FE7FF] shadow-[0_0_8px_#7FE7FF]" />
      <div className="absolute bottom-16 left-1/4 w-2 h-2 rounded-full bg-[#5DB8FF] shadow-[0_0_10px_#5DB8FF]" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-[#5DB8FF]/40 text-xs font-semibold text-[#7FE7FF] shadow-[0_0_20px_rgba(93,184,255,0.2)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>آغاز تجربه متفاوت لبخند</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight max-w-2xl mx-auto">
          لبخند ایده‌آل شما از <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#7FE7FF] via-[#5DB8FF] to-white">
            همین‌جا
          </span> شروع می‌شود.
        </h2>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
          اولین قدم را برای داشتن لبخندی سالم‌تر و مطمئن‌تر بردارید.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {/* Primary CTA */}
          <button
            onClick={() => onOpenContact('رزرو مشاوره نهایی')}
            className="group relative flex items-center justify-center gap-3 px-9 py-4 rounded-2xl text-sm font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] via-[#7FE7FF] to-[#5DB8FF] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_10px_35px_rgba(93,184,255,0.45)] hover:shadow-[0_12px_45px_rgba(127,231,255,0.7)] hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto"
          >
            <MessageCircle className="w-4 h-4 text-[#07111F]" />
            <span>مشاوره و هماهنگی نوبت</span>
            <ArrowUpLeft className="w-4 h-4 text-[#07111F] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-0.5" />
          </button>

          {/* Secondary CTA: Call Clinic */}
          <a
            href={`tel:${CLINIC_INFO.phoneRaw}`}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 w-full sm:w-auto"
          >
            <Phone className="w-4 h-4 text-[#5DB8FF]" />
            <span className="font-mono text-xs text-[#7FE7FF]" dir="ltr">{CLINIC_INFO.phoneDisplay}</span>
          </a>
        </div>

        {/* Small working hours reminder */}
        <p className="text-xs text-slate-400 pt-2 font-medium">
          پاسخگویی سریع در واتس‌اپ و تماس تلفنی
        </p>

      </div>
    </section>
  );
};
