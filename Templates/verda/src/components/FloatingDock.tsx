import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { Phone, MessageCircle } from 'lucide-react';

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

export const FloatingDock: React.FC = () => {
  return (
    <aside
      aria-label="راه‌های ارتباط سریع"
      className="fixed z-40 transition-all duration-300
        /* Desktop: bottom-right floating bar */
        md:bottom-6 md:right-8 md:left-auto md:w-auto
        /* Mobile: fixed bottom center pill */
        bottom-4 right-4 left-4 flex justify-center"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-[#E9EFE0]/95 backdrop-blur-md border border-[#D9D0BC]/80 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
        {/* Instagram Button */}
        <a
          href={CONTENT_CONFIG.CONTACT.INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="صفحه اینستاگرام وردا"
          className="group relative flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-[#344236] hover:bg-[#9CAF88]/20 hover:text-[#344236] transition-all duration-200 active:scale-95"
        >
          <InstagramIcon className="w-4 h-4 text-[#344236] transition-transform duration-200 group-hover:scale-110" />
          <span className="text-xs font-medium hidden sm:inline-block">اینستاگرام</span>
        </a>

        {/* Subtle divider */}
        <span className="h-4 w-px bg-[#D9D0BC]/60"></span>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/${CONTENT_CONFIG.CONTACT.WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="گفتگو در واتساپ"
          className="group relative flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-[#344236] hover:bg-[#9CAF88]/20 hover:text-[#344236] transition-all duration-200 active:scale-95"
        >
          <MessageCircle className="w-4 h-4 text-[#344236] transition-transform duration-200 group-hover:scale-110" />
          <span className="text-xs font-medium hidden sm:inline-block">واتساپ</span>
        </a>

        {/* Subtle divider */}
        <span className="h-4 w-px bg-[#D9D0BC]/60"></span>

        {/* Phone Button */}
        <a
          href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
          aria-label={`تماس تلفنی با ${CONTENT_CONFIG.BRAND.CLINIC_NAME}`}
          className="group relative flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 rounded-full bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-all duration-200 active:scale-95 shadow-xs"
        >
          <Phone className="w-3.5 h-3.5 text-[#E9D98A] transition-transform duration-200 group-hover:-rotate-12" />
          <span className="text-xs font-medium">تماس</span>
        </a>
      </div>
    </aside>
  );
};
