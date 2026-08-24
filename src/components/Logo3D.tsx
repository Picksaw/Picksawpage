import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { onLightning } from "../lib/stormEvents";
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

function PShape({ boltRef }: { boltRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const rim = useRef<THREE.MeshStandardMaterial>(null);
  const spark = useRef<THREE.MeshStandardMaterial>(null);
  const storm = getStorm();

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

    // idle float
    g.position.y = Math.sin(t * 0.9) * 0.05;

    // lightning decay
    boltRef.current = Math.max(0, boltRef.current - delta * 2.4);
    const b = boltRef.current;
    if (rim.current) {
      rim.current.emissiveIntensity = 0.55 + b * 4.5 + storm.bolt * 2;
    }
    if (spark.current) {
      const pulse = 0.9 + Math.sin(t * 2.2) * 0.25;
      spark.current.emissiveIntensity = pulse * (1.2 + b * 5);
    }
  });

  return (
    <group ref={group}>
      {/* stem */}
      <mesh position={[-0.52, 0, 0]}>
        <boxGeometry args={[0.34, 2.1, 0.34]} />
        <meshStandardMaterial color="#c7d5e8" metalness={0.95} roughness={0.28} />
      </mesh>

      {/* bowl — half torus opening toward the stem */}
      <mesh position={[0.18, 0.52, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.7, 0.17, 24, 48, Math.PI]} />
        <meshStandardMaterial color="#c7d5e8" metalness={0.95} roughness={0.28} />
      </mesh>

      {/* cyan rim light ring behind the bowl */}
      <mesh position={[0.18, 0.52, -0.02]}>
        <torusGeometry args={[0.7, 0.045, 12, 48, Math.PI]} />
        <meshStandardMaterial
          ref={rim}
          color="#4fd8ff"
          emissive="#4fd8ff"
          emissiveIntensity={0.55}
          metalness={0.4}
          roughness={0.4}
          toneMapped={false}
        />
      </mesh>

      {/* spark core floating in the bowl */}
      <mesh position={[0.3, 0.5, 0.05]}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial
          ref={spark}
          color="#bff1ff"
          emissive="#4fd8ff"
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
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

/** WebGL availability probe (cached). */
function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

interface Logo3DProps {
  size?: number;
  className?: string;
}

export default function Logo3D({ size = 64, className }: Logo3DProps) {
  const boltRef = useRef(0);
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
        style={{ width: size, height: size }}
        onClick={handleClick}
        role="img"
        aria-label="Picksaw logo"
      >
        <LogoFallback size={Math.round(size * 0.7)} />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: size, height: size }}
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
        <PShape boltRef={boltRef} />
      </Canvas>
    </div>
  );
}
