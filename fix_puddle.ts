import fs from 'fs';

let code = fs.readFileSync('src/components/journey/PuddleMaterial.tsx', 'utf8');

// Fix UV scale in fragment shader
code = code.replace(
  /float puddleNoise = getPuddle\(vPosition\.xy \* 15\.0\);/,
  `float puddleNoise = getPuddle(vUv * vec2(110.0, 150.0) * 1.5);`
);

code = code.replace(
  /vec3 rippleNormals = getRipples\(vPosition\.xy \* 40\.0\);/,
  `vec3 rippleNormals = getRipples(vUv * vec2(110.0, 150.0) * 5.0);`
);

// Brighten the ground so it's visible without envMap
code = code.replace(
  /csm_DiffuseColor\.rgb \*= 0\.15;/,
  `csm_DiffuseColor.rgb *= 0.6; // Brighter
   csm_DiffuseColor.rgb += vec3(0.01, 0.04, 0.07); // Base ambient blue
  `
);

// We should also reduce Roughness so it acts more like a mirror for lights
code = code.replace(
  /csm_Roughness = clamp\(csm_Roughness, 0\.0, 0\.1\);/,
  `csm_Roughness = clamp(csm_Roughness, 0.05, 0.2);`
);

fs.writeFileSync('src/components/journey/PuddleMaterial.tsx', code);
