# کلینیک اورورا — زیبایی، با امضای ظرافت
### PICKSAW TEMPLATE #1 — AURORA: Flagship Luxury Aesthetic Clinic Landing Page

[![Deploy to GitHub Pages](https://github.com/Picksaw/aurora/actions/workflows/deploy.yml/badge.svg)](https://github.com/Picksaw/aurora/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-C8A57A.svg)](LICENSE)
[![Author: Picksaw](https://img.shields.io/badge/Crafted%20by-Picksaw%20Studio-1A1A1A.svg)](https://github.com/Picksaw)

---

## ✦ معرفی پروژه (Introduction)

**کلینیک اورورا (Aurora Aesthetic Atelier)** اثر شاخص طراحی وب و لندینگ‌پیج لوکس در سطح استانداردهای بین‌المللی برای آتلیه‌های پوست، مو و زیبایی است که توسط **استودیو پیکسا (Picksaw Studio)** طراحی و پیاده‌سازی شده است.

این قالب با تمرکز بر سه اصل اساسی شکل گرفته است:
1. **آرامش (Calm)** — هویت حرکتی روان (Silk Motion) و نوای آرامش‌بخش ملودیک Lo-Fi.
2. **دقت (Precision)** — تایپوگرافی اصیل وزیری، هندسه ۱۲ ستونه و اعداد دقیق LTR.
3. **لوکس بودن (Luxury)** — پالت رنگی گرم شامپاینی (`#F9F6F2`, `#F3EEE8`, `#C8A57A`, `#1A1A1A`).

---

## 📁 ساختار پرونده‌ها (Project Structure)

تمام محتوا، تصاویر و ساختار به صورت ماژولار و تفکیک‌شده طراحی شده‌اند:

```text
├── .github/
│   └── workflows/
│       └── deploy.yml      # اکشن استقرار خودکار در گیت‌هاب پیجز (GitHub Pages)
├── index.html              # صفحه اصلی و معماری المان‌های لندینگ
├── media.js                # پرونده مرکزی کنترل تمام تصاویر و فایل‌های رسانه‌ای
├── content.js              # پرونده مرکزی کنترل تمام متون، شماره‌ها و عناوین
├── package.json            # اسکریپت‌های توسعه و اجرای محلی
├── .gitignore              # قوانین نادیده‌گیری گیت
├── LICENSE                 # مجوز انتشار MIT
└── README.md               # مستندات کامل پروژه
```

---

## 🖼️ مدیریت تصاویر (`media.js`)

تمام نشانی‌های تصاویر در پرونده `media.js` قرار دارند. برای تغییر تصاویر به صورت محلی یا اینترنتی، کافی است متغیرهای این فایل را ویرایش کنید:

```javascript
const AURORA_MEDIA = {
  hero: {
    // می‌توانید آدرس اینترنتی یا مسیر محلی بدهید:
    mainPortrait: "./assets/images/hero.jpg",
  },
  services: {
    rejuvenation: { image: "..." },
    contouring:   { image: "..." },
    care:         { image: "..." },
    brightening:  { image: "..." },
    noninvasive:  { image: "..." }
  },
  philosophy: { interiorImage: "..." },
  founder:    { portraitImage: "..." },
  gallery: [
    { image: "...", title: "...", description: "..." }
  ]
};
```

---

## ✍️ مدیریت متون و شماره‌ها (`content.js`)

تمامی عناوین، متون، مراحل درمانی، شماره‌های تماس و پیوندها در `content.js` تعریف شده‌اند:

```javascript
const AURORA_CONTENT = {
  brand: {
    nameFa: "کلینیک اورورا",
    tagline: "«زیبایی، با امضای ظرافت»",
    craftedBy: "پیکسا (Picksaw Studio)"
  },
  contact: {
    phoneDisplay: "021-88881234",   // شماره‌ها به صورت LTR بدون به‌هم‌ریختگی
    mobileDisplay: "0912-555-2841",
    whatsappLink: "https://wa.me/989125552841",
    address: "تهران، بلوار آفتاب، پلاک ۲۸، طبقه سوم"
  },
  servicesList: {
    rejuvenation: {
      title: "جوانسازی پوست",
      duration: "60 دقیقه",
      steps: [ ... ]
    }
  }
};
```

---

## 🚀 نحوه اجرای محلی (Local Development)

برای اجرای سایت روی سیستم خود:

### با استفاده از Node.js و npm:
```bash
# نصب و اجرای سرور محلی
npm start
# یا
npm run dev
```
سپس مرورگر خود را باز کرده و به آدرس `http://localhost:3000` بروید.

### بدون npm (با پایتون):
```bash
python -m http.server 3000
```

---

## 🌐 استقرار در گیت‌هاب پیجز (GitHub Pages Deployment)

این مخزن شامل فایل جریان‌کاری آماده `.github/workflows/deploy.yml` است. برای استقرار:

1. پروژه را به مخزن گیت‌هاب خود push کنید:
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of Aurora Luxury Aesthetic Clinic"
   git remote add origin https://github.com/Picksaw/aurora.git
   git branch -M main
   git push -u origin main
   ```
2. در گیت‌هاب به مسیر **Settings** > **Pages** بروید.
3. در بخش **Build and deployment**، گزینه **Source** را روی **GitHub Actions** قرار دهید.
4. با هر بار push به شاخه `main`، وب‌سایت به طور خودکار مستقر و به‌روزرسانی می‌شود.

---

## ✨ ویژگی‌های برجسته (Key Features)

- **Silk Particles Canvas**: ذرات ملایم ابریشمی در پس‌زمینه که با اسکرول صفحه به آرامی شناور می‌شوند.
- **Lo-Fi Sound Generator**: پخش زنده آکوردهای جز و امبینت پیانو روی بستر Web Audio API بدون نیاز به فایل‌های صوتی حجیم.
- **LTR Contact Numbers**: شماره‌های تلفن ثابت و همراه به صورت استاندارد چپ‌به‌راست بدون تداخل نوشتاری.
- **Interactive Modals**: پنجره‌های مجزای مشخصات پروتکل‌های درمانی، مانیفست زیبایی، بیوگرافی موسس و تشریفات ورودی.
- **Routing & Maps**: دکمه‌های اتصال مستقیم به نشان، بلد و Google Maps همراه با خدمات واله پارکینگ.
- **Zero Database VIP Concierge**: ارتباط مستقیم تک‌کلیکه با واتس‌اپ، تماس تلفنی و اینستاگرام.

---

## ⚖️ لایسنس (License)

توسعه‌یافته توسط **پیکسا (Picksaw Studio)** تحت مجوز [MIT](LICENSE).
