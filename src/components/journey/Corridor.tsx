import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { TEMPLATES, type TemplateItem } from "../../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../../config/templateImages";
import { SITE_TEXTS, type Lang } from "../../config/siteTexts";
import { Html, useGLTF } from "@react-three/drei";
import GroundFog from "./GroundFog";
import TrustStats from "../TrustStats";
import ProcessTimeline from "../ProcessTimeline";
import ContactSection from "../ContactSection";
import { PuddleMaterial } from "./PuddleMaterial";
import {
  useJourneyElectricBorder,
  BORDER_OVERSCAN,
} from "./JourneyElectricBorder";

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

export const EXTRA_SECTIONS = 3;
export const TOTAL_STATIONS = N + EXTRA_SECTIONS;

export const stations: number[] = [
  4.6, // the P + ring
  HEADLINE_Z + FOCUS_DIST, // the headline layer
  ...Array.from(
    { length: TOTAL_STATIONS },
    (_, i) => paintingZ(i) + FOCUS_DIST,
  ),
];

/** Painting index for the focus bar: -1 outside the gallery zone. */
export function focusedIndex(progress: number): number {
  const u = progress * (stations.length - 1);
  const idx = Math.round(u) - 2;
  if (u < 1.55) return -1; // Never lose focus at the end of the corridor now
  return Math.max(0, Math.min(TOTAL_STATIONS - 1, idx));
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
  maxHFrac = 0.8,
): number {
  const { size, camera } = useThree();
  const [s, setS] = useState(1);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const visH =
      2 * focusDist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const visW = visH * (size.width / size.height);
    setS(Math.min((maxWFrac * visW) / baseW, (maxHFrac * visH) / baseH, 1.06));
  }, [size, camera, baseW, baseH, focusDist, maxWFrac, maxHFrac]);
  return s;
}

/** Bake a painting texture: screenshot + caption strip, branded fallback. */
function usePaintingTexture(
  item: TemplateItem,
  lang: string,
): THREE.CanvasTexture {
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
        ctx.drawImage(
          img,
          (W - iw * scale) / 2,
          (H - CAP - ih * scale) / 2,
          iw * scale,
          ih * scale,
        );
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
      ctx.fillText(
        lang === "fa" ? "باز کردن ↗" : "OPEN ↗",
        W - 36,
        H - CAP / 2,
      );

      tex.tex.needsUpdate = true;
    };

    draw(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => alive && draw(img);
    img.onerror = () => alive && draw(null);
    img.src =
      TEMPLATE_IMAGE_MAP[item.imageKey] ??
      `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`;

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
  borderTexture,
  hoveredIdxRef,
}: {
  item: TemplateItem;
  index: number;
  lang: string;
  focused: boolean;
  onOpen: (item: TemplateItem) => void;
  borderTexture: THREE.Texture;
  hoveredIdxRef: MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const planeMat = useRef<THREE.MeshBasicMaterial>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const borderMat = useRef<THREE.MeshBasicMaterial>(null);
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
    if (borderMat.current) borderMat.current.opacity = op;

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
    hoveredIdxRef.current = index;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    hovered.current = false;
    hoveredIdxRef.current = -1;
    document.body.style.cursor = "";
  };

  // Only the FOCUSED painting is interactive — a painting must never
  // catch clicks when it isn't the solo layer (this is what made the end
  // of the site open the last template from anywhere).
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
        onPointerOver={focused ? over : undefined}
        onPointerMove={focused ? over : undefined}
        onPointerOut={focused ? out : undefined}
        onClick={
          focused
            ? (e) => {
                e.stopPropagation();
                onOpen(item);
              }
            : undefined
        }
      >
        <planeGeometry args={[PAINTING_W, PAINTING_H]} />
        <meshBasicMaterial
          map={map}
          toneMapped={false}
          transparent
          opacity={1}
        />
      </mesh>
      {/* electric lightning ring — the same painter that drives the DOM
          cards, uploaded as a shared animated texture. Additive so the
          bolt glows over the frame without a background. */}
      <mesh position={[0, 0, 0.022]}>
        <planeGeometry
          args={[
            PAINTING_W * (1 + 2 * BORDER_OVERSCAN),
            PAINTING_H * (1 + 2 * BORDER_OVERSCAN),
          ]}
        />
        <meshBasicMaterial
          ref={borderMat}
          map={borderTexture}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          toneMapped={false}
        />
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

