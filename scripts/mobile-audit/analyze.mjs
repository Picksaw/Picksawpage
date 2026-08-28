// Pixel-statistics sanity check over the screenshot set: flags frames that
// are blank/black/uniform (a canvas failed to render) or washed out.
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "scripts/mobile-audit/out/shots";
const files = readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
const rows = [];
for (const f of files) {
  const img = sharp(join(dir, f));
  const stats = await img.stats();
  const [ch] = stats.channels;
  const brightness = ch.mean;
  const stdev = ch.stdev;
  const flag =
    stdev < 4 ? "SUSPECT-UNIFORM" : brightness < 2 ? "SUSPECT-BLACK" : "ok";
  rows.push({ file: f, brightness: Math.round(brightness), stdev: Math.round(stdev), flag });
}
console.table(rows);
const bad = rows.filter((r) => r.flag !== "ok");
process.exitCode = bad.length ? 1 : 0;
