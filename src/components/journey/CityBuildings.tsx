/**
 * CityBuildings — the corridor's skyline, with real materials.
 *
 * The LAYOUT is the original: same deterministic seed, same flanking
 * rows, same mobile tuning, so the corridor frames the way it always
 * did. What changed is what the buildings are MADE of:
 *
 *   before   MeshBasicMaterial + a repeated window canvas, plus a
 *            wireframe overlay. Unlit, so the facades read flat and the
 *            blue edges did all the shape work.
 *
 *   now      MeshStandardMaterial with a facade atlas — masonry albedo,
 *            an emissive pass for the lit windows, and a roughness map.
 *            Real moonlight picks out the massing, and the windows glow
 *            because they EMIT rather than because they are painted
 *            bright.
 *
 * The blue edge highlight is kept — it is the signature of this city —
 * but it sits on top of lit geometry now instead of substituting for it.
 *
 * COVERAGE
 *
 * The city extends to the END OF THE WALK, not to the last painting.
 * That distinction matters: the hallway continues past the templates
 * into the Trust / Process / Contact stations, and deriving the extent
 * from the last painting left those panels standing in 22 units of bare
 * void. It also means adding templates in templatesConfig.ts extends
 * the city automatically — the buildings can never run out.
 */

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cityEndZ } from "./Corridor";

const FLOOR_Y = -2.9;

// ── the facade atlas ───────────────────────────────────────────────────────

const TILE = 256;
const COLS = 4;
const ROWS = 2;

interface Atlas {
  albedo: THREE.CanvasTexture;
  emissive: THREE.CanvasTexture;
  rough: THREE.CanvasTexture;
  dispose(): void;
}

/**
 * Eight facade variants: different window rhythms and occupancies, in
 * the corridor's cyan-and-white palette so the district still reads as
 * the same city.
 */
