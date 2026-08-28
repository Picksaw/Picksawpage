import { useMemo } from "react";
import { motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import MagneticButton from "../components/ui/MagneticButton";

/**
 * NotFoundPage — the custom 404, in the site's own storm language:
 * darkness, rain lines, the electric "P" stroke, one bolt-lit card with
 * the code, a message and the way back. No 3D, no downloads — it has to
 * be as light as a missed turn.
 */
export default function NotFoundPage({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];

  const rainLines = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: `${(i * 4.7 + ((i * i * 17) % 13)) % 100}%`,
        height: `${12 + ((i * 31) % 24)}vh`,
        delay: `${(i * 0.13) % 1.1}s`,
        duration: `${0.5 + ((i * 19) % 30) / 100}s`,
        opacity: 0.18 + ((i * 7) % 10) / 26,
      })),
    []
  );

  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center sm:px-6">
      {/* rain */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {rainLines.map((r, i) => (
          <span
            key={i}
            className="rain-line"
            style={
              {
                left: r.left,
                height: r.height,
                animationDelay: r.delay,
                animationDuration: r.duration,
                opacity: r.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* storm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-electric/8 blur-[130px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* the P — the one thing that survived */}
        <svg
          width="96"
          height="96"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden
          className="drop-shadow-[0_0_22px_rgba(159,232,255,0.8)]"
        >
          <path
            d="M38 96V26h26c11 0 19 8 19 18s-8 18-19 18H38"
            stroke="#4fd8ff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="bolt-text mt-6 text-7xl font-bold tracking-tight text-white sm:text-8xl"
          dir="ltr"
        >
          404
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-4 text-lg font-semibold text-slate-200 sm:text-xl"
        >
          {t.notFoundTitle}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-3 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base"
        >
          {t.notFoundBody}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="mt-10"
        >
          <MagneticButton href="#/">
            {t.notFoundHome}
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5m6-6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-8 text-[11px] uppercase tracking-[0.24em] text-slate-600"
        >
          {t.notFoundHint}
        </motion.p>
      </div>
    </section>
  );
}
