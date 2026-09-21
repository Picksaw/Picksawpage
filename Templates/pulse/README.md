# PULSE (پالس) — Modern Medical & Aesthetic Clinic Landing Page

> **Template #4 in the Picksaw Studio Clinic Template Collection**  
> Repository: [https://github.com/Picksaw/pulse](https://github.com/Picksaw/pulse)

---

## 🏛️ About the Template

**«پالس» (PULSE)** is a production-ready, Persian RTL editorial landing page template designed specifically for modern dermatology clinics, aesthetic medicine centers, private practices, and wellness centers.

* **Tagline:** *«دقت، از توجه شروع می‌شود.»* (Precision starts with attention.)
* **Visual Philosophy:** Modern medical architecture + editorial magazine layout + high-end healthcare branding.
* **Palette:** Primary Navy (`#0B1F2A`), Deep Blue (`#16394A`), Ice Blue (`#DDECF0` / `#EEF5F7`), Warm White (`#F7F6F2`), and Soft Coral (`#E88B7B`).
* **Typography:** Geometric architectural Persian typography (**Alexandria** & **Vazirmatn**) with **Plus Jakarta Sans** for Latin numerals and LTR formatting.

---

## ⚡ Centralized Configuration (2-File System)

All images, content, translations, doctor bio, service protocols, phone numbers, and gallery spaces can be managed entirely without touching component code:

### 1. `src/config/imageConfig.ts`
Controls all image assets across the website. Swap local files directly inside `public/images/` or change URLs in this file:
- `HERO_MAIN_IMAGE` (Hero cinematic banner)
- `FEATURED_BAND_IMAGE` (Featured architecture band)
- `DOCTOR_PORTRAIT` (Doctor profile photography)
- `GALLERY_IMAGES` (6 curated clinical space images with aspect ratios & captions)
- `INSTAGRAM_HIGHLIGHTS` (Social media editorial feed images)
- `SERVICES_IMAGES` (Service procedure thumbnail imagery)

### 2. `src/config/contentConfig.ts`
Controls all site copy, contact numbers with explicit LTR format, protocols, and interactive modal content:
- Clinic branding, Persian name, English label, and tagline
- Phone numbers, Mobile/WhatsApp numbers, and Instagram handles
- 5 practice area service breakdowns with clinical overviews, benefits, and protocols
- Doctor credentials, biography, and clinical philosophy
- 4-step patient journey breakdown
- Navigation links and address details
- Balad, Neshan, and Google Maps routing URLs

---

## 🚀 Key Features

- **Architectural Sticky Navigation:** Seamless transparency-to-opaque scroll transition with mobile vertical drawer and touch/keyboard accessibility.
- **Editorial Hero Band:** GSAP-animated horizontal image reveal with corner badge and oversized numeral markers.
- **2-Column Service Index:** Clean numbered row structure with hover state transitions and clinical deep-dive details windows.
- **Interactive Details Modals:** Self-contained modal system for services, doctor bio, space lightbox, process roadmap, and consultation with copy-to-clipboard actions.
- **Scroll Containment & Isolation:** Internal modal scrolling prevents background page scrolling.
- **GSAP & Lenis Smooth Scroll:** Synchronized single-instance smooth scroll with horizontal gallery translation on desktop and responsive vertical fallback.
- **Floating Contact Dock:** Persistent 3-action dock for Phone, WhatsApp, and Instagram with soft coral hover accents.
- **Zero Heavy 3D / No Bloat:** Fast loading, high performance, and SEO optimized.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Smooth Scrolling:** Lenis Scroll
- **Animations:** GSAP + GSAP ScrollTrigger
- **Icons:** Lucide React & Custom SVG
- **Fonts:** Alexandria, Vazirmatn, Plus Jakarta Sans

---

## 💻 Getting Started

### Installation

```bash
# Clone repository
git clone https://github.com/Picksaw/pulse.git
cd pulse

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```
The output will be bundled into the `dist/` directory.

---

## 🚢 Deployment (GitHub Actions)

A preconfigured GitHub Actions workflow is included at `.github/workflows/deploy.yml`:

1. Push your code to `main` or `master` branch.
2. In GitHub repository settings, navigate to **Settings > Pages**.
3. Under **Build and deployment > Source**, select **GitHub Actions**.
4. The workflow will automatically build and deploy the landing page.

---

## 📁 Project Structure

```
pulse/
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages automated CI/CD workflow
├── public/
│   └── images/                  # Local photography and branding assets
├── src/
│   ├── components/
│   │   ├── ContactSection.tsx   # Contact and navigation links
│   │   ├── DetailsModal.tsx     # Isolated details window / modal
│   │   ├── DoctorSection.tsx    # Split doctor portrait and bio
│   │   ├── FeaturedImageBand.tsx# Parallax architecture band
│   │   ├── FinalCTA.tsx         # Navy closing call to action
│   │   ├── FloatingDock.tsx     # 3-button persistent contact dock
│   │   ├── Footer.tsx           # Minimal architectural footer
│   │   ├── GallerySection.tsx   # GSAP horizontal image rail
│   │   ├── Hero.tsx             # Editorial hero banner with GSAP reveal
│   │   ├── InformationBand.tsx  # 4 foundational pillars band
│   │   ├── InstagramSection.tsx # Social grid
│   │   ├── Navbar.tsx           # Sticky architectural header & mobile drawer
│   │   ├── ProcessSection.tsx   # 4-step patient journey
│   │   └── ServicesSection.tsx  # Two-column editorial services index
│   ├── config/
│   │   ├── contentConfig.ts     # Central texts & copy configuration
│   │   ├── imageConfig.ts       # Central image paths & assets configuration
│   │   └── clinicConfig.ts      # Unified exports
│   ├── hooks/
│   │   └── useLenisScroll.ts    # Lenis + GSAP ScrollTrigger sync hook
│   ├── utils/
│   │   └── cn.ts                # Tailwind class utility
│   ├── App.tsx                  # Root application component
│   ├── index.css                # Tailwind CSS v4 & theme variables
│   └── main.tsx                 # Application entry point
├── index.html                   # HTML template with SEO metadata & Persian fonts
├── vite.config.ts               # Vite configuration
└── package.json                 # Dependencies & scripts
```

---

## 📄 License & Attribution

Designed and developed by **Picksaw Studio** as Template #4 for private clinic web branding.
