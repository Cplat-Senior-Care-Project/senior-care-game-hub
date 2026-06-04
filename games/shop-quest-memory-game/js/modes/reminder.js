(function (global) {
  "use strict";
  global.ShopQuestMemoryGameMode = {
    id: "reminder",
    apply(config) {
      config.ui.showDifficultySelect = false;
      return config;
    }
  };
})(window);