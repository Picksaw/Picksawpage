/**
 * ---------------------------------------------------------------------
 * LUMINA DENTAL — IMAGE ASSETS CATALOG (File 1 of 2)
 * ---------------------------------------------------------------------
 * All primary image paths and placeholders are controlled in this file.
 * To use your own local images, put your files into the 'public/images/' 
 * directory and update the corresponding path here.
 * After running 'npm run build', the images will load seamlessly in the site.
 * ---------------------------------------------------------------------
 */

export const SITE_IMAGES = {
  // Brand & Hero
  hero: {
    main: '/images/hero-smile-clinic.jpg',
    alt: 'پرتره لبخند طبیعی و کلینیک دندانپزشکی لومینا دنتال',
  },

  // Before and After Case Studies (Real Clinical Photos)
  beforeAfter: {
    case1: {
      before: 'https://images.pexels.com/photos/6627522/pexels-photo-6627522.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      after: 'https://images.pexels.com/photos/3762402/pexels-photo-3762402.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      altBefore: 'وضعیت قبل از لمینت دندان - سایش و تغییر رنگ',
      altAfter: 'نتیجه بعد از لمینت سرامیکی E-Max',
    },
    case2: {
      before: 'https://images.pexels.com/photos/21134543/pexels-photo-21134543.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      after: 'https://images.pexels.com/photos/9775440/pexels-photo-9775440.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      altBefore: 'وضعیت قبل از ارتودنسی - نامرتبی و شلوغی دندان‌ها',
      altAfter: 'نتیجه بعد از ارتودنسی نامرئی با الاینر شفاف',
    },
    case3: {
      before: 'https://images.pexels.com/photos/4269690/pexels-photo-4269690.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      after: 'https://images.pexels.com/photos/3762453/pexels-photo-3762453.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
      altBefore: 'وضعیت قبل از بلیچینگ - تیرگی و لکه‌های عمیق مینا',
      altAfter: 'نتیجه بعد از بلیچینگ تخصصی مطبی فیلیپس زوم',
    },
  },

  // Specialists Portraits
  specialists: {
    doctorElena: {
      src: '/images/doctor-elena.jpg',
      alt: 'دکتر النا مرادی - متخصص دندانپزشکی زیبایی',
    },
    doctorDanial: {
      src: '/images/doctor-danial.jpg',
      alt: 'دکتر دانیال کریمی - متخصص ایمپلنتولوژی و جراحی',
    },
    doctorSofia: {
      src: '/images/doctor-sofia.jpg',
      alt: 'دکتر سوفیا نادری - متخصص ارتودنسی و ارتوپدی فک',
    },
  },
};
