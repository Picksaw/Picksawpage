/**
 * Run every verification harness for the City of Templates.
 *
 *   node scripts/verify.mjs
 *
 * There is no GPU in CI, so these harnesses stand in for looking at the
 * screen: they parse every shader against three.js's preludes, and they
 * re-implement the maths that decides whether the experience is right
 * (composition, camera comfort, parallax, rain physics, wetness,
 * periodicity, lightning timing, audio structure, accessibility) and
 * assert on the numbers.
 */

import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const ORDER = [
  "smoke-render.mjs",
  "smoke-resilience.mjs",
  "check-shaders.mjs",
  "analyze-deprecations.mjs",
  "analyze-corridor.mjs",
  "analyze-integration.mjs",
];

const found = readdirSync(here).filter((f) => /^(check|analyze|smoke)-.*\.mjs$/.test(f));
const missing = found.filter((f) => !ORDER.includes(f));
const scripts = [...ORDER.filter((f) => found.includes(f)), ...missing];

const run = (file) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [join(here, file)], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ file, code, out }));
  });

const results = [];
for (const file of scripts) {
  const r = await run(file);
  results.push(r);
  const name = file.replace(/^(check|analyze)-/, "").replace(/\.mjs$/, "");
  const counts = (r.out.match(/PASS/g) ?? []).length;
  const fails = (r.out.match(/^\s+FAIL/gm) ?? []).length;
  const status = r.code === 0 ? "PASS" : "FAIL";
  console.log(
    `${status}  ${name.padEnd(12)} ${String(counts).padStart(3)} checks` +
      (fails ? `, ${fails} failed` : "")
  );
  if (r.code !== 0) {
    console.log(
      r.out
        .split("\n")
        .filter((l) => /FAIL/.test(l))
        .map((l) => `        ${l.trim()}`)
        .join("\n")
    );
  }
}

const failed = results.filter((r) => r.code !== 0);
const totalChecks = results.reduce((a, r) => a + (r.out.match(/PASS/g) ?? []).length, 0);
console.log(
  `\n${totalChecks} checks across ${results.length} harnesses — ` +
    (failed.length === 0 ? "ALL PASSED" : `${failed.length} HARNESS(ES) FAILED`)
);
process.exit(failed.length === 0 ? 0 : 1);
