(function (global) {
  "use strict";

  global.FruitCountMemoryGameMode = {
    id: "care",
    apply: function (context) {
      var config = context && context.config;
      if (config && config.ui) {
        config.ui.showTutorial = false;
        config.ui.showDifficultySelect = false;
        config.ui.showConditionCheck = false;
        config.ui.showFinishCheck = false;
      }
      document.documentElement.classList.add("is-care-mode");
    }
  };
})(window);
