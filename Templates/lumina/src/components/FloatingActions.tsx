import React, { useState, useEffect } from 'react';
import { CLINIC_INFO } from '../data/content';
import { Phone, ArrowUp, MessageCircle } from 'lucide-react';

export const FloatingActions: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <aside aria-label="دسترسی سریع، واتس‌اپ و تماس" className="fixed bottom-6 left-6 z-40 flex flex-col items-center gap-3">
      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-[#07111F]/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white hover:border-[#5DB8FF] flex items-center justify-center shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
          title="بازگشت به بالای صفحه"
          aria-label="بازگشت به بالای صفحه"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Instagram Floating Icon */}
      <a
        href={CLINIC_INFO.instagramUrl}
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#07111F]/90 backdrop-blur-xl border border-pink-500/40 text-pink-400 hover:text-white hover:bg-pink-600 hover:border-pink-400 shadow-[0_4px_20px_rgba(236,72,153,0.3)] transition-all duration-300 hover:scale-110"
        title="اینستاگرام لومینا دنتال"
        aria-label="اینستاگرام لومینا دنتال"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
        <span className="sr-only">اینستاگرام</span>
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#07111F]/90 border border-white/10 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
          اینستاگرام: {CLINIC_INFO.instagramHandle}
        </span>
      </a>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${CLINIC_INFO.whatsappRaw}`}
        target="_blank"
        rel="noreferrer"
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-600/90 backdrop-blur-xl border border-emerald-400 text-white hover:bg-emerald-500 shadow-[0_8px_25px_rgba(16,185,129,0.4)] transition-all duration-300 hover:scale-110"
        title="ارتباط مستقیم در واتس‌اپ"
        aria-label="ارتباط مستقیم در واتس‌اپ"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="sr-only">واتس‌اپ</span>
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#07111F]/90 border border-emerald-500/30 text-xs font-semibold text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
          واتس‌اپ: <span className="font-mono" dir="ltr">{CLINIC_INFO.mobileDisplay}</span>
        </span>
      </a>

      {/* Floating Phone Call Button */}
      <a
        href={`tel:${CLINIC_INFO.phoneRaw}`}
        className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#07111F]/90 backdrop-blur-xl border border-[#5DB8FF]/50 text-[#7FE7FF] hover:text-[#07111F] hover:bg-[#7FE7FF] shadow-[0_8px_25px_rgba(93,184,255,0.35)] transition-all duration-300 hover:scale-110"
        title="تماس تلفنی مستقیم با کلینیک"
        aria-label="تماس مستقیم با کلینیک لومینا دنتال"
      >
        <Phone className="w-5 h-5" />
        <span className="sr-only">تماس با کلینیک</span>
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#07111F]/90 border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
          تلفن: <span className="font-mono" dir="ltr">{CLINIC_INFO.phoneDisplay}</span>
        </span>
      </a>
    </aside>
  );
};
