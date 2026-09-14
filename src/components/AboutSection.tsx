import Reveal from "./Reveal";
import { type Lang } from "../config/siteTexts";

/**
 * AboutSection — the crawlable, human-readable "About Me" station on the
 * journey. Carries schema.org Person microdata (itemScope) and a
 * rel="me" link to the verified Instagram profile, mirroring the
 * JSON-LD graph so Google and AI crawlers get the bio as real DOM text,
 * not just structured data.
 */

export const ABOUT_COPY = {
  en: {
    kicker: "About",
    title: "Amirehsan Ashoori",
    identity: "Creator behind PICKSAW",
    lead: "My name is Amirehsan Ashoori, and I'm the creator behind PICKSAW — a creative identity that brings together technology, design, art, music and storytelling. I don't focus on a single medium. I build across whatever helps an idea come to life, whether that's a website, a 3D world, a cinematic edit, a piece of music, or an AI-generated concept.",
    lead2: "I see creativity as one connected ecosystem where code, visuals, sound and atmosphere work together.",
    createTitle: "What I Create",
    meaningTitle: "The Meaning of PICKSAW",
    meaning:
      "PICKSAW is my creative brand — a place where different disciplines meet. Some projects become websites, others become 3D scenes, AI films, music or experimental concepts. The medium changes, but the goal stays the same: build something that leaves an impression.",
    styleTitle: "My Creative Style",
    style: [
      "Cyberpunk and futuristic worlds",
      "Persian art and cultural influences",
      "Cinematic lighting and atmosphere",
      "Architecture and minimalism",
      "Mystery, masks and symbolic storytelling",
      "Black-and-white contrast with selective color",
      "Nature mixed with technology",
    ],
    styleNote:
      "Rather than following trends, I'm interested in experiences that feel memorable and emotionally atmospheric.",
    skillsTitle: "Skills & Creative Areas",
    skills: [
      "Web Design",
      "Front-End Development",
      "UI/UX Design",
      "3D Environment Creation",
      "Unreal Engine",
      "Creative Coding",
      "AI Art",
      "AI Video",
      "Digital Illustration",
      "Motion Design",
      "Music Production",
      "Rap & Lyric Writing",
      "Sound Design",
      "Visual Branding",
      "Concept Development",
      "Digital Storytelling",
    ],
    disciplines: [
      {
        name: "Web Design & Development",
        desc: "Modern websites, interactive landing pages and premium templates with visual storytelling, smooth UX and cinematic presentation.",
        icon: "M3 5h18v14H3zM3 9h18M7 7h.01",
      },
      {
        name: "3D Art & Unreal Engine",
        desc: "Environments, experiments and cinematic scenes — procedural generation, lighting, world-building and real-time rendering.",
        icon: "M12 2 3 7l9 5 9-5-9-5Zm-9 10 9 5 9-5M3 12v5l9 5 9-5v-5",
      },
      {
        name: "AI Art & Video",
        desc: "Original artwork, animated concepts, character designs, live wallpapers and visual experiments blending imagination with technical workflows.",
        icon: "M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8L12 3Zm7 11 1 2.4L22 17l-2 1-1 2.4-1-2.4-2-1 2-.6L19 14Z",
      },
      {
        name: "Music & Sound",
        desc: "Music production, rap writing, atmosphere-driven composition and sound design — stories told beyond the visual.",
        icon: "M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
      },
      {
        name: "Creative Coding",
        desc: "Interactive experiences where programming becomes part of the art — animation, motion, effects and experimental interfaces.",
        icon: "M8 9l-4 3 4 3m8-6 4 3-4 3M14 4l-4 16",
      },
      {
        name: "Branding & Visual Identity",
        desc: "Visual identities, concepts and creative systems that make projects feel distinctive rather than generic.",
        icon: "M12 3a9 9 0 1 0 9 9c0-1.2-1-2-2-2h-1.8a1.7 1.7 0 0 1-1.2-2.9A9 9 0 0 0 12 3Zm0 5a4 4 0 1 0 4 4",
      },
    ],
    follow: "Instagram @picksawm",
  },
  fa: {
    kicker: "درباره من",
    title: "امیراحسان عاشوری",
    identity: "خالق PICKSAW",
    lead: "من امیراحسان عاشوری هستم، خالق PICKSAW — یک هویت خلاق که فناوری، طراحی، هنر، موسیقی و روایت را کنار هم می‌آورد. من به یک مدیوم محدود نیستم؛ هر چیزی که به جان گرفتن یک ایده کمک کند می‌سازم؛ چه یک وب‌سایت، یک دنیای سه‌بعدی، یک تدوین سینمایی، یک قطعه موسیقی یا یک مفهوم ساخته‌شده با هوش مصنوعی.",
    lead2: "خلاقیت را به‌عنوان یک اکوسیستم به‌هم‌پیوسته می‌بینم که در آن کد، تصویر، صدا و فضا با هم کار می‌کنند.",
    createTitle: "چه چیزی می‌سازم",
    meaningTitle: "معنای PICKSAW",
    meaning:
      "PICKSAW برند خلاقانه من است؛ جایی که رشته‌های گوناگون به هم می‌رسند. بعضی پروژه‌ها وب‌سایت می‌شوند، بعضی صحنه‌های سه‌بعدی، فیلم‌های هوش مصنوعی، موسیقی یا مفاهیم تجربی. مدیوم عوض می‌شود، اما هدف یکی است: ساختن چیزی که اثری ماندگار بگذارد.",
    styleTitle: "سبک خلاقانه من",
    style: [
      "دنیاهای سایبرپانک و آینده‌نگر",
      "هنر و فرهنگ ایرانی",
      "نورپردازی و فضای سینمایی",
      "معماری و مینیمالیسم",
      "راز، ماسک‌ها و روایت نمادین",
      "تضاد سیاه‌وسفید با رنگ انتخابی",
      "طبیعت درآمیخته با فناوری",
    ],
    styleNote:
      "به‌جای دنبال‌کردن ترندها، به دنبال تجربه‌هایی هستم که به‌یادماندنی و از نظر احساسی جوی باشند.",
    skillsTitle: "مهارت‌ها و حوزه‌های خلاقیت",
    skills: [
      "طراحی وب",
      "توسعه فرانت‌اند",
      "طراحی UI/UX",
      "ساخت محیط سه‌بعدی",
      "موتور Unreal",
      "کدنویسی خلاقانه",
      "هنر هوش مصنوعی",
      "ویدیوی هوش مصنوعی",
      "تصویرسازی دیجیتال",
      "طراحی حرکت (موشن)",
      "تولید موسیقی",
      "رپ و ترانه‌نویسی",
      "طراحی صدا",
      "برندینگ بصری",
      "توسعه مفهوم",
      "روایت دیجیتال",
    ],
    disciplines: [
      {
        name: "طراحی و توسعه وب",
        desc: "وب‌سایت‌های مدرن، لندینگ‌پیج‌های تعاملی و قالب‌های پریمیوم با تمرکز بر روایت بصری، تجربه کاربری روان و ارائه سینمایی.",
        icon: "M3 5h18v14H3zM3 9h18M7 7h.01",
      },
      {
        name: "هنر سه‌بعدی و Unreal",
        desc: "محیط‌ها، تجربه‌ها و صحنه‌های سینمایی؛ تولید رویه‌ای، نورپردازی، جهان‌سازی و رندر بلادرنگ.",
        icon: "M12 2 3 7l9 5 9-5-9-5Zm-9 10 9 5 9-5M3 12v5l9 5 9-5v-5",
      },
      {
        name: "هنر و ویدیوی هوش مصنوعی",
        desc: "آرت‌ورک اصلی، مفاهیم متحرک، طراحی کاراکتر، والپیپرهای زنده و آزمایش‌های بصری با ترکیب تخیل و گردش‌کار فنی.",
        icon: "M12 3l2.2 5.2L20 10l-5.8 1.8L12 17l-2.2-5.2L4 10l5.8-1.8L12 3Zm7 11 1 2.4L22 17l-2 1-1 2.4-1-2.4-2-1 2-.6L19 14Z",
      },
      {
        name: "موسیقی و صدا",
        desc: "تولید موسیقی، ترانه‌نویسی رپ، آهنگسازی جوی و طراحی صدا؛ روایت داستان فراتر از تصویر.",
        icon: "M9 18V5l10-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
      },
      {
        name: "کدنویسی خلاقانه",
        desc: "تجربه‌های تعاملی که در آن‌ها برنامه‌نویسی بخشی از هنر است؛ انیمیشن، حرکت، افکت‌ها و رابط‌های تجربی.",
        icon: "M8 9l-4 3 4 3m8-6 4 3-4 3M14 4l-4 16",
      },
      {
        name: "برندینگ و هویت بصری",
        desc: "هویت‌های بصری، مفاهیم و سیستم‌های خلاقانه که پروژه‌ها را متمایز و غیرکلیشه‌ای می‌کنند.",
        icon: "M12 3a9 9 0 1 0 9 9c0-1.2-1-2-2-2h-1.8a1.7 1.7 0 0 1-1.2-2.9A9 9 0 0 0 12 3Zm0 5a4 4 0 1 0 4 4",
      },
    ],
    follow: "اینستاگرام @picksawm",
  },
} as const;