function HtmlSection({
  index,
  focused,
  children
}: {
  index: number;
  focused: boolean;
  children: React.ReactNode;
}) {
  const z = paintingZ(index);
  const fit = useFitScale(PAINTING_W, PAINTING_H, FOCUS_DIST);
  const group = useRef<THREE.Group>(null);
  
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const divRef = useRef<HTMLDivElement>(null);
  
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const op = layerOpacity(camera.position.z, z);
    
    if (frameMat.current) frameMat.current.opacity = op;
    if (glowMat.current) glowMat.current.opacity = (focused ? 0.3 : 0.1) * op;
    
    if (group.current) {
      // Re-apply the EXACT same fit and parallax as the painting meshes!
      group.current.scale.lerp(new THREE.Vector3(fit, fit, fit), Math.min(1, dt * 8));
      group.current.position.x = (camera.position.x || 0) * 0.06;
    }

    if (divRef.current) {
        divRef.current.style.opacity = op.toString();
        divRef.current.style.pointerEvents = focused ? "auto" : "none";
    }
  });

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
      
      {/* HTML Content */}
      <Html 
        transform 
        position={[0, 0, 0.012]} 
        scale={PAINTING_W / 1200}
        zIndexRange={[100, 0]} 
        center
      >
        <div 
          ref={divRef}
          className="bg-[#04060d] text-white custom-scrollbar overflow-x-hidden overflow-y-auto"
          style={{ width: 1200, height: 1200 * (PAINTING_H / PAINTING_W), opacity: 0 }}
        >
          <div className="w-full min-h-full flex flex-col items-center justify-start p-4 md:p-8">
             {children}
          </div>
        </div>
      </Html>
    </group>
  );
}

// ── Custom GLTF Building Loader ─────────────────────────────────────────────
// If you download a high quality building from Sketchfab or KitBash3D, 
// place the .glb file in public/models/ and uncomment this component to use it.
/*
export function CustomBuilding({ url, position, rotation }: any) {
  const { scene } = useGLTF(url);
  // Clone it so you can use the same building multiple times
  const clone = useMemo(() => scene.clone(), [scene]);
  return <primitive object={clone} position={position} rotation={rotation} />;
}
*/

// ── the city ───────────────────────────────────────────────────────────────

import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const scaleUV = (geo: THREE.BufferGeometry, u: number, v: number) => {
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (!uv) return;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  }
  uv.needsUpdate = true;
};

function addRooftopProps(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  concreteMat: THREE.Material,
  hasAntenna: boolean,
) {
  // wet concrete roof base
  const roofGeo = new THREE.BoxGeometry(w - 0.05, 0.1, d - 0.05);
  const roof = new THREE.Mesh(roofGeo, concreteMat);
  roof.position.y = h + 0.05;
  group.add(roof);

  // AC Units
  const acCount = Math.floor(Math.random() * 3) + 1;
  const acGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const acMat = new THREE.MeshStandardMaterial({
    color: "#222630",
    roughness: 0.8,
    metalness: 0.2,
    fog: true,
  });

  for (let i = 0; i < acCount; i++) {
    const ac = new THREE.Mesh(acGeo, acMat);
    ac.position.set(
      (Math.random() - 0.5) * (w - 0.8),
      h + 0.1 + 0.15,
      (Math.random() - 0.5) * (d - 0.8),
    );
    group.add(ac);
  }

  // Antenna
  if (hasAntenna) {
    const mastH = 1.0 + Math.random() * 1.5;
    const mastGeo = new THREE.CylinderGeometry(0.015, 0.03, mastH, 8);
    const mastMat = new THREE.MeshStandardMaterial({
      color: "#111",
      roughness: 0.5,
      metalness: 0.8,
      fog: true,
    });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(
      (Math.random() - 0.5) * (w - 0.8),
      h + 0.1 + mastH / 2,
      (Math.random() - 0.5) * (d - 0.8),
    );
    group.add(mast);

    const tipGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const tipMat = new THREE.MeshBasicMaterial({
      color: "#ff2a2a",
      toneMapped: false,
      fog: true,
    });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = mastH / 2;
    mast.add(tip);
  }
}

