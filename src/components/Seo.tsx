import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { Lang } from "../config/siteTexts";

/**
 * Seo — runtime companion to the static head in index.html. The static
 * head (title, Open Graph/Twitter cards and the JSON-LD knowledge graph
 * linking Amirehsan Ashoori to PICKSAW) ships without JS for crawlers;
 * this component keeps <html lang> correct after a language toggle and
 * retitles the document + swaps canonical/meta when the visitor walks
 * between routes (Home / About / Feed).
 */

const SITE = "https://picksaw.ir";

const ROUTES = {
  en: {
    "/": {
      title: "PICKSAW — Cinematic Websites, 3D Worlds & AI Art by Amirehsan Ashoori",
      desc: "PICKSAW is the creative studio of Amirehsan Ashoori — web design, 3D & Unreal, AI art and video, music, creative coding and branding from Iran.",
    },
    "/about": {
      title: "About Amirehsan Ashoori — Founder of PICKSAW",
      desc: "Amirehsan Ashoori is the founder, creative developer, designer and multidisciplinary artist behind PICKSAW — web, 3D/Unreal, AI art, music, creative coding and branding.",
    },
    "/feed": {
      title: "Feed & Game — PICKSAW",
      desc: "Latest uploads, updates and the featured StormBlade game from PICKSAW by Amirehsan Ashoori.",
    },
  },
  fa: {
    "/": {
      title: "PICKSAW — وب‌سایت‌های سینمایی، دنیاهای سه‌بعدی و هنر هوش مصنوعی | امیراحسان عاشوری",
      desc: "PICKSAW استودیوی خلاق امیراحسان عاشوری است — طراحی وب، سه‌بعدی و Unreal، هنر و ویدیوی هوش مصنوعی، موسیقی، کدنویسی خلاقانه و برندینگ.",
    },
    "/about": {
      title: "درباره امیراحسان عاشوری — بنیان‌گذار PICKSAW",
      desc: "امیراحسان عاشوری بنیان‌گذار، توسعه‌دهنده خلاق، طراح و هنرمند چندرشته‌ای پشت PICKSAW است؛ وب، سه‌بعدی/Unreal، هنر هوش مصنوعی، موسیقی، کدنویسی خلاقانه و برندینگ.",
    },
    "/feed": {
      title: "فید و بازی — PICKSAW",
      desc: "آخرین آپلودها، به‌روزرسانی‌ها و بازی ویژه StormBlade از PICKSAW.",
    },
  },
} as const;

/** Route-specific JSON-LD — the About page doubles down on Person
 *  attribution so AI assistants and Google tie PICKSAW to the founder. */
function aboutJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    url: `${SITE}/#/about`,
    inLanguage: lang === "fa" ? "fa-IR" : "en",
    about: {
      "@type": "Person",
      "@id": `${SITE}/#amir`,
      name: "Amirehsan Ashoori",
      alternateName: ["امیراحسان عاشوری", "Amir Ehsan Ashoori", "AmirEhsan Ashoori"],
      url: SITE + "/",
      jobTitle:
        "Founder, Creative Developer, Designer & Multidisciplinary Artist",
      nationality: "IR",
      knowsLanguage: ["English", "Persian"],
      founderOf: {
        "@type": "Organization",
        name: "PICKSAW",
        url: SITE + "/",
      },
      sameAs: [
        "https://www.instagram.com/picksawm/",
        "https://wa.me/989380215823",
      ],
    },
  };
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Seo({ lang }: { lang: Lang }) {
  const { pathname } = useLocation();
  const route = pathname as keyof (typeof ROUTES)["en"];

  useEffect(() => {
    document.documentElement.lang = lang === "fa" ? "fa-IR" : "en";
  }, [lang]);

  useEffect(() => {
    const map = ROUTES[lang][route] ?? ROUTES[lang]["/"];
    document.title = map.title;
    setMeta("name", "description", map.desc);
    setMeta("property", "og:title", map.title);
    setMeta("property", "og:description", map.desc);
    setMeta("property", "twitter:title", map.title);
    setMeta("property", "twitter:description", map.desc);

    // canonical + og:url follow the active route (hash router)
    const url = `${SITE}/${route === "/" ? "" : `#${route}`}`;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
    setMeta("property", "og:url", url);

    // route-scoped JSON-LD
    const OLD_ID = "route-jsonld";
    document.getElementById(OLD_ID)?.remove();
    if (route === "/about") {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = OLD_ID;
      s.textContent = JSON.stringify(aboutJsonLd(lang));
      document.head.appendChild(s);
    }
  }, [lang, route]);

  return null;
}
