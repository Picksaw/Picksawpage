import React, { useEffect, useRef } from 'react';
import { CLINIC_CONFIG } from '../config/clinic.config';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const Introduction: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%',
          end: 'bottom 60%',
          toggleActions: 'play none none reverse',
        },
      });

      tl.fromTo(
        tagRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
      )
        .fromTo(
          lineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, ease: 'power2.inOut', transformOrigin: 'right center' },
          '-=0.4'
        )
        .fromTo(
          quoteRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' },
          '-=0.4'
        )
        .fromTo(
          textRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
          '-=0.5'
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative py-24 sm:py-32 md:py-40 bg-transparent border-y border-[#D9D0BC]/40 overflow-hidden z-10"
    >
      <div className="max-w-4xl mx-auto px-6 sm:px-10 text-center relative z-10">
        {/* Small Heading / Category Label */}
        <div ref={tagRef} className="inline-flex items-center justify-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-[#9CAF88]"></span>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#70756D] uppercase">
            درباره {CLINIC_CONFIG.CLINIC_NAME}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#9CAF88]"></span>
        </div>

        {/* Delicate decorative line */}
        <div
          ref={lineRef}
          className="w-16 h-[1.5px] bg-[#9CAF88]/70 mx-auto mb-10"
        />

        {/* Large Statement */}
        <blockquote
          ref={quoteRef}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[#252923] leading-[1.4] md:leading-[1.35] tracking-tight mb-8 font-vazir"
        >
          «زیبایی لازم نیست دیده شود؛
          <br className="hidden sm:inline" />
          <span className="text-[#344236]"> کافی است احساس شود.»</span>
        </blockquote>

        {/* Supporting copy */}
        <p
          ref={textRef}
          className="text-base sm:text-lg md:text-xl text-[#70756D] leading-relaxed max-w-2xl mx-auto font-light"
        >
          رویکرد وردا بر ایجاد تعادل، انتخاب آگاهانه و حفظ ویژگی‌های طبیعی هر فرد تمرکز دارد.
        </p>
      </div>
    </section>
  );
};
