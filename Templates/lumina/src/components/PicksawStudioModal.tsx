import React from 'react';
import { CLINIC_INFO } from '../data/content';
import { X, Sparkles, CheckCircle, Palette, Code, Smartphone, Rocket, MessageCircle } from 'lucide-react';

interface PicksawStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PicksawStudioModal: React.FC<PicksawStudioModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: Palette,
      title: 'طراحی بصری لوکس و سفارشی',
      desc: 'ترکیب رنگی سرمه‌ای عمیق، شیشه مات و نور فیروزه‌ای اختصاصی برای کلینیک‌های پرمیوم.',
    },
    {
      icon: Code,
      title: 'کدنویسی استاندارد و بهینه‌سازی سئو',
      desc: 'ساختار React و Tailwind به همراه انیمیشن‌های فوق‌روان و لودینگ فوق سریع.',
    },
    {
      icon: Smartphone,
      title: 'طراحی کاملاً Mobile-First و ریسپانسیو',
      desc: 'تجربه بی‌نقص روی انواع گوشی‌های هوشمند، تبلت‌ها و مانیتورهای بزرگ.',
    },
    {
      icon: Rocket,
      title: 'ماژول‌های تبدیل بازدیدکننده به مراجعه‌کننده',
      desc: 'اسلایدر قبل و بعد تعاملی، سیستم رزرو وقت مشاوره، و معرفی حرفه‌ای پزشکان.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07111F]/85 backdrop-blur-2xl animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-[#09172b] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.9)] z-10 text-right overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-[#7FE7FF]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7FE7FF] mb-2">
          <Sparkles className="w-4 h-4" />
          <span>{CLINIC_INFO.templateNumber} — مجموعه قالب‌های اختصاصی Picksaw Studio</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
          شخصی‌سازی قالب «لومینا دنتال» برای کلینیک شما
        </h3>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
          این قالب به صورت اختصاصی برای پزشکان و کلینیک‌های دندانپزشکی طراحی شده که می‌خواهند تصویری مدرن، متمایز و سطح‌بالا به مراجعان خود ارائه دهند. تمامی بخش‌ها از قبیل تصاویر، خدمات، پزشکان، ویدیوها و سیستم نوبت‌دهی متناسب با برند کلینیک شما قابل شخصی‌سازی است.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#5DB8FF]/15 border border-[#5DB8FF]/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#7FE7FF]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-1">{feat.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-2 mb-8 p-4 rounded-2xl bg-[#5DB8FF]/10 border border-[#5DB8FF]/20 text-xs text-slate-300">
          <span className="text-[#7FE7FF] font-bold block mb-1">خدمات ارائه‌شده توسط استودیو Picksaw:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>شخصی‌سازی کامل هویت بصری و رنگ‌بندی</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>اتصال به سیستم پیامکی و پنل مدیریت نوبت</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>تولید محتوای متنی تخصصی پزشکی و کپی‌رایتینگ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>پشتیبانی فنی اختصاصی و هاستینگ پرسرعت</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            مشاهده ادامه دمو
          </button>

          <a
            href={`tel:${CLINIC_INFO.phoneRaw}`}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] hover:opacity-90 shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مشاوره سفارش و راه‌اندازی با Picksaw Studio</span>
          </a>
        </div>

      </div>
    </div>
  );
};
