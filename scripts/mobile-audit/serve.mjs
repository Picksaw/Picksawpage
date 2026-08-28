// Tiny static file server for testing dist/ with correct MIME types.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const ROOT = process.argv[2] || "dist";
const PORT = Number(process.argv[3] || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".glb": "model/gltf-binary",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    // log the Host header — platform preview probes reveal the public URL
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} Host=${req.headers.host}`);
    const url = new URL(req.url, "http://localhost");
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(normalize(ROOT))) {
      res.writeHead(403).end("forbidden");
      return;
    }
    const data = await readFile(file).catch(() => null);
    if (!data) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
      "accept-ranges": "bytes",
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
});

server.listen(PORT, "0.0.0.0", () => console.log(`serving ${ROOT} on :${PORT}`));
