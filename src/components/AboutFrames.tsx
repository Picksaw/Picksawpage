/**
 * AboutFrames — the six portrait, non-scrolling framed windows of the
 * standalone /about walk. Each pane is one fixed screen (auto-fitted to
 * the phone/PC viewport by Window3D); the OUTER page scroll moves the
 * visitor through the city from window to window — there is never an
 * inner scrollbar.
 *
 * All facts/strings come from ABOUT_COPY so the static SEO copy and the
 * 3D walk never drift apart.
 */
import { ABOUT_COPY } from "./AboutSection";
import { Window3D } from "./journey/Corridor";
import { ABOUT_FRAMES } from "./journey/path";
import { type Lang } from "../config/siteTexts";

const IG_URL = "https://www.instagram.com/picksawm/";
const WA_URL = "https://wa.me/989380215823";

const UI = {
  en: {
    kicker: "About PICKSAW",
    based: "Based in Iran · working worldwide",
    connect: "Let's create something memorable",
    connectSub:
      "Open to collaborations, creative projects and freelance work.",
    instagram: "Instagram @picksawm",
    whatsapp: "WhatsApp · +98 938 021 5823",
    quote: "Build something that leaves an impression.",
    panes: ["Identity", "What I Create", "Meaning", "Style", "Skills", "Contact"],
  },
  fa: {
    kicker: "درباره PICKSAW",
    based: "مستقر در ایران · همکاری با سراسر جهان",
    connect: "بیایید چیزی به‌یادماندنی بسازیم",
    connectSub: "آماده همکاری، پروژه‌های خلاقانه و کار فریلنس.",
    instagram: "اینستاگرام @picksawm",
    whatsapp: "واتساپ · ۰۹۳۸ ۰۲۱ ۵۸۲۳",
    quote: "ساختن چیزی که اثری ماندگار بگذارد.",
    panes: ["معرفی", "چه می‌سازم", "معنا", "سبک", "مهارت‌ها", "ارتباط"],
  },
} as const;

/* Portrait window world-size: tall gallery panes that nearly fill the
 *  phone viewport (aspect ~1.75 → height-bound on portrait screens) while
 *  standing like a portrait painting in the middle of desktop boulevards. */
const W = 2.3;
const H = 4.0;

function PaneShell({
  lang,
  index,
  focused,
  children,
  label,
}: {
  lang: Lang;
  index: number;
  focused: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const rtl = lang === "fa";
  return (
    <Window3D
      index={index}
      focused={focused}
      dir={rtl ? "rtl" : "ltr"}
      width={W}
      height={H}
      mobileW={400}
      desktopW={720}
      scrollable={false}
      maxWFrac={0.94}
      maxHFrac={0.9}
    >
      <div className="relative flex h-full w-full flex-col bg-gradient-to-b from-[#070b16] via-[#04060d] to-[#020308] text-white">
        {/* neon hairline + pane tag */}
        <div className="flex items-center justify-between border-b border-electric/20 px-4 py-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-electric">
            {label}
          </span>
          <span dir="ltr" className="font-mono text-[9px] tracking-widest text-slate-500">
            {String(index + 1).padStart(2, "0")} / {String(ABOUT_FRAMES).padStart(2, "0")}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-4 py-3">{children}</div>
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(79,216,255,.55), transparent)",
          }}
        />
      </div>
    </Window3D>
  );
}

function PaneTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-center text-[17px] font-bold leading-tight tracking-tight text-white sm:text-[22px]">
      {children}
    </h2>
  );
}

/* ── pane 0 — identity / bio ─────────────────────────────────────────── */
function IdentityPane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  const u = UI[lang];
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 text-center">
        <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-electric/50 bg-electric/10 font-black text-electric shadow-[0_0_24px_rgba(79,216,255,.35)] sm:h-14 sm:w-14 sm:text-lg">
          P
        </div>
        <h1 className="text-[16px] font-extrabold leading-tight sm:text-[21px]">
          {c.title}
        </h1>
        <p className="mt-0.5 text-[10.5px] font-medium text-electric sm:text-[13px]">
          {c.identity}
        </p>
      </div>
      <p className="flex-1 overflow-hidden text-[10.5px] leading-[1.55] text-slate-300 sm:text-[13px] sm:leading-[1.6]">
        {c.lead}
      </p>
      <p className="mt-2 border-s border-electric/40 ps-2 text-[10px] italic leading-snug text-slate-400 sm:text-[12.5px]">
        {c.lead2}
      </p>
      <p className="mt-2 text-center text-[9px] uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">
        {u.based}
      </p>
    </div>
  );
}

