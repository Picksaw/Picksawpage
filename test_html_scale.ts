import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

code = code.replace(
  /scale=\{PAINTING_W \/ 1200\}/,
  `scale={(PAINTING_W / 1200) * fit}`
);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
