import React from 'react';
import { Phone, MessageSquare, Clock, MapPin, Navigation, ExternalLink, Smartphone, Compass } from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const ContactSection: React.FC = () => {
  return (
    <section id="contact" className="py-24 md:py-36 bg-linen-surface/65 backdrop-blur-[2px] border-t border-[#332635]/10 relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16">
          <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit'] block mb-2">
            {CLINIC_TEXTS.CONTACT_LABEL}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
            {CLINIC_TEXTS.CONTACT_TITLE}
          </h2>
          <p className="mt-3 text-base text-[#777176] font-light max-w-xl leading-relaxed">
            {CLINIC_TEXTS.CONTACT_SUBTEXT}
          </p>
        </div>

        {/* Contact Info & Routing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Direct Communication Channels (7 cols) */}
          <div className="lg:col-span-7 bg-rose-wash p-8 sm:p-12 rounded-[2.5rem] border border-[#332635]/12 shadow-sm flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#332635]/10">
                <span className="w-2.5 h-2.5 rounded-full bg-[#332635]" />
                <h3 className="text-xl sm:text-2xl font-medium text-[#241A27]">
                  {CLINIC_CONFIG.CLINIC_NAME}
                </h3>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#332635]/5 flex items-center justify-center shrink-0 text-[#332635]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#9B7B8D] font-medium mb-1">{CLINIC_TEXTS.CONTACT_ADDRESS_TITLE}</p>
                  <p className="text-sm sm:text-base text-[#242126] font-normal leading-relaxed">
                    {CLINIC_CONFIG.ADDRESS}
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#332635]/5 flex items-center justify-center shrink-0 text-[#332635]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#9B7B8D] font-medium mb-1">{CLINIC_TEXTS.CONTACT_HOURS_TITLE}</p>
                  <p className="text-sm sm:text-base text-[#242126] font-normal leading-relaxed">
                    {CLINIC_CONFIG.WORKING_HOURS}
                  </p>
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <a
                  href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-mauve-wash/85 border border-[#332635]/10 hover:border-[#332635] transition-colors"
                >
                  <Phone className="w-5 h-5 text-[#9B7B8D]" />
                  <div>
                    <span className="text-[11px] text-[#777176] block">{CLINIC_TEXTS.CONTACT_PHONE_LABEL}</span>
                    <span className="text-sm font-semibold text-[#332635] dir-ltr inline-block font-mono">
                      {CLINIC_CONFIG.PHONE_NUMBER}
                    </span>
                  </div>
                </a>

                <a
                  href={`tel:${CLINIC_CONFIG.MOBILE_NUMBER_RAW}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-mauve-wash/85 border border-[#332635]/10 hover:border-[#332635] transition-colors"
                >
                  <Smartphone className="w-5 h-5 text-[#9B7B8D]" />
                  <div>
                    <span className="text-[11px] text-[#777176] block">{CLINIC_TEXTS.CONTACT_MOBILE_LABEL}</span>
                    <span className="text-sm font-semibold text-[#332635] dir-ltr inline-block font-mono">
                      {CLINIC_CONFIG.MOBILE_NUMBER}
                    </span>
                  </div>
                </a>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-6 border-t border-[#332635]/10 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] transition-all shadow-sm"
              >
                <Phone className="w-4 h-4 text-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.CONTACT_ACTION_CALL}</span>
              </a>

              <a
                href={`https://wa.me/${CLINIC_CONFIG.WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{CLINIC_TEXTS.CONTACT_ACTION_WHATSAPP}</span>
              </a>

              <a
                href={CLINIC_CONFIG.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-xs font-semibold bg-[#E1306C] text-white hover:opacity-90 transition-opacity shadow-sm"
              >
                <InstagramIcon className="w-4 h-4" />
                <span>{CLINIC_TEXTS.CONTACT_ACTION_INSTAGRAM}</span>
              </a>
            </div>
          </div>

          {/* Navigation Apps Hub (5 cols) */}
          <div className="lg:col-span-5 bg-[#332635] text-[#F7F3EE] p-8 sm:p-12 rounded-[2.5rem] border border-[#D8B6BE]/20 shadow-2xl flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#D8B6BE] uppercase font-['Outfit'] mb-2">
                <Navigation className="w-4 h-4" />
                <span>NAVIGATION APPS</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-light text-white">
                {CLINIC_TEXTS.CONTACT_NAV_TITLE}
              </h3>
              <p className="text-xs sm:text-sm text-[#F7F3EE]/80 font-light leading-relaxed mt-3">
                {CLINIC_TEXTS.CONTACT_NAV_DESC}
              </p>
            </div>

            {/* Exactly Three Navigation Buttons */}
            <div className="space-y-3 pt-2">
              {/* Balad */}
              <a
                href={CLINIC_CONFIG.MAP_BALAD_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!CLINIC_CONFIG.MAP_BALAD_URL}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                  CLINIC_CONFIG.MAP_BALAD_URL
                    ? 'bg-rose/15 hover:bg-rose/30 border border-white/10 text-[#F7F3EE] hover:scale-[1.01]'
                    : 'opacity-40 cursor-not-allowed bg-rose/10 text-white/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-3 h-3 rounded-full bg-[#1EA896] shadow-xs" />
                  <span className="text-sm font-medium">{CLINIC_TEXTS.CONTACT_NAV_BALAD}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D8B6BE]" />
              </a>

              {/* Neshan */}
              <a
                href={CLINIC_CONFIG.MAP_NESHAN_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!CLINIC_CONFIG.MAP_NESHAN_URL}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                  CLINIC_CONFIG.MAP_NESHAN_URL
                    ? 'bg-rose/15 hover:bg-rose/30 border border-white/10 text-[#F7F3EE] hover:scale-[1.01]'
                    : 'opacity-40 cursor-not-allowed bg-rose/10 text-white/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-3 h-3 rounded-full bg-[#0084FF] shadow-xs" />
                  <span className="text-sm font-medium">{CLINIC_TEXTS.CONTACT_NAV_NESHAN}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D8B6BE]" />
              </a>

              {/* Google Maps */}
              <a
                href={CLINIC_CONFIG.MAP_GOOGLE_URL || '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!CLINIC_CONFIG.MAP_GOOGLE_URL}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                  CLINIC_CONFIG.MAP_GOOGLE_URL
                    ? 'bg-rose/15 hover:bg-rose/30 border border-white/10 text-[#F7F3EE] hover:scale-[1.01]'
                    : 'opacity-40 cursor-not-allowed bg-rose/10 text-white/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-3 h-3 rounded-full bg-[#EA4335] shadow-xs" />
                  <span className="text-sm font-medium">{CLINIC_TEXTS.CONTACT_NAV_GOOGLE}</span>
                </div>
                <ExternalLink className="w-4 h-4 text-[#D8B6BE]" />
              </a>
            </div>

            <div className="pt-2 text-[11px] text-[#F7F3EE]/60 flex items-center justify-center gap-1.5 font-light">
              <Compass className="w-3.5 h-3.5 text-[#D8B6BE]" />
              <span>{CLINIC_TEXTS.PARKING_NOTE}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
