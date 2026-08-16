import Reveal from "./Reveal";
import GamePromo from "./GamePromo";

interface HeroProps {
  gameLink: string;
  isAdmin: boolean;
  onEditGameLink: () => void;
}

export default function Hero({ gameLink, isAdmin, onEditGameLink }: HeroProps) {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col items-center justify-center px-4 py-28 text-center sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-[120px] animate-pulse-slow" />
      </div>

      <Reveal>
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
          </span>
          <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
            Born From Static
          </span>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
            Picksaw
          </span>
        </h1>
      </Reveal>

      <Reveal delay={160}>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          Videos, music, and visuals — uploaded, curated, and experienced in the storm.
        </p>
      </Reveal>

      {/* Game promo — right under the welcome message */}
      <div className="mt-10 w-full">
        <GamePromo gameLink={gameLink} isAdmin={isAdmin} onEditLink={onEditGameLink} />
      </div>

      <Reveal delay={240}>
        <a
          href="#feed"
          className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition-all duration-300 hover:scale-[1.03] hover:shadow-white/20"
        >
          Browse the feed
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </Reveal>

      <Reveal delay={350}>
        <div className="mt-14 flex flex-col items-center gap-2">
          <span className="flex h-10 w-6 items-start justify-center rounded-full border border-white/15 p-1.5">
            <span className="h-2 w-1 animate-scroll-dot rounded-full bg-cyan-300/80" />
          </span>
        </div>
      </Reveal>
    </section>
  );
}
