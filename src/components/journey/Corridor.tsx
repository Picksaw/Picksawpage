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
import { getTheme, useThemeId } from "../../lib/themeStore";
import {
  THEMES,
  createLiveTheme,
  easeTheme,
  rgbCss,
  type ThemeParams,
} from "../../lib/themes";
import TrustStats from "../TrustStats";
import ProcessTimeline from "../ProcessTimeline";
import ContactSection from "../ContactSection";
import AboutSceneFrames from "../AboutFrames";
import { PuddleMaterial } from "./PuddleMaterial";
import {
  useJourneyElectricBorder,
  BORDER_OVERSCAN,
} from "./JourneyElectricBorder";
import {
  HEADLINE_Z,
  paintingZ,
  stations,
  focusedIndex,
  cameraZ,
  layerOpacity,
  homeLayout,
  aboutLayout,
  type WalkLayout,
} from "./path";
import { WalkLayoutContext, useWalkLayout } from "./walkContext";

// Re-exports — Journey.tsx imports the walk layout from this module.
export { HEADLINE_Z, paintingZ, stations, focusedIndex, cameraZ, layerOpacity, homeLayout, aboutLayout };
export type { WalkLayout };

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

/** Milad is the finale monument — in reality it is the taller, bigger
 *  tower, so it owns the centre of the road at the end of the walk.
 *  Its GLTF auto-fit already leaves it ~13.7 units tall (footprint 3.2);
 *  ×2.0 makes it ~27 tall × ~6.4 wide — seen from 46 units away it
 *  fills ~55% of the view height, pod and spire both readable, towering
 *  over every side building. */
const MILAD_SCALE = 2.0;
/** Azadi is demoted to a distant side boulevard landmark; ×2 keeps it
 *  recognisable (~5.7 tall) without competing with Milad. */
const AZADI_SIDE_SCALE = 2;

// Walk layout math (stations, cameraZ, layerOpacity, …) lives in ./path —
// shared with JourneyElectricBorder's draw gating without a circular import.

/** Camera dolly driven by shared scroll progress + mouse parallax. */
export function CameraRig({
  progressRef,
}: {
  progressRef: React.RefObject<number>;
}) {
  const layout = useWalkLayout();
  const pointer = useRef({ x: 0, y: 0 });
  const pos = useRef(new THREE.Vector3(0, 0, layout.stations[0]));

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
    const dt = Math.min(delta, 0.25);
    const targetZ = layout.cameraZ(progressRef.current ?? 0);
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
 *  focus distance — windows never spill off the sides, phone or PC. */
export function useFitScale(
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
    // Defer the webp fetch past the intro: the painting is hidden until
    // the camera reaches its station, so the download never needs to
    // compete with first paint or the city's models.
    const imgTimer = window.setTimeout(() => {
      if (!alive) return;
      img.src =
        TEMPLATE_IMAGE_MAP[item.imageKey] ??
        `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`;
    }, 3500);

    return () => {
      alive = false;
      window.clearTimeout(imgTimer);
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
  const layout = useWalkLayout();
  const fit = useFitScale(PAINTING_W, PAINTING_H, FOCUS_DIST);
  const z = layout.frameZ(index);
  const _scale = useRef(new THREE.Vector3()); // no per-frame allocation
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));
  // touch devices should never block vertical scroll — hover is desktop-only
  const isCoarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.25);
    const tp = easeTheme(live.current, THEMES[getTheme()], dt);
    const op = layerOpacity(camera.position.z, z);

    // Fully outside the opacity window → stop drawing these 4 meshes
    if (group.current) group.current.visible = op > 0.01;

    // solo fade — material + glow + frame all obey it
    if (planeMat.current) planeMat.current.opacity = op;
    if (glowMat.current) {
      glowMat.current.color.setRGB(
        tp.accent[0] / 255,
        tp.accent[1] / 255,
        tp.accent[2] / 255,
        THREE.SRGBColorSpace,
      );
      const target = (focused ? 1 : 0) * 0.85 + (hovered.current ? 0.15 : 0);
      focusAmt.current += (target - focusAmt.current) * Math.min(1, dt * 5);
      glowMat.current.opacity = (0.1 + focusAmt.current * 0.38) * op;
    }
    if (frameMat.current) frameMat.current.opacity = op;
    if (borderMat.current) borderMat.current.opacity = op;

    if (group.current) {
      // fade-through scale: when we go *further* into the painting (d → 0),
      // gently shrink it so it never sits opaque covering the whole phone.
      const d = (camera as THREE.PerspectiveCamera).position.z - z;
      let throughScale = 1;
      if (d < 2.8) {
        const t = Math.max(0, Math.min(1, (d + 0.8) / 3.6));
        throughScale = 0.75 + 0.25 * t;
      }
      const hoverS = hovered.current && !isCoarse ? 1.03 : 1;
      const s = fit * hoverS * throughScale;
      group.current.scale.lerp(_scale.current.set(s, s, s), Math.min(1, dt * 8));
      group.current.position.x = isCoarse
        ? 0
        : (camera.position.x || 0) * 0.06;
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (isCoarse) return;
    e.stopPropagation();
    hovered.current = true;
    hoveredIdxRef.current = index;
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    if (isCoarse) return;
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
      {/* the painting itself — tappable on touch (opens the live preview)
          and hoverable on desktop; vertical scroll is never blocked
          because the canvas uses touch-action: pan-y */}
      <mesh
        position={[0, 0, 0.012]}
        onPointerOver={focused && !isCoarse ? over : undefined}
        onPointerMove={focused && !isCoarse ? over : undefined}
        onPointerOut={focused && !isCoarse ? out : undefined}
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
  const themeId = useThemeId();
  const accent = THEMES[themeId].accent;
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
    ctx.strokeStyle = rgbCss(accent, 0.25); // theme accent border
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
    ctx.shadowColor = rgbCss(accent, 0.85);
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
  }, [lang, t.heroTitle, t.heroSubtitle, accent]);

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

