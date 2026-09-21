import React from 'react';
import { Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { CLINIC_TEXTS } from '../config/texts';
import { CLINIC_IMAGES } from '../config/images';

interface DoctorSectionProps {
  onOpenConsultation: () => void;
}

export const DoctorSection: React.FC<DoctorSectionProps> = ({ onOpenConsultation }) => {
  return (
    <section id="doctor" className="py-24 md:py-36 bg-rose-wash/80 backdrop-blur-[2px] relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait Column (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-[380px] lg:max-w-none aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(51,38,53,0.14)] border border-[#332635]/15 bg-[#241A27] group">
              <img
                src={CLINIC_IMAGES.DOCTOR_IMAGE}
                alt={`${CLINIC_TEXTS.DOCTOR_NAME} - ${CLINIC_TEXTS.DOCTOR_TITLE}`}
                className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 block"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#332635]/50 via-transparent to-transparent pointer-events-none" />

              {/* Decorative Corner Accents */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-white/70" />
            </div>

            {/* Nested Doctor Badge */}
            <div className="mt-4 sm:absolute sm:-bottom-5 sm:right-6 bg-[#332635] text-[#F7F3EE] px-6 py-3.5 rounded-2xl shadow-xl border border-[#D8B6BE]/25 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#D8B6BE]/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{CLINIC_TEXTS.DOCTOR_NAME}</p>
                <p className="text-xs text-[#D8B6BE]">{CLINIC_TEXTS.DOCTOR_TITLE}</p>
              </div>
            </div>
          </div>

          {/* Editorial Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6 pt-4 lg:pt-0">
            <div>
              <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit'] block mb-2">
                {CLINIC_TEXTS.DOCTOR_SECTION_LABEL}
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
                {CLINIC_TEXTS.DOCTOR_SECTION_TITLE}
              </h2>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-medium text-[#241A27]">
                {CLINIC_TEXTS.DOCTOR_NAME}
              </h3>
              <p className="text-sm font-normal text-[#9B7B8D]">
                {CLINIC_TEXTS.DOCTOR_TITLE}
              </p>
            </div>

            <p className="text-base sm:text-lg text-[#777176] font-light leading-relaxed">
              {CLINIC_TEXTS.DOCTOR_BIO}
            </p>

            {/* Principles of Practice */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#332635]/12">
              <div className="p-5 rounded-2xl bg-mauve-wash/80 border border-[#332635]/8 space-y-2 shadow-xs">
                <span className="text-sm font-semibold text-[#332635] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#9B7B8D]" />
                  {CLINIC_TEXTS.DOCTOR_PRINCIPLE_1_TITLE}
                </span>
                <p className="text-xs text-[#777176] font-light leading-relaxed">
                  {CLINIC_TEXTS.DOCTOR_PRINCIPLE_1_DESC}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-mauve-wash/80 border border-[#332635]/8 space-y-2 shadow-xs">
                <span className="text-sm font-semibold text-[#332635] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#9B7B8D]" />
                  {CLINIC_TEXTS.DOCTOR_PRINCIPLE_2_TITLE}
                </span>
                <p className="text-xs text-[#777176] font-light leading-relaxed">
                  {CLINIC_TEXTS.DOCTOR_PRINCIPLE_2_DESC}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenConsultation}
                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-colors shadow-md cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.DOCTOR_CTA}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
