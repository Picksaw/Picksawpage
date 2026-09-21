import React, { useEffect, useRef } from 'react';
import { ArrowUpLeft, Sparkles, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CLINIC_CONFIG } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';

gsap.registerPlugin(ScrollTrigger);

interface FeatureSectionProps {
  onOpenFeatureDetail: () => void;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({ onOpenFeatureDetail }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current.children,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-36 bg-[#332635]/92 backdrop-blur-[2px] text-[#F7F3EE] relative overflow-hidden"
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Dominant Image Frame (7 cols) - Fills 100% of container without blank gaps */}
          <div className="lg:col-span-7 order-2 lg:order-1">
            <div
              ref={imageWrapperRef}
              onClick={onOpenFeatureDetail}
              className="relative w-full aspect-[16/10] sm:aspect-[16/11] rounded-[2.5rem] overflow-hidden shadow-[0_24px_60px_rgba(20,15,22,0.5)] border border-[#F7F3EE]/15 bg-[#241A27] group cursor-pointer"
            >
              <img
                src={CLINIC_CONFIG.FEATURE_IMAGE}
                alt="فضای آرام و بالینی کلینیک لومن"
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105 block"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#241A27]/80 via-transparent to-transparent pointer-events-none" />

              {/* Architectural badge */}
              <div className="absolute bottom-6 right-6 px-4 py-2.5 rounded-2xl bg-[#241A27]/85 backdrop-blur-md border border-white/15 text-xs font-light flex items-center gap-2.5 text-[#D8B6BE]">
                <Sparkles className="w-4 h-4 text-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.FEATURE_BADGE}</span>
              </div>
            </div>
          </div>

          {/* Editorial Content (5 cols) */}
          <div ref={contentRef} className="lg:col-span-5 order-1 lg:order-2 space-y-6">
            <div>
              <span className="inline-block px-4 py-1 rounded-full text-xs font-bold tracking-[0.25em] text-[#D8B6BE] bg-rose/15 border border-[#D8B6BE]/25 font-['Outfit'] uppercase">
                {CLINIC_TEXTS.FEATURE_LABEL}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#F7F3EE] leading-[1.25] tracking-tight">
              {CLINIC_TEXTS.FEATURE_HEADLINE_1}
              <br />
              <span className="font-normal text-[#D8B6BE]">{CLINIC_TEXTS.FEATURE_HEADLINE_2}</span>
            </h2>

            <p className="text-base sm:text-lg text-[#F7F3EE]/80 font-light leading-relaxed">
              {CLINIC_TEXTS.FEATURE_SUBTEXT}
            </p>

            <div className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#F7F3EE]/75">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.FEATURE_POINT_1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D8B6BE]" />
                <span>{CLINIC_TEXTS.FEATURE_POINT_2}</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenFeatureDetail}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-semibold bg-rose-wash text-[#332635] hover:bg-[#D8B6BE] transition-all duration-300 shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-[#D8B6BE]"
              >
                <span>{CLINIC_TEXTS.FEATURE_CTA}</span>
                <ArrowUpLeft className="w-4 h-4 text-[#332635] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
