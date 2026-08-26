/**
 * Portals — each template's entrance.
 *
 * There are no buttons in this city. To visit a template you walk up
 * to its building and go in. As the camera approaches a plot, six
 * things happen together, all driven by one `approach` value so they
 * read as a single event rather than six effects:
 *
 *   1  the doorway GLOWS — light spills out onto the wet pavement
 *   2  reflections STRENGTHEN — the portal's own light hits the road
 *   3  the LOGO fades in, engraved into the lintel
 *   4  PARTICLES gather, drawn inward toward the threshold
 *   5  a soft SOUND appears (dispatched to the audio layer)
 *   6  the DOOR opens slightly, revealing light from inside
 *
 * Clicking anywhere on the portal opens the live template. The hit
 * target is a real mesh in the world, so the cursor changes over the
 * doorway exactly as it would over a door.
 *
 * Everything is driven from `journey.s`, so the portal reacts to the
 * dolly, not to React state — no re-renders while walking.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { HERO_PLOTS, type HeroPlot } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { TEMPLATES, type TemplateItem } from "../../../config/templatesConfig";
import { TEMPLATE_IMAGE_MAP } from "../../../config/templateImages";
import { plotTransform } from "./HeroPlots";
import { visitedStore } from "../lib/visited";
import type { Quality } from "../lib/quality";

const DOOR_W = 6.4;
const DOOR_H = 5.4;

// ── the threshold glow ─────────────────────────────────────────────────────

const GLOW_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GLOW_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uApproach;
  uniform float uHover;
  uniform vec3  uColor;
  uniform vec3  uColor2;
  uniform float uBolt;
  varying vec2 vUv;
  varying vec3 vWorld;

  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
  float n2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec2 c = vUv - 0.5;

    // ── the doorway's light ──
    // Brightest at the threshold, falling off upward and outward, like
    // light spilling from a lit interior.
    float vertical = 1.0 - smoothstep(-0.1, 0.55, c.y);
    float lateral = 1.0 - smoothstep(0.1, 0.5, abs(c.x));
    float spill = vertical * lateral;

    // ── slow energy that lives in the doorway ──
    // Two counter-rotating noise fields so it churns without a period.
    vec2 np = c * 3.0;
    float energy = n2(np * 2.0 + vec2(uTime * 0.09, -uTime * 0.06)) * 0.6
                 + n2(np * 4.5 - vec2(uTime * 0.05, uTime * 0.11)) * 0.4;

    // ── hover: electric crackle around the frame ──
    // Thin filaments chase the door's perimeter, flickering on their own
    // erratic timing. Only present while the pointer is over the portal.
    float spark = 0.0;
    if (uHover > 0.001) {
      // distance to the frame outline
      vec2 fr = abs(c) - vec2(0.34, 0.42);
      float rim = abs(max(fr.x, fr.y)) ;
      float filament = 1.0 - smoothstep(0.0, 0.035, rim);
      // travelling crackle, three chasers at incommensurate speeds
      float ang = atan(c.y, c.x);
      float chase =
          step(0.82, fract(ang * 1.6 + uTime * 1.7))
        + step(0.88, fract(ang * 2.7 - uTime * 2.3))
        + step(0.93, fract(ang * 4.1 + uTime * 3.1));
      // arcs stutter rather than glide
      float stutter = step(0.35, fract(uTime * 21.0 + floor(ang * 6.0)));
      spark = filament * clamp(chase, 0.0, 1.0) * stutter * uHover;
    }

    // ── a slow vertical sweep, like a scanner passing over the door ──
    float sweep = smoothstep(0.14, 0.0, abs(fract(uTime * 0.11) - (vUv.y * 0.9 + 0.05)));

    float a = spill * (0.35 + energy * 0.75) * uApproach;
    a += sweep * 0.22 * uApproach * uApproach;
    a += spark * 0.85;
    a *= 0.9;
    if (a < 0.004) discard;

    // gradient from the district accent up into its secondary colour
    vec3 col = mix(uColor, uColor2, clamp(vUv.y + energy * 0.3, 0.0, 1.0));
    col *= 1.0 + energy * 0.6;
    // sparks run hotter than the glow they sit on
    col = mix(col, vec3(1.0), spark * 0.7);
    col += vec3(0.4, 0.5, 0.65) * uBolt * 0.5;

    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── gathering particles ────────────────────────────────────────────────────

const MOTE_VERT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uApproach;
  attribute vec3  aOrigin;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    // Motes orbit the threshold and are drawn INWARD as you approach:
    // at rest they hang in a loose cloud, at full approach they spiral
    // toward the doorway.
    float t = uTime * (0.25 + aSeed * 0.4) + aSeed * 6.283;
    vec3 p = aOrigin;

    // convergence toward the door centre
    float pull = uApproach * uApproach;
    p *= mix(1.0, 0.22, pull);
    p.y += mix(0.0, 1.1, pull) * (0.4 + aSeed * 0.6);

    // orbit
    float ang = t + pull * 4.0;
    float radius = length(p.xz) + 0.001;
    p.x = cos(ang) * radius * 0.6 + p.x * 0.4;
    p.z = sin(ang) * radius * 0.3 + p.z * 0.5;
    p.y += sin(t * 1.3 + aSeed * 3.0) * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    gl_PointSize = (10.0 + aSeed * 22.0) * (0.4 + pull * 1.3) / max(dist * 0.12, 0.4);
    gl_Position = projectionMatrix * mv;

    vAlpha = uApproach * (0.25 + 0.75 * pull) * (0.4 + 0.6 * sin(t * 2.1 + aSeed * 9.0) * 0.5 + 0.3);
    vSeed = aSeed;
  }
`;

const MOTE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float a = pow(1.0 - r, 2.4) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor * (1.2 + vSeed * 0.5), a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── logo plate ─────────────────────────────────────────────────────────────

/** Render the template's name as an engraved plate texture. */
function makeLogoTexture(item: TemplateItem, accent: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  // the lintel plate is read at a glance from across a street
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);

  const name = item.name.en.toUpperCase();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // engraved look: a dark inset shadow above, a light edge below
  ctx.font = "800 54px 'Sora Variable', sans-serif";
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillText(name, c.width / 2, c.height / 2 - 2);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fillText(name, c.width / 2, c.height / 2 + 2);

  // the lit face of the letters
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(name, c.width / 2, c.height / 2);
  ctx.shadowBlur = 0;

  // a hairline rule beneath, the width of the word
  const w = ctx.measureText(name).width;
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.8;
  ctx.fillRect((c.width - w) / 2, c.height / 2 + 31, w, 2);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Screenshot plate shown inside the open door — a glimpse of the world. */
