import fs from 'fs';

function parseGLB(filename) {
    const buffer = fs.readFileSync(filename);
    const magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') return console.log(filename, 'not glTF');
    
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);
    const chunkLength = buffer.readUInt32LE(12);
    const chunkType = buffer.toString('utf8', 16, 20);
    
    if (chunkType !== 'JSON') return console.log(filename, 'no JSON chunk');
    
    const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
    const gltf = JSON.parse(jsonStr);
    
    console.log('--- ' + filename + ' ---');
    if (gltf.materials) {
        gltf.materials.forEach(m => {
            console.log('Material:', m.name, 'EmissiveFactor:', m.emissiveFactor, 'HasEmissiveTex:', !!m.emissiveTexture);
        });
    } else {
        console.log('No materials found');
    }
}

['public/building_02.glb', 'public/apartmen_building.glb', 'public/game_ready_mid_poly_building.glb', 'public/sci-fi_building.glb', 'public/sci-fi_building_11.glb'].forEach(parseGLB);
