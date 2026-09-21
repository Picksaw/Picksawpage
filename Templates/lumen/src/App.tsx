import React, { useState } from 'react';
import { useSmoothScroll, scrollToSection } from './hooks/useSmoothScroll';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { EditorialIntro } from './components/EditorialIntro';
import { ServicesSection } from './components/ServicesSection';
import { FeatureSection } from './components/FeatureSection';
import { DoctorSection } from './components/DoctorSection';
import { PhilosophySection } from './components/PhilosophySection';
import { GallerySection } from './components/GallerySection';
import { ProcessSection } from './components/ProcessSection';
import { InstagramSection } from './components/InstagramSection';
import { ContactSection } from './components/ContactSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { FloatingContactDock } from './components/FloatingContactDock';
import { ConsultationModal } from './components/ConsultationModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { FeatureDetailModal } from './components/FeatureDetailModal';
import { ProcessDetailModal } from './components/ProcessDetailModal';
import { InteractiveBackground } from './components/InteractiveBackground';
import { ServiceItem } from './config/clinicData';

export const App: React.FC = () => {
  // Initialize Lenis smooth scroll and synchronize with GSAP ScrollTrigger
  useSmoothScroll();

  // Window Modal States
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [activeConsultationService, setActiveConsultationService] = useState<string | undefined>();
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceItem | null>(null);
  const [isFeatureDetailOpen, setIsFeatureDetailOpen] = useState(false);
  const [isProcessDetailOpen, setIsProcessDetailOpen] = useState(false);

  const handleOpenConsultation = (serviceName?: string) => {
    setActiveConsultationService(serviceName);
    setIsConsultationOpen(true);
  };

  const handleCloseConsultation = () => {
    setIsConsultationOpen(false);
    setActiveConsultationService(undefined);
  };

  const handleOpenServiceDetail = (service: ServiceItem) => {
    setSelectedServiceDetail(service);
  };

  const handleCloseServiceDetail = () => {
    setSelectedServiceDetail(null);
  };

  return (
    <div className="relative min-h-[100dvh] bg-linen text-[#242126] selection:bg-[#332635] selection:text-[#F7F3EE] antialiased overflow-x-hidden font-['Vazirmatn']" dir="rtl">
      {/* Interactive Responsive Background Canvas - visible throughout and reactive to scrolling */}
      <InteractiveBackground />

      {/* Sticky Header Navbar */}
      <Navbar onOpenConsultation={() => handleOpenConsultation()} />

      {/* Main Content Sections - stacked above the background canvas */}
      <main id="main-content" className="relative z-10">
        {/* 10 - Hero */}
        <Hero
          onOpenConsultation={() => handleOpenConsultation()}
          onExploreServices={() => scrollToSection('services')}
        />

        {/* 12 - Editorial Intro */}
        <EditorialIntro />

        {/* 13 - Services Interactive Index */}
        <ServicesSection
          onOpenConsultationWithService={(svc) => handleOpenConsultation(svc)}
          onOpenServiceDetail={(svc) => handleOpenServiceDetail(svc)}
        />

        {/* 14 - Feature Section */}
        <FeatureSection
          onOpenFeatureDetail={() => setIsFeatureDetailOpen(true)}
        />

        {/* 15 - Doctor Section */}
        <DoctorSection onOpenConsultation={() => handleOpenConsultation()} />

        {/* 16 - Philosophy Concepts */}
        <PhilosophySection />

        {/* 17 - Varied Gallery with Lightbox Window */}
        <GallerySection
          onOpenConsultation={() => handleOpenConsultation()}
        />

        {/* 18 - Process Steps */}
        <ProcessSection
          onOpenProcessDetail={() => setIsProcessDetailOpen(true)}
        />

        {/* 19 - Instagram Social Grid */}
        <InstagramSection />

        {/* 20 - Contact & Navigation Hub */}
        <ContactSection />

        {/* 21 - Final CTA */}
        <FinalCTA onOpenConsultation={() => handleOpenConsultation()} />
      </main>

      {/* 22 - Footer */}
      <div className="relative z-10">
        <Footer />
      </div>

      {/* 09 - Floating Utility Contact Dock */}
      <FloatingContactDock />

      {/* Direct Channel Consultation Concierge Window Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={handleCloseConsultation}
        serviceTitle={activeConsultationService}
      />

      {/* Service Detail Window Modal */}
      <ServiceDetailModal
        service={selectedServiceDetail}
        isOpen={!!selectedServiceDetail}
        onClose={handleCloseServiceDetail}
        onOpenConsultation={(svc) => handleOpenConsultation(svc)}
      />

      {/* Feature Section Detail Window Modal */}
      <FeatureDetailModal
        isOpen={isFeatureDetailOpen}
        onClose={() => setIsFeatureDetailOpen(false)}
        onOpenConsultation={() => handleOpenConsultation('بررسی شرایط و رویکرد بالینی')}
      />

      {/* Process Roadmap Window Modal */}
      <ProcessDetailModal
        isOpen={isProcessDetailOpen}
        onClose={() => setIsProcessDetailOpen(false)}
        onOpenConsultation={() => handleOpenConsultation('هماهنگی اولین نوبت مشاوره')}
      />
    </div>
  );
};

export default App;
