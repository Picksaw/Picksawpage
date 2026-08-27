import fs from 'fs';

let code = fs.readFileSync('src/main.tsx', 'utf8');

if (!code.includes('console.error')) {
  code = `
  const originalError = console.error;
  console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.WebGLProgram')) {
          fetch('/log', { method: 'POST', body: args[0] }).catch(()=>{});
      }
      originalError.apply(console, args);
  };
  ` + code;
  fs.writeFileSync('src/main.tsx', code);
}
