/**
 * کلینیک اورورا — پیکربندی تمام تصاویر و فایل‌های رسانه‌ای
 * AURORA CLINIC — MEDIA & ASSETS CONFIGURATION
 *
 * You can change any image URL or point to local files (e.g., './assets/images/hero-portrait.jpg')
 * After running your build/hosting, all images across the website update automatically.
 */

const AURORA_MEDIA = {
  // Hero & Brand Imagery
  hero: {
    mainPortrait: "./assets/images/hero-portrait.jpg",
    mainPortraitAlt: "پرتره زیبایی طبیعی و درخشش پوست — کلینیک اورورا",
    badgeLogoText: "A",
  },

  // 5 Bespoke Clinic Protocols (Services)
  services: {
    rejuvenation: {
      image: "./assets/images/service-rejuvenation.jpg",
      alt: "جوانسازی و بازسازی سلولی پوست"
    },
    contouring: {
      image: "./assets/images/service-contouring.jpg",
      alt: "فرم‌دهی طبیعی و هارمونی خطوط چهره"
    },
    care: {
      image: "./assets/images/service-care.jpg",
      alt: "مراقبت و هیدراتاسیون عمیق پوست"
    },
    brightening: {
      image: "./assets/images/service-brightening.jpg",
      alt: "روشن‌سازی و یکنواختی بافت پوست"
    },
    noninvasive: {
      image: "./assets/images/service-noninvasive.jpg",
      alt: "زیبایی غیرتهاجمی و لیفتینگ ساختاری"
    }
  },

  // Editorial Architecture & Philosophy
  philosophy: {
    interiorImage: "./assets/images/philosophy-interior.jpg",
    alt: "معماری آرامش و فضای اختصاصی کلینیک اورورا"
  },

  // Founder Section
  founder: {
    portraitImage: "./assets/images/founder-portrait.jpg",
    alt: "دکتر آریا نیک‌فر — مدیر و بنیان‌گذار کلینیک اورورا"
  },

  // Visual Archive & Gallery Masonry
  gallery: [
    {
      id: "gallery-1",
      image: "./assets/images/gallery-1.jpg",
      alt: "درخشش مخملی و هیدراتاسیون عمیق",
      title: "درخشش ابریشمی پوست",
      subtitle: "پروتکل هیدراتاسیون عمیق",
      description: "بازآفرینی طراوت و انعکاس طبیعی نور در لایه‌های سطحی و عمقی اپیدرم با سرم‌های بیومیمتیک."
    },
    {
      id: "gallery-2",
      image: "./assets/images/gallery-2.jpg",
      alt: "فضای آرامش و طراحی مینیمال آتلیه اورورا",
      title: "معماری سکوت و آرامش",
      subtitle: "متریال‌های سنگ ارگانیک و آکوستیک آرام",
      description: "طراحی فضایی بر پایه نور ملایم طبیعی و هارمونی بافت‌ها جهت ریلکسیشن کامل مراجعین."
    },
    {
      id: "gallery-3",
      image: "./assets/images/gallery-3.jpg",
      alt: "سرم‌های بالینی اختصاصی اورورا",
      title: "فرمولاسیون پاک و اختصاصی",
      subtitle: "سرم‌های بالینی بدون مواد حساسیت‌زا",
      description: "استفاده از عصاره‌های گیاهی خالص غنی‌شده با هیالورونیک اسید چندوزنی و پپتیدهای جوانساز."
    },
    {
      id: "gallery-4",
      image: "./assets/images/gallery-4.jpg",
      alt: "ظرافت در فرم‌دهی و تقارن چهره",
      title: "هماهنگی ظریف خطوط چهره",
      subtitle: "اصلاح طبیعی زوایا بدون اغراق",
      description: "تاکید بر حفظ میمیک ارگانیک و تناسبات طلایی بدون تغییر در هویت اصیل چهره."
    }
  ]
};

// Export for module bundlers as well as browser window global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AURORA_MEDIA;
} else if (typeof window !== 'undefined') {
  window.AURORA_MEDIA = AURORA_MEDIA;
}
