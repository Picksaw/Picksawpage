/**
 * =========================================================================
 * VERDA CLINIC - SITE CONTENT & TEXTS CONFIGURATION
 * =========================================================================
 * 
 * This file centralizes ALL textual copy, descriptions, titles, contact information,
 * and detailed modal breakdowns across the entire website.
 * 
 * You can edit any Persian or English text here and it will update universally.
 * =========================================================================
 */

export interface ServiceDetail {
  id: string;
  number: string;
  enNumber: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  approach: string;
  keyBenefits: string[];
  recommendedFor: string;
  sessionInfo: string;
}

export interface PhilosophyDetail {
  id: number;
  word: string;
  en: string;
  shortDescription: string;
  fullExplanation: string;
  principles: string[];
}

export interface ProcessStepDetail {
  num: string;
  enNum: string;
  title: string;
  description: string;
  detailedNotes: string;
  durationNote: string;
}

export const CONTENT_CONFIG = {
  // Brand & Clinic Identity
  BRAND: {
    CLINIC_NAME: 'وِردا',
    CLINIC_NAME_EN: 'VERDA',
    TAGLINE: '«زیبایی، در هماهنگی است.»',
    CATEGORY: 'کلینیک تخصصی پوست، مو و زیبایی',
    SUBTITLE: 'AESTHETIC & DERMATOLOGY',
    DESCRIPTION: 'مراقبت و زیبایی با تمرکز بر تعادل، ظرافت و ویژگی‌های منحصربه‌فرد هر چهره.',
    HERO_BADGE: 'تعادل و ظرافت در زیبایی چهره',
    HERO_MOTTO: 'ESTABLISHED FOR NATURAL BEAUTY',
  },

  // Navigation Links
  NAV_LINKS: [
    { label: 'خانه', href: '#hero', id: 'hero' },
    { label: 'خدمات', href: '#services', id: 'services' },
    { label: 'درباره ما', href: '#about', id: 'about' },
    { label: 'نمونه‌کارها', href: '#gallery', id: 'gallery' },
    { label: 'تماس', href: '#contact', id: 'contact' },
  ],

  // Introduction / Statement Section
  INTRODUCTION: {
    LABEL: 'درباره وردا',
    LABEL_EN: 'ABOUT VERDA',
    STATEMENT_LINE_1: '«زیبایی لازم نیست دیده شود؛',
    STATEMENT_LINE_2: 'کافی است احساس شود.»',
    SUPPORTING_COPY: 'رویکرد وردا بر ایجاد تعادل، انتخاب آگاهانه و حفظ ویژگی‌های طبیعی هر فرد تمرکز دارد.',
  },

  // 5 Detailed Clinic Services
  SERVICES: [
    {
      id: 'skin-rejuvenation',
      number: '۰۱',
      enNumber: 'SERVICE 01',
      name: 'جوانسازی پوست',
      shortDescription: 'رویکردهای مدرن برای حفظ شادابی و طراوت پوست.',
      fullDescription: 'در کلینیک وردا، جوانسازی پوست با رویکردی غیرتهاجمی و منطبق بر بیولوژی طبیعی بافت پوست انجام می‌شود. هدف اصلی ما تحریک طبیعی فرآیندهای کلاژن‌سازی، بهبود بافت، رفع تیرگی‌ها و بازگرداندن شفافیت و قوام طبیعی به پوست است.',
      approach: 'ارزیابی ساختار لایه‌های پوست و انتخاب ترکیبی از روش‌های تحریکی بدون تغییر غیرطبیعی فرم چهره.',
      keyBenefits: [
        'افزایش الاستیسیته و استحکام طبیعی پوست',
        'کاهش خطوط ریز ناشی از دهیدراتگی و خستگی',
        'بهبود بافت و یکنواختی رنگ پوست',
        'حفظ نتایج در طولانی‌مدت با مراقبت‌های پایدار',
      ],
      recommendedFor: 'افرادی که به دنبال بازگرداندن شادابی و جوانی طبیعی چهره بدون حالت مصنوعی هستند.',
      sessionInfo: 'پس از جلسه مشاوره تخصصی و بررسی وضعیت پوست، پروتکل اختصاصی مشخص می‌شود.',
    },
    {
      id: 'laser-skincare',
      number: '۰۲',
      enNumber: 'SERVICE 02',
      name: 'لیزر و مراقبت پوست',
      shortDescription: 'خدمات و مراقبت‌های تخصصی متناسب با نیاز پوست.',
      fullDescription: 'استفاده از فناوری‌های مدرن نوری و لیزری برای بهبود کیفیت بافت پوست، پاکسازی عمقی منافذ، رفع لک‌های سطحی و تنظیم سلامت اپیدرم با کمترین دوره نقاهت.',
      approach: 'تنظیم دقیق طول‌موج‌ها و پروتکل‌های خنک‌کننده متناسب با تیپ پوستی و حساسیت‌های فردی مراجع.',
      keyBenefits: [
        'کاهش تیرگی‌ها و ناهماهنگی‌های رنگدانه‌ای',
        'پاکسازی عمقی و بهبود سلامت بافت سطحی',
        'انطباق کامل با پوست‌های حساس و ظریف',
        'جلسات آرام همراه با مراقبت‌های محافظتی پوست',
      ],
      recommendedFor: 'پوست‌های کدر، دارای لک‌های سطحی ناشی از آفتاب یا ناهمواری‌های بافتی.',
      sessionInfo: 'تعداد جلسات بر اساس تیپ پوستی و عمق نیاز مراقبتی در جلسه ارزیابی اولیه معین می‌گردد.',
    },
    {
      id: 'facial-contouring',
      number: '۰۳',
      enNumber: 'SERVICE 03',
      name: 'فرم‌دهی و زیبایی چهره',
      shortDescription: 'تمرکز بر تناسب، تعادل و حفظ ویژگی‌های طبیعی چهره.',
      fullDescription: 'فرم‌دهی در وردا به معنای تغییر ساختار ذاتی چهره نیست؛ بلکه بازگرداندن حجم‌های از دست رفته، رفع عدم تقارن‌های جزئی و ایجاد هماهنگی در زوایای طبیعی صورت با دقت میکرومتری است.',
      approach: 'تحلیل دقیق زوایای نور روی صورت و پرهیز جدی از حجم‌دهی اغراق‌آمیز برای رسیدن به چهره‌ای آرام و باطراوت.',
      keyBenefits: [
        'ایجاد تناسب در خطوط فک، گونه و لب‌ها',
        'احترام کامل به فرم استخوان‌بندی منحصربه‌فرد هر فرد',
        'استفاده از متریال با بالاترین تاییدیه‌های بهداشتی و ایمنی',
        'نتیجه کاملاً متناسب، ظریف و غیرقابل تشخیص از بافت طبیعی',
      ],
      recommendedFor: 'مراجعینی که به دنبال بهبود هارمونی اجزای چهره همراه با حفظ هویت طبیعی خود هستند.',
      sessionInfo: 'انجام خدمات در یک یا دو مرحله تکمیلی برای حصول حداکثر تقارن و ماندگاری مطلوب.',
    },
    {
      id: 'hair-care',
      number: '۰۴',
      enNumber: 'SERVICE 04',
      name: 'مراقبت مو',
      shortDescription: 'مراقبت و بررسی تخصصی برای سلامت و ظاهر بهتر مو.',
      fullDescription: 'بررسی بالینی سلامت فولیکول‌ها، ریشه‌یابی علل نازک‌شدن تارهای مو و ارائه پروتکل‌های تقویتی و مغذی با هدف تقویت چرخه رشد و درخشش طبیعی موها.',
      approach: 'ترکیب رویکردهای تحریکی موضعی، تغذیه مزودرم پوست سر و تنظیم فاکتورهای رشد فیزیولوژیک.',
      keyBenefits: [
        'تقویت ریشه و ساقه تارهای ضعیف‌شده',
        'کاهش ریزش‌های فصلی و ناشی از استرس',
        'بهبود ضخامت و تراکم ظاهری موها',
        'توصیه‌های مراقبت هوم‌کر سازگار با نوع مو',
      ],
      recommendedFor: 'افرادی که دچار کم‌پشتی خفیف، نازک‌شدن ساقه مو یا کاهش طراوت پوست سر شده‌اند.',
      sessionInfo: 'دوره‌های متوالی با فواصل منظم برای تکمیل چرخه بیولوژیک رشد مو.',
    },
    {
      id: 'aesthetic-consultation',
      number: '۰۵',
      enNumber: 'SERVICE 05',
      name: 'مشاوره زیبایی',
      shortDescription: 'بررسی شرایط فردی و انتخاب مسیر مناسب برای هر فرد.',
      fullDescription: 'جلسه مشاوره اختصاصی پایه و اساس تمام اقدامات در وردا است. در این جلسه، تاریخچه مراقبتی، سبک زندگی، آناتومی چهره و نیازهای واقعی شما با آرامش و شفافیت تمام مورد بررسی قرار می‌گیرد.',
      approach: 'گفتگوی دوطرفه صمیمانه و علمی برای ترسیم نقشه راهی واقع‌بینانه و موثر بدون تحمیل خدمات غیرضروری.',
      keyBenefits: [
        'آنالیز تصویری و لمسی وضعیت پوست و چهره',
        'پاسخ کامل به سوالات، نگرانی‌ها و ابهامات مراجع',
        'ترسیم برنامه مراقبتی کوتاه‌مدت و بلندمدت',
        'انتخاب هوشمندانه با آگاهی کامل از تمامی مراحل',
      ],
      recommendedFor: 'هر فردی که قصد دارد مسیر مراقبت زیبایی خود را آگاهانه، ایمن و هدفمند آغاز کند.',
      sessionInfo: 'زمان‌بندی اختصاصی در محیطی کاملاً آرام و بدون عجله.',
    },
  ] as ServiceDetail[],

  // Featured Service Block
  FEATURED_SERVICE: {
    LABEL: '01 · FEATURED',
    TITLE: '«مراقبت، با دقت شروع می‌شود.»',
    DESCRIPTION: 'هر پوست نیاز متفاوتی دارد. انتخاب درست از شناخت درست آغاز می‌شود. در وردا ما زمان کافی را برای شنیدن خواسته‌ها و درک بیولوژی بافت پوست شما اختصاص می‌دهیم.',
    BADGE: 'رویکرد اختصاصی و آرام',
    CTA: 'مشاهده خدمات',
  },

  // Visual Philosophy (3 Core Pillars)
  PHILOSOPHY: {
    SECTION_LABEL: 'OUR PHILOSOPHY',
    TITLE: 'اصول بنیادین وردا',
    SUBTITLE: 'سه رکن اصلی که تمام اقدامات و رویکردهای ما در وردا بر آن‌ها استوار است',
    ITEMS: [
      {
        id: 0,
        word: 'تعادل',
        en: 'BALANCE',
        shortDescription: 'هماهنگی میان تمام اجزای چهره، بدون اغراق و با احترام به ویژگی‌های ذاتی شما.',
        fullExplanation: 'زیبایی پایدار زمانی پدیدار می‌شود که تمام عناصر چهره با یکدیگر در تناسب هندسی و حسی قرار گیرند. ما مخالف الگوهای یکسان و کلیشه‌ای هستیم و هر چهره را یک اثر هنری منحصربه‌فرد می‌دانیم.',
        principles: [
          'احترام به فرم و تناسبات طبیعی صورت',
          'پرهیز از حجم‌دهی و کشیدگی غیرعادی',
          'هماهنگی میان خطوط استخوانی و بافت نرم چهره',
        ],
      },
      {
        id: 1,
        word: 'دقت',
        en: 'PRECISION',
        shortDescription: 'بررسی موشکافانه نیازهای بافت پوست و انتخاب سنجیده‌ترین پروتکل‌های بالینی.',
        fullExplanation: 'کوچک‌ترین جزئیات در کیفیت پوست و فرم چهره تاثیرگذارند. پروتکل‌های درمانی و مراقبتی ما با دقت میکرومتری و با بهره‌گیری از تجهیزات استاندارد روز پیاده‌سازی می‌شوند.',
        principles: [
          'آنالیز دقیق عمق و ضخامت لایه‌های پوست',
          'تعیین دوز و شیوه مداخله با محاسبات دقیق علمی',
          'رعایت بالاترین استانداردهای استریلیزاسیون و بهداشت',
        ],
      },
      {
        id: 2,
        word: 'طبیعی',
        en: 'NATURAL',
        shortDescription: 'نتیجه‌ای که در نگاه اول شادابی و سلامت پوست را نشان می‌دهد، نه دستکاری مصنوعی.',
        fullExplanation: 'بهترین اقدام زیبایی آن است که دیگران تنها شادابی، استراحت‌یافتگی و طراوت چهره شما را تحسین کنند، بدون آن‌که متوجه دستکاری مشخصی شوند.',
        principles: [
          'حفظ حالت میمیک و بیان طبیعی احساسات در چهره',
          'درخشش سالم از درون بافت پوست',
          'ماندگاری همراه با ارتقای فیزیولوژیک بافت‌ها',
        ],
      },
    ] as PhilosophyDetail[],
  },

  // Doctor / Team Section
  DOCTOR: {
    SECTION_LABEL: 'PHYSICIAN & CARE',
    TITLE: 'درباره پزشک',
    NAME: 'دکتر مریم شمس',
    TITLE_EN: 'پزشک زیبایی و مراقبت پوست',
    BADGE: 'رویکرد بالینی و زیبایی اختصاصی',
    BIO: 'رویکرد ما در وردا بر ارزیابی دقیق ساختار چهره، انتخاب آگاهانه تکنیک‌ها و احترام کامل به تناسبات طبیعی فرد استوار است. ما محیطی امن و آرام را فراهم کرده‌ایم تا هر مراجع بتواند در مسیری شفاف، علمی و متناسب با نیاز پوست و چهره خود، به شادابی و تعادل پایدار دست یابد.',
    PHILOSOPHY_NOTE: 'مشاوره دقیق پیش از هرگونه اقدام زیبایی',
    CARE_PILLARS: [
      'بررسی پرونده پزشکی و حساسیت‌های پوستی فردی',
      'توضیح کامل مزایا، مراقبت‌های بعدی و انتظارات واقع‌بینانه',
      'همراهی مستمر و پیگیری نتایج پس از انجام خدمات',
    ],
  },

  // Atmosphere Gallery Section
  GALLERY: {
    SECTION_LABEL: 'ATMOSPHERE & SPACES',
    TITLE: 'نگاهی به فضای وردا',
    DESCRIPTION: 'محیطی آرام، با هارمونی نور طبیعی و متریال خنثی برای تجربه مراقبتی دلپذیر و آسوده.',
  },

  // Client Journey (Process) Section
  PROCESS: {
    SECTION_LABEL: 'CLIENT EXPERIENCE',
    TITLE: 'از آشنایی تا مراقبت',
    DESCRIPTION: 'مسیری شفاف، آرام و بدون پیچیدگی در همراهی با وردا',
    STEPS: [
      {
        num: '۰۱',
        enNum: 'STEP 01',
        title: 'آشنایی',
        description: 'ارتباط اولیه از طریق تماس، واتساپ یا اینستاگرام و هماهنگی زمان مراجعه.',
        detailedNotes: 'در این مرحله پذیرش کلینیک با خوش‌رویی پاسخگوی سوالات اولیه شما بوده و مناسب‌ترین زمان مشاوره را مطابق برنامه کاری شما تنظیم می‌کند.',
        durationNote: 'زمان پاسخگویی: ساعات اداری کلینیک',
      },
      {
        num: '۰۲',
        enNum: 'STEP 02',
        title: 'مشاوره',
        description: 'گفتگو، بررسی وضعیت پوست و ارزیابی انتظارات با رویکردی کاملاً واقع‌بینانه.',
        detailedNotes: 'بررسی رودررو با پزشک، لمس و تحلیل بافت پوست، و تدوین برنامه مراقبتی اختصاصی متناسب با اهداف زیبایی شما.',
        durationNote: 'مدت جلسه: ۳۰ الی ۴۵ دقیقه زمان اختصاصی',
      },
      {
        num: '۰۳',
        enNum: 'STEP 03',
        title: 'انتخاب خدمات',
        description: 'تعیین بهترین مسیر مراقبت و زیبایی با تمرکز بر حفظ هارمونی و سلامت طبیعی.',
        detailedNotes: 'اجرای تکنیک‌های انتخابی در سوئیت‌های اختصاصی با رعایت بالاترین اصول بهداشتی و استفاده از متریال معتبر و استاندارد.',
        durationNote: 'محیط آرام، استریل و بدون استرس',
      },
      {
        num: '۰۴',
        enNum: 'STEP 04',
        title: 'پیگیری',
        description: 'همراهی و توصیه‌های تکمیلی پس از خدمات برای پایداری و درخشش مداوم پوست.',
        detailedNotes: 'ارائه دستورالعمل‌های مراقبت در منزل، بررسی روند بهبود و پاسخگویی به هرگونه سوالات پس از مراجعه.',
        durationNote: 'پشتیبانی و همراهی دائمی کلینیک',
      },
    ] as ProcessStepDetail[],
  },

  // Instagram Social Journal
  INSTAGRAM: {
    SECTION_LABEL: 'SOCIAL JOURNAL',
    TITLE: 'روزمرگی‌های وردا',
    HANDLE: 'verda.aesthetic@',
    URL: 'https://instagram.com/verda.aesthetic',
    BUTTON_TEXT: 'مشاهده اینستاگرام',
  },

  // Contact & Location Section
  CONTACT: {
    SECTION_LABEL: 'GET IN TOUCH',
    TITLE: 'در ارتباط بمانید.',
    SUBTITLE: 'پاسخگوی پرسش‌ها و هماهنگی‌های شما در ساعات کاری کلینیک هستیم',
    ADDRESS: 'تهران، زعفرانیه، خیابان مقدس اردبیلی، پلاک ۴۲، طبقه ۳، واحد ۳۰۲',
    WORKING_HOURS: 'شنبه تا چهارشنبه: ۱۰:۰۰ الی ۱۹:۰۰ | پنجشنبه: ۱۰:۰۰ الی ۱۵:۰۰',
    PHONE_DISPLAY: '۰۲۱-۲۲۰۸۹۱۵۰',
    PHONE_RAW: '02122089150',
    MOBILE_DISPLAY: '۰۹۱۲۰۰۰۳۳۴۴',
    MOBILE_RAW: '09120003344',
    WHATSAPP_NUMBER: '989120003344',
    WHATSAPP_DISPLAY: '۰۹۱۲ ۰۰۰ ۳۳۴۴',
    INSTAGRAM_URL: 'https://instagram.com/verda.aesthetic',
    INSTAGRAM_HANDLE: 'verda.aesthetic@',
    NOTE: 'لطفاً پیش از مراجعه حضوری، جهت هماهنگی و اطمینان از زمان نوبت، با پذیرش کلینیک تماس حاصل فرمایید.',
    MAP_LINKS: [
      { name: 'بلد', enName: 'Balad', url: 'https://balad.ir', enabled: true },
      { name: 'نشان', enName: 'Neshan', url: 'https://neshan.org', enabled: true },
      { name: 'Google Maps', enName: 'Google Maps', url: 'https://maps.google.com/?q=Tehran+Zaferanieh', enabled: true },
    ],
  },

  // Final Call to Action
  FINAL_CTA: {
    HEADLINE: '«کمی بیشتر برای خودت وقت بگذار.»',
    DESCRIPTION: 'برای آشنایی بیشتر با خدمات و فضای وردا، با ما در ارتباط باشید.',
    PRIMARY_BUTTON: 'تماس با ما',
    SECONDARY_BUTTON: 'اینستاگرام',
  },

  // Footer & Credits
  FOOTER: {
    COPYRIGHT: 'کلیه حقوق مادی و معنوی متعلق به کلینیک تخصصی وِردا است.',
    STUDIO_LABEL: 'طراحی شده توسط Picksaw Studio',
    STUDIO_URL: 'https://picksaw.studio',
  },
} as const;

export type ContentConfigType = typeof CONTENT_CONFIG;
