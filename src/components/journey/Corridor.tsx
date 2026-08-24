import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TEMPLATES, type TemplateItem } from "../../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../../config/templateImages";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";

/**
 * Corridor V2 — the neon city walk.
 *
 * Layers, strictly one at a time:
 *   station 0  the P + charging ring
 *   station 1  the "Website Templates" headline floating in 3D
 *   stations   one solo painting per template — nothing visible
 *              behind or ahead of it (fog + distance fade)
 *   exit       the walk ends, the page continues
 *
 * The path runs through a city: black building blocks with blue
 * outlines and glowing cyan windows, different sizes, passing by as
 * you move forward. Paintings auto-fit the viewport (mobile & PC)
 * and stay centered — they never spill off the sides.
 */

const N = TEMPLATES.length;
const PAINTING_W = 3.1;
const PAINTING_H = 2.35;
const FOCUS_DIST = 4.2;

export const HEADLINE_Z = -13;
export const paintingZ = (i: number) => -24 - i * 8;

export const stations: number[] = [
  4.6, // the P + ring
  HEADLINE_Z + FOCUS_DIST, // the headline layer
  ...Array.from({ length: N }, (_, i) => paintingZ(i) + FOCUS_DIST),
  paintingZ(N - 1) - 1.6, // exit pull-through
];

/** Painting index for the focus bar: -1 outside the gallery zone. */
export function focusedIndex(progress: number): number {
  const u = progress * (stations.length - 1);
  const idx = Math.round(u) - 2;
  if (u < 1.55 || u > stations.length - 1.4) return -1;
  return Math.max(0, Math.min(N - 1, idx));
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function cameraZ(progress: number): number {
  const u = Math.max(0, Math.min(1, progress)) * (stations.length - 1);
  const k = Math.min(stations.length - 2, Math.floor(u));
  const t = smoothstep(u - k);
  return THREE.MathUtils.lerp(stations[k], stations[k + 1], t);
}

/** How visible a layer is — fades to zero well before the next appears. */
function layerOpacity(camZ: number, layerZ: number): number {
  const d = camZ - layerZ; // positive while approaching
  if (d <= 0.2) return clamp01(d / 1.2); // fade as the camera reaches it
  return clamp01((8.4 - d) / 2.2); // fully hidden by 8.4 units away
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
    const k = 1 - Math.exp(-dt * 5.5);
    pos.current.z += (targetZ - pos.current.z) * k;
    pos.current.x += (pointer.current.x * 0.22 - pos.current.x) * k * 0.6;
    pos.current.y += (-pointer.current.y * 0.12 - pos.current.y) * k * 0.6;
    camera.position.copy(pos.current);
    camera.lookAt(pos.current.x * 0.3, pos.current.y * 0.3, pos.current.z - 9);
  });
  return null;
}

/** Responsive fit: scale content so width×height fit the viewport at the
 *  focus distance — paintings never spill off the sides, phone or PC. */
function useFitScale(
  baseW: number,
  baseH: number,
  focusDist: number,
  maxWFrac = 0.94,
  maxHFrac = 0.8
): number {
  const { size, camera } = useThree();
  const [s, setS] = useState(1);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const visH = 2 * focusDist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const visW = visH * (size.width / size.height);
    setS(Math.min((maxWFrac * visW) / baseW, (maxHFrac * visH) / baseH, 1.06));
  }, [size, camera, baseW, baseH, focusDist, maxWFrac, maxHFrac]);
  return s;
}

