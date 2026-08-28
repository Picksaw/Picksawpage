import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { cn } from "../../utils/cn";
import { useSound } from "../../audio/SoundProvider";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  strength?: number;
  ariaLabel?: string;
  type?: "button" | "submit";
}

/**
 * MagneticButton — physical CTA.
 * Magnetic pull toward the cursor, compression on press, electric glow
 * pulse, ripple response and a reflection sweep on hover.
 */
export default function MagneticButton({
  children,
  className,
  href,
  onClick,
  variant = "primary",
  strength = 0.32,
  ariaLabel,
  type = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const { blip } = useSound();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 240, damping: 16, mass: 0.4 });

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left - rect.width / 2;
    const relY = e.clientY - rect.top - rect.height / 2;
    x.set(relX * strength);
    y.set(relY * strength);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handlePress = (e: MouseEvent) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const id = Date.now() + Math.random();
      setRipples((r) => [...r.slice(-3), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      window.setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), 650);
    }
    blip("click");
    onClick?.();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = (href ? motion.a : motion.button) as unknown as (props: any) => React.ReactElement;

  return (
    <Tag
      ref={ref as never}
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          aria-label={ariaLabel}
          type={href ? undefined : type}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseEnter={() => blip("hover")}
      onClick={handlePress}
      whileTap={{ scale: 0.94 }}
      style={{ x: sx, y: sy }}
      className={cn(
        "reflect-sweep group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-2xl font-semibold",
        "transition-shadow duration-500 will-change-transform",
        variant === "primary"
          ? "bg-gradient-to-b from-white to-slate-200 px-8 py-4 text-sm text-slate-950 shadow-[0_8px_40px_-8px_rgba(79,216,255,0.45)] hover:shadow-[0_8px_56px_-6px_rgba(79,216,255,0.75)]"
          : "glass bolt-lit px-6 py-3 text-sm text-slate-100 hover:text-white",
        className
      )}
    >
      {/* electric glow pulse */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          variant === "primary"
            ? "bg-[radial-gradient(60%_120%_at_50%_120%,rgba(79,216,255,0.35),transparent)]"
            : "bg-[radial-gradient(60%_120%_at_50%_120%,rgba(79,216,255,0.2),transparent)]"
        )}
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {/* ripples */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-10 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            variant === "primary" ? "bg-slate-900/30" : "bg-electric/40"
          )}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 34, opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ left: r.x, top: r.y }}
        />
      ))}
    </Tag>
  );
}
