(function (global) {
  "use strict";

  global.FruitCountMemoryGameMode = {
    id: "ai_assisted",
    apply: function () {
      document.documentElement.classList.add("is-ai-assisted-mode");
    }
  };
})(window);