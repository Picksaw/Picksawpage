import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

const oldLights = /\{\/\* Street level ambient neon reflections \*\/\}[\s\S]*?<primitive object=\{cityGroup\} \/>/;

const newLights = `{/* Street level ambient neon reflections */}
      {Array.from({ length: 15 }).map((_, i) => {
        const z = 8 - i * 6.5;
        const side = i % 2 === 0 ? 1 : -1;
        const colors = ["#4fd8ff", "#9fe8ff", "#2a6cff", "#ffffff"];
        const color = colors[i % colors.length];
        return (
          <pointLight
            key={i}
            position={[side * 4, -2, z]}
            intensity={12}
            color={color}
            distance={25}
          />
        );
      })}
      
      <primitive object={cityGroup} />`;

code = code.replace(oldLights, newLights);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
