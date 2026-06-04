(function (global) {
  "use strict";

  const ROOT_FIELD_MAP = Object.freeze({
    session_id: "sessionId",
    content_id: "contentId",
    game_key: "gameKey",
    question_count: "totalQuestions",
    duration_seconds: "durationSeconds",
    reveal_ms: "revealMs",
    memory_item_count: "memoryItemCount",
    choice_count: "answerChoiceCount",
    max_items_to_remember: "maxItemsToRemember",
    voice_guide_enabled: "voiceGuideEnabled",
    hint_enabled: "hintEnabled",
    auto_hint_enabled: "autoHintEnabled",
    use_drag: "useDrag",
    auto_add_to_cart: "autoAddToCart",
    result_log_level: "resultLogLevel"
  });

  const UI_FIELD_MAP = Object.freeze({
    show_timer: "showTimer",
    show_progress: "showProgress",
    show_score: "showScore",
    show_difficulty_select: "showDifficultySelect",
    show_settings: "showSettings",
    show_how_to_play: "showTutorial",
    show_condition_check: "showConditionCheck",
    show_finish_check: "showFinishCheck"
  });

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function hasConfigValue(source, key) {
    return isPlainObject(source) && Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== "";
  }

  function copyMappedFields(source, target, fieldMap) {
    Object.keys(fieldMap).forEach((externalKey) => {
      if (hasConfigValue(source, externalKey)) {
        target[fieldMap[externalKey]] = source[externalKey];
      }
    });
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

    copyMappedFields(config, normalized, ROOT_FIELD_MAP);
    copyMappedFields(settings, normalized, ROOT_FIELD_MAP);

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

    if (hasConfigValue(settings, "show_condition_check")) {
      normalized.collectCondition = settings.show_condition_check;
    }

    normalized.ui = isPlainObject(normalized.ui) ? { ...normalized.ui } : {};
    copyMappedFields(settings, normalized.ui, UI_FIELD_MAP);

    return normalized;
  }

  global.ShopQuestMemoryGameConfigNormalizer = Object.freeze({
    normalizeExternalConfig,
    hasConfigValue
  });
})(window);