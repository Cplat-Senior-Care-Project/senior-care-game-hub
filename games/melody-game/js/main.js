(function () {
  "use strict";

  const audio = new window.MelodyAudio();
  let flow = null;

  const game = new window.MelodyDrumGame({
    audio,
    onFinish(result) {
      if (window.ResultBridge) {
        window.ResultBridge.handleSessionComplete(result);
      }
      window.ResultManager.renderResult(result);
      if (flow) {
        flow.showScreen("result");
      }
    }
  });

  flow = new window.MelodyScreenFlow({ audio, game });
  flow.init();
})();