function buildType1(
  concreteMat: THREE.Material,
  defaultGlassMat: THREE.Material,
) {
  const w = 2.4,
    h = 8.0,
    d = 2.4;
  const group = new THREE.Group();

  const coreGeo = new THREE.BoxGeometry(w - 0.2, h, d - 0.2);
  scaleUV(coreGeo, 3, 10);
  const core = new THREE.Mesh(coreGeo, defaultGlassMat);
  core.userData.isGlass = true;
  core.position.y = h / 2;
  group.add(core);

  const colGeo = new RoundedBoxGeometry(0.3, h, 0.3, 2, 0.05);
  const positions = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
    [0, -d / 2],
    [0, d / 2],
    [-w / 2, 0],
    [w / 2, 0],
  ];
  for (const [px, pz] of positions) {
    const col = new THREE.Mesh(colGeo, concreteMat);
    col.position.set(px, h / 2, pz);
    group.add(col);
  }

  const rimGeo = new RoundedBoxGeometry(w + 0.1, 0.4, d + 0.1, 2, 0.05);
  const base = new THREE.Mesh(rimGeo, concreteMat);
  base.position.y = 0.2;
  group.add(base);

  const crown = new THREE.Mesh(rimGeo, concreteMat);
  crown.position.y = h;
  group.add(crown);

  addRooftopProps(group, w, h, d, concreteMat, true);
  return { group, w, h, d };
}

function buildType2(
  concreteMat: THREE.Material,
  defaultGlassMat: THREE.Material,
) {
  const w = 3.2,
    h = 5.5,
    d = 3.2;
  const group = new THREE.Group();

  const addTier = (tw: number, th: number, td: number, yOffset: number) => {
    const coreGeo = new THREE.BoxGeometry(tw - 0.2, th, td - 0.2);
    scaleUV(coreGeo, 4, Math.floor(th));
    const core = new THREE.Mesh(coreGeo, defaultGlassMat);
    core.userData.isGlass = true;
    core.position.y = yOffset + th / 2;
    group.add(core);

    const slabGeo = new RoundedBoxGeometry(tw + 0.1, 0.2, td + 0.1, 2, 0.04);
    for (let sy = 0; sy <= th + 0.01; sy += 1.5) {
      const slab = new THREE.Mesh(slabGeo, concreteMat);
      slab.position.y = yOffset + sy;
      group.add(slab);
    }
    const colGeo = new RoundedBoxGeometry(0.4, th, 0.4, 2, 0.05);
    const corners = [
      [-tw / 2, -td / 2],
      [tw / 2, -td / 2],
      [-tw / 2, td / 2],
      [tw / 2, td / 2],
    ];
    for (const [px, pz] of corners) {
      const col = new THREE.Mesh(colGeo, concreteMat);
      col.position.set(px, yOffset + th / 2, pz);
      group.add(col);
    }
  };

  addTier(w, 3.0, d, 0);
  addTier(w - 0.8, 2.5, d - 0.8, 3.0);

  addRooftopProps(group, w - 0.8, h, d - 0.8, concreteMat, false);
  return { group, w, h, d };
}

