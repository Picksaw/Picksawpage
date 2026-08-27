import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

const regex = /\/\*\* The "Website Templates" layer — big typographic plane in space\. \*\/[\s\S]*?function HtmlSection/m;

const newHeadline = `/** The "Website Templates" layer — big typographic plane in space. */
function HeadlineLayer({ lang }: { lang: Lang }) {
  const t = SITE_TEXTS[lang];
  const group = useRef<THREE.Group>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const fit = useFitScale(5.6, 2.1, FOCUS_DIST, 0.9, 0.62);
  const { size, camera } = useThree();

  const isMobile = size.width < 768;
  const cssW = isMobile ? Math.max(size.width * 0.9, 320) : Math.min(size.width * 0.8, 1000);
  const cssH = cssW * (2.1 / 5.6); // keep aspect ratio

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const op = layerOpacity(camera.position.z, HEADLINE_Z);
    
    if (group.current) {
      group.current.scale.lerp(new THREE.Vector3(fit, fit, fit), Math.min(1, dt * 8));
      // Same parallax lean as the paintings
      group.current.position.x = (camera.position.x || 0) * 0.06;
    }

    if (divRef.current) {
      divRef.current.style.opacity = op.toString();
      divRef.current.style.pointerEvents = op > 0.5 ? "auto" : "none";
    }
  });

  return (
    <group ref={group} position={[0, 0.1, HEADLINE_Z]}>
      <Html 
        transform 
        position={[0, 0, 0]} 
        scale={5.6 / cssW}
        zIndexRange={[100, 0]} 
        center
      >
        <div
          ref={divRef}
          className="flex flex-col items-center justify-center rounded-3xl border border-[#4fd8ff]/20 bg-[#04070e]/40 backdrop-blur-md shadow-[0_0_40px_rgba(79,216,255,0.1)] p-8 text-center"
          style={{ width: cssW, height: cssH, opacity: 0 }}
          dir={lang === "fa" ? "rtl" : "ltr"}
        >
          <h2 
            className="bolt-text font-bold text-white tracking-tight"
            style={{ fontSize: isMobile ? 'clamp(24px, 6vw, 42px)' : '52px', lineHeight: 1.1 }}
          >
            {t.heroTitle}
          </h2>
          <p 
            className="mt-4 text-slate-300 font-medium max-w-2xl mx-auto"
            style={{ fontSize: isMobile ? '14px' : '18px' }}
          >
            {t.heroSubtitle}
          </p>
        </div>
      </Html>
    </group>
  );
}

function HtmlSection`;

code = code.replace(regex, newHeadline);
fs.writeFileSync('src/components/journey/Corridor.tsx', code);
