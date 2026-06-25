/* ============================================================
   도깨비야! 무슨 색을 먹니? — 시니어 인지훈련 게임
   Vanilla JS / 오프라인 / WebView 가로모드
   ============================================================ */

/* ---------- Bridge (multi-platform) ---------- */
function RN(m) {
  const msg = JSON.stringify(m);
  try {
    const qaEnabled = new URLSearchParams(window.location.search).get("qa") === "1";
    if (qaEnabled) {
      const qaMessage = {
        source: "animal-feeding-qa",
        at: new Date().toISOString(),
        message: m,
      };
      if (window.parent && window.parent !== window) window.parent.postMessage(qaMessage, "*");
      if (window.opener && !window.opener.closed) window.opener.postMessage(qaMessage, "*");
    }
  } catch(_) {}
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(msg); return;
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.gameBridge) {
      window.webkit.messageHandlers.gameBridge.postMessage(m); return;
    }
    if (window.AndroidBridge && typeof window.AndroidBridge.onMessage === "function") {
      window.AndroidBridge.onMessage(msg); return;
    }
  } catch(e) {}
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ---------- Config ---------- */
const VERSION = "2.0.0";
const GAME_ID = "animal_feeding";
const DEFAULT_CONTENT_ID = "cognitive_animal_feeding_001";
const DEFAULT_TIME_LIMIT_MS = 3 * 60 * 1000;
const MODE_PLAY_SOURCE = {
  standard: "manual",
  reminder: "reminder",
  care: "care_session",
  ai_assisted: "ai_recommendation",
};
const VALID_PLAY_SOURCE = new Set([
  "reminder",
  "manual",
  "history_replay",
  "ai_recommendation",
  "care_session",
]);

function assetUrl(src) {
  return src;
}

function reportError(error, options = {}) {
  const payload = {
    code: error?.code || "runtime",
    message: String(error?.message || "Unknown error"),
    recoverable: error?.recoverable !== false,
    phase: error?.phase || options.phase || "unknown",
  };
  RN({ type:"ERROR", payload });
  if (options.showScreen) showErrorScreen(payload);
  return payload;
}

function showErrorScreen(error) {
  const title = document.getElementById("errorTitle");
  const message = document.getElementById("errorMessage");
  const code = document.getElementById("errorCode");
  if (title) title.textContent = error.code === "asset_load_failed" ? "게임 이미지를 불러오지 못했어요" : "게임을 계속할 수 없어요";
  if (message) message.textContent = error.recoverable ? "앱으로 돌아가 다시 시도해 주세요." : "앱 담당자에게 문의해 주세요.";
  if (code) code.textContent = error.code;
  show("error");
}

const ANIMALS = {
  tiger:    { id:"tiger",    label:"빨간 도깨비", img:"image/red_goblin.png", correctImg:"image/red_goblin_correct.png", baseImg:"image/goblin_straw_base.png",
              cheers:["든든해요","고마워요","어흥, 좋아요","잘 먹을게요"] },
  monkey:   { id:"monkey",   label:"초록 도깨비", img:"image/green_goblin.png", correctImg:"image/green_goblin_correct.png", baseImg:"image/goblin_straw_base.png",
              cheers:["우키, 좋아요","고마워요","맛있게 먹을게요","신나요"] },
  squirrel: { id:"squirrel", label:"하얀 도깨비", img:"image/white_goblin.png", correctImg:"image/white_goblin_correct.png", baseImg:"image/goblin_straw_base.png",
              cheers:["냠냠 좋아요","고마워요","따뜻해요","좋은 시간이네요"] },
  panda:    { id:"panda",    label:"노란 도깨비",   img:"image/yellow_goblin.png", correctImg:"image/yellow_goblin_correct.png", baseImg:"image/goblin_straw_base.png",
              cheers:["아삭아삭 좋아요","고마워요","마음에 들어요","천천히 먹을게요"] },
};

function pickCheer(animalId) {
  const a = ANIMALS[animalId];
  if (!a) return "좋아해요";
  const arr = a.cheers || ["좋아해요"];
  return arr[Math.floor(Math.random() * arr.length)];
}

