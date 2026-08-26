import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePGeometry } from "../../lib/pGeometry";
import { onLightning } from "../../lib/stormEvents";
import { ElectricPainter } from "../ui/ElectricBorder";

/**
 * PEmblem — the journey's opening layer, reimagined as a GHOST CARD.
 *
 * Port of the CodePen "Ghost Card" by pizza3
 * (https://codepen.io/pizza3/pen/pobevYW): a holographic trading card
 * whose green-screen window composites a render-to-texture of a ghost
 * model (here: the site's P) — fbm smoke shader, fresnel rim, foil
 * gradient and sparkles, re-themed to the electric cyan palette.
 *
 * Wrapped in the site's animated lightning border (the same
 * ElectricPainter that drives the DOM cards and corridor frames),
 * and still wired to the storm: ribbon bolts strike the card's edges
 * and make the border flare.
 */

const STATION_DIST = 4.6;
const RTT_SIZE = 512;
const ARC_POINTS = 18;
const BRANCH_POINTS = 8;

// ── card dimensions (world units) ──────────────────────────────────────
const CARD_W = 2.4;
const CARD_H = 3.6; // 2:3 portrait, like the original pen
const CARD_OVERSCAN = 0.09; // must match the painter's overscan
const CARD_SPAN_W = CARD_W * (1 + 2 * CARD_OVERSCAN);
const CARD_SPAN_H = CARD_H * (1 + 2 * CARD_OVERSCAN);

// ── card template (canvas px) — green window region for the ghost ─────
const TPL_W = 960;
const TPL_H = 1440;
const WINDOW = { x0: 134, y0: 236, x1: 826, y1: 952 };
/** window rect in template UV space (y flipped for GL) */
const WINDOW_UV = new THREE.Vector4(
  WINDOW.x0 / TPL_W,
  1 - WINDOW.y1 / TPL_H,
  (WINDOW.x1 - WINDOW.x0) / TPL_W,
  (WINDOW.y1 - WINDOW.y0) / TPL_H,
);

/** Responsive emblem scale — fits BOTH width and height on any screen. */
function emblemFit(cam: THREE.PerspectiveCamera): number {
  const visH =
    2 * STATION_DIST * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const visW = visH * cam.aspect;
  return Math.min(1, (visW * 0.85) / CARD_SPAN_W, (visH * 0.7) / CARD_SPAN_H);
}

/* ── procedural card art ─────────────────────────────────────────────── */

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCardBase(ctx: CanvasRenderingContext2D) {
  const W = TPL_W;
  const H = TPL_H;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b1424");
  bg.addColorStop(0.55, "#070c16");
  bg.addColorStop(1, "#0a1322");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // faint blueprint grid
  ctx.strokeStyle = "rgba(79,216,255,0.05)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= W; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // corner ticks
  ctx.strokeStyle = "rgba(159,232,255,0.85)";
  ctx.lineWidth = 6;
  const t = 64;
  const corners: [number, number][] = [
    [t, t],
    [W - t, t],
    [t, H - t],
    [W - t, H - t],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy);
    ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26);
    ctx.lineTo(cx, cy + 26);
    ctx.stroke();
  }
}

