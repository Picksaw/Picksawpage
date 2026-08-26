import fs from 'fs';

let code = fs.readFileSync('src/components/journey/PEmblem.tsx', 'utf8');

// Also, the user wants the ghost to dissolve on the back!
// The previous dissolve logic I wrote used `gl_FrontFacing`:
/*
    float viewAngle = gl_FrontFacing ? max(dot(vNormal, vEye), 0.0) : 0.0;
    
    float noiseVal = texture2D(uNoise, vUv * 6.0).r;
    float threshold = smoothstep(0.85, 0.25, viewAngle); 
    
    if (!gl_FrontFacing || noiseVal < threshold) {
      inWin = false;
    }
*/
// BUT wait, `gl_FrontFacing` is a fragment shader built-in.
// For the back mesh, when viewed from the back of the card, `gl_FrontFacing` IS TRUE!
// Because the back mesh has `rotation={[0, Math.PI, 0]}`, its front face points backward!
// So when you look at the back of the card, you are looking at the FRONT face of the back mesh!
// Therefore `gl_FrontFacing` is TRUE for the back mesh.
// If we want the ghost to NOT show on the back mesh at all, we can just pass a uniform to the back material!
