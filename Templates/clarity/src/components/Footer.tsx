import React from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { InstagramIcon, WhatsAppIcon } from './Icons';
import { Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate?: (targetId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
    <footer className="bg-[#F6E3E6] border-t border-[#CFE8F3] pt-16 pb-12 text-right">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-[#CFE8F3]/60">
          
          {/* Col 1: Brand Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#CFE8F3]/70 border border-[#9FCFE0]/50 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-[#203A43]/85" />
              </div>
              <div>
                <span className="font-latin text-xs font-semibold text-[#69767C] tracking-widest uppercase block">
                  {CLINIC_CONFIG.CLINIC_NAME_EN}
                </span>
                <span className="text-lg font-bold text-[#203A43]">
                  {CLINIC_CONFIG.CLINIC_NAME}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#69767C] max-w-sm leading-relaxed">
              {CLINIC_CONFIG.CLINIC_CATEGORY}. رویکردی علمی، آرام و اختصاصی با تمرکز بر تعادل، سلامت و درخشش طبیعی چهره.
            </p>

            <div className="text-xs text-[#D9A6AE] font-semibold">
              {CLINIC_CONFIG.CLINIC_TAGLINE}
            </div>
          </div>

          {/* Col 2: Navigation Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <span className="text-xs font-bold text-[#203A43] uppercase tracking-wider block">
              دسترسی سریع
            </span>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-[#69767C] hover:text-[#203A43] transition-colors inline-block py-0.5"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Direct Contacts & Social (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-xs font-bold text-[#203A43] uppercase tracking-wider block">
              ارتباط با ما
            </span>
            
            <div className="space-y-2.5 text-xs text-[#69767C]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#203A43] shrink-0 mt-0.5" />
                <span>{CLINIC_CONFIG.ADDRESS}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#203A43] shrink-0" />
                <a
                  href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
                  className="font-latin text-xs font-semibold text-[#203A43] hover:text-[#D9A6AE] transition-colors"
                  dir="ltr"
                >
                  {CLINIC_CONFIG.PHONE_DISPLAY}
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href={CLINIC_CONFIG.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="صفحه اینستاگرام کلینیک کلاریتی"
                className="w-9 h-9 rounded-full bg-[#E4F0F6] border border-[#CFE8F3] flex items-center justify-center text-[#203A43] hover:border-[#D9A6AE] hover:text-[#D9A6AE] transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href={CLINIC_CONFIG.WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساپ کلینیک کلاریتی"
                className="w-9 h-9 rounded-full bg-[#E4F0F6] border border-[#CFE8F3] flex items-center justify-center text-[#203A43] hover:border-[#9FCFE0] hover:text-[#203A43] transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Picksaw Attribution */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#69767C]">
          <p>
            © {new Date().getFullYear()} {CLINIC_CONFIG.CLINIC_NAME}. کلیه حقوق محفوظ است.
          </p>

          <p className="text-[11px] text-[#69767C]/80">
            طراحی شده توسط <span className="font-latin font-semibold text-[#203A43]/70">Picksaw Studio</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
