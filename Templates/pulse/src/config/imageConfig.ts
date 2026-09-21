/**
 * ============================================================================
 * IMAGE CONFIGURATION FILE (ملف تنظیمات و آدرس تصاویر کلینیک پالس)
 * ============================================================================
 * All image assets used across the website are controlled from this single file.
 * You can easily point these paths to local files in the 'public/images/' folder
 * or replace them with any external image URLs.
 *
 * When you run `npm run build`, all local images in `public/images/` will be
 * bundled and loaded reliably in production.
 */

export interface ImageAsset {
  src: string;
  alt: string;
  aspectClass?: string;
  caption?: string;
  detailDescription?: string;
}

export const IMAGE_CONFIG = {
  // Brand & Favicon / Logo
  LOGO_MARK: "./images/logo-mark.svg",

  // 01 - Hero Section Main Cinematic Banner
  HERO_MAIN_IMAGE: {
    src: "./images/hero-clinic.jpg",
    fallbackSrc: "https://images.pexels.com/photos/10521230/pexels-photo-10521230.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800",
    alt: "فضای درونی مدرن و آرامش‌بخش کلینیک پزشکی و زیبایی پالس",
    caption: "پالس؛ کلینیک تخصصی پوست، مو و زیبایی",
  },

  // 02 - Featured Architectural Image Band
  FEATURED_BAND_IMAGE: {
    src: "./images/featured-clinic.jpg",
    fallbackSrc: "https://images.pexels.com/photos/7750096/pexels-photo-7750096.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800",
    alt: "محیط آرامش‌بخش و طراحی فضایی استاندارد کلینیک پالس",
    caption: "فضایی برای تمرکز، مراقبت و آرامش",
  },

  // 03 - Doctor Profile Portrait
  DOCTOR_PORTRAIT: {
    src: "./images/doctor-portrait.jpg",
    fallbackSrc: "https://images.pexels.com/photos/32115905/pexels-photo-32115905.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
    alt: "دکتر سارا مهرآرا — متخصص پوست، مو، زیبایی و لیزر",
    caption: "دکتر سارا مهرآرا — پزشک معالج کلینیک پالس",
  },

  // 04 - Gallery Images (6 Curated Architectural & Clinical Spaces)
  GALLERY_IMAGES: [
    {
      id: "gal-01",
      src: "./images/gallery-01.jpg",
      fallbackSrc: "https://images.pexels.com/photos/4586740/pexels-photo-4586740.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1000",
      alt: "اتاق مشاوره و ارزیابی تشخیصی بالینی",
      caption: "اتاق مشاوره و ارزیابی تشخیصی بالینی",
      aspectClass: "w-[340px] md:w-[480px]",
      detailDescription: "فضای آرام، مجهز به تجهیزات آنالیز میکروسکوپی پوست جهت بررسی عمق لایه‌های بافتی قبل از هرگونه اقدام درمانی.",
    },
    {
      id: "gal-02",
      src: "./images/gallery-02.jpg",
      fallbackSrc: "https://images.pexels.com/photos/7195804/pexels-photo-7195804.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1300",
      alt: "تجهیزات مدرن و محیط استریل مراقبت پوستی",
      caption: "فضای آرامش‌بخش درمان و مراقبت پوستی",
      aspectClass: "w-[420px] md:w-[620px]",
      detailDescription: "رعایت بالاترین استانداردهای استریلیزاسیون و بهره‌گیری از تجهیزات استاندارد پزشکی و کابین‌های اختصاصی مراقبت.",
    },
    {
      id: "gal-03",
      src: "./images/gallery-03.jpg",
      fallbackSrc: "https://images.pexels.com/photos/6899536/pexels-photo-6899536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=900",
      alt: "سالن انتظار اختصاصی و حریم مراجعه‌کنندگان",
      caption: "سالن انتظار اختصاصی و آرام کلینیک",
      aspectClass: "w-[320px] md:w-[440px]",
      detailDescription: "طراحی معماری با نور طبیعی ملایم و مبلمان ارگونومیک برای حفظ آسایش و حریم خصوصی مراجعان محترم.",
    },
    {
      id: "gal-04",
      src: "./images/gallery-04.jpg",
      fallbackSrc: "https://images.pexels.com/photos/4586727/pexels-photo-4586727.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1100",
      alt: "پروتکل‌های پیشرفته لیزر و احیای بافت",
      caption: "کابین تخصصی لیزردرمانی و رفع ضایعات",
      aspectClass: "w-[380px] md:w-[540px]",
      detailDescription: "مجهز به سیستم‌های خنک‌کننده پیشرفته و متدهای کالیبره‌شده برای به حداقل رساندن دوره نقاهت و افزایش ایمنی.",
    },
    {
      id: "gal-05",
      src: "./images/gallery-05.jpg",
      fallbackSrc: "https://images.pexels.com/photos/3985361/pexels-photo-3985361.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=950",
      alt: "سوئیت اختصاصی تزریقات و مراقبت‌های زیبایی",
      caption: "سوئیت تزریقات دقیق و متقارن",
      aspectClass: "w-[340px] md:w-[480px]",
      detailDescription: "فضای ارزیابی تقارن و زاویه‌سازی طبیعی با روشنایی تخصصی و متریال تاییدشده و پلمپ در حضور بیمار.",
    },
    {
      id: "gal-06",
      src: "./images/gallery-06.jpg",
      fallbackSrc: "https://images.pexels.com/photos/20382216/pexels-photo-20382216.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      alt: "پذیرش صمیمانه با معماری مدرن و منظم",
      caption: "کانتر پذیرش و هماهنگی نوبت‌ها",
      aspectClass: "w-[400px] md:w-[580px]",
      detailDescription: "پاسخ‌گویی منظم، زمان‌بندی دقیق بدون معطلی و احترام به وقت مراجعین گرامی.",
    },
  ],

  // 05 - Instagram Social Highlights
  INSTAGRAM_HIGHLIGHTS: [
    {
      id: "ig-01",
      src: "./images/instagram-01.jpg",
      fallbackSrc: "https://images.pexels.com/photos/4586732/pexels-photo-4586732.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      alt: "مشاوره تشخیصی؛ نخستین گام در شخصی‌سازی روند درمان",
      caption: "مشاوره تشخیصی؛ نخستین گام در شخصی‌سازی روند درمان",
      tag: "#مشاوره_تخصصی",
    },
    {
      id: "ig-02",
      src: "https://images.pexels.com/photos/7581575/pexels-photo-7581575.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      fallbackSrc: "https://images.pexels.com/photos/7581575/pexels-photo-7581575.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      alt: "تزریقات دقیق میکرومتری و حفظ هارمونی چهره",
      caption: "تزریقات دقیق میکرومتری و حفظ هارمونی چهره",
      tag: "#جوانسازی_طبیعی",
    },
    {
      id: "ig-03",
      src: "https://images.pexels.com/photos/7195797/pexels-photo-7195797.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      fallbackSrc: "https://images.pexels.com/photos/7195797/pexels-photo-7195797.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      alt: "فضایی طراحی‌شده برای آرامش و احساس اطمینان",
      caption: "فضایی طراحی‌شده برای آرامش و احساس اطمینان",
      tag: "#کلینیک_پالس",
    },
    {
      id: "ig-04",
      src: "https://images.pexels.com/photos/4586749/pexels-photo-4586749.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      fallbackSrc: "https://images.pexels.com/photos/4586749/pexels-photo-4586749.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=600",
      alt: "به‌کارگیری متدهای به‌روز مراقبت و لیزردرمانی",
      caption: "به‌کارگیری متدهای به‌روز مراقبت و لیزردرمانی",
      tag: "#سلامت_پوست",
    },
  ],

  // 06 - Service Visual Thumbnails (used in Service Details Modal)
  SERVICES_IMAGES: [
    {
      serviceId: "srv-01",
      src: "./images/gallery-01.jpg",
      alt: "آنالیز ساختار پوست و مراقبت‌های بالینی",
    },
    {
      serviceId: "srv-02",
      src: "./images/gallery-05.jpg",
      alt: "جوان‌سازی و تحریک کلاژن‌سازی",
    },
    {
      serviceId: "srv-03",
      src: "./images/gallery-04.jpg",
      alt: "لیزردرمانی تخصصی و رفع لک",
    },
    {
      serviceId: "srv-04",
      src: "./images/gallery-02.jpg",
      alt: "فرم‌دهی و زاویه‌سازی طبیعی چهره",
    },
    {
      serviceId: "srv-05",
      src: "./images/gallery-03.jpg",
      alt: "ترمیم و تقویت تخصصی فولیکول مو",
    },
  ],
};
