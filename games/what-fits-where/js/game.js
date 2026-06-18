const $ = id => document.getElementById(id);
const shuffle = a => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[x[i], x[j]] = [x[j], x[i]] } return x };
const pick = (arr, n) => shuffle(arr).slice(0, n);

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

function updateStageScale() {
  const viewport = window.visualViewport;
  const width = viewport ? viewport.width : window.innerWidth;
  const height = viewport ? viewport.height : window.innerHeight;
  const scale = Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT);
  const safeScale = Math.max(0.1, scale);
  document.documentElement.style.setProperty("--stage-scale", safeScale.toFixed(4));
  document.documentElement.style.setProperty("--viewport-unscaled-width", `${(width / safeScale).toFixed(2)}px`);
  document.documentElement.style.setProperty("--viewport-unscaled-height", `${(height / safeScale).toFixed(2)}px`);
}

window.__updateStageScale = updateStageScale;
updateStageScale();
window.addEventListener("resize", updateStageScale);
window.addEventListener("orientationchange", updateStageScale);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateStageScale);
  window.visualViewport.addEventListener("scroll", updateStageScale);
}

const state = {
  mode: null, diff: null, diffSource: "user_selected",
  queue: [], qIndex: 0,
  startedAt: 0, startedAtIso: null,
  sessionId: null,
  correct: 0, wrong: 0,
  selectedRequired: 0, selectedUnnecessary: 0,
  removedMismatched: 0, wronglyRemovedMatched: 0,
  guessedSituations: 0, wrongSituationChoices: 0,
  situationResponses: [],
  stageStats: [{ c: 0, w: 0 }, { c: 0, w: 0 }, { c: 0, w: 0 }],
  responses: [],
  questionLogs: [],
  hintCount: 0, retryCount: 0,
  current: null,
  endedByUser: false, timeOver: false,
  timerId: null, timerLeft: 0, paused: false,
  advanceTimer: null, autoHintTimer: null, feedbackTimer: null, feedbackToken: 0,
  lastResult: null,
};
state.conditionData = null;
state.postGameConditionData = null;

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSessionId() {
  const cfg = Object.assign({}, window.GAME_CONFIG || {}, state.appConfig || {});
  if (!state.sessionId) state.sessionId = cfg.session_id || generateSessionId();
  return state.sessionId;
}

function getAppMode() {
  return state.appMode || window.GAME_MODE || "standard";
}

function getAppConfig() {
  return Object.assign({}, DEFAULT_CONFIG, window.GAME_CONFIG || {}, state.appConfig || {});
}

function getConfigSnapshot() {
  const cfg = getAppConfig();
  return JSON.parse(JSON.stringify(Object.assign({}, cfg, {
    mode: getAppMode(),
    difficulty: state.diff || cfg.default_difficulty || "easy",
    content_id: getContentIdForResult(cfg),
    game_key: getGameKeyForResult(cfg),
    game_version: getGameVersionForResult(cfg),
    session_id: getSessionId(),
  })));
}

function parseObjectConfig(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return Object.assign({}, value);
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (e) {
    return null;
  }
}

function getConfigObject(cfg, snakeKey, camelKey) {
  return parseObjectConfig(cfg && (cfg[snakeKey] || cfg[camelKey])) || {};
}

function getConfigValue(cfg, snakeKey, camelKey, fallback = null) {
  if (cfg && cfg[snakeKey] !== undefined && cfg[snakeKey] !== null && cfg[snakeKey] !== "") return cfg[snakeKey];
  if (cfg && camelKey && cfg[camelKey] !== undefined && cfg[camelKey] !== null && cfg[camelKey] !== "") return cfg[camelKey];
  return fallback;
}

function getSeniorIdForResult(cfg = getAppConfig()) {
  return getConfigValue(cfg, "senior_id", "seniorId")
    || getConfigValue(cfg, "user_id", "userId")
    || getConfigValue(cfg, "anonymous_user_id", "anonymousUserId");
}

function getContentIdForResult(cfg = getAppConfig()) {
  return getConfigValue(cfg, "content_id", "contentId");
}

function getGameKeyForResult(cfg = getAppConfig()) {
  return getConfigValue(cfg, "game_key", "gameKey", window.GAME_KEY || "what_fits_where");
}

function getGameVersionForResult(cfg = getAppConfig()) {
  return getConfigValue(cfg, "game_version", "gameVersion", window.GAME_VERSION || "1.0.0");
}

function createExtensionMeta(cfg = getAppConfig()) {
  const pairs = [
    ["tenant_id", "tenantId"],
    ["facility_id", "facilityId"],
    ["program_id", "programId"],
    ["reward_id", "rewardId"],
    ["recommendation_id", "recommendationId"],
  ];
  const meta = {};
  pairs.forEach(([snakeKey, camelKey]) => {
    const value = getConfigValue(cfg, snakeKey, camelKey);
    if (value !== null && value !== undefined && value !== "") meta[snakeKey] = value;
  });
  return Object.keys(meta).length ? meta : null;
}

function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch (e) {
    return null;
  }
}

function createClientContext(cfg = getAppConfig()) {
  const base = getConfigObject(cfg, "client_context", "clientContext");
  return Object.assign({
    device_id: base.device_id || base.deviceId || cfg.device_id || cfg.deviceId || null,
    platform: base.platform || cfg.platform || (window.ReactNativeWebView ? "react-native-webview" : "browser"),
    app_version: base.app_version || base.appVersion || cfg.app_version || cfg.appVersion || null,
    timezone: base.timezone || cfg.timezone || getLocalTimezone(),
  }, base);
}

function createVoiceContext(cfg = getAppConfig()) {
  const base = getConfigObject(cfg, "voice_context", "voiceContext");
  const voiceProfileId = base.voice_profile_id || base.voiceProfileId || cfg.voice_profile_id || cfg.voiceProfileId || cfg.voice_id || null;
  return Object.assign({
    voice_profile_id: voiceProfileId,
    voice_id: base.voice_id || voiceProfileId,
    voice_owner_type: base.voice_owner_type || base.voiceOwnerType || cfg.voice_owner_type || cfg.voiceOwnerType || "system",
    voice_owner_id: base.voice_owner_id || base.voiceOwnerId || cfg.voice_owner_id || cfg.voiceOwnerId || null,
  }, base);
}

function getTimeLimitSec() {
  const value = Number((state.appConfig || DEFAULT_CONFIG).time_limit_sec);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : GAME_TIME_LIMIT;
}

function setPaused(paused) {
  if (state.paused === paused) return;
  const cur = state.current;
  if (cur) {
    if (paused && !cur.pauseStartedAt) {
      cur.pauseStartedAt = Date.now();
    } else if (!paused && cur.pauseStartedAt) {
      cur.pausedMs = (cur.pausedMs || 0) + Date.now() - cur.pauseStartedAt;
      cur.pauseStartedAt = null;
    }
  }
  state.paused = paused;
}

function getQuestionElapsedMs(cur = state.current) {
  if (!cur || !cur.qStart) return 0;
  let pausedMs = cur.pausedMs || 0;
  if (cur.pauseStartedAt) pausedMs += Date.now() - cur.pauseStartedAt;
  return Math.max(0, Date.now() - cur.qStart - pausedMs);
}

function shouldShowScoreScreen() {
  return false;
}

function isCareMessageResultMode(mode = getAppMode()) {
  return mode === "care" || mode === "ai_assisted";
}

function shouldShowFinishCheck() {
  const cfg = state.appConfig || DEFAULT_CONFIG;
  return cfg.show_finish_check !== false;
}

const SCREEN_VOICE = {
  "screen-condition": "preGameCondition",
  "screen-difficulty": "chooseDifficulty",
  "screen-result": "wellDone",
  "screen-score": "scoreScreen",
  "screen-post-check-1": "postCheckStatus",
  "screen-post-check-2": "postCheckMore",
};
const SCREEN_BGM = {
  "screen-condition": "pregame",
  "screen-start": "pregame",
  "screen-difficulty": "pregame",
  "screen-play": "gameplay",
  "screen-result": "pregame",
  "screen-score": "pregame",
  "screen-post-check-1": "pregame",
  "screen-post-check-2": "pregame",
};

function setViewportBackground(id) {
  if (document.body) document.body.dataset.screen = id;
}

const QUESTION_PROMPT_VOICE = {
  choose_matching_items: "chooseMatchingPrompt",
  remove_mismatched_items: "removeMismatchPrompt",
  guess_situation: "guessSituationPrompt",
};
function playQuestionPromptVoice() {
  playVoice(QUESTION_PROMPT_VOICE[state.mode]);
}

/* ===== APP CONFIG (mode-driven UI) ===== */
function applyAppConfig() {
  const appMode = (window.GAME_MODE || "standard");
  const cfg = Object.assign({}, DEFAULT_CONFIG, window.GAME_CONFIG || {});
  document.body.classList.remove("mode-standard", "mode-reminder", "mode-care", "mode-ai-assisted");
  document.body.classList.add(`mode-${appMode.replace("_", "-")}`);
  if (!state.diff && ["easy", "normal", "hard"].includes(cfg.default_difficulty)) {
    state.diff = cfg.default_difficulty;
    state.diffSource = appMode + "_default";
  }
  if (cfg.session_id) state.sessionId = cfg.session_id;
  // sound defaults from config
  soundSettings.bgm = !!cfg.background_music_enabled;
  soundSettings.sfx = !!cfg.sound_effect_enabled;
  soundSettings.voice = !!cfg.voice_guide_enabled;
  refreshSoundToggles();
  // top buttons visibility
  const sBtn = $("btn-settings"), startSettingsBtn = $("btn-start-settings"), hBtn = $("btn-howto"), hintBtn = $("btn-hint"), pauseBtn = $("btn-pause"), qnum = $("p-qnum");
  const pills = document.querySelector(".topbar .pills");
  const actions = document.querySelector(".topbar .actions");
  if (sBtn) sBtn.style.display = cfg.show_settings ? "" : "none";
  if (startSettingsBtn) startSettingsBtn.style.display = "none";
  if (hBtn) hBtn.style.display = cfg.show_how_to_play ? "" : "none";
  if (hintBtn) hintBtn.style.display = supportsHintMode(appMode) ? "" : "none";
  if (pauseBtn) pauseBtn.style.display = cfg.show_pause !== false ? "" : "none";
  if (qnum) qnum.style.display = cfg.show_question_counter !== false ? "" : "none";
  if (pills) pills.style.display = cfg.show_question_counter !== false ? "" : "none";
  if (actions) {
    const hasVisibleAction = supportsHintMode(appMode) || cfg.show_timer !== false || cfg.show_pause !== false;
    actions.style.display = hasVisibleAction ? "" : "none";
  }
  // difficulty section
  const diffRow = $("diff-row"), diffH = $("diff-heading");
  if (diffRow) diffRow.style.display = cfg.show_difficulty_select ? "" : "none";
  if (diffH) diffH.style.display = cfg.show_difficulty_select ? "" : "none";
  // timer / score in play screen
  const tEl = $("p-timer"); if (tEl) tEl.style.display = "";
  const timerWrap = $("p-timer-wrap"); if (timerWrap) timerWrap.style.display = cfg.show_timer ? "" : "none";
  // care mode tweaks
  if (appMode === "care") {
    if (!state.diff) { state.diff = "easy"; state.diffSource = "care_default"; }
  }
  state.appMode = appMode;
  state.appConfig = cfg;
}

/* ===== SETTINGS MODAL ===== */
function openSettingsModal() {
  refreshFullscreenToggle();
  $("settings-modal").classList.remove("is-hidden");
  $("settings-close-button")?.focus();
}

const _settingsBtn = $("btn-settings");
if (_settingsBtn) _settingsBtn.addEventListener("click", () => {
  openSettingsModal();
});
const _startSettingsBtn = $("btn-start-settings");
if (_startSettingsBtn) _startSettingsBtn.addEventListener("click", openSettingsModal);
$("settings-close-button").addEventListener("click", () => { $("settings-modal").classList.add("is-hidden"); });
const _settingsExitButton = $("settings-exit-button");
if (_settingsExitButton) _settingsExitButton.addEventListener("click", () => {
  $("settings-modal").classList.add("is-hidden");
  state.endedByUser = true;
  finishGame(true, false);
});

function getFullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || null;
}

function isFullscreenAvailable() {
  const root = document.documentElement;
  const allowed = document.fullscreenEnabled !== false &&
    document.webkitFullscreenEnabled !== false &&
    document.msFullscreenEnabled !== false;
  return allowed && !!(root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen);
}

function requestAppFullscreen() {
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen || root.msRequestFullscreen;
  return request ? request.call(root) : Promise.reject(new Error("Fullscreen is not supported."));
}

function exitAppFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
  return exit ? exit.call(document) : Promise.reject(new Error("Fullscreen exit is not supported."));
}

function isAutoViewportModeEnabled() {
  const cfg = getAppConfig();
  return cfg.fullscreen_on_start !== false &&
    cfg.auto_fullscreen !== false &&
    cfg.lock_orientation !== false &&
    cfg.orientation_lock !== false;
}

let hostViewportRequestSent = false;
function requestHostViewportMode(source = "auto") {
  if (hostViewportRequestSent) return;
  hostViewportRequestSent = true;
  sendGameEvent("REQUEST_VIEWPORT_MODE", {
    fullscreen: true,
    orientation: "landscape",
    source,
    session_id: getSessionId(),
  });
}

async function lockLandscapeOrientation() {
  const orientation = window.screen && window.screen.orientation;
  if (orientation && typeof orientation.lock === "function") {
    let lastError = null;
    for (const lockType of ["landscape", "landscape-primary"]) {
      try {
        await orientation.lock(lockType);
        return true;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("Landscape orientation lock failed.");
  }

  const legacyLock = window.screen && (
    window.screen.lockOrientation ||
    window.screen.mozLockOrientation ||
    window.screen.msLockOrientation
  );
  if (typeof legacyLock === "function") {
    const result = legacyLock.call(window.screen, "landscape");
    if (result && typeof result.then === "function") await result;
    return !!result;
  }
  return false;
}

function refreshViewportScaleSoon() {
  updateStageScale();
  window.setTimeout(updateStageScale, 120);
  window.setTimeout(updateStageScale, 360);
}

function logViewportModeWarning(source, message, error) {
  if (source === "settings_button") console.warn(message, error);
}

async function enterFullscreenAndLockLandscape(source = "auto") {
  if (!isAutoViewportModeEnabled()) return false;
  requestHostViewportMode(source);
  let applied = false;

  if (isFullscreenAvailable() && !getFullscreenElement()) {
    try {
      await requestAppFullscreen();
      applied = true;
    } catch (error) {
      logViewportModeWarning(source, "Fullscreen request failed", error);
    }
  }

  try {
    applied = (await lockLandscapeOrientation()) || applied;
  } catch (error) {
    logViewportModeWarning(source, "Landscape orientation lock failed", error);
  } finally {
    refreshFullscreenToggle();
    refreshViewportScaleSoon();
  }

  return applied;
}

function installAutoViewportMode() {
  if (!isAutoViewportModeEnabled()) return;
  requestHostViewportMode("load");
  window.setTimeout(() => { enterFullscreenAndLockLandscape("load"); }, 0);

  let retried = false;
  const retryOnInteraction = () => {
    if (retried) return;
    retried = true;
    enterFullscreenAndLockLandscape("user_interaction");
  };
  ["pointerdown", "touchstart", "keydown"].forEach(eventName => {
    document.addEventListener(eventName, retryOnInteraction, {
      capture: true,
      once: true,
      passive: true,
    });
  });
}

function refreshFullscreenToggle() {
  const btn = $("btn-fullscreen");
  if (!btn) return;
  const available = isFullscreenAvailable();
  const on = !!getFullscreenElement();
  btn.disabled = !available;
  btn.classList.toggle("on", available && on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  const txt = btn.querySelector(".txt");
  if (txt) txt.textContent = available ? (on ? "켜짐" : "켜기") : "불가";
}

const _fullscreenBtn = $("btn-fullscreen");
if (_fullscreenBtn) {
  _fullscreenBtn.addEventListener("click", async () => {
    if (!isFullscreenAvailable()) return;
    try {
      if (getFullscreenElement()) await exitAppFullscreen();
      else await enterFullscreenAndLockLandscape("settings_button");
    } catch (e) {
      console.warn("Fullscreen toggle failed", e);
    } finally {
      refreshFullscreenToggle();
    }
  });
  refreshFullscreenToggle();
}

["fullscreenchange", "webkitfullscreenchange", "msfullscreenchange"].forEach(eventName => {
  document.addEventListener(eventName, () => {
    refreshFullscreenToggle();
    if (getFullscreenElement() && isAutoViewportModeEnabled()) {
      lockLandscapeOrientation().catch(() => { });
    }
    refreshViewportScaleSoon();
  });
});

/* ===== HELP / TUTORIAL (multi-page) ===== */
let helpIdx = 0;
let helpReturnToPause = false;
function renderHelp() {
  const p = HELP_PAGES[helpIdx];
  const first = helpIdx === 0;
  $("help-title").textContent = p.t;
  $("help-text").textContent = p.b;
  $("help-progress").innerHTML = HELP_PAGES.map((_, i) => `<span class="dot${i === helpIdx ? " on" : ""}"></span>`).join("");
  $("help-prev").textContent = first ? "건너뛰기" : "이전";
  $("help-prev").disabled = false;
  const last = helpIdx === HELP_PAGES.length - 1;
  $("help-next").style.display = last ? "none" : "";
  $("help-done").style.display = last ? "" : "none";
}
function closeHelp() {
  $("help-modal").classList.remove("active");
  if (helpReturnToPause) {
    helpReturnToPause = false;
    $("pause-modal").classList.remove("is-hidden");
    $("pause-help-button")?.focus();
  }
}
function openHelp() { helpIdx = 0; renderHelp(); $("help-modal").classList.add("active"); }
const _howtoBtn = $("btn-howto");
if (_howtoBtn) _howtoBtn.addEventListener("click", openHelp);
$("help-prev").addEventListener("click", () => {
  if (helpIdx === 0) {
    closeHelp();
    return;
  }
  helpIdx--;
  renderHelp();
});
$("help-next").addEventListener("click", () => { if (helpIdx < HELP_PAGES.length - 1) { helpIdx++; renderHelp(); } });
$("help-done").addEventListener("click", closeHelp);

/* ===== APP EVENT BRIDGE ===== */
function sendGameEvent(type, payload = {}) {
  const message = { type, payload, timestamp: new Date().toISOString() };
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      console.log("Game Event:", message);
    }
  } catch (e) { console.warn("sendGameEvent error", e); }
}

function normalizeIncomingConfig(payload) {
  const source = payload && payload.config && typeof payload.config === "object"
    ? Object.assign({}, payload, payload.config)
    : Object.assign({}, payload || {});
  delete source.config;
  if (source.mode === "ai-assisted") source.mode = "ai_assisted";
  if (source.difficulty && !source.default_difficulty) source.default_difficulty = source.difficulty;
  if (source.question_count) {
    const count = Number(source.question_count);
    if (Number.isFinite(count) && count > 0) {
      source.question_count = Math.floor(count);
      source.question_counts_by_diff = {
        easy: [source.question_count],
        normal: [source.question_count],
        hard: [source.question_count],
      };
    }
  }
  ["show_condition_check", "show_finish_check", "show_settings", "show_how_to_play", "show_timer", "show_score",
    "show_difficulty_select", "show_pause", "show_hint", "show_question_counter",
    "background_music_enabled", "sound_effect_enabled", "voice_guide_enabled",
    "auto_start", "auto_return_to_hub"].forEach(key => {
      if (typeof source[key] === "string") {
        source[key] = source[key] === "true" || source[key] === "1" || source[key] === "yes";
      }
    });
  [
    ["client_context", "clientContext"],
    ["voice_context", "voiceContext"],
  ].forEach(([snakeKey, camelKey]) => {
    const parsed = parseObjectConfig(source[snakeKey] || source[camelKey]);
    if (parsed) source[snakeKey] = parsed;
  });
  return source;
}

function applyRuntimeConfig(payload = {}, source = "host") {
  const incoming = normalizeIncomingConfig(payload);
  let incomingMode = null;
  if (incoming.mode) {
    const allowed = { standard: true, reminder: true, care: true, ai_assisted: true };
    incomingMode = allowed[incoming.mode] ? incoming.mode : null;
    window.GAME_MODE = incomingMode || (window.GAME_MODE || "standard");
  }
  const modeDefaults = incomingMode && window.GAME_MODE_CONFIGS
    ? (window.GAME_MODE_CONFIGS[incomingMode] || {})
    : {};
  window.GAME_CONFIG = Object.assign({}, window.GAME_CONFIG || {}, modeDefaults, incoming);
  if (incoming.session_id) state.sessionId = incoming.session_id;
  if (incoming.default_difficulty && ["easy", "normal", "hard"].includes(incoming.default_difficulty)) {
    state.diff = incoming.default_difficulty;
    state.diffSource = source + "_config";
  }
  applyAppConfig();
  sendGameEvent("CONFIG_APPLIED", {
    source,
    session_id: getSessionId(),
    mode: getAppMode(),
    difficulty: state.diff || (state.appConfig || {}).default_difficulty || "easy",
    config_snapshot: getConfigSnapshot(),
  });
}

function parseHostMessage(data) {
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch (e) { return null; }
  }
  return data && typeof data === "object" ? data : null;
}

function escapeSelectorValue(value) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function handleExternalAnswer(payload = {}) {
  const grid = $("p-choices");
  const cur = state.current;
  if (!grid || !cur || cur.revealed) {
    sendGameEvent("EXTERNAL_ANSWER_IGNORED", { reason: "not_ready" });
    return;
  }
  const value = payload.item_key || payload.key || payload.value || payload.answer || payload.label || payload.text;
  if (!value) {
    sendGameEvent("EXTERNAL_ANSWER_IGNORED", { reason: "missing_value" });
    return;
  }
  let btn = grid.querySelector(`[data-key="${escapeSelectorValue(value)}"]`);
  if (!btn) {
    btn = Array.from(grid.querySelectorAll("button")).find(candidate => (
      (candidate.textContent || "").trim() === String(value).trim()
    ));
  }
  if (!btn || btn.disabled) {
    sendGameEvent("EXTERNAL_ANSWER_IGNORED", { reason: "not_found", value });
    return;
  }
  cur.inputType = "external";
  btn.click();
  sendGameEvent("EXTERNAL_ANSWER_APPLIED", {
    value,
    mode: state.mode,
    question_index: state.qIndex + 1,
  });
}

function handleHostMessage(event) {
  const message = parseHostMessage(event && event.data !== undefined ? event.data : event);
  if (!message) return;
  const type = message.type || message.event || (message.config || message.mode ? "APP_CONFIG" : "");
  const payload = message.payload || message.data || message;
  switch (type) {
    case "APP_CONFIG":
    case "GAME_CONFIG":
    case "CONFIG":
      applyRuntimeConfig(payload, "postMessage");
      break;
    case "PAUSE_GAME":
      setPaused(true);
      sendGameEvent("GAME_PAUSED", { source: "postMessage" });
      break;
    case "RESUME_GAME":
      setPaused(false);
      sendGameEvent("GAME_RESUMED", { source: "postMessage" });
      break;
    case "EXTERNAL_ANSWER":
    case "EXTERNAL_ITEM_SELECT":
      handleExternalAnswer(payload);
      break;
  }
}

window.applyGameRuntimeConfig = payload => applyRuntimeConfig(payload, "direct");

