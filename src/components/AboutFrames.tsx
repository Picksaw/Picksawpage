/**
 * AboutFrames — the six portrait, non-scrolling framed windows of the
 * standalone /about walk. Each pane is one fixed screen (auto-fitted to
 * the phone/PC viewport by Window3D); the OUTER page scroll moves the
 * visitor through the city from window to window — there is never an
 * inner scrollbar.
 *
 * The panes are OPEN frames with a frosted translucent surface: the neon
 * city stays visible behind them (like the template windows' glass),
 * while every block of plain text rides on its own dark translucent
 * panel — the same rgba(4,7,14,.88→.97) treatment as the template
 * painting caption strip — so copy stays perfectly readable.
 *
 * All facts/strings come from ABOUT_COPY so the static SEO copy and the
 * 3D walk never drift apart.
 */
import { ABOUT_COPY } from "./AboutSection";
import { Window3D } from "./journey/Corridor";
import MagneticButton from "./ui/MagneticButton";
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

/* Portrait window world-size: 3:4 — height-bound on portrait phones
 * (nearly fills the screen) while standing as a tall gallery pane on
 * desktop boulevards. Base resolutions: 400×533 mobile, 640×853 desktop. */
const W = 3.0;
const H = 4.0;

/** Frosted window surface — city visible through the glass. */
const SURFACE =
  "bg-gradient-to-b from-[#070c16]/65 via-[#05080f]/45 to-[#03050a]/75 backdrop-blur-[7px] ring-1 ring-inset ring-white/10";

/** Readable panel behind plain text — template-caption style, kept
 *  translucent so the neon city still glows behind the words. */
const TEXT_PANEL =
  "rounded-lg border border-white/10 bg-gradient-to-b from-[#070c16]/82 to-[#04070e]/74 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
/** Soft glass card for grids/lists. */
const GLASS_CARD =
  "rounded-md border border-white/10 bg-white/[0.06] backdrop-blur-sm";

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
      desktopW={640}
      scrollable={false}
      maxWFrac={0.94}
      maxHFrac={0.8}
      surfaceClass={SURFACE}
      openFrame
    >
      <div className="relative flex h-full w-full flex-col text-white">
        {/* pane tag */}
        <div className="flex items-center justify-between border-b border-electric/25 bg-black/25 px-3.5 py-1.5 sm:px-6 sm:py-2.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-electric sm:text-[12px]">
            {label}
          </span>
          <span
            dir="ltr"
            className="font-mono text-[9px] tracking-widest text-slate-400 sm:text-[12px]"
          >
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(ABOUT_FRAMES).padStart(2, "0")}
          </span>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 px-3.5 py-2.5 sm:gap-3 sm:px-6 sm:py-5">
          {children}
        </div>
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
    <h2 className="text-center text-[15px] font-bold leading-tight tracking-tight text-white sm:text-[24px]">
      {children}
    </h2>
  );
}

