import React from 'react';
import { ServiceItem } from '../types';
import { CLINIC_INFO } from '../data/content';
import { X, Sparkles, Clock, CheckCircle2, UserCheck, Phone, MessageCircle } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onConnect: (serviceName: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, onClose, onConnect }) => {
  if (!service) return null;

  const whatsappMessage = encodeURIComponent(
    `سلام، مایل به دریافت مشاوره در زمینه «${service.title}» در کلینیک لومینا دنتال هستم.`
  );
  const whatsappUrl = `https://wa.me/${CLINIC_INFO.whatsappRaw}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-[#07111F]/80 backdrop-blur-xl animate-fadeIn">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div className="relative w-full max-w-2xl bg-[#0a182c] border border-white/20 rounded-3xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] z-10 overflow-hidden text-right">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#5DB8FF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="بستن"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7FE7FF] mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{service.tag}</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
          {service.title}
        </h3>

        {/* Full description */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
          {service.fullDesc}
        </p>

        {/* Highlight details box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-[#5DB8FF] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-400 block mb-0.5">مدت زمان معمول:</span>
              <span className="text-slate-200 font-semibold">{service.duration}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-[#7FE7FF] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="text-slate-400 block mb-0.5">رویکرد درمانی:</span>
              <span className="text-slate-200 font-semibold">{service.approach}</span>
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-bold text-white">مزایای اختصاصی این درمان در لومینا دنتال:</h4>
          <ul className="space-y-2.5">
            {service.benefits.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-[#5DB8FF] shrink-0 mt-0.5" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal for note */}
        <div className="p-3.5 rounded-xl bg-[#5DB8FF]/10 border border-[#5DB8FF]/20 text-xs text-slate-300 mb-8">
          <strong className="text-[#7FE7FF] font-semibold block mb-1">کاندیدای مناسب:</strong>
          <span>{service.idealFor}</span>
        </div>

        {/* Modal actions (WhatsApp & Direct Call) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => onConnect(service.title)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Phone className="w-4 h-4 text-[#5DB8FF]" />
            <span>مشاهده راه‌های تماس و مسیریابی</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-[#07111F] bg-gradient-to-l from-[#5DB8FF] to-[#7FE7FF] hover:opacity-90 shadow-lg cursor-pointer transition-transform hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span>مشاوره سریع واتس‌اپ برای «{service.title}»</span>
          </a>
        </div>

      </div>
    </div>
  );
};
