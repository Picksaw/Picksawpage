/**
 * The lighting hierarchy.
 *
 * Every light in this district has a job. Nothing is here to "brighten
 * things up" — if a surface is lit, something in the world is lighting
 * it.
 *
 *   MOONLIGHT   one cool-blue directional key, high and behind-left,
 *               casting the only real shadows. Its shadow camera is a
 *               tight box that FOLLOWS the walker, so a 2048 map covers
 *               ~90 m of street at high resolution instead of smearing
 *               itself over the whole 640 m district.
 *
 *   SKY         hemisphere fill: cold sky above, near-black asphalt
 *               bounce below. This is what keeps the shadows from
 *               going pure black without flattening the frame.
 *
 *   STREET LAMPS a POOL of real point lights (4–8 depending on tier)
 *               recycled between the nearest lamp posts as you walk.
 *               Distant lamps keep their glow sprite and emissive head
 *               but stop costing a light slot.
 *
 *   ACCENTS     hero-plot entrances get their own warm/cool key so the
 *               doorway reads as an invitation from a distance.
 *
 *   LIGHTNING   a second directional that fires with the storm, plus a
 *               global ambient lift, so a bolt genuinely re-lights the
 *               whole environment for a few frames.
 *
 * Tone mapping is ACES Filmic with physically-correct falloff, so the
 * bright cores of lamps and neon roll off instead of clipping to white.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { buildLampsSorted, districtAt, pathPoint } from "../lib/cityLayout";
import { journey } from "../lib/journeyState";
import { gradeAt } from "../lib/palette";
import type { Quality } from "../lib/quality";

export default function Lighting({ quality }: { quality: Quality }) {
  const { gl, scene } = useThree();
  const moon = useRef<THREE.DirectionalLight>(null);
  const moonTarget = useRef<THREE.Object3D>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const boltLight = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);

  // sorted by arc position, so the nearest-N search below is a sliding
  // window rather than a scan
  const lamps = useMemo(() => buildLampsSorted(), []);
  const poolSize = quality.lightPool;

  /**
   * Renderer setup — applied ONCE. These are global settings, not
   * per-frame state; re-applying them is what made the type flip.
   */
  const configured = useRef(false);
  useEffect(() => {
    if (configured.current) return;
    configured.current = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    if (quality.shadows) {
      gl.shadowMap.enabled = true;
      /**
       * PCFShadowMap, NOT PCFSoftShadowMap.
       *
       * PCFSoftShadowMap is deprecated as of three r185. The renderer
       * downgrades it on the first shadow pass, and that counts as a
       * shadow-map TYPE CHANGE — on which three walks the whole scene
       * graph setting needsUpdate on every material. Every one then
       * recompiles, mid-frame. Re-applying the deprecated constant made
       * it flip repeatedly: 84 warnings, and the black glitching.
       */
      gl.shadowMap.type = THREE.PCFShadowMap;
      gl.shadowMap.autoUpdate = true;
    }
  }, [gl, quality.shadows]);

  // ── the recycled lamp light pool ──
  const pool = useMemo(() => {
    const group = new THREE.Group();
    const lights: THREE.PointLight[] = [];
    for (let i = 0; i < poolSize; i++) {
      const l = new THREE.PointLight(0xffb46a, 0, 34, 2);
      l.castShadow = false; // shadow-casting point lights are 6 renders each
      /**
       * NEVER toggle `visible` on a light.
       *
       * three.js bakes the number of lights of each type into the
       * shader program cache key, and skips invisible lights entirely
       * when collecting them. So flipping `visible` changes the light
       * count, which invalidates the cache and forces a synchronous
       * recompile of EVERY lit material in the scene — on the frame it
       * happens. Doing that from a per-frame loop is what produced the
       * black, glitching frames.
       *
       * The pool is therefore always visible and always counted; a
       * disabled light is simply one with zero intensity, which costs
       * a few ALU ops and never touches the program cache.
       */
      l.visible = true;
      l.intensity = 0;
      group.add(l);
      lights.push(l);
    }
    return { group, lights };
  }, [poolSize]);

  useEffect(() => {
    scene.add(pool.group);
    return () => {
      scene.remove(pool.group);
      pool.lights.forEach((l) => l.dispose());
    };
  }, [scene, pool]);

  const cursor = useRef(0);
  const frameCount = useRef(0);
  const lampColors = useMemo(
    () => lamps.map((l) => new THREE.Color(l.color)),
    [lamps]
  );

  const tmpColor = useMemo(() => new THREE.Color(), []);

  // The moon must aim at an object, not a position, or its shadow frustum
  // stays parked at the world origin while the walker leaves it behind.
  useEffect(() => {
    if (moon.current && moonTarget.current) {
      moon.current.target = moonTarget.current;
      scene.add(moonTarget.current);
    }
  }, [scene]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const grade = gradeAt(journey.progress, journey.bolt);

    // ── moonlight follows the walker ──
    const p = pathPoint(journey.s);
    if (moon.current && moonTarget.current) {
      // keep the light's relative offset constant so shadow direction
      // never changes as you walk — only the shadow volume moves
      moon.current.position.set(p.x - 48, p.y + 78, p.z + 34);
      moonTarget.current.position.set(p.x, p.y, p.z - 18);
      moonTarget.current.updateMatrixWorld();
      moon.current.color.copy(grade.moon);
      moon.current.intensity = 1.05 + journey.bolt * 0.5;
    }

    if (hemi.current) {
      hemi.current.color.copy(grade.ambient);
      hemi.current.intensity = 0.42 + journey.bolt * 0.35;
    }
    if (ambient.current) {
      ambient.current.intensity = 0.06 + journey.bolt * 0.55;
    }

    // ── lightning key ──
    // Stays visible and counted at all times; intensity alone gates it.
    if (boltLight.current) {
      const b = journey.bolt;
      boltLight.current.intensity = b * 5.5;
      if (b > 0.004) {
        boltLight.current.position.set(p.x + 60, p.y + 120, p.z - 90);
      }
    }

    // ── recycle the lamp pool onto the nearest posts ──
    // Every 4th frame is plenty: at walking pace the nearest set changes
    // once every couple of seconds.
    frameCount.current++;
    if (frameCount.current % 4 === 0) {
      const camS = journey.s;
      while (
        cursor.current < lamps.length - 1 &&
        lamps[cursor.current].s < camS - 24
      )
        cursor.current++;
      while (cursor.current > 0 && lamps[cursor.current - 1].s >= camS - 24)
        cursor.current--;

      for (let i = 0; i < pool.lights.length; i++) {
        const idx = cursor.current + i;
        const light = pool.lights[i];
        if (idx >= lamps.length) {
          light.intensity = 0;
          continue;
        }
        const lamp = lamps[idx];
        const ds = lamp.s - camS;
        if (ds < -28 || ds > 90) {
          light.intensity = 0;
          continue;
        }
        light.position.set(lamp.x, lamp.y + lamp.height - 0.45, lamp.z);
        light.color.copy(lampColors[idx]);
        // physical falloff: distance² handled by three, intensity in candela
        const fade = 1 - Math.min(1, Math.max(0, (ds - 40) / 50));
        light.intensity = 26 * fade;
        light.distance = 30;
      }
    }

    // ── flicker: sodium lamps are never perfectly steady ──
    for (let i = 0; i < pool.lights.length; i++) {
      const l = pool.lights[i];
      if (l.intensity <= 0) continue;
      const seed = (cursor.current + i) * 12.9898;
      const f =
        0.94 +
        0.06 * Math.sin(journey.time * (7 + (seed % 5)) + seed) +
        0.02 * Math.sin(journey.time * 23.7 + seed * 3.1);
      l.intensity *= f;
      // lightning briefly overpowers the sodium
      if (journey.bolt > 0.01) {
        tmpColor.copy(lampColors[Math.min(cursor.current + i, lampColors.length - 1)]);
        tmpColor.lerp(grade.moon, journey.bolt * 0.5);
        l.color.copy(tmpColor);
      }
    }

    // exposure rides the grade so lightning genuinely blows the frame out
    gl.toneMappingExposure += (grade.exposure * 1.05 - gl.toneMappingExposure) * Math.min(1, dt * 8);
  });

  const shadowExtent = quality.shadowDistance * 0.5;

  return (
    <>
      {/* sky fill — cold above, asphalt bounce below */}
      <hemisphereLight ref={hemi} args={["#2b4260", "#070a10", 0.42]} />
      {/* the floor of the exposure — never lets a shadow go pure black */}
      <ambientLight ref={ambient} intensity={0.06} color="#22304a" />

      {/* MOONLIGHT — the only shadow caster */}
      <directionalLight
        ref={moon}
        intensity={1.05}
        color="#93b6ff"
        castShadow={quality.shadows}
        shadow-mapSize-width={quality.shadowMapSize}
        shadow-mapSize-height={quality.shadowMapSize}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-bias={-0.0006}
        shadow-normalBias={0.035}
        target-position={[0, 0, 0]}
      />
      <object3D ref={moonTarget} />

      {/* LIGHTNING — fires with the storm, re-lights everything */}
      <directionalLight ref={boltLight} intensity={0} color="#dbeeff" />
    </>
  );
}

/** District-aware lamp colour lookup, exported for the props system. */
export function lampColorAt(s: number): string {
  return districtAt(s).lamp;
}
