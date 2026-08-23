/**
 * Website templates config — names, titles, descriptions, links, and image keys.
 * Change any value here to update the templates section on the main page.
 */
export interface TemplateItem {
  id: string;
  name: Record<string, string>;
  title: Record<string, string>;
  description: Record<string, string>;
  url: string;
  imageKey: string;
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: "portfolio",
    name: { en: "Portfolio", fa: "نمونه کار" },
    title: { en: "Creative Portfolio", fa: "نمونه کار خلاقانه" },
    description: { en: "Showcase your work with a sleek dark portfolio layout.", fa: "کار خود را با یک قالب نمونه کار تاریک و زیبا نمایش دهید." },
    url: "https://stormblade.picksaw.ir",
    imageKey: "portfolio",
  },
  {
    id: "ecommerce",
    name: { en: "Shop", fa: "فروشگاه" },
    title: { en: "Modern Store", fa: "فروشگاه مدرن" },
    description: { en: "A clean e-commerce template with product grids and checkout.", fa: "یک قالب فروشگاه تمیز با شبکه محصولات و پرداخت." },
    url: "https://stormblade.picksaw.ir",
    imageKey: "ecommerce",
  },
  {
    id: "blog",
    name: { en: "Blog", fa: "وبلاگ" },
    title: { en: "Story Blog", fa: "وبلاگ داستانی" },
    description: { en: "Share articles and stories with a modern editorial design.", fa: "مقالات و داستان‌های خود را با طراحی ویرایشی مدرن به اشتراک بگذارید." },
    url: "https://stormblade.picksaw.ir",
    imageKey: "blog",
  },
  {
    id: "agency",
    name: { en: "Agency", fa: "آژانس" },
    title: { en: "Digital Agency", fa: "آژانس دیجیتال" },
    description: { en: "Present your team and services with bold visuals.", fa: "تیم و خدمات خود را با تصاویر جسورانه معرفی کنید." },
    url: "https://stormblade.picksaw.ir",
    imageKey: "agency",
  },
];
