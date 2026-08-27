import fs from 'fs';

function countMeshes(filename) {
    const buffer = fs.readFileSync(filename);
    const magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') return console.log(filename, 'not glTF');
    
    const chunkLength = buffer.readUInt32LE(12);
    const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
    const gltf = JSON.parse(jsonStr);
    
    console.log(filename, 'Meshes:', gltf.meshes ? gltf.meshes.length : 0, 'Nodes:', gltf.nodes ? gltf.nodes.length : 0);
}

['public/building_02.glb', 'public/game_ready_mid_poly_building.glb', 'public/sci-fi_building.glb', 'public/sci-fi_building_11.glb', 'public/azadi_tower.glb', 'public/milad_tower.glb', 'public/new_york_background_building_1.glb', 'public/realistic_building.glb', 'public/low_rise_wall_to_wall_office_building.glb'].forEach(countMeshes);
