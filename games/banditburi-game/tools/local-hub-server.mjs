import http from "node:http";
import { createReadStream, promises as fs, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(toolDir, "../../..");
const requestedPort = Number(process.env.PORT || process.argv[2] || 8080);
const clients = new Set();

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
  [".mp3", "audio/mpeg"],
  [".ico", "image/x-icon"],
]);

const liveReloadSnippet = `
<script>
(() => {
  const source = new EventSource("/__live_reload");
  source.addEventListener("config", () => {
    if (typeof window.__reloadGameConfig === "function") {
      window.__reloadGameConfig();
      return;
    }
    window.location.reload();
  });
  source.addEventListener("reload", () => window.location.reload());
})();
</script>`;

function safeFilePath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const resolved = path.resolve(hubRoot, `.${normalized}`);
  if (!resolved.startsWith(hubRoot)) return null;
  return resolved;
}

function sendLiveEvent(eventName) {
  for (const response of clients) {
    response.write(`event: ${eventName}\ndata: ${Date.now()}\n\n`);
  }
}

function getLiveEventName(relativePath) {
  return /(^|\/)config\/game\.config\.json$/i.test(relativePath) ? "config" : "reload";
}

async function serveFile(request, response) {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/__live_reload") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write("event: ready\ndata: ok\n\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  let filePath = safeFilePath(url.pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes.get(ext) || "application/octet-stream";
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", contentType);

  if (ext === ".html") {
    const html = await fs.readFile(filePath, "utf8");
    response.end(html.includes("</body>") ? html.replace("</body>", `${liveReloadSnippet}</body>`) : `${html}${liveReloadSnippet}`);
    return;
  }

  createReadStream(filePath).pipe(response);
}

let reloadTimer = null;
let pendingLiveEvent = null;
try {
  watch(hubRoot, { recursive: true }, (_eventType, filename) => {
    if (!filename) return;
    const relative = filename.replaceAll("\\", "/");
    if (relative.startsWith(".git/") || relative.includes("/.git/") || relative.includes("node_modules/")) return;
    const nextEvent = getLiveEventName(relative);
    pendingLiveEvent = pendingLiveEvent === "reload" || nextEvent === "reload" ? "reload" : "config";
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => {
      sendLiveEvent(pendingLiveEvent || "reload");
      pendingLiveEvent = null;
    }, 180);
  });
} catch (error) {
  console.warn(`File watching is not available here: ${error.message}`);
}

function start(port) {
  const server = http.createServer((request, response) => {
    serveFile(request, response).catch((error) => {
      response.writeHead(500);
      response.end(error.message);
    });
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < requestedPort + 20) {
      start(port + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Local hub: http://127.0.0.1:${port}/`);
    console.log(`Serving: ${hubRoot}`);
    console.log("Save files in VS Code and the local hub page will reload automatically.");
  });
}

start(requestedPort);
