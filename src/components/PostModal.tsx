import { useEffect, useRef, useState } from "react";
import { type Post, typeLabels } from "../types";
import LightningPlayer from "./LightningPlayer";

interface PostModalProps {
  post: Post;
  onClose: () => void;
}

export default function PostModal({ post, onClose }: PostModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const toggleLike = () => {
    if (!liked) {
      setLiked(true);
      setHasLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-md transition-all hover:border-white/25 hover:text-white"
        aria-label="Close"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl md:flex-row">
        {/* Media panel — 9:16 aspect */}
        <div className="relative flex items-center justify-center bg-black md:w-[45%]">
          <div className="relative aspect-[9/16] w-full max-h-[80vh] overflow-hidden">
            {post.mediaUrl ? (
              post.type === "video" || post.type === "music" ? (
                <LightningPlayer src={post.mediaUrl} type={post.type} title={post.type === "music" ? post.title : undefined} />
              ) : (
                <img src={post.mediaUrl} alt={post.title} className="h-full w-full object-cover" />
              )
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${post.color}`}>
                <svg
                  className="h-20 w-20 text-white/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={post.icon} />
                </svg>
              </div>
            )}

            {/* type badge */}
            <div className="absolute left-4 top-4 z-10">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
                {typeLabels[post.type]}
              </span>
            </div>
          </div>
        </div>

        {/* Info sidebar */}
        <div className="flex flex-1 flex-col p-6 sm:p-8 md:w-[55%]">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {post.title}
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">{post.timestamp}</p>
          </div>

          {/* Description / caption */}
          <div className="flex-1 overflow-y-auto">
            <div className="mb-6 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Caption
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{post.description}</p>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-4 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={toggleLike}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                liked
                  ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg
                className={`h-4 w-4 transition-all ${liked ? "fill-rose-400 text-rose-400" : ""}`}
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
              {hasLiked ? likeCount : "Like"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-auto rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
