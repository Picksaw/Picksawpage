/**
 * PICKSAW TEMPLATE #2 — CLARITY
 * Standalone Local Image Configuration (مدیریت تصاویر محلی و فرمت WebP)
 * 
 * -------------------------------------------------------------
 * راهنمای ساده برای مشتری و ویرایشگر قالب (How to change images):
 * -------------------------------------------------------------
 * ۱. هر تصویری که می‌خواهید را با فرمت WebP یا JPG در پوشه `public/images/` قرار دهید:
 *    - `public/images/hero.webp` (یا hero.jpg)
 *    - `public/images/featured.webp` (یا featured.jpg)
 *    - `public/images/doctor.webp` (یا doctor.jpg)
 *    - `public/images/gallery-1.webp` الی `gallery-6.webp`
 *    - `public/images/instagram-1.webp` الی `instagram-6.webp`
 * 
 * ۲. مسیر فایل را در تنظیمات زیر مشخص کنید. سیستم به صورت خودکار تصاویر محلی را نمایش می‌دهد!
 */

export interface ImageAsset {
  src: string;          // Primary image path (e.g., "/images/hero.webp" or "/images/hero.jpg")
  webpSrc?: string;     // WebP local path (e.g., "/images/hero.webp")
  fallbackSrc?: string; // Fallback image if local file is missing
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  title?: string;
  subtitle?: string;
}

export const CLINIC_IMAGES = {
  // Hero Main Visual (تصویر اصلی بالای سایت - فایل محلی)
  hero: {
    src: "/images/hero.webp",
    webpSrc: "/images/hero.webp",
    fallbackSrc: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1400&h=1200&fit=crop",
    alt: "مراقبت دقیق و تخصصی پوست در کلینیک کلاریتی",
    width: 1400,
    height: 1200,
  } as ImageAsset,

  // Featured Large Statement Image (تصویر بزرگ بیانیه هویت - فایل محلی)
  featured: {
    src: "/images/featured.webp",
    webpSrc: "/images/featured.webp",
    fallbackSrc: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1600&h=1000&fit=crop",
    alt: "فضای نورگیر و مدرن کلینیک کلاریتی",
    width: 1600,
    height: 1000,
  } as ImageAsset,

  // Lead Practitioner / Doctor Portrait (تصویر پرتره پزشک - فایل محلی)
  doctor: {
    src: "/images/doctor.webp",
    webpSrc: "/images/doctor.webp",
    fallbackSrc: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=900&h=1200&fit=crop",
    alt: "دکتر نگار شمس - متخصص پوست، مو و زیبایی کلینیک کلاریتی",
    width: 900,
    height: 1200,
  } as ImageAsset,

  // Clinic Space Gallery 6 Items (گالری ۶ تایی فضای کلینیک - فایل‌های محلی)
  gallery: [
    {
      id: 1,
      src: "/images/gallery-1.webp",
      webpSrc: "/images/gallery-1.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=1200&h=1000&fit=crop",
      alt: "فضای آرام پذیرش و لابی کلینیک کلاریتی",
      title: "فضای پذیرش و لابی",
      subtitle: "محیطی آرام و دور از استرس",
      width: 1200,
      height: 1000,
    },
    {
      id: 2,
      src: "/images/gallery-2.webp",
      webpSrc: "/images/gallery-2.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=800&h=800&fit=crop",
      alt: "محیط مجهز انجام خدمات مراقبت پوستی",
      title: "مراقبت‌های تخصصی",
      subtitle: "تجهیزات مدرن و استاندارد",
      width: 800,
      height: 800,
    },
    {
      id: 3,
      src: "/images/gallery-3.webp",
      webpSrc: "/images/gallery-3.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=800&h=800&fit=crop",
      alt: "اتاق آرامش‌بخش درمان و مشاوره",
      title: "اتاق مشاوره و ارزیابی",
      subtitle: "حفظ حریم خصوصی",
      width: 800,
      height: 800,
    },
    {
      id: 4,
      src: "/images/gallery-4.webp",
      webpSrc: "/images/gallery-4.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=1400&h=800&fit=crop",
      alt: "سالن وسیع و نورگیر مجموعه با طراحی مینیمال",
      title: "سالن نورگیر و مدرن",
      subtitle: "طراحی مینیمال و بهداشتی",
      width: 1400,
      height: 800,
    },
    {
      id: 5,
      src: "/images/gallery-5.webp",
      webpSrc: "/images/gallery-5.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?q=80&w=800&h=800&fit=crop",
      alt: "فرآیند مراقبت لطیف و تغذیه پوست",
      title: "محصولات مراقبت پوستی",
      subtitle: "فرمولاسیون‌های ملایم و مغذی",
      width: 800,
      height: 800,
    },
    {
      id: 6,
      src: "/images/gallery-6.webp",
      webpSrc: "/images/gallery-6.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&h=800&fit=crop",
      alt: "جزئیات دکوراسیون و بهداشت استریل کلینیک",
      title: "جزئیات بهداشتی کلینیک",
      subtitle: "بالاترین استانداردهای استریل",
      width: 800,
      height: 800,
    },
  ],

  // Instagram Feed 6 Tiles (تصاویر پست‌های اینستاگرام - فایل‌های محلی)
  instagram: [
    {
      id: 1,
      src: "/images/instagram-1.webp",
      webpSrc: "/images/instagram-1.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=600&h=600&fit=crop",
      caption: "درخشش طبیعی و آرامش پوست",
      alt: "درخشش طبیعی و مراقبت اصیل پوست در کلاریتی",
      width: 600,
      height: 600,
    },
    {
      id: 2,
      src: "/images/instagram-2.webp",
      webpSrc: "/images/instagram-2.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=600&h=600&fit=crop",
      caption: "جلسات مراقبت دقیق و شخصی‌سازی شده",
      alt: "جلسات مراقبت دقیق و مشاوره چهره",
      width: 600,
      height: 600,
    },
    {
      id: 3,
      src: "/images/instagram-3.webp",
      webpSrc: "/images/instagram-3.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=600&h=600&fit=crop",
      caption: "استفاده از رویکردهای اصیل و هماهنگ",
      alt: "رویکرد اصیل و متعادل برای زیبایی",
      width: 600,
      height: 600,
    },
    {
      id: 4,
      src: "/images/instagram-4.webp",
      webpSrc: "/images/instagram-4.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=600&h=600&fit=crop",
      caption: "فضایی آرام به دور از هیاهو",
      alt: "فضای دنج و آرام کلینیک",
      width: 600,
      height: 600,
    },
    {
      id: 5,
      src: "/images/instagram-5.webp",
      webpSrc: "/images/instagram-5.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?q=80&w=600&h=600&fit=crop",
      caption: "اصالت در فرم و زیبایی طبیعی",
      alt: "فرم طبیعی و اصالت در چهره",
      width: 600,
      height: 600,
    },
    {
      id: 6,
      src: "/images/instagram-6.webp",
      webpSrc: "/images/instagram-6.webp",
      fallbackSrc: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?q=80&w=600&h=600&fit=crop",
      caption: "کلاریتی؛ دقت در تمام جزئیات",
      alt: "جزئیات مراقبت در کلینیک کلاریتی",
      width: 600,
      height: 600,
    },
  ],
};