const FOODS = [
  { id:"tomato",             label:"토마토",        img:"image/tomato.png",             type:"food",  target:"tiger" },
  { id:"apple",              label:"사과",          img:"image/apple.png",              type:"food",  target:"tiger" },
  { id:"strawberry",         label:"딸기",          img:"image/strawberry.png",         type:"food",  target:"tiger" },
  { id:"yellow_banana",      label:"바나나",        img:"image/yellow_banana.png",      type:"food",  target:"panda" },
  { id:"chamoe",             label:"참외",          img:"image/chamoe.png",             type:"food",  target:"panda" },
  { id:"corn",               label:"옥수수",        img:"image/corn.png",               type:"food",  target:"panda" },
  { id:"radish",             label:"무",            img:"image/radish.png",             type:"food",  target:"squirrel" },
  { id:"onion",              label:"양파",          img:"image/onion.png",              type:"food",  target:"squirrel" },
  { id:"garlic",             label:"마늘",          img:"image/garlic.png",             type:"food",  target:"squirrel" },
  { id:"broccoli",           label:"브로콜리",      img:"image/broccoli.png",           type:"food",  target:"monkey" },
  { id:"pea_pod",            label:"완두콩",        img:"image/pea_pod.png",            type:"food",  target:"monkey" },
  { id:"cucumber",           label:"오이",          img:"image/cucumber.png",           type:"food",  target:"monkey" },
  { id:"patjuk",             label:"팥죽",          img:"image/patjuk.png",             type:"trash", target:"bin" },
  { id:"talisman",           label:"부적",          img:"image/talisman.png",           type:"trash", target:"bin" },
];

const DIFFS = {
  easy:   { animals:["tiger","monkey"],                       rounds:10, trash:1 },
  normal: { animals:["tiger","monkey","squirrel"],            rounds:10, trash:2 },
  hard:   { animals:["tiger","monkey","squirrel","panda"],    rounds:10, trash:2 },
};

const ANIMAL_POOL = ["tiger", "monkey", "squirrel", "panda"];

function normalizeAnimalIds(value) {
  const raw = Array.isArray(value)
    ? value
    : (typeof value === "string" ? value.split(",") : []);
  return [...new Set(raw.map(v => String(v).trim()).filter(id => ANIMAL_POOL.includes(id)))];
}