function buildType3(
  concreteMat: THREE.Material,
  defaultGlassMat: THREE.Material,
) {
  const w = 3.5,
    h = 6.5,
    d = 1.8;
  const group = new THREE.Group();

  const coreGeo = new THREE.BoxGeometry(w, h, d - 0.1);
  scaleUV(coreGeo, 5, 8);
  const core = new THREE.Mesh(coreGeo, defaultGlassMat);
  core.userData.isGlass = true;
  core.position.y = h / 2;
  group.add(core);

  const wallGeo = new RoundedBoxGeometry(0.4, h + 0.4, d + 0.2, 2, 0.05);
  const wallL = new THREE.Mesh(wallGeo, concreteMat);
  wallL.position.set(-w / 2, h / 2 + 0.2, 0);
  group.add(wallL);

  const wallR = new THREE.Mesh(wallGeo, concreteMat);
  wallR.position.set(w / 2, h / 2 + 0.2, 0);
  group.add(wallR);

  const louverGeo = new THREE.BoxGeometry(w, 0.1, d + 0.05);
  for (let sy = 1; sy < h; sy += 1.0) {
    const louver = new THREE.Mesh(louverGeo, concreteMat);
    louver.position.y = sy;
    group.add(louver);
  }

  const roofGeo = new THREE.CylinderGeometry(
    d / 2 + 0.1,
    d / 2 + 0.1,
    w + 0.2,
    3,
  );
  const roof = new THREE.Mesh(roofGeo, concreteMat);
  roof.rotation.z = Math.PI / 2;
  roof.rotation.x = Math.PI / 2;
  roof.position.y = h + 0.4;
  group.add(roof);

  addRooftopProps(group, w, h + 0.5, d, concreteMat, true);
  return { group, w, h, d };
}

function buildType4(
  concreteMat: THREE.Material,
  defaultGlassMat: THREE.Material,
) {
  const w = 2.8,
    h = 4.5,
    d = 2.8;
  const group = new THREE.Group();

  const coreGeo = new THREE.BoxGeometry(w - 0.3, h, d - 0.3);
  scaleUV(coreGeo, 3, 5);
  const core = new THREE.Mesh(coreGeo, defaultGlassMat);
  core.userData.isGlass = true;
  core.position.y = h / 2;
  group.add(core);

  const hSlab = new RoundedBoxGeometry(w + 0.1, 0.2, d + 0.1, 2, 0.04);
  for (let sy = 0; sy <= h; sy += 1.5) {
    const slab = new THREE.Mesh(hSlab, concreteMat);
    slab.position.y = sy;
    group.add(slab);
  }

  const vColGeo = new RoundedBoxGeometry(0.2, h, 0.2, 2, 0.03);
  for (let x = -w / 2; x <= w / 2 + 0.01; x += w / 3) {
    for (const z of [-d / 2, d / 2]) {
      const col = new THREE.Mesh(vColGeo, concreteMat);
      col.position.set(x, h / 2, z);
      group.add(col);
    }
  }
  for (let z = -d / 2; z <= d / 2 + 0.01; z += d / 3) {
    for (const x of [-w / 2, w / 2]) {
      const col = new THREE.Mesh(vColGeo, concreteMat);
      col.position.set(x, h / 2, z);
      group.add(col);
    }
  }

  addRooftopProps(group, w, h, d, concreteMat, false);
  return { group, w, h, d };
}

