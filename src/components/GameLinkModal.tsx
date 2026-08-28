import { useState, useRef, useEffect } from "react";

interface GameLinkModalProps {
  currentLink: string;
  onSave: (link: string) => void;
  onClose: () => void;
}

export default function GameLinkModal({ currentLink, onSave, onClose }: GameLinkModalProps) {
  const [link, setLink] = useState(currentLink);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(link.trim());
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Set game link"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="./images/stormblade-icon.png" alt="" className="h-9 w-9
rounded-full border border-cyan-400/30" />
            <h2 className="text-lg font-bold text-white">Stormblade Link</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label htmlFor="game-link" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Game URL
          </label>
          <input
            id="game-link"
            ref={inputRef}
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://your-game-link.com"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
          />
          <p className="mt-2 text-xs text-slate-600">
            When set, the "Play Now" button redirects here in a new tab. Only you can change this.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
            >
              Save link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
