import React, { useState, useEffect } from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { Menu, X, ArrowUpLeft, PhoneCall } from "lucide-react";
import { getLenis } from "../hooks/useLenisScroll";

interface NavbarProps {
  onOpenConsultationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsultationModal }) => {
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

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Control body scroll when mobile menu is open
  useEffect(() => {
    const lenis = getLenis();
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      lenis?.stop();
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [mobileMenuOpen]);

  const scrollToTarget = (href: string) => {
    // Immediately unlock body/html styles and restart Lenis
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    const lenis = getLenis();
    lenis?.start();

    // Small delay to let mobile drawer close and layout settle
    setTimeout(() => {
      const targetElement = document.querySelector(href);
      if (targetElement) {
        if (lenis) {
          lenis.scrollTo(targetElement as HTMLElement, { offset: -70 });
        } else {
          const navOffset = 70;
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    }, 60);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    scrollToTarget(href);
  };

  const handleConsultationClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (onOpenConsultationModal) {
      onOpenConsultationModal();
    } else {
      scrollToTarget("#contact");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-[#F7F6F2]/95 backdrop-blur-md border-b border-[#0B1F2A]/10 shadow-xs py-3.5"
            : "bg-transparent py-5 md:py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
          {/* Brand Right (Persian & English) */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, "#hero")}
            className="group flex items-center gap-3 select-none text-right focus:outline-none"
            aria-label={`${SITE_CONTENT.BRAND.NAME_FA} - صفحه اصلی`}
          >
            <div className="w-9 h-9 bg-[#0B1F2A] flex items-center justify-center text-white text-sm font-bold tracking-wider rounded-none border border-[#0B1F2A] group-hover:bg-[#16394A] transition-colors">
              <span className="font-number font-medium">{SITE_CONTENT.BRAND.INITIAL}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-[#0B1F2A] group-hover:text-[#16394A] transition-colors">
                  {SITE_CONTENT.BRAND.NAME_FA}
                </span>
                <span className="inline-block w-1.5 h-1.5 bg-[#E88B7B] rounded-full" />
              </div>
              <span className="text-[10px] tracking-widest text-[#7B858A] font-semibold uppercase -mt-0.5 font-editorial">
                {SITE_CONTENT.BRAND.NAME_EN} CLINIC
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-2 bg-[#0B1F2A]/[0.03] px-3 py-1.5 border border-[#0B1F2A]/8"
            aria-label="منوی اصلی"
          >
            {SITE_CONTENT.NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="px-4 py-1.5 text-sm font-medium text-[#0B1F2A]/85 hover:text-[#0B1F2A] hover:bg-white/80 transition-all duration-200 relative group"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E88B7B] scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-right" />
              </a>
            ))}
          </nav>

          {/* Left CTA Action */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={handleConsultationClick}
              className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 bg-[#0B1F2A] text-[#F7F6F2] hover:bg-[#16394A] hover:border-[#E88B7B] border border-[#0B1F2A] transition-all duration-200 shadow-xs group"
            >
              <span>{SITE_CONTENT.BRAND.HEADER_CTA}</span>
              <ArrowUpLeft className="w-3.5 h-3.5 text-[#E88B7B] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0B1F2A] hover:bg-[#0B1F2A]/5 border border-[#0B1F2A]/15 transition-colors focus:outline-none"
            aria-label={mobileMenuOpen ? "بستن منو" : "باز کردن منوی موبایل"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Vertical Navigation Panel */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[#0B1F2A]/60 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Panel */}
        <div
          data-lenis-prevent="true"
          className={`absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-[#F7F6F2] border-l border-[#0B1F2A]/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto overscroll-contain transition-transform duration-300 ease-out ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div>
            {/* Top header */}
            <div className="flex items-center justify-between pb-6 border-b border-[#0B1F2A]/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#0B1F2A] flex items-center justify-center text-white text-xs font-bold">
                  {SITE_CONTENT.BRAND.INITIAL}
                </div>
                <div>
                  <span className="text-lg font-bold text-[#0B1F2A]">
                    {SITE_CONTENT.BRAND.NAME_FA}
                  </span>
                  <span className="block text-[9px] text-[#7B858A] tracking-wider uppercase font-semibold font-editorial">
                    {SITE_CONTENT.BRAND.NAME_EN}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[#0B1F2A] hover:bg-[#0B1F2A]/5 border border-[#0B1F2A]/10"
                aria-label="بستن منو"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links list */}
            <nav className="mt-8 flex flex-col space-y-1">
              {SITE_CONTENT.NAV_ITEMS.map((item, index) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="flex items-center justify-between p-3.5 text-base font-medium text-[#0B1F2A] hover:bg-[#DDECF0] active:bg-[#DDECF0] hover:text-[#0B1F2A] transition-colors border-b border-[#0B1F2A]/5 group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-number text-sm font-bold text-[#7B858A] group-hover:text-[#E88B7B] group-active:text-[#E88B7B] transition-colors">
                      0{index + 1}
                    </span>
                    <span className="font-bold">{item.label}</span>
                  </div>
                  <span className="text-xs text-[#7B858A] font-light font-editorial">
                    {item.latinLabel}
                  </span>
                </a>
              ))}
            </nav>
          </div>

          {/* Bottom Action in Mobile Drawer */}
          <div className="pt-6 border-t border-[#0B1F2A]/10 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleConsultationClick}
              className="flex items-center justify-center gap-2 py-3 bg-[#0B1F2A] text-white text-sm font-medium hover:bg-[#16394A] transition-colors"
            >
              <PhoneCall className="w-4 h-4 text-[#E88B7B]" />
              <span className="flex items-center gap-1.5">
                <span>تماس مستقیم</span>
                <span dir="ltr" className="font-number text-xs">
                  ({SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR})
                </span>
              </span>
            </button>
            <div className="text-center text-[11px] text-[#7B858A]">
              {SITE_CONTENT.BRAND.TAGLINE}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
