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
  paintingZ(N - 1) + 1.2, // exit — dissolves into the page (never clips through)
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

/** Window textures — every single window lit, brightness varies. */
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
        // 100% lit — brightness varies so the facade stays organic
        const bright = 0.3 + Math.random() * 0.7;
        const whiteBlue = Math.random() < 0.24;
        ctx.fillStyle = whiteBlue
          ? `rgba(${210 + bright * 45}, ${238 + bright * 17}, 255, ${0.65 + bright * 0.35})`
          : `rgba(${90 + bright * 80}, ${195 + bright * 50}, 255, ${0.5 + bright * 0.5})`;
        ctx.fillRect(x * cw + cw * 0.16, y * ch + ch * 0.22, cw * 0.62, ch * 0.45);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
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
  tier: boolean; // smaller crown block on top
  antenna: boolean; // mast + tip light
  tintR: number; // slight facade tint variance
  tintG: number;
  uRep: number; // window grid density variation
  vRep: number;
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
        const tall = h > 6.5;
        // window grid follows the building's real proportions — every
        // window is the same physical size, nothing stretched
        list.push({
          x: x + (rnd() - 0.5) * 1.6,
          z: z + (rnd() - 0.5) * step * 0.7,
          w,
          h,
          d,
          tex: Math.floor(rnd() * 3),
          tier: tall || rnd() < 0.3,
          antenna: tall && rnd() < 0.75,
          tintR: 0.86 + rnd() * 0.14,
          tintG: 0.92 + rnd() * 0.08,
          uRep: Math.max(1, Math.round(w / 1.5)),
          vRep: Math.max(1, Math.round(h / 2.6)),
        });
      }
    }
  }
  return list;
}

interface DimTarget {
  mat: THREE.MeshBasicMaterial;
  edgeMat: THREE.LineBasicMaterial; // per-building — outlines dim too
  tipMat?: THREE.MeshBasicMaterial;
  z: number;
  tintR: number;
  tintG: number;
}

function City() {
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const step = isMobile ? 7 : 5;
  // Lights wake as you ARRIVE: the row you're beside is fully lit and
  // everything beyond a very short fade is completely dark.
  const litRange = step * 0.8;
  const fadeSpan = 5;
  const buildings = useMemo(() => makeCity(isMobile), [isMobile]);
  const windowTexs = useMemo(() => makeWindowTextures(), []);
  const dimTargets = useRef<DimTarget[]>([]);
  const dimClock = useRef(0);

  // build meshes imperatively — each building gets its OWN material so
  // windows can be dimmed by distance (front rows bright, far fade).
  const cityGroup = useMemo(() => {
    const g = new THREE.Group();
    const targets: DimTarget[] = [];

    const scaleUV = (geo: THREE.BufferGeometry, u: number, v: number) => {
      const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
      if (!uv) return;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
      }
      uv.needsUpdate = true;
    };

    for (const b of buildings) {
      // per-building material (cloned map ref, own color for dim/tint)
      const mat = new THREE.MeshBasicMaterial({
        map: windowTexs[b.tex],
        color: "#ffffff",
        fog: false,
      });
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      scaleUV(geo, b.uRep, b.vRep); // varied window densities per facade
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, -2.9 + b.h / 2, b.z);
      g.add(mesh);

      const edgeMat = new THREE.LineBasicMaterial({
        color: "#2f7bff",
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      g.add(edges);

      // crown tier — a second, smaller block on taller buildings
      if (b.tier) {
        const tw = b.w * 0.68;
        const td = b.d * 0.68;
        const th = b.h * 0.32;
        const tGeo = new THREE.BoxGeometry(tw, th, td);
        scaleUV(tGeo, Math.max(1, b.uRep - 1), 1);
        const tMesh = new THREE.Mesh(tGeo, mat); // shares material → dims together
        tMesh.position.set(b.x, -2.9 + b.h + th / 2, b.z);
        g.add(tMesh);
      }

      // antenna mast + tip light
      let tipMat: THREE.MeshBasicMaterial | undefined;
      if (b.antenna) {
        const mastH = 0.9 + Math.random() * 0.8;
        const mast = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, mastH, 0.045),
          new THREE.MeshBasicMaterial({ color: "#16233c", fog: false })
        );
        const topY = -2.9 + b.h + (b.tier ? b.h * 0.32 : 0);
        mast.position.set(b.x, topY + mastH / 2, b.z);
        g.add(mast);
        tipMat = new THREE.MeshBasicMaterial({
          color: "#9fe8ff",
          fog: false,
          toneMapped: false,
        });
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), tipMat);
        tip.position.set(b.x, topY + mastH + 0.05, b.z);
        g.add(tip);
      }

      targets.push({ mat, edgeMat, tipMat, z: b.z, tintR: b.tintR, tintG: b.tintG });
    }
    dimTargets.current = targets;
    return g;
  }, [buildings, windowTexs]);

  useEffect(
    () => () => {
      cityGroup.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      windowTexs.forEach((t) => t.dispose());
    },
    [cityGroup, windowTexs]
  );

  // ── depth lighting: the front rows glow fully; far buildings sink
  //    back into the night (the "old fade"). Throttled — cheap.
  useFrame(({ camera }, delta) => {
    dimClock.current += delta;
    if (dimClock.current < 0.07) return;
    dimClock.current = 0;
    const camZ = camera.position.z;
    for (const t of dimTargets.current) {
      const dist = Math.abs(camZ - t.z);
      let f: number;
      if (dist <= litRange) f = 1;
      else {
        const k = Math.min(1, (dist - litRange) / fadeSpan);
        f = 1 - k; // fade to FULLY dark — the far city sleeps
      }
      t.mat.color.setRGB(f * t.tintR, f * t.tintG, f);
      t.edgeMat.opacity = 0.45 * f; // outlines vanish with the windows
      if (t.tipMat) t.tipMat.color.setRGB(0.62 * f, 0.91 * f, f);
    }
  });

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

