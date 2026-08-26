/**
 * WetGround — the reflective street surface.
 *
 * This replaces the plain PBR pass on the roadway and sidewalks with a
 * custom material that does the four things water actually does
 * (see lib/wetness.ts), plus the one thing that sells a wet city more
 * than anything else: REFLECTIONS.
 *
 * Full screen-space reflection is too expensive for the frame budget
 * here, so the reflections are analytic. The shader knows where the
 * street lamps are (a compact uniform array, updated as you walk) and
 * where the hero entrances are, and it renders their mirror images
 * directly — a light 7 m above the road produces a vertical smear of
 * light on the road below it, stretched by roughness and broken up by
 * rain ripples. That is exactly what a real wet road looks like, and
 * it costs a loop over ~8 lights instead of a depth-buffer march.
 *
 * The result: puddles that genuinely mirror the lamps above them, an
 * asphalt sheen that slides as you walk, and dry patches under
 * overhangs where the rain cannot reach.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  JOURNEY_LENGTH,
  KERB_HEIGHT,
  ROAD_HALF,
  SIDEWALK,
  buildLampsSorted,
  pathHeading,
  pathX,
  pathY,
} from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { gradeAt } from "../lib/palette";
import { WETNESS_GLSL } from "../lib/wetness";
import type { Quality } from "../lib/quality";

const MAX_REFLECTORS = 10;

const VERT = /* glsl */ `
  precision highp float;
  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vLateral;

  attribute float aLateral;

  void main() {
    vUv = uv;
    vLateral = aLateral;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uStorm;
  uniform float uBolt;
  uniform vec3  uFogColor;
  uniform vec3  uMoon;
  uniform float uFogDensity;
  uniform float uWetness;
  uniform float uSurface;      // 0 = asphalt roadway, 1 = concrete walk
  uniform vec3  uBaseColor;
  uniform float uBaseRough;
  uniform float uPorosity;
  uniform float uRoadHalf;

  // reflector array: xyz = world position, w = radius
  uniform vec4 uLights[${MAX_REFLECTORS}];
  uniform vec3 uLightColors[${MAX_REFLECTORS}];
  uniform int  uLightCount;

  varying vec3 vWorld;
  varying vec2 vUv;
  varying float vLateral;

  ${WETNESS_GLSL}

  void main() {
    vec3 viewDir = normalize(vWorld - cameraPosition);
    float dist = length(vWorld - cameraPosition);

    // ── surface detail ──
    // Fine aggregate/paving noise perturbs the normal so reflections
    // break up instead of being mirror-perfect.
    vec2 grain = vWorld.xz * (uSurface > 0.5 ? 3.2 : 6.5);
    float bump = wetFbm(grain) - 0.5;
    vec3 N = normalize(vec3(bump * 0.16, 1.0, wetFbm(grain + 31.7) - 0.5) * vec3(1.0, 1.0, 0.16) + vec3(0.0, 1.0, 0.0));

    // ── water ──
    float puddle = puddleMask(vWorld.xz, uWetness);
    // sidewalks drain better than the road; kerbside pools most
    puddle *= mix(1.0, 0.45, uSurface);
    // a thin film covers everything when it is raining hard
    float film = uWetness * (uSurface > 0.5 ? 0.5 : 0.75);
    float wet = clamp(max(film, puddle), 0.0, 1.0);

    vec3 albedo = uBaseColor;
    float roughness = uBaseRough;
    float f0 = 0.04;
    applyWetness(albedo, roughness, f0, wet, uPorosity);

    // ── rain ripples disturb standing water ──
    if (puddle > 0.02) {
      float rip = 0.0;
      // three overlapping ring systems, seeded off the world position
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 cell = floor(vWorld.xz * (1.6 + fi * 0.7) + fi * 17.0);
        vec2 local = fract(vWorld.xz * (1.6 + fi * 0.7) + fi * 17.0) - 0.5;
        float seed = wetHash(cell + fi * 3.0);
        float t = fract(uTime * (0.9 + seed * 0.8) + seed);
        float r = length(local) * 2.0;
        float ring = 1.0 - abs(r - t * 0.95) * 11.0;
        rip += max(ring, 0.0) * (1.0 - t) * step(0.55, seed);
      }
      // ripples tilt the normal, which is what actually distorts the
      // reflection — they are not drawn as geometry
      N = normalize(N + vec3(rip * 0.5, 0.0, rip * 0.4) * puddle * (0.4 + uStorm));
      roughness = mix(roughness, roughness + rip * 0.18, puddle);
    }

    // ── base lighting ──
    // Sky bounce: the wet road is mostly a mirror of the sky above it.
    float NdotV = max(dot(N, -viewDir), 0.001);
    vec3 col = albedo * uMoon * 0.16;
    col += albedo * uFogColor * 0.5;

    // ── Fresnel ──
    // At grazing angles a wet road becomes almost a perfect mirror.
    // This single term is most of the "soaked" read.
    float fres = f0 + (1.0 - f0) * pow(1.0 - NdotV, 5.0);
    fres *= mix(0.25, 1.0, wet);

    // ── analytic reflections ──
    // Mirror each light through the ground plane and accumulate.
    vec3 refl = vec3(0.0);
    for (int i = 0; i < ${MAX_REFLECTORS}; i++) {
      if (i >= uLightCount) break;
      vec3 lp = uLights[i].xyz;
      float radius = uLights[i].w;

      // the mirrored source sits as far below the road as it is above
      vec3 mirrored = vec3(lp.x, 2.0 * vWorld.y - lp.y, lp.z);
      vec3 toMirror = mirrored - vWorld;
      float d = length(toMirror);
      vec3 L = toMirror / max(d, 0.001);

      // how closely does the view reflect toward the mirrored light?
      vec3 R = reflect(viewDir, N);
      float align = max(dot(R, L), 0.0);

      // Roughness widens the highlight VERTICALLY far more than
      // horizontally — that anisotropic smear is the signature of a wet
      // road, and it is why reflections look like columns of light.
      float sharp = mix(220.0, 14.0, clamp(roughness * 2.4, 0.0, 1.0));
      float spec = pow(align, sharp);

      // vertical stretch: elongate along the world Y of the reflection
      float vertical = 1.0 - abs(normalize(toMirror).y);
      spec *= mix(1.0, 2.4, vertical);

      // distance falloff of the source itself
      float atten = radius * radius / (d * d + 1.0);
      refl += uLightColors[i] * spec * atten;
    }
    // reflections only exist where there is water
    col += refl * fres * (0.35 + wet * 1.5) * (1.0 - uBolt * 0.3);

    // ── moon glint ──
    vec3 moonDir = normalize(vec3(-0.5, 0.78, 0.35));
    vec3 H = normalize(moonDir - viewDir);
    float ndh = max(dot(N, H), 0.0);
    float glint = pow(ndh, mix(60.0, 900.0, 1.0 - roughness));
    col += uMoon * glint * fres * 1.4 * wet;

    // ── lightning: the whole street flares, water flares hardest ──
    col += uMoon * uBolt * (0.22 + fres * 1.5 * wet);

    // ── kerbside darkening + edge highlight ──
    float edge = 1.0 - smoothstep(0.0, 1.6, abs(abs(vLateral) - uRoadHalf));
    col *= 1.0 - edge * 0.25;
    col += uMoon * edge * fres * 0.25 * wet;

    // ── fog ──
    float fog = 1.0 - exp(-dist * uFogDensity);
    col = mix(col, uFogColor, clamp(fog, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const STEP = 4;
const OVERSHOOT = 120;

/** Sweep a ribbon along the path, carrying the lateral coordinate. */
function sweep(fromLat: number, toLat: number, yOffset: number): THREE.BufferGeometry {
  const rings = Math.ceil((JOURNEY_LENGTH + OVERSHOOT * 2) / STEP) + 1;
  const positions = new Float32Array(rings * 2 * 3);
  const uvs = new Float32Array(rings * 2 * 2);
  const laterals = new Float32Array(rings * 2);
  const indices: number[] = [];

  for (let i = 0; i < rings; i++) {
    const s = -OVERSHOOT + i * STEP;
    const cx = pathX(s);
    const cy = pathY(s) + yOffset;
    const cz = -s;
    const h = pathHeading(s);
    const nx = Math.cos(h);
    const nz = Math.sin(h);

    for (let j = 0; j < 2; j++) {
      const lat = j === 0 ? fromLat : toLat;
      const k = (i * 2 + j) * 3;
      positions[k] = cx + nx * lat;
      positions[k + 1] = cy;
      positions[k + 2] = cz + nz * lat;
      const u = (i * 2 + j) * 2;
      uvs[u] = j;
      uvs[u + 1] = s / 8;
      laterals[i * 2 + j] = lat;
    }
    if (i < rings - 1) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setAttribute("aLateral", new THREE.BufferAttribute(laterals, 1));
  g.setIndex(indices);
  g.computeBoundingSphere();
  return g;
}

function makeMaterial(surface: number, base: string, rough: number, porosity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uStorm: { value: 0 },
      uBolt: { value: 0 },
      uFogColor: { value: new THREE.Color("#0a1020") },
      uMoon: { value: new THREE.Color("#93b6ff") },
      uFogDensity: { value: 0.0072 },
      uWetness: { value: 0.85 },
      uSurface: { value: surface },
      uBaseColor: { value: new THREE.Color(base) },
      uBaseRough: { value: rough },
      uPorosity: { value: porosity },
      uRoadHalf: { value: ROAD_HALF },
      uLights: {
        value: Array.from({ length: MAX_REFLECTORS }, () => new THREE.Vector4()),
      },
      uLightColors: {
        value: Array.from({ length: MAX_REFLECTORS }, () => new THREE.Color()),
      },
      uLightCount: { value: 0 },
    },
  });
}

export default function WetGround({ quality }: { quality: Quality }) {
  const lamps = useMemo(() => buildLampsSorted(), []);
  const lampColors = useMemo(
    () => lamps.map((l) => new THREE.Color(l.color)),
    [lamps]
  );

  const { road, walkL, walkR, roadMat, walkMat } = useMemo(() => {
    const roadMat = makeMaterial(0, "#0a0c11", 0.9, 0.85);
    const walkMat = makeMaterial(1, "#171a21", 0.86, 0.78);
    return {
      road: sweep(-ROAD_HALF, ROAD_HALF, 0.004),
      walkL: sweep(-(ROAD_HALF + SIDEWALK), -ROAD_HALF, KERB_HEIGHT),
      walkR: sweep(ROAD_HALF, ROAD_HALF + SIDEWALK, KERB_HEIGHT),
      roadMat,
      walkMat,
    };
  }, []);

  useEffect(
    () => () => {
      road.dispose();
      walkL.dispose();
      walkR.dispose();
      roadMat.dispose();
      walkMat.dispose();
    },
    [road, walkL, walkR, roadMat, walkMat]
  );

  const cursor = useRef(0);
  const frame = useRef(0);

  useFrame(() => {
    const grade = gradeAt(journey.progress, journey.bolt);
    const mats = [roadMat, walkMat];
    for (const m of mats) {
      const u = m.uniforms;
      u.uTime.value = journey.time;
      u.uStorm.value = journey.storm;
      u.uBolt.value = journey.bolt;
      u.uFogColor.value.copy(grade.fog);
      u.uMoon.value.copy(grade.moon);
      u.uFogDensity.value = 0.0062 + journey.storm * 0.004;
      // the street soaks as the storm builds, and dries at the finale
      u.uWetness.value = 0.55 + journey.storm * 0.42;
    }

    // ── feed the reflector array ──
    frame.current++;
    if (frame.current % 3 !== 0) return;

    const camS = journey.s;
    while (cursor.current < lamps.length - 1 && lamps[cursor.current].s < camS - 26)
      cursor.current++;
    while (cursor.current > 0 && lamps[cursor.current - 1].s >= camS - 26) cursor.current--;

    const positions = roadMat.uniforms.uLights.value as THREE.Vector4[];
    const colors = roadMat.uniforms.uLightColors.value as THREE.Color[];
    let n = 0;
    for (let i = 0; i < MAX_REFLECTORS && cursor.current + i < lamps.length; i++) {
      const idx = cursor.current + i;
      const lamp = lamps[idx];
      const ds = lamp.s - camS;
      if (ds < -30 || ds > 80) continue;
      const reach = 1.5;
      const dirX = -lamp.side * Math.cos(lamp.rotY);
      const dirZ = -lamp.side * Math.sin(lamp.rotY);
      positions[n].set(
        lamp.x + dirX * reach,
        lamp.y + lamp.height - 0.28,
        lamp.z + dirZ * reach,
        2.6
      );
      colors[n].copy(lampColors[idx]);
      n++;
    }
    roadMat.uniforms.uLightCount.value = n;
    // sidewalks share the same reflector set
    walkMat.uniforms.uLights.value = positions;
    walkMat.uniforms.uLightColors.value = colors;
    walkMat.uniforms.uLightCount.value = n;
  });

  return (
    <group>
      <mesh geometry={road} material={roadMat} receiveShadow={quality.shadows} />
      <mesh geometry={walkL} material={walkMat} receiveShadow={quality.shadows} />
      <mesh geometry={walkR} material={walkMat} receiveShadow={quality.shadows} />
    </group>
  );
}
