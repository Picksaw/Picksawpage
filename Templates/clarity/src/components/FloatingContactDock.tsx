import React from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Phone } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon } from './Icons';

export const FloatingContactDock: React.FC = () => {
  return (
    <aside
      aria-label="راه‌های ارتباط مستقیم سریع"
      className="fixed z-40 right-4 sm:right-6 bottom-5 sm:bottom-6"
    >
      <div className="flex items-center gap-2 p-1.5 rounded-full bg-[#F6E3E6]/90 backdrop-blur-md border border-[#CFE8F3] shadow-[0_8px_30px_rgba(32,58,67,0.08)]">
        {/* 1. Instagram Button */}
        <a
          href={CLINIC_CONFIG.INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="صفحه اینستاگرام کلینیک کلاریتی"
          title="اینستاگرام کلینیک"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3]/60 hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/40 hover:text-[#203A43] transition-all duration-200"
        >
          <InstagramIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">اینستاگرام</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-medium bg-[#203A43] text-[#FFFDFC] rounded-md shadow-md whitespace-nowrap pointer-events-none">
            اینستاگرام
          </span>
        </a>

        {/* 2. Phone Call Button */}
        <a
          href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
          aria-label={`تماس تلفنی با کلینیک: ${CLINIC_CONFIG.PHONE_DISPLAY}`}
          title="تماس تلفنی با کلینیک"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#203A43] text-[#FFFDFC] hover:bg-[#203A43]/90 hover:shadow-sm transition-all duration-200"
        >
          <Phone className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">تماس تلفنی</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-medium bg-[#203A43] text-[#FFFDFC] rounded-md shadow-md whitespace-nowrap pointer-events-none">
            تماس تلفنی
          </span>
        </a>

        {/* 3. WhatsApp Button */}
        <a
          href={CLINIC_CONFIG.WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="پیام در واتساپ به کلینیک کلاریتی"
          title="گفت‌وگو در واتساپ"
          className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3]/60 hover:border-[#9FCFE0] hover:bg-[#CFE8F3]/40 hover:text-[#203A43] transition-all duration-200"
        >
          <WhatsAppIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          <span className="sr-only">واتساپ</span>
          <span className="hidden md:group-hover:block absolute -top-9 px-2.5 py-1 text-[11px] font-medium bg-[#203A43] text-[#FFFDFC] rounded-md shadow-md whitespace-nowrap pointer-events-none">
            واتساپ
          </span>
        </a>
      </div>
    </aside>
  );
};
