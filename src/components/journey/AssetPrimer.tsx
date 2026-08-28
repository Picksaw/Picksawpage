import { Suspense, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { GLTFLoader, MeshoptDecoder } from "three-stdlib";
import {
  markAssetDone,
  markAssetStarted,
  reportAssetProgress,
  type AssetKey,
} from "../../lib/assetProgress";

/**
 * AssetPrimer — starts the city's heavy downloads (5 GLBs ≈ 28MB plus the
 * 4×2K wet-asphalt set ≈ 8.5MB) right away and reports byte-level progress
 * to assetProgress for the detailed loader.
 *
 * It deliberately re-uses the same loader CLASSES and URLs as the scene:
 * drei's useGLTF / useTexture share one loader cache (keyed by loader +
 * url), so when <City /> mounts its hooks resolve straight from this
 * primer's cache — no second download, and the 3D hero no longer waits
 * behind the whole city (City is Suspense-isolated in CorridorScene).
 *
 * Previously these files were preloaded at module-evaluation time, i.e.
 * in the middle of script execution, while the single-file page was still
 * painting — the #1 cause of the long first load.
 */

const B = import.meta.env.BASE_URL;

/** Order + names must match Corridor's City() and PuddleMaterial(). */
export const CITY_MODELS: { key: AssetKey; file: string }[] = [
  { key: "azadi", file: "azadi_tower.glb" },
  { key: "milad", file: "milad_tower.glb" },
  { key: "skyline", file: "new_york_background_building_1.glb" },
  { key: "block", file: "realistic_building.glb" },
  { key: "lowrise", file: "low_rise_wall_to_wall_office_building.glb" },
];

/** Must mirror PuddleMaterial's useTexture key order (map, normal, rough, ao).
 *  WebP at the same 2K resolution — visually identical, ~45% smaller. */
export const ASPHALT_URLS = [
  B + "road/aerial_asphalt_01_diff_2k.webp",
  B + "road/aerial_asphalt_01_nor_gl_2k.webp",
  B + "road/aerial_asphalt_01_rough_2k.webp",
  B + "road/aerial_asphalt_01_ao_2k.webp",
];

function ModelPrimer({ file, assetKey }: { file: string; assetKey: AssetKey }) {
  useLoader(
    GLTFLoader,
    B + file,
    // the city GLBs ship EXT_meshopt_compression — same decoder drei's
    // useGLTF installs (City's path), so both sides read the same cache
    (loader) => loader.setMeshoptDecoder(MeshoptDecoder),
    (e: ProgressEvent) => {
      reportAssetProgress(assetKey, e.loaded, e.total || 0);
    },
  );
  useEffect(() => {
    markAssetStarted(assetKey);
    // runs only after the suspense promise resolved → bytes are cached
    markAssetDone(assetKey);
  }, [assetKey]);
  return null;
}

/** The asphalt set is 4 files without per-file byte callbacks, so it
 *  reports as indeterminate ("…") while streaming and 100% once cached. */
function AsphaltPrimer() {
  useLoader(TextureLoader, ASPHALT_URLS, undefined);
  useEffect(() => markAssetDone("asphalt"), []);
  return null;
}

/** NOT suspense-wrapped: mounts instantly, so the loader can show the
 *  asset as "in flight" before the first byte callback arrives (matters
 *  for the asphalt set, which has no byte callbacks at all). */
function AssetStart({ assetKey }: { assetKey: AssetKey }) {
  useEffect(() => markAssetStarted(assetKey), [assetKey]);
  return null;
}

export default function AssetPrimer() {
  // IMPORTANT: no start delay. This component renders BEFORE the <Canvas>
  // in Journey, and R3F renders its tree in a layout effect — so these
  // useLoader calls (which share one cache with drei's useGLTF /
  // useTexture, keyed by loader + url) start the downloads first and
  // own the onProgress callbacks. If a delay let City's useGLTF run
  // first, the primer would only see the already-in-flight promise and
  // the loader's live percentage would never tick.
  //
  // One boundary per asset: a suspense abort must not stop the sibling
  // downloads (they all run in parallel).
  return (
    <>
      <AssetStart assetKey="azadi" />
      <AssetStart assetKey="milad" />
      <AssetStart assetKey="skyline" />
      <AssetStart assetKey="block" />
      <AssetStart assetKey="lowrise" />
      <AssetStart assetKey="asphalt" />
      {CITY_MODELS.map((m) => (
        <Suspense key={m.key} fallback={null}>
          <ModelPrimer file={m.file} assetKey={m.key} />
        </Suspense>
      ))}
      <Suspense fallback={null}>
        <AsphaltPrimer />
      </Suspense>
    </>
  );
}
