import React from 'react';
import { CONTENT_CONFIG } from '../config/content.config';

interface FooterProps {
  onNavigate?: (id: string) => void;
}

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const navLinks = CONTENT_CONFIG.NAV_LINKS;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      const elem = document.getElementById(targetId);
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#F5F3EA] border-t border-[#D9D0BC]/60 pt-16 pb-12 text-[#70756D] relative z-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#D9D0BC]/50">
          
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-[#252923] font-vazir">
                  {CONTENT_CONFIG.BRAND.CLINIC_NAME}
                </span>
                <span className="font-editorial text-sm font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                  {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88]"></span>
              </div>
              <p className="text-sm text-[#70756D] max-w-sm font-light leading-relaxed mb-6">
                {CONTENT_CONFIG.BRAND.DESCRIPTION}
              </p>
            </div>

            <p className="text-xs text-[#70756D]/80">
              {CONTENT_CONFIG.BRAND.TAGLINE}
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-editorial font-semibold tracking-widest text-[#252923] uppercase mb-4">
              دسترسی سریع
            </h4>
            <ul className="space-y-2.5 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-[#70756D] hover:text-[#344236] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-editorial font-semibold tracking-widest text-[#252923] uppercase mb-4">
              ارتباط مستقیم
            </h4>
            
            <p className="text-sm text-[#70756D]">
              <span className="text-[#252923] font-medium ml-1">تلفن:</span>
              <a href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`} className="hover:text-[#344236] font-editorial">
                {CONTENT_CONFIG.CONTACT.PHONE_DISPLAY}
              </a>
            </p>

            <p className="text-sm text-[#70756D]">
              <span className="text-[#252923] font-medium ml-1">همراه:</span>
              <a href={`tel:${CONTENT_CONFIG.CONTACT.MOBILE_RAW}`} className="hover:text-[#344236] font-editorial">
                {CONTENT_CONFIG.CONTACT.MOBILE_DISPLAY}
              </a>
            </p>

            <p className="text-sm text-[#70756D] leading-relaxed">
              <span className="text-[#252923] font-medium ml-1">نشانی:</span>
              {CONTENT_CONFIG.CONTACT.ADDRESS}
            </p>

            <div className="pt-2">
              <a
                href={CONTENT_CONFIG.CONTACT.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium text-[#344236] hover:text-[#9CAF88] transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
                <span className="font-editorial">{CONTENT_CONFIG.CONTACT.INSTAGRAM_HANDLE}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#70756D]/70">
          <p>© {new Date().getFullYear()} {CONTENT_CONFIG.FOOTER.COPYRIGHT}</p>
          
          <a
            href={CONTENT_CONFIG.FOOTER.STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#70756D]/80 hover:text-[#344236] transition-colors"
          >
            {CONTENT_CONFIG.FOOTER.STUDIO_LABEL}
          </a>
        </div>

      </div>
    </footer>
  );
};
