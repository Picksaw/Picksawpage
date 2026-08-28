import { useMemo, useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "../../utils/cn";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  scale?: number;
  onClick?: () => void;
  as?: "div" | "article";
}

/**
 * TiltCard — cursor-perspective 3D tilt with spring physics and a
 * glare highlight that follows the pointer. Disabled automatically
 * on touch devices and reduced-motion (falls back to a flat card).
 */
export default function TiltCard({
  children,
  className,
  maxTilt = 9,
  glare = true,
  scale = 1.02,
  onClick,
  as = "div",
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const canTilt = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const sx = useSpring(px, { stiffness: 180, damping: 18, mass: 0.5 });
  const sy = useSpring(py, { stiffness: 180, damping: 18, mass: 0.5 });

  const rotateX = useTransform(sy, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [0, 1], [-maxTilt, maxTilt]);

  const glareBg = useTransform(
    [sx, sy],
    ([gx, gy]: number[]) =>
      `radial-gradient(420px circle at ${gx * 100}% ${gy * 100}%, rgba(159,232,255,0.13), transparent 55%)`
  );

  const handleMove = (e: MouseEvent) => {
    if (!canTilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const Tag = as === "article" ? motion.article : motion.div;

  return (
    <Tag
      ref={ref as never}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      className={cn("group relative [perspective:1200px]", className)}
      style={canTilt ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
      whileHover={canTilt ? { scale } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {children}
      {glare && canTilt && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: glareBg }}
        />
      )}
    </Tag>
  );
}
