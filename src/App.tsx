import { useState, useCallback, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import StormBackground from "./components/StormBackground";
import GraffitiText from "./components/GraffitiText";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import FeedPage from "./pages/FeedPage";
import AdminPanel from "./components/AdminPanel";
import PostModal from "./components/PostModal";
import LoginModal from "./components/LoginModal";
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

// ============================================================
// GAME LINK
// Change this URL whenever your StormBlade game URL changes.
// Then rebuild/redeploy the website.
// ============================================================
export const GAME_LINK = "https://stormblade.picksaw.ir";

export default function App() {
  const { lang, toggle, setLang } = useLanguage();
  const { isAdmin, login, logout } = useAdmin();

  const [posts, setPosts] = useState<Post[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Load posts from the Worker/D1 on first render.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const loaded = await fetchPosts();
        if (!cancelled) {
          setPosts(loaded);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Create: persist via the authenticated Worker,
  // then cache in React state.
  const handleAddPost = useCallback(
    async (input: NewPostInput): Promise<void> => {
      try {
        const saved = await createPostApi(input);
        setPosts((prev) => [saved, ...prev]);
      } catch (err) {
        if (err instanceof AuthError) {
          logout();
        }
        throw err;
      }
    },
    [logout]
  );

  // Delete: confirm server-side first,
  // then remove from cached state.
  const handleDeletePost = useCallback(
    async (id: string): Promise<void> => {
      try {
        await deletePostApi(id);
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        if (err instanceof AuthError) {
          logout();
        }
        throw err;
      }
    },
    [logout]
  );

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handleLogin = useCallback(
    async (password: string): Promise<boolean> => {
      const success = await login(password);
      if (success) {
        setShowLogin(false);
      }
      return success;
    },
    [login]
  );

  const handleAdminOpen = useCallback(() => {
    if (isAdmin) {
      setShowAdmin(true);
    } else {
      setShowLogin(true);
    }
  }, [isAdmin]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  const t = SITE_TEXTS[lang];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 antialiased">
      <StormBackground />
      <GraffitiText />

      <div className="relative z-10">
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
            <Route
              path="/"
              element={<HomePage lang={lang} />}
            />
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
            <Route
              path="*"
              element={<HomePage lang={lang} />}
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="relative border-t border-white/8 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <p className="text-xs text-slate-600">
                {t.footerText.replace("{year}", String(new Date().getFullYear()))}
              </p>
              <p className="text-xs text-slate-700">{t.footerTagline}</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Login modal */}
      {showLogin && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLogin(false)}
        />
      )}

      {/* Admin modal — only when logged in */}
      {showAdmin && isAdmin && (
        <AdminPanel
          onAddPost={handleAddPost}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* Post modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
