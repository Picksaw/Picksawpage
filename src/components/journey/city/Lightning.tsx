/**
 * Lightning — a seven-beat event, not a flash.
 *
 * A real strike is a sequence, and the delay between the light and the
 * sound is what makes it feel like it happened somewhere. The whole
 * district reads `journey.bolt`, so every system reacts in concert:
 * fog blooms, wet surfaces flare, the skyline appears, the lens beads.
 *
 * The beats:
 *
 *   1  DISTANT GLOW   the cloudbase lights from within, 0.3–0.9 s
 *                     before anything else. A held breath.
 *   2  THE BOLT       a forked channel is drawn across the sky with a
 *                     hard leading edge and a stepped-leader look
 *   3  ILLUMINATION   the environment key fires: everything is lit from
 *                     the bolt's direction for a few frames
 *   4  FOG BLOOM      the atmosphere scatters the flash — handled in
 *                     Atmosphere.tsx, driven from the same value
 *   5  WET REFLECTION the road mirrors the whole sky (WetGround)
 *   6  THUNDER        delayed by distance/343 m/s. Near strikes crack
 *                     almost immediately; far ones rumble seconds later.
 *   7  DARKNESS       a slow decay back, with the eye's afterimage
 *                     modelled as a longer tail on the ambient term
 *
 * Strike cadence rises with storm intensity, and the bolt is placed to
 * REVEAL: the shader picks a position behind the far skyline so the
 * hidden towers snap into silhouette.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import { pathPoint } from "../lib/cityLayout";
import { dispatchLightning } from "../../../lib/stormEvents";
import { setBolt } from "../../../lib/stormStore";
import { rng } from "../lib/rng";
import type { Quality } from "../lib/quality";

const BOLT_VERT = /* glsl */ `
  precision highp float;
  attribute float aDist;    // 0..1 along the channel
  attribute float aSide;    // -1 / +1 across the ribbon
  attribute float aBranch;  // 0 = main channel, 1 = fork
  varying float vDist;
  varying float vSide;
  varying float vBranch;

  void main() {
    vDist = aDist;
    vSide = aSide;
    vBranch = aBranch;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BOLT_FRAG = /* glsl */ `
  precision highp float;
  uniform float uLife;      // 1 → 0 over the strike
  uniform float uReveal;    // how much of the channel has been drawn
  uniform vec3  uCore;
  uniform vec3  uGlow;
  varying float vDist;
  varying float vSide;
  varying float vBranch;

  void main() {
    // ── the channel is drawn progressively, top to bottom ──
    // A stepped leader: the tip races ahead, the trail brightens after.
    if (vDist > uReveal) discard;

    // cross-section: a white-hot core inside a coloured halo
    float across = abs(vSide);
    float core = pow(1.0 - across, 6.0);
    float glow = pow(1.0 - across, 1.6);

    // the channel is brightest where it was struck first
    float age = clamp((uReveal - vDist) * 3.0, 0.0, 1.0);
    // forks are dimmer and die sooner
    float branchFade = mix(1.0, 0.45, vBranch);

    float a = (core * 1.4 + glow * 0.45) * uLife * branchFade * (0.4 + age * 0.6);
    // the tip is always the brightest point
    a += core * smoothstep(0.06, 0.0, uReveal - vDist) * 1.6 * uLife;
    if (a < 0.006) discard;

    vec3 col = mix(uGlow, uCore, core);
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

interface Strike {
  /** seconds since the strike began */
  t: number;
  /** total distance to the strike, metres (drives thunder delay) */
  distance: number;
  /** peak brightness */
  power: number;
  /** has the thunder been dispatched yet? */
  thundered: boolean;
  /** has the environment flash fired? */
  flashed: boolean;
  active: boolean;
}

const SEGMENTS = 26;
const BRANCHES = 3;
const BRANCH_SEGS = 7;

export default function Lightning({ quality }: { quality: Quality }) {
  const strike = useRef<Strike>({
    t: 0,
    distance: 400,
    power: 1,
    thundered: true,
    flashed: true,
    active: false,
  });
  const nextAt = useRef(3 + Math.random() * 5);
  const glowRef = useRef(0);
  const boltValue = useRef(0);

  const r = useMemo(() => rng(0xb017), []);

  // ── the bolt ribbon ──
  const { mesh, material } = useMemo(() => {
    const totalVerts = (SEGMENTS + BRANCHES * BRANCH_SEGS) * 2;
    const pos = new Float32Array(totalVerts * 3);
    const dist = new Float32Array(totalVerts);
    const side = new Float32Array(totalVerts);
    const branch = new Float32Array(totalVerts);
    const indices: number[] = [];

    // main channel strip
    for (let i = 0; i < SEGMENTS; i++) {
      dist[i * 2] = i / (SEGMENTS - 1);
      dist[i * 2 + 1] = i / (SEGMENTS - 1);
      side[i * 2] = -1;
      side[i * 2 + 1] = 1;
      if (i < SEGMENTS - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    // fork strips
    let off = SEGMENTS * 2;
    for (let b = 0; b < BRANCHES; b++) {
      for (let i = 0; i < BRANCH_SEGS; i++) {
        const v = off + i * 2;
        dist[v] = 0;
        dist[v + 1] = 0;
        side[v] = -1;
        side[v + 1] = 1;
        branch[v] = 1;
        branch[v + 1] = 1;
        if (i < BRANCH_SEGS - 1) {
          indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        }
      }
      off += BRANCH_SEGS * 2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aDist", new THREE.BufferAttribute(dist, 1));
    geo.setAttribute("aSide", new THREE.BufferAttribute(side, 1));
    geo.setAttribute("aBranch", new THREE.BufferAttribute(branch, 1));
    geo.setIndex(indices);

    const mat = new THREE.ShaderMaterial({
      vertexShader: BOLT_VERT,
      fragmentShader: BOLT_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        uLife: { value: 0 },
        uReveal: { value: 0 },
        uCore: { value: new THREE.Color("#ffffff") },
        uGlow: { value: new THREE.Color("#a8c8ff") },
      },
    });

    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = 20;
    m.visible = false;
    return { mesh: m, material: mat };
  }, []);

  // ── the cloudbase glow that precedes the strike ──
  const glowSprite = useMemo(() => {
    const mat = new THREE.SpriteMaterial({
      color: new THREE.Color("#9fc0ff"),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const s = new THREE.Sprite(mat);
    s.scale.set(420, 260, 1);
    s.renderOrder = 19;
    return { sprite: s, mat };
  }, []);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
      glowSprite.mat.dispose();
    },
    [mesh, material, glowSprite]
  );

  /**
   * Draw a fresh forked channel into the ribbon buffers.
   *
   * This allocates a few dozen vectors, which is deliberate: it runs
   * once per strike (every 4-18 s), not per frame, and pooling here
   * would trade real clarity for an allocation the GC will never
   * notice. The per-FRAME path below is allocation-free.
   */
  const buildChannel = (origin: THREE.Vector3, camPos: THREE.Vector3) => {
    const attr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const distAttr = mesh.geometry.getAttribute("aDist") as THREE.BufferAttribute;

    // the channel falls from the cloudbase toward the horizon
    const top = new THREE.Vector3(origin.x, origin.y, origin.z);
    const bottom = new THREE.Vector3(
      origin.x + r.range(-90, 90),
      r.range(10, 70),
      origin.z + r.range(-60, 60)
    );

    // camera-facing ribbon width
    const view = new THREE.Vector3();
    const dir = new THREE.Vector3();
    const sideVec = new THREE.Vector3();
    const p = new THREE.Vector3();
    const prev = new THREE.Vector3();

    let jitterX = 0;
    let jitterZ = 0;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const t = i / (SEGMENTS - 1);
      p.lerpVectors(top, bottom, t);
      // stepped leader: sharp lateral kinks that persist down the channel
      if (i % 3 === 0) {
        jitterX += r.range(-1, 1) * 26 * (0.4 + t);
        jitterZ += r.range(-1, 1) * 18 * (0.4 + t);
      }
      p.x += jitterX;
      p.z += jitterZ;
      pts.push(p.clone());
    }

    const writeStrip = (
      list: THREE.Vector3[],
      vertOffset: number,
      width: number,
      distFrom: number,
      distTo: number
    ) => {
      for (let i = 0; i < list.length; i++) {
        const cur = list[i];
        const nxt = list[Math.min(i + 1, list.length - 1)];
        prev.copy(list[Math.max(i - 1, 0)]);
        dir.copy(nxt).sub(prev);
        if (dir.lengthSq() < 1e-6) dir.set(0, -1, 0);
        dir.normalize();
        view.copy(camPos).sub(cur).normalize();
        sideVec.copy(dir).cross(view);
        if (sideVec.lengthSq() < 1e-6) sideVec.set(1, 0, 0);
        sideVec.normalize().multiplyScalar(width);

        const v = vertOffset + i * 2;
        attr.setXYZ(v, cur.x - sideVec.x, cur.y - sideVec.y, cur.z - sideVec.z);
        attr.setXYZ(v + 1, cur.x + sideVec.x, cur.y + sideVec.y, cur.z + sideVec.z);
        const d = distFrom + (distTo - distFrom) * (i / Math.max(list.length - 1, 1));
        distAttr.setX(v, d);
        distAttr.setX(v + 1, d);
      }
    };

    writeStrip(pts, 0, 1.6, 0, 1);

    // forks peel off the main channel partway down
    let off = SEGMENTS * 2;
    for (let b = 0; b < BRANCHES; b++) {
      const anchorIdx = Math.floor(r.range(0.25, 0.8) * (SEGMENTS - 1));
      const anchor = pts[anchorIdx];
      const fork: THREE.Vector3[] = [anchor.clone()];
      const fdir = new THREE.Vector3(r.range(-1, 1), -r.range(0.3, 1), r.range(-1, 1)).normalize();
      for (let i = 1; i < BRANCH_SEGS; i++) {
        const q = fork[i - 1].clone();
        q.addScaledVector(fdir, r.range(14, 34));
        q.x += r.range(-10, 10);
        q.z += r.range(-10, 10);
        fork.push(q);
      }
      const dFrom = anchorIdx / (SEGMENTS - 1);
      writeStrip(fork, off, 0.85, dFrom, Math.min(1, dFrom + 0.25));
      off += BRANCH_SEGS * 2;
    }

    attr.needsUpdate = true;
    distAttr.needsUpdate = true;
  };

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const st = strike.current;

    // ── cadence: strikes come faster as the storm builds ──
    if (!st.active) {
      nextAt.current -= dt * (0.5 + journey.storm * 1.6);
      if (nextAt.current <= 0) {
        // place the strike BEHIND the far skyline so it reveals it
        const p = pathPoint(journey.s + r.range(120, 420));
        const lateral = r.chance(0.5) ? -1 : 1;
        const dist = r.range(180, 620);
        const origin = new THREE.Vector3(
          p.x + lateral * dist * r.range(0.4, 1),
          r.range(150, 280),
          p.z - r.range(40, 220)
        );
        buildChannel(origin, camera.position);
        glowSprite.sprite.position.set(origin.x, origin.y * 0.75, origin.z);

        st.t = 0;
        st.distance = origin.distanceTo(camera.position);
        st.power = r.range(0.55, 1);
        st.thundered = false;
        st.flashed = false;
        st.active = true;
        mesh.visible = true;
        // next strike: 4–18 s, tightening with the storm
        nextAt.current = 4 + r.range(0, 14) - journey.storm * 3;
      }
    }

    let bolt = 0;

    if (st.active) {
      st.t += dt;
      const t = st.t;

      // ── BEAT 1: distant glow, before anything visible ──
      const preroll = 0.55;
      if (t < preroll) {
        const g = Math.sin((t / preroll) * Math.PI) * 0.5;
        glowSprite.mat.opacity = g * 0.28 * st.power;
        bolt = g * 0.08 * st.power;
        material.uniforms.uLife.value = 0;
        material.uniforms.uReveal.value = 0;
      } else {
        const bt = t - preroll;

        // ── BEAT 2: the channel draws itself, tip first ──
        const drawTime = 0.09;
        material.uniforms.uReveal.value = Math.min(1, bt / drawTime);

        // ── BEAT 3 + 7: illumination, then a two-stage decay ──
        // A real strike flickers: a bright return stroke, a dimmer
        // second, then the afterglow.
        let life: number;
        if (bt < 0.05) life = 1;
        else if (bt < 0.1) life = 0.45;
        else if (bt < 0.16) life = 0.85;
        else life = Math.max(0, Math.exp(-(bt - 0.16) * 7.5));
        material.uniforms.uLife.value = life * st.power;

        // the environment flash trails the channel slightly
        bolt = life * st.power;
        glowSprite.mat.opacity = Math.max(0, 0.3 - bt) * st.power;

        if (!st.flashed && bt > 0.01) {
          st.flashed = true;
          dispatchLightning(st.power);
        }

        // ── BEAT 6: thunder, delayed by the speed of sound ──
        const thunderDelay = st.distance / 343;
        if (!st.thundered && bt > thunderDelay) {
          st.thundered = true;
          // farther strikes rumble longer and quieter
          const near = 1 - Math.min(1, st.distance / 700);
          window.dispatchEvent(
            new CustomEvent("picksaw:thunder", {
              detail: { power: st.power * (0.35 + near * 0.65), distance: st.distance },
            })
          );
        }

        if (bt > 1.4 && st.thundered) {
          st.active = false;
          mesh.visible = false;
          material.uniforms.uLife.value = 0;
          glowSprite.mat.opacity = 0;
        }
      }
    }

    // ── the afterimage: the eye adapts slower than the sky ──
    // A short attack and a long release, so darkness returns gradually.
    const target = bolt;
    if (target > boltValue.current) boltValue.current = target;
    else boltValue.current += (target - boltValue.current) * Math.min(1, dt * 4.5);

    journey.bolt = boltValue.current;
    setBolt(boltValue.current);
    glowRef.current = glowSprite.mat.opacity;

    // publish to the DOM so the HTML chrome catches the flash too
    if (boltValue.current > 0.004 || glowRef.current > 0.004) {
      document.documentElement.style.setProperty("--bolt", boltValue.current.toFixed(3));
    } else if (document.documentElement.style.getPropertyValue("--bolt") !== "0") {
      document.documentElement.style.setProperty("--bolt", "0");
    }
  });

  if (quality.reducedMotion) return null;

  return (
    <>
      <primitive object={mesh} />
      <primitive object={glowSprite.sprite} />
    </>
  );
}
