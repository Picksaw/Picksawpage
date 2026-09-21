/**
 * ---------------------------------------------------------------------
 * LUMINA DENTAL — CLINIC GALLERY & AMBIENCE ASSETS (File 2 of 2)
 * ---------------------------------------------------------------------
 * Controls the architectural, interior, and technology imagery of the clinic.
 * Update file paths here when adding new clinic photography.
 * ---------------------------------------------------------------------
 */

export interface ClinicMediaItem {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  aspect: 'wide' | 'tall' | 'square';
}

export const CLINIC_MEDIA_ASSETS: ClinicMediaItem[] = [
  {
    id: 'lounge',
    title: 'فضای پذیرش و لابی اختصاصی',
    category: 'محیط کلینیک',
    image: '/images/clinic-lounge.jpg',
    description: 'طراحی شده به سبک هتل‌های بوتیک لوکس با نورپردازی ملایم و پذیرایی اختصاصی برای حفظ آرامش پیش از ویزیت.',
    aspect: 'wide',
  },
  {
    id: 'private-suite',
    title: 'سوئیت درمان خصوصی (VIP Suite)',
    category: 'اتاق درمان',
    image: '/images/private-suite.jpg',
    description: 'فضایی کاملاً ایزوله با صندلی‌های ارگونومیک چرمی و ویوی پانوراما برای ایجاد آرامش حداکثری هنگام درمان.',
    aspect: 'tall',
  },
  {
    id: 'digital-workstation',
    title: 'مرکز اسکن و طراحی دیجیتال',
    category: 'تجهیزات پیشرفته',
    image: '/images/digital-scan-tech.jpg',
    description: 'مجهز به اسکنرهای داخل دهانی سه‌بعدی و نمایشگرهای ارزیابی زنده برای بررسی جامع شرایط دندان‌ها.',
    aspect: 'wide',
  },
];
