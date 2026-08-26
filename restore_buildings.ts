import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');
let procCode = fs.readFileSync('/tmp/procedural_buildings.tsx', 'utf8');
// remove "function City() {" from the end of procCode
procCode = procCode.replace(/function City\(\) \{/, '');

// Find where to insert in Corridor.tsx
// Before interface Building
const insertPoint = code.indexOf('interface Building {');
if (insertPoint !== -1) {
    code = code.slice(0, insertPoint) + procCode + code.slice(insertPoint);
}

// Now update City()
const windowTexRegex = /const buildings = useMemo\(\(\) => makeCity\(\), \[\]\);\n\n  \/\/ Load custom GLTFs/m;
code = code.replace(windowTexRegex, `const buildings = useMemo(() => makeCity(), []);\n\n  const windowTexs = useMemo(() => makeWindowTextures(), []);\n\n  // Load custom GLTFs`);

const cMatRegex = /const \{ concreteMat, prototypes \} = useMemo\(\(\) => \{[\s\S]*?const cMat = new THREE\.MeshStandardMaterial\(\{[\s\S]*?\}\);/m;
const newCMat = `const { concreteMat, windowMats, prototypes } = useMemo(() => {
    // A single foundation material shared across all buildings
    const cMat = new THREE.MeshStandardMaterial({
      color: "#050608", // Very dark to blend with fog/abyss
      roughness: 0.8,
      metalness: 0.1,
      fog: true,
    });
    
    const wMats = windowTexs.map(
      (tex) =>
        new THREE.MeshStandardMaterial({
          map: tex.map,
          emissiveMap: tex.emissiveMap,
          roughnessMap: tex.roughnessMap,
          metalnessMap: tex.metalnessMap,
          emissive: new THREE.Color(1.5, 1.5, 1.5),
          emissiveIntensity: 1.4,
          color: "#ffffff",
          fog: true,
        }),
    );`;

code = code.replace(cMatRegex, newCMat);

// Replace GLTF material fix
const traverseRegex = /if \(child\.material\.color\) \{[\s\S]*?child\.material\.emissiveIntensity = 3\.0;\n          \}\n        \}/m;
const newTraverse = `if (child.material.color) {
            child.material.color.lerp(new THREE.Color("#05070a"), 0.15); // Barely darken so it's not "too dark"
          }
          child.material.fog = true;
          child.material.roughness = Math.min(child.material.roughness || 1.0, 0.6); 
          
          const matName = (child.material.name || "").toLowerCase();
          
          if (
            child.material.emissiveMap ||
            (child.material.emissive && child.material.emissive.getHex() > 0)
          ) {
            // Boost existing neon lights
            child.material.emissiveIntensity = 3.5;
          } else if (matName.includes('window') || matName.includes('glass') || matName.includes('light')) {
            // Force emissive for materials specifically named window/glass/light
            child.material.emissive = new THREE.Color("#4fd8ff");
            child.material.emissiveIntensity = 2.0;
          }`;
code = code.replace(traverseRegex, newTraverse);

// Add procedural protos to the list
const protosRegex = /const protos = \[\n      createCustomPrototype\(gltf01\.scene\),[\s\S]*?createCustomPrototype\(gltf05\.scene\)\n    \];/m;
const newProtos = `const protos = [
      buildType1(cMat, wMats[0]),
      buildType2(cMat, wMats[0]),
      buildType3(cMat, wMats[0]),
      buildType4(cMat, wMats[0]),
      buildType5(cMat, wMats[0]),
      createCustomPrototype(gltf01.scene),
      createCustomPrototype(gltf02.scene),
      createCustomPrototype(gltf03.scene),
      createCustomPrototype(gltf04.scene),
      createCustomPrototype(gltf05.scene)
    ];`;
code = code.replace(protosRegex, newProtos);

// Update useMemo dependencies
code = code.replace(/return \{ concreteMat: cMat, prototypes: protos \};\n  \}, \[gltf01, gltf02, gltf03, gltf04, gltf05\]\);/, `return { concreteMat: cMat, windowMats: wMats, prototypes: protos };\n  }, [windowTexs, gltf01, gltf02, gltf03, gltf04, gltf05]);`);

// Update CityGroup loop to support glass
const instanceRegex = /const foundation = new THREE\.Mesh\(foundationGeo, concreteMat\);\n      foundation\.position\.set\(0, -10, 0\);\n      instance\.add\(foundation\);\n\n      g\.add\(instance\);/m;
const newInstance = `const foundation = new THREE.Mesh(foundationGeo, concreteMat);
      foundation.position.set(0, -10, 0);
      instance.add(foundation);

      const chosenGlassMat = windowMats[b.tex];
      instance.traverse((obj) => {
        if (obj instanceof THREE.Mesh && obj.userData.isGlass) {
          obj.material = chosenGlassMat;
        }
      });

      g.add(instance);`;
code = code.replace(instanceRegex, newInstance);

// Update cleanup
const cleanupRegex = /concreteMat\.dispose\(\);\n      prototypes\.forEach/m;
const newCleanup = `concreteMat.dispose();\n      windowMats.forEach(m => m.dispose());\n      windowTexs.forEach(t => { t.map.dispose(); t.emissiveMap.dispose(); t.roughnessMap.dispose(); t.metalnessMap.dispose(); });\n      prototypes.forEach`;
code = code.replace(cleanupRegex, newCleanup);

// makeCity to 10
code = code.replace(/typeIndex: Math\.floor\(rnd\(\) \* 5\),/, `typeIndex: Math.floor(rnd() * 10),`);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
