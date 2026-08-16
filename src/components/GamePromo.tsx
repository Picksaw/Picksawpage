import Reveal from "./Reveal";

interface GamePromoProps {
  gameLink: string;
  isAdmin: boolean;
  onEditLink: () => void;
}

export default function GamePromo({ gameLink, isAdmin, onEditLink }: GamePromoProps) {
  const hasLink = gameLink.trim().length > 0;

  return (
    <section className="relative">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 p-1 shadow-2xl shadow-indigo-500/10 transition-all duration-500 hover:border-indigo-400/30 hover:shadow-indigo-500/20">
            {/* Background glow effects */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute left-1/4 top-0 h-40 w-40 rounded-full bg-cyan-500/20 blur-[80px] group-hover:bg-cyan-400/30 transition-all duration-700" />
              <div className="absolute right-1/4 bottom-0 h-40 w-40 rounded-full bg-purple-500/20 blur-[80px] group-hover:bg-purple-400/30 transition-all duration-700" />
            </div>

            <div className="relative flex flex-col sm:flex-row items-center gap-6 rounded-[22px] bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 px-6 py-6 sm:px-8 sm:py-8">
              {/* Game icon */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 -m-2 rounded-full bg-cyan-400/15 blur-xl animate-pulse-slow" />
                <img
                  src="./images/stormblade-icon.png"
                  alt="Stormblade"
                  className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 border-cyan-400/30 shadow-[0_0_30px_rgba(34,211,238,0.25)] object-cover"
                  draggable={false}
                />
              </div>

              {/* Text */}
              <div className="flex flex-1 flex-col items-center sm:items-start text-center sm:text-left">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400/80">
                  Featured Game
                </p>
                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Storm<span className="text-cyan-300">blade</span>
                </h3>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={onEditLink}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-cyan-300"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {hasLink ? "Edit game link" : "Set game link"}
                  </button>
                )}
              </div>

              {/* Play button */}
              <a
                href={hasLink ? gameLink : undefined}
                target={hasLink ? "_blank" : undefined}
                rel={hasLink ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (!hasLink) e.preventDefault();
                }}
                className={`group/btn relative shrink-0 inline-flex items-center gap-2.5 overflow-hidden rounded-2xl px-7 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 ${
                  hasLink
                    ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-slate-950 shadow-cyan-500/30 hover:scale-[1.04] hover:shadow-cyan-400/40 hover:from-cyan-300 hover:to-sky-400"
                    : "cursor-not-allowed bg-white/10 text-slate-500"
                }`}
              >
                <svg className="h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110" viewBox="0 0 24 24" fill="currentColor">
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
