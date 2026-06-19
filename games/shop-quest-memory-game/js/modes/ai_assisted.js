(function (global) {
  "use strict";
  global.ShopQuestMemoryGameMode = {
    id: "ai_assisted",
    apply(config) {
      config.difficultyKey = config.difficultyKey || "easy";
      config.totalQuestions = Math.min(config.totalQuestions || 5, 5);
      config.memoryItemCount = 1;
      config.answerChoiceCount = 2;
      config.useDrag = false;
      config.autoAddToCart = true;
      config.externalInput = Object.assign({ enabled: true, source: "app_or_ai" }, config.externalInput || {});
      config.ui.showTimer = false;
      config.ui.showProgress = false;
      config.ui.showScore = false;
      config.ui.showSettings = true;
      config.ui.showTutorial = false;
      config.ui.showDifficultySelect = false;
      config.ui.showConditionCheck = false;
      config.ui.showFinishCheck = false;
      return config;
    }
  };
})(window);
