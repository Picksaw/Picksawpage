import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

code = code.replace(
  /if \(u < 1\.55 \|\| u > stations\.length - 1\.4\) return -1;/,
  `if (u < 1.55) return -1; // Never lose focus at the end of the corridor now`
);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
