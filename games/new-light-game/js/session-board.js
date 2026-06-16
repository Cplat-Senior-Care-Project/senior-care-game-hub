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

    return {
      userId: raw.userId,
      sessionId,
      contentId: pick(raw, "content_id", "contentId", "cognitive_light_memory_001"),
      gameKey: pick(raw, "game_key", "gameKey", "light_memory"),
      gameId: raw.gameId || raw.game_key || "light_memory",
      gameVersion: raw.gameVersion,
      playSource: pick(raw, "play_source", "playSource", runtime.mode),
      assignmentId: pick(raw, "assignment_id", "assignmentId", null),
      seniorId: pick(raw, "senior_id", "seniorId", null),
      guardianId: pick(raw, "guardian_id", "guardianId", null),
      alarmId: pick(raw, "alarm_id", "alarmId", null)
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
