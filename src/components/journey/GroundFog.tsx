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
  void main() {
    vec3 p = position;
    // organic drift, unique per particle (some rise slowly)
    p.x += sin(uTime * (0.04 + aSeed * 0.1) + aSeed * 6.2831) * 1.6;
    p.y += sin(uTime * (0.05 + aSeed * 0.04) + aSeed * 4.1) * 0.3 + aSeed * mod(uTime * 0.05, 2.0) * 0.4;
    // wrap along the path around the camera, rolling slowly forward
    float rel = mod(p.z - uCamZ + uTime * 0.4 + uSpan, uSpan);
    p.z = uCamZ + rel - (uSpan - 14.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    gl_PointSize = min(aSize * uScale / max(dist, 0.6), 260.0);
    vAlpha =
      aAlpha *
      smoothstep(1.1, 3.0, dist) *
      (1.0 - smoothstep(20.0, 36.0, dist));
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
    vec3 L = normalize(vec3(-0.3, 0.55, 0.78));
    float diff = 0.55 + 0.45 * max(dot(N, L), 0.0);
    float rim = pow(1.0 - z, 2.2); // soft silhouette falloff

    // sample this particle's shape tile
    vec2 uv = vec2((vTex + clamp(c.x + 0.5, 0.0, 1.0)) / 3.0, clamp(c.y + 0.5, 0.0, 1.0));
    float texA = texture2D(uMap, uv).a;

    float a = texA * vAlpha * (0.25 + 0.75 * z) * diff;
    a *= 1.0 - rim * 0.85;
    if (a < 0.004) discard;

    // cool blue-grey mist, brighter where "lit"
    vec3 col = vec3(0.58, 0.7, 0.92) * (0.72 + 0.28 * diff);
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
    const count = isMobile ? 240 : 400;
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
      const side = rnd() < 0.5 ? -1 : 1;
      const nearBuildings = rnd() < 0.6;
      pos[i * 3] = nearBuildings ? side * (4.2 + rnd() * 7.5) : (rnd() - 0.5) * 9;
      pos[i * 3 + 1] = -3.2 + rnd() * 2.1; // varied heights wrap building bases
      pos[i * 3 + 2] = 8 - rnd() * 84;
      sizes[i] = 1.6 + rnd() * 5.6; // strong size variety
      alphas[i] = 0.05 + rnd() * 0.1;
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
        uSpan: { value: 84 },
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
