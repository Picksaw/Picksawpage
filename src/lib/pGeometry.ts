import * as THREE from "three";

/**
 * A real typographic "A": flat apex, splayed stems and an open counter,
 * extruded with beveled edges — the About walk's ghost. It sits on the P's
 * cap grid (baseline y = 4, cap y = 100, 0..100 wide) so both letters fill
 * the card window the same way.
 */
export function makeAGeometry(scale: number): THREE.BufferGeometry {
  const STEM = 20; // stem width, measured horizontally
  const BASE = 4; // baseline
  const CAP = 100; // cap height
  const BAR_LO = 26; // crossbar underside
  const BAR_HI = 40; // crossbar top
  const K = 38 / 96; // stem slope: dx/dy from the 2 -> 40 sweep
  // left outer edge rises to the right; right outer mirrors it.
  const xOut = (y: number, side: 1 | -1) =>
    side > 0 ? 2 + K * (y - BASE) : 98 - K * (y - BASE);
  // inner edges are the outer ones stepped in by the stem width
  const xIn = (y: number, side: 1 | -1) => xOut(y, side) + side * STEM;
  // the inner edges meet where the 56-wide gap at the baseline closes to a
  // point: half of it (28) over the stem slope K. That's the counter's apex,
  // dead centre at x = 50, and it lands at y = 74.74 on this grid.
  const apexY = BASE + (xIn(BASE, -1) - xIn(BASE, 1)) / 2 / K;

  const shape = new THREE.Shape();
  // outer contour: up the left stem, across the flat apex, down the right
  // stem, in along the right foot, up to the crossbar underside, across it,
  // down to the left foot
  shape.moveTo(xOut(BASE, 1), BASE);
  shape.lineTo(xOut(CAP, 1), CAP);
  shape.lineTo(xOut(CAP, -1), CAP);
  shape.lineTo(xOut(BASE, -1), BASE);
  shape.lineTo(xIn(BASE, -1), BASE);
  shape.lineTo(xIn(BAR_LO, -1), BAR_LO);
  shape.lineTo(xIn(BAR_LO, 1), BAR_LO);
  shape.lineTo(xIn(BASE, 1), BASE);
  shape.closePath();

  // the counter: the triangle the crossbar closes off
  const hole = new THREE.Path();
  hole.moveTo(xIn(BAR_HI, 1), BAR_HI);
  hole.lineTo(50, apexY);
  hole.lineTo(xIn(BAR_HI, -1), BAR_HI);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 26,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: 2.4,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.translate(-50, -52, -13); // center on origin
  geo.scale(scale, scale, scale);
  geo.computeVertexNormals();
  return geo;
}
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