/** A framed DOM window standing on the road — the shared shell for the
 *  home sections (landscape, scrollable) and the About walk (portrait,
 *  every pane sized to fit the viewport with NO inner scrolling). */
export function Window3D({
  index,
  focused,
  dir,
  children,
  width = PAINTING_W,
  height = PAINTING_H,
  mobileW = 400,
  desktopW = 1024,
  scrollable = true,
  maxWFrac = 0.94,
  maxHFrac = 0.8,
}: {
  index: number;
  focused: boolean;
  /** CSS direction the frame content should use (so the section text
   *  stays RTL while the 3D frame geometry remains LTR/centered). */
  dir: "ltr" | "rtl";
  children: React.ReactNode;
  /** World-space window size. */
  width?: number;
  height?: number;
  /** Pixel resolution the inner UI renders at before scaling. */
  mobileW?: number;
  desktopW?: number;
  /** true: long content scrolls inside the pane; false: the pane is a
   *  single fixed, viewport-fitted screen (the About frames). */
  scrollable?: boolean;
  maxWFrac?: number;
  maxHFrac?: number;
}) {
  const layout = useWalkLayout();
  const z = layout.frameZ(index);
  const fit = useFitScale(width, height, FOCUS_DIST, maxWFrac, maxHFrac);
  const group = useRef<THREE.Group>(null);
  const _scale = useRef(new THREE.Vector3()); // no per-frame allocation

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));

  const { size, camera } = useThree();

  // Pick a base resolution for the UI to render at before scaling.
  const targetW = size.width < 768 ? mobileW : desktopW;
  const targetH = targetW * (height / width);

  const isCoarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.25);
    const tp = easeTheme(live.current, THEMES[getTheme()], dt);
    const cam = camera as THREE.PerspectiveCamera;
    const op = layerOpacity(cam.position.z, z);

    if (frameMat.current) frameMat.current.opacity = op;
    if (glowMat.current) {
      glowMat.current.color.setRGB(
        tp.accent[0] / 255,
        tp.accent[1] / 255,
        tp.accent[2] / 255,
        THREE.SRGBColorSpace,
      );
      glowMat.current.opacity = (focused ? 0.3 : 0.1) * op;
    }

    if (group.current) {
      group.current.visible = op > 0.01;
      // fade-through shrink so it never sits opaque full-screen on phone
      const d = cam.position.z - z;
      let throughScale = 1;
      if (d < 2.8) {
        const t = Math.max(0, Math.min(1, (d + 0.8) / 3.6));
        throughScale = 0.75 + 0.25 * t;
      }
      const targetScale = fit * throughScale;
      group.current.scale.lerp(
        _scale.current.set(targetScale, targetScale, targetScale),
        Math.min(1, dt * 8),
      );
      group.current.position.x = isCoarse ? 0 : (cam.position.x || 0) * 0.06;
    }

    if (outerRef.current && innerRef.current) {
      if (op < 0.01) {
        outerRef.current.style.display = "none";
        outerRef.current.style.opacity = "0";
        outerRef.current.style.pointerEvents = "none";
        return;
      }
      if (outerRef.current.style.display !== "block") {
        outerRef.current.style.display = "block";
      }

      const dist = Math.abs(cam.position.z - z);
      const safeDist = Math.max(dist, 0.1);

      const fovRad = THREE.MathUtils.degToRad(cam.fov / 2);
      const visible_height = 2 * safeDist * Math.tan(fovRad);

      const currentScale = group.current ? group.current.scale.x : fit;

      const pxH = (height / visible_height) * size.height * currentScale;
      const pxW = (width / visible_height) * size.height * currentScale;

      const shiftX = group.current
        ? (group.current.position.x /
            (visible_height * (size.width / size.height))) *
          size.width
        : 0;

      outerRef.current.style.width = `${pxW}px`;
      outerRef.current.style.height = `${pxH}px`;
      // fade effect when going further in: opacity already eased, but also
      // add a subtle blur + scale hint via CSS for the DOM content
      outerRef.current.style.opacity = op.toString();
      outerRef.current.style.filter =
        op < 0.9 ? `blur(${(1 - op) * 6}px)` : "none";
      // On touch, keep pointerEvents auto when focused so forms still work,
      // but allow scroll chaining — inner handles its own scroll and then
      // lets the page scroll.
      outerRef.current.style.pointerEvents = focused ? "auto" : "none";
      outerRef.current.style.transform = `translateX(${shiftX}px)`;
      outerRef.current.style.touchAction = "pan-y";
      (outerRef.current.style as any).overscrollBehavior = "auto";

      const scale = pxW / targetW;
      innerRef.current.style.transform = `scale(${scale})`;
      innerRef.current.style.touchAction = "pan-y";
      (innerRef.current.style as any).overscrollBehavior = "auto";
    }
  });

  return (
    <group ref={group} position={[0, 0, z]}>
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[width + 0.55, height + 0.55]} />
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
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[width + 0.16, height + 0.16, 0.09]} />
        <meshStandardMaterial
          ref={frameMat}
          color="#11182a"
          metalness={0.6}
          roughness={0.5}
          transparent
          opacity={1}
        />
      </mesh>

      <Html center zIndexRange={[100, 0]} style={{ direction: "ltr" }}>
        <div
          ref={outerRef}
          dir={dir}
          className={`relative overflow-hidden bg-[#04060d] text-white flex ${
            scrollable ? "items-start" : "items-center"
          } justify-center rounded-sm`}
          style={{
            opacity: 0,
            // fade mask when going further — top and bottom feather on mobile
            // so content doesn't abruptly cut when covering full screen.
            // Fixed About panes use a tighter feather so no line is clipped.
            WebkitMaskImage: scrollable
              ? "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)"
              : "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
            maskImage: scrollable
              ? "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)"
              : "linear-gradient(to bottom, transparent 0%, black 6%, black 94%, transparent 100%)",
          }}
        >
          <div
            ref={innerRef}
            dir={dir}
            className={
              scrollable
                ? "absolute top-0 left-0 origin-top-left overflow-y-auto overflow-x-hidden custom-scrollbar"
                : "absolute top-0 left-0 origin-top-left overflow-hidden"
            }
            style={{ width: targetW, height: targetH }}
          >
            {children}
          </div>
        </div>
      </Html>
    </group>
  );
}

