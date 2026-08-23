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
    id: "verda",
    name: { en: "Verda", fa: "وِردا" },
    title: { en: "DERMATOLOGY", fa: "دکتر پوست" },
    description: { en: "", fa: "" },
    url: "https://verda.picksaw.ir/",
    imageKey: "verda",
  },
  {
    id: "lumina",
    name: { en: "Lumina", fa: "لومینا" },
    title: { en: "Dental clinic", fa: "دندانپزشکی" },
    description: { en: "", fa: "" },
    url: "https://lumina.picksaw.ir/",
    imageKey: "lumina",
  },
  {
    id: "clarity",
    name: { en: "clarity", fa: "کلاریتی" },
    title: { en: "Beauty Clinic", fa: "کلینیک زیبایی" },
    description: { en: "", fa: "" },
    url: "https://clarity.picksaw.ir/",
    imageKey: "clarity",
  },
  {
    id: "pulse",
    name: { en: "Pulse", fa: "پالس" },
    title: { en: "Clinic", fa: "کلینیک" },
    description: { en: "", fa: "" },
    url: "https://pulse.picksaw.ir/",
    imageKey: "pulse",
  },
{
  id: "aurora",
  name: { en: "Aurora", fa: "آورورا" },
  title: { en: "Clinic", fa: "کلینیک" },
  description: { en: "", fa: "" },
  url: "https://aurora.picksaw.ir/",  // <-- CHANGE THIS TO YOUR LINK
  imageKey: "aurora",
},
{
  id: "lumen",
  name: { en: "Lumen", fa: "لومن" },
  title: { en: "Clinic", fa: "کلینیک" },
  description: { en: "", fa: "" },
  url: "https://lumen.picksaw.ir/",  // <-- CHANGE THIS TO YOUR LINK
  imageKey: "new-template",
},
];
