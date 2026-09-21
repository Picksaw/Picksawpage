import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Phone } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { scrollToSection } from '../hooks/useSmoothScroll';
import { Logo } from './Logo';

interface NavbarProps {
  onOpenConsultation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsultation }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { label: CLINIC_TEXTS.NAV_HOME, href: '#hero' },
    { label: CLINIC_TEXTS.NAV_SERVICES, href: '#services' },
    { label: CLINIC_TEXTS.NAV_DOCTOR, href: '#doctor' },
    { label: CLINIC_TEXTS.NAV_GALLERY, href: '#gallery' },
    { label: CLINIC_TEXTS.NAV_PROCESS, href: '#process' },
    { label: CLINIC_TEXTS.NAV_CONTACT, href: '#contact' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    scrollToSection(href);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? 'py-3 bg-linen/95 backdrop-blur-lg shadow-[0_4px_30px_rgba(51,38,53,0.08)] border-b border-[#332635]/10'
            : 'py-6 bg-transparent'
        }`}
        dir="rtl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Right Side: Exclusive Bespoke Brand Logo */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="group focus-visible:ring-2 focus-visible:ring-[#9B7B8D] rounded-xl p-1 transition-opacity hover:opacity-90"
            aria-label="صفحه اصلی کلینیک لومن"
          >
            <Logo variant="dark" size="md" showTagline={!isScrolled} />
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8" aria-label="منوی اصلی لومن">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm font-medium text-[#242126]/80 hover:text-[#332635] relative py-1.5 transition-colors duration-200 after:content-[''] after:absolute after:bottom-0 after:right-0 after:w-0 after:h-[1.5px] after:bg-[#332635] hover:after:w-full after:transition-all after:duration-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Left Side: Consultation Button & Mobile Menu Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenConsultation}
              className="hidden sm:inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] hover:shadow-lg transition-all duration-300 shadow-sm focus-visible:ring-2 focus-visible:ring-[#9B7B8D] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D8B6BE] animate-pulse" />
              <span>{CLINIC_TEXTS.NAV_CTA}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2.5 rounded-xl text-[#332635] hover:bg-[#332635]/5 focus-visible:ring-2 focus-visible:ring-[#9B7B8D] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-in Drawer Menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        dir="rtl"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#241A27]/70 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer Container */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-rose-wash shadow-2xl p-6 sm:p-8 flex flex-col justify-between transform transition-transform duration-300 ease-out border-l border-[#332635]/10 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-[#332635]/10">
              <Logo variant="dark" size="sm" showTagline />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full text-[#332635] hover:bg-[#332635]/10 cursor-pointer"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-2" aria-label="منوی موبایل">
              {navItems.map((item, idx) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="px-4 py-3.5 rounded-xl text-base font-medium text-[#242126] hover:bg-[#332635]/5 hover:text-[#332635] flex items-center justify-between transition-colors duration-150"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-[#9B7B8D] font-mono">0{idx + 1}</span>
                </a>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-[#332635]/10 space-y-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenConsultation();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#332635] text-[#F7F3EE] text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:bg-[#241A27] transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
              <span>{CLINIC_TEXTS.HERO_CTA_SECONDARY}</span>
            </button>
            <a
              href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
              className="w-full py-3.5 px-4 rounded-xl border border-[#332635]/20 text-[#332635] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#332635]/5 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#9B7B8D]" />
              <span>{CLINIC_CONFIG.PHONE_NUMBER}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
