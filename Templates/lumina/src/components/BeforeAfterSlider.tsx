import React, { useState, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  MoveHorizontal, 
  CheckCircle2, 
  Clock, 
  User, 
  Layers, 
  Maximize2, 
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  SlidersHorizontal,
  Info,
  SplitSquareVertical,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { SITE_IMAGES } from '../data/images';

interface BeforeAfterProps {
  onOpenContact: (topic?: string) => void;
}

interface CaseStudy {
  id: string;
  title: string;
  tag: string;
  serviceId: string;
  doctorId: string;
  doctorName: string;
  doctorRole: string;
  beforeImg: string;
  afterImg: string;
  beforeTitle: string;
  afterTitle: string;
  patientAge: string;
  treatmentTime: string;
  primaryConcern: string;
  appliedSolution: string;
  clinicalNotes: string;
  shadeChange: string;
  materialUsed: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'case-veneers',
    title: 'لمینت سرامیکی فوق‌نازک E-Max',
    tag: 'طراحی لبخند زیبایی',
    serviceId: 'laminates',
    doctorId: 'dr-moradi',
    doctorName: 'دکتر النا مرادی',
    doctorRole: 'متخصص دندانپزشکی زیبایی',
    beforeImg: SITE_IMAGES.beforeAfter.case1.before,
    afterImg: SITE_IMAGES.beforeAfter.case1.after,
    beforeTitle: 'وضعیت اولیه: سایش لبه‌ها و کدر شدن رنگ دندان‌ها در معاینه بالینی',
    afterTitle: 'نتیجه نهایی: ۸ واحد لمینت سرامیکی با تقارن کامل و بازتاب نوری زنده',
    patientAge: '۳۲ سال',
    treatmentTime: '۲ جلسه (۱۰ روز کاری)',
    primaryConcern: 'زردی عاجی دندان‌ها، لبه‌های نامتقارن قدامی و کاهش بازتاب نور طبیعی',
    appliedSolution: '۸ واحد لمینت سرامیکی فوق‌نازک فلدسپاتیک با تکنولوژی E-Max و تراش مینی‌مال (۰.۳ میلی‌متر)',
    clinicalNotes: 'حفظ ۹۵٪ مینای زنده دندان و تنظیم رنگ عاجی شفاف با انعکاس نور زنده متناسب با چهره.',
    shadeChange: 'از رنگ A3.5 به شید پرسلین BL3',
    materialUsed: 'ایماکس سوئیسی (Ivoclar Vivadent)',
  },
  {
    id: 'case-ortho',
    title: 'ارتودنسی و اصلاح نامنظمی با الاینر شفاف',
    tag: 'ارتودنسی دیجیتال',
    serviceId: 'orthodontics',
    doctorId: 'dr-naderi',
    doctorName: 'دکتر سوفیا نادری',
    doctorRole: 'متخصص ارتودنسی',
    beforeImg: SITE_IMAGES.beforeAfter.case2.before,
    afterImg: SITE_IMAGES.beforeAfter.case2.after,
    beforeTitle: 'وضعیت اولیه: به‌هم‌ریختگی شدید قوس قدامی و سیم‌کشی سنتی',
    afterTitle: 'نتیجه نهایی: ردیف شدن کامل دندان‌ها، تقارن خط لبخند و رفع زاویه‌ها',
    patientAge: '۲۶ سال',
    treatmentTime: '۸ ماه (۱۶ سری پلاک الاینر)',
    primaryConcern: 'نامرتبی دندان‌های فک بالا و پایین و عدم تطابق خط وسط دندانی (Midline)',
    appliedSolution: 'برنامه‌ریزی سه‌بعدی دیجیتال و اصلاح موقعیت دندان‌ها با پلاک‌های نامرئی الاینر',
    clinicalNotes: 'دستیابی به اکلوژن استاندارد بدون کشیدن دندان و با حفظ کامل سلامت بافت استخوانی فک.',
    shadeChange: 'اصلاح کامل موقعیت + پولیش سطح مینا',
    materialUsed: 'پلیمر زیست‌سازگار SmartTrack',
  },
  {
    id: 'case-whitening',
    title: 'بلیچینگ تخصصی مطبی و پولیش نوری',
    tag: 'روشن‌سازی کنترل‌شده',
    serviceId: 'whitening',
    doctorId: 'dr-karimi',
    doctorName: 'دکتر دانیال کریمی',
    doctorRole: 'متخصص جراحی و ایمپلنت',
    beforeImg: SITE_IMAGES.beforeAfter.case3.before,
    afterImg: SITE_IMAGES.beforeAfter.case3.after,
    beforeTitle: 'وضعیت اولیه: تیرگی عمیق مینا و تغییر رنگ تیره ناشی از رنگدانه‌ها',
    afterTitle: 'نتیجه نهایی: لبخند شفاف، سفید طبیعی و یکنواخت بدون لک',
    patientAge: '۳۵ سال',
    treatmentTime: '۱ جلسه (۶۰ دقیقه)',
    primaryConcern: 'تغییر رنگ عمیق ناشی از مصرف چای و قهوه و کدر شدن سطح مینا',
    appliedSolution: 'بلیچینگ آفیس با فعال‌کننده نوری فیلیپس زوم و محافظت کامل بافت حساس لثه',
    clinicalNotes: 'استفاده از ژل ضدحساسیت Relief ACP جهت رفع کامل هرگونه حساسیت پس از درمان.',
    shadeChange: 'روشن شدن ۶ درجه‌ای چارت رنگی (Vita)',
    materialUsed: 'Philips Zoom WhiteSpeed',
  },
];

