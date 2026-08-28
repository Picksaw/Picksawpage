import { useState } from "react";
import PostCard from "./PostCard";
import Reveal from "./Reveal";
import { type Post } from "../types";
import { SITE_TEXTS, type Lang } from "../config/siteTexts";

interface FeedProps {
  posts: Post[];
  isAdmin: boolean;
  lang?: Lang;
  onPostClick: (post: Post) => void;
  onDeletePost: (id: string) => void | Promise<void>;
}

const filterLabels: Record<Filter, { en: string; fa: string }> = {
  All: { en: "All", fa: "همه" },
  Videos: { en: "Videos", fa: "ویدیوها" },
  Images: { en: "Images", fa: "تصاویر" },
  Music: { en: "Music", fa: "موسیقی" },
};

const filters = ["All", "Videos", "Images", "Music"] as const;
type Filter = (typeof filters)[number];
const filterTypeMap: Record<Filter, Post["type"] | null> = {
  All: null,
  Videos: "video",
  Images: "image",
  Music: "music",
};

export default function Feed({ posts, isAdmin, lang = "en", onPostClick, onDeletePost }: FeedProps) {
  const [active, setActive] = useState<Filter>("All");

  const filtered =
    active === "All" ? posts : posts.filter((p) => p.type === filterTypeMap[active]);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {SITE_TEXTS[lang].feedPageTitle || "The Feed"}
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="mt-3 max-w-lg text-base text-slate-400 sm:text-lg">
                {SITE_TEXTS[lang].feedSubtitle || "Videos, music, and visuals — straight from the storm."}
              </p>
            </Reveal>
          </div>

          <Reveal delay={100}>
            <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-md">
              {filters.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActive(f)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    active === f
                      ? "bg-cyan-400/20 text-cyan-200 shadow-lg shadow-cyan-500/10"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {filterLabels[f][lang] || filterLabels[f].en}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-slate-400">{lang === "fa" ? "هنوز پستی وجود ندارد" : "No posts yet"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {isAdmin ? (lang === "fa" ? "روی 'پست جدید' کلیک کنید تا اولین محتوا را آپلود کنید." : "Click 'New post' to upload your first content.") : (lang === "fa" ? "بعداً برای محتوای جدید برگردید." : "Check back later for new content.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((post, i) => (
              <Reveal key={post.id} delay={i * 60}>
                <PostCard
                  post={post}
                  isAdmin={isAdmin}
                  onClick={() => onPostClick(post)}
                  onDelete={onDeletePost}
                />
              </Reveal>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
