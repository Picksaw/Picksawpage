import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { IMAGE_CONFIG } from "../config/imageConfig";
import { Sparkles, ShieldCheck, ArrowUpLeft } from "lucide-react";

interface DoctorSectionProps {
  onOpenDoctorModal?: () => void;
}

export const DoctorSection: React.FC<DoctorSectionProps> = ({ onOpenDoctorModal }) => {
  return (
    <section
      id="doctor"
      className="py-16 md:py-24 bg-[#F7F6F2] border-b border-[#0B1F2A]/10"
      aria-label="معرفی پزشک و رویکرد تخصصی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Split Grid Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left Column: Doctor Portrait Image */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              {/* Outer Architectural Framing Line */}
              <div className="absolute -inset-2 sm:-inset-3 border border-[#0B1F2A]/12 pointer-events-none" />

              {/* Doctor Image Container */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#16394A]">
                <img
                  src={IMAGE_CONFIG.DOCTOR_PORTRAIT.src}
                  alt={IMAGE_CONFIG.DOCTOR_PORTRAIT.alt}
                  onError={(e) => {
                    // Fallback if local image not ready
                    (e.currentTarget as HTMLImageElement).src = IMAGE_CONFIG.DOCTOR_PORTRAIT.fallbackSrc;
                  }}
                  className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-500"
                  loading="lazy"
                />

                {/* Subtle Inner Border */}
                <div className="absolute inset-0 border border-white/10 pointer-events-none" />
              </div>

              {/* Small Tag on Image */}
              <div className="absolute bottom-4 right-4 bg-[#0B1F2A] text-white px-3.5 py-1.5 text-xs font-semibold flex items-center gap-2 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E88B7B]" />
                <span>{SITE_CONTENT.DOCTOR_SECTION.BADGE_LABEL}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Doctor Information */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            {/* Small Latin Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-[#E88B7B]" />
              <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
                {SITE_CONTENT.DOCTOR_SECTION.LABEL}
              </span>
            </div>

            {/* Doctor Name */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0B1F2A] tracking-tight mb-3">
              {SITE_CONTENT.DOCTOR_SECTION.NAME}
            </h2>

            {/* Doctor Title */}
            <p className="text-sm sm:text-base font-semibold text-[#16394A] mb-6 flex items-center gap-2">
              <span>{SITE_CONTENT.DOCTOR_SECTION.TITLE}</span>
            </p>

            {/* Doctor Bio */}
            <p className="text-sm sm:text-base text-[#0B1F2A]/80 leading-relaxed sm:leading-loose mb-6">
              {SITE_CONTENT.DOCTOR_SECTION.BIO}
            </p>

            {/* Doctor Philosophy Modal Button */}
            <button
              type="button"
              onClick={onOpenDoctorModal}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0B1F2A] hover:text-[#E88B7B] underline underline-offset-4 mb-6 transition-colors"
            >
              <span>{SITE_CONTENT.DOCTOR_SECTION.VIEW_PHILOSOPHY_BTN}</span>
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </button>

            {/* Thin Horizontal Divider */}
            <div className="w-full h-[1px] bg-[#0B1F2A]/15 my-4" />

            {/* Statement Callout */}
            <div className="flex items-start gap-3.5 p-4 bg-[#EEF5F7] border border-[#0B1F2A]/8">
              <Sparkles className="w-5 h-5 text-[#E88B7B] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm sm:text-base font-bold text-[#0B1F2A] mb-1">
                  «{SITE_CONTENT.DOCTOR_SECTION.STATEMENT}»
                </p>
                <span className="text-xs text-[#7B858A]">
                  {SITE_CONTENT.DOCTOR_SECTION.STATEMENT_SUB}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