export const BeforeAfterSlider: React.FC<BeforeAfterProps> = ({ onOpenContact }) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'before' | 'after'>('side-by-side');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeCase = CASE_STUDIES[activeCaseIndex];

  const updatePositionFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedPercent = Math.max(2, Math.min(98, (relativeX / rect.width) * 100));
    setSliderPosition(clampedPercent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    if (viewMode !== 'slider') setViewMode('slider');
    updatePositionFromClientX(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePositionFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  const nextCase = () => {
    setActiveCaseIndex((prev) => (prev + 1) % CASE_STUDIES.length);
    setSliderPosition(50);
  };

  const prevCase = () => {
    setActiveCaseIndex((prev) => (prev - 1 + CASE_STUDIES.length) % CASE_STUDIES.length);
    setSliderPosition(50);
  };

  return (
    <section id="before-after" className="relative py-24 sm:py-32 bg-[#050c18] overflow-hidden scroll-mt-20">
      {/* Dynamic Background Ambience */}
      <div className="absolute top-1/3 -right-20 w-[35rem] h-[35rem] rounded-full bg-[#5DB8FF]/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-[35rem] h-[35rem] rounded-full bg-[#7FE7FF]/8 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#5DB8FF]/30 text-xs font-semibold text-[#7FE7FF] shadow-[0_0_20px_rgba(93,184,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نتایج واقعی درمان و تغییر لبخند</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            تغییر را ببینید.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            نتیجه‌ای طبیعی، متناسب با چهره و با دقت در جزئیات.
          </p>
        </div>

        {/* Case Study Selection Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-10 max-w-4xl mx-auto">
          {CASE_STUDIES.map((c, idx) => {
            const isActive = idx === activeCaseIndex;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCaseIndex(idx);
                  setSliderPosition(50);
                }}
                className={`relative px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-l from-[#5DB8FF] via-[#7FE7FF] to-[#5DB8FF] text-[#07111F] shadow-[0_6px_25px_rgba(93,184,255,0.4)] scale-105 z-10'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current opacity-80" />
                <span>{c.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Showcase Wrapper */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl p-4 sm:p-7 bg-gradient-to-b from-white/[0.1] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1">
              
              {/* Left Controls */}
              <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.05] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'side-by-side'
                      ? 'bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] text-[#07111F] shadow-md font-bold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                  <span>مقایسه کنار هم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'slider'
                      ? 'bg-[#5DB8FF] text-[#07111F] shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>اسلایدر روی هم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('before')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    viewMode === 'before'
                      ? 'bg-amber-400 text-[#07111F] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  فقط قبل
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('after')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    viewMode === 'after'
                      ? 'bg-emerald-400 text-[#07111F] shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  فقط بعد
                </button>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevCase}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="کیس قبلی"
                  aria-label="کیس قبلی"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <span className="text-xs text-slate-300 px-2 font-medium">
                  کیس {activeCaseIndex + 1} از {CASE_STUDIES.length}
                </span>

                <button
                  onClick={nextCase}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="کیس بعدی"
                  aria-label="کیس بعدی"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-[#5DB8FF]/20 border border-white/10 text-slate-300 hover:text-[#7FE7FF] transition-colors cursor-pointer mr-1"
                  title="بزرگ‌نمایی و بررسی دقیق"
                  aria-label="بزرگ‌نمایی"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* VIEW MODE 1: SIDE-BY-SIDE */}
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE CARD */}
                <div className="group relative rounded-2xl overflow-hidden border border-amber-400/30 bg-[#091524] shadow-xl flex flex-col justify-between">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07111f]">
                    <img
                      src={activeCase.beforeImg}
                      alt={activeCase.beforeTitle}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-[#07111F]/90 backdrop-blur-md text-xs font-bold text-amber-300 border border-amber-400/30 flex items-center gap-2 shadow-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>قبل از درمان (وضعیت اولیه)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#071424] border-t border-white/10 text-right">
                    <span className="text-[11px] font-semibold text-amber-400/90 block mb-1">معاینه و شرایط اولیه:</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {activeCase.beforeTitle}
                    </p>
                  </div>
                </div>

                {/* AFTER CARD */}
                <div className="group relative rounded-2xl overflow-hidden border border-[#5DB8FF]/50 bg-[#091524] shadow-xl flex flex-col justify-between">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#07111f]">
                    <img
                      src={activeCase.afterImg}
                      alt={activeCase.afterTitle}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-transparent to-transparent" />
                    
                    <div className="absolute top-3 right-3 px-3.5 py-1.5 rounded-xl bg-[#07111F]/90 backdrop-blur-md text-xs font-bold text-[#7FE7FF] border border-[#5DB8FF]/40 flex items-center gap-2 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#7FE7FF]" />
                      <span>بعد از درمان (نتیجه لومینا دنتال)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-[#07182c] border-t border-[#5DB8FF]/20 text-right">
                    <span className="text-[11px] font-semibold text-[#7FE7FF] block mb-1">نتیجه نهایی درمان:</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {activeCase.afterTitle}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: INTERACTIVE SLIDER */}
            {viewMode === 'slider' && (
              <div
                ref={containerRef}
                tabIndex={0}
                role="slider"
                aria-label="اسلایدر مقایسه قبل و بعد درمان"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sliderPosition)}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleKeyDown}
                className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-[#091524] shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#5DB8FF]"
                style={{ touchAction: 'none' }}
              >
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={activeCase.afterImg}
                    alt={`نتیجه بعد از درمان: ${activeCase.title}`}
                    className="w-full h-full object-cover object-center pointer-events-none"
                    draggable={false}
                  />
                </div>

                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                    WebkitClipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                  }}
                >
                  <img
                    src={activeCase.beforeImg}
                    alt={`وضعیت قبل از درمان: ${activeCase.title}`}
                    className="w-full h-full object-cover object-center pointer-events-none"
                    draggable={false}
                  />
                </div>

                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-gradient-to-b from-[#7FE7FF] via-white to-[#5DB8FF] shadow-[0_0_15px_#7FE7FF]" />
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-[#07111F]/95 backdrop-blur-md border-2 border-[#7FE7FF] shadow-[0_0_25px_rgba(127,231,255,0.9)] flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform">
                    <MoveHorizontal className="w-5 h-5 text-[#7FE7FF]" />
                  </div>
                </div>

                <div className="absolute top-4 left-4 z-20 px-3.5 py-1.5 rounded-xl bg-[#07111F]/90 backdrop-blur-md border border-amber-400/40 text-xs font-bold text-amber-300 flex items-center gap-2 shadow-lg pointer-events-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>قبل از درمان</span>
                </div>

                <div className="absolute top-4 right-4 z-20 px-3.5 py-1.5 rounded-xl bg-[#07111F]/90 backdrop-blur-md border border-[#5DB8FF]/60 text-xs font-bold text-[#7FE7FF] flex items-center gap-2 shadow-[0_0_15px_rgba(93,184,255,0.35)] pointer-events-none">
                  <CheckCircle2 className="w-4 h-4 text-[#7FE7FF]" />
                  <span>بعد از درمان</span>
                </div>

                <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-20">
                  <div className="px-4 py-1.5 rounded-full bg-[#07111F]/80 backdrop-blur-md border border-white/15 text-[11px] text-slate-200 flex items-center gap-2 shadow-lg">
                    <Eye className="w-3.5 h-3.5 text-[#5DB8FF]" />
                    <span>دسته وسط را بکشید یا روی تصویر کلیک کنید</span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW MODE 3: SINGLE */}
            {(viewMode === 'before' || viewMode === 'after') && (
              <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[520px] rounded-2xl overflow-hidden border border-white/15 bg-[#091524] shadow-xl">
                <img
                  src={viewMode === 'before' ? activeCase.beforeImg : activeCase.afterImg}
                  alt={viewMode === 'before' ? activeCase.beforeTitle : activeCase.afterTitle}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-4 right-4 px-4 py-2 rounded-xl bg-[#07111F]/90 backdrop-blur-md text-xs font-bold border shadow-lg flex items-center gap-2 text-white">
                  {viewMode === 'before' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-amber-300">{activeCase.beforeTitle}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#7FE7FF]" />
                      <span className="text-[#7FE7FF]">{activeCase.afterTitle}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Clinical Case Study Deep-Dive Card */}
            <div className="mt-6 p-5 sm:p-7 rounded-2xl bg-white/[0.03] border border-white/10 text-right space-y-5">
              
              {/* Doctor & Case Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5DB8FF]/15 text-[#7FE7FF] border border-[#5DB8FF]/30">
                      {activeCase.tag}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {activeCase.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    طرح درمان اجراشده توسط <strong className="text-slate-200 font-semibold">{activeCase.doctorName}</strong> ({activeCase.doctorRole})
                  </p>
                </div>

                {/* Primary CTA */}
                <button
                  onClick={() => onOpenContact(`مشاوره درمانی برای «${activeCase.title}»`)}
                  className="shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] hover:opacity-95 shadow-md cursor-pointer transition-all hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مشاوره و هماهنگی این درمان</span>
                </button>
              </div>

              {/* 4 Clinical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#5DB8FF]" />
                    <span>طول دوره درمان:</span>
                  </div>
                  <strong className="text-slate-100 block font-semibold">{activeCase.treatmentTime}</strong>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#7FE7FF]" />
                    <span>تغییر شید رنگی:</span>
                  </div>
                  <strong className="text-slate-100 block font-semibold">{activeCase.shadeChange}</strong>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Layers className="w-3.5 h-3.5 text-[#5DB8FF]" />
                    <span>متریال و برند:</span>
                  </div>
                  <strong className="text-slate-100 block font-semibold truncate">{activeCase.materialUsed}</strong>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <User className="w-3.5 h-3.5 text-[#7FE7FF]" />
                    <span>شرایط مراجعه‌کننده:</span>
                  </div>
                  <strong className="text-slate-100 block font-semibold">{activeCase.patientAge}</strong>
                </div>
              </div>

              {/* Problem vs Solution Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-rose-500/[0.04] border border-rose-500/15 space-y-1">
                  <span className="text-rose-400 font-bold block flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>دغدغه و وضعیت اولیه:</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    {activeCase.primaryConcern}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 space-y-1">
                  <span className="text-emerald-400 font-bold block flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>رویکرد بالینی لومینا دنتال:</span>
                  </span>
                  <p className="text-slate-300 leading-relaxed font-normal">
                    {activeCase.appliedSolution}
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Fullscreen Inspection Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07111F]/95 backdrop-blur-2xl animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsFullscreen(false)} />
          
          <div className="relative max-w-5xl w-full bg-[#0a182c] border border-white/20 rounded-3xl overflow-hidden shadow-2xl z-10">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between text-right">
              <div>
                <span className="text-xs text-[#7FE7FF] font-semibold block">{activeCase.tag}</span>
                <h3 className="text-lg font-bold text-white">{activeCase.title}</h3>
              </div>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Comparison in Fullscreen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#050d1a]">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-amber-400/30">
                <img
                  src={activeCase.beforeImg}
                  alt="قبل از درمان"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#07111F]/90 backdrop-blur-md text-xs font-bold text-amber-300 border border-amber-400/30">
                  قبل: {activeCase.beforeTitle}
                </div>
              </div>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#5DB8FF]/40">
                <img
                  src={activeCase.afterImg}
                  alt="بعد از درمان"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#07111F]/90 backdrop-blur-md text-xs font-bold text-[#7FE7FF] border border-[#5DB8FF]/40 shadow-md">
                  بعد: {activeCase.afterTitle}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                {activeCase.clinicalNotes}
              </p>
              <button
                onClick={() => {
                  setIsFullscreen(false);
                  onOpenContact(`مشاوره درمانی برای «${activeCase.title}»`);
                }}
                className="shrink-0 px-6 py-2.5 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] cursor-pointer"
              >
                ارتباط در واتس‌اپ و تماس
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};
