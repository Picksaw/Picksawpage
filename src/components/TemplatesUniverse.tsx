import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import { TEMPLATES, type TemplateItem } from "../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../config/templateImages";
import Reveal from "./Reveal";
import TiltCard from "./ui/TiltCard";
import PreviewModal from "./PreviewModal";
import { useSound } from "../audio/SoundProvider";
import { cn } from "../utils/cn";

/**
 * TemplatesUniverse — the classic grid gallery.
 * Serves as the guaranteed fallback when WebGL or motion isn't
 * available (the 3D Journey replaces it on capable browsers).
 * Every card: tilt + glare physics, hover-400ms lazy live preview
 * that auto-scrolls, badges, and the cinematic fullscreen modal.
 */

function domainOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Lazy auto-scrolling live preview (mounted only while hovered).
 *  Travel is capped so it can never scroll past a page's end. */
function LivePreview({ url, duration = 20 }: { url: string; duration?: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {!loaded && <div className="skeleton absolute inset-0" />}
      <iframe
        src={url}
        title={`Live preview of ${domainOf(url)}`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="preview-autoscroll h-[200%] w-full border-0 bg-white"
        style={{ "--preview-duration": `${duration}s`, "--preview-shift": "-45%" } as React.CSSProperties}
        tabIndex={-1}
      />
    </div>
  );
}

function TemplateCard({
  item,
  lang,
  onOpen,
}: {
  item: TemplateItem;
  lang: Lang;
  onOpen: (item: TemplateItem) => void;
}) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const startLive = () => {
    if (hoverTimer !== null) return;
    setHoverTimer(window.setTimeout(() => setLive(true), 400));
  };
  const stopLive = () => {
    if (hoverTimer !== null) {
      window.clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setLive(false);
  };

  const badges = [t.badgeResponsive, t.badgeBilingual, t.badgeOptimized];

  return (
    <TiltCard as="article" maxTilt={8} className="h-full rounded-3xl">
      <button
        type="button"
        onClick={() => {
          blip("click");
          onOpen(item);
        }}
        onMouseEnter={() => {
          startLive();
          blip("hover");
        }}
        onMouseLeave={stopLive}
        onFocus={startLive}
        onBlur={stopLive}
        aria-label={`${item.name[lang] ?? item.name.en} — ${t.openLiveLabel}`}
        className="glass bolt-lit group relative block h-full w-full overflow-hidden rounded-3xl text-start shadow-2xl shadow-black/40"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={TEMPLATE_IMAGE_MAP[item.imageKey] ?? `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`}
            alt={item.title[lang] || item.name.en}
            loading="lazy"
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-all duration-700",
              live ? "scale-105 opacity-0" : "opacity-100 group-hover:scale-[1.04]"
            )}
          />
          {live && <LivePreview url={item.url} />}

          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-electric/0 transition-all duration-700 group-hover:via-white/8 group-hover:to-electric/12"
          />
          <span className="glass-strong absolute start-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-electric">
            {item.name.en}
          </span>
          <AnimatePresence>
            {live && (
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass-strong absolute bottom-3 start-3 z-10 flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-medium text-slate-300"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-electric opacity-70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-electric" />
                </span>
                {t.livePreviewNote}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="relative px-5 py-5">
          <h3 className="bolt-text text-lg font-bold tracking-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
            {item.title[lang] || item.title.en}
          </h3>
          <motion.div
            initial={false}
            className="mt-2 flex flex-wrap gap-1.5 opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:mt-3 group-hover:opacity-100"
          >
            {badges.map((b) => (
              <span
                key={b}
                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300"
              >
                {b}
              </span>
            ))}
          </motion.div>
          <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-electric transition-all duration-500 group-hover:gap-3 group-hover:text-electric-soft">
            {t.openLiveLabel}
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </button>
    </TiltCard>
  );
}

export default function TemplatesUniverse({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const [selected, setSelected] = useState<TemplateItem | null>(null);

  return (
    <section id="templates" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="bolt-text text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.templatesTitle}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
              {t.templatesSubtitle}
            </p>
          </Reveal>
        </div>

        {/* clean gallery order — every card identical, evenly spaced */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((item, i) => (
            <Reveal key={item.id} delay={(i % 3) * 90} className="h-full">
              <TemplateCard item={item} lang={lang} onOpen={setSelected} />
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <PreviewModal item={selected} lang={lang} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}
