import * as THREE from "three";

/**
 * A real typographic "P": outer contour + bowl counter (hole),
 * extruded with beveled edges. Built on a 0..100 grid, centered,
 * then scaled to world units. Shared by the header logo and the
 * 3D journey emblem.
 */
export function makePGeometry(scale: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // stem + bowl outline
  shape.moveTo(14, 4);
  shape.lineTo(36, 4);
  shape.lineTo(36, 48);
  // bowl outer — elliptical arc from (36,48) over the right to (36,100)
  shape.absellipse(36, 74, 56, 26, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(14, 100);
  shape.lineTo(14, 4);
  shape.closePath();

  // the counter (hole inside the bowl) — D-shaped
  const hole = new THREE.Path();
  hole.absellipse(36, 74, 31, 12.5, -Math.PI / 2, Math.PI / 2, false);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 26,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2.4,
    bevelSegments: 2,
    curveSegments: 22,
  });
  geo.translate(-50, -52, -13); // center on origin
  geo.scale(scale, scale, scale);
  geo.computeVertexNormals();
  return geo;
}
