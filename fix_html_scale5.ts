import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

code = code.replace(
  /className="w-\[1200px\] h-\[910px\] overflow-y-auto overflow-x-hidden bg-\[\#04060d\] text-white custom-scrollbar pointer-events-auto"\n\s*style=\{\{ opacity: 0 \}\}/,
  `className="overflow-y-auto overflow-x-hidden bg-[#04060d] text-white custom-scrollbar pointer-events-auto"
          style={{ width: 1200, height: 910, opacity: 0 }}`
);

fs.writeFileSync('src/components/journey/Corridor.tsx', code);
