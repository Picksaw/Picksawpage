import { useEffect, useState } from "react";

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      setScrollY(y);
      setProgress(maxScroll > 0 ? Math.min(y / maxScroll, 1) : 0);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { progress, scrollY };
}
