import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import {
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  ExternalLink,
  Smartphone,
} from "lucide-react";

export const ContactSection: React.FC = () => {
  return (
    <section
      id="contact"
      aria-label="اطلاعات تماس و نشانی کلینیک"
      className="py-16 md:py-24 bg-[#EEF5F7] border-b border-[#0B1F2A]/10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Heading Context */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-[2px] bg-[#E88B7B]" />
              <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
                {SITE_CONTENT.CONTACT_SECTION.LABEL}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B1F2A] tracking-tight mb-4">
              {SITE_CONTENT.CONTACT_SECTION.TITLE}
            </h2>

            <p className="text-sm text-[#7B858A] leading-relaxed mb-6">
              {SITE_CONTENT.CONTACT_SECTION.SUBTITLE}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <a
                href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                className="flex items-center justify-between px-5 py-3.5 bg-[#0B1F2A] text-white hover:bg-[#16394A] text-xs font-semibold transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#E88B7B]" />
                  <span>{SITE_CONTENT.CONTACT_SECTION.DIRECT_CALL_BTN}</span>
                </div>
                <span
                  dir="ltr"
                  className="font-number text-xs text-[#DDECF0] font-bold tracking-wider"
                >
                  {SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}
                </span>
              </a>

              <a
                href={SITE_CONTENT.CONTACT.WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-3.5 bg-white text-[#0B1F2A] border border-[#0B1F2A]/15 hover:bg-[#DDECF0] text-xs font-semibold transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-4 h-4 text-[#16394A]" />
                  <span>{SITE_CONTENT.CONTACT_SECTION.WHATSAPP_BTN}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              <a
                href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-5 py-3.5 bg-white text-[#0B1F2A] border border-[#0B1F2A]/15 hover:bg-[#DDECF0] text-xs font-semibold transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-4 h-4 text-[#16394A] fill-none stroke-current stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span>{SITE_CONTENT.CONTACT_SECTION.INSTAGRAM_BTN}</span>
                </div>
                <span
                  dir="ltr"
                  className="font-number text-xs text-[#7B858A] tracking-wider"
                >
                  {SITE_CONTENT.CONTACT.INSTAGRAM_HANDLE}
                </span>
              </a>
            </div>
          </div>

          {/* Right Detailed Information Panel */}
          <div className="lg:col-span-8 bg-[#F7F6F2] border border-[#0B1F2A]/12 p-6 sm:p-10 space-y-8">
            {/* Clinic Name & Headline */}
            <div className="pb-6 border-b border-[#0B1F2A]/10">
              <span className="text-xs text-[#7B858A] block mb-1">
                {SITE_CONTENT.CONTACT_SECTION.CENTER_BADGE}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#0B1F2A]">
                {SITE_CONTENT.BRAND.NAME_FA}
              </h3>
              <p className="text-xs sm:text-sm text-[#16394A] mt-1 font-medium">
                {SITE_CONTENT.BRAND.CATEGORY}
              </p>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A] shrink-0 border border-[#0B1F2A]/10">
                <MapPin className="w-4 h-4 text-[#0B1F2A]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#7B858A] uppercase tracking-wider block mb-1">
                  {SITE_CONTENT.CONTACT_SECTION.ADDRESS_LABEL}
                </span>
                <p className="text-sm sm:text-base text-[#0B1F2A] font-medium leading-relaxed">
                  {SITE_CONTENT.CONTACT.ADDRESS}
                </p>
              </div>
            </div>

            {/* Numbers Grid (with explicit LTR display) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A] shrink-0 border border-[#0B1F2A]/10">
                  <Phone className="w-4 h-4 text-[#0B1F2A]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#7B858A] uppercase tracking-wider block mb-1">
                    {SITE_CONTENT.CONTACT_SECTION.PHONE_LABEL}
                  </span>
                  <a
                    href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                    dir="ltr"
                    className="font-number text-base font-bold text-[#0B1F2A] hover:text-[#E88B7B] transition-colors inline-block text-left tracking-wider"
                  >
                    {SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A] shrink-0 border border-[#0B1F2A]/10">
                  <Smartphone className="w-4 h-4 text-[#0B1F2A]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#7B858A] uppercase tracking-wider block mb-1">
                    {SITE_CONTENT.CONTACT_SECTION.MOBILE_LABEL}
                  </span>
                  <a
                    href={`tel:${SITE_CONTENT.CONTACT.MOBILE_RAW}`}
                    dir="ltr"
                    className="font-number text-base font-bold text-[#0B1F2A] hover:text-[#E88B7B] transition-colors inline-block text-left tracking-wider"
                  >
                    {SITE_CONTENT.CONTACT.MOBILE_DISPLAY_LTR}
                  </a>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-start gap-4 pt-2">
              <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A] shrink-0 border border-[#0B1F2A]/10">
                <Clock className="w-4 h-4 text-[#0B1F2A]" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#7B858A] uppercase tracking-wider block mb-1">
                  {SITE_CONTENT.CONTACT_SECTION.HOURS_LABEL}
                </span>
                <p className="text-xs sm:text-sm text-[#0B1F2A] leading-relaxed">
                  {SITE_CONTENT.CONTACT.WORKING_HOURS}
                </p>
              </div>
            </div>

            {/* Navigation App Buttons */}
            <div className="pt-6 border-t border-[#0B1F2A]/10">
              <span className="text-xs font-bold text-[#7B858A] uppercase tracking-wider block mb-3">
                {SITE_CONTENT.CONTACT_SECTION.NAV_APPS_LABEL}
              </span>
              <div className="grid grid-cols-3 gap-3">
                {/* Balad */}
                {SITE_CONTENT.CONTACT.MAP_BALAD_URL ? (
                  <a
                    href={SITE_CONTENT.CONTACT.MAP_BALAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center py-2.5 px-3 bg-white border border-[#0B1F2A]/15 hover:bg-[#DDECF0] text-xs font-semibold text-[#0B1F2A] transition-colors"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.BALAD_BTN}
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-3 bg-[#EEF5F7] border border-[#0B1F2A]/10 text-xs font-semibold text-[#7B858A] opacity-50 cursor-not-allowed"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.BALAD_BTN}
                  </button>
                )}

                {/* Neshan */}
                {SITE_CONTENT.CONTACT.MAP_NESHAN_URL ? (
                  <a
                    href={SITE_CONTENT.CONTACT.MAP_NESHAN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center py-2.5 px-3 bg-white border border-[#0B1F2A]/15 hover:bg-[#DDECF0] text-xs font-semibold text-[#0B1F2A] transition-colors"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.NESHAN_BTN}
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-3 bg-[#EEF5F7] border border-[#0B1F2A]/10 text-xs font-semibold text-[#7B858A] opacity-50 cursor-not-allowed"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.NESHAN_BTN}
                  </button>
                )}

                {/* Google Maps */}
                {SITE_CONTENT.CONTACT.MAP_GOOGLE_URL ? (
                  <a
                    href={SITE_CONTENT.CONTACT.MAP_GOOGLE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center py-2.5 px-3 bg-white border border-[#0B1F2A]/15 hover:bg-[#DDECF0] text-xs font-semibold text-[#0B1F2A] transition-colors"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.GOOGLE_MAPS_BTN}
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-3 bg-[#EEF5F7] border border-[#0B1F2A]/10 text-xs font-semibold text-[#7B858A] opacity-50 cursor-not-allowed"
                  >
                    {SITE_CONTENT.CONTACT_SECTION.GOOGLE_MAPS_BTN}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