function drawCardFront(ctx: CanvasRenderingContext2D) {
  const W = TPL_W;
  drawCardBase(ctx);

  // header
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#eaffff";
  ctx.font = "800 84px 'Sora Variable', sans-serif";
  ctx.fillText("AmirEhsan", 72, 148);
  ctx.fillStyle = "rgba(79,216,255,0.8)";
  ctx.font = "600 30px 'Sora Variable', sans-serif";
  ctx.fillText("W E B   T E M P L A T E   E N G I N E", 74, 196);

  // holo badge top-right
  ctx.strokeStyle = "rgba(159,232,255,0.9)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(W - 96, 118, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#bff1ff";
  ctx.font = "800 56px 'Sora Variable', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("P", W - 96, 137);

  // divider
  ctx.strokeStyle = "rgba(79,216,255,0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(72, 232);
  ctx.lineTo(W - 72, 232);
  ctx.stroke();

  // green-screen window — the ghost composites exactly here
  ctx.fillStyle = "#00ff00";
  roundedRect(
    ctx,
    WINDOW.x0,
    WINDOW.y0,
    WINDOW.x1 - WINDOW.x0,
    WINDOW.y1 - WINDOW.y0,
    44,
  );
  ctx.fill();

  // spec block
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(234,255,255,0.92)";
  ctx.font = "800 44px 'Sora Variable', sans-serif";
  ctx.fillText("GHOST CLASS", 72, 1072);

  const specs = [
    ["LIGHTNING BORDER", "ACTIVE"],
    ["HOLOGRAPHIC FOIL", "SCANNED"],
    ["RENDER LOOP", "60 FPS"],
  ];
  ctx.font = "600 28px 'Sora Variable', sans-serif";
  let sy = 1132;
  for (const [label, val] of specs) {
    ctx.fillStyle = "rgba(148,180,210,0.75)";
    ctx.fillText(label, 72, sy);
    ctx.textAlign = "right";
    ctx.fillStyle = "#4fd8ff";
    ctx.fillText(val, W - 72, sy);
    ctx.textAlign = "left";
    sy += 52;
  }

  // barcode
  ctx.fillStyle = "rgba(234,255,255,0.85)";
  let bx = 72;
  const bw = W - 144;
  while (bx < 72 + bw) {
    const barW = 3 + Math.random() * 9;
    ctx.fillRect(bx, 1244, barW, 44);
    bx += barW + 4 + Math.random() * 10;
  }
  ctx.font = "600 24px 'Sora Variable', sans-serif";
  ctx.fillText("AMIREHSAN — CARD Nº 001", 72, 1336);
  ctx.textAlign = "right";
  ctx.fillText("THE P", W - 72, 1336);
}

function drawCardBack(ctx: CanvasRenderingContext2D) {
  const W = TPL_W;
  const H = TPL_H;
  drawCardBase(ctx);

  // diagonal pattern
  ctx.strokeStyle = "rgba(79,216,255,0.06)";
  ctx.lineWidth = 2;
  for (let x = -H; x < W + H; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }

  // No green window on the back!

  // the P monogram
  ctx.textAlign = "center";
  ctx.fillStyle = "#dff4ff";
  ctx.shadowColor = "rgba(79,216,255,0.8)";
  ctx.shadowBlur = 46;
  ctx.font = "800 420px 'Sora Variable', sans-serif";
  
  ctx.shadowBlur = 0;

  ctx.font = "600 26px 'Sora Variable', sans-serif";
  ctx.fillStyle = "rgba(148,180,210,0.8)";
  ctx.fillText("AMIREHSAN — GHOST CARD", W / 2, 1388);
}

function makeRampTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 1;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#0a1430");
  g.addColorStop(0.22, "#0e3f6e");
  g.addColorStop(0.45, "#4fd8ff");
  g.addColorStop(0.6, "#c9f4ff");
  g.addColorStop(0.72, "#4fd8ff");
  g.addColorStop(0.9, "#123a5e");
  g.addColorStop(1, "#0a1430");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

/** iridescent swirl pattern — drives the foil tone lookup across the card */
function makeHoloTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const dx = (x - 128) / 128;
      const dy = (y - 128) / 128;
      const r = Math.sqrt(dx * dx + dy * dy);
      const a = Math.atan2(dy, dx);
      const v =
        0.5 + 0.5 * Math.sin(a * 6 + r * 11) * (0.55 + 0.45 * Math.sin(r * 14));
      const i = (y * 256 + x) * 4;
      img.data[i] =
        img.data[i + 1] =
        img.data[i + 2] =
          Math.max(0, Math.min(255, v * 255));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** grayscale value noise — grain + sparkle driver */
function makeNoiseTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const v = Math.random() * 255;
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** rgb noise — star sparkles (pow-10 of r·b leaves sparse stars) */
function makeSparkleTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const i = (y * 256 + x) * 4;
      img.data[i] = Math.random() * 255;
      img.data[i + 1] = Math.random() * 255;
      img.data[i + 2] = Math.random() * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** soft cross-section gradient — the bolt ribbons */
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

