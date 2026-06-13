import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 8080);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

const server = http.createServer((req, res) => {
  let requestPath = decodeURIComponent(req.url.split("?")[0]);
  while (requestPath.startsWith("/")) requestPath = requestPath.slice(1);
  if (!requestPath) requestPath = "index.html";

  const filePath = path.resolve(root, requestPath);
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream",
    });
    res.end(data);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`오늘의 준비물: http://127.0.0.1:${port}`);
});
