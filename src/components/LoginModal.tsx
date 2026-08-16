import { useState, useRef, useEffect } from "react";

interface LoginModalProps {
  onLogin: (password: string) => boolean | Promise<boolean>;
  onClose: () => void;
}

export default function LoginModal({ onLogin, onClose }: LoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(false);
    try {
      const success = await onLogin(password);
      if (!success) {
        setError(true);
        setShake(true);
        setPassword("");
        setTimeout(() => setShake(false), 500);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Admin sign in"
    >
      <div
        className={`w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/60 backdrop-blur-xl ${
          shake ? "animate-[shake_0.4s_ease-in-out]" : ""
        }`}
      >
        {/* Header */}
        <div className="border-b border-white/8 px-6 py-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 shadow-lg shadow-cyan-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white">Admin Access</h2>
          <p className="mt-1 text-sm text-slate-500">Enter the admin password to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              className={`w-full rounded-xl border bg-black/30 px-4 py-3.5 text-center text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
                error
                  ? "border-rose-400/50 focus:border-rose-400/50 focus:ring-rose-400/20"
                  : "border-white/10 focus:border-cyan-400/40 focus:ring-cyan-400/20"
              }`}
              autoComplete="current-password"
            />
            {error && (
              <p className="mt-2 text-center text-xs text-rose-400">
                Incorrect password or unreachable server
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-white py-3.5 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 transition-all hover:bg-slate-100 hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full py-2.5 text-sm text-slate-500 transition hover:text-slate-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
