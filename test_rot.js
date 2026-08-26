import * as THREE from 'three';
const backMesh = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial());
backMesh.rotation.set(0, Math.PI, 0);
const group = new THREE.Group();
group.add(backMesh);
group.rotation.set(0, Math.PI, 0);
group.updateMatrixWorld(true);
const v = new THREE.Vector3(1, 0, 0); // Local right edge of the plane geometry
v.applyMatrix4(backMesh.matrixWorld);
console.log(v);
