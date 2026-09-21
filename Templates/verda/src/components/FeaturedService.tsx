import React, { useEffect, useRef } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG } from '../config/images.config';
import { ArrowDownLeft, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FeaturedServiceProps {
  onOpenServiceDetails?: (serviceId: string) => void;
  onNavigate?: (id: string) => void;
}

export const FeaturedService: React.FC<FeaturedServiceProps> = ({
  onOpenServiceDetails,
  onNavigate,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image subtle parallax
      if (imageRef.current && sectionRef.current) {
        gsap.to(imageRef.current, {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      // Content reveal
      if (contentRef.current && sectionRef.current) {
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
              trigger: contentRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onOpenServiceDetails) {
      onOpenServiceDetails('skin-rejuvenation');
    } else if (onNavigate) {
      onNavigate('services');
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-20 sm:py-28 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 overflow-hidden relative z-10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Image Column */}
          <div className="lg:col-span-6 relative order-2 lg:order-1 z-20">
            <div
              onClick={handleCtaClick}
              className="relative aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/4.6] rounded-2xl md:rounded-3xl overflow-hidden bg-[#E9EFE0] shadow-[0_15px_40px_rgba(52,66,54,0.06)] border border-[#D9D0BC]/80 z-10 cursor-pointer group"
            >
              <img
                ref={imageRef}
                src={IMAGES_CONFIG.FEATURED_SERVICE_IMAGE}
                alt={IMAGES_CONFIG.FEATURED_SERVICE_IMAGE_ALT}
                className="w-full h-[115%] object-cover object-center -mt-[5%] group-hover:scale-105 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#344236]/15 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Accent badge */}
            <div className="absolute -bottom-4 right-6 bg-[#E9EFE0] px-4 py-2 rounded-xl border border-[#D9D0BC] shadow-sm flex items-center gap-2 z-20">
              <Sparkles className="w-3.5 h-3.5 text-[#9CAF88]" />
              <span className="text-xs font-medium text-[#252923]">
                {CONTENT_CONFIG.FEATURED_SERVICE.BADGE}
              </span>
            </div>
          </div>

          {/* Text Content Column */}
          <div ref={contentRef} className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
              <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                {CONTENT_CONFIG.FEATURED_SERVICE.LABEL}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-[2.6rem] font-bold text-[#252923] leading-tight mb-6 tracking-tight font-vazir">
              {CONTENT_CONFIG.FEATURED_SERVICE.TITLE}
            </h2>

            <p className="text-base sm:text-lg text-[#70756D] leading-relaxed mb-8 font-light max-w-lg">
              {CONTENT_CONFIG.FEATURED_SERVICE.DESCRIPTION}
            </p>

            <div>
              <button
                type="button"
                onClick={handleCtaClick}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-colors text-sm font-medium shadow-xs group cursor-pointer"
              >
                <span>{CONTENT_CONFIG.FEATURED_SERVICE.CTA}</span>
                <ArrowDownLeft className="w-4 h-4 text-[#E9D98A] group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
