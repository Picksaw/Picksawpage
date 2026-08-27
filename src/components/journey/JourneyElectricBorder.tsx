import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { reportFrameCost } from "../../lib/perfProbe";
import { ElectricPainter } from "../ui/ElectricBorder";
import { TEMPLATES } from "../../config/templatesConfig";
import { layerOpacity, paintingZ } from "./path";

/**
 * JourneyElectricBorder — the electric lightning ring for the 3D
 * corridor paintings. Renders the SAME ElectricPainter used by the
 * DOM template cards onto one shared canvas, uploads it as an animated
 * CanvasTexture, and hands it (plus a hover tracker) to every painting
 * so each frame carries a crackling bolt around its edges.
 *
 * Perf: the ring is only VISIBLE on the solo (focused) painting, so we
 * re-render + re-upload the texture only while that painting is on
 * screen (previously: full canvas redraw + GPU upload every single
 * frame of the whole walk). Mobile draws it at lower texture
 * resolution and updates at 30 Hz — a 2px-wide glow.
 */

/** Canvas overscan around each painting — must match the painter's
 *  `overscan` so the ring hugs the painting bounds exactly. */
export const BORDER_OVERSCAN = 0.09;

/** Texture resolution: px per world unit for the painting cards. */
const PX_PER_UNIT_DESKTOP = 213;
const PX_PER_UNIT_MOBILE = 130;

export function useJourneyElectricBorder(
  cardW: number,
  cardH: number,
  focusedIdx: number
): { texture: THREE.CanvasTexture; hoveredIdxRef: MutableRefObject<number> } {
  /** index of the painting the pointer is over (-1 = none) */
  const hoveredIdxRef = useRef(-1);
  const focusedRef = useRef(focusedIdx);
  focusedRef.current = focusedIdx;

  const isMobile = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const frame = useRef(0);

  const assets = useMemo(() => {
    const painter = new ElectricPainter({
      width: Math.round(cardW * (isMobile ? PX_PER_UNIT_MOBILE : PX_PER_UNIT_DESKTOP)),
      height: Math.round(cardH * (isMobile ? PX_PER_UNIT_MOBILE : PX_PER_UNIT_DESKTOP)),
      color: "#4fd8ff",
      speed: 1.15,
      lineWidth: 2.75,
      radius: 36,
      overscan: BORDER_OVERSCAN,
      displacement: 0.09,
      // Perf: 4 octaves keep the crackle — see ElectricBorder notes.
      octaves: 4,
      lacunarity: 1.6,
      gain: 0.7,
      amplitude: 0.075,
      frequency: 10,
      baseFlatness: 0,
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(painter.canvasWidth);
    canvas.height = Math.round(painter.canvasHeight);
    const ctx = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { painter, ctx, texture };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardW, cardH, isMobile]);

  useEffect(() => () => assets.texture.dispose(), [assets]);

  useFrame(({ camera }, delta) => {
    frame.current++;
    // flare only while the pointer is on the FOCUSED painting
    assets.painter.setActive(
      hoveredIdxRef.current >= 0 && hoveredIdxRef.current === focusedRef.current
    );
    const t0 = performance.now();
    // O(1) clock advance every frame — cheap; the heavy draw is gated.
    assets.painter.advance(Math.min(delta, 0.05) * 1000);
    // The ring is shared: it's visible on whichever painting is inside
    // its opacity window — INCLUDING one we're passing (the focused
    // index only flips at station midpoints). Windows are 10.4 wide vs
    // 8 between stations, so during the gallery ≥1 painting is always
    // in the window; before the gallery / at the extra stations none is.
    const camZ = camera.position.z;
    let visible = false;
    for (let i = 0; i < TEMPLATES.length; i++) {
      if (layerOpacity(camZ, paintingZ(i)) > 0.02) {
        visible = true;
        break;
      }
    }
    // Mobile: 30 Hz updates are indistinguishable for a crackling glow.
    if (visible && (!isMobile || frame.current % 2 === 0)) {
      assets.painter.render(assets.ctx);
      assets.texture.needsUpdate = true;
    }
    reportFrameCost("corridor-border", performance.now() - t0);
  });

  return { texture: assets.texture, hoveredIdxRef };
}