/* ===== LOADING ===== */
function runLoading(done) {
  const screen = $("loading-screen");
  if (screen) screen.classList.remove("active");
  const startScreen = $("screen-start");
  const loadingFill = $("start-loading-fill");
  const loadingText = $("start-loading-text");

  setViewportBackground("screen-start");
  sendGameEvent("GAME_READY", {
    session_id: getSessionId(),
    mode: getAppMode(),
    difficulty: state.diff || (state.appConfig || {}).default_difficulty || "easy",
    config_snapshot: getConfigSnapshot(),
  });

  function finishLoading() {
    if (startScreen) {
      const cfg = getAppConfig();
      if (cfg.auto_start && cfg.show_condition_check !== true) {
        if (done) done();
        return;
      }
      startScreen.classList.remove("is-loading");
      startScreen.classList.add("is-loaded");
      startScreen.classList.add("is-intro-revealing");
      window.setTimeout(() => {
        startScreen.classList.remove("is-intro-revealing");
        if (done) done();
      }, 850);
      return;
    }
    if (done) done();
  }

  if (!startScreen || !loadingFill || !loadingText) {
    finishLoading();
    return;
  }

  startScreen.classList.add("is-loading");
  startScreen.classList.remove("is-loaded");
  startScreen.classList.remove("is-intro-revealing");
  loadingFill.style.width = "0%";
  loadingText.textContent = "0%";

  const duration = 1800;
  const startedAt = performance.now();

  function update(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const percent = Math.round(easedProgress * 100);

    loadingFill.style.width = `${percent}%`;
    loadingText.textContent = `${percent}%`;

    if (progress < 1) {
      window.requestAnimationFrame(update);
      return;
    }

    loadingFill.style.width = "100%";
    loadingText.textContent = "100%";
    window.setTimeout(finishLoading, 260);
  }

  window.requestAnimationFrame(update);
}
window.addEventListener("DOMContentLoaded", () => {
  installAutoViewportMode();
  const templateReady = loadSituationTemplates();
  runLoading(() => { templateReady.finally(() => { maybeShowConditionCheck(); }); });
});

/* ===== CONDITION CHECK ===== */
const CONDITION_SLEEP_DRAG_STEP_PX = 42;
let _ccMood = "good";
let _ccSleepIdx = 4;
let _ccSleepDragPointerId = null;
let _ccSleepDragStepY = 0;
function maybeShowConditionCheck() {
  const cfg = state.appConfig || DEFAULT_CONFIG;
  const appMode = state.appMode || "standard";
  const show = (appMode === "standard") ? (cfg.show_condition_check !== false)
    : (appMode === "reminder") ? !!cfg.show_condition_check
      : false;
  if (!show) {
    if (cfg.default_mood || cfg.default_sleep_hours) {
      state.conditionData = {
        mood: cfg.default_mood || null,
        sleep_hours: cfg.default_sleep_hours || null,
        sleep_range: cfg.default_sleep_hours ? String(cfg.default_sleep_hours) : null,
      };
    }
    switchScreen("screen-start");
    if (cfg.auto_start) {
      window.setTimeout(() => { startGame(); }, 0);
    }
    return;
  }
  _ccMood = cfg.default_mood || "good";
  const defH = cfg.default_sleep_hours || 8;
  const idx = SLEEP_STEPS.findIndex(s => s.hours === defH);
  _ccSleepIdx = idx >= 0 ? idx : 4;
  renderConditionSel();
  const skipBtn = $("condition-skip-button");
  if (skipBtn) skipBtn.style.display = appMode === "standard" ? "" : "none";
  switchScreen("screen-start");
  const modal = $("condition-modal");
  if (modal) modal.classList.remove("is-hidden");
  const confirm = $("condition-confirm-button");
  if (confirm) confirm.focus();
}
function setConditionSleepIndex(nextIdx) {
  const len = SLEEP_STEPS.length;
  _ccSleepIdx = ((nextIdx % len) + len) % len;
  renderConditionSel();
}
function renderConditionSel() {
  document.querySelectorAll(".condition-mood-button").forEach(b => {
    const selected = b.dataset.mood === _ccMood;
    b.classList.toggle("is-selected", selected);
    b.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  const rows = $("condition-sleep-rows");
  if (!rows) return;
  rows.replaceChildren();
  [-1, 0, 1].forEach(offset => {
    const item = SLEEP_STEPS[((_ccSleepIdx + offset) % SLEEP_STEPS.length + SLEEP_STEPS.length) % SLEEP_STEPS.length];
    const row = document.createElement("span");
    const number = document.createElement("span");
    const unit = document.createElement("span");
    row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
    number.className = "condition-sleep-number";
    number.textContent = String(item.hours);
    unit.className = "condition-sleep-unit";
    unit.textContent = "시간";
    row.append(number, unit);
    rows.appendChild(row);
  });
}
document.querySelectorAll(".condition-mood-button").forEach(btn => {
  btn.addEventListener("click", () => {
    _ccMood = btn.dataset.mood || "good";
    renderConditionSel();
  });
});
document.getElementById("condition-sleep-up-button").addEventListener("click", () => {
  setConditionSleepIndex(_ccSleepIdx - 1);
});
document.getElementById("condition-sleep-down-button").addEventListener("click", () => {
  setConditionSleepIndex(_ccSleepIdx + 1);
});
document.querySelector(".condition-sleep-dial").addEventListener("pointerdown", e => {
  if (e.button > 0) return;
  e.preventDefault();
  _ccSleepDragPointerId = e.pointerId;
  _ccSleepDragStepY = e.clientY;
  e.currentTarget.classList.add("is-dragging");
  e.currentTarget.setPointerCapture?.(e.pointerId);
});
document.querySelector(".condition-sleep-dial").addEventListener("pointermove", e => {
  if (_ccSleepDragPointerId !== e.pointerId) return;
  e.preventDefault();
  const deltaY = e.clientY - _ccSleepDragStepY;
  const steps = Math.trunc(Math.abs(deltaY) / CONDITION_SLEEP_DRAG_STEP_PX);
  if (steps < 1) return;
  const direction = deltaY > 0 ? 1 : -1;
  _ccSleepDragStepY += direction * steps * CONDITION_SLEEP_DRAG_STEP_PX;
  setConditionSleepIndex(_ccSleepIdx + direction * steps);
});
function endConditionSleepDrag(e) {
  if (_ccSleepDragPointerId !== e.pointerId) return;
  e.currentTarget.releasePointerCapture?.(e.pointerId);
  e.currentTarget.classList.remove("is-dragging");
  _ccSleepDragPointerId = null;
  _ccSleepDragStepY = 0;
}
document.querySelector(".condition-sleep-dial").addEventListener("pointerup", endConditionSleepDrag);
document.querySelector(".condition-sleep-dial").addEventListener("pointercancel", endConditionSleepDrag);
document.querySelector(".condition-sleep-dial").addEventListener("lostpointercapture", e => {
  e.currentTarget.classList.remove("is-dragging");
  _ccSleepDragPointerId = null;
  _ccSleepDragStepY = 0;
});
document.getElementById("condition-confirm-button").addEventListener("click", () => {
  const sel = SLEEP_STEPS[_ccSleepIdx];
  state.conditionData = {
    mood: _ccMood,
    sleep_hours: sel.hours,
    sleep_range: sel.range,
  };
  $("condition-modal").classList.add("is-hidden");
});
document.getElementById("condition-skip-button").addEventListener("click", () => {
  state.conditionData = {
    skipped: true,
    mood: null,
    sleep_hours: null,
    sleep_range: null,
  };
  $("condition-modal").classList.add("is-hidden");
});
let _pausedByVisibility = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (!state.paused && state.current && !state.current.revealed) {
      _pausedByVisibility = true;
      setPaused(true);
      sendGameEvent("GAME_PAUSED", { source: "visibilitychange", session_id: getSessionId() });
    }
  } else if (_pausedByVisibility) {
    _pausedByVisibility = false;
    setPaused(false);
    sendGameEvent("GAME_RESUMED", { source: "visibilitychange", session_id: getSessionId() });
  }
});
window.addEventListener("error", e => {
  showError(e?.message || "알 수 없는 오류가 발생했어요.");
});

/* ===== COUNTDOWN ===== */
function runCountdown(onDone) {
  const modal = $("countdown-modal");
  const numEl = $("countdown-num");
  let n = 3;
  playVoice("countdownStart");
  numEl.textContent = n;
  modal.classList.add("active");
  const tick = setInterval(() => {
    n--;
    if (n <= 0) {
      clearInterval(tick);
      modal.classList.remove("active");
      onDone && onDone();
    } else {
      numEl.textContent = n;
      // re-trigger pulse anim
      numEl.style.animation = "none"; void numEl.offsetWidth; numEl.style.animation = "";
    }
  }, 1000);
}

/* ===== ERROR ===== */
function showError(msg) {
  const message = msg || "잠시 후 다시 시도해주세요.";
  $("error-msg").textContent = message;
  $("error-modal").classList.add("active");
  const cfg = getAppConfig();
  const now = new Date().toISOString();
  const startedAt = state.startedAtIso || now;
  const durationMs = state.startedAt ? Math.max(0, Date.now() - state.startedAt) : 0;
  const questionLogs = state.questionLogs.slice();
  const extensionMeta = createExtensionMeta(cfg);
  const resultDetail = {
    error_code: "GAME_ERROR",
    error_message: message,
    error_phase: "runtime",
    extension_meta: extensionMeta,
    condition_data: state.conditionData || null,
    post_game_condition_data: state.postGameConditionData || null,
  };
  const gameResult = {
    session_id: getSessionId(),
    content_id: getContentIdForResult(cfg),
    game_key: getGameKeyForResult(cfg),
    game_version: getGameVersionForResult(cfg),
    senior_id: getSeniorIdForResult(cfg),
    guardian_id: getConfigValue(cfg, "guardian_id", "guardianId"),
    assignment_id: getConfigValue(cfg, "assignment_id", "assignmentId"),
    alarm_id: getConfigValue(cfg, "alarm_id", "alarmId"),
    schedule_id: getConfigValue(cfg, "schedule_id", "scheduleId"),
    play_source: getConfigValue(cfg, "play_source", "playSource", getAppMode() === "standard" ? "manual" : getAppMode()),
    mode: getAppMode(),
    app_mode: getAppMode(),
    game_mode: state.mode || null,
    difficulty: state.diff || cfg.default_difficulty || "easy",
    config_snapshot: getConfigSnapshot(),
    status: "error",
    error_code: "GAME_ERROR",
    error_message: message,
    started_at: startedAt,
    ended_at: now,
    duration_ms: durationMs,
    meta: extensionMeta,
    question_logs: questionLogs,
    result_detail_json: resultDetail,
  };
  const errorResult = {
    session_id: getSessionId(),
    content_id: getContentIdForResult(cfg),
    game_key: getGameKeyForResult(cfg),
    game_version: getGameVersionForResult(cfg),
    senior_id: getSeniorIdForResult(cfg),
    guardian_id: getConfigValue(cfg, "guardian_id", "guardianId"),
    assignment_id: getConfigValue(cfg, "assignment_id", "assignmentId"),
    alarm_id: getConfigValue(cfg, "alarm_id", "alarmId"),
    schedule_id: getConfigValue(cfg, "schedule_id", "scheduleId"),
    play_source: getConfigValue(cfg, "play_source", "playSource", getAppMode() === "standard" ? "manual" : getAppMode()),
    mode: getAppMode(),
    app_mode: getAppMode(),
    difficulty: state.diff || cfg.default_difficulty || "easy",
    status: "error",
    error_code: "GAME_ERROR",
    message,
    error_message: message,
    started_at: startedAt,
    ended_at: now,
    duration_ms: durationMs,
    meta: extensionMeta,
    config_snapshot: getConfigSnapshot(),
    question_logs: questionLogs,
    result_detail_json: resultDetail,
    game_result: gameResult,
    game_result_json: gameResult,
    client_context: createClientContext(cfg),
    voice_context: createVoiceContext(cfg),
  };
  state.lastResult = errorResult;
  sendGameEvent("GAME_ERROR", errorResult);
}
$("btn-error-retry").addEventListener("click", () => {
  $("error-modal").classList.remove("active");
});
$("btn-error-exit").addEventListener("click", () => {
  $("error-modal").classList.remove("active");
  state.endedByUser = true; finishGame(true, false);
});

