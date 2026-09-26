/**
 * lod.worker — off-main-thread mesh simplification.
 *
 * Runs meshoptimizer's error-bounded simplifier so the city's LODs are
 * built while the intro loader is still up, without ever costing the
 * render loop a frame. The WASM module ships inside meshoptimizer's JS
 * bundle (no separate .wasm fetch), so this works as an inline worker.
 *
 * Everything here is best-effort: if WASM is unavailable, the message
 * fails, or the tab is closed mid-flight, the caller simply keeps the
 * original geometry and the scene renders exactly as it always did.
 */

import { MeshoptSimplifier } from "meshoptimizer/simplifier";

export interface LodRequest {
  id: number;
  /** Interleaved-free xyz positions, tightly packed. */
  positions: Float32Array;
  indices: Uint32Array;
  /** How far we would *like* to go (a floor, not a promise). */
  targetIndexCount: number;
  /** Absolute world-space deviation the result must not exceed. */
  targetError: number;
  /** Keep open-boundary vertices pinned (default true). */
  lockBorder?: boolean;
  /** Collapse duplicate positions first so edges become collapsible. */
  weld?: boolean;
}

export interface LodResponse {
  id: number;
  indices?: Uint32Array;
  /** Achieved absolute error, world units. -1 means "failed". */
  error: number;
  /** Present only on failure. */
  failed?: string;
}

const ctx = self as unknown as Worker;
let readyPromise: Promise<void> | null = null;

ctx.onmessage = async (event: MessageEvent<LodRequest>) => {
  const { id, positions, indices, targetIndexCount, targetError } = event.data;
  const lockBorder = event.data.lockBorder !== false;
  const weld = event.data.weld === true;
  try {
    readyPromise ??= MeshoptSimplifier.ready;
    await readyPromise;

    // LockBorder keeps open edges pinned, so neighbouring shells never
    // develop cracks. ErrorAbsolute reports the deviation in world units
    // (not as a fraction of the mesh diagonal) — that is what lets the
    // caller convert it into an exact screen-space pixel budget.
    // Unwelded source (every face owns its own vertices) has no shared
    // edges, so the simplifier has nothing to collapse — remapping to
    // one canonical vertex per position gives it real edges to work
    // with. The remapped indices still address the ORIGINAL position
    // buffer, so the result needs no vertex upload.
    const remap = weld ? MeshoptSimplifier.generatePositionRemap(positions, 3) : null;
    let src = indices;
    if (remap) {
      src = new Uint32Array(indices.length);
      for (let i = 0; i < indices.length; i++) src[i] = remap[indices[i]];
    }

    const [out, error] = MeshoptSimplifier.simplify(
      src,
      positions,
      3,
      targetIndexCount,
      targetError,
      lockBorder ? ["LockBorder", "ErrorAbsolute"] : ["ErrorAbsolute"],
    );

    const transfer: Transferable[] = [];
    if (out?.buffer) transfer.push(out.buffer as ArrayBuffer);
    ctx.postMessage({ id, indices: out, error }, transfer);
  } catch (err) {
    ctx.postMessage({ id, error: -1, failed: String(err) });
  }
};
