/**
 * PICKSAW TEMPLATE #2 — CLARITY
 * Master Centralized Clinic Configuration
 * 
 * This file aggregates modular configuration files:
 *  - clinicText.ts   -> All Persian copy, titles, labels, descriptions
 *  - clinicImages.ts -> All image URLs, WebP sources, dimensions, and alts
 *  - clinicContact.ts -> Phone numbers, addresses, social, and maps
 * 
 * You can edit the individual files or use this unified export.
 */

import { CLINIC_TEXT } from './clinicText';
import { CLINIC_IMAGES } from './clinicImages';
import { CLINIC_CONTACT } from './clinicContact';

export { CLINIC_TEXT, CLINIC_IMAGES, CLINIC_CONTACT };

export interface ClinicConfig {
  // Brand & Identity
  CLINIC_NAME: string;
  CLINIC_NAME_EN: string;
  CLINIC_TAGLINE: string;
  CLINIC_CATEGORY: string;
  CLINIC_BADGE: string;

  // Doctor / Lead Practitioner
  DOCTOR_NAME: string;
  DOCTOR_TITLE: string;
  DOCTOR_BIO: string;
  DOCTOR_IMAGE: string;
  DOCTOR_IMAGE_WEBP?: string;

  // Contact Information
  PHONE_NUMBER: string;
  PHONE_DISPLAY: string;
  MOBILE_NUMBER: string;
  MOBILE_DISPLAY: string;
  WHATSAPP_NUMBER: string;
  WHATSAPP_URL: string;
  INSTAGRAM_HANDLE: string;
  INSTAGRAM_URL: string;

  // Location & Schedule
  ADDRESS: string;
  WORKING_HOURS: string;

  // Navigation Links
  MAP_BALAD_URL: string;
  MAP_NESHAN_URL: string;
  MAP_GOOGLE_URL: string;

  // Services (Exactly 5 services)
  SERVICE_01_NAME: string;
  SERVICE_01_DESCRIPTION: string;
  SERVICE_02_NAME: string;
  SERVICE_02_DESCRIPTION: string;
  SERVICE_03_NAME: string;
  SERVICE_03_DESCRIPTION: string;
  SERVICE_04_NAME: string;
  SERVICE_04_DESCRIPTION: string;
  SERVICE_05_NAME: string;
  SERVICE_05_DESCRIPTION: string;

  // Gallery (6 images)
  GALLERY_IMAGE_01: string;
  GALLERY_IMAGE_01_ALT: string;
  GALLERY_IMAGE_01_WEBP?: string;
  GALLERY_IMAGE_02: string;
  GALLERY_IMAGE_02_ALT: string;
  GALLERY_IMAGE_02_WEBP?: string;
  GALLERY_IMAGE_03: string;
  GALLERY_IMAGE_03_ALT: string;
  GALLERY_IMAGE_03_WEBP?: string;
  GALLERY_IMAGE_04: string;
  GALLERY_IMAGE_04_ALT: string;
  GALLERY_IMAGE_04_WEBP?: string;
  GALLERY_IMAGE_05: string;
  GALLERY_IMAGE_05_ALT: string;
  GALLERY_IMAGE_05_WEBP?: string;
  GALLERY_IMAGE_06: string;
  GALLERY_IMAGE_06_ALT: string;
  GALLERY_IMAGE_06_WEBP?: string;

  // Featured Imagery
  HERO_IMAGE: string;
  HERO_IMAGE_WEBP?: string;
  FEATURED_IMAGE: string;
  FEATURED_IMAGE_WEBP?: string;

  // Social Feed Images
  INSTAGRAM_IMAGES: Array<{
    id: number;
    url: string;
    webpUrl?: string;
    caption: string;
    alt: string;
  }>;
}

