import React from 'react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { scrollToSection } from '../hooks/useSmoothScroll';
import { Logo } from './Logo';

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

export const Footer: React.FC = () => {
  const navLinks = [
    { label: CLINIC_TEXTS.NAV_HOME, href: 'hero' },
    { label: CLINIC_TEXTS.NAV_SERVICES, href: 'services' },
    { label: CLINIC_TEXTS.NAV_DOCTOR, href: 'doctor' },
    { label: CLINIC_TEXTS.NAV_GALLERY, href: 'gallery' },
    { label: CLINIC_TEXTS.NAV_PROCESS, href: 'process' },
    { label: CLINIC_TEXTS.NAV_CONTACT, href: 'contact' },
  ];

  return (
    <footer className="bg-[#241A27]/92 backdrop-blur-[3px] text-[#F7F3EE] pt-20 pb-28 md:pb-20 border-t border-white/10" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand & Summary (5 cols) */}
          <div className="md:col-span-5 space-y-5">
            <Logo variant="light" size="md" showTagline />

            <p className="text-xs sm:text-sm text-[#F7F3EE]/70 font-light leading-relaxed max-w-sm">
              {CLINIC_TEXTS.BRAND_SUBTITLE}. رویکرد ما مبتنی بر حفظ اصالت چهره، ارزیابی علمی و ارائه مراقبت‌های شخصی‌سازی‌شده است.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={CLINIC_CONFIG.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-rose/10 hover:bg-rose/25 flex items-center justify-center text-[#D8B6BE] transition-colors"
                aria-label="صفحه اینستاگرام لومن"
              >
                <InstagramIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Nav (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D8B6BE] font-['Outfit']">
              {CLINIC_TEXTS.FOOTER_NAV_HEADING}
            </p>
            <ul className="space-y-2.5">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.href)}
                    className="text-xs sm:text-sm text-[#F7F3EE]/75 hover:text-white transition-colors cursor-pointer text-right"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details (4 cols) */}
          <div className="md:col-span-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-[#D8B6BE] font-['Outfit']">
              {CLINIC_TEXTS.FOOTER_INFO_HEADING}
            </p>
            <p className="text-xs sm:text-sm text-[#F7F3EE]/80 leading-relaxed font-light">
              {CLINIC_CONFIG.ADDRESS}
            </p>
            <div className="space-y-1.5 text-xs pt-1">
              <a
                href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
                className="text-[#F7F3EE]/90 hover:text-[#D8B6BE] font-mono dir-ltr block text-right transition-colors"
              >
                {CLINIC_CONFIG.PHONE_NUMBER}
              </a>
              <a
                href={`tel:${CLINIC_CONFIG.MOBILE_NUMBER_RAW}`}
                className="text-[#F7F3EE]/90 hover:text-[#D8B6BE] font-mono dir-ltr block text-right transition-colors"
              >
                {CLINIC_CONFIG.MOBILE_NUMBER}
              </a>
            </div>
            <p className="text-[11px] text-[#F7F3EE]/55 pt-1">
              {CLINIC_CONFIG.WORKING_HOURS}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F7F3EE]/50">
          <p>© {new Date().getFullYear()} {CLINIC_CONFIG.CLINIC_NAME}. {CLINIC_TEXTS.FOOTER_COPYRIGHT}</p>
          <p className="font-light">
            {CLINIC_TEXTS.FOOTER_DESIGN_BY} <span className="text-[#D8B6BE] font-medium font-['Outfit']">{CLINIC_TEXTS.FOOTER_DESIGN_STUDIO}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
