import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { Phone, ArrowUpLeft } from 'lucide-react';

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

interface FinalCtaProps {
  onOpenConsultation?: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onOpenConsultation }) => {
  return (
    <section className="relative py-24 sm:py-32 md:py-40 bg-transparent border-t border-[#D9D0BC]/40 overflow-hidden z-10">
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#9CAF88]/15 blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#9CAF88]/10 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
        
        {/* Small Brand Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E9EFE0] border border-[#D9D0BC] text-xs font-semibold text-[#70756D] uppercase mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88]" />
          <span>{CONTENT_CONFIG.BRAND.CLINIC_NAME} · {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#252923] tracking-tight leading-tight md:leading-[1.25] mb-6 font-vazir">
          {CONTENT_CONFIG.FINAL_CTA.HEADLINE}
        </h2>

        {/* Supporting text */}
        <p className="text-base sm:text-lg md:text-xl text-[#70756D] leading-relaxed max-w-2xl mx-auto font-light mb-10">
          {CONTENT_CONFIG.FINAL_CTA.DESCRIPTION}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onOpenConsultation}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-all duration-300 text-sm font-medium shadow-md group cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#E9D98A] group-hover:-rotate-12 transition-transform" />
            <span>{CONTENT_CONFIG.FINAL_CTA.PRIMARY_BUTTON}</span>
          </button>

          <a
            href={CONTENT_CONFIG.CONTACT.INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#E9EFE0] border border-[#D9D0BC] text-[#344236] hover:border-[#9CAF88] hover:bg-[#F5F3EA] transition-all duration-300 text-sm font-medium shadow-xs group"
          >
            <InstagramIcon className="w-4 h-4 text-[#9CAF88]" />
            <span>{CONTENT_CONFIG.FINAL_CTA.SECONDARY_BUTTON}</span>
            <ArrowUpLeft className="w-4 h-4 text-[#70756D] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

      </div>
    </section>
  );
};
