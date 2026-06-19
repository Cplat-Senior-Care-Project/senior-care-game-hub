(function (global) {
  "use strict";

  global.FruitCountMemoryGameMode = {
    id: "ai_assisted",
    apply: function (context) {
      var config = context && context.config;
      if (config && config.ui) {
        config.ui.showTutorial = false;
        config.ui.showDifficultySelect = false;
        config.ui.showConditionCheck = false;
        config.ui.showFinishCheck = false;
      }
      document.documentElement.classList.add("is-ai-assisted-mode", "is-care-mode");
    }
  };
})(window);
