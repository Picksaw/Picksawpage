/**
 * ============================================================================
 * SITE CONTENT & TEXT CONFIGURATION FILE (ملف جامع متون و محتوای سایت)
 * ============================================================================
 * All texts, labels, headlines, doctor biographies, service details, process steps,
 * contact details, and phone numbers are managed here in one single place.
 *
 * Phone numbers have explicit LTR formatting strings and raw tel: strings to
 * ensure digits appear correctly in both Persian RTL and Latin contexts.
 */

export interface ServiceDetail {
  id: string;
  number: string;
  name: string;
  latinName: string;
  shortDescription: string;
  fullOverview: string;
  tags: string[];
  keyBenefits: string[];
  protocolSteps: string[];
  sessionDuration: string;
  recommendedSessions: string;
}

export interface ProcessDetail {
  number: string;
  persianNumber: string;
  title: string;
  latin: string;
  shortDescription: string;
  fullDetail: string;
  highlights: string[];
}

export const SITE_CONTENT = {
  // Brand Identity
  BRAND: {
    NAME_FA: "پالس",
    NAME_EN: "PULSE",
    INITIAL: "P",
    TAGLINE: "دقت، از توجه شروع می‌شود.",
    CATEGORY: "کلینیک تخصصی پوست، مو و زیبایی",
    EDITORIAL_LABEL: "PULSE · PRIVATE CLINIC",
    SUBTITLE: "رویکرد بالینی و زیبایی‌شناسی مدرن",
    HEADER_CTA: "مشاوره",
  },

  // Contact Information (with LTR phone numbers)
  CONTACT: {
    // Exact phone numbers
    PHONE_RAW: "02188001122",
    PHONE_DISPLAY_LTR: "021 - 8800 1122",
    PHONE_INTERNATIONAL: "+98 21 8800 1122",

    MOBILE_RAW: "09120003344",
    MOBILE_DISPLAY_LTR: "0912 - 000 3344",
    MOBILE_INTERNATIONAL: "+98 912 000 3344",

    WHATSAPP_NUMBER: "989120003344",
    WHATSAPP_LINK: "https://wa.me/989120003344",

    INSTAGRAM_HANDLE: "@pulse.clinic.sample",
    INSTAGRAM_URL: "https://instagram.com/pulse.clinic.sample",

    ADDRESS: "تهران، خیابان ولیعصر، بالاتر از پارک وی، برج پزشکان پالس، طبقه ۴",
    WORKING_HOURS: "شنبه تا چهارشنبه: ۱۰:۰۰ الی ۱۹:۰۰ | پنجشنبه: ۱۰:۰۰ الی ۱۴:۰۰",
    WORKING_HOURS_SHORT: "۱۰:۰۰ الی ۱۹:۰۰",

    MAP_BALAD_URL: "https://balad.ir",
    MAP_NESHAN_URL: "https://neshan.org",
    MAP_GOOGLE_URL: "https://maps.google.com",
  },

  // Navigation Links
  NAV_ITEMS: [
    { label: "خانه", href: "#hero", latinLabel: "Home" },
    { label: "خدمات", href: "#services", latinLabel: "Services" },
    { label: "درباره ما", href: "#doctor", latinLabel: "About" },
    { label: "گالری", href: "#gallery", latinLabel: "Gallery" },
    { label: "تماس", href: "#contact", latinLabel: "Contact" },
  ],

  // 01 - Hero Section
  HERO: {
    LABEL_TOP: "PULSE · PRIVATE CLINIC",
    LABEL_SUB: "رویکرد بالینی و زیبایی‌شناسی مدرن",
    HEADLINE_LINE1: "توجه به جزئیات،",
    HEADLINE_LINE2: "تفاوت را می‌سازد.",
    BADGE_CATEGORY: "کلینیک تخصصی پوست، مو و زیبایی",
    BADGE_QUOTE: "«برای مراقبت دقیق‌تر، انتخاب آگاهانه‌تر.»",
    BADGE_FOOTER_NOTE: "پروتکل‌های مبتنی بر علم روز",
    BADGE_YEAR: "PULSE · 2026",
    PRIMARY_CTA: "مشاهده خدمات",
    SECONDARY_CTA: "ارتباط با ما",
    NUMBER_EDGE: "01",
    STAMP_LABEL: "ARCHITECTURAL SPACE",
  },

  // 02 - Information Band (4 Pillars)
  PILLARS: {
    SECTION_LABEL: "FOUNDATIONAL STANDARDS",
    SECTION_SUBTITLE: "چهارچوب خدمات بالینی و تشخیصی",
    ITEMS: [
      {
        number: "01",
        title: "مراقبت دقیق",
        description: "ارزیابی کامل بافت و طراحی پروتکل متناسب با شرایط هر فرد.",
      },
      {
        number: "02",
        title: "فضای حرفه‌ای",
        description: "محیطی آرام، استاندارد، استریل و بدون شلوغی‌های معمول.",
      },
      {
        number: "03",
        title: "ارتباط مستقیم",
        description: "همراهی پیوسته پزشک در تمامی مراحل قبل و بعد از اقدامات.",
      },
      {
        number: "04",
        title: "رویکرد شخصی",
        description: "تاکید بر طبیعی ماندن نتایج و احترام به ساختار ارگانیک صورت.",
      },
    ],
  },

  // 03 - Services Section (5 Services + Detailed Modal Content)
  SERVICES_SECTION: {
    LABEL: "PRACTICE AREAS · 02",
    TITLE: "خدمات",
    DESCRIPTION: "کلیه خدمات با اتکا به به‌روزترین پروتکل‌های بالینی، متریال دارای مجوز و اولویت‌بخشی به سلامت و زیبایی طبیعی شما ارائه می‌شوند.",
    CONSULTATION_NOTE_TITLE: "مشاوره تشخیصی اولیه:",
    CONSULTATION_NOTE_DESC: "پیش از هر اقدام درمانی یا زیبایی، ارزیابی ساختاری پوست توسط پزشک معالج صورت می‌پذیرد.",
    VIEW_DETAILS_BTN: "مشاهده جزئیات و پروتکل",
    LIST: [
      {
        id: "srv-01",
        number: "01",
        name: "آنالیز ساختار پوست و مراقبت‌های بالینی",
        latinName: "Clinical Skin Analysis & Barrier Care",
        shortDescription: "بررسی عمقی لایه‌های بافتی با پروتکل‌های تشخیصی، هیدراتاسیون بالینی، پاک‌سازی مهندسی‌شده و تقویت سد دفاعی اپیدرم.",
        fullOverview: "این پروتکل تشخیصی-درمانی با هدف ارزیابی میکروسکوپی سلامت بافت، میزان چربی، هیدراتاسیون عمقی و ضخامت سد دفاعی پوست اجرا می‌شود. برنامه مراقبتی پس از آن به‌طور اختصاصی برای ترمیم آسیب‌های اپیدرمال و حفظ سلامت پایدار تنظیم می‌گردد.",
        tags: ["آنالیز میکروسکوپی", "هیدراتاسیون بالینی", "تقویت بریر"],
        keyBenefits: [
          "تشخیص دقیق نوع پوست و عمق منافذ",
          "پاکسازی بدون آسیب به سد دفاعی پوست",
          "جذب بهینه ترکیبات هیدراته‌کننده و ویتامینی",
          "بهبود شفافیت و قوام بافت سطحی",
        ],
        protocolSteps: [
          "اسکن دیجیتالی و تصویربرداری لایه‌های پوست",
          "پاک‌سازی چندمرحله‌ای با محلول‌های سازگار بالینی",
          "تغذیه عمقی با سرم‌های استاندارد و ماسک‌های ترمیمی",
          "تنظیم روتین اختصاصی مراقبت خانگی",
        ],
        sessionDuration: "۴۵ الی ۶۰ دقیقه",
        recommendedSessions: "ماهی یک‌بار برای حفظ شادابی و سلامت پایدار",
      },
      {
        id: "srv-02",
        number: "02",
        name: "جوان‌سازی و تحریک کلاژن‌سازی",
        latinName: "Collagen Bio-Stimulation & Skin Tightening",
        shortDescription: "به‌کارگیری پروتکل‌های تلفیقی مزوژل‌های ساختاری، آر‌اف فرکشنال و محرک‌های کلاژن جهت بازگرداندن الاستیسیته و استحکام پوست.",
        fullOverview: "با افزایش سن، سنتز کلاژن و الاستین طبیعی کاهش می‌یابد. در این بخش، با استفاده از مزوژل‌های بیواکتیو، میکرونیدلینگ پیشرفته و امواج آر‌اف، فیبروبلاست‌ها تحریک شده و پوست قوام اولیه خود را بازمی‌یابد.",
        tags: ["پروفایلو", "مزوژل‌های ساختاری", "آر‌اف فرکشنال"],
        keyBenefits: [
          "تحریک طبیعی کلاژن‌سازی بدون تغییر غیرعادی چهره",
          "کاهش خطوط ریز و افزایش الاستیسیته پوست",
          "درخشندگی و آبرسانی عمیق لایه‌های میانی پوست",
          "پایداری طولانی‌مدت اثرات درمانی",
        ],
        protocolSteps: [
          "ارزیابی میزان کاهش حجم و شلی بافت",
          "استفاده از بی‌حسی موضعی ملایم",
          "تزریق نقطه‌ای میکرومتری یا اعمال انرژی حرارتی آر‌اف",
          "مراقبت‌های التیام‌بخش پس از جلسه",
        ],
        sessionDuration: "۴۰ الی ۵۰ دقیقه",
        recommendedSessions: "۲ الی ۳ جلسه با فواصل زمانی مشخص",
      },
      {
        id: "srv-03",
        number: "03",
        name: "لیزردرمانی تخصصی و رفع لک",
        latinName: "Targeted Laser Therapy & Pigment Correction",
        shortDescription: "بهره‌گیری از فناوری‌های لیزری پیشرفته برای رفع هایپرپیگمانتاسیون، اسکارهای آکنه و بهبود یکنواختی تنالیته پوست با حداقل دوره نقاهت.",
        fullOverview: "بهره‌گیری از فناوری‌های نوری و لیزری روز دنیا به پزشک این امکان را می‌دهد که ضایعات رنگدانه‌ای، کک‌ومک، ملاسما و اسکارهای فرورفته را بدون آسیب به بافت سالم مجاور بهبود بخشد.",
        tags: ["کیوسوئیچ", "لیزر فرکشنال", "رفع اسکار آکنه"],
        keyBenefits: [
          "یکدست شدن تنالیته و شفافیت چشمگیر پوست",
          "بهبود اسکارهای حاصل از جوش و جراحی",
          "حداقل دوره نقاهت با پروتکل‌های محافظتی پیشرفته",
          "ایمنی بالا برای انواع تیپ‌های پوستی",
        ],
        protocolSteps: [
          "تست حساسیت پوست و ارزیابی عمق پیگمانتاسیون",
          "تنظیم طول موج و انرژی اختصاصی دستگاه",
          "خنک‌سازی همزمان پوست جهت کاهش حس گرما",
          "استفاده از کرم‌های ترمیم‌کننده و ضدالتهاب",
        ],
        sessionDuration: "۳۰ الی ۴۵ دقیقه",
        recommendedSessions: "۳ تا ۵ جلسه بسته به شدت عارضه",
      },
      {
        id: "srv-04",
        number: "04",
        name: "فرم‌دهی و زاویه‌سازی طبیعی چهره",
        latinName: "Natural Facial Contouring & Harmonization",
        shortDescription: "تزریق میکرومتریک فیلرهای هیالورونیک و نورومودولاتورها با رویکرد حفظ هارمونی، ویژگی‌های ارگانیک صورت و پرهیز از اغراق.",
        fullOverview: "دیدگاه ما در فرم‌دهی چهره مبتنی بر ظرافت و طبیعی بودن است. هدف ما اصلاح عدم تقارن‌ها، بازگرداندن حجم از دست‌رفته شقیقه‌ها، گونه و خط فک و تعدیل خطوط اخم و پیشانی بدون ایجاد حالت مصنوعی است.",
        tags: ["فیلر لب و چانه", "بوتاکس دقیق", "هارمونی چهره"],
        keyBenefits: [
          "حفظ حالت طبیعی میمیک و چهره فردی",
          "استفاده انحصاری از برندهای دارای تاییدیه معتبر",
          "تقارن‌سازی دقیق بر اساس ابعاد آناتومیک",
          "پرهیز از اغراق و نتایج غیرطبیعی",
        ],
        protocolSteps: [
          "طراحی نقاط تزریق بر پایه محاسبات زیبایی‌شناسی",
          "باز کردن متریال اصل و پلمپ در حضور بیمار",
          "تزریق میکرومتریک با سرسوزن‌های فوق‌العاده ظریف یا کانولا",
          "بررسی نهایی و تعیین وقت ویزیت کنترل رایگان",
        ],
        sessionDuration: "۳۰ الی ۴۵ دقیقه",
        recommendedSessions: "جلسه اصلی به همراه ویزیت چکاپ دو هفته بعد",
      },
      {
        id: "srv-05",
        number: "05",
        name: "ترمیم و تقویت تخصصی فولیکول مو",
        latinName: "Follicular Restoration & Scalp Therapy",
        shortDescription: "متدهای ارزیابی فولیکولی، پی‌آرپی استاندارد بالینی، هیرفیلر و مزوتراپی اختصاصی ساقه و ریشه برای توقف ریزش و احیای تراکم مو.",
        fullOverview: "ترکیبی از روش‌های بیولوژیک نظیر پلاسمای غنی از پلاکت (PRP) با کیت‌های استاندارد، مزوتراپی با فاکتورهای رشد پپتیدی و هیرفیلر جهت تقویت فولیکول‌های ضعیف‌شده و تسریع روند رشد مجدد مو.",
        tags: ["پی‌آرپی استاندارد", "هیرفیلر تخصصی", "مزوتراپی مو"],
        keyBenefits: [
          "کنترل و کاهش چشمگیر ریزش مو",
          "افزایش ضخامت و استحکام تارهای موی نازک",
          "بهبود خون‌رسانی و تغذیه سلولی ریشه مو",
          "تقویت پوست سر و رفع سبوم مازاد",
        ],
        protocolSteps: [
          "آنالیز میکروسکوپی پوست سر و وضعیت فولیکول‌ها",
          "آماده‌سازی کیت‌های بالینی استریل",
          "تزریق بسیار ریز و سطحی به لایه درم پوست سر",
          "ارائه توصیه‌های مکمل و مراقبت‌های خانگی",
        ],
        sessionDuration: "۳۰ الی ۴۰ دقیقه",
        recommendedSessions: "۴ الی ۶ جلسه به صورت دوره‌ای منظم",
      },
    ],
  },

  // 04 - Featured Image Band
  FEATURED_BAND: {
    TOP_LABEL: "ENVIRONMENT & CARE",
    QUOTE: "«فضایی برای تمرکز،\nمراقبت و آرامش.»",
    STAMP_NUMBER: "03",
    STAMP_TEXT: "CALM & PRECISION",
  },

  // 05 - Doctor Profile Section
  DOCTOR_SECTION: {
    LABEL: "ABOUT THE DOCTOR · 04",
    NAME: "دکتر سارا مهرآرا",
    TITLE: "متخصص پوست، مو، زیبایی و لیزر — نظام پزشکی ۱۲۴۸۵۰",
    BIO: "با تمرکز بر اصول بنیادین سلامت پوست و رویکردی علمی، دقیق و مبتنی بر زیبایی‌شناسی طبیعی، محیطی حرفه‌ای برای دستیابی به بهترین نتایج درمانی و مراقبتی فراهم کرده‌ایم. هر مراجعه‌کننده با ارزیابی دقیق ساختار پوست و نیازهای منحصر‌به‌فرد خود همراهی می‌شود.",
    STATEMENT: "دانش، دقت و ارتباط انسانی در کنار هم.",
    STATEMENT_SUB: "رویکرد بالینی استاندارد با اولویت حفظ تقارن و ویژگی‌های فردی",
    BADGE_LABEL: "پزشک معالج کلینیک",
    VIEW_PHILOSOPHY_BTN: "مشاهده رویکرد بالینی و فلسفه درمان",
  },

  // 06 - Visual Statement Section
  STATEMENT_SECTION: {
    LABEL: "OUR PERSPECTIVE · 05",
    MAIN_TEXT: "«هر مراجعه،\nیک تجربه متفاوت است.»",
    SUB_TEXT: "باور داریم که خدمات پزشکی و زیبایی فراتر از اعمال تکنیک‌های تکراری است؛ این مسیری پیوسته برای هم‌نشینی علم، آرامش، درک عمیق ساختار پوست و احترام به زیبایی طبیعی شماست.",
    BOTTOM_ACCENT: "PRECISION · INTEGRITY · CARE",
  },

  // 07 - Gallery Section
  GALLERY_SECTION: {
    LABEL: "SPACES & PERSPECTIVES · 06",
    TITLE: "گالری",
    SUBTITLE: "نگاهی به جزئیات فضا، استانداردهای بهداشتی و اتمسفر آرامش‌بخش کلینیک",
    DESKTOP_INDICATOR: "SCROLL HORIZONTALLY",
    VIEW_DETAILS_HINT: "کلیک برای مشاهده جزئیات فضا",
  },

  // 08 - Process Section (4 Steps)
  PROCESS_SECTION: {
    LABEL: "PATIENT JOURNEY · 07",
    TITLE: "مسیر شما",
    SUBTITLE: "مسیری شفاف، آرام و ساختاریافته از اولین نقطه تماس تا دستیابی به نتایج مطلوب.",
    VIEW_STEP_HINT: "کلیک برای مطالعه جزئیات این مرحله",
    STEPS: [
      {
        number: "01",
        persianNumber: "۰۱",
        title: "آشنایی",
        latin: "Initial Connection",
        shortDescription: "برقراری ارتباط مستقیم، مشاوره اولیه و پاسخ‌گویی شفاف به پرسش‌های شما.",
        fullDetail: "نخستین مرحله، شنیدن نیازها و دغدغه‌های شماست. از طریق تماس تلفنی، واتساپ یا مراجعه حضوری، اطلاعات اولیه و زمان‌بندی مناسب برای ویزیت هماهنگ می‌شود.",
        highlights: ["مشاوره و پاسخ‌گویی صمیمانه", "هماهنگی دقیق نوبت بدون اتلاف وقت", "ارائه راهنمایی‌های پیش از مراجعه"],
      },
      {
        number: "02",
        persianNumber: "۰۲",
        title: "بررسی",
        latin: "Diagnostic Assessment",
        shortDescription: "آنالیز ساختار پوست، ارزیابی شرایط بافتی و درک کامل خواسته‌ها و انتظارات.",
        fullDetail: "در این جلسه، پزشک با معاینه دقیق بالینی و در صورت نیاز با ابزارهای دیجیتال، سلامت پوست، ضخامت بافت و میزان الاستیسیته را ارزیابی می‌کند.",
        highlights: ["معاینه اختصاصی توسط پزشک معالج", "تحلیل ساختار آناتومیک چهره", "بررسی پیشینه سلامت و حساسیت‌ها"],
      },
      {
        number: "03",
        persianNumber: "۰۳",
        title: "انتخاب خدمات",
        latin: "Personalized Protocol",
        shortDescription: "تنظیم پروتکل درمانی یا مراقبتی اختصاصی با برآورد دقیق جلسات و توصیه‌های بالینی.",
        fullDetail: "بر اساس نتایج بررسی، یک پروتکل درمانی شخصی‌سازی‌شده طراحی می‌شود. کلیه جزئیات، نوع متریال و روند اجرا با شفافیت کامل تشریح می‌گردد.",
        highlights: ["انتخاب متریال معتبر و استاندارد", "توضیح کامل مراحل و مراقبت‌های لازم", "احترام به نظر و بودجه مراجعه‌کننده"],
      },
      {
        number: "04",
        persianNumber: "۰۴",
        title: "پیگیری",
        latin: "Follow-up & Continuity",
        shortDescription: "پایش نتایج حاصله، مشاوره‌های پس از درمان و مراقبت‌های تکمیلی و دوره‌ای.",
        fullDetail: "ارتباط کلینیک با شما پس از انجام خدمات پایان نمی‌پذیرد. ویزیت‌های کنترل، بررسی روند بهبود و ارائه راهنمایی‌های مراقبت خانگی به‌طور پیوسته انجام می‌پذیرد.",
        highlights: ["جلسات کنترل و بررسی نتیجه نهایی", "پشتیبانی و پاسخ‌گویی به سوالات پس از درمان", "تنظیم برنامه نگهداری و تمدید دوره‌ای"],
      },
    ],
  },

  // 09 - Instagram Section
  INSTAGRAM_SECTION: {
    LABEL: "SOCIAL JOURNAL · 08",
    TITLE: "در اینستاگرام ببینید.",
    SUBTITLE: "گزارش‌ها، نکات مراقبت پوستی و حال‌وهوای روزمره کلینیک",
    CTA_BUTTON: "مشاهده اینستاگرام",
    HOVER_VIEW_POST: "مشاهده پست",
  },

  // 10 - Contact & Location Section
  CONTACT_SECTION: {
    LABEL: "GET IN TOUCH · 09",
    TITLE: "در تماس باشید.",
    SUBTITLE: "جهت دریافت مشاوره، کسب اطلاعات بیشتر درباره خدمات و تنظیم زمان مراجعه، همکاران ما پاسخگوی شما هستند.",
    DIRECT_CALL_BTN: "تماس تلفنی مستقیم",
    WHATSAPP_BTN: "گفتگو در واتساپ",
    INSTAGRAM_BTN: "صفحه اینستاگرام",
    CENTER_BADGE: "مرکز تخصصی",
    ADDRESS_LABEL: "نشانی کلینیک",
    PHONE_LABEL: "شماره تلفن ثابت (پذیرش)",
    MOBILE_LABEL: "شماره همراه و مشاوره",
    HOURS_LABEL: "ساعات کاری و پاسخ‌گویی",
    NAV_APPS_LABEL: "مسیریابی با اپلیکیشن‌ها",
    BALAD_BTN: "بلد",
    NESHAN_BTN: "نشان",
    GOOGLE_MAPS_BTN: "Google Maps",
  },

  // 11 - Final CTA Section
  FINAL_CTA: {
    LABEL: "PULSE · FINAL PERSPECTIVE",
    HEADLINE: "دقت، یک انتخاب است.",
    SUPPORTING_TEXT: "برای آشنایی بیشتر با کلینیک و خدمات آن، با ما در ارتباط باشید.",
    PRIMARY_BTN: "تماس با ما",
    SECONDARY_BTN: "اینستاگرام",
  },

  // 12 - Footer
  FOOTER: {
    NAV_TITLE: "NAVIGATION",
    HOURS_TITLE: "CONTACT & HOURS",
    COPYRIGHT: "کلینیک پالس. تمامی حقوق محفوظ است.",
    DESIGNED_BY: "طراحی شده توسط",
    STUDIO_NAME: "Picksaw Studio",
  },

  // Interactive Modals & Windows UI Strings
  MODALS: {
    CLOSE_BTN: "بستن پنجره",
    SERVICE_MODAL_TITLE: "جزئیات و پروتکل بالینی خدمت",
    DOCTOR_MODAL_TITLE: "رویکرد بالینی و بیوگرافی پزشک",
    GALLERY_MODAL_TITLE: "جزئیات فضا و معماری کلینیک",
    PROCESS_MODAL_TITLE: "راهنمای تفصیلی مرحله",
    CONSULTATION_MODAL_TITLE: "دریافت مشاوره و راه‌های ارتباطی",
    BENEFITS_HEADING: "مزایا و نتایج بالینی",
    PROTOCOL_HEADING: "مراحل اجرای پروتکل",
    DURATION_LABEL: "مدت زمان تقریبی هر جلسه:",
    SESSIONS_LABEL: "تعداد جلسات پیشنهادی:",
    DIRECT_CALL_ACTION: "تماس فوری",
    WHATSAPP_ACTION: "ارسال پیام در واتساپ",
    COPIED_TOAST: "شماره با موفقیت کپی شد!",
    CLICK_TO_COPY: "برای کپی شماره کلیک کنید",
  },
};
