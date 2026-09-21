import React from 'react';
import { ShieldCheck, Wind, Sparkles, MessageSquareHeart } from 'lucide-react';
import { CLINIC_TEXT } from '../config/clinicText';

const TRUST_ICONS = [ShieldCheck, Wind, Sparkles, MessageSquareHeart];

export const TrustStrip: React.FC = () => {
  return (
    <section className="relative z-10 -mt-2 mb-8" aria-label="ویژگی‌های کلیدی کلینیک کلاریتی">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="rounded-2xl sm:rounded-3xl bg-[#F6E3E6] border border-[#CFE8F3] shadow-[0_4px_25px_rgba(32,58,67,0.03)] py-6 sm:py-7 px-6 sm:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#CFE8F3]/50">
            {CLINIC_TEXT.trust.map((point, index) => {
              const Icon = TRUST_ICONS[index] || ShieldCheck;
              return (
                <div
                  key={point.id}
                  className="flex items-center gap-4 pt-4 sm:pt-0 first:pt-0 sm:px-4 first:px-0"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-[#CFE8F3]/50 border border-[#9FCFE0]/40 flex items-center justify-center text-[#203A43]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col text-right">
                    <h2 className="text-sm font-bold text-[#203A43] leading-snug">
                      {point.title}
                    </h2>
                    <p className="text-xs text-[#69767C] mt-0.5 leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
