import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";
import { TEMPLATES, type TemplateItem } from "../../config/templatesConfig";
import PEmblem from "./PEmblem";
import AssetPrimer from "./AssetPrimer";
import {
  CorridorScene,
  focusedIndex,
  stations,
  cameraZ,
  paintingZ,
  layerOpacity,
} from "./Corridor";
import PreviewModal from "../PreviewModal";
import MagneticButton from "../ui/MagneticButton";
import { useSound } from "../../audio/SoundProvider";
import { getLenis } from "../../lib/lenis";
import { registerPerfGl } from "../../lib/perfProbe";

/**
 * Journey — Picksaw's 3D layers.
 *
 *   Layer 0  the storm canvas (behind everything, as always)
 *   Layer 1  the 3D P + the energy ring forming around it; lightning
 *            arcs strike and charge the ring
 *   Layer 2  the "Website Templates" headline as its own layer in space
 *   Layer 3  scrolling dollies FORWARD through the ring, past the
 *            headline, into the neon city gallery — one solo painting
 *            per station, nothing visible before or after it
 *   Layer 4  click a painting (or the Open button) → fullscreen live
 *            preview where scrolling moves the template, not Picksaw
 *
 * A tall invisible spacer drives the scroll length; the camera follows
 * progress. When the walk ends, the canvas fades and the classic page
 * sections continue underneath.
 */