/* ── pane 0 — identity / bio ─────────────────────────────────────────── */
function IdentityPane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  const u = UI[lang];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 sm:gap-3">
      <div className="text-center">
        <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full border border-electric/50 bg-electric/10 font-black text-electric shadow-[0_0_24px_rgba(79,216,255,.35)] sm:mb-2 sm:h-14 sm:w-14 sm:text-xl">
          P
        </div>
        <h1 className="text-[16px] font-extrabold leading-tight sm:text-[26px]">
          {c.title}
        </h1>
        <p className="mt-0.5 text-[10px] font-medium text-electric sm:text-[14px]">
          {c.identity}
        </p>
      </div>

      <div className={`${TEXT_PANEL} px-3 py-2.5 text-center sm:px-5 sm:py-4`}>
        <p className="text-[10.5px] leading-[1.6] text-slate-200 sm:text-[14.5px] sm:leading-[1.75]">
          {c.lead}
        </p>
      </div>

      <div className="border-s-2 border-electric/50 bg-black/30 px-2.5 py-1.5 text-center backdrop-blur-sm sm:px-3.5 sm:py-2.5">
        <p className="text-[9.5px] italic leading-snug text-slate-300 sm:text-[13px] sm:leading-relaxed">
          {c.lead2}
        </p>
      </div>

      <p className="text-center text-[8.5px] uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">
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
      <div className="mt-1.5 grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-1.5 sm:mt-3 sm:gap-2.5">
        {c.disciplines.map((d) => (
          <div
            key={d.name}
            className={`${GLASS_CARD} flex min-h-0 flex-col p-1.5 sm:p-3`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-0.5 h-4 w-4 shrink-0 text-electric sm:mb-1.5 sm:h-6 sm:w-6"
            >
              <path d={d.icon} />
            </svg>
            <h3 className="mb-0.5 text-[9.5px] font-bold leading-tight text-white sm:text-[14px]">
              {d.name}
            </h3>
            <p className="min-h-0 flex-1 overflow-hidden text-[8.5px] leading-[1.38] text-slate-300 sm:text-[11.5px] sm:leading-[1.45]">
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
    <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center sm:gap-3">
      <PaneTitle>{c.meaningTitle}</PaneTitle>
      <div
        className="select-none text-[36px] font-black tracking-[0.16em] text-transparent sm:text-[56px]"
        style={{
          WebkitTextStroke: "1px rgba(79,216,255,.85)",
          textShadow: "0 0 34px rgba(79,216,255,.35)",
        }}
      >
        PICKSAW
      </div>
      <div className={`${TEXT_PANEL} px-3 py-2.5 sm:px-5 sm:py-4`}>
        <p className="text-[10px] leading-[1.6] text-slate-200 sm:text-[14px] sm:leading-[1.75]">
          {c.meaning}
        </p>
      </div>
      <p className="rounded-md border border-electric/30 bg-electric/10 px-3 py-1.5 text-[9.5px] font-semibold text-electric backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[13px]">
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
      <ul className="flex min-h-0 flex-1 flex-col justify-evenly py-1">
        {c.style.map((s, i) => (
          <li
            key={s}
            className={`${GLASS_CARD} mb-1 flex items-center gap-2 px-2.5 py-1.5 last:mb-0 sm:gap-3 sm:px-4 sm:py-2`}
          >
            <span className="font-mono text-[9px] text-electric sm:text-[12px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-[10px] leading-tight text-slate-100 sm:text-[13.5px]">
              {s}
            </span>
          </li>
        ))}
      </ul>
      <div className="bg-black/25 px-2.5 py-1 backdrop-blur-sm sm:px-4 sm:py-1.5">
        <p className="text-center text-[9px] italic leading-snug text-slate-400 sm:text-[12px]">
          {c.styleNote}
        </p>
      </div>
    </div>
  );
}

/* ── pane 4 — skills ─────────────────────────────────────────────────── */
function SkillsPane({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];
  return (
    <div className="flex h-full flex-col">
      <PaneTitle>{c.skillsTitle}</PaneTitle>
      <ul className="grid min-h-0 flex-1 grid-cols-2 content-evenly gap-1.5 sm:gap-2.5">
        {c.skills.map((s) => (
          <li
            key={s}
            className={`${GLASS_CARD} flex items-center gap-1.5 px-2 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2.5`}
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-electric shadow-[0_0_8px_rgba(79,216,255,.9)] sm:h-1.5 sm:w-1.5" />
            <span className="truncate text-[10px] font-medium text-slate-100 sm:text-[13px]">
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
    <div className="flex h-full items-center">
      <div
        className={`${TEXT_PANEL} flex w-full flex-col gap-2 rounded-xl p-3.5 text-center sm:gap-4 sm:p-7`}
        itemScope
        itemType="https://schema.org/Person"
      >
        {/* machine-readable identity + rel=me verification */}
        <meta itemProp="name" content="Amirehsan Ashoori" />
        <meta
          itemProp="jobTitle"
          content="Founder, Creative Developer, Designer & Multidisciplinary Artist"
        />
        <link rel="me" itemProp="sameAs" href={IG_URL} />
        <link rel="me" itemProp="sameAs" href={WA_URL} />

        <h2 className="text-[15px] font-extrabold leading-tight text-white sm:text-[22px]">
          {u.connect}
        </h2>
        <p className="text-[10px] leading-snug text-slate-300 sm:text-[13.5px] sm:leading-relaxed">
          {u.connectSub}
        </p>

        <div className="mt-1 flex flex-col gap-2 sm:mt-2">
          <MagneticButton
            href={IG_URL}
            strength={0.22}
            className="!w-full !rounded-xl !px-4 !py-2.5 !text-[10.5px] sm:!py-3 sm:!text-[13.5px] !bg-gradient-to-b !from-[#8beeff] !to-[#2fb8e8] !text-slate-950 !shadow-[0_6px_30px_-8px_rgba(79,216,255,.7)]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
            </svg>
            {u.instagram}
          </MagneticButton>
          <MagneticButton
            href={WA_URL}
            variant="ghost"
            strength={0.22}
            className="!w-full !rounded-xl !border !border-white/15 !px-4 !py-2.5 !text-[10.5px] text-slate-100 sm:!py-3 sm:!text-[13.5px]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.5L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
            </svg>
            {u.whatsapp}
          </MagneticButton>
        </div>

        <p className="mt-0.5 text-[8.5px] uppercase tracking-[0.24em] text-slate-400 sm:text-[11px]">
          PICKSAW · Amirehsan Ashoori
        </p>
      </div>
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
