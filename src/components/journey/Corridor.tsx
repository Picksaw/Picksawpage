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
import {
  HEADLINE_Z,
  TOTAL_STATIONS,
  paintingZ,
  stations,
  focusedIndex,
  cameraZ,
  layerOpacity,
} from "./path";

// Re-exports — Journey.tsx imports the walk layout from this module.
export { HEADLINE_Z, paintingZ, stations, focusedIndex, cameraZ, layerOpacity };

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

// Walk layout math (stations, cameraZ, layerOpacity, …) lives in ./path —
// shared with JourneyElectricBorder's draw gating without a circular import.

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
  const _scale = useRef(new THREE.Vector3()); // no per-frame allocation

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const op = layerOpacity(camera.position.z, z);

    // Fully outside the opacity window → stop drawing these 4 meshes
    // (opacity 0 still rasterizes; visible=false skips the draw calls).
    // Pointer handlers only exist on the focused painting, which is
    // always inside the window — so no interaction is lost.
    if (group.current) group.current.visible = op > 0.01;

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
      group.current.scale.lerp(_scale.current.set(s, s, s), Math.min(1, dt * 8));
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
          ref={planeMat}
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

    // Glassmorphism panel background
    const margin = 40;
    const radius = 60;
    ctx.fillStyle = "rgba(4, 7, 14, 0.45)"; // Deep glass
    ctx.strokeStyle = "rgba(79, 216, 255, 0.25)"; // Electric border
    ctx.lineWidth = 4;
    
    // Draw rounded rect
    ctx.beginPath();
    ctx.roundRect(margin, margin, c.width - margin * 2, c.height - margin * 2, radius);
    ctx.fill();
    ctx.stroke();
    
    // Slight gradient glow inside the glass
    const glow = ctx.createLinearGradient(0, 0, 0, c.height);
    glow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0.3)");
    ctx.fillStyle = glow;
    ctx.fill();

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
  children,
}: {
  index: number;
  focused: boolean;
  children: React.ReactNode;
}) {
  const z = paintingZ(index);
  const fit = useFitScale(PAINTING_W, PAINTING_H, FOCUS_DIST);
  const group = useRef<THREE.Group>(null);
  const _scale = useRef(new THREE.Vector3()); // no per-frame allocation

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);

  const { size, camera } = useThree();

  // Pick a base resolution for the UI to render at before scaling.
  const targetW = size.width < 768 ? 400 : 1024;
  const targetH = targetW * (PAINTING_H / PAINTING_W);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const cam = camera as THREE.PerspectiveCamera;
    const op = layerOpacity(cam.position.z, z);

    if (frameMat.current) frameMat.current.opacity = op;
    if (glowMat.current) glowMat.current.opacity = (focused ? 0.3 : 0.1) * op;

    if (group.current) {
      // The <Html> overlay ignores ancestor visibility (drei only hides
      // it behind the camera) — the DOM div is toggled separately below.
      group.current.visible = op > 0.01; // glow + frame meshes
      group.current.scale.lerp(
        _scale.current.set(fit, fit, fit),
        Math.min(1, dt * 8),
      );
      group.current.position.x = (cam.position.x || 0) * 0.06;
    }

    if (outerRef.current && innerRef.current) {
      if (op < 0.01) {
        // display:none skips layout + paint entirely for the off-screen
        // section DOM (the heaviest 2D content in the scene)
        outerRef.current.style.display = "none";
        outerRef.current.style.opacity = "0";
        outerRef.current.style.pointerEvents = "none";
        return;
      }
      if (outerRef.current.style.display !== "block") {
        outerRef.current.style.display = "block";
      }

      // Calculate exact pixel dimensions of the 3D frame on the 2D screen
      const dist = Math.abs(cam.position.z - z);
      const safeDist = Math.max(dist, 0.1);

      const fovRad = THREE.MathUtils.degToRad(cam.fov / 2);
      const visible_height = 2 * safeDist * Math.tan(fovRad);

      // Need to use group.current.scale to match the lerped scale
      const currentScale = group.current ? group.current.scale.x : fit;

      const pxH = (PAINTING_H / visible_height) * size.height * currentScale;
      const pxW = (PAINTING_W / visible_height) * size.height * currentScale;

      // Also account for the parallax X shift on screen
      // If group has position.x, we must shift the overlay
      // 3D X -> screen X
      const shiftX = group.current
        ? (group.current.position.x /
            (visible_height * (size.width / size.height))) *
          size.width
        : 0;

      outerRef.current.style.width = `${pxW}px`;
      outerRef.current.style.height = `${pxH}px`;
      outerRef.current.style.opacity = op.toString();
      outerRef.current.style.pointerEvents = focused ? "auto" : "none";
      outerRef.current.style.transform = `translateX(${shiftX}px)`;

      const scale = pxW / targetW;
      innerRef.current.style.transform = `scale(${scale})`;
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

      {/* HTML Content — perfectly tracking 2D overlay avoiding all CSS3D browser bugs */}
      <Html center zIndexRange={[100, 0]}>
        <div
          ref={outerRef}
          className="relative overflow-hidden bg-[#04060d] text-white flex items-start justify-center rounded-sm"
          style={{ opacity: 0 }}
        >
          <div
            ref={innerRef}
            className="absolute top-0 left-0 origin-top-left overflow-y-auto overflow-x-hidden custom-scrollbar"
            style={{ width: targetW, height: targetH }}
          >
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

        const rowProb = y % 4 === 0 ? 0.7 : 0.25;
        const isOn = Math.random() < rowProb;

        if (isOn) {
          const bright = 0.4 + Math.random() * 0.6;
          let r, g, b;
          const type = Math.random();
          if (type < 0.08) {
            r = 255;
            g = 170 + bright * 50;
            b = 100;
          } else if (type < 0.3) {
            r = 220 + bright * 35;
            g = 240 + bright * 15;
            b = 255;
          } else {
            r = 80 + bright * 90;
            g = 190 + bright * 60;
            b = 255;
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
  
  // We want to collect all valid (x, z) slots first so we can assign Azadi and Milad to exactly ONE of them.
  const slots: {x: number, z: number, rotation: number}[] = [];
  
  for (let z = startZ; z > endZ; z -= step) {
    for (const side of [-1, 1]) {
      const rows = rnd() < 0.55 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        const x = side * (nearX + r * rowGap + rnd() * 1.5);
        slots.push({
          x: x + (rnd() - 0.5) * 1.0,
          z: z + (rnd() - 0.5) * step * 0.4,
          rotation: Math.floor(rnd() * 4) * (Math.PI / 2),
        });
      }
    }
  }
  
  // Randomly select 2 unique slots for our landmarks
  // Let's pick them deterministically based on seed
  const azadiIdx = Math.floor(rnd() * slots.length);
  let miladIdx = Math.floor(rnd() * slots.length);
  while (miladIdx === azadiIdx && slots.length > 1) {
      miladIdx = Math.floor(rnd() * slots.length);
  }
  
  slots.forEach((slot, i) => {
      let typeIndex;
      if (i === azadiIdx) typeIndex = 0;
      else if (i === miladIdx) typeIndex = 1;
      else {
          // The rest are randomly chosen from index 2, 3, and 4
          typeIndex = 2 + Math.floor(rnd() * 3);
      }
      list.push({ ...slot, typeIndex, tex: 0 });
  });

  return list;
}

function MovingStreetLights() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      // The lights follow the camera's Z position exactly,
      // meaning we only ever render 4 lights, but it looks like a continuous street!
      groupRef.current.position.z = camera.position.z;
    }
  });

  const colors = ["#4fd8ff", "#9fe8ff", "#2a6cff", "#ffffff"];

  return (
    <group ref={groupRef}>
      {Array.from({ length: 4 }).map((_, i) => {
        // Space them out relative to the camera
        const zOffset = -i * 8;
        const side = i % 2 === 0 ? 1 : -1;
        const color = colors[i % colors.length];
        return (
          <pointLight
            key={i}
            position={[side * 4, -1.2, zOffset]}
            intensity={15}
            color={color}
            distance={20}
          />
        );
      })}
    </group>
  );
}

