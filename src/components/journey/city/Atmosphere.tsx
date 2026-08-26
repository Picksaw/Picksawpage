/**
 * Atmosphere — layered depth, not a fog colour.
 *
 * Real fog is not one thing. It is a stack of media at different
 * distances that respond to your movement at different rates, and that
 * is exactly what makes a street feel deep. Five layers here:
 *
 *   GROUND MIST   hugs the pavement, ~1.2 m tall, drifts SIDEWAYS across
 *                 the street rather than toward you. Parallaxes hard.
 *   NEAR FOG      3–18 m out. Reacts strongly to the dolly: it streaks
 *                 past, and the faster you move the more it stretches.
 *   MID FOG       18–60 m. Slower, larger, softer — the layer that
 *                 actually hides the middle distance.
 *   FAR FOG       60–200 m. Barely moves. This is the layer lightning
 *                 lights up from behind.
 *   HEIGHT FOG    an analytic term in the shader, not cards: density
 *                 falls off exponentially with altitude so the skyline
 *                 dissolves into the sky instead of ending at a line.
 *
 * All five are ONE instanced draw call of camera-facing cards. The
 * vertex shader does the wrapping, the parallax and the billboarding;
 * the fragment shader builds every puff procedurally from 3-D value
 * noise — no PNG clouds, so nothing can ever read as a sprite.
 *
 * The wrap trick: cards are positioned in a rolling volume around the
 * camera. When one falls behind, it is re-projected to the front by
 * modular arithmetic in the shader. Zero CPU cost, no popping, and the
 * fog volume is effectively infinite.
 */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import { gradeAt } from "../lib/palette";
import { rng } from "../lib/rng";
import type { Quality } from "../lib/quality";

const VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCam;
  uniform float uVelocity;
  uniform float uStorm;

  attribute vec3  aOrigin;   // position within the layer volume
  attribute float aSize;     // card radius, metres
  attribute float aSeed;
  attribute float aLayer;    // 0 ground, 1 near, 2 mid, 3 far
  attribute float aAlpha;

  varying float vAlpha;
  varying float vSeed;
  varying float vLayer;
  varying vec2  vUv;
  varying float vDist;
  varying float vHeight;
  varying float vStretch;
  varying float vRadius;

  // Each layer wraps in its own volume — that is what produces parallax:
  // near cards recycle every 26 m, far cards every 260 m, so they slide
  // past the eye at completely different rates.
  float spanFor(float layer) {
    if (layer < 0.5) return 44.0;
    if (layer < 1.5) return 60.0;
    if (layer < 2.5) return 150.0;
    return 420.0;
  }

  void main() {
    vSeed = aSeed;
    vLayer = aLayer;
    vAlpha = aAlpha;

    float span = spanFor(aLayer);
    vec3 p = aOrigin;

    // ── drift ──
    // Ground mist crawls SIDEWAYS across the street; the higher layers
    // roll gently forward. Two incommensurate frequencies per axis so
    // no two puffs ever sync up.
    float t = uTime;
    if (aLayer < 0.5) {
      p.x += sin(t * 0.055 + aSeed * 6.2831) * 5.5 + t * 0.42 * (aSeed > 0.5 ? 1.0 : -1.0);
      p.y += sin(t * 0.09 + aSeed * 3.1) * 0.16;
      p.z += sin(t * 0.031 + aSeed * 2.2) * 1.6;
    } else {
      float rate = 1.0 / (aLayer * aLayer);      // far layers barely move
      p.x += sin(t * 0.021 * rate + aSeed * 6.2831) * 6.0 * rate;
      p.y += sin(t * 0.017 * rate + aSeed * 4.4) * 1.1 * rate;
      p.z += t * 0.55 * rate;
    }

    // ── wrap around the camera ──
    // Only Z wraps: the volume slides with the walker, so fog is always
    // ahead of you no matter how far you have walked.
    float rel = mod(p.z - uCam.z + span * 0.35, span);
    p.z = uCam.z - span * 0.65 + rel;
    // X follows the camera loosely so the fog fills the street on bends
    p.x += uCam.x * (aLayer < 0.5 ? 0.85 : 0.4);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    vDist = dist;
    vHeight = p.y;

    // ── billboard, with velocity stretch ──
    // The near layer smears along the direction of travel when the
    // dolly moves — the single strongest cue that you are moving fast.
    float stretch = 1.0;
    if (aLayer < 1.5) stretch = 1.0 + min(abs(uVelocity) / 34.0, 1.1) * (aLayer < 0.5 ? 0.5 : 1.4);
    vStretch = stretch;

    vec2 corner = position.xy;
    vUv = corner + 0.5;
    float size = aSize * (0.85 + uStorm * 0.3);
    vRadius = size * 0.5;
    mv.xy += corner * vec2(size * stretch, size);

    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uFogColor;
  uniform vec3  uMoon;
  uniform vec3  uWarm;
  uniform float uBolt;
  uniform float uStorm;
  uniform float uWarmth;

  varying float vAlpha;
  varying float vSeed;
  varying float vLayer;
  varying vec2  vUv;
  varying float vDist;
  varying float vHeight;
  varying float vStretch;
  varying float vRadius;

  // ── value noise ──
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // radial falloff — the card has no edge, only a density gradient
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    float body = 1.0 - smoothstep(0.0, 1.0, r);
    body = pow(body, 1.35);

    // ── procedural puff ──
    // Noise is sampled in a space that scrolls, so the interior of every
    // puff churns slowly. This is what stops it reading as a sprite.
    vec3 np = vec3(c * 2.4, vSeed * 40.0);
    np.z += uTime * (0.06 + vSeed * 0.05);
    np.x += uTime * 0.02;
    float n = fbm(np * 1.8);
    // erode the silhouette with the same noise, so the outline is ragged
    float density = body * (0.35 + 0.95 * n);
    density *= smoothstep(0.02, 0.35, density + body * 0.25);

    // ── height fog ──
    // Density falls off exponentially with altitude: the skyline
    // dissolves upward instead of stopping at a hard line.
    float heightFalloff = exp(-max(vHeight - 0.4, 0.0) * (vLayer < 0.5 ? 0.85 : 0.055));
    density *= mix(1.0, heightFalloff, vLayer < 0.5 ? 1.0 : 0.72);

    // ── depth response ──
    // Nothing may pop in at the near plane, and nothing may stack into
    // a wall at the far plane.
    // The fade must scale with the card's own RADIUS, not just its centre
    // distance: a 110 m far-fog card whose centre is 40 m away still
    // engulfs the camera, and at full opacity that reads as the screen
    // going flat black. Requiring several radii of separation keeps the
    // big cards where they belong — in the distance.
    float nearFade = smoothstep(1.2, 6.0, vDist)
                   * smoothstep(vRadius * 0.6, vRadius * 2.2, vDist);
    float farFade  = 1.0 - smoothstep(
      vLayer < 0.5 ? 34.0 : vLayer < 1.5 ? 52.0 : vLayer < 2.5 ? 130.0 : 340.0,
      vLayer < 0.5 ? 52.0 : vLayer < 1.5 ? 78.0 : vLayer < 2.5 ? 190.0 : 430.0,
      vDist);
    float a = density * vAlpha * nearFade * farFade;

    // stretching a card must not make it denser
    a /= max(vStretch * 0.55, 0.6);
    a *= 0.7 + uStorm * 0.6;
    if (a < 0.004) discard;

    // ── colour ──
    // Moonlight from above, warm sodium bleeding in from the lamps
    // below, and the whole thing sinking bluer with distance.
    float up = smoothstep(-0.2, 0.6, c.y + n * 0.3);
    vec3 col = mix(uFogColor, uMoon, up * 0.5);
    // ground mist catches the lamps most strongly
    float warmMix = (vLayer < 0.5 ? 0.5 : 0.16) * uWarmth * (1.0 - up * 0.5);
    col = mix(col, uWarm, warmMix);
    col = mix(col, uFogColor * 0.82, smoothstep(30.0, 220.0, vDist));

    // lightning floods the fog — this is the "fog bloom" beat
    col += vec3(0.55, 0.68, 0.9) * uBolt * (0.6 + n * 0.8);
    a *= 1.0 + uBolt * 0.5;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface LayerDef {
  layer: number;
  share: number;
  /** [min, max] card radius in metres */
  size: [number, number];
  /** vertical band */
  y: [number, number];
  /** lateral spread from the street centre */
  x: number;
  /** depth volume — must match spanFor() in the vertex shader */
  span: number;
  alpha: [number, number];
}

const LAYERS: LayerDef[] = [
  // ground mist — low, wide, dense, many small puffs
  { layer: 0, share: 0.34, size: [2.2, 6.5], y: [-0.3, 1.5], x: 26, span: 44, alpha: [0.1, 0.22] },
  // near fog — the layer that streaks past you
  { layer: 1, share: 0.24, size: [5, 13], y: [0, 12], x: 34, span: 60, alpha: [0.045, 0.1] },
  // mid fog — hides the middle distance
  { layer: 2, share: 0.26, size: [14, 34], y: [0, 40], x: 90, span: 150, alpha: [0.03, 0.075] },
  // far fog — the backdrop lightning lights up
  { layer: 3, share: 0.16, size: [45, 110], y: [0, 120], x: 260, span: 420, alpha: [0.025, 0.06] },
];

export default function Atmosphere({ quality }: { quality: Quality }) {
  const { scene } = useThree();

  const { mesh, material } = useMemo(() => {
    const total = quality.fogCards;
    const r = rng(0xf0611);

    const origins = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const seeds = new Float32Array(total);
    const layers = new Float32Array(total);
    const alphas = new Float32Array(total);

    let i = 0;
    for (const def of LAYERS) {
      const n = Math.max(8, Math.round(total * def.share));
      for (let k = 0; k < n && i < total; k++, i++) {
        origins[i * 3] = r.range(-def.x, def.x);
        origins[i * 3 + 1] = r.range(def.y[0], def.y[1]);
        origins[i * 3 + 2] = r.range(-def.span, 0);
        sizes[i] = r.range(def.size[0], def.size[1]);
        seeds[i] = r();
        layers[i] = def.layer;
        alphas[i] = r.range(def.alpha[0], def.alpha[1]);
      }
    }
    const count = i;

    // one quad, instanced
    const geo = new THREE.InstancedBufferGeometry();
    const quad = new Float32Array([
      -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
    ]);
    geo.setAttribute("position", new THREE.BufferAttribute(quad, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute("aOrigin", new THREE.InstancedBufferAttribute(origins.subarray(0, count * 3), 3));
    geo.setAttribute("aSize", new THREE.InstancedBufferAttribute(sizes.subarray(0, count), 1));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds.subarray(0, count), 1));
    geo.setAttribute("aLayer", new THREE.InstancedBufferAttribute(layers.subarray(0, count), 1));
    geo.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(alphas.subarray(0, count), 1));
    geo.instanceCount = count;

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uVelocity: { value: 0 },
        uStorm: { value: 0 },
        uFogColor: { value: new THREE.Color("#0a1020") },
        uMoon: { value: new THREE.Color("#8fb0e8") },
        uWarm: { value: new THREE.Color("#c98f5e") },
        uBolt: { value: 0 },
        uWarmth: { value: 0.4 },
      },
    });

    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    // draw after opaque geometry, before the emissive glows
    m.renderOrder = 4;
    return { mesh: m, material: mat };
  }, [quality.fogCards]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
    },
    [mesh, material]
  );

  // scene fog gives the cards something to sit against; the cards give
  // the scene fog structure. Both are graded together every frame.
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0a1020, 0.0072);
    /**
     * A real scene background, not just CSS.
     *
     * The canvas uses `alpha: false`, and EffectComposer's RenderPass
     * clears using `scene.background`. With that null, any pixel not
     * covered by geometry was left as undefined framebuffer content —
     * black, noisy and glitching. Sky.tsx paints the dome properly;
     * this guarantees a defined frame even before it mounts.
     */
    const prevBg = scene.background;
    scene.background = new THREE.Color(0x0a1020);
    return () => {
      scene.fog = null;
      scene.background = prevBg;
    };
  }, [scene]);

  useFrame(({ camera }) => {
    const u = material.uniforms;
    u.uTime.value = journey.time;
    u.uCam.value.copy(camera.position);
    u.uVelocity.value = journey.velocity;
    u.uStorm.value = journey.storm;
    u.uBolt.value = journey.bolt;

    const grade = gradeAt(journey.progress, journey.bolt);
    u.uFogColor.value.copy(grade.fog);
    u.uMoon.value.copy(grade.moon);
    u.uWarmth.value = grade.warmth;

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(grade.fog);
    }
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.copy(grade.fog);
      // the air thickens as the storm builds
      scene.fog.density = 0.0062 + journey.storm * 0.004;
    }
  });

  return <primitive object={mesh} />;
}
