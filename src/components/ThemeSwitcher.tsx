import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Lang } from "../config/siteTexts";
import { SITE_TEXTS } from "../config/siteTexts";
import { setTheme, useThemeId, type ThemeId } from "../lib/themeStore";
import { THEMES, THEME_ORDER, rgbCss } from "../lib/themes";
import { useSound } from "../audio/SoundProvider";
import { cn } from "../utils/cn";

/**
 * ThemeSwitcher — the atmosphere control.
 * A glass button in the header opens a small menu of the five worlds:
 * storm (thunder & rain) and sunrise/sunset × clear/cloudy. The choice
 * persists (themeStore → localStorage) and crossfades the sky, the sun,
 * the city façades and the wet street simultaneously.
 */

const LABEL_KEY: Record<ThemeId, string> = {
  storm: "themeStorm",
  "sunrise-clear": "themeSunriseClear",
  "sunrise-cloudy": "themeSunriseCloudy",
  "sunset-clear": "themeSunsetClear",
  "sunset-cloudy": "themeSunsetCloudy",
};

function StormGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
      aria-hidden
    >
      <path d="M17.5 8a4.5 4.5 0 0 0-8.7-1.6A3.8 3.8 0 0 0 6 14h11a3 3 0 0 0 .5-6Z" strokeLinejoin="round" />
      <path
        d="M13 15.5 10 20h2.6l-.8 3 3.7-4.8h-2.4l.9-2.7Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

/** Half-sun over a horizon; `rising` flips the chevron, `cloudy`
 *  sweeps a cloud across the lower-right of the disc. */
function SunHorizonGlyph({
  rising,
  cloudy,
  className,
}: {
  rising: boolean;
  cloudy: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* rays */}
      <path d="M12 3.5V5.5" />
      <path d="m5.8 6.6 1.3 1.3" />
      <path d="m18.2 6.6-1.3 1.3" />
      <path d="M3.2 12H5" />
      <path d="M19 12h1.8" />
      {/* sun dome above the horizon */}
      <path d="M8 16a4 4 0 0 1 8 0" />
      {rising ? <path d="m10.3 12.2 1.7-1.7 1.7 1.7" /> : <path d="m10.3 10.6 1.7 1.7 1.7-1.7" />}
      {/* horizon */}
      <path d="M3 16h18" />
      <path d="M5.5 20h13" />
      {cloudy && (
        <g transform="translate(4.6,7.4) scale(0.72)">
          <path
            d="M6.656 18a3.5 3.5 0 0 1-.355-6.983 4.5 4.5 0 0 1 8.7-1.45 3.5 3.5 0 0 1 .35 6.932Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        </g>
      )}
    </svg>
  );
}

function ThemeGlyph({ id, className }: { id: ThemeId; className?: string }) {
  if (id === "storm") return <StormGlyph className={className} />;
  const rising = id === "sunrise-clear" || id === "sunrise-cloudy";
  const cloudy = id === "sunrise-cloudy" || id === "sunset-cloudy";
  return <SunHorizonGlyph rising={rising} cloudy={cloudy} className={className} />;
}

/** Tiny painted sky disc used in the menu list. */
function SkyDot({ id }: { id: ThemeId }) {
  const p = THEMES[id];
  return (
    <span
      aria-hidden
      className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-white/15"
      style={{
        background: `linear-gradient(to bottom, ${rgbCss(p.skyTop)}, ${rgbCss(
          p.skyMid,
        )} 55%, ${rgbCss(p.skyBottom)})`,
      }}
    >
      {p.sun ? (
        <span
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{
            left: `${p.sun.x * 100}%`,
            top: `${p.sun.y * 100}%`,
            transform: "translate(-50%, -50%)",
            background: rgbCss(p.sun.edge),
            boxShadow: `0 0 6px ${rgbCss(p.sun.glow, 0.9)}`,
          }}
        />
      ) : (
        <StormGlyph className="absolute inset-0 m-auto h-3.5 w-3.5 text-electric-soft" />
      )}
    </span>
  );
}

export default function ThemeSwitcher({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const themeId = useThemeId();
  const [open, setOpen] = useState(false);
  const { blip } = useSound();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="glass flex h-[38px] w-[38px] items-center justify-center rounded-xl text-slate-300 transition-all hover:border-white/25 hover:text-white"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.atmosphereLabel}
        title={t.atmosphereLabel}
        onClick={() => {
          setOpen((o) => !o);
          blip("click");
        }}
      >
        <ThemeGlyph id={themeId} className="h-[19px] w-[19px] text-electric" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="glass-strong bolt-lit absolute start-0 top-[calc(100%+0.6rem)] z-50 w-60 max-w-[calc(100vw-1.5rem)] rounded-2xl p-1.5 shadow-2xl shadow-black/50 sm:start-auto sm:end-0"
          >
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t.atmosphereLabel}
            </div>
            {THEME_ORDER.map((id) => {
              const active = id === themeId;
              return (
                <button
                  key={id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setTheme(id);
                    blip("toggle");
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start text-xs font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <SkyDot id={id} />
                  <span className="flex-1">{t[LABEL_KEY[id]]}</span>
                  {active && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      className="h-3.5 w-3.5 text-electric"
                    >
                      <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
