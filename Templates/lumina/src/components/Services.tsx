import React from 'react';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem } from '../types';
import { Sparkles, ShieldCheck, Layers, Gem, SunMedium, HeartHandshake, ArrowLeft, Clock, Check, MessageCircle } from 'lucide-react';

interface ServicesProps {
  onSelectService: (service: ServiceItem) => void;
  onQuickContact: (serviceTitle: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectService, onQuickContact }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-[#7FE7FF]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-[#7FE7FF]" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-[#7FE7FF]" />;
      case 'Gem':
        return <Gem className="w-6 h-6 text-[#7FE7FF]" />;
      case 'SunMedium':
        return <SunMedium className="w-6 h-6 text-[#7FE7FF]" />;
      case 'HeartHandshake':
      default:
        return <HeartHandshake className="w-6 h-6 text-[#7FE7FF]" />;
    }
  };

  return (
    <section id="services" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 rounded-full bg-[#5DB8FF]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 rounded-full bg-[#7FE7FF]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خدمات تخصصی کلینیک</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            مراقبتی دقیق، متناسب با شما
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            از زیبایی لبخند تا سلامت دندان‌ها، هر درمان با برنامه‌ای متناسب با نیاز شما انجام می‌شود.
          </p>
        </div>

        {/* 6 Luxury Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {SERVICES_DATA.map((service, index) => (
            <div
              key={service.id}
              onClick={() => onSelectService(service)}
              className="group relative rounded-3xl p-7 sm:p-8 bg-gradient-to-b from-white/[0.07] to-white/[0.02] hover:from-white/[0.11] hover:to-white/[0.04] border border-white/10 hover:border-[#5DB8FF]/40 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 shadow-lg hover:shadow-[0_20px_40px_rgba(7,17,31,0.8),0_0_30px_rgba(93,184,255,0.15)] flex flex-col justify-between cursor-pointer"
            >
              {/* Card Header Top */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  {/* Icon with glowing box */}
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 border border-[#5DB8FF]/30 flex items-center justify-center group-hover:scale-110 group-hover:border-[#7FE7FF]/70 transition-all duration-300 shadow-[0_0_20px_rgba(93,184,255,0.15)]">
                    {getIcon(service.iconName)}
                  </div>

                  {/* Tag badge & number */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-400 group-hover:text-[#7FE7FF] transition-colors bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
                      {service.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-400 transition-colors font-mono">
                      0{index + 1}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-[#7FE7FF] transition-colors">
                  {service.title}
                </h3>

                {/* Short Description */}
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
                  {service.shortDesc}
                </p>

                {/* Micro info */}
                <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#5DB8FF]" />
                    <span>طول دوره درمان: <strong className="text-slate-300 font-medium">{service.duration}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#7FE7FF]" />
                    <span className="truncate">{service.approach}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Action */}
              <div className="mt-7 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7FE7FF] flex items-center gap-1.5 group-hover:translate-x-[-4px] transition-transform duration-300">
                  <span>مشاهده جزئیات کامل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickContact(service.title);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#5DB8FF]" />
                  <span>مشاوره</span>
                </button>
              </div>

              {/* Hover corner glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#5DB8FF]/10 rounded-tr-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
