import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * ContextGuard — survive a lost WebGL context.
 *
 * A GPU can take the context away at any time: memory pressure, a
 * driver reset, the tab being backgrounded on a laptop that switches
 * GPUs, another tab allocating heavily. By default the browser fires
 * `webglcontextlost`, the canvas freezes on its last frame or goes
 * black, and nothing ever restores it — the page stays broken until a
 * manual reload.
 *
 * Two things are required to recover, and both are easy to miss:
 *
 *   1. `preventDefault()` on the lost event. Without it the browser
 *      will NOT attempt a restore, and `webglcontextrestored` never
 *      fires. This is the single most commonly missed line in WebGL.
 *   2. Something to rebuild on restore. three.js re-uploads its own
 *      resources when the renderer is reinitialised, so raising a
 *      remount key is enough to bring the scene back.
 *
 * The guard also reports what happened, because a silent black canvas
 * is the hardest possible bug to diagnose from a user's description.
 */
export default function ContextGuard({
  onLost,
  onRestored,
}: {
  onLost?: () => void;
  onRestored?: () => void;
}) {
  const { gl } = useThree();
  const lostAt = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (e: Event) => {
      // REQUIRED — without this the browser never tries to restore.
      e.preventDefault();
      lostAt.current = performance.now();
      console.warn(
        "[picksaw] WebGL context lost — the GPU reclaimed this canvas. " +
          "Attempting automatic restore."
      );
      onLost?.();
    };

    const handleRestored = () => {
      const downMs = Math.round(performance.now() - lostAt.current);
      console.warn(`[picksaw] WebGL context restored after ${downMs}ms.`);
      onRestored?.();
    };

    const handleCreationError = (e: Event) => {
      console.error(
        "[picksaw] WebGL context creation failed:",
        (e as WebGLContextEvent).statusMessage || "(no message)"
      );
    };

    canvas.addEventListener("webglcontextlost", handleLost, false);
    canvas.addEventListener("webglcontextrestored", handleRestored, false);
    canvas.addEventListener("webglcontextcreationerror", handleCreationError, false);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
      canvas.removeEventListener("webglcontextrestored", handleRestored);
      canvas.removeEventListener("webglcontextcreationerror", handleCreationError);
    };
  }, [gl, onLost, onRestored]);

  // Report the memory actually in flight — the number that decides
  // whether this context is at risk of being reclaimed at all.
  useEffect(() => {
    const info = gl.info;
    const id = window.setTimeout(() => {
      const { geometries, textures } = info.memory;
      const { calls, triangles } = info.render;
      console.info(
        `[picksaw] GPU: ${geometries} geometries, ${textures} textures, ` +
          `${calls} draw calls, ${triangles.toLocaleString()} triangles/frame`
      );
    }, 3000);
    return () => window.clearTimeout(id);
  }, [gl]);

  return null;
}
