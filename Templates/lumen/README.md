# لومن | LUMEN Aesthetic Clinic Website

> **Template #5 in the Picksaw Studio Clinic Collection**  
> Repository: [https://github.com/Picksaw/lumen](https://github.com/Picksaw/lumen)

A production-ready, ultra-refined Persian RTL website designed for luxury aesthetic medicine clinics, dermatologists, and skincare centers.

---

## ✨ Features

- **Persian RTL First:** Crafted with natural modern Persian typography using Google's Vazirmatn variable font, optical kerning, and proper RTL layout flow.
- **2-File Centralized Customization:**
  - `src/config/images.ts`: Manage all image URLs and local asset paths (`public/images/...`).
  - `src/config/texts.ts`: Manage all headlines, descriptions, doctor bio, contact information, and button labels in one place.
- **Window Dialog Architecture (React Portals):**
  - Interactive window dialogs with macOS/iOS window chrome, traffic-light controls, and scrollable content.
  - Background scrolling is paused seamlessly (`pauseScroll()`) whenever any window is open.
- **Interactive Atmospheric Canvas:**
  - Reactive HTML5 canvas with luminous refraction nodes and subtle geometric light ripples that react to scroll velocity and cursor movement.
- **Lenis Smooth Scroll & GSAP ScrollTrigger:**
  - Synchronized smooth scrolling with restrained, deliberate entrance reveals.
- **Bespoke Vector Brand Emblem:**
  - Geometric vector logo representing light refraction and precision aesthetics.
- **Complete Direct Contact Channels:**
  - WhatsApp direct links with pre-filled Persian inquiries.
  - Direct telephone dialers.
  - Instagram social journal.
  - External routing buttons for Balad, Neshan, and Google Maps (zero iframe overhead).

---

## 🎨 Color System

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Deep Plum** | `#332635` | Dominant brand anchor, dark sections, typography |
| **Warm Ivory** | `#F7F3EE` | Dominant light canvas, editorial backgrounds |
| **Muted Mauve** | `#9B7B8D` | Secondary text, subtle borders, muted badges |
| **Soft Rose** | `#D8B6BE` | Refined accent, interactive highlights |
| **Charcoal** | `#242126` | Deep neutral for crisp body typography |
| **Warm Gray** | `#777176` | Editorial body copy, metadata |

---

## 🛠️ Project Structure

```
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD for GitHub Pages
├── public/
│   └── images/                   # Local image assets
├── src/
│   ├── components/               # UI components & window modals
│   │   ├── ConsultationModal.tsx # Concierge direct-channel modal
│   │   ├── ContactSection.tsx    # Contact & routing apps hub
│   │   ├── DoctorSection.tsx     # Medical leadership section
│   │   ├── EditorialIntro.tsx    # Typography-driven approach split
│   │   ├── FeatureDetailModal.tsx# Clinical approach window
│   │   ├── FeatureSection.tsx    # Featured space showcase
│   │   ├── FinalCTA.tsx          # Closing call to action
│   │   ├── FloatingContactDock.tsx # Fixed utility contact dock
│   │   ├── Footer.tsx            # Minimal editorial footer
│   │   ├── GalleryModal.tsx      # Responsive lightbox window
│   │   ├── GallerySection.tsx    # 6-item varied masonry gallery
│   │   ├── Hero.tsx              # Magazine editorial hero
│   │   ├── InstagramSection.tsx  # 6-photo Instagram journal
│   │   ├── InteractiveBackground.tsx # Reactive canvas background
│   │   ├── Logo.tsx              # Vector geometric emblem
│   │   ├── Navbar.tsx            # Sticky RTL header & mobile drawer
│   │   ├── PhilosophySection.tsx # 3 core philosophy principles
│   │   ├── ProcessDetailModal.tsx# Patient roadmap window
│   │   ├── ProcessSection.tsx    # 4-step care progression
│   │   ├── ServiceDetailModal.tsx# Service protocol detail window
│   │   └── ServicesSection.tsx   # Interactive 5-service index
│   ├── config/
│   │   ├── images.ts             # 📁 Central Image Configuration (File 1/2)
│   │   ├── texts.ts              # 📝 Central Text Configuration (File 2/2)
│   │   └── clinicData.ts         # Structured data composition
│   ├── hooks/
│   │   └── useSmoothScroll.ts    # Lenis & GSAP ScrollTrigger synchronization
│   ├── App.tsx                   # Main application layout
│   ├── index.css                 # Tailwind CSS theme & typography
│   └── main.tsx                  # React DOM entry point
├── index.html                    # HTML entry with Vazirmatn font
├── vite.config.ts                # Vite configuration
└── package.json                  # Dependencies & build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Picksaw/lumen.git

# Navigate to project directory
cd lumen

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
```

The output will be generated in the `dist/` directory.

---

## ⚙️ How to Customize

### 1. Changing Images (`src/config/images.ts`)
Place your clinic photos in `public/images/` and update their file names in `src/config/images.ts`:

```typescript
export const CLINIC_IMAGES = {
  HERO_PORTRAIT: "/images/your-hero-photo.jpg",
  DOCTOR_IMAGE: "/images/your-doctor-photo.jpg",
  // ...
};
```

### 2. Changing Texts (`src/config/texts.ts`)
Update all Persian text strings, clinic phone numbers, address, and doctor information in `src/config/texts.ts`:

```typescript
export const CLINIC_TEXTS = {
  BRAND_NAME_FA: "کلینیک تخصصی نام شما",
  PHONE_DISPLAY: "۰۲۱-۱۲۳۴۵۶۷۸",
  ADDRESS: "تهران، خیابان ...",
  // ...
};
```

---

## 📦 Deployment to GitHub Pages

This repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`).

To deploy:
1. Push your repository to `https://github.com/Picksaw/lumen`.
2. Go to your GitHub repository **Settings** -> **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Any push to `main` or `master` will build and deploy the site automatically.

---

## 📄 License

Designed and developed by **Picksaw Studio**.  
Released under the [MIT License](LICENSE).
