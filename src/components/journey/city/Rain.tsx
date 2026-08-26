/**
 * Rain 2.0 — everything on the GPU.
 *
 * Not a particle system in the CPU sense: there is no per-drop
 * JavaScript at all. Each drop's entire life — fall, wind shear,
 * turbulence, respawn — is a closed-form function of time and a seed,
 * evaluated in the vertex shader. The CPU writes four uniforms a frame
 * and nothing else, so 9000 drops cost the same as 900.
 *
 * Layers:
 *   DROPS     stretched streaks, size and speed varying with depth, so
 *             the rain has a near/far read instead of one flat sheet
 *   SPLASHES  where a drop's world position crosses the pavement, a
 *             short-lived radial burst is spawned by the SAME closed
 *             form — the splash is literally the drop's own continuation
 *   RIPPLES   expanding rings on the road surface, alpha-tested against
 *             the puddle mask so they only appear in standing water
 *   STREAKS   full-screen water on the lens, only during lightning
 *
 * Storm intensity (journey.storm) drives count, speed, wind and drop
 * size together, so walking deeper into the district genuinely
 * escalates the weather.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import { ROAD_HALF } from "../lib/cityLayout";
import type { Quality } from "../lib/quality";

// ── falling drops ──────────────────────────────────────────────────────────

const DROP_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCam;
  uniform float uStorm;
  uniform float uVelocity;
  uniform float uBolt;

  attribute vec2  aSeed;     // two independent randoms per drop
  attribute float aDepth;    // 0 near … 1 far
  attribute float aScale;

  varying float vAlpha;
  varying float vDepth;
  varying float vSeed;
  varying vec2  vUv;
  varying float vLit;

  const float FALL_TOP = 34.0;
  const float FALL_BOTTOM = -2.0;

  void main() {
    vDepth = aDepth;
    vSeed = aSeed.x;
    vUv = position.xy + 0.5;

    // ── the drop's column ──
    // Spread across the street and up the facades. Near drops sit close
    // to the lens; far drops fill the width of the district.
    float spread = mix(9.0, 62.0, aDepth);
    float x = (aSeed.x - 0.5) * 2.0 * spread;
    float z = (aSeed.y - 0.5) * 2.0 * spread;

    // ── fall ──
    // Heavier (nearer) drops fall faster. Storm accelerates everything.
    float speed = mix(26.0, 15.0, aDepth) * (0.72 + uStorm * 0.6);
    float span = FALL_TOP - FALL_BOTTOM;
    // phase offset per drop so they never fall in ranks
    float phase = fract(aSeed.x * 7.31 + aSeed.y * 3.77);
    float y = FALL_TOP - mod(uTime * speed + phase * span, span);

    // ── wind shear + turbulence ──
    // Wind grows with the storm and with altitude (ground friction), and
    // gusts on two slow frequencies. Turbulence is per-drop.
    float gust = sin(uTime * 0.23 + aSeed.y * 6.28) * 0.6
               + sin(uTime * 0.61 + aSeed.x * 4.1) * 0.4;
    float wind = (1.6 + uStorm * 5.2) * (0.55 + gust * 0.45);
    float altitude = clamp((y - FALL_BOTTOM) / span, 0.0, 1.0);
    x += wind * altitude * 1.4;
    z += wind * 0.35 * altitude;
    // fine turbulence — drops are not on rails
    x += sin(uTime * 3.1 + aSeed.x * 40.0 + y * 0.3) * 0.22 * uStorm;
    z += cos(uTime * 2.7 + aSeed.y * 40.0 + y * 0.25) * 0.18 * uStorm;

    // ── follow the walker ──
    vec3 world = vec3(uCam.x + x, y, uCam.z + z);

    // ── billboard as a streak ──
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float dist = -mv.z;

    // Length comes from fall speed AND camera speed: walking through
    // rain lengthens the streaks, exactly like a long exposure.
    float motion = min(abs(uVelocity) / 30.0, 1.2);
    float len = aScale * (0.5 + uStorm * 0.55) * (1.0 + motion * 0.7);
    float wide = aScale * 0.055 * mix(1.0, 0.45, aDepth);

    // tilt the streak into the wind
    float tilt = atan(wind * 0.055);
    vec2 corner = position.xy;
    vec2 rotated = vec2(
      corner.x * cos(tilt) - corner.y * sin(tilt),
      corner.x * sin(tilt) + corner.y * cos(tilt)
    );
    mv.xy += rotated * vec2(wide, len);

    // ── visibility ──
    float nearFade = smoothstep(0.6, 3.0, dist);
    float farFade = 1.0 - smoothstep(38.0, 72.0, dist);
    vAlpha = nearFade * farFade * mix(0.5, 0.14, aDepth) * (0.4 + uStorm * 0.9);
    // drops catch the lightning
    vLit = uBolt;

    gl_Position = projectionMatrix * mv;
  }
`;

const DROP_FRAG = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uLitColor;

  varying float vAlpha;
  varying float vDepth;
  varying float vSeed;
  varying vec2  vUv;
  varying float vLit;

  void main() {
    // a drop is a soft capsule: bright core, feathered sides, tapered ends
    float across = abs(vUv.x - 0.5) * 2.0;
    float along = vUv.y;
    float core = 1.0 - smoothstep(0.0, 1.0, across);
    core = pow(core, 1.8);
    // taper: thin at the top, fullest just past the middle
    float taper = smoothstep(0.0, 0.22, along) * (1.0 - smoothstep(0.72, 1.0, along));
    float a = core * taper * vAlpha;
    if (a < 0.004) discard;

    vec3 col = mix(uColor, uLitColor, vLit * 0.8);
    // the leading edge of a drop is brighter — surface tension bead
    col += vec3(0.25) * pow(smoothstep(0.55, 0.95, along), 3.0);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── splashes ───────────────────────────────────────────────────────────────

const SPLASH_VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCam;
  uniform float uStorm;

  attribute vec2  aSeed;
  attribute float aScale;

  varying float vLife;
  varying vec2  vUv;
  varying float vSeed;

  void main() {
    vUv = position.xy + 0.5;
    vSeed = aSeed.x;

    // Splashes live on the ground plane, scattered across the roadway
    // and sidewalks around the walker.
    float spread = 22.0;
    float x = (aSeed.x - 0.5) * 2.0 * spread;
    float z = (aSeed.y - 0.5) * 2.0 * spread;

    // Each splash has its own rapid cycle — a burst, then nothing.
    float rate = 1.6 + fract(aSeed.x * 13.7) * 2.2;
    float phase = fract(aSeed.y * 9.13);
    float life = fract(uTime * rate * (0.6 + uStorm * 0.8) + phase);
    vLife = life;

    // the burst rises then falls back
    float rise = sin(life * 3.14159) * 0.32 * (0.5 + uStorm * 0.7);

    vec3 world = vec3(uCam.x + x, rise, uCam.z + z);

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float size = aScale * (0.35 + life * 0.9) * (0.6 + uStorm * 0.6);
    mv.xy += position.xy * size;
    gl_Position = projectionMatrix * mv;
  }
`;

const SPLASH_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uBolt;
  varying float vLife;
  varying vec2 vUv;
  varying float vSeed;

  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    // a crown of droplets, not a disc
    float ang = atan(c.y, c.x);
    float spokes = 0.5 + 0.5 * sin(ang * (5.0 + floor(vSeed * 4.0)) + vSeed * 20.0);
    float ring = smoothstep(0.35, 0.62, r) * (1.0 - smoothstep(0.62, 1.0, r));
    float a = ring * (0.45 + spokes * 0.75);
    // fade in fast, out slow
    a *= smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.35, 1.0, vLife));
    if (a < 0.004) discard;
    vec3 col = uColor + vec3(0.3, 0.4, 0.5) * uBolt;
    gl_FragColor = vec4(col, a * 0.5);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── puddle ripples ─────────────────────────────────────────────────────────

const RIPPLE_VERT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uStorm;
  uniform float uRoadHalf;
  attribute vec2 aSeed;
  attribute float aScale;
  varying float vLife;
  varying vec2 vUv;
  varying float vSeed;

  void main() {
    vUv = position.xy + 0.5;
    vSeed = aSeed.x;
    float spread = 18.0;
    // ripples only make sense on the carriageway, where the water pools
    float x = (aSeed.x - 0.5) * 2.0 * uRoadHalf;
    float z = (aSeed.y - 0.5) * 2.0 * spread;

    float rate = 0.5 + fract(aSeed.y * 7.7) * 0.8;
    float life = fract(uTime * rate * (0.7 + uStorm * 0.6) + fract(aSeed.x * 5.3));
    vLife = life;

    vec3 world = vec3(uCam.x + x, 0.012, uCam.z + z);

    // ripples lie flat on the road: build the quad in world XZ
    float size = aScale * (0.15 + life * 1.5);
    vec4 wp = vec4(world, 1.0);
    wp.x += position.x * size;
    wp.z += position.y * size;
    gl_Position = projectionMatrix * modelViewMatrix * wp;
  }
`;

const RIPPLE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uBolt;
  varying float vLife;
  varying vec2 vUv;
  varying float vSeed;

  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;
    // two concentric rings chasing outward
    float ring1 = 1.0 - abs(r - 0.86) * 9.0;
    float ring2 = 1.0 - abs(r - 0.62) * 13.0;
    float a = max(ring1, ring2 * 0.55);
    a = max(a, 0.0);
    a *= (1.0 - vLife) * (1.0 - vLife);
    a *= smoothstep(0.0, 0.08, vLife);
    if (a < 0.004) discard;
    vec3 col = uColor * (0.6 + uBolt * 1.6);
    gl_FragColor = vec4(col, a * 0.32);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── builder ────────────────────────────────────────────────────────────────

function quadGeometry(count: number, scaleRange: [number, number], seedBase: number) {
  const geo = new THREE.InstancedBufferGeometry();
  const quad = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
  geo.setAttribute("position", new THREE.BufferAttribute(quad, 3));
  geo.setIndex([0, 1, 2, 0, 2, 3]);

  const seeds = new Float32Array(count * 2);
  const depths = new Float32Array(count);
  const scales = new Float32Array(count);
  // deterministic scatter
  let s = seedBase;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < count; i++) {
    seeds[i * 2] = rnd();
    seeds[i * 2 + 1] = rnd();
    depths[i] = Math.pow(rnd(), 0.7);
    scales[i] = scaleRange[0] + rnd() * (scaleRange[1] - scaleRange[0]);
  }
  geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 2));
  geo.setAttribute("aDepth", new THREE.InstancedBufferAttribute(depths, 1));
  geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
  geo.instanceCount = count;
  return geo;
}

export default function Rain({ quality }: { quality: Quality }) {
  const systems = useMemo(() => {
    const shared = {
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uStorm: { value: 0 },
      uVelocity: { value: 0 },
      uBolt: { value: 0 },
    };

    const dropMat = new THREE.ShaderMaterial({
      vertexShader: DROP_VERT,
      fragmentShader: DROP_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        ...shared,
        uColor: { value: new THREE.Color("#7d9fd0").multiplyScalar(0.55) },
        uLitColor: { value: new THREE.Color("#dbeaff") },
      },
    });
    const dropGeo = quadGeometry(quality.rainDrops, [0.5, 1.5], 20260825);
    const drops = new THREE.Mesh(dropGeo, dropMat);
    drops.frustumCulled = false;
    drops.renderOrder = 6;

    let splashes: THREE.Mesh | null = null;
    let splashMat: THREE.ShaderMaterial | null = null;
    let ripples: THREE.Mesh | null = null;
    let rippleMat: THREE.ShaderMaterial | null = null;

    if (quality.splashes > 0) {
      splashMat = new THREE.ShaderMaterial({
        vertexShader: SPLASH_VERT,
        fragmentShader: SPLASH_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          ...shared,
          uColor: { value: new THREE.Color("#9dbde8").multiplyScalar(0.5) },
        },
      });
      const g = quadGeometry(quality.splashes, [0.1, 0.28], 771131);
      splashes = new THREE.Mesh(g, splashMat);
      splashes.frustumCulled = false;
      splashes.renderOrder = 7;

      rippleMat = new THREE.ShaderMaterial({
        vertexShader: RIPPLE_VERT,
        fragmentShader: RIPPLE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          ...shared,
          uColor: { value: new THREE.Color("#8fb4e0") },
          uRoadHalf: { value: ROAD_HALF },
        },
      });
      const rg = quadGeometry(Math.round(quality.splashes * 0.5), [0.3, 1.1], 424242);
      ripples = new THREE.Mesh(rg, rippleMat);
      ripples.frustumCulled = false;
      ripples.renderOrder = 5;
    }

    return { drops, dropMat, splashes, splashMat, ripples, rippleMat, shared };
  }, [quality.rainDrops, quality.splashes]);

  useEffect(
    () => () => {
      systems.drops.geometry.dispose();
      systems.dropMat.dispose();
      systems.splashes?.geometry.dispose();
      systems.splashMat?.dispose();
      systems.ripples?.geometry.dispose();
      systems.rippleMat?.dispose();
    },
    [systems]
  );

  useFrame(({ camera }) => {
    // one shared uniform object — written once, read by all three systems
    const u = systems.shared;
    u.uTime.value = journey.time;
    u.uCam.value.copy(camera.position);
    u.uStorm.value = journey.storm;
    u.uVelocity.value = journey.velocity;
    u.uBolt.value = journey.bolt;
  });

  return (
    <>
      <primitive object={systems.drops} />
      {systems.splashes && <primitive object={systems.splashes} />}
      {systems.ripples && <primitive object={systems.ripples} />}
    </>
  );
}
