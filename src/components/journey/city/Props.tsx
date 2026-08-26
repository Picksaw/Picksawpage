/**
 * Props — the details that make the district believable.
 *
 * Every prop here answers a question the eye asks unconsciously: where
 * does the rain go (drainpipes, gutters, grates), how does the power
 * arrive (cables, junction boxes), who maintains this place (bins,
 * benches, bollards), and what does the building need to run (AC units,
 * water tanks, antennas, emergency lights).
 *
 * The rule is restraint. Clutter reads as noise, not detail. Props are
 * placed with intent — drainpipes on building corners, benches only on
 * wide sidewalk stretches, cables only spanning the street between
 * poles — and the density is tuned per tier.
 *
 * Everything is instanced by TYPE, so the entire prop layer is about
 * eight draw calls regardless of how many objects are placed.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  FACADE_X,
  ROAD_HALF,
  buildCitySorted,
  buildLamps,
  buildLampsSorted,
  pathHeading,
  pathOffset,
  type BuildingSpec,
} from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { rng } from "../lib/rng";
import type { Quality } from "../lib/quality";

interface Placement {
  s: number;
  pos: THREE.Vector3;
  rotY: number;
  scale: THREE.Vector3;
  seed: number;
}

const _o = { x: 0, y: 0, z: 0 };

/** Plan every prop in the district from a fixed seed. */
function planProps(buildings: BuildingSpec[], density: number) {
  const r = rng(0x9709b5);
  const drainpipes: Placement[] = [];
  const acUnits: Placement[] = [];
  const tanks: Placement[] = [];
  const antennas: Placement[] = [];
  const bins: Placement[] = [];
  const benches: Placement[] = [];
  const bollards: Placement[] = [];
  const grates: Placement[] = [];
  const boxes: Placement[] = [];
  const emergency: Placement[] = [];

  const push = (
    list: Placement[],
    s: number,
    x: number,
    y: number,
    z: number,
    rotY: number,
    sx = 1,
    sy = 1,
    sz = 1
  ) => {
    list.push({
      s,
      pos: new THREE.Vector3(x, y, z),
      rotY,
      scale: new THREE.Vector3(sx, sy, sz),
      seed: r.int(1, 99999),
    });
  };

  for (const b of buildings) {
    if (b.row > 1) continue;
    const roofY = b.y + b.height;
    const streetward = b.side; // which way the facade faces

    // ── drainpipes: on the corners of street-facing buildings ──
    if (b.row === 0 && r.chance(0.75 * density)) {
      for (const corner of [-1, 1]) {
        if (!r.chance(0.7)) continue;
        const off = corner * b.width * 0.46;
        push(
          drainpipes,
          b.s,
          b.x + Math.cos(b.rotY) * off - streetward * 0.28,
          b.y + b.height * 0.5,
          b.z + Math.sin(b.rotY) * off,
          b.rotY,
          1,
          b.height,
          1
        );
      }
    }

    // ── AC units: window boxes on the street facade ──
    if (b.row === 0 && r.chance(0.65 * density)) {
      const n = r.int(1, 3);
      for (let i = 0; i < n; i++) {
        const floor = r.int(1, Math.max(1, Math.floor(b.height / b.floorHeight) - 1));
        const off = r.range(-b.width * 0.35, b.width * 0.35);
        push(
          acUnits,
          b.s,
          b.x + Math.cos(b.rotY) * off - streetward * 0.55,
          b.y + floor * b.floorHeight + 0.6,
          b.z + Math.sin(b.rotY) * off,
          b.rotY
        );
      }
    }

    // ── rooftop water tanks ──
    if (b.rooftopProps && r.chance(0.45 * density)) {
      push(
        tanks,
        b.s,
        b.x + r.range(-b.width * 0.25, b.width * 0.25),
        roofY + 1.5,
        b.z + r.range(-b.depth * 0.25, b.depth * 0.25),
        b.rotY,
        1,
        r.range(0.85, 1.35),
        1
      );
    }

    // ── rooftop antennas ──
    if (b.antennaH > 0 || (b.rooftopProps && r.chance(0.35 * density))) {
      const h = b.antennaH > 0 ? b.antennaH : r.range(3, 7);
      push(antennas, b.s, b.x, roofY + h * 0.5, b.z, b.rotY, 1, h, 1);
    }

    // ── emergency lights above ground-floor doors ──
    if (b.row === 0 && r.chance(0.3 * density)) {
      push(
        emergency,
        b.s,
        b.x - streetward * 0.5,
        b.y + 3.4,
        b.z,
        b.rotY
      );
    }
  }

  // ── street furniture along the sidewalks ──
  let s = 12;
  while (s < 640) {
    const side: -1 | 1 = r.chance(0.5) ? -1 : 1;
    const heading = pathHeading(s);
    const kind = r();

    if (kind < 0.26) {
      // litter bin, tight against the kerb
      pathOffset(s, side * (ROAD_HALF + 1.5), _o);
      push(bins, s, _o.x, _o.y, _o.z, -heading + r.range(-0.4, 0.4));
    } else if (kind < 0.44) {
      // bench, set back against the building line
      pathOffset(s, side * (FACADE_X - 1.6), _o);
      push(benches, s, _o.x, _o.y, _o.z, -heading + (side > 0 ? Math.PI / 2 : -Math.PI / 2));
    } else if (kind < 0.72) {
      // bollards in a short run
      const n = r.int(2, 4);
      for (let i = 0; i < n; i++) {
        pathOffset(s + i * 2.2, side * (ROAD_HALF + 0.75), _o);
        push(bollards, s + i * 2.2, _o.x, _o.y, _o.z, -pathHeading(s + i * 2.2));
      }
    } else {
      // storm drain grate in the gutter
      pathOffset(s, side * (ROAD_HALF - 0.3), _o);
      push(grates, s, _o.x, _o.y + 0.01, _o.z, -heading);
    }
    s += r.range(9, 26) / Math.max(density, 0.3);
  }

  // ── junction boxes on lamp posts ──
  for (const lamp of buildLamps()) {
    if (!r.chance(0.4 * density)) continue;
    push(boxes, lamp.s, lamp.x, lamp.y + 1.5, lamp.z, lamp.rotY);
  }

  return { drainpipes, acUnits, tanks, antennas, bins, benches, bollards, grates, boxes, emergency };
}

