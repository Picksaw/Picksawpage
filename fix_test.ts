import fs from 'fs';

let code = fs.readFileSync('src/components/journey/PuddleMaterial.tsx', 'utf8');

code = code.replace(
  /<CSM[\s\S]*?\/>/,
  `<meshStandardMaterial color="#ff0000" roughness={0.1} metalness={0.8} />`
);

fs.writeFileSync('src/components/journey/PuddleMaterial.tsx', code);