export default function Journey({
  lang,
  introDone = true,
}: {
  lang: Lang;
  /** the opaque intro loader covers the canvas — idle the loop while up */
  introDone?: boolean;
}) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const spacerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [selected, setSelected] = useState<TemplateItem | null>(null);
  /** 'p' while framing the P, 'headline' on the text layer, then 'gallery'.
   *  State-driven (not transform-driven) so station UI can never linger. */
  const [phase, setPhase] = useState<"p" | "headline" | "gallery">("p");
  // fade overlay that appears when we go *further* into a painting — it
  // softens the frame before it covers the whole phone screen
  const [throughFade, setThroughFade] = useState(0);

  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
    const idx = focusedIndex(v);
    setFocusedIdx((prev) => (prev === idx ? prev : idx));
    // station UI phases: u<0.6 → P, then headline, then gallery (solo)
    const u = v * (stations.length - 1);
    const ph = u < 0.6 ? "p" : u < 1.45 ? "headline" : "gallery";
    setPhase((prev) => (prev === ph ? prev : ph));

    // through-fade: when camera is inside fade-out zone of focused painting
    // (d 2.8 → -0.8), drive a soft overlay that fades painting into fog.
    if (idx >= 0) {
      const camZ = cameraZ(v);
      const pZ = paintingZ(idx);
      const d = camZ - pZ;
      const op = layerOpacity(camZ, pZ);
      if (d < 2.8 && d > -0.8) {
        const fade = 1 - op;
        setThroughFade((prev) => {
          const next = prev + (fade - prev) * 0.22;
          return Math.abs(next - prev) < 0.01 ? fade : next;
        });
      } else {
        setThroughFade((prev) => (prev === 0 ? 0 : prev * 0.82));
      }
    } else {
      setThroughFade((prev) => (prev === 0 ? 0 : prev * 0.82));
    }
  });

  const scrollToFirstPainting = useCallback(() => {
    const el = spacerRef.current;
    const lenis = getLenis();
    if (el && lenis) {
      // station 2 = first painting (station 1 is the headline layer)
      const y =
        el.offsetTop +
        (el.offsetHeight * 2) / (stations.length - 1) -
        window.innerHeight * 0.25;
      lenis.scrollTo(y, { duration: 2.1 });
    } else if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // when the modal opens, exit pointer interactions on the canvas are gone
  const openItem = useCallback((item: TemplateItem) => {
    blip("click");
    setSelected(item);
  }, [blip]);

  const focusedItem = focusedIdx >= 0 ? TEMPLATES[focusedIdx] : null;

  // Perf: pixel budget. Mobile GPUs are fill-rate bound — the storm 2D
  // canvas + this canvas both fill the screen. 1.25× + no MSAA on mobile
  // (the scene is fog-soft; AA barely matters) vs 1.5× + MSAA on desktop.
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  // Adaptive resolution: start at the full 1.25× cap; if the device
  // can't hold the framerate, PerformanceMonitor steps the backing store
  // down (0.25 steps, floor 0.75 — a subtle soften, never a look change)
  // and back up again when there's headroom. Strong phones never dip.
  const DPR_MAX = 1.25;
  const DPR_MIN = 0.75;
  const [dpr, setDpr] = useState(DPR_MAX);

  return (
    <>
      {/* starts the city's models + road textures right after
          first paint (shared loader cache, byte-level progress) */}
      <AssetPrimer />

      {/* scroll length for the walk: P → headline → 6 paintings →
          the long finale boulevard that carries the camera past the
          last painting toward the distant Azadi Tower */}
      <div
        ref={spacerRef}
        id="templates"
        aria-hidden
        style={{ height: `${100 + 100 + TEMPLATES.length * 92 + 55 + 300}vh` }}
      />

      {/* the 3D world — Journey never fades out: it is the entire website.
          dir="ltr" keeps drei <Html> overlay centering geometry LTR even when
          the page is RTL; framed section windows set their own rtl content dir. */}
      <div
        className="fixed inset-0 z-[2]"
        dir="ltr"
        style={{
          // On touch devices the canvas must not trap vertical scroll —
          // the focus bar is the tap target, not the painting mesh itself.
          // Desktop keeps pointer events for hover.
          pointerEvents: isMobile ? "none" : "auto",
          touchAction: "pan-y",
        }}
      >
        <Canvas
          dpr={dpr} // capped everywhere — 4K desktops are fill-rate bound
          // While the live-preview modal or the intro loader covers the
          // screen there is nothing to animate — render on demand only
          // (the last presented frame stays up). Phones stop burning GPU
          // on a hidden canvas during the most thermal moment: loading.
          frameloop={selected || !introDone ? "demand" : "always"}
          camera={{
            position: [0, 0, stations[0]],
            // portrait phones need a wider lens or the city never enters
            // the narrow horizontal field of view
            fov: window.innerWidth / window.innerHeight < 0.8 ? 58 : 42,
            near: 0.1,
            far: 90,
          }}
          gl={{
            antialias: !isMobile,
            alpha: true,
            stencil: false,
            powerPreference: "high-performance",
          }}
          style={{
            background: "transparent",
            touchAction: "pan-y",
            pointerEvents: isMobile ? "none" : "auto",
          }}
          onCreated={(state) => registerPerfGl("journey", state.gl)}
          onPointerMissed={() => {
            document.body.style.cursor = "";
          }}
        >
          <PerformanceMonitor
            ms={500}
            iterations={6}
            flipflops={4}
            onDecline={() => setDpr((d) => Math.max(DPR_MIN, +(d - 0.25).toFixed(2)))}
            onIncline={() => setDpr((d) => Math.min(DPR_MAX, +(d + 0.1).toFixed(2)))}
            onFallback={() => setDpr(DPR_MIN)}
          />
          <fog attach="fog" args={["#06080f", 12, 66]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[-3, 5, 4]} intensity={1.4} color="#eaf6ff" />
          <pointLight position={[2.6, -0.6, 3.4]} intensity={22} color="#4fd8ff" />
          <pointLight position={[-3, -2.4, -2]} intensity={9} color="#2a6cff" />

          <PEmblem />
          <CorridorScene
            progressRef={progressRef}
            focusedIdx={focusedIdx}
            lang={lang}
            onOpen={openItem}
          />
        </Canvas>
      </div>

      {/* ── Fade-through overlay — when we go further into a painting it
           softly fades the frame into the city fog, so on phones the
           painting never stays opaque covering the whole screen.
           Pointer-events none so scroll is never blocked. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          opacity: throughFade,
          background:
            "radial-gradient(ellipse at center, rgba(4,6,13,0) 28%, rgba(4,6,13,0.55) 68%, rgba(4,6,13,0.92) 100%)",
          backdropFilter: throughFade > 0.15 ? `blur(${throughFade * 8}px)` : "none",
          WebkitBackdropFilter:
            throughFade > 0.15 ? `blur(${throughFade * 8}px)` : "none",
        }}
      />
      {/* extra top/bottom feather for phones — hides the hard edge when
          the painting fills the screen */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[3] h-[18vh] sm:h-[14vh]"
        style={{
          opacity: throughFade,
          background:
            "linear-gradient(to bottom, rgba(4,6,13,0.92) 0%, rgba(4,6,13,0) 100%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[3] h-[22vh] sm:h-[16vh]"
        style={{
          opacity: throughFade,
          background:
            "linear-gradient(to top, rgba(4,6,13,0.92) 0%, rgba(4,6,13,0) 100%)",
        }}
      />

      {/* ── P layer UI — just the scroll invitation ── */}
      <AnimatePresence>
        {phase === "p" &&  (
          <motion.div
            key="p-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.2, duration: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="pointer-events-none fixed inset-x-0 safe-bottom-lg z-10 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
              {t.scrollHint}
            </span>
            <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
              <span className="h-2 w-1 animate-scroll-dot rounded-full bg-electric/80" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── headline layer UI — badge + CTAs live HERE (the layer after
             the P) and only here; the gallery never shows them ── */}
      <AnimatePresence>
        {phase === "headline" &&  (
          <motion.div
            key="headline-ui"
            initial={{ opacity: 0, y: 46 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, y: 34, transition: { duration: 0.35 } }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex flex-col items-center gap-5 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:pb-14"
          >
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.5 } }}
              className="glass-strong bolt-lit inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-electric opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-electric" />
              </span>
              <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
                {t.siteSubtitle}
              </span>
            </motion.div>

            <div className="pointer-events-auto flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticButton onClick={scrollToFirstPainting}>
                {t.heroCta}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton variant="ghost" href="#/feed">
                {t.exploreButton}
              </MagneticButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer: focus bar — the solo painting's action ── */}
      <AnimatePresence>
        {focusedItem &&  !selected && (
          <motion.div
            key="focus-bar"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1 - throughFade * 0.85, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            style={{ opacity: 1 - throughFade * 0.85 }}
            className={[
              "pointer-events-none fixed inset-x-0 z-20 flex justify-center px-4",
              // phones: the action bar lifts clear of the storm orb dock
              // (14 = orb 56px + dock bottom 20px + breathing room)
              "bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:bottom-6",
            ].join(" ")}
          >
            <div className="glass-strong bolt-lit pointer-events-auto flex items-center gap-4 rounded-2xl px-4 py-3 sm:gap-6 sm:px-6">
              <div className="text-start" dir={lang === "fa" ? "rtl" : "ltr"}>
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

      {/* ── Layer: the template itself — scroll belongs to it now ── */}
      <AnimatePresence>
        {selected && (
          <PreviewModal item={selected} lang={lang} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
