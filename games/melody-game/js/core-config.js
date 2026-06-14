(function () {
  "use strict";

  const DEFAULT_GAME_KEY = "kungjak_melody_drum";

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
      showDifficultySelect: true,
      showSettings: true,
      showHelp: true,
      showProgress: true,
      showScore: true,
      allowReplay: true,
      showFinishCheck: true,
      autoReturnMs: 0,
      softFeedback: false,
      previewEnabled: null,
      xPatternEnabled: null,
      sessionTime: null,
      targetNoteCount: null
    },
    reminder: {
      difficulty: "normal",
      autoStart: true,
      showDifficultySelect: false,
      showSettings: false,
      showHelp: false,
      showProgress: true,
      showScore: false,
      allowReplay: false,
      showFinishCheck: false,
      autoReturnMs: 2500,
      softFeedback: true,
      previewEnabled: true,
      xPatternEnabled: false,
      sessionTime: 45,
      targetNoteCount: 10
    },
    care: {
      difficulty: "easy",
      autoStart: true,
      showDifficultySelect: false,
      showSettings: false,
      showHelp: false,
      showProgress: false,
      showScore: false,
      allowReplay: false,
      showFinishCheck: false,
      autoReturnMs: 0,
      softFeedback: true,
      previewEnabled: true,
      xPatternEnabled: false,
      sessionTime: 40,
      targetNoteCount: 8
    },
    ai_assisted: {
      difficulty: "easy",
      autoStart: true,
      showDifficultySelect: false,
      showSettings: false,
      showHelp: false,
      showProgress: false,
      showScore: false,
      allowReplay: false,
      showFinishCheck: false,
      autoReturnMs: 0,
      softFeedback: true,
      previewEnabled: true,
      xPatternEnabled: false,
      sessionTime: 35,
      targetNoteCount: 8
    }
  };

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
    const raw = String(mode || "standard").trim();
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

  function normalizeRuntimeConfig(input) {
    const p = input || {};
    const nested = p.config || {};
    const mode = normalizeMode(readValue(p, nested, "mode", "mode", "standard"));
    const defaults = MODE_DEFAULTS[mode] || MODE_DEFAULTS.standard;
    const difficulty = readValue(p, nested, "difficulty", "difficulty", defaults.difficulty);

    return {
      sessionId: readValue(p, nested, "sessionId", "session_id", null),
      contentId: readValue(p, nested, "contentId", "content_id", DEFAULT_GAME_KEY),
      gameKey: readValue(p, nested, "gameKey", "game_key", DEFAULT_GAME_KEY),
      mode,
      difficulty,
      autoStart: toBoolean(readValue(p, nested, "autoStart", "auto_start", defaults.autoStart), defaults.autoStart),
      showDifficultySelect: toBoolean(readValue(p, nested, "showDifficultySelect", "show_difficulty_select", defaults.showDifficultySelect), defaults.showDifficultySelect),
      showSettings: toBoolean(readValue(p, nested, "showSettings", "show_settings", defaults.showSettings), defaults.showSettings),
      showHelp: toBoolean(readValue(p, nested, "showHelp", "show_help", defaults.showHelp), defaults.showHelp),
      showProgress: toBoolean(readValue(p, nested, "showProgress", "show_progress", defaults.showProgress), defaults.showProgress),
      showScore: toBoolean(readValue(p, nested, "showScore", "show_score", defaults.showScore), defaults.showScore),
      allowReplay: toBoolean(readValue(p, nested, "allowReplay", "allow_replay", defaults.allowReplay), defaults.allowReplay),
      showFinishCheck: toBoolean(readValue(p, nested, "showFinishCheck", "show_finish_check", defaults.showFinishCheck), defaults.showFinishCheck),
      autoReturnMs: toNumber(readValue(p, nested, "autoReturnMs", "auto_return_ms", defaults.autoReturnMs), defaults.autoReturnMs),
      softFeedback: toBoolean(readValue(p, nested, "softFeedback", "soft_feedback", defaults.softFeedback), defaults.softFeedback),
      previewEnabled: readValue(p, nested, "previewEnabled", "preview_enabled", defaults.previewEnabled),
      xPatternEnabled: readValue(p, nested, "xPatternEnabled", "x_pattern_enabled", defaults.xPatternEnabled),
      sessionTime: toNumber(readValue(p, nested, "sessionTime", "session_time", defaults.sessionTime), defaults.sessionTime),
      targetNoteCount: toNumber(readValue(p, nested, "targetNoteCount", "target_note_count", defaults.targetNoteCount), defaults.targetNoteCount),
      padCount: toNumber(readValue(p, nested, "padCount", "pad_count", null), null),
      symbolCount: toNumber(readValue(p, nested, "symbolCount", "symbol_count", null), null),
      resultEndpoint: readValue(p, nested, "resultEndpoint", "result_endpoint", ""),
      resultLogLevel: readValue(p, nested, "resultLogLevel", "result_log_level", "detailed"),
      requestFullscreen: toBoolean(readValue(p, nested, "requestFullscreen", "request_fullscreen", true), true),
      orientationLock: readValue(p, nested, "orientationLock", "orientation_lock", "landscape"),
      cssLandscapeFallback: toBoolean(readValue(p, nested, "cssLandscapeFallback", "css_landscape_fallback", true), true),
      nativeDisplayRequest: toBoolean(readValue(p, nested, "nativeDisplayRequest", "native_display_request", true), true),
      inputModesEnabled: mode === "standard" ? ["touch", "external"] : ["touch", "external"],
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
    applyBodyClasses();
    window.dispatchEvent(new CustomEvent("melody-runtime:changed", { detail: runtimeSnapshot() }));
    return runtime;
  }

  function resolveDifficultyConfig(runtimeConfig) {
    const r = runtimeConfig || runtime || normalizeRuntimeConfig({});
    const base = { ...(window.GAME_CONFIG && (window.GAME_CONFIG[r.difficulty] || window.GAME_CONFIG.normal)) };

    if (r.sessionTime !== null) base.sessionTime = r.sessionTime;
    if (r.targetNoteCount !== null) base.targetNoteCount = r.targetNoteCount;
    if (r.padCount !== null) base.padCount = r.padCount;
    if (r.symbolCount !== null) base.symbolCount = r.symbolCount;
    if (r.previewEnabled !== null) base.previewEnabled = toBoolean(r.previewEnabled, base.previewEnabled);
    if (r.xPatternEnabled !== null) base.xPatternEnabled = toBoolean(r.xPatternEnabled, base.xPatternEnabled);

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

    if (!data || data.type !== "CONFIG") return;
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
  applyRuntimeConfig(readQueryConfig());
})();
