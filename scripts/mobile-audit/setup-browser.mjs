// One-time: extract the npm-tarball Chromium (from @sparticuz/chromium) plus
// its shared libs + fonts to /tmp, where audit.mjs expects them.
// The Chrome-for-testing CDN is unreachable in this sandbox, but npm is.
//
// Usage: npm install --no-save @sparticuz/chromium && node scripts/mobile-audit/setup-browser.mjs
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import zlib from "node:zlib";
import { readFileSync } from "node:fs";

const P = "node_modules/@sparticuz/chromium/bin";

if (!existsSync(`${P}/chromium.br`)) {
  console.error("missing @sparticuz/chromium — npm install --no-save @sparticuz/chromium");
  process.exit(1);
}

mkdirSync("/tmp/al2023", { recursive: true });
mkdirSync("/tmp/fonts", { recursive: true });

const untar = (br, out) => {
  writeFileSync("/tmp/x.tar", zlib.brotliDecompressSync(readFileSync(br)));
  execSync(`tar -xf /tmp/x.tar -C ${out}`);
};

untar(`${P}/chromium.br`, "/tmp/");
untar(`${P}/al2023.tar.br`, "/tmp/al2023");
untar(`${P}/fonts.tar.br`, "/tmp/fonts");
untar(`${P}/swiftshader.tar.br`, "/tmp/");

execSync("chmod +x /tmp/chromium");
console.log("ok:", execSync("LD_LIBRARY_PATH=/tmp/al2023/lib /tmp/chromium --version").toString().trim());
