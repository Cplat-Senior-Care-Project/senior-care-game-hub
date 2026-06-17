(function (global) {
  "use strict";

  function average(numbers) {
    if (!numbers.length) {
      return 0;
    }

    return Math.round(numbers.reduce((sum, number) => sum + number, 0) / numbers.length);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function buildSessionId() {
    return "game_session_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function toDifficultyCode(difficulty) {
    const map = {
      easy: "EASY",
      normal: "NORMAL",
      hard: "HARD",
      reminder_fixed: "NORMAL",
      care_fixed: "EASY",
      custom: "CUSTOM"
    };

    return map[difficulty] || String(difficulty || "easy").toUpperCase();
  }

  function toPosition(index, cols) {
    return "r" + (Math.floor(index / cols) + 1) + "c" + ((index % cols) + 1);
  }

  function roundToLog(round, cols) {
    const targetPositions = (round.target_positions || []).map((index) => toPosition(index, cols));
    const selectedPositions = (round.selected_positions || []).map((index) => toPosition(index, cols));

    return {
      question_id: "q" + round.question_index,
      roundNo: round.question_index,
      question_type: "position_memory",
      cognitive_domain: "memory_activity",
      difficulty: toDifficultyCode(round.effectiveDifficulty || round.difficulty),
      prompt_type: "visual",
      targetType: round.target_object,
      targetTypeLabel: round.target_object_label,
      grid_rows: round.grid_rows,
      grid_cols: round.grid_cols,
      gridSize: round.grid_size,
      target_count: round.target_count,
      exposure_time_ms: round.exposure_time_ms,
      target_positions: targetPositions,
      selected_positions: selectedPositions,
      correct: Boolean(round.is_correct),
      is_correct: Boolean(round.is_correct),
      failReason: round.failReason || "",
      attempt_count: round.attempt_count,
      correctClickCount: round.correctClickCount,
      wrongClickCount: round.wrongClickCount,
      hint_used: Boolean(round.hint_used),
      hint_count: round.hint_count,
      replay_count: round.replay_count || 0,
      durationMs: round.durationMs || round.response_time_ms || 0,
      response_time_ms: round.response_time_ms || 0,
      first_response_time_ms: round.first_response_time_ms || 0,
      changed_answer_count: round.changed_answer_count || 0,
      wrong_tap_count: round.wrong_tap_count || 0,
      near_miss: Boolean(round.near_miss),
      input_type: (round.input_types && round.input_types[0]) || "touch"
    };
  }

  function buildMetrics(roundLogs, totalQuestions) {
    const playedRoundCount = roundLogs.length;
    const correctRoundCount = roundLogs.filter((round) => round.correct).length;
    const failedRoundCount = playedRoundCount - correctRoundCount;
    const timeoutRoundCount = roundLogs.filter((round) => round.failReason === "timeout").length;
    const correctClickCount = roundLogs.reduce((sum, round) => sum + (round.correctClickCount || 0), 0);
    const wrongClickCount = roundLogs.reduce((sum, round) => sum + (round.wrongClickCount || 0), 0);
    const hintCount = roundLogs.reduce((sum, round) => sum + (round.hint_count || 0), 0);
    const attemptCount = roundLogs.reduce((sum, round) => sum + (round.attempt_count || 0), 0);
    const interactionCount = attemptCount + hintCount;

    return {
      roundTotal: totalQuestions,
      playedRoundCount: playedRoundCount,
      correctRoundCount: correctRoundCount,
      failedRoundCount: failedRoundCount,
      timeoutRoundCount: timeoutRoundCount,
      correctClickCount: correctClickCount,
      wrongClickCount: wrongClickCount,
      hintCount: hintCount,
      attemptCount: attemptCount,
      interactionCount: interactionCount,
      clickAccuracy: attemptCount ? Number((correctClickCount / attemptCount).toFixed(3)) : 0,
      roundAccuracy: totalQuestions ? Number((correctRoundCount / totalQuestions).toFixed(3)) : 0,
      completionRate: totalQuestions ? Number((playedRoundCount / totalQuestions).toFixed(3)) : 0
    };
  }

  function buildResultDetail(gameState) {
    const rawRounds = gameState.questionResults.slice();
    const cols = gameState.difficulty.gridCols;
    const roundLogs = rawRounds.map((round) => roundToLog(round, cols));
    const responseTimes = roundLogs.map((item) => item.response_time_ms).filter((time) => time > 0);
    const totalQuestions = gameState.totalQuestions;
    const completed = rawRounds.length >= totalQuestions && !gameState.exitedEarly && !gameState.exitReason;
    const totalPlayMs = Math.max(0, gameState.endedAt - gameState.startedAt);
    const metrics = buildMetrics(roundLogs, totalQuestions);
    const status = gameState.errorCode ? "error" : completed ? "completed" : "abandoned";
    const sessionMeta = gameState.sessionMeta || {};
    const beforeSkipped = Boolean((gameState.condition && gameState.condition.skipped) || gameState.modeConfig.showConditionCheck === false);
    const afterSkipped = Boolean((gameState.finishCheck && gameState.finishCheck.skipped) || gameState.modeConfig.showFinishCheck === false);
    const roundTimeLimitSec = gameState.modeConfig.roundTimeLimitMs ? Math.round(gameState.modeConfig.roundTimeLimitMs / 1000) : 0;

    const resultDetail = {
      theme: gameState.themeKey,
      theme_id: gameState.theme && gameState.theme.id,
      gridSize: gameState.difficulty.gridRows + "x" + gameState.difficulty.gridCols,
      grid_size: gameState.difficulty.gridRows + "x" + gameState.difficulty.gridCols,
      grid_rows: gameState.difficulty.gridRows,
      grid_cols: gameState.difficulty.gridCols,
      targetCountPerRound: gameState.difficulty.targetCount,
      target_count: gameState.difficulty.targetCount,
      max_target_count: gameState.modeConfig.maxTargetCount || gameState.difficulty.targetCount,
      timeLimitSec: roundTimeLimitSec,
      maxWrongPerRound: 3,
      exposure_time_ms: gameState.modeConfig.exposureTimeMs,
      flash_effect_level: gameState.modeConfig.flashEffectLevel,
      high_contrast: Boolean(gameState.modeConfig.highContrast),
      near_miss_count: 0,
      replay_count: 0,
      difficulty_downshifted: false,
      condition_check_skipped: beforeSkipped,
      finish_check_skipped: afterSkipped,
      rounds: roundLogs
    };

    const result = {
      schemaVersion: "1.0.0",
      sentAt: nowIso(),
      sessionId: gameState.sessionId || buildSessionId(),
      contentId: sessionMeta.contentId,
      assignmentId: sessionMeta.assignmentId || null,
      seniorId: sessionMeta.seniorId || null,
      guardianId: sessionMeta.guardianId || null,
      alarmId: sessionMeta.alarmId || null,
      gameKey: sessionMeta.gameKey || "light_memory",
      gameId: gameState.gameId || sessionMeta.gameKey || "light_memory",
      gameVersion: gameState.gameVersion,
      playSource: sessionMeta.playSource || gameState.mode,
      type: status === "completed" ? "GAME_COMPLETED" : status === "error" ? "GAME_ERROR" : "GAME_ABANDONED",
      status: status,
      mode: gameState.mode,
      difficulty: toDifficultyCode(gameState.difficultyKey),
      effectiveDifficulty: gameState.effectiveDifficultyKey,
      startedAt: gameState.startedAtIso,
      endedAt: nowIso(),
      durationMs: totalPlayMs,
      totalElapsedMs: totalPlayMs,
      total_questions: totalQuestions,
      correct_count: metrics.correctRoundCount,
      wrong_count: metrics.failedRoundCount,
      hint_count: metrics.hintCount,
      retry_count: 0,
      pause_count: gameState.pauseCount || 0,
      interaction_count: gameState.interactionCount || metrics.interactionCount,
      avg_response_time_ms: average(responseTimes),
      completion_rate: metrics.completionRate,
      condition_check_skipped: beforeSkipped,
      finish_check_skipped: afterSkipped,
      abandoned: status === "abandoned",
      abandonedReason: status === "abandoned" ? gameState.exitReason || "unknown" : null,
      abandonedAt: status === "abandoned" ? nowIso() : null,
      errorCode: gameState.errorCode || null,
      errorMessage: gameState.errorMessage || null,
      errorPhase: gameState.errorPhase || null,
      completeSendFailed: false,
      metrics: metrics,
      condition: {
        before: beforeSkipped ? null : gameState.condition || null,
        after: afterSkipped ? null : gameState.finishCheck || null
      },
      external_inputs: gameState.externalInputs || [],
      question_logs: roundLogs,
      resultDetail: resultDetail,
      result_detail_json: resultDetail,

      game_name: "빛나는 전구를 찾아라",
      totalPlayTimeMs: totalPlayMs,
      selectedDifficulty: gameState.difficultyKey,
      completed: completed,
      exitedEarly: gameState.exitedEarly,
      exitReason: gameState.exitReason,
      success_rate: Math.round(metrics.roundAccuracy * 100),
      average_response_time_ms: average(responseTimes),
      fastest_response_time_ms: responseTimes.length ? Math.min.apply(null, responseTimes) : 0,
      slowest_response_time_ms: responseTimes.length ? Math.max.apply(null, responseTimes) : 0,
      hint_triggered_count: metrics.hintCount,
      timeoutRoundCount: metrics.timeoutRoundCount,
      question_results: rawRounds
    };

    console.log("result_detail_json", JSON.stringify(result, null, 2));
    global.__LAST_GAME_RESULT__ = result;
    return result;
  }

  global.ResultBuilder = {
    build: buildResultDetail,
    buildSessionId: buildSessionId
  };
})(window);