function City() {
  const buildings = useMemo(() => makeCity(), []);

  const windowTexs = useMemo(() => makeWindowTextures(), []);

  // Load custom GLTFs
  const gltfAzadi = useGLTF(import.meta.env.BASE_URL + "azadi_tower.glb") as any;
  const gltfMilad = useGLTF(import.meta.env.BASE_URL + "milad_tower.glb") as any;
  const gltfNY = useGLTF(import.meta.env.BASE_URL + "new_york_background_building_1.glb") as any;
  const gltfRealistic = useGLTF(import.meta.env.BASE_URL + "realistic_building.glb") as any;
  const gltfLowRise = useGLTF(import.meta.env.BASE_URL + "low_rise_wall_to_wall_office_building.glb") as any;
  

  const { concreteMat, windowMats, prototypes } = useMemo(() => {
    // A single foundation material shared across all buildings
    const cMat = new THREE.MeshStandardMaterial({
      color: "#050608", // Very dark to blend with fog/abyss
      roughness: 0.8,
      metalness: 0.1,
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
    const createCustomPrototype = (scene: THREE.Group, isLandmark: boolean) => {
      const customGroup = new THREE.Group();
      const clonedCustom = scene.clone();

      // Auto-scale the building so its footprint fits in our city grid!
      const tempBox = new THREE.Box3().setFromObject(clonedCustom);
      const tempSize = new THREE.Vector3();
      tempBox.getSize(tempSize);

      const maxFootprint = Math.max(tempSize.x, tempSize.z);
      let autoScale = maxFootprint > 0.001 ? 3.2 / maxFootprint : 1.0;

      // Clamp height
      const maxHeight = isLandmark ? 35 : 14; // Landmarks can be huge!
      if (tempSize.y * autoScale > maxHeight) {
        autoScale = maxHeight / tempSize.y;
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
      // Snap bottom to y=0 of the group
      clonedCustom.position.y = -box.min.y;

      customGroup.add(clonedCustom);

      // Make materials accept fog and boost emissive
      clonedCustom.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Restore the building's original colors (no heavy darkening)
          // Just make sure it receives fog and is somewhat reflective
          if (child.material.color) {
            child.material.color.lerp(new THREE.Color("#05070a"), 0.5); // Darken by 50%
          }
          child.material.fog = true;
          child.material.roughness = Math.min(
            child.material.roughness || 1.0,
            0.6,
          );

          const matName = (child.material.name || "").toLowerCase();

          if (
            child.material.emissiveMap ||
            (child.material.emissive && child.material.emissive.getHex() > 0)
          ) {
            // Boost existing neon lights
            child.material.emissiveIntensity = 3.5;
          } else if (
            matName.includes("window") ||
            matName.includes("glass") ||
            matName.includes("light")
          ) {
            // Force emissive for materials specifically named window/glass/light
            child.material.emissive = new THREE.Color("#4fd8ff");
            child.material.emissiveIntensity = 2.0;
          } else if (child.material.map) {
            // For Atlas materials or generic walls with painted-on windows:
            // Clone the diffuse map into the emissive slot and give it a cyan/blue tint!
            // This forces the bright parts of the texture (windows) to glow like neon lights in the dark.
            child.material.emissiveMap = child.material.map;
            child.material.emissive = new THREE.Color("#1a4466"); // Soft cyberpunk ambient glow
            child.material.emissiveIntensity = 3.0;
          }
        }
      });

      return { group: customGroup, w, h, d };
    };

    const protos = [
      createCustomPrototype(gltfAzadi.scene, true),
      createCustomPrototype(gltfMilad.scene, true),
      createCustomPrototype(gltfNY.scene, false),
      createCustomPrototype(gltfRealistic.scene, false),
      createCustomPrototype(gltfLowRise.scene, false),
    ];

    return { concreteMat: cMat, windowMats: wMats, prototypes: protos };
  }, [windowTexs, gltfAzadi, gltfMilad, gltfNY, gltfRealistic, gltfLowRise]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      const camZ = camera.position.z;
      // Aggressive Distance Culling for 60 FPS
      // The fog completely hides everything past 45 units.
      // We also hide anything more than 10 units behind the camera.
      groupRef.current.children.forEach((child) => {
        const dist = camZ - child.position.z;
        child.visible = dist > -15 && dist < 48;
      });
    }
  });

  const cityGroup = useMemo(() => {
    const g = new THREE.Group();

    for (const b of buildings) {
      const proto = prototypes[b.typeIndex];
      const instance = proto.group.clone();
      instance.position.set(b.x, -1.98, b.z);
      instance.rotation.y = b.rotation;

      // Add a foundation block under each building so it connects cleanly to the ground
      const foundationGeo = new THREE.BoxGeometry(
        proto.w - 0.2,
        20,
        proto.d - 0.2,
      );
      const foundation = new THREE.Mesh(foundationGeo, concreteMat);
      foundation.position.set(0, -10, 0);
      instance.add(foundation);

      const chosenGlassMat = windowMats[b.tex];
      instance.traverse((obj: any) => {
        if (obj.isMesh && obj.userData.isGlass) {
          obj.material = chosenGlassMat;
        }
      });

      g.add(instance);
    }
    return g;
  }, [buildings, prototypes, concreteMat]);

  useEffect(() => {
    return () => {
      concreteMat.dispose();
      windowMats.forEach((m) => m.dispose());
      windowTexs.forEach((t) => {
        t.map.dispose();
        t.emissiveMap.dispose();
        t.roughnessMap.dispose();
        t.metalnessMap.dispose();
      });
      prototypes.forEach((p) =>
        p.group.traverse((o: any) => {
          if (o instanceof THREE.Mesh) {
            if (o.geometry) o.geometry.dispose();
          }
        }),
      );
    };
  }, [concreteMat, prototypes]);

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

      {/* 60 FPS Optimization: Use 4 moving lights instead of 25 static lights to prevent shader loop lag */}
      <MovingStreetLights />

      <primitive object={cityGroup} ref={groupRef} />
    </>
  );
}

