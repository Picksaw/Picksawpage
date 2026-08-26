/**
 * useMountedPanel — makes a DOM panel feel physically present.
 *
 * Publishes the pointer's position within the element as `--px` / `--py`
 * (both -1..1) so CSS can drive:
 *   - the reflection sliding across the glass
 *   - content layers leaning at different depths (hover parallax)
 *
 * Written straight to the element's style rather than through React
 * state, so moving the pointer never triggers a render. Values are
 * eased in the CSS transition, not here, so there is no rAF loop
 * either — this costs a single style write per pointermove.
 */

import { useCallback, useEffect, useRef } from "react";

export function useMountedPanel<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const enabled = useRef(true);

  useEffect(() => {
    enabled.current =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el || !enabled.current) return;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 2 - 1;
    const py = ((e.clientY - r.top) / r.height) * 2 - 1;
    el.style.setProperty("--px", px.toFixed(3));
    el.style.setProperty("--py", py.toFixed(3));
  }, []);

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--px", "0");
    el.style.setProperty("--py", "0");
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
