import { useMemo } from "react";
import { type Lang } from "../config/siteTexts";
import AboutJourney from "../components/journey/AboutJourney";
import AboutSection from "../components/AboutSection";
import { hasWebGL, prefersReducedMotion } from "../lib/webgl";

/**
 * AboutPage — the standalone About walk (/about).
 *
 * WebGL + motion: the neon-city journey, one viewport-fitted framed
 * window per topic, page scroll walking from pane to pane toward the
 * Milad Tower finale. Without WebGL (or with reduced motion): the
 * classic, fully readable About section.
 */
export default function AboutPage({
  lang,
  introDone = true,
}: {
  lang: Lang;
  /** the opaque intro loader covers the canvas — idle the loop while up */
  introDone?: boolean;
}) {
  const journey = useMemo(() => hasWebGL() && !prefersReducedMotion(), []);

  if (journey) return <AboutJourney lang={lang} introDone={introDone} />;

  return (
    <div className="relative pt-28 sm:pt-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <AboutSection lang={lang} />
      </div>
    </div>
  );
}