function buildAtlas(): Atlas {
  const mk = () => {
    const c = document.createElement("canvas");
    c.width = TILE * COLS;
    c.height = TILE * ROWS;
    return c;
  };
  const ca = mk();
  const ce = mk();
  const cr = mk();
  const A = ca.getContext("2d")!;
  const E = ce.getContext("2d")!;
  const R = cr.getContext("2d")!;

  let seed = 1337;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let t = 0; t < COLS * ROWS; t++) {
    const ox = (t % COLS) * TILE;
    const oy = Math.floor(t / COLS) * TILE;
    const cols = 4 + Math.floor(rnd() * 3);
    const rows = 7 + Math.floor(rnd() * 5);
    const cw = TILE / cols;
    const ch = TILE / rows;
    const occupancy = 0.55 + rnd() * 0.4;

    const g = A.createLinearGradient(ox, oy, ox, oy + TILE);
    g.addColorStop(0, "#0d1220");
    g.addColorStop(0.6, "#080c16");
    g.addColorStop(1, "#05080f");
    A.fillStyle = g;
    A.fillRect(ox, oy, TILE, TILE);

    R.fillStyle = "rgb(205,205,205)";
    R.fillRect(ox, oy, TILE, TILE);
    E.fillStyle = "#000000";
    E.fillRect(ox, oy, TILE, TILE);

    for (let i = 0; i < 260; i++) {
      A.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.06)";
      A.fillRect(ox + rnd() * TILE, oy + rnd() * TILE, rnd() * 12 + 1, rnd() * 3 + 1);
    }
    A.fillStyle = "rgba(0,0,0,0.5)";
    for (let y = 0; y <= rows; y++) A.fillRect(ox, oy + y * ch - 1, TILE, 2);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const px = ox + x * cw + cw * 0.18;
        const py = oy + y * ch + ch * 0.2;
        const pw = cw * 0.64;
        const ph = ch * 0.55;

        A.fillStyle = "#060a12";
        A.fillRect(px, py, pw, ph);
        R.fillStyle = "rgb(52,52,52)";
        R.fillRect(px, py, pw, ph);

        if (rnd() > occupancy) continue;

        const bright = 0.35 + rnd() * 0.65;
        const white = rnd() < 0.24;
        E.fillStyle = white
          ? `rgba(${210 + bright * 45},${238 + bright * 17},255,${0.7 + bright * 0.3})`
          : `rgba(${90 + bright * 80},${195 + bright * 50},255,${0.55 + bright * 0.45})`;
        E.fillRect(px, py, pw, ph);

        // interior clutter so a lit room is not a flat rectangle
        E.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.35})`;
        if (rnd() < 0.4) {
          const lines = 3 + Math.floor(rnd() * 4);
          for (let k = 0; k < lines; k++)
            E.fillRect(px, py + (ph / lines) * k, pw, ph / lines / 2.4);
        } else {
          E.fillRect(px + rnd() * pw * 0.5, py + ph * 0.45, pw * 0.3, ph * 0.55);
        }

        A.fillStyle = white ? "rgba(200,235,255,0.05)" : "rgba(90,190,255,0.05)";
        A.fillRect(px - 3, py - 3, pw + 6, ph + 6);
      }
    }

    // rain streaks — the city is always wet
    for (let i = 0; i < 26; i++) {
      const sx = ox + rnd() * TILE;
      const sw = 1 + rnd() * 3;
      const sh = 30 + rnd() * (TILE - 30);
      const sy = oy + rnd() * (TILE - sh);
      A.fillStyle = `rgba(6,10,18,${0.06 + rnd() * 0.12})`;
      A.fillRect(sx, sy, sw, sh);
      R.fillStyle = `rgba(95,95,95,${0.3 + rnd() * 0.4})`;
      R.fillRect(sx, sy, sw, sh);
    }
  }

  const wrap = (c: HTMLCanvasElement, srgb: boolean) => {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 4;
    return tex;
  };
  const albedo = wrap(ca, true);
  const emissive = wrap(ce, true);
  const rough = wrap(cr, false);
  return {
    albedo,
    emissive,
    rough,
    dispose() {
      albedo.dispose();
      emissive.dispose();
      rough.dispose();
    },
  };
}

// ── layout ─────────────────────────────────────────────────────────────────

interface Building {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  tile: number;
  tier: boolean;
  antenna: boolean;
  uRep: number;
  vRep: number;
  tint: number;
}

function makeCity(isMobile: boolean): Building[] {
  const list: Building[] = [];
  let seed = 20260824;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const startZ = 8;
  /**
   * Runs to the end of the WALK, with a margin past the exit so the
   * final panel still has a street around it and the fog has something
   * to hide. cityEndZ() follows the station list, so adding templates
   * extends the city automatically.
   */
  const endZ = cityEndZ();
  const step = isMobile ? 4.0 : 4.5;
  const nearX = isMobile ? 2.0 : 5.4;
  const rowGap = isMobile ? 1.9 : 4.5;

  for (let z = startZ; z > endZ; z -= step) {
    for (const side of [-1, 1]) {
      const rows = rnd() < 0.55 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        const w = 1.6 + rnd() * 2.6;
        const d = 1.6 + rnd() * 2.6;
        const h = 2 + rnd() * 7.5;
        const x = side * (nearX + r * rowGap + rnd() * 1.6);
        const tall = h > 6.5;
        list.push({
          x: x + (rnd() - 0.5) * 1.4,
          z: z + (rnd() - 0.5) * step * 0.7,
          w,
          h,
          d,
          tile: Math.floor(rnd() * COLS * ROWS),
          tier: tall || rnd() < 0.3,
          antenna: tall && rnd() < 0.75,
          uRep: Math.max(1, Math.round(w / 1.5)),
          vRep: Math.max(1, Math.round(h / 2.6)),
          tint: 0.82 + rnd() * 0.36,
        });
      }
    }
  }
  return list;
}

// ── per-instance atlas + tiling, injected into MeshStandardMaterial ────────

const VERT_PARS = /* glsl */ `
  attribute vec2 aTile;
  attribute vec2 aRep;
  attribute float aTint;
  varying vec2 vTileOrigin;
  varying vec2 vTiled;
  varying float vTint;
  varying float vUp;
