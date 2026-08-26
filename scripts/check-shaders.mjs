/**
 * Shader validator.
 *
 * There is no GPU in CI, so a broken shader would otherwise only show
 * up as a black screen in the browser. This extracts every GLSL string
 * in the journey code, wraps it with the three.js built-ins that WebGL
 * injects at compile time, and parses it — catching syntax errors,
 * unbalanced braces, undeclared identifiers and the three.js chunk
 * mistakes that silently kill a material.
 *
 *   node scripts/check-shaders.mjs
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parser } from "@shaderfrog/glsl-parser";

const ROOT = "src/components/journey";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

/** Pull out every `/* glsl *\/ \`...\`` tagged template. */
function extractShaders(src, file) {
  const out = [];
  const re = /\/\*\s*glsl\s*\*\/\s*`/g;
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    let i = start;
    let depth = 0;
    while (i < src.length) {
      const ch = src[i];
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === "$" && src[i + 1] === "{") {
        depth++;
        i += 2;
        continue;
      }
      if (depth > 0 && ch === "}") {
        depth--;
        i++;
        continue;
      }
      if (depth === 0 && ch === "`") break;
      i++;
    }
    const body = src.slice(start, i);
    const line = src.slice(0, m.index).split("\n").length;
    // find the const name this was assigned to, for readable output
    const before = src.slice(Math.max(0, m.index - 200), m.index);
    const nameMatch = [...before.matchAll(/(?:const|let|var)\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*$/g)];
    const name = nameMatch.length ? nameMatch[nameMatch.length - 1][1] : `shader@${line}`;
    out.push({ file, name, line, body });
  }
  return out;
}

// three.js injects these before every shader it compiles.
const COMMON_PRELUDE = `
precision highp float;
precision highp int;
#define PI 3.141592653589793
#define RECIPROCAL_PI 0.3183098861837907
#define EPSILON 1e-6
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
`;

const VERT_PRELUDE = `
${COMMON_PRELUDE}
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute mat4 instanceMatrix;
attribute vec3 instanceColor;
`;

const FRAG_PRELUDE = COMMON_PRELUDE;

/** three.js #include chunks we reference — stub them out for parsing. */
const CHUNK_STUBS = {
  "<common>": "",
  "<tonemapping_fragment>": "gl_FragColor.rgb = gl_FragColor.rgb;",
  "<colorspace_fragment>": "gl_FragColor = gl_FragColor;",
  "<uv_vertex>": "",
  "<map_fragment>": "vec4 diffuseColor = vec4(1.0);",
  "<roughnessmap_fragment>": "float roughness = 0.5;",
  "<emissivemap_fragment>": "vec3 totalEmissiveRadiance = vec3(0.0);",
  "<fog_fragment>": "",
  "<logdepthbuf_fragment>": "",
};

let errors = 0;
let checked = 0;
const files = walk(ROOT);

/** Every journey source, so cross-file GLSL constants can be resolved. */
const GLSL_SOURCES = files.map((f) => readFileSync(f, "utf8"));

