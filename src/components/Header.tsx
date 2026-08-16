import { useState, useEffect } from "react";

interface HeaderProps {
  isAdmin: boolean;
  onAdminOpen: () => void;
  onLoginOpen: () => void;
  onLogout: () => void;
}

export default function Header({ isAdmin, onAdminOpen, onLoginOpen, onLogout }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-xl transition-all duration-500 sm:px-5 ${
            scrolled
              ? "border-white/10 bg-slate-950/70 shadow-2xl shadow-black/40"
              : "border-transparent bg-transparent"
          }`}
          aria-label="Primary"
        >
          {/* Logo — text only */}
          <a href="#top" className="group flex items-center">
            <span className="text-lg font-bold tracking-tight text-white transition-transform duration-300 group-hover:scale-105">
              Pick<span className="text-cyan-300">saw</span>
            </span>
          </a>

          {/* Nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {[
              { href: "#top", label: "Home" },
              { href: "#feed", label: "Feed" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-lg px-3.5 py-2 text-sm text-slate-300 transition-colors duration-200 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                {/* Admin badge + new post */}
                <span className="hidden items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cyan-300 sm:flex">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Admin
                </span>

                <button
                  type="button"
                  onClick={onAdminOpen}
                  className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white sm:inline-flex"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  New post
                </button>

                <button
                  type="button"
                  onClick={onAdminOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white sm:hidden"
                  title="New post"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-slate-500 transition-all hover:border-white/20 hover:text-slate-300 sm:block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                {/* Sign in button — always shown. This is only a UI affordance;
                    real authorization is enforced server-side by the Worker.
                    If the Worker URL is not configured, login simply fails. */}
                <button
                  type="button"
                  onClick={onLoginOpen}
                  className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2 text-xs text-slate-500 transition-all hover:border-white/15 hover:bg-white/[0.06] hover:text-slate-300 sm:inline-flex"
                  title="Admin sign in"
                  aria-label="Admin sign in"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </button>

                {/* Explore CTA */}
                <a
                  href="#feed"
                  className="group relative overflow-hidden rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-white/10 transition-all duration-300 hover:shadow-white/20"
                >
                  <span className="relative z-10">Explore</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-cyan-200 via-white to-sky-200 transition-transform duration-500 group-hover:translate-x-0" />
                </a>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
