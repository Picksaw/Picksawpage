import { type ReactNode } from "react";
import { useInView } from "../hooks/useInView";
import { cn } from "../utils/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  as?: "div" | "section" | "article" | "li" | "span";
}

export default function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as: Tag = "div",
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.12 });

  const dirs = {
    up: "translate-y-10",
    down: "-translate-y-10",
    left: "translate-x-10",
    right: "-translate-x-10",
    none: "scale-[0.97]",
  };

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        inView ? "translate-x-0 translate-y-0 scale-100 opacity-100" : cn("opacity-0", dirs[direction]),
        className
      )}
    >
      {children}
    </Tag>
  );
}
