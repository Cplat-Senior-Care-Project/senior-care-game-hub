(function () {
  "use strict";

  window.GAME_CONFIG = {
    easy: {
      label: "\uc26c\uc6c0",
      padCount: 2,
      symbolCount: 2,
      previewEnabled: true,
      xPatternEnabled: false,
      xHoldSeconds: 2,
      sessionTime: 60
    },
    normal: {
      label: "\ubcf4\ud1b5",
      padCount: 3,
      symbolCount: 3,
      previewEnabled: true,
      xPatternEnabled: false,
      xHoldSeconds: 2,
      sessionTime: 60
    },
    hard: {
      label: "\uc5b4\ub824\uc6c0",
      padCount: 4,
      symbolCount: 4,
      previewEnabled: true,
      xPatternEnabled: true,
      xHoldSeconds: 2,
      sessionTime: 60
    }
  };

  window.SYMBOL_CONFIG = [
    {
      id: "triangle",
      label: "\ube68\uac04\uc0c9 \uc138\ubaa8",
      shortLabel: "\uc138\ubaa8",
      shapeClass: "shape-triangle"
    },
    {
      id: "square",
      label: "\ud30c\ub780\uc0c9 \ub124\ubaa8",
      shortLabel: "\ub124\ubaa8",
      shapeClass: "shape-square"
    },
    {
      id: "circle",
      label: "\ucd08\ub85d\uc0c9 \uc6d0",
      shortLabel: "\uc6d0",
      shapeClass: "shape-circle"
    },
    {
      id: "star",
      label: "\ub178\ub780\uc0c9 \ubcc4",
      shortLabel: "\ubcc4",
      shapeClass: "shape-star"
    }
  ];
})();