function shuffledAnimalPool(exclude = []) {
  const blocked = new Set(exclude);
  const pool = ANIMAL_POOL.filter(id => !blocked.has(id));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function pickSessionAnimals(count, fixedAnimals = []) {
  const fixed = normalizeAnimalIds(fixedAnimals).slice(0, count);
  return [...fixed, ...shuffledAnimalPool(fixed)].slice(0, count);
}

const SLOT_POS = {
  2: ["tl", "tr"],
  3: ["tl", "tr", "bl"],
  4: ["tl", "tr", "bl", "br"],
};

/* ---------- State ---------- */
let state = null;
let voiceOn = true;
let sfxOn = true;
let bgmOn = true;
let voiceAvailable = false;
let cfg = { fontScale: 1, reducedMotion: false, userAlias: "손님" };
let selectedDiff = "hard";
let runtime = normalizeRuntimeConfig({});
let autoStarted = false;
let assetsReady = false;
let fatalError = null;
let displayRequestEmitted = false;
let finishCheck = { mood: null, fatigue: null, difficulty: null, help: null, replay: null };
let preGameCheck = { mood: "good", sleepHours: 7, skipped: false, completed: false };
let startDifficultyUnlocked = false;
let pendingDiff = null;
let pendingSessionSettings = null;
let countdownTimer = null;
let pendingCompletionMessage = null;
let pendingAutoReturnMs = 0;

function clearPauseUiState({ resetState = false } = {}) {
  document.body.classList.remove("paused");
  document.getElementById("quitModal")?.classList.remove("on");
  if (resetState && state) state._paused = false;
}

function normalizeRuntimeConfig(input) {
  const p = input || {};
  const rawMode = p.mode || "standard";
  const modeAliases = {
    alarm: "reminder",
    alert: "reminder",
    ai: "ai_assisted",
    ai_assist: "ai_assisted",
    ai_assistant: "ai_assisted",
    "ai-assisted": "ai_assisted",
  };
  const mode = modeAliases[rawMode] || rawMode;
  const isCareLike = mode === "care" || mode === "reminder" || mode === "ai_assisted";
  const isSimplifiedMode = mode === "care" || mode === "ai_assisted";
  const showProgressDefault = mode === "standard" || mode === "reminder";
  const hasStandardStartScreen = mode === "standard" || isSimplifiedMode;
  const useDragDefault = ["standard", "reminder", "care", "ai_assisted"].includes(mode);
  const autoStartDefault = mode === "reminder";
  const autoReturnDefaultMs = mode === "standard" ? 0 : 3000;
  const nested = p.config || {};
  const has = (camel, snake) => (
    nested[camel] !== undefined ||
    nested[snake] !== undefined ||
    p[camel] !== undefined ||
    p[snake] !== undefined
  );
  const read = (camel, snake, fallback) => {
    if (nested[camel] !== undefined) return nested[camel];
    if (nested[snake] !== undefined) return nested[snake];
    if (p[camel] !== undefined) return p[camel];
    if (p[snake] !== undefined) return p[snake];
    return fallback;
  };
  const display = p.display || nested.display || {};
  const readDisplay = (keys, fallback) => {
    for (const source of [display, nested, p]) {
      for (const key of keys) {
        if (source && source[key] !== undefined) return source[key];
      }
    }
    return fallback;
  };
  const trashCount = Number(read("trashCount", "trash_count", isSimplifiedMode ? 0 : -1));
  const defaultQuestionCount = isSimplifiedMode ? 5 : 10;
  const choiceCount = Number(read("choiceCount", "choice_count", isSimplifiedMode ? 2 : 0)) || 0;
  const animalCountFallback = choiceCount
    ? Math.max(2, choiceCount - (trashCount > 0 ? 1 : 0))
    : (isSimplifiedMode ? 2 : 0);
  const animalCountConfigured = has("animalCount", "animal_count");
  const targetAnimals = normalizeAnimalIds(read("targetAnimals", "target_animals", read("animals", "animals", [])));
  const orientationLock = readDisplay(["orientationLock", "orientation_lock", "screenOrientation", "screen_orientation"], "landscape");
  const returnUrl = read("returnUrl", "return_url",
    read("hubUrl", "hub_url",
      read("autoReturnUrl", "auto_return_url",
        read("homeUrl", "home_url",
          read("exitUrl", "exit_url", "")))));
  const configuredAutoReturnMs = Number(read("autoReturnMs", "auto_return_ms", autoReturnDefaultMs)) || 0;
  const autoReturnMs = mode === "standard"
    ? configuredAutoReturnMs
    : (configuredAutoReturnMs > 0 ? configuredAutoReturnMs : autoReturnDefaultMs);
  const timerVisibleByMode = mode === "standard" || mode === "reminder";
  const configuredTimeLimitMs = Number(read("timeLimitMs", "time_limit_ms", 0)) || 0;
  const configuredTimeLimitSeconds = Number(read("timeLimitSeconds", "time_limit_seconds", 0)) || 0;
  const timeLimitMs = Math.max(
    0,
    Math.round(configuredTimeLimitMs || (configuredTimeLimitSeconds * 1000) || DEFAULT_TIME_LIMIT_MS)
  );

  return {
    sessionId: p.session_id || p.sessionId || null,
    contentId: p.content_id || p.contentId || DEFAULT_CONTENT_ID,
    gameKey: p.game_key || p.gameKey || GAME_ID,
    gameVersion: read("gameVersion", "game_version", VERSION),
    playSource: normalizePlaySourceForApi(read("playSource", "play_source", MODE_PLAY_SOURCE[mode] || "manual"), mode),
    seniorId: read("seniorId", "senior_id", null),
    userId: read("userId", "user_id", null),
    anonymousUserId: read("anonymousUserId", "anonymous_user_id", null),
    guardianId: read("guardianId", "guardian_id", null),
    assignmentId: read("assignmentId", "assignment_id", null),
    alarmId: read("alarmId", "alarm_id", null),
    scheduleId: read("scheduleId", "schedule_id", null),
    tenantId: read("tenantId", "tenant_id", null),
    facilityId: read("facilityId", "facility_id", null),
    programId: read("programId", "program_id", null),
    rewardId: read("rewardId", "reward_id", null),
    recommendationId: read("recommendationId", "recommendation_id", null),
    clientContext: parsePlainObject(read("clientContext", "client_context", null)),
    voiceContext: parsePlainObject(read("voiceContext", "voice_context", null)),
    meta: parsePlainObject(read("meta", "meta", null)),
    mode,
    difficulty: isSimplifiedMode ? "easy" : (p.difficulty || (mode === "reminder" ? "normal" : selectedDiff)),
    showTimer: timerVisibleByMode && !!read("showTimer", "show_timer", timerVisibleByMode),
    timeLimitMs,
    showScore: !!read("showScore", "show_score", mode === "standard"),
    showDifficultySelect: mode === "standard" && !!read("showDifficultySelect", "show_difficulty_select", !isCareLike),
    showSettings: !!read("showSettings", "show_settings", true),
    showHelp: !!read("showHelp", "show_help", true),
    showHowToPlay: !isSimplifiedMode && !!read("showHowToPlay", "show_how_to_play", !isCareLike),
    showFinishCheck: !!read("showFinishCheck", "show_finish_check", mode === "standard"),
    showProgress: !!read("showProgress", "show_progress", showProgressDefault),
    allowReplay: !!read("allowReplay", "allow_replay", mode === "standard"),
    autoStart: !!read("autoStart", "auto_start", autoStartDefault) && mode === "reminder",
    autoReturnMs,
    questionCount: Number(read("questionCount", "question_count", defaultQuestionCount)) || 0,
    animalCount: Math.max(0, Number(read("animalCount", "animal_count", animalCountFallback)) || 0),
    animalCountSource: animalCountConfigured ? "config" : "default",
    targetAnimals,
    choiceCount,
    trashCount,
    useDrag: useDragDefault || !!read("useDrag", "use_drag", useDragDefault),
    effectSoundEnabled: !!read("effectSoundEnabled", "effect_sound_enabled", true),
    backgroundMusicEnabled: !!read("backgroundMusicEnabled", "background_music_enabled", true),
    hintEnabled: !!read("hintEnabled", "hint_enabled", true),
    autoHintEnabled: !!read("autoHintEnabled", "auto_hint_enabled", true),
    softFeedback: !!read("softFeedback", "soft_feedback", isSimplifiedMode),
    voiceGuideEnabled: !!read("voiceGuideEnabled", "voice_guide_enabled", voiceOn),
    resultLogLevel: read("resultLogLevel", "result_log_level", "detailed"),
    requestFullscreen: !!readDisplay(["requestFullscreen", "request_fullscreen", "fullscreen", "fullscreen_enabled"], true),
    orientationLock: orientationLock === false || orientationLock === "none" ? null : String(orientationLock || "landscape"),
    nativeDisplayRequest: !!readDisplay(["nativeDisplayRequest", "native_display_request"], true),
    cssLandscapeFallback: !!readDisplay(["cssLandscapeFallback", "css_landscape_fallback"], true),
    returnUrl,
    configSnapshot: null,
  };
}

function parsePlainObject(value) {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) return { ...value };
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch(_) {
    return null;
  }
}

