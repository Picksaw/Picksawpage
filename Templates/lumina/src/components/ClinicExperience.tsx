import React, { useState } from 'react';
import { CLINIC_GALLERY } from '../data/content';
import { GalleryItem } from '../types';
import { Sparkles, Maximize2, X, Compass, Coffee, Shield, Eye } from 'lucide-react';

export const ClinicExperience: React.FC = () => {
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  const clinicPerks = [
    {
      icon: Coffee,
      title: 'بار سلامت و ولکام درینک',
      desc: 'پذیرایی با نوشیدنی‌های طبیعی و آرامش‌بخش در بدو ورود.',
    },
    {
      icon: Shield,
      title: 'سوئیت‌های کاملاً ایزوله',
      desc: 'حفظ کامل حریم خصوصی و بالاترین استاندارد استریلیزاسیون.',
    },
    {
      icon: Eye,
      title: 'مانیتورهای آرامش بصری',
      desc: 'تماشای مناظر طبیعی و موسیقی بی‌کلام هنگام درمان.',
    },
    {
      icon: Compass,
      title: 'پارکینگ اختصاصی VIP',
      desc: 'دسترسی آسان با پارکینگ اختصاصی برای مراجعان کلینیک.',
    },
  ];

  return (
    <section id="clinic" className="relative py-24 sm:py-32 overflow-hidden scroll-mt-20">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-[35rem] h-[35rem] rounded-full bg-[#5DB8FF]/10 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>معماری و اتمسفر کلینیک</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            تجربه‌ای متفاوت از دندانپزشکی
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            فضایی آرام، لوکس و عاری از هرگونه حس بیمارستانی؛ طراحی‌شده برای آسودگی خاطر و احترام به شأن شما.
          </p>
        </div>

        {/* Editorial Asymmetric Image Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
          
          {/* Main Large Image (Reception Lounge) - 7 cols */}
          <div 
            onClick={() => setActiveLightboxItem(CLINIC_GALLERY[0])}
            className="md:col-span-7 group relative rounded-3xl overflow-hidden border border-white/15 bg-[#091524] cursor-pointer aspect-[16/10] md:aspect-auto md:min-h-[420px] shadow-2xl transition-all duration-500 hover:border-[#5DB8FF]/50"
          >
            <img
              src={CLINIC_GALLERY[0].image}
              alt={CLINIC_GALLERY[0].title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            
            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/30 to-transparent" />

            {/* Top Tag & Zoom */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-[#07111F]/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-[#7FE7FF]">
                {CLINIC_GALLERY[0].category}
              </span>
            </div>

            <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-[#07111F]/70 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="w-4 h-4" />
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-6 right-6 left-6 text-right">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {CLINIC_GALLERY[0].title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed font-normal">
                {CLINIC_GALLERY[0].description}
              </p>
            </div>
          </div>

          {/* Right Column (2 Stacked or 5 cols) */}
          <div className="md:col-span-5 flex flex-col gap-6">
            
            {/* Private VIP Suite */}
            <div
              onClick={() => setActiveLightboxItem(CLINIC_GALLERY[1])}
              className="group relative rounded-3xl overflow-hidden border border-white/15 bg-[#091524] cursor-pointer aspect-[16/10] md:h-[200px] shadow-xl transition-all duration-500 hover:border-[#5DB8FF]/50"
            >
              <img
                src={CLINIC_GALLERY[1].image}
                alt={CLINIC_GALLERY[1].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/30 to-transparent" />
              <div className="absolute bottom-4 right-4 left-4 text-right">
                <span className="text-[11px] font-semibold text-[#7FE7FF] block mb-0.5">{CLINIC_GALLERY[1].category}</span>
                <h4 className="text-base font-bold text-white">{CLINIC_GALLERY[1].title}</h4>
              </div>
            </div>

            {/* Digital Workstation */}
            <div
              onClick={() => setActiveLightboxItem(CLINIC_GALLERY[2])}
              className="group relative rounded-3xl overflow-hidden border border-white/15 bg-[#091524] cursor-pointer aspect-[16/10] md:h-[200px] shadow-xl transition-all duration-500 hover:border-[#5DB8FF]/50"
            >
              <img
                src={CLINIC_GALLERY[2].image}
                alt={CLINIC_GALLERY[2].title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/30 to-transparent" />
              <div className="absolute bottom-4 right-4 left-4 text-right">
                <span className="text-[11px] font-semibold text-[#7FE7FF] block mb-0.5">{CLINIC_GALLERY[2].category}</span>
                <h4 className="text-base font-bold text-white">{CLINIC_GALLERY[2].title}</h4>
              </div>
            </div>

          </div>

        </div>

        {/* 4 Clinic Amenities Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {clinicPerks.map((perk, i) => {
            const Icon = perk.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#5DB8FF]/30 transition-all duration-300 flex items-start gap-4 text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-[#5DB8FF]/10 border border-[#5DB8FF]/30 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#7FE7FF]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{perk.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">{perk.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeLightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07111F]/90 backdrop-blur-2xl animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setActiveLightboxItem(null)} />
          <div className="relative max-w-4xl w-full bg-[#0a182c] border border-white/20 rounded-3xl overflow-hidden shadow-2xl z-10">
            <button
              onClick={() => setActiveLightboxItem(null)}
              className="absolute top-4 left-4 z-20 p-2 rounded-xl text-slate-300 hover:text-white bg-[#07111F]/80 backdrop-blur-md border border-white/20 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-[16/10] w-full bg-black">
              <img
                src={activeLightboxItem.image}
                alt={activeLightboxItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 text-right">
              <span className="text-xs font-semibold text-[#7FE7FF] mb-1 block">
                {activeLightboxItem.category}
              </span>
              <h3 className="text-xl font-bold text-white mb-2">
                {activeLightboxItem.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {activeLightboxItem.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
