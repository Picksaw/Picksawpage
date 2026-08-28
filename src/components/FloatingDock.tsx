import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import { useSound } from "../audio/SoundProvider";
import { onLightning } from "../lib/stormEvents";
import { cn } from "../utils/cn";

/**
 * FloatingDock — the signal hub.
 * A collapsed glass "storm orb" (it flashes with real lightning strikes).
 * Tap or hover it and the channels spring out in a staggered arc:
 * Instagram · WhatsApp · Phone · Storm ambience · Lofi radio.
 *
 * Links:
 *   Instagram → https://www.instagram.com/picksawm/
 *   WhatsApp  → https://wa.me/989380215823
 *   Phone     → tel:+989380215823
 */

const PHONE_INTERNATIONAL = "+989380215823";

interface DockAction {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  external?: boolean;
  icon: (props: { className?: string }) => ReactNode;
  ringClass: string;
}

export default function FloatingDock({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const { stormOn, lofiOn, stormVol, lofiVol, toggleStorm, toggleLofi, setStormVol, setLofiVol, blip } =
    useSound();
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(0);
  const [hint, setHint] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const leaveTimer = useRef<number | null>(null);
  const hovered = useRef(false);

  // orb flashes on real lightning
  useEffect(() => {
    let fadeId = 0;
    const off = onLightning((i) => {
      setFlash(i);
      window.clearTimeout(fadeId);
      fadeId = window.setTimeout(() => setFlash(0), 320);
    });
    return () => {
      off();
      window.clearTimeout(fadeId);
    };
  }, []);

  // one-time attention hint — the dock opens itself so the sound
  // channels are discovered (per session, only if never used)
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem("picksaw:dockhint") === "1";
    } catch {
      /* ignore */
    }
    // On phones the hint often fires during the first scroll and adds a
    // burst of layout/animation work. Keep mobile idle unless tapped.
    if (seen || coarse) return;
    const id = window.setTimeout(() => {
      setOpen(true);
      setHint(true);
      try {
        sessionStorage.setItem("picksaw:dockhint", "1");
      } catch {
        /* ignore */
      }
      const closeId = window.setTimeout(() => {
        setHint(false);
        if (!hovered.current) setOpen(false);
      }, 5600);
      leaveTimer.current = closeId;
    }, 2800);
    return () => window.clearTimeout(id);
  }, []);

  const openNow = () => {
    hovered.current = true;
    window.clearTimeout(leaveTimer.current ?? undefined);
    setOpen(true);
  };
  const closeSoon = () => {
    hovered.current = false;
    leaveTimer.current = window.setTimeout(() => setOpen(false), 450);
  };

  const actions: DockAction[] = [
    {
      id: "instagram",
      label: t.instagramLabel,
      href: "https://www.instagram.com/picksawm/",
      external: true,
      ringClass: "hover:shadow-[0_0_28px_-4px_rgba(225,68,160,0.55)] hover:border-[#e14aa0]/50",
      icon: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: "whatsapp",
      label: t.whatsappLabel,
      href: `https://wa.me/${PHONE_INTERNATIONAL.replace("+", "")}`,
      external: true,
      ringClass: "hover:shadow-[0_0_28px_-4px_rgba(37,211,102,0.5)] hover:border-[#25d366]/50",
      icon: (p) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
          <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.4.1-1 .1-1.6-.1a9.9 9.9 0 0 1-4.9-4.3c-.4-.7-.8-1.6-.8-2.5s.5-1.4.7-1.6c.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.5l-.3.4c-.1.2-.3.3-.1.6.2.3.7 1.1 1.4 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.3.1.1.1.6-.1 1.2Z" />
        </svg>
      ),
    },
    {
      id: "phone",
      label: t.phoneLabel,
      href: `tel:${PHONE_INTERNATIONAL}`,
      ringClass: "hover:shadow-[0_0_28px_-4px_rgba(79,216,255,0.55)] hover:border-electric/50",
      icon: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
          <path
            d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "storm",
      label: t.stormSoundLabel,
      onClick: () => {
        toggleStorm();
        blip("toggle");
      },
      active: stormOn,
      ringClass: "hover:shadow-[0_0_28px_-4px_rgba(159,232,255,0.5)] hover:border-electric/50",
      icon: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
          <path d="M17.5 8a4.5 4.5 0 0 0-8.7-1.6A3.8 3.8 0 0 0 6 14h11a3 3 0 0 0 .5-6Z" strokeLinejoin="round" />
          <path d="M13 15.5 10 20h2.6l-.8 3 3.7-4.8h-2.4l.9-2.7Z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: "lofi",
      label: t.lofiSoundLabel,
      onClick: () => {
        toggleLofi();
        blip("toggle");
      },
      active: lofiOn,
      ringClass: "hover:shadow-[0_0_28px_-4px_rgba(159,232,255,0.5)] hover:border-electric/50",
      icon: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
          <path d="M9 18V6l10-2v11" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6.8" cy="18" r="2.4" />
          <circle cx="16.8" cy="15" r="2.4" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="fixed bottom-5 z-[70] flex flex-col items-end gap-3 end-5 sm:bottom-7 sm:end-7"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <AnimatePresence>
        {open &&
          actions.map((action, i) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 26, scale: 0.5, rotate: -8 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, y: 18, scale: 0.5, rotate: 6 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 20,
                delay: (actions.length - 1 - i) * 0.045,
              }}
              className="flex items-center gap-3"
            >
              {/* tooltip + live volume slider for sound channels */}
              <motion.span
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: 0.12 + (actions.length - 1 - i) * 0.045 }}
                className={cn(
                  "glass-strong bolt-lit flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg",
                  action.active === false && "opacity-70"
                )}
              >
                {action.label}
                {action.active !== undefined && (
                  <span className={cn("text-[10px] font-bold", action.active ? "text-electric" : "text-slate-500")}>
                    {action.active ? "ON" : "OFF"}
                  </span>
                )}
                {action.id === "storm" && action.active && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(stormVol * 100)}
                    onChange={(e) => setStormVol(Number(e.target.value) / 100)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="dock-slider w-20 sm:w-24"
                    aria-label={`${action.label} volume`}
                  />
                )}
                {action.id === "lofi" && action.active && (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(lofiVol * 100)}
                    onChange={(e) => setLofiVol(Number(e.target.value) / 100)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="dock-slider w-20 sm:w-24"
                    aria-label={`${action.label} volume`}
                  />
                )}
              </motion.span>

              <motion.a
                href={action.href}
                target={action.external ? "_blank" : undefined}
                rel={action.external ? "noopener noreferrer" : undefined}
                onClick={action.onClick}
                aria-label={action.label}
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => blip("hover")}
                onFocus={openNow}
                className={cn(
                  "glass bolt-lit flex h-12 w-12 items-center justify-center rounded-full text-slate-200 transition-colors duration-300",
                  action.active
                    ? "border-electric/50 bg-electric/10 text-electric"
                    : "hover:text-white",
                  action.ringClass,
                  lang === "fa" && "flex-row-reverse"
                )}
              >
                <action.icon className="h-5 w-5" />
                {/* equalizer when a sound channel is on */}
                {action.active && (
                  <span className="absolute -bottom-0.5 -end-0.5 flex h-3.5 w-3.5 items-end justify-center gap-[1.5px] rounded-full bg-storm-950 px-[2px] pb-[2px]">
                    {[0, 1, 2].map((b) => (
                      <span
                        key={b}
                        className="eq-bar w-[2px] rounded-full bg-electric"
                        style={{ height: "100%", animationDelay: `${b * 0.14}s` }}
                      />
                    ))}
                  </span>
                )}
              </motion.a>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* the storm orb */}
      <motion.button
        type="button"
        aria-label={t.contactHub}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          blip("click");
        }}
        onMouseEnter={() => window.clearTimeout(hoverTimer.current ?? undefined)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="glass-strong bolt-lit relative flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          boxShadow: flash
            ? `0 0 ${18 + flash * 42}px rgba(159,232,255,${0.25 + flash * 0.6}), inset 0 0 ${10 + flash * 20}px rgba(159,232,255,${flash * 0.35})`
            : undefined,
        }}
      >
        {/* idle pulse ring */}
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border border-electric/40"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        {/* attention hint pulse */}
        {hint && !open && (
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-electric/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 1.1, repeat: 2 }}
          />
        )}
        {/* bolt glyph — brightens with real strikes */}
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6 text-electric transition-all duration-200"
          style={{
            filter: flash
              ? `drop-shadow(0 0 ${6 + flash * 14}px rgba(159,232,255,${0.4 + flash * 0.6}))`
              : "drop-shadow(0 0 4px rgba(79,216,255,0.4))",
            transform: flash ? "scale(1.15)" : "scale(1)",
          }}
          fill="currentColor"
          aria-hidden
        >
          <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z" />
        </svg>
      </motion.button>
    </div>
  );
}
