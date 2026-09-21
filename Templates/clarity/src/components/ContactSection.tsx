import React from 'react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Phone, Clock, MapPin, ArrowUpLeft } from 'lucide-react';
import { InstagramIcon, WhatsAppIcon, BaladIcon, NeshanIcon, GoogleMapsIcon } from './Icons';

export const ContactSection: React.FC = () => {
  return (
    <section
      id="contact"
      className="py-20 lg:py-28 relative bg-[#E4F0F6]"
      aria-label="اطلاعات تماس و نشانی کلینیک کلاریتی"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        
        {/* Section Header */}
        <div className="text-right max-w-xl mb-12 lg:mb-16">
          <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
            GET IN TOUCH
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#203A43] tracking-tight mt-2">
            با ما در ارتباط باشید
          </h2>
          <p className="text-sm text-[#69767C] mt-2 leading-relaxed">
            برای هماهنگی وقت مشاوره، راهنمایی خدمات یا کسب اطلاعات بیشتر، از مسیرهای زیر با ما تماس بگیرید.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Info Card */}
          <div className="lg:col-span-7 bg-[#F6E3E6] rounded-3xl border border-[#CFE8F3] p-6 sm:p-10 shadow-[0_4px_30px_rgba(32,58,67,0.03)] text-right space-y-8">
            
            <div>
              <span className="text-xs font-latin font-bold text-[#69767C] uppercase tracking-wider">
                {CLINIC_CONFIG.CLINIC_NAME_EN}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#203A43] mt-1">
                {CLINIC_CONFIG.CLINIC_NAME}
              </h3>
              <p className="text-xs text-[#69767C] mt-1">
                {CLINIC_CONFIG.CLINIC_CATEGORY}
              </p>
            </div>

            {/* Information Rows */}
            <div className="space-y-5 divide-y divide-[#CFE8F3]/50">
              
              {/* Address */}
              <div className="flex items-start gap-4 pt-4 first:pt-0">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[#CFE8F3]/50 text-[#203A43] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#203A43] block">نشانی کلینیک:</span>
                  <p className="text-sm text-[#69767C] leading-relaxed mt-0.5">
                    {CLINIC_CONFIG.ADDRESS}
                  </p>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-start gap-4 pt-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[#CFE8F3]/50 text-[#203A43] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#203A43] block">ساعات پاسخگویی و حضور:</span>
                  <p className="text-sm text-[#69767C] leading-relaxed mt-0.5">
                    {CLINIC_CONFIG.WORKING_HOURS}
                  </p>
                </div>
              </div>

              {/* Phone & Mobile */}
              <div className="flex items-start gap-4 pt-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-[#CFE8F3]/50 text-[#203A43] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#203A43] block">شماره‌های تماس:</span>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-1 text-sm">
                    <a
                      href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
                      className="font-latin text-sm font-semibold text-[#203A43] hover:text-[#D9A6AE] transition-colors"
                      dir="ltr"
                    >
                      {CLINIC_CONFIG.PHONE_DISPLAY}
                    </a>
                    <span className="text-[#CFE8F3]">|</span>
                    <a
                      href={`tel:${CLINIC_CONFIG.MOBILE_NUMBER}`}
                      className="font-latin text-sm font-semibold text-[#203A43] hover:text-[#D9A6AE] transition-colors"
                      dir="ltr"
                    >
                      {CLINIC_CONFIG.MOBILE_DISPLAY}
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Direct Communication Buttons (Phone, WhatsApp, Instagram) */}
            <div className="pt-4 flex flex-wrap gap-3">
              <a
                href={`tel:${CLINIC_CONFIG.PHONE_NUMBER}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#203A43] text-[#FFFDFC] text-xs sm:text-sm font-semibold hover:bg-[#203A43]/90 transition-colors shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>تماس مستقیم</span>
              </a>

              <a
                href={CLINIC_CONFIG.WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3] hover:border-[#9FCFE0] hover:bg-[#CFE8F3]/30 text-xs sm:text-sm font-semibold transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#203A43]" />
                <span>پیام در واتساپ</span>
              </a>

              <a
                href={CLINIC_CONFIG.INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#F6E3E6] text-[#203A43] border border-[#CFE8F3] hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/30 text-xs sm:text-sm font-semibold transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#D9A6AE]" />
                <span>صفحه اینستاگرام</span>
              </a>
            </div>

          </div>

          {/* Navigation Apps Section (Balad, Neshan, Google Maps) */}
          <div id="routing" className="lg:col-span-5 bg-[#F6E3E6] rounded-3xl border border-[#CFE8F3] p-6 sm:p-8 flex flex-col justify-between text-right space-y-6 shadow-[0_4px_30px_rgba(32,58,67,0.03)] scroll-mt-24">
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#69767C] tracking-wider uppercase">
                ROUTING & MAPS
              </span>
              <h3 className="text-xl font-bold text-[#203A43]">
                مسیریابی به کلینیک
              </h3>
              <p className="text-xs sm:text-sm text-[#69767C] leading-relaxed">
                جهت دسترسی آسان و مسیریابی به کلینیک، اپلیکیشن مورد نظر خود را انتخاب کنید:
              </p>
            </div>

            {/* Exactly 3 Navigation Buttons: Balad, Neshan, Google Maps */}
            <div className="space-y-3">
              
              {/* 1. Balad */}
              {CLINIC_CONFIG.MAP_BALAD_URL ? (
                <a
                  href={CLINIC_CONFIG.MAP_BALAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] hover:bg-[#CFE8F3]/40 border border-[#CFE8F3] transition-all group"
                  aria-label="مسیریابی با اپلیکیشن بلد"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] border border-[#CFE8F3] flex items-center justify-center text-[#203A43]">
                      <BaladIcon className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#203A43] block">مسیریابی با بلد</span>
                      <span className="text-[11px] text-[#69767C]">Balad Navigation</span>
                    </div>
                  </div>
                  <ArrowUpLeft className="w-4 h-4 text-[#69767C] group-hover:text-[#203A43] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] border border-[#CFE8F3]/50 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] flex items-center justify-center text-[#69767C]">
                      <BaladIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-[#69767C]">مسیریابی با بلد (غیرفعال)</span>
                  </div>
                </button>
              )}

              {/* 2. Neshan */}
              {CLINIC_CONFIG.MAP_NESHAN_URL ? (
                <a
                  href={CLINIC_CONFIG.MAP_NESHAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] hover:bg-[#CFE8F3]/40 border border-[#CFE8F3] transition-all group"
                  aria-label="مسیریابی با اپلیکیشن نشان"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] border border-[#CFE8F3] flex items-center justify-center text-[#203A43]">
                      <NeshanIcon className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#203A43] block">مسیریابی با نشان</span>
                      <span className="text-[11px] text-[#69767C]">Neshan Navigation</span>
                    </div>
                  </div>
                  <ArrowUpLeft className="w-4 h-4 text-[#69767C] group-hover:text-[#203A43] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] border border-[#CFE8F3]/50 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] flex items-center justify-center text-[#69767C]">
                      <NeshanIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-[#69767C]">مسیریابی با نشان (غیرفعال)</span>
                  </div>
                </button>
              )}

              {/* 3. Google Maps */}
              {CLINIC_CONFIG.MAP_GOOGLE_URL ? (
                <a
                  href={CLINIC_CONFIG.MAP_GOOGLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] hover:bg-[#CFE8F3]/40 border border-[#CFE8F3] transition-all group"
                  aria-label="مسیریابی در گوگل مپ"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] border border-[#CFE8F3] flex items-center justify-center text-[#203A43]">
                      <GoogleMapsIcon className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#203A43] block">Google Maps</span>
                      <span className="text-[11px] text-[#69767C]">نقشه گوگل</span>
                    </div>
                  </div>
                  <ArrowUpLeft className="w-4 h-4 text-[#69767C] group-hover:text-[#203A43] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ) : (
                <button
                  disabled
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#E4F0F6] border border-[#CFE8F3]/50 opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F6E3E6] flex items-center justify-center text-[#69767C]">
                      <GoogleMapsIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-[#69767C]">Google Maps (غیرفعال)</span>
                  </div>
                </button>
              )}

            </div>

            {/* Note */}
            <div className="pt-2 text-right">
              <p className="text-[11px] text-[#69767C]">
                * دسترسی آسان از طریق وسایل نقلیه عمومی و پارکینگ اختصاصی ساختمان سپهر فراهم است.
              </p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