/* ── pane 1 — what I create ──────────────────────────────────────────── */
function CreatePane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  return (
    <div className="flex h-full flex-col">
      <PaneTitle>{c.createTitle}</PaneTitle>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-1.5 sm:gap-2">
        {c.disciplines.map((d) => (
          <div
            key={d.name}
            className="flex min-h-0 flex-col rounded-sm border border-electric/15 bg-white/[0.03] p-1.5 sm:p-2.5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-1 h-4 w-4 shrink-0 text-electric sm:h-5 sm:w-5"
            >
              <path d={d.icon} />
            </svg>
            <h3 className="mb-0.5 text-[9.5px] font-bold leading-tight text-white sm:text-[12.5px]">
              {d.name}
            </h3>
            <p className="min-h-0 flex-1 overflow-hidden text-[8.5px] leading-[1.35] text-slate-400 sm:text-[10.5px] sm:leading-[1.4]">
              {d.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── pane 2 — meaning of PICKSAW ─────────────────────────────────────── */
function MeaningPane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  const u = UI[lang];
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <PaneTitle>{c.meaningTitle}</PaneTitle>
      <div className="my-2 select-none text-[30px] font-black tracking-[0.18em] text-transparent sm:text-[40px]"
        style={{
          WebkitTextStroke: "1px rgba(79,216,255,.85)",
          textShadow: "0 0 34px rgba(79,216,255,.35)",
        }}
      >
        PICKSAW
      </div>
      <p className="text-[10.5px] leading-[1.6] text-slate-300 sm:text-[13px] sm:leading-[1.7]">
        {c.meaning}
      </p>
      <p className="mt-3 rounded-sm border border-electric/30 bg-electric/10 px-3 py-1.5 text-[10px] font-semibold text-electric sm:text-[13px]">
        {u.quote}
      </p>
    </div>
  );
}

/* ── pane 3 — creative style ─────────────────────────────────────────── */
function StylePane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  return (
    <div className="flex h-full flex-col">
      <PaneTitle>{c.styleTitle}</PaneTitle>
      <ul className="flex min-h-0 flex-1 flex-col justify-center gap-1 sm:gap-1.5">
        {c.style.map((s, i) => (
          <li
            key={s}
            className="flex items-center gap-2 rounded-sm border border-white/5 bg-white/[0.03] px-2 py-1 sm:px-3 sm:py-1.5"
          >
            <span className="font-mono text-[9px] text-electric sm:text-[11px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[10px] leading-tight text-slate-200 sm:text-[13px]">
              {s}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center text-[9.5px] italic leading-snug text-slate-500 sm:text-[12px]">
        {c.styleNote}
      </p>
    </div>
  );
}

/* ── pane 4 — skills ─────────────────────────────────────────────────── */
function SkillsPane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  return (
    <div className="flex h-full flex-col">
      <PaneTitle>{c.skillsTitle}</PaneTitle>
      <ul className="grid min-h-0 flex-1 grid-cols-2 content-center gap-1.5 sm:gap-2">
        {c.skills.map((s) => (
          <li
            key={s}
            className="flex items-center gap-1.5 rounded-sm border border-electric/15 bg-white/[0.03] px-2 py-1.5 sm:px-2.5"
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-electric shadow-[0_0_8px_rgba(79,216,255,.9)]" />
            <span className="truncate text-[10px] font-medium text-slate-200 sm:text-[12.5px]">
              {s}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── pane 5 — contact ────────────────────────────────────────────────── */
function ContactPane({ lang }: { lang: Lang }) {
  const u = UI[lang];
  return (
    <div
      className="flex h-full flex-col items-center justify-center text-center"
      itemScope
      itemType="https://schema.org/Person"
    >
      <meta itemProp="name" content="Amirehsan Ashoori" />
      <h2 className="text-[17px] font-extrabold leading-tight sm:text-[22px]">
        {u.connect}
      </h2>
      <p className="mt-1.5 text-[10.5px] leading-snug text-slate-400 sm:text-[13px]">
        {u.connectSub}
      </p>
      <div className="mt-4 flex w-full flex-col gap-2">
        <a
          href={IG_URL}
          itemProp="sameAs"
          target="_blank"
          rel="me noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-sm border border-electric/40 bg-electric/10 px-3 py-2 text-[11px] font-semibold text-electric transition hover:bg-electric/20 sm:text-[13px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
          </svg>
          {u.instagram}
        </a>
        <a
          href={WA_URL}
          rel="me noopener noreferrer"
          itemProp="sameAs"
          target="_blank"
          className="flex items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-slate-100 transition hover:bg-white/10 sm:text-[13px]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
            <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
          </svg>
          {u.whatsapp}
        </a>
      </div>
      <p className="mt-4 text-[9px] uppercase tracking-[0.24em] text-slate-500 sm:text-[11px]">
        PICKSAW · Amirehsan Ashoori
      </p>
    </div>
  );
}

export default function AboutSceneFrames({
  lang,
  focusedIdx,
}: {
  lang: Lang;
  focusedIdx: number;
}) {
  const u = UI[lang];
  const panes = [
    <IdentityPane key="identity" lang={lang} />,
    <CreatePane key="create" lang={lang} />,
    <MeaningPane key="meaning" lang={lang} />,
    <StylePane key="style" lang={lang} />,
    <SkillsPane key="skills" lang={lang} />,
    <ContactPane key="contact" lang={lang} />,
  ];
  return (
    <>
      {panes.map((pane, i) => (
        <PaneShell
          key={i}
          lang={lang}
          index={i}
          focused={focusedIdx === i}
          label={u.panes[i]}
        >
          {pane}
        </PaneShell>
      ))}
    </>
  );
}
