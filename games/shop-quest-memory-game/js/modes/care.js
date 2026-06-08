(function (global) {
  "use strict";
  global.ShopQuestMemoryGameMode = {
    id: "care",
    apply(config) {
      config.difficultyKey = config.difficultyKey || "easy";
      config.totalQuestions = 5;
      config.useDrag = false;
      config.autoAddToCart = true;
      config.ui.showTimer = false;
      config.ui.showProgress = false;
      config.ui.showScore = false;
      config.ui.showSettings = false;
      config.ui.showTutorial = false;
      config.ui.showDifficultySelect = false;
      config.ui.showConditionCheck = false;
      config.ui.showFinishCheck = false;
      return config;
    }
  };
})(window);
