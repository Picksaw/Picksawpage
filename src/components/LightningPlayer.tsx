import { useState, useRef, useEffect } from "react";

interface LightningPlayerProps {
  src: string;
  type: "video" | "music";
  title?: string;
}

export default function LightningPlayer({ src, type, title }: LightningPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [showVolume, setShowVolume] = useState(false);
  const [muted, setMuted] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const onTimeUpdate = () => {
      if (media.duration) setProgress((media.currentTime / media.duration) * 100);
    };
    const onLoaded = () => setDuration(media.duration);
    const onEnded = () => setPlaying(false);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);

    media.addEventListener("timeupdate", onTimeUpdate);
    media.addEventListener("loadedmetadata", onLoaded);
    media.addEventListener("ended", onEnded);
    media.addEventListener("waiting", onWaiting);
    media.addEventListener("playing", onPlaying);
    return () => {
      media.removeEventListener("timeupdate", onTimeUpdate);
      media.removeEventListener("loadedmetadata", onLoaded);
      media.removeEventListener("ended", onEnded);
      media.removeEventListener("waiting", onWaiting);
      media.removeEventListener("playing", onPlaying);
    };
  }, []);

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (playing) {
      media.pause();
      setPlaying(false);
    } else {
      media.play().catch(() => {});
      setPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const media = mediaRef.current;
    const bar = progressRef.current;
    if (!media || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    media.currentTime = percent * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    if (mediaRef.current) mediaRef.current.volume = val;
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    if (muted) {
      media.volume = volume || 0.8;
      media.muted = false;
      setMuted(false);
    } else {
      media.muted = true;
      setMuted(true);
    }
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(duration, media.currentTime + seconds));
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const currentTime = duration ? (progress / 100) * duration : 0;

  const showControlsTemporarily = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing && type === "video") {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2600);
    }
  };

  const VolumeIcon = () => {
    if (muted || volume === 0)
      return (
        <>
          <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M23 9l-6 6M17 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    if (volume < 0.5)
      return (
        <>
          <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    return (
      <>
        <path d="M11 5L6 9H2v6h4l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  };

  // ============ VIDEO PLAYER ============
  if (type === "video") {
    return (
      <div
        className="relative h-full w-full bg-black group/player"
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => playing && setControlsVisible(false)}
      >
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          className="h-full w-full object-cover"
          playsInline
          preload="metadata"
          onClick={togglePlay}
        />

        {/* Ambient light bloom from center when playing */}
        {playing && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)]" />
        )}

        {/* Buffering spinner */}
        {buffering && playing && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400" />
          </div>
        )}

        {/* Big center play button — ONLY when paused */}
        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Play"
          >
            <span className="relative">
              <span className="absolute inset-0 -m-8 rounded-full bg-cyan-400/20 blur-2xl animate-pulse-slow" />
              <span className="absolute inset-0 -m-3 rounded-full border border-cyan-400/30 animate-ping" style={{ animationDuration: "2.5s" }} />
              <span className="relative flex h-24 w-24 items-center justify-center rounded-full border-2 border-cyan-400/60 bg-black/50 text-cyan-200 shadow-[0_0_40px_rgba(34,211,238,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_60px_rgba(34,211,238,0.7)]">
                <svg className="ml-1.5 h-10 w-10 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}

        {/* Controls */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-5 pb-4 pt-16 transition-all duration-300 ${
            controlsVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="group/bar relative mb-3.5 h-1.5 w-full cursor-pointer rounded-full bg-white/15"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(34,211,238,0.8)] opacity-0 transition-opacity group-hover/bar:opacity-100" style={{ left: `calc(${progress}% - 8px)` }} />
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-cyan-400/25 hover:text-cyan-200 hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]">
              {playing ? (
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="ml-0.5 h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            {/* Skip back */}
            <button type="button" onClick={() => skip(-10)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-cyan-200" aria-label="Back 10s">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {/* Skip fwd */}
            <button type="button" onClick={() => skip(10)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-cyan-200" aria-label="Forward 10s">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>

            {/* Volume */}
            <div className="relative flex items-center" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
              <button type="button" onClick={toggleMute} className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-colors hover:text-cyan-200">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><VolumeIcon /></svg>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${showVolume ? "w-20 opacity-100 ml-1" : "w-0 opacity-0"}`}>
                <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-full cursor-pointer" style={{ background: `linear-gradient(to right, rgb(34,211,238) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%)` }} />
              </div>
            </div>

            <span className="ml-auto text-xs text-white/60 tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
        </div>
      </div>
    );
  }

  // ============ AUDIO / MUSIC PLAYER ============
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-950">
      <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={src} preload="metadata" />

      {/* Ambient animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-cyan-500/20 blur-[70px] transition-all duration-1000 ${playing ? "opacity-100 scale-125" : "opacity-50 scale-100"}`} />
        <div className={`absolute bottom-1/4 right-1/4 h-40 w-40 rounded-full bg-purple-500/20 blur-[70px] transition-all duration-1000 ${playing ? "opacity-100 scale-125" : "opacity-50 scale-100"}`} />
      </div>

      {/* Central visualizer */}
      <div className="relative z-10 flex flex-col items-center px-6">
        {/* Pulsing vinyl / disc */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 -m-4 rounded-full bg-cyan-400/20 blur-2xl transition-all duration-700 ${playing ? "scale-110 opacity-100" : "scale-90 opacity-60"}`} />
          <div
            className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-cyan-400/30 bg-gradient-to-br from-slate-800 to-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.3)]"
            style={{ animation: playing ? "spin 8s linear infinite" : "none" }}
          >
            <div className="absolute inset-4 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/5" />
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 shadow-lg">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            </div>
          </div>
        </div>

        {/* Live equalizer bars */}
        <div className="mb-6 flex h-12 items-end justify-center gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1 origin-bottom rounded-full bg-gradient-to-t from-cyan-500 to-sky-300"
              style={{
                height: playing ? `${20 + Math.abs(Math.sin(i * 0.5)) * 80}%` : "15%",
                animation: playing ? `eq ${0.5 + (i % 5) * 0.15}s ease-in-out ${i * 0.04}s infinite alternate` : "none",
                transition: "height 0.3s ease",
              }}
            />
          ))}
        </div>

        {title && <p className="mb-6 text-center text-sm font-medium text-white/80">{title}</p>}

        {/* Play button */}
        <button
          type="button"
          onClick={togglePlay}
          className="group/play relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 text-slate-950 shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_45px_rgba(34,211,238,0.7)]"
        >
          {playing ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          ) : (
            <svg className="ml-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        {/* Progress */}
        <div className="w-full max-w-xs">
          <div ref={progressRef} onClick={handleProgressClick} className="group/bar relative mb-2 h-1.5 w-full cursor-pointer rounded-full bg-white/15">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-sky-300 shadow-[0_0_10px_rgba(34,211,238,0.6)]" style={{ width: `${progress}%` }} />
            <div className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(34,211,238,0.8)] opacity-0 transition-opacity group-hover/bar:opacity-100" style={{ left: `calc(${progress}% - 7px)` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-white/50 tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Volume row */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={toggleMute} className="text-white/50 transition-colors hover:text-cyan-200">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><VolumeIcon /></svg>
            </button>
            <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-32 cursor-pointer" style={{ background: `linear-gradient(to right, rgb(34,211,238) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%)` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