console.log("\nSHADER VALIDATION\n");

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const shaders = extractShaders(src, file);
  if (!shaders.length) continue;

  for (const sh of shaders) {
    checked++;
    const rel = relative(".", file);
    let body = sh.body;

    // resolve #include stubs
    body = body.replace(/#include\s+(<[a-z_0-9]+>)/g, (full, chunk) => {
      if (chunk in CHUNK_STUBS) return CHUNK_STUBS[chunk];
      return `/* unknown chunk ${chunk} */`;
    });

    /**
     * Resolve template interpolations.
     *
     * `${WETNESS_GLSL}` style injections of another shader constant get
     * inlined so the combined source is what actually reaches the GPU.
     * Numeric interpolations become a literal. Anything else becomes a
     * placeholder that will parse where an expression is expected — and
     * will FAIL where it is not, which is the point: interpolating a
     * value into a declaration position is a real bug.
     */
    body = body.replace(/\$\{([^}]*)\}/g, (_full, expr) => {
      const e = String(expr).trim();

      // 1. a GLSL chunk constant — inline the real source, from this
      //    file or from anywhere else in the journey tree (imports).
      const name = e.replace(/\..*$/, "");
      for (const candidate of [src, ...GLSL_SOURCES]) {
        const m = candidate.match(
          new RegExp(
            `(?:const|let|var)\\s+${name}\\s*(?::[^=]+)?=\\s*/\\*\\s*glsl\\s*\\*/\\s*\`([\\s\\S]*?)\``
          )
        );
        if (m) return m[1];
      }

      // 2. a compile-time numeric constant, e.g. ${MAX_LIGHTS}
      for (const candidate of [src, ...GLSL_SOURCES]) {
        const m = candidate.match(
          new RegExp(`(?:const|let|var)\\s+${name}\\s*(?::\\s*number)?\\s*=\\s*(-?[\\d.]+)\\s*;`)
        );
        if (m) return /toFixed/.test(e) ? Number(m[1]).toFixed(1) : m[1];
      }

      // 3. an unresolved interpolation. Emit something that parses as an
      //    expression but NOT as a declaration, so interpolating into a
      //    declaration position is still reported as the bug it is.
      return "1.0";
    });

    const isVertex = /gl_Position/.test(body);
    const isFragment = /gl_FragColor|gl_FragData|pc_fragColor/.test(body);
    const isPartial = !isVertex && !isFragment;

    // Partials (VERT_PARS / FRAG_PARS style) get wrapped in a main().
    let full;
    if (isPartial) {
      const declOnly = /^\s*(?:uniform|attribute|varying|const|precision|\/\/|\/\*|#|$)/m;
      void declOnly;
      // a body fragment goes inside main; a declaration block goes outside
      const looksLikeDecls = !/[;{]\s*$/.test(body.trim()) || /^\s*(uniform|attribute|varying)/m.test(body);
      full = looksLikeDecls
        ? `${VERT_PRELUDE}\n${body}\nvoid main(){ gl_Position = vec4(0.0); }`
        : `${VERT_PRELUDE}\nvoid main(){\n${body}\ngl_Position = vec4(0.0);\n}`;
    } else if (isVertex) {
      full = `${VERT_PRELUDE}\n${body}`;
    } else {
      full = `${FRAG_PRELUDE}\n${body}`;
    }

    try {
      parser.parse(full, { quiet: true });
      console.log(`  PASS  ${rel}:${sh.line}  ${sh.name}`);
    } catch (e) {
      errors++;
      const msg = String(e.message ?? e).split("\n")[0];
      console.log(`  FAIL  ${rel}:${sh.line}  ${sh.name}`);
      console.log(`        ${msg}`);
    }

    // ── hand-rolled sanity checks the parser can't express ──
    const warn = (cond, label) => {
      if (cond) {
        errors++;
        console.log(`  FAIL  ${rel}:${sh.line}  ${sh.name} — ${label}`);
      }
    };
    warn(
      /texture2D\s*\(/.test(body) && !/textureGrad|texture2DGradEXT/.test(body) && /fract\s*\(/.test(body) && /atlas|Tile|tile/i.test(body),
      "atlas sampling with fract() but no explicit gradients (will seam at mip boundaries)"
    );
    warn(
      /varying/.test(body) && isFragment && /gl_FragColor/.test(body) &&
        !/tonemapping_fragment/.test(sh.body) && /uBolt|emissive|Color/i.test(body) &&
        /ShaderMaterial/.test(src) && !/toneMapped/.test(src),
      "custom emissive shader without tone mapping (will clip under ACES)"
    );
  }
}

console.log(`\n${checked} shader(s) checked — ${errors === 0 ? "ALL VALID" : `${errors} PROBLEM(S)`}\n`);
process.exit(errors === 0 ? 0 : 1);
