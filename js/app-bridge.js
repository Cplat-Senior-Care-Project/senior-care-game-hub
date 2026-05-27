(function (global) {
  "use strict";

  // Replace this mock bridge when the app message contract is finalized.
  const DEFAULT_MOCK_CONFIG = Object.freeze({
    gameId: "fruit-count-memory-game",
    sessionId: "mock-session",
    difficultyKey: null,
    durationSeconds: 120,
    totalQuestions: 10
  });

  function createMockConfig() {
    const override = global.__FRUIT_COUNT_MEMORY_GAME_MOCK_CONFIG__ || global.__SSOK_COUNT_FINDER_MOCK_CONFIG__ || {};
    return {
      ...DEFAULT_MOCK_CONFIG,
      ...override,
      receivedAt: new Date().toISOString()
    };
  }

  function sendMockMessage(name, payload) {
    if (!global.console) {
      return;
    }

    global.console.log(`[mock app bridge] ${name}`, payload);
  }

  const mockBridge = {
    getRunConfig() {
      return Promise.resolve(createMockConfig());
    },

    sendComplete(result) {
      sendMockMessage("GAME_COMPLETE", result);
    },

    sendError(error) {
      sendMockMessage("GAME_ERROR", error);
    }
  };

  global.FruitCountMemoryGameAppBridge = global.FruitCountMemoryGameAppBridge || mockBridge;
  global.SsokCountFinderAppBridge = global.SsokCountFinderAppBridge || global.FruitCountMemoryGameAppBridge;
})(window);
