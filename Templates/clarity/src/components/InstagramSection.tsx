import React from 'react';
import { CLINIC_CONFIG, CLINIC_IMAGES } from '../config/clinicConfig';
import { InstagramIcon } from './Icons';
import { ArrowUpLeft } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

export const InstagramSection: React.FC = () => {
  return (
    <section
      className="py-20 lg:py-28 relative bg-[#F6E3E6]"
      aria-label="صفحه اینستاگرام کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Header with CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12">
          <div className="space-y-2 text-right">
            <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
              SOCIAL MEDIA
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight">
              ما را در اینستاگرام ببینید
            </h2>
            <p className="text-sm text-[#69767C]">
              اشتراک‌گذاری نکات مراقبتی، رویدادها و نگاهی به فعالیت‌های روزمره کلینیک
            </p>
          </div>

          <div className="text-right shrink-0">
            <a
              href={CLINIC_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3] hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/30 text-xs sm:text-sm font-semibold transition-all duration-200"
            >
              <InstagramIcon className="w-4 h-4 text-[#D9A6AE]" />
              <span>مشاهده اینستاگرام</span>
              <ArrowUpLeft className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 6 Image Grid Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {CLINIC_IMAGES.instagram.map((item) => (
            <a
              key={item.id}
              href={CLINIC_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full min-w-0 overflow-hidden rounded-xl sm:rounded-2xl bg-[#E4F0F6] border border-[#CFE8F3]/60 aspect-square block"
              aria-label={`پست اینستاگرام: ${item.caption}`}
            >
              <OptimizedImage
                src={item.src}
                webpSrc={item.webpSrc}
                fallbackSrc={item.fallbackSrc}
                alt={item.caption}
                className="w-full h-full object-cover object-center transform group-hover:scale-108 transition-transform duration-500"
              />
              
              {/* Overlay with subtle blush tint */}
              <div className="absolute inset-0 bg-[#203A43]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-3 text-center z-20">
                <InstagramIcon className="w-6 h-6 text-[#FFFDFC] transform scale-75 group-hover:scale-100 transition-transform duration-300" />
              </div>
            </a>
          ))}
        </div>

        {/* Handle badge */}
        <div className="mt-8 text-center">
          <span className="font-latin text-xs font-medium text-[#69767C] tracking-wide">
            {CLINIC_CONFIG.INSTAGRAM_HANDLE}
          </span>
        </div>

      </div>
    </section>
  );
};
