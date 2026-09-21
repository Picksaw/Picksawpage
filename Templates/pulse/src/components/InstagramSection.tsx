import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";
import { IMAGE_CONFIG } from "../config/imageConfig";
import { ArrowUpLeft } from "lucide-react";

export const InstagramSection: React.FC = () => {
  return (
    <section
      aria-label="صفحه اینستاگرام کلینیک پالس"
      className="py-16 md:py-24 bg-[#F7F6F2] border-b border-[#0B1F2A]/10"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Header with CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 mb-10 border-b border-[#0B1F2A]/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-[2px] bg-[#E88B7B]" />
              <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
                {SITE_CONTENT.INSTAGRAM_SECTION.LABEL}
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B1F2A] tracking-tight mb-2">
              {SITE_CONTENT.INSTAGRAM_SECTION.TITLE}
            </h2>
            <p className="text-xs sm:text-sm text-[#7B858A]">
              {SITE_CONTENT.INSTAGRAM_SECTION.SUBTITLE}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-3">
            <span
              dir="ltr"
              className="text-sm font-number font-semibold text-[#16394A] tracking-wider text-left inline-block"
            >
              {SITE_CONTENT.CONTACT.INSTAGRAM_HANDLE}
            </span>
            <a
              href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B1F2A] text-white hover:bg-[#16394A] text-xs font-semibold transition-all duration-200 group"
            >
              <span>{SITE_CONTENT.INSTAGRAM_SECTION.CTA_BUTTON}</span>
              <ArrowUpLeft className="w-3.5 h-3.5 text-[#E88B7B] group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Offset Editorial Grid (4 Curated Images) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {IMAGE_CONFIG.INSTAGRAM_HIGHLIGHTS.map((post, index) => (
            <a
              key={post.id}
              href={SITE_CONTENT.CONTACT.INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`group relative bg-[#0B1F2A] border border-[#0B1F2A]/10 overflow-hidden block ${
                index % 2 === 1 ? "lg:translate-y-4" : ""
              } transition-transform duration-300`}
            >
              {/* Image Frame */}
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src={post.src}
                  alt={post.alt}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = post.fallbackSrc;
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-[#0B1F2A]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 text-white">
                  <div className="flex justify-between items-center text-[10px] text-[#DDECF0]">
                    <span className="font-editorial">{SITE_CONTENT.BRAND.NAME_EN}</span>
                    <span className="text-[#E88B7B]">{post.tag}</span>
                  </div>

                  <p className="text-xs text-[#F7F6F2] font-medium leading-relaxed">
                    {post.caption}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-[#E88B7B] font-semibold">
                    <span>{SITE_CONTENT.INSTAGRAM_SECTION.HOVER_VIEW_POST}</span>
                    <ArrowUpLeft className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Bottom Tag Bar */}
              <div className="p-3 bg-white border-t border-[#0B1F2A]/8 flex items-center justify-between text-[11px]">
                <span className="text-[#7B858A] truncate font-medium">{post.tag}</span>
                <span className="font-number text-[#16394A] font-bold">0{index + 1}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
