import fs from 'fs';

let code = fs.readFileSync('src/components/journey/Journey.tsx', 'utf8');

code = code.replace(
  /const endFaded = v > 0\.93;[\s\S]*?setFaded\(\(prev\) => \(prev === endFaded \? prev : endFaded\)\);/,
  `// Journey never fades out now because it is the entire website`
);

code = code.replace(
  /const \[faded, setFaded\] = useState\(false\);/,
  ``
);

code = code.replace(/!faded &&/g, '');
code = code.replace(/faded \? /g, 'false ? ');

fs.writeFileSync('src/components/journey/Journey.tsx', code);
