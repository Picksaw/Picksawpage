/**
 * Buildings — the district's mass, drawn in two instanced batches.
 *
 *   LOD0  everything inside the near band: full PBR façades from the
 *         texture atlas, lit windows, roughness variation, shadows
 *   LOD1  everything beyond it: a single cheap emissive-tinted box so
 *         the skyline still reads through the haze for ~nothing
 *
 * A sliding window over the s-sorted building list feeds both batches,
 * so instance counts stay near-constant no matter how long the walk is:
 * roughly 60–90 near boxes and 80–140 far boxes on desktop. That is two
 * draw calls for an entire city.
 */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildCitySorted, type BuildingSpec } from "../lib/cityLayout";
import { getFacadeAtlas, ATLAS_COLS, ATLAS_ROWS, tileFor } from "../lib/facadeTextures";
import { WETNESS_GLSL } from "../lib/wetness";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

const MAX_NEAR = 180;
const MAX_FAR = 260;

// ── the façade shader ──────────────────────────────────────────────────────

const VERT_PARS = /* glsl */ `
  attribute vec2 aTile;      // atlas tile origin (0..1)
  attribute vec3 aDims;      // width, height, depth in metres
  attribute vec4 aGrid;      // bayWidth, floorHeight, glazing, seed
  attribute vec3 aTint;      // façade tint
  attribute vec2 aMood;      // emissive gain, roughness bias

  varying vec2 vTileUv;
  varying vec2 vTileOrigin;
  varying vec3 vTint;
  varying vec2 vMood;
  varying float vFaceUp;
  varying float vSeed;
  varying float vHeightM;    // metres above the pavement
  varying float vGlaze;
  varying vec3  vWorldPos;
`;

const VERT_BODY = /* glsl */ `
  // Which face are we on? Box normals are axis-aligned in object space.
  vec3 n = abs(normal);
  vFaceUp = step(0.5, n.y);

  // Window grid in real metres: pick the horizontal extent of this face
  float horiz = mix(aDims.z, aDims.x, step(0.5, n.z));
  vec2 reps = vec2(max(horiz / max(aGrid.x, 0.5), 1.0), max(aDims.y / max(aGrid.y, 1.0), 1.0));
  // whole numbers only — windows must never be sliced mid-pane
  reps = floor(reps + 0.5);

  vTileUv = uv * reps;
  vTileOrigin = aTile;
  vTint = aTint;
  vMood = aMood;
  vSeed = aGrid.w;
  vGlaze = aGrid.z;
  vHeightM = (position.y + 0.5) * aDims.y;
  vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
`;

const FRAG_PARS = /* glsl */ `
  uniform sampler2D uAlbedo;
  uniform sampler2D uEmissive;
  uniform sampler2D uRough;
  uniform vec2 uAtlasScale;   // 1/cols, 1/rows
  uniform float uTime;
  uniform float uBolt;
  uniform vec3 uBoltColor;
  uniform float uWetness;

  varying vec2 vTileUv;
  varying vec2 vTileOrigin;
  varying vec3 vTint;
  varying vec2 vMood;
  varying float vFaceUp;
  varying float vSeed;
  varying float vHeightM;
  varying float vGlaze;
  varying vec3  vWorldPos;

  // atlas-safe sampling: wrap inside the tile, keep mip derivatives sane
  vec2 tileUv(vec2 uv) {
    return vTileOrigin + fract(uv) * uAtlasScale;
  }
  vec4 sampleTile(sampler2D tex, vec2 uv) {
    vec2 f = fract(uv);
    vec2 dx = dFdx(uv) * uAtlasScale;
    vec2 dy = dFdy(uv) * uAtlasScale;
    return textureGrad(tex, vTileOrigin + f * uAtlasScale, dx, dy);
  }

  float lifeHash(vec2 p) {
    return fract(sin(dot(p, vec2(41.7, 289.3)) + vSeed) * 24631.7);
  }

  /**
   * Per-window life.
   *
   * Each window cell gets its own brightness curve built from three
   * incommensurate periods, so the facade never loops: rooms brighten
   * and dim on their own slow rhythm, a few flicker like a failing
   * tube, and occasionally one switches off entirely for a while.
   * Some windows also carry a moving occupant shadow crossing the pane.
   */
  float windowLife(vec2 cell, out float shadowMask) {
    float h1 = lifeHash(cell);
    float h2 = lifeHash(cell + 17.3);
    float h3 = lifeHash(cell + 91.7);

    // slow occupancy: is anyone home right now?
    float period = 90.0 + h1 * 240.0;
    float occupancy = step(0.22, fract(uTime / period + h2));

    // gentle brightness drift — a room is never a constant value
    float drift = 0.78 + 0.22 * sin(uTime * (0.08 + h3 * 0.14) + h1 * 6.283);

    // a small fraction of windows are failing fluorescents
    float flicker = 1.0;
    if (h3 > 0.94) {
      float f = sin(uTime * (14.0 + h1 * 22.0)) * sin(uTime * (37.0 + h2 * 30.0));
      flicker = 0.35 + 0.65 * step(-0.25, f);
    }

    // occupant / curtain shadow sweeping the pane
    shadowMask = 0.0;
    if (h2 > 0.82) {
      float sweep = fract(uTime * (0.05 + h1 * 0.08) + h3);
      shadowMask = smoothstep(0.12, 0.0, abs(fract(vTileUv.x) - sweep)) * 0.55;
    }

    return occupancy * drift * flicker;
  }

  ${WETNESS_GLSL}

  // Written by the map chunk, read by the roughness chunk — three.js
  // splices these in as separate blocks inside the same main(), so a
  // file-scope global is how they communicate.
  float gWet = 0.0;
`;

