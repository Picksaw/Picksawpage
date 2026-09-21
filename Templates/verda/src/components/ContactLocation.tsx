import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import {
  Phone,
  Smartphone,
  MapPin,
  Clock,
  MessageCircle,
  Navigation,
  ArrowUpLeft,
} from 'lucide-react';

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

export const ContactLocation: React.FC = () => {
  const mapLinks = CONTENT_CONFIG.CONTACT.MAP_LINKS;

  return (
    <section id="contact" className="py-24 sm:py-32 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 relative z-10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
            <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
              {CONTENT_CONFIG.CONTACT.SECTION_LABEL}
            </span>
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#252923] tracking-tight font-vazir">
            {CONTENT_CONFIG.CONTACT.TITLE}
          </h2>
          <p className="text-sm sm:text-base text-[#70756D] mt-3 font-light">
            {CONTENT_CONFIG.CONTACT.SUBTITLE}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-20">
          
          {/* Main Info Card */}
          <div className="lg:col-span-7 bg-[#E9EFE0] rounded-2xl md:rounded-3xl p-6 sm:p-10 border border-[#D9D0BC]/80 shadow-[0_10px_30px_rgba(52,66,54,0.04)] flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#D9D0BC]/60 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#252923] font-vazir">{CONTENT_CONFIG.BRAND.CLINIC_NAME}</h3>
                  <p className="text-xs font-editorial text-[#70756D] tracking-widest uppercase">
                    {CONTENT_CONFIG.BRAND.CATEGORY}
                  </p>
                </div>
                <div className="w-3 h-3 rounded-full bg-[#9CAF88]" />
              </div>

              {/* Information Rows */}
              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-[#344236]" />
                  </div>
                  <div>
                    <span className="text-xs text-[#70756D] block mb-1">نشانی کلینیک</span>
                    <p className="text-sm sm:text-base text-[#252923] font-medium leading-relaxed">
                      {CONTENT_CONFIG.CONTACT.ADDRESS}
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC]/60 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4 text-[#344236]" />
                  </div>
                  <div>
                    <span className="text-xs text-[#70756D] block mb-1">ساعات کاری</span>
                    <p className="text-sm sm:text-base text-[#252923] font-medium leading-relaxed">
                      {CONTENT_CONFIG.CONTACT.WORKING_HOURS}
                    </p>
                  </div>
                </div>

                {/* Phone & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3 bg-[#F5F3EA] p-4 rounded-xl border border-[#D9D0BC]/50">
                    <Phone className="w-4 h-4 text-[#9CAF88] mt-1 shrink-0" />
                    <div>
                      <span className="text-xs text-[#70756D] block">تلفن کلینیک</span>
                      <a
                        href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
                        className="text-sm font-semibold text-[#252923] hover:text-[#344236] font-editorial"
                      >
                        {CONTENT_CONFIG.CONTACT.PHONE_DISPLAY}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-[#F5F3EA] p-4 rounded-xl border border-[#D9D0BC]/50">
                    <Smartphone className="w-4 h-4 text-[#9CAF88] mt-1 shrink-0" />
                    <div>
                      <span className="text-xs text-[#70756D] block">شماره همراه</span>
                      <a
                        href={`tel:${CONTENT_CONFIG.CONTACT.MOBILE_RAW}`}
                        className="text-sm font-semibold text-[#252923] hover:text-[#344236] font-editorial"
                      >
                        {CONTENT_CONFIG.CONTACT.MOBILE_DISPLAY}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct 3 Action Buttons */}
            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-[#D9D0BC]/60">
              <a
                href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#344236] text-[#FBFAF4] text-xs sm:text-sm font-medium hover:bg-[#252923] transition-colors shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-[#E9D98A]" />
                <span>تماس</span>
              </a>

              <a
                href={`https://wa.me/${CONTENT_CONFIG.CONTACT.WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC] text-[#344236] text-xs sm:text-sm font-medium hover:border-[#9CAF88] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#9CAF88]" />
                <span>واتساپ</span>
              </a>

              <a
                href={CONTENT_CONFIG.CONTACT.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC] text-[#344236] text-xs sm:text-sm font-medium hover:border-[#9CAF88] transition-colors"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-[#9CAF88]" />
                <span>اینستاگرام</span>
              </a>
            </div>
          </div>

          {/* Navigation Buttons Card */}
          <div className="lg:col-span-5 bg-[#E9EFE0] rounded-2xl md:rounded-3xl p-6 sm:p-10 border border-[#D9D0BC]/80 flex flex-col justify-between shadow-[0_10px_30px_rgba(52,66,54,0.04)] z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-[#9CAF88]" />
                <h4 className="text-lg font-bold text-[#252923]">مسیریابی به کلینیک</h4>
              </div>
              <p className="text-xs sm:text-sm text-[#70756D] leading-relaxed mb-6 font-light">
                برای سهولت در دسترسی، می‌توانید موقعیت کلینیک را مستقیماً در نرم‌افزارهای مسیریاب زیر باز کنید:
              </p>

              {/* Exactly Three Navigation Buttons */}
              <div className="space-y-3">
                {mapLinks.map((app) => {
                  if (!app.enabled) {
                    return (
                      <div
                        key={app.name}
                        className="w-full p-4 rounded-xl border border-[#D9D0BC]/40 bg-[#F5F3EA]/50 text-[#70756D]/50 flex items-center justify-between cursor-not-allowed text-sm"
                      >
                        <span className="font-medium">{app.name}</span>
                        <span className="text-xs text-[#70756D]/60">(غیرفعال)</span>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={app.name}
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group w-full p-4 rounded-xl border border-[#D9D0BC] bg-[#F5F3EA] hover:bg-[#344236] hover:text-[#FBFAF4] hover:border-[#344236] transition-all duration-300 flex items-center justify-between text-sm shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Navigation className="w-4 h-4 text-[#9CAF88] group-hover:text-[#E9D98A] transition-colors" />
                        <span className="font-medium text-[#252923] group-hover:text-[#FBFAF4] transition-colors">
                          مسیریابی با {app.name}
                        </span>
                      </div>
                      <ArrowUpLeft className="w-4 h-4 text-[#70756D] group-hover:text-[#FBFAF4] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Note box */}
            <div className="mt-8 pt-6 border-t border-[#D9D0BC]/40">
              <p className="text-xs text-[#70756D] leading-relaxed">
                {CONTENT_CONFIG.CONTACT.NOTE}
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