/* ===== START ===== */
$("btn-start").addEventListener("click", () => {
  enterFullscreenAndLockLandscape("start_button");
  const appMode = state.appMode || "standard";
  const cfg = state.appConfig || DEFAULT_CONFIG;
  if (appMode === "reminder" || appMode === "care" || appMode === "ai_assisted") {
    if (!state.diff) {
      state.diff = "easy";
      state.diffSource = appMode + "_default";
    }
    startGame(); return;
  }
  // care: 항상 easy 바로 시작. reminder/ai_assisted: diff가 이미 주어졌으면 바로 시작.
  if (appMode === "care") {
    state.diff = "easy"; state.diffSource = "care_default";
    startGame(); return;
  }
  if ((appMode === "reminder" || appMode === "ai_assisted") && state.diff) {
    startGame(); return;
  }
  if (cfg.show_difficulty_select === false) {
    if (!state.diff) {
      state.diff = cfg.default_difficulty || "easy";
      state.diffSource = "config_default";
    }
    startGame(); return;
  }
  // standard: 난이도 선택 화면으로 이동
  switchScreen("screen-difficulty");
});

// 난이도 선택
document.querySelectorAll(".difficulty-option").forEach(button => {
  button.addEventListener("click", () => {
    state.diff = button.dataset.diff || ["easy", "normal", "hard"][Number(button.dataset.difficultyIndex)] || "easy";
    state.diffSource = "user_selected";
    startGame();
  });
});
$("difficulty-back-button").addEventListener("click", () => { switchScreen("screen-start"); });

(function applyProfile() {
  const g = window.USER_DIFFICULTY_GROUP;
  const map = { low: "easy", middle: "normal", high: "hard" };
  if (g && map[g]) {
    state.diff = map[g]; state.diffSource = "profile_based";
  }
})();
/* apply app-level config (mode, sound defaults, UI visibility) */
applyAppConfig();

/* ===== BUILD QUEUE ===== */
const QUESTION_RULES_BY_DIFF = {
  easy: Array.from({ length: 10 }, () => ({ choices: 2, answers: 1, situations: 1 })),
  normal: Array.from({ length: 10 }, () => ({ choices: 3, answers: 1, situations: 1 })),
  hard: Array.from({ length: 10 }, (_, idx) => ({ choices: 4, answers: idx >= 6 ? 3 : 2, situations: 2 })),
};
const SITUATION_TEMPLATE_PATH = "docs/situation-templates-draft.json";

