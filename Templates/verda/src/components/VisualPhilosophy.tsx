import React, { useEffect, useRef, useState } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VisualPhilosophyProps {
  onOpenPhilosophyDetails?: (id: number) => void;
}

export const VisualPhilosophy: React.FC<VisualPhilosophyProps> = ({
  onOpenPhilosophyDetails,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const wordsContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const items = CONTENT_CONFIG.PHILOSOPHY.ITEMS;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 65%',
        end: 'bottom 35%',
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress < 0.33) {
            setActiveIndex(0);
          } else if (progress < 0.66) {
            setActiveIndex(1);
          } else {
            setActiveIndex(2);
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handleClickItem = (id: number) => {
    setActiveIndex(id);
    if (onOpenPhilosophyDetails) {
      onOpenPhilosophyDetails(id);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-28 sm:py-36 md:py-44 bg-transparent border-t border-[#D9D0BC]/40 relative overflow-hidden z-10"
    >
      <div className="max-w-5xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
            <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
              {CONTENT_CONFIG.PHILOSOPHY.SECTION_LABEL}
            </span>
            <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#252923] font-vazir">
            {CONTENT_CONFIG.PHILOSOPHY.TITLE}
          </h2>
          <p className="text-xs sm:text-sm text-[#70756D] mt-2 font-light">
            (برای مشاهده جزئیات و اصول هر رکن، روی آن کلیک کنید)
          </p>
        </div>

        {/* Three Large Vertical Words with Scroll-Activated Focus */}
        <div ref={wordsContainerRef} className="flex flex-col gap-10 sm:gap-14 max-w-3xl mx-auto">
          {items.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <div
                key={item.id}
                onClick={() => handleClickItem(item.id)}
                className={`relative pr-8 sm:pr-12 transition-all duration-500 cursor-pointer group select-none`}
                role="button"
                tabIndex={0}
                aria-label={`مشاهده جزئیات اصل ${item.word}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClickItem(item.id);
                  }
                }}
              >
                {/* Thin Sage Moving Indicator Line */}
                <div
                  className={`absolute right-0 top-0 bottom-0 w-[2.5px] rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-[#9CAF88] scale-y-100 opacity-100'
                      : 'bg-[#D9D0BC]/60 scale-y-40 opacity-40 group-hover:scale-y-70'
                  }`}
                />

                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-3 md:gap-8">
                  {/* Persian Large Word */}
                  <div className="flex items-baseline gap-4">
                    <span
                      className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight transition-all duration-500 font-vazir ${
                        isActive
                          ? 'text-[#344236] scale-[1.02] translate-x-1'
                          : 'text-[#70756D]/40 group-hover:text-[#70756D]/70'
                      }`}
                    >
                      {item.word}
                    </span>
                    <span
                      className={`font-editorial text-xs sm:text-sm tracking-[0.25em] font-medium transition-colors duration-500 ${
                        isActive ? 'text-[#9CAF88]' : 'text-[#70756D]/30'
                      }`}
                    >
                      {item.en}
                    </span>
                    {isActive && (
                      <Sparkles className="w-3.5 h-3.5 text-[#9CAF88] inline-block -mr-2 opacity-80" />
                    )}
                  </div>

                  {/* Supporting Description */}
                  <div className="max-w-md">
                    <p
                      className={`text-sm sm:text-base leading-relaxed transition-all duration-500 font-light ${
                        isActive
                          ? 'text-[#344236] opacity-100'
                          : 'text-[#70756D]/50 opacity-60'
                      }`}
                    >
                      {item.shortDescription}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
