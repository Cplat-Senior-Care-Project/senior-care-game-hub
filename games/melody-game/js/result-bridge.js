(function () {
  "use strict";

  const DEFAULT_CONTENT_ID = "cognitive_melody_game_001";
  const DEFAULT_GAME_KEY = "melody_game";

  let pendingAutoReturn = null;

  function post(type, payload) {
    if (window.MelodyGameAppBridge && typeof window.MelodyGameAppBridge.sendMessage === "function") {
      window.MelodyGameAppBridge.sendMessage(type, payload);
      return;
    }

    if (window.DisplayBridge && window.DisplayBridge.postHostMessage) {
      window.DisplayBridge.postHostMessage(type, payload);
      return;
    }

    window.dispatchEvent(new CustomEvent("melody-drum:host-message", {
      detail: { type, payload: payload || {} }
    }));
  }

  function runtimeSnapshot() {
    return window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot
      ? window.MelodyRuntime.runtimeSnapshot()
      : {};
  }

  function pickResultOrRuntime(result, runtime, snake, camel, fallback) {
    if (result && result[snake] !== undefined && result[snake] !== null && result[snake] !== "") return result[snake];
    if (result && result[camel] !== undefined && result[camel] !== null && result[camel] !== "") return result[camel];
    if (runtime && runtime[camel] !== undefined && runtime[camel] !== null && runtime[camel] !== "") return runtime[camel];
    if (runtime && runtime[snake] !== undefined && runtime[snake] !== null && runtime[snake] !== "") return runtime[snake];
    return fallback;
  }

  function numberValue(...values) {
    for (const value of values) {
      const next = Number(value);
      if (Number.isFinite(next)) {
        return next;
      }
    }
    return 0;
  }

  function nullableNumberValue(...values) {
    for (const value of values) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      const next = Number(value);
      if (Number.isFinite(next)) {
        return next;
      }
    }
    return null;
  }

  function booleanValue(value, fallback) {
    if (value === undefined || value === null || value === "") {
      return Boolean(fallback);
    }
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return ["true", "1", "yes", "y", "on"].includes(String(value).toLowerCase());
  }

  function arrayValue(value, fallback) {
    if (Array.isArray(value)) {
      return value.slice();
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return fallback.slice();
  }

  function normalizeExitReason(reason) {
    const value = String(reason || "").trim();
    if (value === "timeout") return "time_over";
    if (value === "user_quit") return "user_exit";
    if (value === "webview_closed") return "app_background";
    return value;
  }

  function buildQuestionLogs(questionLogs, session) {
    const logs = Array.isArray(questionLogs) ? questionLogs : [];
    const safeSession = session || {};
    const sessionId = safeSession.session_id || "melody-session";

    return logs.map((log, index) => {
      const source = log || {};
      const rawLog = source.raw_log_json && typeof source.raw_log_json === "object"
        ? { ...source.raw_log_json }
        : { ...source };
      const questionIndex = numberValue(source.question_index, index + 1);
      const correctAnswer = source.correct_answer !== undefined
        ? source.correct_answer
        : source.correct_symbol_id || rawLog.correct_symbol_id || null;
      const selectedAnswer = source.selected_answer !== undefined
        ? source.selected_answer
        : source.selected_symbol_id || rawLog.selected_symbol_id || null;
      const failType = source.fail_type || rawLog.fail_type || null;
      const hintUsed = booleanValue(
        source.hint_used !== undefined ? source.hint_used : source.hint_shown !== undefined ? source.hint_shown : rawLog.hint_shown,
        false
      );
      const isCorrect = booleanValue(source.is_correct, false);
      const questionType = source.question_type || source.prompt_type || rawLog.prompt_type || "tap";

      return {
        question_id: source.question_id || `${sessionId}_q${questionIndex}`,
        question_index: questionIndex,
        stage: numberValue(source.stage, 1),
        question_type: questionType,
        game_mode: source.game_mode || "melody_play",
        cognitive_domain: source.cognitive_domain || "attention_response",
        difficulty: source.difficulty || safeSession.difficulty || null,
        target_item: correctAnswer,
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        attempt_count: numberValue(source.attempt_count, 1),
        hint_used: hintUsed,
        hint_count: numberValue(source.hint_count, hintUsed ? 1 : 0),
        response_time_ms: numberValue(source.response_time_ms),
        first_response_time_ms: nullableNumberValue(source.first_response_time_ms),
        wrong_tap_count: numberValue(source.wrong_tap_count, isCorrect ? 0 : failType ? 1 : 0),
        touch_miss_count: numberValue(
          source.touch_miss_count,
          ["wrong_symbol", "x_tapped"].includes(failType) ? 1 : 0
        ),
        input_type: source.input_type || null,
        raw_log_json: rawLog
      };
    });
  }

  function buildProcessDataJson(summary) {
    const safeSummary = summary || {};

    return {
      timing: {
        first_response_time_ms: safeSummary.first_response_time_ms,
        average_reaction_time_ms: safeSummary.average_reaction_time_ms,
        fastest_reaction_time_ms: safeSummary.fastest_reaction_time_ms,
        slowest_reaction_time_ms: safeSummary.slowest_reaction_time_ms
      },
      interaction: {
        pause_count: safeSummary.pause_count,
        interaction_count: safeSummary.interaction_count,
        total_touch_miss_count: safeSummary.total_touch_miss_count
      },
      hint: {
        hint_triggered_count: safeSummary.hint_triggered_count,
        auto_hint_enabled: safeSummary.auto_hint_enabled
      },
      input: {
        external_input_used: safeSummary.external_input_used
      },
      x_pattern: {
        x_present_count: safeSummary.x_present_count,
        x_success_count: safeSummary.x_success_count,
        x_fail_count: safeSummary.x_fail_count
      },
      condition_check: safeSummary.condition_check,
      finish_check: safeSummary.finish_check,
      condition_check_skipped: safeSummary.condition_check_skipped,
      finish_check_skipped: safeSummary.finish_check_skipped,
      exit: {
        exit_reason: safeSummary.exit_reason,
        abandon_reason: safeSummary.abandon_reason,
        abandoned_at: safeSummary.abandoned_at
      }
    };
  }

  function buildConfigSnapshot(source, runtime, session) {
    const config = source || {};
    const safeRuntime = runtime || {};
    const safeSession = session || {};

    return {
      mode: pickResultOrRuntime(config, safeRuntime, "mode", "mode", safeSession.mode || "standard"),
      difficulty: pickResultOrRuntime(config, safeRuntime, "difficulty", "difficulty", safeSession.difficulty || "normal"),
      show_timer: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_timer", "showTimer", true), true),
      show_score: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_score", "showScore", true), true),
      show_difficulty_select: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_difficulty_select", "showDifficultySelect", true), true),
      show_settings: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_settings", "showSettings", true), true),
      show_how_to_play: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_how_to_play", "showHelp", true), true),
      show_condition_check: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_condition_check", "showConditionCheck", true), true),
      show_finish_check: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_finish_check", "showFinishCheck", true), true),
      soft_feedback: booleanValue(pickResultOrRuntime(config, safeRuntime, "soft_feedback", "softFeedback", false), false),
      voice_guide_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "voice_guide_enabled", "voiceGuideEnabled", true), true),
      hint_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "hint_enabled", "hintEnabled", false), false),
      auto_hint_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "auto_hint_enabled", "autoHintEnabled", true), true),
      hint_delay_ms: numberValue(pickResultOrRuntime(config, safeRuntime, "hint_delay_ms", "hintDelayMs", 10000)),
      result_log_level: pickResultOrRuntime(config, safeRuntime, "result_log_level", "resultLogLevel", "detailed"),
      show_progress: booleanValue(pickResultOrRuntime(config, safeRuntime, "show_progress", "showProgress", true), true),
      duration_seconds: numberValue(pickResultOrRuntime(config, safeRuntime, "duration_seconds", "sessionTime", 60)),
      pad_count: numberValue(pickResultOrRuntime(config, safeRuntime, "pad_count", "padCount", 0)),
      symbol_count: numberValue(pickResultOrRuntime(config, safeRuntime, "symbol_count", "symbolCount", 0)),
      preview_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "preview_enabled", "previewEnabled", true), true),
      x_pattern_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "x_pattern_enabled", "xPatternEnabled", false), false),
      x_hold_seconds: numberValue(pickResultOrRuntime(config, safeRuntime, "x_hold_seconds", "xHoldSeconds", 1.5)),
      input_modes_enabled: arrayValue(pickResultOrRuntime(config, safeRuntime, "input_modes_enabled", "inputModesEnabled", ["touch", "external"]), ["touch", "external"]),
      external_input_enabled: booleanValue(pickResultOrRuntime(config, safeRuntime, "external_input_enabled", "externalInputEnabled", true), true)
    };
  }

  function normalizeResult(result, status, reason) {
    const normalized = { ...(result || {}) };
    normalized.status = status || normalized.status || "completed";
    normalized.completed = normalized.status === "completed";
    normalized.exit_reason = normalizeExitReason(
      normalized.exit_reason || normalized.ended_reason || reason || (normalized.completed ? "completed" : normalized.status)
    );
    normalized.ended_reason = normalizeExitReason(normalized.ended_reason || normalized.exit_reason);

    if (normalized.status === "abandoned") {
      normalized.abandon_reason = normalizeExitReason(normalized.abandon_reason || normalized.exit_reason || "abandoned");
    }
    if (normalized.status === "error") {
      normalized.error_code = normalized.error_code || "GAME_ERROR";
      normalized.error_message = normalized.error_message || normalized.message || "Game error";
      normalized.error_phase = normalized.error_phase || "runtime";
    }

    return normalized;
  }

  function buildCommonPayload(result, completed) {
    const safeResult = result || {};
    const runtime = runtimeSnapshot();
    const status = safeResult.status || (completed ? "completed" : "abandoned");
    const isCompleted = status === "completed";
    const conditionCheck = safeResult.condition_check
      || (safeResult.condition && safeResult.condition.before)
      || null;
    const finishCheck = safeResult.finish_check
      || (safeResult.condition && safeResult.condition.after)
      || null;
    const resultConfig = safeResult.config_snapshot || runtime.configSnapshot || runtime;
    const totalTouchMissCount = numberValue(safeResult.total_touch_miss_count, safeResult.wrong_count);
    const autoHintEnabled = booleanValue(
      safeResult.auto_hint_enabled !== undefined ? safeResult.auto_hint_enabled : resultConfig && resultConfig.autoHintEnabled,
      true
    );
    const externalInputUsed = booleanValue(
      safeResult.external_input_used !== undefined ? safeResult.external_input_used : runtime.externalInputUsed,
      false
    );
    const performanceSummary = {
      total_trials: numberValue(safeResult.total_trials, safeResult.total_questions),
      correct_count: numberValue(safeResult.correct_count),
      wrong_count: numberValue(safeResult.wrong_count),
      total_touch_miss_count: totalTouchMissCount,
      success_rate: numberValue(safeResult.success_rate),
      average_reaction_time_ms: numberValue(safeResult.average_reaction_time_ms),
      fastest_reaction_time_ms: numberValue(safeResult.fastest_reaction_time_ms),
      slowest_reaction_time_ms: numberValue(safeResult.slowest_reaction_time_ms),
      hint_triggered_count: numberValue(safeResult.hint_triggered_count),
      x_present_count: numberValue(safeResult.x_present_count),
      x_success_count: numberValue(safeResult.x_success_count),
      x_fail_count: numberValue(safeResult.x_fail_count)
    };
    const sourceQuestionLogs = Array.isArray(safeResult.question_logs) ? safeResult.question_logs : [];
    const session = {
      session_id: pickResultOrRuntime(safeResult, runtime, "session_id", "sessionId", null),
      content_id: pickResultOrRuntime(safeResult, runtime, "content_id", "contentId", DEFAULT_CONTENT_ID),
      game_key: pickResultOrRuntime(safeResult, runtime, "game_key", "gameKey", DEFAULT_GAME_KEY),
      game_version: pickResultOrRuntime(safeResult, runtime, "game_version", "gameVersion", "1.0.0"),
      play_source: pickResultOrRuntime(safeResult, runtime, "play_source", "playSource", "manual"),
      mode: safeResult.mode || runtime.mode || "standard",
      difficulty: safeResult.difficulty || runtime.difficulty || "normal",
      started_at: safeResult.started_at || null,
      ended_at: safeResult.ended_at || new Date().toISOString(),
      status,
      completed: isCompleted
    };
    const configSnapshot = buildConfigSnapshot(resultConfig, runtime, session);
    const pauseCount = numberValue(safeResult.pause_count);
    const interactionCount = numberValue(safeResult.interaction_count);
    const firstResponseTimeMs = nullableNumberValue(safeResult.first_response_time_ms);
    const abandonedAt = status === "abandoned"
      ? safeResult.abandoned_at || session.ended_at || null
      : null;
    const questionLogs = buildQuestionLogs(sourceQuestionLogs, session);
    const totalQuestions = numberValue(safeResult.total_questions, performanceSummary.total_trials, questionLogs.length);
    const completedQuestionCount = numberValue(
      safeResult.completed_question_count,
      questionLogs.length,
      safeResult.completed_note_count,
      totalQuestions
    );
    const completionRate = totalQuestions > 0
      ? Math.min(1, Math.max(0, completedQuestionCount / totalQuestions))
      : isCompleted ? 1 : 0;
    const exitReason = normalizeExitReason(safeResult.exit_reason || safeResult.ended_reason || (isCompleted ? "completed" : status));
    const abandonReason = status === "abandoned"
      ? normalizeExitReason(safeResult.abandon_reason || exitReason || "abandoned")
      : null;
    const processDataJson = buildProcessDataJson({
      first_response_time_ms: firstResponseTimeMs,
      average_reaction_time_ms: performanceSummary.average_reaction_time_ms,
      fastest_reaction_time_ms: performanceSummary.fastest_reaction_time_ms,
      slowest_reaction_time_ms: performanceSummary.slowest_reaction_time_ms,
      pause_count: pauseCount,
      interaction_count: interactionCount,
      total_touch_miss_count: totalTouchMissCount,
      hint_triggered_count: performanceSummary.hint_triggered_count,
      auto_hint_enabled: autoHintEnabled,
      external_input_used: externalInputUsed,
      x_present_count: performanceSummary.x_present_count,
      x_success_count: performanceSummary.x_success_count,
      x_fail_count: performanceSummary.x_fail_count,
      condition_check: conditionCheck,
      finish_check: finishCheck,
      condition_check_skipped: Boolean(safeResult.condition_check_skipped),
      finish_check_skipped: Boolean(safeResult.finish_check_skipped),
      exit_reason: exitReason,
      abandon_reason: abandonReason,
      abandoned_at: abandonedAt
    });
    const resultDetailJson = {
      average_reaction_time_ms: performanceSummary.average_reaction_time_ms,
      total_touch_miss_count: totalTouchMissCount,
      total_wrong_count: performanceSummary.wrong_count,
      total_correct_count: performanceSummary.correct_count,
      total_trials: performanceSummary.total_trials,
      hint_triggered_count: performanceSummary.hint_triggered_count,
      x_present_count: performanceSummary.x_present_count,
      x_success_count: performanceSummary.x_success_count,
      x_fail_count: performanceSummary.x_fail_count,
      fastest_reaction_time_ms: performanceSummary.fastest_reaction_time_ms,
      slowest_reaction_time_ms: performanceSummary.slowest_reaction_time_ms,
      external_input_used: externalInputUsed,
      auto_hint_enabled: autoHintEnabled,
      difficulty_downshifted: booleanValue(
        safeResult.difficulty_downshifted !== undefined
          ? safeResult.difficulty_downshifted
          : runtime.difficultyDownshifted,
        false
      )
    };

    return {
      session_id: session.session_id,
      content_id: session.content_id,
      game_key: session.game_key,
      game_version: session.game_version,
      play_source: session.play_source,
      status,
      mode: session.mode,
      app_mode: session.mode,
      difficulty: session.difficulty,
      config_snapshot: configSnapshot,
      started_at: session.started_at,
      ended_at: session.ended_at,
      duration_ms: safeResult.duration_ms || 0,
      pause_count: pauseCount,
      interaction_count: interactionCount,
      abandoned_at: abandonedAt,
      first_response_time_ms: firstResponseTimeMs,
      completed: isCompleted,
      total_questions: totalQuestions,
      completed_question_count: completedQuestionCount,
      correct_count: safeResult.correct_count || 0,
      wrong_count: safeResult.wrong_count || 0,
      hint_count: performanceSummary.hint_triggered_count,
      total_touch_miss_count: totalTouchMissCount,
      avg_response_time_ms: performanceSummary.average_reaction_time_ms,
      average_reaction_time_ms: performanceSummary.average_reaction_time_ms,
      fastest_reaction_time_ms: performanceSummary.fastest_reaction_time_ms,
      slowest_reaction_time_ms: performanceSummary.slowest_reaction_time_ms,
      hint_triggered_count: performanceSummary.hint_triggered_count,
      auto_hint_enabled: autoHintEnabled,
      external_input_used: externalInputUsed,
      x_present_count: performanceSummary.x_present_count,
      x_success_count: performanceSummary.x_success_count,
      x_fail_count: performanceSummary.x_fail_count,
      score: safeResult.success_rate || 0,
      progress_rate: safeResult.progress_rate || 0,
      completion_rate: completionRate,
      exit_reason: exitReason,
      abandon_reason: abandonReason,
      legacy_status: status === "abandoned" && abandonReason === "time_over" ? "time_over" : null,
      error_code: status === "error" ? safeResult.error_code || "GAME_ERROR" : null,
      error_message: status === "error" ? safeResult.error_message || "Game error" : null,
      error_phase: status === "error" ? safeResult.error_phase || "runtime" : null,
      condition_check: conditionCheck,
      finish_check: finishCheck,
      condition_check_skipped: Boolean(safeResult.condition_check_skipped),
      finish_check_skipped: Boolean(safeResult.finish_check_skipped),
      process_data_json: processDataJson,
      question_logs: questionLogs,
      result_detail_json: resultDetailJson
    };
  }

  function submitToCollector() {
    // Common API policy: the WebView posts results to the host app; the host app calls the server.
  }

  function buildSessionPayload(source) {
    const runtime = runtimeSnapshot();
    const state = source || {};
    const session = {
      session_id: state.sessionId || state.session_id || runtime.sessionId || null,
      content_id: state.contentId || state.content_id || runtime.contentId || DEFAULT_CONTENT_ID,
      game_key: state.gameKey || state.game_key || runtime.gameKey || DEFAULT_GAME_KEY,
      game_version: state.gameVersion || state.game_version || runtime.gameVersion || "1.0.0",
      play_source: state.playSource || state.play_source || runtime.playSource || "manual",
      mode: state.mode || runtime.mode || "standard",
      app_mode: state.appMode || state.app_mode || state.mode || runtime.mode || "standard",
      difficulty: state.difficulty || runtime.difficulty || "normal"
    };

    return {
      ...session,
      config_snapshot: buildConfigSnapshot(state.runtimeConfig || state.config_snapshot || runtime, runtime, session)
    };
  }

  function handleGameReady(payload) {
    post("GAME_READY", {
      ...buildSessionPayload(payload),
      ready_at: new Date().toISOString()
    });
  }

  function handleSessionStart(state) {
    post("GAME_STARTED", {
      ...buildSessionPayload(state),
      started_at: state && state.startedAt ? state.startedAt : new Date().toISOString()
    });
  }

  function handleSessionComplete(result) {
    const normalized = normalizeResult(result, "completed", "completed");
    const payload = buildCommonPayload(normalized, true);
    post("SESSION_COMPLETE", payload);
    submitToCollector(payload);

    const runtime = runtimeSnapshot();
    if (pendingAutoReturn) {
      window.clearTimeout(pendingAutoReturn);
      pendingAutoReturn = null;
    }
    if (runtime.autoReturnMs > 0) {
      pendingAutoReturn = window.setTimeout(() => returnToHost("auto_complete"), runtime.autoReturnMs);
    }

    return payload;
  }

  function handleSessionAbort(result, reason) {
    const normalized = normalizeResult(result, "abandoned", reason || "abandoned");
    const payload = buildCommonPayload(normalized, false);
    post("SESSION_ABORT", payload);
    submitToCollector(payload);
    return payload;
  }

  function handleGameError(error, source) {
    const runtime = runtimeSnapshot();
    const result = normalizeResult({
      ...(source || {}),
      session_id: source && (source.session_id || source.sessionId) || runtime.sessionId || null,
      content_id: source && (source.content_id || source.contentId) || runtime.contentId || DEFAULT_CONTENT_ID,
      game_key: source && (source.game_key || source.gameKey) || runtime.gameKey || DEFAULT_GAME_KEY,
      mode: source && source.mode || runtime.mode || "standard",
      difficulty: source && source.difficulty || runtime.difficulty || "normal",
      error_code: error && (error.code || error.error_code) || "GAME_ERROR",
      error_message: error && (error.message || error.error_message) || "Game error",
      ended_at: new Date().toISOString()
    }, "error", "error");
    const payload = buildCommonPayload(result, false);
    post("GAME_ERROR", payload);
    submitToCollector(payload);
    return payload;
  }

  function handleGameExitRequested(reason, extra) {
    post("GAME_EXIT_REQUESTED", {
      ...buildSessionPayload(extra || {}),
      reason: reason || "user_exit",
      requested_at: new Date().toISOString()
    });
  }

  function returnToHost(reason) {
    if (window.DisplayBridge && window.DisplayBridge.returnToHost) {
      window.DisplayBridge.returnToHost(reason);
      return;
    }
    post("RETURN_TO_APP", { reason: reason || "user_complete" });
  }

  window.ResultBridge = {
    buildCommonPayload,
    handleGameReady,
    handleSessionStart,
    handleSessionComplete,
    handleSessionAbort,
    handleGameError,
    handleGameExitRequested,
    returnToHost
  };
})();