/* ── shaders ──────────────────────────────────────────────────────────── */

const CARD_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEye;
varying vec3 vWorld;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vEye = normalize(cameraPosition - vWorld);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Shared by both card faces — green window composites the ghost RTT,
 *  everywhere else is holographic foil + sparkles + fresnel rim. */
const CARD_FRAG = /* glsl */ `
uniform sampler2D uTemplate;
uniform sampler2D uGhost;
uniform sampler2D uNoise;
uniform sampler2D uSparkle;
uniform sampler2D uRamp;
uniform sampler2D uHolo;
uniform vec4 uWindow;
uniform float uTime;
uniform float uFade;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEye;
varying vec3 vWorld;

float fresnel(vec3 n, vec3 e) {
  return pow(1.0 - max(dot(n, e), 0.0), 2.4);
}

vec3 sampleGhost(vec2 uv) {
  return texture2D(uGhost, clamp(uv, vec2(0.001), vec2(0.999))).rgb;
}

vec3 blurGhost(vec2 uv, float r) {
  vec2 texel = vec2(1.0) / ${RTT_SIZE.toFixed(1)};
  vec3 acc = sampleGhost(uv) * 0.227;
  acc += (sampleGhost(uv + vec2(r, 0.0) * texel) + sampleGhost(uv - vec2(r, 0.0) * texel)) * 0.194;
  acc += (sampleGhost(uv + vec2(0.0, r) * texel) + sampleGhost(uv - vec2(0.0, r) * texel)) * 0.194;
  return acc;
}

void main() {
  vec4 base = texture2D(uTemplate, vUv);
  float f = fresnel(vNormal, vEye);
  vec2 wuv = (vUv - uWindow.xy) / uWindow.zw;
  bool inWinOrig = base.g >= 0.5 && base.r < 0.6 &&
    wuv.x >= 0.0 && wuv.x <= 1.0 && wuv.y >= 0.0 && wuv.y <= 1.0;
  
  bool inWin = inWinOrig;

  if (inWin) {
    // In three.js double-sided materials, vNormal flips to face the camera.
    // We want the dissolve to happen as the card turns away, so we use gl_FrontFacing.
    float viewAngle = gl_FrontFacing ? max(dot(vNormal, vEye), 0.0) : 0.0;
    
    float noiseVal = texture2D(uNoise, vUv * 6.0).r;
    float threshold = smoothstep(0.85, 0.15, viewAngle); 
    
    if (!gl_FrontFacing || noiseVal < threshold) {
      inWin = false;
    }
  }

  if (inWin) {
    // the ghost hologram + fake bloom (two-radius blur of the RTT)
    vec3 g = sampleGhost(wuv);
    vec3 bloom = blurGhost(wuv, 1.8) + blurGhost(wuv, 5.0) * 0.6;
    vec3 col = g + bloom * 0.9;
    col += f * vec3(0.3, 0.7, 0.95) * 0.55;
    float scan = sin(vUv.y * 620.0) * 0.5 + 0.5;
    col *= 0.9 + scan * 0.1;
    gl_FragColor = vec4(col, 1.0);
  } else {
    // holographic foil — tone from tilt + iridescent pattern + sweep
    float tone = f * 0.8 + texture2D(uHolo, vUv).r * 0.55;
    tone += sin(vUv.y * 6.0 - uTime * 0.5) * 0.05;
    vec3 foil = texture2D(uRamp, vec2(clamp(tone, 0.0, 1.0), 0.5)).rgb;

    vec2 suv = fract(vUv * 5.0 + vec2(uTime * 0.007, uTime * 0.003));
    float star = texture2D(uSparkle, suv).r * texture2D(uSparkle, fract(suv * 0.6 + 0.37)).b;
    star = pow(star, 12.0) * 6.0;

    vec3 baseColor = inWinOrig ? vec3(0.04, 0.07, 0.12) : base.rgb;
    vec3 col = baseColor * foil * 1.6;
    col += star * foil * 1.4;
    col += f * foil * 0.6;
    col += texture2D(uNoise, fract(vUv * 2.0)).r * 0.025;
    gl_FragColor = vec4(col, base.a);
  }
  gl_FragColor.a *= uFade;
}
`;

