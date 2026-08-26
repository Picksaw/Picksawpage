import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePGeometry } from "../../lib/pGeometry";
import { onLightning } from "../../lib/stormEvents";

/**
 * PEmblem — the journey's opening layer.
 * The metallic P floats at the corridor entrance; an energy ring FORMS
 * around it, then lightning strikes it. Each strike is a full production:
 * camera-facing RIBBON bolts (soft white core + cyan glow halo, tapered),
 * a diverging branch, dual impact flashes, ring kick, and a real light
 * flash that illuminates the P's metal. Hits charge the ring brighter.
 * Scrolling forward dives the camera THROUGH this ring into the city.
 */

const RING_R = 1.38; // smaller — never reaches the screen edges
const ARC_POINTS = 18;
const BRANCH_POINTS = 8;
const ARC_COUNT = 5;
const STATION_DIST = 4.6;
const RING_SPAN = RING_R * 1.13 * 2; // includes the halo ring

/** Responsive emblem scale — fits BOTH width and height on any screen. */
function emblemFit(cam: THREE.PerspectiveCamera): number {
  const visH = 2 * STATION_DIST * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const visW = visH * cam.aspect;
  return Math.min(1, (visW * 0.85) / RING_SPAN, (visH * 0.7) / RING_SPAN);
}

/** Soft horizontal gradient — the bolt's cross-section. */
function makeBoltTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 8;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "rgba(79,216,255,0)");
  g.addColorStop(0.22, "rgba(120,225,255,0.35)");
  g.addColorStop(0.42, "rgba(200,242,255,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(0.58, "rgba(200,242,255,0.85)");
  g.addColorStop(0.78, "rgba(120,225,255,0.35)");
  g.addColorStop(1, "rgba(79,216,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 8);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

/** Pre-allocated camera-facing ribbon strip (n points → 2n vertices). */
function makeRibbonGeo(n: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n * 2 * 2), 2));
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setIndex(idx);
  return geo;
}

/** Write a jagged polyline into a ribbon geometry, facing the camera. */
function updateRibbon(
  geo: THREE.BufferGeometry,
  pts: THREE.Vector3[],
  width: number,
  camPos: THREE.Vector3
) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
  const n = pts.length;
  const dir = new THREE.Vector3();
  const view = new THREE.Vector3();
  const side = new THREE.Vector3();

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[Math.min(i + 1, n - 1)];
    const prev = pts[Math.max(i - 1, 0)];
    dir.copy(next).sub(prev);
    if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
    dir.normalize();
    view.copy(camPos).sub(p).normalize();
    side.copy(dir).cross(view);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();

    const t = i / (n - 1);
    // taper — thin at the ends, full in the middle
    const w = (width * (0.35 + 0.65 * Math.sin(Math.PI * t))) / 2;
    side.multiplyScalar(w);

    pos.setXYZ(i * 2, p.x - side.x, p.y - side.y, p.z - side.z);
    pos.setXYZ(i * 2 + 1, p.x + side.x, p.y + side.y, p.z + side.z);
    uv.setXY(i * 2, 0, t);
    uv.setXY(i * 2 + 1, 1, t);
  }
  pos.needsUpdate = true;
  uv.needsUpdate = true;
}

interface Ribbon {
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.MeshBasicMaterial;
}

interface ArcSlot {
  core: Ribbon;
  glow: Ribbon;
  branch: Ribbon;
  branchGlow: Ribbon;
  impact: THREE.Sprite;
  impact2: THREE.Sprite;
  life: number;
}

function mkRibbon(tex: THREE.Texture, n: number, width: number, color: string, opacity: number): Ribbon {
  const geo = makeRibbonGeo(n);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    fog: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  void width;
  return { mesh, geo, mat };
}