/** Patch MeshStandardMaterial so it reads the atlas per instance. */
function makeFacadeMaterial(q: Quality): THREE.MeshStandardMaterial {
  const atlas = getFacadeAtlas();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.06,
    envMapIntensity: 0.7,
  });

  mat.userData.uniforms = {
    uAlbedo: { value: atlas.albedo },
    uEmissive: { value: atlas.emissive },
    uRough: { value: atlas.roughness },
    uAtlasScale: { value: new THREE.Vector2(1 / ATLAS_COLS, 1 / ATLAS_ROWS) },
    uTime: { value: 0 },
    uBolt: { value: 0 },
    uBoltColor: { value: new THREE.Color("#dceeff") },
    uWetness: { value: 0.75 },
  };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, mat.userData.uniforms);

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERT_PARS}`)
      .replace("#include <uv_vertex>", `#include <uv_vertex>\n${VERT_BODY}`);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAG_PARS}`)
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        vec4 facade = sampleTile(uAlbedo, vTileUv);
        // roofs: flat gravel-and-tar, never windows
        vec3 roofCol = vec3(0.055, 0.062, 0.075) * (0.8 + 0.4 * fract(vSeed * 0.017));
        vec3 base = mix(facade.rgb * vTint, roofCol, vFaceUp);

        // ── the facade is soaked ──
        // Water runs down walls in streaks and pools on flat roofs. The
        // streak pattern is keyed to world position so neighbouring
        // buildings never share a pattern.
        float upFace = 1.0 - vFaceUp;
        float streak = rainStreaks(
          vec2(vWorldPos.x * 0.14 + vWorldPos.z * 0.11, vHeightM * 0.03),
          upFace, uTime);
        // rain cannot reach deep under overhangs, and the top of a wall
        // is always wetter than the sheltered base
        float exposure = mix(0.45, 1.0, clamp(vHeightM / 24.0, 0.0, 1.0));
        float wallWet = uWetness * exposure * (0.35 + streak * 0.9);
        // roofs hold standing water in low spots
        float roofWet = uWetness * puddleMask(vWorldPos.xz, uWetness) * vFaceUp;
        float wet = clamp(max(wallWet * upFace, roofWet), 0.0, 1.0);

        float wetF0 = 0.04;
        float wetRough = 1.0;
        applyWetness(base, wetRough, wetF0, wet, mix(0.75, 0.3, vGlaze));
        gWet = wet;

        diffuseColor.rgb *= base;
        `
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        float roughnessFactor = roughness;
        float rmap = sampleTile(uRough, vTileUv).g;
        roughnessFactor *= mix(rmap, 0.72, vFaceUp);
        // glazed curtain walls are smoother overall
        roughnessFactor *= mix(1.0, 0.55, vGlaze * (1.0 - vFaceUp));
        roughnessFactor = clamp(roughnessFactor + vMood.y, 0.045, 1.0);
        // water fills the microsurface — a soaked wall goes glossy
        roughnessFactor = mix(roughnessFactor, 0.075, gWet * 0.85);
        `
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `
        vec3 winds = sampleTile(uEmissive, vTileUv).rgb;
        // rooftops never glow
        winds *= (1.0 - vFaceUp);

        // ── the building breathes ──
        float occShadow = 0.0;
        float life = windowLife(floor(vTileUv), occShadow);
        winds *= life * (1.0 - occShadow);
        totalEmissiveRadiance += winds * vMood.x;
        // lightning briefly relights the whole façade
        totalEmissiveRadiance += uBoltColor * uBolt * 0.22 * (1.0 - vFaceUp) * (0.5 + 0.5 * facade.g);
        `
      );
  };

  mat.customProgramCacheKey = () => `picksaw-facade-${q.tier}`;
  return mat;
}