function normalizePlaySourceForApi(value, mode = "standard") {
  const raw = String(value || "").trim();
  const aliases = {
    alarm: "reminder",
    alert: "reminder",
    care: "care_session",
    ai: "ai_recommendation",
    ai_assist: "ai_recommendation",
    ai_assisted: "ai_recommendation",
    "ai-assisted": "ai_recommendation",
    replay: "history_replay",
    history: "history_replay",
    historyReplay: "history_replay",
  };
  const source = aliases[raw] || raw || MODE_PLAY_SOURCE[mode] || "manual";
  return VALID_PLAY_SOURCE.has(source) ? source : (MODE_PLAY_SOURCE[mode] || "manual");
}

function getRuntimeSeniorId(source = runtime) {
  return source?.seniorId || source?.userId || source?.anonymousUserId || null;
}

function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch(_) {
    return null;
  }
}

function createClientContext(source = runtime) {
  const base = parsePlainObject(source?.clientContext) || {};
  return {
    device_id: base.device_id || base.deviceId || source?.deviceId || null,
    platform: base.platform || source?.platform || (window.ReactNativeWebView ? "react-native-webview" : "browser"),
    app_version: base.app_version || base.appVersion || source?.appVersion || source?.app_version || null,
    timezone: base.timezone || source?.timezone || getLocalTimezone(),
    ...base,
  };
}

