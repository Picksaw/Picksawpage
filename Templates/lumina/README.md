<div align="center">

# 💎 کلینیک دندانپزشکی لوکس «لومینا دنتال»
### Lumina Dental Clinic — Template #01 by Picksaw Studio

![Lumina Dental Banner](/images/hero-smile-clinic.jpg)

<p align="center">
  <strong>یک قالب مدرن، فوق‌لوکس، کاملاً راست‌چین (RTL) و بهینه‌سازی‌شده برای کلینیک‌های دندانپزشکی زیبایی و تخصصی</strong>
</p>

[![Deploy to GitHub Pages](https://github.com/Picksaw/lumina/actions/workflows/deploy.yml/badge.svg)](https://github.com/Picksaw/lumina/actions/workflows/deploy.yml)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

</div>

---

## 🌟 درباره پروژه (About The Project)

«لومینا دنتال» (Lumina Dental) قالب شماره ۰۱ از مجموعه قالب‌های استودیو **Picksaw** است. این وب‌سایت به عنوان یک نمونه کار آماده و استاندارد برای کلینیک‌های دندانپزشکی لوکس و مدرن در ایران طراحی شده است.

### ✨ ویژگی‌های کلیدی:
- 🌙 **طراحی بصری لوکس (Luxury Dark Theme):** پالت رنگی سرمه‌ای عمیق (`#07111F`)، نورپردازی فیروزه‌ای (`#7FE7FF`) و آبی نوری (`#5DB8FF`).
- ⚡ **بدون نیاز به دیتابیس (Zero Database Dependency):** ارتباط فوری و بدون واسطه از طریق واتس‌اپ، تماس تلفنی و دایرکت اینستاگرام.
- 📸 **اسلایدر مقایسه قبل و بعد (Before & After Slider):** دارای حالت‌های مقایسه کنار هم (Side-by-Side)، اسلایدر تعاملی، و لایت‌باکس بزرگ‌نمایی.
- 🗺️ **مسیریابی با اپلیکیشن‌های ایرانی:** دکمه‌های مستقیم مسیریابی در **نشان (Neshan)**، **بلد (Balad)** و **Google Maps**.
- 📱 **دکمه‌های شناور (Floating Quick Actions):** دسترسی سریع به تماس تلفنی، واتس‌اپ، اینستاگرام و اسکرول به بالا.
- 🔤 **تایپوگرافی فارسی استاندارد:** بهره‌گیری از فونت **وزیرمتن (Vazirmatn)** با اعداد فرمت‌شده و شماره‌های تماس LTR بدون به‌هم‌ریختگی.

---

## 📂 راهنمای شخصی‌سازی آسان (Customization Guide)

تمامی تصاویر و متن‌های سایت در **۳ فایل متمرکز** سازمان‌دهی شده‌اند تا بدون نیاز به دستکاری کدهای کامپوننت، کل سایت را تغییر دهید:

### ۱. مدیریت تصاویر اصلی و پرتره‌ها:
📁 **`src/data/images.ts`**
```typescript
export const SITE_IMAGES = {
  hero: {
    main: '/images/hero-smile-clinic.jpg', // تصویر هیرو
  },
  beforeAfter: {
    case1: { before: '...', after: '...' }, // تصاویر قبل و بعد لمینت
    case2: { before: '...', after: '...' }, // تصاویر ارتودنسی
    case3: { before: '...', after: '...' }, // تصاویر بلیچینگ
  },
  specialists: {
    doctorElena: { src: '/images/doctor-elena.jpg' }, // پرتره دکتر مرادی
    doctorDanial: { src: '/images/doctor-danial.jpg' }, // پرتره دکتر کریمی
    doctorSofia: { src: '/images/doctor-sofia.jpg' }, // پرتره دکتر نادری
  }
};
```

### ۲. مدیریت تصاویر گالری و محیط کلینیک:
📁 **`src/data/galleryImages.ts`**
```typescript
export const CLINIC_MEDIA_ASSETS = [
  { id: 'lounge', image: '/images/clinic-lounge.jpg', title: 'لابی اختصاصی' },
  { id: 'private-suite', image: '/images/private-suite.jpg', title: 'سوئیت VIP' },
  { id: 'digital-workstation', image: '/images/digital-scan-tech.jpg', title: 'مرکز اسکن' },
];
```

### ۳. مدیریت تمامی متن‌ها و شماره‌های تماس:
📁 **`src/data/content.ts`**
```typescript
export const CLINIC_INFO = {
  name: 'لومینا دنتال',
  phoneDisplay: '021 - 2842 5060',
  phoneRaw: '+982128425060',
  mobileDisplay: '0912 - 987 6543',
  whatsappRaw: '989129876543',
  instagramHandle: '@luminadental.studio',
  instagramUrl: 'https://instagram.com/luminadental.studio',
  address: 'تهران، زعفرانیه، مجتمع پالادیوم...',
  mapLinks: {
    neshan: 'https://neshan.org/...',
    balad: 'https://balad.ir/...',
    googleMaps: 'https://maps.google.com/...',
  }
};
```

---

## 🚀 راه‌اندازی و اجرای محلی (Local Development)

### پیش‌نیازها:
- Node.js نسخه 18 یا بالاتر
- npm یا yarn یا pnpm

### مراحل اجرا:
```bash
# ۱. کلون کردن ریپازیتوری
git clone https://github.com/Picksaw/lumina.git

# ۲. ورود به دایرکتوری پروژه
cd lumina

# ۳. نصب پکیج‌ها
npm install

# ۴. اجرای سرور توسعه محلی
npm run dev
```

### بیلد نهایی برای پروداکشن (Production Build):
```bash
npm run build
```
خروجی در پوشه `dist/` به صورت یک بسته فوق بهینه و تک‌فایلی آماده استقرار است.

---

## 🌐 انتشار روی گیت‌هاب پیجز (GitHub Pages Deployment)

فایل ورک‌فلو `.github/workflows/deploy.yml` به صورت خودکار با هر `git push` به شاخه `main` یا `master`، سایت را بیلد کرده و روی GitHub Pages منتشر می‌کند.

### فعال‌سازی در مخزن گیت‌هاب:
1. در ریپازیتوری گیت‌هاب به تب **Settings** بروید.
2. از منوی سمت چپ بخش **Pages** را انتخاب کنید.
3. در قسمت **Build and deployment > Source** گزینه **GitHub Actions** را انتخاب کنید.

---

## 🛠️ ساختار فایل‌ها (Project Structure)

```text
lumina/
├── .github/
│   └── workflows/
│       └── deploy.yml          # اکشن بیلد و دیپلوی خودکار GitHub Pages
├── public/
│   └── images/                 # پوشه قرارگیری تصاویر محلی
├── src/
│   ├── components/             # کامپوننت‌های فرانت‌اند
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── TrustStrip.tsx
│   │   ├── Services.tsx
│   │   ├── BeforeAfterSlider.tsx
│   │   ├── WhyLumina.tsx
│   │   ├── Specialists.tsx
│   │   ├── ClinicExperience.tsx
│   │   ├── PatientJourney.tsx
│   │   ├── ConsultationPlans.tsx
│   │   ├── FAQ.tsx
│   │   ├── FinalCTA.tsx
│   │   ├── Footer.tsx
│   │   ├── FloatingActions.tsx
│   │   ├── ContactModal.tsx
│   │   ├── ServiceDetailModal.tsx
│   │   └── PicksawStudioModal.tsx
│   ├── data/                   # فایل‌های مدیریت محتوا و آدرس تصاویر
│   │   ├── images.ts           # 👈 مدیریت آدرس تصاویر اصلی
│   │   ├── galleryImages.ts    # 👈 مدیریت آدرس تصاویر کلینیک
│   │   └── content.ts          # 👈 مدیریت تمامی متون و شماره‌ها
│   ├── types/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts
```

---

## 📄 لایسنس (License)

توسعه‌یافته توسط [Picksaw Studio](https://picksaw.studio) تحت مجوز MIT License. برای اطلاعات بیشتر فایل [LICENSE](LICENSE) را مطالعه فرمایید.
