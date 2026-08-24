import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TEMPLATES, type TemplateItem } from "../../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../../config/templateImages";

/**
 * Corridor — the 3D gallery.
 * Camera stations: [P view, painting 1 focus, … painting N focus, exit].
 * Scroll progress maps to a smooth dolly through the stations —
 * forward to walk in, backward to walk out. Paintings hang along the
 * path with slight offsets like pieces in a private gallery; fog and
 * depth rain sell the space.
 */

const N = TEMPLATES.length;
const PAINTING_W = 3.1;
const PAINTING_H = 2.35;
const FOCUS_DIST = 4.2;

const PAINTING_X = [0, -1.5, 1.5, -1.1, 1.1, 0];
const PAINTING_ROT = [0, 0.09, -0.09, 0.06, -0.06, 0];

export const paintingZ = (i: number) => -6 - i * 6;
export const stations: number[] = [
  4.6, // the P + ring
  ...Array.from({ length: N }, (_, i) => paintingZ(i) + FOCUS_DIST),
  paintingZ(N - 1) - 1.6, // exit pull-through
];

export function focusedIndex(progress: number): number {
  const u = progress * (stations.length - 1);
  return Math.max(-1, Math.min(N - 1, Math.round(u) - 1));
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function cameraZ(progress: number): number {
  const u = Math.max(0, Math.min(1, progress)) * (stations.length - 1);
  const k = Math.min(stations.length - 2, Math.floor(u));
  const t = smoothstep(u - k);
  return THREE.MathUtils.lerp(stations[k], stations[k + 1], t);
}

/** Camera dolly driven by shared scroll progress + mouse parallax. */
export function CameraRig({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const pointer = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 0, stations[0]));

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const targetZ = cameraZ(progressRef.current ?? 0);
    // critically-damped feel — never robotic, never laggy
    const k = 1 - Math.exp(-dt * 5.5);
    pos.current.z += (targetZ - pos.current.z) * k;
    pos.current.x += (pointer.current.x * 0.28 - pos.current.x) * k * 0.6;
    pos.current.y += (-pointer.current.y * 0.16 - pos.current.y) * k * 0.6;
    camera.position.copy(pos.current);
    camera.lookAt(pos.current.x * 0.3, pos.current.y * 0.3, pos.current.z - 9);
  });
  return null;
}

/** Bake a painting texture: screenshot + caption strip. Falls back to a
 *  branded gradient if the image can't load. Returns [texture, update]. */
