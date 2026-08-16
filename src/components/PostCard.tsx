import { useState, useRef, useEffect } from "react";
import { type Post, typeLabels } from "../types";

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
  onClick: () => void;
  onDelete: (id: string) => void | Promise<void>;
}

export default function PostCard({ post, isAdmin, onClick, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liked) {
      setLiked(true);
      setHasLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this post?")) return;
    try {
      await onDelete(post.id);
    } catch (err) {
      // Server rejected the delete (auth/network/db). Do not remove locally.
      alert(err instanceof Error ? err.message : "Could not delete this post.");
    }
  };

  // Silent hover-preview for video (no controls, no play button)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
  }, []);

  const hasMedia = !!post.mediaUrl;

  const handleMouseEnter = () => {
    if (post.type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    if (post.type === "video" && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <article
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-sm transition-all duration-400 hover:border-white/15 hover:bg-white/[0.06] hover:shadow-2xl hover:shadow-cyan-500/5"
    >
      {/* 9:16 media area */}
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        {/* VIDEO — silent looping preview, no controls */}
        {hasMedia && post.type === "video" && (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              muted
              loop
              playsInline
              preload="metadata"
            />
            {/* elegant corner indicator — not a play button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
          </>
        )}

        {/* MUSIC — pure synth waveform, no images */}
        {hasMedia && post.type === "music" && (
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-950">
            {/* ambient glow orbs */}
            <div className="absolute -left-6 top-8 h-28 w-28 rounded-full bg-cyan-500/20 blur-3xl transition-all duration-700 group-hover:bg-cyan-400/30" />
            <div className="absolute -right-6 bottom-16 h-28 w-28 rounded-full bg-purple-500/20 blur-3xl transition-all duration-700 group-hover:bg-purple-400/30" />

            {/* faint horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-center gap-4 opacity-[0.04]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-px w-full bg-white" />
              ))}
            </div>

            {/* centered mirrored synth waveform */}
            <div className="absolute inset-0 flex items-center justify-center gap-[3px] px-6">
              {Array.from({ length: 28 }).map((_, i) => {
                const base = 12 + Math.abs(Math.sin(i * 0.5)) * 60;
                return (
                  <div
                    key={i}
                    className="flex-1 origin-center rounded-full bg-gradient-to-t from-cyan-500/70 via-sky-300/80 to-cyan-200/70 animate-eq"
                    style={{
                      height: `${base}%`,
                      animationDelay: `${i * 0.04}s`,
                      animationDuration: `${0.55 + (i % 6) * 0.16}s`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* IMAGE */}
        {hasMedia && post.type === "image" && (
          <img
            src={post.mediaUrl}
            alt={post.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        {/* NO MEDIA fallback */}
        {!hasMedia && (
          <div className={`absolute inset-0 bg-gradient-to-br ${post.color} transition-transform duration-700 group-hover:scale-105`}>
            <div className="absolute inset-0 opacity-[0.06]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                    radial-gradient(circle at 70% 70%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
                }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/60 backdrop-blur-md">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={post.icon} />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* type badge */}
        <div className="absolute left-3 top-3 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md">
            {post.type === "video" && (
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
            {post.type === "music" && (
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            )}
            {typeLabels[post.type]}
          </span>
        </div>

        {/* admin delete button */}
        {isAdmin && (
          <button
            type="button"
            onClick={handleDelete}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-rose-500/30 bg-black/60 text-rose-400 opacity-0 backdrop-blur-md transition-all duration-300 hover:bg-rose-500/30 hover:text-rose-300 hover:opacity-100 group-hover:opacity-70"
            aria-label="Delete post"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

        {/* title */}
        <div className="absolute inset-x-0 bottom-0 p-4 pointer-events-none">
          <h3 className="text-sm font-bold leading-tight text-white drop-shadow-lg sm:text-base">
            {post.title}
          </h3>
        </div>

        {/* tags on hover */}
        <div className="absolute inset-x-0 top-11 flex flex-wrap gap-1 px-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
          {post.tags.map((t) => (
            <span key={t} className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* actions bar — like only */}
      <div className="flex items-center justify-between border-t border-white/5 px-3.5 py-2.5">
        <button
          type="button"
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-slate-400 transition-colors hover:text-rose-400"
          aria-label={liked ? "Unlike" : "Like"}
        >
          <svg
            className={`h-4 w-4 transition-all duration-300 ${liked ? "scale-110 fill-rose-400 text-rose-400" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {hasLiked && <span className="text-xs font-medium tabular-nums">{likeCount}</span>}
        </button>

        <div className="text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
          Tap to open
        </div>
      </div>
    </article>
  );
}
