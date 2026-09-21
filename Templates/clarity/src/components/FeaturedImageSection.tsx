import React from 'react';
import { CLINIC_IMAGES } from '../config/clinicConfig';
import { OptimizedImage } from './OptimizedImage';

export const FeaturedImageSection: React.FC = () => {
  return (
    <section
      className="py-16 lg:py-24 relative overflow-hidden bg-[#E4F0F6]"
      aria-label="بیانیه هویت و دقت کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Large Image (approx 65% width = 8 cols on desktop) */}
          <div className="lg:col-span-8 min-w-0 order-2 lg:order-1">
            <div className="relative w-full overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[32px] bg-[#F6E3E6] border border-[#CFE8F3] shadow-[0_12px_40px_rgba(32,58,67,0.05)] aspect-[16/10] sm:aspect-[16/9]">
              <OptimizedImage
                src={CLINIC_IMAGES.featured.src}
                webpSrc={CLINIC_IMAGES.featured.webpSrc}
                fallbackSrc={CLINIC_IMAGES.featured.fallbackSrc}
                alt={CLINIC_IMAGES.featured.alt}
                className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#203A43]/20 via-transparent to-transparent pointer-events-none z-20" />
            </div>
          </div>

          {/* Statement and Small Label (approx 35% width = 4 cols on desktop) */}
          <div className="lg:col-span-4 min-w-0 order-1 lg:order-2 text-right space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F0D8DC]/50 border border-[#D9A6AE]/40 text-xs font-semibold text-[#203A43]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D9A6AE]" />
              <span>دقت در جزئیات</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-[1.85rem] font-bold text-[#203A43] leading-relaxed tracking-tight">
              «قرار نیست متفاوت به نظر برسید.
              <br />
              <span className="text-[#203A43]/85 font-medium mt-1 block">
                قرار است بهترین نسخه طبیعی خودتان باشید.»
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-[#69767C] leading-relaxed pt-2">
              هدف ما در کلاریتی، پرهیز از الگوهای یکنواخت و تمرکز بر هماهنگی، درخشش و اصالت خطوط چهره است.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