function createVoiceContext(source = runtime) {
  const base = parsePlainObject(source?.voiceContext) || {};
  const voiceProfileId = base.voice_profile_id || base.voiceProfileId || source?.voiceProfileId || source?.voice_profile_id || null;
  return {
    voice_profile_id: voiceProfileId,
    voice_owner_type: base.voice_owner_type || base.voiceOwnerType || source?.voiceOwnerType || source?.voice_owner_type || "system",
    voice_owner_id: base.voice_owner_id || base.voiceOwnerId || source?.voiceOwnerId || source?.voice_owner_id || null,
    ...base,
  };
}

function runtimeSnapshot() {
  const { configSnapshot, ...r } = runtime;
  return { ...r };
}

function shouldUseStandardStartScreen(mode = runtime?.mode) {
  return mode === "standard" || mode === "care" || mode === "ai_assisted";
}

function applyRuntimeConfig(next) {
  const base = next && next.mode && next.mode !== runtime.mode ? {} : runtime;
  runtime = normalizeRuntimeConfig({ ...base, ...next });
  runtime.configSnapshot = runtimeSnapshot();
  selectedDiff = runtime.difficulty || selectedDiff;
  voiceOn = runtime.voiceGuideEnabled;
  sfxOn = runtime.effectSoundEnabled;
  bgmOn = runtime.backgroundMusicEnabled;
  document.body.classList.toggle("mode-standard", runtime.mode === "standard");
  document.body.classList.toggle("mode-care", runtime.mode === "care");
  document.body.classList.toggle("mode-reminder", runtime.mode === "reminder");
  document.body.classList.toggle("mode-ai", runtime.mode === "ai_assisted");
  document.body.classList.toggle("no-drag", !runtime.useDrag);
  document.body.classList.toggle("requires-landscape", !!runtime.orientationLock && runtime.orientationLock.startsWith("landscape"));
  document.body.classList.toggle("force-landscape-css", !!runtime.cssLandscapeFallback);
  displayRequestEmitted = false;
  if (typeof updateDisplayState === "function") updateDisplayState();
  document.querySelectorAll(".diff").forEach(x => {
    const selected = !runtime.showDifficultySelect && x.dataset.diff === selectedDiff;
    x.classList.toggle("selected", selected);
    x.classList.remove("is-starting");
    x.removeAttribute("aria-disabled");
    x.setAttribute("aria-pressed", String(selected));
  });
  updateModeUi();
  if (typeof updateAudioControls === "function") updateAudioControls();
  else if (typeof updateVoiceBtn === "function") updateVoiceBtn();
}

function updateModeUi() {
  const start = document.getElementById("start");
  const hideHowToPlayButton = runtime.mode === "care" || runtime.mode === "ai_assisted" || !runtime.showHowToPlay;
  const hideReplayButton = !runtime.allowReplay || runtime.mode === "care" || runtime.mode === "ai_assisted";
  start?.classList.toggle("hide-difficulty", !runtime.showDifficultySelect);
  start?.classList.toggle("hide-settings", !runtime.showSettings);
  start?.classList.toggle("hide-how", hideHowToPlayButton);
  document.body.classList.toggle("hide-start-settings", !runtime.showSettings);
  const play = document.getElementById("play");
  play?.classList.toggle("hide-progress", !runtime.showProgress);
  play?.classList.toggle("hide-help", !runtime.showHelp);
  play?.classList.toggle("show-timer", false);
  if (typeof updateSessionTimerGauge === "function") updateSessionTimerGauge();
  document.getElementById("playSettingsWrap")?.classList.toggle("hidden", !runtime.showSettings);
  document.getElementById("playSettingsPanel")?.classList.remove("open");
  document.getElementById("playSettingsBtn")?.setAttribute("aria-expanded", "false");
  document.getElementById("againBtn")?.classList.toggle("hidden", hideReplayButton);
  const doneBtn = document.getElementById("doneBtn");
  if (doneBtn) {
    doneBtn.textContent = "효담콜로 돌아가기";
  }
  const howAgainBtn = document.getElementById("howAgainBtn");
  if (howAgainBtn) howAgainBtn.classList.toggle("hidden", hideHowToPlayButton);
  const startReturnBtn = document.getElementById("startReturnBtn");
  if (startReturnBtn) startReturnBtn.classList.toggle("hidden", !shouldUseStandardStartScreen());
}

