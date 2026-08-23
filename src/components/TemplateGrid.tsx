import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import { TEMPLATES } from "../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../config/templateImages";
import Reveal from "./Reveal";

interface TemplateGridProps {
  lang: Lang;
}

export default function TemplateGrid({ lang }: TemplateGridProps) {
  const t = SITE_TEXTS[lang];

  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.templatesTitle}
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
              {t.templatesSubtitle}
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((item, i) => {
            const imgUrl = TEMPLATE_IMAGE_MAP[item.imageKey] || "/images/template-portfolio.png";
            return (
              <Reveal key={item.id} delay={i * 80}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/10"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={imgUrl}
                      alt={item.title[lang] || item.name[lang]}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300 backdrop-blur-md">
                      {item.name[lang] || item.name.en}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col px-5 py-5">
                    <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-cyan-200">
                      {item.title[lang] || item.title.en}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {item.description[lang] || item.description.en}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 transition-all group-hover:gap-3">
                      View site
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
