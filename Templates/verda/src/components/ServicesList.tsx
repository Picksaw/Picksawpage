import React, { useState } from 'react';
import { CONTENT_CONFIG, ServiceDetail } from '../config/content.config';
import { ArrowLeft, Sparkles } from 'lucide-react';

interface ServicesListProps {
  onOpenServiceDetails?: (serviceId: string) => void;
}

export const ServicesList: React.FC<ServicesListProps> = ({ onOpenServiceDetails }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const services: ServiceDetail[] = CONTENT_CONFIG.SERVICES;

  const handleRowClick = (serviceId: string) => {
    if (onOpenServiceDetails) {
      onOpenServiceDetails(serviceId);
    }
  };

  return (
    <section id="services" className="py-24 sm:py-32 md:py-36 bg-transparent relative z-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#D9D0BC]/60">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-4 h-[1.5px] bg-[#9CAF88]"></span>
              <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                OUR SERVICES
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#252923] tracking-tight">
              خدمات ما
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#70756D] max-w-sm mt-3 md:mt-0 font-light">
            خدمات گزیده و دقیق متناسب با استانداردهای نوین زیبایی و مراقبت پوست (جهت مشاهده جزئیات کلیک کنید)
          </p>
        </div>

        {/* Vertical Editorial Service List */}
        <div className="divide-y divide-[#D9D0BC]/60 border-y border-[#D9D0BC]/60 bg-[#E9EFE0]/80 backdrop-blur-xs rounded-2xl overflow-hidden shadow-xs">
          {services.map((service, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={service.id}
                onClick={() => handleRowClick(service.id)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative py-7 sm:py-9 px-6 sm:px-8 transition-all duration-300 cursor-pointer ${
                  isHovered ? 'bg-[#E9EFE0] -translate-y-0.5' : 'bg-[#E9EFE0]/60'
                }`}
                role="button"
                tabIndex={0}
                aria-label={`مشاهده جزئیات خدمت ${service.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(service.id);
                  }
                }}
              >
                {/* Sage expanding accent line on hover */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-1.5 bg-[#9CAF88] transition-all duration-300 ${
                    isHovered ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                  }`}
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center relative z-10">
                  {/* Number */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <span
                      className={`font-editorial text-lg sm:text-xl font-medium transition-colors duration-300 ${
                        isHovered ? 'text-[#344236]' : 'text-[#70756D]/70'
                      }`}
                    >
                      {service.number}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        isHovered ? 'bg-[#E9D98A]' : 'bg-transparent'
                      }`}
                    />
                  </div>

                  {/* Service Title */}
                  <div className="md:col-span-4">
                    <h3
                      className={`text-xl sm:text-2xl font-semibold transition-colors duration-300 flex items-center gap-2 ${
                        isHovered ? 'text-[#344236]' : 'text-[#252923]'
                      }`}
                    >
                      <span>{service.name}</span>
                      {isHovered && (
                        <Sparkles className="w-4 h-4 text-[#9CAF88] animate-pulse" />
                      )}
                    </h3>
                  </div>

                  {/* Short Description */}
                  <div className="md:col-span-5">
                    <p className="text-sm sm:text-base text-[#70756D] leading-relaxed font-light">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="md:col-span-1 flex justify-end">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isHovered
                          ? 'border-[#9CAF88] bg-[#9CAF88]/20 text-[#344236] -translate-x-1 shadow-xs'
                          : 'border-[#D9D0BC]/80 text-[#70756D]'
                      }`}
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Helper footnote */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#70756D]">
            برای مشاهده توضیحات کامل، رویکرد درمانی و شرایط هر خدمت روی ردیف مربوطه کلیک کنید.
          </p>
        </div>
      </div>
    </section>
  );
};