/** Cheap distant material — emissive haze blobs, no lighting maths. */
function makeFarMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color("#0c1526"),
    fog: true,
    toneMapped: true,
  });
}

// ── the component ──────────────────────────────────────────────────────────

interface Batch {
  mesh: THREE.InstancedMesh;
  tile: THREE.InstancedBufferAttribute;
  dims: THREE.InstancedBufferAttribute;
  grid: THREE.InstancedBufferAttribute;
  tint: THREE.InstancedBufferAttribute;
  mood: THREE.InstancedBufferAttribute;
}

function makeBatch(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  max: number,
  withAttrs: boolean
): Batch {
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.frustumCulled = false;
  mesh.count = 0;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const attr = (n: number) => {
    const a = new THREE.InstancedBufferAttribute(new Float32Array(max * n), n);
    a.setUsage(THREE.DynamicDrawUsage);
    return a;
  };
  const tile = attr(2);
  const dims = attr(3);
  const grid = attr(4);
  const tint = attr(3);
  const mood = attr(2);

  if (withAttrs) {
    geo.setAttribute("aTile", tile);
    geo.setAttribute("aDims", dims);
    geo.setAttribute("aGrid", grid);
    geo.setAttribute("aTint", tint);
    geo.setAttribute("aMood", mood);
  }
  return { mesh, tile, dims, grid, tint, mood };
}

