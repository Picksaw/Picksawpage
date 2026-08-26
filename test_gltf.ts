import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');
if(!code.includes('useGLTF')) {
    code = code.replace(/import \{ Html \} from "@react-three\/drei";/, 'import { Html, useGLTF } from "@react-three/drei";');
    fs.writeFileSync('src/components/journey/Corridor.tsx', code);
}