function buildType5(
  concreteMat: THREE.Material,
  defaultGlassMat: THREE.Material,
) {
  const w = 2.4,
    h = 7.0,
    d = 1.4;
  const group = new THREE.Group();

  const buildTower = (tx: number) => {
    const tw = 1.0;
    const coreGeo = new THREE.BoxGeometry(tw - 0.1, h, d - 0.1);
    scaleUV(coreGeo, 2, 8);
    const core = new THREE.Mesh(coreGeo, defaultGlassMat);
    core.userData.isGlass = true;
    core.position.set(tx, h / 2, 0);
    group.add(core);

    const colGeo = new RoundedBoxGeometry(0.2, h + 0.2, 0.2, 2, 0.03);
    for (const cx of [tx - tw / 2, tx + tw / 2]) {
      for (const cz of [-d / 2, d / 2]) {
        const col = new THREE.Mesh(colGeo, concreteMat);
        col.position.set(cx, h / 2 + 0.1, cz);
        group.add(col);
      }
    }
    const capGeo = new RoundedBoxGeometry(tw + 0.1, 0.2, d + 0.1, 2, 0.03);
    const cap = new THREE.Mesh(capGeo, concreteMat);
    cap.position.set(tx, h + 0.2, 0);
    group.add(cap);
    const base = new THREE.Mesh(capGeo, concreteMat);
    base.position.set(tx, 0.1, 0);
    group.add(base);

    const mastH = 2.0;
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.03, mastH, 8),
      new THREE.MeshStandardMaterial({
        color: "#111",
        roughness: 0.5,
        fog: true,
      }),
    );
    mast.position.set(tx, h + 0.3 + mastH / 2, 0);
    group.add(mast);

    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({
        color: "#ff2a2a",
        toneMapped: false,
        fog: true,
      }),
    );
    tip.position.y = mastH / 2;
    mast.add(tip);
  };

  buildTower(-0.7);
  buildTower(0.7);

  const bridgeGeo = new RoundedBoxGeometry(0.6, 0.4, 0.6, 2, 0.04);
  for (const by of [h * 0.4, h * 0.7]) {
    const bridge = new THREE.Mesh(bridgeGeo, concreteMat);
    bridge.position.set(0, by, 0);
    group.add(bridge);
  }

  return { group, w, h, d };
}

/** Window textures — every single window lit, brightness varies. */

interface WindowMaps {
  map: THREE.Texture;
  emissiveMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  metalnessMap: THREE.Texture;
}

function makeWindowTextures(): WindowMaps[] {
  const out: WindowMaps[] = [];
  for (let v = 0; v < 3; v++) {
    // Diffuse / Emissive Canvas
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 1024;
    const ctx = c.getContext("2d")!;
    
    // Roughness Canvas
    const cRough = document.createElement("canvas");
    cRough.width = 512;
    cRough.height = 1024;
    const ctxRough = cRough.getContext("2d")!;
    
    // Metalness Canvas
    const cMetal = document.createElement("canvas");
    cMetal.width = 512;
    cMetal.height = 1024;
    const ctxMetal = cMetal.getContext("2d")!;

    // Base background (Building Frame / Wall)
    ctx.fillStyle = "#0a0b10"; 
    ctx.fillRect(0, 0, 512, 1024);
    
    // Frames are rough and non-metallic
    ctxRough.fillStyle = "#e0e0e0"; // High roughness
    ctxRough.fillRect(0, 0, 512, 1024);
    
    ctxMetal.fillStyle = "#333333"; // Low metalness
    ctxMetal.fillRect(0, 0, 512, 1024);
    
    const cols = 8;
    const rows = 16;
    const cw = 512 / cols;
    const ch = 1024 / rows;
    
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        
        const winX = x * cw + cw * 0.15;
        const winY = y * ch + ch * 0.15;
        const winW = cw * 0.7;
        const winH = ch * 0.7;

        // Glass is very smooth and highly metallic (like a mirror)
        ctxRough.fillStyle = "#111111"; // Low roughness (shiny)
        ctxRough.fillRect(winX, winY, winW, winH);
        
        ctxMetal.fillStyle = "#ffffff"; // High metalness (reflective)
        ctxMetal.fillRect(winX, winY, winW, winH);

        const rowProb = (y % 4 === 0) ? 0.7 : 0.25;
        const isOn = Math.random() < rowProb;
        
        if (isOn) {
          const bright = 0.4 + Math.random() * 0.6;
          let r, g, b;
          const type = Math.random();
          if (type < 0.08) {
            r = 255; g = 170 + bright * 50; b = 100;
          } else if (type < 0.3) {
            r = 220 + bright * 35; g = 240 + bright * 15; b = 255;
          } else {
            r = 80 + bright * 90; g = 190 + bright * 60; b = 255;
          }

          const grad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
          grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.9 + bright * 0.1})`);
          grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.1 + bright * 0.2})`);

          ctx.fillStyle = grad;
          ctx.fillRect(winX, winY, winW, winH);
          
          ctx.fillStyle = "#010102";
          const detail = Math.random();
          if (detail < 0.3) {
            const splitW = winW * 0.5;
            ctx.fillRect(winX + splitW - 1.5, winY, 3, winH);
            // frame details should be rough
            ctxRough.fillStyle = "#e0e0e0";
            ctxRough.fillRect(winX + splitW - 1.5, winY, 3, winH);
            ctxMetal.fillStyle = "#333333";
            ctxMetal.fillRect(winX + splitW - 1.5, winY, 3, winH);
          } else if (detail < 0.6) {
            const blindH = winH * (0.2 + Math.random() * 0.6);
            ctx.fillRect(winX, winY, winW, blindH);
            ctxRough.fillStyle = "#dddddd";
            ctxRough.fillRect(winX, winY, winW, blindH);
            ctxMetal.fillStyle = "#111111";
            ctxMetal.fillRect(winX, winY, winW, blindH);
          } else if (detail < 0.8) {
            const deskH = winH * (0.2 + Math.random() * 0.3);
            ctx.fillRect(winX, winY + winH - deskH, winW, deskH);
            ctxRough.fillStyle = "#aaaaaa";
            ctxRough.fillRect(winX, winY + winH - deskH, winW, deskH);
            ctxMetal.fillStyle = "#222222";
            ctxMetal.fillRect(winX, winY + winH - deskH, winW, deskH);
          }
        } else {
          ctx.fillStyle = "#030408";
          ctx.fillRect(winX, winY, winW, winH);
        }
      }
    }

    const createTex = (canvas: HTMLCanvasElement) => {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      return tex;
    };

    out.push({
      map: createTex(c),
      emissiveMap: createTex(c),
      roughnessMap: createTex(cRough),
      metalnessMap: createTex(cMetal),
    });
  }
  return out;
}

