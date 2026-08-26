/**
 * Skyline — the towers you can only half-see.
 *
 * These sit 130–460 m out, mostly swallowed by height fog. They exist
 * to give the district a horizon and, above all, so that lightning has
 * something to REVEAL: when a bolt fires, `uBolt` lifts their emissive
 * and an entire second city snaps into view for a fifth of a second,
 * then vanishes again.
 *
 * One instanced draw call. No shadows, no lighting maths, no per-frame
 * CPU work — the whole thing is static geometry plus two uniforms.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildSkyline } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

const VERT = /* glsl */ `
  attribute vec3 aDims;
  attribute float aSeed;
  attribute float aDepth;
  varying float vSeed;
  varying float vDepth;
  varying vec2 vUv;
  varying float vFaceUp;
  varying vec3 vWorld;

  void main() {
    vSeed = aSeed;
    vDepth = aDepth;
    vUv = uv * vec2(max(aDims.x / 7.0, 1.0), max(aDims.y / 6.0, 1.0));
    vFaceUp = step(0.5, abs(normal.y));
    vec4 wp = instanceMatrix * vec4(position, 1.0);
    vWorld = (modelMatrix * wp).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * wp;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uBolt;
  uniform float uTime;
  uniform vec3 uHaze;
  uniform vec3 uWindow;
  uniform vec3 uBoltColor;
  uniform float uFogDensity;

  varying float vSeed;
  varying float vDepth;
  varying vec2 vUv;
  varying float vFaceUp;
  varying vec3 vWorld;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7)) + vSeed) * 43758.5453);
  }

  void main() {
    // sparse window grid — far towers only show a scatter of lit cells
    vec2 cell = floor(vUv);
    float lit = step(0.86, hash(cell)) * (1.0 - vFaceUp);
    vec2 f = fract(vUv);
    float pane = step(0.16, f.x) * step(f.x, 0.82) * step(0.2, f.y) * step(f.y, 0.78);
    float win = lit * pane;

    // slow occupancy drift so the horizon is never frozen
    float drift = step(0.35, fract(hash(cell) * 7.3 + uTime * 0.013));
    win *= mix(0.35, 1.0, drift);

    // the mass itself: barely brighter than the haze it sits in
    float massing = 0.55 + 0.45 * hash(floor(vUv * 0.5));
    vec3 col = uHaze * (0.62 + 0.5 * massing) * (1.0 - vDepth * 0.42);
    col += uWindow * win * 0.5 * (1.0 - vDepth * 0.6);

    // LIGHTNING REVEAL — the silhouette flares, edges catch the flash
    col += uBoltColor * uBolt * (0.55 + 0.45 * massing) * (1.0 - vDepth * 0.25);

    // height fog: dissolve the base of every tower into the mist
    float fogY = smoothstep(-6.0, 78.0, vWorld.y);
    float d = length(vWorld.xz - cameraPosition.xz);
    float depthFade = exp(-d * uFogDensity);
    float alpha = clamp(fogY * 0.9 + 0.1, 0.0, 1.0) * depthFade;
    alpha *= mix(0.55, 1.0, uBolt);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function Skyline({ quality }: { quality: Quality }) {
  const count = quality.simplified ? 34 : quality.tier === "low" ? 48 : 90;
  const towers = useMemo(() => buildSkyline(count), [count]);

  const { mesh, material } = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const dims = new Float32Array(towers.length * 3);
    const seeds = new Float32Array(towers.length);
    const depths = new Float32Array(towers.length);

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uBolt: { value: 0 },
        uTime: { value: 0 },
        uHaze: { value: new THREE.Color("#131e33") },
        uWindow: { value: new THREE.Color("#9fd0ff") },
        uBoltColor: { value: new THREE.Color("#cfe6ff") },
        uFogDensity: { value: 0.0038 },
      },
    });

    const m = new THREE.InstancedMesh(geo, mat, towers.length);
    m.frustumCulled = false;
    m.renderOrder = -5;

    const mat4 = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    towers.forEach((t, i) => {
      pos.set(t.x, t.h * 0.5 - 4, t.z);
      quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (t.seed % 100) / 100);
      scl.set(t.w, t.h, t.d);
      mat4.compose(pos, quat, scl);
      m.setMatrixAt(i, mat4);
      dims[i * 3] = t.w;
      dims[i * 3 + 1] = t.h;
      dims[i * 3 + 2] = t.d;
      seeds[i] = t.seed % 1000;
      depths[i] = t.depth;
    });
    m.instanceMatrix.needsUpdate = true;

    geo.setAttribute("aDims", new THREE.InstancedBufferAttribute(dims, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geo.setAttribute("aDepth", new THREE.InstancedBufferAttribute(depths, 1));

    return { mesh: m, material: mat };
  }, [towers]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
    },
    [mesh, material]
  );

  useFrame(() => {
    material.uniforms.uBolt.value = journey.bolt;
    material.uniforms.uTime.value = journey.time;
  });

  return <primitive object={mesh} />;
}
