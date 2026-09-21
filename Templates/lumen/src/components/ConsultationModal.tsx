import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, MessageSquare, Clock, MapPin, Sparkles, ArrowUpLeft, ShieldCheck, Minimize2 } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { Logo } from './Logo';
import { pauseScroll, resumeScroll } from '../hooks/useSmoothScroll';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
}

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

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
}) => {
  useEffect(() => {
    if (isOpen) {
      pauseScroll();
    } else {
      resumeScroll();
    }
    return () => {
      resumeScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const whatsappMessage = serviceTitle
    ? `سلام و احترام. برای مشاوره تخصصی در خصوص «${serviceTitle}» در کلینیک لومن پیام می‌دهم.`
    : `سلام و احترام. مایل به دریافت مشاوره در کلینیک تخصصی لومن هستم.`;

  const encodedWhatsappUrl = `https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
      style={{ isolation: 'isolate' }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="window-title"
    >
      {/* Heavy Translucent Backdrop that blocks background interaction */}
      <div
        className="fixed inset-0 bg-[#241A27]/85 backdrop-blur-md transition-opacity duration-300 -z-10 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Luxury Window Dialog Frame */}
      <div
        className="relative w-full max-w-lg bg-rose-wash rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] border border-[#D8B6BE]/30 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window Top Titlebar / Chrome */}
        <div className="bg-[#332635] text-[#F7F3EE] px-5 py-3.5 flex items-center justify-between border-b border-white/10 select-none shrink-0">
          {/* Window Traffic Dots */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#EA4335] hover:opacity-80 transition-opacity flex items-center justify-center text-black/60 group cursor-pointer"
              title="بستن پنجره"
              aria-label="بستن پنجره"
            >
              <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#FBBC05] hover:opacity-80 transition-opacity flex items-center justify-center text-black/60 group cursor-pointer"
              title="کوچک‌سازی"
              aria-label="کوچک‌سازی"
            >
              <Minimize2 className="w-2 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <span className="w-3.5 h-3.5 rounded-full bg-[#34A853] opacity-50 cursor-default" />
          </div>

          {/* Window Title */}
          <div className="text-xs font-mono tracking-widest text-[#D8B6BE] font-medium flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#D8B6BE]" />
            <span>LUMEN · CONCIERGE WINDOW</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-rose/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Header Content Panel */}
        <div className="bg-gradient-to-b from-[#332635] to-[#271C2A] text-[#F7F3EE] px-6 py-5 sm:px-8 sm:py-6 border-b border-[#D8B6BE]/15 shrink-0">
          <Logo variant="plum" size="sm" showTagline />

          <div className="mt-4">
            <h3 id="window-title" className="text-xl sm:text-2xl font-light text-white leading-tight">
              {serviceTitle ? `مشاوره تخصصی: ${serviceTitle}` : 'ارتباط مستقیم و دریافت مشاوره'}
            </h3>
            <p className="text-xs text-[#D8B6BE] mt-1 flex items-center gap-1.5 font-light">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D8B6BE]" />
              پاسخگویی سریع توسط تیم مشاوره بالینی کلینیک لومن
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto window-scroll flex-1">
          <p className="text-xs sm:text-sm text-[#777176] font-light leading-relaxed">
            جهت حفظ کیفیت پاسخگویی و مشاوره متناسب با ساختار پوست و اهداف شما، کانال ارتباطی دلخواه خود را انتخاب فرمایید:
          </p>

          {/* Channels Selection List */}
          <div className="space-y-3">
            {/* WhatsApp */}
            <a
              href={encodedWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366] hover:text-white text-[#242126] transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#25D366] text-white flex items-center justify-center group-hover:bg-rose-wash group-hover:text-[#25D366] transition-colors shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">ارتباط مستقیم در واتساپ</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#25D366]/20 group-hover:bg-rose/35 text-[#1EBE5D] group-hover:text-white font-medium">
                      پیشنهادی
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mt-0.5 font-light">
                    ارسال سوالات، تصاویر و هماهنگی وقت ویزیت
                  </p>
                </div>
              </div>
              <ArrowUpLeft className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Direct Telephone Call */}
            <a
              href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
              className="group flex items-center justify-between p-4 rounded-2xl bg-[#332635]/5 border border-[#332635]/15 hover:bg-[#332635] hover:text-[#F7F3EE] text-[#242126] transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#332635] text-[#D8B6BE] flex items-center justify-center group-hover:bg-[#D8B6BE] group-hover:text-[#332635] transition-colors shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold">تماس تلفنی با پذیرش</span>
                  <p className="text-xs opacity-80 mt-0.5 dir-ltr text-right font-mono">
                    {CLINIC_CONFIG.PHONE_NUMBER}
                  </p>
                </div>
              </div>
              <ArrowUpLeft className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>

            {/* Instagram Direct */}
            <a
              href={CLINIC_CONFIG.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-4 rounded-2xl bg-[#E1306C]/5 border border-[#E1306C]/20 hover:bg-[#E1306C] hover:text-white text-[#242126] transition-all duration-200 shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E1306C] text-white flex items-center justify-center group-hover:bg-rose-wash group-hover:text-[#E1306C] transition-colors shadow-xs">
                  <InstagramIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold">صفحه اینستاگرام لومن</span>
                  <p className="text-xs opacity-80 mt-0.5">
                    {CLINIC_CONFIG.INSTAGRAM_HANDLE}
                  </p>
                </div>
              </div>
              <ArrowUpLeft className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* Quick Clinic Info Strip */}
          <div className="pt-3 border-t border-[#332635]/10 space-y-2 text-xs text-[#777176]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#9B7B8D] shrink-0" />
              <span>{CLINIC_CONFIG.WORKING_HOURS}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#9B7B8D] shrink-0" />
              <span className="truncate">{CLINIC_CONFIG.ADDRESS}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
