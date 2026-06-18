(function (global) {
  "use strict";

  const DIFFICULTY_CONFIG = {
    easy: {
      label: "쉬움",
      gridRows: 2,
      gridCols: 2,
      targetCount: 2,
      totalLimitMs: 2 * 60 * 1000
    },
    normal: {
      label: "보통",
      gridRows: 3,
      gridCols: 3,
      targetCount: 3,
      totalLimitMs: 2 * 60 * 1000
    },
    hard: {
      label: "어려움",
      gridRows: 3,
      gridCols: 4,
      targetCount: 4,
      totalLimitMs: 2 * 60 * 1000
    },
    reminder_fixed: {
      label: "알림 활동",
      gridRows: 3,
      gridCols: 3,
      targetCount: 3,
      totalLimitMs: 2 * 60 * 1000
    },
    care_fixed: {
      label: "쉬운 활동",
      gridRows: 2,
      gridCols: 2,
      targetCount: 1,
      totalLimitMs: 2 * 60 * 1000
    }
  };

  const MODE_CONFIG = {
    standard: {
      label: "표준모드",
      totalQuestions: 10,
      exposureTimeMs: 4000,
      totalLimitMs: null,
      showConditionCheck: true,
      showFinishCheck: true,
      showDifficultySelect: true,
      showSettings: true,
      showHowTo: true,
      showProgress: true,
      showScore: true,
      showTimer: true,
      showReplay: true,
      replayLimit: 0,
      allowConditionSkip: true,
      allowFinishSkip: true,
      hintEnabled: true,
      autoHintEnabled: false,
      autoReturnMs: 0,
      autoHintAfterMs: 0,
      positionHintType: "highlight",
      flashEffectLevel: "normal",
      highContrast: true,
      softFeedback: true,
      voiceGuideEnabled: true,
      resultLogLevel: "detailed"
    },
    reminder: {
      label: "알림모드",
      totalQuestions: 10,
      exposureTimeMs: 4000,
      totalLimitMs: null,
      showConditionCheck: false,
      showFinishCheck: false,
      showDifficultySelect: false,
      showSettings: true,
      showHowTo: true,
      showProgress: true,
      showScore: true,
      showTimer: true,
      showReplay: true,
      replayLimit: 0,
      allowConditionSkip: true,
      allowFinishSkip: true,
      hintEnabled: true,
      autoHintEnabled: false,
      autoReturnMs: 0,
      autoHintAfterMs: 0,
      positionHintType: "highlight",
      flashEffectLevel: "normal",
      highContrast: true,
      softFeedback: true,
      voiceGuideEnabled: true,
      resultLogLevel: "detailed"
    },
    care: {
      label: "케어모드",
      totalQuestions: 4,
      exposureTimeMs: 6000,
      totalLimitMs: 1 * 60 * 1000,
      showConditionCheck: false,
      showFinishCheck: false,
      showDifficultySelect: false,
      showSettings: true,
      showHowTo: false,
      showProgress: false,
      showScore: false,
      showTimer: false,
      showReplay: false,
      replayLimit: 0,
      allowConditionSkip: true,
      allowFinishSkip: true,
      hintEnabled: true,
      autoHintEnabled: true,
      autoReturnMs: 0,
      autoHintAfterMs: 10000,
      positionHintType: "highlight",
      flashEffectLevel: "low",
      highContrast: true,
      softFeedback: true,
      voiceGuideEnabled: true,
      resultLogLevel: "detailed"
    },
    ai_assisted: {
      label: "AI 연동모드",
      totalQuestions: 4,
      exposureTimeMs: 6000,
      totalLimitMs: 1 * 60 * 1000,
      showConditionCheck: false,
      showFinishCheck: false,
      showDifficultySelect: false,
      showSettings: true,
      showHowTo: false,
      showProgress: false,
      showScore: false,
      showTimer: false,
      showReplay: false,
      replayLimit: 0,
      allowConditionSkip: true,
      allowFinishSkip: true,
      hintEnabled: true,
      autoHintEnabled: true,
      autoReturnMs: 0,
      autoHintAfterMs: 10000,
      positionHintType: "highlight",
      flashEffectLevel: "low",
      highContrast: true,
      softFeedback: true,
      voiceGuideEnabled: true,
      externalVoiceTextInput: true
      ,
      resultLogLevel: "detailed"
    }
  };

  const THEME_CONFIG = {
    bulb: {
      id: "theme_bulb",
      label: "전구 테마",
      targetObject: "bulb",
      objectLabel: "전구"
    }
  };

  const DEFAULT_APP_CONFIG = {
    mode: "standard",
    difficulty: "easy",
    session_id: null,
    content_id: "cognitive_light_memory_001",
    game_key: "light_memory",
    gameId: "light_memory",
    gameVersion: "1.0.0",
    play_source: null,
    assignment_id: null,
    senior_id: null,
    guardian_id: null,
    alarm_id: null,
    userId: "guest",
    show_condition_check: null,
    show_finish_check: null,
    show_replay: null,
    high_contrast: null
  };

  const GAME_PHASE = {
    IDLE: "idle",
    MEMORIZE: "memorize",
    SELECTING: "selecting",
    FEEDBACK: "feedback",
    PAUSED: "paused",
    FINISHED: "finished"
  };

  function normalizeBoolean(value, fallback) {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    if (value === true || value === "true" || value === "1" || value === 1) {
      return true;
    }

    if (value === false || value === "false" || value === "0" || value === 0) {
      return false;
    }

    return fallback;
  }

  function normalizeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function pickValue(source, keys, fallback) {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
        return source[key];
      }
    }

    return fallback;
  }

  function normalizeConfigObject(value) {
    if (!value) {
      return {};
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (error) {
        return {};
      }
    }

    return typeof value === "object" ? value : {};
  }

  function getRuntimeConfig() {
    const params = new URLSearchParams(global.location.search);
    const external = global.HD_GAME_CONFIG || {};
    const urlConfig = {};

    params.forEach((value, key) => {
      urlConfig[key] = value;
    });

    const nestedConfig = Object.assign(
      {},
      normalizeConfigObject(external.config),
      normalizeConfigObject(urlConfig.config)
    );
    const explicitConfig = Object.assign({}, nestedConfig, external, urlConfig);
    const merged = Object.assign({}, DEFAULT_APP_CONFIG, explicitConfig);

    if (!MODE_CONFIG[merged.mode]) {
      merged.mode = DEFAULT_APP_CONFIG.mode;
    }

    const explicitDifficulty = pickValue(explicitConfig, ["difficulty", "difficulty_key", "difficultyKey", "difficulty_config", "difficultyConfig", "dfficulty_config", "dfficultyConfig"], null);
    if (explicitDifficulty !== null) {
      merged.difficulty = explicitDifficulty;
    }

    if (!DIFFICULTY_CONFIG[merged.difficulty]) {
      merged.difficulty = DEFAULT_APP_CONFIG.difficulty;
    }

    const modeConfig = MODE_CONFIG[merged.mode];
    const difficultyConfig = DIFFICULTY_CONFIG[merged.difficulty];
    const autoHintDelaySec = pickValue(merged, ["auto_hint_delay_sec", "autoHintDelaySec"], null);
    const totalTimeLimitSec = pickValue(merged, ["total_time_limit_sec", "totalTimeLimitSec"], null);
    const roundTimeLimitSec = pickValue(merged, ["round_time_limit_sec", "timeLimitSec", "time_limit_sec"], null);
    const questionCount = pickValue(merged, ["question_count", "roundCount", "questionCount"], null);
    const exposureTimeMs = pickValue(merged, ["exposure_time_ms", "exposureTimeMs"], null);

    return {
      raw: merged,
      mode: merged.mode,
      difficulty: merged.difficulty,
      modeConfig: Object.assign({}, modeConfig, {
        showTimer: normalizeBoolean(pickValue(merged, ["show_timer", "showTimer"], null), modeConfig.showTimer),
        showScore: normalizeBoolean(pickValue(merged, ["show_score", "showScore"], null), modeConfig.showScore),
        showDifficultySelect: normalizeBoolean(pickValue(merged, ["show_difficulty_select", "showDifficultySelect"], null), modeConfig.showDifficultySelect),
        showSettings: normalizeBoolean(pickValue(merged, ["show_settings", "showSettings"], null), modeConfig.showSettings),
        showHowTo: normalizeBoolean(pickValue(merged, ["show_how_to_play", "showHowTo"], null), modeConfig.showHowTo),
        showProgress: normalizeBoolean(pickValue(merged, ["show_progress", "showProgress"], null), modeConfig.showProgress),
        showConditionCheck: normalizeBoolean(pickValue(merged, ["show_condition_check", "showConditionCheck"], null), modeConfig.showConditionCheck),
        showFinishCheck: normalizeBoolean(pickValue(merged, ["show_finish_check", "showFinishCheck"], null), modeConfig.showFinishCheck),
        showReplay: normalizeBoolean(pickValue(merged, ["show_replay", "allow_replay", "showReplay"], null), modeConfig.showReplay),
        replayLimit: normalizeNumber(pickValue(merged, ["replay_limit", "replayLimit"], null), modeConfig.replayLimit),
        allowConditionSkip: normalizeBoolean(pickValue(merged, ["allow_condition_skip", "allowConditionSkip"], null), modeConfig.allowConditionSkip),
        allowFinishSkip: normalizeBoolean(pickValue(merged, ["allow_finish_skip", "allowFinishSkip"], null), modeConfig.allowFinishSkip),
        hintEnabled: normalizeBoolean(pickValue(merged, ["hint_enabled", "hintEnabled"], null), modeConfig.hintEnabled),
        autoHintEnabled: normalizeBoolean(pickValue(merged, ["auto_hint_enabled", "autoHintEnabled"], null), modeConfig.autoHintEnabled),
        autoHintAfterMs: autoHintDelaySec !== null ? normalizeNumber(autoHintDelaySec, 0) * 1000 : modeConfig.autoHintAfterMs,
        totalQuestions: questionCount !== null ? normalizeNumber(questionCount, modeConfig.totalQuestions) : modeConfig.totalQuestions,
        exposureTimeMs: exposureTimeMs !== null ? normalizeNumber(exposureTimeMs, modeConfig.exposureTimeMs) : modeConfig.exposureTimeMs,
        totalLimitMs: totalTimeLimitSec !== null ? normalizeNumber(totalTimeLimitSec, 0) * 1000 : modeConfig.totalLimitMs,
        roundTimeLimitMs: roundTimeLimitSec !== null ? normalizeNumber(roundTimeLimitSec, 0) * 1000 : 0,
        gridRows: normalizeNumber(pickValue(merged, ["grid_rows", "gridRows"], null), null),
        gridCols: normalizeNumber(pickValue(merged, ["grid_cols", "gridCols"], null), null),
        targetCount: normalizeNumber(pickValue(merged, ["target_count", "targetCount"], null), null),
        maxTargetCount: normalizeNumber(pickValue(merged, ["max_target_count", "maxTargetCount"], null), null),
        positionHintType: pickValue(merged, ["position_hint_type", "positionHintType"], modeConfig.positionHintType),
        resultLogLevel: pickValue(merged, ["result_log_level", "resultLogLevel"], modeConfig.resultLogLevel),
        flashEffectLevel: pickValue(merged, ["flash_effect_level", "flashEffectLevel"], modeConfig.flashEffectLevel),
        highContrast: normalizeBoolean(merged.high_contrast, modeConfig.highContrast),
        softFeedback: normalizeBoolean(pickValue(merged, ["soft_feedback", "softFeedback"], null), modeConfig.softFeedback),
        voiceGuideEnabled: normalizeBoolean(pickValue(merged, ["voice_guide_enabled", "voiceGuideEnabled"], null), modeConfig.voiceGuideEnabled),
        externalInputEnabled: normalizeBoolean(pickValue(merged, ["external_input_enabled", "externalInputEnabled", "external_voice_text_input", "externalVoiceTextInput"], null), Boolean(modeConfig.externalVoiceTextInput))
      }),
      difficultyConfig: difficultyConfig,
      highContrast: normalizeBoolean(merged.high_contrast, modeConfig.highContrast)
    };
  }

  global.DIFFICULTY_CONFIG = DIFFICULTY_CONFIG;
  global.MODE_CONFIG = MODE_CONFIG;
  global.THEME_CONFIG = THEME_CONFIG;
  global.DEFAULT_APP_CONFIG = DEFAULT_APP_CONFIG;
  global.GAME_PHASE = GAME_PHASE;
  global.getRuntimeConfig = getRuntimeConfig;
})(window);
