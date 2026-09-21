import React, { useState, useEffect } from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Menu, X, ArrowLeft, PhoneCall } from 'lucide-react';

interface NavbarProps {
  onNavigate?: (targetId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open without breaking Lenis
  useEffect(() => {
    if (mobileMenuOpen) {
      document.documentElement.classList.add('overflow-hidden');
    } else {
      document.documentElement.classList.remove('overflow-hidden');
    }
    return () => {
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'خانه', href: '#hero' },
    { label: 'خدمات', href: '#services' },
    { label: 'فلسفه مراقبت', href: '#philosophy' },
    { label: 'درباره ما', href: '#doctor' },
    { label: 'فضای کلینیک', href: '#gallery' },
    { label: 'مسیر شما', href: '#process' },
    { label: 'تماس', href: '#contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (onNavigate) {
      onNavigate(href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F6E3E6]/90 backdrop-blur-md border-b border-[#CFE8F3]/60 py-3 shadow-[0_4px_20px_rgba(32,58,67,0.03)]'
          : 'bg-transparent py-5 lg:py-6 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        {/* Right Brand Logo & Name (Persian RTL) */}
        <a
          href="#hero"
          onClick={(e) => handleLinkClick(e, '#hero')}
          className="flex items-center gap-3 group text-right"
          aria-label={`${CLINIC_CONFIG.CLINIC_NAME} - صفحه اصلی`}
        >
          {/* Subtle geometric emblem */}
          <div className="w-9 h-9 rounded-full bg-[#CFE8F3]/60 border border-[#9FCFE0]/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <span className="w-3.5 h-3.5 rounded-full bg-[#203A43]/85" />
          </div>
          <div className="flex flex-col">
            <span className="font-latin tracking-[0.25em] text-xs font-semibold text-[#203A43]/70 uppercase">
              {CLINIC_CONFIG.CLINIC_NAME_EN}
            </span>
            <span className="text-base font-bold text-[#203A43] tracking-tight">
              {CLINIC_CONFIG.CLINIC_NAME}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#69767C]" aria-label="ناوبری اصلی">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="relative py-1 hover:text-[#203A43] transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute bottom-0 right-0 w-0 h-[1.5px] bg-[#203A43] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Left Action Button & Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <a
            href="#contact"
            onClick={(e) => handleLinkClick(e, '#contact')}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-[#203A43] bg-[#CFE8F3]/70 hover:bg-[#CFE8F3] border border-[#9FCFE0]/40 transition-all duration-200 hover:shadow-sm"
          >
            <span>مشاوره</span>
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </a>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#203A43] hover:bg-[#CFE8F3]/50 transition-colors"
            aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منوی دسترسی'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Drawer Navigation */}
      <div
        className={`lg:hidden fixed inset-x-0 top-[61px] sm:top-[69px] bg-[#F6E3E6]/98 backdrop-blur-xl border-b border-[#CFE8F3] shadow-xl transition-all duration-300 ease-in-out overflow-hidden z-30 ${
          mobileMenuOpen ? 'max-h-[85vh] py-6 opacity-100' : 'max-h-0 py-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-md mx-auto px-6 flex flex-col space-y-4">
          <div className="pb-3 border-b border-[#CFE8F3]/40">
            <span className="text-xs font-medium text-[#69767C]">دسترسی سریع</span>
          </div>
          
          <nav className="flex flex-col space-y-3" aria-label="منوی موبایل">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="flex items-center justify-between text-base font-medium text-[#203A43] py-2 px-3 rounded-lg hover:bg-[#CFE8F3]/40 transition-colors"
              >
                <span>{link.label}</span>
                <ArrowLeft className="w-4 h-4 text-[#69767C]" />
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#CFE8F3]/40 flex flex-col gap-3">
            <a
              href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#203A43] text-[#FFFDFC] text-sm font-semibold hover:bg-[#203A43]/90 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>تماس مستقیم با کلینیک</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
