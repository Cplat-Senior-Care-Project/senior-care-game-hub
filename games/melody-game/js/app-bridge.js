(function (global) {
  "use strict";

  const SCHEMA_VERSION = "melody-game-bridge-v1";
  const RUNTIME_CONFIG_STORAGE_KEY = "melody-game:runtime-config:v1";
  const DEFAULT_CONTENT_ID = "cognitive_melody_game_001";
  const DEFAULT_GAME_KEY = "melody_game";
  const DEFAULT_GAME_VERSION = "1.0.0";

  const ROOT_FIELD_MAP = Object.freeze({
    session_id: "sessionId",
    content_id: "contentId",
    game_key: "gameKey",
    game_id: "gameId",
    game_version: "gameVersion",
    play_source: "playSource",
    assignment_id: "assignmentId",
    alarm_id: "alarmId",
    schedule_id: "scheduleId",
    senior_id: "seniorId",
    user_id: "userId",
    anonymous_user_id: "anonymousUserId",
    guardian_id: "guardianId",
    tenant_id: "tenantId",
    facility_id: "facilityId",
    program_id: "programId",
    reward_id: "rewardId",
    recommendation_id: "recommendationId",
    client_context: "clientContext",
    voice_context: "voiceContext",
    result_log_level: "resultLogLevel"
  });

  const CONFIG_FIELD_MAP = Object.freeze({
    auto_start: "autoStart",
    show_timer: "showTimer",
    show_difficulty_select: "showDifficultySelect",
    show_settings: "showSettings",
    show_help: "showHelp",
    show_how_to_play: "showHelp",
    show_progress: "showProgress",
    show_score: "showScore",
    allow_replay: "allowReplay",
    show_condition_check: "showConditionCheck",
    show_finish_check: "showFinishCheck",
    auto_return_ms: "autoReturnMs",
    soft_feedback: "softFeedback",
    voice_guide_enabled: "voiceGuideEnabled",
    hint_enabled: "hintEnabled",
    auto_hint_enabled: "autoHintEnabled",
    hint_delay_ms: "hintDelayMs",
    preview_enabled: "previewEnabled",
    x_pattern_enabled: "xPatternEnabled",
    x_hold_seconds: "xHoldSeconds",
    session_time: "sessionTime",
    session_time_sec: "sessionTime",
    duration_seconds: "sessionTime",
    total_time_limit_sec: "sessionTime",
    pad_count: "padCount",
    symbol_count: "symbolCount",
    result_endpoint: "resultEndpoint",
    request_fullscreen: "requestFullscreen",
    orientation_lock: "orientationLock",
    css_landscape_fallback: "cssLandscapeFallback",
    native_display_request: "nativeDisplayRequest",
    external_input_enabled: "externalInputEnabled",
    input_modes_enabled: "inputModesEnabled"
  });

  const MODE_ALIASES = Object.freeze({
    alarm: "reminder",
    alert: "reminder",
    ai: "ai_assisted",
    ai_assist: "ai_assisted",
    ai_assistant: "ai_assisted",
    "ai-assisted": "ai_assisted"
  });

  const MODE_PLAY_SOURCE = Object.freeze({
    standard: "manual",
    reminder: "reminder",
    care: "care_session",
    ai_assisted: "ai_recommendation"
  });

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function hasConfigValue(source, key) {
    return isPlainObject(source)
      && Object.prototype.hasOwnProperty.call(source, key)
      && source[key] !== null
      && source[key] !== "";
  }

  function normalizeConfigObject(value) {
    if (!value) {
      return {};
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return isPlainObject(parsed) ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    return isPlainObject(value) ? value : {};
  }

  function copyMappedFields(source, target, fieldMap) {
    if (!isPlainObject(source)) {
      return;
    }

    Object.keys(fieldMap).forEach((externalKey) => {
      const targetKey = fieldMap[externalKey];
      if (hasConfigValue(source, externalKey) && !hasConfigValue(target, targetKey)) {
        target[targetKey] = source[externalKey];
      }
    });
  }

  function copyCamelFields(source, target, keys) {
    if (!isPlainObject(source)) {
      return;
    }

    keys.forEach((key) => {
      if (hasConfigValue(source, key) && !hasConfigValue(target, key)) {
        target[key] = source[key];
      }
    });
  }

  function normalizeMode(mode) {
    const raw = String(mode || "standard").trim().toLowerCase();
    return MODE_ALIASES[raw] || raw;
  }

  function normalizePlaySource(value, mode) {
    const playSource = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (["manual", "reminder", "care_session", "ai_recommendation", "history_replay"].includes(playSource)) {
      return playSource;
    }
    return MODE_PLAY_SOURCE[mode] || "manual";
  }

  function applyAliases(config, settings, normalized) {
    if (hasConfigValue(config, "difficulty_key") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = config.difficulty_key;
    }
    if (hasConfigValue(config, "difficultyKey") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = config.difficultyKey;
    }
    if (hasConfigValue(settings, "difficulty") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = settings.difficulty;
    }
    if (hasConfigValue(normalized, "showTutorial") && !hasConfigValue(normalized, "showHelp")) {
      normalized.showHelp = normalized.showTutorial;
    }
    if (hasConfigValue(normalized, "durationSeconds") && !hasConfigValue(normalized, "sessionTime")) {
      normalized.sessionTime = normalized.durationSeconds;
    }
    if (hasConfigValue(normalized, "totalTimeLimitSec") && !hasConfigValue(normalized, "sessionTime")) {
      normalized.sessionTime = normalized.totalTimeLimitSec;
    }
    if (hasConfigValue(config, "external_input") && isPlainObject(config.external_input) && hasConfigValue(config.external_input, "enabled")) {
      normalized.externalInputEnabled = config.external_input.enabled;
      normalized.external_input_enabled = config.external_input.enabled;
    }
    if (hasConfigValue(settings, "external_input") && isPlainObject(settings.external_input) && hasConfigValue(settings.external_input, "enabled")) {
      normalized.externalInputEnabled = settings.external_input.enabled;
      normalized.external_input_enabled = settings.external_input.enabled;
    }
  }

  function normalizeExternalConfig(config) {
    if (!isPlainObject(config)) {
      return {};
    }

    const settings = normalizeConfigObject(config.config);
    const uiSettings = normalizeConfigObject(config.ui);
    const normalized = Object.assign({}, config);

    copyMappedFields(config, normalized, ROOT_FIELD_MAP);
    copyMappedFields(settings, normalized, ROOT_FIELD_MAP);
    copyMappedFields(config, normalized, CONFIG_FIELD_MAP);
    copyMappedFields(settings, normalized, CONFIG_FIELD_MAP);
    copyMappedFields(uiSettings, normalized, CONFIG_FIELD_MAP);
    copyCamelFields(settings, normalized, Object.values(CONFIG_FIELD_MAP));
    copyCamelFields(uiSettings, normalized, Object.values(CONFIG_FIELD_MAP));
    applyAliases(config, settings, normalized);

    normalized.mode = normalizeMode(normalized.mode);
    normalized.contentId = normalized.contentId || DEFAULT_CONTENT_ID;
    normalized.gameKey = normalized.gameKey || DEFAULT_GAME_KEY;
    normalized.gameId = normalized.gameId || normalized.gameKey;
    normalized.gameVersion = normalized.gameVersion || DEFAULT_GAME_VERSION;
    normalized.playSource = normalizePlaySource(normalized.playSource, normalized.mode);
    normalized.config = Object.assign({}, settings);
    normalized.schemaVersion = normalized.schemaVersion || SCHEMA_VERSION;
    normalized.configSource = normalized.configSource || "app-bridge";
    normalized.receivedAt = normalized.receivedAt || new Date().toISOString();
    return normalized;
  }

  function getQueryValue(name) {
    if (!global.location || !global.location.search) {
      return "";
    }
    return String(new URLSearchParams(global.location.search).get(name) || "").trim();
  }

  function getInlineConfig() {
    const candidates = [
      global.HD_GAME_CONFIG,
      global.__GAME_CONFIG__,
      global.__MELODY_GAME_CONFIG__,
      global.MELODY_GAME_CONFIG
    ];

    return candidates.find((candidate) => isPlainObject(candidate)) || null;
  }

  function getStoredRuntimeConfig() {
    if (!global.sessionStorage || typeof global.sessionStorage.getItem !== "function") {
      return null;
    }

    try {
      const rawConfig = global.sessionStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
      if (!rawConfig) {
        return null;
      }

      const config = JSON.parse(rawConfig);
      if (!isPlainObject(config)) {
        return null;
      }

      const requestedMode = getQueryValue("mode");
      if (requestedMode && config.mode && normalizeMode(config.mode) !== normalizeMode(requestedMode)) {
        return null;
      }

      return config;
    } catch (error) {
      return null;
    }
  }

  function storeRuntimeConfig(config) {
    if (!global.sessionStorage || typeof global.sessionStorage.setItem !== "function" || !isPlainObject(config)) {
      return;
    }

    try {
      global.sessionStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {}
  }

  function createLocalFallbackConfig() {
    const requestedMode = normalizeMode(getQueryValue("mode"));
    const mode = ["standard", "reminder", "care", "ai_assisted"].includes(requestedMode) ? requestedMode : "standard";

    return {
      mode,
      difficulty: getQueryValue("difficulty") || (mode === "standard" ? "normal" : "easy"),
      content_id: getQueryValue("content_id") || DEFAULT_CONTENT_ID,
      game_key: getQueryValue("game_key") || DEFAULT_GAME_KEY,
      game_version: getQueryValue("game_version") || DEFAULT_GAME_VERSION,
      play_source: getQueryValue("play_source") || MODE_PLAY_SOURCE[mode] || "manual",
      configSource: "local-fallback"
    };
  }

  function getRuntimeConfig() {
    const inlineConfig = getInlineConfig();
    if (inlineConfig) {
      storeRuntimeConfig(inlineConfig);
      return normalizeExternalConfig(inlineConfig);
    }

    const storedConfig = getStoredRuntimeConfig();
    if (storedConfig) {
      return normalizeExternalConfig(storedConfig);
    }

    return normalizeExternalConfig(createLocalFallbackConfig());
  }

  function postRawMessage(message) {
    const serializedMessage = JSON.stringify(message);

    if (global.ReactNativeWebView && typeof global.ReactNativeWebView.postMessage === "function") {
      global.ReactNativeWebView.postMessage(serializedMessage);
    }
    if (global.parent && global.parent !== global && typeof global.parent.postMessage === "function") {
      global.parent.postMessage(message, "*");
    }
    if (global.opener && !global.opener.closed && typeof global.opener.postMessage === "function") {
      global.opener.postMessage(message, "*");
    }
    global.dispatchEvent(new CustomEvent("melody-drum:host-message", { detail: message }));
  }

  function postToNative(type, payload) {
    postRawMessage({ type, payload: payload || {} });
  }

  function sendMessage(type, payload) {
    postToNative(type, payload);
  }

  function sendGameReady(payload) {
    postToNative("GAME_READY", payload);
  }

  function sendGameStarted(payload) {
    postToNative("GAME_STARTED", payload);
  }

  function sendGameCompleteResult(result) {
    postToNative("SESSION_COMPLETE", result);
  }

  function sendGameAbandonedResult(result) {
    postToNative("SESSION_ABORT", result);
  }

  function sendGameErrorResult(result) {
    postToNative("GAME_ERROR", result);
  }

  function sendGameExit(payload) {
    postToNative("GAME_EXIT_REQUESTED", payload);
  }

  global.MelodyGameAppBridge = {
    schemaVersion: SCHEMA_VERSION,
    runtimeConfigStorageKey: RUNTIME_CONFIG_STORAGE_KEY,
    getRuntimeConfig,
    normalizeRuntimeConfig: normalizeExternalConfig,
    normalizeExternalConfig,
    storeRuntimeConfig,
    sendMessage,
    postToNative,
    sendGameReady,
    sendGameStarted,
    sendGameCompleteResult,
    sendGameAbandonedResult,
    sendGameErrorResult,
    sendGameExit,
    sendReady: sendGameReady,
    sendStarted: sendGameStarted,
    sendComplete: sendGameCompleteResult,
    sendAbort: sendGameAbandonedResult,
    sendError: sendGameErrorResult,
    sendExit: sendGameExit,
    exitGame: sendGameExit
  };
})(window);
