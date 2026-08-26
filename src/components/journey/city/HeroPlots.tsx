/**
 * HeroPlots — the six template buildings.
 *
 * Each template owns a plot on the street with its own architecture,
 * derived from its district: a beauty clinic is low, warm and polished;
 * a dental clinic is glazed and clinical; the luxury house is a slender
 * stone tower; the studio is industrial; the future plot is a hoarded
 * construction site.
 *
 * Phase 1 builds the MASS and the entrance volume so the composition
 * reads correctly. Phase 8 turns each entrance into a real portal
 * (glow, reflections, logo, particles, opening door).
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  HERO_PLOTS,
  pathHeading,
  pathOffset,
  type HeroPlot,
} from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

const _o = { x: 0, y: 0, z: 0 };

/** World transform of a plot's façade plane. */
export function plotTransform(plot: HeroPlot) {
  pathOffset(plot.s, plot.side * plot.lateral, _o);
  const heading = pathHeading(plot.s);
  /**
   * The plot's local frame, with +Z pointing TOWARD the street.
   *
   * Every offset in this file and in Portals.tsx is written in those
   * terms: the podium, doorway and canopy step out along +Z toward the
   * pavement, and the main mass sits back at -Z. For that to hold, the
   * quarter turn has to go the opposite way on each side of the road —
   * a plot on the right (+X) must rotate so +Z lands on -X.
   */
  const rotY = -heading + (plot.side > 0 ? -Math.PI / 2 : Math.PI / 2);
  return { x: _o.x, y: _o.y, z: _o.z, rotY, heading };
}

function PlotBuilding({ plot, quality }: { plot: HeroPlot; quality: Quality }) {
  const t = useMemo(() => plotTransform(plot), [plot]);
  const d = plot.district;
  const group = useRef<THREE.Group>(null);

  const facadeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(d.facade).multiplyScalar(1.25),
        roughness: 0.86 - d.polish * 0.55,
        metalness: 0.05 + d.polish * 0.25,
        envMapIntensity: 0.6 + d.polish * 0.8,
      }),
    [d]
  );

  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0a1018"),
        roughness: 0.12,
        metalness: 0.5,
        envMapIntensity: 1.4,
        emissive: new THREE.Color(d.windowColor),
        emissiveIntensity: 0.22,
      }),
    [d]
  );

  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(d.trim),
        roughness: 0.35,
        metalness: 0.65,
        envMapIntensity: 1.1,
      }),
    [d]
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(d.accent),
        toneMapped: false,
      }),
    [d]
  );

  useEffect(
    () => () => {
      facadeMat.dispose();
      glassMat.dispose();
      trimMat.dispose();
      accentMat.dispose();
    },
    [facadeMat, glassMat, trimMat, accentMat]
  );

  useFrame(() => {
    const ds = Math.abs(plot.s - journey.s);

    /**
     * Cull the whole plot when it is out of range.
     *
     * Each hero building is ~8 draw calls and each portal ~6, so six
     * plots is 84 calls that would otherwise be submitted from anywhere
     * in the district. Hiding the group skips all of them, and the
     * range is generous enough (220 m) that a plot is always fully
     * present long before it can be seen through the fog.
     */
    const visible = ds < 220;
    if (group.current && group.current.visible !== visible) {
      group.current.visible = visible;
    }
    if (!visible) return;

    // approach pulse — the entrance breathes brighter as you near it
    const near = THREE.MathUtils.clamp(1 - ds / 46, 0, 1);
    const pulse = 0.5 + 0.5 * Math.sin(journey.time * 1.4 + plot.index);
    glassMat.emissiveIntensity = 0.16 + near * (0.5 + pulse * 0.18);
  });

  const W = plot.width;
  const H = plot.height;
  const D = plot.depth;
  const doorW = 6.4; // matches DOOR_W in Portals.tsx
  const doorH = 5.4;
  const podiumH = 8.5;

  return (
    <group ref={group} position={[t.x, t.y, t.z]} rotation={[0, t.rotY, 0]}>
      {/* main mass — pushed back so the podium reads as a separate volume */}
      <mesh
        position={[0, H * 0.5, -D * 0.5]}
        castShadow={quality.shadows}
        receiveShadow={quality.shadows}
        material={facadeMat}
      >
        <boxGeometry args={[W, H, D]} />
      </mesh>

      {/* glazed curtain band up the façade */}
      <mesh position={[0, podiumH + (H - podiumH) * 0.5, -0.12]} material={glassMat}>
        <boxGeometry args={[W * (0.5 + d.glazing * 0.38), (H - podiumH) * 0.9, 0.24]} />
      </mesh>

      {/* podium — the ground-floor volume that holds the entrance */}
      <mesh
        position={[0, podiumH * 0.5, 0.9]}
        castShadow={quality.shadows}
        receiveShadow={quality.shadows}
        material={facadeMat}
      >
        <boxGeometry args={[W * 0.96, podiumH, 2.2]} />
      </mesh>

      {/* entrance recess — a dark doorway carved into the podium.
          The door itself, its glow, logo and interior belong to
          Portals.tsx; what is here is the masonry it sits in. */}
      <mesh position={[0, doorH * 0.5, 1.4]}>
        <boxGeometry args={[doorW + 1.2, doorH + 0.9, 0.5]} />
        <meshStandardMaterial color="#05070c" roughness={0.9} metalness={0} />
      </mesh>

      {/* portal frame in the district's trim metal */}
      <mesh position={[0, doorH + 0.55, 1.9]} material={trimMat}>
        <boxGeometry args={[doorW + 1.5, 0.34, 0.5]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * (doorW / 2 + 0.6), doorH * 0.5, 1.9]}
          material={trimMat}
        >
          <boxGeometry args={[0.3, doorH + 0.9, 0.5]} />
        </mesh>
      ))}

      {/* accent strip washing the underside of the canopy */}
      <mesh position={[0, doorH + 1.85, 2.4]} material={accentMat}>
        <boxGeometry args={[doorW * 1.1, 0.06, 0.06]} />
      </mesh>

      {/* canopy */}
      <mesh position={[0, doorH + 1.05, 2.6]} material={trimMat} castShadow={quality.shadows}>
        <boxGeometry args={[doorW + 3.2, 0.22, 2.4]} />
      </mesh>

      {/* crown — every hero building has a distinct silhouette */}
      {d.kind === "luxury" && (
        <mesh position={[0, H + 3, -D * 0.5]} material={trimMat}>
          <boxGeometry args={[W * 0.42, 6, D * 0.42]} />
        </mesh>
      )}
      {d.kind === "dental" && (
        <mesh position={[0, H + 1.4, -D * 0.5]} material={glassMat}>
          <boxGeometry args={[W * 0.8, 2.8, D * 0.8]} />
        </mesh>
      )}
      {d.kind === "studio" && (
        <mesh position={[W * 0.3, H + 2.2, -D * 0.5]} material={trimMat}>
          <cylinderGeometry args={[0.12, 0.12, 4.4, 6]} />
        </mesh>
      )}
      {d.kind === "future" && (
        <>
          {/* scaffolding hint — this plot is still being built */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * W * 0.42, H * 0.5, 0.6]} material={trimMat}>
              <boxGeometry args={[0.16, H, 0.16]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

export default function HeroPlots({ quality }: { quality: Quality }) {
  return (
    <>
      {HERO_PLOTS.map((p) => (
        <PlotBuilding key={p.templateId} plot={p} quality={quality} />
      ))}
    </>
  );
}