/** Bake a painting texture: screenshot + caption strip, branded fallback. */
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
      if (img) {
        const iw = img.naturalWidth || 4;
        const ih = img.naturalHeight || 3;
        const scale = Math.max(W / iw, (H - CAP) / ih);
        ctx.drawImage(img, (W - iw * scale) / 2, (H - CAP - ih * scale) / 2, iw * scale, ih * scale);
      } else {
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
      ctx.fillStyle = "#4fd8ff";
      ctx.font = "600 22px 'Sora Variable', sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(lang === "fa" ? "باز کردن ↗" : "OPEN ↗", W - 36, H - CAP / 2);

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
  const planeMat = useRef<THREE.MeshBasicMaterial>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const hovered = useRef(false);
  const focusAmt = useRef(0);
  const map = usePaintingTexture(item, lang);
  const fit = useFitScale(PAINTING_W, PAINTING_H, FOCUS_DIST);
  const z = paintingZ(index);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const op = layerOpacity(camera.position.z, z);

    // solo fade — material + glow + frame all obey it
    if (planeMat.current) planeMat.current.opacity = op;
    if (glowMat.current) {
      const target = (focused ? 1 : 0) * 0.85 + (hovered.current ? 0.15 : 0);
      focusAmt.current += (target - focusAmt.current) * Math.min(1, dt * 5);
      glowMat.current.opacity = (0.1 + focusAmt.current * 0.38) * op;
    }
    if (frameMat.current) frameMat.current.opacity = op;

    if (group.current) {
      const hoverS = hovered.current ? 1.03 : 1;
      const s = fit * hoverS;
      group.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
      // parallax lean — tiny, never enough to spill
      group.current.position.x = (camera.position.x || 0) * 0.06;
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
    <group ref={group} position={[0, 0, z]}>
      {/* glow halo behind the frame */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[PAINTING_W + 0.55, PAINTING_H + 0.55]} />
        <meshBasicMaterial
          ref={glowMat}
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
        <meshStandardMaterial
          ref={frameMat}
          color="#11182a"
          metalness={0.6}
          roughness={0.5}
          transparent
          opacity={1}
        />
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
        <meshBasicMaterial map={map} toneMapped={false} transparent opacity={1} />
      </mesh>
    </group>
  );
}

/** The "Website Templates" layer — big typographic plane in space. */
function HeadlineLayer({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const fit = useFitScale(5.6, 2.1, FOCUS_DIST, 0.9, 0.62);

  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1680;
    c.height = 630;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);

    const fa = lang === "fa";
    ctx.direction = fa ? "rtl" : "ltr";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // main line — big, white, cyan glow
    const title = t.heroTitle;
    let size = 150;
    ctx.font = `800 ${size}px '${fa ? "Vazirmatn Variable" : "Sora Variable"}', sans-serif`;
    while (ctx.measureText(title).width > c.width - 140 && size > 60) {
      size -= 6;
      ctx.font = `800 ${size}px '${fa ? "Vazirmatn Variable" : "Sora Variable"}', sans-serif`;
    }
    ctx.shadowColor = "rgba(79,216,255,0.85)";
    ctx.shadowBlur = 44;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(title, c.width / 2, 250);

    // subtitle — quiet gray
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    const sub = t.heroSubtitle;
    let ssize = 40;
    ctx.font = `500 ${ssize}px '${fa ? "Vazirmatn Variable" : "Sora Variable"}', sans-serif`;
    while (ctx.measureText(sub).width > c.width - 200 && ssize > 20) {
      ssize -= 2;
      ctx.font = `500 ${ssize}px '${fa ? "Vazirmatn Variable" : "Sora Variable"}', sans-serif`;
    }
    ctx.fillStyle = "rgba(160,185,210,0.95)";
    ctx.fillText(sub, c.width / 2, 430);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, [lang, t.heroTitle, t.heroSubtitle]);

  useEffect(() => () => texture.dispose(), [texture]);

  // fonts may land after first paint — rebuild once they're ready
  const [, force] = useState(0);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && force((n) => n + 1));
    return () => {
      alive = false;
    };
  }, []);

  useFrame(({ camera }) => {
    const op = layerOpacity(camera.position.z, HEADLINE_Z);
    if (mat.current) mat.current.opacity = op;
    if (group.current) group.current.scale.setScalar(fit);
  });

  return (
    <group ref={group} position={[0, 0.1, HEADLINE_Z]}>
      <mesh>
        <planeGeometry args={[5.6, 2.1]} />
        <meshBasicMaterial
          ref={mat}
          map={texture}
          transparent
          opacity={0}
          toneMapped={false}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

// ── the city ───────────────────────────────────────────────────────────────

/** Window textures — every building lit, dense cyan windows. */
function makeWindowTextures(): THREE.Texture[] {
  const out: THREE.Texture[] = [];
  for (let v = 0; v < 3; v++) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, 128, 256);
    const cols = 5;
    const rows = 12;
    const cw = 128 / cols;
    const ch = 256 / rows;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const r = Math.random();
        if (r < 0.58) {
          // lit window — most of the grid glows, varying brightness
          const bright = 0.4 + Math.random() * 0.6;
          const whiteBlue = Math.random() < 0.22;
          ctx.fillStyle = whiteBlue
            ? `rgba(${215 + bright * 40}, ${240 + bright * 15}, 255, ${0.75 + bright * 0.25})`
            : `rgba(${100 + bright * 70}, ${200 + bright * 45}, 255, ${0.6 + bright * 0.4})`;
          ctx.fillRect(x * cw + cw * 0.16, y * ch + ch * 0.22, cw * 0.62, ch * 0.45);
        } else if (r < 0.72) {
          // dim window — structure reads even when unlit
          ctx.fillStyle = "rgba(60, 110, 170, 0.28)";
          ctx.fillRect(x * cw + cw * 0.2, y * ch + ch * 0.26, cw * 0.55, ch * 0.4);
        }
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    out.push(tex);
  }
  return out;
}

