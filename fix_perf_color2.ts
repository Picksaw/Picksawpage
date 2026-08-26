import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

// 1. Darken buildings slightly
const traverseRegex = /child\.material\.fog = true;\n\s*child\.material\.roughness = Math\.min\(child\.material\.roughness \|\| 1\.0, 0\.6\);/m;
const newTraverse = `if (child.material.color) {
            child.material.color.lerp(new THREE.Color("#05070a"), 0.5); // Darken by 50%
          }
          child.material.fog = true;
          child.material.roughness = Math.min(child.material.roughness || 1.0, 0.6);`;

code = code.replace(traverseRegex, newTraverse);

// 2. Add distance culling to City
const cityGroupRegex = /const cityGroup = useMemo\(\(\) => \{[\s\S]*?return g;\n  \}, \[buildings, prototypes, concreteMat\]\);/m;

code = code.replace(cityGroupRegex, (match) => {
    return `const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ camera }) => {
    if (groupRef.current) {
      const camZ = camera.position.z;
      // Aggressive Distance Culling for 60 FPS
      // The fog completely hides everything past 45 units.
      // We also hide anything more than 10 units behind the camera.
      groupRef.current.children.forEach((child) => {
        const dist = camZ - child.position.z;
        child.visible = dist > -15 && dist < 48;
      });
    }
  });

  ` + match;
});

// Update the primitive return to include the ref
code = code.replace(
  /<primitive object=\{cityGroup\} \/>/,
  `<primitive object={cityGroup} ref={groupRef} />`
);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
