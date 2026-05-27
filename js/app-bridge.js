(function (global) {
  "use strict";

  // Replace this mock bridge when the app message contract is finalized.
  const DEFAULT_MOCK_CONFIG = Object.freeze({
    gameId: "fruit-count-memory-game",
    sessionId: "mock-session",
    difficultyKey: null,
    durationSeconds: 120,
    totalQuestions: 10,
    difficulties: {
      easy: {
        revealMs: 3000,
        startRange: [2, 3],
        endRange: [3, 4],
        minTypes: 1,
        maxTypes: 1,
        shuffleCards: false
      },
      normal: {
        revealMs: 3000,
        startRange: [4, 5],
        endRange: [5, 6],
        minTypes: 2,
        maxTypes: 3,
        shuffleCards: false
      },
      hard: {
        revealMs: 3000,
        startRange: [5, 6],
        endRange: [6, 7],
        minTypes: 3,
        maxTypes: 4,
        shuffleCards: true
      }
    }
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

    sendReady(payload) {
      sendMockMessage("GAME_READY", payload);
    },

    sendStarted(payload) {
      sendMockMessage("GAME_STARTED", payload);
    },

    sendComplete(result) {
      sendMockMessage("GAME_COMPLETED", result);
    },

    sendError(error) {
      sendMockMessage("GAME_ERROR", error);
    }
  };

  global.FruitCountMemoryGameAppBridge = global.FruitCountMemoryGameAppBridge || mockBridge;
  global.SsokCountFinderAppBridge = global.SsokCountFinderAppBridge || global.FruitCountMemoryGameAppBridge;
})(window);
