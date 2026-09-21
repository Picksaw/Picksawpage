import React, { useEffect } from 'react';
import { CONTENT_CONFIG } from '../config/content.config';
import { IMAGES_CONFIG } from '../config/images.config';
import {
  X,
  Sparkles,
  Phone,
  MessageCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

export type ModalType =
  | 'service'
  | 'doctor'
  | 'philosophy'
  | 'process'
  | 'gallery'
  | 'consultation'
  | null;

export interface ModalData {
  type: ModalType;
  id?: string | number;
  title?: string;
  subtitle?: string;
  data?: any;
}

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalData: ModalData | null;
  onSelectService?: (serviceId: string) => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  modalData,
  onSelectService,
}) => {
  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !modalData) return null;

  // 1. Service Details Modal
  const renderServiceContent = () => {
    const service =
      CONTENT_CONFIG.SERVICES.find((s) => s.id === modalData.id) ||
      CONTENT_CONFIG.SERVICES[0];

    return (
      <div className="space-y-6">
        {/* Service Header */}
        <div className="border-b border-[#D9D0BC]/60 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-editorial text-xs font-bold text-[#9CAF88] tracking-widest uppercase">
              {service.enNumber}
            </span>
            <span className="text-[#70756D]">•</span>
            <span className="text-xs text-[#70756D] font-medium">{service.number}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#252923] mb-3">
            {service.name}
          </h3>
          <p className="text-base text-[#70756D] leading-relaxed font-light">
            {service.shortDescription}
          </p>
        </div>

        {/* Detailed Description */}
        <div className="bg-[#F5F3EA] p-5 sm:p-6 rounded-2xl border border-[#D9D0BC]/60 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#344236]">
            <Sparkles className="w-4 h-4 text-[#9CAF88]" />
            <span>شرح تخصصی و رویکرد وردا</span>
          </div>
          <p className="text-sm sm:text-base text-[#252923] leading-relaxed font-light">
            {service.fullDescription}
          </p>
          <div className="pt-2 text-xs sm:text-sm text-[#70756D] border-t border-[#D9D0BC]/40">
            <strong className="text-[#344236] font-medium ml-1">رویکرد درمانی:</strong>
            {service.approach}
          </div>
        </div>

        {/* Key Benefits */}
        <div>
          <h4 className="text-sm font-bold text-[#252923] mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#9CAF88]" />
            <span>مزایا و نتایج مورد انتظار</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {service.keyBenefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#E9EFE0] border border-[#D9D0BC]/60 text-xs sm:text-sm text-[#252923]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CAF88] mt-2 shrink-0" />
                <span className="leading-relaxed">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Candidates & Session Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC]/50 text-xs sm:text-sm">
            <span className="font-semibold text-[#344236] block mb-1">مناسب برای:</span>
            <p className="text-[#70756D] leading-relaxed">{service.recommendedFor}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC]/50 text-xs sm:text-sm">
            <span className="font-semibold text-[#344236] block mb-1">تعداد جلسات:</span>
            <p className="text-[#70756D] leading-relaxed">{service.sessionInfo}</p>
          </div>
        </div>

        {/* Other Services Switcher */}
        <div className="pt-4 border-t border-[#D9D0BC]/60">
          <span className="text-xs font-semibold text-[#70756D] block mb-3">
            سایر خدمات کلینیک وردا:
          </span>
          <div className="flex flex-wrap gap-2">
            {CONTENT_CONFIG.SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectService && onSelectService(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  s.id === service.id
                    ? 'bg-[#344236] text-[#FBFAF4]'
                    : 'bg-[#F5F3EA] text-[#70756D] hover:bg-[#D9D0BC]/50 hover:text-[#252923]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 2. Doctor / Team Details Modal
  const renderDoctorContent = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start border-b border-[#D9D0BC]/60 pb-6">
          <div className="w-28 h-36 rounded-2xl overflow-hidden bg-[#D9D0BC]/40 shrink-0 border border-[#D9D0BC]">
            <img
              src={IMAGES_CONFIG.DOCTOR_IMAGE}
              alt={CONTENT_CONFIG.DOCTOR.NAME}
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9CAF88]/15 border border-[#9CAF88]/30 text-[#344236] text-xs font-medium mb-2">
              <UserCheck className="w-3.5 h-3.5" />
              <span>{CONTENT_CONFIG.DOCTOR.BADGE}</span>
            </div>
            <h3 className="text-2xl font-bold text-[#252923] mb-1">
              {CONTENT_CONFIG.DOCTOR.NAME}
            </h3>
            <p className="text-sm text-[#70756D] font-editorial mb-3">
              {CONTENT_CONFIG.DOCTOR.TITLE_EN}
            </p>
            <p className="text-xs sm:text-sm text-[#70756D] leading-relaxed">
              {CONTENT_CONFIG.DOCTOR.BIO}
            </p>
          </div>
        </div>

        {/* Pillars of Care */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[#252923] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#9CAF88]" />
            <span>اصول مراقبت و استاندارد بالینی</span>
          </h4>
          <div className="space-y-2.5">
            {CONTENT_CONFIG.DOCTOR.CARE_PILLARS.map((pillar, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F5F3EA] border border-[#D9D0BC]/50 text-xs sm:text-sm text-[#252923]"
              >
                <span className="w-2 h-2 rounded-full bg-[#9CAF88] shrink-0" />
                <span>{pillar}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#E9EFE0] p-4 rounded-xl border border-[#D9D0BC]/60 text-xs text-[#70756D] flex items-center justify-between">
          <span>{CONTENT_CONFIG.DOCTOR.PHILOSOPHY_NOTE}</span>
          <span className="font-editorial text-[#9CAF88]">{CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}</span>
        </div>
      </div>
    );
  };

  // 3. Philosophy Modal
  const renderPhilosophyContent = () => {
    const item =
      CONTENT_CONFIG.PHILOSOPHY.ITEMS.find((p) => p.id === modalData.id) ||
      CONTENT_CONFIG.PHILOSOPHY.ITEMS[0];

    return (
      <div className="space-y-6">
        <div className="border-b border-[#D9D0BC]/60 pb-5">
          <span className="font-editorial text-xs font-bold text-[#9CAF88] tracking-widest uppercase mb-1 block">
            {item.en} · PHILOSOPHY
          </span>
          <h3 className="text-3xl font-bold text-[#344236] mb-3">{item.word}</h3>
          <p className="text-base text-[#70756D] leading-relaxed font-light">
            {item.shortDescription}
          </p>
        </div>

        <div className="bg-[#F5F3EA] p-5 rounded-2xl border border-[#D9D0BC]/60">
          <h4 className="text-sm font-bold text-[#252923] mb-2">مفهوم و نگرش وردا</h4>
          <p className="text-sm sm:text-base text-[#252923] leading-relaxed font-light">
            {item.fullExplanation}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#252923] mb-3">رویکرد عملی در کلینیک:</h4>
          <div className="space-y-2">
            {item.principles.map((pr, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#E9EFE0] border border-[#D9D0BC]/60 text-xs sm:text-sm text-[#252923]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#9CAF88] shrink-0" />
                <span>{pr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 4. Process Step Modal
  const renderProcessContent = () => {
    const step =
      CONTENT_CONFIG.PROCESS.STEPS.find((s) => s.num === modalData.id) ||
      CONTENT_CONFIG.PROCESS.STEPS[0];

    return (
      <div className="space-y-6">
        <div className="border-b border-[#D9D0BC]/60 pb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-editorial text-xs font-bold text-[#9CAF88] tracking-widest">
              {step.enNum}
            </span>
            <span className="text-[#70756D]">•</span>
            <span className="text-xs text-[#70756D] font-medium">{step.num}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#252923] mb-2">{step.title}</h3>
          <p className="text-base text-[#70756D] leading-relaxed font-light">
            {step.description}
          </p>
        </div>

        <div className="bg-[#F5F3EA] p-5 rounded-2xl border border-[#D9D0BC]/60 space-y-3">
          <h4 className="text-sm font-bold text-[#344236]">جزئیات این مرحله:</h4>
          <p className="text-sm sm:text-base text-[#252923] leading-relaxed font-light">
            {step.detailedNotes}
          </p>
          <div className="pt-2 text-xs text-[#70756D] border-t border-[#D9D0BC]/40 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#9CAF88]" />
            <span>{step.durationNote}</span>
          </div>
        </div>
      </div>
    );
  };

  // 5. Gallery Photo Modal
  const renderGalleryContent = () => {
    const galleryItem =
      IMAGES_CONFIG.GALLERY_IMAGES.find((g) => g.id === modalData.id) ||
      IMAGES_CONFIG.GALLERY_IMAGES[0];

    return (
      <div className="space-y-5">
        <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#D9D0BC]/40 border border-[#D9D0BC]">
          <img
            src={galleryItem.src}
            alt={galleryItem.alt}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E9D98A]" />
            <span className="text-xs font-editorial text-[#70756D] tracking-wider uppercase">
              {galleryItem.category}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#252923] mb-2">
            {galleryItem.title}
          </h3>
          <p className="text-sm sm:text-base text-[#70756D] leading-relaxed font-light">
            {galleryItem.caption}
          </p>
        </div>
      </div>
    );
  };

  // 6. Consultation Modal
  const renderConsultationContent = () => {
    return (
      <div className="space-y-6">
        <div className="border-b border-[#D9D0BC]/60 pb-5">
          <span className="font-editorial text-xs font-bold text-[#9CAF88] tracking-widest uppercase mb-1 block">
            CONSULTATION & INQUIRY
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#252923] mb-2">
            هماهنگی و مشاوره اختصاصی
          </h3>
          <p className="text-sm sm:text-base text-[#70756D] leading-relaxed font-light">
            برای دریافت مشاوره، پاسخ به پرسش‌ها و هماهنگی زمان ویزیت، از راه‌های مستقیم زیر با پذیرش کلینیک وردا در ارتباط باشید.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
            className="p-4 rounded-2xl bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-colors flex items-center justify-between shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#E9D98A]" />
              <div>
                <span className="text-xs text-[#FBFAF4]/70 block">تماس تلفنی</span>
                <span className="text-sm font-bold font-editorial">{CONTENT_CONFIG.CONTACT.PHONE_DISPLAY}</span>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </a>

          <a
            href={`https://wa.me/${CONTENT_CONFIG.CONTACT.WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-[#F5F3EA] border border-[#D9D0BC] text-[#344236] hover:border-[#9CAF88] transition-colors flex items-center justify-between shadow-xs group"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-[#9CAF88]" />
              <div>
                <span className="text-xs text-[#70756D] block">گفتگو در واتساپ</span>
                <span className="text-sm font-bold font-editorial">{CONTENT_CONFIG.CONTACT.WHATSAPP_DISPLAY}</span>
              </div>
            </div>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="bg-[#F5F3EA] p-4 rounded-xl border border-[#D9D0BC]/50 text-xs text-[#70756D] space-y-1">
          <p>
            <strong className="text-[#252923]">ساعات پاسخگویی:</strong> {CONTENT_CONFIG.CONTACT.WORKING_HOURS}
          </p>
          <p>
            <strong className="text-[#252923]">نشانی:</strong> {CONTENT_CONFIG.CONTACT.ADDRESS}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#252923]/60 backdrop-blur-sm modal-backdrop-animate cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#E9EFE0] rounded-3xl border border-[#D9D0BC] shadow-2xl p-6 sm:p-8 modal-content-animate z-10">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن پنجره"
          className="absolute top-5 left-5 w-10 h-10 rounded-full bg-[#F5F3EA] border border-[#D9D0BC]/70 text-[#70756D] hover:text-[#252923] hover:bg-[#D9D0BC]/40 transition-colors flex items-center justify-center focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Render Specific Modal Content */}
        {modalData.type === 'service' && renderServiceContent()}
        {modalData.type === 'doctor' && renderDoctorContent()}
        {modalData.type === 'philosophy' && renderPhilosophyContent()}
        {modalData.type === 'process' && renderProcessContent()}
        {modalData.type === 'gallery' && renderGalleryContent()}
        {modalData.type === 'consultation' && renderConsultationContent()}

        {/* Modal Footer Direct Action */}
        <div className="mt-8 pt-6 border-t border-[#D9D0BC]/60 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#70756D]">
            <span>کلینیک تخصصی {CONTENT_CONFIG.BRAND.CLINIC_NAME}</span>
            <span className="mx-1.5">•</span>
            <span className="font-editorial">{CONTENT_CONFIG.BRAND.CLINIC_NAME_EN}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${CONTENT_CONFIG.CONTACT.WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D9D0BC] text-[#344236] hover:bg-[#F5F3EA] transition-colors text-xs font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#9CAF88]" />
              <span>واتساپ</span>
            </a>

            <a
              href={`tel:${CONTENT_CONFIG.CONTACT.PHONE_RAW}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#344236] text-[#FBFAF4] hover:bg-[#252923] transition-colors text-xs font-medium"
            >
              <Phone className="w-3.5 h-3.5 text-[#E9D98A]" />
              <span>تماس مستقیم</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
