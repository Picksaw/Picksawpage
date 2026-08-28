import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * CursorFX — the storm acknowledges your presence.
 *
 * Desktop: a soft electric spotlight follows the cursor with spring
 * physics (the storm canvas independently repels nearby raindrops).
 * Everyone: clicking empty space spawns a tiny rain-splash ripple —
 * both a DOM ring and a canvas ripple via the `picksaw:splash` event.
 */
export default function CursorFX() {
  const [enabled, setEnabled] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const ripplesRef = useRef(ripples);

  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 120, damping: 18, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 120, damping: 18, mass: 0.5 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setEnabled(fine && !reduced);

    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "a, button, input, textarea, select, label, [role='button'], iframe, canvas[data-interactive]"
        )
      ) {
        return; // clicks on UI are intentional — no splash
      }
      const id = Date.now() + Math.random();
      const next = [...ripplesRef.current.slice(-4), { id, x: e.clientX, y: e.clientY }];
      ripplesRef.current = next;
      setRipples(next);
      window.setTimeout(() => {
        const cleaned = ripplesRef.current.filter((r) => r.id !== id);
        ripplesRef.current = cleaned;
        setRipples(cleaned);
      }, 900);
      // canvas ripple in the storm
      window.dispatchEvent(
        new CustomEvent("picksaw:splash", { detail: { x: e.clientX, y: e.clientY } })
      );
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [x, y]);

  return (
    <>
      {enabled && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed z-[5] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
          style={{
            left: sx,
            top: sy,
            background:
              "radial-gradient(circle, rgba(79,216,255,0.07) 0%, rgba(79,216,255,0.025) 35%, transparent 65%)",
          }}
        />
      )}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[65]">
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-electric/60"
            style={{ left: r.x, top: r.y }}
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
    </>
  );
}
