(function () {
  "use strict";

  function average(values) {
    if (!values.length) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return Math.round(total / values.length);
  }

  function calculateResult(state) {
    const reactionTimes = state.reactionTimes.slice();
    const completed = state.completedNoteCount;
    const target = state.config.targetNoteCount;
    const totalTrials = state.totalTrials;
    const successRate = totalTrials > 0 ? Math.round((state.correctCount / totalTrials) * 100) : 0;
    const progressRate = 100;
    const playTimeSec = Math.max(0, Math.round((state.config.sessionTime || 0) - (state.sessionRemaining || 0)));
    const conditionCheck = state.conditionCheck
      || state.condition
      || (state.runtimeConfig && (state.runtimeConfig.conditionCheck || state.runtimeConfig.condition_check))
      || { skipped: true };
    const conditionSkipped = Boolean(conditionCheck.skipped);

    return {
      game_name: "kungjak_melody_drum",
      session_id: state.sessionId || null,
      content_id: state.contentId || "kungjak_melody_drum",
      game_key: state.gameKey || "kungjak_melody_drum",
      mode: state.mode || "standard",
      difficulty: state.difficulty,
      started_at: state.startedAt || null,
      ended_at: new Date().toISOString(),
      song_id: state.song.id,
      song_title: state.song.title,
      session_time_sec: state.config.sessionTime,
      play_time_sec: playTimeSec,
      duration_ms: playTimeSec * 1000,
      target_note_count: target,
      completed_note_count: completed,
      progress_rate: progressRate,
      total_trials: totalTrials,
      correct_count: state.correctCount,
      wrong_count: state.wrongCount,
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
      hint_triggered_count: state.hintTriggeredCount,
      condition: {
        before: conditionSkipped ? null : conditionCheck,
        after: null
      },
      condition_check: conditionCheck,
      condition_check_skipped: conditionSkipped,
      finish_check: state.finishCheck || {},
      finish_check_skipped: false,
      input_modes_enabled: state.runtimeConfig && state.runtimeConfig.inputModesEnabled
        ? state.runtimeConfig.inputModesEnabled
        : ["touch", "external"],
      config_snapshot: state.runtimeConfig || {}
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
    const targetCount = Number(safeResult.target_note_count || safeResult.total_trials) || 0;
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

    if (safeResult.mode === "reminder") {
      renderReminderResult(safeResult, setText);
    }
  }

  function renderReminderResult(result, setText) {
    const totalQuestions = Number(result.total_questions || result.total_trials || result.target_note_count) || 0;
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
