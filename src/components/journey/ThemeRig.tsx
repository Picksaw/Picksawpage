import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getTheme } from "../../lib/themeStore";
import {
  THEMES,
  createLiveTheme,
  easeTheme,
  rgbCss,
  type ThemeParams,
} from "../../lib/themes";

/**
 * ThemeRig — the WebGL atmosphere: scene fog, ambient/sun/fill lights
 * and tone-mapping exposure. Every value eases every frame toward the
 * selected theme (see lib/themes.ts), so the city crossfades from the
 * stormy night into dawn/dusk lighting without a single cut.
 */
export default function ThemeRig() {
  const { gl } = useThree();

  const fogRef = useRef<THREE.Fog>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fill1Ref = useRef<THREE.PointLight>(null);
  const fill2Ref = useRef<THREE.PointLight>(null);

  // start exactly on the storm look (also the fog's initial args)
  const live = useRef<ThemeParams>(createLiveTheme(getTheme()));

  useFrame((_, delta) => {
    // looser clamp than the 50ms sim cap so slow frames don't freeze
    // the atmosphere crossfade on low-fps / software-rendered devices
    const dt = Math.min(delta, 0.25);
    const p = easeTheme(live.current, THEMES[getTheme()], dt);

    if (fogRef.current) {
      fogRef.current.color.setRGB(p.fog[0] / 255, p.fog[1] / 255, p.fog[2] / 255);
      fogRef.current.near = p.fogNear;
      fogRef.current.far = p.fogFar;
    }

    if (ambientRef.current) {
      ambientRef.current.color.setRGB(
        p.ambient[0] / 255,
        p.ambient[1] / 255,
        p.ambient[2] / 255,
      );
      ambientRef.current.intensity = p.ambientI;
    }

    if (sunRef.current) {
      sunRef.current.color.setRGB(
        p.sunLight[0] / 255,
        p.sunLight[1] / 255,
        p.sunLight[2] / 255,
      );
      sunRef.current.intensity = p.sunI;
      sunRef.current.position.set(p.sunPos[0], p.sunPos[1], p.sunPos[2]);
    }

    if (fill1Ref.current) {
      fill1Ref.current.color.setRGB(
        p.fill1[0] / 255,
        p.fill1[1] / 255,
        p.fill1[2] / 255,
      );
      fill1Ref.current.intensity = p.fill1I;
    }

    if (fill2Ref.current) {
      fill2Ref.current.color.setRGB(
        p.fill2[0] / 255,
        p.fill2[1] / 255,
        p.fill2[2] / 255,
      );
      fill2Ref.current.intensity = p.fill2I;
    }

    if (typeof gl.toneMappingExposure === "number") {
      gl.toneMappingExposure = p.exposure;
    }
  });

  const storm = THEMES.storm;
  const fogColor = rgbCss(storm.fog);

  return (
    <>
      <fog ref={fogRef} attach="fog" args={[fogColor, storm.fogNear, storm.fogFar]} />
      <ambientLight ref={ambientRef} intensity={storm.ambientI} color={rgbCss(storm.ambient)} />
      <directionalLight
        ref={sunRef}
        position={storm.sunPos as [number, number, number]}
        intensity={storm.sunI}
        color={rgbCss(storm.sunLight)}
      />
      <pointLight
        ref={fill1Ref}
        position={[2.6, -0.6, 3.4]}
        intensity={storm.fill1I}
        color={rgbCss(storm.fill1)}
      />
      <pointLight
        ref={fill2Ref}
        position={[-3, -2.4, -2]}
        intensity={storm.fill2I}
        color={rgbCss(storm.fill2)}
      />
    </>
  );
}
