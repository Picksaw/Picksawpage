/**
 * Observatory — the end of the walk.
 *
 * The street climbs, the storm thins, and the visitor arrives inside a
 * glass room above the district they just walked through. Everything
 * here is the resolution of something established earlier:
 *
 *   the rain      still falls, but on the OUTSIDE of the glass
 *   the fog       drops below the sill — you are above the weather
 *   the city      is visible below, the actual buildings, at scale
 *   the map       a holographic plan of the district on a plinth, with
 *                 every building you walked past lit up on it
 *   the colour    calm blue and soft gold: clarity after chaos
 *   the CTA       emerges from the room, mounted in the glass, not
 *                 floating over it
 *
 * The holographic map is the payoff: each template you approached
 * during the walk is recorded, and its tower on the map glows. The
 * line "Every building you walked through is a real template" lands
 * while you are looking at proof of it.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EYE_HEIGHT,
  HERO_PLOTS,
  OBSERVATORY_S,
  pathPoint,
  pathPointAt,
} from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { visitedStore } from "../lib/visited";
import type { Quality } from "../lib/quality";

// ── holographic city map ───────────────────────────────────────────────────

const HOLO_VERT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  attribute float aVisited;
  attribute float aIndex;
  varying float vVisited;
  varying float vIndex;
  varying vec3  vLocal;
  varying float vHeight;

  void main() {
    vVisited = aVisited;
    vIndex = aIndex;
    vLocal = position;
    vHeight = position.y + 0.5;

    vec4 wp = instanceMatrix * vec4(position, 1.0);
    // the map assembles from the ground up as you arrive
    float stagger = fract(aIndex * 0.191);
    float grow = clamp((uReveal - stagger * 0.35) / 0.5, 0.0, 1.0);
    wp.y *= grow;

    gl_Position = projectionMatrix * modelViewMatrix * modelMatrix * wp;
  }
`;

const HOLO_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform vec3  uBase;
  uniform vec3  uVisited;
  varying float vVisited;
  varying float vIndex;
  varying vec3  vLocal;
  varying float vHeight;

  void main() {
    // ── scanlines climbing the volume ──
    float scan = sin((vHeight * 40.0) - uTime * 2.2) * 0.5 + 0.5;
    scan = 0.55 + 0.45 * scan;

    // ── a bright sweep passing through the whole map ──
    float sweep = smoothstep(0.06, 0.0, abs(fract(uTime * 0.12) - vHeight * 0.6));

    // ── edges read brighter than faces: a wireframe feel ──
    vec3 a = abs(vLocal);
    float edge = smoothstep(0.36, 0.5, max(max(a.x, a.y), a.z));

    // visited towers pulse; unvisited ones sit quiet
    float pulse = 0.7 + 0.3 * sin(uTime * 1.6 + vIndex * 2.1);
    vec3 col = mix(uBase, uVisited, vVisited * pulse);

    float alpha = (0.16 + edge * 0.55) * scan;
    alpha += sweep * 0.35;
    alpha *= mix(0.45, 1.0, vVisited);
    alpha *= uReveal;
    // fade the top of each tower so it dissolves rather than ends
    alpha *= 1.0 - smoothstep(0.75, 1.05, vHeight);

    if (alpha < 0.006) discard;
    col *= 1.0 + edge * 0.8 + sweep;
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── the glass ──────────────────────────────────────────────────────────────

const GLASS_VERT = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorld = wp.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const GLASS_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uStorm;
  uniform float uBolt;
  uniform vec3  uTint;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying vec3 vNormal;

  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
  float n2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec3 V = normalize(vWorld - cameraPosition);
    float fres = pow(1.0 - abs(dot(vNormal, -V)), 3.0);

    // ── rain running down the OUTSIDE of the glass ──
    // You are inside now: the weather is a thing you watch.
    float col_x = floor(vUv.x * 34.0);
    float speed = 0.06 + h(vec2(col_x, 3.0)) * 0.12;
    float head = fract(h(vec2(col_x, 7.0)) + uTime * speed);
    float dx = abs(fract(vUv.x * 34.0) - 0.5);
    float runnel = (1.0 - smoothstep(0.06, 0.3, dx))
                 * smoothstep(head, head - 0.28, vUv.y)
                 * step(0.55, h(vec2(col_x, 11.0)));
    float beads = step(0.965, n2(vUv * vec2(60.0, 40.0) + uTime * 0.02)) * 0.6;
    float water = (runnel * 0.55 + beads) * (0.4 + uStorm * 0.6);

    // ── the glass itself ──
    // Barely there: a faint tint, a Fresnel rim, and dust in the corners.
    float grime = n2(vUv * 7.0) * 0.06;
    float a = fres * 0.28 + water * 0.4 + grime;
    a += uBolt * 0.22 * (0.3 + fres);

    vec3 col = uTint * (0.6 + fres * 1.4) + vec3(0.55, 0.7, 0.9) * water * 0.5;
    col += vec3(0.7, 0.82, 1.0) * uBolt * 0.5;

    if (a < 0.004) discard;
    gl_FragColor = vec4(col, clamp(a, 0.0, 0.85));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function Observatory({ quality }: { quality: Quality }) {
  // pathPointAt allocates — required here, because this value is
  // retained for the lifetime of the component.
  const base = useMemo(() => {
    const a = pathPointAt(OBSERVATORY_S);
    return new THREE.Vector3(a.x, a.y, a.z);
  }, []);

  const reveal = useRef(0);
  const group = useRef<THREE.Group>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const mapLight = useRef<THREE.PointLight>(null);
  const goldLight = useRef<THREE.PointLight>(null);

  // ── the map: one tower per hero plot, at the district's real layout ──
  const holo = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader: HOLO_VERT,
      fragmentShader: HOLO_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uBase: { value: new THREE.Color("#2f6f9e") },
        uVisited: { value: new THREE.Color("#ffd9a0") },
      },
    });

    // the map is the district, scaled down onto the plinth
    const SCALE = 0.0075;
    const mesh = new THREE.InstancedMesh(geo, mat, HERO_PLOTS.length + 40);
    mesh.frustumCulled = false;

    const visited = new Float32Array(HERO_PLOTS.length + 40);
    const index = new Float32Array(HERO_PLOTS.length + 40);
    const m4 = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();

    let n = 0;
    // hero towers — the templates
    for (const plot of HERO_PLOTS) {
      const wp = pathPoint(plot.s);
      p.set(
        (wp.x - base.x) * SCALE * 12,
        (plot.height * SCALE * 8) / 2,
        (wp.z - base.z) * SCALE * 12
      );
      s.set(plot.width * SCALE * 9, plot.height * SCALE * 8, plot.depth * SCALE * 9);
      m4.compose(p, q, s);
      mesh.setMatrixAt(n, m4);
      index[n] = n;
      n++;
    }
    // filler massing so the map reads as a city, not six pillars
    let seed = 4242;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 40; i++) {
      const s0 = rnd() * OBSERVATORY_S;
      const wp = pathPoint(s0);
      const side = rnd() < 0.5 ? -1 : 1;
      const h = (14 + rnd() * 60) * SCALE * 8;
      p.set(
        (wp.x - base.x) * SCALE * 12 + side * (0.16 + rnd() * 0.5),
        h / 2,
        (wp.z - base.z) * SCALE * 12
      );
      s.set(0.06 + rnd() * 0.1, h, 0.06 + rnd() * 0.1);
      m4.compose(p, q, s);
      mesh.setMatrixAt(n, m4);
      index[n] = n;
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;

    geo.setAttribute("aVisited", new THREE.InstancedBufferAttribute(visited, 1));
    geo.setAttribute("aIndex", new THREE.InstancedBufferAttribute(index, 1));

    return { mesh, mat, geo, visitedAttr: visited };
  }, [base]);

  // ── the glass envelope ──
  const glass = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uStorm: { value: 0 },
        uBolt: { value: 0 },
        uTint: { value: new THREE.Color("#16324a") },
      },
    });
    return mat;
  }, []);

  useEffect(
    () => () => {
      holo.geo.dispose();
      holo.mat.dispose();
      glass.dispose();
    },
    [holo, glass]
  );

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    // ── arrival ──
    // The observatory fades up over the last 60 m of the walk.
    const ds = OBSERVATORY_S - journey.s;
    const target = THREE.MathUtils.clamp(1 - ds / 60, 0, 1);
    reveal.current += (target - reveal.current) * Math.min(1, dt * 1.8);
    const r = reveal.current;
    journey.inObservatory = r > 0.55;

    if (group.current) {
      group.current.visible = r > 0.01;
    }
    // the room lights up as the visitor arrives
    if (keyLight.current) keyLight.current.intensity = r * 22;
    if (mapLight.current) mapLight.current.intensity = r * 14;
    if (goldLight.current) goldLight.current.intensity = r * 16;

    holo.mat.uniforms.uTime.value = journey.time;
    holo.mat.uniforms.uReveal.value = r;
    glass.uniforms.uTime.value = journey.time;
    glass.uniforms.uStorm.value = journey.storm;
    glass.uniforms.uBolt.value = journey.bolt;

    // ── light the towers the visitor actually walked past ──
    const attr = holo.mesh.geometry.getAttribute("aVisited") as THREE.InstancedBufferAttribute;
    let dirty = false;
    HERO_PLOTS.forEach((plot, i) => {
      const want = visitedStore.has(plot.templateId) ? 1 : 0;
      const cur = attr.getX(i);
      // ease each one up so they illuminate in the order they were seen
      const next = cur + (want - cur) * Math.min(1, dt * 2.2);
      if (Math.abs(next - cur) > 0.002) {
        attr.setX(i, next);
        dirty = true;
      }
    });
    if (dirty) attr.needsUpdate = true;
  });

  const ROOM_W = 26;
  const ROOM_D = 20;
  const ROOM_H = 6.5;
  const floorY = base.y + EYE_HEIGHT - 1.7;

  return (
    <>
    <group ref={group} position={[base.x, floorY, base.z]} visible={false}>
      {/* floor — polished stone, catching the map's glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={quality.shadows}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          color="#0d1219"
          roughness={0.14}
          metalness={0.55}
          envMapIntensity={1.6}
        />
      </mesh>

      {/* ceiling */}
      <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#080b11" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* the giant windows — three walls of glass facing the district */}
      <mesh position={[0, ROOM_H / 2, -ROOM_D / 2]} material={glass}>
        <planeGeometry args={[ROOM_W, ROOM_H]} />
      </mesh>
      <mesh
        position={[-ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        material={glass}
      >
        <planeGeometry args={[ROOM_D, ROOM_H]} />
      </mesh>
      <mesh
        position={[ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        material={glass}
      >
        <planeGeometry args={[ROOM_D, ROOM_H]} />
      </mesh>

      {/* mullions — the structure the glass is mounted in */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={`mull-${i}`}
          position={[-ROOM_W / 2 + (i * ROOM_W) / 8, ROOM_H / 2, -ROOM_D / 2 + 0.05]}
          castShadow={quality.shadows}
        >
          <boxGeometry args={[0.12, ROOM_H, 0.2]} />
          <meshStandardMaterial color="#1a1f28" roughness={0.35} metalness={0.85} />
        </mesh>
      ))}
      {/* sill + head rails */}
      {[0.12, ROOM_H - 0.12].map((y, i) => (
        <mesh key={`rail-${i}`} position={[0, y, -ROOM_D / 2 + 0.05]}>
          <boxGeometry args={[ROOM_W, 0.24, 0.3]} />
          <meshStandardMaterial color="#1a1f28" roughness={0.3} metalness={0.9} />
        </mesh>
      ))}

      {/* the plinth */}
      <mesh position={[0, 0.5, -1.5]} castShadow={quality.shadows}>
        <cylinderGeometry args={[1.9, 2.1, 1, 32]} />
        <meshStandardMaterial
          color="#11161e"
          roughness={0.22}
          metalness={0.7}
          envMapIntensity={1.3}
        />
      </mesh>
      {/* the plinth's rim light */}
      <mesh position={[0, 1.01, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.72, 1.9, 48]} />
        <meshBasicMaterial color="#7fd0ff" transparent opacity={0.55} toneMapped={false} />
      </mesh>

      {/* THE HOLOGRAPHIC CITY */}
      <group position={[0, 1.05, -1.5]} scale={[1.55, 1.55, 1.55]}>
        <primitive object={holo.mesh} />
      </group>

    </group>

      {/**
        * The room's lights sit OUTSIDE the culled group.
        *
        * three.js bakes light counts into the shader program cache key,
        * so hiding a group that contains lights changes the count and
        * recompiles every lit material in the scene. These stay mounted
        * for the whole walk and are faded in by intensity instead —
        * which is also why they can be driven straight from `reveal`.
        */}
      <group position={[base.x, floorY, base.z]}>
        <pointLight
          ref={keyLight}
          position={[0, ROOM_H - 1, -1.5]}
          color="#8fc4ff"
          intensity={0}
          distance={26}
        />
        <pointLight
          ref={mapLight}
          position={[0, 1.6, -1.5]}
          color="#7fd0ff"
          intensity={0}
          distance={12}
        />
        <pointLight
          ref={goldLight}
          position={[0, 2.4, 6]}
          color="#ffd9a0"
          intensity={0}
          distance={22}
        />
      </group>
    </>
  );
}
