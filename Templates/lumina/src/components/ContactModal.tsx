import React, { useEffect } from 'react';
import { CLINIC_INFO } from '../data/content';
import { 
  X, 
  Phone, 
  Sparkles, 
  MapPin, 
  Clock, 
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  topic?: string;
  defaultAction?: 'phone' | 'whatsapp' | 'instagram' | 'map' | 'all';
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  title = 'ارتباط و هماهنگی نوبت مشاوره',
  topic = 'مشاوره عمومی دندانپزشکی',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Pre-filled WhatsApp message
  const whatsappMessage = encodeURIComponent(
    `سلام و درود، مایل به دریافت نوبت مشاوره در کلینیک لومینا دنتال برای «${topic}» هستم.`
  );
  const whatsappUrl = `https://wa.me/${CLINIC_INFO.whatsappRaw}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07111F]/85 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg bg-[#0a192e] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-10 text-right overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#5DB8FF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7FE7FF] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{CLINIC_INFO.name}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-normal leading-relaxed">
            موضوع درخواست: <strong className="text-[#7FE7FF] font-semibold">{topic}</strong>
          </p>
        </div>

        {/* Primary Direct Channels (WhatsApp & Direct Call) */}
        <div className="space-y-3 mb-6">
          {/* WhatsApp Direct Chat */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between p-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-200">
                    ارسال پیام در واتس‌اپ
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-medium">
                    پاسخگویی سریع
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-mono" dir="ltr">
                  {CLINIC_INFO.mobileDisplay}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-[-3px] transition-transform" />
          </a>

          {/* Direct Phone Call */}
          <a
            href={`tel:${CLINIC_INFO.phoneRaw}`}
            className="group flex items-center justify-between p-4 rounded-2xl bg-[#5DB8FF]/15 hover:bg-[#5DB8FF]/25 border border-[#5DB8FF]/40 hover:border-[#7FE7FF] transition-all duration-300 shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#5DB8FF]/20 border border-[#5DB8FF]/40 flex items-center justify-center text-[#7FE7FF] group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white group-hover:text-[#7FE7FF] block">
                  تماس مستقیم تلفنی با کلینیک
                </span>
                <span className="text-xs text-slate-300 font-mono" dir="ltr">
                  {CLINIC_INFO.phoneDisplay}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#7FE7FF] group-hover:translate-x-[-3px] transition-transform" />
          </a>

          {/* Instagram Direct */}
          <a
            href={CLINIC_INFO.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-white block">
                  دایرکت اینستاگرام کلینیک
                </span>
                <span className="text-xs text-slate-400 font-sans">
                  {CLINIC_INFO.instagramHandle}
                </span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:translate-x-[-3px] transition-transform" />
          </a>
        </div>

        {/* Iranian Navigation Apps (Neshan, Balad, Google Maps) */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MapPin className="w-4 h-4 text-[#7FE7FF]" />
            <span>مسیریابی به سمت کلینیک (مستقیم در اپلیکیشن):</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {CLINIC_INFO.address}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Neshan */}
            <a
              href={CLINIC_INFO.mapLinks.neshan}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-all text-center"
            >
              <span>مسیریابی نشان</span>
            </a>

            {/* Balad */}
            <a
              href={CLINIC_INFO.mapLinks.balad}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-all text-center"
            >
              <span>مسیریابی بلد</span>
            </a>

            {/* Google Maps */}
            <a
              href={CLINIC_INFO.mapLinks.googleMaps}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-all text-center"
            >
              <span>Google Maps</span>
            </a>
          </div>
        </div>

        {/* Working Hours */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <Clock className="w-4 h-4 text-[#5DB8FF] shrink-0" />
          <span>{CLINIC_INFO.workingHours}</span>
        </div>

        {/* Footer Close */}
        <div className="pt-3 border-t border-white/10 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
