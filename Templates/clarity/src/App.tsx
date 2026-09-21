import { useSmoothScroll } from './hooks/useSmoothScroll';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { Services } from './components/Services';
import { FeaturedImageSection } from './components/FeaturedImageSection';
import { CarePhilosophy } from './components/CarePhilosophy';
import { DoctorSection } from './components/DoctorSection';
import { Gallery } from './components/Gallery';
import { Process } from './components/Process';
import { InstagramSection } from './components/InstagramSection';
import { ContactSection } from './components/ContactSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { FloatingContactDock } from './components/FloatingContactDock';
import { AmbientBackgroundAura } from './components/AmbientBackgroundAura';

export function App() {
  const { scrollTo } = useSmoothScroll();

  const handleNavigate = (targetId: string) => {
    scrollTo(targetId, { offset: -70 });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E4F0F6] text-[#203A43] antialiased selection:bg-[#CFE8F3] selection:text-[#203A43] relative">
      {/* Ambient Fluid Background Aura (Flows smoothly with page scrolling) */}
      <AmbientBackgroundAura />

      {/* Top Sticky Minimal Navbar */}
      <Navbar onNavigate={handleNavigate} />

      {/* Main Page Sections */}
      <main id="main-content" className="grow">
        {/* 1. Hero Section */}
        <Hero onNavigate={handleNavigate} />

        {/* 2. Trust Strip */}
        <TrustStrip />

        {/* 3. Services Section (Vertical Editorial List) */}
        <Services onNavigate={handleNavigate} />

        {/* 4. Featured Image Section (65% width statement) */}
        <FeaturedImageSection />

        {/* 5. Care Philosophy (3 Vertical Principles with scroll highlight) */}
        <CarePhilosophy />

        {/* 6. Doctor / Practitioner Section */}
        <DoctorSection onNavigate={handleNavigate} />

        {/* 7. Clinic Space Gallery (6 asymmetrical images) */}
        <Gallery />

        {/* 8. Process / Journey (4 Steps) */}
        <Process />

        {/* 9. Instagram Social Feed */}
        <InstagramSection />

        {/* 10. Contact Information & Map Apps */}
        <ContactSection />

        {/* 11. Final Closing CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Floating 3-Button Contact Dock (Instagram, Phone, WhatsApp) on bottom right */}
      <FloatingContactDock />
    </div>
  );
}

export default App;
