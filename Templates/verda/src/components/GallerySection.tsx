import React, { useState } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG, GalleryImageItem } from '../config/images.config';
import { Maximize2 } from 'lucide-react';

interface GallerySectionProps {
  onOpenGalleryDetails?: (imageId: number) => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ onOpenGalleryDetails }) => {
  const [activeHover, setActiveHover] = useState<number | null>(null);

  const galleryItems = IMAGES_CONFIG.GALLERY_IMAGES;

  const layoutClasses = [
    { className: 'md:col-span-8 md:row-span-2', aspect: 'aspect-[4/3] md:aspect-auto md:min-h-[480px]' },
    { className: 'md:col-span-4 md:row-span-2', aspect: 'aspect-[3/4] md:aspect-auto md:min-h-[480px]' },
    { className: 'md:col-span-7', aspect: 'aspect-[16/9] md:aspect-[16/10]' },
    { className: 'md:col-span-5', aspect: 'aspect-[4/3] md:aspect-[16/10]' },
    { className: 'md:col-span-6', aspect: 'aspect-[4/3]' },
    { className: 'md:col-span-6', aspect: 'aspect-[4/3]' },
  ];

  const handleItemClick = (id: number) => {
    if (onOpenGalleryDetails) {
      onOpenGalleryDetails(id);
    }
  };

  return (
    <section id="gallery" className="py-24 sm:py-32 md:py-36 bg-transparent border-t border-[#D9D0BC]/40 relative z-10">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 pb-6 border-b border-[#D9D0BC]/60">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-[1.5px] bg-[#9CAF88]"></span>
              <span className="font-editorial text-xs font-semibold tracking-[0.2em] text-[#70756D] uppercase">
                {CONTENT_CONFIG.GALLERY.SECTION_LABEL}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#252923] tracking-tight font-vazir">
              {CONTENT_CONFIG.GALLERY.TITLE}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#70756D] max-w-sm mt-3 md:mt-0 font-light">
            {CONTENT_CONFIG.GALLERY.DESCRIPTION}
          </p>
        </div>

        {/* Asymmetrical Organic Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 relative z-20">
          {galleryItems.map((item: GalleryImageItem, idx: number) => {
            const isHovered = activeHover === item.id;
            const layout = layoutClasses[idx % layoutClasses.length];

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => setActiveHover(item.id)}
                onMouseLeave={() => setActiveHover(null)}
                className={`group relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#E9EFE0] border border-[#D9D0BC]/80 shadow-xs cursor-pointer z-10 ${layout.className} ${layout.aspect}`}
                role="button"
                tabIndex={0}
                aria-label={`بزرگنمایی تصویر ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item.id);
                  }
                }}
              >
                {/* Main Image */}
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Soft overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-[#252923]/85 via-[#344236]/35 to-transparent transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-20'
                  }`}
                />

                {/* Caption and thin animated line */}
                <div
                  className={`absolute bottom-0 right-0 left-0 p-5 sm:p-6 flex flex-col justify-end transition-all duration-300 ${
                    isHovered ? 'translate-y-0 opacity-100' : 'sm:translate-y-2 sm:opacity-0 opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E9D98A]" />
                    <span className="text-xs text-[#FBFAF4]/90 font-editorial tracking-wider uppercase">
                      {item.category}
                    </span>
                  </div>
                  
                  <p className="text-sm font-semibold text-[#FBFAF4] drop-shadow-xs mb-1">
                    {item.title}
                  </p>
                  
                  <p className="text-xs text-[#FBFAF4]/80 line-clamp-1 font-light">
                    {item.caption}
                  </p>

                  <div
                    className={`h-[2px] bg-[#9CAF88] mt-3 transition-all duration-500 origin-right ${
                      isHovered ? 'w-16' : 'w-0'
                    }`}
                  />
                </div>

                {/* Top Corner Icon */}
                <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#E9EFE0]/90 backdrop-blur-xs p-2 rounded-full z-20 shadow-xs">
                  <Maximize2 className="w-3.5 h-3.5 text-[#344236]" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
