(function (global) {
  "use strict";

  const ROOT_FIELD_MAP = Object.freeze({
    senior_id: "seniorId",
    user_id: "userId",
    guardian_id: "guardianId",
    tenant_id: "tenantId",
    facility_id: "facilityId",
    program_id: "programId",
    reward_id: "rewardId",
    recommendation_id: "recommendationId",
    session_id: "sessionId",
    content_id: "contentId",
    game_key: "gameKey",
    game_version: "gameVersion",
    play_source: "playSource",
    assignment_id: "assignmentId",
    alarm_id: "alarmId",
    schedule_id: "scheduleId",
    anonymous_user_id: "anonymousUserId",
    device_id: "deviceId",
    app_version: "appVersion",
    question_count: "totalQuestions",
    duration_seconds: "durationSeconds",
    memory_item_count: "memoryItemCount",
    choice_count: "answerChoiceCount",
    max_choice_count: "answerChoiceCount",
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
    if (hasConfigValue(config, "client_context") && !hasConfigValue(normalized, "clientContext")) {
      normalized.clientContext = config.client_context;
    }
    if (hasConfigValue(config, "voice_context") && !hasConfigValue(normalized, "voiceContext")) {
      normalized.voiceContext = config.voice_context;
    }
    if (hasConfigValue(config, "process_data_json") && !hasConfigValue(normalized, "processData")) {
      normalized.processData = config.process_data_json;
    } else if (hasConfigValue(config, "process_data") && !hasConfigValue(normalized, "processData")) {
      normalized.processData = config.process_data;
    } else if (hasConfigValue(config, "course_data") && !hasConfigValue(normalized, "processData")) {
      normalized.processData = config.course_data;
    }
    if (hasConfigValue(config, "meta") && !hasConfigValue(normalized, "meta")) {
      normalized.meta = config.meta;
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
    } else if (hasConfigValue(config, "show_condition_check")) {
      normalized.collectCondition = config.show_condition_check;
    }

    normalized.ui = isPlainObject(normalized.ui) ? { ...normalized.ui } : {};
    copyMappedFields(config, normalized.ui, UI_FIELD_MAP);
    copyMappedFields(settings, normalized.ui, UI_FIELD_MAP);

    return normalized;
  }

  global.ShopQuestMemoryGameConfigNormalizer = Object.freeze({
    normalizeExternalConfig,
    hasConfigValue
  });
})(window);
