import React, { useState, useEffect } from 'react';
import { CLINIC_INFO } from '../data/content';
import { Phone, Calendar, Menu, X, Sparkles, ChevronLeft, MessageCircle } from 'lucide-react';

interface NavbarProps {
  onOpenContact: (topic?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'خدمات', href: '#services' },
    { label: 'پزشکان', href: '#specialists' },
    { label: 'چرا لومینا', href: '#why-lumina' },
    { label: 'نمونه درمان‌ها', href: '#before-after' },
    { label: 'فضای کلینیک', href: '#clinic' },
    { label: 'مسیر درمان', href: '#journey' },
    { label: 'مشاوره', href: '#consultation' },
    { label: 'سوالات متداول', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#07111F]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)] py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Right side (RTL Start): Logo & Brand Name */}
          <a
            href="#"
            className="flex items-center gap-3.5 group text-right focus:outline-none"
            aria-label="لومینا دنتال - صفحه اصلی"
          >
            {/* Elegant Monogram / Star-Tooth Icon */}
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#5DB8FF]/20 to-[#7FE7FF]/5 border border-[#5DB8FF]/40 group-hover:border-[#7FE7FF] transition-all duration-300 shadow-[0_0_20px_rgba(93,184,255,0.2)]">
              <Sparkles className="w-5 h-5 text-[#7FE7FF] group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-xl bg-[#5DB8FF]/10 blur-sm group-hover:opacity-100 opacity-50 transition-opacity" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#7FE7FF] transition-colors">
                  {CLINIC_INFO.name}
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7FE7FF] shadow-[0_0_8px_#7FE7FF]" />
              </div>
              <span className="text-[11px] font-medium tracking-wider text-slate-400 font-sans uppercase">
                {CLINIC_INFO.nameEn}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-md">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-full transition-all duration-200 cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Left Actions: Phone & Primary CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Quick Call with LTR font format */}
            <a
              href={`tel:${CLINIC_INFO.phoneRaw}`}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-[#7FE7FF] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all duration-300"
              title="تماس تلفنی مستقیم با کلینیک"
            >
              <Phone className="w-3.5 h-3.5 text-[#5DB8FF]" />
              <span className="font-mono tracking-wider text-[12px]" dir="ltr">
                {CLINIC_INFO.phoneDisplay}
              </span>
            </a>

            {/* Primary CTA: رزرو مشاوره */}
            <button
              onClick={() => onOpenContact('رزرو نوبت مشاوره')}
              className="relative group overflow-hidden px-5 py-2.5 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] via-[#7FE7FF] to-[#5DB8FF] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_4px_20px_rgba(93,184,255,0.35)] hover:shadow-[0_4px_28px_rgba(127,231,255,0.5)] cursor-pointer flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5 text-[#07111F]" />
              <span>رزرو مشاوره</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => onOpenContact('مشاوره سریع')}
              className="px-3 py-1.5 text-xs font-bold text-[#07111F] bg-[#7FE7FF] rounded-lg shadow-sm"
            >
              مشاوره
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white bg-white/[0.05] border border-white/10 rounded-xl focus:outline-none"
              aria-label={isMobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-x-0 top-full bg-[#07111F]/98 backdrop-blur-2xl border-b border-white/15 shadow-2xl p-6 transition-all animate-fadeIn">
          <div className="flex flex-col gap-2 mb-6">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="flex items-center justify-between w-full px-4 py-3 text-right text-base font-medium text-slate-200 hover:text-[#7FE7FF] hover:bg-white/[0.05] rounded-xl transition-all"
              >
                <span>{link.label}</span>
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href={`tel:${CLINIC_INFO.phoneRaw}`}
              className="flex items-center justify-between w-full py-3 px-4 text-sm font-semibold text-slate-200 bg-white/[0.06] border border-white/10 rounded-xl"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#5DB8FF]" />
                <span>تماس مستقیم:</span>
              </div>
              <span className="font-mono text-xs text-[#7FE7FF]" dir="ltr">
                {CLINIC_INFO.phoneDisplay}
              </span>
            </a>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenContact('مشاوره سریع در واتس‌اپ');
              }}
              className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] rounded-xl shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>ارتباط در واتس‌اپ و تماس</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
