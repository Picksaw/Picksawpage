import React, { useEffect, useRef } from "react";
import { IMAGE_CONFIG } from "../config/imageConfig";
import { SITE_CONTENT } from "../config/contentConfig";
import gsap from "gsap";

export const FeaturedImageBand: React.FC = () => {
  const bandRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imgRef.current && bandRef.current) {
        gsap.fromTo(
          imgRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: bandRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      }
    }, bandRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={bandRef}
      aria-label="نمای شاخص معماری کلینیک"
      className="relative w-full overflow-hidden bg-[#0B1F2A] py-12 md:py-20"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Architectural Image Container */}
        <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] overflow-hidden border border-white/10">
          <img
            ref={imgRef}
            src={IMAGE_CONFIG.FEATURED_BAND_IMAGE.src}
            alt={IMAGE_CONFIG.FEATURED_BAND_IMAGE.alt}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = IMAGE_CONFIG.FEATURED_BAND_IMAGE.fallbackSrc;
            }}
            className="w-full h-[120%] object-cover object-center transform -translate-y-[10%]"
            loading="lazy"
          />

          {/* Dark Architectural Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F2A]/75 via-[#0B1F2A]/30 to-transparent pointer-events-none" />

          {/* Floating Editorial Statement Box */}
          <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 md:bottom-12 md:right-12 max-w-md bg-[#0B1F2A]/90 backdrop-blur-md p-6 sm:p-8 border border-white/15 shadow-2xl">
            <span className="text-[10px] tracking-widest text-[#DDECF0] uppercase font-editorial font-bold block mb-2">
              {SITE_CONTENT.FEATURED_BAND.TOP_LABEL}
            </span>
            <p className="text-lg sm:text-2xl font-bold text-[#F7F6F2] leading-snug whitespace-pre-line">
              {SITE_CONTENT.FEATURED_BAND.QUOTE}
            </p>
            <div className="w-16 h-[2px] bg-[#E88B7B] mt-4" />
          </div>

          {/* Top Left Editorial Stamp */}
          <div className="absolute top-6 left-6 hidden sm:flex items-center gap-2 bg-[#F7F6F2]/90 backdrop-blur-xs px-3.5 py-2 text-xs font-semibold text-[#0B1F2A] border border-[#0B1F2A]/10">
            <span className="font-number font-bold text-[#16394A]">
              {SITE_CONTENT.FEATURED_BAND.STAMP_NUMBER}
            </span>
            <span className="text-[#7B858A]">/</span>
            <span className="font-editorial uppercase tracking-wider text-[11px]">
              {SITE_CONTENT.FEATURED_BAND.STAMP_TEXT}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
