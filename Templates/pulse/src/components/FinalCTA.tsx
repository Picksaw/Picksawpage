import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { Phone, ArrowUpLeft } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section
      aria-label="بخش پایانی و ارتباط با کلینیک"
      className="relative py-20 md:py-28 bg-[#0B1F2A] text-[#F7F6F2] overflow-hidden"
    >
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="max-w-7xl mx-auto h-full grid grid-cols-4 border-x border-white">
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
        {/* Subtle Coral Accent Line */}
        <div className="w-12 h-[3px] bg-[#E88B7B] mx-auto mb-6" />

        {/* Small Ice-Blue Editorial Tag */}
        <span className="text-xs font-bold text-[#DDECF0] uppercase tracking-widest font-editorial block mb-4">
          {SITE_CONTENT.FINAL_CTA.LABEL}
        </span>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          {SITE_CONTENT.FINAL_CTA.HEADLINE}
        </h2>

        {/* Supporting Text */}
        <p className="text-sm sm:text-base md:text-lg text-[#DDECF0]/80 max-w-xl mx-auto leading-relaxed mb-10">
          {SITE_CONTENT.FINAL_CTA.SUPPORTING_TEXT}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#E88B7B] text-[#0B1F2A] hover:bg-white text-sm font-bold transition-all duration-200 shadow-lg group"
          >
            <Phone className="w-4 h-4" />
            <span className="flex items-center gap-2">
              <span>{SITE_CONTENT.FINAL_CTA.PRIMARY_BTN}</span>
              <span dir="ltr" className="font-number font-bold">
                ({SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR})
              </span>
            </span>
          </a>

          <a
            href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 bg-[#16394A] text-white hover:bg-[#16394A]/80 border border-white/20 text-sm font-semibold transition-all duration-200 group"
          >
            <span>{SITE_CONTENT.FINAL_CTA.SECONDARY_BTN}</span>
            <ArrowUpLeft className="w-4 h-4 text-[#DDECF0] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
};
