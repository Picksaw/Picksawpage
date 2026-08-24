import { useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionValueEvent } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import Reveal from "./Reveal";
import { cn } from "../utils/cn";

/**
 * ProcessTimeline — Discover → Design → Personalize → Launch.
 * A current travels between floating nodes as you scroll through the
 * section; each node lights up when the current reaches it, and hover
 * expands the stage card.
 */
export default function ProcessTimeline({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.8", "end 0.55"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 18 });

  const dotLeft = useTransform(progress, [0, 1], ["2%", "98%"]);
  const lineScale = progress;
  const [lit, setLit] = useState(0);

  useMotionValueEvent(progress, "change", (v) => {
    const count = Math.min(4, Math.max(0, Math.floor(v * 4.4)));
    setLit((prev) => (prev === count ? prev : count));
  });

  const stages = [
    { title: t.stageDiscoverTitle, desc: t.stageDiscoverDesc, glyph: "M11 4a7 7 0 0 1 7 7m-7-7a7 7 0 0 0-7 7m7-7v2m7 5a7 7 0 0 1-7 7m7-7h-2m-5 7a7 7 0 0 1-7-7m7 7v-2m-7-5h2" },
    { title: t.stageDesignTitle, desc: t.stageDesignDesc, glyph: "M4 20 20 4m0 0v5m0-5h-5M4 4l5 5" },
    { title: t.stagePersonalizeTitle, desc: t.stagePersonalizeDesc, glyph: "M12 20.5c3-1.5 6-4.6 6-8.6C18 7.5 15.3 4 12 4S6 7.5 6 11.9c0 4 3 7.1 6 8.6Zm0-7.7a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" },
    { title: t.stageLaunchTitle, desc: t.stageLaunchDesc, glyph: "M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" },
  ];

  return (
    <section ref={sectionRef} className="relative py-24 sm:py-32" aria-label={t.processTitle}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <Reveal>
            <h2 className="bolt-text text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.processTitle}
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
              {t.processSubtitle}
            </p>
          </Reveal>
        </div>

        <div className="relative">
          {/* the rail */}
          <div className="absolute start-0 end-0 top-9 hidden h-px bg-white/10 lg:block" aria-hidden>
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-electric/40 via-electric to-white"
              style={{ scaleX: lineScale }}
            />
            {/* traveling spark */}
            <motion.div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white"
              style={{
                left: dotLeft,
                boxShadow: "0 0 12px 3px rgba(79,216,255,0.9), 0 0 30px 8px rgba(79,216,255,0.4)",
              }}
            />
          </div>
          {/* vertical rail on mobile */}
          <div className="absolute bottom-4 start-[27px] top-4 w-px bg-white/10 lg:hidden" aria-hidden>
            <motion.div
              className="w-full origin-top bg-gradient-to-b from-electric/40 via-electric to-white"
              style={{ scaleY: lineScale }}
            />
          </div>

          <ol className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {stages.map((stage, i) => {
              const energized = lit > i;
              const isLast = i === stages.length - 1;
              return (
                <li key={stage.title} className="relative ps-16 lg:ps-0">
                  {/* node */}
                  <div className="absolute start-0 top-1 lg:relative lg:mx-auto lg:flex lg:w-fit">
                    <motion.div
                      className={cn(
                        "glass bolt-lit flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-700",
                        energized && "border-electric/60"
                      )}
                      animate={
                        energized
                          ? {
                              boxShadow: [
                                "0 0 0px rgba(79,216,255,0)",
                                "0 0 26px rgba(79,216,255,0.45)",
                                "0 0 12px rgba(79,216,255,0.2)",
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 1.1 }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                          "h-6 w-6 transition-colors duration-700",
                          energized ? "text-electric" : "text-slate-500"
                        )}
                        style={energized ? { filter: "drop-shadow(0 0 6px rgba(79,216,255,0.8))" } : undefined}
                      >
                        <path d={stage.glyph} />
                      </svg>
                      {!isLast && (
                        <span
                          aria-hidden
                          className="absolute -end-[calc(1.5rem+0.75rem)] top-1/2 hidden h-px w-6 bg-white/10 lg:hidden"
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* stage card — expands on hover */}
                  <Reveal delay={i * 110} className="lg:mt-6 lg:text-center">
                    <div className="glass bolt-lit group rounded-2xl p-5 transition-all duration-500 hover:bg-white/[0.06]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 transition-colors group-hover:text-electric/80">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-1 text-lg font-bold text-white">{stage.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400 transition-colors duration-500 group-hover:text-slate-300">
                        {stage.desc}
                      </p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
