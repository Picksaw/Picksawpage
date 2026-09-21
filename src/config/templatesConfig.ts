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
    title: { en: "Verda", fa: "وِردا" },
    description: { en: "", fa: "" },
    url: "/verda/",
    imageKey: "verda",
  },
  {
    id: "lumina",
    name: { en: "Lumina", fa: "لومینا" },
    title: { en: "Lumina", fa: "لومینا" },
    description: { en: "", fa: "" },
    url: "/lumina/",
    imageKey: "lumina",
  },
  {
    id: "clarity",
    name: { en: "Clarity", fa: "کلاریتی" },
    title: { en: "Clarity", fa: "کلاریتی" },
    description: { en: "", fa: "" },
    url: "/clarity/",
    imageKey: "clarity",
  },
  {
    id: "pulse",
    name: { en: "Pulse", fa: "پالس" },
    title: { en: "Pulse", fa: "پالس" },
    description: { en: "", fa: "" },
    url: "/pulse/",
    imageKey: "pulse",
  },
{
  id: "aurora",
  name: { en: "Aurora", fa: "آورورا" },
  title: { en: "Aurora", fa: "آورورا" },
  description: { en: "", fa: "" },
  url: "/aurora/",
  imageKey: "aurora",
},
{
  id: "lumen",
  name: { en: "Lumen", fa: "لومن" },
  title: { en: "Lumen", fa: "لومن" },
  description: { en: "", fa: "" },
  url: "/lumen/",
  imageKey: "lumen",
},
];
