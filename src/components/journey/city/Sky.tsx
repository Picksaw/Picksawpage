/**
 * Sky — the thing the city is silhouetted against.
 *
 * WHY THIS EXISTS
 *
 * The canvas is created with `alpha: false` and the scene had no
 * `background`. A CSS background on the <canvas> element is invisible
 * behind an opaque drawing buffer, and EffectComposer's RenderPass
 * clears using `scene.background` — which was null. So every pixel not
 * covered by geometry was never written: undefined framebuffer content,
 * which reads as black with noise and tearing.
 *
 * Fog cannot fix that. `FogExp2` only tints fragments that are actually
 * rasterised, so it colours the buildings and leaves the sky untouched.
 * Above the rooftops there is no geometry at all, and that is most of
 * the upper frame on a street of mid-rise buildings.
 *
 * This is a proper sky instead of a flat clear colour: a gradient that
 * matches the fog at the horizon (so buildings dissolve into it rather
 * than ending against a different colour), darkening with altitude,
 * with slow storm-cloud structure and full lightning response.
 *
 * Implemented as an inverted sphere on the camera, drawn first with
 * depth writes off. One draw call, no depth cost, and it guarantees
 * every pixel is written every frame.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import { gradeAt } from "../lib/palette";

const VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    // direction from the camera through this vertex, in world space
    vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
    // project at the far plane: w = z forces depth 1 after divide
    vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uHorizon;
  uniform vec3  uZenith;
  uniform float uTime;
  uniform float uBolt;
  uniform vec3  uBoltColor;
  uniform float uStorm;

  varying vec3 vDir;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.11; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);

    // ── the gradient ──
    // Matched to the fog at the horizon so buildings dissolve into the
    // sky instead of ending against a seam.
    float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
    float t = pow(smoothstep(0.46, 0.95, h), 0.8);
    vec3 col = mix(uHorizon, uZenith, t);

    // below the horizon the world is darker still (ground haze)
    col = mix(col * 0.62, col, smoothstep(0.42, 0.52, h));

    // ── storm cloud structure ──
    // Projected onto the dome so it scrolls without swimming. Only
    // visible above the horizon, and only as tonal variation.
    if (d.y > -0.05) {
      vec2 uv = d.xz / max(d.y + 0.35, 0.12);
      float clouds = fbm(uv * 1.6 + vec2(uTime * 0.006, uTime * 0.004));
      clouds = clouds * 0.65 + fbm(uv * 4.2 - uTime * 0.009) * 0.35;
      // heavier weather = more contrast in the cloudbase
      float amt = (0.10 + uStorm * 0.16) * smoothstep(-0.05, 0.35, d.y);
      col *= 1.0 - amt * (1.0 - clouds);
      col += uZenith * amt * 0.35 * clouds;
    }

    // ── lightning ──
    // The cloudbase lights from within: brightest low in the sky, where
    // the strike is, falling off toward the zenith.
    float boltFalloff = 1.0 - smoothstep(0.0, 0.75, h);
    col += uBoltColor * uBolt * (0.35 + boltFalloff * 0.9);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function Sky() {
  const { mesh, material } = useMemo(() => {
    // inverted sphere: we are inside it, so render the back faces
    const geo = new THREE.SphereGeometry(1, 32, 20);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      uniforms: {
        uHorizon: { value: new THREE.Color("#0a1020") },
        uZenith: { value: new THREE.Color("#05070f") },
        uTime: { value: 0 },
        uBolt: { value: 0 },
        uBoltColor: { value: new THREE.Color("#9fc0ff") },
        uStorm: { value: 0 },
      },
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    // first thing drawn, so every pixel is written before anything else
    m.renderOrder = -1000;
    return { mesh: m, material: mat };
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
    },
    [mesh, material]
  );

  useFrame(({ camera }) => {
    // the dome travels with the eye — it has no position of its own
    mesh.position.copy(camera.position);

    const u = material.uniforms;
    const grade = gradeAt(journey.progress, journey.bolt);
    // horizon EXACTLY matches the scene fog, so there is never a seam
    u.uHorizon.value.copy(grade.fog);
    // zenith is the same hue, considerably darker
    u.uZenith.value.copy(grade.fog).multiplyScalar(0.38);
    u.uTime.value = journey.time;
    u.uBolt.value = journey.bolt;
    u.uStorm.value = journey.storm;
  });

  return <primitive object={mesh} />;
}
