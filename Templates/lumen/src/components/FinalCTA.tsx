import React from 'react';
import { Phone, ArrowUpLeft, Sparkles } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

interface FinalCTAProps {
  onOpenConsultation: () => void;
}

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

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenConsultation }) => {
  return (
    <section className="py-24 md:py-36 bg-[#332635]/92 backdrop-blur-[2px] text-[#F7F3EE] relative overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest text-[#D8B6BE] bg-rose/15 border border-[#D8B6BE]/25 font-['Outfit'] uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{CLINIC_TEXTS.FINAL_CTA_LABEL}</span>
        </div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.15] text-[#F7F3EE] tracking-tight">
          {CLINIC_TEXTS.FINAL_CTA_HEADLINE_1} <span className="font-normal text-[#D8B6BE]">{CLINIC_TEXTS.FINAL_CTA_HEADLINE_2}</span>
        </h2>

        <p className="text-base sm:text-lg md:text-xl text-[#F7F3EE]/80 font-light max-w-xl mx-auto leading-relaxed">
          {CLINIC_TEXTS.FINAL_CTA_SUBTEXT}
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          {/* Primary CTA */}
          <button
            type="button"
            onClick={onOpenConsultation}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full text-sm font-semibold bg-rose-wash text-[#332635] hover:bg-[#D8B6BE] transition-all duration-300 shadow-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
          >
            <Sparkles className="w-4 h-4 text-[#332635]" />
            <span>{CLINIC_TEXTS.FINAL_CTA_PRIMARY}</span>
          </button>

          {/* Secondary Direct Phone */}
          <a
            href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-medium bg-transparent text-[#F7F3EE] border border-[#F7F3EE]/25 hover:border-[#F7F3EE] hover:bg-rose/15 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
          >
            <Phone className="w-4 h-4 text-[#D8B6BE]" />
            <span>{CLINIC_TEXTS.FINAL_CTA_PHONE}</span>
          </a>

          {/* Tertiary Instagram */}
          <a
            href={CLINIC_CONFIG.INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-6 py-4 rounded-full text-sm font-medium bg-transparent text-[#F7F3EE]/80 hover:text-white transition-colors"
          >
            <InstagramIcon className="w-4 h-4 text-[#D8B6BE]" />
            <span>{CLINIC_TEXTS.FINAL_CTA_INSTAGRAM}</span>
            <ArrowUpLeft className="w-4 h-4 text-[#D8B6BE]" />
          </a>
        </div>
      </div>
    </section>
  );
};
