import React from 'react';
import { Calendar, ChevronDown, Star, Clock, Laptop, Award, ArrowUpLeft } from 'lucide-react';
import { SITE_IMAGES } from '../data/images';

interface HeroProps {
  onOpenContact: (topic?: string) => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenContact, onExploreServices }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-28 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      {/* Dynamic Background Ambient Glows */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-[#5DB8FF]/15 blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/3 -left-32 w-[30rem] h-[30rem] rounded-full bg-[#7FE7FF]/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[45rem] h-[45rem] rounded-full bg-radial from-[#5DB8FF]/5 to-transparent blur-[160px] pointer-events-none" />

      {/* Subtle Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Content Column (RTL Start) - 6 cols */}
          <div className="lg:col-span-6 flex flex-col items-start text-right space-y-7">
            
            {/* Template Badge & Luxury Tag */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 backdrop-blur-md shadow-[0_0_15px_rgba(93,184,255,0.15)]">
              <span className="flex h-2 w-2 rounded-full bg-[#7FE7FF] animate-ping" />
              <span className="text-xs font-semibold text-[#7FE7FF] tracking-wide">
                کلینیک تخصصی دندانپزشکی لوکس
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] font-medium text-slate-300">
                طراحی دیجیتال و اختصاصی
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.2] tracking-tight">
              <span>لبخندی که با </span>
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-l from-[#7FE7FF] via-[#5DB8FF] to-white">
                اطمینان
                <span className="absolute bottom-1 right-0 left-0 h-[3px] bg-gradient-to-l from-[#7FE7FF] to-transparent rounded-full opacity-80" />
              </span>
              <br className="hidden sm:inline" />
              <span> می‌سازید.</span>
            </h1>

            {/* Subtitle / Copy */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              دندانپزشکی زیبایی و ترمیمی با رویکردی مدرن، دقیق و متناسب با ویژگی‌های منحصر‌به‌فرد شما.
              تجربه‌ای آرام در محیطی کاملاً خصوصی با بهره‌گیری از آخرین تکنولوژی‌های اسکن نوری و طراحی کامپیوتری.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              {/* Primary CTA */}
              <button
                onClick={() => onOpenContact('مشاوره تخصصی لبخند')}
                className="group relative flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-sm font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] via-[#7FE7FF] to-[#5DB8FF] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_8px_30px_rgba(93,184,255,0.4)] hover:shadow-[0_12px_40px_rgba(127,231,255,0.6)] hover:-translate-y-0.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#07111F]" />
                <span>رزرو مشاوره</span>
                <ArrowUpLeft className="w-4 h-4 text-[#07111F] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-0.5" />
              </button>

              {/* Secondary CTA */}
              <button
                onClick={onExploreServices}
                className="flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl text-sm font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/15 hover:border-white/30 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
              >
                <span>مشاهده خدمات</span>
                <ChevronDown className="w-4 h-4 text-[#5DB8FF]" />
              </button>
            </div>

            {/* Trust highlight strip inside hero */}
            <div className="pt-6 border-t border-white/10 w-full grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-white font-mono" dir="ltr">100%</span>
                <span className="text-xs text-slate-400">طراحی اختصاصی لبخند</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-white font-mono" dir="ltr">0.01 mm</span>
                <span className="text-xs text-slate-400">دقت اسکن سه‌بعدی</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-white font-mono" dir="ltr">VIP</span>
                <span className="text-xs text-slate-400">سوئیت خصوصی درمان</span>
              </div>
            </div>

          </div>

          {/* Visual Column with Floating Cards - 6 cols */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            
            {/* Main Portrait Frame with Glass Highlights */}
            <div className="relative w-full max-w-md sm:max-w-lg aspect-[4/5] rounded-3xl p-2.5 bg-gradient-to-b from-white/15 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 shadow-[0_20px_70px_rgba(0,0,0,0.7)] group">
              
              {/* Inner glowing edge */}
              <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#0a1728]">
                <img
                  src={SITE_IMAGES.hero.main}
                  alt={SITE_IMAGES.hero.alt}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Soft Gradient Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/20 to-transparent" />

                {/* Subtitle tag at bottom of image */}
                <div className="absolute bottom-4 right-4 left-4 p-3 rounded-xl bg-[#07111F]/75 backdrop-blur-md border border-white/15 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7FE7FF] shadow-[0_0_8px_#7FE7FF]" />
                    <span className="text-xs font-semibold text-white">طراحی اختصاصی لبخند (DSD)</span>
                  </div>
                  <span className="text-[11px] text-slate-300">طبیعی و متوازن</span>
                </div>
              </div>

              {/* FLOATING CARD 1: رضایت بیماران ۴.۹ از ۵ (Top Right) */}
              <div className="absolute -top-5 -right-4 sm:-right-6 glass-card-primary px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-soft-float border border-white/20 z-20">
                <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
                </div>
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-white font-mono" dir="ltr">4.9 / 5</span>
                  </div>
                  <span className="text-[11px] text-slate-300 font-medium">رضایت بیماران</span>
                </div>
              </div>

              {/* FLOATING CARD 2: نوبت‌دهی سریع (Top Left) */}
              <div className="absolute top-1/4 -left-4 sm:-left-8 glass-card-primary px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-soft-float-delayed border border-white/20 z-20">
                <div className="w-10 h-10 rounded-xl bg-[#5DB8FF]/15 border border-[#5DB8FF]/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#7FE7FF]" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">هماهنگی سریع</span>
                  <span className="text-[11px] text-[#7FE7FF]">بدون معطلی در مطب</span>
                </div>
              </div>

              {/* FLOATING CARD 3: طراحی دیجیتال لبخند (Bottom Left) */}
              <div className="absolute bottom-20 -left-4 sm:-left-6 glass-card-highlight px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-soft-float border border-[#5DB8FF]/40 z-20">
                <div className="w-10 h-10 rounded-xl bg-[#5DB8FF]/20 border border-[#5DB8FF]/50 flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-[#7FE7FF]" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">طراحی دیجیتال لبخند</span>
                  <span className="text-[11px] text-slate-300">پیش‌نمایش قبل از درمان</span>
                </div>
              </div>

              {/* FLOATING CARD 4: پزشکان متخصص (Bottom Right) */}
              <div className="absolute -bottom-6 -right-2 sm:-right-4 glass-card-primary px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-soft-float-delayed border border-white/20 z-20">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
                  <Award className="w-5 h-5 text-emerald-300" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-white">پزشکان متخصص</span>
                  <span className="text-[11px] text-slate-300">بورد تخصصی و فلوشیپ</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
