import { Suspense, lazy, useMemo } from "react";
import { motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import BrandMark from "../components/BrandMark";
import MagneticButton from "../components/ui/MagneticButton";
import TemplatesUniverse from "../components/TemplatesUniverse";
import TrustStats from "../components/TrustStats";
import ProcessTimeline from "../components/ProcessTimeline";
import ContactSection from "../components/ContactSection";
import { scrollToTarget } from "../lib/lenis";
import { shouldUseRichJourney } from "../lib/webgl";

const Journey = lazy(() => import("../components/journey/Journey"));

interface HomePageProps {
  lang: Lang;
}

/** Word-by-word cinematic reveal — never character-by-character. */
function KineticTitle({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className="inline-block">
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="inline-block overflow-hidden pb-1 align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: delay + i * 0.09,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default function HomePage({ lang }: HomePageProps) {
  const t = SITE_TEXTS[lang];

  // The scroll-driven WebGL journey is reserved for desktop-class input.
  // Phones/tablets get the native DOM layout: much faster first load and
  // no fixed WebGL canvas fighting the browser during momentum scroll.
  const journey = useMemo(() => shouldUseRichJourney(), []);

  return (
    <div className="relative">
      {journey ? (
        /* ═══ THE 3D JOURNEY — P → ring → dive → gallery walk ═══ */
        <Suspense fallback={<div id="top" className="min-h-[100svh]" aria-hidden />}>
          <Journey lang={lang} />
        </Suspense>
      ) : (
        /* ═══ CLASSIC HERO (fallback: no WebGL / reduced motion) ═══ */
        <section
          id="top"
          className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-28 text-center sm:px-6"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric/8 blur-[130px] animate-pulse-slow" />
          </div>

          <div className="relative z-10 grid w-full max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-start">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="glass bolt-lit mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
                </span>
                <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
                  {t.siteSubtitle}
                </span>
              </motion.div>

              <h1 className="bolt-text mx-auto max-w-3xl text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-6xl md:text-7xl lg:mx-0">
                <KineticTitle text={t.heroTitle} delay={0.25} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-xl lg:mx-0"
              >
                {t.heroSubtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start"
              >
                <MagneticButton onClick={() => scrollToTarget("#templates")}>
                  {t.heroCta}
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M19 9l-7 7-7-7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </MagneticButton>
                <MagneticButton variant="ghost" href="#/feed">
                  {t.exploreButton}
                </MagneticButton>
              </motion.div>
            </div>

            <motion.div
              aria-hidden
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.9 }}
              className="relative mx-auto h-44 w-44 sm:h-56 sm:w-56 lg:h-[340px] lg:w-[340px]"
            >
              <div className="absolute inset-0 rounded-full bg-electric/10 blur-3xl" />
              <div className="absolute inset-5 rounded-full border border-electric/10" />
              <BrandMark fill />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
              {t.scrollHint}
            </span>
            <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
              <span className="h-2 w-1 animate-scroll-dot rounded-full bg-electric/80" />
            </span>
          </motion.div>
        </section>
      )}

      {/* Journey is now the entire website */}
      {!journey && (
        <>
          <TemplatesUniverse lang={lang} />
          <TrustStats lang={lang} />
          <ProcessTimeline lang={lang} />
          <ContactSection lang={lang} />
        </>
      )}
    </div>
  );
}
