import React from 'react';
import { WHY_LUMINA_ITEMS } from '../data/content';
import { Scan, Sparkles, Eye, ShieldCheck, Check } from 'lucide-react';

export const WhyLumina: React.FC = () => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scan':
        return <Scan className="w-8 h-8 text-[#7FE7FF]" />;
      case 'Sparkle':
        return <Sparkles className="w-8 h-8 text-[#7FE7FF]" />;
      case 'Eye':
      default:
        return <Eye className="w-8 h-8 text-[#7FE7FF]" />;
    }
  };

  return (
    <section id="why-lumina" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20">
      {/* Background radial glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-[#5DB8FF]/8 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>تمایز و استانداردهای کلینیک</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            چرا لومینا؟
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            سه رکن بنیادین در رویکرد درمان و مراقبت دندانپزشکی در لومینا دنتال
          </p>
        </div>

        {/* 3 Large Luxury Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {WHY_LUMINA_ITEMS.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.05] border border-white/10 hover:border-[#5DB8FF]/40 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_50px_rgba(7,17,31,0.9),0_0_30px_rgba(93,184,255,0.2)] flex flex-col justify-between overflow-hidden"
            >
              {/* Animated Internal Glow Blob */}
              <div 
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none"
              />

              <div className="relative z-10">
                {/* Header Icon + Metric Badge */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 border border-[#5DB8FF]/40 flex items-center justify-center group-hover:scale-110 group-hover:border-[#7FE7FF] transition-all duration-300 shadow-[0_0_25px_rgba(93,184,255,0.2)]">
                    {getIcon(item.icon)}
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-[#7FE7FF] bg-[#5DB8FF]/10 border border-[#5DB8FF]/30">
                    {item.metric}
                  </span>
                </div>

                {/* Subtitle & Title */}
                <span className="text-xs font-semibold text-slate-400 block mb-1">
                  {item.subtitle}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 group-hover:text-[#7FE7FF] transition-colors">
                  {item.title}
                </h3>

                {/* Primary Short Text from specification */}
                <p className="text-base font-semibold text-slate-100 leading-relaxed mb-4">
                  «{item.description}»
                </p>

                {/* Extended Details */}
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {item.details}
                </p>
              </div>

              {/* Bottom Subtle Indicator */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Check className="w-4 h-4 text-[#7FE7FF]" />
                  <span>استاندارد لومینا</span>
                </span>
                <span className="font-bold text-slate-600 group-hover:text-slate-400 transition-colors farsi-num">
                  ۰{index + 1}
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
