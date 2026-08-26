/**
 * LensWater — rain on the camera itself.
 *
 * A single full-screen quad drawn last, in front of everything. Water
 * beads and runs down the lens; the effect is nearly invisible in
 * normal conditions and blooms into view during lightning, when a wet
 * lens is exactly what would catch the flash.
 *
 * Deliberately restrained: this is a garnish that sells "a camera is
 * physically present in this storm", not a wet-glass filter over the
 * whole experience. Peak opacity is tied to `uBolt`, so it only really
 * appears for the fraction of a second a bolt lasts.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // already in clip space — this quad never moves
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uBolt;
  uniform float uStorm;
  uniform float uVelocity;
  uniform float uAspect;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // one column of running water
  float runnel(vec2 uv, float seed, float speed) {
    float x = hash(vec2(seed, 1.0));
    float w = 0.004 + hash(vec2(seed, 2.0)) * 0.012;
    float dx = abs(uv.x - x);
    if (dx > w * 3.0) return 0.0;

    // the bead's head slides down, leaving a thinning trail
    float head = fract(hash(vec2(seed, 3.0)) + uTime * speed * (0.15 + hash(vec2(seed, 4.0)) * 0.25));
    float trail = smoothstep(head, head - 0.34, uv.y);
    float body = 1.0 - smoothstep(0.0, w, dx);
    // the head is fatter than the trail
    float headBlob = (1.0 - smoothstep(0.0, w * 2.4, dx)) *
                     (1.0 - smoothstep(0.0, 0.035, abs(uv.y - head)));
    return body * trail * 0.5 + headBlob;
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= uAspect;

    float water = 0.0;
    // a handful of runnels — more when the storm is heavy
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      water += runnel(uv, fi * 13.7, 1.0 + fi * 0.2);
    }
    // scattered static beads clinging to the glass
    vec2 cell = floor(uv * vec2(22.0, 14.0));
    float bead = hash(cell);
    if (bead > 0.93) {
      vec2 f = fract(uv * vec2(22.0, 14.0)) - 0.5;
      float d = length(f * vec2(1.0, 1.4));
      water += (1.0 - smoothstep(0.05, 0.28, d)) * 0.5;
    }

    // Only really visible when a bolt lights the wet glass, or when the
    // camera is moving fast enough to be driving into the rain.
    float motion = min(abs(uVelocity) / 40.0, 1.0);
    float amount = uBolt * 0.85 + motion * uStorm * 0.12;
    float a = clamp(water, 0.0, 1.0) * amount * 0.5;
    if (a < 0.003) discard;

    // water is achromatic and slightly cool; the bolt tints it icy
    vec3 col = mix(vec3(0.62, 0.72, 0.86), vec3(0.9, 0.96, 1.0), uBolt);
    gl_FragColor = vec4(col, a);
    // this quad is part of the scene pass, so it must tone map with
    // everything else or it will read hotter than the frame behind it
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function LensWater({ quality }: { quality: Quality }) {
  const { mesh, material } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBolt: { value: 0 },
        uStorm: { value: 0 },
        uVelocity: { value: 0 },
        uAspect: { value: 1 },
      },
    });
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 999;
    return { mesh: m, material: mat };
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
    },
    [mesh, material]
  );

  useFrame(({ size }) => {
    const u = material.uniforms;
    u.uTime.value = journey.time;
    u.uBolt.value = journey.bolt;
    u.uStorm.value = journey.storm;
    u.uVelocity.value = journey.velocity;
    u.uAspect.value = size.width / Math.max(size.height, 1);
    // skip the draw entirely when there is nothing to show
    mesh.visible = journey.bolt > 0.01 || Math.abs(journey.velocity) > 8;
  });

  if (quality.simplified) return null;
  return <primitive object={mesh} />;
}
