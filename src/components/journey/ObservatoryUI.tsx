/**
 * ObservatoryUI — the finale's typography and call to action.
 *
 * UI philosophy: this is not an overlay dropped on top of a 3D scene.
 * The panel is styled and positioned as though it were mounted into the
 * observatory's glazing — it sits at the sill line, it catches the
 * lightning through the same --bolt variable the world uses, and its
 * glass matches the glass behind it.
 *
 * The line is the emotional payoff, so it arrives on its own, before
 * the buttons, with the count of buildings the visitor actually walked
 * through underneath it.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";
import { TEMPLATES } from "../../config/templatesConfig";
import { visitedStore } from "./lib/visited";
import MagneticButton from "../ui/MagneticButton";
import { scrollToTarget } from "../../lib/lenis";
import { useMountedPanel } from "./useMountedPanel";

export default function ObservatoryUI({
  lang,
  visible,
}: {
  lang: Lang;
  visible: boolean;
}) {
  const t = SITE_TEXTS[lang];
  const [visited, setVisited] = useState<string[]>(() => visitedStore.list());
  const panel = useMountedPanel<HTMLDivElement>();

  useEffect(() => visitedStore.subscribe(setVisited), []);

  const total = TEMPLATES.length;
  const seen = visited.length;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="observatory-ui"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center px-4 pb-10 sm:pb-14"
        >
          {/* the payoff line — engraved into the space, not floating */}
          <motion.p
            initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.5, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="bolt-text mb-2 max-w-3xl text-center text-xl font-semibold leading-snug tracking-tight text-white sm:text-3xl"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            {t.observatoryLine}
          </motion.p>

          {/* proof: how much of the district they actually walked */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:text-xs"
            dir={lang === "fa" ? "rtl" : "ltr"}
          >
            {t.observatoryCount
              .replace("{seen}", String(seen))
              .replace("{total}", String(total))}
          </motion.p>

          {/* the CTA, mounted into the glazing */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            ref={panel.ref}
            onPointerMove={panel.onPointerMove}
            onPointerLeave={panel.onPointerLeave}
            className="panel-mounted bolt-lit parallax-host pointer-events-auto flex flex-col items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 backdrop-blur-md sm:flex-row sm:gap-5 sm:px-7"
          >
            <div
              className="parallax-layer text-center sm:text-start"
              style={{ ["--depth" as string]: "3px" }}
              dir={lang === "fa" ? "rtl" : "ltr"}
            >
              <div className="text-sm font-bold text-white sm:text-base">
                {t.contactTitle}
              </div>
              <div className="text-[11px] text-slate-400">{t.contactNote}</div>
            </div>
            <div
              className="parallax-layer flex flex-col gap-3 sm:flex-row"
              style={{ ["--depth" as string]: "6px" }}
            >
              <MagneticButton onClick={() => scrollToTarget("#contact")}>
                {t.whatsappCta}
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </MagneticButton>
              <MagneticButton variant="ghost" href="#/feed">
                {t.exploreButton}
              </MagneticButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