export default function PEmblem() {
  const pGeometry = useMemo(() => makePGeometry(1.95 / 96), []);
  const { camera } = useThree();

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
  const boltTex = useMemo(() => makeBoltTexture(), []);
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
      if (i === Math.floor(ARC_POINTS * 0.45)) branchAnchor = p.clone();
    }
    updateRibbon(slot.core.geo, pts, 0.075, camera.position);
    updateRibbon(slot.glow.geo, pts, 0.3, camera.position);

    // branch bolt — diverges to a second contact point
    const bAngle = angle + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.5);
    const bHit = new THREE.Vector3(
      Math.cos(bAngle) * RING_R,
      Math.sin(bAngle) * RING_R,
      0
    );
    const bPts: THREE.Vector3[] = [branchAnchor];
    for (let i = 1; i < BRANCH_POINTS; i++) {
      const t = i / (BRANCH_POINTS - 1);
      const p = branchAnchor.clone().lerp(bHit, t);
      p.x += (Math.random() - 0.5) * 0.55 * Math.sin(t * Math.PI);
      p.y += (Math.random() - 0.5) * 0.55 * Math.sin(t * Math.PI);
      bPts.push(p);
    }
    updateRibbon(slot.branch.geo, bPts, 0.05, camera.position);
    updateRibbon(slot.branchGlow.geo, bPts, 0.18, camera.position);

    // impacts at both contact points
    slot.impact.position.copy(hit);
    slot.impact2.position.copy(bHit);
    slot.life = 1;

    ringFlash.current = 1;
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
      strikeLight.current.intensity = (5 + c * 9 + flash * 110) * Math.max(pFade, ringFade);
    }

    // ── the ring ──
    if (ring.current) {
      const m = ring.current.material as THREE.MeshBasicMaterial;
      ring.current.rotation.z += dt * (0.12 + flash * 0.9);
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

    // ── bolts decay — two-stage: crack, then afterglow ──
    for (const a of arcs.current) {
      if (a.life > 0) {
        a.life = Math.max(0, a.life - dt * 2.1);
        const l = a.life;
        const flicker = 0.82 + Math.random() * 0.18;
        const coreA = Math.pow(l, 1.35) * flicker * ringFade;
        const glowA = Math.pow(l, 1.8) * 0.85 * ringFade;
        a.core.mat.opacity = coreA;
        a.glow.mat.opacity = glowA;
        a.branch.mat.opacity = coreA * 0.8;
        a.branchGlow.mat.opacity = glowA * 0.8;
        const grown = 0.32 + (1 - l) * 1.05;
        a.impact.scale.setScalar(grown);
        a.impact2.scale.setScalar(grown * 0.7);
        (a.impact.material as THREE.SpriteMaterial).opacity = l * l * ringFade;
        (a.impact2.material as THREE.SpriteMaterial).opacity = l * l * 0.8 * ringFade;
      }
    }

    // ── own strike cadence — quickens as the ring charges ──
    if (formation.current >= 1 && clock.current >= nextStrike.current) {
      strike(false);
      if (Math.random() < 0.3) {
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
        <mesh position={[-0.29, 0.44, 0.4]}>
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

      {/* ribbon bolts — built once, driven imperatively */}
      <Arcs arcsRef={arcs} boltTex={boltTex} spriteTex={spriteTex} />
    </group>
  );
}

/** Arc pool: 5 slots — each a main bolt + branch (core+glow ribbons)
 *  with dual impact flashes. */
function Arcs({
  arcsRef,
  boltTex,
  spriteTex,
}: {
  arcsRef: React.RefObject<ArcSlot[]>;
  boltTex: THREE.Texture;
  spriteTex: THREE.Texture;
}) {
  const made = useRef(false);
  const host = useRef<THREE.Group>(null);

  useEffect(() => {
    if (made.current || !host.current) return;
    made.current = true;
    const pool: ArcSlot[] = [];

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

    for (let i = 0; i < ARC_COUNT; i++) {
      const core = mkRibbon(boltTex, ARC_POINTS, 0.075, "#ffffff", 0);
      const glow = mkRibbon(boltTex, ARC_POINTS, 0.3, "#7fd8ff", 0);
      const branch = mkRibbon(boltTex, BRANCH_POINTS, 0.05, "#eaf8ff", 0);
      const branchGlow = mkRibbon(boltTex, BRANCH_POINTS, 0.18, "#7fd8ff", 0);
      const impact = mkImpact();
      const impact2 = mkImpact();
      host.current.add(core.mesh, glow.mesh, branch.mesh, branchGlow.mesh, impact, impact2);
      pool.push({ core, glow, branch, branchGlow, impact, impact2, life: 0 });
    }
    arcsRef.current = pool;

    return () => {
      for (const a of pool) {
        for (const r of [a.core, a.glow, a.branch, a.branchGlow]) {
          r.geo.dispose();
          r.mat.dispose();
        }
        a.impact.material.dispose();
        a.impact2.material.dispose();
      }
      arcsRef.current = [];
    };
  }, [arcsRef, boltTex, spriteTex]);

  return <group ref={host} />;
}
