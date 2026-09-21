import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
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

export const FloatingContactDock: React.FC = () => {
  return (
    <aside
      aria-label="راه‌های ارتباط سریع"
      className="fixed z-40 transition-all duration-300
        /* Desktop: bottom-right */
        bottom-6 right-6
        /* Mobile: bottom edge center-docked or bottom-4 right-4 */
        max-sm:bottom-4 max-sm:right-4 max-sm:left-4 max-sm:flex max-sm:justify-center"
    >
      <div className="flex items-center gap-2 p-2 bg-[#332635]/95 backdrop-blur-md border border-[#D8B6BE]/25 rounded-full shadow-[0_12px_32px_rgba(36,26,39,0.28)] transition-transform duration-200 hover:shadow-[0_16px_36px_rgba(36,26,39,0.35)]">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="گفتگو در واتساپ"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-rose/15 text-[#F7F3EE] hover:bg-[#25D366] hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
        >
          <MessageCircle className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">واتساپ</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-normal text-[#F7F3EE] bg-[#241A27] rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity">
            واتساپ
          </span>
        </a>

        {/* Direct Phone */}
        <a
          href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
          aria-label="تماس تلفنی با کلینیک"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#D8B6BE] text-[#332635] hover:bg-rose-wash transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
        >
          <Phone className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">تماس تلفنی</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-normal text-[#F7F3EE] bg-[#241A27] rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity">
            {CLINIC_TEXTS.CONTACT_ACTION_CALL}
          </span>
        </a>

        {/* Instagram */}
        <a
          href={CLINIC_CONFIG.INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="صفحه اینستاگرام لومن"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-rose/15 text-[#F7F3EE] hover:bg-[#E1306C] hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
        >
          <InstagramIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">اینستاگرام</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-normal text-[#F7F3EE] bg-[#241A27] rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity">
            {CLINIC_TEXTS.CONTACT_ACTION_INSTAGRAM}
          </span>
        </a>
      </div>
    </aside>
  );
};
