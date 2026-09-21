import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG } from '../config/images.config';
import { UserCheck, Sparkles } from 'lucide-react';

interface DoctorSectionProps {
  onOpenDoctorDetails?: () => void;
}

export const DoctorSection: React.FC<DoctorSectionProps> = ({ onOpenDoctorDetails }) => {
  return (
    <section id="doctor" className="py-24 sm:py-32 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 relative z-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
            <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
              {CONTENT_CONFIG.DOCTOR.SECTION_LABEL}
            </span>
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#252923] tracking-tight font-vazir">
            {CONTENT_CONFIG.DOCTOR.TITLE}
          </h2>
        </div>

        {/* Doctor Presentation Card */}
        <div
          onClick={onOpenDoctorDetails}
          className="bg-[#E9EFE0] rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-14 border border-[#D9D0BC]/80 shadow-[0_10px_30px_rgba(52,66,54,0.04)] relative z-20 cursor-pointer group hover:border-[#9CAF88]/80 transition-all duration-300"
          role="button"
          tabIndex={0}
          aria-label="مشاهده بیوگرافی و اصول درمانی پزشک"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenDoctorDetails && onOpenDoctorDetails();
            }
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Doctor Image */}
            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-[#F5F3EA] border border-[#D9D0BC] shadow-md z-10 group-hover:scale-[1.02] transition-transform duration-500">
                <img
                  src={IMAGES_CONFIG.DOCTOR_IMAGE}
                  alt={IMAGES_CONFIG.DOCTOR_IMAGE_ALT}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#252923]/20 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Doctor Info */}
            <div className="md:col-span-7 flex flex-col justify-center text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9CAF88]/15 border border-[#9CAF88]/30 text-[#344236] text-xs font-medium w-fit mb-4">
                <UserCheck className="w-3.5 h-3.5 text-[#344236]" />
                <span>{CONTENT_CONFIG.DOCTOR.BADGE}</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold text-[#252923] mb-2 font-vazir flex items-center gap-3">
                <span>{CONTENT_CONFIG.DOCTOR.NAME}</span>
                <Sparkles className="w-4 h-4 text-[#9CAF88] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>

              <p className="text-sm sm:text-base font-medium text-[#70756D] mb-6 font-editorial">
                {CONTENT_CONFIG.DOCTOR.TITLE_EN}
              </p>

              <div className="w-12 h-[1.5px] bg-[#9CAF88] mb-6"></div>

              <p className="text-sm sm:text-base text-[#70756D] leading-relaxed font-light mb-8">
                {CONTENT_CONFIG.DOCTOR.BIO}
              </p>

              {/* Clinic Philosophy Signature Note */}
              <div className="bg-[#F5F3EA] p-4 rounded-xl border border-[#D9D0BC]/60 flex items-center justify-between group-hover:bg-[#F1F5E9] transition-colors">
                <span className="text-xs sm:text-sm text-[#344236] font-medium">
                  {CONTENT_CONFIG.DOCTOR.PHILOSOPHY_NOTE}
                </span>
                <span className="font-editorial text-xs text-[#9CAF88] font-bold">
                  {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
