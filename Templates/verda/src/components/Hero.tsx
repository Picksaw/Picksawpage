import React, { useEffect, useRef } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG } from '../config/images.config';
import { ArrowDownLeft, Phone } from 'lucide-react';
import { gsap } from 'gsap';

interface HeroProps {
  onNavigate?: (id: string) => void;
  onOpenServiceDetails?: (serviceId?: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate, onOpenServiceDetails }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const decorativeLineRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      if (labelRef.current) {
        tl.fromTo(
          labelRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.2 }
        );
      }

      if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 1 },
          '-=0.5'
        );
      }

      if (paragraphRef.current) {
        tl.fromTo(
          paragraphRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9 },
          '-=0.6'
        );
      }

      if (ctaRef.current) {
        tl.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.5'
        );
      }

      if (imageContainerRef.current) {
        tl.fromTo(
          imageContainerRef.current,
          { opacity: 0, scale: 0.97, clipPath: 'inset(10% 0% 10% 0%)' },
          {
            opacity: 1,
            scale: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.4,
            ease: 'power2.out',
          },
          '-=1.2'
        );
      }

      if (decorativeLineRef.current) {
        const length = decorativeLineRef.current.getTotalLength();
        gsap.set(decorativeLineRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(
          decorativeLineRef.current,
          { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' },
          '-=1.0'
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleServicesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenServiceDetails) {
      onOpenServiceDetails('skin-rejuvenation');
    } else if (onNavigate) {
      onNavigate('services');
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('contact');
    } else {
      const elem = document.getElementById('contact');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-[92vh] lg:min-h-screen flex items-center pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-transparent z-10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Content Column */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-right z-10">
            
            {/* Editorial Category Label */}
            <div ref={labelRef} className="flex items-center gap-3 mb-5">
              <span className="w-6 h-[1.5px] bg-[#9CAF88]"></span>
              <span className="font-editorial text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                {CONTENT_CONFIG.BRAND.CLINIC_NAME_EN} · {CONTENT_CONFIG.BRAND.SUBTITLE}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E9D98A]/90"></span>
            </div>

            {/* Main Headline */}
            <h1
              ref={headingRef}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-[#252923] leading-[1.3] md:leading-[1.25] tracking-tight mb-6 font-vazir"
            >
              {CONTENT_CONFIG.BRAND.TAGLINE}
            </h1>

            {/* Supporting Copy */}
            <p
              ref={paragraphRef}
              className="text-base sm:text-lg text-[#70756D] leading-relaxed max-w-xl mb-8 font-light"
            >
              {CONTENT_CONFIG.BRAND.DESCRIPTION}
            </p>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-3.5 sm:gap-4 pt-1">
              <button
                type="button"
                onClick={handleServicesClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-all duration-300 text-sm font-medium shadow-sm hover:shadow group cursor-pointer"
              >
                <span>مشاهده خدمات</span>
                <ArrowDownLeft className="w-4 h-4 text-[#E9D98A] group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleContactClick}
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-[#E9EFE0] border border-[#D9D0BC] text-[#344236] hover:border-[#9CAF88] hover:bg-[#F1F5E9] transition-all duration-300 text-sm font-medium shadow-xs cursor-pointer"
              >
                <Phone className="w-4 h-4 text-[#9CAF88]" />
                <span>تماس با ما</span>
              </button>
            </div>

            {/* Subtle decorative graphic accent */}
            <div className="mt-10 sm:mt-12 flex items-center gap-4 text-xs text-[#70756D]/80">
              <svg width="60" height="12" viewBox="0 0 60 12" fill="none" className="text-[#9CAF88]">
                <path
                  ref={decorativeLineRef}
                  d="M0 6H50M50 6L44 1M50 6L44 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-editorial text-[11px] tracking-wider text-[#70756D]">
                {CONTENT_CONFIG.BRAND.HERO_MOTTO}
              </span>
            </div>
          </div>

          {/* Large Hero Image Column */}
          <div className="lg:col-span-6 xl:col-span-7 relative flex justify-center lg:justify-end z-20">
            <div
              ref={imageContainerRef}
              className="relative w-full max-w-md sm:max-w-lg lg:max-w-none aspect-[4/5] sm:aspect-[14/15] lg:aspect-[4/4.8] rounded-2xl md:rounded-3xl overflow-hidden bg-[#E9EFE0] shadow-[0_20px_50px_rgba(52,66,54,0.08)] border border-[#D9D0BC]/80 z-10"
            >
              <img
                ref={imageRef}
                src={IMAGES_CONFIG.HERO_IMAGE}
                alt={IMAGES_CONFIG.HERO_IMAGE_ALT}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000 ease-out"
                loading="eager"
              />

              {/* Refined subtle warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#252923]/25 via-transparent to-transparent pointer-events-none" />

              {/* Minimal floating badge */}
              <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 bg-[#E9EFE0] px-4 py-2.5 rounded-xl border border-[#D9D0BC]/80 shadow-sm flex items-center gap-3 z-20">
                <span className="w-2 h-2 rounded-full bg-[#9CAF88] animate-pulse"></span>
                <span className="text-xs font-medium text-[#252923]">
                  {CONTENT_CONFIG.BRAND.HERO_BADGE}
                </span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full border border-[#9CAF88]/30 pointer-events-none -z-1 hidden sm:block"></div>
          </div>

        </div>
      </div>
    </section>
  );
};
