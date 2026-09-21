import React from 'react';
import { CONSULTATION_TIERS } from '../data/content';
import { ConsultationTier } from '../types';
import { Sparkles, CheckCircle2, Clock, Info, MessageCircle } from 'lucide-react';

interface ConsultationProps {
  onSelectTier: (tier: ConsultationTier) => void;
}

export const ConsultationPlans: React.FC<ConsultationProps> = ({ onSelectTier }) => {
  return (
    <section id="consultation" className="relative py-24 sm:py-32 bg-[#060e1a] overflow-hidden scroll-mt-20">
      {/* Dynamic ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full bg-[#5DB8FF]/10 blur-[170px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مسیرهای بررسی بالینی</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            جلسات مشاوره و ارزیابی تخصصی
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            گزینه مشاوره مناسب خود را انتخاب کنید تا فرآیند درمان با شناختی کامل و دقیق آغاز گردد.
          </p>
        </div>

        {/* 3 Consultation Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {CONSULTATION_TIERS.map((tier) => {
            const isHighlight = tier.isPopular;
            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-8 sm:p-9 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 ${
                  isHighlight
                    ? 'glass-card-highlight border-[#5DB8FF]/60 shadow-[0_20px_50px_rgba(93,184,255,0.25)] lg:-translate-y-3'
                    : 'bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 hover:border-white/25 shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {isHighlight && (
                  <div className="absolute -top-4 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] text-[#07111F] text-xs font-bold shadow-lg">
                    {tier.badge || 'پیشنهاد ویژه کلینیک'}
                  </div>
                )}

                <div>
                  {/* Title & Subtitle */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-black text-white mb-2">
                      {tier.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 font-normal">
                      {tier.subtitle}
                    </p>
                  </div>

                  {/* Timeframe Tag */}
                  <div className="flex items-center gap-2 text-xs text-[#7FE7FF] mb-6 pb-6 border-b border-white/10">
                    <Clock className="w-4 h-4 text-[#5DB8FF]" />
                    <span>مدت زمان جلسه: <strong className="text-white font-semibold">{tier.timeframe}</strong></span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3.5 mb-8">
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      موارد شامل در این جلسه:
                    </span>
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-[#7FE7FF] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Recommended For Box */}
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 mb-8">
                    <span className="text-slate-400 block mb-0.5 font-medium">مناسب برای:</span>
                    <span>{tier.recommendedFor}</span>
                  </div>
                </div>

                {/* Card CTA */}
                <div>
                  <button
                    onClick={() => onSelectTier(tier)}
                    className={`w-full py-4 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 shadow-md ${
                      isHighlight
                        ? 'bg-gradient-to-l from-[#5DB8FF] via-[#7FE7FF] to-[#5DB8FF] text-[#07111F] hover:shadow-[0_8px_30px_rgba(127,231,255,0.6)]'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 hover:border-white/30'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>هماهنگی «{tier.title}»</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer Note */}
        <div className="mt-10 flex items-center justify-center gap-2 text-center text-xs sm:text-sm text-slate-400">
          <Info className="w-4 h-4 text-[#5DB8FF] shrink-0" />
          <span>«هزینه و برنامه درمان پس از بررسی شرایط هر فرد مشخص می‌شود.»</span>
        </div>

      </div>
    </section>
  );
};