function maybeAutoStart() {
  if (autoStarted || !runtime.autoStart) return;
  if (!assetsReady) return;
  if (state) return;
  autoStarted = true;
  beginIntroFlow(runtime.difficulty || selectedDiff);
}

function readUrlConfig() {
  const q = new URLSearchParams(location.search);
  const mode = q.get("mode");
  if (!mode) return {};
  const root = { mode };
  const config = {};
  const readNumber = (key) => {
    if (q.has(key)) config[key] = Number(q.get(key));
  };
  const readBool = (key) => {
    if (q.has(key)) config[key] = q.get(key) === "true";
  };
  ["question_count", "animal_count", "choice_count", "trash_count", "auto_return_ms", "time_limit_ms", "time_limit_seconds"].forEach(readNumber);
  ["return_url", "hub_url", "auto_return_url", "home_url", "exit_url"].forEach(key => {
    if (q.has(key)) config[key] = q.get(key);
  });
  [
    "session_id",
    "content_id",
    "game_key",
    "game_version",
    "play_source",
    "senior_id",
    "user_id",
    "anonymous_user_id",
    "guardian_id",
    "assignment_id",
    "alarm_id",
    "schedule_id",
    "tenant_id",
    "facility_id",
    "program_id",
    "reward_id",
    "recommendation_id",
    "client_context",
    "voice_context",
    "meta",
  ].forEach(key => {
    if (q.has(key)) root[key] = q.get(key);
  });
  [
    "show_timer",
    "show_score",
    "show_difficulty_select",
    "show_settings",
    "show_help",
    "show_how_to_play",
    "show_finish_check",
    "show_progress",
    "use_drag",
    "auto_start",
    "soft_feedback",
    "voice_guide_enabled",
    "effect_sound_enabled",
    "background_music_enabled",
  ].forEach(readBool);
  return {
    ...root,
    difficulty: q.get("difficulty") || undefined,
    target_animals: q.get("target_animals") || undefined,
    config,
  };
}
applyRuntimeConfig(readUrlConfig());

function receiveNativeMessage(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (data && data.type === "CONFIG" && data.payload) {
      const p = data.payload;
      if (typeof p.fontScale === "number" && p.fontScale >= 1.2) document.body.classList.add("large");
      if (p.reducedMotion) document.body.classList.add("reduced");
      if (p.userAlias) cfg.userAlias = p.userAlias;
      applyRuntimeConfig({
        ...p,
        voiceGuideEnabled: typeof p.voice === "boolean" ? p.voice : p.voiceGuideEnabled,
        effectSoundEnabled: typeof p.effectSound === "boolean" ? p.effectSound : p.effectSoundEnabled,
        backgroundMusicEnabled: typeof p.backgroundMusic === "boolean" ? p.backgroundMusic : p.backgroundMusicEnabled,
      });
      RN({ type:"CONFIG_APPLIED", payload:{ config_snapshot: runtime.configSnapshot } });
      emitDisplayRequest("config");
      maybeAutoStart();
    }
    if (data && data.type === "EXTERNAL_ANSWER" && data.payload) {
      handleExternalAnswer(data.payload);
    }
    if (data && data.type === "PAUSE") {
      pauseSession("app_command");
    }
    if (data && data.type === "RESUME") {
      resumeSession("app_command");
    }
    if (data && (data.type === "MUTE" || data.type === "SET_AUDIO")) {
      applyAudioCommand(data.type === "MUTE" ? { muted:true, ...(data.payload || {}) } : (data.payload || {}));
    }
    if (data && data.type === "UNMUTE") {
      applyAudioCommand({ muted:false, ...(data.payload || {}) });
    }
    if (data && data.type === "QUIT") {
      finishSession(false, data.payload?.reason || "app_quit");
    }
    if (data && (data.type === "ENTER_DISPLAY" || data.type === "ENTER_FULLSCREEN" || data.type === "LOCK_ORIENTATION")) {
      enterGameDisplay("app_command");
    }
  } catch(_) {}
}

window.AnimalFeedingGame = {
  configure(payload) {
    receiveNativeMessage({ type:"CONFIG", payload });
  },
  postMessage(message) {
    receiveNativeMessage(message);
  },
};
