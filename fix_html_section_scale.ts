import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

const oldHtmlSectionRegex = /function HtmlSection\([\s\S]*?\n\n\/\/ ── the city/m;

const newHtmlSection = `function HtmlSection({
  index,
  focused,
  children
}: {
  index: number;
  focused: boolean;
  children: React.ReactNode;
}) {
  const z = paintingZ(index);
  const fit = useFitScale(PAINTING_W, PAINTING_H, FOCUS_DIST);
  const group = useRef<THREE.Group>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  
  // Calculate exact CSS pixels needed for a good layout
  const isMobile = window.innerWidth < 768;
  const mult = isMobile ? 120 : 280;
  const W = PAINTING_W * mult;
  const H = PAINTING_H * mult;

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const op = layerOpacity(camera.position.z, z);
    
    if (frameMat.current) frameMat.current.opacity = op;
    if (glowMat.current) glowMat.current.opacity = (focused ? 0.3 : 0.1) * op;
    
    if (group.current) {
      const s = fit;
      group.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
      group.current.position.x = (camera.position.x || 0) * 0.06;
    }
    
    if (divRef.current) {
      divRef.current.style.opacity = op.toString();
      divRef.current.style.pointerEvents = "auto";
    }
  });

  return (
    <group ref={group} position={[0, 0, z]}>
      {/* glow halo behind the frame */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[PAINTING_W + 0.55, PAINTING_H + 0.55]} />
        <meshBasicMaterial
          ref={glowMat}
          color="#4fd8ff"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* dark frame */}
      <mesh position={[0, 0, -0.05]}>
        <boxGeometry args={[PAINTING_W + 0.16, PAINTING_H + 0.16, 0.09]} />
        <meshStandardMaterial
          ref={frameMat}
          color="#11182a"
          metalness={0.6}
          roughness={0.5}
          transparent
          opacity={1}
        />
      </mesh>
      
      {/* HTML Content */}
      <group position={[0, 0, 0.012]} scale={1 / mult}>
        <Html transform zIndexRange={[100, 0]} center>
          <div
            ref={divRef}
            className="overflow-y-auto overflow-x-hidden bg-[#04060d] text-white custom-scrollbar flex flex-col pointer-events-auto origin-center"
            style={{ 
              width: W, 
              height: H, 
              opacity: 0, 
              transition: "opacity 0.1s"
            }}
          >
            {children}
          </div>
        </Html>
      </group>
    </group>
  );
}

// ── the city`;

code = code.replace(oldHtmlSectionRegex, newHtmlSection);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