/** Home walk's landscape, scrollable section window. */
function HtmlSection({
  index,
  focused,
  dir,
  children,
}: {
  index: number;
  focused: boolean;
  dir: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return (
    <Window3D index={index} focused={focused} dir={dir}>
      {children}
    </Window3D>
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

type CityMatKind = "neon" | "glass" | "atlas" | "plain";

interface CityMatRecord {
  mat: THREE.MeshStandardMaterial;
  /** untouched diffuse colour, before the storm darkening */
  baseColor: THREE.Color;
  /** original emissive colour (black for unlit materials) */
  baseEmissive: THREE.Color;
  kind: CityMatKind;
}

interface WindowMaps {
  map: THREE.Texture;
  emissiveMap: THREE.Texture;
  roughnessMap: THREE.Texture;
  metalnessMap: THREE.Texture;
}

// scratch colours for applyCityTheme (no per-frame allocation)
const _shadowC = new THREE.Color();
const _warmC = new THREE.Color();
const _warmDimC = new THREE.Color();
const _whiteC = new THREE.Color(1, 1, 1);
const _glassStormC = new THREE.Color("#4fd8ff");
const _atlasStormC = new THREE.Color("#1a4466");

const setSRGB = (c: THREE.Color, rgb: [number, number, number]) =>
  c.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);

/**
 * Retint every city material for an atmosphere theme. The storm night
 * darkens buildings 50% toward near-black with glowing cyan windows;
 * dawn/dusk restores the original façades, warms the glass and dims
 * the window emissive to daylight levels.
 */
function applyCityTheme(
  records: CityMatRecord[],
  concrete: THREE.MeshStandardMaterial,
  windowMats: THREE.MeshStandardMaterial[],
  p: ThemeParams,
) {
  setSRGB(_shadowC, p.buildingShadow);
  setSRGB(_warmC, p.warmGlow);
  _warmDimC.copy(_warmC).multiplyScalar(0.4);
  setSRGB(concrete.color, p.concrete as [number, number, number]);

  for (const wm of windowMats) {
    wm.emissive.copy(_whiteC).lerp(_warmC, p.warmth);
    wm.emissiveIntensity = 1.4 * p.windowEmissive;
  }

  for (const rec of records) {
    const m = rec.mat;
    m.color.copy(rec.baseColor).lerp(_shadowC, p.buildingDarkMix);
    if (rec.kind === "neon") {
      m.emissive.copy(rec.baseEmissive);
      m.emissiveIntensity = 3.5 * p.windowEmissive;
    } else if (rec.kind === "glass") {
      m.emissive.copy(_glassStormC).lerp(_warmC, p.warmth);
      m.emissiveIntensity = 2.0 * p.windowEmissive;
    } else if (rec.kind === "atlas") {
      m.emissive.copy(_atlasStormC).lerp(_warmDimC, p.warmth);
      m.emissiveIntensity = 3.0 * p.windowEmissive;
    }
  }
}

/** Per-frame driver — eases building/street colours between themes. */
function CityThemeRig({
  records,
  concreteMat,
  windowMats,
}: {
  records: CityMatRecord[];
  concreteMat: THREE.MeshStandardMaterial;
  windowMats: THREE.MeshStandardMaterial[];
}) {
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));
  useFrame((_, delta) => {
    const p = easeTheme(live.current, THEMES[getTheme()], Math.min(delta, 0.25));
    applyCityTheme(records, concreteMat, windowMats, p);
  });
  return null;
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

function makeCity(finaleZ: number): Building[] {
  const list: Building[] = [];
  let seed = 20260824;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const startZ = 8;
  // Side buildings stop before the plaza in front of the finale tower so
  // nothing pokes through the landmark.
  const endZ = finaleZ + 12;
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
  
  // ── Landmark placement ───────────────────────────────────────────
  // Milad Tower is the finale monument: the taller, bigger tower in
  // reality, it stands dead-centre of the road (x = 0) at the far end,
  // never inside the left / right building rows.
  // Azadi Tower is demoted to ONE slot among the deepest side buildings
  // so it still reads as a landmark on the boulevard without competing.
  const towerZ = finaleZ; // the very last / deepest building, centre road

  // Choose Azadi's slot from the DEEPEST side buildings (background),
  // keeping it clear of the centre where Milad stands.
  const sortedByZ = [...slots].sort((a, b) => a.z - b.z); // most negative = farthest
  const farCount = Math.max(1, Math.floor(sortedByZ.length * 0.25));
  const farSlots = sortedByZ.slice(0, farCount);
  const outerFar = farSlots.filter((s) => Math.abs(s.x) > 5.5);
  const azadiPool = outerFar.length > 0 ? outerFar : farSlots;
  const azadiSlot = azadiPool[Math.floor(rnd() * azadiPool.length)];

  slots.forEach((slot) => {
      let typeIndex;
      if (slot === azadiSlot) typeIndex = 0; // Azadi — deep side silhouette
      else {
          // The rest are randomly chosen from index 2, 3, and 4
          typeIndex = 2 + Math.floor(rnd() * 3);
      }
      list.push({ ...slot, typeIndex, tex: 0 });
  });

  // Milad — the final landmark, dead centre of the road at the end.
  list.push({
      x: 0,
      z: towerZ,
      typeIndex: 1,
      tex: 0,
      rotation: 0,
  });

  return list;
}

function MovingStreetLights() {
  const groupRef = useRef<THREE.Group>(null);
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));

  // The storm's multi-colour neon lamps; daylight themes switch them
  // off entirely (clear day) or warm them on at dusk.
  const baseColors = useMemo(
    () => ["#4fd8ff", "#9fe8ff", "#2a6cff", "#ffffff"].map((c) => new THREE.Color(c)),
    [],
  );
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera }, delta) => {
    if (groupRef.current) {
      // The lights follow the camera's Z position exactly,
      // meaning we only ever render 4 lights, but it looks like a continuous street!
      groupRef.current.position.z = camera.position.z;
    }
    const p = easeTheme(live.current, THEMES[getTheme()], Math.min(delta, 0.25));
    tmpColor.setRGB(p.street[0] / 255, p.street[1] / 255, p.street[2] / 255, THREE.SRGBColorSpace);
    for (let i = 0; i < lightRefs.current.length; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      light.intensity = p.streetI;
      light.color.copy(baseColors[i]).lerp(tmpColor, p.streetTint);
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 4 }).map((_, i) => {
        // Space them out relative to the camera
        const zOffset = -i * 8;
        const side = i % 2 === 0 ? 1 : -1;
        return (
          <pointLight
            key={i}
            ref={(el) => {
              lightRefs.current[i] = el;
            }}
            position={[side * 4, -1.2, zOffset]}
            intensity={15}
            color={baseColors[i]}
            distance={20}
          />
        );
      })}
    </group>
  );
}

