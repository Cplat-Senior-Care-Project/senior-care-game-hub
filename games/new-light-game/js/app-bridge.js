(function (global) {
  "use strict";

  const existingBridge = global.LightMemoryGameAppBridge;
  if (existingBridge && typeof existingBridge === "object" && existingBridge.__isLightMemoryMockBridge !== true) {
    if (global.console && typeof global.console.info === "function") {
      global.console.info("[light game bridge] using host app bridge");
    }
    return;
  }

  const SCHEMA_VERSION = "light-memory-bridge-v1";
  const RUNTIME_CONFIG_STORAGE_KEY = "new-light-game:runtime-config:v1";

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
    show_timer: "showTimer",
    show_score: "showScore",
    show_difficulty_select: "showDifficultySelect",
    show_settings: "showSettings",
    show_how_to_play: "showHowTo",
    show_progress: "showProgress",
    show_condition_check: "showConditionCheck",
    show_finish_check: "showFinishCheck",
    question_count: "questionCount",
    round_count: "roundCount",
    grid_rows: "gridRows",
    grid_cols: "gridCols",
    target_count: "targetCount",
    max_target_count: "maxTargetCount",
    exposure_time_ms: "exposureTimeMs",
    reveal_ms: "revealMs",
    duration_seconds: "durationSeconds",
    total_time_limit_sec: "totalTimeLimitSec",
    round_time_limit_sec: "roundTimeLimitSec",
    allow_replay: "allowReplay",
    show_replay: "showReplay",
    hint_enabled: "hintEnabled",
    auto_hint_enabled: "autoHintEnabled",
    auto_hint_delay_sec: "autoHintDelaySec",
    flash_effect_level: "flashEffectLevel",
    high_contrast: "highContrast",
    soft_feedback: "softFeedback",
    voice_guide_enabled: "voiceGuideEnabled",
    external_input_enabled: "externalInputEnabled",
    external_voice_text_input: "externalVoiceTextInput",
    result_log_level: "resultLogLevel"
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

  function copyMappedFields(source, target, fieldMap) {
    if (!isPlainObject(source)) {
      return;
    }

    Object.keys(fieldMap).forEach((externalKey) => {
      if (hasConfigValue(source, externalKey) && !hasConfigValue(target, fieldMap[externalKey])) {
        target[fieldMap[externalKey]] = source[externalKey];
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

    if (hasConfigValue(config, "difficulty_key") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = config.difficulty_key;
    }
    if (hasConfigValue(config, "difficultyKey") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = config.difficultyKey;
    }
    if (hasConfigValue(settings, "difficulty") && !hasConfigValue(normalized, "difficulty")) {
      normalized.difficulty = settings.difficulty;
    }
    if (hasConfigValue(normalized, "showTutorial") && !hasConfigValue(normalized, "showHowTo")) {
      normalized.showHowTo = normalized.showTutorial;
    }
    if (hasConfigValue(normalized, "durationSeconds") && !hasConfigValue(normalized, "total_time_limit_sec")) {
      normalized.total_time_limit_sec = normalized.durationSeconds;
    }
    if (hasConfigValue(normalized, "revealMs") && !hasConfigValue(normalized, "exposure_time_ms")) {
      normalized.exposure_time_ms = normalized.revealMs;
    }
    if (hasConfigValue(normalized, "questionCount") && !hasConfigValue(normalized, "question_count")) {
      normalized.question_count = normalized.questionCount;
    }
    if (hasConfigValue(normalized, "roundCount") && !hasConfigValue(normalized, "question_count")) {
      normalized.question_count = normalized.roundCount;
    }
    if (hasConfigValue(normalized, "totalQuestions") && !hasConfigValue(normalized, "question_count")) {
      normalized.question_count = normalized.totalQuestions;
    }
    if (hasConfigValue(normalized, "externalInput") && isPlainObject(normalized.externalInput) && hasConfigValue(normalized.externalInput, "enabled")) {
      normalized.externalInputEnabled = normalized.externalInput.enabled;
      normalized.external_input_enabled = normalized.externalInput.enabled;
    }
    if (hasConfigValue(config, "external_input") && isPlainObject(config.external_input) && hasConfigValue(config.external_input, "enabled")) {
      normalized.externalInputEnabled = config.external_input.enabled;
      normalized.external_input_enabled = config.external_input.enabled;
    }
    if (hasConfigValue(settings, "external_input") && isPlainObject(settings.external_input) && hasConfigValue(settings.external_input, "enabled")) {
      normalized.externalInputEnabled = settings.external_input.enabled;
      normalized.external_input_enabled = settings.external_input.enabled;
    }

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
      global.GAME_CONFIG,
      global.__LIGHT_MEMORY_GAME_CONFIG__,
      global.LIGHT_MEMORY_GAME_CONFIG
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
      if (requestedMode && config.mode && String(config.mode) !== requestedMode) {
        return null;
      }

      return config;
    } catch (error) {
      if (global.console && typeof global.console.warn === "function") {
        global.console.warn("[light game bridge] failed to read stored runtime config", error);
      }
      return null;
    }
  }

  function storeRuntimeConfig(config) {
    if (!global.sessionStorage || typeof global.sessionStorage.setItem !== "function" || !isPlainObject(config)) {
      return;
    }

    try {
      global.sessionStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      if (global.console && typeof global.console.warn === "function") {
        global.console.warn("[light game bridge] failed to store runtime config", error);
      }
    }
  }

  function createLocalFallbackConfig() {
    const requestedMode = getQueryValue("mode");
    const mode = ["standard", "reminder", "care", "ai_assisted"].includes(requestedMode) ? requestedMode : "standard";
    const difficulty = getQueryValue("difficulty") || "easy";
    const modePlaySource = {
      standard: "manual",
      reminder: "reminder",
      care: "care_session",
      ai_assisted: "ai_recommendation"
    };

    return {
      mode,
      difficulty,
      game_key: "light_memory",
      content_id: "cognitive_light_memory_001",
      game_version: "1.0.0",
      play_source: modePlaySource[mode] || "manual",
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
    let sent = false;
    const serializedMessage = JSON.stringify(message);

    if (global.ReactNativeWebView && typeof global.ReactNativeWebView.postMessage === "function") {
      global.ReactNativeWebView.postMessage(serializedMessage);
      sent = true;
    }
    if (global.parent && global.parent !== global && typeof global.parent.postMessage === "function") {
      global.parent.postMessage(message, "*");
      sent = true;
    }
    if (global.opener && !global.opener.closed && typeof global.opener.postMessage === "function") {
      global.opener.postMessage(message, "*");
      sent = true;
    }
    if (global.console && typeof global.console.log === "function") {
      global.console.log("[light game bridge] " + message.type, message.payload || null);
    }

    return sent;
  }

  function postToNative(type, payload) {
    return postRawMessage({ type, payload: payload || null });
  }

  function getSessionResultEventType(result) {
    if (result && result.status === "error") {
      return "GAME_ERROR";
    }
    return result && result.status === "abandoned" ? "SESSION_ABORT" : "SESSION_COMPLETE";
  }

  function sendMessage(type, payload) {
    return postToNative(type, payload);
  }

  function sendGameReady(payload) {
    return postToNative("GAME_READY", payload);
  }

  function sendGameStarted(payload) {
    return postToNative("GAME_STARTED", payload);
  }

  function sendGameCompleteResult(result) {
    return postToNative(getSessionResultEventType(result), result);
  }

  function sendGameAbandonedResult(result) {
    return postToNative("SESSION_ABORT", result);
  }

  function sendGameExit(payload) {
    return postToNative("GAME_EXIT_REQUESTED", payload);
  }

  function sendGameErrorResult(error) {
    return postToNative("GAME_ERROR", error);
  }

  function sendExternalAnswerResult(result, responseType) {
    return postToNative(responseType || "EXTERNAL_ANSWER_RESULT", result);
  }

  global.LightMemoryGameAppBridge = {
    __isLightMemoryMockBridge: true,
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
    sendGameExit,
    sendGameErrorResult,
    sendExternalAnswerResult,
    sendReady: sendGameReady,
    sendStarted: sendGameStarted,
    sendComplete: sendGameCompleteResult,
    sendAbort: sendGameAbandonedResult,
    sendExit: sendGameExit,
    exitGame: sendGameExit,
    sendError: sendGameErrorResult
  };
})(window);
