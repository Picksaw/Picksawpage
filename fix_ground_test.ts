import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

code = code.replace(
  /<Suspense fallback=\{<meshBasicMaterial color="#04060d" \/>\}><PuddleMaterial \/><\/Suspense>/,
  `<meshStandardMaterial color="#4fd8ff" roughness={0.2} metalness={0.8} />`
);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
