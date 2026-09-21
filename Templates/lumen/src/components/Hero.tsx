import React, { useEffect, useRef } from 'react';
import { Phone, Sparkles, ShieldCheck, ArrowUpLeft } from 'lucide-react';
import gsap from 'gsap';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { CLINIC_IMAGES } from '../config/images';

interface HeroProps {
  onOpenConsultation: () => void;
  onExploreServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultation, onExploreServices }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const detailImgRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (badgeRef.current) {
        tl.fromTo(
          badgeRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.1 }
        );
      }

      if (headlineRef.current) {
        tl.fromTo(
          headlineRef.current.children,
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.18 },
          '-=0.5'
        );
      }

      if (subtextRef.current) {
        tl.fromTo(
          subtextRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.6'
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 },
          '-=0.5'
        );
      }

      if (portraitRef.current) {
        tl.fromTo(
          portraitRef.current,
          { clipPath: 'inset(6% 0% 6% 0%)', opacity: 0, scale: 1.03 },
          { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, scale: 1, duration: 1.2, ease: 'power2.out' },
          '-=1.1'
        );
      }

      if (detailImgRef.current) {
        tl.fromTo(
          detailImgRef.current,
          { opacity: 0, y: 25, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power2.out' },
          '-=0.8'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-[90dvh] md:min-h-[100dvh] pt-24 pb-16 md:pt-32 md:pb-24 flex items-center overflow-hidden bg-transparent"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Asymmetric Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Right Column: Copy & Actions (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center z-10">
            {/* Small Label with Exclusive Badge Styling */}
            <div ref={badgeRef} className="mb-6 flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest text-[#332635] bg-rose-wash/85 border border-[#332635]/15 font-['Outfit'] backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#9B7B8D] animate-ping opacity-75" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#332635] -mr-3.5" />
                {CLINIC_TEXTS.HERO_LABEL}
              </div>
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-[#332635] leading-[1.18] tracking-tight mb-6"
            >
              <span className="block font-medium text-[#241A27]">{CLINIC_TEXTS.HERO_HEADLINE_1}</span>
              <span className="block text-[#332635]/90">{CLINIC_TEXTS.HERO_HEADLINE_2}</span>
            </h1>

            {/* Supporting Copy */}
            <p
              ref={subtextRef}
              className="text-base sm:text-lg md:text-xl text-[#777176] font-light leading-relaxed max-w-xl mb-10"
            >
              {CLINIC_TEXTS.HERO_SUBTEXT}
            </p>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 pt-1">
              {/* Primary CTA */}
              <button
                type="button"
                onClick={onExploreServices}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold bg-[#332635] text-[#F7F3EE] hover:bg-[#241A27] hover:shadow-xl hover:shadow-[#332635]/20 transition-all duration-300 shadow-md focus-visible:ring-2 focus-visible:ring-[#9B7B8D] cursor-pointer"
              >
                <span>{CLINIC_TEXTS.HERO_CTA_PRIMARY}</span>
                <ArrowUpLeft className="w-4 h-4 text-[#D8B6BE] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
              </button>

              {/* Secondary CTA: Quick Consultation Window */}
              <button
                type="button"
                onClick={onOpenConsultation}
                className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium bg-rose-wash/90 text-[#332635] border border-[#332635]/20 hover:border-[#332635] hover:bg-rose-wash transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#9B7B8D] cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#9B7B8D] transition-transform group-hover:scale-110" />
                <span>{CLINIC_TEXTS.HERO_CTA_SECONDARY}</span>
              </button>

              {/* Tertiary Phone Call */}
              <a
                href={`tel:${CLINIC_CONFIG.PHONE_NUMBER_RAW}`}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-full text-sm font-normal text-[#777176] hover:text-[#332635] transition-colors"
                aria-label="تماس تلفنی با کلینیک"
              >
                <Phone className="w-4 h-4 text-[#9B7B8D]" />
                <span className="dir-ltr text-xs font-mono">{CLINIC_CONFIG.PHONE_NUMBER}</span>
              </a>
            </div>

            {/* Editorial Metadata Strip */}
            <div className="mt-14 pt-8 border-t border-[#332635]/10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-[#777176]">
              <div className="space-y-1">
                <span className="text-[10px] text-[#9B7B8D] uppercase tracking-widest font-['Outfit'] block">
                  {CLINIC_TEXTS.HERO_FEATURE_1_LABEL}
                </span>
                <p className="text-[#241A27] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9B7B8D]" />
                  {CLINIC_TEXTS.HERO_FEATURE_1_TEXT}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#9B7B8D] uppercase tracking-widest font-['Outfit'] block">
                  {CLINIC_TEXTS.HERO_FEATURE_2_LABEL}
                </span>
                <p className="text-[#241A27] font-medium">
                  {CLINIC_TEXTS.HERO_FEATURE_2_TEXT}
                </p>
              </div>

              <div className="hidden sm:block space-y-1">
                <span className="text-[10px] text-[#9B7B8D] uppercase tracking-widest font-['Outfit'] block">
                  {CLINIC_TEXTS.HERO_FEATURE_3_LABEL}
                </span>
                <p className="text-[#241A27] font-medium">
                  {CLINIC_TEXTS.HERO_FEATURE_3_TEXT}
                </p>
              </div>
            </div>
          </div>

          {/* Left Column: Composed High-End Editorial Imagery (5 cols) */}
          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative mx-auto lg:mx-0 w-full max-w-[420px]">
              {/* Main Portrait Frame */}
              <div
                ref={portraitRef}
                className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(51,38,53,0.18)] border border-[#332635]/15 bg-linen-surface group"
              >
                <img
                  src={CLINIC_IMAGES.HERO_PORTRAIT}
                  alt={CLINIC_CONFIG.CLINIC_NAME}
                  className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105 block"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#241A27]/60 via-transparent to-transparent pointer-events-none" />

                {/* Inner Corner Crop Marks */}
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-white/60 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-white/60 pointer-events-none" />

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-5 right-5 left-5 text-white flex items-end justify-between pointer-events-none">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-[#D8B6BE]">
                      {CLINIC_TEXTS.HERO_PHOTO_SUB}
                    </span>
                    <p className="text-sm font-light mt-0.5">{CLINIC_TEXTS.HERO_PHOTO_TITLE}</p>
                  </div>
                  <span className="font-['Cinzel'] text-xs font-semibold tracking-widest opacity-80">
                    {CLINIC_CONFIG.CLINIC_NAME_EN}
                  </span>
                </div>
              </div>

              {/* Supporting Detail Nested Card */}
              <div
                ref={detailImgRef}
                className="absolute bottom-4 -left-3 sm:bottom-6 sm:-left-6 w-36 sm:w-44 aspect-square rounded-2xl overflow-hidden shadow-[0_16px_36px_rgba(51,38,53,0.25)] border-2 border-white bg-rose-wash group/detail cursor-pointer"
                onClick={onOpenConsultation}
              >
                <img
                  src={CLINIC_IMAGES.HERO_DETAIL}
                  alt={CLINIC_TEXTS.HERO_DETAIL_TAG}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/detail:scale-110 block"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-[#332635]/15 group-hover/detail:bg-[#332635]/0 transition-colors" />
                <div className="absolute bottom-2 right-2 left-2 bg-[#241A27]/85 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] text-[#F7F3EE] text-center font-medium">
                  {CLINIC_TEXTS.HERO_DETAIL_TAG}
                </div>
              </div>

              {/* Floating Architectural Badge */}
              <div className="hidden sm:flex absolute -top-3 -right-3 bg-rose-wash border border-[#332635]/20 px-3.5 py-1.5 rounded-full shadow-md items-center gap-2 z-20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D8B6BE]" />
                <span className="text-xs font-medium text-[#332635]">{CLINIC_TEXTS.HERO_BADGE_TOP}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
