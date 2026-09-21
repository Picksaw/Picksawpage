import React, { useState } from 'react';
import { ArrowUpLeft, ChevronLeft, Sparkles, MessageSquare, CheckCircle2, Eye } from 'lucide-react';
import { SERVICES_LIST, ServiceItem } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

interface ServicesSectionProps {
  onOpenConsultationWithService: (serviceName: string) => void;
  onOpenServiceDetail: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenConsultationWithService,
  onOpenServiceDetail,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="services" className="py-24 md:py-36 bg-rose-wash/80 backdrop-blur-[2px] relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 pb-8 border-b border-[#332635]/12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#9B7B8D]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit']">
                {CLINIC_TEXTS.SERVICES_SECTION_LABEL}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
              {CLINIC_TEXTS.SERVICES_SECTION_TITLE} <span className="font-normal text-[#241A27]">{CLINIC_TEXTS.BRAND_SHORT_FA}</span>
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm sm:text-base text-[#777176] max-w-md font-light leading-relaxed">
            {CLINIC_TEXTS.SERVICES_SECTION_SUBTEXT}
          </p>
        </div>

        {/* Desktop Split Editorial Index & Interactive Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Services List (7 cols) */}
          <div className="lg:col-span-7 space-y-3" role="tablist" aria-label="فهرست خدمات لومن">
            {SERVICES_LIST.map((service, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={service.id}
                  role="tab"
                  id={`service-tab-${index}`}
                  aria-selected={isActive}
                  aria-controls={`service-panel-${index}`}
                  tabIndex={0}
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveIndex(index);
                    }
                  }}
                  className={`group relative p-6 sm:p-7 rounded-3xl transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? 'bg-[#332635] text-[#F7F3EE] border-[#332635] shadow-xl shadow-[#332635]/15 scale-[1.01]'
                      : 'bg-mauve-wash/70 backdrop-blur-sm text-[#242126] border-[#332635]/10 hover:border-[#332635]/30 hover:bg-[#332635]/[0.03]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-baseline gap-4 sm:gap-6">
                      {/* Number */}
                      <span
                        className={`font-['Outfit'] text-xl sm:text-2xl font-light tracking-wider ${
                          isActive ? 'text-[#D8B6BE]' : 'text-[#9B7B8D]'
                        }`}
                      >
                        {service.number}
                      </span>

                      {/* Content */}
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3
                            className={`text-lg sm:text-xl font-medium tracking-tight ${
                              isActive ? 'text-[#F7F3EE]' : 'text-[#332635]'
                            }`}
                          >
                            {service.name}
                          </h3>
                          <span
                            className={`text-[11px] px-3 py-1 rounded-full font-medium ${
                              isActive
                                ? 'bg-rose/25 text-[#D8B6BE] border border-[#D8B6BE]/20'
                                : 'bg-[#332635]/5 text-[#777176]'
                            }`}
                          >
                            {service.tag}
                          </span>
                        </div>

                        <p
                          className={`text-sm leading-relaxed transition-all duration-300 font-light ${
                            isActive
                              ? 'text-[#F7F3EE]/90 max-h-40 opacity-100 mt-3'
                              : 'text-[#777176] max-h-0 lg:max-h-0 opacity-0 overflow-hidden'
                          }`}
                        >
                          {service.description}
                        </p>

                        {/* Action buttons inside active card */}
                        {isActive && (
                          <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenServiceDetail(service);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#D8B6BE] text-[#332635] hover:bg-rose-wash transition-colors shadow-sm cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهده جزئیات در پنجره</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenConsultationWithService(service.name);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-rose/20 text-white hover:bg-rose/35 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#D8B6BE]" />
                              <span>{CLINIC_TEXTS.HERO_CTA_SECONDARY}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow Indicator */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isActive
                          ? 'bg-[#D8B6BE] text-[#332635] rotate-0 shadow-md'
                          : 'bg-transparent text-[#9B7B8D] -rotate-45 group-hover:bg-[#332635]/5'
                      }`}
                    >
                      <ArrowUpLeft className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Mobile inline image preview */}
                  {isActive && (
                    <div className="lg:hidden mt-5 pt-4 border-t border-white/10">
                      <div className="aspect-[16/9] rounded-2xl overflow-hidden shadow-md border border-white/10 bg-[#241A27]">
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover block"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Visual Preview Panel (5 cols) */}
          <div className="hidden lg:block lg:col-span-5 sticky top-28">
            <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_24px_60px_rgba(51,38,53,0.18)] border border-[#332635]/15 bg-[#241A27]">
              {SERVICES_LIST.map((service, index) => {
                const isSelected = activeIndex === index;
                return (
                  <div
                    key={`preview-${service.id}`}
                    role="tabpanel"
                    id={`service-panel-${index}`}
                    aria-labelledby={`service-tab-${index}`}
                    className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                      isSelected ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover block"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#241A27]/90 via-[#241A27]/30 to-transparent" />

                    {/* Corner Accent */}
                    <div className="absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 border-[#D8B6BE]" />

                    {/* Overlay Meta */}
                    <div className="absolute bottom-0 inset-x-0 p-8 sm:p-10 text-[#F7F3EE] space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
                        <span className="text-xs uppercase tracking-widest text-[#D8B6BE] font-['Outfit'] font-semibold">
                          {service.tag}
                        </span>
                      </div>

                      <h4 className="text-2xl sm:text-3xl font-light text-white leading-tight">
                        {service.name}
                      </h4>

                      <p className="text-xs sm:text-sm text-[#F7F3EE]/85 font-light leading-relaxed">
                        {service.description}
                      </p>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onOpenServiceDetail(service)}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold bg-rose-wash text-[#332635] hover:bg-[#D8B6BE] transition-colors shadow-md cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>مشاهده در پنجره</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#777176] px-3">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9B7B8D]" />
                {CLINIC_TEXTS.SERVICES_APPROVED_LABEL}
              </span>
              <span className="font-['Cinzel'] tracking-widest text-[#9B7B8D] font-semibold">
                {CLINIC_TEXTS.SERVICES_PROTOCOL_LABEL}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
