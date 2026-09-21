import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Introduction } from './components/Introduction';
import { ServicesList } from './components/ServicesList';
import { FeaturedService } from './components/FeaturedService';
import { VisualPhilosophy } from './components/VisualPhilosophy';
import { DoctorSection } from './components/DoctorSection';
import { GallerySection } from './components/GallerySection';
import { ProcessSection } from './components/ProcessSection';
import { InstagramSection } from './components/InstagramSection';
import { ContactLocation } from './components/ContactLocation';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { FloatingDock } from './components/FloatingDock';
import { FloatingLeaves } from './components/FloatingLeaves';
import { DetailsModal, ModalData } from './components/DetailsModal';

gsap.registerPlugin(ScrollTrigger);

export function App() {
  const lenisRef = useRef<Lenis | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);

  useEffect(() => {
    // 1. Initialize Lenis once with optimal configuration
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.5,
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis scroll with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    return () => {
      clearTimeout(refreshTimer);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handleSmoothNavigate = (targetId: string) => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetElement, {
        offset: -40,
        duration: 1.2,
      });
    } else {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Modal Handlers
  const handleOpenServiceDetails = (serviceId: string = 'skin-rejuvenation') => {
    setModalData({
      type: 'service',
      id: serviceId,
    });
    setModalOpen(true);
  };

  const handleOpenDoctorDetails = () => {
    setModalData({
      type: 'doctor',
    });
    setModalOpen(true);
  };

  const handleOpenPhilosophyDetails = (id: number) => {
    setModalData({
      type: 'philosophy',
      id,
    });
    setModalOpen(true);
  };

  const handleOpenStepDetails = (stepNum: string) => {
    setModalData({
      type: 'process',
      id: stepNum,
    });
    setModalOpen(true);
  };

  const handleOpenGalleryDetails = (imageId: number) => {
    setModalData({
      type: 'gallery',
      id: imageId,
    });
    setModalOpen(true);
  };

  const handleOpenConsultation = () => {
    setModalData({
      type: 'consultation',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[#F5F3EA] text-[#252923] font-vazir antialiased selection:bg-[#9CAF88] selection:text-[#FBFAF4]">
      {/* Background Ambient Floating Green Leaves with Wind Simulation */}
      <FloatingLeaves />

      {/* Refined Sticky Navigation Bar */}
      <Navbar
        onNavigate={handleSmoothNavigate}
        onOpenConsultation={handleOpenConsultation}
      />

      {/* Main Landing Page Flow */}
      <main className="relative z-10">
        {/* 01: Sophisticated Editorial Hero */}
        <Hero
          onNavigate={handleSmoothNavigate}
          onOpenServiceDetails={handleOpenServiceDetails}
        />

        {/* 02: Introduction & Editorial Statement */}
        <Introduction />

        {/* 03: Five Dedicated Aesthetic Services List */}
        <ServicesList
          onOpenServiceDetails={handleOpenServiceDetails}
        />

        {/* 04: Featured Service Deep Dive */}
        <FeaturedService
          onNavigate={handleSmoothNavigate}
          onOpenServiceDetails={handleOpenServiceDetails}
        />

        {/* 05: Visual Philosophy (تعادل · دقت · طبیعی) */}
        <VisualPhilosophy
          onOpenPhilosophyDetails={handleOpenPhilosophyDetails}
        />

        {/* 06: Dignified Doctor & Clinical Team */}
        <DoctorSection
          onOpenDoctorDetails={handleOpenDoctorDetails}
        />

        {/* 07: Organic Space & Atmosphere Gallery */}
        <GallerySection
          onOpenGalleryDetails={handleOpenGalleryDetails}
        />

        {/* 08: Client Experience Process Timeline */}
        <ProcessSection
          onOpenStepDetails={handleOpenStepDetails}
        />

        {/* 09: Instagram Social Grid */}
        <InstagramSection />

        {/* 10: Contact Information & Direct Navigation */}
        <ContactLocation />

        {/* 11: Final Editorial Call to Action */}
        <FinalCta
          onOpenConsultation={handleOpenConsultation}
        />
      </main>

      {/* Minimal Footer with Picksaw Studio attribution */}
      <Footer onNavigate={handleSmoothNavigate} />

      {/* Floating 3-Button Contact Dock (Phone, WhatsApp, Instagram) */}
      <FloatingDock />

      {/* Interactive Details Modal Window */}
      <DetailsModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        modalData={modalData}
        onSelectService={(id) => handleOpenServiceDetails(id)}
      />
    </div>
  );
}

export default App;
