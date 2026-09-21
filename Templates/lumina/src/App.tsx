import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { Services } from './components/Services';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { WhyLumina } from './components/WhyLumina';
import { Specialists } from './components/Specialists';
import { ClinicExperience } from './components/ClinicExperience';
import { PatientJourney } from './components/PatientJourney';
import { ConsultationPlans } from './components/ConsultationPlans';
import { FAQ } from './components/FAQ';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { PicksawStudioModal } from './components/PicksawStudioModal';
import { FloatingActions } from './components/FloatingActions';
import { CursorGlow } from './components/CursorGlow';
import { ServiceItem, Specialist, ConsultationTier } from './types';

export function App() {
  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactModalTitle, setContactModalTitle] = useState('ارتباط و هماهنگی نوبت مشاوره');
  const [contactModalTopic, setContactModalTopic] = useState('مشاوره عمومی دندانپزشکی');

  // Service Detail Modal State
  const [activeServiceDetail, setActiveServiceDetail] = useState<ServiceItem | null>(null);
  
  // Picksaw Template Modal State
  const [isPicksawModalOpen, setIsPicksawModalOpen] = useState(false);

  // Handlers
  const handleOpenContact = (topic: string = 'مشاوره عمومی دندانپزشکی', title: string = 'ارتباط و هماهنگی نوبت مشاوره') => {
    setContactModalTopic(topic);
    setContactModalTitle(title);
    setIsContactOpen(true);
  };

  const handleSelectServiceForDetail = (service: ServiceItem) => {
    setActiveServiceDetail(service);
  };

  const handleQuickContactFromService = (serviceTitle: string) => {
    handleOpenContact(`مشاوره تخصصی «${serviceTitle}»`, `هماهنگی مشاوره ${serviceTitle}`);
  };

  const handleOpenContactWithDoctor = (doctor: Specialist) => {
    handleOpenContact(`مشاوره و ویزیت با ${doctor.name} (${doctor.role})`, `هماهنگی وقت ویزیت با ${doctor.name}`);
  };

  const handleSelectConsultationTier = (tier: ConsultationTier) => {
    handleOpenContact(`جلسه ${tier.title} (${tier.subtitle})`, `هماهنگی ${tier.title}`);
  };

  const handleExploreServices = () => {
    const servicesElement = document.getElementById('services');
    if (servicesElement) {
      servicesElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] selection:bg-[#5DB8FF]/25 selection:text-[#7FE7FF] relative font-sans overflow-x-hidden">
      {/* Desktop Ambient Cursor Follower */}
      <CursorGlow />

      {/* Sticky Translucent Header */}
      <Navbar onOpenContact={handleOpenContact} />

      {/* Main Page Landmark */}
      <main>
        {/* Fullscreen Hero Section */}
        <Hero
          onOpenContact={handleOpenContact}
          onExploreServices={handleExploreServices}
        />

        {/* Trust Domains Strip */}
        <TrustStrip />

        {/* Services Showcase (6 Luxury Cards with Detail Inspection) */}
        <Services
          onSelectService={handleSelectServiceForDetail}
          onQuickContact={handleQuickContactFromService}
        />

        {/* Interactive Before & After Comparison */}
        <BeforeAfterSlider onOpenContact={handleOpenContact} />

        {/* Why Lumina (Precision, Serenity, Natural Outcome) */}
        <WhyLumina />

        {/* Specialists (3 Specialists with Profiles & Direct Contact) */}
        <Specialists onOpenContactWithDoctor={handleOpenContactWithDoctor} />

        {/* Clinic Experience (Cinematic Space Gallery with Lightbox) */}
        <ClinicExperience />

        {/* Patient Journey (4-Step Timeline) */}
        <PatientJourney onOpenBooking={() => handleOpenContact('مشاوره مرحله اول')} />

        {/* Consultation Options (3 Pathways) */}
        <ConsultationPlans onSelectTier={handleSelectConsultationTier} />

        {/* Frequently Asked Questions */}
        <FAQ onOpenContact={handleOpenContact} />

        {/* High-Impact Final CTA */}
        <FinalCTA onOpenContact={handleOpenContact} />
      </main>

      {/* Luxury Footer with Iranian Maps (Neshan, Balad, Google Maps) */}
      <Footer
        onOpenTemplateInfo={() => setIsPicksawModalOpen(true)}
        onOpenContact={handleOpenContact}
      />

      {/* Floating Action Buttons (Phone, WhatsApp, Instagram, Scroll to top) */}
      <FloatingActions />

      {/* MODALS */}
      {/* 1. Fast Direct Contact Modal (WhatsApp, Phone, Instagram, Neshan, Balad, Google Maps) */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        title={contactModalTitle}
        topic={contactModalTopic}
      />

      {/* 2. Full Treatment & Clinical Service Detail Modal */}
      <ServiceDetailModal
        service={activeServiceDetail}
        onClose={() => setActiveServiceDetail(null)}
        onConnect={(serviceName) => {
          setActiveServiceDetail(null);
          handleOpenContact(`مشاوره در زمینه «${serviceName}»`, `هماهنگی ${serviceName}`);
        }}
      />

      {/* 3. Picksaw Studio Template Customization Modal */}
      <PicksawStudioModal
        isOpen={isPicksawModalOpen}
        onClose={() => setIsPicksawModalOpen(false)}
      />
    </div>
  );
}
export default App;
