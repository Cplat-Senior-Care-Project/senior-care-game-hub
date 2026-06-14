const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const API_TOKEN = process.env.API_TOKEN || "";
const MAX_BODY_BYTES = 1024 * 1024;

const sessionsDir = path.join(DATA_DIR, "sessions");
const eventsFile = path.join(DATA_DIR, "events.jsonl");

function ensureStore() {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("request_body_too_large"), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8") || "{}";
        resolve(JSON.parse(text));
      } catch (_) {
        reject(Object.assign(new Error("invalid_json"), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function authorized(req) {
  if (!API_TOKEN) return true;
  return req.headers.authorization === `Bearer ${API_TOKEN}`;
}

function unwrapPayload(body) {
  if (body && body.type && body.payload) {
    return { eventType: body.type, payload: body.payload };
  }
  return { eventType: body.type || "SESSION_COMPLETE", payload: body };
}

function normalizeResult(body) {
  const { eventType, payload } = unwrapPayload(body);
  const sessionId = payload.session_id || payload.sessionId;
  if (!sessionId) {
    const err = new Error("missing_session_id");
    err.status = 422;
    throw err;
  }
  const questionLogs = Array.isArray(payload.question_logs)
    ? payload.question_logs
    : (payload.result_detail_json?.question_logs || []);
  return {
    event_type: eventType,
    session_id: sessionId,
    content_id: payload.content_id || payload.contentId || null,
    game_key: payload.game_key || payload.gameKey || "animal_feeding",
    mode: payload.mode || null,
    difficulty: payload.difficulty || null,
    status: payload.status || (eventType === "SESSION_ABORT" ? "abandoned" : "completed"),
    completed_questions: payload.completed_questions ?? payload.completedRounds ?? null,
    total_questions: payload.total_questions ?? payload.plannedRounds ?? null,
    correct_count: payload.correct_count ?? payload.correctCount ?? null,
    question_logs: questionLogs,
    result_detail_json: payload.result_detail_json || {},
    received_at: new Date().toISOString(),
    raw_payload: payload,
  };
}

function atomicWriteJson(file, value) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

function saveResult(result) {
  ensureStore();
  const file = path.join(sessionsDir, `${encodeURIComponent(result.session_id)}.json`);
  const duplicate = fs.existsSync(file);
  if (!duplicate) atomicWriteJson(file, result);
  fs.appendFileSync(eventsFile, JSON.stringify({
    at: new Date().toISOString(),
    session_id: result.session_id,
    event_type: result.event_type,
    duplicate,
  }) + "\n");
  return { duplicate, file };
}

function listResults() {
  ensureStore();
  return fs.readdirSync(sessionsDir)
    .filter(name => name.endsWith(".json"))
    .sort()
    .map(name => {
      const item = JSON.parse(fs.readFileSync(path.join(sessionsDir, name), "utf8"));
      return {
        session_id: item.session_id,
        content_id: item.content_id,
        game_key: item.game_key,
        mode: item.mode,
        difficulty: item.difficulty,
        status: item.status,
        received_at: item.received_at,
      };
    });
}

function readResult(sessionId) {
  const file = path.join(sessionsDir, `${encodeURIComponent(sessionId)}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!authorized(req)) return send(res, 401, { ok: false, error: "unauthorized" });

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { ok: true, service: "animal-feeding-result-api" });
  }
  if (req.method === "GET" && url.pathname === "/api/game-results") {
    return send(res, 200, { ok: true, results: listResults() });
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/game-results/")) {
    const sessionId = decodeURIComponent(url.pathname.slice("/api/game-results/".length));
    const result = readResult(sessionId);
    return result ? send(res, 200, { ok: true, result }) : send(res, 404, { ok: false, error: "not_found" });
  }
  if (req.method === "POST" && url.pathname === "/api/game-results") {
    const body = await readBody(req);
    const result = normalizeResult(body);
    const saved = saveResult(result);
    return send(res, saved.duplicate ? 200 : 201, {
      ok: true,
      duplicate: saved.duplicate,
      session_id: result.session_id,
    });
  }
  return send(res, 404, { ok: false, error: "not_found" });
}

ensureStore();
http.createServer((req, res) => {
  handle(req, res).catch(err => {
    send(res, err.status || 500, { ok: false, error: err.message || "internal_error" });
  });
}).listen(PORT, () => {
  console.log(`animal-feeding-result-api listening on http://127.0.0.1:${PORT}`);
});
