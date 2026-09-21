import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, CheckCircle2, MessageSquare, Minimize2 } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { pauseScroll, resumeScroll } from '../hooks/useSmoothScroll';

interface ProcessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsultation: () => void;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
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

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
      style={{ isolation: 'isolate' }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="process-modal-title"
    >
      <div
        className="fixed inset-0 bg-[#241A27]/85 backdrop-blur-md transition-opacity duration-300 -z-10 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

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
            <span>LUMEN PATIENT ROADMAP WINDOW</span>
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

        {/* Header */}
        <div className="bg-gradient-to-b from-[#332635] to-[#271C2A] text-[#F7F3EE] px-6 py-5 sm:px-8 sm:py-6 border-b border-[#D8B6BE]/15 shrink-0">
          <span className="text-xs text-[#D8B6BE] font-mono tracking-widest uppercase block mb-1">
            {CLINIC_TEXTS.PROCESS_LABEL}
          </span>
          <h3 id="process-modal-title" className="text-xl sm:text-2xl font-light text-white">
            راهنمای کامل مراحل ویزیت و مراقبت در لومن
          </h3>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-4 overflow-y-auto window-scroll flex-1">
          {CLINIC_CONFIG.PROCESS_STEPS.map((step) => (
            <div
              key={step.number}
              className="p-4 rounded-2xl bg-mauve-wash/85 border border-[#332635]/10 space-y-1.5"
            >
              <div className="flex items-center justify-between pb-1 border-b border-[#332635]/8">
                <span className="text-sm font-semibold text-[#332635] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#9B7B8D]" />
                  مرحله {step.number}: {step.title}
                </span>
                <span className="text-xs text-[#9B7B8D] font-mono">{step.subtitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#777176] font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}

          <div className="pt-3 border-t border-[#332635]/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConsultation();
              }}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-all shadow-md cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
              <span>هماهنگی اولین نوبت مشاوره</span>
            </button>

            <a
              href={`https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent('سلام و احترام. برای هماهنگی نوبت مشاوره و شروع فرآیند مراقبت در کلینیک لومن پیام می‌دهم.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساپ پذیرش</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
