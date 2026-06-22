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
        window.ResultBridge.handleSessionComplete(result);
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

  flow = new window.MelodyScreenFlow({ audio, game });
  flow.init();
})();
