interface BrandMarkProps {
  size?: number;
  className?: string;
  /** Fill the parent container instead of using a fixed size. */
  fill?: boolean;
}

/** Lightweight SVG brand mark used on mobile/perf-critical paths. */
export default function BrandMark({ size = 64, className, fill = false }: BrandMarkProps) {
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={fill ? { width: "100%", height: "100%" } : { width: size, height: size }}
      role="img"
      aria-label="Picksaw logo"
    >
      <svg width={fill ? "100%" : size} height={fill ? "100%" : size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M20 54V12h14c8 0 13 5.5 13 13s-5 13-13 13H20"
          stroke="#4fd8ff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(79,216,255,0.65))" }}
        />
        <circle cx="33" cy="25" r="3.2" fill="#eaffff" opacity="0.95" />
      </svg>
    </div>
  );
}
