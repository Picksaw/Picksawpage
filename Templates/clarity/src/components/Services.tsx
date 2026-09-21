import React, { useState } from 'react';
import { CLINIC_CONFIG, CLINIC_TEXT } from '../config/clinicConfig';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface ServicesProps {
  onNavigate?: (targetId: string) => void;
}

export const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedServiceIndex, setSelectedServiceIndex] = useState<number | null>(null);

  const services = [
    {
      num: '۰۱',
      numEn: '01',
      name: CLINIC_CONFIG.SERVICE_01_NAME,
      desc: CLINIC_CONFIG.SERVICE_01_DESCRIPTION,
      tag: 'سفارشی و متمرکز',
    },
    {
      num: '۰۲',
      numEn: '02',
      name: CLINIC_CONFIG.SERVICE_02_NAME,
      desc: CLINIC_CONFIG.SERVICE_02_DESCRIPTION,
      tag: 'احیا و طراوت',
    },
    {
      num: '۰۳',
      numEn: '03',
      name: CLINIC_CONFIG.SERVICE_03_NAME,
      desc: CLINIC_CONFIG.SERVICE_03_DESCRIPTION,
      tag: 'هماهنگی و تقارن',
    },
    {
      num: '۰۴',
      numEn: '04',
      name: CLINIC_CONFIG.SERVICE_04_NAME,
      desc: CLINIC_CONFIG.SERVICE_04_DESCRIPTION,
      tag: 'سلامت پایدار',
    },
    {
      num: '۰۵',
      numEn: '05',
      name: CLINIC_CONFIG.SERVICE_05_NAME,
      desc: CLINIC_CONFIG.SERVICE_05_DESCRIPTION,
      tag: 'راهنمایی اختصاصی',
    },
  ];

  const handleConsultClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('#contact');
    } else {
      const el = document.querySelector('#contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const openServiceModal = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setSelectedServiceIndex(index);
  };

  const closeServiceModal = () => setSelectedServiceIndex(null);

  const selectedService = selectedServiceIndex !== null ? services[selectedServiceIndex] : null;

  return (
    <section
      id="services"
      className="py-20 lg:py-28 relative bg-[#E4F0F6]"
      aria-label="بخش خدمات کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header (Persian RTL) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 lg:pb-16 border-b border-[#CFE8F3]">
          <div className="space-y-3 max-w-xl text-right">
            <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
              SERVICES & CARE
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight">
              خدمات کلاریتی
            </h2>
            <p className="text-sm sm:text-base text-[#69767C] leading-relaxed">
              خدماتی طراحی‌شده برای مراقبت، زیبایی و سلامت با رویکردی دقیق و شخصی.
            </p>
          </div>

          <div className="text-right shrink-0">
            <a
              href="#contact"
              onClick={handleConsultClick}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#203A43] hover:text-[#203A43]/80 group"
            >
              <span>مشاوره درباره خدمات</span>
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            </a>
          </div>
        </div>

        {/* Vertical Editorial List (NOT a 3-column card grid) */}
        <div className="divide-y divide-[#CFE8F3]/60">
          {services.map((service, index) => {
            const isHovered = hoveredIndex === index;

            return (
              <button
                key={service.numEn}
                onClick={(e) => openServiceModal(e, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative transition-all duration-300 py-8 lg:py-10 px-4 sm:px-6 rounded-2xl w-full text-right ${
                  isHovered ? 'bg-[#F6E3E6] shadow-[0_8px_30px_rgba(32,58,67,0.04)]' : 'bg-transparent'
                }`}
                aria-label={`جزئیات ${service.name}`}
              >
                {/* Subtle animated highlight line on left border (RTL) */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-[#D9A6AE] rounded-full transition-all duration-300 ${
                    isHovered ? 'h-3/4 opacity-100' : 'h-0 opacity-0'
                  }`}
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-center">
                  
                  {/* Service Number & Category Tag */}
                  <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-4">
                    <span className="font-latin text-2xl lg:text-3xl font-bold text-[#9FCFE0] group-hover:text-[#203A43] transition-colors duration-300">
                      {service.numEn}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#CFE8F3]/40 text-[#69767C] group-hover:bg-[#F0D8DC]/40 group-hover:text-[#203A43] transition-colors duration-300">
                      {service.tag}
                    </span>
                  </div>

                  {/* Service Title */}
                  <div className="lg:col-span-4 text-right">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#203A43] transition-transform duration-300 group-hover:translate-x-[-4px]">
                      {service.name}
                    </h3>
                  </div>

                  {/* Service Description */}
                  <div className="lg:col-span-4 text-right">
                    <p className="text-xs sm:text-sm text-[#69767C] leading-relaxed font-normal">
                      {service.desc}
                    </p>
                  </div>

                  {/* Arrow Action */}
                  <div className="lg:col-span-1 flex justify-end">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isHovered
                        ? 'bg-[#203A43] text-[#FFFDFC] -translate-x-1'
                        : 'bg-[#CFE8F3]/50 text-[#203A43]'
                    }`}>
                      <ArrowLeft className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </button>
            );
          })}
        </div>

        {/* Informational Footnote */}
        <div className="mt-12 pt-6 border-t border-[#CFE8F3]/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#69767C]">
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-[#9FCFE0]" />
            <span>تمامی برنامه‌های مراقبتی پس از ارزیابی اولیه در کلینیک تنظیم می‌گردند.</span>
          </div>
          <span className="text-[11px] font-latin">CLARITY CARE PROTOCOL</span>
        </div>

      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#203A43]/60 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div
            className="relative w-full max-w-2xl bg-[#F6E3E6] rounded-[24px] shadow-2xl transform-gpu animate-modal-fade-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-[#D9A6AE]/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#D9A6AE] to-[#CFE8F3]" />
                <h2 className="text-lg sm:text-xl font-bold text-[#203A43]">
                  جزئیات خدمت
                </h2>
              </div>
              <button
                onClick={closeServiceModal}
                className="p-2 rounded-full hover:bg-[#F0D8DC]/50 transition-colors text-[#69767C] hover:text-[#203A43]"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* Service Number */}
                <div className="flex items-center gap-4">
                  <span className="font-latin text-4xl font-bold text-[#D9A6AE]">
                    {selectedService.numEn}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-[#203A43]">
                      {selectedService.name}
                    </h3>
                    <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-[#D9A6AE]/20 text-[#D9A6AE]">
                      {selectedService.tag}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-base text-[#69767C] leading-relaxed pt-4 border-t border-[#CFE8F3]/30">
                  {selectedService.desc}
                </p>

                {/* Additional Info */}
                <div className="pt-4">
                  <h4 className="font-bold text-[#203A43] mb-3">
                    این خدمت شامل چه مواردی است؟
                  </h4>
                  <ul className="space-y-2 text-sm text-[#69767C]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6AE] mt-2 flex-shrink-0" />
                      <span>ارزیابی دقیق وضعیت پوست و نیازهای فردی</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6AE] mt-2 flex-shrink-0" />
                      <span>مشاوره تخصصی با پزشک متخصص</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6AE] mt-2 flex-shrink-0" />
                      <span>تنظیم برنامه مراقبتی شخصی‌سازی شده</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6AE] mt-2 flex-shrink-0" />
                      <span>پیگیری مستمر روند بهبود</span>
                    </li>
                  </ul>
                </div>

                {/* CTA */}
                <div className="pt-6 flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      closeServiceModal();
                      if (onNavigate) onNavigate('#contact');
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D9A6AE] text-[#FFFDFC] text-sm font-semibold hover:bg-[#D9A6AE]/90 transition-all"
                  >
                    رزرو مشاوره
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closeServiceModal}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#F6E3E6] text-[#203A43] border-2 border-[#D9A6AE]/40 hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/40 text-sm font-semibold transition-all"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#D9A6AE]/30 rounded-tl-[24px] pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#D9A6AE]/30 rounded-tr-[24px] pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#D9A6AE]/30 rounded-bl-[24px] pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#D9A6AE]/30 rounded-br-[24px] pointer-events-none" />
          </div>
        </div>
      )}

    </section>
  );
};
