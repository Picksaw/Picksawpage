import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * GroundFog — true volumetric-FEELING mist via spherical impostors.
 *
 * Every particle is shaded like a 3D ball: a fake sphere normal is
 * reconstructed inside the point sprite, diffused against a light
 * direction, and alpha falls off toward the silhouette — so each puff
 * reads as a rounded volume of mist, never a flat image. Three baked
 * shape variants (soft ball / irregular blob / wisp) live in a texture
 * atlas and each particle picks one, its own size, alpha, rotation and
 * drift. All motion + wrapping runs in the vertex shader: one draw
 * call, zero CPU cost.
 */

/** 3-tile atlas: [0] soft ball, [1] irregular blob, [2] wisp. */
function makeFogAtlas(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 128;
  const ctx = c.getContext("2d")!;

  const radial = (cx: number, cy: number, r: number, a: number) => {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.5, `rgba(255,255,255,${a * 0.45})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  };

  // tile 0 — clean soft ball
  radial(64, 64, 58, 1);

  // tile 1 — irregular blob: several offset lobes
  let seed = 99;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 6; i++) {
    const a = 0.55 - i * 0.07;
    radial(128 + (rnd() - 0.5) * 44, 64 + (rnd() - 0.5) * 44, 30 + rnd() * 26, a);
  }
  radial(128, 64, 46, 0.85);

  // tile 2 — wisp: elongated soft streak
  const wisp = ctx.createRadialGradient(320, 64, 4, 320, 64, 60);
  wisp.addColorStop(0, "rgba(255,255,255,0.95)");
  wisp.addColorStop(0.55, "rgba(255,255,255,0.35)");
  wisp.addColorStop(1, "rgba(255,255,255,0)");
  ctx.save();
  ctx.translate(320, 64);
  ctx.scale(1.75, 0.42); // stretch horizontally
  ctx.translate(-320, -64);
  ctx.fillStyle = wisp;
  ctx.fillRect(240, 0, 160, 128);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FOG_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uCamZ;
  uniform float uSpan;
  uniform float uScale;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aSeed;
  attribute float aTex;
  varying float vAlpha;
  varying float vRot;
  varying float vTex;
  varying float vDist;
  void main() {
    vec3 p = position;
    // organic drift — two incommensurate frequencies per axis, so no
    // particle ever syncs with another (no visible "pattern")
    p.x += sin(uTime * (0.04 + aSeed * 0.1) + aSeed * 6.2831) * 1.7
         + sin(uTime * 0.013 + aSeed * 9.41) * 0.9;
    p.y += sin(uTime * (0.05 + aSeed * 0.04) + aSeed * 4.1) * 0.32
         + sin(uTime * 0.021 + aSeed * 7.7) * 0.18;
    // wrap along the path: fog fills the street AHEAD of the walker,
    // trailing a little behind, rolling slowly toward the camera
    float rel = mod(p.z - uCamZ - uTime * 0.4 + uSpan, uSpan);
    p.z = uCamZ + (uSpan - 16.0) - rel;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    gl_PointSize = min(aSize * uScale / max(dist, 0.6), 420.0);
    // breathing — each puff swells and fades on its own slow rhythm
    float breath = 0.78 + 0.22 * sin(uTime * (0.22 + aSeed * 0.35) + aSeed * 12.6);
    vAlpha =
      aAlpha *
      breath *
      smoothstep(1.2, 3.2, dist) *
      (1.0 - smoothstep(34.0, 62.0, dist));
    vDist = dist;
    vRot = aSeed * 6.2831 + uTime * (aSeed > 0.5 ? 0.03 : -0.025);
    vTex = aTex;
    gl_Position = projectionMatrix * mv;
  }
`;

const FOG_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying float vRot;
  varying float vTex;
  varying float vDist;

  void main() {
    // rotate the sprite quad per particle
    vec2 c = gl_PointCoord - 0.5;
    float cs = cos(vRot);
    float sn = sin(vRot);
    c = vec2(cs * c.x - sn * c.y, sn * c.x + cs * c.y);

    // sphere-impostor: rebuild a fake 3D normal inside the sprite
    float r2 = dot(c, c) * 4.0; // 0 at center, 1 at silhouette
    if (r2 > 1.0) discard;
    float z = sqrt(1.0 - r2);
    vec3 N = vec3(c.x * 2.0, c.y * 2.0, z);
    // key light — cold moonlight from above-left
    vec3 L1 = normalize(vec3(-0.3, 0.55, 0.78));
    float diff = 0.5 + 0.5 * max(dot(N, L1), 0.0);
    // underglow — the lit windows BELOW shine cyan up into the mist
    vec3 L2 = normalize(vec3(0.18, -0.72, 0.62));
    float under = max(dot(N, L2), 0.0);
    float rim = pow(1.0 - z, 2.2); // soft silhouette falloff

    // sample this particle's shape tile
    vec2 uv = vec2((vTex + clamp(c.x + 0.5, 0.0, 1.0)) / 3.0, clamp(c.y + 0.5, 0.0, 1.0));
    float texA = texture2D(uMap, uv).a;

    float a = texA * vAlpha * (0.25 + 0.75 * z) * (0.55 + 0.45 * diff);
    a *= 1.0 - rim * 0.85;
    if (a < 0.004) discard;

    // cool blue-grey mist: moonlit from above, cyan city glow from below,
    // sinking slightly darker + bluer with distance
    vec3 col = vec3(0.56, 0.68, 0.9) * (0.55 + 0.45 * diff);
    col += vec3(0.11, 0.36, 0.5) * under * under * 1.1; // electric underglow
    col *= mix(vec3(1.0), vec3(0.78, 0.87, 1.08), smoothstep(5.0, 34.0, vDist));
    gl_FragColor = vec4(col, a);
  }
`;

export default function GroundFog() {
  const { size, camera } = useThree();

  const atlas = useMemo(() => makeFogAtlas(), []);
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );

  const { geo, material } = useMemo(() => {
    const count = isMobile ? 380 : 760;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);
    const texes = new Float32Array(count);
    let seed = 4242;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      // fill the ENTIRE city ground: path, both building lines, and
      // out to the far walls — no gaps that reveal a "layer"
      const r = rnd();
      let x: number;
      if (r < 0.42) x = (rnd() - 0.5) * 10; // across the walking path
      else if (r < 0.78) x = (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 7); // building lines
      else x = (rnd() < 0.5 ? -1 : 1) * (12 + rnd() * 5); // far edges
      pos[i * 3] = x;
      pos[i * 3 + 1] = -3.35 + rnd() * 2.4; // ground-hugging, varied
      pos[i * 3 + 2] = 8 - rnd() * 88;
      sizes[i] = 3.2 + rnd() * 8.4; // BIG puffs — no tiny dots
      alphas[i] = 0.032 + rnd() * 0.056; // softer each, many overlap
      seeds[i] = rnd();
      texes[i] = Math.floor(rnd() * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aTex", new THREE.BufferAttribute(texes, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: FOG_VERT,
      fragmentShader: FOG_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uCamZ: { value: 0 },
        uSpan: { value: 88 },
        uScale: { value: 600 },
        uMap: { value: atlas },
      },
    });
    return { geo: g, material: m };
  }, [isMobile, atlas]);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    material.uniforms.uScale.value =
      size.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  }, [size, camera, material]);

  useFrame(({ camera: cam }) => {
    material.uniforms.uTime.value = performance.now() / 1000;
    material.uniforms.uCamZ.value = cam.position.z;
  });

  useEffect(
    () => () => {
      geo.dispose();
      material.dispose();
      atlas.dispose();
    },
    [geo, material, atlas]
  );

  const ref = useRef<THREE.Points>(null);
  return <points ref={ref} geometry={geo} material={material} frustumCulled={false} />;
}
