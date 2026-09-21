/**
 * =========================================================================
 * 📁 LUMEN CLINIC - IMAGE CONFIGURATION (images.ts)
 * =========================================================================
 * This is File 1 of 2 for complete site customization.
 *
 * Change any image URL or local path (/images/...) in this single file.
 * Any images placed in the `public/images/` directory will load locally
 * and bundle automatically when you run `npm run build`.
 */

export const CLINIC_IMAGES = {
  // ==========================================
  // 1. HERO SECTION IMAGES
  // ==========================================
  /** Main hero portrait (Recommended: 4:5 aspect ratio, e.g. 800x1000px) */
  HERO_PORTRAIT: "/images/hero-portrait.jpg",

  /** Hero floating supporting detail (Recommended: 1:1 square, e.g. 600x600px) */
  HERO_DETAIL: "/images/hero-detail.jpg",

  // ==========================================
  // 2. FEATURE SECTION
  // ==========================================
  /** Large architectural / clinic interior feature (Recommended: 16:10 landscape) */
  FEATURE_IMAGE: "/images/feature-clinic.jpg",

  // ==========================================
  // 3. DOCTOR PROFILE
  // ==========================================
  /** Doctor / Medical leadership portrait (Recommended: 3:4 portrait) */
  DOCTOR_IMAGE: "/images/doctor.jpg",

  // ==========================================
  // 4. SERVICES (Exact 5 services)
  // ==========================================
  /** Service 01: مراقبت و جوانسازی پوست */
  SERVICE_01: "/images/hero-portrait.jpg",

  /** Service 02: لیزر */
  SERVICE_02: "/images/service-laser.jpg",

  /** Service 03: فرم‌دهی چهره */
  SERVICE_03: "/images/service-contour.jpg",

  /** Service 04: مراقبت مو */
  SERVICE_04: "/images/service-hair.jpg",

  /** Service 05: مشاوره زیبایی */
  SERVICE_05: "/images/service-consultation.jpg",

  // ==========================================
  // 5. GALLERY («فضای لومن» - 6 varied items)
  // ==========================================
  /** Gallery Item 01 - اتاق درمان و جوانسازی (Landscape) */
  GALLERY_01: "/images/gallery-treatment.jpg",

  /** Gallery Item 02 - دقت در فرآیندهای لیزر (Portrait) */
  GALLERY_02: "/images/service-laser.jpg",

  /** Gallery Item 03 - سالن انتظار و پذیرش (Portrait) */
  GALLERY_03: "/images/gallery-architecture.jpg",

  /** Gallery Item 04 - ترکیبات دارویی استاندارد (Square) */
  GALLERY_04: "/images/hero-detail.jpg",

  /** Gallery Item 05 - فضای استراحت و آرامش (Landscape) */
  GALLERY_05: "/images/feature-clinic.jpg",

  /** Gallery Item 06 - مشاوره و آنالیز اختصاصی (Portrait) */
  GALLERY_06: "/images/service-consultation.jpg",

  // ==========================================
  // 6. INSTAGRAM JOURNAL (6 Square Photos)
  // ==========================================
  INSTAGRAM_01: "/images/service-contour.jpg",
  INSTAGRAM_02: "/images/hero-detail.jpg",
  INSTAGRAM_03: "/images/gallery-architecture.jpg",
  INSTAGRAM_04: "/images/service-laser.jpg",
  INSTAGRAM_05: "/images/gallery-treatment.jpg",
  INSTAGRAM_06: "/images/hero-portrait.jpg",
};

export type ClinicImagesType = typeof CLINIC_IMAGES;
