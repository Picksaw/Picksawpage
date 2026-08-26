import fs from 'fs';

let code = fs.readFileSync('src/components/journey/PEmblem.tsx', 'utf8');

// The original logic:
// cardGroup.current.rotation.y = eased.current.x * 0.16 + (1 - fEase) * 0.55;
// cardGroup.current.rotation.x = -eased.current.y * 0.1;

// I need to intercept pointer events ON the mesh to flip the card completely!
// The CodePen flips the card based on mouse pos across the screen. 
// The user explicitly requested: "only interacting directly on the card should trigger the rotation... turn it around in 3d, also with the mouse, only on the card"

// Let's replace the logic to track pointer hovering/dragging directly on the card meshes.
// We can use `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerLeave` on the card mesh.

const pointerEventsReplacement = `
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cardRot = useRef({ x: 0, y: 0 }); // Current literal rotation of the card
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    // Only capture on the card
    (e.target as Element)?.setPointerCapture?.(e.pointerId);
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Convert drag pixels to rotation radians (arbitrary sensitivity)
    cardRot.current.y += dx * 0.01;
    cardRot.current.x += dy * 0.01;
    
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    isDragging.current = false;
    (e.target as Element)?.releasePointerCapture?.(e.pointerId);
  };
`;

code = code.replace(/const ringFlash = useRef\(0\);/, `${pointerEventsReplacement}\n  const ringFlash = useRef(0);`);

// Update useFrame
const useFrameOld = /cardGroup\.current\.rotation\.y = eased\.current\.x \* 0\.16 \+ \(1 \- fEase\) \* 0\.55;\n\s*cardGroup\.current\.rotation\.x = -eased\.current\.y \* 0\.1;/;

const useFrameNew = `// If not dragging, smoothly return to front face + float
      if (!isDragging.current) {
        // Find nearest full rotation (0, 2pi, 4pi...) to snap back to the front
        const targetY = Math.round(cardRot.current.y / (Math.PI * 2)) * Math.PI * 2;
        const targetX = Math.round(cardRot.current.x / (Math.PI * 2)) * Math.PI * 2;
        
        cardRot.current.y += (targetY + eased.current.x * 0.16 + (1 - fEase) * 0.55 - cardRot.current.y) * Math.min(1, dt * 5);
        cardRot.current.x += (targetX - eased.current.y * 0.1 - cardRot.current.x) * Math.min(1, dt * 5);
      }
      
      cardGroup.current.rotation.y = cardRot.current.y;
      cardGroup.current.rotation.x = cardRot.current.x;`;

code = code.replace(useFrameOld, useFrameNew);

// Add event handlers to front and back meshes
code = code.replace(/<mesh position=\{\[0, 0, 0\.03\]\} renderOrder=\{2\}>/, `<mesh 
          position={[0, 0, 0.03]} 
          renderOrder={2}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >`);

code = code.replace(/<mesh position=\{\[0, 0, -0\.02\]\} rotation=\{\[0, Math\.PI, 0\]\} renderOrder=\{1\}>/, `<mesh 
          position={[0, 0, -0.02]} 
          rotation={[0, Math.PI, 0]} 
          renderOrder={1}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >`);

// The user also requested to replace the border text with AmirEhsan. 
// Wait, "instead of lightning border let it have AmirEhsan on it".
// Let's remove the border mesh entirely and write AmirEhsan on the card itself.

code = code.replace(/ctx\.fillText\("PICKSAW", 72, 148\);/, `ctx.fillText("AmirEhsan", 72, 148);`);
code = code.replace(/ctx\.fillText\("PICKSAW\.SITE — CARD Nº 001", 72, 1336\);/, `ctx.fillText("AMIREHSAN — CARD Nº 001", 72, 1336);`);
code = code.replace(/ctx\.fillText\("PICKSAW — GHOST CARD", W \/ 2, 1388\);/, `ctx.fillText("AMIREHSAN — GHOST CARD", W / 2, 1388);`);

// Hide the lightning border
code = code.replace(/\{\/\* the electric lightning border — crackles around the card \*\/\}/, `\{/* The lightning border was removed as per request */\}{false &&`);
code = code.replace(/side=\{THREE\.DoubleSide\}\n          \/>\n        <\/mesh>/, `side={THREE.DoubleSide}\n          />\n        </mesh>}`);

fs.writeFileSync('src/components/journey/PEmblem.tsx', code);
