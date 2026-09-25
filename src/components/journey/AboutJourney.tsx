import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { type Lang } from "../../config/siteTexts";
import ThemeRig from "./ThemeRig";
import AssetPrimer from "./AssetPrimer";
import GhostCard from "./GhostCard";
import { CorridorScene } from "./Corridor";
import { aboutLayout, layerOpacity } from "./path";
import { getLenis } from "../../lib/lenis";
import { registerPerfGl } from "../../lib/perfProbe";
import { useJourneyDpr } from "../../lib/renderQuality";
import { useThemeId } from "../../lib/themeStore";
import { SITE_TEXTS } from "../../config/siteTexts";

/**
 * AboutJourney — the standalone /about walk.
 *
 * Same neon city engine as the home journey, but every station is a
 * portrait FRAMED WINDOW (like the template paintings) that fits the
 * viewport on phone and PC with no inner scrolling. The outer page scroll
 * walks the visitor from window to window down the boulevard toward the
 * Milad Tower finale.
 */
export default function AboutJourney({
  lang,
  introDone = true,
}: {
  lang: Lang;
  /** the opaque intro loader covers the canvas — idle the loop while up */
  introDone?: boolean;
}) {
  const t = SITE_TEXTS[lang];
  const themeId = useThemeId();
  const scrollHint = themeId === "storm" ? t.scrollHint : t.scrollHintDay;
  const spacerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);

  // -1 while the A ghost card is framed; 0..5 for the panes
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [throughFade, setThroughFade] = useState(0);

  const { scrollYProgress } = useScroll({
    target: spacerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progressRef.current = v;
    const idx = aboutLayout.focusedIndex(v);
    setFocusedIdx((prev) => (prev === idx ? prev : idx));

    // soft fade when travelling THROUGH a window pane
    const camZ = aboutLayout.cameraZ(v);
    const pZ = aboutLayout.frameZ(idx);
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
  });

  const scrollToFrame = useCallback((i: number) => {
    const el = spacerRef.current;
    const lenis = getLenis();
    // station 0 is the A card, so pane i stands at station i + 1
    const frac = (i + 1) / (aboutLayout.stations.length - 1);
    if (el && lenis) {
      lenis.scrollTo(el.offsetTop + el.offsetHeight * frac, { duration: 1.6 });
    } else if (el) {
      window.scrollTo({ top: el.offsetTop + el.offsetHeight * frac, behavior: "smooth" });
    }
  }, []);

  // Perf: same adaptive pixel budget as the home walk, with the DPR cap
  // tracking the device (see renderQuality.ts) — sharp on retina screens,
  // stepped down within seconds when the framerate can't hold.
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;
  const dpr = useJourneyDpr(introDone);

  return (
    <>
      <AssetPrimer />

      {/* scroll length for the About walk */}
      <div
        ref={spacerRef}
        id="about-walk"
        aria-hidden
        style={{ height: `${aboutLayout.spacerVh}vh` }}
      />

      <div className="fixed inset-0 z-[2]" dir="ltr" style={{ touchAction: "pan-y" }}>
        <Canvas
          dpr={dpr}
          // While the opaque intro loader covers the screen there is
          // nothing to animate — render on demand only (same as the
          // home walk): the loader used to burn GPU behind itself.
          frameloop={introDone ? "always" : "demand"}
          camera={{
            position: [0, 0, aboutLayout.stations[0]],
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
          style={{ background: "transparent", touchAction: "pan-y" }}
          onCreated={(state) => registerPerfGl("about", state.gl)}
        >
          <ThemeRig />
          {/* the walk opens on its own ghost card, like the home walk */}
          <GhostCard variant="a" />
          <CorridorScene
            progressRef={progressRef}
            focusedIdx={focusedIdx}
            lang={lang}
            onOpen={() => {}}
            layout={aboutLayout}
          />
        </Canvas>
      </div>

      {/* fade-through overlays, same behaviour as the home walk */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[3]"
        style={{
          opacity: throughFade,
          background:
            "radial-gradient(ellipse at center, rgba(4,6,13,0) 28%, rgba(4,6,13,0.55) 68%, rgba(4,6,13,0.92) 100%)",
          backdropFilter: throughFade > 0.15 ? `blur(${throughFade * 8}px)` : "none",
          WebkitBackdropFilter: throughFade > 0.15 ? `blur(${throughFade * 8}px)` : "none",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[3] h-[18vh] sm:h-[14vh]"
        style={{
          opacity: throughFade,
          background: "linear-gradient(to bottom, rgba(4,6,13,0.92) 0%, rgba(4,6,13,0) 100%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[3] h-[22vh] sm:h-[16vh]"
        style={{
          opacity: throughFade,
          background: "linear-gradient(to top, rgba(4,6,13,0.92) 0%, rgba(4,6,13,0) 100%)",
        }}
      />

      {/* scroll invitation — on the A card, before the panes begin */}
      <AnimatePresence>
        {focusedIdx === -1 && (
          <motion.div
            key="about-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none fixed inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
              {scrollHint}
            </span>
            <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
              <span className="h-2 w-1 animate-scroll-dot rounded-full bg-electric/80" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* pane dots */}
      <div className="fixed end-4 top-1/2 z-10 hidden -translate-y-1/2 flex-col gap-2.5 sm:flex">
        {Array.from({ length: aboutLayout.frameCount }, (_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`About ${i + 1}`}
            onClick={() => scrollToFrame(i)}
            className={`h-2 w-2 rounded-full border transition-all ${
              focusedIdx === i
                ? "scale-125 border-electric bg-electric shadow-[0_0_10px_rgba(79,216,255,.8)]"
                : "border-white/30 bg-transparent hover:border-white/70"
            }`}
          />
        ))}
      </div>
    </>
  );
}
