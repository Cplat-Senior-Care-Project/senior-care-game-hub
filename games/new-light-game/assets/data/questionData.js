(function (global) {
  "use strict";

  global.QUESTION_DATA = {
    documentId: "CNT-LGT-001",
    version: "0.2",
    generationType: "javascript_random",
    themes: ["theme_bulb", "theme_bird", "theme_phone"],
    objectIds: {
      bulbOff: "object_bulb_off",
      bulbOn: "object_bulb_on",
      flower: "object_flower",
      bird: "object_bird",
      phoneOff: "object_phone_off",
      phoneOn: "object_phone_on"
    },
    rules: {
      standard: {
        easy: { gridSize: 2, targetCount: 2, roundCount: 10, exposureTimeMs: 5000 },
        normal: { gridSize: 3, targetCount: 3, roundCount: 10, exposureTimeMs: 5000 },
        hard: { gridSize: 4, targetCount: 4, roundCount: 10, exposureTimeMs: 5000, flowerStartsFromRound: 6 }
      },
      reminder: { gridSize: 3, targetCount: 3, roundCount: 5, exposureTimeMs: 5000 },
      care: { gridSize: 2, targetCount: 1, roundCount: 4, exposureTimeMs: 8000, autoHintDelaySec: 40 },
      ai_assisted: { gridSize: 2, targetCount: 1, roundCount: 4, exposureTimeMs: 8000, autoHintDelaySec: 40 }
    }
  };
})(window);
