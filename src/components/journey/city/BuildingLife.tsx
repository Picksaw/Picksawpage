/**
 * BuildingLife — the machinery that makes a city feel inhabited.
 *
 * Windows breathe in the façade shader (per-cell occupancy, drift,
 * failing tubes, occupant shadows). What lives here is everything with
 * moving parts:
 *
 *   VENT FANS      rooftop extractor fans, each on its own rpm, a few
 *                  seized or stuttering
 *   STEAM          slow columns venting from roofs and street grates
 *   TRANSFORMERS   pole-mounted cans that occasionally arc — a bright
 *                  crack of light, a flicker, then dark again
 *   NEON SIGNS     shopfront signage with imperfect starter behaviour:
 *                  buzzing, a dead letter, a slow warm-up after a dropout
 *   AC UNITS       window boxes with a dripping condensate trail
 *
 * Nothing here loops on a shared clock. Every element derives its
 * timing from its own seed via incommensurate frequencies, so no two
 * cycles ever line up and the district never reveals a period.
 *
 * All five systems are instanced and pooled around the walker: only
 * what is inside the near band is written each frame.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildCitySorted, type BuildingSpec } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { rng } from "../lib/rng";
import type { Quality } from "../lib/quality";

const BAND_BACK = 30;
const BAND_FWD = 95;

// ── steam / vent plumes ────────────────────────────────────────────────────

const STEAM_VERT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uStorm;
  attribute vec3  aOrigin;
  attribute float aSeed;
  attribute float aScale;
  attribute float aRate;

  varying float vLife;
  varying vec2  vUv;
  varying float vSeed;
  varying float vDist;

  void main() {
    vUv = position.xy + 0.5;
    vSeed = aSeed;

    // each puff rises, expands and dissipates on its own cycle
    float life = fract(uTime * aRate + aSeed);
    vLife = life;

    vec3 p = aOrigin;
    p.y += life * (2.6 + aSeed * 2.4);
    // the plume bends downwind as it rises, harder in a storm
    float wind = (0.6 + uStorm * 2.4);
    p.x += life * life * wind * (0.8 + aSeed * 0.6);
    p.z += life * life * wind * 0.3;
    // lateral wander
    p.x += sin(uTime * 0.7 + aSeed * 12.0) * life * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDist = -mv.z;
    // puffs expand as they rise
    float size = aScale * (0.35 + life * 1.9);
    mv.xy += position.xy * size;
    gl_Position = projectionMatrix * mv;
  }
`;

const STEAM_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3  uColor;
  uniform float uBolt;
  uniform float uTime;
  varying float vLife;
  varying vec2  vUv;
  varying float vSeed;
  varying float vDist;

  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
  float n2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y);
  }

  void main() {
    vec2 c = vUv - 0.5;
    float r = length(c) * 2.0;
    if (r > 1.0) discard;

    // billowing interior — the puff churns as it rises
    vec2 np = c * 2.5 + vec2(vSeed * 30.0, -uTime * 0.35 - vLife * 2.0);
    float turb = n2(np * 2.2) * 0.6 + n2(np * 5.1) * 0.4;
    float body = (1.0 - smoothstep(0.1, 1.0, r)) * (0.45 + turb * 0.95);

    // fade in fast, dissipate slowly
    float a = body * smoothstep(0.0, 0.12, vLife) * (1.0 - smoothstep(0.35, 1.0, vLife));
    a *= 0.28;
    a *= smoothstep(1.5, 6.0, vDist) * (1.0 - smoothstep(50.0, 85.0, vDist));
    if (a < 0.004) discard;

    vec3 col = uColor * (0.7 + turb * 0.5);
    col += vec3(0.4, 0.5, 0.65) * uBolt * 0.7;
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── neon signage ───────────────────────────────────────────────────────────

const NEON_VERT = /* glsl */ `
  precision highp float;
  attribute vec3  aColor;
  attribute float aSeed;
  attribute float aS;
  varying vec3  vColor;
  varying float vSeed;
  varying float vS;
  varying vec2  vUv;

  void main() {
    vUv = uv;
    vColor = aColor;
    vSeed = aSeed;
    vS = aS;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const NEON_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uCamS;
  uniform float uBolt;
  varying vec3  vColor;
  varying float vSeed;
  varying float vS;
  varying vec2  vUv;

  float h(float x) { return fract(sin(x * 78.233 + vSeed * 41.7) * 43758.5453); }

  void main() {
    // tube profile: a hot core with a soft halo, like a real glass tube
    float d = abs(vUv.y - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.35, d);
    float halo = 1.0 - smoothstep(0.2, 1.0, d);

    // ── imperfect starter behaviour ──
    // Most of the time the tube is lit and buzzing slightly. Every so
    // often it drops out and stutters back — never on a fixed period.
    float dropCycle = 14.0 + h(1.0) * 40.0;
    float phase = fract(uTime / dropCycle + h(2.0));
    float lit = 1.0;
    if (phase > 0.93) {
      // the dropout: rapid stutter while it tries to restrike
      float t = (phase - 0.93) / 0.07;
      float stutter = step(0.45, fract(t * 18.0 + h(3.0) * 5.0));
      lit = mix(stutter, 1.0, smoothstep(0.6, 1.0, t));
    }
    // mains buzz — a shallow 100 Hz-ish ripple
    lit *= 0.93 + 0.07 * sin(uTime * 41.0 + vSeed * 9.0);

    // a dead segment on some signs
    float dead = step(0.86, h(4.0)) * step(0.62, fract(vUv.x * 3.0 + h(5.0)));
    lit *= 1.0 - dead * 0.92;

    float a = (core * 0.95 + halo * 0.4) * lit;

    // fade out beyond the near band so distant signs cost nothing
    float ds = vS - uCamS;
    a *= smoothstep(-24.0, -10.0, ds) * (1.0 - smoothstep(55.0, 90.0, ds));
    if (a < 0.006) discard;

    // the core blows out toward white; the halo keeps the tube's colour
    vec3 col = mix(vColor, vec3(1.0), core * 0.55) * (1.6 + uBolt * 0.6);
    gl_FragColor = vec4(col, a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// ── layout ─────────────────────────────────────────────────────────────────

interface FanSpec {
  s: number;
  pos: THREE.Vector3;
  rotY: number;
  rpm: number;
  seized: boolean;
  radius: number;
}
interface VentSpec {
  s: number;
  pos: THREE.Vector3;
  rate: number;
  scale: number;
}
interface SignSpec {
  s: number;
  pos: THREE.Vector3;
  rotY: number;
  width: number;
  color: THREE.Color;
  seed: number;
}
interface SparkSpec {
  s: number;
  pos: THREE.Vector3;
  seed: number;
}

function planLife(buildings: BuildingSpec[], density: number) {
  const r = rng(0x11fe);
  const fans: FanSpec[] = [];
  const vents: VentSpec[] = [];
  const signs: SignSpec[] = [];
  const sparks: SparkSpec[] = [];

  for (const b of buildings) {
    if (b.row > 1) continue;
    const roofY = b.y + b.height;

    // rooftop extractor fans
    if (b.rooftopProps && r.chance(0.7 * density)) {
      const n = r.int(1, 2);
      for (let i = 0; i < n; i++) {
        fans.push({
          s: b.s,
          pos: new THREE.Vector3(
            b.x + r.range(-b.width * 0.3, b.width * 0.3),
            roofY + 0.55,
            b.z + r.range(-b.depth * 0.3, b.depth * 0.3)
          ),
          rotY: b.rotY,
          rpm: r.range(0.6, 3.4),
          seized: r.chance(0.14),
          radius: r.range(0.5, 0.95),
        });
      }
    }

    // steam vents — roof stacks and the occasional street grate
    if (r.chance(0.5 * density)) {
      vents.push({
        s: b.s,
        pos: new THREE.Vector3(
          b.x + r.range(-b.width * 0.35, b.width * 0.35),
          roofY + 0.8,
          b.z + r.range(-b.depth * 0.35, b.depth * 0.35)
        ),
        rate: r.range(0.16, 0.34),
        scale: r.range(0.9, 2.1),
      });
    }

    // shopfront neon
    if (b.shopfront && r.chance(0.8 * density)) {
      const acc = new THREE.Color(b.district.accent);
      const alt = new THREE.Color(b.district.accent2);
      signs.push({
        s: b.s,
        pos: new THREE.Vector3(b.x, b.y + r.range(3.6, 5.4), b.z),
        rotY: b.rotY,
        width: Math.min(b.width * 0.55, 6.5),
        color: r.chance(0.65) ? acc : alt,
        seed: r.int(1, 9999),
      });
    }

    // pole transformers
    if (r.chance(0.14 * density)) {
      sparks.push({
        s: b.s,
        pos: new THREE.Vector3(b.x, b.y + r.range(6, 9), b.z),
        seed: r.int(1, 9999),
      });
    }
  }
  return { fans, vents, signs, sparks };
}

// ── component ──────────────────────────────────────────────────────────────

export default function BuildingLife({ quality }: { quality: Quality }) {
  const buildings = useMemo(
    () => buildCitySorted(quality.buildingRows),
    [quality.buildingRows]
  );

  const plan = useMemo(
    () => planLife(buildings, quality.propDensity),
    [buildings, quality.propDensity]
  );

  // ── fans ──
  const fans = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 0.045, 0.16);
    const mat = new THREE.MeshStandardMaterial({
      color: "#2a2f38",
      roughness: 0.55,
      metalness: 0.7,
    });
    const housing = new THREE.CylinderGeometry(1, 1, 0.34, 10, 1, true);
    const housingMat = new THREE.MeshStandardMaterial({
      color: "#1b1f26",
      roughness: 0.7,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
    const count = Math.min(plan.fans.length, 90);
    const blades = new THREE.InstancedMesh(geo, mat, count * 3);
    const cans = new THREE.InstancedMesh(housing, housingMat, count);
    blades.frustumCulled = false;
    cans.frustumCulled = false;
    blades.count = 0;
    cans.count = 0;
    return { blades, cans, geo, mat, housing, housingMat, count, bladeCapacity: count * 3 };
  }, [plan.fans.length]);

  // ── steam ──
  const steam = useMemo(() => {
    if (quality.simplified) return null;
    const perVent = 5;
    const total = Math.min(plan.vents.length * perVent, quality.ambientParticles);
    if (total < 1) return null;

    const geo = new THREE.InstancedBufferGeometry();
    const quad = new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]);
    geo.setAttribute("position", new THREE.BufferAttribute(quad, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);

    const origins = new Float32Array(total * 3);
    const seeds = new Float32Array(total);
    const scales = new Float32Array(total);
    const rates = new Float32Array(total);
    const r = rng(0x57ea3);
    for (let i = 0; i < total; i++) {
      const v = plan.vents[i % plan.vents.length];
      origins[i * 3] = v.pos.x;
      origins[i * 3 + 1] = v.pos.y;
      origins[i * 3 + 2] = v.pos.z;
      seeds[i] = r();
      scales[i] = v.scale;
      rates[i] = v.rate;
    }
    geo.setAttribute("aOrigin", new THREE.InstancedBufferAttribute(origins, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geo.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
    geo.setAttribute("aRate", new THREE.InstancedBufferAttribute(rates, 1));
    geo.instanceCount = total;

    const mat = new THREE.ShaderMaterial({
      vertexShader: STEAM_VERT,
      fragmentShader: STEAM_FRAG,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uStorm: { value: 0 },
        uBolt: { value: 0 },
        uColor: { value: new THREE.Color("#8fa3bd") },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 5;
    return { mesh, mat };
  }, [plan.vents, quality.simplified, quality.ambientParticles]);

  // ── neon ──
  const neon = useMemo(() => {
    if (plan.signs.length === 0) return null;
    const geo = new THREE.PlaneGeometry(1, 1);
    const colors = new Float32Array(plan.signs.length * 3);
    const seeds = new Float32Array(plan.signs.length);
    const sPos = new Float32Array(plan.signs.length);

    const mat = new THREE.ShaderMaterial({
      vertexShader: NEON_VERT,
      fragmentShader: NEON_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uCamS: { value: 0 },
        uBolt: { value: 0 },
      },
    });

    const mesh = new THREE.InstancedMesh(geo, mat, plan.signs.length);
    mesh.frustumCulled = false;
    mesh.renderOrder = 9;

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    plan.signs.forEach((sign, i) => {
      e.set(0, sign.rotY, 0);
      q.setFromEuler(e);
      p.copy(sign.pos);
      sc.set(sign.width, 0.42, 1);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
      colors[i * 3] = sign.color.r;
      colors[i * 3 + 1] = sign.color.g;
      colors[i * 3 + 2] = sign.color.b;
      seeds[i] = sign.seed % 1000;
      sPos[i] = sign.s;
    });
    mesh.instanceMatrix.needsUpdate = true;
    geo.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
    geo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    geo.setAttribute("aS", new THREE.InstancedBufferAttribute(sPos, 1));

    return { mesh, mat };
  }, [plan.signs]);

  // ── transformer arcs: a tiny pool of lights + flare sprites ──
  const arcs = useMemo(() => {
    const n = quality.simplified ? 0 : 3;
    const lights: THREE.PointLight[] = [];
    const group = new THREE.Group();
    for (let i = 0; i < n; i++) {
      // Always visible and always counted — see the note in Lighting.tsx.
      // Toggling a light's visibility recompiles every lit material.
      const l = new THREE.PointLight(0xbfe4ff, 0, 18, 2);
      l.intensity = 0;
      group.add(l);
      lights.push(l);
    }
    return { group, lights, state: plan.sparks.map(() => ({ next: Math.random() * 30, life: 0 })) };
  }, [plan.sparks, quality.simplified]);

  useEffect(
    () => () => {
      fans.geo.dispose();
      fans.mat.dispose();
      fans.housing.dispose();
      fans.housingMat.dispose();
      steam?.mesh.geometry.dispose();
      steam?.mat.dispose();
      neon?.mesh.geometry.dispose();
      neon?.mat.dispose();
      arcs.lights.forEach((l) => l.dispose());
    },
    [fans, steam, neon, arcs]
  );

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const bladeEuler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const frame = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const camS = journey.s;
    const t = journey.time;

    if (steam) {
      steam.mat.uniforms.uTime.value = t;
      steam.mat.uniforms.uStorm.value = journey.storm;
      steam.mat.uniforms.uBolt.value = journey.bolt;
    }
    if (neon) {
      neon.mat.uniforms.uTime.value = t;
      neon.mat.uniforms.uCamS.value = camS;
      neon.mat.uniforms.uBolt.value = journey.bolt;
    }

    // ── fans: only the ones you can see ──
    let bladeN = 0;
    let canN = 0;
    for (const f of plan.fans) {
      const ds = f.s - camS;
      if (ds < -BAND_BACK || ds > BAND_FWD) continue;
      if (canN >= fans.count) break;

      // a seized fan stalls, judders, and creeps
      let spin: number;
      if (f.seized) {
        const jitter = Math.sin(t * 0.7 + f.rpm * 9) * Math.sin(t * 1.9);
        spin = f.rpm * 0.12 * t + (jitter > 0.72 ? Math.sin(t * 14) * 0.4 : 0);
      } else {
        spin = t * f.rpm * 6.283;
      }

      euler.set(0, f.rotY, 0);
      quat.setFromEuler(euler);
      pos.copy(f.pos);
      scl.set(f.radius * 2.1, 1, 1);
      m4.compose(pos, quat, scl);
      fans.cans.setMatrixAt(canN, m4);
      canN++;

      // three blades per fan, spinning about the vertical axis
      for (let b = 0; b < 3 && bladeN < fans.bladeCapacity; b++) {
        bladeEuler.set(0, spin + (b * Math.PI * 2) / 3 + f.rotY, Math.PI / 2);
        quat.setFromEuler(bladeEuler);
        pos.copy(f.pos);
        scl.set(f.radius * 1.8, 1, 1);
        m4.compose(pos, quat, scl);
        fans.blades.setMatrixAt(bladeN, m4);
        bladeN++;
      }
    }
    fans.cans.count = canN;
    fans.blades.count = bladeN;
    fans.cans.instanceMatrix.needsUpdate = true;
    fans.blades.instanceMatrix.needsUpdate = true;

    // ── transformer arcs ──
    frame.current++;
    if (arcs.lights.length > 0 && frame.current % 2 === 0) {
      let slot = 0;
      for (let i = 0; i < plan.sparks.length && slot < arcs.lights.length; i++) {
        const sp = plan.sparks[i];
        const ds = sp.s - camS;
        const st = arcs.state[i];
        if (ds < -BAND_BACK || ds > BAND_FWD) continue;

        st.next -= dt * 2;
        if (st.next <= 0) {
          // a crack of light, then a long irregular wait
          st.life = 1;
          st.next = 9 + Math.random() * 34;
        }
        if (st.life > 0) {
          st.life = Math.max(0, st.life - dt * 7);
          const l = arcs.lights[slot];
          l.position.copy(sp.pos);
          // the arc stutters as it dies
          const stutter = Math.random() < 0.45 ? 0.35 : 1;
          l.intensity = st.life * st.life * 48 * stutter;
          slot++;
        }
      }
      for (let i = slot; i < arcs.lights.length; i++) arcs.lights[i].intensity = 0;
    }
  });

  return (
    <>
      <primitive object={fans.cans} />
      <primitive object={fans.blades} />
      {steam && <primitive object={steam.mesh} />}
      {neon && <primitive object={neon.mesh} />}
      <primitive object={arcs.group} />
    </>
  );
}
