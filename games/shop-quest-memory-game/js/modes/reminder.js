(function (global) {
  "use strict";
  global.ShopQuestMemoryGameMode = {
    id: "reminder",
    apply(config) {
      config.totalQuestions = 10;
      config.durationSeconds = 120;
      config.autoHintEnabled = false;
      config.difficultyKey = config.difficultyKey || "easy";
      config.ui.showDifficultySelect = false;
      return config;
    }
  };
})(window);