/** Volumetric ground fog — hundreds of soft GPU particles in a low
 *  band, each its own size/alpha/rotation, drifting and wrapping around
 *  the camera entirely in the vertex shader. Depth parallax between the
 *  layers makes it read as true 3D mist, not a plane. One draw call. */
function GroundFog() {
  const { size, camera } = useThree();
  const pointsRef = useRef<THREE.Points>(null);

  const puffTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.4, "rgba(255,255,255,0.42)");
    g.addColorStop(0.75, "rgba(255,255,255,0.1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);

  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );

  const { geo, material } = useMemo(() => {
    const count = isMobile ? 220 : 360;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);
    let seed = 4242;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      // low band hugging the ground; denser toward the building lines
      const side = Math.random() < 0.5 ? -1 : 1;
      const nearBuildings = rnd() < 0.62;
      const x = nearBuildings
        ? side * (4.2 + rnd() * 7.5)
        : (rnd() - 0.5) * 9;
      pos[i * 3] = x;
      pos[i * 3 + 1] = -3.1 + rnd() * 1.7;
      pos[i * 3 + 2] = 8 - rnd() * 84;
      sizes[i] = 2.2 + rnd() * 5.2; // world diameter
      alphas[i] = 0.05 + rnd() * 0.1;
      seeds[i] = rnd();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCamZ: { value: 0 },
        uSpan: { value: 84 },
        uScale: { value: 600 },
        uMap: { value: puffTex },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uCamZ;
        uniform float uSpan;
        uniform float uScale;
        attribute float aSize;
        attribute float aAlpha;
        attribute float aSeed;
        varying float vAlpha;
        varying float vRot;
        void main() {
          vec3 p = position;
          // organic sideways + vertical drift, unique per particle
          p.x += sin(uTime * (0.04 + aSeed * 0.1) + aSeed * 6.2831) * 1.5;
          p.y += sin(uTime * 0.05 + aSeed * 4.1) * 0.35;
          // wrap along the path around the camera, rolling slowly forward
          float rel = mod(p.z - uCamZ + uTime * 0.45 + uSpan, uSpan);
          p.z = uCamZ + rel - (uSpan - 14.0);

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float dist = -mv.z;
          gl_PointSize = min(aSize * uScale / max(dist, 0.6), 240.0);
          // fade the puffs in your face and the ones far ahead
          vAlpha =
            aAlpha *
            smoothstep(1.2, 3.2, dist) *
            (1.0 - smoothstep(22.0, 38.0, dist));
          vRot = aSeed * 6.2831 + uTime * 0.03;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying float vAlpha;
        varying float vRot;
        void main() {
          // rotate each puff so they never read as the same flat image
          vec2 uv = gl_PointCoord - 0.5;
          float c = cos(vRot);
          float s = sin(vRot);
          uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y) + 0.5;
          vec4 tex = texture2D(uMap, clamp(uv, 0.0, 1.0));
          float a = tex.a * vAlpha;
          if (a < 0.004) discard;
          gl_FragColor = vec4(vec3(0.6, 0.71, 0.9), a);
        }
      `,
    });
    return { geo: g, material: m };
  }, [isMobile, puffTex]);

  // perspective-correct sizing + live uniforms
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    material.uniforms.uScale.value =
      size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  }, [size, camera, material]);

  useFrame(({ camera }) => {
    material.uniforms.uTime.value = performance.now() / 1000;
    material.uniforms.uCamZ.value = camera.position.z;
  });

  useEffect(
    () => () => {
      geo.dispose();
      material.dispose();
      puffTex.dispose();
    },
    [geo, material, puffTex]
  );

  return <points ref={pointsRef} geometry={geo} material={material} frustumCulled={false} />;
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
        />
      ))}
    </>
  );
}
