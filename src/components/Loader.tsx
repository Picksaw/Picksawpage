import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  preloadCriticalSiteAssets,
  type AssetLoadProgress,
} from "../lib/journeyAssets";

/**
 * Loader — cinematic intro + real asset gate.
 * The page stays locked at scrollY=0 (the ghost card station) until the
 * the Journey's road, core city models, and gallery previews are warmed.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const [engineReady, setEngineReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);
  const [progress, setProgress] = useState<AssetLoadProgress>({
    loaded: 0,
    total: 1,
    ratio: 0,
    current: "Preparing storm systems",
    groups: [],
    errors: [],
  });
  const timersRef = useRef<number[]>([]);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const returning = useMemo(() => {
    try {
      return sessionStorage.getItem("picksaw:v2intro") === "1";
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const introMs = reduced ? 220 : returning ? 700 : 1350;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const id = window.setTimeout(resolve, ms);
        timersRef.current.push(id);
      });

    const done = () => {
      if (!alive) return;
      try {
        sessionStorage.setItem("picksaw:v2intro", "1");
      } catch {
        /* ignore */
      }
      window.scrollTo(0, 0); // sit on the ghost card after loading
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      setShow(false);
      onDoneRef.current();
    };

    if (reduced) {
      setPhase(3);
    } else if (returning) {
      setPhase(2);
      timersRef.current.push(window.setTimeout(() => setPhase(3), 260));
    } else {
      timersRef.current.push(window.setTimeout(() => setPhase(1), 90));
      timersRef.current.push(window.setTimeout(() => setPhase(2), 430));
      timersRef.current.push(window.setTimeout(() => setPhase(3), 920));
    }

    const enginePromise = import("../components/journey/Journey")
      .then(() => {
        if (alive) setEngineReady(true);
      })
      .catch(() => {
        // Don't trap the visitor forever if a chunk request fails; the normal
        // React Suspense path can still retry/render its fallback.
        if (alive) setEngineReady(true);
      });

    const assetPromise = preloadCriticalSiteAssets((next) => {
      if (alive) setProgress(next);
    }).then(() => {
      if (alive) setAssetsReady(true);
    });

    Promise.allSettled([wait(introMs), enginePromise, assetPromise]).then(done);

    return () => {
      alive = false;
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [returning]);

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

  const percent = Math.max(3, Math.round(progress.ratio * 100));
  const allReady = engineReady && assetsReady;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#04060c] px-5 text-white"
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

          <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
            {/* the P — electric stroke draw */}
            <svg
              width="112"
              height="112"
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
              {phase === 2 && (
                <circle r="4" fill="#eafcff">
                  <animateMotion dur="0.8s" fill="freeze" path="M38 96V26h26c11 0 19 8 19 18s-8 18-19 18H38" />
                </circle>
              )}
            </svg>

            <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.34em] text-electric/90">
              Picksaw storm boot
            </p>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">
              {allReady ? "Ghost card ready" : "Loading the 3D journey"}
            </h2>
            <p className="mt-2 min-h-5 text-xs text-slate-400">
              {allReady ? "Scroll will unlock at the opening ghost card." : progress.current}
            </p>

            <div className="mt-6 w-full overflow-hidden rounded-full border border-white/10 bg-white/8 p-1 shadow-[0_0_34px_-18px_rgba(79,216,255,0.8)]">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-electric/60 via-electric to-white"
                initial={{ width: "3%" }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            <div className="mt-2 flex w-full items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>{progress.loaded}/{progress.total} assets</span>
              <span>{percent}%</span>
            </div>

            <div className="mt-5 grid w-full gap-2 text-start">
              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs">
                <span className="text-slate-300">3D engine</span>
                <span className={engineReady ? "text-electric" : "text-slate-500"}>
                  {engineReady ? "ready" : "warming"}
                </span>
              </div>
              {progress.groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{group.label}</span>
                  <span className={group.loaded >= group.total ? "text-electric" : "text-slate-500"}>
                    {group.loaded}/{group.total}
                  </span>
                </div>
              ))}
            </div>

            {progress.errors.length > 0 && (
              <p className="mt-3 text-[11px] text-amber-200/80">
                Some assets used cached/fallback responses; continuing safely.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
