import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Corridor.tsx', 'utf8');

// I want to see how Html is configured
const match = code.match(/<Html[\s\S]*?<\/Html>/);
console.log(match ? match[0] : "Not found");
