// ── the city ───────────────────────────────────────────────────────────────

/** Window textures — every single window lit, brightness varies. */
function makeWindowTextures(): THREE.Texture[] {
  const out: THREE.Texture[] = [];
  for (let v = 0; v < 3; v++) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#04060c";
    ctx.fillRect(0, 0, 128, 256);
    const cols = 5;
    const rows = 12;
    const cw = 128 / cols;
    const ch = 256 / rows;
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        // 100% lit — brightness varies so the facade stays organic
        const bright = 0.3 + Math.random() * 0.7;
        const whiteBlue = Math.random() < 0.24;
        ctx.fillStyle = whiteBlue
          ? `rgba(${210 + bright * 45}, ${238 + bright * 17}, 255, ${0.65 + bright * 0.35})`
          : `rgba(${90 + bright * 80}, ${195 + bright * 50}, 255, ${0.5 + bright * 0.5})`;
        ctx.fillRect(x * cw + cw * 0.16, y * ch + ch * 0.22, cw * 0.62, ch * 0.45);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    out.push(tex);
  }
  return out;
}

interface Building {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  tex: number;
  tier: boolean; // smaller crown block on top
  antenna: boolean; // mast + tip light
  tintR: number; // slight facade tint variance
  tintG: number;
  uRep: number; // window grid density variation
  vRep: number;
}

/** Deterministic per-session city layout: blocks flanking the path. */
function makeCity(isMobile: boolean): Building[] {
  const list: Building[] = [];
  let seed = 20260824;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const startZ = 8;
  const endZ = paintingZ(N - 1) - 12;
  // Mobile portrait screens have a very narrow horizontal FOV — the
  // city must hug the walking path or towers never enter the frame
  // before the fog swallows them.
  // Tuned via frustum+fog simulation: exactly 5-6 lit towers visible at
  // every gallery station on BOTH desktop and portrait phones.
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
        // window grid follows the building's real proportions — every
        // window is the same physical size, nothing stretched
        list.push({
          x: x + (rnd() - 0.5) * 1.4,
          z: z + (rnd() - 0.5) * step * 0.7,
          w,
          h,
          d,
          tex: Math.floor(rnd() * 3),
          tier: tall || rnd() < 0.3,
          antenna: tall && rnd() < 0.75,
          tintR: 0.86 + rnd() * 0.14,
          tintG: 0.92 + rnd() * 0.08,
          uRep: Math.max(1, Math.round(w / 1.5)),
          vRep: Math.max(1, Math.round(h / 2.6)),
        });
      }
    }
  }
  return list;
}

function City() {
  const isMobile = useMemo(
    () => window.matchMedia("(pointer: coarse)").matches,
    []
  );
  const buildings = useMemo(() => makeCity(isMobile), [isMobile]);
  const windowTexs = useMemo(() => makeWindowTextures(), []);

  // build meshes imperatively — each building gets its OWN material so
  // windows can be dimmed by distance (front rows bright, far fade).
  const cityGroup = useMemo(() => {
    const g = new THREE.Group();
    const scaleUV = (geo: THREE.BufferGeometry, u: number, v: number) => {
      const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
      if (!uv) return;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
      }
      uv.needsUpdate = true;
    };

    for (const b of buildings) {
      // per-building material (cloned map ref, own color for dim/tint)
      // fog:true — the SCENE FOG decides which buildings show, exactly
      // like the first version that worked: near rows visible, far
      // towers swallowed by the mist. No runtime dimming needed.
      const mat = new THREE.MeshBasicMaterial({
        map: windowTexs[b.tex],
        color: "#ffffff",
        fog: true,
      });
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      scaleUV(geo, b.uRep, b.vRep); // varied window densities per facade
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, -2.9 + b.h / 2, b.z);
      g.add(mesh);

      const edgeMat = new THREE.LineBasicMaterial({
        color: "#2f7bff",
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true,
      });
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
      edges.position.copy(mesh.position);
      g.add(edges);

      // crown tier — a second, smaller block on taller buildings
      if (b.tier) {
        const tw = b.w * 0.68;
        const td = b.d * 0.68;
        const th = b.h * 0.32;
        const tGeo = new THREE.BoxGeometry(tw, th, td);
        scaleUV(tGeo, Math.max(1, b.uRep - 1), 1);
        const tMesh = new THREE.Mesh(tGeo, mat); // shares material → dims together
        tMesh.position.set(b.x, -2.9 + b.h + th / 2, b.z);
        g.add(tMesh);
      }

      // antenna mast + tip light
      let tipMat: THREE.MeshBasicMaterial | undefined;
      if (b.antenna) {
        const mastH = 0.9 + Math.random() * 0.8;
        const mast = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, mastH, 0.045),
          new THREE.MeshBasicMaterial({ color: "#16233c", fog: true })
        );
        const topY = -2.9 + b.h + (b.tier ? b.h * 0.32 : 0);
        mast.position.set(b.x, topY + mastH / 2, b.z);
        g.add(mast);
        tipMat = new THREE.MeshBasicMaterial({
          color: "#9fe8ff",
          fog: true,
          toneMapped: false,
        });
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), tipMat);
        tip.position.set(b.x, topY + mastH + 0.05, b.z);
        g.add(tip);
      }

    }
    return g;
  }, [buildings, windowTexs]);

  useEffect(
    () => () => {
      cityGroup.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const m = o.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
      windowTexs.forEach((t) => t.dispose());
    },
    [cityGroup, windowTexs]
  );

  return (
    <>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.92, -26]}>
        <planeGeometry args={[110, 150]} />
        <meshBasicMaterial color="#04060d" />
      </mesh>
      <primitive object={cityGroup} />
    </>
  );
}

/** Depth rain inside the corridor. */
function CorridorRain() {
  const ref = useRef<THREE.Points>(null);
  const count = 380;

  const { geo, velocities } = useMemo(() => {
    const positions = new Float32Array(count * 3);