interface Building {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  tex: number;
}

/** Deterministic per-session city layout: blocks flanking the path. */
function makeCity(isMobile: boolean): Building[] {
  const list: Building[] = [];
  let seed = 20260824;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const startZ = 8;
  const endZ = paintingZ(N - 1) - 12;
  const step = isMobile ? 7 : 5;
  for (let z = startZ; z > endZ; z -= step) {
    for (const side of [-1, 1]) {
      const rows = rnd() < 0.4 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        const w = 1.6 + rnd() * 2.6;
        const d = 1.6 + rnd() * 2.6;
        const h = 2 + rnd() * 7.5;
        const x = side * (5.4 + r * 4.5 + rnd() * 2.2);
        list.push({
          x: x + (rnd() - 0.5) * 1.6,
          z: z + (rnd() - 0.5) * step * 0.7,
          w,
          h,
          d,
          tex: Math.floor(rnd() * 3),
        });
      }
    }
  }
  return list;
}

function City() {
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const buildings = useMemo(() => makeCity(isMobile), [isMobile]);
  const windowTexs = useMemo(() => makeWindowTextures(), []);

  // merged resources: one material per window-texture variant
  const mats = useMemo(
    () =>
      windowTexs.map(
        (t) => new THREE.MeshBasicMaterial({ map: t, color: "#ffffff" })
      ),
    [windowTexs]
  );
  const edgeMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#2f7bff",
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  // build meshes imperatively once (many boxes, one draw call each)
  const cityGroup = useMemo(() => {
    const g = new THREE.Group();
    for (const b of buildings) {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mesh = new THREE.Mesh(geo, mats[b.tex]);
      mesh.position.set(b.x, -2.9 + b.h / 2, b.z);
      g.add(mesh);

      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      g.add(edges);
    }
    return g;
  }, [buildings, mats, edgeMat]);

  useEffect(
    () => () => {
      cityGroup.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
        }
      });
      mats.forEach((m) => m.dispose());
      edgeMat.dispose();
      windowTexs.forEach((t) => t.dispose());
    },
    [cityGroup, mats, edgeMat, windowTexs]
  );

  return (
    <>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.92, -26]}>
        <planeGeometry args={[110, 150]} />
        <meshBasicMaterial color="#04060d" />
      </mesh>
      <primitive object={cityGroup} />
    </>
  );
}

/** Depth rain inside the corridor. */
function CorridorRain() {
  const ref = useRef<THREE.Points>(null);
  const count = 380;

  const { geo, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const vels = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = 6 - Math.random() * 78;
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
      <City />
      <HeadlineLayer lang={lang as Lang} />
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
