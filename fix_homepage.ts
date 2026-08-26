import fs from 'fs';

let code = fs.readFileSync('src/pages/HomePage.tsx', 'utf8');

code = code.replace(
  /\{ \/\* The rest of the site fades in after Journey finishes its scroll area \*\/ \}[\s\S]*?<\/div>/,
  `{ /* Site is now fully in 3D */ }`
);

fs.writeFileSync('src/pages/HomePage.tsx', code);
