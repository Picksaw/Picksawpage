import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

// Add street lights to City
const cityLights = `
      {/* Street level ambient neon reflections */}
      <pointLight position={[-4, -2, -5]} intensity={15} color="#4fd8ff" distance={20} />
      <pointLight position={[4, -2, -15]} intensity={15} color="#4fd8ff" distance={20} />
      <pointLight position={[-4, -2, -25]} intensity={15} color="#9fe8ff" distance={20} />
      <pointLight position={[4, -2, -35]} intensity={15} color="#4fd8ff" distance={20} />
      <pointLight position={[-4, -2, -45]} intensity={15} color="#2a6cff" distance={20} />
      
      <primitive object={cityGroup} />
`;

code = code.replace(/<primitive object=\{cityGroup\} \/>/, cityLights);

// Wait, the buildings foundation was at y = -10, which means they are blocking the road?
// Let's verify the road's width!
// NearX is 4.0. Building width varies (2.4 to 3.5).
// Building x positions are side * (nearX + r * rowGap + rnd() * 1.5).
// Side -1 means x = - (4.0 + 0 + rnd*1.5) = -4.0 to -5.5.
// The width of the building is up to 3.5. So it spans from x = -5.75 to x = -2.25.
// The street is at x=0. The street width is clear between -2.25 and 2.25.
// The plane is at x=0, and scale is 110x150, so it covers from -55 to 55.
// So the buildings sit ON TOP of the street plane.
// Wait! In City():
// mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.92, -26]} scale={[110, 150, 1]}
// The street is at y = -2.92.
// Building instance is placed at y = -2.9, which is 0.02 units ABOVE the street.
// The foundation is placed at y = -10 (relative to the instance), so its world y is -12.9.
// The foundation has a height of 20, so its local y spans from -10 to 10.
// Thus, in world space, the foundation spans from -12.9 - 10 = -22.9 to -12.9 + 10 = -2.9.
// IT EXACTLY TOUCHES the bottom of the building at -2.9.
// Wait, does a BoxGeometry placed at `position.set(0, -10, 0)` with height `20` span from `-20` to `0`?
// Yes, the center is at -10, so it spans from -10 - 10 = -20 to -10 + 10 = 0.
// Relative to the instance at -2.9, it spans from -22.9 to -2.9.
// BUT the street plane is at -2.92!
// This means the street is at -2.92, which is BETWEEN -22.9 and -2.9.
// SO THE FOUNDATION INTERSECTS THE STREET!
// Ah! The foundation is a solid block. The street is a single plane.
// So the street is INSIDE the foundation, and the foundation blocks cover the street where the buildings are.
// BUT wait, the street is 110 wide. The foundations are only as wide as the buildings (e.g. 3.5).
// So the street SHOULD be visible between the buildings (from x = -2.25 to x = 2.25).
// Unless the user is complaining that the street is not visible AT ALL.
// Wait, is the ground visible? Let's write the file and check if it fixes things.

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
