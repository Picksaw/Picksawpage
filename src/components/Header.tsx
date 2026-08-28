import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import type { Lang } from "../config/siteTexts";
import { SITE_TEXTS } from "../config/siteTexts";
import Logo3D from "./Logo3D";
import { scrollToTarget } from "../lib/lenis";
import { cn } from "../utils/cn";

interface HeaderProps {
  isAdmin: boolean;
  lang: Lang;
  onAdminOpen: () => void;
  onLoginOpen: () => void;
  onLogout: () => void;
  onToggleLang: () => void;
}

export default function Header({
  isAdmin,
  lang,
  onAdminOpen,
  onLoginOpen,
  onLogout,
  onToggleLang,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const t = SITE_TEXTS[lang];

  const navLinks = [
    { to: "/", label: t.navHome },
    { to: "/feed", label: t.navFeed },
  ];

  return (
    <header
      // notch-safe: keep the nav clear of the status-bar cutout
      style={{ paddingTop: `calc(env(safe-area-inset-top, 0px) + ${scrolled ? "0.75rem" : "1.25rem"})` }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "pb-3" : "pb-5"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-5",
            scrolled
              ? "glass-strong bolt-lit shadow-2xl shadow-black/40"
              : "border border-transparent bg-transparent"
          )}
          aria-label="Primary"
        >
          {/* Logo — the 3D P + wordmark */}
          <Link to="/" className="group flex items-center gap-2.5" aria-label="Picksaw — home">
            <motion.span whileHover={{ scale: 1.06 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
              <Logo3D
                size={scrolled ? 34 : 42}
                className="drop-shadow-[0_0_12px_rgba(79,216,255,0.35)] transition-all duration-500"
              />
            </motion.span>
            <span
              className={cn(
                "bolt-text logo-wordmark hidden font-bold tracking-tight text-white transition-all duration-500 sm:block",
                scrolled ? "text-base" : "text-lg"
              )}
            >
              Pick<span className="text-electric">saw</span>
            </span>
          </Link>

          {/* Nav links — sliding active indicator + electric underline */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const active = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  data-active={active}
                  className={cn(
                    "electric-underline relative rounded-lg px-3.5 py-2 text-sm transition-colors duration-200",
                    active ? "text-white" : "text-slate-300 hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 -z-10 rounded-lg border border-white/10 bg-white/10"
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                  {l.label}
                </Link>
              );
            })}
            {location.pathname === "/" && (
              <button
                type="button"
                onClick={() => scrollToTarget("#templates")}
                className="electric-underline rounded-lg px-3.5 py-2 text-sm text-slate-300 transition-colors duration-200 hover:text-white"
              >
                {t.templatesTitle}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              type="button"
              onClick={onToggleLang}
              className="glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-white/25 hover:text-white"
              aria-label="Toggle language"
              title={lang === "en" ? "فارسی" : "English"}
            >
              <span className="text-electric">{lang.toUpperCase()}</span>
              <span>/</span>
              <span className="text-slate-500">{lang === "en" ? "fa" : "en"}</span>
            </button>

            {isAdmin ? (
              <>
                <span className="glass bolt-lit hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-electric sm:flex">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  Admin
                </span>

                <button
                  type="button"
                  onClick={onAdminOpen}
                  className="glass hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:text-white sm:inline-flex"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  New post
                </button>

                <button
                  type="button"
                  onClick={onAdminOpen}
                  className="glass flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:text-white sm:hidden"
                  title="New post"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="hidden rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-500 transition-all hover:border-white/15 hover:text-slate-300 sm:block"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
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

                <Link
                  to="/feed"
                  className="reflect-sweep group relative overflow-hidden rounded-xl bg-gradient-to-b from-white to-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_4px_28px_-6px_rgba(79,216,255,0.5)] transition-shadow duration-300 hover:shadow-[0_4px_36px_-4px_rgba(79,216,255,0.75)]"
                >
                  <span className="relative z-10">{t.exploreButton}</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
