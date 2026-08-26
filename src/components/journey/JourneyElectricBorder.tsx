import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ElectricPainter } from "../ui/ElectricBorder";

/**
 * JourneyElectricBorder — the electric lightning ring for the 3D
 * corridor paintings. Renders the SAME ElectricPainter used by the
 * DOM template cards onto one shared canvas, uploads it as an animated
 * CanvasTexture, and hands it (plus a hover tracker) to every painting
 * so each frame carries a crackling bolt around its edges.
 */

/** Canvas overscan around each painting — must match the painter's
 *  `overscan` so the ring hugs the painting bounds exactly. */
export const BORDER_OVERSCAN = 0.09;

/** Texture resolution: px per world unit for the painting cards. */
const PX_PER_UNIT = 213;

export function useJourneyElectricBorder(
  cardW: number,
  cardH: number,
  focusedIdx: number
): { texture: THREE.CanvasTexture; hoveredIdxRef: MutableRefObject<number> } {
  /** index of the painting the pointer is over (-1 = none) */
  const hoveredIdxRef = useRef(-1);
  const focusedRef = useRef(focusedIdx);
  focusedRef.current = focusedIdx;

  const assets = useMemo(() => {
    const painter = new ElectricPainter({
      width: Math.round(cardW * PX_PER_UNIT),
      height: Math.round(cardH * PX_PER_UNIT),
      color: "#4fd8ff",
      speed: 1.15,
      lineWidth: 2.75,
      radius: 36,
      overscan: BORDER_OVERSCAN,
      displacement: 0.09,
      octaves: 10,
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
  }, [cardW, cardH]);

  useEffect(() => () => assets.texture.dispose(), [assets]);

  useFrame((_, delta) => {
    // flare only while the pointer is on the FOCUSED painting
    assets.painter.setActive(
      hoveredIdxRef.current >= 0 && hoveredIdxRef.current === focusedRef.current
    );
    assets.painter.advance(Math.min(delta, 0.05) * 1000);
    assets.painter.render(assets.ctx);
    assets.texture.needsUpdate = true;
  });

  return { texture: assets.texture, hoveredIdxRef };
}
