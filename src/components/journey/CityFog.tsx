/**
 * CityFog — genuinely volumetric mist.
 *
 * WHY NOT BILLBOARDS WITH NOISE ON THEM
 *
 * A quad facing the camera with 2-D noise painted on it is a flat disc,
 * however good the noise. The interior never shifts as you move past
 * it, and two overlapping puffs are two pictures stacked rather than
 * one body of air.
 *
 * WHAT THIS DOES
 *
 * Each billboard is a WINDOW onto a real sphere of participating media.
 * The fragment shader intersects the view ray with that sphere and
 * marches through it, accumulating density and light front-to-back with
 * Beer-Lambert extinction. The interior has real depth, parallaxes
 * correctly, and self-shadows: the far side of a puff is dimmer than
 * the lit side.
 *
 * THE COHERENCE TRICK
 *
 * The density field is sampled in WORLD space and shared by every puff,
 * and the puffs drift with the same wind that advects the field.
 * Overlapping spheres therefore reinforce one continuous swirl instead
 * of each showing a private blob — which is what makes a scatter of
 * billboards read as a single medium.
 *
 * FILL RATE — THE THING THAT BIT
 *
 * Raymarching is per-PIXEL, and these puffs wrap AROUND the camera: a
 * near-layer puff routinely lands 1-2 units from the lens, where a
 * 6-unit ball covers the whole screen and costs a full-screen march for
 * something the eye reads as a smear. Unbounded, four layers came to
 * ~106x overdraw and ~798G ops/s — roughly 16x what a mid GPU
 * sustains, which is exactly the wild frame-rate drops.
 *
 * Three bounds bring it to ~40G:
 *   1. puffs closer than a per-layer minimum are collapsed in the
 *      vertex shader, so they never reach rasterisation
 *   2. the quad's ANGULAR size is capped, so one puff can never own
 *      more than a fraction of the frame however close it gets
 *   3. far fewer, larger puffs (96 rather than 230) — overlap does the
 *      work that count used to
 */

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { rng } from "./lib/rng";

