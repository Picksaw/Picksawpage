import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Lang } from "../config/siteTexts";
import { summarize, useAssetProgress, type AssetKey } from "../lib/assetProgress";

/**
 * Loader — premium intro, now with DETAILED real loading.
 *
 * Sequence: darkness → rain → an electric spark traces the Picksaw "P"
 * → lightning strike → the interface fades in. Returning visitors
 * (sessionStorage) get a 600ms whisper instead. Reduced-motion users
 * skip straight to the site.
 *
 * Loading details (new):
 *   • the big number is the REAL byte-weighted progress of the city's
 *     models + road textures (reported by AssetPrimer / assetProgress);
 *     when no assets are registered (no-WebGL visit) it falls back to a
 *     purely visual ramp over the intro duration.
 *   • a stage label ("Building the neon city…") follows the progress.
 *   • first-time visitors get a per-asset breakdown list.
 *   • the intro never holds the site hostage to the ~28MB city: it
 *     finishes after the designed floor once assets are done, or at the
 *     hard cap — the city then finishes streaming in from the fog while
 *     the user is already in the site.
 */

const ASSET_ORDER: AssetKey[] = [
  "azadi",
  "milad",
  "skyline",
  "block",
  "lowrise",
  "asphalt",
];

const ASSET_NAMES: Record<Lang, Record<AssetKey, string>> = {
  en: {
    azadi: "Azadi Tower",
    milad: "Milad Tower",
    skyline: "City skyline",
    block: "Street blocks",
    lowrise: "Low-rise row",
    asphalt: "Wet asphalt",
  },
  fa: {
    azadi: "برج آزادی",
    milad: "برج میلاد",
    skyline: "آسمان‌خراش‌ها",
    block: "بلوک‌های خیابان",
    lowrise: "ساختمان‌های کوتاه",
    asphalt: "آسفالت خیس",
  },
};

const STAGES: { upTo: number; en: string; fa: string }[] = [
  { upTo: 15, en: "Waking the storm…", fa: "بیدار شدن طوفان…" },
  { upTo: 75, en: "Building the neon city…", fa: "ساختن شهر نئونی…" },
  { upTo: 97, en: "Wetting the streets…", fa: "خیساندن خیابان‌ها…" },
  { upTo: 99.99, en: "Final touches…", fa: "لمس‌های پایانی…" },
  { upTo: Infinity, en: "Ready", fa: "آماده" },
];

function stageFor(pct: number, lang: Lang): string {
  const s = STAGES.find((s) => pct < s.upTo) ?? STAGES[STAGES.length - 1];
  return lang === "fa" ? s.fa : s.en;
}

