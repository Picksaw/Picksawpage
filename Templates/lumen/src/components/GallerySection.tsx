import React, { useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { GALLERY_ITEMS, GalleryItem } from '../config/clinicData';
import { CLINIC_TEXTS } from '../config/texts';
import { GalleryModal } from './GalleryModal';

interface GallerySectionProps {
  onOpenConsultation?: () => void;
}

export const GallerySection: React.FC<GallerySectionProps> = ({ onOpenConsultation }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('همه');

  const categories = ['همه', 'فضای بالینی', 'معماری داخلی', 'فرآیند مراقبت', 'جزئیات مراقبت'];

  const filteredItems = activeFilter === 'همه'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeFilter);

  const handleNextImage = () => {
    if (!selectedImage) return;
    const currentIndex = filteredItems.findIndex((item) => item.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setSelectedImage(filteredItems[nextIndex]);
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const currentIndex = filteredItems.findIndex((item) => item.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setSelectedImage(filteredItems[prevIndex]);
  };

  return (
    <section id="gallery" className="py-24 md:py-36 bg-rose-wash/80 backdrop-blur-[2px] relative overflow-hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#332635]/12">
          <div>
            <span className="text-xs font-bold tracking-[0.25em] text-[#9B7B8D] uppercase font-['Outfit'] block mb-2">
              {CLINIC_TEXTS.GALLERY_LABEL}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-[#332635]">
              {CLINIC_TEXTS.GALLERY_TITLE}
            </h2>
          </div>

          <p className="mt-4 md:mt-0 text-sm text-[#777176] max-w-sm font-light leading-relaxed">
            {CLINIC_TEXTS.GALLERY_SUBTEXT}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer ${
                activeFilter === cat
                  ? 'bg-[#332635] text-[#F7F3EE] shadow-sm'
                  : 'bg-mauve-wash/80 text-[#777176] hover:text-[#332635] border border-[#332635]/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Asymmetric Varied Editorial Gallery Grid with Perfect Bounds */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {filteredItems.map((item, index) => {
            const colSpan = index === 0 ? 'md:col-span-7 aspect-[16/10]' :
                           index === 1 ? 'md:col-span-5 aspect-[4/5]' :
                           index === 2 ? 'md:col-span-4 aspect-[4/5]' :
                           index === 3 ? 'md:col-span-4 aspect-square' :
                           index === 4 ? 'md:col-span-4 aspect-square' :
                           'md:col-span-6 aspect-[16/10]';

            return (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className={`${colSpan} group relative rounded-3xl overflow-hidden shadow-sm bg-[#241A27] cursor-pointer border border-[#332635]/15 transition-all duration-300 hover:shadow-xl`}
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 block"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#241A27]/85 via-[#241A27]/20 to-transparent opacity-75 group-hover:opacity-95 transition-opacity pointer-events-none" />

                {/* Corner detail tag */}
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#241A27]/70 backdrop-blur-md text-[10px] text-[#D8B6BE] font-mono border border-white/10 pointer-events-none">
                  {item.category}
                </div>

                {/* Bottom Title & Action */}
                <div className="absolute bottom-6 right-6 left-6 flex items-end justify-between text-[#F7F3EE] pointer-events-none">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {item.title}
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-rose/35 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110 shadow-sm">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Portal-based Gallery Lightbox Modal */}
      <GalleryModal
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
        onNext={handleNextImage}
        onPrev={handlePrevImage}
        onOpenConsultation={onOpenConsultation}
      />
    </section>
  );
};