`;

const VERT_BODY = /* glsl */ `
  vTileOrigin = aTile;
  vTiled = uv * aRep;
  vTint = aTint;
  vUp = step(0.5, abs(normal.y));
`;

const FRAG_PARS = /* glsl */ `
  uniform sampler2D uAlbedo;
  uniform sampler2D uEmissive;
  uniform sampler2D uRough;
  uniform vec2 uAtlasScale;
  uniform float uBolt;
  varying vec2 vTileOrigin;
  varying vec2 vTiled;
  varying float vTint;
  varying float vUp;

  vec4 tileSample(sampler2D tex, vec2 uv) {
    vec2 f = fract(uv);
    vec2 dx = dFdx(uv) * uAtlasScale;
    vec2 dy = dFdy(uv) * uAtlasScale;
    return textureGrad(tex, vTileOrigin + f * uAtlasScale, dx, dy);
  }
`;

export default function CityBuildings({ bolt = 0 }: { bolt?: number }) {
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const buildings = useMemo(() => makeCity(isMobile), [isMobile]);
  const atlas = useMemo(() => buildAtlas(), []);

  const { group, material, edgeMat } = useMemo(() => {
    const uniforms = {
      uAlbedo: { value: atlas.albedo },
      uEmissive: { value: atlas.emissive },
      uRough: { value: atlas.rough },
      uAtlasScale: { value: new THREE.Vector2(1 / COLS, 1 / ROWS) },
      uBolt: { value: 0 },
    };

    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.82,
      metalness: 0.05,
      fog: true,
    });
    mat.userData.uniforms = uniforms;
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\n${VERT_PARS}`)
        .replace("#include <uv_vertex>", `#include <uv_vertex>\n${VERT_BODY}`);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${FRAG_PARS}`)
        .replace(
          "#include <map_fragment>",
          /* glsl */ `
          vec4 facade = tileSample(uAlbedo, vTiled);
          vec3 roofCol = vec3(0.028, 0.034, 0.045);
          diffuseColor.rgb *= mix(facade.rgb * vTint, roofCol, vUp);
          `
        )
        .replace(
          "#include <roughnessmap_fragment>",
          /* glsl */ `
          float roughnessFactor = roughness;
          roughnessFactor *= mix(tileSample(uRough, vTiled).g, 0.8, vUp);
          roughnessFactor = clamp(roughnessFactor, 0.05, 1.0);
          `
        )
        .replace(
          "#include <emissivemap_fragment>",
          /* glsl */ `
          vec3 win = tileSample(uEmissive, vTiled).rgb * (1.0 - vUp);
          totalEmissiveRadiance += win * 1.35;
          totalEmissiveRadiance += vec3(0.35, 0.45, 0.6) * uBolt * 0.3 * (1.0 - vUp);
          `
        );
    };
    mat.customProgramCacheKey = () => "picksaw-corridor-facade";

    const box = new THREE.BoxGeometry(1, 1, 1);
    const crownGeo = new THREE.BoxGeometry(1, 1, 1);
    const crowns = buildings.filter((b) => b.tier);

    const mkBatch = (geo: THREE.BufferGeometry, n: number) => {
      const m = new THREE.InstancedMesh(geo, mat, Math.max(n, 1));
      m.frustumCulled = false;
      m.count = n;
      const tiles = new Float32Array(n * 2);
      const reps = new Float32Array(n * 2);
      const tints = new Float32Array(n);
      geo.setAttribute("aTile", new THREE.InstancedBufferAttribute(tiles, 2));
      geo.setAttribute("aRep", new THREE.InstancedBufferAttribute(reps, 2));
      geo.setAttribute("aTint", new THREE.InstancedBufferAttribute(tints, 1));
      return { mesh: m, tiles, reps, tints };
    };

    const masses = mkBatch(box, buildings.length);
    const tiers = mkBatch(crownGeo, crowns.length);

    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();

    const writeTile = (
      dst: { tiles: Float32Array; reps: Float32Array; tints: Float32Array },
      i: number,
      b: Building,
      uRep: number,
      vRep: number
    ) => {
      dst.tiles[i * 2] = (b.tile % COLS) / COLS;
      dst.tiles[i * 2 + 1] = Math.floor(b.tile / COLS) / ROWS;
      dst.reps[i * 2] = uRep;
      dst.reps[i * 2 + 1] = vRep;
      dst.tints[i] = b.tint;
    };

    buildings.forEach((b, i) => {
      p.set(b.x, FLOOR_Y + b.h / 2, b.z);
      s.set(b.w, b.h, b.d);
      m4.compose(p, q, s);
      masses.mesh.setMatrixAt(i, m4);
      writeTile(masses, i, b, b.uRep, b.vRep);
    });
    crowns.forEach((b, i) => {
      const th = b.h * 0.32;
      p.set(b.x, FLOOR_Y + b.h + th / 2, b.z);
      s.set(b.w * 0.68, th, b.d * 0.68);
      m4.compose(p, q, s);
      tiers.mesh.setMatrixAt(i, m4);
      writeTile(tiers, i, b, Math.max(1, b.uRep - 1), 1);
    });
    masses.mesh.instanceMatrix.needsUpdate = true;
    tiers.mesh.instanceMatrix.needsUpdate = true;

    // ── the blue edge signature, kept ──
    const edgeMat = new THREE.LineBasicMaterial({
      color: "#2f7bff",
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: true,
    });
    const edgePositions: number[] = [];
    const unit = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const unitPos = unit.getAttribute("position") as THREE.BufferAttribute;
    for (const b of buildings) {
      for (let i = 0; i < unitPos.count; i++) {
        edgePositions.push(
          unitPos.getX(i) * b.w + b.x,
          unitPos.getY(i) * b.h + FLOOR_Y + b.h / 2,
          unitPos.getZ(i) * b.d + b.z
        );
      }
    }
    unit.dispose();
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    edges.frustumCulled = false;

    // ── antenna tips ──
    const tipGeo = new THREE.SphereGeometry(0.055, 6, 6);
    const tipMat = new THREE.MeshBasicMaterial({ color: "#9fe8ff", fog: true, toneMapped: false });
    const antennas = buildings.filter((b) => b.antenna);
    const tips = new THREE.InstancedMesh(tipGeo, tipMat, Math.max(antennas.length, 1));
    tips.count = antennas.length;
    tips.frustumCulled = false;
    antennas.forEach((b, i) => {
      const topY = FLOOR_Y + b.h + (b.tier ? b.h * 0.32 : 0) + 1.2;
      p.set(b.x, topY, b.z);
      s.set(1, 1, 1);
      m4.compose(p, q, s);
      tips.setMatrixAt(i, m4);
    });
    tips.instanceMatrix.needsUpdate = true;

    const g = new THREE.Group();
    g.add(masses.mesh, tiers.mesh, edges, tips);
    g.userData.dispose = () => {
      box.dispose();
      crownGeo.dispose();
      edgeGeo.dispose();
      tipGeo.dispose();
      tipMat.dispose();
    };
    return { group: g, material: mat, edgeMat };
  }, [buildings, atlas]);

  useEffect(
    () => () => {
      group.userData.dispose?.();
      material.dispose();
      edgeMat.dispose();
      atlas.dispose();
    },
    [group, material, edgeMat, atlas]
  );

  useFrame(() => {
    const u = material.userData.uniforms;
    if (u) u.uBolt.value = bolt;
    edgeMat.opacity = 0.32 + bolt * 0.4;
  });

  return (
    <>
      {/* the ground the city stands on — sized from the same walk length */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_Y - 0.02, cityEndZ() / 2]}
        receiveShadow
      >
        <planeGeometry args={[110, Math.abs(cityEndZ()) + 60]} />
        <meshStandardMaterial color="#05070d" roughness={0.35} metalness={0.25} />
      </mesh>
      <primitive object={group} />
    </>
  );
}
