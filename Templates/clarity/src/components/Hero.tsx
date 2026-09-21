import React, { useEffect, useRef, useState } from 'react';
import { CLINIC_CONFIG, CLINIC_IMAGES, CLINIC_TEXT } from '../config/clinicConfig';
import { ArrowLeft, PhoneCall, Sparkles } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import gsap from 'gsap';
import { Modal } from './Modal';

interface HeroProps {
  onNavigate?: (targetId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const floatingElementRef = useRef<HTMLDivElement>(null);
  
  // Modal states
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });

      // New animation sequence: image reveals first, then text fades in
      tl.fromTo(
        imageRef.current,
        { opacity: 0, scale: 0.95, x: -20 },
        { opacity: 1, scale: 1, x: 0, duration: 1.2, ease: 'power2.out' }
      )
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6 },
          '-=0.5'
        )
        .fromTo(
          headlineRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.8 },
          '-=0.4'
        )
        .fromTo(
          descRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.4'
        )
        .fromTo(
          floatingElementRef.current,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' },
          '-=0.6'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (target === '#services') {
      setIsServicesModalOpen(true);
    } else if (target === '#contact') {
      setIsContactModalOpen(true);
    } else if (onNavigate) {
      onNavigate(target);
    } else {
      const el = document.querySelector(target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const closeServicesModal = () => setIsServicesModalOpen(false);
  const closeContactModal = () => setIsContactModalOpen(false);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden"
      aria-label="بخش معرفی کلینیک کلاریتی"
    >
      {/* New atmospheric background with different gradient positioning */}
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#F0D8DC]/20 via-[#CFE8F3]/15 to-transparent pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-t from-[#D9A6AE]/10 to-transparent pointer-events-none -z-10" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* NEW LAYOUT: Image on LEFT, Text on RIGHT - Full width split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Hero Image - Now on the left side with new styling */}
          <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-md lg:max-w-lg">
              
              {/* New decorative glow effect - more pronounced */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#D9A6AE]/50 via-[#CFE8F3]/40 to-[#F0D8DC]/30 rounded-[40px] blur-2xl opacity-80 -z-10 animate-pulse-slow" />
              
              {/* New image container - hexagonal/rounded shape with border */}
              <div
                ref={imageRef}
                className="relative w-full aspect-[4/5] sm:aspect-[5/6] lg:aspect-[3/4] overflow-hidden rounded-[32px] bg-[#F6E3E6] border-2 border-[#D9A6AE]/30 shadow-2xl transform-gpu hover:scale-102 transition-transform duration-700 ease-out"
              >
                <OptimizedImage
                  src={CLINIC_IMAGES.hero.src}
                  webpSrc={CLINIC_IMAGES.hero.webpSrc}
                  fallbackSrc={CLINIC_IMAGES.hero.fallbackSrc}
                  alt={CLINIC_IMAGES.hero.alt}
                  priority={true}
                  className="w-full h-full object-cover object-center"
                />
                
                {/* New overlay - warmer tone */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#D9A6AE]/40 via-[#F0D8DC]/20 to-transparent pointer-events-none" />
                
                {/* Decorative corner elements */}
                <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-[#D9A6AE]/40 rounded-tl-[32px]" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-[#D9A6AE]/40 rounded-br-[32px]" />
              </div>
              
              {/* New floating badge - positioned differently */}
              <div
                ref={floatingElementRef}
                className="absolute -top-6 -left-6 p-4 rounded-2xl bg-[#F6E3E6]/95 backdrop-blur-lg border border-[#D9A6AE]/40 shadow-lg max-w-[220px] z-20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D9A6AE]" />
                  <span className="text-[11px] font-semibold text-[#203A43]">
                    فضاهای اختصاصی مراقبت
                  </span>
                </div>
                <p className="text-[10px] text-[#69767C] mt-1">
                  طراحی شده برای آرامش و تمرکز
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Text Content - Now on the right with new layout */}
          <div className="flex flex-col items-start text-right space-y-6 lg:space-y-8 order-1 lg:order-2 lg:pr-8">
            
            {/* New badge styling - different position and colors */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#F0D8DC]/70 border border-[#D9A6AE]/40 text-xs font-semibold text-[#203A43] tracking-wide shadow-sm hover:shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#D9A6AE]" />
              <span className="font-latin tracking-wider uppercase text-[11px] text-[#203A43]/90">
                {CLINIC_CONFIG.CLINIC_BADGE}
              </span>
            </div>

            {/* NEW HEADLINE: Single continuous line with emphasis */}
            <h1
              ref={headlineRef}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[3.8rem] font-extrabold text-[#203A43] leading-[1.2] tracking-tight"
            >
              <span className="block">{CLINIC_TEXT.hero.headlineLine1}{CLINIC_TEXT.hero.headlineLine2}</span>
            </h1>

            {/* New description styling */}
            <p
              ref={descRef}
              className="text-base sm:text-lg text-[#69767C] max-w-lg leading-relaxed font-normal mt-2"
            >
              {CLINIC_TEXT.hero.description}
            </p>

            {/* New CTA layout - horizontal with different styling */}
            <div
              ref={ctaRef}
              className="pt-4 flex flex-wrap items-center gap-4 w-full sm:w-auto"
            >
              {/* Primary CTA - New design */}
              <a
                href="#services"
                onClick={(e) => handleCtaClick(e, '#services')}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-[#D9A6AE] text-[#FFFDFC] text-sm font-semibold hover:bg-[#D9A6AE]/90 hover:shadow-lg transition-all duration-200 shadow-md"
              >
                <span>{CLINIC_TEXT.hero.primaryCta}</span>
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </a>

              {/* Secondary CTA - New design */}
              <a
                href="#contact"
                onClick={(e) => handleCtaClick(e, '#contact')}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-[#F6E3E6] text-[#203A43] border-2 border-[#D9A6AE]/40 hover:border-[#D9A6AE] hover:bg-[#F0D8DC]/40 text-sm font-semibold transition-all duration-200"
              >
                <PhoneCall className="w-4 h-4 text-[#D9A6AE] group-hover:text-[#203A43]" />
                <span>{CLINIC_TEXT.hero.secondaryCta}</span>
              </a>
            </div>

            {/* New tagline with different styling */}
            <div className="pt-4 flex items-center gap-3 text-xs text-[#69767C]/80 font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#D9A6AE] to-[#CFE8F3]" />
              <span className="text-[#D9A6AE]/90">{CLINIC_CONFIG.CLINIC_TAGLINE}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Services Modal */}
      <Modal
        isOpen={isServicesModalOpen}
        onClose={closeServicesModal}
        title="خدمات کلینیک کلاریتی"
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-sm text-[#69767C] leading-relaxed">
            کلینیک کلاریتی خدمات تخصصی مراقبت از پوست، مو و زیبایی را با رویکردی شخصی‌سازی شده ارائه می‌دهد.
            تمام خدمات پس از ارزیابی دقیق وضعیت پوست و مشاوره تخصصی تنظیم می‌گردند.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLINIC_TEXT.services.items.map((service, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-[#F0D8DC]/20 border border-[#D9A6AE]/20 hover:bg-[#F0D8DC]/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-[#D9A6AE] font-latin">{service.numEn}</span>
                  <h3 className="font-bold text-[#203A43]">{service.name}</h3>
                </div>
                <p className="text-sm text-[#69767C] pr-6">{service.description}</p>
                <span className="inline-block mt-2 px-2 py-1 text-[10px] bg-[#D9A6AE]/20 text-[#D9A6AE] rounded-full">
                  {service.tag}
                </span>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => {
                closeServicesModal();
                if (onNavigate) onNavigate('#services');
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D9A6AE] text-[#FFFDFC] text-sm font-semibold hover:bg-[#D9A6AE]/90 transition-all"
            >
              مشاهده همه خدمات
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

      {/* Contact Modal */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        title="تماس با کلینیک"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-sm text-[#69767C] leading-relaxed">
            برای هماهنگی وقت مشاوره، راهنمایی خدمات یا کسب اطلاعات بیشتر، از مسیرهای زیر با ما تماس بگیرید.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D9A6AE]/20 flex items-center justify-center flex-shrink-0">
                <PhoneCall className="w-5 h-5 text-[#D9A6AE]" />
              </div>
              <div>
                <h4 className="font-bold text-[#203A43]">شماره تماس</h4>
                <p className="text-sm text-[#69767C]" dir="ltr">{CLINIC_CONFIG.PHONE_DISPLAY}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D9A6AE]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#D9A6AE]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[#203A43]">اینستاگرام</h4>
                <p className="text-sm text-[#69767C]" dir="ltr">{CLINIC_CONFIG.INSTAGRAM_HANDLE}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#D9A6AE]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#D9A6AE]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 1.192-.248 2.318-.684 3.354l.995 3.654-.362.214a9.87 9.87 0 01-5.036 1.378z"/>
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-[#203A43]">واتساپ</h4>
                <p className="text-sm text-[#69767C]" dir="ltr">{CLINIC_CONFIG.WHATSAPP_NUMBER}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              onClick={() => {
                closeContactModal();
                if (onNavigate) onNavigate('#contact');
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D9A6AE] text-[#FFFDFC] text-sm font-semibold hover:bg-[#D9A6AE]/90 transition-all"
            >
              مشاهده اطلاعات کامل
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>

    </section>
  );
};
