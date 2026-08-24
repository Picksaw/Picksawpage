import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makePGeometry } from "../../lib/pGeometry";
import { onLightning } from "../../lib/stormEvents";

/**
 * PEmblem — the journey's opening layer.
 * The metallic P floats at the corridor entrance. Moments after the
 * interface fades in, an energy ring FORMS around it. From then on,
 * lightning arcs strike the ring — each hit is a full production:
 * jagged main bolt + branch, impact flash, ring kick, and a real light
 * flash that illuminates the P's metal. Hits charge the ring brighter.
 * Scrolling forward dives the camera THROUGH this ring into the city.
 */

const RING_R = 1.62;
const ARC_POINTS = 18;
const ARC_COUNT = 5;
const STATION_DIST = 4.6; // camera distance while framing the P

/** Responsive emblem scale — the P + ring fit narrow screens too. */
function emblemFit(cam: THREE.PerspectiveCamera): number {
  const visH = 2 * STATION_DIST * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const visW = visH * cam.aspect;
  return Math.min(1, (visW * 0.92) / 3.5);
}

function makeRadialSprite(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const cx = c.getContext("2d")!;
  const g = cx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(230, 248, 255, 1)");
  g.addColorStop(0.25, "rgba(159, 232, 255, 0.75)");
  g.addColorStop(1, "rgba(79, 216, 255, 0)");
  cx.fillStyle = g;
  cx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface ArcSlot {
  main: THREE.Line;
  branch: THREE.Line;
  mat: THREE.LineBasicMaterial;
  impact: THREE.Sprite;
  impact2: THREE.Sprite;
  life: number;
  angle: number;
}

export default function PEmblem() {
  const pGeometry = useMemo(() => makePGeometry(2.35 / 96), []);

  const group = useRef<THREE.Group>(null);
  const pGroup = useRef<THREE.Group>(null);
  const pMat = useRef<THREE.MeshStandardMaterial>(null);
  const sparkMat = useRef<THREE.MeshBasicMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const ringHalo = useRef<THREE.Mesh>(null);
  const orbitSpark = useRef<THREE.Mesh>(null);
  const strikeLight = useRef<THREE.PointLight>(null);

  const arcs = useRef<ArcSlot[]>([]);
  const charge = useRef(0.25);
  const ringFlash = useRef(0);
  const nextStrike = useRef(1.4);
  const clock = useRef(0);
  const formation = useRef(0);
  const spriteTex = useMemo(() => makeRadialSprite(), []);

  const pointer = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const offBolt = onLightning(() => strike(true));
    return () => {
      window.removeEventListener("pointermove", onMove);
      offBolt();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strike = (fromStorm: boolean) => {
    const pool = arcs.current;
    if (pool.length === 0) return;
    let slot = pool[0];
    for (const a of pool) if (a.life < slot.life) slot = a;

    const angle = Math.random() * Math.PI * 2;
    const hit = new THREE.Vector3(
      Math.cos(angle) * RING_R,
      Math.sin(angle) * RING_R,
      0
    );
    // strike comes from the sky / the sides — outside the ring
    const start = new THREE.Vector3(
      hit.x * (1.8 + Math.random() * 0.9) + (Math.random() - 0.5) * 2.4,
      Math.abs(hit.y) * (1.6 + Math.random()) + 2.2 + Math.random() * 1.6,
      -0.6 + Math.random() * 0.8
    );

    // main jagged bolt
    const pts: THREE.Vector3[] = [];
    let branchAnchor = new THREE.Vector3();
    for (let i = 0; i < ARC_POINTS; i++) {
      const t = i / (ARC_POINTS - 1);
      const p = start.clone().lerp(hit, t);
      const jag = Math.sin(t * Math.PI) * 0.4;
      p.x += (Math.random() - 0.5) * jag * 2;
      p.y += (Math.random() - 0.5) * jag * 2;
      pts.push(p);
      if (i === Math.floor(ARC_POINTS * 0.45)) {
        branchAnchor = p.clone();
      }
    }
    slot.main.geometry.setFromPoints(pts);

    // branch bolt — diverges from mid-path to another ring point
    const bAngle = angle + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
    const bHit = new THREE.Vector3(
      Math.cos(bAngle) * RING_R,
      Math.sin(bAngle) * RING_R,
      0
    );
    const bPts: THREE.Vector3[] = [branchAnchor];
    const bLen = 7;
    for (let i = 1; i < bLen; i++) {
      const t = i / (bLen - 1);
      const p = branchAnchor.clone().lerp(bHit, t);
      p.x += (Math.random() - 0.5) * 0.55 * Math.sin(t * Math.PI);
      p.y += (Math.random() - 0.5) * 0.55 * Math.sin(t * Math.PI);
      bPts.push(p);
    }
    slot.branch.geometry.setFromPoints(bPts);

    // impacts — one at each contact point
    slot.impact.position.copy(hit);
    slot.impact2.position.copy(bHit);
    slot.life = 1;
    slot.angle = angle;

    ringFlash.current = Math.min(1.35, 1);
    charge.current = Math.min(1, charge.current + (fromStorm ? 0.16 : 0.11));
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;

    const cam = state.camera as THREE.PerspectiveCamera;

    // ── dive fades ──
    const camZ = cam.position.z;
    const pFade = Math.max(0, Math.min(1, (camZ - 1.2) / 2.6));
    const ringFade = Math.max(0, Math.min(1, (camZ + 1.6) / 2.8));

    // ── responsive fit (phones / narrow windows) ──
    if (group.current) {
      const fit = emblemFit(cam);
      const cur = group.current.scale.x || fit;
      const next = cur + (fit - cur) * Math.min(1, dt * 6);
      group.current.scale.setScalar(next);
    }

    // ── formation: ring draws itself in shortly after mount ──
    if (clock.current > 0.8 && formation.current < 1) {
      formation.current = Math.min(1, formation.current + dt / 1.5);
    }
    const f = formation.current;
    const fEase = 1 - Math.pow(1 - f, 3);

    // ── gentle P float + cursor tilt ──
    eased.current.x += (pointer.current.x - eased.current.x) * Math.min(1, dt * 4);
    eased.current.y += (pointer.current.y - eased.current.y) * Math.min(1, dt * 4);
    if (pGroup.current) {
      pGroup.current.rotation.y = eased.current.x * 0.22;
      pGroup.current.rotation.x = -eased.current.y * 0.12;
      pGroup.current.position.y = Math.sin(clock.current * 0.9) * 0.06;
    }
    if (pMat.current) pMat.current.opacity = pFade;
    if (sparkMat.current) sparkMat.current.opacity = 0.9 * pFade;

    // ── charge dynamics ──
    charge.current = Math.max(0.25, charge.current - dt * 0.02);
    ringFlash.current = Math.max(0, ringFlash.current - dt * 2.6);
    const c = charge.current;
    const flash = ringFlash.current;

    // ── strike light — real illumination on the metal, spikes on hits ──
    if (strikeLight.current) {
      strikeLight.current.intensity = (5 + c * 9 + flash * 95) * Math.max(pFade, ringFade);
    }

    // ── the ring ──
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      ring.current.rotation.z += dt * (0.12 + flash * 0.9); // kick spins with strikes
      const s = (0.2 + 0.8 * fEase) * (1 + flash * 0.08);
      ring.current.scale.setScalar(s);
      m.opacity = (0.35 + c * 0.6) * fEase * ringFade;
      const col = new THREE.Color().lerpColors(
        new THREE.Color("#4fd8ff"),
        new THREE.Color("#eaffff"),
        Math.min(1, c * 0.8 + flash)
      );
      m.color.copy(col);
    }
    if (ringHalo.current) {
      const m = ringHalo.current.material as THREE.MeshBasicMaterial;
      ringHalo.current.rotation.z -= dt * 0.06;
      const s = (0.2 + 0.8 * fEase) * (1 + flash * 0.12);
      ringHalo.current.scale.setScalar(s);
      m.opacity = (0.08 + c * 0.16 + flash * 0.28) * fEase * ringFade;
    }

    // ── orbiting spark ──
    if (orbitSpark.current) {
      const a = f < 1 ? fEase * Math.PI * 2 : clock.current * 1.4;
      orbitSpark.current.position.set(
        Math.cos(a) * RING_R,
        Math.sin(a) * RING_R,
        0.05
      );
      const m = orbitSpark.current.material as THREE.MeshBasicMaterial;
      m.opacity = fEase * (0.75 + flash * 0.25) * ringFade;
      orbitSpark.current.scale.setScalar(0.9 + flash * 1.1);
    }

    // ── arcs decay ──
    for (const a of arcs.current) {
      if (a.life > 0) {
        a.life = Math.max(0, a.life - dt * 2.1);
        const flicker = 0.75 + Math.random() * 0.25;
        a.mat.opacity = a.life * flicker * ringFade;
        const grown = 0.3 + (1 - a.life) * 0.9;
        a.impact.scale.setScalar(grown);
        a.impact2.scale.setScalar(grown * 0.7);
        (a.impact.material as THREE.SpriteMaterial).opacity = a.life * ringFade;
        (a.impact2.material as THREE.SpriteMaterial).opacity = a.life * 0.8 * ringFade;
      }
    }

    // ── own strike cadence — quickens as the ring charges ──
    if (formation.current >= 1 && clock.current >= nextStrike.current) {
      strike(false);
      if (Math.random() < 0.3) {
        // double strike — the storm shows off
        window.setTimeout(() => strike(false), 90 + Math.random() * 120);
      }
      const interval = 2.6 + Math.random() * 3.2 - c * 1.2;
      nextStrike.current = clock.current + Math.max(0.9, interval);
    }
  });

  return (
    <group ref={group}>
      {/* the P */}
      <group ref={pGroup}>
        <mesh geometry={pGeometry}>
          <meshStandardMaterial
            ref={pMat}
            color="#d9e6f5"
            metalness={0.92}
            roughness={0.24}
            transparent
            opacity={1}
          />
        </mesh>
        {/* spark in the bowl */}
        <mesh position={[-0.35, 0.53, 0.47]}>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshBasicMaterial ref={sparkMat} color="#bff1ff" toneMapped={false} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* the energy ring — forms, charges, becomes the portal */}
      <mesh ref={ring}>
        <torusGeometry args={[RING_R, 0.028, 10, 96]} />
        <meshBasicMaterial
          color="#4fd8ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
          depthWrite={false}
        />
      </mesh>
      {/* soft halo ring */}
      <mesh ref={ringHalo}>
        <torusGeometry args={[RING_R * 1.13, 0.05, 8, 72]} />
        <meshBasicMaterial
          color="#4fd8ff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
          depthWrite={false}
        />
      </mesh>
      {/* orbiting spark that draws the ring in */}
      <mesh ref={orbitSpark}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#eaffff" transparent opacity={0} toneMapped={false} fog={false} />
      </mesh>

      {/* strike light — lightning genuinely illuminates the emblem */}
      <pointLight
        ref={strikeLight}
        position={[0.8, 0.9, 1.6]}
        intensity={5}
        color="#bfefff"
        distance={12}
      />

      {/* lightning arcs — built once, driven imperatively */}
      <Arcs arcsRef={arcs} spriteTex={spriteTex} />
    </group>
  );
}

