import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import { TEMPLATES, type TemplateItem } from "../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../config/templateImages";
import Reveal from "./Reveal";
import TiltCard from "./ui/TiltCard";
import MagneticButton from "./ui/MagneticButton";
import { useSound } from "../audio/SoundProvider";
import { getLenis } from "../lib/lenis";
import { cn } from "../utils/cn";

/**
 * TemplatesUniverse — living products, not static cards.
 *
 * Masonry rhythm: every third template is featured (large card),
 * mixed with regular cards — a curated gallery, not a grid.
 *
 * Hover (after 400ms): the real website loads lazily behind the image
 * and slowly auto-scrolls; the title lifts, tech badges fade in.
 *
 * Click: cinematic fullscreen preview — the card expands (shared
 * layoutId), the page blurs behind, a browser frame assembles, the
 * live site auto-scrolls, and a CTA fades in. Rain never stops.
 */

function imgUrl(item: TemplateItem) {
  return `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`;
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Lazy auto-scrolling live preview (iframe is mounted only when `live`).
 *  Travel is capped at 45% of a 200%-tall viewport so it can never
 *  scroll past the bottom of a page and expose empty space. */
function LivePreview({ url, duration = 22 }: { url: string; duration?: number }) {
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

interface CardProps {
  item: TemplateItem;
  lang: Lang;
  hidden: boolean;
  onOpen: (item: TemplateItem) => void;
  layoutKey: string;
}

function TemplateCard({ item, lang, hidden, onOpen, layoutKey }: CardProps) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const [hoverTimer, setHoverTimer] = useState<number | null>(null);
  const [live, setLive] = useState(false);

  const startLive = () => {
    if (hoverTimer !== null) return;
    const id = window.setTimeout(() => setLive(true), 400);
    setHoverTimer(id);
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
    <motion.div
      layoutId={layoutKey}
      className={cn(
        "h-full transition-opacity",
        hidden && "opacity-0"
      )}
      style={{ visibility: hidden ? "hidden" : undefined }}
    >
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
          {/* media */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <img
              src={TEMPLATE_IMAGE_MAP[item.imageKey] ?? imgUrl(item)}
              alt={item.title[lang] || item.name.en}
              loading="lazy"
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-all duration-700",
                live ? "scale-105 opacity-0" : "opacity-100 group-hover:scale-[1.04]"
              )}
            />
            {live && <LivePreview url={item.url} duration={20} />}

            {/* lightning reflection sweep */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-electric/0 transition-all duration-700 group-hover:via-white/8 group-hover:to-electric/12"
            />

            {/* name chip */}
            <span className="glass-strong absolute start-3 top-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-electric">
              {item.name.en}
            </span>

            {/* live chip */}
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

          {/* body — lifts on hover */}
          <div className="relative px-5 py-5">
            <motion.h3
              className="text-lg font-bold tracking-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 bolt-text"
            >
              {item.title[lang] || item.title.en}
            </motion.h3>

            {/* badges fade in on hover */}
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

            {/* open action */}
            <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-electric transition-all duration-500 group-hover:gap-3 group-hover:text-electric-soft">
              {t.openLiveLabel}
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </button>
      </TiltCard>
    </motion.div>
  );
}

/** Cinematic fullscreen preview modal. */
function PreviewModal({ item, lang, onClose }: { item: TemplateItem; lang: Lang; onClose: () => void }) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    getLenis()?.stop();
    document.body.style.overflow = "hidden"; // native-scroll fallback
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      getLenis()?.start();
      restoreFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name.en} — ${t.openLiveLabel}`}
    >
      {/* blurred backdrop — rain continues behind */}
      <motion.button
        type="button"
        aria-label={t.closeLabel}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-storm-950/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* the card expands into a browser frame */}
      <motion.div
        layoutId={`tpl-${item.id}`}
        className="glass-strong bolt-lit relative w-full max-w-6xl overflow-hidden rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
        transition={{ type: "spring", stiffness: 210, damping: 26 }}
      >
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="glass flex-1 truncate rounded-lg px-3 py-1 text-xs text-slate-400" dir="ltr">
            <span className="text-electric">https://</span>
            {domainOf(item.url)}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              blip("click");
              onClose();
            }}
            aria-label={t.closeLabel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:rotate-90 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* live site — auto-scrolling */}
        <div className="relative aspect-[16/10] max-h-[68vh] w-full overflow-hidden bg-white">
          <LivePreview url={item.url} duration={28} />
        </div>

        {/* CTA fades in */}
        <motion.div
          className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-sm text-slate-400">
            <span className="font-bold text-white">{item.name.en}</span>
            {" — "}
            {item.title[lang] || item.title.en}
          </div>
          <MagneticButton
            href={item.url}
            variant="primary"
            className="!px-6 !py-3"
            ariaLabel={`${t.openLiveLabel} ${item.name.en}`}
          >
            {t.openLiveLabel}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>
        </motion.div>
      </motion.div>
    </motion.div>
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
              <TemplateCard
                item={item}
                lang={lang}
                hidden={selected?.id === item.id}
                onOpen={setSelected}
                layoutKey={`tpl-${item.id}`}
              />
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
