import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Loader — premium intro, hard-capped at 2.5s.
 * Sequence: darkness → rain → an electric spark traces the Picksaw "P"
 * → lightning strike → the interface fades in.
 * Returning visitors (sessionStorage) get a 600ms whisper instead.
 * Reduced-motion users skip straight to the site.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
  const timersRef = useRef<number[]>([]);

  /**
   * Pin the callback.
   *
   * App passes `onDone={() => setIntroDone(true)}` — a new function
   * identity on every render. With `onDone` in the effect's dependency
   * array, every App re-render tore this effect down (clearing all
   * timers) and started the countdown again from zero. Any re-render
   * cadence faster than the 2350 ms intro meant the done-timer could
   * NEVER fire, `introDone` stayed false, and the wrapper holding the
   * entire site kept `visibility: hidden` forever — a black page with
   * no text, no buttons and no visible city.
   *
   * The effect now runs exactly once and reads the latest callback
   * through this ref.
   */
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
    document.documentElement.style.overflow = "hidden";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = reduced ? 150 : returning ? 620 : 2350;

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      try {
        sessionStorage.setItem("picksaw:v2intro", "1");
      } catch {
        /* ignore */
      }
      document.documentElement.style.overflow = "";
      setShow(false);
      onDoneRef.current();
    };

    if (!reduced && !returning) {
      const timers = [
        window.setTimeout(() => setPhase(1), 150), // rain begins
        window.setTimeout(() => setPhase(2), 900), // spark draws the P
        window.setTimeout(() => setPhase(3), 1750), // lightning strike
      ];
      timersRef.current = timers;
    }
    const doneTimer = window.setTimeout(done, total);
    timersRef.current.push(doneTimer);

    /**
     * Failsafe.
     *
     * The site must never be permanently invisible because of an
     * animation. If the intro has not completed within twice its
     * budget — a stalled tab, a throttled timer, anything — open the
     * gate anyway.
     */
    const failsafe = window.setTimeout(() => {
      if (!finished) done();
    }, Math.max(total * 2, 4000));
    timersRef.current.push(failsafe);

    return () => {
      timersRef.current.forEach(window.clearTimeout);
      document.documentElement.style.overflow = "";
    };
    // Intentionally runs ONCE. `onDone` is read through a ref so a
    // changing callback identity can never restart the intro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

          {/* progress hairline */}
          <div className="absolute bottom-16 h-px w-40 overflow-hidden rounded bg-white/10">
            <motion.div
              className="h-full bg-gradient-to-r from-electric/40 via-electric to-white"
              initial={{ x: "-100%" }}
              animate={{ x: returning ? "0%" : phase >= 3 ? "0%" : "-40%" }}
              transition={{ duration: returning ? 0.5 : 2.2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
