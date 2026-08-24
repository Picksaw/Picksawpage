import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import Reveal from "./Reveal";
import TiltCard from "./ui/TiltCard";

/**
 * TrustStats — floating credibility cards. Each drifts on its own
 * idle rhythm, reacts to lightning (bolt-lit), and tilts toward the
 * cursor like a physical pane of glass.
 */
export default function TrustStats({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];

  const stats = [
    { value: "10+", label: t.statTemplates, glyph: "M4 7h16M4 12h16M4 17h10", icon: false },
    { value: lang === "fa" ? "فا / EN" : "EN / FA", label: t.statBilingual, glyph: "M4 5h10M4 9h7m9 6H10m7-4H10m7.5-3.5 3 3-3 3", icon: false },
    { value: "100%", label: t.statResponsive, glyph: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm4 16h2", icon: false },
    { value: "", label: t.statFast, glyph: "M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2Z", icon: true },
  ];

  return (
    <section className="relative py-20" aria-label={t.trustTitle}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <Reveal>
            <h2 className="bolt-text text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t.trustTitle}
            </h2>
          </Reveal>
          <Reveal delay={70}>
            <p className="mt-3 text-sm text-slate-400 sm:text-base">{t.trustSubtitle}</p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 90}>
              <div
                className="idle-drift h-full"
                style={
                  {
                    "--drift-duration": `${8 + i * 1.3}s`,
                    "--drift-delay": `${i * -2.1}s`,
                  } as React.CSSProperties
                }
              >
                <TiltCard maxTilt={11} scale={1.03} className="h-full rounded-2xl">
                  <div className="glass bolt-lit flex h-full flex-col items-center justify-center gap-2 rounded-2xl px-4 py-8 text-center sm:py-10">
                    {s.icon ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-9 w-9 text-electric"
                        style={{ filter: "drop-shadow(0 0 10px rgba(79,216,255,0.6))" }}
                      >
                        <path d={s.glyph} />
                      </svg>
                    ) : (
                      <span className="bolt-text text-3xl font-black tracking-tight text-white sm:text-4xl">
                        {s.value}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400 sm:text-sm">{s.label}</span>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
