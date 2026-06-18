(function (global) {
  "use strict";

  function pick(raw, snakeKey, camelKey, fallback) {
    if (raw[snakeKey] !== undefined && raw[snakeKey] !== null && raw[snakeKey] !== "") {
      return raw[snakeKey];
    }
    if (raw[camelKey] !== undefined && raw[camelKey] !== null && raw[camelKey] !== "") {
      return raw[camelKey];
    }
    return fallback;
  }

  function buildSessionMeta(runtime, sessionId) {
    const raw = runtime.raw || {};
    const modePlaySource = {
      standard: "manual",
      reminder: "reminder",
      care: "care_session",
      ai_assisted: "ai_recommendation"
    };

    return {
      userId: pick(raw, "user_id", "userId", "guest"),
      anonymousUserId: pick(raw, "anonymous_user_id", "anonymousUserId", null),
      sessionId,
      contentId: pick(raw, "content_id", "contentId", "cognitive_light_memory_001"),
      gameKey: pick(raw, "game_key", "gameKey", "light_memory"),
      gameId: raw.gameId || raw.game_key || "light_memory",
      gameVersion: pick(raw, "game_version", "gameVersion", "1.0.0"),
      playSource: pick(raw, "play_source", "playSource", modePlaySource[runtime.mode] || "manual"),
      assignmentId: pick(raw, "assignment_id", "assignmentId", null),
      seniorId: pick(raw, "senior_id", "seniorId", null),
      guardianId: pick(raw, "guardian_id", "guardianId", null),
      alarmId: pick(raw, "alarm_id", "alarmId", null),
      scheduleId: pick(raw, "schedule_id", "scheduleId", null),
      tenantId: pick(raw, "tenant_id", "tenantId", null),
      facilityId: pick(raw, "facility_id", "facilityId", null),
      programId: pick(raw, "program_id", "programId", null),
      rewardId: pick(raw, "reward_id", "rewardId", null),
      recommendationId: pick(raw, "recommendation_id", "recommendationId", null),
      clientContext: raw.client_context || raw.clientContext || null,
      voiceContext: raw.voice_context || raw.voiceContext || null,
      meta: raw.meta || null
    };
  }

  function collectChoices(scope) {
    const data = {};
    if (!scope) {
      return data;
    }

    scope.querySelectorAll("[data-choice-group]").forEach((group) => {
      const selected = group.querySelector(".choice-button.is-selected");
      data[group.dataset.choiceGroup] = selected ? selected.dataset.value : "";
    });

    return data;
  }

  global.LightGameSessionBoard = {
    buildSessionMeta,
    collectChoices
  };
})(window);