interface Building {
  x: number;
  z: number;
  typeIndex: number;
  tex: number;
  rotation: number;
}

function makeCity(): Building[] {
  const list: Building[] = [];
  let seed = 20260824;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const startZ = 8;
  const endZ = paintingZ(TOTAL_STATIONS - 1) - 12;
  const step = 6.0;
  const nearX = 4.0;
  const rowGap = 4.5;

  for (let z = startZ; z > endZ; z -= step) {
    for (const side of [-1, 1]) {
      const rows = rnd() < 0.55 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        const x = side * (nearX + r * rowGap + rnd() * 1.5);
        list.push({
          x: x + (rnd() - 0.5) * 1.0,
          z: z + (rnd() - 0.5) * step * 0.4,
          typeIndex: Math.floor(rnd() * 10),
          tex: Math.floor(rnd() * 3),
          rotation: Math.floor(rnd() * 4) * (Math.PI / 2),
        });
      }
    }
  }
  return list;
}

function City() {
  const buildings = useMemo(() => makeCity(), []);

  const windowTexs = useMemo(() => makeWindowTextures(), []);
  
  // Load custom GLTFs
  const gltf01 = useGLTF(import.meta.env.BASE_URL + "building_02.glb") as any;
  const gltf02 = useGLTF(import.meta.env.BASE_URL + "apartmen_building.glb") as any;
  const gltf03 = useGLTF(import.meta.env.BASE_URL + "game_ready_mid_poly_building.glb") as any;
  const gltf04 = useGLTF(import.meta.env.BASE_URL + "sci-fi_building.glb") as any;
  const gltf05 = useGLTF(import.meta.env.BASE_URL + "sci-fi_building_11.glb") as any;

  const { concreteMat, windowMats, prototypes } = useMemo(() => {
    const cMat = new THREE.MeshStandardMaterial({
      color: "#0c0e12",
      roughness: 0.12,
      metalness: 0.4,
      fog: true,
    });

    const wMats = windowTexs.map(
      (tex) =>
        new THREE.MeshStandardMaterial({
          map: tex.map,
          emissiveMap: tex.emissiveMap,
          roughnessMap: tex.roughnessMap,
          metalnessMap: tex.metalnessMap,
          emissive: new THREE.Color(1.5, 1.5, 1.5),
          emissiveIntensity: 1.4,
          color: "#ffffff",
          fog: true,
        }),
    );
    
    // Prepare custom GLTFs
    const createCustomPrototype = (scene: THREE.Group) => {
        const customGroup = new THREE.Group();
        const clonedCustom = scene.clone();
        
        // Auto-scale the building so its footprint fits in our city grid!
        // We want the max width/depth to be exactly 3.2 units.
        const tempBox = new THREE.Box3().setFromObject(clonedCustom);
        const tempSize = new THREE.Vector3();
        tempBox.getSize(tempSize);
        
        const maxFootprint = Math.max(tempSize.x, tempSize.z);
        // If for some reason it's 0, default to 1.0, else scale it to fit 3.2 units wide.
        let autoScale = maxFootprint > 0.001 ? 3.2 / maxFootprint : 1.0;
        
        // Clamp height so massive models don't completely block the camera perspective
        // (Procedural buildings max out around 9.5. Let's cap customs at 14)
        if (tempSize.y * autoScale > 14) {
            autoScale = 14 / tempSize.y;
        }
        
        clonedCustom.scale.setScalar(autoScale);
        
        // Re-measure after scaling
        const box = new THREE.Box3().setFromObject(clonedCustom);
        const size = new THREE.Vector3();
        box.getSize(size);
        const w = size.x || 3.2;
        const h = size.y || 8;
        const d = size.z || 3.2;
        
        // Center horizontally
        const center = new THREE.Vector3();
        box.getCenter(center);
        clonedCustom.position.x = -center.x;
        clonedCustom.position.z = -center.z;
        // Snap bottom to y=0 of the group (instead of centering Y or doing h/2)
        clonedCustom.position.y = -box.min.y; 
        
        customGroup.add(clonedCustom);

        // Make materials accept fog
        clonedCustom.traverse((child: any) => {
            if(child.isMesh && child.material) {
                child.material.fog = true;
                if(child.material.emissiveMap || (child.material.emissive && child.material.emissive.getHex() > 0)) {
                    child.material.emissiveIntensity = 2.5;
                }
            }
        });
        
        return { group: customGroup, w, h, d };
    };

    const protos = [
      buildType1(cMat, wMats[0]),
      buildType2(cMat, wMats[0]),
      buildType3(cMat, wMats[0]),
      buildType4(cMat, wMats[0]),
      buildType5(cMat, wMats[0]),
      createCustomPrototype(gltf01.scene),
      createCustomPrototype(gltf02.scene),
      createCustomPrototype(gltf03.scene), // some kitbash are huge, tune as needed
      createCustomPrototype(gltf04.scene),
      createCustomPrototype(gltf05.scene)
    ];

    return { concreteMat: cMat, windowMats: wMats, prototypes: protos };
  }, [windowTexs, gltf01, gltf02, gltf03, gltf04, gltf05]);

  const cityGroup = useMemo(() => {
    const g = new THREE.Group();

    for (const b of buildings) {
      const proto = prototypes[b.typeIndex];
      const instance = proto.group.clone();
      instance.position.set(b.x, -1.98, b.z);
      instance.rotation.y = b.rotation;

      const chosenGlassMat = windowMats[b.tex];
      const foundationGeo = new THREE.BoxGeometry(
        proto.w - 0.2,
        20,
        proto.d - 0.2,
      );
      const foundation = new THREE.Mesh(foundationGeo, concreteMat);
      foundation.position.set(0, -10, 0);
      instance.add(foundation);

      instance.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.isGlass) {
          obj.material = chosenGlassMat;
        }
      });
      g.add(instance);
    }
    return g;
  }, [buildings, prototypes, windowMats]);

  useEffect(() => {
    return () => {
      // We only dispose materials and geometries created in useMemo
      concreteMat.dispose();
      windowMats.forEach((m) => m.dispose());
      windowTexs.forEach((t) => { t.map.dispose(); t.emissiveMap.dispose(); t.roughnessMap.dispose(); t.metalnessMap.dispose(); });
      prototypes.forEach((p) =>
        p.group.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            if (o.geometry) o.geometry.dispose();
            if (
              o.material &&
              !windowMats.includes(o.material as any) &&
              o.material !== concreteMat
            ) {
              // Dispose unique materials like AC or Antenna materials created inside buildType
              (o.material as THREE.Material).dispose();
            }
          }
        }),
      );
    };
  }, [concreteMat, windowMats, windowTexs, prototypes]);

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -2.0, -26]}
        scale={[1, 1, 1]}
      >
        <planeGeometry args={[110, 150]} />
        <Suspense fallback={<meshBasicMaterial color="#04060d" />}>
          <PuddleMaterial />
        </Suspense>
      </mesh>

      {/* Street level ambient neon reflections */}
      {Array.from({ length: 25 }).map((_, i) => {
        const z = 8 - i * 6.5;
        const side = i % 2 === 0 ? 1 : -1;
        const colors = ["#4fd8ff", "#9fe8ff", "#2a6cff", "#ffffff"];
        const color = colors[i % colors.length];
        return (
          <pointLight
            key={i}
            position={[side * 4, -1.2, z]}
            intensity={12}
            color={color}
            distance={25}
          />
        );
      })}

      <primitive object={cityGroup} />
    </>
  );
}

