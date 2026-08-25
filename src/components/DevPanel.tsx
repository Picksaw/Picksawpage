import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getStorm, setDevMode, setStormOverride, subscribeStorm } from "../lib/stormStore";

/**
 * DevPanel — hidden detail. Unlocked by 5 quick clicks on the 3D logo
 * (or typing "storm" for the weather easter egg, handled in App).
 * Live FPS meter + storm weather controls.
 */
export default function DevPanel() {
  const [, force] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => subscribeStorm(() => force((n) => n + 1)), []);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      frames++;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const storm = getStorm();

  return (
    <motion.aside
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="glass-strong bolt-lit fixed bottom-5 start-5 z-[75] w-56 rounded-2xl p-4 text-xs"
      dir="ltr"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bold uppercase tracking-[0.2em] text-electric">Dev mode</span>
        <button
          type="button"
          onClick={() => setDevMode(false)}
          className="rounded-md px-1.5 text-slate-500 hover:text-white"
          aria-label="Close dev panel"
        >
          ✕
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/8 pb-2 text-slate-400">
        <span>FPS</span>
        <span className={fps >= 55 ? "text-electric" : "text-amber-400"}>{fps}</span>
      </div>
      <div className="flex items-center justify-between border-b border-white/8 py-2 text-slate-400">
        <span>storm.level</span>
        <span className="text-slate-200">{storm.level.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between py-2 text-slate-400">
        <span>override</span>
        <span className="text-slate-200">{storm.override < 0 ? "—" : storm.override.toFixed(2)}</span>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setStormOverride(0)}
          className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-[11px] text-slate-300 hover:border-white/25"
        >
          calm
        </button>
        <button
          type="button"
          onClick={() => setStormOverride(1, 20000)}
          className="rounded-lg border border-electric/30 bg-electric/10 py-1.5 text-[11px] text-electric hover:border-electric/60"
        >
          storm
        </button>
        <button
          type="button"
          onClick={() => setStormOverride(-1)}
          className="rounded-lg border border-white/10 bg-white/5 py-1.5 text-[11px] text-slate-300 hover:border-white/25"
        >
          auto
        </button>
      </div>
    </motion.aside>
  );
}
