import React, { useEffect, useRef } from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import gsap from "gsap";

export const VisualStatement: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const lineTopRef = useRef<HTMLDivElement>(null);
  const lineBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (lineTopRef.current && lineBottomRef.current && containerRef.current) {
        gsap.fromTo(
          lineTopRef.current,
          { width: "40%" },
          {
            width: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 80%",
              end: "center center",
              scrub: 0.8,
            },
          }
        );

        gsap.fromTo(
          lineBottomRef.current,
          { width: "30%" },
          {
            width: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 70%",
              end: "bottom 90%",
              scrub: 0.8,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      aria-label="بیانیه هویت برند کلینیک پالس"
      className="relative py-20 md:py-28 bg-[#DDECF0] text-[#0B1F2A] overflow-hidden border-b border-[#0B1F2A]/10"
    >
      {/* Dynamic Animated Line Top */}
      <div
        ref={lineTopRef}
        className="h-[1px] bg-[#0B1F2A]/20 mx-auto mb-12 max-w-5xl"
      />

      <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center relative z-10">
        {/* Small Label */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 bg-[#E88B7B] rounded-full" />
          <span className="text-[11px] font-bold text-[#16394A] tracking-widest uppercase font-editorial">
            {SITE_CONTENT.STATEMENT_SECTION.LABEL}
          </span>
          <span className="w-1.5 h-1.5 bg-[#E88B7B] rounded-full" />
        </div>

        {/* Big Centered Statement */}
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-[#0B1F2A] leading-[1.35] tracking-tight mb-6 whitespace-pre-line">
          {SITE_CONTENT.STATEMENT_SECTION.MAIN_TEXT}
        </h2>

        {/* Short Supporting Paragraph */}
        <p className="text-sm sm:text-base md:text-lg text-[#16394A]/85 max-w-2xl mx-auto leading-relaxed">
          {SITE_CONTENT.STATEMENT_SECTION.SUB_TEXT}
        </p>

        {/* Subtle Decorative Accent */}
        <div className="inline-flex items-center gap-3 mt-8">
          <div className="w-8 h-[1px] bg-[#E88B7B]" />
          <span className="text-[11px] font-semibold text-[#16394A] font-editorial tracking-wider">
            {SITE_CONTENT.STATEMENT_SECTION.BOTTOM_ACCENT}
          </span>
          <div className="w-8 h-[1px] bg-[#E88B7B]" />
        </div>
      </div>

      {/* Dynamic Animated Line Bottom */}
      <div
        ref={lineBottomRef}
        className="h-[1px] bg-[#0B1F2A]/20 mx-auto mt-12 max-w-5xl"
      />
    </section>
  );
};