/** Depth rain inside the corridor. */
function CorridorRain() {
  const ref = useRef<THREE.LineSegments>(null);
  const count = 400;

  const { geo, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const vels = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 15;
      const z = 6 - Math.random() * 78;
      const y = (Math.random() - 0.5) * 12;
      const len = 0.5 + Math.random() * 0.8;
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y + len;
      positions[i * 6 + 5] = z;
      vels[i] = 4.0 + Math.random() * 3.0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo: g, velocities: vels };
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const arr = geo.getAttribute("position").array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 6 + 1] -= velocities[i] * dt;
      arr[i * 6 + 4] -= velocities[i] * dt;
      if (arr[i * 6 + 4] < -6) {
        arr[i * 6 + 1] += 12;
        arr[i * 6 + 4] += 12;
      }
    }
    geo.getAttribute("position").needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial
        color="#9fc6ff"
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + "building_02.glb");
useGLTF.preload(import.meta.env.BASE_URL + "apartmen_building.glb");
useGLTF.preload(import.meta.env.BASE_URL + "game_ready_mid_poly_building.glb");
useGLTF.preload(import.meta.env.BASE_URL + "sci-fi_building.glb");
useGLTF.preload(import.meta.env.BASE_URL + "sci-fi_building_11.glb");
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
  // one shared animated texture + hover tracker for every painting's ring
  const border = useJourneyElectricBorder(PAINTING_W, PAINTING_H, focusedIdx);
  return (
    <>
      <CameraRig progressRef={progressRef} />
      <CorridorRain />
      <City />
      <GroundFog />
      <HeadlineLayer lang={lang as Lang} />
      {TEMPLATES.map((item, i) => (
        <Painting
          key={item.id}
          item={item}
          index={i}
          lang={lang}
          focused={focusedIdx === i}
          onOpen={onOpen}
          borderTexture={border.texture}
          hoveredIdxRef={border.hoveredIdxRef}
        />
      ))}
      <HtmlSection index={N} focused={focusedIdx === N}>
        <TrustStats lang={lang as Lang} />
      </HtmlSection>
      <HtmlSection index={N + 1} focused={focusedIdx === N + 1}>
        <ProcessTimeline lang={lang as Lang} />
      </HtmlSection>
      <HtmlSection index={N + 2} focused={focusedIdx === N + 2}>
        <ContactSection lang={lang as Lang} />
      </HtmlSection>
    </>
  );
}