export default function Loader({
  onDone,
  lang,
}: {
  onDone: () => void;
  lang: Lang;
}) {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [pct, setPct] = useState(0);
  const timersRef = useRef<number[]>([]);
  // The intro clock must not reset when App re-renders (new onDone identity
  // re-runs this effect) — anchor it to the first mount.
  const startedAtRef = useRef(0);
  if (startedAtRef.current === 0) startedAtRef.current = performance.now();

  // subscribe → re-render on every asset progress update
  const snap = useAssetProgress();

  const returning = useMemo(() => {
    try {
      return sessionStorage.getItem("picksaw:v2intro") === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minTime = reduced ? 150 : returning ? 620 : 2350;
    // Hard cap for first-time visitors: never hold the site hostage to
    // the ~28MB city stream. Returning/reduced-motion: no waiting at all.
    const hardCap = returning || reduced ? minTime : minTime + 2600;

    const startedAt = startedAtRef.current;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem("picksaw:v2intro", "1");
      } catch {
        /* ignore */
      }
      document.documentElement.style.overflow = "";
      setShow(false);
      onDone();
    };

    const stop = () => {
      timersRef.current.forEach(window.clearTimeout);
      window.clearInterval(tickId);
      document.documentElement.style.overflow = "";
    };

    if (!reduced && !returning) {
      const timers = [
        window.setTimeout(() => setPhase(1), 150), // rain begins
        window.setTimeout(() => setPhase(2), 900), // spark draws the P
        window.setTimeout(() => setPhase(3), 1750), // lightning strike
      ];
      timersRef.current = timers;
    }

    // Progress tick: drives the synthetic ramp (no-asset visits), the
    // displayed number and the finish condition.
    let tickId = 0;
    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const s = summarize();

      const nextPct = s.none
        ? Math.min(100, (elapsed / minTime) * 100)
        : s.allDone
          ? 100
          : Math.round(s.fraction * 100);
      setPct(nextPct);

      const cap = s.none ? minTime : hardCap;
      if (elapsed >= (s.allDone ? minTime : cap)) finish();
    };
    tickId = window.setInterval(tick, 100);

    return stop;
  }, [onDone, returning]);

  const rainLines = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 5.7 + ((i * i * 13) % 11)) % 100}%`,
        height: `${14 + ((i * 29) % 22)}vh`,
        delay: `${(i * 0.11) % 0.9}s`,
        duration: `${0.55 + ((i * 17) % 30) / 100}s`,
        opacity: 0.25 + ((i * 7) % 10) / 22,
      })),
    []
  );

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // details are for the full first-time intro only (no whisper, no skip)
  const showDetails = !returning && !reduced;
  const visibleAssets = ASSET_ORDER.filter((k) => {
    const a = snap.assets[k];
    return a.started || a.done;
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04060c]"
          exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeInOut" } }}
        >
          {/* rain */}
          <div className="absolute inset-0 overflow-hidden">
            {phase >= 1 &&
              rainLines.map((r, i) => (
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

          <div className="relative flex flex-col items-center">
            {/* the P — electric stroke draw */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              className={phase >= 3 ? "drop-shadow-[0_0_28px_rgba(159,232,255,0.9)]" : ""}
              style={{
                filter:
                  phase >= 2
                    ? "drop-shadow(0 0 14px rgba(79,216,255,0.55))"
                    : "drop-shadow(0 0 0 rgba(79,216,255,0))",
                transition: "filter 0.4s ease",
              }}
            >
              <path
                d="M38 96V26h26c11 0 19 8 19 18s-8 18-19 18H38"
                stroke="#4fd8ff"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="220"
                strokeDashoffset={phase >= 2 ? 0 : 220}
                style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
              />
              {/* spark dot travelling the stroke */}
              {phase === 2 && (
                <circle r="4" fill="#eafcff">
                  <animateMotion dur="0.8s" fill="freeze" path="M38 96V26h26c11 0 19 8 19 18s-8 18-19 18H38" />
                </circle>
              )}
            </svg>

            {/* real progress + stage */}
            <div className="mt-7 flex flex-col items-center gap-2">
              <div
                className="text-3xl font-light tabular-nums tracking-tight text-white/90"
                dir="ltr"
              >
                {pct}
                <span className="ml-0.5 text-base text-electric/80">%</span>
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                {stageFor(pct, lang)}
              </div>
            </div>

            {/* detailed per-asset breakdown (first-time visitors) */}
            {visibleAssets.length > 0 && (
            <div className="mt-5 flex min-h-[7.5rem] flex-col items-center gap-1.5">
              {showDetails &&
                visibleAssets.map((k) => {
                  const a = snap.assets[k];
                  const rowPct = a.done
                    ? 100
                    : a.total > 0
                      ? Math.round((a.loaded / a.total) * 100)
                      : null; // unknown size → indeterminate pulse
                  return (
                    <div key={k} className="flex items-center gap-3" dir="ltr">
                      <span
                        className="w-32 truncate text-right text-[10px] text-slate-500"
                        dir={lang}
                      >
                        {ASSET_NAMES[lang][k]}
                      </span>
                      <span className="h-px w-24 overflow-hidden rounded bg-white/10">
                        <span
                          className={
                            "block h-full bg-gradient-to-r from-electric/50 to-electric " +
                            (rowPct === null ? "animate-pulse" : "")
                          }
                          style={{
                            width: rowPct === null ? "60%" : `${rowPct}%`,
                            transition: "width 0.25s linear",
                          }}
                        />
                      </span>
                      <span className="w-8 text-left text-[10px] tabular-nums text-slate-500">
                        {a.done ? "✓" : rowPct === null ? "…" : `${rowPct}%`}
                      </span>
                    </div>
                  );
                })}
            </div>
            )}
          </div>

          {/* lightning strike */}
          {phase >= 3 && (
            <>
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(200,230,255,0.5),transparent)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.15, 0.6, 0] }}
                transition={{ duration: 0.5, times: [0, 0.12, 0.3, 0.5, 1] }}
              />
              <svg width="70" height="260" viewBox="0 0 70 260" className="absolute top-0 text-white">
                <motion.path
                  d="M40 0 L28 60 L46 64 L20 140 L38 142 L14 260"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 1 }}
                  animate={{ pathLength: 1, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 8px rgba(159,232,255,1))" }}
                />
              </svg>
            </>
          )}

          {/* progress hairline — width follows the real percentage */}
          <div className="absolute bottom-16 h-px w-40 overflow-hidden rounded bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-electric/40 via-electric to-white"
              style={{ width: `${pct}%`, transition: "width 0.25s linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
