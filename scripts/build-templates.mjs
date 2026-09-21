/**
 * build-templates — integrates the six standalone portfolio projects in
 * Templates/ into the main site's dist/ as real sub-directories:
 *
 *   dist/verda/   Templates/verda   (React + Vite singlefile build)
 *   dist/lumina/  Templates/lumina  (React + Vite singlefile build)
 *   dist/pulse/   Templates/pulse   (React + Vite singlefile build)
 *   dist/clarity/ Templates/clarity (React + Vite singlefile build)
 *   dist/lumen/   Templates/lumen   (React + Vite singlefile build)
 *   dist/aurora/  Templates/aurora  (fully static — copied as-is)
 *
 * Each directory has its own index.html, so GitHub Pages (and any static
 * host with directory indexes) serves picksaw.ir/<name> directly — no SPA
 * fallback tricks, refresh-safe, and fully isolated runtimes.
 *
 * The projects' own node_modules + lockfiles are used as-is (npm ci when
 * node_modules is missing, e.g. in CI); nothing is hoisted into the main
 * app, so their dependency versions stay exactly what they shipped with.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const VITE_PROJECTS = ["verda", "lumina", "pulse", "clarity", "lumen"];
const STATIC_PROJECTS = ["aurora"];

// Route-safety note: every project's vite config uses viteSingleFile(),
// whose recommended build config pins `base: "./"` (it overwrites the
// base in its config hook — a --base CLI flag lands in inlineConfig but
// never reaches the resolved config). That relative base is what makes
// the integrations work: emitted + runtime asset URLs are document-
// relative, so each page resolves its files under /verda/, /lumina/, …
// Clarity's BASE_URL-aware imageResolver similarly receives "./" and
// emits relative paths. No --base plumbing is needed — or even possible.

const run = (cmd, cwd) =>
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, CI: "1" } });

for (const name of VITE_PROJECTS) {
  const dir = path.join(root, "Templates", name);
  if (!existsSync(path.join(dir, "package.json"))) {
    console.warn(`templates: skipping ${name} — no package.json`);
    continue;
  }
  if (!existsSync(path.join(dir, "node_modules"))) {
    console.log(`templates: installing deps for ${name}`);
    run("npm ci --no-audit --no-fund", dir);
  }
  console.log(`templates: building ${name}`);
  run("npm run build", dir);

  const out = path.join(dir, "dist");
  if (!existsSync(path.join(out, "index.html"))) {
    throw new Error(`templates: ${name} build produced no dist/index.html`);
  }
  const target = path.join(dist, name);
  mkdirSync(dist, { recursive: true });
  cpSync(out, target, { recursive: true });
  console.log(`templates: ${name} → dist/${name}/`);
}

for (const name of STATIC_PROJECTS) {
  const dir = path.join(root, "Templates", name);
  if (!existsSync(path.join(dir, "index.html"))) {
    console.warn(`templates: skipping ${name} — no index.html`);
    continue;
  }
  const target = path.join(dist, name);
  mkdirSync(target, { recursive: true });
  // copy the runtime files only (no node/project files); assets dir included
  for (const entry of ["index.html", "content.js", "media.js", "assets"]) {
    const src = path.join(dir, entry);
    if (existsSync(src)) {
      cpSync(src, path.join(target, entry), { recursive: true });
    }
  }
  console.log(`templates: ${name} → dist/${name}/ (static copy)`);
}

console.log("templates: all projects integrated into dist/");
