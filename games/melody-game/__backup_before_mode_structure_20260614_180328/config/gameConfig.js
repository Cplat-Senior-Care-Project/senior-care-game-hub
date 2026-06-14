(function () {
  "use strict";

  window.GAME_CONFIG = {
    easy: {
      label: "쉬움",
      padCount: 3,
      symbolCount: 3,
      trialTimeLimit: 10,
      previewEnabled: true,
      xPatternEnabled: false,
      sessionTime: 60,
      targetNoteCount: 8
    },
    normal: {
      label: "보통",
      padCount: 4,
      symbolCount: 4,
      trialTimeLimit: 10,
      previewEnabled: true,
      xPatternEnabled: false,
      sessionTime: 60,
      targetNoteCount: 12
    },
    hard: {
      label: "어려움",
      padCount: 4,
      symbolCount: 4,
      trialTimeLimit: 8,
      previewEnabled: false,
      xPatternEnabled: true,
      sessionTime: 60,
      targetNoteCount: 16
    }
  };

  window.SYMBOL_CONFIG = [
    {
      id: "triangle",
      label: "보라색 세모",
      shortLabel: "세모",
      shapeClass: "shape-triangle"
    },
    {
      id: "square",
      label: "초록색 네모",
      shortLabel: "네모",
      shapeClass: "shape-square"
    },
    {
      id: "circle",
      label: "파란색 원",
      shortLabel: "원",
      shapeClass: "shape-circle"
    },
    {
      id: "star",
      label: "노란색 별",
      shortLabel: "별",
      shapeClass: "shape-star"
    }
  ];
})();
