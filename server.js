// Runs Brotherly on your own computer or any Node host: `npm start`, then open http://localhost:3000
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import chat from "./api/chat.js";

try { process.loadEnvFile?.(".env"); } catch {}

const root = fileURLToPath(new URL(".", import.meta.url));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png",
  ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  if (req.url.startsWith("/api/chat")) return chat(req, res);
  let path = decodeURIComponent(req.url.split("?")[0]);
  if (path === "/") path = "/index.html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  try {
    const data = await readFile(file);
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
    res.end(data);
  } catch { res.statusCode = 404; res.end("Not found"); }
}).listen(process.env.PORT || 3000, () => console.log(`Brotherly is running at http://localhost:${process.env.PORT || 3000}`));
