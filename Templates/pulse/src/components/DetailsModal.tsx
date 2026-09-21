import React, { useEffect, useState } from "react";
import { X, Phone, MessageCircle, Clock, CheckCircle2, Copy, Check } from "lucide-react";
import { SITE_CONTENT } from "../config/contentConfig";
import { ServiceDetail, ProcessDetail } from "../config/contentConfig";
import { getLenis } from "../hooks/useLenisScroll";

export type ModalType =
  | { type: "service"; data: ServiceDetail; imageSrc?: string }
  | { type: "doctor" }
  | { type: "gallery"; imageSrc: string; caption: string; detailDescription?: string }
  | { type: "process"; data: ProcessDetail }
  | { type: "consultation" }
  | null;

interface DetailsModalProps {
  modalData: ModalType;
  onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ modalData, onClose }) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    const lenis = getLenis();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (modalData) {
      // Stop Lenis and lock document scroll to prevent background scrolling
      lenis?.stop();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      lenis?.start();
    };
  }, [modalData, onClose]);

  if (!modalData) return null;

  const handleCopyPhone = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 overscroll-contain"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0B1F2A]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      />

      {/* Modal Container with Isolated Scrollbar */}
      <div
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[88vh] bg-[#F7F6F2] text-[#0B1F2A] border border-[#0B1F2A]/20 shadow-2xl overflow-y-auto overscroll-contain z-10 animate-in fade-in zoom-in-95 duration-200 custom-modal-scrollbar"
      >
        {/* Modal Top Architectural Header */}
        <div className="sticky top-0 z-20 bg-[#0B1F2A] text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-[#E88B7B]" />
            <span className="text-xs font-bold uppercase tracking-wider font-editorial text-[#DDECF0]">
              {SITE_CONTENT.BRAND.NAME_EN} · DETAILS
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#DDECF0] hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
            aria-label={SITE_CONTENT.MODALS.CLOSE_BTN}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body based on type */}
        <div className="p-6 sm:p-8">
          {/* ================= SERVICE MODAL ================= */}
          {modalData.type === "service" && (
            <div className="space-y-6">
              {/* Service Header */}
              <div className="border-b border-[#0B1F2A]/10 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-number text-2xl font-extrabold text-[#E88B7B]">
                    {modalData.data.number}
                  </span>
                  <span className="text-[11px] font-editorial text-[#7B858A] uppercase tracking-wider">
                    {modalData.data.latinName}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#0B1F2A]">
                  {modalData.data.name}
                </h3>
              </div>

              {/* Image preview if present */}
              {modalData.imageSrc && (
                <div className="w-full h-48 sm:h-56 overflow-hidden bg-[#0B1F2A] border border-[#0B1F2A]/10">
                  <img
                    src={modalData.imageSrc}
                    alt={modalData.data.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Full Clinical Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B858A] mb-2 font-editorial">
                  CLINICAL OVERVIEW
                </h4>
                <p className="text-sm text-[#0B1F2A]/85 leading-relaxed bg-[#EEF5F7] p-4 border-r-2 border-[#16394A]">
                  {modalData.data.fullOverview}
                </p>
              </div>

              {/* Key Benefits */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B858A] mb-3 font-editorial">
                  {SITE_CONTENT.MODALS.BENEFITS_HEADING}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {modalData.data.keyBenefits.map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-[#16394A] bg-white p-3 border border-[#0B1F2A]/8"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#E88B7B] shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Protocol Steps */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B858A] mb-3 font-editorial">
                  {SITE_CONTENT.MODALS.PROTOCOL_HEADING}
                </h4>
                <div className="space-y-2">
                  {modalData.data.protocolSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-white border border-[#0B1F2A]/8 text-xs text-[#0B1F2A]"
                    >
                      <span className="font-number font-bold text-[#E88B7B] w-6">
                        0{i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duration & Sessions Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#DDECF0]/60 border border-[#0B1F2A]/10 text-xs">
                <div>
                  <span className="font-bold block text-[#16394A] mb-1">
                    {SITE_CONTENT.MODALS.DURATION_LABEL}
                  </span>
                  <span className="text-[#0B1F2A]">{modalData.data.sessionDuration}</span>
                </div>
                <div>
                  <span className="font-bold block text-[#16394A] mb-1">
                    {SITE_CONTENT.MODALS.SESSIONS_LABEL}
                  </span>
                  <span className="text-[#0B1F2A]">
                    {modalData.data.recommendedSessions}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#0B1F2A]/10 flex flex-wrap gap-3">
                <a
                  href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0B1F2A] text-white hover:bg-[#16394A] text-xs font-bold transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#E88B7B]" />
                  <span>تماس و مشاوره نوبت</span>
                </a>
                <a
                  href={SITE_CONTENT.CONTACT.WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 py-3 px-4 bg-white text-[#0B1F2A] border border-[#0B1F2A]/20 hover:bg-[#EEF5F7] text-xs font-bold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#16394A]" />
                  <span>ارتباط در واتساپ</span>
                </a>
              </div>
            </div>
          )}

          {/* ================= DOCTOR MODAL ================= */}
          {modalData.type === "doctor" && (
            <div className="space-y-6">
              <div className="border-b border-[#0B1F2A]/10 pb-4">
                <span className="text-xs text-[#7B858A] block mb-1">
                  {SITE_CONTENT.DOCTOR_SECTION.LABEL}
                </span>
                <h3 className="text-2xl font-bold text-[#0B1F2A]">
                  {SITE_CONTENT.DOCTOR_SECTION.NAME}
                </h3>
                <p className="text-sm font-semibold text-[#16394A] mt-1">
                  {SITE_CONTENT.DOCTOR_SECTION.TITLE}
                </p>
              </div>

              <div className="bg-[#EEF5F7] p-5 border-r-2 border-[#E88B7B]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#16394A] mb-2 font-editorial">
                  PHILOSOPHY & APPROACH
                </h4>
                <p className="text-sm text-[#0B1F2A]/90 leading-loose">
                  {SITE_CONTENT.DOCTOR_SECTION.BIO}
                </p>
              </div>

              <div className="p-4 bg-white border border-[#0B1F2A]/10">
                <p className="text-base font-bold text-[#0B1F2A] mb-2">
                  «{SITE_CONTENT.DOCTOR_SECTION.STATEMENT}»
                </p>
                <p className="text-xs text-[#7B858A] leading-relaxed">
                  {SITE_CONTENT.DOCTOR_SECTION.STATEMENT_SUB}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#DDECF0]/40 border border-[#0B1F2A]/10">
                  <span className="font-bold block text-[#0B1F2A] mb-1">مشاوره حضوری</span>
                  <span className="text-[#7B858A]">ارزیابی دقیق قبل از هر درمان</span>
                </div>
                <div className="p-3 bg-[#DDECF0]/40 border border-[#0B1F2A]/10">
                  <span className="font-bold block text-[#0B1F2A] mb-1">متریال استاندارد</span>
                  <span className="text-[#7B858A]">استفاده از برندهای دارای مجوز</span>
                </div>
                <div className="p-3 bg-[#DDECF0]/40 border border-[#0B1F2A]/10">
                  <span className="font-bold block text-[#0B1F2A] mb-1">پیگیری درمان</span>
                  <span className="text-[#7B858A]">پایش مداوم نتایج بعد از مراجعه</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#0B1F2A]/10">
                <a
                  href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0B1F2A] text-white hover:bg-[#16394A] text-xs font-bold transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#E88B7B]" />
                  <span>تماس جهت تعیین وقت ویزیت</span>
                </a>
              </div>
            </div>
          )}

          {/* ================= GALLERY LIGHTBOX MODAL ================= */}
          {modalData.type === "gallery" && (
            <div className="space-y-5">
              <div className="w-full max-h-[50vh] overflow-hidden bg-[#0B1F2A] border border-[#0B1F2A]/10">
                <img
                  src={modalData.imageSrc}
                  alt={modalData.caption}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="border-t border-[#0B1F2A]/10 pt-4">
                <h3 className="text-lg font-bold text-[#0B1F2A] mb-2">
                  {modalData.caption}
                </h3>
                {modalData.detailDescription && (
                  <p className="text-xs sm:text-sm text-[#7B858A] leading-relaxed bg-[#EEF5F7] p-4 border-r-2 border-[#16394A]">
                    {modalData.detailDescription}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ================= PROCESS STEP MODAL ================= */}
          {modalData.type === "process" && (
            <div className="space-y-6">
              <div className="border-b border-[#0B1F2A]/10 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-number text-2xl font-extrabold text-[#E88B7B]">
                    {modalData.data.number}
                  </span>
                  <span className="text-xs font-editorial text-[#7B858A] uppercase tracking-wider">
                    {modalData.data.latin}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#0B1F2A]">
                  مرحله {modalData.data.title}
                </h3>
              </div>

              <p className="text-sm text-[#0B1F2A]/90 leading-loose bg-[#EEF5F7] p-4 border-r-2 border-[#16394A]">
                {modalData.data.fullDetail}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7B858A] mb-3 font-editorial">
                  POINTS OF FOCUS
                </h4>
                <div className="space-y-2">
                  {modalData.data.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-3 bg-white border border-[#0B1F2A]/8 text-xs text-[#16394A]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#E88B7B] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#0B1F2A]/10 flex gap-3">
                <a
                  href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0B1F2A] text-white hover:bg-[#16394A] text-xs font-bold transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#E88B7B]" />
                  <span>تماس و شروع مرحله اول</span>
                </a>
              </div>
            </div>
          )}

          {/* ================= CONSULTATION MODAL ================= */}
          {modalData.type === "consultation" && (
            <div className="space-y-6">
              <div className="border-b border-[#0B1F2A]/10 pb-4">
                <span className="text-xs text-[#7B858A] block mb-1">
                  {SITE_CONTENT.BRAND.NAME_EN} · CLINIC
                </span>
                <h3 className="text-2xl font-bold text-[#0B1F2A]">
                  {SITE_CONTENT.MODALS.CONSULTATION_MODAL_TITLE}
                </h3>
                <p className="text-xs text-[#7B858A] mt-1">
                  {SITE_CONTENT.CONTACT_SECTION.SUBTITLE}
                </p>
              </div>

              {/* Direct Phone Numbers (with explicit LTR display) */}
              <div className="space-y-3">
                {/* Landline */}
                <div className="p-4 bg-white border border-[#0B1F2A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A]">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-[#7B858A] block">تلفن ثابت کلینیک</span>
                      <span
                        dir="ltr"
                        className="font-number text-base font-bold text-[#0B1F2A] tracking-wider text-left inline-block"
                      >
                        {SITE_CONTENT.CONTACT.PHONE_DISPLAY_LTR}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(SITE_CONTENT.CONTACT.PHONE_RAW)}
                      className="px-3 py-2 bg-[#EEF5F7] hover:bg-[#DDECF0] text-[#16394A] text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPhone ? "کپی شد" : "کپی"}</span>
                    </button>
                    <a
                      href={`tel:${SITE_CONTENT.CONTACT.PHONE_RAW}`}
                      className="px-4 py-2 bg-[#0B1F2A] hover:bg-[#16394A] text-white text-xs font-bold transition-colors"
                    >
                      تماس
                    </a>
                  </div>
                </div>

                {/* Mobile / WhatsApp */}
                <div className="p-4 bg-white border border-[#0B1F2A]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#DDECF0] flex items-center justify-center text-[#16394A]">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs text-[#7B858A] block">شماره همراه و واتساپ</span>
                      <span
                        dir="ltr"
                        className="font-number text-base font-bold text-[#0B1F2A] tracking-wider text-left inline-block"
                      >
                        {SITE_CONTENT.CONTACT.MOBILE_DISPLAY_LTR}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={SITE_CONTENT.CONTACT.WHATSAPP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#0B1F2A] hover:bg-[#16394A] text-white text-xs font-bold transition-colors"
                    >
                      واتساپ
                    </a>
                    <a
                      href={`tel:${SITE_CONTENT.CONTACT.MOBILE_RAW}`}
                      className="px-4 py-2 bg-[#EEF5F7] hover:bg-[#DDECF0] text-[#16394A] text-xs font-bold transition-colors"
                    >
                      تماس
                    </a>
                  </div>
                </div>
              </div>

              {/* Working Hours */}
              <div className="flex items-center gap-3 p-4 bg-[#EEF5F7] border border-[#0B1F2A]/8 text-xs text-[#16394A]">
                <Clock className="w-4 h-4 text-[#E88B7B] shrink-0" />
                <span>{SITE_CONTENT.CONTACT.WORKING_HOURS}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
