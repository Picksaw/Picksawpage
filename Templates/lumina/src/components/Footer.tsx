import React from 'react';
import { CLINIC_INFO } from '../data/content';
import { Sparkles, Phone, MapPin, Clock, Send, ArrowUp, MessageCircle, Navigation } from 'lucide-react';

interface FooterProps {
  onOpenTemplateInfo: () => void;
  onOpenContact: (topic?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTemplateInfo, onOpenContact }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'خدمات تخصصی', href: '#services' },
    { label: 'پزشکان و متخصصان', href: '#specialists' },
    { label: 'چرا لومینا دنتال', href: '#why-lumina' },
    { label: 'نمونه درمان‌ها و لبخندها', href: '#before-after' },
    { label: 'فضای کلینیک', href: '#clinic' },
    { label: 'مسیر و مراحل درمان', href: '#journey' },
    { label: 'گزینه‌های مشاوره', href: '#consultation' },
    { label: 'سوالات متداول', href: '#faq' },
  ];

  return (
    <footer className="relative bg-[#040a14] border-t border-white/10 pt-16 pb-12 overflow-hidden text-right">
      {/* Subtle top glow */}
      <div className="absolute top-0 right-1/3 left-1/3 h-[1px] bg-gradient-to-r from-transparent via-[#5DB8FF]/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 border-b border-white/10">
          
          {/* Brand Col - 4 cols */}
          <div className="lg:col-span-4 space-y-5">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 border border-[#5DB8FF]/40 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#7FE7FF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-white">{CLINIC_INFO.name}</span>
                <span className="text-[10px] font-sans text-slate-400 tracking-wider uppercase">{CLINIC_INFO.nameEn}</span>
              </div>
            </div>

            {/* Slogan */}
            <p className="text-sm font-semibold text-[#7FE7FF]">
              «{CLINIC_INFO.slogan}»
            </p>

            {/* About */}
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
              کلینیک دندانپزشکی تخصصی و زیبایی لومینا دنتال با رویکرد طراحی دیجیتال، تکنولوژی‌های کم‌تهاجم و استانداردهای روز بین‌المللی در محیطی آرام و مدرن.
            </p>

            {/* Social & Contact Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={CLINIC_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/40 flex items-center justify-center text-slate-300 hover:text-pink-300 transition-colors"
                title="اینستاگرام لومینا دنتال"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/${CLINIC_INFO.whatsappRaw}`}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 flex items-center justify-center text-slate-300 hover:text-emerald-300 transition-colors"
                title="واتس‌اپ کلینیک"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl bg-white/[0.04] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 flex items-center justify-center text-slate-300 hover:text-[#7FE7FF] transition-colors"
                title="تلگرام کلینیک"
              >
                <Send className="w-4 h-4" />
              </a>
              <button
                onClick={() => onOpenContact('رزرو نوبت سریع')}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:text-white transition-colors"
              >
                درخواست مشاوره
              </button>
            </div>
          </div>

          {/* Quick Links Col - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FE7FF]" />
              <span>دسترسی سریع</span>
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {navLinks.slice(0, 6).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs sm:text-sm text-slate-400 hover:text-[#7FE7FF] transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Working Hours Col - 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5DB8FF]" />
              <span>ساعات پذیرش</span>
            </h4>
            <div className="text-xs text-slate-400 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-200 block">شنبه تا چهارشنبه:</strong>
                <span className="font-mono text-slate-300" dir="ltr">10:00 - 20:00</span>
              </p>
              <p>
                <strong className="text-slate-200 block">پنج‌شنبه‌ها:</strong>
                <span className="font-mono text-slate-300" dir="ltr">10:00 - 16:00</span>
              </p>
              <p className="text-slate-500 pt-1">
                جمعه‌ها و تعطیلات رسمی: تعطیل
              </p>
            </div>
          </div>

          {/* Contact, Phone & Iranian Maps Col - 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7FE7FF]" />
              <span>اطلاعات تماس و مسیریابی</span>
            </h4>
            
            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed text-slate-400">
                {CLINIC_INFO.address}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Phone className="w-3.5 h-3.5 text-[#5DB8FF]" />
                <span className="text-slate-400">تلفن کلینیک:</span>
                <a href={`tel:${CLINIC_INFO.phoneRaw}`} className="text-white font-bold hover:text-[#7FE7FF] font-mono tracking-wider" dir="ltr">
                  {CLINIC_INFO.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">واتس‌اپ و مشاوره:</span>
                <a href={`https://wa.me/${CLINIC_INFO.whatsappRaw}`} target="_blank" rel="noreferrer" className="text-[#7FE7FF] font-bold font-mono tracking-wider" dir="ltr">
                  {CLINIC_INFO.mobileDisplay}
                </a>
              </div>
            </div>

            {/* Iranian Map Buttons (Neshan, Balad, Google Maps) */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#5DB8FF]" />
                <span>مسیریابی مستقیم:</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={CLINIC_INFO.mapLinks.neshan}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 rounded-xl text-center text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-colors"
                >
                  نشان
                </a>
                <a
                  href={CLINIC_INFO.mapLinks.balad}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 rounded-xl text-center text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-colors"
                >
                  بلد
                </a>
                <a
                  href={CLINIC_INFO.mapLinks.googleMaps}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-2 rounded-xl text-center text-xs font-bold text-slate-200 hover:text-white bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 hover:border-[#5DB8FF]/40 transition-colors"
                >
                  Google Maps
                </a>
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5 text-[#5DB8FF]" />
              <span>بازگشت به بالای صفحه</span>
            </button>
          </div>

        </div>

        {/* Picksaw Studio Signature Branding */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© ۱۴۰۴ تمامی حقوق برای {CLINIC_INFO.name} محفوظ است.</span>
          </div>

          {/* Picksaw Studio Attribution */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenTemplateInfo}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#5DB8FF]/40 text-slate-300 hover:text-[#7FE7FF] transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5DB8FF]" />
              <span>طراحی شده توسط <strong className="font-semibold text-white">Picksaw Studio</strong></span>
              <span className="text-slate-600">|</span>
              <span className="text-[#7FE7FF] font-medium">این قالب را شخصی‌سازی کنید</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