function City() {
  const layout = useWalkLayout();
  const buildings = useMemo(() => makeCity(layout.finaleZ), [layout.finaleZ]);

  const windowTexs = useMemo(() => makeWindowTextures(), []);

  // Load custom GLTFs
  const gltfAzadi = useGLTF(import.meta.env.BASE_URL + "azadi_tower.glb") as any;
  const gltfMilad = useGLTF(import.meta.env.BASE_URL + "milad_tower.glb") as any;
  const gltfNY = useGLTF(import.meta.env.BASE_URL + "new_york_background_building_1.glb") as any;
  const gltfRealistic = useGLTF(import.meta.env.BASE_URL + "realistic_building.glb") as any;
  const gltfLowRise = useGLTF(import.meta.env.BASE_URL + "low_rise_wall_to_wall_office_building.glb") as any;
  

  const { concreteMat, windowMats, prototypes, cityMats } = useMemo(() => {
    // A single foundation material shared across all buildings
    const cMat = new THREE.MeshStandardMaterial({
      color: "#050608", // Very dark to blend with fog/abyss
      roughness: 0.8,
      metalness: 0.1,
      fog: true,
    });

    // One record per unique GLTF material — the CityThemeRig retints
    // these every frame (clones share material instances, so a single
    // record drives every placed copy of a prototype).
    const cityMats: CityMatRecord[] = [];
    const seen = new Set<string>();

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

      // Make materials accept fog and register them for theme retinting.
      // The storm night look (50% darkening, glowing windows) is applied
      // via applyCityTheme below — identical to the original appearance.
      clonedCustom.traverse((child: any) => {
        if (!child.isMesh || !child.material) return;
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of mats) {
          if (!mat || !mat.color) continue;
          mat.fog = true;
          if (typeof mat.roughness === "number") {
            mat.roughness = Math.min(mat.roughness || 1.0, 0.6);
          }

          if (!seen.has(mat.uuid)) {
            seen.add(mat.uuid);
            const matName: string = (mat.name || "").toLowerCase();
            let kind: CityMatKind = "plain";
            if (mat.emissiveMap || (mat.emissive && mat.emissive.getHex() > 0)) {
              kind = "neon";
            } else if (
              matName.includes("window") ||
              matName.includes("glass") ||
              matName.includes("light")
            ) {
              kind = "glass";
            } else if (mat.map) {
              // painted-on windows on atlas textures get the diffuse map
              // in the emissive slot (one-time assignment, theme-independent)
              mat.emissiveMap = mat.map;
              kind = "atlas";
            }
            cityMats.push({
              mat,
              baseColor: mat.color.clone(),
              baseEmissive: mat.emissive ? mat.emissive.clone() : new THREE.Color(0, 0, 0),
              kind,
            });
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

    // apply the night-storm look immediately (first frame continues it)
    applyCityTheme(cityMats, cMat, wMats, THEMES.storm);

    return { concreteMat: cMat, windowMats: wMats, prototypes: protos, cityMats };
  }, [windowTexs, gltfAzadi, gltfMilad, gltfNY, gltfRealistic, gltfLowRise]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      const camZ = camera.position.z;
      // Aggressive Distance Culling for 60 FPS — kept just past the fog
      // end (66) so nothing pops in/out while still visible.
      groupRef.current.children.forEach((child) => {
        const dist = camZ - child.position.z;
        child.visible = dist > -15 && dist < 68;
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
      // Milad (typeIndex 1) is the centre-road finale monument: grow it
      // to tower over the boulevard. Azadi (typeIndex 0) keeps only a
      // modest bump so it reads as a distant side landmark.
      if (b.typeIndex === 1) instance.scale.setScalar(MILAD_SCALE);
      else if (b.typeIndex === 0) instance.scale.setScalar(AZADI_SIDE_SCALE);

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
        position={[0, -2.0, -62]}
        scale={[1, 1, 1]}
      >
        <planeGeometry args={[110, 224]} />
        <Suspense fallback={<meshBasicMaterial color="#04060d" />}>
          <PuddleMaterial />
        </Suspense>
      </mesh>

      {/* 60 FPS Optimization: Use 4 moving lights instead of 25 static lights to prevent shader loop lag */}
      <MovingStreetLights />

      {/* retints façades, glass and foundations when the theme changes */}
      <CityThemeRig
        records={cityMats}
        concreteMat={concreteMat}
        windowMats={windowMats}
      />

      <primitive object={cityGroup} ref={groupRef} />
    </>
  );
}

/** Depth rain inside the corridor — fades out with daylight themes. */
function CorridorRain() {
  const ref = useRef<THREE.LineSegments>(null);
  const matRef = useRef<THREE.LineBasicMaterial>(null);
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));

  // Reduced count for less visual clutter
  const count = 600;

  const { geo, velocities, windOffsets } = useMemo(() => {
    const positions = new Float32Array(count * 6);
    const vels = new Float32Array(count);
    const wOffsets = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 35;
      const z = 8 - Math.random() * 130;
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
    const dt = Math.min(delta, 0.25);
    const p = easeTheme(live.current, THEMES[getTheme()], Math.min(delta, 0.25));
    if (matRef.current) {
      matRef.current.opacity = 0.15 * p.rain;
    }
    if (p.rain <= 0.02) return; // dry air — freeze the streaks
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
        ref={matRef}
        color="#a0c2e8"
        transparent
        opacity={0.15} // Subtle opacity so it doesn't wash out the scene
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

// NOTE: the city's GLBs are NOT preloaded at module scope anymore — that
// kicked off ~28MB of downloads in the middle of script evaluation and
// (worse) suspended the WHOLE canvas behind them. AssetPrimer now starts
// the same downloads (shared loader cache) right after first paint, and
// <City /> renders from cache the moment they resolve.
export function CorridorScene({
  progressRef,
  focusedIdx,
  lang,
  onOpen,
  layout = homeLayout,
}: {
  progressRef: React.RefObject<number>;
  focusedIdx: number;
  lang: string;
  onOpen: (item: TemplateItem) => void;
  layout?: WalkLayout;
}) {
  const isAbout = layout.id === "about";
  // one shared animated texture + hover tracker for every painting's ring
  const border = useJourneyElectricBorder(PAINTING_W, PAINTING_H, focusedIdx);
  return (
    <WalkLayoutContext.Provider value={layout}>
      <CameraRig progressRef={progressRef} />
      <CorridorRain />
      {/* City streams in from the fog as each GLB resolves — the emblem,
          rain and windows never wait behind the ~28MB city. */}
      <Suspense fallback={null}>
        <City />
      </Suspense>
      <GroundFog />

      {isAbout ? (
        <AboutSceneFrames lang={lang as Lang} focusedIdx={focusedIdx} />
      ) : (
        <>
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
          <HtmlSection index={N} focused={focusedIdx === N} dir={lang === "fa" ? "rtl" : "ltr"}>
            <TrustStats lang={lang as Lang} />
          </HtmlSection>
          <HtmlSection index={N + 1} focused={focusedIdx === N + 1} dir={lang === "fa" ? "rtl" : "ltr"}>
            <ProcessTimeline lang={lang as Lang} />
          </HtmlSection>
          <HtmlSection index={N + 2} focused={focusedIdx === N + 2} dir={lang === "fa" ? "rtl" : "ltr"}>
            <ContactSection lang={lang as Lang} />
          </HtmlSection>
        </>
      )}
    </WalkLayoutContext.Provider>
  );
}
