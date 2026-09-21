import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG, SocialImageItem } from '../config/images.config';
import { ArrowUpLeft } from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const InstagramSection: React.FC = () => {
  return (
    <section id="social" className="py-24 sm:py-32 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#D9D0BC]/60">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
              <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                {CONTENT_CONFIG.INSTAGRAM.SECTION_LABEL}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#252923] tracking-tight font-vazir">
              {CONTENT_CONFIG.INSTAGRAM.TITLE}
            </h2>
          </div>

          <div className="mt-4 md:mt-0">
            <a
              href={CONTENT_CONFIG.INSTAGRAM.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#344236] bg-[#E9EFE0] text-[#344236] hover:bg-[#344236] hover:text-[#FBFAF4] transition-all duration-300 text-xs sm:text-sm font-medium shadow-xs group"
            >
              <InstagramIcon className="w-4 h-4 text-[#9CAF88] group-hover:text-[#E9D98A] transition-colors" />
              <span>{CONTENT_CONFIG.INSTAGRAM.BUTTON_TEXT}</span>
              <ArrowUpLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* 6-Item Social Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 relative z-20">
          {IMAGES_CONFIG.SOCIAL_IMAGES.map((item: SocialImageItem) => (
            <a
              key={item.id}
              href={CONTENT_CONFIG.INSTAGRAM.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-[#E9EFE0] border border-[#D9D0BC]/80 block shadow-xs z-10"
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500 ease-out"
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#344236]/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-3 text-center text-[#FBFAF4]">
                <InstagramIcon className="w-5 h-5 text-[#E9D98A] mb-2 transform scale-90 group-hover:scale-100 transition-transform" />
                <p className="text-[11px] leading-tight text-[#FBFAF4]/90 font-light line-clamp-3">
                  {item.caption}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom Social Handle */}
        <div className="mt-8 text-center">
          <a
            href={CONTENT_CONFIG.INSTAGRAM.URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-editorial text-sm tracking-wider text-[#70756D] hover:text-[#344236] transition-colors"
          >
            <span>{CONTENT_CONFIG.INSTAGRAM.HANDLE}</span>
          </a>
        </div>

      </div>
    </section>
  );
};