export default function AboutSection({ lang }: { lang: Lang }) {
  const c = ABOUT_COPY[lang];

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative py-20 sm:py-24"
      itemScope
      itemType="https://schema.org/Person"
    >
      {/* schema.org identity hooks (invisible but machine-readable) */}
      <meta itemProp="alternateName" content="امیراحسان عاشوری" />
      <meta itemProp="jobTitle" content="Founder, Creative Developer, Designer & Multidisciplinary Artist" />
      <meta itemProp="nationality" content="Iran" />
      <div
        itemProp="address"
        itemScope
        itemType="https://schema.org/PostalAddress"
        className="hidden"
      >
        <meta itemProp="addressCountry" content="IR" />
      </div>
      <link itemProp="url" href="https://picksaw.ir/" />
      <link itemProp="sameAs" href="https://www.instagram.com/picksawm/" />
      <link itemProp="sameAs" href="https://wa.me/989380215823" />
      <meta itemProp="knowsLanguage" content="English" />
      <meta itemProp="knowsLanguage" content="Persian" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center">
          <Reveal>
            <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-electric">
              {c.kicker}
            </span>
          </Reveal>
          <Reveal delay={70}>
            <h2
              id="about-heading"
              itemProp="name"
              className="bolt-text mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              {c.title}
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-400 sm:text-base">
              {c.identity}
            </p>
          </Reveal>
          <Reveal delay={160}>
            <p
              className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base"
              itemProp="description"
            >
              {c.lead}
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
              {c.lead2}
            </p>
          </Reveal>
        </div>

        {/* disciplines */}
        <div className="mt-12">
          <Reveal>
            <h3 className="mb-6 text-center text-lg font-bold tracking-tight text-white sm:text-xl">
              {c.createTitle}
            </h3>
          </Reveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.disciplines.map((d, i) => (
              <Reveal key={d.name} delay={i * 70}>
                <div className="glass bolt-lit group h-full rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-electric/10">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-electric"
                      style={{ filter: "drop-shadow(0 0 6px rgb(var(--accent) / 0.5))" }}
                    >
                      <path d={d.icon} />
                    </svg>
                  </div>
                  <h4 className="mb-1.5 text-sm font-bold text-white sm:text-base">{d.name}</h4>
                  <p className="text-xs leading-relaxed text-slate-400">{d.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* meaning of PICKSAW */}
        <Reveal delay={120}>
          <div className="glass mt-10 rounded-2xl p-6 text-center sm:p-8">
            <h3 className="bolt-text text-lg font-bold tracking-tight text-white sm:text-2xl">
              {c.meaningTitle}
            </h3>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {c.meaning}
            </p>
          </div>
        </Reveal>

        {/* creative style */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div>
              <h3 className="mb-4 text-lg font-bold tracking-tight text-white">{c.styleTitle}</h3>
              <ul className="space-y-2">
                {c.style.map((s) => (
                  <li key={s} className="flex items-start gap-3 text-sm text-slate-300">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 h-4 w-4 shrink-0 text-electric"
                    >
                      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs italic leading-relaxed text-slate-500">{c.styleNote}</p>
            </div>
          </Reveal>

          {/* skills */}
          <Reveal delay={100}>
            <div>
              <h3 className="mb-4 text-lg font-bold tracking-tight text-white">{c.skillsTitle}</h3>
              <div className="flex flex-wrap gap-2">
                {c.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-electric/20 bg-electric/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-electric/50 hover:text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <a
                href="https://www.instagram.com/picksawm/"
                target="_blank"
                rel="me noopener noreferrer"
                itemProp="sameAs"
                className="mt-7 inline-flex items-center gap-2 rounded-full border border-electric/40 bg-electric/10 px-5 py-2.5 text-sm font-semibold text-electric transition-all hover:bg-electric/20"
                style={{ filter: "drop-shadow(0 0 10px rgb(var(--accent) / 0.25))" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
                </svg>
                {c.follow}
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * AboutStaticText — the same About content as plain, always-in-the-DOM,
 * visually-hidden markup mounted OUTSIDE the 3D journey. The in-world
 * HtmlSection is at opacity 0 until the camera reaches it, so this
 * guarantees crawlers and screen readers can always read the founder
 * bio, disciplines and skills (the visible About station renders this
 * exact content — no cloaking).
 */
export function AboutStaticText() {
  return (
    <aside className="sr-only" aria-label="About Amirehsan Ashoori and PICKSAW">
      {(["en", "fa"] as const).map((lang) => {
        const c = ABOUT_COPY[lang];
        return (
          <section
            key={lang}
            lang={lang}
            dir={lang === "fa" ? "rtl" : "ltr"}
            itemScope
            itemType="https://schema.org/Person"
          >
            <meta itemProp="alternateName" content={lang === "fa" ? "امیراحسان عاشوری" : "Amirehsan Ashoori"} />
            <meta itemProp="jobTitle" content={c.identity} />
            <meta itemProp="nationality" content="Iran" />
            <link itemProp="url" href="https://picksaw.ir/" />
            <link itemProp="sameAs" href="https://www.instagram.com/picksawm/" />
            <h2 itemProp="name">{c.title}</h2>
            <p>{c.identity}</p>
            <p itemProp="description">{c.lead}</p>
            <p>{c.lead2}</p>
            <h3>{c.createTitle}</h3>
            <ul>
              {c.disciplines.map((d) => (
                <li key={d.name}>
                  <strong>{d.name}</strong> — {d.desc}
                </li>
              ))}
            </ul>
            <h3>{c.meaningTitle}</h3>
            <p>{c.meaning}</p>
            <h3>{c.styleTitle}</h3>
            <ul>
              {c.style.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p>{c.styleNote}</p>
            <h3>{c.skillsTitle}</h3>
            <ul>
              {c.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <p>
              Website: https://picksaw.ir/ · Instagram:{" "}
              <a href="https://www.instagram.com/picksawm/" rel="me">
                @picksawm
              </a>{" "}
              · WhatsApp: +98 938 021 5823
            </p>
          </section>
        );
      })}
    </aside>
  );
}