function makePreviewTexture(item: TemplateItem): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  // glimpsed through a part-open door, never full-screen
  c.width = 256;
  c.height = 320;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, "#101826");
  g.addColorStop(1, "#050810");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const iw = img.naturalWidth || 4;
    const ih = img.naturalHeight || 3;
    const scale = Math.max(c.width / iw, c.height / ih);
    ctx.drawImage(img, (c.width - iw * scale) / 2, (c.height - ih * scale) / 2, iw * scale, ih * scale);
    // the doorway is deep: darken toward the edges
    const v = ctx.createRadialGradient(c.width / 2, c.height / 2, c.width * 0.2, c.width / 2, c.height / 2, c.width * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, c.width, c.height);
    tex.needsUpdate = true;
  };
  img.src =
    TEMPLATE_IMAGE_MAP[item.imageKey] ??
    `${import.meta.env.BASE_URL}images/${item.imageKey}.webp`;

  return tex;
}

// ── one portal ─────────────────────────────────────────────────────────────

function Portal({
  plot,
  item,
  quality,
  onOpen,
}: {
  plot: HeroPlot;
  item: TemplateItem;
  quality: Quality;
  onOpen: (item: TemplateItem) => void;
}) {
  const t = useMemo(() => plotTransform(plot), [plot]);
  const d = plot.district;

  const approach = useRef(0);
  const hovered = useRef(false);
  const hoverAmt = useRef(0);
  const announced = useRef(false);

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uApproach: { value: 0 },
          uHover: { value: 0 },
          uBolt: { value: 0 },
          uColor: { value: new THREE.Color(d.accent) },
          uColor2: { value: new THREE.Color(d.accent2) },
        },
      }),
    [d]
  );

  const logoTex = useMemo(() => makeLogoTexture(item, d.accent), [item, d.accent]);
  const logoMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: logoTex,
        transparent: true,
        opacity: 0,
        toneMapped: false,
        depthWrite: false,
      }),
    [logoTex]
  );

  const previewTex = useMemo(() => makePreviewTexture(item), [item]);
  const previewMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: previewTex,
        transparent: true,
        opacity: 0,
        toneMapped: true,
      }),
    [previewTex]
  );

  // the two door leaves
  const leafL = useRef<THREE.Mesh>(null);
  const leafR = useRef<THREE.Mesh>(null);
  const spill = useRef<THREE.PointLight>(null);
  const root = useRef<THREE.Group>(null);

  // gathering motes
  const motes = useMemo(() => {
    if (quality.simplified) return null;
    const count = quality.tier === "high" ? 120 : 70;
    const geo = new THREE.BufferGeometry();
    const origins = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 3.4;
      origins[i * 3] = Math.cos(a) * r;
      origins[i * 3 + 1] = 0.3 + Math.random() * 4.2;
      origins[i * 3 + 2] = Math.sin(a) * r * 0.5 + 1.5;
      seeds[i] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(origins, 3));
    geo.setAttribute("aOrigin", new THREE.BufferAttribute(origins, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: MOTE_VERT,
      fragmentShader: MOTE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uApproach: { value: 0 },
        uColor: { value: new THREE.Color(d.accent) },
      },
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    return { points, mat, geo };
  }, [quality.simplified, quality.tier, d.accent]);

  useEffect(
    () => () => {
      glowMat.dispose();
      logoMat.dispose();
      logoTex.dispose();
      previewMat.dispose();
      previewTex.dispose();
      motes?.geo.dispose();
      motes?.mat.dispose();
    },
    [glowMat, logoMat, logoTex, previewMat, previewTex, motes]
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const ds = Math.abs(plot.s - journey.s);

    // Cull the portal entirely when it is far away — it contributes
    // nothing beyond its 50 m approach radius but costs ~6 draw calls.
    const inRange = ds < 140;
    if (root.current && root.current.visible !== inRange) {
      root.current.visible = inRange;
    }
    if (!inRange) {
      if (approach.current !== 0) {
        approach.current = 0;
        glowMat.uniforms.uApproach.value = 0;
        // intensity, never visibility — see the note in Lighting.tsx
        if (spill.current) spill.current.intensity = 0;
      }
      return;
    }

    // approach: 0 at 55 m out, 1 at the threshold
    const target = THREE.MathUtils.clamp(1 - (ds - 6) / 44, 0, 1);
    approach.current += (target - approach.current) * Math.min(1, dt * 2.4);
    const a = approach.current;

    hoverAmt.current += ((hovered.current ? 1 : 0) - hoverAmt.current) * Math.min(1, dt * 8);
    const boost = a + hoverAmt.current * 0.35 * a;

    // 1 — the glow
    glowMat.uniforms.uTime.value = journey.time;
    glowMat.uniforms.uApproach.value = boost;
    glowMat.uniforms.uHover.value = hoverAmt.current * a;
    glowMat.uniforms.uBolt.value = journey.bolt;

    // 2 — reflections strengthen: the spill light drives the wet road
    if (spill.current) {
      spill.current.intensity = boost * boost * 26;
    }

    // 3 — the logo fades in, a little later than the glow
    logoMat.opacity = THREE.MathUtils.clamp((a - 0.18) / 0.5, 0, 1);

    // 4 — particles gather
    if (motes) {
      motes.mat.uniforms.uTime.value = journey.time;
      motes.mat.uniforms.uApproach.value = boost;
      motes.points.visible = boost > 0.015;
    }

    // 5 — a soft sound announces the portal, once per approach.
    //     This is also the moment the visit is recorded, so the
    //     observatory's map can light this tower at the finale.
    if (a > 0.55 && !announced.current) {
      announced.current = true;
      visitedStore.add(item.id);
      window.dispatchEvent(
        new CustomEvent("picksaw:portal", {
          detail: { id: item.id, accent: d.accent, enter: true },
        })
      );
    } else if (a < 0.25 && announced.current) {
      announced.current = false;
      window.dispatchEvent(
        new CustomEvent("picksaw:portal", { detail: { id: item.id, enter: false } })
      );
    }

    // 6 — the door opens slightly
    const open = THREE.MathUtils.smoothstep(a, 0.3, 1) * (0.42 + hoverAmt.current * 0.3);
    if (leafL.current) leafL.current.rotation.y = open * 0.85;
    if (leafR.current) leafR.current.rotation.y = -open * 0.85;
    previewMat.opacity = THREE.MathUtils.clamp((a - 0.35) / 0.4, 0, 1) * 0.9;
  });

  const over = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hovered.current = true;
    document.body.style.cursor = "pointer";
  }, []);
  const out = useCallback(() => {
    hovered.current = false;
    document.body.style.cursor = "";
  }, []);
  const click = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      onOpen(item);
    },
    [item, onOpen]
  );

  const half = DOOR_W / 2;

  return (
    <>
    <group ref={root} position={[t.x, t.y, t.z]} rotation={[0, t.rotY, 0]}>
      {/* the lit interior seen through the opening doors */}
      <mesh position={[0, DOOR_H / 2, 1.2]} material={previewMat}>
        <planeGeometry args={[DOOR_W - 0.3, DOOR_H - 0.3]} />
      </mesh>

      {/* the two door leaves, hinged at the outer edges */}
      <group position={[-half, 0, 1.55]}>
        <mesh ref={leafL} position={[half / 2, DOOR_H / 2, 0]}>
          <boxGeometry args={[half, DOOR_H, 0.09]} />
          <meshStandardMaterial
            color="#0b0f16"
            roughness={0.14}
            metalness={0.55}
            envMapIntensity={1.5}
          />
        </mesh>
      </group>
      <group position={[half, 0, 1.55]}>
        <mesh ref={leafR} position={[-half / 2, DOOR_H / 2, 0]}>
          <boxGeometry args={[half, DOOR_H, 0.09]} />
          <meshStandardMaterial
            color="#0b0f16"
            roughness={0.14}
            metalness={0.55}
            envMapIntensity={1.5}
          />
        </mesh>
      </group>

      {/* the threshold glow */}
      <mesh position={[0, DOOR_H / 2, 1.75]} material={glowMat}>
        <planeGeometry args={[DOOR_W + 2.6, DOOR_H + 2.2]} />
      </mesh>

      {/* the engraved logo on the lintel */}
      <mesh position={[0, DOOR_H + 1.05, 1.95]} material={logoMat}>
        <planeGeometry args={[DOOR_W + 1.4, (DOOR_W + 1.4) / 4]} />
      </mesh>

      {/* gathering motes */}
      {motes && <primitive object={motes.points} />}

      {/* the hit target — a real door-shaped volume you click to enter */}
      <mesh
        position={[0, DOOR_H / 2, 2.1]}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
        visible={false}
      >
        <boxGeometry args={[DOOR_W + 1.4, DOOR_H + 1, 1.4]} />
      </mesh>
    </group>

      {/**
        * The spill light lives OUTSIDE the culled group on purpose.
        *
        * three.js bakes light counts into the shader program cache key
        * and skips invisible lights when collecting them, so hiding a
        * group that contains a light changes the count and forces every
        * lit material in the scene to recompile. Keeping the light
        * mounted and permanently visible (gated by intensity alone)
        * keeps the count constant no matter what is culled.
        */}
      <pointLight
        ref={spill}
        position={[t.x + Math.sin(t.rotY) * 2.6, t.y + 1.6, t.z + Math.cos(t.rotY) * 2.6]}
        color={d.accent}
        intensity={0}
        distance={16}
        decay={2}
      />
    </>
  );
}

export default function Portals({
  quality,
  onOpen,
}: {
  quality: Quality;
  onOpen: (item: TemplateItem) => void;
}) {
  return (
    <>
      {HERO_PLOTS.map((plot) => {
        const item = TEMPLATES.find((x) => x.id === plot.templateId);
        if (!item) return null;
        return (
          <Portal
            key={plot.templateId}
            plot={plot}
            item={item}
            quality={quality}
            onOpen={onOpen}
          />
        );
      })}
    </>
  );
}
