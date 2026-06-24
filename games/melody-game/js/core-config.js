(function () {
  "use strict";

  const DEFAULT_CONTENT_ID = "cognitive_melody_game_001";
  const DEFAULT_GAME_KEY = "melody_game";
  const DEFAULT_GAME_VERSION = "1.0.0";

  const MODE_ALIASES = {
    alarm: "reminder",
    alert: "reminder",
    ai: "ai_assisted",
    ai_assist: "ai_assisted",
    ai_assistant: "ai_assisted",
    "ai-assisted": "ai_assisted"
  };

  const MODE_DEFAULTS = {
    standard: {
      difficulty: "normal",
      autoStart: false,
      showTimer: true,
      showDifficultySelect: true,
      showSettings: true,
      showHelp: true,
      showProgress: true,
      showScore: true,
      allowReplay: true,
      showConditionCheck: true,
      showFinishCheck: true,
      autoReturnMs: 0,
      softFeedback: false,
      previewEnabled: null,
      xPatternEnabled: null,
      sessionTime: 60,
      autoHintEnabled: true,
      hintEnabled: false,
      voiceGuideEnabled: true,
      hintDelayMs: 5000,
      xHoldSeconds: 2
    },
    reminder: {
      difficulty: "easy",
      autoStart: true,
      showTimer: true,
      showDifficultySelect: false,
      showSettings: false,
      showHelp: true,
      showProgress: true,
      showScore: false,
      allowReplay: true,
      showConditionCheck: false,
      showFinishCheck: false,
      autoReturnMs: 0,
      softFeedback: false,
      previewEnabled: null,
      xPatternEnabled: null,
      sessionTime: 60,
      autoHintEnabled: true,
      hintEnabled: false,
      voiceGuideEnabled: true,
      hintDelayMs: 5000,
      xHoldSeconds: 2
    },
    care: {
      difficulty: "easy",
      autoStart: false,
      showTimer: false,
      showDifficultySelect: false,
      showSettings: true,
      showHelp: false,
      showProgress: false,
      showScore: false,
      allowReplay: true,
      showConditionCheck: false,
      showFinishCheck: false,
      autoReturnMs: 0,
      softFeedback: true,
      previewEnabled: null,
      xPatternEnabled: null,
      sessionTime: 60,
      autoHintEnabled: true,
      hintEnabled: false,
      voiceGuideEnabled: true,
      hintDelayMs: 5000,
      xHoldSeconds: 2
    },
    ai_assisted: {
      difficulty: "easy",
      autoStart: false,
      showTimer: false,
      showDifficultySelect: false,
      showSettings: true,
      showHelp: false,
      showProgress: false,
      showScore: false,
      allowReplay: true,
      showConditionCheck: false,
      showFinishCheck: false,
      autoReturnMs: 0,
      softFeedback: true,
      previewEnabled: null,
      xPatternEnabled: null,
      sessionTime: 60,
      autoHintEnabled: true,
      hintEnabled: false,
      voiceGuideEnabled: true,
      hintDelayMs: 5000,
      xHoldSeconds: 2
    }
  };

  const CONFIG_MESSAGE_TYPES = ["CONFIG", "APP_CONFIG", "GAME_CONFIG", "RUNTIME_CONFIG"];

  let runtime = null;

  function toCamel(key) {
    return String(key).replace(/[_-]([a-z])/g, (_, char) => char.toUpperCase());
  }

  function parseValue(value) {
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
    return value;
  }

  function normalizeMode(mode) {
    const raw = String(mode || "standard").trim().toLowerCase();
    return MODE_ALIASES[raw] || raw;
  }

  function readValue(source, nested, camel, snake, fallback) {
    if (nested && nested[camel] !== undefined) return nested[camel];
    if (nested && nested[snake] !== undefined) return nested[snake];
    if (source && source[camel] !== undefined) return source[camel];
    if (source && source[snake] !== undefined) return source[snake];
    return fallback;
  }

  function toBoolean(value, fallback) {
    if (value === undefined || value === null || value === "") return Boolean(fallback);
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    const normalized = String(value).toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
    return Boolean(fallback);
  }

  function toNumber(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  }

  function readQueryConfig() {
    const config = {};
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      const parsed = parseValue(value);
      config[key] = parsed;
      config[toCamel(key)] = parsed;
    });
    return config;
  }

  function normalizeExternalConfig(input) {
    if (
      window.MelodyGameAppBridge
      && typeof window.MelodyGameAppBridge.normalizeExternalConfig === "function"
    ) {
      return window.MelodyGameAppBridge.normalizeExternalConfig(input || {});
    }

    return input || {};
  }

  function getDefaultPlaySource(mode) {
    if (mode === "reminder") return "reminder";
    if (mode === "care") return "care_session";
    if (mode === "ai_assisted") return "ai_recommendation";
    return "manual";
  }

  function readInitialConfig() {
    const bridgeConfig = window.MelodyGameAppBridge && typeof window.MelodyGameAppBridge.getRuntimeConfig === "function"
      ? window.MelodyGameAppBridge.getRuntimeConfig()
      : {};
    return { ...bridgeConfig, ...readQueryConfig() };
  }

  function normalizeRuntimeConfig(input) {
    const p = normalizeExternalConfig(input);
    const nested = p.config || {};
    const mode = normalizeMode(readValue(p, nested, "mode", "mode", "standard"));
    const defaults = MODE_DEFAULTS[mode] || MODE_DEFAULTS.standard;
    const difficulty = readValue(p, nested, "difficulty", "difficulty", defaults.difficulty);
    const sessionTimeValue = readValue(
      p,
      nested,
      "sessionTime",
      "session_time",
      readValue(p, nested, "durationSeconds", "duration_seconds", defaults.sessionTime)
    );

    return {
      sessionId: readValue(p, nested, "sessionId", "session_id", null),
      contentId: readValue(p, nested, "contentId", "content_id", DEFAULT_CONTENT_ID),
      gameKey: readValue(p, nested, "gameKey", "game_key", DEFAULT_GAME_KEY),
      gameId: readValue(p, nested, "gameId", "game_id", DEFAULT_GAME_KEY),
      gameVersion: readValue(p, nested, "gameVersion", "game_version", DEFAULT_GAME_VERSION),
      playSource: readValue(p, nested, "playSource", "play_source", getDefaultPlaySource(mode)),
      seniorId: readValue(p, nested, "seniorId", "senior_id", null),
      userId: readValue(p, nested, "userId", "user_id", null),
      anonymousUserId: readValue(p, nested, "anonymousUserId", "anonymous_user_id", null),
      guardianId: readValue(p, nested, "guardianId", "guardian_id", null),
      assignmentId: readValue(p, nested, "assignmentId", "assignment_id", null),
      alarmId: readValue(p, nested, "alarmId", "alarm_id", null),
      scheduleId: readValue(p, nested, "scheduleId", "schedule_id", null),
      tenantId: readValue(p, nested, "tenantId", "tenant_id", null),
      facilityId: readValue(p, nested, "facilityId", "facility_id", null),
      programId: readValue(p, nested, "programId", "program_id", null),
      rewardId: readValue(p, nested, "rewardId", "reward_id", null),
      recommendationId: readValue(p, nested, "recommendationId", "recommendation_id", null),
      clientContext: readValue(p, nested, "clientContext", "client_context", null),
      voiceContext: readValue(p, nested, "voiceContext", "voice_context", null),
      meta: readValue(p, nested, "meta", "meta", null),
      mode,
      difficulty,
      autoStart: toBoolean(readValue(p, nested, "autoStart", "auto_start", defaults.autoStart), defaults.autoStart),
      showTimer: mode === "reminder"
        ? true
        : toBoolean(readValue(p, nested, "showTimer", "show_timer", defaults.showTimer), defaults.showTimer),
      showDifficultySelect: toBoolean(readValue(p, nested, "showDifficultySelect", "show_difficulty_select", defaults.showDifficultySelect), defaults.showDifficultySelect),
      showSettings: toBoolean(readValue(p, nested, "showSettings", "show_settings", defaults.showSettings), defaults.showSettings),
      showHelp: toBoolean(readValue(p, nested, "showHelp", "show_help", defaults.showHelp), defaults.showHelp),
      showProgress: toBoolean(readValue(p, nested, "showProgress", "show_progress", defaults.showProgress), defaults.showProgress),
      showScore: toBoolean(readValue(p, nested, "showScore", "show_score", defaults.showScore), defaults.showScore),
      allowReplay: toBoolean(readValue(p, nested, "allowReplay", "allow_replay", defaults.allowReplay), defaults.allowReplay),
      showConditionCheck: toBoolean(readValue(p, nested, "showConditionCheck", "show_condition_check", defaults.showConditionCheck), defaults.showConditionCheck),
      showFinishCheck: mode === "standard"
        ? true
        : toBoolean(readValue(p, nested, "showFinishCheck", "show_finish_check", defaults.showFinishCheck), defaults.showFinishCheck),
      autoReturnMs: toNumber(readValue(p, nested, "autoReturnMs", "auto_return_ms", defaults.autoReturnMs), defaults.autoReturnMs),
      softFeedback: toBoolean(readValue(p, nested, "softFeedback", "soft_feedback", defaults.softFeedback), defaults.softFeedback),
      previewEnabled: readValue(p, nested, "previewEnabled", "preview_enabled", defaults.previewEnabled),
      xPatternEnabled: readValue(p, nested, "xPatternEnabled", "x_pattern_enabled", defaults.xPatternEnabled),
      sessionTime: toNumber(sessionTimeValue, defaults.sessionTime),
      autoHintEnabled: toBoolean(readValue(p, nested, "autoHintEnabled", "auto_hint_enabled", defaults.autoHintEnabled), defaults.autoHintEnabled),
      hintEnabled: toBoolean(readValue(p, nested, "hintEnabled", "hint_enabled", defaults.hintEnabled), defaults.hintEnabled),
      voiceGuideEnabled: toBoolean(readValue(p, nested, "voiceGuideEnabled", "voice_guide_enabled", defaults.voiceGuideEnabled), defaults.voiceGuideEnabled),
      hintDelayMs: toNumber(readValue(p, nested, "hintDelayMs", "hint_delay_ms", defaults.hintDelayMs), defaults.hintDelayMs),
      xHoldSeconds: toNumber(readValue(p, nested, "xHoldSeconds", "x_hold_seconds", defaults.xHoldSeconds), defaults.xHoldSeconds),
      padCount: toNumber(readValue(p, nested, "padCount", "pad_count", null), null),
      symbolCount: toNumber(readValue(p, nested, "symbolCount", "symbol_count", null), null),
      resultEndpoint: readValue(p, nested, "resultEndpoint", "result_endpoint", ""),
      resultLogLevel: readValue(p, nested, "resultLogLevel", "result_log_level", "detailed"),
      requestFullscreen: toBoolean(readValue(p, nested, "requestFullscreen", "request_fullscreen", true), true),
      orientationLock: readValue(p, nested, "orientationLock", "orientation_lock", "landscape"),
      cssLandscapeFallback: toBoolean(readValue(p, nested, "cssLandscapeFallback", "css_landscape_fallback", true), true),
      nativeDisplayRequest: toBoolean(readValue(p, nested, "nativeDisplayRequest", "native_display_request", true), true),
      externalInputEnabled: toBoolean(readValue(p, nested, "externalInputEnabled", "external_input_enabled", true), true),
      inputModesEnabled: readValue(p, nested, "inputModesEnabled", "input_modes_enabled", ["touch", "external"]),
      configSource: readValue(p, nested, "configSource", "config_source", p.configSource || null),
      schemaVersion: readValue(p, nested, "schemaVersion", "schema_version", p.schemaVersion || null),
      receivedAt: readValue(p, nested, "receivedAt", "received_at", p.receivedAt || null),
      configSnapshot: null
    };
  }

  function runtimeSnapshot() {
    const copy = { ...(runtime || {}) };
    delete copy.configSnapshot;
    return copy;
  }

  function applyBodyClasses() {
    if (!document.body || !runtime) return;
    document.body.classList.toggle("mode-standard", runtime.mode === "standard");
    document.body.classList.toggle("mode-reminder", runtime.mode === "reminder");
    document.body.classList.toggle("mode-care", runtime.mode === "care");
    document.body.classList.toggle("mode-ai", runtime.mode === "ai_assisted");
    document.body.classList.toggle("hide-difficulty-select", !runtime.showDifficultySelect);
    document.body.classList.toggle("hide-timer", !runtime.showTimer);
    document.body.classList.toggle("hide-settings", !runtime.showSettings);
    document.body.classList.toggle("hide-help", !runtime.showHelp);
    document.body.classList.toggle("hide-progress", !runtime.showProgress);
    document.body.classList.toggle("hide-score", !runtime.showScore);
    document.body.classList.toggle("hide-replay", !runtime.allowReplay);
    const wantsLandscape = !!runtime.orientationLock && String(runtime.orientationLock).startsWith("landscape");
    document.body.classList.toggle("requires-landscape", wantsLandscape);
    document.body.classList.toggle("force-landscape-css", wantsLandscape && !!runtime.cssLandscapeFallback);
  }

  function applyRuntimeConfig(next) {
    const incoming = next || {};
    const nextMode = incoming.mode ? normalizeMode(incoming.mode) : (runtime && runtime.mode);
    const base = runtime && nextMode === runtime.mode ? runtimeSnapshot() : {};
    runtime = normalizeRuntimeConfig({ ...base, ...incoming });
    runtime.configSnapshot = runtimeSnapshot();
    if (window.MelodyGameAppBridge && typeof window.MelodyGameAppBridge.storeRuntimeConfig === "function") {
      window.MelodyGameAppBridge.storeRuntimeConfig(runtime.configSnapshot);
    }
    applyBodyClasses();
    window.dispatchEvent(new CustomEvent("melody-runtime:changed", { detail: runtimeSnapshot() }));
    return runtime;
  }

  function resolveDifficultyConfig(runtimeConfig) {
    const r = runtimeConfig || runtime || normalizeRuntimeConfig({});
    const base = { ...(window.GAME_CONFIG && (window.GAME_CONFIG[r.difficulty] || window.GAME_CONFIG.normal)) };

    if (r.sessionTime !== null) base.sessionTime = r.sessionTime;
    if (r.padCount !== null) base.padCount = r.padCount;
    if (r.symbolCount !== null) base.symbolCount = r.symbolCount;
    if (r.previewEnabled !== null) base.previewEnabled = toBoolean(r.previewEnabled, base.previewEnabled);
    if (r.xPatternEnabled !== null) base.xPatternEnabled = toBoolean(r.xPatternEnabled, base.xPatternEnabled);
    base.autoHintEnabled = toBoolean(r.autoHintEnabled, true);
    base.hintEnabled = toBoolean(r.hintEnabled, false);
    base.voiceGuideEnabled = toBoolean(r.voiceGuideEnabled, true);
    base.hintDelayMs = toNumber(r.hintDelayMs, 5000);
    base.xHoldSeconds = toNumber(r.xHoldSeconds, 2);
    base.showTimer = toBoolean(r.showTimer, true);
    base.showScore = toBoolean(r.showScore, true);
    base.showDifficultySelect = toBoolean(r.showDifficultySelect, true);
    base.showSettings = toBoolean(r.showSettings, true);
    base.showHelp = toBoolean(r.showHelp, true);
    base.showConditionCheck = toBoolean(r.showConditionCheck, true);
    base.showFinishCheck = toBoolean(r.showFinishCheck, true);
    base.showProgress = toBoolean(r.showProgress, true);
    base.softFeedback = toBoolean(r.softFeedback, false);
    base.resultLogLevel = r.resultLogLevel || "detailed";
    base.inputModesEnabled = r.inputModesEnabled || ["touch", "external"];
    base.externalInputEnabled = toBoolean(r.externalInputEnabled, true);

    return base;
  }

  function handleHostMessage(event) {
    let data = event.data;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (error) {
        return;
      }
    }

    if (!data || !CONFIG_MESSAGE_TYPES.includes(data.type)) return;
    applyRuntimeConfig(data.payload || data.config || {});
  }

  window.MelodyRuntime = {
    MODE_DEFAULTS,
    normalizeMode,
    normalizeRuntimeConfig,
    readQueryConfig,
    applyRuntimeConfig,
    runtimeSnapshot,
    resolveDifficultyConfig,
    get runtime() {
      return runtime;
    }
  };

  window.addEventListener("message", handleHostMessage);
  applyRuntimeConfig(readInitialConfig());
})();
