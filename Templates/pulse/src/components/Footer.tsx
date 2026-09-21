import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { getLenis } from "../hooks/useLenisScroll";

export const Footer: React.FC = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const lenis = getLenis();
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
  };

  return (
    <footer className="bg-[#0B1F2A] text-[#F7F6F2] border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          {/* Brand & Tagline */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white text-[#0B1F2A] flex items-center justify-center font-bold text-sm">
                {SITE_CONTENT.BRAND.INITIAL}
              </div>
              <div>
                <span className="text-xl font-bold text-white block">
                  {SITE_CONTENT.BRAND.NAME_FA}
                </span>
                <span className="text-[10px] text-[#7B858A] tracking-widest uppercase font-semibold font-editorial">
                  {SITE_CONTENT.BRAND.NAME_EN} CLINIC
                </span>
              </div>
            </div>

            <p className="text-xs text-[#DDECF0]/70 max-w-sm leading-relaxed mb-6">
              {SITE_CONTENT.BRAND.TAGLINE}
              <br />
              {SITE_CONTENT.BRAND.CATEGORY}
            </p>

            <div className="text-xs text-[#7B858A] font-sans">
              {SITE_CONTENT.CONTACT.ADDRESS}
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <span className="text-xs font-bold text-[#DDECF0] tracking-wider uppercase font-editorial block mb-4">
              {SITE_CONTENT.FOOTER.NAV_TITLE}
            </span>
            <ul className="space-y-2.5 text-xs text-[#F7F6F2]/80">
              {SITE_CONTENT.NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="hover:text-[#E88B7B] transition-colors cursor-pointer"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Summary (with LTR phone formatting) */}
          <div className="md:col-span-4">
            <span className="text-xs font-bold text-[#DDECF0] tracking-wider uppercase font-editorial block mb-4">
              {SITE_CONTENT.FOOTER.HOURS_TITLE}
            </span>
            <div className="space-y-2.5 text-xs text-[#F7F6F2]/80 mb-4">
              <div className="flex items-center gap-2">
                <span>تلفن ثابت:</span>
                <span dir="ltr" className="font-number font-bold text-white tracking-wider">
                  {SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>شماره همراه:</span>
                <span dir="ltr" className="font-number font-bold text-white tracking-wider">
                  {SITE_CONTENT.CONTACT.MOBILE_DISPLAY_LTR}
                </span>
              </div>
              <p className="text-[11px] text-[#7B858A]">{SITE_CONTENT.CONTACT.WORKING_HOURS}</p>
            </div>

            <a
              href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="inline-flex items-center gap-1.5 text-xs text-[#E88B7B] hover:underline font-number font-semibold"
            >
              <span>{SITE_CONTENT.CONTACT.INSTAGRAM_HANDLE}</span>
            </a>
          </div>
        </div>

        {/* Bottom Bar with Picksaw Credit */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#7B858A]">
          <p>© {new Date().getFullYear()} {SITE_CONTENT.FOOTER.COPYRIGHT}</p>

          <div className="flex items-center gap-2">
            <span>{SITE_CONTENT.FOOTER.DESIGNED_BY}</span>
            <span className="font-editorial font-semibold text-[#DDECF0] tracking-wide">
              {SITE_CONTENT.FOOTER.STUDIO_NAME}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
