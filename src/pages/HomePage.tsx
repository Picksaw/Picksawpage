import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import TemplateGrid from "../components/TemplateGrid";
import Reveal from "../components/Reveal";

interface HomePageProps {
  lang: Lang;
}

export default function HomePage({ lang }: HomePageProps) {
  const t = SITE_TEXTS[lang];

  return (
    <div className="relative">
      {/* Hero for templates */}
      <section className="relative flex min-h-[70svh] flex-col items-center justify-center px-4 py-28 text-center sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-[120px] animate-pulse-slow" />
        </div>

        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
            </span>
            <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
              {t.siteSubtitle}
            </span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {t.heroTitle}
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-xl">
            {t.heroSubtitle}
          </p>
        </Reveal>

        <Reveal delay={240}>
          <a
            href="#templates"
            className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-white/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-white/30"
          >
            {t.heroCta}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </Reveal>
      </section>

      {/* Templates section */}
      <div id="templates">
        <TemplateGrid lang={lang} />
      </div>
    </div>
  );
}
