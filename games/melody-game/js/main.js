(function () {
  "use strict";

  const audio = new window.MelodyAudio();
  let flow = null;

  const game = new window.MelodyDrumGame({
    audio,
    onFinish(result, options) {
      if (flow && typeof flow.handleGameFinish === "function") {
        flow.handleGameFinish(result, options);
        return;
      }

      const shouldSubmit = !options || options.submit !== false;
      if (shouldSubmit && window.ResultBridge) {
        if (result && result.status === "abandoned" && typeof window.ResultBridge.handleSessionAbort === "function") {
          window.ResultBridge.handleSessionAbort(result, result.exit_reason || result.ended_reason || "abandoned");
        } else if (result && result.status === "error" && typeof window.ResultBridge.handleGameError === "function") {
          window.ResultBridge.handleGameError(result, result);
        } else {
          window.ResultBridge.handleSessionComplete(result);
        }
      }
      window.ResultManager.renderResult(result);
      if (flow) {
        flow.showScreen("result");
      }
    },
    onRestart(difficulty) {
      if (flow && typeof flow.restartGame === "function") {
        flow.restartGame(difficulty);
      }
    }
  });

  function parseHostMessageData(data) {
    if (typeof data !== "string") {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  function submitExternalAnswer(payload) {
    if (!game || typeof game.handleExternalAnswer !== "function") {
      return { accepted: false, reason: "external_input_unavailable" };
    }

    const result = game.handleExternalAnswer(payload || {});
    if (window.MelodyGameAppBridge && typeof window.MelodyGameAppBridge.sendMessage === "function") {
      window.MelodyGameAppBridge.sendMessage("EXTERNAL_ANSWER_RESULT", result);
    }
    return result;
  }

  function handleExternalAnswerMessage(event) {
    const rawData = event && event.data !== undefined ? event.data : event && event.detail;
    const data = parseHostMessageData(rawData);
    if (!data) {
      return;
    }

    if (data.type === "EXTERNAL_ANSWER") {
      submitExternalAnswer(data.payload || {});
      return;
    }

    if (event && event.type === "melody-drum:external-answer") {
      submitExternalAnswer(data.payload || data);
    }
  }

  flow = new window.MelodyScreenFlow({ audio, game });
  try {
    flow.init();
    if (window.ResultBridge && typeof window.ResultBridge.handleGameReady === "function") {
      window.ResultBridge.handleGameReady();
    }
  } catch (error) {
    if (window.ResultBridge && typeof window.ResultBridge.handleGameError === "function") {
      window.ResultBridge.handleGameError(error);
    }
    throw error;
  }

  window.MelodyExternalInput = {
    submitAnswer: submitExternalAnswer,
    submitExternalAnswer
  };

  window.addEventListener("message", handleExternalAnswerMessage);
  window.addEventListener("melody-drum:external-answer", handleExternalAnswerMessage);

  window.addEventListener("pagehide", () => {
    if (!game.state || game.state.ended || !window.ResultBridge || typeof window.ResultBridge.handleSessionAbort !== "function") {
      return;
    }

    const result = window.ResultManager.calculateResult(game.state);
    result.status = "abandoned";
    result.completed = false;
    result.exit_reason = "app_background";
    result.ended_reason = "app_background";
    result.abandon_reason = "app_background";
    window.ResultBridge.handleSessionAbort(result, "app_background");
  });
})();
