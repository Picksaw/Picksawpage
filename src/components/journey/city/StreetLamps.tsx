/**
 * StreetLamps — the posts, their heads, and the volumetric cones.
 *
 * Geometry is instanced (post, arm, head) so the whole run of lamps
 * down the district is three draw calls. The volumetric cone is a
 * separate instanced batch using a raymarch-free analytic approximation:
 * the fragment shader integrates a cone's density along the view ray in
 * closed form, so a convincing light shaft costs one transparent quad
 * per lamp instead of a volume texture.
 *
 * The cones respond to everything: rain intensity thickens them,
 * lightning washes them out, and each one flickers on its own sodium
 * rhythm — matched to the real point light in Lighting.tsx so the shaft
 * and the pool of light on the pavement always agree.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildLamps } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

const CONE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aS;

  varying vec3 vColor;
  varying float vSeed;
  varying float vS;
  varying vec3 vLocal;
  varying vec3 vViewDir;
  varying float vHeight;

  void main() {
    vColor = aColor;
    vSeed = aSeed;
    vS = aS;
    vLocal = position;
    vHeight = position.y;

    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    vViewDir = world.xyz - cameraPosition;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CONE_FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uBolt;
  uniform float uStorm;
  uniform float uCamS;
  uniform float uDensity;

  varying vec3 vColor;
  varying float vSeed;
  varying float vS;
  varying vec3 vLocal;
  varying vec3 vViewDir;
  varying float vHeight;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  // cheap 3-D value noise for the dust motes drifting inside the shaft
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = i.x + i.y * 57.0 + i.z * 113.0;
    return mix(
      mix(mix(hash(n), hash(n + 1.0), f.x), mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
      mix(mix(hash(n + 113.0), hash(n + 114.0), f.x), mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y),
      f.z
    );
  }

  void main() {
    // The cone mesh is a unit cone: apex at y=1, base at y=0.
    // Radial falloff — the shaft is dense at its axis, feathered at the edge.
    float r = length(vLocal.xz) / max(mix(1.0, 0.06, vHeight), 0.02);
    float radial = 1.0 - smoothstep(0.25, 1.0, r);
    radial = pow(radial, 1.6);

    // Vertical: brightest at the lamp head, fading toward the ground,
    // and softly capped where it meets the pavement.
    float vert = pow(vHeight, 1.25) * (0.35 + 0.65 * smoothstep(0.0, 0.22, vHeight));

    // Drifting mist inside the beam — this is what sells "volumetric".
    vec3 np = vLocal * vec3(1.6, 0.7, 1.6);
    np.y -= uTime * 0.22;
    np.x += sin(uTime * 0.31 + vSeed * 6.28) * 0.35;
    float mist = noise3(np * 2.2 + vSeed * 13.0) * 0.55 + noise3(np * 5.5) * 0.45;
    mist = 0.55 + 0.75 * mist;

    // Grazing rays scatter more — a beam seen edge-on is brighter.
    float graze = 1.0 - abs(normalize(vViewDir).y);
    float scatter = 0.55 + 0.65 * graze;

    // Sodium flicker, matched to the point light's rhythm in Lighting.tsx
    float flick = 0.94
      + 0.06 * sin(uTime * (7.0 + mod(vSeed * 97.0, 5.0)) + vSeed * 31.0)
      + 0.02 * sin(uTime * 23.7 + vSeed * 3.1);

    // Rain thickens the air; lightning momentarily overpowers the lamp.
    float density = uDensity * (0.75 + uStorm * 0.65) * (1.0 - uBolt * 0.55);

    float a = radial * vert * mist * scatter * flick * density;

    // Fade the whole shaft out behind and far ahead of the walker so
    // there is never a wall of cones stacking up in the distance.
    float ds = vS - uCamS;
    a *= smoothstep(-30.0, -14.0, ds) * (1.0 - smoothstep(52.0, 88.0, ds));

    if (a < 0.003) discard;

    vec3 col = vColor * (0.75 + 0.5 * mist);
    col += vec3(0.35, 0.45, 0.6) * uBolt * 0.4;

    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function StreetLamps({ quality }: { quality: Quality }) {
  const lamps = useMemo(() => buildLamps(), []);

  // ── posts / arms / heads: instanced hard geometry ──
  const hardware = useMemo(() => {
    const postGeo = new THREE.CylinderGeometry(0.075, 0.11, 1, 6);
    const armGeo = new THREE.BoxGeometry(1, 0.08, 0.08);
    const headGeo = new THREE.BoxGeometry(0.52, 0.16, 0.3);

    const metal = new THREE.MeshStandardMaterial({
      color: "#14171d",
      roughness: 0.44,
      metalness: 0.82,
      envMapIntensity: 0.9,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: "#1a1206",
      roughness: 0.22,
      metalness: 0.1,
      emissive: new THREE.Color("#ffb46a"),
      emissiveIntensity: 3.2,
      toneMapped: true,
    });

    const posts = new THREE.InstancedMesh(postGeo, metal, lamps.length);
    const arms = new THREE.InstancedMesh(armGeo, metal, lamps.length);
    const heads = new THREE.InstancedMesh(headGeo, glassMat, lamps.length);
    posts.castShadow = quality.shadows;
    arms.castShadow = quality.shadows;
    [posts, arms, heads].forEach((m) => {
      m.frustumCulled = false;
    });

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const headColors = new Float32Array(lamps.length * 3);
    const col = new THREE.Color();

    lamps.forEach((lamp, i) => {
      e.set(0, lamp.rotY, 0);
      q.setFromEuler(e);

      // post
      p.set(lamp.x, lamp.y + lamp.height * 0.5, lamp.z);
      s.set(1, lamp.height, 1);
      m4.compose(p, q, s);
      posts.setMatrixAt(i, m4);

      // arm reaches out over the roadway
      const reach = 1.5;
      const dirX = -lamp.side * Math.cos(lamp.rotY);
      const dirZ = -lamp.side * Math.sin(lamp.rotY);
      p.set(
        lamp.x + dirX * reach * 0.5,
        lamp.y + lamp.height - 0.12,
        lamp.z + dirZ * reach * 0.5
      );
      e.set(0, lamp.rotY + (lamp.side > 0 ? Math.PI / 2 : -Math.PI / 2), 0);
      q.setFromEuler(e);
      s.set(reach, 1, 1);
      m4.compose(p, q, s);
      arms.setMatrixAt(i, m4);

      // head
      p.set(lamp.x + dirX * reach, lamp.y + lamp.height - 0.28, lamp.z + dirZ * reach);
      s.set(1, 1, 1);
      m4.compose(p, q, s);
      heads.setMatrixAt(i, m4);

      col.set(lamp.color);
      headColors[i * 3] = col.r;
      headColors[i * 3 + 1] = col.g;
      headColors[i * 3 + 2] = col.b;
    });

    posts.instanceMatrix.needsUpdate = true;
    arms.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    heads.instanceColor = new THREE.InstancedBufferAttribute(headColors, 3);

    return { posts, arms, heads, metal, glassMat, postGeo, armGeo, headGeo };
  }, [lamps, quality.shadows]);

  // ── volumetric cones ──
  const cones = useMemo(() => {
    if (!quality.volumetricCones) return null;
    // unit cone, apex up: three's cone has apex at +y when height=1
    const geo = new THREE.ConeGeometry(1, 1, 18, 6, true);
    // shift so base sits at y=0 and apex at y=1, then flip radius
    geo.translate(0, 0.5, 0);
    geo.rotateX(Math.PI); // apex down → we want wide at the ground
    geo.translate(0, 1, 0);

    const colors = new Float32Array(lamps.length * 3);
    const seeds = new Float32Array(lamps.length);
    const sPos = new Float32Array(lamps.length);
    const col = new THREE.Color();

    const mat = new THREE.ShaderMaterial({
      vertexShader: CONE_VERT,
      fragmentShader: CONE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uBolt: { value: 0 },
        uStorm: { value: 0 },
        uCamS: { value: 0 },
        uDensity: { value: quality.tier === "high" ? 0.5 : 0.42 },
      },
    });

    const mesh = new THREE.InstancedMesh(geo, mat, lamps.length);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();

    lamps.forEach((lamp, i) => {
      const reach = 1.5;
      const dirX = -lamp.side * Math.cos(lamp.rotY);
      const dirZ = -lamp.side * Math.sin(lamp.rotY);
      // cone hangs from the head down to the pavement, splaying out
      p.set(lamp.x + dirX * reach, lamp.y, lamp.z + dirZ * reach);
      e.set(0, lamp.rotY, 0);
      q.setFromEuler(e);
      const spread = 3.4;
      sc.set(spread, lamp.height - 0.3, spread);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);

      col.set(lamp.color);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      seeds[i] = (lamp.seed % 1000) / 1000;
      sPos[i] = lamp.s;
    });
    mesh.instanceMatrix.needsUpdate = true;

    geo.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geo.setAttribute("aS", new THREE.InstancedBufferAttribute(sPos, 1));

    return { mesh, mat, geo };
  }, [lamps, quality.volumetricCones, quality.tier]);

  useEffect(
    () => () => {
      hardware.postGeo.dispose();
      hardware.armGeo.dispose();
      hardware.headGeo.dispose();
      hardware.metal.dispose();
      hardware.glassMat.dispose();
      cones?.geo.dispose();
      cones?.mat.dispose();
    },
    [hardware, cones]
  );

  const flickerRef = useRef(0);

  useFrame(() => {
    if (cones) {
      cones.mat.uniforms.uTime.value = journey.time;
      cones.mat.uniforms.uBolt.value = journey.bolt;
      cones.mat.uniforms.uStorm.value = journey.storm;
      cones.mat.uniforms.uCamS.value = journey.s;
    }
    // lamp heads pulse with the same sodium rhythm as their light
    flickerRef.current = 0.94 + 0.06 * Math.sin(journey.time * 7.3);
    hardware.glassMat.emissiveIntensity =
      (3.2 + journey.storm * 0.8) * flickerRef.current * (1 - journey.bolt * 0.35);
  });

  return (
    <>
      <primitive object={hardware.posts} />
      <primitive object={hardware.arms} />
      <primitive object={hardware.heads} />
      {cones && <primitive object={cones.mesh} />}
    </>
  );
}
