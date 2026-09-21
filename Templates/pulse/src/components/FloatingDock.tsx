import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { Phone, MessageCircle } from "lucide-react";

export const FloatingDock: React.FC = () => {
  return (
    <aside
      aria-label="پل‌های ارتباط سریع"
      className="fixed z-40 transition-all duration-300 bottom-4 sm:bottom-6 right-4 sm:right-6"
    >
      {/* Container with Navy background and crisp borders */}
      <div className="bg-[#0B1F2A] text-[#F7F6F2] shadow-xl border border-[#16394A] p-1 sm:p-1.5 flex items-center gap-1 sm:gap-1.5">
        {/* Phone Button */}
        <a
          href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
          className="relative group flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F7F6F2] hover:text-white transition-all duration-200"
          aria-label={`تماس تلفنی با ${SITE_CONTENT.BRAND.NAME_FA} - شماره ${SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}`}
          title={`تماس تلفنی مستقیم: ${SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}`}
        >
          <span className="absolute bottom-0 right-0 left-0 h-[2px] bg-[#E88B7B] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
          <Phone className="w-4 h-4 text-[#F7F6F2] group-hover:text-[#E88B7B] group-hover:-translate-y-0.5 transition-all duration-200" />
          <span className="hidden sm:inline font-sans text-xs tracking-tight">تماس</span>
        </a>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/15" aria-hidden="true" />

        {/* WhatsApp Button */}
        <a
          href={SITE_CONTENT.CONTACT.WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F7F6F2] hover:text-white transition-all duration-200"
          aria-label="گفتگو در واتساپ"
          title="ارتباط در واتساپ"
        >
          <span className="absolute bottom-0 right-0 left-0 h-[2px] bg-[#E88B7B] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
          <MessageCircle className="w-4 h-4 text-[#F7F6F2] group-hover:text-[#E88B7B] group-hover:-translate-y-0.5 transition-all duration-200" />
          <span className="hidden sm:inline font-sans text-xs tracking-tight">واتساپ</span>
        </a>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-white/15" aria-hidden="true" />

        {/* Instagram Button */}
        <a
          href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative group flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#F7F6F2] hover:text-white transition-all duration-200"
          aria-label={`صفحه اینستاگرام کلینیک ${SITE_CONTENT.BRAND.NAME_FA}`}
          title={`مشاهده اینستاگرام: ${SITE_CONTENT.CONTACT.INSTAGRAM_HANDLE}`}
        >
          <span className="absolute bottom-0 right-0 left-0 h-[2px] bg-[#E88B7B] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
          <svg
            className="w-4 h-4 text-[#F7F6F2] group-hover:text-[#E88B7B] group-hover:-translate-y-0.5 transition-all duration-200 fill-none stroke-current stroke-2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
          <span className="hidden sm:inline font-sans text-xs tracking-tight">اینستاگرام</span>
        </a>
      </div>
    </aside>
  );
};
