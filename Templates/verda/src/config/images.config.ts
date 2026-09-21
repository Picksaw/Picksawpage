/**
 * =========================================================================
 * VERDA CLINIC - IMAGE ASSETS CONFIGURATION
 * =========================================================================
 * 
 * This file centralizes ALL image paths, local file locations, and image metadata.
 * 
 * HOW TO CHANGE LOCAL IMAGES:
 * 1. Place your local image files inside the `public/images/` folder (or subfolders).
 * 2. Update the corresponding file path below (e.g., '/images/your-new-image.jpg').
 * 3. Run `npm run build` or start development with `npm run dev`.
 *    All images will load directly and bundle without errors!
 * 
 * =========================================================================
 */

export interface GalleryImageItem {
  id: number;
  src: string;
  alt: string;
  title: string;
  caption: string;
  category: string;
}

export interface SocialImageItem {
  id: number;
  image: string;
  alt: string;
  caption: string;
}

export const IMAGES_CONFIG = {
  // Hero Main Editorial Image
  HERO_IMAGE: '/images/hero-editorial.jpg',
  HERO_IMAGE_ALT: 'زیبایی طبیعی و مراقبت تخصصی در کلینیک وردا',

  // Featured Service Highlight Image
  FEATURED_SERVICE_IMAGE: '/images/featured-care.jpg',
  FEATURED_SERVICE_IMAGE_ALT: 'مراقبت دقیق و تخصصی پوست در وردا',

  // Doctor / Team Physician Portrait Image
  DOCTOR_IMAGE: '/images/doctor-portrait.jpg',
  DOCTOR_IMAGE_ALT: 'دکتر مریم شمس - پزشک زیبایی و مراقبت پوست کلینیک وردا',

  // Space & Atmosphere Gallery (6 local replaceable images)
  GALLERY_IMAGES: [
    {
      id: 1,
      src: '/images/clinic-interior.jpg',
      alt: 'فضای آرام و مینیمال ورودی و لابی کلینیک وردا',
      title: 'لابی و فضای انتظار آرامش‌بخش',
      caption: 'معماری آرام، متریال طبیعی تراورتن و نورپردازی ملایم لابی وردا',
      category: 'معماری و فضا',
    },
    {
      id: 2,
      src: '/images/hero-editorial.jpg',
      alt: 'نگاهی به زیبایی طبیعی و طراوت پوست',
      title: 'طراوت و هارمونی طبیعی چهره',
      caption: 'تمرکز بر حفظ هویت و زیبایی طبیعی چهره بدون اغراق و دستکاری مفرط',
      category: 'رویکرد درمانی',
    },
    {
      id: 3,
      src: '/images/treatment-room.jpg',
      alt: 'اتاق مراقبت‌های تخصصی و آرامش‌بخش وردا',
      title: 'سوئیت مراقبت‌های اختصاصی پوست',
      caption: 'تجهیزات مدرن استاندارد، بهداشت کامل بالینی و محیطی اختصاصی و آرام',
      category: 'فضای درمان',
    },
    {
      id: 4,
      src: '/images/gallery-arch.jpg',
      alt: 'هندسه نرم و فضای مینیمال کلینیک وردا',
      title: 'طراحی مینیمال و آرامش بصری',
      caption: 'هماهنگی فرم، متریال ارگانیک و روشنایی طبیعی برای ایجاد حس آرامش عمیق',
      category: 'معماری داخلی',
    },
    {
      id: 5,
      src: '/images/clinic-detail.jpg',
      alt: 'جزئیات متریال سنگ طبیعی و هارمونی بافت‌ها',
      title: 'هارمونی متریال و نورپردازی ملایم',
      caption: 'جزئیات متریال سنگ طبیعی و سایه لطیف زیتونی در طراحی جزئیات فضا',
      category: 'جزئیات فضا',
    },
    {
      id: 6,
      src: '/images/gallery-skincare.jpg',
      alt: 'سلامت پوست و مراقبت اختصاصی بالینی',
      title: 'پروتکل‌های متناسب با نیاز پوست',
      caption: 'ارزیابی دقیق متناسب با بافت، شرایط فردی و نیاز واقعی پوست هر مراجع',
      category: 'مراقبت بالینی',
    },
  ] as GalleryImageItem[],

  // Instagram / Social Journal 6-Image Grid (All local files)
  SOCIAL_IMAGES: [
    {
      id: 1,
      image: '/images/clinic-interior.jpg',
      alt: 'اتمسفر لابی وردا',
      caption: 'شروع یک تجربه آرام در فضایی با نور طبیعی و موسیقی ملایم',
    },
    {
      id: 2,
      image: '/images/featured-care.jpg',
      alt: 'جزئیات مراقبت دقیق پوست',
      caption: 'ظرافت در تکنیک و احترام به فیزیولوژی طبیعی پوست',
    },
    {
      id: 3,
      image: '/images/treatment-room.jpg',
      alt: 'سوئیت‌های اختصاصی مراقبت',
      caption: 'استاندارد، حریم خصوصی و آرامش کامل مراجعین محترم',
    },
    {
      id: 4,
      image: '/images/clinic-detail.jpg',
      alt: 'هارمونی متریال و نور',
      caption: 'سادگی در فضا، دقت در نتایج و آرامش در مسیر درمان',
    },
    {
      id: 5,
      image: '/images/social-beauty.jpg',
      alt: 'زیبایی در هماهنگی طبیعی',
      caption: 'حفظ هویت چهره با رویکرد تعادلی و نگاه علمی به زیبایی',
    },
    {
      id: 6,
      image: '/images/social-glow.jpg',
      alt: 'طراوت و درخشش پوست',
      caption: 'پوست شاداب نتیجه شناخت درست نیازها و مراقبت آگاهانه است',
    },
  ] as SocialImageItem[],
} as const;

export type ImagesConfigType = typeof IMAGES_CONFIG;
