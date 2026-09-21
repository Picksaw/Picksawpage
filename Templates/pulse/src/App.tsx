import { useState } from "react";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { Navbar } from "./components/Navbar";
import { FloatingDock } from "./components/FloatingDock";
import { Hero } from "./components/Hero";
import { InformationBand } from "./components/InformationBand";
import { ServicesSection } from "./components/ServicesSection";
import { FeaturedImageBand } from "./components/FeaturedImageBand";
import { DoctorSection } from "./components/DoctorSection";
import { VisualStatement } from "./components/VisualStatement";
import { GallerySection } from "./components/GallerySection";
import { ProcessSection } from "./components/ProcessSection";
import { InstagramSection } from "./components/InstagramSection";
import { ContactSection } from "./components/ContactSection";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { DetailsModal, ModalType } from "./components/DetailsModal";
import { ServiceDetail, ProcessDetail } from "./config/contentConfig";
import { IMAGE_CONFIG } from "./config/imageConfig";

export function App() {
  // Initialize single Lenis smooth scroll synchronized with GSAP
  useLenisScroll();

  // Active details modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleOpenServiceModal = (service: ServiceDetail) => {
    // Find matching thumbnail if any
    const matchingImg = IMAGE_CONFIG.SERVICES_IMAGES.find((s) => s.serviceId === service.id);
    setActiveModal({
      type: "service",
      data: service,
      imageSrc: matchingImg?.src || IMAGE_CONFIG.GALLERY_IMAGES[0].src,
    });
  };

  const handleOpenDoctorModal = () => {
    setActiveModal({ type: "doctor" });
  };

  const handleOpenGalleryModal = (item: {
    imageSrc: string;
    caption: string;
    detailDescription?: string;
  }) => {
    setActiveModal({
      type: "gallery",
      imageSrc: item.imageSrc,
      caption: item.caption,
      detailDescription: item.detailDescription,
    });
  };

  const handleOpenProcessModal = (step: ProcessDetail) => {
    setActiveModal({
      type: "process",
      data: step,
    });
  };

  const handleOpenConsultationModal = () => {
    setActiveModal({ type: "consultation" });
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#0B1F2A] font-sans selection:bg-[#E88B7B] selection:text-white relative">
      {/* Refined Sticky Architectural Navigation */}
      <Navbar onOpenConsultationModal={handleOpenConsultationModal} />

      {/* Persistent 3-button Floating Dock */}
      <FloatingDock />

      {/* Main Content Sections */}
      <main>
        {/* 10 & 11 - Full-width Editorial Hero Band */}
        <Hero onOpenConsultationModal={handleOpenConsultationModal} />

        {/* 12 - Four-column Information Band */}
        <InformationBand />

        {/* 13 - Two-column Editorial Service Index */}
        <ServicesSection onOpenServiceModal={handleOpenServiceModal} />

        {/* 14 - Wide Featured Image Band with subtle parallax */}
        <FeaturedImageBand />

        {/* 15 - Doctor Profile Split Composition */}
        <DoctorSection onOpenDoctorModal={handleOpenDoctorModal} />

        {/* 16 - Full-width Ice-Blue Visual Statement */}
        <VisualStatement />

        {/* 17 - Horizontal Image Rail Gallery */}
        <GallerySection onOpenGalleryModal={handleOpenGalleryModal} />

        {/* 18 - 4-Step Process Journey */}
        <ProcessSection onOpenProcessModal={handleOpenProcessModal} />

        {/* 19 - Instagram Social Section */}
        <InstagramSection />

        {/* 20 - Structured Contact & Location */}
        <ContactSection />

        {/* 21 - Dark Navy Closing Final CTA */}
        <FinalCTA />
      </main>

      {/* 22 - Minimal Structured Footer */}
      <Footer />

      {/* Interactive Details Modal / Windows */}
      <DetailsModal modalData={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  );
}

export default App;