export const CLINIC_CONFIG: ClinicConfig = {
  // Brand & Identity
  CLINIC_NAME: CLINIC_TEXT.brand.nameFa,
  CLINIC_NAME_EN: CLINIC_TEXT.brand.nameEn,
  CLINIC_TAGLINE: CLINIC_TEXT.brand.tagline,
  CLINIC_CATEGORY: CLINIC_TEXT.brand.category,
  CLINIC_BADGE: CLINIC_TEXT.brand.badge,

  // Lead Practitioner
  DOCTOR_NAME: CLINIC_TEXT.doctor.name,
  DOCTOR_TITLE: CLINIC_TEXT.doctor.title,
  DOCTOR_BIO: CLINIC_TEXT.doctor.bio,
  DOCTOR_IMAGE: CLINIC_IMAGES.doctor.src,
  DOCTOR_IMAGE_WEBP: CLINIC_IMAGES.doctor.webpSrc,

  // Contact Details
  PHONE_NUMBER: CLINIC_CONTACT.phone.number,
  PHONE_DISPLAY: CLINIC_CONTACT.phone.display,
  MOBILE_NUMBER: CLINIC_CONTACT.mobile.number,
  MOBILE_DISPLAY: CLINIC_CONTACT.mobile.display,
  WHATSAPP_NUMBER: CLINIC_CONTACT.whatsapp.number,
  WHATSAPP_URL: CLINIC_CONTACT.whatsapp.url,
  INSTAGRAM_HANDLE: CLINIC_CONTACT.instagram.handle,
  INSTAGRAM_URL: CLINIC_CONTACT.instagram.url,

  // Location & Schedule
  ADDRESS: CLINIC_CONTACT.location.address,
  WORKING_HOURS: CLINIC_CONTACT.location.workingHours,

  // Navigation URLs
  MAP_BALAD_URL: CLINIC_CONTACT.maps.baladUrl,
  MAP_NESHAN_URL: CLINIC_CONTACT.maps.neshanUrl,
  MAP_GOOGLE_URL: CLINIC_CONTACT.maps.googleMapsUrl,

  // Services
  SERVICE_01_NAME: CLINIC_TEXT.services.items[0].name,
  SERVICE_01_DESCRIPTION: CLINIC_TEXT.services.items[0].description,

  SERVICE_02_NAME: CLINIC_TEXT.services.items[1].name,
  SERVICE_02_DESCRIPTION: CLINIC_TEXT.services.items[1].description,

  SERVICE_03_NAME: CLINIC_TEXT.services.items[2].name,
  SERVICE_03_DESCRIPTION: CLINIC_TEXT.services.items[2].description,

  SERVICE_04_NAME: CLINIC_TEXT.services.items[3].name,
  SERVICE_04_DESCRIPTION: CLINIC_TEXT.services.items[3].description,

  SERVICE_05_NAME: CLINIC_TEXT.services.items[4].name,
  SERVICE_05_DESCRIPTION: CLINIC_TEXT.services.items[4].description,

  // Gallery
  GALLERY_IMAGE_01: CLINIC_IMAGES.gallery[0].src,
  GALLERY_IMAGE_01_ALT: CLINIC_IMAGES.gallery[0].alt,
  GALLERY_IMAGE_01_WEBP: CLINIC_IMAGES.gallery[0].webpSrc,

  GALLERY_IMAGE_02: CLINIC_IMAGES.gallery[1].src,
  GALLERY_IMAGE_02_ALT: CLINIC_IMAGES.gallery[1].alt,
  GALLERY_IMAGE_02_WEBP: CLINIC_IMAGES.gallery[1].webpSrc,

  GALLERY_IMAGE_03: CLINIC_IMAGES.gallery[2].src,
  GALLERY_IMAGE_03_ALT: CLINIC_IMAGES.gallery[2].alt,
  GALLERY_IMAGE_03_WEBP: CLINIC_IMAGES.gallery[2].webpSrc,

  GALLERY_IMAGE_04: CLINIC_IMAGES.gallery[3].src,
  GALLERY_IMAGE_04_ALT: CLINIC_IMAGES.gallery[3].alt,
  GALLERY_IMAGE_04_WEBP: CLINIC_IMAGES.gallery[3].webpSrc,

  GALLERY_IMAGE_05: CLINIC_IMAGES.gallery[4].src,
  GALLERY_IMAGE_05_ALT: CLINIC_IMAGES.gallery[4].alt,
  GALLERY_IMAGE_05_WEBP: CLINIC_IMAGES.gallery[4].webpSrc,

  GALLERY_IMAGE_06: CLINIC_IMAGES.gallery[5].src,
  GALLERY_IMAGE_06_ALT: CLINIC_IMAGES.gallery[5].alt,
  GALLERY_IMAGE_06_WEBP: CLINIC_IMAGES.gallery[5].webpSrc,

  // Key Visuals
  HERO_IMAGE: CLINIC_IMAGES.hero.src,
  HERO_IMAGE_WEBP: CLINIC_IMAGES.hero.webpSrc,
  FEATURED_IMAGE: CLINIC_IMAGES.featured.src,
  FEATURED_IMAGE_WEBP: CLINIC_IMAGES.featured.webpSrc,

  // Instagram Feed
  INSTAGRAM_IMAGES: CLINIC_IMAGES.instagram.map((item) => ({
    id: item.id,
    url: item.src,
    webpUrl: item.webpSrc,
    caption: item.caption,
    alt: item.alt,
  })),
};