async function loadSituationTemplates() {
  const status = {
    path: SITUATION_TEMPLATE_PATH,
    loaded: false,
    applied: false,
    count: 0,
    missingItems: [],
  };
  window.SITUATION_TEMPLATE_STATUS = status;

  try {
    const response = await fetch(SITUATION_TEMPLATE_PATH, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    applySituationTemplateData(data, status);
  } catch (error) {
    if (window.SITUATION_TEMPLATE_DATA) {
      status.fallbackReason = error && error.message ? error.message : String(error);
      try {
        applySituationTemplateData(window.SITUATION_TEMPLATE_DATA, status);
        return status;
      } catch (fallbackError) {
        status.error = fallbackError && fallbackError.message ? fallbackError.message : String(fallbackError);
        console.warn("Using built-in question pool because embedded situation templates could not be applied.", fallbackError);
      }
    } else {
      status.error = error && error.message ? error.message : String(error);
      console.warn("Using built-in question pool because situation templates could not be loaded.", error);
    }
  }

  return status;
}

function applySituationTemplateData(data, status) {
  const templates = Array.isArray(data && data.templates) ? data.templates : [];
  const allTemplateItems = templates.flatMap(tpl => [
    ...(Array.isArray(tpl.requiredPool) ? tpl.requiredPool : []),
    ...(Array.isArray(tpl.wrongPool) ? tpl.wrongPool : []),
  ]);
  status.missingItems = Array.from(new Set(allTemplateItems.filter(key => !I[key])));

  const packs = templates
    .map(templateToPackQuestion)
    .filter(Boolean);

  if (!packs.length) throw new Error("No usable situation templates");

  ["easy", "normal", "hard"].forEach(diff => {
    POOL.choose_matching_items[diff] = stageTemplatePacks(packs);
  });

  status.loaded = true;
  status.applied = true;
  status.count = packs.length;
  status.version = data.version || null;
  status.sourceStatus = data.status || null;
  status.source = window.SITUATION_TEMPLATE_DATA === data ? "embedded" : "fetch";
  if (status.missingItems.length) {
    console.warn("Some situation template items are not registered:", status.missingItems);
  }
  console.info(`Applied ${packs.length} situation templates to the game.`);
}

function templateToPackQuestion(template) {
  if (!template) return null;
  const answers = uniqueValidKeys(template.requiredPool || []);
  if (!answers.length) return null;
  const answerSet = new Set(answers);
  const wrongItems = uniqueValidKeys(template.wrongPool || [])
    .filter(key => !answerSet.has(key));

  return {
    sit: template.questionPatterns && template.questionPatterns[0]
      ? template.questionPatterns[0]
      : `${template.situationName || "생활 상황"}에 필요한 물건을 골라주세요.`,
    questionPatterns: Array.isArray(template.questionPatterns) ? template.questionPatterns.slice() : [],
    items: uniqueValidKeys(answers.concat(wrongItems)),
    answers,
    templateId: template.id || "",
    situationName: template.situationName || "",
    source: "situation_template",
  };
}

function stageTemplatePacks(packs) {
  const cloned = packs.map(pack => Object.assign({}, pack, {
    questionPatterns: (pack.questionPatterns || []).slice(),
    items: (pack.items || []).slice(),
    answers: (pack.answers || []).slice(),
  }));
  const perStage = Math.ceil(cloned.length / 3);
  return {
    1: cloned.slice(0, perStage),
    2: cloned.slice(perStage, perStage * 2),
    3: cloned.slice(perStage * 2),
  };
}

function collectQuestionItemKeys() {
  const keys = new Set(Object.keys(I || {}));
  const addFromStageMap = stageMap => {
    if (!stageMap) return;
    Object.values(stageMap).forEach(stage => {
      (stage || []).forEach(q => {
        (q.items || []).forEach(k => keys.add(k));
      });
    });
  };
  Object.values(POOL || {}).forEach(modePool => {
    Object.values(modePool || {}).forEach(addFromStageMap);
  });
  return Array.from(keys).filter(k => I[k]);
}

// In two-situation hard questions, a distractor can be correct for the other situation.
function filterPackDistractorKeys(itemKeys, sourceAnswerKeys) {
  const sourceAnswerSet = new Set(uniqueValidKeys(sourceAnswerKeys || []));
  const sourceAnswerSignatures = new Set(uniqueValidKeys(sourceAnswerKeys || []).map(itemVisualSignature));
  return uniqueValidKeys(itemKeys || []).filter(key => (
    !sourceAnswerSet.has(key) && !sourceAnswerSignatures.has(itemVisualSignature(key))
  ));
}

function normalizePackQuestion(q, rule) {
  if (!q || q.kind !== "pack" || !rule) return q;
  const answerKeys = uniqueValidKeys(q.answers || []);
  const desiredAnswerCount = Math.min(rule.answers, answerKeys.length);
  const answers = answerKeys.slice(0, desiredAnswerCount);
  const sourceAnswerKeys = q.sourceAnswerKeys || q.answers;
  const sourceAnswerSet = new Set(uniqueValidKeys(sourceAnswerKeys));
  const sourceAnswerSignatures = new Set(uniqueValidKeys(sourceAnswerKeys).map(itemVisualSignature));
  let itemKeys = uniqueValidKeys(answers.concat(filterPackDistractorKeys(
    (q.items || []).map(item => item && item.k),
    sourceAnswerKeys
  )));

  const seen = new Set(itemKeys);
  const seenSignatures = new Set(itemKeys.map(itemVisualSignature));
  const fillers = collectQuestionItemKeys()
    .filter(k => {
      const signature = itemVisualSignature(k);
      return !seen.has(k) && !sourceAnswerSet.has(k) &&
        !seenSignatures.has(signature) && !sourceAnswerSignatures.has(signature);
    });
  itemKeys = itemKeys.concat(shuffle(fillers).slice(0, Math.max(0, rule.choices - itemKeys.length)));
  itemKeys = itemKeys.slice(0, rule.choices);

  q.answers = answers;
  if (!q.promptNormalized) q.sit = normalizePackPromptText(q.sit, answers.length);
  q.items = shuffle(itemKeys.map(k => it(k)));
  return q;
}

function normalizePackPromptText(text, answerCount) {
  if (!text) return text;
  const countText = `${answerCount}개`;
  return text
    .replace(/물을 주어야 할 물건을/g, `물을 주어야 할 물건 ${countText}를`)
    .replace(/물을 줄 대상이 되는 물건을/g, `물을 줄 대상이 되는 물건 ${countText}를`)
    .replace(/필요한 [두세네] 가지를/g, `필요한 물건 ${countText}를`)
    .replace(/필요한 물건을/g, `필요한 물건 ${countText}를`)
    .replace(/[두세네] 가지를/g, `${countText}를`)
    .replace(/\d+개를/g, `${countText}를`)
    .replace(/필요한 것을/g, `필요한 물건 ${countText}를`)
    .replace(/어울리지 않는 것을/g, `어울리지 않는 물건 ${countText}를`)
    .replace(/무엇을 (챙기면|준비하면) 좋을까요\?/g, `필요한 물건 ${countText}를 골라주세요.`)
    .replace(/빼주세요|빼세요/g, "골라주세요");
}

function formatPromptDisplayText(text) {
  return String(text || "")
    .replace(/,\s*이렇게 물건 (\d+)개를 골라주세요\.$/, "\n필요한 물건 $1개를 골라주세요.")
    .replace(/\s+(필요한 물건 \d+개를 골라주세요\.)$/, "\n$1")
    .replace(/\s+(물을 주어야 할 물건 \d+개를 골라주세요\.)$/, "\n$1")
    .replace(/\s+(물을 줄 대상이 되는 물건 \d+개를 골라주세요\.)$/, "\n$1");
}

function appendPromptLine(el, source, highlightSituation) {
  const countPattern = /물건 \d+개/g;
  let lastIndex = 0;
  let match;

  while ((match = countPattern.exec(source))) {
    if (match.index > lastIndex) {
      const text = source.slice(lastIndex, match.index);
      if (highlightSituation) {
        const situationSpan = document.createElement("span");
        situationSpan.className = "situation-highlight";
        situationSpan.textContent = text;
        el.appendChild(situationSpan);
      } else {
        el.appendChild(document.createTextNode(text));
      }
    }
    const countSpan = document.createElement("span");
    countSpan.className = "count-highlight";
    countSpan.textContent = match[0];
    el.appendChild(countSpan);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex === 0) {
    if (highlightSituation) {
      const situationSpan = document.createElement("span");
      situationSpan.className = "situation-highlight";
      situationSpan.textContent = source;
      el.appendChild(situationSpan);
    } else {
      el.textContent = source;
    }
    return;
  }
  if (lastIndex < source.length) {
    el.appendChild(document.createTextNode(source.slice(lastIndex)));
  }
}

function renderPromptText(el, text) {
  const source = formatPromptDisplayText(text);
  const lines = source.split(/\n+/).map(line => line.trim()).filter(Boolean);
  el.textContent = "";

  lines.forEach(line => {
    const lineEl = document.createElement("span");
    lineEl.className = "prompt-line";
    const isActionLine = /골라주세요\.$/.test(line);
    if (isActionLine) lineEl.classList.add("prompt-line-action");
    appendPromptLine(lineEl, line, !isActionLine);
    el.appendChild(lineEl);
  });
}

function flattenQuestionStages(stageMap) {
  return Object.keys(stageMap || {})
    .sort((a, b) => Number(a) - Number(b))
    .reduce((all, key) => all.concat(stageMap[key] || []), []);
}

function itemVisualSignature(key) {
  const item = I[key];
  return item ? (item.img || item.n || key) : String(key || "");
}

function uniqueValidKeys(keys) {
  const seen = new Set();
  return (keys || []).filter(key => {
    const signature = itemVisualSignature(key);
    if (!key || !I[key] || seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function takePackTemplate(pool, used, minAnswers) {
  const candidates = pool.filter(tpl => uniqueValidKeys(tpl.answers).length >= minAnswers);
  const source = candidates.length ? candidates : pool;
  const unused = source.filter(tpl => !used.has(tpl));
  const chosen = pick(unused.length ? unused : source, 1)[0];
  if (chosen) used.add(chosen);
  return chosen;
}

function getPackTemplatePrompt(tpl, answerCount) {
  const patterns = Array.isArray(tpl.questionPatterns) ? tpl.questionPatterns : [];
  const preferredPatterns = patterns.filter(text => /필요한 물건|무엇을|물을 주어야 할 물건|물을 줄 대상/.test(text || ""));
  const source = (preferredPatterns.length ? pick(preferredPatterns, 1)[0] : patterns[0])
    || tpl.sit
    || `${tpl.situationName || "생활 상황"}에 필요한 물건을 골라주세요.`;
  return normalizePackPromptText(source, answerCount);
}

const SPECIAL_SITUATION_NEED_CLAUSES = {
  meal_table: "식사할 때",
  rainy_day_outing: "비 오는 날 밖에 나갈 때",
  plant_watering: "물을 주어야 할 물건",
};

function normalizeSituationNeedClause(text) {
  let clause = String(text || "")
    .replace(/\s*무엇을.*$/g, "")
    .replace(/\s*무엇이.*$/g, "")
    .replace(/\s*필요한 물건.*$/g, "")
    .replace(/\s*준비물을 확인해 주세요\.?$/g, "")
    .replace(/\s*준비물을 확인해 주세요$/g, "")
    .trim();
  const parts = clause.split(/[.!?]/).map(part => part.trim()).filter(Boolean);
  clause = parts.length ? parts[parts.length - 1] : clause;

  return clause
    .replace(/나가려고 해요$/, "나갈 때")
    .replace(/가려고 해요$/, "갈 때")
    .replace(/외출하려면$/, "외출할 때")
    .replace(/하려면$/, "할 때")
    .replace(/으려면$/, "을 때")
    .replace(/\s+/g, " ")
    .trim();
}

function getSituationNeedClause(tpl) {
  if (!tpl) return "생활할 때 필요한 물건";
  if (SPECIAL_SITUATION_NEED_CLAUSES[tpl.templateId]) {
    const specialClause = SPECIAL_SITUATION_NEED_CLAUSES[tpl.templateId];
    return /물건$/.test(specialClause) ? specialClause : `${specialClause} 필요한 물건`;
  }

  const patterns = Array.isArray(tpl.questionPatterns) ? tpl.questionPatterns : [];
  const source = patterns.find(text => /무엇을|무엇이/.test(text || ""))
    || patterns[0]
    || tpl.sit
    || tpl.situationName
    || "생활 상황";
  const clause = normalizeSituationNeedClause(source) || tpl.situationName || "생활할 때";
  return `${clause} 필요한 물건`;
}

function getSituationPromptClause(tpl) {
  if (!tpl) return "생활";
  const patterns = Array.isArray(tpl.questionPatterns) ? tpl.questionPatterns : [];
  const source = patterns.find(text => /무엇을|무엇이/.test(text || ""))
    || patterns[0]
    || tpl.sit
    || tpl.situationName
    || "생활";
  const clause = normalizeSituationNeedClause(source)
    .replace(/\s*필요한 물건$/g, "")
    .trim();
  if (/골라주세요/.test(clause)) return tpl.situationName || "생활";
  return clause || tpl.situationName || "생활";
}

function buildRegulatedPackQuestion(templates, idx, rule) {
  const wantedSituations = Math.max(1, rule.situations || 1);
  const selectedTemplates = templates.filter(Boolean).slice(0, wantedSituations);
  const answers = [];
  const answerSeen = new Set();
  const answersByTemplate = new Map();
  const addAnswer = tpl => {
    for (const key of uniqueValidKeys(tpl.answers)) {
      const signature = itemVisualSignature(key);
      if (answerSeen.has(signature)) continue;
      answerSeen.add(signature);
      answers.push(key);
      if (!answersByTemplate.has(tpl)) answersByTemplate.set(tpl, []);
      answersByTemplate.get(tpl).push(key);
      return true;
    }
    return false;
  };

  selectedTemplates.forEach(tpl => {
    if (answers.length < rule.answers) addAnswer(tpl);
  });
  let fillIdx = 0;
  while (answers.length < rule.answers && selectedTemplates.length) {
    const tpl = selectedTemplates[fillIdx % selectedTemplates.length];
    addAnswer(tpl);
    fillIdx++;
    if (fillIdx > selectedTemplates.length * 8) break;
  }

  const situationTexts = selectedTemplates.map((tpl, sitIdx) => {
    if (wantedSituations > 1) {
      return `${sitIdx + 1}. ${getSituationPromptClause(tpl)}`;
    }
    const count = (answersByTemplate.get(tpl) || []).length || 1;
    return getPackTemplatePrompt(tpl, count);
  });
  const promptText = wantedSituations > 1
    ? `${situationTexts.join("\n")}\n필요한 물건 ${answers.length}개를 골라주세요.`
    : situationTexts.join("\n");
  const itemKeys = uniqueValidKeys(selectedTemplates.flatMap(tpl => tpl.items || []));
  const sourceAnswerKeys = uniqueValidKeys(selectedTemplates.flatMap(tpl => tpl.answers || []));
  const filteredItemKeys = uniqueValidKeys(answers.concat(
    filterPackDistractorKeys(itemKeys, sourceAnswerKeys)
  ));

  return {
    mode: "choose_matching_items",
    kind: "pack",
    stage: 1,
    stageIdx: idx,
    sit: promptText,
    items: shuffle(filteredItemKeys.map(k => it(k))),
    answers,
    sourceAnswerKeys,
    situationCount: wantedSituations,
    templateIds: selectedTemplates.map(tpl => tpl.templateId).filter(Boolean),
    situationNames: selectedTemplates.map(tpl => tpl.situationName).filter(Boolean),
    promptNormalized: true,
  };
}

function buildChooseMatchingQueue(diff, count) {
  const rules = QUESTION_RULES_BY_DIFF[diff] || QUESTION_RULES_BY_DIFF.easy;
  const total = count || rules.length;
  const pool = flattenQuestionStages((POOL.choose_matching_items || {})[diff]);
  const used = new Set();
  if (!pool.length) return [];

  return Array.from({ length: total }, (_, idx) => {
    const rule = rules[idx] || rules[rules.length - 1];
    const situationCount = Math.max(1, rule.situations || 1);
    const primaryNeed = situationCount > 1 ? Math.max(1, rule.answers - (situationCount - 1)) : rule.answers;
    const templates = [takePackTemplate(pool, used, primaryNeed)];
    for (let i = 1; i < situationCount; i++) {
      templates.push(takePackTemplate(pool, used, 1));
    }
    return normalizePackQuestion(buildRegulatedPackQuestion(templates, idx, rule), rule);
  });
}

function collectSituationChoiceLabels() {
  const labels = new Set();
  Object.values(GUESS_POOL || {}).forEach(stageMap => {
    Object.values(stageMap || {}).forEach(stage => {
      (stage || []).forEach(q => {
        (q.choices || []).forEach(label => labels.add(label));
      });
    });
  });
  return Array.from(labels);
}

function normalizeGuessQuestion(q, rule) {
  if (!q || q.kind !== "guess" || !rule) return q;
  const answer = q.answer;
  const seen = new Set(q.choices || []);
  let choices = [answer].concat((q.choices || []).filter(label => label !== answer));
  const fillers = collectSituationChoiceLabels()
    .filter(label => label !== answer && !seen.has(label));
  choices = choices.concat(shuffle(fillers).slice(0, Math.max(0, rule.choices - choices.length)));
  q.choices = shuffle(choices.slice(0, rule.choices));
  return q;
}

function applyQuestionRules(queue, diff) {
  const rules = QUESTION_RULES_BY_DIFF[diff] || QUESTION_RULES_BY_DIFF.easy;
  return queue.map((q, idx) => {
    const rule = rules[idx] || rules[rules.length - 1];
    return normalizeGuessQuestion(normalizePackQuestion(q, rule), rule);
  });
}

function buildQueue() {
  const q = [];
  const diff = state.diff || "easy";
  const qps = getQuestionCountsForDiff(diff);
  const missionSequence = getMissionSequenceForDiff(diff);
  const totalCount = qps.reduce((sum, count) => sum + count, 0);
  if (missionSequence.length === 1 && missionSequence[0] === "choose_matching_items") {
    return buildChooseMatchingQueue(diff, totalCount);
  }
  // 각 미션마다 모드별 문제 빌더를 사용해 순서대로 진행
  missionSequence.forEach((mode, mi) => {
    const stageNo = mi + 1;
    const count = qps[mi];
    if (count <= 0) return;
    q.push(...getGameMode(mode).buildQuestions({ mode, diff, stageNo, count }));
  });
  return applyQuestionRules(q, diff);
}

/* ===== GAME ===== */
function startGame() {
  clearScheduledTransitions();
  ["reveal-modal", "hint-modal", "pause-modal", "exit-modal", "help-modal", "countdown-modal"].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove("active");
  });
  ["condition-modal", "post-condition-modal", "pause-modal", "settings-modal"].forEach(id => {
    const el = $(id);
    if (el) el.classList.add("is-hidden");
  });
  try {
    if (!state.diff) state.diff = "easy";
    state.mode = getMissionSequenceForDiff(state.diff)[0];
    state.queue = buildQueue();
    if (!state.queue.length) throw new Error("No questions available");
  } catch (e) {
    showError("게임 데이터를 불러오지 못했습니다.");
    return;
  }
  state.qIndex = 0;
  state.startedAt = Date.now();
  state.startedAtIso = new Date(state.startedAt).toISOString();
  state.correct = 0; state.wrong = 0;
  state.selectedRequired = 0; state.selectedUnnecessary = 0;
  state.removedMismatched = 0; state.wronglyRemovedMatched = 0;
  state.guessedSituations = 0; state.wrongSituationChoices = 0;
  state.situationResponses = [];
  state.stageStats = getQuestionCountsForDiff(state.diff).map(() => ({ c: 0, w: 0 }));
  state.responses = [];
  state.questionLogs = [];
  state.hintCount = 0; state.retryCount = 0;
  state.postGameConditionData = null;
  state.endedByUser = false; state.timeOver = false;
  setPaused(false);
  switchScreen("screen-play");
  const diffEl = $("p-diff");
  if (diffEl) diffEl.textContent = DIFF_LABEL[state.diff];
  // 총 문제 수 (난이도별)
  const qps = getQuestionCountsForDiff(state.diff);
  state.totalQ = qps.reduce((a, b) => a + b, 0);
  // Pause until countdown completes
  setPaused(true);
  runCountdown(() => {
    startGlobalTimer();
    sendGameEvent("GAME_STARTED", {
      session_id: getSessionId(),
      mode: state.mode,
      game_mode: state.mode,
      app_mode: getAppMode(),
      difficulty: state.diff,
      started_at: state.startedAtIso,
      config_snapshot: getConfigSnapshot(),
    });
    setPaused(false);
    renderQuestion();
  });
}

function switchScreen(id) {
  setViewportBackground(id);
  let activeScreen = null;
  document.querySelectorAll(".screen").forEach(s => {
    const active = s.id === id;
    s.classList.toggle("active", active);
    if (active) activeScreen = s;
  });
  if (activeScreen) {
    activeScreen.scrollTop = 0;
    const scroller = activeScreen.querySelector(".center-wrap");
    if (scroller) scroller.scrollTop = 0;
    requestAnimationFrame(() => {
      activeScreen.scrollTop = 0;
      if (scroller) scroller.scrollTop = 0;
    });
  }
  if (typeof setBgmTrack === "function") setBgmTrack(SCREEN_BGM[id] || null);
  playVoice(SCREEN_VOICE[id]);
}

function clearAdvance() { if (state.advanceTimer) { clearTimeout(state.advanceTimer); state.advanceTimer = null; } }
function clearAutoHint() { if (state.autoHintTimer) { clearTimeout(state.autoHintTimer); state.autoHintTimer = null; } }
function clearFeedbackTimer() { if (state.feedbackTimer) { clearTimeout(state.feedbackTimer); state.feedbackTimer = null; } }
function clearScheduledTransitions() {
  clearAdvance();
  clearAutoHint();
  clearFeedbackTimer();
}

function getGameMode(mode) {
  const modeDef = window.GAME_MODES && window.GAME_MODES[mode];
  if (!modeDef) throw new Error(`Unknown game mode: ${mode}`);
  return modeDef;
}

function renderQuestion() {
  clearAdvance();
  clearAutoHint();
  if (state.qIndex >= state.queue.length) { finishGame(false, false); return; }
  const q = state.queue[state.qIndex];
  // 문제 모드 갱신
  if (q.mode && q.mode !== state.mode) {
    state.mode = q.mode;
  }
  state.mode = q.mode || state.mode;
  const modeEl = $("p-mode");
  if (modeEl) modeEl.textContent = MODE_LABEL[state.mode];
  const playEl = document.querySelector("#screen-play .play");
  if (playEl) playEl.dataset.mode = state.mode || "";
  // area-badges removed per UI request
  state.current = {
    q,
    picked: new Set(),
    removed: new Set(),
    guessAnswered: false,
    wrongCount: 0,
    revealed: false,
    qStart: Date.now(),
    pausedMs: 0,
    pauseStartedAt: null,
    attempts: [],
    hintCount: 0,
    logRecorded: false,
  };

  const stageEl = $("p-stage");
  if (stageEl) stageEl.textContent = `단계 ${q.stage}`;
  const totalQuestions = state.totalQ || state.queue.length;
  $("p-qnum").textContent = `진행 단계 ${Math.min(state.qIndex + 1, totalQuestions)}/${totalQuestions}`;
  const situationEl = $("p-situation");
  renderPromptText(situationEl, q.sit);
  situationEl.classList.toggle("multi-situation", (q.situationCount || 1) > 1);
  clearFeedback();
  updateHintButton();

  const modeDef = getGameMode(state.mode);
  const targetEl = $("p-target");
  targetEl.textContent = "";
  targetEl.style.display = "none";
  modeDef.renderContext(q);

  renderChoices();
  playQuestionPromptVoice();
  scheduleAutoHint();
}

function renderChoices() {
  const grid = $("p-choices");
  grid.innerHTML = "";
  getGameMode(state.mode).renderChoices(state.current);
}

function setFeedbackVisible(visible) {
  const area = $("p-feedback-area");
  if (area) area.classList.toggle("has-feedback", !!visible);
  const playEl = document.querySelector("#screen-play .play");
  if (playEl) playEl.classList.toggle("has-feedback", !!visible);
}

function hideFeedbackMessage() {
  setFeedbackVisible(false);
  const el = $("p-feedback");
  if (!el) return;
  el.textContent = "";
  el.className = "fb-msg";
}

function showFeedback(text, kind, duration = 1200) {
  closeHintModal(true);
  clearFeedbackTimer();
  const token = ++state.feedbackToken;
  const el = $("p-feedback");
  el.textContent = text;
  el.className = "fb-msg " + kind;
  setFeedbackVisible(true);
  if (duration > 0) {
    state.feedbackTimer = setTimeout(() => {
      if (state.feedbackToken !== token) return;
      clearFeedbackTimer();
      state.feedbackToken++;
      hideFeedbackMessage();
    }, duration);
  }
}

function supportsHintMode(appMode = state.appMode || "standard") {
  const cfg = state.appConfig || window.GAME_CONFIG || DEFAULT_CONFIG;
  if (cfg.show_hint === false) return false;
  return appMode === "standard" || appMode === "reminder" || appMode === "care" || appMode === "ai_assisted";
}

function supportsAutoHintMode(appMode = state.appMode || "standard") {
  const cfg = state.appConfig || window.GAME_CONFIG || DEFAULT_CONFIG;
  return cfg.auto_hint_enabled !== false && supportsHintMode(appMode) && (appMode === "care" || appMode === "ai_assisted");
}

function scheduleAutoHint() {
  clearAutoHint();
  if (!supportsAutoHintMode() || !state.current || state.current.revealed) return;
  const questionIndex = state.qIndex;
  const question = state.current.q;
  const showIfReady = () => {
    state.autoHintTimer = null;
    const cur = state.current;
    if (!cur || cur.q !== question || state.qIndex !== questionIndex || cur.revealed) return;
    if (state.paused) {
      state.autoHintTimer = setTimeout(showIfReady, 250);
      return;
    }
    if (isHintModalOpen()) return;
    openHintModal("auto");
  };
  state.autoHintTimer = setTimeout(showIfReady, AUTO_HINT_DELAY_MS);
}

function updateHintButton() {
  const btn = $("btn-hint");
  if (!btn) return;
  const show = supportsHintMode();
  btn.style.display = show ? "" : "none";
  btn.disabled = !show || !state.current || state.current.revealed;
  const active = isHintModalOpen();
  btn.classList.toggle("active", active);
  btn.setAttribute("aria-pressed", active ? "true" : "false");
}

function hintItemText(item) {
  return (item && item.h) || "생활 속에서 쓰임새를 떠올려 보세요.";
}

function remainingAnswerItems(q, doneKeys) {
  const answers = new Set(q.answers || []);
  return (q.items || []).filter(item => answers.has(item.k) && !doneKeys.has(item.k));
}

function describeHint() {
  const cur = state.current;
  if (!cur || !cur.q) {
    return { title: "힌트", lines: [{ text: "문제가 시작되면 힌트를 볼 수 있어요." }] };
  }
  const q = cur.q;

  if (state.mode === "choose_matching_items") {
    const remaining = remainingAnswerItems(q, cur.picked);
    if (!remaining.length) {
      return { title: "힌트", lines: [{ text: "아직 고르지 않은 물건이 없어요. 잘 고르셨어요." }] };
    }
    return {
      title: "물건의 쓰임새",
      lines: remaining.map(item => ({
        text: hintItemText(item),
      })),
    };
  }

  if (state.mode === "remove_mismatched_items") {
    const remaining = remainingAnswerItems(q, cur.removed);
    if (!remaining.length) {
      return { title: "힌트", lines: [{ text: "아직 살펴볼 물건이 없어요. 잘 찾으셨어요." }] };
    }
    return {
      title: "물건의 쓰임새",
      lines: remaining.map(item => ({
        text: hintItemText(item),
      })),
    };
  }

  if (state.mode === "guess_situation") {
    return {
      title: "힌트",
      lines: [{ text: q.explanation || q.answer || "정답 상황을 천천히 떠올려보세요." }],
    };
  }

  return { title: "힌트", lines: [{ text: "물건들을 하나씩 천천히 살펴보세요." }] };
}

function isHintModalOpen() {
  const modal = $("hint-modal");
  return !!(modal && modal.classList.contains("active"));
}

function renderHintModal() {
  const hint = describeHint();
  const title = $("hint-title");
  const list = $("hint-list");
  if (title) title.textContent = hint.title || "힌트";
  if (!list) return;
  list.innerHTML = "";
  (hint.lines || []).forEach(line => {
    const row = document.createElement("div");
    row.className = "hint-line";
    const text = document.createElement("span");
    text.textContent = line.text || "";
    row.appendChild(text);
    list.appendChild(row);
  });
}

function openHintModal(trigger = "manual") {
  if (!supportsHintMode() || !state.current || state.current.revealed) return;
  if (isHintModalOpen()) {
    closeHintModal(false);
    return;
  }
  renderHintModal();
  const modal = $("hint-modal");
  if (!modal) return;
  state.hintWasPaused = state.paused;
  state.hintCount++;
  if (state.current) state.current.hintCount = (state.current.hintCount || 0) + 1;
  setPaused(true);
  modal.classList.add("active");
  updateHintButton();
  playVoice("hint");
  sendGameEvent("HINT_OPENED", { mode: state.mode, question_index: state.qIndex + 1, trigger });
}

function closeHintModal(keepPaused) {
  const modal = $("hint-modal");
  const wasOpen = isHintModalOpen();
  if (modal) modal.classList.remove("active");
  const area = $("p-feedback-area");
  const box = $("p-feedback");
  let closedHintPanel = false;
  if (area) area.classList.remove("hint-open");
  if (box && box.classList.contains("hint-panel")) {
    closedHintPanel = true;
    box.textContent = "";
    box.className = "fb-msg";
  }
  if (closedHintPanel) setFeedbackVisible(false);
  if (wasOpen && !keepPaused && !state.hintWasPaused) setPaused(false);
  state.hintWasPaused = false;
  updateHintButton();
}

function clearFeedback() {
  closeHintModal(true);
  clearFeedbackTimer();
  state.feedbackToken++;
  hideFeedbackMessage();
}

function recordChoiceAction(action) {
  const cur = state.current;
  if (!cur) return;
  const entry = Object.assign({
    elapsed_ms: getQuestionElapsedMs(cur),
    at: new Date().toISOString(),
  }, action || {});
  cur.attempts.push(entry);
  if (entry.correct === false) state.retryCount++;
}

function answerNames(keys) {
  return (keys || []).map(key => I[key] ? I[key].n : key);
}

function buildQuestionLog(success, status) {
  const cur = state.current;
  if (!cur || !cur.q || cur.logRecorded) return null;
  const q = cur.q;
  const responseMs = getQuestionElapsedMs(cur);
  const answerKeys = Array.isArray(q.answers) ? q.answers.slice() : (q.answer ? [q.answer] : []);
  const selectedKeys = state.mode === "remove_mismatched_items"
    ? Array.from(cur.removed)
    : state.mode === "choose_matching_items"
      ? Array.from(cur.picked)
      : (cur.guessAnswered ? [q.answer] : []);
  cur.logRecorded = true;
  const log = {
    question_id: q.questionId || q.id || `${getSessionId()}_q${state.qIndex + 1}`,
    question_index: state.qIndex + 1,
    stage: q.stage || 1,
    game_mode: q.mode || state.mode,
    question_type: q.kind || "pack",
    difficulty: state.diff || null,
    situation: q.sit || "",
    situation_count: q.situationCount || 1,
    template_ids: q.templateIds || (q.templateId ? [q.templateId] : []),
    situation_names: q.situationNames || (q.situationName ? [q.situationName] : []),
    item_keys: (q.items || []).map(item => item.k).filter(Boolean),
    item_names: (q.items || []).map(item => item.n).filter(Boolean),
    answer_keys: answerKeys,
    answer_names: answerNames(answerKeys),
    correct_answer: answerKeys,
    selected_keys: selectedKeys,
    selected_names: answerNames(selectedKeys),
    selected_answer: selectedKeys,
    attempts: (cur.attempts || []).slice(),
    attempt_count: (cur.attempts || []).length,
    hint_count: cur.hintCount || 0,
    retry_count: cur.wrongCount || 0,
    response_ms: responseMs,
    response_time_ms: responseMs,
    response_sec: +(responseMs / 1000).toFixed(2),
    correct: !!success,
    is_correct: !!success,
    input_type: status === "time_over" ? "auto" : (cur.inputType || "touch"),
    status: status || (success ? "correct" : "wrong"),
  };
  log.raw_log_json = {
    question_index: log.question_index,
    game_mode: log.game_mode,
    question_type: log.question_type,
    template_ids: log.template_ids,
    situation_names: log.situation_names,
    item_keys: log.item_keys,
    answer_keys: log.answer_keys,
    selected_keys: log.selected_keys,
    attempts: log.attempts,
    status: log.status,
  };
  return log;
}

function recordQuestionCompletion(success, status) {
  const cur = state.current;
  if (!cur) return 0;
  const log = buildQuestionLog(success, status);
  const responseSec = log ? log.response_sec : +(getQuestionElapsedMs(cur) / 1000).toFixed(2);
  if (log) state.questionLogs.push(log);
  state.responses.push(responseSec);
  return responseSec;
}

function finishQuestion(success, delay) {
  const cur = state.current; const q = cur.q;
  cur.revealed = true;
  clearAutoHint();
  recordQuestionCompletion(success, success ? "correct" : "wrong");
  if (success) { state.correct++; state.stageStats[q.stage - 1].c++; }
  else { state.wrong++; state.stageStats[q.stage - 1].w++; }
  updateHintButton();
  state.advanceTimer = setTimeout(() => { state.qIndex++; renderQuestion(); }, delay || 1200);
}

function revealAndAdvance() {
  const cur = state.current; const q = cur.q;
  cur.revealed = true;
  clearAutoHint();
  updateHintButton();
  state.wrong++; state.stageStats[q.stage - 1].w++;
  recordQuestionCompletion(false, "revealed");

  const modal = $("reveal-modal");
  const content = $("reveal-content");
  const explain = $("reveal-explain");
  getGameMode(state.mode).renderReveal(q, content, explain);
  modal.classList.add("active");
  state.advanceTimer = setTimeout(() => {
    modal.classList.remove("active");
    state.qIndex++; renderQuestion();
  }, 3000);
}

/* ===== TIMER ===== */
function fmtTime(s) { s = Math.max(0, s | 0); const m = (s / 60) | 0, r = s % 60; return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`; }
function startGlobalTimer() {
  stopTimer();
  state.timerLeft = getTimeLimitSec();
  updateTimerDisplay();
  state.timerId = setInterval(() => {
    if (state.paused) return;
    state.timerLeft--;
    updateTimerDisplay();
    if (state.timerLeft <= 0) { stopTimer(); state.timeOver = true; finishGame(false, true); }
  }, 1000);
}
function updateTimerDisplay() {
  const el = $("p-timer");
  const total = Math.max(1, getTimeLimitSec());
  const remaining = Math.max(0, Math.min(total, state.timerLeft | 0));
  if (el) el.textContent = "남은 시간";
  const fill = $("p-timer-fill");
  if (fill) fill.style.width = `${(remaining / total) * 100}%`;
  const wrap = $("p-timer-wrap");
  if (wrap) {
    wrap.setAttribute("aria-valuemin", "0");
    wrap.setAttribute("aria-valuemax", String(total));
    wrap.setAttribute("aria-valuenow", String(remaining));
    wrap.setAttribute("aria-valuetext", `남은 시간 ${remaining}초`);
  }
}
function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }

/* ===== PAUSE MENU ===== */
const _hintBtn = $("btn-hint");
if (_hintBtn) _hintBtn.addEventListener("click", () => openHintModal("manual"));
const _hintCloseBtn = $("btn-hint-close");
if (_hintCloseBtn) _hintCloseBtn.addEventListener("click", () => closeHintModal(false));
const _hintModal = $("hint-modal");
if (_hintModal) {
  _hintModal.addEventListener("click", e => {
    if (e.target === _hintModal) closeHintModal(false);
  });
}

$("btn-pause").addEventListener("click", () => {
  setPaused(true);
  $("pause-modal").classList.remove("is-hidden");
  $("resume-button")?.focus();
  playVoice("pause");
});
$("resume-button").addEventListener("click", () => {
  $("pause-modal").classList.add("is-hidden");
  setPaused(false);
});
$("pause-restart-button").addEventListener("click", () => {
  $("pause-modal").classList.add("is-hidden");
  stopTimer();
  clearScheduledTransitions();
  sendGameEvent("GAME_RESTARTED", {
    session_id: getSessionId(),
    mode: state.mode,
    game_mode: state.mode,
    app_mode: getAppMode(),
    difficulty: state.diff,
  });
  startGame();
});
$("pause-help-button").addEventListener("click", () => {
  helpReturnToPause = true;
  $("pause-modal").classList.add("is-hidden");
  openHelp();
});
$("home-button").addEventListener("click", () => {
  $("pause-modal").classList.add("is-hidden");
  $("exit-modal").classList.add("active");
});
$("btn-keep").addEventListener("click", () => {
  $("exit-modal").classList.remove("active");
  $("pause-modal").classList.remove("is-hidden");
});
$("btn-end").addEventListener("click", () => {
  $("exit-modal").classList.remove("active");
  state.endedByUser = true;
  finishGame(true, false);
});

/* ===== POST GAME CONDITION CHECK ===== */
let _postGameCondition = null;

function resetPostGameConditionCheck() {
  _postGameCondition = {
    step: 0,
    moodAfter: null,
    fatigue: null,
    perceivedDifficulty: null,
    neededHelp: null,
    replayIntent: null,
    skipped: false,
  };
  renderPostGameConditionCheck();
}

function renderPostGameConditionCheck() {
  const data = _postGameCondition || {};
  const step = data.step || 0;
  document.querySelectorAll(".post-condition-option").forEach(btn => {
    const field = btn.dataset.postField;
    const selected = !!field && data[field] === btn.dataset.postValue;
    btn.classList.toggle("is-selected", selected);
    btn.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  document.querySelectorAll(".post-condition-page").forEach((page, index) => {
    page.hidden = index !== step;
  });
  document.querySelectorAll(".post-condition-dot").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === step);
  });
  const nextButton = $("post-condition-next-button");
  if (nextButton) nextButton.disabled = !(data.moodAfter && data.fatigue);
  const confirmButton = $("post-condition-confirm-button");
  if (confirmButton) confirmButton.disabled = !(data.perceivedDifficulty && data.neededHelp && data.replayIntent);
}

function startPostGameConditionCheck() {
  resetPostGameConditionCheck();
  const modal = $("post-condition-modal");
  if (modal) modal.classList.remove("is-hidden");
  $("post-condition-next-button")?.focus();
  playVoice("postCheckStatus");
}

function finishPostGameConditionCheck(skipped) {
  const base = _postGameCondition || {};
  const data = {
    mood: skipped ? null : base.moodAfter,
    difficulty_feel: skipped ? null : base.perceivedDifficulty,
    fatigue: skipped ? null : base.fatigue,
    needed_help: skipped ? null : base.neededHelp,
    want_replay: skipped ? null : base.replayIntent,
    mood_after: skipped ? null : base.moodAfter,
    perceived_difficulty: skipped ? null : base.perceivedDifficulty,
    replay_intent: skipped ? null : base.replayIntent,
    skipped: !!skipped,
    completed_at: new Date().toISOString(),
    session_id: getSessionId(),
  };
  state.postGameConditionData = data;
  if (state.lastResult) {
    state.lastResult.post_game_condition_data = data;
    if (state.lastResult.result_detail_json) {
      state.lastResult.result_detail_json.post_game_condition_data = data;
    }
  }
  sendGameEvent(skipped ? "POST_GAME_CONDITION_SKIPPED" : "POST_GAME_CONDITION_COMPLETED", data);
  $("post-condition-modal")?.classList.add("is-hidden");
  resetToStartScreen();
}

document.querySelectorAll(".post-condition-option").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!_postGameCondition) resetPostGameConditionCheck();
    const field = btn.dataset.postField;
    if (!field) return;
    _postGameCondition[field] = btn.dataset.postValue;
    renderPostGameConditionCheck();
  });
});
$("post-condition-skip-button").addEventListener("click", () => { finishPostGameConditionCheck(true); });
$("post-condition-next-button").addEventListener("click", () => {
  if (!_postGameCondition) resetPostGameConditionCheck();
  if (!(_postGameCondition.moodAfter && _postGameCondition.fatigue)) return;
  _postGameCondition.step = 1;
  renderPostGameConditionCheck();
  $("post-condition-confirm-button")?.focus();
  playVoice("postCheckMore");
});
$("post-condition-back-button").addEventListener("click", () => {
  if (!_postGameCondition) resetPostGameConditionCheck();
  _postGameCondition.step = 0;
  renderPostGameConditionCheck();
  $("post-condition-next-button")?.focus();
});
$("post-condition-confirm-button").addEventListener("click", () => {
  if (!_postGameCondition) resetPostGameConditionCheck();
  if (!(_postGameCondition.perceivedDifficulty && _postGameCondition.neededHelp && _postGameCondition.replayIntent)) return;
  finishPostGameConditionCheck(false);
});

function resetToStartScreen() {
  stopTimer(); clearScheduledTransitions();
  ["reveal-modal", "hint-modal", "pause-modal", "exit-modal", "help-modal", "countdown-modal", "error-modal"].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove("active");
  });
  ["condition-modal", "post-condition-modal", "pause-modal", "settings-modal"].forEach(id => {
    const el = $(id);
    if (el) el.classList.add("is-hidden");
  });
  state.mode = null;
  state.queue = [];
  state.qIndex = 0;
  state.current = null;
  setPaused(false);
  state.endedByUser = false;
  state.timeOver = false;
  switchScreen("screen-start");
}

/* ===== FINISH ===== */
function recommendNext() {
  const c = state.correct;
  if (c >= 8) return state.diff === "easy" ? "normal" : state.diff === "normal" ? "hard" : "hard";
  if (c >= 5) return state.diff;
  return state.diff === "hard" ? "normal" : state.diff === "normal" ? "easy" : "easy";
}

function returnToHub() {
  const appMode = state.appMode || "standard";
  if (typeof stopAllAudio === "function") stopAllAudio(true);
  sendGameEvent("RETURN_TO_HUB", { app_mode: appMode, mode: appMode, session_id: getSessionId() });
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RETURN_TO_HUB", app_mode: appMode, mode: appMode, session_id: getSessionId() }));
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RETURN_TO_HYODAM_CALL", app_mode: appMode, mode: appMode, session_id: getSessionId() }));
    }
  } catch (e) { console.warn(e); }
  if (window.HUB_RETURN_URL) {
    window.location.href = window.HUB_RETURN_URL;
  }
}
const hubReturnBtn = $("btn-hub-return");
if (hubReturnBtn) hubReturnBtn.addEventListener("click", returnToHub);

function finishGame(userExit, timeOver) {
  stopTimer(); clearScheduledTransitions();
  $("reveal-modal").classList.remove("active");
  $("hint-modal").classList.remove("active");
  $("pause-modal").classList.remove("active");
  $("exit-modal").classList.remove("active");
  ["condition-modal", "post-condition-modal", "pause-modal", "settings-modal"].forEach(id => {
    const el = $(id);
    if (el) el.classList.add("is-hidden");
  });

  const endedAt = new Date();
  const endedAtIso = endedAt.toISOString();
  const durationMs = Math.max(0, endedAt.getTime() - (state.startedAt || endedAt.getTime()));
  const answeredQs = state.correct + state.wrong;
  const duration = Math.round(durationMs / 1000);
  const avg = state.responses.length ? +(state.responses.reduce((a, b) => a + b, 0) / state.responses.length).toFixed(1) : 0;
  const accuracy = answeredQs ? Math.round(state.correct / answeredQs * 100) : 0;
  const nextDiff = recommendNext();
  const avgSit = state.situationResponses.length ? +(state.situationResponses.reduce((a, b) => a + b, 0) / state.situationResponses.length).toFixed(1) : 0;
  const qps = getQuestionCountsForDiff(state.diff);
  const cfg = getAppConfig();
  const status = (userExit || timeOver) ? "abandoned" : "completed";
  const legacyStatus = timeOver ? "time_over" : status;
  const exitReason = userExit ? "user_exit" : (timeOver ? "time_over" : "completed");
  const extensionMeta = createExtensionMeta(cfg);
  if ((userExit || timeOver) && state.current && !state.current.revealed && !state.current.logRecorded) {
    const partialLog = buildQuestionLog(false, timeOver ? "time_over" : "abandoned");
    if (partialLog) state.questionLogs.push(partialLog);
  }
  const resultDetail = {
    selected_required_items: state.selectedRequired,
    selected_unnecessary_items: state.selectedUnnecessary,
    removed_mismatched_items: state.removedMismatched,
    wrongly_removed_matched_items: state.wronglyRemovedMatched,
    guessed_situations_count: state.guessedSituations,
    wrong_situation_choices: state.wrongSituationChoices,
    average_situation_response_time_sec: avgSit,
    recommended_next_difficulty: nextDiff,
    recommended_next_difficulty_label: DIFF_LABEL[nextDiff],
    stage_results: state.stageStats.map((s, i) => ({ stage: i + 1, total_questions: qps[i] || 0, correct_count: s.c, wrong_count: s.w })),
    extension_meta: extensionMeta,
    condition_data: state.conditionData || null,
    post_game_condition_data: state.postGameConditionData || null,
    score_screen_enabled: shouldShowScoreScreen(),
  };

  const questionLogs = state.questionLogs.slice();
  const totalQuestions = state.totalQ || state.queue.length;
  const avgResponseTimeMs = questionLogs.length
    ? Math.round(questionLogs.reduce((sum, log) => sum + (Number(log.response_time_ms || log.response_ms) || 0), 0) / questionLogs.length)
    : null;
  const completionRate = totalQuestions ? +(answeredQs / totalQuestions).toFixed(4) : 0;
  const clientContext = createClientContext(cfg);
  const voiceContext = createVoiceContext(cfg);
  const missionSequence = getMissionSequenceForDiff(state.diff);
  const gameResult = {
    session_id: getSessionId(),
    content_id: getContentIdForResult(cfg),
    game_key: getGameKeyForResult(cfg),
    game_version: getGameVersionForResult(cfg),
    senior_id: getSeniorIdForResult(cfg),
    guardian_id: getConfigValue(cfg, "guardian_id", "guardianId"),
    assignment_id: getConfigValue(cfg, "assignment_id", "assignmentId"),
    alarm_id: getConfigValue(cfg, "alarm_id", "alarmId"),
    schedule_id: getConfigValue(cfg, "schedule_id", "scheduleId"),
    play_source: getConfigValue(cfg, "play_source", "playSource", getAppMode() === "standard" ? "manual" : getAppMode()),
    game_mode: state.mode,
    game_mode_label: MODE_LABEL[state.mode],
    mission_mode: state.mode,
    mission_sequence: missionSequence,
    mode: state.mode,
    app_mode: getAppMode(),
    cognitive_areas: COGNITIVE_AREAS[state.mode],
    difficulty: state.diff,
    start_difficulty: state.diff,
    difficulty_label: DIFF_LABEL[state.diff],
    difficulty_source: state.diffSource,
    config_snapshot: getConfigSnapshot(),
    status,
    exit_reason: exitReason,
    started_at: state.startedAtIso,
    ended_at: endedAtIso,
    duration_ms: durationMs,
    duration_sec: duration,
    total_stages: qps.length,
    questions_per_stage: qps,
    total_questions: totalQuestions,
    answered_questions: answeredQs,
    correct_count: state.correct,
    wrong_count: state.wrong,
    accuracy_percent: accuracy,
    completion_rate: completionRate,
    hint_count: state.hintCount,
    retry_count: state.retryCount,
    avg_response_sec: avg,
    avg_response_time_ms: avgResponseTimeMs,
    meta: extensionMeta,
    completed: !userExit && !timeOver,
    ended_by_user: userExit,
    time_over: timeOver,
    time_limit_sec: getTimeLimitSec(),
    remaining_time_sec: Math.max(0, state.timerLeft | 0),
    question_logs: questionLogs,
    result_detail_json: resultDetail,
    condition_data: resultDetail.condition_data,
    post_game_condition_data: resultDetail.post_game_condition_data,
  };

  const result = {
    game_mode: state.mode, game_mode_label: MODE_LABEL[state.mode],
    mission_mode: state.mode,
    mode: state.mode,
    app_mode: getAppMode(),
    cognitive_areas: COGNITIVE_AREAS[state.mode],
    session_id: getSessionId(),
    content_id: getContentIdForResult(cfg),
    game_key: getGameKeyForResult(cfg),
    game_version: getGameVersionForResult(cfg),
    senior_id: getSeniorIdForResult(cfg),
    guardian_id: getConfigValue(cfg, "guardian_id", "guardianId"),
    assignment_id: getConfigValue(cfg, "assignment_id", "assignmentId"),
    alarm_id: getConfigValue(cfg, "alarm_id", "alarmId"),
    schedule_id: getConfigValue(cfg, "schedule_id", "scheduleId"),
    play_source: getConfigValue(cfg, "play_source", "playSource", getAppMode() === "standard" ? "manual" : getAppMode()),
    difficulty: state.diff,
    start_difficulty: state.diff, difficulty_label: DIFF_LABEL[state.diff],
    difficulty_source: state.diffSource,
    config_snapshot: getConfigSnapshot(),
    total_stages: qps.length, questions_per_stage: qps, total_questions: totalQuestions,
    answered_questions: answeredQs,
    correct_count: state.correct, wrong_count: state.wrong, accuracy_percent: accuracy,
    completion_rate: completionRate,
    hint_count: state.hintCount,
    retry_count: state.retryCount,
    avg_response_sec: avg,
    avg_response_time_ms: avgResponseTimeMs,
    started_at: state.startedAtIso,
    ended_at: endedAtIso,
    duration_ms: durationMs,
    duration_sec: duration,
    meta: extensionMeta,
    completed: !userExit && !timeOver, ended_by_user: userExit, time_over: timeOver,
    time_limit_sec: getTimeLimitSec(), remaining_time_sec: Math.max(0, state.timerLeft | 0),
    exit_reason: exitReason,
    status,
    legacy_status: legacyStatus,
    question_logs: questionLogs,
    game_result: gameResult,
    game_result_json: gameResult,
    client_context: clientContext,
    voice_context: voiceContext,
    result_detail_json: resultDetail,
    selected_required_items: resultDetail.selected_required_items,
    selected_unnecessary_items: resultDetail.selected_unnecessary_items,
    removed_mismatched_items: resultDetail.removed_mismatched_items,
    wrongly_removed_matched_items: resultDetail.wrongly_removed_matched_items,
    guessed_situations_count: resultDetail.guessed_situations_count,
    wrong_situation_choices: resultDetail.wrong_situation_choices,
    average_situation_response_time_sec: resultDetail.average_situation_response_time_sec,
    recommended_next_difficulty: resultDetail.recommended_next_difficulty,
    recommended_next_difficulty_label: resultDetail.recommended_next_difficulty_label,
    stage_results: resultDetail.stage_results,
    condition_data: resultDetail.condition_data,
    post_game_condition_data: resultDetail.post_game_condition_data,
    score_screen_enabled: resultDetail.score_screen_enabled,
  };
  state.lastResult = result;

  if (!window.ReactNativeWebView) console.log("GAME_RESULT", result);
  sendGameEvent(status === "completed" ? "GAME_COMPLETED" : "GAME_ABANDONED", result);
  renderResultScreen(result);
}

function getResultMessage(data) {
  if (data.time_over) return "오늘도 차분히 참여해주셨어요.";
  if (data.ended_by_user) return "참여해주신 것만으로도 충분해요.";
  return "오늘도 끝까지 잘 해내셨어요.";
}

function renderResultScreen(result) {
  const data = result || state.lastResult || {};
  const appMode = data.app_mode || getAppMode();
  const standardMode = appMode === "standard";
  const careMessageMode = isCareMessageResultMode(appMode);
  const correct = data.correct_count || 0;
  const total = data.total_questions || data.answered_questions || (correct + (data.wrong_count || 0));
  const hintCount = data.hint_count || 0;
  const positive = careMessageMode ? "오늘의 준비물 미션을 끝까지 잘 마무리하셨어요." : getResultMessage(data);
  const note = careMessageMode
    ? "오늘은 언어·의미 활동과 집중 활동을 함께 해보셨어요."
    : (data.completed ? "천천히 판단하며 필요한 물건을 잘 찾아보셨어요." : "오늘 활동은 여기까지 해도 충분해요.");
  const detail = careMessageMode
    ? "상황에 맞는 물건을 고르며 일상생활 판단을 차분히 살펴보셨어요."
    : "";

  const screen = $("screen-result");
  const title = screen && screen.querySelector(".result-title");
  const msg = $("r-msg");
  const noteEl = $("r-note");
  const detailEl = $("r-detail");
  const correctTotal = $("result-correct-total");
  const hints = $("result-hints");
  const metrics = $("result-metrics");
  const homeBtn = $("btn-home");
  const returnBtn = $("btn-return");
  if (screen) screen.classList.toggle("care-message-result", careMessageMode);
  if (title) title.textContent = careMessageMode ? "수고하셨어요" : "오늘의 준비물";
  if (msg) msg.textContent = positive;
  if (noteEl) noteEl.textContent = note;
  if (detailEl) {
    detailEl.textContent = detail;
    detailEl.hidden = !careMessageMode;
  }
  if (correctTotal) correctTotal.textContent = `${correct} / ${total}`;
  if (hints) hints.textContent = `${hintCount}회`;
  if (metrics) {
    metrics.hidden = careMessageMode;
    metrics.setAttribute("aria-hidden", careMessageMode ? "true" : "false");
  }
  if (homeBtn) {
    homeBtn.textContent = standardMode ? "다시 하기" : "다시 하기";
    homeBtn.style.display = standardMode ? "" : "none";
  }
  if (returnBtn) returnBtn.textContent = standardMode ? "다음" : "효담콜로 돌아가기";
  switchScreen("screen-result");

  if ((state.appConfig || {}).auto_return_to_hub && !standardMode) {
    const configuredDelay = Number((state.appConfig || {}).auto_return_delay_ms);
    const autoReturnDelay = Number.isFinite(configuredDelay) && configuredDelay >= 0
      ? configuredDelay
      : AUTO_RETURN_TO_HUB_DELAY_MS;
    window.setTimeout(() => { returnToHub(); }, autoReturnDelay);
  }
}

function renderScoreScreen(result) {
  const data = result || state.lastResult || {};
  const correct = data.correct_count || 0;
  const wrong = data.wrong_count || 0;
  const accuracy = data.accuracy_percent || 0;
  $("score-correct").textContent = `${correct}문항`;
  $("score-wrong").textContent = `${wrong}문항`;
  $("score-accuracy").textContent = `${accuracy}%`;
  switchScreen("screen-score");
}

$("btn-home").addEventListener("click", () => {
  if ((state.appMode || getAppMode()) === "standard") {
    startGame();
    return;
  }
  resetToStartScreen();
});
$("btn-return").addEventListener("click", () => {
  if ((state.appMode || getAppMode()) === "standard") {
    if (shouldShowScoreScreen()) renderScoreScreen();
    else if (shouldShowFinishCheck()) startPostGameConditionCheck();
    else resetToStartScreen();
    return;
  }
  returnToHub(); return;
  // Notify host app to return to 효담콜
  sendGameEvent("RETURN_TO_HYODAM_CALL", { app_mode: state.appMode || "standard" });
  try {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RETURN_TO_HYODAM_CALL", app_mode: state.appMode || "standard" }));
    }
  } catch (e) { console.warn(e); }
  // Fallback: reset to start screen
  state.mode = null;
  if ((state.appMode || "standard") === "standard") { state.diff = "easy"; state.diffSource = "default_easy"; }
  const g = window.USER_DIFFICULTY_GROUP;
  const map = { low: "easy", middle: "normal", high: "hard" };
  if (g && map[g]) { state.diff = map[g]; state.diffSource = "profile_based"; }
  switchScreen("screen-start");
});
$("btn-score-next").addEventListener("click", () => {
  if (shouldShowFinishCheck()) startPostGameConditionCheck();
  else renderResultScreen();
});
