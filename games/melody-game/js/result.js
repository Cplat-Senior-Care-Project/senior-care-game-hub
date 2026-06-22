(function () {
  "use strict";

  function average(values) {
    if (!values.length) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
    return null;
  }

  function snapshotBoolean(fallback, ...values) {
    const value = firstDefined(...values);
    if (value === null) {
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

  function snapshotNumber(fallback, ...values) {
    const value = firstDefined(...values);
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  }

  function snapshotArray(value, fallback) {
    if (Array.isArray(value)) {
      return value.slice();
    }
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return fallback.slice();
  }

  function buildConfigSnapshot(state, autoHintEnabled, hintDelayMs, inputModesEnabled) {
    const runtime = state.runtimeConfig || {};
    const config = state.config || {};

    return {
      mode: state.mode || runtime.mode || "standard",
      difficulty: state.difficulty || runtime.difficulty || "normal",
      show_timer: snapshotBoolean(true, runtime.showTimer, config.showTimer),
      show_score: snapshotBoolean(true, runtime.showScore, config.showScore),
      show_difficulty_select: snapshotBoolean(true, runtime.showDifficultySelect, config.showDifficultySelect),
      show_settings: snapshotBoolean(true, runtime.showSettings, config.showSettings),
      show_how_to_play: snapshotBoolean(true, runtime.showHelp, config.showHelp),
      show_condition_check: snapshotBoolean(true, runtime.showConditionCheck, config.showConditionCheck),
      show_finish_check: snapshotBoolean(true, runtime.showFinishCheck, config.showFinishCheck),
      soft_feedback: snapshotBoolean(false, runtime.softFeedback, config.softFeedback),
      voice_guide_enabled: snapshotBoolean(true, runtime.voiceGuideEnabled, config.voiceGuideEnabled),
      hint_enabled: snapshotBoolean(false, runtime.hintEnabled, config.hintEnabled),
      auto_hint_enabled: autoHintEnabled,
      hint_delay_ms: hintDelayMs,
      result_log_level: runtime.resultLogLevel || config.resultLogLevel || "detailed",
      show_progress: snapshotBoolean(true, runtime.showProgress, config.showProgress),
      duration_seconds: snapshotNumber(60, config.sessionTime, runtime.sessionTime),
      pad_count: snapshotNumber(0, config.padCount, runtime.padCount),
      symbol_count: snapshotNumber(0, config.symbolCount, runtime.symbolCount),
      preview_enabled: snapshotBoolean(true, config.previewEnabled, runtime.previewEnabled),
      x_pattern_enabled: snapshotBoolean(false, config.xPatternEnabled, runtime.xPatternEnabled),
      x_hold_seconds: snapshotNumber(1.5, config.xHoldSeconds, runtime.xHoldSeconds),
      input_modes_enabled: snapshotArray(inputModesEnabled || runtime.inputModesEnabled, ["touch", "external"]),
      external_input_enabled: snapshotBoolean(true, runtime.externalInputEnabled, config.externalInputEnabled)
    };
  }

  function calculateResult(state) {
    const reactionTimes = state.reactionTimes.slice();
    const completedNotes = state.completedNoteCount;
    const totalTrials = state.totalTrials;
    const successRate = totalTrials > 0 ? Math.round((state.correctCount / totalTrials) * 100) : 0;
    const wrongTapCount = Number.isFinite(state.wrongTapCount)
      ? state.wrongTapCount
      : Math.max(0, (state.wrongCount || 0) - (state.xFailCount || 0));
    const totalTouchMissCount = Number.isFinite(state.totalTouchMissCount)
      ? state.totalTouchMissCount
      : wrongTapCount + (state.xFailCount || 0);
    const autoHintEnabled = state.config && state.config.autoHintEnabled !== false;
    const hintDelayMs = Number(state.config && state.config.hintDelayMs) || 10000;
    const inputModesEnabled = state.runtimeConfig && state.runtimeConfig.inputModesEnabled
      ? state.runtimeConfig.inputModesEnabled
      : ["touch", "external"];
    const status = state.status || "completed";
    const completed = status === "completed";
    const exitReason = state.exitReason || (completed ? "completed" : status);
    const progressRate = completed ? 100 : 0;
    const playTimeSec = Math.max(0, Math.round((state.config.sessionTime || 0) - (state.sessionRemaining || 0)));
    const conditionCheck = state.conditionCheck
      || state.condition
      || (state.runtimeConfig && (state.runtimeConfig.conditionCheck || state.runtimeConfig.condition_check))
      || { skipped: true };
    const conditionSkipped = Boolean(conditionCheck.skipped);
    const pauseCount = Number.isFinite(state.pauseCount) ? state.pauseCount : 0;
    const interactionCount = Number.isFinite(state.interactionCount) ? state.interactionCount : 0;
    const firstResponseTimeMs = Number.isFinite(state.firstResponseTimeMs) ? state.firstResponseTimeMs : null;
    const abandonedAt = status === "abandoned" ? state.abandonedAt || new Date().toISOString() : null;

    return {
      game_name: "melody_game",
      session_id: state.sessionId || null,
      senior_id: state.runtimeConfig && state.runtimeConfig.seniorId || null,
      user_id: state.runtimeConfig && state.runtimeConfig.userId || null,
      anonymous_user_id: state.runtimeConfig && state.runtimeConfig.anonymousUserId || null,
      guardian_id: state.runtimeConfig && state.runtimeConfig.guardianId || null,
      assignment_id: state.runtimeConfig && state.runtimeConfig.assignmentId || null,
      alarm_id: state.runtimeConfig && state.runtimeConfig.alarmId || null,
      schedule_id: state.runtimeConfig && state.runtimeConfig.scheduleId || null,
      tenant_id: state.runtimeConfig && state.runtimeConfig.tenantId || null,
      facility_id: state.runtimeConfig && state.runtimeConfig.facilityId || null,
      program_id: state.runtimeConfig && state.runtimeConfig.programId || null,
      reward_id: state.runtimeConfig && state.runtimeConfig.rewardId || null,
      recommendation_id: state.runtimeConfig && state.runtimeConfig.recommendationId || null,
      content_id: state.contentId || "cognitive_melody_game_001",
      game_key: state.gameKey || "melody_game",
      game_version: state.runtimeConfig && state.runtimeConfig.gameVersion || "1.0.0",
      play_source: state.runtimeConfig && state.runtimeConfig.playSource || "manual",
      status,
      completed,
      exit_reason: exitReason,
      abandon_reason: status === "abandoned" ? exitReason : null,
      mode: state.mode || "standard",
      difficulty: state.difficulty,
      started_at: state.startedAt || null,
      ended_at: new Date().toISOString(),
      song_id: state.song.id,
      song_title: state.song.title,
      session_time_sec: state.config.sessionTime,
      play_time_sec: playTimeSec,
      duration_ms: playTimeSec * 1000,
      pause_count: pauseCount,
      interaction_count: interactionCount,
      abandoned_at: abandonedAt,
      first_response_time_ms: firstResponseTimeMs,
      completed_note_count: completedNotes,
      progress_rate: progressRate,
      total_trials: totalTrials,
      correct_count: state.correctCount,
      wrong_count: state.wrongCount,
      wrong_tap_count: wrongTapCount,
      total_touch_miss_count: totalTouchMissCount,
      missed_count: state.missedCount,
      success_rate: successRate,
      average_reaction_time_ms: average(reactionTimes),
      fastest_reaction_time_ms: reactionTimes.length ? Math.min(...reactionTimes) : 0,
      slowest_reaction_time_ms: reactionTimes.length ? Math.max(...reactionTimes) : 0,
      preview_enabled: state.config.previewEnabled,
      x_pattern_enabled: state.config.xPatternEnabled,
      x_present_count: state.xPresentCount,
      x_success_count: state.xSuccessCount,
      x_fail_count: state.xFailCount,
      auto_hint_enabled: autoHintEnabled,
      hint_triggered_count: state.hintTriggeredCount,
      hint_delay_ms: hintDelayMs,
      touch_input_used: Boolean(state.touchInputUsed),
      external_input_used: Boolean(state.externalInputUsed),
      question_logs: Array.isArray(state.questionLogs) ? state.questionLogs.slice() : [],
      condition: {
        before: conditionSkipped ? null : conditionCheck,
        after: null
      },
      condition_check: conditionCheck,
      condition_check_skipped: conditionSkipped,
      finish_check: state.finishCheck || {},
      finish_check_skipped: false,
      input_modes_enabled: inputModesEnabled,
      config_snapshot: buildConfigSnapshot(state, autoHintEnabled, hintDelayMs, inputModesEnabled)
    };
  }

  function renderResult(result) {
    const safeResult = result || {};
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    };
    const rate = Number(safeResult.success_rate) || 0;
    const correctCount = Number(safeResult.correct_count) || 0;
    const targetCount = Number(safeResult.total_trials) || 0;
    const playTimeSec = Number(safeResult.play_time_sec) || Math.round((Number(safeResult.duration_ms) || 0) / 1000);
    const score = Math.min(100, Math.max(0, Math.round(rate)));
    const grade = rate >= 80 ? "A" : rate >= 60 ? "B" : "C";
    const message = "정말 잘하셨어요!";
    const minutes = Math.floor(playTimeSec / 60);
    const seconds = Math.max(0, playTimeSec % 60);

    setText("resultSuccessRate", `${rate}%`);
    setText("resultPlayTime", `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    setText("resultCorrectSummary", `${correctCount}/${targetCount}`);
    setText("resultScoreNumber", String(score));
    setText("resultGrade", grade);
    setText("resultMessage", message);

    if (["reminder", "care", "ai_assisted"].includes(safeResult.mode)) {
      renderReminderResult(safeResult, setText);
    }
  }

  function renderReminderResult(result, setText) {
    const totalQuestions = Number(result.total_questions || result.total_trials) || 0;
    const correctCount = Number(result.correct_count) || 0;
    const successRate = typeof result.success_rate === "number"
      ? result.success_rate
      : totalQuestions
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const hintCount = typeof result.hint_triggered_count === "number"
      ? result.hint_triggered_count
      : Number(result.hint_count) || 0;
    const resultMessage = createReminderResultMessage(result);

    setText("reminderResultEmoji", resultMessage.emoji);
    setText("reminderResultTitle", resultMessage.title);
    renderReminderResultMessage(resultMessage.message);
    setText("reminderResultTotal", String(totalQuestions));
    setText("reminderResultCorrect", String(correctCount));
    setText("reminderResultRate", `${successRate}%`);
    setText("reminderResultHintCount", `${hintCount}회`);
    setText("reminderResultCompare", "오늘 첫 기록을 남겼어요");
  }

  function createReminderResultMessage(result) {
    const rounds = Array.isArray(result.question_results)
      ? result.question_results
      : result.resultDetail && Array.isArray(result.resultDetail.rounds)
        ? result.resultDetail.rounds
        : Array.isArray(result.question_logs)
          ? result.question_logs
          : [];
    const totalAnswered = rounds.length
      || Number(result.played_round_count)
      || Number(result.completed_count)
      || Number(result.completed_note_count)
      || Number(result.total_trials)
      || 0;

    if (totalAnswered === 0) {
      return {
        emoji: "🤗",
        title: "괜찮습니다.",
        message: "편안한 때에 다시 이어가면 됩니다."
      };
    }

    return {
      emoji: "🤗",
      title: "수고 많으셨습니다.",
      message: "오늘도 차분히 집중해 주셨어요."
    };
  }

  function renderReminderResultMessage(message) {
    const element = document.getElementById("reminderResultMessage");
    if (!element) {
      return;
    }
    const sentenceBreak = ". ";
    const lines = message.includes(sentenceBreak) ? message.split(sentenceBreak) : [message];
    const firstLine = lines.length > 1 ? `${lines[0]}.` : lines[0];
    const secondLine = lines.length > 1 ? lines.slice(1).join(sentenceBreak) : "";
    const renderedLines = secondLine ? [firstLine, secondLine] : [firstLine];
    const nodes = renderedLines.flatMap((line, index) => {
      const textNode = document.createTextNode(line);
      return index === 0 ? [textNode] : [document.createElement("br"), textNode];
    });

    element.replaceChildren(...nodes);
  }

  window.ResultManager = {
    calculateResult,
    renderResult
  };
})();