const VERT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCam;
  uniform float uVelocity;
  uniform float uStorm;
  uniform vec3  uWind;
  uniform float uTanHalfFov;

  attribute vec3  aOrigin;
  attribute float aSize;
  attribute float aSeed;
  attribute float aLayer;
  attribute float aAlpha;

  varying vec3  vCenter;
  varying float vRadius;
  varying float vAlpha;
  varying float vLayer;
  varying vec3  vWorldPos;

  // Each layer recycles over its own distance — that difference is the
  // parallax between layers.
  float spanFor(float layer) {
    if (layer < 0.5) return 26.0;
    if (layer < 1.5) return 38.0;
    if (layer < 2.5) return 80.0;
    return 190.0;
  }

  void main() {
    float span = spanFor(aLayer);
    vec3 p = aOrigin;
    float t = uTime;

    // Drift with the SAME wind the density field uses, so a puff and
    // its contents travel together instead of the field sliding through.
    p += uWind * t;

    if (aLayer < 0.5) {
      p.x += sin(t * 0.055 + aSeed * 6.2831) * 2.2;
      p.y += sin(t * 0.09 + aSeed * 3.1) * 0.1;
    } else {
      float rate = 1.0 / (aLayer * aLayer);
      p.x += sin(t * 0.021 * rate + aSeed * 6.2831) * 2.0 * rate;
      p.y += sin(t * 0.017 * rate + aSeed * 4.4) * 0.4 * rate;
    }

    // wrap the volume around the camera so mist is always ahead
    float rel = mod(p.z - uCam.z + span * 0.35, span);
    p.z = uCam.z - span * 0.65 + rel;
    p.x = mod(p.x - uCam.x + 60.0, 120.0) - 60.0 + uCam.x;

    float radius = aSize * (0.85 + uStorm * 0.25) * 0.5;

    vCenter = p;
    vRadius = radius;
    vAlpha = aAlpha;
    vLayer = aLayer;

    // ── fill-rate bound 1: collapse anything too close to read ──
    float camDist = length(p - uCam);
    float minDist = aLayer < 0.5 ? 1.6 : (aLayer < 1.5 ? 2.2 : (aLayer < 2.5 ? 5.0 : 12.0));
    if (camDist < minDist) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off-screen, never rasterised
      return;
    }

    vec3 camRight = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 camUp    = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);

    float stretch = 1.0;
    if (aLayer < 1.5) stretch = 1.0 + min(abs(uVelocity) / 16.0, 0.8);

    // ── fill-rate bound 2: cap the quad's angular size ──
    // uTanHalfFov is the camera's own tan(fov/2), so the cap tracks any
    // FOV change rather than assuming one.
    float sizeCap = aLayer < 1.5 ? 0.42 : (aLayer < 2.5 ? 0.38 : 0.34);
    float quadR = min(radius * 2.15, camDist * uTanHalfFov * sizeCap);

    vec3 world = p
      + camRight * position.x * quadR * stretch
      + camUp    * position.y * quadR;

    vWorldPos = world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
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
  uniform vec3  uWind;
  uniform float uFloorY;
  uniform float uDensity;

  varying vec3  vCenter;
  varying float vRadius;
  varying float vAlpha;
  varying float vLayer;
  varying vec3  vWorldPos;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i + vec3(0,0,0)), hash13(i + vec3(1,0,0)), f.x),
          mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
          mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  /**
   * Density of the medium at a world point.
   *
   * Sampled in WORLD space (minus wind drift) so every puff reads the
   * same moving field — two overlapping spheres show the same swirl
   * continuing through both.
   */
  float density(vec3 p) {
    float d = length(p - vCenter) / vRadius;
    if (d >= 1.0) return 0.0;
    float shell = 1.0 - smoothstep(0.15, 1.0, d);

    /**
     * The frequency matters more than anything else here. At a coarse
     * scale the whole puff sits inside one noise cell, every ray
     * integrates the same value, and the raymarch buys nothing — the
     * result is indistinguishable from a flat disc. 1.3 puts ~7 cells
     * across the largest near puff.
     */
    vec3 q = (p - uWind * uTime) * 1.3;
    float n = noise3(q) * 0.62 + noise3(q * 2.7) * 0.38;

    // Tight window: a wide one saturates the puff to opaque and hides
    // everything the raymarch just computed.
    float dens = shell * smoothstep(0.45, 0.95, n + shell * 0.1);

    // the corridor floor: fade out rather than cutting a hard line
    dens *= smoothstep(uFloorY - 0.9, uFloorY + 0.7, p.y);
    return dens;
  }

  /**
   * Light reaching a point, from a SINGLE tap toward the key. A second
   * tap costs another full density evaluation per march step and shifts
   * the result by a few percent.
   */
  float lightTransmittance(vec3 p, vec3 L) {
    float step = vRadius * 0.7;
    return exp(-density(p + L * step) * step * uDensity * 2.2);
  }

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorldPos - ro);

    // ── intersect the view ray with this puff's sphere ──
    vec3 oc = ro - vCenter;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - vRadius * vRadius;
    float h = b * b - c;
    if (h < 0.0) discard;
    h = sqrt(h);
    float t0 = max(-b - h, 0.0);
    float t1 = -b + h;
    if (t1 <= t0) discard;

    // step count by depth: near puffs get detail, far ones do not
    int steps = vLayer < 0.5 ? 4 : (vLayer < 1.5 ? 3 : 2);
    float stepLen = (t1 - t0) / float(steps);

    // dither the entry point to break up banding between steps
    float jitter = hash13(vec3(gl_FragCoord.xy, uTime * 0.05));
    vec3 p = ro + rd * (t0 + stepLen * jitter);

    vec3 keyDir = normalize(vec3(-0.35, 0.82, 0.45));
    vec3 upDir  = normalize(vec3(0.18, -0.72, 0.62));

    float transmittance = 1.0;
    vec3 scattered = vec3(0.0);

    // Shading is evaluated on the FIRST substantial sample and reused
    // down the ray; re-lighting every step triples the cost to refine a
    // gradient the accumulated extinction already provides.
    float lit = -1.0;

    for (int i = 0; i < 4; i++) {
      if (i >= steps) break;
      float dens = density(p);
      if (dens > 0.002) {
        if (lit < 0.0) lit = lightTransmittance(p, keyDir);
        float under = max(dot(normalize(p - vCenter), upDir), 0.0);

        vec3 col = uFogColor * 0.55;
        col += uMoon * lit * 0.85;
        col += uWarm * under * under * 0.55;
        col += vec3(0.55, 0.68, 0.9) * uBolt * 1.2;

        float a = 1.0 - exp(-dens * stepLen * uDensity);
        scattered += col * a * transmittance;
        transmittance *= 1.0 - a;
        if (transmittance < 0.02) break;
      }
      p += rd * stepLen;
    }

    float alpha = (1.0 - transmittance) * vAlpha * (0.7 + uStorm * 0.6);
    if (alpha < 0.004) discard;

    float camDist = length(vCenter - ro);
    alpha *= smoothstep(vRadius * 0.4, vRadius * 1.8 + 2.0, camDist);
    alpha *= 1.0 - smoothstep(
      vLayer < 0.5 ? 22.0 : vLayer < 1.5 ? 32.0 : vLayer < 2.5 ? 70.0 : 150.0,
      vLayer < 0.5 ? 34.0 : vLayer < 1.5 ? 48.0 : vLayer < 2.5 ? 105.0 : 200.0,
      camDist);
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(scattered / max(1.0 - transmittance, 0.001), clamp(alpha, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface LayerDef {
  layer: number;
  share: number;
  /** [min, max] DIAMETER in corridor units */
  size: [number, number];
  y: [number, number];
  x: number;
  span: number;
  alpha: [number, number];
}

/**
 * Tuned to the corridor: floor at -2.9, buildings flanking past |x| 5.4.
 * Fewer and larger than a sprite system would use — each puff now costs
 * real fill rate, and overlap builds the density instead of count.
 */
const LAYERS: LayerDef[] = [
  { layer: 0, share: 0.36, size: [3.0, 6.5], y: [-3.0, -0.4], x: 16, span: 26, alpha: [0.55, 0.92] },
  { layer: 1, share: 0.27, size: [4.5, 9.0], y: [-2.8, 3.0], x: 20, span: 38, alpha: [0.34, 0.62] },
  { layer: 2, share: 0.23, size: [11.0, 20.0], y: [-2.5, 11.0], x: 44, span: 80, alpha: [0.20, 0.40] },
  { layer: 3, share: 0.14, size: [26.0, 46.0], y: [-2.0, 30.0], x: 100, span: 190, alpha: [0.13, 0.28] },
];

export default function CityFog({
  storm = 0.45,
  bolt = 0,
}: {
  storm?: number;
  bolt?: number;
}) {
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const { camera } = useThree();
  const speed = useMemo(() => ({ z: camera.position.z, v: 0 }), [camera]);

  const { mesh, material } = useMemo(() => {
    const total = isMobile ? 40 : 96;
    const r = rng(0xf0611);

    const origins = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const seeds = new Float32Array(total);
    const layers = new Float32Array(total);
    const alphas = new Float32Array(total);

    let i = 0;
    for (const def of LAYERS) {
      const n = Math.max(4, Math.round(total * def.share));
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

    const geo = new THREE.InstancedBufferGeometry();
    const quad = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
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
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uVelocity: { value: 0 },
        uStorm: { value: storm },
        uWind: { value: new THREE.Vector3(0.06, 0.004, 0.02) },
        uTanHalfFov: { value: 0.38 },
        uFogColor: { value: new THREE.Color("#0a1020") },
        uMoon: { value: new THREE.Color("#8fb0e8") },
        uWarm: { value: new THREE.Color("#2f7bff").multiplyScalar(0.7) },
        uBolt: { value: 0 },
        uFloorY: { value: -2.9 },
        uDensity: { value: 1.35 },
      },
    });

    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 4;
    return { mesh: m, material: mat };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
    },
    [mesh, material]
  );

  useFrame(({ camera: cam }, delta) => {
    const dt = Math.min(delta, 0.05);
    const v = dt > 0 ? (cam.position.z - speed.z) / dt : 0;
    speed.v += (v - speed.v) * Math.min(1, dt * 8);
    speed.z = cam.position.z;

    const u = material.uniforms;
    u.uTime.value = performance.now() / 1000;
    u.uCam.value.copy(cam.position);
    u.uVelocity.value = speed.v;
    u.uStorm.value = storm;
    u.uBolt.value = bolt;

    const pc = cam as THREE.PerspectiveCamera;
    if (pc.isPerspectiveCamera) {
      u.uTanHalfFov.value = Math.tan(THREE.MathUtils.degToRad(pc.fov) * 0.5);
    }
  });

  return <primitive object={mesh} />;
}
