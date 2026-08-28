#!/usr/bin/env node
/**
 * compress-assets.mjs — lossless-looking asset diet for mobile.
 *
 * The journey's 5 city GLBs (~25MB) and the 4×2K wet-asphalt road set
 * (~8.9MB) are the site's mobile load bottleneck. This script:
 *
 *   1. GLBs → meshopt (EXT_meshopt_compression) + WebP textures.
 *      Geometry is quantized (14-bit positions — sub-millimetre at city
 *      scale) but NOT simplified; scene graph, materials and material
 *      NAMES are preserved (Corridor's neon-window logic keys on them).
 *      No instancing / palette / join / flatten / prune of materials.
 *      drei's useGLTF decodes meshopt out of the box; AssetPrimer sets
 *      the same decoder on its raw GLTFLoader.
 *
 *   2. Road JPGs → WebP at the SAME 2K resolution (normal map at
 *      near-lossless quality — the puddle shader rides on it).
 *
 * Result: ~34MB → ~7MB streamed after first paint. Renders identically.
 *
 * Run:  node scripts/compress-assets.mjs   (needs devDeps installed;
 *       gltf-transform + sharp come with @gltf-transform/cli)
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUB = path.join(ROOT, "public");
const TMP = path.join(ROOT, ".asset-tmp");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

/** The GLBs the journey actually loads (Corridor's City + AssetPrimer). */
const CITY_MODELS = [
  "azadi_tower.glb",
  "milad_tower.glb",
  "new_york_background_building_1.glb",
  "realistic_building.glb",
  "low_rise_wall_to_wall_office_building.glb",
];

/** Road set — must mirror AssetPrimer.ASPHALT_URLS / PuddleMaterial. */
const ROAD = [
  { in: "aerial_asphalt_01_diff_2k.jpg", out: "aerial_asphalt_01_diff_2k.webp", quality: 88 },
  { in: "aerial_asphalt_01_ao_2k.jpg", out: "aerial_asphalt_01_ao_2k.webp", quality: 85 },
  { in: "aerial_asphalt_01_rough_2k.jpg", out: "aerial_asphalt_01_rough_2k.webp", quality: 85 },
  // normal map — q95 + 4:4:4 keeps the RGB-encoded normals exact enough
  // for the puddle shader (near-lossless webp balloons on noise: 5MB+)
  { in: "aerial_asphalt_01_nor_gl_2k.jpg", out: "aerial_asphalt_01_nor_gl_2k.webp", quality: 95, chroma444: true },
];

const mb = (p) => (statSync(p).size / 1048576).toFixed(2);

function compressGlb(file) {
  const src = path.join(PUB, file);
  const mid = path.join(TMP, "geo.glb");
  const dst = path.join(TMP, file);

  execFileSync(npx, [
    "gltf-transform", "optimize", src, mid,
    "--compress", "meshopt",
    "--meshopt-level", "high",
    // ── preserve the scene EXACTLY as the corridor code expects it ──
    "--flatten", "false",       // keep the node hierarchy
    "--instance", "false",      // EXT_mesh_gpu_instancing unsupported by three
    "--instance-min", "999999",
    "--palette", "false",       // Corridor keys on material names + maps
    "--join", "false",
    "--join-meshes", "false",
    "--join-named", "false",
    "--simplify", "false",      // no vertex removal — geometry untouched
    "--weld", "false",
    "--resample", "false",      // no animations anyway
    "--prune", "false",         // keep every node/mesh the code traverses
    "--prune-attributes", "false",
    "--prune-solid-textures", "false",
    "--sparse", "true",
    "--texture-compress", "false",
    "--texture-size", "8192",   // never downscale
  ], { stdio: "inherit", cwd: ROOT });

  // textures → WebP (only recompresses raster image buffers, geometry untouched)
  execFileSync(npx, [
    "gltf-transform", "webp", mid, dst, "--quality", "90",
  ], { stdio: "inherit", cwd: ROOT });

  renameSync(dst, src);
  console.log(`✓ ${file}: ${mb(path.join(TMP, "..", "public", file))} MB (was ${mb(src)})`);
}

async function convertRoad() {
  const sharp = (await import("sharp")).default;
  for (const r of ROAD) {
    const src = path.join(PUB, "road", r.in);
    const dst = path.join(PUB, "road", r.out);
    let pipe = sharp(src).webp({
      quality: r.quality,
      nearLossless: !!r.nearLossless,
      chromaSubsampling: r.chroma444 ? "4:4:4" : undefined,
      effort: 5,
    });
    await pipe.toFile(dst);
    console.log(`✓ road/${r.in} → ${r.out}  ${mb(src)}MB → ${mb(dst)}MB`);
  }
}

/** Painting screenshots drawn into the 960px painting canvas — sources
 *  wider than ~1280px are never displayed at that width. Only replaces
 *  the original when the result is actually smaller. */
const IMAGES = [
  { file: "images/aurora.webp", width: 1440, quality: 92 },
  { file: "images/lumen.webp", width: 1440, quality: 92 },
  { file: "images/clarity.webp", width: 1440, quality: 92 },
];

async function convertImages() {
  const sharp = (await import("sharp")).default;
  for (const r of IMAGES) {
    const src = path.join(PUB, r.file);
    const tmp = path.join(TMP, "img.webp");
    await sharp(src).resize({ width: r.width }).webp({ quality: r.quality, effort: 5 }).toFile(tmp);
    const before = statSync(src).size;
    const after = statSync(tmp).size;
    if (after < before * 0.9) {
      renameSync(tmp, src);
      console.log(`✓ ${r.file}: ${(before / 1048576).toFixed(2)}MB → ${(after / 1048576).toFixed(2)}MB`);
    } else {
      console.log(`· ${r.file}: kept original (${(before / 1024).toFixed(0)}KB — recompress not smaller)`);
    }
  }
}

mkdirSync(TMP, { recursive: true });
try {
  for (const f of CITY_MODELS) {
    console.log(`\n── ${f} (${mb(path.join(PUB, f))} MB) ──`);
    compressGlb(f);
  }
  console.log("\n── road textures ──");
  await convertRoad();
  console.log("\n── painting screenshots ──");
  await convertImages();
} finally {
  execFileSync(process.platform === "win32" ? "cmd" : "rm", process.platform === "win32" ? ["/c", "rmdir", "/s", "/q", TMP] : ["-rf", TMP]);
}

console.log("\nDone. GLB totals are now meshopt+WebP; update ASPHALT_URLS to .webp (see AssetPrimer/PuddleMaterial).");
