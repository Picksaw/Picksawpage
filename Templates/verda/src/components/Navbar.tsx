import React, { useState, useEffect } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { Menu, X, Phone, ArrowUpLeft } from 'lucide-react';

interface NavbarProps {
  onNavigate?: (id: string) => void;
  onOpenConsultation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenConsultation }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = CONTENT_CONFIG.NAV_LINKS;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleConsultationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onOpenConsultation) {
      onOpenConsultation();
    } else if (onNavigate) {
      onNavigate('contact');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-40 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#E9EFE0]/95 backdrop-blur-md shadow-xs py-3.5 border-b border-[#D9D0BC]/40'
            : 'bg-transparent py-5 md:py-6 border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <a
            href="#hero"
            onClick={(e) => handleLinkClick(e, '#hero')}
            className="group flex items-center gap-3 focus:outline-none"
            aria-label="وردا - صفحه اصلی"
          >
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[#252923] group-hover:text-[#344236] transition-colors">
                {CONTENT_CONFIG.BRAND.CLINIC_NAME}
              </span>
              <span className="font-editorial text-[10px] md:text-[11px] font-semibold tracking-[0.2em] text-[#70756D] uppercase -mt-0.5">
                {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}
              </span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88] group-hover:scale-125 transition-transform"></span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-10 text-sm font-medium text-[#252923]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="relative py-1 text-[#252923] hover:text-[#344236] transition-colors text-[14px] font-normal group"
              >
                {link.label}
                <span className="absolute bottom-0 right-0 w-0 h-[1.5px] bg-[#9CAF88] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </nav>

          {/* Consultation CTA */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConsultationClick}
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#344236] text-[#344236] bg-[#E9EFE0]/80 hover:bg-[#344236] hover:text-[#FBFAF4] transition-all duration-300 text-xs md:text-sm font-medium shadow-xs group cursor-pointer"
            >
              <span>مشاوره</span>
              <ArrowUpLeft className="w-3.5 h-3.5 text-[#344236] group-hover:text-[#FBFAF4] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              className="md:hidden p-2 rounded-lg text-[#252923] hover:bg-[#D9D0BC]/30 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-[#252923]/40 backdrop-blur-xs transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 right-0 bottom-0 w-4/5 max-w-sm z-50 bg-[#E9EFE0] border-l border-[#D9D0BC]/50 shadow-2xl flex flex-col justify-between p-6 transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="منوی موبایل"
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-[#D9D0BC]/40">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#252923]">{CONTENT_CONFIG.BRAND.CLINIC_NAME}</span>
              <span className="font-editorial text-[10px] tracking-[0.2em] text-[#70756D] uppercase">
                {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-[#70756D] hover:text-[#252923] rounded-full hover:bg-[#D9D0BC]/30"
              aria-label="بستن منو"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-5">
            {navLinks.map((link, idx) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="flex items-center justify-between text-base font-medium text-[#252923] hover:text-[#344236] py-2 border-b border-[#D9D0BC]/20 group"
              >
                <span>{link.label}</span>
                <span className="text-xs text-[#70756D] font-editorial">0{idx + 1}</span>
              </a>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#D9D0BC]/40 space-y-3">
          <button
            type="button"
            onClick={handleConsultationClick}
            className="w-full py-2.5 rounded-xl border border-[#344236] text-[#344236] bg-[#E9EFE0] hover:bg-[#344236] hover:text-[#FBFAF4] text-xs font-semibold transition-colors"
          >
            درخواست مشاوره اختصاصی
          </button>

          <a
            href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#344236] text-[#FBFAF4] text-sm font-medium hover:bg-[#252923] transition-colors"
          >
            <Phone className="w-4 h-4 text-[#E9D98A]" />
            <span>تماس: {CONTENT_CONFIG.CONTACT.PHONE_DISPLAY}</span>
          </a>
        </div>
      </aside>
    </>
  );
};
