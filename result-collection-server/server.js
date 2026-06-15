const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");

loadEnvFile(path.join(__dirname, ".env"));

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, "data"));
const DB_PATH = path.resolve(process.env.DB_PATH || path.join(DATA_DIR, "game-results.sqlite"));
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const API_TOKEN = process.env.API_TOKEN || "";
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 1024 * 1024);

const sessionsDir = path.join(DATA_DIR, "sessions");
const eventsFile = path.join(DATA_DIR, "events.jsonl");
const schemaFile = path.join(__dirname, "schema.sql");

const VALID_PLAY_SOURCES = new Set([
  "reminder",
  "manual",
  "history_replay",
  "ai_recommendation",
  "care_session",
]);

const VALID_STATUSES = new Set(["completed", "abandoned", "error"]);

let db;

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(sessionsDir, { recursive: true });
}

function initDb() {
  ensureStore();
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(fs.readFileSync(schemaFile, "utf8"));
}

function send(res, status, body) {
  if (status === 204) {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const data = JSON.stringify(body);
  res.writeHead(status, {
    ...corsHeaders(),
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, "REQUEST_BODY_TOO_LARGE", "request body is too large"));
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
        reject(httpError(400, "INVALID_REQUEST", "invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function httpError(status, errorCode, message, details) {
  const err = new Error(message);
  err.status = status;
  err.error_code = errorCode;
  err.details = details;
  return err;
}

function authorized(req) {
  if (!API_TOKEN) return true;
  return req.headers.authorization === `Bearer ${API_TOKEN}`;
}

function unwrapPayload(body) {
  if (body && body.type && body.payload && typeof body.payload === "object") {
    return { eventType: body.type, payload: body.payload, rawBody: body };
  }
  return { eventType: body.type || "GAME_RESULT_SAVE", payload: body || {}, rawBody: body || {} };
}

function pick(source, snakeKey, camelKey) {
  if (!source || typeof source !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(source, snakeKey)) return source[snakeKey];
  if (camelKey && Object.prototype.hasOwnProperty.call(source, camelKey)) return source[camelKey];
  return undefined;
}

function stringOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function integerOrNull(value) {
  const num = numberOrNull(value);
  return num === null ? null : Math.trunc(num);
}

function jsonText(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function parseJsonText(value) {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return value;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneObject(value) {
  return isPlainObject(value) ? { ...value } : {};
}

function normalizeStatus(value, eventType) {
  const status = stringOrNull(value) || (eventType === "SESSION_ABORT" ? "abandoned" : "completed");
  return VALID_STATUSES.has(status) ? status : status;
}

function normalizePlaySource(value, mode) {
  const source = stringOrNull(value);
  if (source) return source;
  if (mode === "care") return "care_session";
  if (mode === "ai_assisted") return "ai_recommendation";
  if (mode === "reminder") return "reminder";
  return "manual";
}

function normalizeGameResult(payload, status) {
  const existing = pick(payload, "game_result", "gameResult") || pick(payload, "game_result_json", "gameResultJson");
  if (isPlainObject(existing)) {
    return existing;
  }

  return {
    mode: pick(payload, "mode"),
    difficulty: pick(payload, "difficulty"),
    config_snapshot: pick(payload, "config_snapshot", "configSnapshot") || {},
    status,
    total_questions: pick(payload, "total_questions", "totalQuestions"),
    correct_count: pick(payload, "correct_count", "correctCount"),
    wrong_count: pick(payload, "wrong_count", "wrongCount"),
    hint_count: pick(payload, "hint_count", "hintCount"),
    retry_count: pick(payload, "retry_count", "retryCount"),
    pause_count: pick(payload, "pause_count", "pauseCount"),
    interaction_count: pick(payload, "interaction_count", "interactionCount"),
    avg_response_time_ms: pick(payload, "avg_response_time_ms", "avgResponseTimeMs"),
    completion_rate: pick(payload, "completion_rate", "completionRate"),
    abandoned_at: pick(payload, "abandoned_at", "abandonedAt"),
    abandon_reason: pick(payload, "abandon_reason", "abandonReason"),
    error_code: pick(payload, "error_code", "errorCode"),
    error_message: pick(payload, "error_message", "errorMessage"),
    question_logs: pick(payload, "question_logs", "questionLogs") || [],
    result_detail_json: pick(payload, "result_detail_json", "resultDetailJson") || {},
  };
}

function normalizeQuestionLogs(payload, gameResult) {
  const logs =
    pick(payload, "question_logs", "questionLogs")
    || gameResult.question_logs
    || gameResult.questionLogs
    || pick(payload, "result_detail_json", "resultDetailJson")?.question_logs
    || [];

  return Array.isArray(logs) ? logs : [];
}

function normalizeResultRequest(body) {
  const { eventType, payload, rawBody } = unwrapPayload(body);
  const mode = stringOrNull(pick(payload, "mode")) || stringOrNull(pick(payload, "game_result", "gameResult")?.mode);
  const status = normalizeStatus(pick(payload, "status"), eventType);
  const gameResult = normalizeGameResult(payload, status);
  const questionLogs = normalizeQuestionLogs(payload, gameResult);
  const resultDetailJson =
    pick(payload, "result_detail_json", "resultDetailJson")
    || gameResult.result_detail_json
    || gameResult.resultDetailJson
    || {};
  const seniorId =
    stringOrNull(pick(payload, "senior_id", "seniorId"))
    || stringOrNull(pick(payload, "user_id", "userId"))
    || stringOrNull(pick(payload, "anonymous_user_id", "anonymousUserId"));

  const row = {
    id: crypto.randomUUID(),
    event_type: eventType,
    senior_id: seniorId,
    guardian_id: stringOrNull(pick(payload, "guardian_id", "guardianId")),
    content_id: stringOrNull(pick(payload, "content_id", "contentId")),
    game_key: stringOrNull(pick(payload, "game_key", "gameKey")),
    game_version: stringOrNull(pick(payload, "game_version", "gameVersion")),
    session_id: stringOrNull(pick(payload, "session_id", "sessionId")),
    play_source: normalizePlaySource(pick(payload, "play_source", "playSource"), mode),
    assignment_id: stringOrNull(pick(payload, "assignment_id", "assignmentId")),
    alarm_id: stringOrNull(pick(payload, "alarm_id", "alarmId")),
    schedule_id: stringOrNull(pick(payload, "schedule_id", "scheduleId")),
    mode,
    difficulty: stringOrNull(pick(payload, "difficulty")) || stringOrNull(gameResult.difficulty),
    status,
    started_at: stringOrNull(pick(payload, "started_at", "startedAt")),
    ended_at: stringOrNull(pick(payload, "ended_at", "endedAt")),
    duration_ms: integerOrNull(pick(payload, "duration_ms", "durationMs")),
    total_questions: integerOrNull(pick(payload, "total_questions", "totalQuestions") ?? gameResult.total_questions),
    completed_question_count: integerOrNull(
      pick(payload, "completed_question_count", "completedQuestionCount") ?? gameResult.completed_question_count
    ),
    correct_count: integerOrNull(pick(payload, "correct_count", "correctCount") ?? gameResult.correct_count),
    wrong_count: integerOrNull(pick(payload, "wrong_count", "wrongCount") ?? gameResult.wrong_count),
    hint_count: integerOrNull(pick(payload, "hint_count", "hintCount") ?? gameResult.hint_count),
    retry_count: integerOrNull(pick(payload, "retry_count", "retryCount") ?? gameResult.retry_count),
    pause_count: integerOrNull(pick(payload, "pause_count", "pauseCount") ?? gameResult.pause_count),
    interaction_count: integerOrNull(pick(payload, "interaction_count", "interactionCount") ?? gameResult.interaction_count),
    avg_response_time_ms: integerOrNull(
      pick(payload, "avg_response_time_ms", "avgResponseTimeMs") ?? gameResult.avg_response_time_ms
    ),
    completion_rate: numberOrNull(pick(payload, "completion_rate", "completionRate") ?? gameResult.completion_rate),
    abandoned_at: stringOrNull(pick(payload, "abandoned_at", "abandonedAt") ?? gameResult.abandoned_at),
    abandon_reason: stringOrNull(pick(payload, "abandon_reason", "abandonReason") ?? gameResult.abandon_reason),
    error_code: stringOrNull(pick(payload, "error_code", "errorCode") ?? gameResult.error_code),
    error_message: stringOrNull(pick(payload, "error_message", "errorMessage") ?? gameResult.error_message),
    error_phase: stringOrNull(pick(payload, "error_phase", "errorPhase") ?? gameResult.error_phase),
    game_result_json: gameResult,
    result_detail_json: resultDetailJson,
    client_context_json: pick(payload, "client_context", "clientContext") || null,
    voice_context_json: pick(payload, "voice_context", "voiceContext") || null,
    meta_json: pick(payload, "meta", "metaJson") || null,
    raw_request_json: rawBody,
    question_logs: questionLogs,
  };

  validateResult(row);
  return row;
}

function validateResult(row) {
  const required = [
    "senior_id",
    "content_id",
    "game_key",
    "game_version",
    "session_id",
    "play_source",
    "status",
    "started_at",
    "ended_at",
    "duration_ms",
  ];

  for (const field of required) {
    if (row[field] === null || row[field] === undefined || row[field] === "") {
      throw httpError(400, "MISSING_REQUIRED_FIELD", "required field is missing", { field });
    }
  }

  if (!isPlainObject(row.game_result_json)) {
    throw httpError(400, "MISSING_REQUIRED_FIELD", "required field is missing", { field: "game_result" });
  }

  if (!VALID_PLAY_SOURCES.has(row.play_source)) {
    throw httpError(400, "INVALID_ENUM_VALUE", "invalid play_source", {
      field: "play_source",
      value: row.play_source,
    });
  }

  if (!VALID_STATUSES.has(row.status)) {
    throw httpError(400, "INVALID_ENUM_VALUE", "invalid status", {
      field: "status",
      value: row.status,
    });
  }

  const startedAt = Date.parse(row.started_at);
  const endedAt = Date.parse(row.ended_at);
  if (Number.isNaN(startedAt) || Number.isNaN(endedAt)) {
    throw httpError(400, "INVALID_REQUEST", "started_at and ended_at must be ISO 8601 compatible");
  }

  if (row.duration_ms < 0) {
    throw httpError(422, "INVALID_DURATION", "duration_ms must be zero or positive");
  }
}

function saveResult(row) {
  const existing = db.prepare(
    "SELECT id, session_id, created_at FROM game_play_results WHERE senior_id = ? AND session_id = ?"
  ).get(row.senior_id, row.session_id);

  if (existing) {
    appendEvent(row, true);
    return { duplicate: true, result_id: existing.id, saved_at: existing.created_at };
  }

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO game_play_results (
        id, senior_id, guardian_id, content_id, game_key, game_version, session_id,
        play_source, assignment_id, alarm_id, schedule_id, mode, difficulty, status,
        started_at, ended_at, duration_ms, total_questions, completed_question_count,
        correct_count, wrong_count, hint_count, retry_count, pause_count, interaction_count,
        avg_response_time_ms, completion_rate, abandoned_at, abandon_reason,
        error_code, error_message, error_phase, game_result_json, result_detail_json,
        client_context_json, voice_context_json, meta_json, raw_request_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `).run(
      row.id,
      row.senior_id,
      row.guardian_id,
      row.content_id,
      row.game_key,
      row.game_version,
      row.session_id,
      row.play_source,
      row.assignment_id,
      row.alarm_id,
      row.schedule_id,
      row.mode,
      row.difficulty,
      row.status,
      row.started_at,
      row.ended_at,
      row.duration_ms,
      row.total_questions,
      row.completed_question_count,
      row.correct_count,
      row.wrong_count,
      row.hint_count,
      row.retry_count,
      row.pause_count,
      row.interaction_count,
      row.avg_response_time_ms,
      row.completion_rate,
      row.abandoned_at,
      row.abandon_reason,
      row.error_code,
      row.error_message,
      row.error_phase,
      jsonText(row.game_result_json),
      jsonText(row.result_detail_json),
      jsonText(row.client_context_json),
      jsonText(row.voice_context_json),
      jsonText(row.meta_json),
      jsonText(row.raw_request_json)
    );

    row.question_logs.forEach((question, index) => {
      const q = normalizeQuestionLog(question, index, row);
      db.prepare(`
        INSERT INTO game_question_logs (
          id, result_id, session_id, question_id, question_index, question_type,
          cognitive_domain, difficulty, prompt_type, target_item, target_count,
          items_shown, selected_answer, correct_answer, is_correct, attempt_count,
          hint_used, hint_count, replay_count, response_time_ms, first_response_time_ms,
          changed_answer_count, wrong_tap_count, touch_miss_count, input_type, raw_log_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        q.id,
        row.id,
        row.session_id,
        q.question_id,
        q.question_index,
        q.question_type,
        q.cognitive_domain,
        q.difficulty,
        q.prompt_type,
        q.target_item,
        q.target_count,
        q.items_shown,
        q.selected_answer,
        q.correct_answer,
        q.is_correct,
        q.attempt_count,
        q.hint_used,
        q.hint_count,
        q.replay_count,
        q.response_time_ms,
        q.first_response_time_ms,
        q.changed_answer_count,
        q.wrong_tap_count,
        q.touch_miss_count,
        q.input_type,
        jsonText(q.raw_log_json)
      );
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  writeJsonBackup(row);
  appendEvent(row, false);
  const saved = db.prepare("SELECT created_at FROM game_play_results WHERE id = ?").get(row.id);
  return { duplicate: false, result_id: row.id, saved_at: saved.created_at };
}

function normalizeQuestionLog(question, index, row) {
  const q = cloneObject(question);
  const questionId = stringOrNull(q.question_id || q.questionId) || `q${index + 1}`;
  return {
    id: crypto.randomUUID(),
    question_id: questionId,
    question_index: integerOrNull(q.question_index ?? q.questionIndex) ?? index + 1,
    question_type: stringOrNull(q.question_type ?? q.questionType),
    cognitive_domain: stringOrNull(q.cognitive_domain ?? q.cognitiveDomain),
    difficulty: stringOrNull(q.difficulty) || row.difficulty,
    prompt_type: stringOrNull(q.prompt_type ?? q.promptType),
    target_item: stringOrNull(q.target_item ?? q.targetItem),
    target_count: integerOrNull(q.target_count ?? q.targetCount),
    items_shown: integerOrNull(q.items_shown ?? q.itemsShown),
    selected_answer: stringOrNull(q.selected_answer ?? q.selectedAnswer),
    correct_answer: stringOrNull(q.correct_answer ?? q.correctAnswer),
    is_correct: q.is_correct === undefined && q.isCorrect === undefined ? null : (q.is_correct ?? q.isCorrect ? 1 : 0),
    attempt_count: integerOrNull(q.attempt_count ?? q.attemptCount),
    hint_used: q.hint_used === undefined && q.hintUsed === undefined ? null : (q.hint_used ?? q.hintUsed ? 1 : 0),
    hint_count: integerOrNull(q.hint_count ?? q.hintCount),
    replay_count: integerOrNull(q.replay_count ?? q.replayCount),
    response_time_ms: integerOrNull(q.response_time_ms ?? q.responseTimeMs),
    first_response_time_ms: integerOrNull(q.first_response_time_ms ?? q.firstResponseTimeMs),
    changed_answer_count: integerOrNull(q.changed_answer_count ?? q.changedAnswerCount),
    wrong_tap_count: integerOrNull(q.wrong_tap_count ?? q.wrongTapCount),
    touch_miss_count: integerOrNull(q.touch_miss_count ?? q.touchMissCount),
    input_type: stringOrNull(q.input_type ?? q.inputType),
    raw_log_json: isPlainObject(q.raw_log_json) ? q.raw_log_json : q,
  };
}

function writeJsonBackup(row) {
  const file = path.join(sessionsDir, `${encodeURIComponent(row.session_id)}.json`);
  const backup = {
    result_id: row.id,
    session_id: row.session_id,
    senior_id: row.senior_id,
    content_id: row.content_id,
    game_key: row.game_key,
    game_version: row.game_version,
    play_source: row.play_source,
    status: row.status,
    saved_to_db: true,
    raw_request_json: row.raw_request_json,
  };
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(backup, null, 2));
  fs.renameSync(tmp, file);
}

function appendEvent(row, duplicate) {
  fs.appendFileSync(eventsFile, JSON.stringify({
    at: new Date().toISOString(),
    result_id: row.id,
    senior_id: row.senior_id,
    session_id: row.session_id,
    event_type: row.event_type,
    status: row.status,
    duplicate,
  }) + "\n");
}

function listResults() {
  const rows = db.prepare(`
    SELECT id, senior_id, guardian_id, content_id, game_key, game_version, session_id,
           play_source, mode, difficulty, status, started_at, ended_at, duration_ms,
           total_questions, correct_count, wrong_count, hint_count, created_at
      FROM game_play_results
     ORDER BY created_at DESC
     LIMIT 200
  `).all();

  return rows.map(rowToPublicSummary);
}

function rowToPublicSummary(row) {
  return {
    result_id: row.id,
    senior_id: row.senior_id,
    guardian_id: row.guardian_id,
    content_id: row.content_id,
    game_key: row.game_key,
    game_version: row.game_version,
    session_id: row.session_id,
    play_source: row.play_source,
    mode: row.mode,
    difficulty: row.difficulty,
    status: row.status,
    started_at: row.started_at,
    ended_at: row.ended_at,
    duration_ms: row.duration_ms,
    total_questions: row.total_questions,
    correct_count: row.correct_count,
    wrong_count: row.wrong_count,
    hint_count: row.hint_count,
    saved_at: row.created_at,
  };
}

function readResult(sessionId) {
  const row = db.prepare("SELECT * FROM game_play_results WHERE session_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(sessionId);
  if (!row) return null;

  const questions = db.prepare("SELECT * FROM game_question_logs WHERE result_id = ? ORDER BY question_index ASC")
    .all(row.id)
    .map((question) => ({
      question_id: question.question_id,
      question_index: question.question_index,
      question_type: question.question_type,
      cognitive_domain: question.cognitive_domain,
      difficulty: question.difficulty,
      prompt_type: question.prompt_type,
      target_item: question.target_item,
      target_count: question.target_count,
      items_shown: question.items_shown,
      selected_answer: question.selected_answer,
      correct_answer: question.correct_answer,
      is_correct: question.is_correct === null ? null : Boolean(question.is_correct),
      attempt_count: question.attempt_count,
      hint_used: question.hint_used === null ? null : Boolean(question.hint_used),
      hint_count: question.hint_count,
      replay_count: question.replay_count,
      response_time_ms: question.response_time_ms,
      first_response_time_ms: question.first_response_time_ms,
      changed_answer_count: question.changed_answer_count,
      wrong_tap_count: question.wrong_tap_count,
      touch_miss_count: question.touch_miss_count,
      input_type: question.input_type,
      raw_log_json: parseJsonText(question.raw_log_json),
    }));

  return {
    ...rowToPublicSummary(row),
    assignment_id: row.assignment_id,
    alarm_id: row.alarm_id,
    schedule_id: row.schedule_id,
    completed_question_count: row.completed_question_count,
    retry_count: row.retry_count,
    pause_count: row.pause_count,
    interaction_count: row.interaction_count,
    avg_response_time_ms: row.avg_response_time_ms,
    completion_rate: row.completion_rate,
    abandoned_at: row.abandoned_at,
    abandon_reason: row.abandon_reason,
    error_code: row.error_code,
    error_message: row.error_message,
    error_phase: row.error_phase,
    game_result_json: parseJsonText(row.game_result_json),
    result_detail_json: parseJsonText(row.result_detail_json),
    client_context_json: parseJsonText(row.client_context_json),
    voice_context_json: parseJsonText(row.voice_context_json),
    meta_json: parseJsonText(row.meta_json),
    question_logs: questions,
  };
}

function isGameResultsCollectionPath(pathname) {
  return pathname === "/api/v1/game-results" || pathname === "/api/game-results";
}

function parseGameResultSessionPath(pathname) {
  for (const prefix of ["/api/v1/game-results/", "/api/game-results/"]) {
    if (pathname.startsWith(prefix)) {
      return decodeURIComponent(pathname.slice(prefix.length));
    }
  }
  return null;
}

async function handle(req, res) {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (!authorized(req)) {
    return send(res, 401, errorBody("UNAUTHORIZED", "authorization failed"));
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, {
      ok: true,
      service: "senior-care-result-api",
      storage: "sqlite",
      db_path: DB_PATH,
    });
  }

  if (req.method === "GET" && isGameResultsCollectionPath(url.pathname)) {
    return send(res, 200, { ok: true, results: listResults() });
  }

  const sessionId = parseGameResultSessionPath(url.pathname);
  if (req.method === "GET" && sessionId) {
    const result = readResult(sessionId);
    return result ? send(res, 200, { ok: true, result }) : send(res, 404, errorBody("NOT_FOUND", "result not found"));
  }

  if (req.method === "POST" && isGameResultsCollectionPath(url.pathname)) {
    const body = await readBody(req);
    const result = normalizeResultRequest(body);
    const saved = saveResult(result);
    return send(res, saved.duplicate ? 200 : 201, {
      result_id: saved.result_id,
      session_id: result.session_id,
      status: saved.duplicate ? "duplicate_ignored" : "saved",
      saved_at: saved.saved_at,
    });
  }

  return send(res, 404, errorBody("NOT_FOUND", "endpoint not found"));
}

function errorBody(errorCode, message, details) {
  return {
    error_code: errorCode,
    message,
    details: details || null,
  };
}

initDb();
http.createServer((req, res) => {
  handle(req, res).catch((err) => {
    const status = err.status || 500;
    const errorCode = err.error_code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "INVALID_REQUEST");
    send(res, status, errorBody(errorCode, err.message || "internal server error", err.details));
  });
}).listen(PORT, () => {
  console.log(`senior-care-result-api listening on http://127.0.0.1:${PORT}`);
  console.log(`SQLite DB: ${DB_PATH}`);
});

