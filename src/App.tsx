import { useState, useCallback, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import StormBackground from "./components/StormBackground";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";
import AdminPanel from "./components/AdminPanel";
import PostModal from "./components/PostModal";
import LoginModal from "./components/LoginModal";
import FloatingDock from "./components/FloatingDock";
import CursorFX from "./components/CursorFX";
import Loader from "./components/Loader";
import DevPanel from "./components/DevPanel";
import { SoundProvider } from "./audio/SoundProvider";
import { setLenis } from "./lib/lenis";
import { getStorm, setDevMode, setStormOverride, subscribeStorm } from "./lib/stormStore";
import { useAdmin } from "./hooks/useAdmin";
import { useLanguage } from "./hooks/useLanguage";
import {
  fetchPosts,
  createPostApi,
  deletePostApi,
  AuthError,
  type NewPostInput,
} from "./api/posts";
import { type Post } from "./types";
import { SITE_TEXTS } from "./config/siteTexts";
import { AnimatePresence, motion } from "motion/react";

// ============================================================
// GAME LINK
// Change this URL whenever your StormBlade game URL changes.
// Then rebuild/redeploy the website.
// ============================================================
export const GAME_LINK = "https://stormblade.picksaw.ir";

export default function App() {
  const { lang, toggle } = useLanguage();
  const { isAdmin, login, logout } = useAdmin();

  const [posts, setPosts] = useState<Post[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [devMode, setDevModeState] = useState(false);

  // ── smooth scroll spine ────────────────────────────────────
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touchDevice =
      window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;

    // Native momentum scrolling is dramatically cheaper on mobile. Lenis
    // keeps its own rAF scroll loop alive during touch scroll, which was a
    // major contributor to the 6 fps mobile scroll drops.
    if (reduced || touchDevice) {
      setLenis(null);
      return;
    }

    let lenis: import("lenis").default | null = null;
    let raf = 0;
    let cancelled = false;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      setLenis(lenis);
      const loop = (time: number) => {
        lenis?.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  // ── load posts from Worker/D1 ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchPosts();
        if (!cancelled) setPosts(loaded);
      } catch {
        if (!cancelled) setPosts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── hidden details ─────────────────────────────────────────
  // "storm" easter egg — heavier weather for 20s
  useEffect(() => {
    let buffer = "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-8);
      if (buffer.endsWith("storm")) {
        setStormOverride(1, 20000);
        setToast(lang === "fa" ? "حالت طوفان فعال شد ⚡" : "Storm mode engaged ⚡");
        window.setTimeout(() => setToast(null), 3200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lang]);

  // logo shimmer after inactivity
  useEffect(() => {
    let idleTimer = 0;
    const reset = () => {
      window.clearTimeout(idleTimer);
      document.body.classList.remove("idle-shimmer");
      idleTimer = window.setTimeout(() => {
        document.body.classList.add("idle-shimmer");
        window.setTimeout(() => document.body.classList.remove("idle-shimmer"), 2600);
      }, 45000);
    };
    reset();
    window.addEventListener("pointermove", reset, { passive: true });
    window.addEventListener("keydown", reset);
    return () => {
      window.clearTimeout(idleTimer);
      window.removeEventListener("pointermove", reset);
      window.removeEventListener("keydown", reset);
      document.body.classList.remove("idle-shimmer");
    };
  }, []);

  // dev mode visibility
  useEffect(() => subscribeStorm(() => setDevModeState(getStorm().devMode)), []);
  useEffect(() => () => setDevMode(false), []);

  // ── post/auth handlers (unchanged behavior) ────────────────
  const handleAddPost = useCallback(
    async (input: NewPostInput): Promise<void> => {
      try {
        const saved = await createPostApi(input);
        setPosts((prev) => [saved, ...prev]);
      } catch (err) {
        if (err instanceof AuthError) logout();
        throw err;
      }
    },
    [logout]
  );

  const handleDeletePost = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deletePostApi(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        if (err instanceof AuthError) logout();
        throw err;
      }
    },
    [logout]
  );

  const handlePostClick = useCallback((post: Post) => setSelectedPost(post), []);
  const handleCloseModal = useCallback(() => setSelectedPost(null), []);

  const handleLogin = useCallback(
    async (password: string): Promise<boolean> => {
      const success = await login(password);
      if (success) setShowLogin(false);
      return success;
    },
    [login]
  );

  const handleAdminOpen = useCallback(() => {
    if (isAdmin) setShowAdmin(true);
    else setShowLogin(true);
  }, [isAdmin]);

  const handleLogout = useCallback(() => logout(), [logout]);

  const t = SITE_TEXTS[lang];

  return (
    <SoundProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-storm-950 text-slate-100 antialiased">
        {/* the storm never stops */}
        <StormBackground />

        {/* film grain */}
        <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[80] opacity-[0.05]" />
        <CursorFX />

        <div
          className="relative z-10"
          dir={lang === "fa" ? "rtl" : "ltr"}
          style={{ visibility: introDone ? undefined : "hidden" }}
        >
          <a
            href="#top"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900"
          >
            {t.skipLink}
          </a>

          <Header
            isAdmin={isAdmin}
            lang={lang}
            onAdminOpen={handleAdminOpen}
            onLoginOpen={() => setShowLogin(true)}
            onLogout={handleLogout}
            onToggleLang={toggle}
          />

          <main>
            <Routes>
              <Route path="/" element={<HomePage lang={lang} />} />
              <Route
                path="/feed"
                element={
                  <FeedPage
                    lang={lang}
                    posts={posts}
                    isAdmin={isAdmin}
                    onPostClick={handlePostClick}
                    onDeletePost={handleDeletePost}
                    gameLink={GAME_LINK}
                  />
                }
              />
              <Route path="*" element={<HomePage lang={ lang} />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="relative border-t border-white/8 py-12">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/40 to-transparent"
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="logo-wordmark text-sm font-bold text-white">
                  Pick<span className="text-electric">saw</span>
                </p>
                <p className="text-xs text-slate-600">
                  {t.footerText.replace("{year}", String(new Date().getFullYear()))}
                </p>
                <p className="text-xs text-slate-700">{t.footerTagline}</p>
              </div>
            </div>
          </footer>
        </div>

        {/* the signal hub — contact + sound */}
        <FloatingDock lang={lang} />

        {/* hidden dev mode */}
        {devMode && <DevPanel />}

        {/* easter egg toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              className="glass-strong bolt-lit fixed bottom-24 left-1/2 z-[85] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium text-electric"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login modal */}
        {showLogin && <LoginModal onLogin={handleLogin} onClose={() => setShowLogin(false)} />}

        {/* Admin modal — only when logged in */}
        {showAdmin && isAdmin && (
          <AdminPanel onAddPost={handleAddPost} onClose={() => setShowAdmin(false)} />
        )}

        {/* Post modal */}
        {selectedPost && <PostModal post={selectedPost} onClose={handleCloseModal} />}

        {/* premium intro — last so it sits above everything */}
        {!introDone && <Loader onDone={() => setIntroDone(true)} />}
      </div>
    </SoundProvider>
  );
}
