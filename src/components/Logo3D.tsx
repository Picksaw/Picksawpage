import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { onLightning } from "../lib/stormEvents";
import { makePGeometry } from "../lib/pGeometry";
import { hasWebGL } from "../lib/webgl";
import { getStorm, setDevMode } from "../lib/stormStore";

/**
 * Logo3D — the Picksaw "P" as a floating metallic object.
 * • rotates 3–5° toward the cursor (never spins)
 * • metallic reflections from three colored lights (no HDR fetch — fully offline)
 * • lightning strikes spike the cyan rim + spark emissive
 * • gentle idle float
 * • 5 quick clicks → developer mode (hidden detail)
 *
 * size prop scales the container; the canvas renders on demand when
 * offscreen and stops entirely for reduced-motion users (single frame).
 */

function PShape({ boltRef, geometry }: { boltRef: React.RefObject<number>; geometry: THREE.BufferGeometry }) {
  const group = useRef<THREE.Group>(null);
  const spark = useRef<THREE.MeshStandardMaterial>(null);
  const flashLight = useRef<THREE.PointLight>(null);

  // pointer target (normalized -1..1), eased in useFrame
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // ease toward cursor — max ~5° tilt, gentle
    current.current.x += (target.current.x - current.current.x) * Math.min(1, delta * 4);
    current.current.y += (target.current.y - current.current.y) * Math.min(1, delta * 4);
    g.rotation.y = current.current.x * 0.09; // ≈5°
    g.rotation.x = -current.current.y * 0.05; // ≈3°

    // idle float + slight stance
    g.position.y = Math.sin(t * 0.9) * 0.05;

    // lightning decay → spark + light flare
    boltRef.current = Math.max(0, boltRef.current - delta * 2.4);
    const b = boltRef.current;
    if (spark.current) {
      const pulse = 0.9 + Math.sin(t * 2.2) * 0.25;
      spark.current.emissiveIntensity = pulse * (1.2 + b * 5);
    }
    if (flashLight.current) {
      flashLight.current.intensity = 6 + b * 60;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#d9e6f5" metalness={0.92} roughness={0.24} />
      </mesh>

      {/* spark core floating in the bowl's counter */}
      <mesh position={[-0.31, 0.48, 0.42]}>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshStandardMaterial
          ref={spark}
          color="#bff1ff"
          emissive="#4fd8ff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* lightning flash light */}
      <pointLight ref={flashLight} position={[1.4, 0.6, 1.8]} intensity={6} color="#9fe8ff" distance={9} />
    </group>
  );
}

/** Fallback P glyph when WebGL is unavailable — the brand never breaks. */
function LogoFallback({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M20 54V12h14c8 0 13 5.5 13 13s-5 13-13 13H20"
        stroke="#4fd8ff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 8px rgba(79,216,255,0.6))" }}
      />
    </svg>
  );
}

interface Logo3DProps {
  size?: number;
  className?: string;
  /** Fill the parent container instead of using a fixed size. */
  fill?: boolean;
}

export default function Logo3D({ size = 64, className, fill = false }: Logo3DProps) {
  const boltRef = useRef(0);
  // one shared geometry — the extruded letter, ~2.1 world units tall
  const geometry = useMemo(() => makePGeometry(2.1 / 96), []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => onLightning((i) => (boltRef.current = Math.min(1.4, i + 0.4))), []);

  // pause rendering when offscreen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // dev mode — 5 clicks within 2s
  const clicks = useRef<number[]>([]);
  const handleClick = () => {
    const now = performance.now();
    clicks.current = [...clicks.current.filter((t) => now - t < 2000), now];
    if (clicks.current.length >= 5) {
      clicks.current = [];
      setDevMode(!getStorm().devMode);
    }
  };

  if (!hasWebGL()) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ""}`}
        style={fill ? { width: "100%", height: "100%" } : { width: size, height: size }}
        onClick={handleClick}
        role="img"
        aria-label="Picksaw logo"
      >
        <LogoFallback size={Math.round((fill ? 200 : size) * 0.7)} />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      style={fill ? { width: "100%", height: "100%" } : { width: size, height: size }}
      onClick={handleClick}
      role="img"
      aria-label="Picksaw logo"
    >
      <Canvas
        dpr={[1, 1.6]}
        frameloop={reduced ? "demand" : visible ? "always" : "never"}
        camera={{ position: [0, 0, 4.6], fov: 38 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[-3, 4, 3]} intensity={1.5} color="#eaf6ff" />
        <pointLight position={[3, -1, 2]} intensity={18} color="#4fd8ff" />
        <pointLight position={[-2, -2, -2]} intensity={10} color="#2a6cff" />
        <PShape boltRef={boltRef} geometry={geometry} />
      </Canvas>
    </div>
  );
}
