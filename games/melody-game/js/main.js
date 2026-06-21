(function () {
  "use strict";

  const audio = new window.MelodyAudio();
  let flow = null;

  const game = new window.MelodyDrumGame({
    audio,
    onFinish(result, options) {
      const shouldSubmit = !options || options.submit !== false;
      if (shouldSubmit && window.ResultBridge) {
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
