/**
 * Street — the kerbs and the drainage line.
 *
 * The road surface and sidewalks are drawn by WetGround, which owns the
 * full water response (puddles, ripples, analytic reflections). What is
 * left here is the hard edge between them: the kerb faces, and the
 * gutter channel where runoff collects.
 *
 * Kept as swept ribbons along the path curve so the edge follows every
 * bend exactly, with no seam against the surfaces either side.
 */

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import {
  JOURNEY_LENGTH,
  KERB_HEIGHT,
  ROAD_HALF,
  pathHeading,
  pathX,
  pathY,
} from "../lib/cityLayout";
import { COLORS } from "../lib/palette";
import type { Quality } from "../lib/quality";

const STEP = 4; // metres between ribbon rings
const OVERSHOOT = 120; // build past both ends so nothing pops in

/**
 * Sweep a ribbon between two lateral offsets along the path.
 * Used for the gutter channel that runs beside each kerb.
 */
function sweepRibbon(
  fromLat: number,
  toLat: number,
  yOffset: number,
  uvScale: number
): THREE.BufferGeometry {
  const rings = Math.ceil((JOURNEY_LENGTH + OVERSHOOT * 2) / STEP) + 1;
  const positions = new Float32Array(rings * 2 * 3);
  const normals = new Float32Array(rings * 2 * 3);
  const uvs = new Float32Array(rings * 2 * 2);
  const indices: number[] = [];

  for (let i = 0; i < rings; i++) {
    const s = -OVERSHOOT + i * STEP;
    const cx = pathX(s);
    const cy = pathY(s) + yOffset;
    const cz = -s;
    const h = pathHeading(s);
    const nx = Math.cos(h);
    const nz = Math.sin(h);

    for (let j = 0; j < 2; j++) {
      const lat = j === 0 ? fromLat : toLat;
      const k = (i * 2 + j) * 3;
      positions[k] = cx + nx * lat;
      positions[k + 1] = cy;
      positions[k + 2] = cz + nz * lat;
      normals[k] = 0;
      normals[k + 1] = 1;
      normals[k + 2] = 0;
      const u = (i * 2 + j) * 2;
      uvs[u] = j;
      uvs[u + 1] = (s / uvScale);
    }

    if (i < rings - 1) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}

/** Vertical face of the kerb — a thin wall between road and sidewalk. */
function sweepKerbFace(lat: number, height: number): THREE.BufferGeometry {
  const rings = Math.ceil((JOURNEY_LENGTH + OVERSHOOT * 2) / STEP) + 1;
  const positions = new Float32Array(rings * 2 * 3);
  const normals = new Float32Array(rings * 2 * 3);
  const uvs = new Float32Array(rings * 2 * 2);
  const indices: number[] = [];
  const sign = Math.sign(lat);

  for (let i = 0; i < rings; i++) {
    const s = -OVERSHOOT + i * STEP;
    const cx = pathX(s);
    const cy = pathY(s);
    const cz = -s;
    const h = pathHeading(s);
    const nx = Math.cos(h);
    const nz = Math.sin(h);

    for (let j = 0; j < 2; j++) {
      const k = (i * 2 + j) * 3;
      positions[k] = cx + nx * lat;
      positions[k + 1] = cy + (j === 0 ? 0 : height);
      positions[k + 2] = cz + nz * lat;
      normals[k] = -nx * sign;
      normals[k + 1] = 0;
      normals[k + 2] = -nz * sign;
      const u = (i * 2 + j) * 2;
      uvs[u] = j;
      uvs[u + 1] = s / 3;
    }
    if (i < rings - 1) {
      const a = i * 2;
      if (sign > 0) indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      else indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}

// ── surface textures ───────────────────────────────────────────────────────

function makeConcreteMaps(): { albedo: THREE.Texture; rough: THREE.Texture } {
  const S = 512;
  const ca = document.createElement("canvas");
  const cr = document.createElement("canvas");
  ca.width = ca.height = cr.width = cr.height = S;
  const a = ca.getContext("2d")!;
  const r = cr.getContext("2d")!;

  a.fillStyle = COLORS.concreteWet;
  a.fillRect(0, 0, S, S);
  r.fillStyle = "rgb(185,185,185)";
  r.fillRect(0, 0, S, S);

  // paving slabs — 1.5 m grid at 3 m per texture repeat
  const cell = S / 3;
  a.strokeStyle = "rgba(0,0,0,0.55)";
  a.lineWidth = 2;
  for (let i = 0; i <= 3; i++) {
    a.beginPath();
    a.moveTo(i * cell, 0);
    a.lineTo(i * cell, S);
    a.stroke();
    a.beginPath();
    a.moveTo(0, i * cell);
    a.lineTo(S, i * cell);
    a.stroke();
    r.strokeStyle = "rgba(90,90,90,0.8)";
    r.lineWidth = 3;
    r.beginPath();
    r.moveTo(i * cell, 0);
    r.lineTo(i * cell, S);
    r.stroke();
    r.beginPath();
    r.moveTo(0, i * cell);
    r.lineTo(S, i * cell);
    r.stroke();
  }

  for (let i = 0; i < 14000; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const v = Math.random();
    a.fillStyle = `rgba(${v > 0.5 ? 200 : 0},${v > 0.5 ? 210 : 0},${v > 0.5 ? 230 : 0},${
      Math.random() * 0.045
    })`;
    a.fillRect(x, y, 1.6, 1.6);
  }
  // damp patches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const rad = 15 + Math.random() * 70;
    const g = r.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, "rgba(45,45,45,0.75)");
    g.addColorStop(1, "rgba(185,185,185,0)");
    r.fillStyle = g;
    r.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  const wrap = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 8;
    return t;
  };
  return { albedo: wrap(ca, true), rough: wrap(cr, false) };
}

export default function Street({ quality }: { quality: Quality }) {
  const concrete = useMemo(() => makeConcreteMaps(), []);

  const geos = useMemo(
    () => ({
      kerbL: sweepKerbFace(-ROAD_HALF, KERB_HEIGHT),
      kerbR: sweepKerbFace(ROAD_HALF, KERB_HEIGHT),
      // gutter: a narrow strip beside each kerb where runoff collects
      gutterL: sweepRibbon(-ROAD_HALF, -ROAD_HALF + 0.55, 0.006, 4),
      gutterR: sweepRibbon(ROAD_HALF - 0.55, ROAD_HALF, 0.006, 4),
    }),
    []
  );

  useEffect(() => {
    concrete.albedo.repeat.set(1.5, 1);
    concrete.rough.repeat.set(1.5, 1);
  }, [concrete]);

  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      concrete.albedo.dispose();
      concrete.rough.dispose();
    },
    [geos, concrete]
  );

  return (
    <group>
      {/* kerb faces — the hard edge between road and sidewalk */}
      {[geos.kerbL, geos.kerbR].map((g, i) => (
        <mesh key={`kerb-${i}`} geometry={g} receiveShadow={quality.shadows}>
          <meshStandardMaterial
            map={concrete.albedo}
            roughnessMap={concrete.rough}
            color="#8d97a6"
            roughness={0.5}
            metalness={0.04}
            envMapIntensity={0.9}
          />
        </mesh>
      ))}

      {/* gutter channel — always the wettest strip on the street */}
      {[geos.gutterL, geos.gutterR].map((g, i) => (
        <mesh key={`gutter-${i}`} geometry={g}>
          <meshStandardMaterial
            color="#05070b"
            roughness={0.12}
            metalness={0.2}
            envMapIntensity={1.4}
          />
        </mesh>
      ))}
    </group>
  );
}
