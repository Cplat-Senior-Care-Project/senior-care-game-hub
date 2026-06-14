(function () {
  "use strict";

  let pendingAutoReturn = null;

  function post(type, payload) {
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

  function buildCommonPayload(result, completed) {
    const runtime = runtimeSnapshot();
    const detail = {
      session: {
        session_id: result.session_id || runtime.sessionId || null,
        content_id: result.content_id || runtime.contentId || "kungjak_melody_drum",
        game_key: result.game_key || runtime.gameKey || "kungjak_melody_drum",
        mode: result.mode || runtime.mode || "standard",
        difficulty: result.difficulty || runtime.difficulty || "normal",
        started_at: result.started_at || null,
        ended_at: result.ended_at || new Date().toISOString(),
        completed
      },
      performance: result,
      config_snapshot: result.config_snapshot || runtime.configSnapshot || runtime
    };

    return {
      session_id: detail.session.session_id,
      content_id: detail.session.content_id,
      game_key: detail.session.game_key,
      mode: detail.session.mode,
      difficulty: detail.session.difficulty,
      completed,
      total_questions: result.target_note_count || 0,
      correct_count: result.correct_count || 0,
      wrong_count: result.wrong_count || 0,
      score: result.success_rate || 0,
      progress_rate: result.progress_rate || 0,
      result_detail_json: detail
    };
  }

  function submitToCollector(payload) {
    const runtime = runtimeSnapshot();
    if (!runtime.resultEndpoint || !window.fetch) return;

    window.fetch(runtime.resultEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  function handleSessionStart(state) {
    const runtime = runtimeSnapshot();
    post("SESSION_START", {
      session_id: state.sessionId || runtime.sessionId || null,
      content_id: state.contentId || runtime.contentId || "kungjak_melody_drum",
      game_key: state.gameKey || runtime.gameKey || "kungjak_melody_drum",
      mode: state.mode || runtime.mode || "standard",
      difficulty: state.difficulty || runtime.difficulty || "normal",
      config_snapshot: state.runtimeConfig || runtime
    });
  }

  function handleSessionComplete(result) {
    const payload = buildCommonPayload(result, true);
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

  function handleSessionAbort(state, reason) {
    const runtime = runtimeSnapshot();
    post("SESSION_ABORT", {
      session_id: state && state.sessionId ? state.sessionId : runtime.sessionId || null,
      content_id: state && state.contentId ? state.contentId : runtime.contentId || "kungjak_melody_drum",
      game_key: state && state.gameKey ? state.gameKey : runtime.gameKey || "kungjak_melody_drum",
      mode: state && state.mode ? state.mode : runtime.mode || "standard",
      difficulty: state && state.difficulty ? state.difficulty : runtime.difficulty || "normal",
      reason: reason || "abort",
      config_snapshot: state && state.runtimeConfig ? state.runtimeConfig : runtime
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
    handleSessionStart,
    handleSessionComplete,
    handleSessionAbort,
    returnToHost
  };
})();