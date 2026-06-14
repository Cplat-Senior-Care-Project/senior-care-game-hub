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
      input_modes_enabled: state.runtimeConfig && state.runtimeConfig.inputModesEnabled
        ? state.runtimeConfig.inputModesEnabled
        : ["touch", "external"],
      config_snapshot: state.runtimeConfig || {}
    };
  }

  function renderResult(result) {
    const setText = (id, text) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = text;
      }
    };

    setText("resultSongTitle", result.song_title);
    setText("resultProgress", `${result.progress_rate}%`);
    setText("resultCorrect", result.correct_count);
    setText("resultWrong", result.wrong_count);
    setText("resultMissed", result.missed_count);
    setText("resultSuccessRate", `${result.success_rate}%`);
    setText("resultAverageTime", `${result.average_reaction_time_ms}ms`);
    setText("resultXSuccess", result.x_success_count);
    setText("resultXFail", result.x_fail_count);
  }

  window.ResultManager = {
    calculateResult,
    renderResult
  };
})();