/** Depth rain inside the corridor. */
function CorridorRain() {
  const ref = useRef<THREE.LineSegments>(null);
  
  // Reduced count for less visual clutter
  const count = 600;

  const { geo, velocities, windOffsets } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const vels = new Float32Array(count);
    const wOffsets = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 35;
      const z = 8 - Math.random() * 60;
      const y = -2 + Math.random() * 25; 
      // Much shorter lines to look like small, distinct droplets rather than long streaks
      const len = 0.15 + Math.random() * 0.25; 
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y + len;
      positions[i * 6 + 5] = z;
      // Slightly slower to avoid looking like hyperspace
      vels[i] = 6.0 + Math.random() * 5.0; 
      wOffsets[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo: g, velocities: vels, windOffsets: wOffsets };
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const arr = geo.getAttribute("position").array as Float32Array;
    
    const elapsed = performance.now() / 1000;
    // Smoother, less extreme wind sway
    const windBase = Math.sin(elapsed * 0.108) * 1.5; 
    
    for (let i = 0; i < count; i++) {
      // Y fall
      arr[i * 6 + 1] -= velocities[i] * dt;
      arr[i * 6 + 4] -= velocities[i] * dt;
      
      // X wind drift
      const wind = windBase + Math.sin(elapsed * 0.31 + windOffsets[i]) * 0.25;
      const drift = wind * (0.2 + velocities[i] * 0.02) * dt;
      arr[i * 6] += drift;
      arr[i * 6 + 3] += drift;
      
      // Slant the top vertex slightly
      arr[i * 6 + 3] = arr[i * 6] + (wind * 0.05); 
      
      if (arr[i * 6 + 4] < -3) {
        // Reset to top
        arr[i * 6 + 1] += 25;
        arr[i * 6 + 4] += 25;
        // Keep them contained
        if (arr[i * 6] > 25 || arr[i * 6] < -25) {
            arr[i * 6] = (Math.random() - 0.5) * 35;
            arr[i * 6 + 3] = arr[i * 6] + (wind * 0.05);
        }
      }
    }
    geo.getAttribute("position").needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geo} frustumCulled={false}>
      <lineBasicMaterial
        color="#a0c2e8" 
        transparent
        opacity={0.15} // Subtle opacity so it doesn't wash out the scene
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + "azadi_tower.glb");
useGLTF.preload(import.meta.env.BASE_URL + "milad_tower.glb");
useGLTF.preload(import.meta.env.BASE_URL + "new_york_background_building_1.glb");
useGLTF.preload(import.meta.env.BASE_URL + "realistic_building.glb");
useGLTF.preload(import.meta.env.BASE_URL + "low_rise_wall_to_wall_office_building.glb");
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
