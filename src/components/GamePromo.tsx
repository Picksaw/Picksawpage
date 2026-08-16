import Reveal from "./Reveal";

interface GamePromoProps {
  gameLink: string;
}

export default function GamePromo({ gameLink }: GamePromoProps) {
  const hasLink = gameLink.trim().length > 0;

  return (
    <section className="relative">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 p-1 shadow-2xl shadow-indigo-500/10 transition-all duration-500 hover:border-indigo-400/30 hover:shadow-indigo-500/20">
            {/* Background glow effects */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-1/4 top-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-[80px] transition-all duration-700 group-hover:bg-cyan-400/30" />
              <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-purple-500/20 blur-[80px] transition-all duration-700 group-hover:bg-purple-400/30" />
            </div>

            <div className="relative flex flex-col items-center gap-6 rounded-[22px] bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 px-6 py-6 sm:flex-row sm:px-8 sm:py-8">
              {/* Game icon */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 -m-2 animate-pulse-slow rounded-full bg-cyan-400/15 blur-xl" />

                <img
                  src="./images/stormblade-icon.png"
                  alt="Stormblade"
                  className="relative h-20 w-20 rounded-full border-2 border-cyan-400/30 object-cover shadow-[0_0_30px_rgba(34,211,238,0.25)] sm:h-24 sm:w-24"
                  draggable={false}
                />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400/80">
                  Featured Game
                </p>

                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Storm<span className="text-cyan-300">blade</span>
                </h3>
              </div>

              {/* Play button */}
              <a
                href={hasLink ? gameLink : undefined}
                target={hasLink ? "_blank" : undefined}
                rel={hasLink ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (!hasLink) {
                    e.preventDefault();
                  }
                }}
                className={`group/btn relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 ${
                  hasLink
                    ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-cyan-500/30 hover:scale-[1.04] hover:from-cyan-300 hover:to-sky-400 hover:shadow-cyan-400/40"
                    : "cursor-not-allowed bg-white/10 text-slate-500"
                }`}
              >
                <svg
                  className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>

                Play Now
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}