/** Arc pool: 5 slots, each a main bolt + branch + dual impact flashes. */
function Arcs({
  arcsRef,
  spriteTex,
}: {
  arcsRef: React.RefObject<ArcSlot[]>;
  spriteTex: THREE.Texture;
}) {
  const made = useRef(false);
  const host = useRef<THREE.Group>(null);

  useEffect(() => {
    if (made.current || !host.current) return;
    made.current = true;
    const pool: ArcSlot[] = [];
    for (let i = 0; i < ARC_COUNT; i++) {
      const mat = new THREE.LineBasicMaterial({
        color: "#dcf4ff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });
      const mkLine = () => {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(),
        ]);
        const line = new THREE.Line(geo, mat);
        line.frustumCulled = false;
        line.renderOrder = 5;
        return line;
      };
      const mkImpact = () => {
        const m = new THREE.SpriteMaterial({
          map: spriteTex,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const s = new THREE.Sprite(m);
        s.scale.setScalar(0.4);
        return s;
      };

      const main = mkLine();
      const branch = mkLine();
      const impact = mkImpact();
      const impact2 = mkImpact();
      host.current.add(main, branch, impact, impact2);
      pool.push({ main, branch, mat, impact, impact2, life: 0, angle: 0 });
    }
    arcsRef.current = pool;
    return () => {
      for (const a of pool) {
        a.main.geometry.dispose();
        a.branch.geometry.dispose();
        a.mat.dispose();
        a.impact.material.dispose();
        a.impact2.material.dispose();
      }
      arcsRef.current = [];
    };
  }, [arcsRef, spriteTex]);

  return <group ref={host} />;
}