export default function Buildings({ quality }: { quality: Quality }) {
  const specs = useMemo(
    () => buildCitySorted(quality.buildingRows),
    [quality.buildingRows]
  );

  const nearMat = useMemo(() => makeFacadeMaterial(quality), [quality]);
  const farMat = useMemo(() => makeFarMaterial(), []);

  const { near, far } = useMemo(() => {
    // Separate geometries: instanced attributes live on the geometry, so
    // the two batches cannot share one.
    const nearGeo = new THREE.BoxGeometry(1, 1, 1);
    const farGeo = new THREE.BoxGeometry(1, 1, 1);
    const n = makeBatch(nearGeo, nearMat, MAX_NEAR, true);
    const f = makeBatch(farGeo, farMat, MAX_FAR, false);
    n.mesh.castShadow = quality.shadows;
    n.mesh.receiveShadow = quality.shadows;
    return { near: n, far: f };
  }, [nearMat, farMat, quality.shadows]);

  // crowns / setback blocks ride a third batch reusing the façade material
  const crowns = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const b = makeBatch(geo, nearMat, MAX_NEAR, true);
    b.mesh.castShadow = quality.shadows;
    return b;
  }, [nearMat, quality.shadows]);

  const tileUv = useMemo(() => {
    const map = new Map<number, [number, number]>();
    for (const s of specs) {
      const t = tileFor(s.district.kind, s.seed);
      map.set(s.id, [(t % ATLAS_COLS) / ATLAS_COLS, Math.floor(t / ATLAS_COLS) / ATLAS_ROWS]);
    }
    return map;
  }, [specs]);

  const tints = useMemo(() => {
    const map = new Map<number, THREE.Color>();
    const c = new THREE.Color();
    for (const s of specs) {
      // per-building tonal drift so no two façades read identically
      const k = 0.82 + ((s.seed % 37) / 37) * 0.4;
      c.set("#ffffff").multiplyScalar(k);
      map.set(s.id, c.clone());
    }
    return map;
  }, [specs]);

  const cursor = useRef({ lo: 0, hi: 0 });
  const mat4 = useMemo(() => new THREE.Matrix4(), []);
  const quat = useMemo(() => new THREE.Quaternion(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const scl = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const frame = useRef(0);

  useEffect(
    () => () => {
      near.mesh.geometry.dispose();
      far.mesh.geometry.dispose();
      crowns.mesh.geometry.dispose();
      nearMat.dispose();
      farMat.dispose();
    },
    [near, far, crowns, nearMat, farMat]
  );

  useFrame(() => {
    const u = nearMat.userData.uniforms;
    if (u) {
      u.uTime.value = journey.time;
      u.uBolt.value = journey.bolt;
      // the district soaks through as the storm builds
      u.uWetness.value = 0.45 + journey.storm * 0.5;
    }

    // Refresh the visible window every 3rd frame — the camera can only
    // move a couple of metres in that time, and the near band is 60 m deep.
    frame.current++;
    if (frame.current % 3 !== 0) return;

    const camS = journey.s;
    const nearBand = quality.viewDistance * 0.34;
    const farBand = quality.viewDistance;
    const back = 55;

    // advance the sliding window (specs are sorted by s)
    const c = cursor.current;
    while (c.lo < specs.length && specs[c.lo].s < camS - back) c.lo++;
    while (c.lo > 0 && specs[c.lo - 1].s >= camS - back) c.lo--;
    while (c.hi < specs.length && specs[c.hi].s < camS + farBand) c.hi++;
    while (c.hi > c.lo && specs[c.hi - 1].s >= camS + farBand) c.hi--;

    let nCount = 0;
    let fCount = 0;
    let cCount = 0;

    for (let i = c.lo; i < c.hi; i++) {
      const b = specs[i];
      const ds = b.s - camS;
      const isNear = ds < nearBand && ds > -back;

      pos.set(b.x, b.y + b.height * 0.5, b.z);
      euler.set(0, b.rotY, 0);
      quat.setFromEuler(euler);
      scl.set(b.width, b.height, b.depth);
      mat4.compose(pos, quat, scl);

      if (isNear && nCount < MAX_NEAR) {
        near.mesh.setMatrixAt(nCount, mat4);
        writeAttrs(near, nCount, b, tileUv, tints);
        nCount++;

        if (b.crown && cCount < MAX_NEAR) {
          const [cw, cd, chh] = b.crown;
          pos.set(b.x, b.y + b.height + chh * 0.5, b.z);
          scl.set(b.width * cw, chh, b.depth * cd);
          mat4.compose(pos, quat, scl);
          crowns.mesh.setMatrixAt(cCount, mat4);
          writeAttrs(crowns, cCount, b, tileUv, tints, chh);
          cCount++;
        }
      } else if (fCount < MAX_FAR) {
        far.mesh.setMatrixAt(fCount, mat4);
        fCount++;
      }
    }

    near.mesh.count = nCount;
    far.mesh.count = fCount;
    crowns.mesh.count = cCount;
    near.mesh.instanceMatrix.needsUpdate = true;
    far.mesh.instanceMatrix.needsUpdate = true;
    crowns.mesh.instanceMatrix.needsUpdate = true;
    near.tile.needsUpdate = true;
    near.dims.needsUpdate = true;
    near.grid.needsUpdate = true;
    near.tint.needsUpdate = true;
    near.mood.needsUpdate = true;
    crowns.tile.needsUpdate = true;
    crowns.dims.needsUpdate = true;
    crowns.grid.needsUpdate = true;
    crowns.tint.needsUpdate = true;
    crowns.mood.needsUpdate = true;
  });

  return (
    <>
      <primitive object={near.mesh} />
      <primitive object={crowns.mesh} />
      <primitive object={far.mesh} />
    </>
  );
}

function writeAttrs(
  batch: Batch,
  i: number,
  b: BuildingSpec,
  tileUv: Map<number, [number, number]>,
  tints: Map<number, THREE.Color>,
  heightOverride?: number
) {
  const t = tileUv.get(b.id)!;
  batch.tile.setXY(i, t[0], t[1]);
  batch.dims.setXYZ(i, b.width, heightOverride ?? b.height, b.depth);
  batch.grid.setXYZW(i, b.bayWidth, b.floorHeight, b.glazing, b.seed % 997);
  const c = tints.get(b.id)!;
  batch.tint.setXYZ(i, c.r, c.g, c.b);
  // emissive gain scales with occupancy; roughness bias with district polish
  batch.mood.setXY(i, 0.55 + b.occupancy * 1.5, -b.district.polish * 0.25);
}
