import { useState } from "react";
import { type Post } from "../types";
import { type NewPostInput } from "../api/posts";

interface AdminPanelProps {
  onAddPost: (input: NewPostInput) => Promise<void>;
  onClose: () => void;
}

export default function AdminPanel({ onAddPost, onClose }: AdminPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [detectedType, setDetectedType] = useState<Post["type"]>("image");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || saving) return;

    const trimmedUrl = mediaUrl.trim();

    // If a URL was provided, make sure it is a normal web URL.
    if (trimmedUrl) {
      try {
        const url = new URL(trimmedUrl);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          setError("Media URL must start with http:// or https://");
          return;
        }
      } catch {
        setError("Please enter a valid media URL.");
        return;
      }
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const input: NewPostInput = {
      type: detectedType,
      title: title.trim(),
      description: description.trim() || "No description",
      tags,
      mediaUrl: trimmedUrl || undefined,
    };

    setSaving(true);
    setError(null);

    try {
      await onAddPost(input);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save post. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setTagsInput("");
    setMediaUrl("");
    setDetectedType("image");
    setSubmitted(false);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Admin panel"
    >
      <div className="relative flex max-h-[90vh] max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600">
              <svg
                className="h-4.5 w-4.5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M12 5v14M5 12h14"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-white">
              New Post
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {submitted ? (
          /* Success */
          <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M5 12l5 5L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white">
              Post created
            </h3>

            <p className="text-sm text-slate-400">
              Your post is now live in the feed.
            </p>

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10"
              >
                Add another
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                View feed
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-1 flex-col gap-4 overflow-y-auto p-6"
          >

            {/* Media Type */}
            <div>
              <label
                htmlFor="post-type"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Media type
              </label>

              <select
                id="post-type"
                value={detectedType}
                onChange={(e) =>
                  setDetectedType(e.target.value as Post["type"])
                }
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="music">Music</option>
              </select>
            </div>

            {/* Media URL */}
            <div>
              <label
                htmlFor="post-media-url"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Media URL
              </label>

              <input
                id="post-media-url"
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/your-file.jpg"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />

              <p className="mt-1.5 text-xs text-slate-500">
                Upload your media to your file host first, then paste the
                direct URL here.
              </p>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="post-title"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Title
              </label>

              <input
                id="post-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give it a name..."
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="post-desc"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Caption
              </label>

              <textarea
                id="post-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What's this about..."
                className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {/* Tags */}
            <div>
              <label
                htmlFor="post-tags"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                Tags (comma-separated)
              </label>

              <input
                id="post-tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="music, ambient, storm"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center text-xs text-rose-300">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="mt-2 w-full rounded-xl bg-white py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 transition-all hover:bg-slate-100 hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Publishing…" : "Publish post"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}