import React from "react";
import { SITE_CONTENT, ServiceDetail } from "../config/contentConfig";
import { ArrowLeft, Plus } from "lucide-react";

interface ServicesSectionProps {
  onOpenServiceModal?: (service: ServiceDetail) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenServiceModal }) => {
  return (
    <section
      id="services"
      className="py-16 md:py-24 bg-[#F7F6F2] border-b border-[#0B1F2A]/10"
      aria-label="فهرست خدمات کلینیک"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 md:px-12">
        {/* Two-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Fixed Header / Context */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-[2px] bg-[#E88B7B]" />
              <span className="text-[11px] font-bold text-[#7B858A] uppercase tracking-wider font-editorial">
                {SITE_CONTENT.SERVICES_SECTION.LABEL}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B1F2A] tracking-tight mb-5">
              {SITE_CONTENT.SERVICES_SECTION.TITLE}
            </h2>

            <p className="text-sm sm:text-base text-[#7B858A] leading-relaxed mb-6">
              {SITE_CONTENT.SERVICES_SECTION.DESCRIPTION}
            </p>

            <div className="hidden lg:block p-5 bg-[#EEF5F7] border-r-2 border-[#16394A] border border-[#0B1F2A]/8 text-xs text-[#16394A] leading-relaxed">
              <span className="font-bold block mb-1">
                {SITE_CONTENT.SERVICES_SECTION.CONSULTATION_NOTE_TITLE}
              </span>
              {SITE_CONTENT.SERVICES_SECTION.CONSULTATION_NOTE_DESC}
            </div>
          </div>

          {/* Right Column: 5 Numbered Rows (Editorial Index) */}
          <div className="lg:col-span-8 border-t border-[#0B1F2A]/15">
            {SITE_CONTENT.SERVICES_SECTION.LIST.map((service) => (
              <article
                key={service.id}
                onClick={() => onOpenServiceModal?.(service)}
                className="group relative p-6 sm:p-8 border-b border-[#0B1F2A]/12 transition-all duration-300 hover:bg-[#DDECF0] cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`مشاهده جزئیات خدمت ${service.name}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenServiceModal?.(service);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 md:gap-6">
                  {/* Oversized Number & Title */}
                  <div className="flex items-start gap-4 sm:gap-6">
                    <span className="font-number text-3xl sm:text-4xl font-extrabold text-[#16394A]/40 group-hover:text-[#E88B7B] transition-colors duration-200 shrink-0 select-none">
                      {service.number}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-[#7B858A] uppercase font-editorial tracking-wider">
                          {service.latinName}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-[#0B1F2A] group-hover:text-[#16394A] transition-colors duration-200 mb-2.5">
                        {service.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#7B858A] group-hover:text-[#0B1F2A]/80 leading-relaxed transition-colors duration-200 max-w-xl">
                        {service.shortDescription}
                      </p>

                      {/* Tag badges */}
                      <div className="flex flex-wrap gap-2 mt-4">
                        {service.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium px-2.5 py-1 bg-white/80 group-hover:bg-white text-[#16394A] border border-[#0B1F2A]/8 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-[11px] font-semibold text-[#E88B7B] inline-flex items-center gap-1 group-hover:underline pr-1 self-center">
                          <Plus className="w-3 h-3" />
                          <span>{SITE_CONTENT.SERVICES_SECTION.VIEW_DETAILS_BTN}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Action Icon */}
                  <div className="self-end sm:self-start mt-2 sm:mt-1 shrink-0">
                    <div className="w-10 h-10 border border-[#0B1F2A]/15 group-hover:border-[#0B1F2A] group-hover:bg-[#0B1F2A] group-hover:text-[#F7F6F2] flex items-center justify-center text-[#16394A] transition-all duration-200">
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
