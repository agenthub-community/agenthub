// scripts/serve.mjs
// Preview the built site at the same subpath GitHub Pages will use, so links
// that assume /openagenthub/ resolve the same locally as in production.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, "dist");
const BASE = "/openagenthub";
const PORT = process.env.PORT || 8787;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".zip": "application/zip",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === BASE || path === "/") path = `${BASE}/`;
  let rel = path.startsWith(`${BASE}/`) ? path.slice(BASE.length + 1) : path.slice(1);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  // Contain the path to DIST — even a preview server shouldn't serve "..".
  const file = normalize(join(DIST, rel));
  if (!file.startsWith(DIST) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end(`404: ${rel}`);
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(PORT, () => console.log(`serving dist/ at http://localhost:${PORT}${BASE}/`));
