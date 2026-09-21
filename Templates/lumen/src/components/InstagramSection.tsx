import React from 'react';
import { ArrowUpLeft, Heart } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const InstagramSection: React.FC = () => {
  return (
    <section className="py-24 md:py-32 bg-rose-wash/80 backdrop-blur-[2px] relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 pb-6 border-b border-[#332635]/12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <InstagramIcon className="w-4 h-4 text-[#9B7B8D]" />
              <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit']">
                {CLINIC_TEXTS.INSTAGRAM_LABEL}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-[#332635]">
              {CLINIC_TEXTS.INSTAGRAM_TITLE}
            </h2>
          </div>

          <div className="mt-4 sm:mt-0">
            <a
              href={CLINIC_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-all duration-300 shadow-sm"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-[#D8B6BE]" />
              <span>{CLINIC_TEXTS.INSTAGRAM_CTA}</span>
              <ArrowUpLeft className="w-3.5 h-3.5 text-[#D8B6BE]" />
            </a>
          </div>
        </div>

        {/* 6 Photo Grid with 100% border coverage */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CLINIC_CONFIG.INSTAGRAM_POSTS.map((post) => (
            <a
              key={post.id}
              href={CLINIC_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#241A27] shadow-xs border border-[#332635]/12 block transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <img
                src={post.imageUrl}
                alt={post.caption}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 block"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#332635]/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5 text-white">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-[#D8B6BE]">{CLINIC_CONFIG.INSTAGRAM_HANDLE}</span>
                  <InstagramIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[11px] font-light text-center leading-snug line-clamp-2">
                  {post.caption}
                </p>
                <div className="flex justify-center text-[10px] text-[#D8B6BE]">
                  <Heart className="w-3.5 h-3.5 fill-[#D8B6BE]" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
