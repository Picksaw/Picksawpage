import React from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Phone, ArrowUpLeft, Sparkles } from 'lucide-react';
import { InstagramIcon } from './Icons';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-16 lg:py-24 relative overflow-hidden" aria-label="دعوت به همراهی">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Soft Blush & Blue Banner Card */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[36px] bg-gradient-to-br from-[#CFE8F3]/60 via-[#F6E3E6] to-[#F0D8DC]/50 border border-[#CFE8F3] p-8 sm:p-14 lg:p-20 text-center shadow-[0_12px_40px_rgba(32,58,67,0.04)]">
          
          {/* Decorative ambient elements */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[#CFE8F3]/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#F0D8DC]/40 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            
            {/* Small Brand Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F6E3E6]/90 border border-[#CFE8F3] text-xs font-semibold text-[#203A43] shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D9A6AE]" />
              <span className="font-latin tracking-widest text-[11px] uppercase">
                {CLINIC_CONFIG.CLINIC_NAME_EN}
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-[#203A43] leading-tight tracking-tight">
              «با خودت، با دقت‌تر رفتار کن.»
            </h2>

            {/* Supporting Text */}
            <p className="text-sm sm:text-base text-[#69767C] max-w-lg mx-auto leading-relaxed">
              برای آشنایی بیشتر با خدمات کلینیک و دریافت اطلاعات، با ما در ارتباط باشید.
            </p>

            {/* Direct Action Buttons (No booking forms) */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              
              {/* Primary: Phone */}
              <a
                href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#203A43] text-[#FFFDFC] text-sm font-semibold hover:bg-[#203A43]/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>تماس با کلینیک</span>
              </a>

              {/* Secondary: Instagram */}
              <a
                href={CLINIC_CONFIG.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3] hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/30 text-sm font-semibold transition-all duration-200"
              >
                <InstagramIcon className="w-4 h-4 text-[#D9A6AE]" />
                <span>اینستاگرام کلینیک</span>
                <ArrowUpLeft className="w-4 h-4 text-[#69767C]" />
              </a>

            </div>

            {/* Direct phone display */}
            <div className="pt-2">
              <span className="text-xs text-[#69767C]">
                پاسخگویی مستقیم در ساعات کاری:&nbsp;
                <span className="font-latin font-bold text-[#203A43]" dir="ltr">
                  {CLINIC_CONFIG.PHONE_DISPLAY}
                </span>
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
