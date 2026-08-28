import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import type { TemplateItem } from "../config/templatesConfig";
import MagneticButton from "./ui/MagneticButton";
import { useSound } from "../audio/SoundProvider";
import { getLenis } from "../lib/lenis";

/**
 * PreviewModal — cinematic fullscreen template preview.
 * A browser frame assembles around the live site; scrolling inside
 * scrolls the TEMPLATE (natural iframe scrolling), never Picksaw —
 * Lenis is stopped and body scroll is locked while open.
 */
export default function PreviewModal({
  item,
  lang,
  onClose,
}: {
  item: TemplateItem;
  lang: Lang;
  onClose: () => void;
}) {
  const t = SITE_TEXTS[lang];
  const { blip } = useSound();
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    getLenis()?.stop();
    document.body.style.overflow = "hidden"; // native-scroll lock
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      getLenis()?.start();
      restoreFocus.current?.focus?.();
    };
  }, [onClose]);

  const domain = (() => {
    try {
      return new URL(item.url).hostname;
    } catch {
      return item.url;
    }
  })();

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name.en} — ${t.openLiveLabel}`}
    >
      {/* blurred backdrop — rain continues behind */}
      <motion.button
        type="button"
        aria-label={t.closeLabel}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-storm-950/60 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="glass-strong bolt-lit relative w-full h-full sm:h-auto max-w-6xl flex flex-col overflow-hidden sm:rounded-3xl shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
        initial={{ scale: 0.92, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 24, opacity: 0 }}
        transition={{ type: "spring", stiffness: 210, damping: 26 }}
      >
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]/80" />
          </div>
          <div className="glass flex-1 truncate rounded-lg px-3 py-1 text-xs text-slate-400" dir="ltr">
            <span className="text-electric">https://</span>
            {domain}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => {
              blip("click");
              onClose();
            }}
            aria-label={t.closeLabel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-all hover:rotate-90 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* the live site — natural scrolling inside the template */}
        <div className="relative flex-1 sm:flex-none sm:h-auto sm:aspect-[16/10] sm:max-h-[68vh] w-full overflow-hidden bg-white">
          {!loaded && <div className="skeleton absolute inset-0 z-10" />}
          <iframe
            src={item.url}
            title={`Live preview of ${domain}`}
            onLoad={() => setLoaded(true)}
            className="h-full w-full border-0 bg-white"
          />
        </div>

        {/* CTA — home-bar safe on notched phones */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-5 py-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:flex-row sm:pb-4">
          <div className="text-sm text-slate-400">
            <span className="font-bold text-white">{item.name.en}</span>
            {" — "}
            {item.title[lang] || item.title.en}
          </div>
          <MagneticButton
            href={item.url}
            variant="primary"
            className="!px-6 !py-3"
            ariaLabel={`${t.openLiveLabel} ${item.name.en}`}
          >
            {t.openLiveLabel}
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 17l9.2-9.2M17 17V7H7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </MagneticButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
