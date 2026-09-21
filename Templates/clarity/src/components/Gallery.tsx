import React from 'react';
import { CLINIC_IMAGES } from '../config/clinicConfig';
import { Eye } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

export const Gallery: React.FC = () => {
  const classNamesMap: Record<number, string> = {
    1: 'lg:col-span-8 lg:row-span-2 aspect-[4/3] lg:aspect-auto min-h-[220px] sm:min-h-[300px] lg:min-h-[380px]',
    2: 'lg:col-span-4 aspect-[4/3]',
    3: 'lg:col-span-4 aspect-[4/3]',
    4: 'lg:col-span-6 aspect-[16/9] sm:aspect-[16/10]',
    5: 'lg:col-span-3 aspect-[4/3] sm:aspect-[16/10]',
    6: 'lg:col-span-3 aspect-[4/3] sm:aspect-[16/10]',
  };

  return (
    <section
      id="gallery"
      className="py-20 lg:py-28 relative bg-[#F6E3E6]"
      aria-label="گالری تصاویر فضای کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
          <div className="space-y-2 text-right">
            <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
              CLINIC ENVIRONMENT
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight">
              فضای کلینیک
            </h2>
            <p className="text-sm text-[#69767C] max-w-lg leading-relaxed">
              محیطی روشن، تمیز و آرامش‌بخش طراحی‌شده برای تجربه مراقبتی دلپذیر و باکیفیت.
            </p>
          </div>
          
          <div className="text-right">
            <span className="text-xs font-latin text-[#69767C] tracking-widest uppercase">
              EXPLORE OUR SPACES
            </span>
          </div>
        </div>

        {/* Asymmetrical 6-image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 sm:gap-6">
          {CLINIC_IMAGES.gallery.map((item) => (
            <div
              key={item.id}
              className={`group relative w-full min-w-0 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#E4F0F6] border border-[#CFE8F3]/80 hover:border-[#9FCFE0] transition-all duration-300 shadow-2xs ${classNamesMap[item.id] || 'lg:col-span-4'}`}
            >
              <OptimizedImage
                src={item.src}
                webpSrc={item.webpSrc}
                fallbackSrc={item.fallbackSrc}
                alt={item.alt}
                className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {/* Gradient overlay on hover/mobile */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#203A43]/70 via-[#203A43]/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none z-20" />

              {/* Caption Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-right flex items-end justify-between pointer-events-none z-30">
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-bold text-[#FFFDFC]">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#CFE8F3]">
                    {item.subtitle}
                  </p>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#F6E3E6]/20 backdrop-blur-sm flex items-center justify-center text-[#FFFDFC] opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
