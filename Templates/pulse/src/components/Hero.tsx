import React, { useEffect, useRef } from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { IMAGE_CONFIG } from "../config/imageConfig";
import { ArrowDownLeft, ArrowUpLeft } from "lucide-react";
import gsap from "gsap";
import { getLenis } from "../hooks/useLenisScroll";

interface HeroProps {
  onOpenConsultationModal?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenConsultationModal }) => {
  const containerRef = useRef<HTMLElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageFrameRef = useRef<HTMLDivElement>(null);
  const overlayPanelRef = useRef<HTMLDivElement>(null);
  const verticalNumberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // Initial state
      gsap.set([labelRef.current, ctaRef.current], { opacity: 0, y: 15 });
      gsap.set(headlineRef.current, { opacity: 0, y: 25 });
      gsap.set(imageFrameRef.current, {
        clipPath: "inset(0% 12% 0% 12%)",
        opacity: 0,
        scale: 0.98,
      });
      gsap.set(overlayPanelRef.current, { opacity: 0, x: 20, y: 20 });
      gsap.set(verticalNumberRef.current, { opacity: 0, x: -15 });

      // Sequence
      tl.to(labelRef.current, { opacity: 1, y: 0, duration: 0.7, delay: 0.2 })
        .to(headlineRef.current, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.6 }, "-=0.5")
        .to(
          imageFrameRef.current,
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
          },
          "-=0.4"
        )
        .to(
          overlayPanelRef.current,
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
          },
          "-=0.5"
        )
        .to(
          verticalNumberRef.current,
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
          },
          "-=0.4"
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(targetElement as HTMLElement, { offset: -70 });
      } else {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative pt-28 sm:pt-32 md:pt-36 pb-16 md:pb-24 overflow-hidden border-b border-[#0B1F2A]/10 bg-[#F7F6F2]"
      aria-label="بخش معرفی کلینیک پالس"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Top Editorial Header Structure */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 md:pb-10 border-b border-[#0B1F2A]/10">
          <div className="max-w-3xl">
            {/* Small Label */}
            <div
              ref={labelRef}
              className="inline-flex items-center gap-2 mb-4 text-[11px] sm:text-xs font-semibold tracking-wider text-[#7B858A] uppercase"
            >
              <span className="w-2 h-2 bg-[#E88B7B] inline-block" />
              <span className="font-editorial">{SITE_CONTENT.HERO.LABEL_TOP}</span>
              <span className="text-[#0B1F2A]/30">|</span>
              <span>{SITE_CONTENT.HERO.LABEL_SUB}</span>
            </div>

            {/* Large Editorial Headline */}
            <h1
              ref={headlineRef}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold text-[#0B1F2A] leading-[1.3] md:leading-[1.25] tracking-tight"
            >
              {SITE_CONTENT.HERO.HEADLINE_LINE1}
              <br />
              <span className="text-[#16394A] font-extrabold">
                {SITE_CONTENT.HERO.HEADLINE_LINE2}
              </span>
            </h1>
          </div>

          {/* Action CTAs */}
          <div ref={ctaRef} className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0">
            <a
              href="#services"
              onClick={(e) => handleScrollTo(e, "#services")}
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#0B1F2A] text-[#F7F6F2] hover:bg-[#16394A] text-sm font-semibold transition-all duration-200 shadow-sm"
            >
              <span>{SITE_CONTENT.HERO.PRIMARY_CTA}</span>
              <ArrowDownLeft className="w-4 h-4 text-[#E88B7B] group-hover:translate-y-0.5 group-hover:-translate-x-0.5 transition-transform" />
            </a>

            <button
              type="button"
              onClick={onOpenConsultationModal}
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-white text-[#0B1F2A] hover:bg-[#EEF5F7] border border-[#0B1F2A]/20 text-sm font-semibold transition-all duration-200"
            >
              <span>{SITE_CONTENT.HERO.SECONDARY_CTA}</span>
              <ArrowUpLeft className="w-4 h-4 text-[#7B858A] group-hover:text-[#0B1F2A] transition-colors" />
            </button>
          </div>
        </div>

        {/* Large Horizontal Cinematic Image Span */}
        <div className="relative mt-8 md:mt-10">
          {/* Vertical Number Edge (Desktop) */}
          <div
            ref={verticalNumberRef}
            className="hidden lg:flex absolute -left-10 top-0 bottom-0 flex-col justify-between py-6 items-center text-[#0B1F2A]/25 pointer-events-none select-none"
          >
            <span className="font-number text-2xl font-bold text-[#16394A]">
              {SITE_CONTENT.HERO.NUMBER_EDGE}
            </span>
            <div className="w-[1px] h-32 bg-[#0B1F2A]/15 my-2" />
            <span className="text-[10px] tracking-widest uppercase [writing-mode:vertical-rl] rotate-180 text-[#7B858A]">
              EDITORIAL
            </span>
          </div>

          {/* Main Cinematic Image Container */}
          <div
            ref={imageFrameRef}
            className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] overflow-hidden bg-[#0B1F2A] border border-[#0B1F2A]/15"
          >
            <img
              src={IMAGE_CONFIG.HERO_MAIN_IMAGE.src}
              alt={IMAGE_CONFIG.HERO_MAIN_IMAGE.alt}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = IMAGE_CONFIG.HERO_MAIN_IMAGE.fallbackSrc;
              }}
              className="w-full h-full object-cover object-center transform scale-100 hover:scale-[1.02] transition-transform duration-700 ease-out"
              loading="eager"
            />

            {/* Subtle Gradient Veil */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F2A]/80 via-transparent to-transparent md:from-[#0B1F2A]/65 pointer-events-none" />

            {/* Overlay Info Panel (Lower Corner) */}
            <div
              ref={overlayPanelRef}
              className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 md:right-8 max-w-sm sm:max-w-md bg-[#0B1F2A]/90 backdrop-blur-md text-[#F7F6F2] p-5 sm:p-6 border-r-2 border-r-[#E88B7B] border border-white/10 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 bg-[#E88B7B] rounded-full" />
                <span className="text-xs text-[#DDECF0] font-medium tracking-wide">
                  {SITE_CONTENT.HERO.BADGE_CATEGORY}
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {SITE_CONTENT.HERO.BADGE_QUOTE}
              </p>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#7B858A]">
                <span>{SITE_CONTENT.HERO.BADGE_FOOTER_NOTE}</span>
                <span className="font-editorial text-[#DDECF0]">
                  {SITE_CONTENT.HERO.BADGE_YEAR}
                </span>
              </div>
            </div>

            {/* Subtle Graphic Corner Marker */}
            <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 bg-[#F7F6F2]/90 backdrop-blur-xs px-3 py-1.5 text-[11px] text-[#0B1F2A] font-semibold border border-[#0B1F2A]/10">
              <span className="w-1.5 h-1.5 bg-[#0B1F2A]" />
              <span className="font-editorial uppercase tracking-wider">
                {SITE_CONTENT.HERO.STAMP_LABEL}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
