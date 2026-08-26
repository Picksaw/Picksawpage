/**
 * The post stack.
 *
 * Order matters — this is the same chain a compositor would build:
 *
 *   (SSAO is deliberately NOT here — see the note below.)
 *   Bloom               luminance-thresholded so ONLY genuine emitters
 *                       (lamp heads, lit windows, neon, lightning) bloom.
 *                       The threshold sits above the brightest lit
 *                       surface, which is what makes this "selective"
 *                       without paying for a second render pass.
 *   ChromaticAberration tiny, radial — lens character, not a glitch.
 *   Vignette            pulls the eye down the street.
 *   Noise               a whisper of grain so gradients never band.
 *
 * Tone mapping is NOT in this chain: it happens in the renderer (ACES,
 * set in Lighting.tsx) so that emissive values above 1.0 survive all
 * the way to the bloom threshold instead of being clipped first.
 */

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { journey } from "../lib/journeyState";
import type { Quality } from "../lib/quality";

export default function PostFX({ quality }: { quality: Quality }) {
  const bloomRef = useRef<{ intensity: number } | null>(null);
  const caRef = useRef<{ offset: THREE.Vector2 } | null>(null);
  const vignetteRef = useRef<{ darkness: number } | null>(null);

  useFrame(() => {
    // Lightning drives the whole stack: bloom blooms harder, the lens
    // smears, and the vignette opens up as the frame is washed out.
    const b = journey.bolt;
    if (bloomRef.current) {
      bloomRef.current.intensity = 0.62 + b * 1.5 + journey.storm * 0.15;
    }
    if (caRef.current) {
      const base = 0.00035;
      const amt = base + b * 0.0016 + Math.min(1, Math.abs(journey.velocity) / 40) * 0.0006;
      caRef.current.offset.set(amt, amt * 0.6);
    }
    if (vignetteRef.current) {
      vignetteRef.current.darkness = 0.62 - b * 0.22;
    }
  });

  if (!quality.postprocessing) return null;

  return (
    /**
     * NO NORMAL PASS.
     *
     * SSAO needs a NormalPass, and a NormalPass renders the ENTIRE
     * scene a second time with `overrideMaterial` set to
     * MeshNormalMaterial. That swap defeats every custom shader in this
     * district — the facade atlas, the wet ground, the fog, the rain,
     * the portals — forcing them to be recompiled against a different
     * material on the frame it happens, and doubling the draw calls
     * forever after.
     *
     * The symptom is a black, noisy, glitching frame. Contact shadows
     * are not worth that: the district already gets its ground contact
     * from the moon's real shadow map and from the wet-ground
     * reflections, both of which are cheaper and physically grounded.
     */
    /**
     * NO MSAA ON THE COMPOSER.
     *
     * EffectComposer allocates its input and output buffers at the full
     * backing-store resolution. With frameBufferType=HalfFloat (8 bytes
     * per pixel) and multisampling=4, that is FIVE surfaces instead of
     * two: at DPR 2 on a 1440x900 window it comes to ~396 MB of render
     * targets, on top of ~85 MB of textures. Integrated GPUs start
     * evicting well below that, and an eviction or a failed allocation
     * is exactly the reported symptom — black frames with glitching.
     *
     * MSAA is also redundant here: the WebGL context is already created
     * with antialias, and the composer's final pass is a full-screen
     * quad that MSAA cannot help. Dropping it removes ~317 MB and
     * changes nothing visible.
     */
    <EffectComposer
      enabled
      multisampling={0}
      frameBufferType={THREE.HalfFloatType}
      enableNormalPass={false}
    >
      <Bloom
        ref={bloomRef as never}
        // above every lit *surface*, below every genuine *emitter*
        luminanceThreshold={0.78}
        luminanceSmoothing={0.24}
        intensity={0.62}
        mipmapBlur
        radius={0.72}
        levels={quality.tier === "high" ? 7 : 5}
        resolutionScale={quality.simplified ? 0.4 : 0.5}
      />

      {quality.chromaticAberration ? (
        <ChromaticAberration
          ref={caRef as never}
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.00035, 0.0002)}
          radialModulation
          modulationOffset={0.42}
        />
      ) : (
        <></>
      )}

      <Vignette
        ref={vignetteRef as never}
        offset={0.28}
        darkness={0.62}
        blendFunction={BlendFunction.NORMAL}
      />

      <Noise
        premultiply
        blendFunction={BlendFunction.OVERLAY}
        opacity={quality.simplified ? 0.035 : 0.055}
      />
    </EffectComposer>
  );
}

/**
 * AdaptiveDPR — keeps the frame budget, not the pixel count.
 *
 * Measures a rolling median frame time and walks the device pixel ratio
 * up or down inside the tier's allowed band. Median (not mean) so a
 * single GC pause or a lightning frame can't drag resolution down, and
 * a long cooldown between changes so resolution never visibly pumps.
 */
export function AdaptiveDPR({ quality }: { quality: Quality }) {
  const { gl, setDpr, viewport } = useThree();
  const samples = useRef<number[]>([]);
  const cooldown = useRef(0);
  const current = useRef(Math.min(quality.dpr[1], window.devicePixelRatio || 1));

  const target = quality.simplified ? 1000 / 30 : quality.tier === "low" ? 1000 / 45 : 1000 / 60;

  useEffect(() => {
    setDpr(current.current);
  }, [setDpr]);

  useFrame((_, delta) => {
    const ms = delta * 1000;
    const s = samples.current;
    s.push(ms);
    if (s.length > 90) s.shift();

    cooldown.current -= delta;
    if (cooldown.current > 0 || s.length < 60) return;

    const sorted = [...s].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const [lo, hi] = quality.dpr;
    let next = current.current;

    if (median > target * 1.25 && current.current > lo) {
      next = Math.max(lo, current.current - 0.15);
    } else if (median < target * 0.72 && current.current < hi) {
      next = Math.min(hi, current.current + 0.1);
    }

    if (Math.abs(next - current.current) > 0.01) {
      current.current = next;
      setDpr(next);
      cooldown.current = 1.6;
      s.length = 0;
    }
  });

  // expose the live value for the dev panel
  useEffect(() => {
    (window as unknown as { __picksawDpr?: () => number }).__picksawDpr = () => current.current;
    return () => {
      delete (window as unknown as { __picksawDpr?: () => number }).__picksawDpr;
    };
  }, [gl, viewport]);

  return null;
}