// ── cables: real catenary curves strung across the street ─────────────────

function buildCables(density: number): THREE.BufferGeometry | null {
  const r = rng(0xcab1e);
  const lamps = buildLampsSorted();
  const points: number[] = [];
  const SEG = 12;

  for (let i = 0; i < lamps.length - 1; i++) {
    const a = lamps[i];
    const b = lamps[i + 1];
    // only span the street when the posts are on opposite sides
    if (a.side === b.side) continue;
    if (!r.chance(0.55 * density)) continue;

    const ax = a.x;
    const ay = a.y + a.height - 0.6;
    const az = a.z;
    const bx = b.x;
    const by = b.y + b.height - 0.6;
    const bz = b.z;
    // sag proportional to span, as a real catenary
    const span = Math.hypot(bx - ax, bz - az);
    const sag = span * r.range(0.055, 0.11);

    for (let k = 0; k < SEG; k++) {
      const t0 = k / SEG;
      const t1 = (k + 1) / SEG;
      const at = (t: number) => {
        const x = ax + (bx - ax) * t;
        const z = az + (bz - az) * t;
        // parabolic approximation of a catenary — visually identical
        const y = ay + (by - ay) * t - sag * 4 * t * (1 - t);
        return [x, y, z];
      };
      const p0 = at(t0);
      const p1 = at(t1);
      points.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
    }
  }

  if (points.length === 0) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// ── component ──────────────────────────────────────────────────────────────

interface Batch {
  mesh: THREE.InstancedMesh;
  list: Placement[];
}

export default function Props({ quality }: { quality: Quality }) {
  const buildings = useMemo(
    () => buildCitySorted(quality.buildingRows),
    [quality.buildingRows]
  );

  const plan = useMemo(
    () => planProps(buildings, quality.propDensity),
    [buildings, quality.propDensity]
  );

  const { batches, materials, geometries, cables, cableMat, emergencyMat } = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({
      color: "#1c2028",
      roughness: 0.52,
      metalness: 0.78,
      envMapIntensity: 1.1,
    });
    const painted = new THREE.MeshStandardMaterial({
      color: "#252a33",
      roughness: 0.62,
      metalness: 0.28,
      envMapIntensity: 0.9,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#0d1015",
      roughness: 0.75,
      metalness: 0.35,
    });
    const wood = new THREE.MeshStandardMaterial({
      color: "#2a2119",
      roughness: 0.8,
      metalness: 0.05,
    });
    const emergencyMat = new THREE.MeshStandardMaterial({
      color: "#150404",
      emissive: new THREE.Color("#ff3020"),
      emissiveIntensity: 1.6,
      roughness: 0.4,
      toneMapped: true,
    });

    const g = {
      pipe: new THREE.CylinderGeometry(0.075, 0.075, 1, 6),
      ac: new THREE.BoxGeometry(0.9, 0.62, 0.55),
      tank: new THREE.CylinderGeometry(1.15, 1.15, 2.2, 10),
      antenna: new THREE.CylinderGeometry(0.035, 0.06, 1, 5),
      bin: new THREE.CylinderGeometry(0.32, 0.27, 0.95, 8),
      bench: new THREE.BoxGeometry(1.9, 0.09, 0.52),
      bollard: new THREE.CylinderGeometry(0.09, 0.11, 0.92, 7),
      grate: new THREE.BoxGeometry(0.85, 0.03, 0.55),
      box: new THREE.BoxGeometry(0.34, 0.5, 0.22),
      emergency: new THREE.BoxGeometry(0.28, 0.14, 0.16),
    };

    const mk = (geo: THREE.BufferGeometry, mat: THREE.Material, list: Placement[]): Batch => {
      const cap = Math.min(list.length, 220);
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(cap, 1));
      mesh.frustumCulled = false;
      mesh.castShadow = quality.shadows;
      mesh.receiveShadow = quality.shadows;
      mesh.count = 0;
      return { mesh, list };
    };

    const batches: Batch[] = [
      mk(g.pipe, metal, plan.drainpipes),
      mk(g.ac, painted, plan.acUnits),
      mk(g.tank, dark, plan.tanks),
      mk(g.antenna, metal, plan.antennas),
      mk(g.bin, painted, plan.bins),
      mk(g.bench, wood, plan.benches),
      mk(g.bollard, metal, plan.bollards),
      mk(g.grate, dark, plan.grates),
      mk(g.box, painted, plan.boxes),
      mk(g.emergency, emergencyMat, plan.emergency),
    ];

    const cableGeo = buildCables(quality.propDensity);
    const cableMat = new THREE.LineBasicMaterial({
      color: "#0a0d12",
      transparent: true,
      opacity: 0.85,
    });

    return {
      batches,
      materials: [metal, painted, dark, wood, emergencyMat],
      geometries: Object.values(g),
      cables: cableGeo,
      cableMat,
      emergencyMat,
    };
  }, [plan, quality.shadows, quality.propDensity]);

  useEffect(
    () => () => {
      geometries.forEach((x) => x.dispose());
      materials.forEach((m) => m.dispose());
      cables?.dispose();
      cableMat.dispose();
    },
    [geometries, materials, cables, cableMat]
  );

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const frameCount = useMemo(() => ({ n: 0 }), []);

  useFrame(() => {
    // emergency lights pulse slowly, out of phase with everything else
    emergencyMat.emissiveIntensity =
      1.2 + 0.7 * Math.sin(journey.time * 1.7) * Math.sin(journey.time * 0.31);

    frameCount.n++;
    if (frameCount.n % 4 !== 0) return;

    const camS = journey.s;
    for (const batch of batches) {
      let n = 0;
      const cap = batch.mesh.instanceMatrix.count;
      for (const p of batch.list) {
        const ds = p.s - camS;
        if (ds < -34 || ds > 95) continue;
        if (n >= cap) break;
        e.set(0, p.rotY, 0);
        q.setFromEuler(e);
        m4.compose(p.pos, q, p.scale);
        batch.mesh.setMatrixAt(n, m4);
        n++;
      }
      batch.mesh.count = n;
      batch.mesh.instanceMatrix.needsUpdate = true;
    }
  });

  if (!quality.props) return null;

  return (
    <>
      {batches.map((b, i) => (
        <primitive key={i} object={b.mesh} />
      ))}
      {cables && (
        <lineSegments geometry={cables} material={cableMat} frustumCulled={false} />
      )}
    </>
  );
}
