import React from "react";
import { SITE_CONTENT } from "../config/contentConfig";

export const InformationBand: React.FC = () => {
  return (
    <section
      aria-label="اصول رویکرد کلینیک پالس"
      className="bg-[#EEF5F7] border-b border-[#0B1F2A]/10 py-10 md:py-14"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Editorial Section Label */}
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#0B1F2A]/10">
          <span className="text-[11px] font-semibold text-[#7B858A] uppercase tracking-wider font-editorial">
            {SITE_CONTENT.PILLARS.SECTION_LABEL}
          </span>
          <span className="text-xs font-medium text-[#16394A]">
            {SITE_CONTENT.PILLARS.SECTION_SUBTITLE}
          </span>
        </div>

        {/* 4 Columns with Thin Dividers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-[#0B1F2A]/12 border border-[#0B1F2A]/10 bg-[#F7F6F2]">
          {SITE_CONTENT.PILLARS.ITEMS.map((pillar) => (
            <div
              key={pillar.number}
              className="p-6 md:p-8 flex flex-col justify-between group hover:bg-[#DDECF0]/40 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-number text-lg font-bold text-[#7B858A] group-hover:text-[#E88B7B] transition-colors">
                  {pillar.number}
                </span>
                <span className="w-1.5 h-1.5 bg-[#0B1F2A]/20 group-hover:bg-[#E88B7B] transition-colors" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1F2A] mb-2 group-hover:text-[#16394A] transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#7B858A] leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
