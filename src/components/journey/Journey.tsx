import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";
import { TEMPLATES, type TemplateItem } from "../../config/templatesConfig";
import PreviewModal from "../PreviewModal";
import MagneticButton from "../ui/MagneticButton";
import { useSound } from "../../audio/SoundProvider";
import { getLenis } from "../../lib/lenis";
import CityScene from "./city/CityScene";
import { detectQuality } from "./lib/quality";
import { journey, resetJourney } from "./lib/journeyState";
import { HERO_PLOTS, JOURNEY_LENGTH } from "./lib/cityLayout";
import { setCityActive } from "../../lib/cityActive";
import ObservatoryUI from "./ObservatoryUI";
import { useMountedPanel } from "./useMountedPanel";

/**
 * Journey — The City of Templates.
 *
 * The visitor walks a storm-covered district. Scroll drives a dolly
 * down a curved street; each template is a building with its own
 * quarter, silhouette and entrance. The walk ends at the observatory.
 *
 * This component owns only the scroll → world binding and the DOM UI
 * that belongs to the world. Everything three-dimensional lives in
 * ./city, and everything shared per-frame lives in ./lib/journeyState.
 *
 * All original functionality is preserved: the template links, the
 * live PreviewModal, the CTAs, the focus bar and the hand-off to the
 * classic page sections when the walk ends.
 */

/** Scroll length: enough runway that the dolly never feels rushed. */
const SCROLL_VH = 100 + TEMPLATES.length * 108 + 140;

