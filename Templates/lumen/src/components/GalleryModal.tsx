import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Minimize2, ChevronRight, ChevronLeft, MessageSquare } from 'lucide-react';
import { GalleryItem, CLINIC_CONFIG } from '../config/clinicData';
import { pauseScroll, resumeScroll } from '../hooks/useSmoothScroll';

interface GalleryModalProps {
  selectedImage: GalleryItem | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenConsultation?: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  selectedImage,
  onClose,
  onNext,
  onPrev,
  onOpenConsultation,
}) => {
  useEffect(() => {
    if (selectedImage) {
      pauseScroll();
    } else {
      resumeScroll();
    }
    return () => {
      resumeScroll();
    };
  }, [selectedImage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNext(); // In RTL, Left is forward
      if (e.key === 'ArrowRight') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, onClose, onNext, onPrev]);

  if (!selectedImage) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 md:p-8 overflow-y-auto"
      style={{ isolation: 'isolate' }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-viewer-title"
    >
      {/* Fixed Fullscreen Backdrop */}
      <div
        className="fixed inset-0 bg-[#241A27]/92 backdrop-blur-md transition-opacity duration-300 -z-10 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Luxury Window Container - Center Aligned in Viewport */}
      <div
        className="relative w-full max-w-4xl bg-[#332635] rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)] border border-[#D8B6BE]/30 my-auto flex flex-col max-h-[92dvh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Titlebar Chrome */}
        <div className="bg-[#241A27] text-[#F7F3EE] px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-white/10 select-none shrink-0">
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
            <Sparkles className="w-3.5 h-3.5 text-[#D8B6BE]" />
            <span id="gallery-viewer-title">LUMEN GALLERY VIEWER</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="بستن پنجره"
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-rose/20 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable / Viewport Responsive Image Canvas */}
        <div className="relative flex-1 bg-black/80 flex items-center justify-center overflow-auto min-h-[35vh] max-h-[62dvh] p-2 sm:p-4 select-none">
          <img
            src={selectedImage.url}
            alt={selectedImage.title}
            className="w-auto h-auto max-w-full max-h-[58dvh] object-contain rounded-xl shadow-2xl mx-auto block"
          />

          {/* Navigation Controls (Right/Left) */}
          <button
            type="button"
            onClick={onPrev}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#241A27]/80 hover:bg-[#332635] text-white border border-white/15 flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            aria-label="تصویر قبلی"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#D8B6BE]" />
          </button>

          <button
            type="button"
            onClick={onNext}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#241A27]/80 hover:bg-[#332635] text-white border border-white/15 flex items-center justify-center transition-all duration-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            aria-label="تصویر بعدی"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#D8B6BE]" />
          </button>
        </div>

        {/* Window Footer Meta & Direct Contact Bar */}
        <div className="p-4 sm:p-5 bg-[#271C2A] flex flex-wrap items-center justify-between gap-3 text-[#F7F3EE] border-t border-white/10 shrink-0">
          <div>
            <span className="text-[11px] text-[#D8B6BE] font-mono tracking-wider block">
              {selectedImage.category}
            </span>
            <h4 className="text-base sm:text-lg font-medium text-white mt-0.5">
              {selectedImage.title}
            </h4>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenConsultation && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConsultation();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-rose-wash text-[#332635] hover:bg-[#D8B6BE] transition-colors shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#332635]" />
                <span>درخواست مشاوره</span>
              </button>
            )}

            <a
              href={`https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(`سلام و احترام. برای هماهنگی مراجعه به کلینیک لومن (${selectedImage.title}) پیام می‌دهم.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-colors shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">واتساپ</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
