import React, { useEffect, useRef } from "react";
import { IMAGE_CONFIG } from "../config/imageConfig";
import { SITE_CONTENT } from "../config/contentConfig";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Maximize2 } from "lucide-react";

interface GallerySectionProps {
  onOpenGalleryModal?: (item: {
    imageSrc: string;
    caption: string;
    detailDescription?: string;
  }) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ onOpenGalleryModal }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context | null = null;

    const initScroll = () => {
      // Check if desktop screen
      if (window.innerWidth >= 1024 && railRef.current && triggerRef.current) {
        ctx = gsap.context(() => {
          const rail = railRef.current;
          if (!rail) return;

          const scrollDistance = rail.scrollWidth - window.innerWidth + 120;

          // In RTL mode, moving the rail to positive X moves the content from left to right smoothly
          gsap.to(rail, {
            x: scrollDistance,
            ease: "none",
            scrollTrigger: {
              trigger: triggerRef.current,
              pin: true,
              scrub: 0.8,
              start: "top top",
              end: () => `+=${scrollDistance}`,
              invalidateOnRefresh: true,
            },
          });
        }, sectionRef);
      }
    };

    initScroll();

    const handleResize = () => {
      ctx?.revert();
      ScrollTrigger.refresh();
      initScroll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx?.revert();
    };
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      aria-label="گالری تصاویر کلینیک پالس"
      className="bg-[#F7F6F2] border-b border-[#0B1F2A]/10"
    >
      {/* Section Top Header */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 pt-16 md:pt-24 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#0B1F2A]/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-[2px] bg-[#E88B7B]" />
              <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
                {SITE_CONTENT.GALLERY_SECTION.LABEL}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B1F2A] tracking-tight">
              {SITE_CONTENT.GALLERY_SECTION.TITLE}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden lg:inline text-xs font-semibold text-[#16394A] bg-[#EEF5F7] px-3 py-1.5 border border-[#0B1F2A]/10 font-editorial">
              {SITE_CONTENT.GALLERY_SECTION.DESKTOP_INDICATOR}
            </span>
            <p className="text-xs sm:text-sm text-[#7B858A] max-w-xs">
              {SITE_CONTENT.GALLERY_SECTION.SUBTITLE}
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Horizontal Scroll Container */}
      <div
        ref={triggerRef}
        className="hidden lg:block relative h-screen w-full overflow-hidden"
      >
        <div className="h-full flex items-center">
          <div
            ref={railRef}
            className="flex items-center gap-8 px-12 will-change-transform"
          >
            {IMAGE_CONFIG.GALLERY_IMAGES.map((item, index) => (
              <div
                key={item.id}
                onClick={() =>
                  onOpenGalleryModal?.({
                    imageSrc: item.src,
                    caption: item.caption,
                    detailDescription: item.detailDescription,
                  })
                }
                className={`shrink-0 ${item.aspectClass || "w-[480px]"} group relative overflow-hidden bg-[#0B1F2A] border border-[#0B1F2A]/15 cursor-pointer`}
                role="button"
                tabIndex={0}
                aria-label={`مشاهده تصویر ${item.caption}`}
              >
                {/* Fixed Height Rail Image */}
                <div className="h-[460px] w-full relative overflow-hidden">
                  <img
                    src={item.src}
                    alt={item.alt}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = item.fallbackSrc;
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F2A]/85 via-[#0B1F2A]/20 to-transparent pointer-events-none" />

                  {/* Top Index Marker */}
                  <div className="absolute top-4 right-4 bg-[#0B1F2A]/90 backdrop-blur-xs px-3 py-1 text-xs font-number text-white font-bold border border-white/15">
                    0{index + 1}
                  </div>

                  {/* Expand icon on hover */}
                  <div className="absolute top-4 left-4 bg-white/90 text-[#0B1F2A] p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  {/* Bottom Caption & Coral Accent */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#0B1F2A]/90 backdrop-blur-xs border-t border-white/10">
                    <p className="text-sm font-semibold text-[#F7F6F2] leading-snug mb-2">
                      {item.caption}
                    </p>
                    <div className="w-10 h-[2px] bg-[#E88B7B] group-hover:w-full transition-all duration-300 origin-right" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile / Tablet Vertical Gallery Grid */}
      <div className="lg:hidden px-5 sm:px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {IMAGE_CONFIG.GALLERY_IMAGES.map((item, index) => (
            <div
              key={item.id}
              onClick={() =>
                onOpenGalleryModal?.({
                  imageSrc: item.src,
                  caption: item.caption,
                  detailDescription: item.detailDescription,
                })
              }
              className="group relative overflow-hidden bg-[#0B1F2A] border border-[#0B1F2A]/15 cursor-pointer"
              role="button"
              tabIndex={0}
            >
              <div className="h-[280px] sm:h-[320px] w-full relative overflow-hidden">
                <img
                  src={item.src}
                  alt={item.alt}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = item.fallbackSrc;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F2A]/85 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3 right-3 bg-[#0B1F2A]/85 px-2.5 py-0.5 text-xs font-number text-white font-semibold">
                  0{index + 1}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0B1F2A]/85 backdrop-blur-xs">
                  <p className="text-xs sm:text-sm font-semibold text-[#F7F6F2]">
                    {item.caption}
                  </p>
                  <div className="w-8 h-[2px] bg-[#E88B7B] mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