function usePaintingTexture(item: TemplateItem, lang: string): THREE.CanvasTexture {
  const [tex] = useState(() => {
    const c = document.createElement("canvas");
    c.width = 960;
    c.height = 720;
    return { canvas: c, tex: new THREE.CanvasTexture(c) };
  });

  useEffect(() => {
    let alive = true;
    const ctx = tex.canvas.getContext("2d")!;
    const draw = (img: HTMLImageElement | null) => {
      const W = 960;
      const H = 720;
      const CAP = 74;
      ctx.clearRect(0, 0, W, H);

      // image area
      if (img) {
        const iw = img.naturalWidth || 4;
        const ih = img.naturalHeight || 3;
        const scale = Math.max(W / iw, (H - CAP) / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        ctx.drawImage(img, (W - dw) / 2, (H - CAP - dh) / 2, dw, dh);
      } else {
        // branded fallback
        const g = ctx.createLinearGradient(0, 0, W, H - CAP);
        g.addColorStop(0, "#0b1322");
        g.addColorStop(1, "#142238");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H - CAP);
        ctx.fillStyle = "rgba(159,232,255,0.1)";
        ctx.font = "700 300px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((item.name.en || "?")[0], W / 2, (H - CAP) / 2);
      }

      // caption strip
      const cg = ctx.createLinearGradient(0, H - CAP, 0, H);
      cg.addColorStop(0, "rgba(4,7,14,0.88)");
      cg.addColorStop(1, "rgba(4,7,14,0.97)");
      ctx.fillStyle = cg;
      ctx.fillRect(0, H - CAP, W, CAP);
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 34px 'Sora Variable', sans-serif";
      ctx.fillText(item.name.en.toUpperCase(), 36, H - CAP / 2 - 8);
      let host = item.url;
      try {
        host = new URL(item.url).hostname;
      } catch {
        /* keep url */
      }
      ctx.fillStyle = "rgba(148,180,210,0.85)";
      ctx.font = "400 22px 'Sora Variable', sans-serif";
      ctx.fillText(host, 38, H - CAP / 2 + 22);
      // "open" affordance on the right
      ctx.fillStyle = "#4fd8ff";
      ctx.font = "600 22px 'Sora Variable', sans-serif";
      ctx.textAlign = "right";
      const openLabel = lang === "fa" ? "باز کردن ↗" : "OPEN ↗";
      ctx.fillText(openLabel, W - 36, H - CAP / 2);

      tex.tex.needsUpdate = true;
    };

    draw(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => alive && draw(img);
    img.onerror = () => alive && draw(null);
    img.src = TEMPLATE_IMAGE_MAP[item.imageKey] ?? `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`;

    return () => {
      alive = false;
    };
  }, [item, lang, tex]);

  useEffect(() => {
    tex.tex.colorSpace = THREE.SRGBColorSpace;
    tex.tex.anisotropy = 8;
    return () => tex.tex.dispose();
  }, [tex]);

  return tex.tex;
}

function Painting({
  item,
  index,
  lang,
  focused,
  onOpen,
}: {
  item: TemplateItem;
  index: number;
  lang: string;
  focused: boolean;
  onOpen: (item: TemplateItem) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const hovered = useRef(false);
  const focusAmt = useRef(0);
  const map = usePaintingTexture(item, lang);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const target = (focused ? 1 : 0) * 0.85 + (hovered.current ? 0.15 : 0);
    focusAmt.current += (target - focusAmt.current) * Math.min(1, dt * 5);
    if (glow.current) glow.current.opacity = 0.1 + focusAmt.current * 0.38;
    if (group.current) {
      const s = hovered.current ? 1.035 : 1;
      group.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hovered.current = false;
    document.body.style.cursor = "";
  };

  return (
    <group
      ref={group}
      position={[PAINTING_X[index] ?? 0, 0, paintingZ(index)]}
      rotation={[0, PAINTING_ROT[index] ?? 0, 0]}
    >
      {/* glow halo behind the frame — brightens when focused/hovered */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[PAINTING_W + 0.55, PAINTING_H + 0.55]} />
        <meshBasicMaterial
          ref={glow}
          color="#4fd8ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* dark frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[PAINTING_W + 0.16, PAINTING_H + 0.16, 0.09]} />
        <meshStandardMaterial color="#11182a" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* the painting itself */}
      <mesh
        position={[0, 0, 0.012]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={(e) => {
          e.stopPropagation();
          onOpen(item);
        }}
      >
        <planeGeometry args={[PAINTING_W, PAINTING_H]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Depth rain inside the corridor — cheap points, world-fixed. */
function CorridorRain() {
  const ref = useRef<THREE.Points>(null);
  const count = 380;

  const { geo, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = 6 - Math.random() * 48;
      vels[i] = 2.2 + Math.random() * 2.6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo: g, velocities: vels };
  }, [count]);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const attr = ref.current?.geometry.getAttribute("position") as
      | THREE.BufferAttribute
      | undefined;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= velocities[i] * dt;
      if (arr[i * 3 + 1] < -6) arr[i * 3 + 1] = 6;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial
        color="#9fc6ff"
        size={0.045}
        transparent
        opacity={0.38}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/** Faint guide rails along the path — depth cue, gallery lighting vibe. */
function Rails() {
  const mat = (
    <meshBasicMaterial
      color="#4fd8ff"
      transparent
      opacity={0.16}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
      fog={false}
    />
  );
  return (
    <group>
      <mesh position={[-6.2, -2.9, -18]}>
        <boxGeometry args={[0.025, 0.025, 50]} />
        {mat}
      </mesh>
      <mesh position={[6.2, -2.9, -18]}>
        <boxGeometry args={[0.025, 0.025, 50]} />
        {mat}
      </mesh>
    </group>
  );
}

export function CorridorScene({
  progressRef,
  focusedIdx,
  lang,
  onOpen,
}: {
  progressRef: React.RefObject<number>;
  focusedIdx: number;
  lang: string;
  onOpen: (item: TemplateItem) => void;
}) {
  return (
    <>
      <CameraRig progressRef={progressRef} />
      <CorridorRain />
      <Rails />
      {TEMPLATES.map((item, i) => (
        <Painting
          key={item.id}
          item={item}
          index={i}
          lang={lang}
          focused={focusedIdx === i}
          onOpen={onOpen}
        />
      ))}
    </>
  );
}
