/**
 * Particles — the air is never empty.
 *
 * Six populations share one instanced draw call. Each has a different
 * size, speed, lifetime and behaviour, and the mix is what creates the
 * sense of depth: tiny fast motes read as near, large slow ones as far,
 * and the eye assembles a volume from the difference.
 *
 *   DUST      fine, near-stationary, catches light. The base layer.
 *   MIST      larger, slower, drifts with the wind.
 *   SPRAY     fine rain bounce-back, hugging the ground, storm-driven.
 *   DEBRIS    scraps of paper and grit tumbling along the street.
 *   INSECTS   orbit the street lamps in tight erratic loops — the only
 *             population that is attracted to something.
 *   LEAVES    occasional, larger, spinning as they fall.
 *
 * All motion is closed-form in the vertex shader (no CPU per particle),
 * and all six wrap in a rolling volume around the walker so the air is
 * populated forever without ever allocating.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildLamps } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { rng } from "../lib/rng";
import type { Quality } from "../lib/quality";

const KIND_DUST = 0;
const KIND_MIST = 1;
const KIND_SPRAY = 2;
const KIND_DEBRIS = 3;
const KIND_INSECT = 4;
const KIND_LEAF = 5;

const VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCam;
  uniform float uStorm;
  uniform float uVelocity;
  uniform float uWind;

  attribute vec3  aOrigin;
  attribute float aSeed;
  attribute float aKind;
  attribute float aSize;
  attribute vec3  aAnchor;   // for insects: the lamp they orbit

  varying float vKind;
  varying float vSeed;
  varying float vAlpha;
  varying float vSpin;

  const float SPAN = 70.0;

  void main() {
    vKind = aKind;
    vSeed = aSeed;

    vec3 p = aOrigin;
    float t = uTime;
    float spin = 0.0;
    float alpha = 1.0;

    if (aKind < 0.5) {
      // ── DUST: hangs, barely moves, brownian drift ──
      p.x += sin(t * 0.11 + aSeed * 6.283) * 1.2 + sin(t * 0.37 + aSeed * 2.1) * 0.35;
      p.y += sin(t * 0.14 + aSeed * 4.1) * 0.8;
      p.z += cos(t * 0.09 + aSeed * 3.3) * 1.1;
      alpha = 0.5;
    } else if (aKind < 1.5) {
      // ── MIST: larger, slower, blown along the street ──
      p.x += sin(t * 0.06 + aSeed * 6.283) * 2.6 + t * uWind * 0.18;
      p.y += sin(t * 0.05 + aSeed * 2.7) * 0.5;
      p.z += t * 0.35;
      alpha = 0.32;
    } else if (aKind < 2.5) {
      // ── SPRAY: rain bouncing off the road, low and quick ──
      float life = fract(t * (1.4 + aSeed * 1.6) + aSeed);
      p.y = mix(0.02, 0.85, life) - life * life * 0.55;
      p.x += (aSeed - 0.5) * life * 1.4 + t * uWind * 0.1;
      alpha = (1.0 - life) * uStorm * 1.4;
    } else if (aKind < 3.5) {
      // ── DEBRIS: tumbles along the ground, driven by the wind ──
      float cycle = fract(t * (0.06 + aSeed * 0.05) + aSeed);
      p.x += cycle * 46.0 * (0.4 + uWind * 0.12) - 23.0;
      // bounces: skitters rather than glides
      p.y = 0.12 + abs(sin(cycle * 34.0 + aSeed * 6.0)) * (0.5 + aSeed * 0.7);
      p.z += sin(t * 0.5 + aSeed * 9.0) * 1.6;
      spin = t * (2.5 + aSeed * 6.0);
      alpha = 0.85;
    } else if (aKind < 4.5) {
      // ── INSECTS: tight erratic orbits around a lamp head ──
      float sp = 1.6 + aSeed * 3.4;
      float r1 = 0.35 + aSeed * 0.7;
      // two nested circles at incommensurate rates = a jittery figure
      p = aAnchor;
      p.x += cos(t * sp + aSeed * 6.283) * r1 + cos(t * sp * 2.7 + aSeed) * r1 * 0.4;
      p.y += sin(t * sp * 1.3 + aSeed * 3.1) * r1 * 0.6 + sin(t * sp * 3.9) * 0.12;
      p.z += sin(t * sp + aSeed * 6.283) * r1 + sin(t * sp * 3.1 + aSeed) * r1 * 0.35;
      // insects shelter when the storm is heavy
      alpha = 1.4 * (1.0 - uStorm * 0.75);
    } else {
      // ── LEAVES: fall slowly, spinning, swinging side to side ──
      float fall = fract(t * (0.045 + aSeed * 0.03) + aSeed);
      p.y = mix(9.0, 0.05, fall);
      p.x += sin(fall * 12.0 + aSeed * 6.283) * 2.2 + t * uWind * 0.2;
      p.z += cos(fall * 9.0 + aSeed * 4.0) * 1.4;
      spin = t * (1.2 + aSeed * 2.2) + fall * 8.0;
      alpha = 0.9;
    }

    // ── wrap the volume around the walker ──
    // Insects stay with their lamp; everything else recycles.
    if (aKind < 3.5 || aKind > 4.5) {
      float rel = mod(p.z - uCam.z + SPAN * 0.4, SPAN);
      p.z = uCam.z - SPAN * 0.6 + rel;
      p.x += uCam.x;
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    // near/far fades — nothing pops at either plane
    float fade = smoothstep(0.8, 3.5, dist) * (1.0 - smoothstep(34.0, 62.0, dist));
    vAlpha = alpha * fade;
    vSpin = spin;

    gl_PointSize = aSize * (240.0 / max(dist, 0.8));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uDust;
  uniform vec3  uWarm;
  uniform vec3  uLeaf;
  uniform float uBolt;

  varying float vKind;
  varying float vSeed;
  varying float vAlpha;
  varying float vSpin;

  void main() {
    vec2 c = gl_PointCoord - 0.5;

    // spinning shapes rotate their own sprite space
    if (vSpin != 0.0) {
      float s = sin(vSpin), co = cos(vSpin);
      c = vec2(co * c.x - s * c.y, s * c.x + co * c.y);
    }

    float a = vAlpha;
    vec3 col;

    if (vKind < 1.5) {
      // dust & mist — soft round motes
      float r = length(c) * 2.0;
      if (r > 1.0) discard;
      a *= pow(1.0 - r, 2.2) * 0.5;
      col = uDust;
    } else if (vKind < 2.5) {
      // spray — tiny hard specks
      float r = length(c) * 2.6;
      if (r > 1.0) discard;
      a *= pow(1.0 - r, 1.4) * 0.55;
      col = uDust * 1.3;
    } else if (vKind < 3.5) {
      // debris — irregular scrap, not a circle
      vec2 q = abs(c);
      if (q.x + q.y * 0.7 > 0.42) discard;
      a *= 0.7;
      col = uDust * 0.55;
    } else if (vKind < 4.5) {
      // insects — a hot little point
      float r = length(c) * 2.8;
      if (r > 1.0) discard;
      a *= pow(1.0 - r, 3.0);
      col = uWarm * 1.6;
    } else {
      // leaves — a flat oval blade
      vec2 q = c * vec2(1.0, 2.2);
      float r = length(q) * 2.0;
      if (r > 1.0) discard;
      a *= (1.0 - r * 0.65) * 0.85;
      col = uLeaf;
    }

    col += vec3(0.3, 0.38, 0.5) * uBolt * 0.8;
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Mix {
  kind: number;
  share: number;
  size: [number, number];
  y: [number, number];
  spread: number;
}

const MIX: Mix[] = [
  { kind: KIND_DUST, share: 0.3, size: [0.4, 1.1], y: [0.2, 9], spread: 20 },
  { kind: KIND_MIST, share: 0.2, size: [1.6, 4.2], y: [0.1, 6], spread: 26 },
  { kind: KIND_SPRAY, share: 0.18, size: [0.3, 0.8], y: [0, 0.4], spread: 12 },
  { kind: KIND_DEBRIS, share: 0.12, size: [0.7, 1.8], y: [0, 0.6], spread: 14 },
  { kind: KIND_INSECT, share: 0.14, size: [0.35, 0.75], y: [0, 0], spread: 0 },
  { kind: KIND_LEAF, share: 0.06, size: [1.2, 2.6], y: [0, 9], spread: 18 },
];

export default function Particles({ quality }: { quality: Quality }) {
  const lamps = useMemo(() => buildLamps(), []);

  const { points, material } = useMemo(() => {
    const total = quality.ambientParticles;
    const r = rng(0xa1c0de);

    const positions = new Float32Array(total * 3);
    const origins = new Float32Array(total * 3);
    const anchors = new Float32Array(total * 3);
    const seeds = new Float32Array(total);
    const kinds = new Float32Array(total);
    const sizes = new Float32Array(total);

    let i = 0;
    for (const m of MIX) {
      const n = Math.max(4, Math.round(total * m.share));
      for (let k = 0; k < n && i < total; k++, i++) {
        let x: number, y: number, z: number;
        if (m.kind === KIND_INSECT) {
          // insects live at a lamp head — pick one and stay there
          const lamp = lamps[r.int(0, lamps.length - 1)];
          const reach = 1.5;
          anchors[i * 3] = lamp.x - lamp.side * Math.cos(lamp.rotY) * reach;
          anchors[i * 3 + 1] = lamp.y + lamp.height - 0.5;
          anchors[i * 3 + 2] = lamp.z - lamp.side * Math.sin(lamp.rotY) * reach;
          x = anchors[i * 3];
          y = anchors[i * 3 + 1];
          z = anchors[i * 3 + 2];
        } else {
          x = r.range(-m.spread, m.spread);
          y = r.range(m.y[0], m.y[1]);
          z = r.range(-70, 0);
        }
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        origins[i * 3] = x;
        origins[i * 3 + 1] = y;
        origins[i * 3 + 2] = z;
        seeds[i] = r();
        kinds[i] = m.kind;
        sizes[i] = r.range(m.size[0], m.size[1]);
      }
    }
    const count = i;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.subarray(0, count * 3), 3));
    geo.setAttribute("aOrigin", new THREE.BufferAttribute(origins.subarray(0, count * 3), 3));
    geo.setAttribute("aAnchor", new THREE.BufferAttribute(anchors.subarray(0, count * 3), 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds.subarray(0, count), 1));
    geo.setAttribute("aKind", new THREE.BufferAttribute(kinds.subarray(0, count), 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes.subarray(0, count), 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uStorm: { value: 0 },
        uVelocity: { value: 0 },
        uWind: { value: 1 },
        uBolt: { value: 0 },
        uDust: { value: new THREE.Color("#7f92b4").multiplyScalar(0.55) },
        uWarm: { value: new THREE.Color("#ffcf94").multiplyScalar(0.7) },
        uLeaf: { value: new THREE.Color("#4a3b26") },
      },
    });

    const p = new THREE.Points(geo, mat);
    p.frustumCulled = false;
    p.renderOrder = 6;
    return { points: p, material: mat };
  }, [quality.ambientParticles, lamps]);

  useEffect(
    () => () => {
      points.geometry.dispose();
      material.dispose();
    },
    [points, material]
  );

  useFrame(({ camera }) => {
    const u = material.uniforms;
    u.uTime.value = journey.time;
    u.uCam.value.copy(camera.position);
    u.uStorm.value = journey.storm;
    u.uVelocity.value = journey.velocity;
    u.uBolt.value = journey.bolt;
    u.uWind.value = 1.6 + journey.storm * 5.2;
  });

  return <primitive object={points} />;
}
