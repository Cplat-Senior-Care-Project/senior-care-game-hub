(function (global) {
  "use strict";

  global.QUESTION_DATA = {
    documentId: "CNT-LGT-001",
    version: "0.2",
    generationType: "javascript_random",
    themes: ["theme_bulb"],
    objectIds: {
      bulbOff: "object_bulb_off",
      bulbOn: "object_bulb_on"
    },
    rules: {
      standard: {
        easy: { gridSize: 2, targetCount: 2, roundCount: 10, exposureTimeMs: 3000 },
        normal: { gridSize: 3, targetCount: 3, roundCount: 10, exposureTimeMs: 3000 },
        hard: { gridRows: 3, gridCols: 4, targetCount: 4, roundCount: 10, exposureTimeMs: 3000 }
      },
      reminder: { gridSize: 3, targetCount: 3, roundCount: 5, exposureTimeMs: 3000 },
      care: { gridSize: 2, targetCount: 1, roundCount: 4, exposureTimeMs: 3000, autoHintDelaySec: 40 },
      ai_assisted: { gridSize: 2, targetCount: 1, roundCount: 4, exposureTimeMs: 3000, autoHintDelaySec: 40 }
    }
  };
})(window);