const GHOST_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vEye;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz;
  vEye = normalize(cameraPosition - vWorld);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** Ghost P — fbm smoke drifting through the silhouette, cyan two-tone,
 *  fresnel rim. Ported from the pen's skull shader. */
const GHOST_FRAG = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;

varying vec3 vNormal;
varying vec3 vWorld;
varying vec3 vEye;

float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );
  return res * res;
}

float fbm(vec2 x) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; ++i) {
    v += a * noise(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 bg = vec3(0.012, 0.022, 0.045);
  vec2 screenUv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = screenUv * 9.0;
  float smoke = fbm(p + vec2(uTime * 0.22, -uTime * 0.14));

  vec3 n = normalize(vNormal);
  vec3 eye = normalize(vEye);
  float fres = pow(1.0 - max(dot(n, eye), 0.0), 2.4);

  float tone = smoke * 0.8 + fres * 1.0;
  vec3 deep = vec3(0.02, 0.32, 0.5);
  vec3 bright = vec3(0.55, 0.88, 1.0);
  vec3 col = mix(deep, bright, clamp(tone, 0.0, 1.1));
  float alpha = smoothstep(0.3, 0.55, tone);
  col = mix(bg, col, alpha);
  col += bright * pow(fres, 1.3) * 0.55;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ── strike ribbons (unchanged machinery, retargeted to the card) ────── */

/** Pre-allocated camera-facing ribbon strip (n points → 2n vertices). */

/** Write a jagged polyline into a ribbon geometry, facing the camera. */
function updateRibbon(
  geo: THREE.BufferGeometry,
  pts: THREE.Vector3[],
  width: number,
  camPos: THREE.Vector3,
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

/* ── the emblem ───────────────────────────────────────────────────────── */

export default function PEmblem() {
  const { camera, gl } = useThree();

  const group = useRef<THREE.Group>(null);
  const cardGroup = useRef<THREE.Group>(null);
  const frontMat = useRef<THREE.ShaderMaterial>(null);
  const backMat = useRef<THREE.ShaderMaterial>(null);
  const borderMat = useRef<THREE.MeshBasicMaterial>(null);
  const auraMat = useRef<THREE.MeshBasicMaterial>(null);

  const arcs = useRef<ArcSlot[]>([]);
  const charge = useRef(0.25);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cardRot = useRef({ x: 0, y: 0 }); // Current literal rotation of the card

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = "grab";
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = "";
  };

  const handlePointerDown = (e: any) => {
    document.body.style.cursor = "grabbing";

    e.stopPropagation();
    // Only capture on the card
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    // Convert drag pixels to rotation radians (arbitrary sensitivity)
    cardRot.current.y += dx * 0.01;
    cardRot.current.x += dy * 0.01;

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    document.body.style.cursor = "grab";
    isDragging.current = false;
    (e.target as Element)?.releasePointerCapture?.(e.pointerId);
  };

  const ringFlash = useRef(0);
  const nextStrike = useRef(1.4);
  const clock = useRef(0);
  const formation = useRef(0);

  const pointer = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0 });

  /* ── ghost P render-to-texture ── */
  const ghost = useMemo(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#040810");
    const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    cam.position.set(0, 0, 3.8);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();

    const mat = new THREE.ShaderMaterial({
      vertexShader: GHOST_VERT,
      fragmentShader: GHOST_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(RTT_SIZE, RTT_SIZE) },
      },
    });
    const pMesh = new THREE.Mesh(makePGeometry(1.95 / 96), mat);

    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#dff7ff", toneMapped: false }),
    );
    orb.position.set(-0.5, 0.62, 0.36);

    scene.add(pMesh, orb);

    const rt = new THREE.WebGLRenderTarget(RTT_SIZE, RTT_SIZE, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });

    return { scene, cam, pMesh, orb, rt, mat };
  }, []);

  /* ── card art + uniforms ── */
  const assets = useMemo(() => {
    const frontCanvas = document.createElement("canvas");
    frontCanvas.width = TPL_W;
    frontCanvas.height = TPL_H;
    const frontCtx = frontCanvas.getContext("2d")!;
    const backCanvas = document.createElement("canvas");
    backCanvas.width = TPL_W;
    backCanvas.height = TPL_H;
    const backCtx = backCanvas.getContext("2d")!;

    const draw = () => {
      drawCardFront(frontCtx);
      drawCardBack(backCtx);
    };
    draw();

    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;
    frontTex.anisotropy = 8;
    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;
    backTex.anisotropy = 8;

    const rampTex = makeRampTexture();
    const holoTex = makeHoloTexture();
    const noiseTex = makeNoiseTexture();
    const sparkleTex = makeSparkleTexture();

    return {
      draw,
      frontCanvas,
      backCanvas,
      frontTex,
      backTex,
      rampTex,
      holoTex,
      noiseTex,
      sparkleTex,
    };
  }, []);

  const frontUniforms = useMemo(
    () => ({
      uTemplate: { value: assets.frontTex },
      uGhost: { value: ghost.rt.texture },
      uNoise: { value: assets.noiseTex },
      uSparkle: { value: assets.sparkleTex },
      uRamp: { value: assets.rampTex },
      uHolo: { value: assets.holoTex },
      uWindow: { value: WINDOW_UV },
      uTime: { value: 0 },
      uFade: { value: 0 },
    }),
    [assets, ghost],
  );
  const backUniforms = useMemo(
    () => ({
      uTemplate: { value: assets.backTex },
      uGhost: { value: ghost.rt.texture },
      uNoise: { value: assets.noiseTex },
      uSparkle: { value: assets.sparkleTex },
      uRamp: { value: assets.rampTex },
      uHolo: { value: assets.holoTex },
      uWindow: { value: WINDOW_UV },
      uTime: { value: 0 },
      uFade: { value: 0 },
    }),
    [assets, ghost],
  );

  /* ── the lightning border — same painter as the DOM cards ── */
  const border = useMemo(() => {
    const painter = new ElectricPainter({
      width: 480,
      height: 720,
      color: "#4fd8ff",
      speed: 1.15,
      lineWidth: 2.2,
      radius: 28,
      overscan: CARD_OVERSCAN,
      displacement: 0.09,
      octaves: 10,
      lacunarity: 1.6,
      gain: 0.7,
      amplitude: 0.075,
      frequency: 10,
      baseFlatness: 0,
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(painter.canvasWidth);
    canvas.height = Math.round(painter.canvasHeight);
    const ctx = canvas.getContext("2d")!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return { painter, ctx, texture };
  }, []);

  const boltTex = useMemo(() => makeBoltTexture(), []);
  const spriteTex = useMemo(() => makeRadialSprite(), []);

  /* ── lifecycle ── */
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

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      assets.draw();
      assets.frontTex.needsUpdate = true;
      assets.backTex.needsUpdate = true;
    });
    return () => {
      alive = false;
      assets.frontTex.dispose();
      assets.backTex.dispose();
      assets.rampTex.dispose();
      assets.holoTex.dispose();
      assets.noiseTex.dispose();
      assets.sparkleTex.dispose();
      border.texture.dispose();
      boltTex.dispose();
      spriteTex.dispose();
      ghost.rt.dispose();
      ghost.pMesh.geometry.dispose();
      ghost.mat.dispose();
      (ghost.orb.material as THREE.Material).dispose();
      ghost.orb.geometry.dispose();
    };
  }, [assets, border, boltTex, spriteTex, ghost]);

  /* ── strike: random contact points on the card's edges ── */
  const cardEdgePoint = () => {
    const side = Math.floor(Math.random() * 4);
    const t = (Math.random() * 2 - 1) * 0.92;
    const hw = CARD_W / 2;
    const hh = CARD_H / 2;
    if (side === 0) return new THREE.Vector3(t * hw, hh, 0.07);
    if (side === 1) return new THREE.Vector3(hw, t * hh, 0.07);
    if (side === 2) return new THREE.Vector3(t * hw, -hh, 0.07);
    return new THREE.Vector3(-hw, t * hh, 0.07);
  };

  const strike = (fromStorm: boolean) => {
    const pool = arcs.current;
    if (pool.length === 0) return;
    let slot = pool[0];
    for (const a of pool) if (a.life < slot.life) slot = a;

    const hit = cardEdgePoint();
    const start = new THREE.Vector3(
      hit.x * (1.15 + Math.random() * 0.5) + (Math.random() - 0.5) * 2.6,
      2.3 + Math.random() * 3.2,
      -0.5 + Math.random() * 0.7,
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
    const bHit = cardEdgePoint();
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

    // ── the ghost RTT renders first, before the main scene ──
    ghost.mat.uniforms.uTime.value = clock.current;

    // Parallax depth: move the internal ghost camera oppositely to the card's rotation
    // Instead of orbiting the camera 360 degrees, just shift it slightly on X/Y for parallax depth
    const px = Math.sin(cardRot.current.y) * 1.5;
    const py = Math.sin(cardRot.current.x) * 1.5;
    ghost.cam.position.set(px, py, 3.8);
    ghost.cam.lookAt(0, 0, 0);
    ghost.pMesh.rotation.y =
      eased.current.x * 0.35 + Math.sin(clock.current * 0.35) * 0.5;
    ghost.pMesh.rotation.x =
      -eased.current.y * 0.2 + Math.cos(clock.current * 0.28) * 0.1;
    ghost.pMesh.position.y = Math.sin(clock.current * 0.7) * 0.06;
    ghost.orb.position.set(
      Math.cos(clock.current * 1.3) * 0.52 - 0.18,
      Math.sin(clock.current * 1.7) * 0.22 + 0.62,
      0.34,
    );
    ghost.orb.scale.setScalar(1 + 0.18 * Math.sin(clock.current * 2.6));

    const prevTarget = gl.getRenderTarget();
    gl.setRenderTarget(ghost.rt);
    gl.render(ghost.scene, ghost.cam);
    gl.setRenderTarget(prevTarget);

    // ── dive fades ──
    const camZ = cam.position.z;
    const cardFade = Math.max(0, Math.min(1, (camZ + 1.6) / 2.8));

    // ── responsive fit (phones / narrow windows) ──
    if (group.current) {
      const fit = emblemFit(cam);
      const cur = group.current.scale.x || fit;
      const next = cur + (fit - cur) * Math.min(1, dt * 6);
      group.current.scale.setScalar(next);
    }

    // ── formation: card spins in shortly after mount ──
    if (clock.current > 0.8 && formation.current < 1) {
      formation.current = Math.min(1, formation.current + dt / 1.5);
    }
    const f = formation.current;
    const fEase = 1 - Math.pow(1 - f, 3);

    // ── float + cursor tilt ──

    if (isDragging.current) {
      // Don't apply the global pointer easing if we're dragging the card
    } else {
      eased.current.x +=
        (pointer.current.x - eased.current.x) * Math.min(1, dt * 4);
      eased.current.y +=
        (pointer.current.y - eased.current.y) * Math.min(1, dt * 4);
    }

    if (cardGroup.current) {
      // If not dragging, smoothly return to front face + float
      if (!isDragging.current) {
        // Find nearest full rotation (0, 2pi, 4pi...) to snap back to the front
        const targetY =
          Math.round(cardRot.current.y / (Math.PI * 2)) * Math.PI * 2;
        const targetX =
          Math.round(cardRot.current.x / (Math.PI * 2)) * Math.PI * 2;

        cardRot.current.y +=
          (targetY +
            eased.current.x * 0.16 +
            (1 - fEase) * 0.55 -
            cardRot.current.y) *
          Math.min(1, dt * 5);
        cardRot.current.x +=
          (targetX - eased.current.y * 0.1 - cardRot.current.x) *
          Math.min(1, dt * 5);
      }

      cardGroup.current.rotation.y = cardRot.current.y;
      cardGroup.current.rotation.x = cardRot.current.x;
      cardGroup.current.position.y = Math.sin(clock.current * 0.8) * 0.05;
      cardGroup.current.scale.setScalar(0.72 + 0.28 * fEase);
    }

    // ── charge dynamics ──
    charge.current = Math.max(0.25, charge.current - dt * 0.02);
    ringFlash.current = Math.max(0, ringFlash.current - dt * 2.6);
    const c = charge.current;
    const flash = ringFlash.current;

    // ── card faces: time + fade ──
    const fade = fEase * cardFade;
    if (frontMat.current) {
      frontMat.current.uniforms.uTime.value = clock.current;
      frontMat.current.uniforms.uFade.value = fade;
    }
    if (backMat.current) {
      backMat.current.uniforms.uTime.value = clock.current;
      backMat.current.uniforms.uFade.value = fade;
    }

    // ── aura behind the card ──
    if (auraMat.current) {
      auraMat.current.opacity =
        (0.14 + c * 0.22 + flash * 0.4) * fEase * cardFade;
    }

    // ── the lightning border — flares on strikes ──
    border.painter.setActive(flash > 0.2 || c > 0.65);
    border.painter.advance(dt * 1000);
    border.painter.render(border.ctx);
    border.texture.needsUpdate = true;
    if (borderMat.current) {
      borderMat.current.opacity = (0.85 + flash * 0.15) * fEase * cardFade;
    }

    // ── bolts decay — two-stage: crack, then afterglow ──
    for (const a of arcs.current) {
      if (a.life > 0) {
        a.life = Math.max(0, a.life - dt * 2.1);
        const l = a.life;
        const flicker = 0.82 + Math.random() * 0.18;
        const coreA = Math.pow(l, 1.35) * flicker * cardFade;
        const glowA = Math.pow(l, 1.8) * 0.85 * cardFade;
        a.core.mat.opacity = coreA;
        a.glow.mat.opacity = glowA;
        a.branch.mat.opacity = coreA * 0.8;
        a.branchGlow.mat.opacity = glowA * 0.8;
        const grown = 0.32 + (1 - l) * 1.05;
        a.impact.scale.setScalar(grown);
        a.impact2.scale.setScalar(grown * 0.7);
        (a.impact.material as THREE.SpriteMaterial).opacity = l * l * cardFade;
        (a.impact2.material as THREE.SpriteMaterial).opacity =
          l * l * 0.8 * cardFade;
      }
    }

    // ── own strike cadence — quickens as the card charges ──
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
      <group ref={cardGroup}>
        {/* soft aura behind the card */}
        <mesh position={[0, 0, -0.3]} renderOrder={0}>
          <planeGeometry args={[CARD_W * 1.6, CARD_H * 1.6]} />
          <meshBasicMaterial
            ref={auraMat}
            map={spriteTex}
            color="#4fd8ff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            fog={false}
            toneMapped={false}
          />
        </mesh>

        {/* card back — holographic foil + the ghost window */}
        <mesh
          position={[0, 0, -0.02]}
          rotation={[0, Math.PI, 0]}
          renderOrder={1}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <planeGeometry args={[CARD_W, CARD_H]} />
          <shaderMaterial
            ref={backMat}
            uniforms={backUniforms}
            vertexShader={CARD_VERT}
            fragmentShader={CARD_FRAG}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* card front */}
        <mesh
          position={[0, 0, 0.03]}
          renderOrder={2}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <planeGeometry args={[CARD_W, CARD_H]} />
          <shaderMaterial
            ref={frontMat}
            uniforms={frontUniforms}
            vertexShader={CARD_VERT}
            fragmentShader={CARD_FRAG}
            transparent
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* The lightning border was removed as per request */}
        {false && (
          <mesh position={[0, 0, 0.05]} renderOrder={3}>
            <planeGeometry args={[CARD_SPAN_W, CARD_SPAN_H]} />
            <meshBasicMaterial
              ref={borderMat}
              map={border.texture}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              fog={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* ribbon bolts — built once, driven imperatively */}
      {/* Arcs removed */}
    </group>
  );
}

/** Arc pool: 5 slots — each a main bolt + branch (core+glow ribbons)
 *  with dual impact flashes. */
