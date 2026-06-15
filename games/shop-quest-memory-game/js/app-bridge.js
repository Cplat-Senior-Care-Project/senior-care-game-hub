(function (global) {
  "use strict";

  const SCHEMA_VERSION = "shop-quest-v1";
  const DEFAULT_CONFIG_URL = "config/game.config.json";
  const RUNTIME_CONFIG_STORAGE_KEY = "shop-quest-memory-game:runtime-config:v1";

  const DEFAULT_CONFIG = Object.freeze({
    gameId: "shop-quest-memory-game",
    contentId: "cognitive_shopping_cart_001",
    gameKey: "shopping_cart_memory",
    sessionId: "",
    seniorId: "",
    guardianId: null,
    playSource: "",
    assignmentId: null,
    alarmId: null,
    scheduleId: null,
    userId: "",
    anonymousUserId: "mock-user",
    deviceId: "mock-device",
    platform: "react-native-webview",
    timezone: "Asia/Seoul",
    appVersion: "mock-app",
    gameVersion: "1.0.0",
    difficultyKey: null,
    durationSeconds: 120,
    totalQuestions: 10,
    answerChoiceCount: 4,
    memoryItemCount: null,
    maxItemsToRemember: 6,
    revealMs: 3000,
    soundEnabled: true,
    voiceGuideEnabled: true,
    collectCondition: true,
    debugMode: false,
    hintEnabled: true,
    autoHintEnabled: false,
    softFeedback: null,
    useDrag: true,
    autoAddToCart: true,
    resultLogLevel: "detailed",
    mode: "standard",
    previousResult: null,
    lastResult: null,
    clientContext: null,
    voiceContext: null,
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
      easy: { label: "쉬움", memoryItemCount: 1, answerChoiceCount: 2, revealMs: 3000 },
      normal: { label: "보통", memoryItemCount: 2, answerChoiceCount: 4, revealMs: 3000 },
      hard: { label: "어려움", memoryItemCount: 3, answerChoiceCount: 6, revealMs: 3000 }
    }
  });

  function createSessionId() {
    if (global.crypto && typeof global.crypto.randomUUID === "function") {
      return global.crypto.randomUUID();
    }
    return `shop-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    return isPlainObject(source) && Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== "";
  }

  function readString(source, key, fallback) {
    return hasConfigValue(source, key) && typeof source[key] === "string" ? source[key] : fallback;
  }

  function readBoolean(source, key, fallback) {
    return hasConfigValue(source, key) && typeof source[key] === "boolean" ? source[key] : fallback;
  }

  function readNullableString(source, key, fallback = null) {
    return hasConfigValue(source, key) && typeof source[key] === "string" ? source[key] : fallback;
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
    if (!config || typeof config !== "object") {
      throw createConfigError("CONFIG_MISSING", "Runtime config is missing.");
    }
    return true;
  }

  function normalizeExternalConfig(config) {
    const normalizer = global.ShopQuestMemoryGameConfigNormalizer;
    if (!normalizer || typeof normalizer.normalizeExternalConfig !== "function") {
      throw createConfigError("CONFIG_INVALID", "Config normalizer is missing.");
    }
    return normalizer.normalizeExternalConfig(config);
  }

  function getDefaultSoftFeedback(mode) {
    return mode !== "standard";
  }

  function getDefaultPlaySource(mode) {
    if (mode === "standard") return "manual";
    if (mode === "care") return "care_session";
    if (mode === "ai_assisted") return "ai_recommendation";
    return "reminder";
  }

  function normalizePlaySource(value, mode) {
    const playSource = typeof value === "string" ? value.trim().toLowerCase() : "";
    return ["reminder", "manual", "history_replay", "ai_recommendation", "care_session"].includes(playSource)
      ? playSource
      : getDefaultPlaySource(mode);
  }

  function normalizeGameMode(value) {
    const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
    return ["standard", "reminder", "care", "ai_assisted"].includes(mode) ? mode : DEFAULT_CONFIG.mode;
  }

  function normalizeRuntimeConfig(config, configSource) {
    validateRuntimeConfig(config);
    const externalConfig = normalizeExternalConfig(config);
    const merged = deepMerge(DEFAULT_CONFIG, externalConfig);
    const mode = normalizeGameMode(merged.mode);
    const hasExplicitSoftFeedback = externalConfig.softFeedbackConfigured === true;
    const softFeedback = hasExplicitSoftFeedback
      ? readBoolean(merged, "softFeedback", getDefaultSoftFeedback(mode))
      : getDefaultSoftFeedback(mode);
    const normalized = {
      ...merged,
      gameId: readString(merged, "gameId", DEFAULT_CONFIG.gameId),
      contentId: readString(merged, "contentId", DEFAULT_CONFIG.contentId),
      gameKey: readString(merged, "gameKey", DEFAULT_CONFIG.gameKey),
      sessionId: readString(merged, "sessionId", "") || createSessionId(),
      seniorId: readString(merged, "seniorId", readString(merged, "userId", "")),
      guardianId: readNullableString(merged, "guardianId", null),
      playSource: normalizePlaySource(readString(merged, "playSource", ""), mode),
      assignmentId: readNullableString(merged, "assignmentId", null),
      alarmId: readNullableString(merged, "alarmId", null),
      scheduleId: readNullableString(merged, "scheduleId", null),
      userId: readString(merged, "userId", ""),
      anonymousUserId: readString(merged, "anonymousUserId", readString(merged, "userId", "")),
      deviceId: readString(merged, "deviceId", ""),
      platform: readString(merged, "platform", DEFAULT_CONFIG.platform),
      timezone: readString(merged, "timezone", DEFAULT_CONFIG.timezone),
      appVersion: readString(merged, "appVersion", ""),
      gameVersion: readString(merged, "gameVersion", DEFAULT_CONFIG.gameVersion),
      difficultyKey: readString(merged, "difficultyKey", "") || null,
      durationSeconds: readPositiveInteger(merged, "durationSeconds", DEFAULT_CONFIG.durationSeconds),
      totalQuestions: readPositiveInteger(merged, "totalQuestions", DEFAULT_CONFIG.totalQuestions),
      answerChoiceCount: readPositiveInteger(merged, "answerChoiceCount", DEFAULT_CONFIG.answerChoiceCount),
      memoryItemCount: hasConfigValue(merged, "memoryItemCount") ? readPositiveInteger(merged, "memoryItemCount", DEFAULT_CONFIG.memoryItemCount) : DEFAULT_CONFIG.memoryItemCount,
      maxItemsToRemember: readPositiveInteger(merged, "maxItemsToRemember", DEFAULT_CONFIG.maxItemsToRemember),
      revealMs: readPositiveInteger(merged, "revealMs", DEFAULT_CONFIG.revealMs),
      soundEnabled: readBoolean(merged, "soundEnabled", DEFAULT_CONFIG.soundEnabled),
      voiceGuideEnabled: readBoolean(merged, "voiceGuideEnabled", DEFAULT_CONFIG.voiceGuideEnabled),
      collectCondition: readBoolean(merged, "collectCondition", DEFAULT_CONFIG.collectCondition),
      debugMode: readBoolean(merged, "debugMode", DEFAULT_CONFIG.debugMode),
      hintEnabled: readBoolean(merged, "hintEnabled", DEFAULT_CONFIG.hintEnabled),
      autoHintEnabled: readBoolean(merged, "autoHintEnabled", DEFAULT_CONFIG.autoHintEnabled),
      useDrag: readBoolean(merged, "useDrag", DEFAULT_CONFIG.useDrag),
      autoAddToCart: readBoolean(merged, "autoAddToCart", DEFAULT_CONFIG.autoAddToCart),
      softFeedback,
      resultLogLevel: readString(merged, "resultLogLevel", DEFAULT_CONFIG.resultLogLevel),
      mode,
      ui: isPlainObject(merged.ui) ? deepMerge(DEFAULT_CONFIG.ui, merged.ui) : DEFAULT_CONFIG.ui,
      externalInput: isPlainObject(merged.externalInput) ? merged.externalInput : { enabled: false, source: "none" },
      clientContext: isPlainObject(merged.clientContext) ? merged.clientContext : null,
      voiceContext: isPlainObject(merged.voiceContext) ? merged.voiceContext : null,
      configSource: typeof configSource === "string" && configSource ? configSource : "unknown",
      schemaVersion: SCHEMA_VERSION,
      receivedAt: new Date().toISOString()
    };
    return normalized;
  }

  function getActiveConfigUrl() {
    return typeof global.__GAME_CONFIG_URL__ === "string" && global.__GAME_CONFIG_URL__ ? global.__GAME_CONFIG_URL__ : DEFAULT_CONFIG_URL;
  }

  function hasExplicitConfigUrl() {
    return Boolean(global.location && global.location.search && new URLSearchParams(global.location.search).has("configUrl"));
  }

  async function loadConfigFile() {
    if (typeof global.fetch !== "function") {
      return null;
    }
    try {
      const configUrl = getActiveConfigUrl();
      const response = await global.fetch(configUrl, { cache: "no-store" });
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (error) {
      if (global.console) {
        global.console.warn("[shop quest bridge] failed to load config file", error);
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
    return null;
  }

  function storeRuntimeConfig(config) {
    try {
      global.sessionStorage && global.sessionStorage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {}
  }

  function getStoredRuntimeConfig() {
    try {
      const rawConfig = global.sessionStorage && global.sessionStorage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
      if (!rawConfig) return null;
      const config = JSON.parse(rawConfig);
      const requestedMode = global.location && global.location.search ? new URLSearchParams(global.location.search).get("mode") : "";
      if (requestedMode && config.mode && String(config.mode).toLowerCase() !== String(requestedMode).toLowerCase()) {
        return null;
      }
      return isPlainObject(config) ? config : null;
    } catch (error) {
      return null;
    }
  }

  function getQueryValue(name) {
    if (!global.location || !global.location.search) {
      return "";
    }
    return String(new URLSearchParams(global.location.search).get(name) || "").trim().toLowerCase();
  }

  function getLocalDifficultyConfig(difficulty, mode) {
    const key = ["easy", "normal", "hard"].includes(difficulty) ? difficulty : "easy";
    const reminder = {
      easy: { maxChoiceCount: 6, maxItemsToRemember: 3 },
      normal: { maxChoiceCount: 8, maxItemsToRemember: 4 },
      hard: { maxChoiceCount: 10, maxItemsToRemember: 6 }
    };
    const guided = {
      easy: { maxChoiceCount: 2, maxItemsToRemember: 1 },
      normal: { maxChoiceCount: 4, maxItemsToRemember: 2 },
      hard: { maxChoiceCount: 6, maxItemsToRemember: 4 }
    };
    return (mode === "reminder" ? reminder : guided)[key];
  }

  function createLocalFallbackConfig() {
    const modeValues = { standard: true, reminder: true, care: true, ai_assisted: true };
    const mode = modeValues[getQueryValue("mode")] ? getQueryValue("mode") : "standard";
    const difficulty = getQueryValue("difficulty") || (mode === "standard" ? null : "easy");

    if (mode === "standard") {
      return {
        mode,
        difficulty,
        config: {
          show_timer: true,
          show_progress: true,
          show_score: true,
          show_difficulty_select: true,
          show_settings: true,
          show_how_to_play: true,
          show_condition_check: true,
          show_finish_check: true,
          duration_seconds: 120,
          question_count: 10,
          max_choice_count: 4,
          max_items_to_remember: 3,
          hint_enabled: true,
          auto_hint_enabled: false,
          soft_feedback: false,
          use_drag: true,
          voice_guide_enabled: true,
          result_log_level: "detailed"
        }
      };
    }

    const difficultyConfig = getLocalDifficultyConfig(difficulty, mode);
    const guidedMode = mode === "care" || mode === "ai_assisted";
    return {
      mode,
      difficulty,
      difficultyKey: difficulty,
      config: {
        show_timer: !guidedMode,
        show_progress: !guidedMode,
        show_score: mode === "reminder",
        show_difficulty_select: false,
        show_settings: true,
        show_how_to_play: mode === "reminder",
        show_condition_check: false,
        show_finish_check: false,
        duration_seconds: guidedMode ? 60 : 120,
        question_count: guidedMode ? 5 : 10,
        max_choice_count: difficultyConfig.maxChoiceCount,
        max_items_to_remember: difficultyConfig.maxItemsToRemember,
        hint_enabled: true,
        auto_hint_enabled: guidedMode,
        soft_feedback: guidedMode,
        use_drag: false,
        voice_guide_enabled: true,
        result_log_level: "detailed"
      }
    };
  }

  async function getRuntimeConfig() {
    const inlineConfig = getInlineConfig();
    if (inlineConfig) {
      return normalizeRuntimeConfig(inlineConfig, "inline");
    }
    if (hasExplicitConfigUrl()) {
      const fileConfig = await loadConfigFile();
      if (fileConfig) {
        storeRuntimeConfig(fileConfig);
        return normalizeRuntimeConfig(fileConfig, "hub-url");
      }
    }
    const fileConfig = await loadConfigFile();
    if (fileConfig) {
      storeRuntimeConfig(fileConfig);
      return normalizeRuntimeConfig(fileConfig, "game-file-fallback");
    }
    const storedConfig = getStoredRuntimeConfig();
    if (storedConfig) {
      return normalizeRuntimeConfig(storedConfig, "hub-storage");
    }
    return normalizeRuntimeConfig(createLocalFallbackConfig(), "local-fallback");
  }

  function postToNative(type, payload) {
    const message = JSON.stringify({ type, payload });
    if (global.ReactNativeWebView && typeof global.ReactNativeWebView.postMessage === "function") {
      global.ReactNativeWebView.postMessage(message);
    }
    if (global.parent && global.parent !== global && typeof global.parent.postMessage === "function") {
      global.parent.postMessage({ type, payload }, "*");
    }
    if (global.console) {
      global.console.log(`[shop quest bridge] ${type}`, payload);
    }
  }

  function sendGameReady(payload) { postToNative("GAME_READY", payload); }
  function sendGameStarted(payload) { postToNative("GAME_STARTED", payload); }
  function sendGameCompleteResult(result) { postToNative("GAME_COMPLETED", result); }
  function sendGameExit(payload) { postToNative("GAME_EXIT_REQUESTED", payload); }
  function sendGameErrorResult(error) { postToNative("GAME_ERROR", error); }

  global.ShopQuestMemoryGameAppBridge = {
    schemaVersion: SCHEMA_VERSION,
    getRuntimeConfig,
    normalizeRuntimeConfig,
    validateRuntimeConfig,
    sendGameReady,
    sendGameStarted,
    sendGameCompleteResult,
    sendGameExit,
    sendGameErrorResult,
    getRunConfig: getRuntimeConfig,
    sendReady: sendGameReady,
    sendStarted: sendGameStarted,
    sendComplete: sendGameCompleteResult,
    sendExit: sendGameExit,
    exitGame: sendGameExit,
    closeGame: sendGameExit,
    sendError: sendGameErrorResult
  };
})(window);
