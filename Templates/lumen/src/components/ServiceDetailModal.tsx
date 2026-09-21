import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, CheckCircle2, MessageSquare, Phone, ShieldCheck, Minimize2 } from 'lucide-react';
import { ServiceItem, CLINIC_CONFIG } from '../config/clinicData';
import { pauseScroll, resumeScroll } from '../hooks/useSmoothScroll';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenConsultation: (serviceName: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onOpenConsultation,
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

  if (!isOpen || !service) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
      style={{ isolation: 'isolate' }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-modal-title"
    >
      {/* Heavy Backdrop */}
      <div
        className="fixed inset-0 bg-[#241A27]/85 backdrop-blur-md transition-opacity duration-300 -z-10 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Luxury Window Dialog */}
      <div
        className="relative w-full max-w-2xl bg-rose-wash rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.6)] border border-[#D8B6BE]/30 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar Chrome */}
        <div className="bg-[#332635] text-[#F7F3EE] px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-white/10 select-none shrink-0">
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

          <div className="text-xs font-mono tracking-widest text-[#D8B6BE] font-medium flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#D8B6BE]" />
            <span>LUMEN SERVICE WINDOW · {service.number}</span>
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

        {/* Hero Image & Service Header */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-[#241A27] overflow-hidden shrink-0">
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#241A27] via-[#241A27]/50 to-transparent" />
          <div className="absolute bottom-4 right-5 left-5 text-white flex items-end justify-between">
            <div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-[#D8B6BE]/25 text-[#D8B6BE] border border-[#D8B6BE]/30 font-medium">
                {service.tag}
              </span>
              <h3 id="service-modal-title" className="text-xl sm:text-2xl font-light text-white mt-1.5 leading-tight">
                {service.name}
              </h3>
            </div>
            <span className="font-['Outfit'] text-2xl sm:text-3xl font-light text-[#D8B6BE]">
              {service.number}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 space-y-5 overflow-y-auto window-scroll flex-1">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-[#332635] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#9B7B8D]" />
              تشریح پروتکل و اهداف درمانی
            </h4>
            <p className="text-xs sm:text-sm text-[#777176] font-light leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-2xl bg-mauve-wash/85 border border-[#332635]/8 space-y-1">
              <span className="text-xs font-semibold text-[#332635] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9B7B8D]" />
                ارزیابی آناتومیک اولیه
              </span>
              <p className="text-xs text-[#777176] font-light">
                بررسی میزان نیاز پوست و تعیین دقیق متریال پیش از شروع کار.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-mauve-wash/85 border border-[#332635]/8 space-y-1">
              <span className="text-xs font-semibold text-[#332635] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#9B7B8D]" />
                ماندگاری و بازسازی طبیعی
              </span>
              <p className="text-xs text-[#777176] font-light">
                تحریک مکانیسم‌های ترمیمی فیزیولوژیک جهت تضمین نتیجه‌ای طبیعی.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-[#332635]/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConsultation(service.name);
                }}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
                <span>درخواست مشاوره درباره این خدمت</span>
              </button>

              <a
                href={`https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(`سلام و احترام. برای دریافت مشاوره در خصوص «${service.name}» در کلینیک لومن پیام می‌دهم.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>واتساپ مستقیم</span>
              </a>
            </div>

            <a
              href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
              className="inline-flex items-center gap-2 text-xs font-medium text-[#777176] hover:text-[#332635] transition-colors"
            >
              <Phone className="w-4 h-4 text-[#9B7B8D]" />
              <span className="dir-ltr">{CLINIC_CONFIG.PHONE_NUMBER}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
