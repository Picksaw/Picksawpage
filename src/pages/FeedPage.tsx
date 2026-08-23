import { SITE_TEXTS, type Lang } from "../config/siteTexts";
import Feed from "../components/Feed";
import GamePromo from "../components/GamePromo";
import Reveal from "../components/Reveal";
import { type Post } from "../types";

interface FeedPageProps {
  lang: Lang;
  posts: Post[];
  isAdmin: boolean;
  onPostClick: (post: Post) => void;
  onDeletePost: (id: string) => void | Promise<void>;
  gameLink: string;
}

export default function FeedPage({ lang, posts, isAdmin, onPostClick, onDeletePost, gameLink }: FeedPageProps) {
  const t = SITE_TEXTS[lang];

  return (
    <div className="relative">
      {/* Hero for feed & game */}
      <section className="relative flex min-h-[50svh] flex-col items-center justify-center px-4 py-28 text-center sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-400/8 blur-[120px] animate-pulse-slow" />
        </div>

        <Reveal>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {t.feedPageTitle}
          </h1>
        </Reveal>

        <Reveal delay={80}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {t.feedSubtitle}
          </p>
        </Reveal>
      </section>

      {/* Game promo */}
      <section className="relative px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <GamePromo gameLink={gameLink} lang={lang} />
        </div>
      </section>

      {/* Feed */}
      <div id="feed">
        <Feed posts={posts} isAdmin={isAdmin} lang={lang} onPostClick={onPostClick} onDeletePost={onDeletePost} />
      </div>
    </div>
  );
}
