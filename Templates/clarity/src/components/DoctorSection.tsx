import React from 'react';
import { CLINIC_CONFIG, CLINIC_IMAGES } from '../config/clinicConfig';
import { UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface DoctorSectionProps {
  onNavigate?: (targetId: string) => void;
}

export const DoctorSection: React.FC<DoctorSectionProps> = ({ onNavigate }) => {
  const handleConsultClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('#contact');
    } else {
      const el = document.querySelector('#contact');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="doctor"
      className="py-20 lg:py-28 relative bg-[#E4F0F6]"
      aria-label="درباره پزشک و رویکرد تخصصی کلینیک"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Doctor Portrait Column */}
          <div className="lg:col-span-5 min-w-0 relative flex justify-center">
            <div className="relative w-full max-w-xs sm:max-w-sm lg:max-w-none">
              
              {/* Soft decorative background tint */}
              <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-full h-full rounded-[30px] bg-[#CFE8F3]/50 border border-[#9FCFE0]/30 -z-10" />
              <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-full h-full rounded-[30px] bg-[#F0D8DC]/40 -z-10" />

              {/* Portrait Frame with fixed aspect ratio */}
              <div className="relative w-full overflow-hidden rounded-[24px] sm:rounded-[26px] bg-[#F6E3E6] border border-[#CFE8F3] shadow-[0_12px_35px_rgba(32,58,67,0.06)] aspect-[3/4]">
                <OptimizedImage
                  src={CLINIC_IMAGES.doctor.src}
                  webpSrc={CLINIC_IMAGES.doctor.webpSrc}
                  fallbackSrc={CLINIC_IMAGES.doctor.fallbackSrc}
                  alt={`${CLINIC_CONFIG.DOCTOR_NAME} - ${CLINIC_CONFIG.DOCTOR_TITLE}`}
                  className="w-full h-full object-cover object-top"
                />
                
                {/* Clean gradient overlay at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#203A43]/40 via-transparent to-transparent pointer-events-none z-20" />
                
                {/* Floating badge inside portrait */}
                <div className="absolute bottom-3.5 right-3.5 left-3.5 sm:bottom-4 sm:right-4 sm:left-4 p-3 rounded-xl bg-[#F6E3E6]/95 backdrop-blur-md border border-[#CFE8F3] text-right z-30">
                  <span className="text-xs font-bold text-[#203A43] block">
                    {CLINIC_CONFIG.DOCTOR_NAME}
                  </span>
                  <span className="text-[11px] text-[#69767C] block mt-0.5">
                    {CLINIC_CONFIG.DOCTOR_TITLE}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Doctor Biography & Philosophy Column */}
          <div className="lg:col-span-7 min-w-0 text-right space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CFE8F3]/60 border border-[#9FCFE0]/40 text-xs font-semibold text-[#203A43]">
              <UserCheck className="w-3.5 h-3.5" />
              <span>پزشک و مشاور کلینیک</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight">
                {CLINIC_CONFIG.DOCTOR_NAME}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-[#D9A6AE]">
                {CLINIC_CONFIG.DOCTOR_TITLE}
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#69767C] leading-relaxed font-normal">
              {CLINIC_CONFIG.DOCTOR_BIO}
            </p>

            {/* Core Values checklist */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-[#203A43]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9FCFE0] shrink-0" />
                <span>بررسی اختصاصی ساختار پوست</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9FCFE0] shrink-0" />
                <span>بهره‌گیری از تکنیک‌های کم‌تهاجمی</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9FCFE0] shrink-0" />
                <span>مشاوره شفاف پیش از هر تصمیم</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#9FCFE0] shrink-0" />
                <span>پیگیری مستمر روند بهبود</span>
              </div>
            </div>

            {/* Direct Contact Button */}
            <div className="pt-4">
              <a
                href="#contact"
                onClick={handleConsultClick}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#203A43] text-[#FFFDFC] text-xs sm:text-sm font-semibold hover:bg-[#203A43]/90 transition-all duration-200 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#CFE8F3]" />
                <span>درخواست مشاوره حضوری</span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
