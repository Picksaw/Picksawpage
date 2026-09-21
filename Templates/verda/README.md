# وِردا · VERDA
### Template #3 in the Picksaw Studio Clinic Template Collection

[![Deploy to GitHub Pages](https://github.com/Picksaw/verda/actions/workflows/deploy.yml/badge.svg)](https://github.com/Picksaw/verda/actions/workflows/deploy.yml)
[![Repository](https://img.shields.io/badge/GitHub-Picksaw%2Fverda-344236?logo=github)](https://github.com/Picksaw/verda)

> **«زیبایی، در هماهنگی است.»**  
> وب‌سایت آماده و لندینگ پیج اختصاصی کلینیک تخصصی پوست، مو و زیبایی «وِردا» (VERDA). طراحی شده بر پایه معماری مدرن، تایپوگرافی چشم‌نواز فارسی، متریال ارگانیک و تعاملی آرامش‌بخش برای کلینیک‌های زیبایی و درماتولوژی در کلاس پریمیوم.

---

## ✨ ویژگی‌های کلیدی (Key Features)

- 🌿 **پالت رنگی طبیعی و آرامش‌بخش:** هارمونی رنگ‌های کرم گرم (`#FBFAF4` و `#F5F3EA`)، سبز مریم‌گلی (Sage Green `#9CAF88`)، زیتونی تیره (`#344236`) و هایلایت‌های ظریف زرد خنثی (`#E9D98A`).
- ✍️ **تایپوگرافی اصیل و مدرن فارسی:** فونت چشم‌نواز **وزیرمتن (Vazirmatn)** به همراه حروف‌نگاری ادیتوریال انگلیسی.
- 🍃 **شبیه‌ساز فیزیک باد و برگ‌های شناور در پس‌زمینه (Wind Physics Engine):** برگ‌های ظریف مریم‌گلی و زیتونی با فناوری Canvas که در حالت سکون آرام شناورند و با اسکرول کاربر، نسیم و باد ملایمی را شبیه‌سازی می‌کنند (کاملاً در پس‌زمینه بدون پوشاندن تصاویر و متون).
- 🗂️ **۲ فایل پیکربندی متمرکز (Centralized Config):** امکان ویرایش ۱۰۰٪ کلیه متون و نشانی تصاویر در دو فایل مجزا بدون نیاز به جستجو در کامپوننت‌ها.
- 🖼️ **تصاویر محلی و مستقل:** کلیه تصاویر در پوشه `public/images/` ذخیره شده و پس از اجرای `npm run build` بدون وابستگی بیرونی بارگذاری می‌شوند.
- 🔍 **پنجره اطلاعات و جزئیات بالینی (Interactive Details Modal):** باز شدن شرح کامل خدمات، متدولوژی درمانی، معرفی پزشک، اصول سه‌گانه فلسفه و مراحل تجربه مراجعین با کلیک روی کارت‌ها و دکمه‌ها.
- 🚀 **اسکرول نرم Lenis و GSAP ScrollTrigger:** انیمیشن‌های ملایم، ورودی‌های متنی لایه‌به‌لایه و ترنزیشن‌های دقیق ۶۰ فریم بر ثانیه.
- 📱 **طراحی کاملاً واکنش‌گرا (Responsive) و RTL استاندارد:** بهینه‌سازی شده برای موبایل، تبلت و دسکتاپ به همراه داک شناور تماس ۳ دکمه‌ای (اینستاگرام، واتساپ، تماس مستقیم) و منوی کشویی مدرن.
- 🗺️ **دکمه‌های مستقیم مسیریابی:** لینک‌های مستقیم به بلد، نشان و گوگل مپ بدون استفاده از آی‌فریم‌های سنگین.

---

## 🛠️ استک فنی (Tech Stack)

- **React 19** + **TypeScript**
- **Vite 7** + **Tailwind CSS**
- **GSAP (GreenSock)** + **ScrollTrigger**
- **Lenis Smooth Scroll**
- **Lucide Icons**
- **HTML5 Canvas 2D Physics Engine**

---

## 📁 ساختار پیکربندی و شخصی‌سازی (Configuration)

برای ویرایش وب‌سایت برای مشتریان جدید نیازی به تغییر فایل‌های React ندارید:

```
src/config/
├── content.config.ts    # 📝 تمامی متون، عناوین، خدمات، فلسفه، شماره‌ها و جزییات بالینی
├── images.config.ts     # 🖼️ تمامی نشانی فایل‌های تصویری، گالری و شبکه‌های اجتماعی
└── clinic.config.ts     # 🔗 پل ارتباطی و اکسپورت یکپارچه تنظیمات
```

### ۱. تغییر تصاویر محلی (`src/config/images.config.ts`)
1. عکس‌های جدید خود را در پوشه `public/images/` قرار دهید (مثلاً `my-hero.jpg` یا `my-doctor.jpg`).
2. در فایل `src/config/images.config.ts` مسیر را به‌روز کنید:
   ```ts
   export const IMAGES_CONFIG = {
     HERO_IMAGE: '/images/my-hero.jpg',
     DOCTOR_IMAGE: '/images/my-doctor.jpg',
     // ...
   };
   ```
3. دستور `npm run build` را اجرا کنید؛ تصاویر با بالاترین کیفیت و سرعت بارگذاری خواهند شد.

### ۲. تغییر متون سایت (`src/config/content.config.ts`)
تمام متون فارسی، شماره‌های تماس، پیام واتساپ، اینستاگرام، آدرس و متون جزئیات خدمات در این فایل قابل تغییر هستند:
```ts
export const CONTENT_CONFIG = {
  BRAND: {
    CLINIC_NAME: 'وِردا',
    TAGLINE: '«زیبایی، در هماهنگی است.»',
    // ...
  },
  CONTACT: {
    PHONE_DISPLAY: '۰۲۱-۲۲۰۸۹۱۵۰',
    PHONE_RAW: '02122089150',
    MOBILE_DISPLAY: '۰۹۱۲۰۰۰۳۳۴۴',
    WHATSAPP_NUMBER: '989120003344',
    ADDRESS: 'تهران، زعفرانیه ...',
    // ...
  },
  // ...
};
```

---

## 🚀 نصب و اجرای پروژه (Quick Start)

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر
- npm یا pnpm

### مراحل اجرا
```bash
# ۱. کلون کردن ریپازیتوری
git clone https://github.com/Picksaw/verda.git

# ۲. ورود به دایرکتوری پروژه
cd verda

# ۳. نصب پکیج‌ها
npm install

# ۴. اجرای محیط توسعه
npm run dev
```

### ساخت نسخه نهایی (Production Build)
```bash
npm run build
```
پروژه داخل پوشه `dist/` بیلد شده و آماده استقرار روی هر نوع وب‌سرور (Nginx، Apache، Vercel، Netlify، GitHub Pages و ...) می‌باشد.

---

## 🌐 دیپلوی خودکار با GitHub Actions (`deploy.yml`)

این ریپازیتوری مجهز به اکشن خودکار GitHub Pages است (`.github/workflows/deploy.yml`):

1. به بخش **Settings > Pages** در مخزن گیت‌هاب بروید: `https://github.com/Picksaw/verda/settings/pages`
2. در قسمت **Build and deployment > Source** گزینه **GitHub Actions** را انتخاب کنید.
3. با هر بار `git push` به شاخه `main` یا `master`، وب‌سایت به صورت خودکار بیلد و منتشر می‌شود.

---

## 📄 لایسنس (License)

طراحی و پیاده‌سازی شده توسط **[Picksaw Studio](https://picksaw.studio)**.  
کلیه حقوق محفوظ است. تحت لایسنس MIT.
