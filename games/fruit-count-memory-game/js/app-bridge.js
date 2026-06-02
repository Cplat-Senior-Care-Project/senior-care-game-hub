(function (global) {
  "use strict";

  const MOCK_SCHEMA_VERSION = "mock-v1";
  const DEFAULT_CONFIG_URL = "config/game.config.json";

  const DEFAULT_MOCK_CONFIG = Object.freeze({
    gameId: "fruit-count-memory-game",
    sessionId: "",
    userId: "",
    anonymousUserId: "mock-user",
    deviceId: "mock-device",
    appVersion: "mock-app",
    gameVersion: "mock-game",
    difficultyKey: null,
    difficultyIndex: null,
    durationSeconds: 120,
    totalQuestions: 10,
    answerChoiceCount: 4,
    maxItemsToRemember: null,
    revealMs: 3000,
    soundEnabled: true,
    voiceGuideEnabled: true,
    collectCondition: true,
    debugMode: false,
    hintEnabled: true,
    autoHintEnabled: true,
    softFeedback: null,
    resultLogLevel: "detailed",
    mode: "standard",
    previousResult: null,
    previousRecord: null,
    lastResult: null,
    ui: {
      showTimer: true,
      showProgress: true,
      showScore: true,
      showSettings: true,
      showTutorial: true,
      showDifficultySelect: true,
      showConditionCheck: true,
      showFinishCheck: true
    },
    difficulties: {
      easy: {
        revealMs: 3000,
        startRange: [2, 3],
        endRange: [3, 4],
        minTypes: 1,
        maxTypes: 1,
        shuffleCards: false
      },
      normal: {
        revealMs: 3000,
        startRange: [4, 5],
        endRange: [5, 6],
        minTypes: 2,
        maxTypes: 3,
        shuffleCards: false
      },
      hard: {
        revealMs: 3000,
        startRange: [5, 6],
        endRange: [6, 7],
        minTypes: 3,
        maxTypes: 4,
        shuffleCards: true
      }
    }
  });

  function createSessionId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }

    return `mock-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function deepMerge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
      return override;
    }

    return Object.keys(override).reduce((merged, key) => {
      const nextValue = override[key];
      const baseValue = merged[key];
      merged[key] = isPlainObject(baseValue) && isPlainObject(nextValue)
        ? deepMerge(baseValue, nextValue)
        : nextValue;
      return merged;
    }, { ...base });
  }

  function hasConfigValue(source, key) {
    return Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== "";
  }

  function readString(source, key, fallback) {
    return hasConfigValue(source, key) && typeof source[key] === "string" ? source[key] : fallback;
  }

  function readBoolean(source, key, fallback) {
    return hasConfigValue(source, key) && typeof source[key] === "boolean" ? source[key] : fallback;
  }

  function readPositiveInteger(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    const number = Number(source[key]);
    if (!Number.isFinite(number) || number <= 0) {
      throw createConfigError("CONFIG_INVALID", `Invalid ${key}.`, { [key]: source[key] });
    }

    return Math.round(number);
  }

  function createConfigError(code, message, detail) {
    const error = new Error(message || code);
    error.code = code;
    error.detail = detail || null;
    return error;
  }

  function validateRuntimeConfig(config) {
    // TODO: 앱 필수 필드 확정 후 validateRuntimeConfig 규칙 강화
    if (!config || typeof config !== "object") {
      throw createConfigError("CONFIG_MISSING", "Runtime config is missing.");
    }

    if (hasConfigValue(config, "difficulties") && !isPlainObject(config.difficulties) && !Array.isArray(config.difficulties)) {
      throw createConfigError("CONFIG_INVALID", "Invalid difficulties config.", { difficulties: config.difficulties });
    }

    return true;
  }

  function normalizeExternalConfig(config) {
    if (!isPlainObject(config)) {
      return config;
    }

    const settings = isPlainObject(config.config) ? config.config : {};
    const normalized = { ...config };
    delete normalized.config;

    if (hasConfigValue(config, "difficulty") && !hasConfigValue(normalized, "difficultyKey")) {
      normalized.difficultyKey = config.difficulty;
    }
    if (hasConfigValue(config, "external_input") && !hasConfigValue(normalized, "externalInput")) {
      normalized.externalInput = config.external_input;
    }
    if (hasConfigValue(settings, "question_count")) {
      normalized.totalQuestions = settings.question_count;
    }
    if (hasConfigValue(settings, "choice_count")) {
      normalized.answerChoiceCount = settings.choice_count;
    }
    if (hasConfigValue(settings, "max_items_to_remember")) {
      normalized.maxItemsToRemember = settings.max_items_to_remember;
    }
    if (hasConfigValue(settings, "duration_seconds")) {
      normalized.durationSeconds = settings.duration_seconds;
    }
    if (hasConfigValue(settings, "reveal_ms")) {
      normalized.revealMs = settings.reveal_ms;
    }
    if (hasConfigValue(settings, "voice_guide_enabled")) {
      normalized.voiceGuideEnabled = settings.voice_guide_enabled;
    }
    if (hasConfigValue(settings, "hint_enabled")) {
      normalized.hintEnabled = settings.hint_enabled;
    }
    if (hasConfigValue(settings, "auto_hint_enabled")) {
      normalized.autoHintEnabled = settings.auto_hint_enabled;
    }
    if (hasConfigValue(settings, "soft_feedback")) {
      normalized.softFeedback = settings.soft_feedback;
      normalized.softFeedbackConfigured = true;
    } else if (hasConfigValue(config, "soft_feedback")) {
      normalized.softFeedback = config.soft_feedback;
      normalized.softFeedbackConfigured = true;
    } else if (config.softFeedbackConfigured === true && hasConfigValue(config, "softFeedback")) {
      normalized.softFeedbackConfigured = true;
    } else {
      delete normalized.softFeedback;
      normalized.softFeedbackConfigured = false;
    }
    if (hasConfigValue(settings, "result_log_level")) {
      normalized.resultLogLevel = settings.result_log_level;
    }
    if (hasConfigValue(settings, "show_condition_check")) {
      normalized.collectCondition = settings.show_condition_check;
    }

    normalized.ui = {
      ...(isPlainObject(normalized.ui) ? normalized.ui : {}),
      ...(hasConfigValue(settings, "show_timer") ? { showTimer: settings.show_timer } : {}),
      ...(hasConfigValue(settings, "show_progress") ? { showProgress: settings.show_progress } : {}),
      ...(!hasConfigValue(settings, "show_progress") && hasConfigValue(settings, "show_score") ? { showProgress: settings.show_score } : {}),
      ...(hasConfigValue(settings, "show_score") ? { showScore: settings.show_score } : {}),
      ...(hasConfigValue(settings, "show_difficulty_select") ? { showDifficultySelect: settings.show_difficulty_select } : {}),
      ...(hasConfigValue(settings, "show_settings") ? { showSettings: settings.show_settings } : {}),
      ...(hasConfigValue(settings, "show_how_to_play") ? { showTutorial: settings.show_how_to_play } : {}),
      ...(hasConfigValue(settings, "show_condition_check") ? { showConditionCheck: settings.show_condition_check } : {}),
      ...(hasConfigValue(settings, "show_finish_check") ? { showFinishCheck: settings.show_finish_check } : {})
    };

    return normalized;
  }

  function normalizeRuntimeConfig(config) {
    validateRuntimeConfig(config);

    const externalConfig = normalizeExternalConfig(config);
    const merged = deepMerge(DEFAULT_MOCK_CONFIG, externalConfig);
    const mode = readString(merged, "mode", DEFAULT_MOCK_CONFIG.mode);
    const hasExplicitSoftFeedback = externalConfig.softFeedbackConfigured === true;
    const softFeedback = hasExplicitSoftFeedback
      ? readBoolean(merged, "softFeedback", getDefaultSoftFeedback(mode))
      : getDefaultSoftFeedback(mode);
    const normalized = {
      ...merged,
      gameId: readString(merged, "gameId", DEFAULT_MOCK_CONFIG.gameId),
      sessionId: readString(merged, "sessionId", "") || createSessionId(),
      userId: readString(merged, "userId", ""),
      anonymousUserId: readString(merged, "anonymousUserId", readString(merged, "userId", "")),
      deviceId: readString(merged, "deviceId", ""),
      appVersion: readString(merged, "appVersion", ""),
      gameVersion: readString(merged, "gameVersion", ""),
      durationSeconds: readPositiveInteger(merged, "durationSeconds", DEFAULT_MOCK_CONFIG.durationSeconds),
      totalQuestions: readPositiveInteger(merged, "totalQuestions", DEFAULT_MOCK_CONFIG.totalQuestions),
      answerChoiceCount: readPositiveInteger(merged, "answerChoiceCount", DEFAULT_MOCK_CONFIG.answerChoiceCount),
      maxItemsToRemember: hasConfigValue(merged, "maxItemsToRemember") ? readPositiveInteger(merged, "maxItemsToRemember", DEFAULT_MOCK_CONFIG.maxItemsToRemember) : DEFAULT_MOCK_CONFIG.maxItemsToRemember,
      revealMs: readPositiveInteger(merged, "revealMs", DEFAULT_MOCK_CONFIG.revealMs),
      soundEnabled: readBoolean(merged, "soundEnabled", DEFAULT_MOCK_CONFIG.soundEnabled),
      voiceGuideEnabled: readBoolean(merged, "voiceGuideEnabled", DEFAULT_MOCK_CONFIG.voiceGuideEnabled),
      collectCondition: readBoolean(merged, "collectCondition", DEFAULT_MOCK_CONFIG.collectCondition),
      debugMode: readBoolean(merged, "debugMode", DEFAULT_MOCK_CONFIG.debugMode),
      hintEnabled: readBoolean(merged, "hintEnabled", DEFAULT_MOCK_CONFIG.hintEnabled),
      autoHintEnabled: readBoolean(merged, "autoHintEnabled", DEFAULT_MOCK_CONFIG.autoHintEnabled),
      softFeedback,
      resultLogLevel: readString(merged, "resultLogLevel", DEFAULT_MOCK_CONFIG.resultLogLevel),
      mode,
      previousResult: isPlainObject(merged.previousResult) ? merged.previousResult : DEFAULT_MOCK_CONFIG.previousResult,
      previousRecord: isPlainObject(merged.previousRecord) ? merged.previousRecord : DEFAULT_MOCK_CONFIG.previousRecord,
      lastResult: isPlainObject(merged.lastResult) ? merged.lastResult : DEFAULT_MOCK_CONFIG.lastResult,
      ui: isPlainObject(merged.ui) ? merged.ui : DEFAULT_MOCK_CONFIG.ui,
      softFeedbackConfigured: hasExplicitSoftFeedback,
      schemaVersion: MOCK_SCHEMA_VERSION,
      receivedAt: new Date().toISOString()
    };

    if (normalized.revealMs && normalized.difficulties && !Array.isArray(normalized.difficulties)) {
      normalized.difficulties = Object.keys(normalized.difficulties).reduce((difficulties, key) => {
        difficulties[key] = {
          ...normalized.difficulties[key],
          revealMs: normalized.difficulties[key].revealMs || normalized.revealMs
        };
        return difficulties;
      }, {});
    }

    return normalized;
  }

  function getDefaultSoftFeedback(mode) {
    return mode !== "standard";
  }

  function createConfigLoadError(configUrl) {
    const error = new Error(`Runtime config file could not be loaded: ${configUrl}`);
    error.code = "CONFIG_LOAD_FAILED";
    error.detail = { configUrl };
    return error;
  }

  async function loadConfigFile() {
    if (typeof global.fetch !== "function") {
      return null;
    }

    try {
      const configUrl = typeof global.__GAME_CONFIG_URL__ === "string" && global.__GAME_CONFIG_URL__
        ? global.__GAME_CONFIG_URL__
        : DEFAULT_CONFIG_URL;
      const response = await global.fetch(configUrl, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      if (global.console) {
        global.console.warn("[mock app bridge] failed to load config file", error);
      }
      return null;
    }
  }

  function getInlineConfig() {
    if (global.__GAME_CONFIG__ && typeof global.__GAME_CONFIG__ === "object") {
      return global.__GAME_CONFIG__;
    }

    if (global.GAME_CONFIG && typeof global.GAME_CONFIG === "object") {
      return global.GAME_CONFIG;
    }

    if (global.__FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG__ && typeof global.__FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG__ === "object") {
      return global.__FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG__;
    }

    if (global.FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG && typeof global.FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG === "object") {
      return global.FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG;
    }

    return null;
  }

  async function getRuntimeConfig() {
    // TODO: 내부 개발팀에서 확정한 postMessage 메시지명으로 교체
    const inlineConfig = getInlineConfig();
    if (inlineConfig) {
      return normalizeRuntimeConfig(inlineConfig);
    }

    const fileConfig = await loadConfigFile();
    if (fileConfig) {
      return normalizeRuntimeConfig(fileConfig);
    }

    const configUrl = typeof global.__GAME_CONFIG_URL__ === "string" && global.__GAME_CONFIG_URL__
      ? global.__GAME_CONFIG_URL__
      : DEFAULT_CONFIG_URL;
    throw createConfigLoadError(configUrl);
  }

  function sendMockMessage(name, payload) {
    // TODO: 결과 JSON schemaVersion 확정 후 필드명 조정
    if (!global.console) {
      return;
    }

    global.console.log(`[mock app bridge] ${name}`, payload);
  }

  function sendGameReady(payload) {
    sendMockMessage("GAME_READY", payload);
  }

  function sendGameStarted(payload) {
    sendMockMessage("GAME_STARTED", payload);
  }

  function sendGameCompleteResult(result) {
    sendMockMessage("GAME_COMPLETED", result);
  }

  function sendGameExit(payload) {
    sendMockMessage("GAME_EXIT_REQUESTED", payload);
  }

  function sendGameErrorResult(error) {
    sendMockMessage("GAME_ERROR", error);
  }

  const bridge = {
    schemaVersion: MOCK_SCHEMA_VERSION,
    getRuntimeConfig,
    normalizeRuntimeConfig,
    validateRuntimeConfig,
    sendGameReady,
    sendGameStarted,
    sendGameCompleteResult,
    sendGameExit,
    sendGameErrorResult,

    // Backward-compatible aliases used by older game builds.
    getRunConfig: getRuntimeConfig,
    sendReady: sendGameReady,
    sendStarted: sendGameStarted,
    sendComplete: sendGameCompleteResult,
    sendExit: sendGameExit,
    exitGame: sendGameExit,
    closeGame: sendGameExit,
    sendError: sendGameErrorResult
  };

  global.FruitCountMemoryGameAppBridge = bridge;
})(window);
