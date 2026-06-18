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
    return String(difficulty || "easy");
  }

  function toPosition(index, cols) {
    return "r" + (Math.floor(index / cols) + 1) + "c" + ((index % cols) + 1);
  }

  function roundToLog(round, cols) {
    const targetPositions = (round.target_positions || []).map((index) => toPosition(index, cols));
    const selectedPositions = (round.selected_positions || []).map((index) => toPosition(index, cols));

    return {
      question_id: "q" + round.question_index,
      question_index: round.question_index,
      question_type: "position_memory",
      cognitive_domain: "memory_activity",
      game_mode: "position_memory",
      difficulty: toDifficultyCode(round.effectiveDifficulty || round.difficulty),
      prompt_type: "visual",
      grid_rows: round.grid_rows,
      grid_cols: round.grid_cols,
      target_count: round.target_count,
      exposure_time_ms: round.exposure_time_ms,
      target_positions: targetPositions,
      selected_positions: selectedPositions,
      correct_answer: targetPositions,
      selected_answer: selectedPositions,
      is_correct: Boolean(round.is_correct),
      attempt_count: round.attempt_count,
      hint_used: Boolean(round.hint_used),
      hint_count: round.hint_count,
      retry_count: round.wrongClickCount || round.wrong_tap_count || 0,
      replay_count: round.replay_count || 0,
      response_time_ms: round.response_time_ms || 0,
      first_response_time_ms: round.first_response_time_ms || 0,
      changed_answer_count: round.changed_answer_count || 0,
      wrong_tap_count: round.wrong_tap_count || 0,
      near_miss: Boolean(round.near_miss),
      input_type: (round.input_types && round.input_types[0]) || "touch",
      raw_log_json: round
    };
  }

  function buildMetrics(roundLogs, totalQuestions, rawRounds) {
    const sourceRounds = rawRounds || [];
    const playedRoundCount = roundLogs.length;
    const correctRoundCount = roundLogs.filter((round) => round.is_correct).length;
    const failedRoundCount = playedRoundCount - correctRoundCount;
    const timeoutRoundCount = sourceRounds.filter((round) => round.failReason === "timeout").length;
    const correctClickCount = sourceRounds.reduce((sum, round) => sum + (round.correctClickCount || 0), 0);
    const wrongClickCount = sourceRounds.reduce((sum, round) => sum + (round.wrongClickCount || round.wrong_tap_count || 0), 0);
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

  function buildConfigSnapshot(gameState, beforeSkipped, afterSkipped) {
    const modeConfig = gameState.modeConfig || {};
    const difficulty = gameState.difficulty || {};

    return {
      show_timer: Boolean(modeConfig.showTimer),
      show_score: Boolean(modeConfig.showScore),
      show_difficulty_select: Boolean(modeConfig.showDifficultySelect),
      show_settings: Boolean(modeConfig.showSettings),
      show_how_to_play: Boolean(modeConfig.showHowTo),
      show_condition_check: !beforeSkipped,
      allow_condition_skip: Boolean(modeConfig.allowConditionSkip),
      show_finish_check: !afterSkipped,
      allow_finish_skip: Boolean(modeConfig.allowFinishSkip),
      question_count: gameState.totalQuestions,
      grid_rows: difficulty.gridRows,
      grid_cols: difficulty.gridCols,
      target_count: difficulty.targetCount,
      max_target_count: modeConfig.maxTargetCount || difficulty.targetCount,
      exposure_time_ms: modeConfig.exposureTimeMs,
      allow_replay: Boolean(modeConfig.showReplay),
      replay_limit: modeConfig.replayLimit || 0,
      hint_enabled: Boolean(modeConfig.hintEnabled),
      auto_hint_enabled: Boolean(modeConfig.autoHintEnabled),
      position_hint_type: modeConfig.positionHintType || "",
      flash_effect_level: modeConfig.flashEffectLevel,
      high_contrast: Boolean(modeConfig.highContrast),
      soft_feedback: Boolean(modeConfig.softFeedback),
      voice_guide_enabled: Boolean(modeConfig.voiceGuideEnabled),
      result_log_level: modeConfig.resultLogLevel || "detailed"
    };
  }

  function normalizeExitReason(status, exitReason) {
    if (status === "completed") {
      return "completed";
    }
    if (exitReason === "total_timeout" || exitReason === "timeout") {
      return "time_over";
    }
    return exitReason || "unknown";
  }

  function buildResultDetail(gameState) {
    const rawRounds = gameState.questionResults.slice();
    const cols = gameState.difficulty.gridCols;
    const roundLogs = rawRounds.map((round) => roundToLog(round, cols));
    const responseTimes = roundLogs.map((item) => item.response_time_ms).filter((time) => time > 0);
    const totalQuestions = gameState.totalQuestions;
    const completed = rawRounds.length >= totalQuestions && !gameState.exitedEarly && !gameState.exitReason;
    const totalPlayMs = Math.max(0, gameState.endedAt - gameState.startedAt);
    const metrics = buildMetrics(roundLogs, totalQuestions, rawRounds);
    const status = gameState.errorCode ? "error" : completed ? "completed" : "abandoned";
    const sessionMeta = gameState.sessionMeta || {};
    const beforeSkipped = Boolean((gameState.condition && gameState.condition.skipped) || gameState.modeConfig.showConditionCheck === false);
    const afterSkipped = Boolean((gameState.finishCheck && gameState.finishCheck.skipped) || gameState.modeConfig.showFinishCheck === false);
    const roundTimeLimitSec = gameState.modeConfig.roundTimeLimitMs ? Math.round(gameState.modeConfig.roundTimeLimitMs / 1000) : 0;
    const endedAtIso = nowIso();
    const exitReason = normalizeExitReason(status, gameState.exitReason);
    const abandonedAt = status === "abandoned" ? endedAtIso : null;
    const completedQuestionCount = metrics.playedRoundCount;
    const retryCount = metrics.wrongClickCount;
    const configSnapshot = buildConfigSnapshot(gameState, beforeSkipped, afterSkipped);
    const seniorId = sessionMeta.seniorId || gameState.userId || sessionMeta.userId || sessionMeta.anonymousUserId || null;

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
      position_hint_type: gameState.modeConfig.positionHintType,
      replay_limit: gameState.modeConfig.replayLimit || 0,
      high_contrast: Boolean(gameState.modeConfig.highContrast),
      near_miss_count: 0,
      replay_count: 0,
      difficulty_downshifted: false,
      condition_check_skipped: beforeSkipped,
      finish_check_skipped: afterSkipped,
      rounds: roundLogs
    };
    const resultDetailJson = {
      grid_size: resultDetail.grid_size,
      grid_rows: resultDetail.grid_rows,
      grid_cols: resultDetail.grid_cols,
      target_count: resultDetail.target_count,
      max_target_count: resultDetail.max_target_count,
      exposure_time_ms: resultDetail.exposure_time_ms,
      flash_effect_level: resultDetail.flash_effect_level,
      high_contrast: resultDetail.high_contrast,
      near_miss_count: resultDetail.near_miss_count,
      replay_count: resultDetail.replay_count,
      difficulty_downshifted: resultDetail.difficulty_downshifted,
      flower_distractor_enabled: false,
      flower_distractor_start_question: null,
      condition_check_skipped: resultDetail.condition_check_skipped,
      finish_check_skipped: resultDetail.finish_check_skipped
    };
    const processDataJson = {
      hint_count: metrics.hintCount,
      retry_count: retryCount,
      pause_count: gameState.pauseCount || 0,
      interaction_count: gameState.interactionCount || metrics.interactionCount,
      avg_response_time_ms: average(responseTimes),
      completion_rate: metrics.completionRate,
      condition_data: beforeSkipped ? null : gameState.condition || null,
      post_game_condition_data: afterSkipped ? null : gameState.finishCheck || null,
      external_inputs: gameState.externalInputs || []
    };
    const gameResultJson = {
      status: status,
      mode: gameState.mode,
      app_mode: gameState.mode,
      game_mode: "position_memory",
      difficulty: toDifficultyCode(gameState.difficultyKey),
      config_snapshot: configSnapshot,
      total_questions: totalQuestions,
      completed_question_count: completedQuestionCount,
      correct_count: metrics.correctRoundCount,
      wrong_count: metrics.failedRoundCount,
      hint_count: metrics.hintCount,
      retry_count: retryCount,
      pause_count: gameState.pauseCount || 0,
      interaction_count: gameState.interactionCount || metrics.interactionCount,
      avg_response_time_ms: average(responseTimes),
      completion_rate: metrics.completionRate,
      completed: completed,
      exit_reason: exitReason,
      legacy_exit_reason: gameState.exitReason || null,
      abandoned_at: abandonedAt,
      abandon_reason: status === "abandoned" ? exitReason : null,
      error_code: gameState.errorCode || null,
      error_message: gameState.errorMessage || null,
      error_phase: gameState.errorPhase || null,
      question_logs: roundLogs,
      result_detail_json: resultDetailJson,
      process_data_json: processDataJson
    };

    const result = {
      session_id: gameState.sessionId || buildSessionId(),
      senior_id: seniorId,
      user_id: gameState.userId || sessionMeta.userId || null,
      anonymous_user_id: sessionMeta.anonymousUserId || null,
      guardian_id: sessionMeta.guardianId,
      assignment_id: sessionMeta.assignmentId,
      alarm_id: sessionMeta.alarmId,
      schedule_id: sessionMeta.scheduleId,
      tenant_id: sessionMeta.tenantId,
      facility_id: sessionMeta.facilityId,
      program_id: sessionMeta.programId,
      reward_id: sessionMeta.rewardId,
      recommendation_id: sessionMeta.recommendationId,
      content_id: sessionMeta.contentId,
      game_key: sessionMeta.gameKey || "light_memory",
      game_version: sessionMeta.gameVersion || gameState.gameVersion || "1.0.0",
      play_source: sessionMeta.playSource || "manual",
      status: status,
      mode: gameState.mode,
      app_mode: gameState.mode,
      game_mode: "position_memory",
      difficulty: toDifficultyCode(gameState.difficultyKey),
      config_snapshot: configSnapshot,
      started_at: gameState.startedAtIso,
      ended_at: endedAtIso,
      duration_ms: totalPlayMs,
      total_questions: totalQuestions,
      completed_question_count: completedQuestionCount,
      correct_count: metrics.correctRoundCount,
      wrong_count: metrics.failedRoundCount,
      hint_count: metrics.hintCount,
      retry_count: retryCount,
      pause_count: gameState.pauseCount || 0,
      interaction_count: gameState.interactionCount || metrics.interactionCount,
      avg_response_time_ms: average(responseTimes),
      completion_rate: metrics.completionRate,
      exit_reason: exitReason,
      condition_check_skipped: beforeSkipped,
      finish_check_skipped: afterSkipped,
      abandoned_at: abandonedAt,
      abandon_reason: status === "abandoned" ? exitReason : null,
      error_code: gameState.errorCode || null,
      error_message: gameState.errorMessage || null,
      error_phase: gameState.errorPhase || null,
      external_inputs: gameState.externalInputs || [],
      question_logs: roundLogs,
      result_detail_json: resultDetailJson,
      process_data_json: processDataJson,
      client_context: sessionMeta.clientContext,
      voice_context: sessionMeta.voiceContext,
      meta: sessionMeta.meta,
      game_result: gameResultJson,
      game_result_json: gameResultJson
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
