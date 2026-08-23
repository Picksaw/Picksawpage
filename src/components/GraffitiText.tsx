export default function GraffitiText() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[1] flex items-center justify-center overflow-hidden select-none"
    >
      <div className="relative w-full max-w-[1400px] px-4">
        <h1
          className="text-[clamp(5rem,18vw,22rem)] font-black uppercase leading-none tracking-[-0.04em] text-white/[0.03]"
          style={{
            fontFamily: "'Inter', sans-serif",
            textShadow:
              "0 0 80px rgba(103,232,249,0.06), 0 0 160px rgba(56,189,248,0.03)",
            WebkitTextStroke: "1px rgba(103,232,249,0.04)",
            transform: "rotate(-3deg) translateY(-5%)",
            whiteSpace: "nowrap",
          }}
        >
          PICKSAW
        </h1>
        {/* second pass — slightly offset for painted/echo effect */}
        <h1
          aria-hidden
          className="absolute inset-0 text-[clamp(5rem,18vw,22rem)] font-black uppercase leading-none tracking-[-0.04em] text-cyan-400/[0.015]"
          style={{
            fontFamily: "'Inter', sans-serif",
            transform: "rotate(-3deg) translateY(-5%) translate(4px, 3px)",
            whiteSpace: "nowrap",
            filter: "blur(1px)",
          }}
        >
          PICKSAW
        </h1>
        {/* drip lines beneath — subtle vertical streaks */}
        <div className="absolute bottom-[-15%] left-0 right-0 flex justify-around opacity-[0.025]">
          {[0.2, 0.35, 0.5, 0.65, 0.8].map((pos) => (
            <div
              key={pos}
              className="w-px bg-gradient-to-b from-cyan-300 to-transparent"
              style={{ height: `${80 + Math.random() * 120}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