export default function Journey({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const spacerRef = useRef<HTMLDivElement>(null);
  const quality = useMemo(() => detectQuality(), []);

  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [faded, setFaded] = useState(false);
  const [selected, setSelected] = useState<TemplateItem | null>(null);
  const [phase, setPhase] = useState<"gate" | "street" | "observatory">("gate");
  /**
   * Bumped when the GPU takes the context away, to force a clean
   * remount of the whole scene graph once it comes back. Without this
   * a lost context leaves a permanently black canvas.
   */
  const [contextKey, setContextKey] = useState(0);
  /** mirrors for the keyboard handler, so it never needs re-binding */
  const focusedRef = useRef(-1);
  const focusPanel = useMountedPanel<HTMLDivElement>();
  const selectedRef = useRef<TemplateItem | null>(null);

  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    journey.reducedMotion = quality.reducedMotion;
    resetJourney();
    return () => resetJourney();
  }, [quality.reducedMotion]);

  /**
   * Tell the 2D storm canvas to stand down while the city is up.
   *
   * The district's WebGL canvas is opaque and covers the viewport, so
   * anything painting underneath it is invisible AND expensive — two
   * full-screen layers compositing every frame. The flag is dropped as
   * soon as the walk ends so the classic page keeps its storm.
   */
  useEffect(() => {
    setCityActive(!faded);
    return () => setCityActive(false);
  }, [faded]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // scroll maps directly onto metres of street
    journey.targetS = v * JOURNEY_LENGTH;
    journey.progress = v;

    // which plot is being framed?
    let idx = -1;
    let best = 34;
    HERO_PLOTS.forEach((p, i) => {
      const d = Math.abs(p.s - journey.targetS);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    setFocusedIdx((prev) => (prev === idx ? prev : idx));
    focusedRef.current = idx;
    journey.focused = idx;

    const endFaded = v > 0.985;
    setFaded((prev) => (prev === endFaded ? prev : endFaded));

    const ph = v < 0.06 ? "gate" : v > 0.93 ? "observatory" : "street";
    setPhase((prev) => (prev === ph ? prev : ph));
  });

  /** Scroll the runway to a given fraction of the walk. */
  const scrollToFraction = useCallback((frac: number, duration = 2.2) => {
    const el = spacerRef.current;
    if (!el) return;
    const y = el.offsetTop + el.offsetHeight * frac - window.innerHeight * 0.2;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const scrollToFirstPlot = useCallback(() => {
    const el = spacerRef.current;
    if (!el) return;
    const frac = HERO_PLOTS[0].s / JOURNEY_LENGTH;
    const y = el.offsetTop + el.offsetHeight * frac - window.innerHeight * 0.2;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 2.4 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const openItem = useCallback(
    (item: TemplateItem) => {
      blip("click");
      setSelected(item);
    },
    [blip]
  );

  /**
   * Keyboard navigation.
   *
   * The walk is a scroll experience, so it must be operable without a
   * pointer or a scroll wheel: arrows and page keys step between
   * buildings, Home/End jump to the gate and the observatory, and
   * Enter opens whatever is currently framed.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // never hijack typing, and never fight an open modal
      const el = document.activeElement as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (selectedRef.current) return;

      const plots = HERO_PLOTS;
      const cur = journey.targetS;
      let handled = true;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown": {
          const next = plots.find((p) => p.s > cur + 8);
          scrollToFraction((next ? next.s : JOURNEY_LENGTH) / JOURNEY_LENGTH, 1.6);
          break;
        }
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp": {
          const prev = [...plots].reverse().find((p) => p.s < cur - 8);
          scrollToFraction((prev ? prev.s : 0) / JOURNEY_LENGTH, 1.6);
          break;
        }
        case "Home":
          scrollToFraction(0, 1.8);
          break;
        case "End":
          scrollToFraction(1, 2.4);
          break;
        case "Enter":
        case " ": {
          const idx = focusedRef.current;
          if (idx >= 0 && TEMPLATES[idx]) openItem(TEMPLATES[idx]);
          else handled = false;
          break;
        }
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openItem, scrollToFraction]);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const focusedItem = focusedIdx >= 0 ? TEMPLATES[focusedIdx] : null;

  return (
    <>
      {/* the scroll runway that drives the walk */}
      <div
        ref={spacerRef}
        id="templates"
        aria-hidden
        style={{ height: `${SCROLL_VH}vh` }}
      />

      {/* the district */}
      <div
        className={`fixed inset-0 z-[2] transition-opacity duration-700 ${
          faded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        style={{
          pointerEvents: faded ? "none" : undefined,
          visibility: faded ? "hidden" : "visible",
        }}
        aria-hidden={faded}
      >
        <Canvas
          dpr={quality.dpr}
          frameloop={faded ? "never" : "always"}
          shadows={quality.shadows}
          camera={{
            position: [0, 1.7, 0],
            fov: window.innerWidth / window.innerHeight < 0.8 ? 62 : 46,
            near: 0.35,
            far: quality.viewDistance * 2.2,
          }}
          gl={{
            antialias: quality.antialias,
            alpha: false,
            powerPreference: "high-performance",
            stencil: false,
            depth: true,
          }}
          style={{ background: "#05070d", touchAction: "pan-y" }}
          onPointerMissed={() => {
            document.body.style.cursor = "";
          }}
        >
          <CityScene
            key={contextKey}
            quality={quality}
            onOpenTemplate={openItem}
            onContextRestored={() => setContextKey((k) => k + 1)}
          />
        </Canvas>
      </div>

      {/* ── gate: the scroll invitation ── */}
      <AnimatePresence>
        {phase === "gate" && !faded && (
          <motion.div
            key="gate-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8, duration: 1 } }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-6 px-4 pb-12"
          >
            <div className="glass-strong bolt-lit inline-flex items-center gap-2 rounded-full px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
              </span>
              <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
                {t.siteSubtitle}
              </span>
            </div>

            <div className="pointer-events-auto flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticButton onClick={scrollToFirstPlot}>
                {t.heroCta}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton variant="ghost" href="#/feed">
                {t.exploreButton}
              </MagneticButton>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
                {t.scrollHint}
              </span>
              <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
                <span className="h-2 w-1 animate-scroll-dot rounded-full bg-electric/80" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── the focused building's action bar ── */}
      <AnimatePresence>
        {focusedItem && phase === "street" && !faded && !selected && (
          <motion.div
            key="focus-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center px-4"
          >
            <div
              ref={focusPanel.ref}
              onPointerMove={focusPanel.onPointerMove}
              onPointerLeave={focusPanel.onPointerLeave}
              className="panel-mounted bolt-lit parallax-host pointer-events-auto flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3 backdrop-blur-md sm:gap-6 sm:px-6"
            >
              <div
                className="parallax-layer text-start"
                style={{ ["--depth" as string]: "3px" }}
                dir={lang === "fa" ? "rtl" : "ltr"}
              >
                <div className="text-sm font-bold text-white sm:text-base">
                  {focusedItem.title[lang] || focusedItem.name.en}
                </div>
                <div className="text-[11px] text-slate-400" dir="ltr">
                  {(() => {
                    try {
                      return new URL(focusedItem.url).hostname;
                    } catch {
                      return focusedItem.url;
                    }
                  })()}
                </div>
              </div>
              <MagneticButton
                onClick={() => openItem(focusedItem)}
                className="!rounded-xl !px-5 !py-2.5"
                ariaLabel={`${t.openLiveLabel} ${focusedItem.name.en}`}
              >
                {t.openLiveLabel}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── the observatory finale ── */}
      <ObservatoryUI lang={lang} visible={phase === "observatory" && !faded && !selected} />

      {/* ── skip the cinematic — always reachable, never in the way ── */}
      {phase !== "observatory" && !faded && (
        <button
          type="button"
          onClick={() => scrollToFraction(1, 1.2)}
          className="glass fixed bottom-4 end-4 z-30 rounded-full px-4 py-2 text-[11px] font-medium tracking-wide text-slate-300 opacity-40 transition-opacity hover:opacity-100 focus-visible:opacity-100"
          title={t.skipCinematicHint}
        >
          {t.skipCinematic}
        </button>
      )}

      {/* ── the template itself — scroll belongs to it now ── */}
      <AnimatePresence>
        {selected && (
          <PreviewModal item={selected} lang={lang} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
