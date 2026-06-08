(function () {
  "use strict";

  const GAME_ID = "shop-quest-memory-game";
  const STORAGE_KEY_PREFIX = "shop_quest_memory_game_last_result";
  const EXTERNAL_INPUT_API_NAME = "ShopQuestMemoryGameExternalInput";
  const EXTERNAL_ANSWER_MESSAGE_TYPE = "SHOP_QUEST_EXTERNAL_ANSWER";
  const EXTERNAL_ANSWER_MESSAGE_TYPE_ALIAS = "EXTERNAL_ANSWER";
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const FEEDBACK_TIME = 1400;
  const TRANSITION_TIME = 1300;
  const AUTO_HINT_DELAY_MS = 10000;
  const STANDARD_REVEAL_MS = 3000;
  const MAX_MEMORY_ITEMS = 6;
  const RACE_POINTS = Object.freeze([16, 50, 84, 94]);
  const MEMORY_LAYOUT_MIN_CARD = 38;
  const MEMORY_LAYOUT_CARD_SIZE = 146;
  const MEMORY_LAYOUT_MIN_GAP = 4;
  const MEMORY_LAYOUT_MAX_GAP = 8;
  const MEMORY_LAYOUT_MAX_COLUMNS = 7;
  const ITEM_GLOW_ASSET_VERSION = "20260607-strong-glow";
  const STATIC_IMAGE_ASSETS = Object.freeze([
    "assets/images/background2.webp",
    "assets/images/play_background.webp",
    "assets/images/title2.webp",
    "assets/images/ui-touch2.webp",
    "assets/images/ui-drag2.webp",
    "assets/images/stand2.webp",
    "assets/images/basket2.webp"
  ]);
  const HUD_DIFFICULTIES = Object.freeze({
    easy: { index: 0, label: "\uC26C\uC6C0", runner: "\uD83D\uDE42" },
    normal: { index: 1, label: "\uBCF4\uD1B5", runner: "\uD83D\uDE0A" },
    hard: { index: 2, label: "\uC5B4\uB824\uC6C0", runner: "\uD83E\uDD29" }
  });

  const SHOPPING_ITEMS = Object.freeze([
    { id: "apple", name: "사과", image: `assets/images/item-cutout-apple-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/apple.webp", category: "fruit", shape: "round", color: "red" },
    { id: "banana", name: "바나나", image: `assets/images/item-cutout-banana-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/banana.webp", category: "fruit", shape: "long", color: "yellow" },
    { id: "orange", name: "오렌지", image: `assets/images/item-cutout-orange-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/orange.webp", category: "fruit", shape: "round", color: "orange" },
    { id: "watermelon", name: "수박", image: `assets/images/item-cutout-watermelon-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/watermelon.webp", category: "fruit", shape: "round", color: "green" },
    { id: "bread", name: "빵", image: `assets/images/item-cutout-bread-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/bread.webp", category: "food", shape: "box", color: "brown" },
    { id: "cheese", name: "치즈", image: `assets/images/item-cutout-cheese-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/cheese.webp", category: "food", shape: "box", color: "yellow" },
    { id: "carrot", name: "당근", image: `assets/images/item-cutout-carrot-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/carrot.webp", category: "vegetable", shape: "long", color: "orange" },
    { id: "vegetable", name: "채소", image: `assets/images/item-cutout-vegetable-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/baechu.webp", category: "vegetable", shape: "leaf", color: "green" },
    { id: "fish", name: "생선", image: `assets/images/item-cutout-fish-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/fish.webp", category: "meat", shape: "long", color: "blue" },
    { id: "meat", name: "고기", image: `assets/images/item-cutout-meat-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: "assets/images/meat.webp", category: "meat", shape: "box", color: "red" }
  ]);

  const DEFAULT_DIFFICULTIES = Object.freeze({
    easy: { key: "easy", label: "쉬움", memoryItemCount: 1, answerChoiceCount: 2, revealMs: 3000 },
    normal: { key: "normal", label: "보통", memoryItemCount: 2, answerChoiceCount: 4, revealMs: 3000 },
    hard: { key: "hard", label: "어려움", memoryItemCount: 3, answerChoiceCount: 6, revealMs: 3000 }
  });

  const STANDARD_MAX_ANSWER_CHOICES = 12;
  const STANDARD_DIFFICULTY_QUESTION_PLANS = Object.freeze({
    easy: Object.freeze([
      { through: 3, memoryItemCount: 2, answerChoiceCount: 4 },
      { through: 7, memoryItemCount: 3, answerChoiceCount: 5 },
      { through: 10, memoryItemCount: 4, answerChoiceCount: 6 }
    ]),
    normal: Object.freeze([
      { through: 3, memoryItemCount: 4, answerChoiceCount: 7 },
      { through: 7, memoryItemCount: 5, answerChoiceCount: 9 },
      { through: 10, memoryItemCount: 6, answerChoiceCount: 10 }
    ]),
    hard: Object.freeze([
      { through: 3, memoryItemCount: 5, answerChoiceCount: 9 },
      { through: 6, memoryItemCount: 6, answerChoiceCount: 11 },
      { through: 10, memoryItemCount: 6, answerChoiceCount: 12 }
    ])
  });

  const CARE_DIFFICULTIES = Object.freeze({
    easy: Object.freeze({ memoryItemCount: 1, answerChoiceCount: 2 }),
    normal: Object.freeze({ memoryItemCount: 2, answerChoiceCount: 4 }),
    hard: Object.freeze({ memoryItemCount: 3, answerChoiceCount: 9 })
  });

  const TUTORIAL_STEPS = Object.freeze([
    { message: "잠깐 보여주는 물건을 기억해주세요.", previewIds: ["apple", "orange", "bread"] },
    { message: "물건이 사라지면 같은 물건을 찾아 장바구니에 담아주세요.", previewIds: ["banana", "carrot", "vegetable"] },
    { message: "힌트가 필요하면 힌트 버튼을 눌러 천천히 확인할 수 있어요.", previewIds: ["cheese", "fish", "meat"] }
  ]);

  const CONDITION_SLEEP_HOURS = Object.freeze([4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const CONDITION_SLEEP_DRAG_STEP_PX = 42;

  const $ = (id) => document.getElementById(id);
  const els = {
    app: $("app"), startScreen: $("start-screen"), startLoading: $("start-loading"), startLoadingFill: $("start-loading-fill"), startLoadingText: $("start-loading-text"), difficultyScreen: $("difficulty-screen"), gameScreen: $("game-screen"), resultScreen: $("result-screen"), errorScreen: $("error-screen"),
    errorTitle: $("error-title"), errorMessage: $("error-message"), startButton: $("start-button"), startExitButton: $("start-exit-button"), settingsButton: $("settings-button"), tutorialButton: $("tutorial-button"),
    difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty], [data-difficulty-index]")), difficultyBackButton: $("difficulty-back-button"), playArea: $("play-area"), hintButton: $("hint-button"), dragGhost: $("drag-ghost"),
    pauseButton: $("pause-button"), pauseModal: $("pause-modal"), resumeButton: $("resume-button"), pauseRestartButton: $("pause-restart-button"), pauseQuitButton: $("home-button"), pauseHelpButton: $("pause-help-button"),
    roundLabel: $("round-label"), timeLeft: $("time-left"), timerBox: $("timer-box"), difficultyLabel: $("difficulty-label"), stageLabel: $("stage-label"), raceWrap: document.querySelector(".race-wrap"), raceMarker: $("race-marker"), raceSteps: Array.from(document.querySelectorAll(".race-step")), resultEmoji: $("result-emoji"), resultTitle: $("result-title"), resultMessage: $("result-message"), resultCorrect: $("result-correct"), resultTotal: $("result-total"), resultHintCount: $("result-hint-count"), resultRate: $("result-rate"), resultCompare: $("result-compare"),
    restartButton: $("restart-button"), resultStartButton: $("result-start-button"), resultHomeButton: $("result-home-button"), errorHomeButton: $("error-home-button"),
    conditionModal: $("condition-modal"), conditionButtons: Array.from(document.querySelectorAll("[data-mood]")), conditionSleepDial: document.querySelector(".condition-sleep-dial"), conditionSleepRows: $("condition-sleep-rows"), conditionSleepUpButton: $("condition-sleep-up-button"), conditionSleepDownButton: $("condition-sleep-down-button"), conditionSkipButton: $("condition-skip-button"), conditionConfirmButton: $("condition-confirm-button"),
    postConditionModal: $("post-condition-modal"), postConditionPages: Array.from(document.querySelectorAll(".post-condition-page")), postConditionDots: Array.from(document.querySelectorAll(".post-condition-dot")), postConditionOptions: Array.from(document.querySelectorAll(".post-condition-option")), postConditionSkipButton: $("post-condition-skip-button"), postConditionNextButton: $("post-condition-next-button"), postConditionBackButton: $("post-condition-back-button"), postConditionConfirmButton: $("post-condition-confirm-button"),
    settingsModal: $("settings-modal"), settingsCloseButton: $("settings-close-button"), settingsExitButton: $("settings-exit-button"), inputModeButtons: Array.from(document.querySelectorAll("[data-input-mode]")), backgroundSoundToggle: $("background-sound-toggle"), soundToggle: $("sound-toggle"), voiceGuideToggle: $("voice-guide-toggle"), pauseBackgroundSoundButton: $("pause-background-sound-button"), pauseSoundButton: $("pause-sound-button"), pauseVoiceGuideButton: $("pause-voice-guide-button"),
    tutorialModal: $("tutorial-modal"), tutorialMessage: $("tutorial-message"), tutorialPreview: $("tutorial-preview"), tutorialDetail: $("tutorial-detail"), tutorialCloseButton: $("tutorial-close-button"), tutorialNextButton: $("tutorial-next-button")
  };

  const timers = { phase: null, countdown: null, game: null, feedback: null, autoHint: null };
  let runtimeConfig = null;
  let pendingStart = false;
  let tutorialIndex = 0;
  let dragSession = null;
  let suppressNextClick = false;
  let memoryLayoutFrame = null;
  let preloadGameAssetsPromise = null;
  let phaseTimerDueAt = 0;
  let phaseTimerCallback = null;
  let autoHintTimerDueAt = 0;
  let autoHintTimerCallback = null;
  let pausedPhaseTimerCallback = null;
  let pausedAutoHintTimerCallback = null;
  let reopenPauseAfterTutorial = false;
  const imageReadyCache = new Map();

  const state = {
    phase: "start", difficultyKey: "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, questionLogs: [],
    startedAt: null, endedAt: null, remainingSeconds: 0, revealRemaining: 0, questionStartedAt: null, firstResponseAt: null, status: "completed", abandonReason: null, externalInputUsed: false,
    condition: { completed: false, skipped: false, mood: "good", sleepHours: 7 },
    conditionSleepIndex: 3,
    postCondition: { completed: false, skipped: false, step: 0, moodAfter: "good", fatigue: "low", perceivedDifficulty: "justRight", neededHelp: "none", replayIntent: "yes" },
    sleepDrag: { pointerId: null, lastStepY: 0 },
    pause: { previousPhase: null, phaseRemainingMs: 0, autoHintRemainingMs: 0, startedAt: 0 },
    settings: { soundEnabled: true, voiceGuideEnabled: true, useDrag: true }
  };

  function updateGameScale() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    const verticalGutter = Math.max(0, (viewportHeight - (STAGE_HEIGHT * scale)) / (2 * scale));
    const horizontalGutter = Math.max(0, (viewportWidth - (STAGE_WIDTH * scale)) / (2 * scale));
    document.documentElement.style.setProperty("--game-scale", String(scale));
    document.documentElement.style.setProperty("--game-viewport-top-gutter", `${verticalGutter}px`);
    document.documentElement.style.setProperty("--game-viewport-side-gutter", `${horizontalGutter}px`);
  }

  function uniqueValues(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function decodeImageAsset(src) {
    if (imageReadyCache.has(src)) return imageReadyCache.get(src);

    const ready = new Promise((resolve) => {
      const image = new Image();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve(src);
      };
      const decodeOrFinish = () => {
        if (typeof image.decode === "function" && image.naturalWidth > 0) {
          image.decode().then(finish, finish);
          return;
        }
        finish();
      };

      image.decoding = "async";
      image.loading = "eager";
      image.onload = decodeOrFinish;
      image.onerror = finish;
      image.src = src;

      if (image.complete) window.setTimeout(decodeOrFinish, 0);
    });

    imageReadyCache.set(src, ready);
    return ready;
  }

  function preloadImages(sources) {
    return Promise.all(uniqueValues(sources).map(decodeImageAsset));
  }

  function preloadGameAssets() {
    if (!preloadGameAssetsPromise) {
      preloadGameAssetsPromise = preloadImages([
        ...STATIC_IMAGE_ASSETS,
        ...SHOPPING_ITEMS.flatMap((item) => [item.image, item.choiceImage])
      ]);
    }
    return preloadGameAssetsPromise;
  }

  function warmQuestionAssets(question) {
    if (!question) return preloadGameAssets();
    return preloadImages([
      "assets/images/stand2.webp",
      "assets/images/basket2.webp",
      ...question.targetItems.flatMap((item) => [item.image, item.choiceImage]),
      ...question.choiceItems.flatMap((item) => [item.image, item.choiceImage])
    ]);
  }

  function startIntroLoading() {
    if (!els.startScreen || !els.startLoadingFill || !els.startLoadingText) {
      preloadGameAssets();
      if (els.startScreen) {
        els.startScreen.classList.remove("is-loading");
        els.startScreen.classList.add("is-loaded");
      }
      document.body.dataset.loading = "false";
      return;
    }

    document.body.dataset.loading = "true";
    els.startScreen.classList.add("is-loading");
    els.startScreen.classList.remove("is-loaded");
    els.startScreen.classList.remove("is-intro-revealing");
    els.startLoadingFill.style.width = "0%";
    els.startLoadingText.textContent = "0%";

    const duration = 1800;
    const startedAt = performance.now();
    const assetsReady = preloadGameAssets();

    function update(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const percent = Math.round(easedProgress * 100);

      els.startLoadingFill.style.width = `${percent}%`;
      els.startLoadingText.textContent = `${percent}%`;

      if (progress < 1) {
        window.requestAnimationFrame(update);
        return;
      }

      els.startLoadingFill.style.width = "100%";
      els.startLoadingText.textContent = "100%";

      assetsReady.then(() => window.setTimeout(() => {
        els.startScreen.classList.remove("is-loading");
        els.startScreen.classList.add("is-loaded");
        document.body.dataset.loading = "false";
        els.startScreen.classList.add("is-intro-revealing");
        window.setTimeout(() => {
          els.startScreen.classList.remove("is-intro-revealing");
          openConditionCheck();
        }, 850);
      }, 260));
    }

    window.requestAnimationFrame(update);
  }

  function clearTimer(name) {
    if (timers[name]) {
      window.clearTimeout(timers[name]);
      window.clearInterval(timers[name]);
      timers[name] = null;
    }
    if (name === "phase") {
      phaseTimerDueAt = 0;
      phaseTimerCallback = null;
    }
    if (name === "autoHint") {
      autoHintTimerDueAt = 0;
      autoHintTimerCallback = null;
    }
  }
  function clearAllTimers() { Object.keys(timers).forEach(clearTimer); }

  function schedulePhaseTimer(callback, delay) {
    const safeDelay = Math.max(0, Number(delay) || 0);
    clearTimer("phase");
    phaseTimerCallback = callback;
    phaseTimerDueAt = Date.now() + safeDelay;
    timers.phase = window.setTimeout(() => {
      const nextCallback = phaseTimerCallback;
      timers.phase = null;
      phaseTimerDueAt = 0;
      phaseTimerCallback = null;
      if (typeof nextCallback === "function") nextCallback();
    }, safeDelay);
  }

  function scheduleAutoHintTimer(delay) {
    const safeDelay = Math.max(0, Number(delay) || 0);
    clearTimer("autoHint");
    autoHintTimerCallback = showHint;
    autoHintTimerDueAt = Date.now() + safeDelay;
    timers.autoHint = window.setTimeout(() => {
      const nextCallback = autoHintTimerCallback;
      timers.autoHint = null;
      autoHintTimerDueAt = 0;
      autoHintTimerCallback = null;
      if (typeof nextCallback === "function") nextCallback();
    }, safeDelay);
  }

  function pauseTimerRemaining(timer, dueAt) {
    return timer && dueAt ? Math.max(0, dueAt - Date.now()) : 0;
  }
  function setScreen(name) {
    [els.startScreen, els.difficultyScreen, els.gameScreen, els.resultScreen, els.errorScreen].forEach((screen) => screen && screen.classList.add("is-hidden"));
    if (name === "start") els.startScreen.classList.remove("is-hidden");
    if (name === "difficulty") els.difficultyScreen.classList.remove("is-hidden");
    if (name === "game") els.gameScreen.classList.remove("is-hidden");
    if (name === "result") els.resultScreen.classList.remove("is-hidden");
    if (name === "error") els.errorScreen.classList.remove("is-hidden");
    document.body.dataset.screen = name;
    if (name !== "game") delete document.body.dataset.gamePhase;
    if (els.app) els.app.dataset.screen = name;
  }

  function bridge() { return window.ShopQuestMemoryGameAppBridge || null; }
  function sendBridge(methods, payload) { const b = bridge(); if (!b) return false; return methods.some((m) => typeof b[m] === "function" && (b[m](payload), true)); }
  function isCareMode() { return runtimeConfig && (runtimeConfig.mode === "care" || runtimeConfig.mode === "ai_assisted"); }
  function getTotalQuestions() { return Math.max(1, runtimeConfig ? runtimeConfig.totalQuestions : 10); }
  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
  function findItem(id) { return SHOPPING_ITEMS.find((item) => item.id === id) || null; }
  function getChoiceImage(item) { return item && (item.choiceImage || item.image); }
  function shuffle(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  function reportError(code, error) {
    const payload = { status: "error", error_code: code, error_message: error && error.message ? error.message : String(error || code), game_id: GAME_ID, occurred_at: new Date().toISOString() };
    if (els.errorMessage) els.errorMessage.textContent = payload.error_message;
    setScreen("error");
    sendBridge(["sendGameErrorResult", "sendError"], payload);
  }

  function applyModeExtension(config) {
    const extension = window.ShopQuestMemoryGameMode;
    return extension && typeof extension.apply === "function" ? extension.apply(config) || config : config;
  }

  function applyConfig(config) {
    runtimeConfig = applyModeExtension(config);
    state.difficultyKey = runtimeConfig.difficultyKey || "easy";
    state.remainingSeconds = runtimeConfig.durationSeconds;
    state.settings.soundEnabled = runtimeConfig.soundEnabled !== false;
    state.settings.voiceGuideEnabled = runtimeConfig.voiceGuideEnabled !== false;
    state.settings.useDrag = runtimeConfig.useDrag !== false && !isCareMode();
    const ui = runtimeConfig.ui || {};
    document.documentElement.dataset.mode = runtimeConfig.mode || "standard";
    document.documentElement.dataset.showTimer = ui.showTimer === false ? "false" : "true";
    document.documentElement.dataset.showProgress = ui.showProgress === false ? "false" : "true";
    document.documentElement.dataset.showScore = ui.showScore === false ? "false" : "true";
    document.documentElement.dataset.showSettings = ui.showSettings === false ? "false" : "true";
    document.documentElement.dataset.showTutorial = ui.showTutorial === false ? "false" : "true";
    document.documentElement.dataset.showConditionCheck = ui.showConditionCheck === false ? "false" : "true";
    document.documentElement.dataset.showFinishCheck = ui.showFinishCheck === false ? "false" : "true";
    if (els.backgroundSoundToggle) els.backgroundSoundToggle.checked = state.settings.soundEnabled;
    if (els.soundToggle) els.soundToggle.checked = state.settings.soundEnabled;
    if (els.voiceGuideToggle) els.voiceGuideToggle.checked = state.settings.voiceGuideEnabled;
    updatePauseSoundButtons();
    updateInputModeButtons();
  }

  function shouldShowConditionCheck() { return runtimeConfig && runtimeConfig.collectCondition !== false && runtimeConfig.ui && runtimeConfig.ui.showConditionCheck !== false; }
  function shouldShowFinishCheck() { return runtimeConfig && runtimeConfig.ui && runtimeConfig.ui.showFinishCheck !== false; }
  function shouldShowDifficultySelect() { return runtimeConfig && runtimeConfig.ui && runtimeConfig.ui.showDifficultySelect !== false; }

  function getDifficultyConfig(key) {
    const base = DEFAULT_DIFFICULTIES[key] || DEFAULT_DIFFICULTIES.easy;
    const override = runtimeConfig && runtimeConfig.difficulties && runtimeConfig.difficulties[key] ? runtimeConfig.difficulties[key] : {};
    const merged = { ...base, ...override, key };
    if (runtimeConfig.memoryItemCount) merged.memoryItemCount = runtimeConfig.memoryItemCount;
    if (runtimeConfig.answerChoiceCount) merged.answerChoiceCount = runtimeConfig.answerChoiceCount;
    if (runtimeConfig.revealMs) merged.revealMs = runtimeConfig.revealMs;
    if (shouldUseStandardDifficultyPlan()) {
      const plan = getStandardDifficultyQuestionPlan(key, state.questionIndex);
      if (plan) {
        merged.memoryItemCount = plan.memoryItemCount;
        merged.answerChoiceCount = plan.answerChoiceCount;
      }
      merged.revealMs = STANDARD_REVEAL_MS;
    }
    if (runtimeConfig.mode === "care") {
      const careDifficulty = CARE_DIFFICULTIES[key] || CARE_DIFFICULTIES.easy;
      merged.memoryItemCount = careDifficulty.memoryItemCount;
      merged.answerChoiceCount = careDifficulty.answerChoiceCount;
      merged.revealMs = Math.max(merged.revealMs, 4500);
    } else if (isCareMode()) {
      merged.memoryItemCount = 1;
      merged.answerChoiceCount = 2;
      merged.revealMs = Math.max(merged.revealMs, 4500);
    }
    const configuredMaxMemoryItems = runtimeConfig.maxItemsToRemember || MAX_MEMORY_ITEMS;
    const maxMemoryItems = shouldUseStandardDifficultyPlan() || runtimeConfig.mode === "care"
      ? MAX_MEMORY_ITEMS
      : Math.min(configuredMaxMemoryItems, MAX_MEMORY_ITEMS);
    const maxAnswerChoices = shouldUseStandardDifficultyPlan() ? Math.min(STANDARD_MAX_ANSWER_CHOICES, SHOPPING_ITEMS.length) : SHOPPING_ITEMS.length;
    merged.memoryItemCount = Math.max(1, Math.min(merged.memoryItemCount, maxMemoryItems));
    merged.answerChoiceCount = Math.max(merged.memoryItemCount + 1, Math.min(merged.answerChoiceCount, maxAnswerChoices));
    return merged;
  }

  function shouldUseStandardDifficultyPlan() {
    return runtimeConfig && runtimeConfig.mode === "standard" && !isCareMode();
  }

  function getStandardDifficultyQuestionPlan(key, questionIndex) {
    const plans = STANDARD_DIFFICULTY_QUESTION_PLANS[key] || STANDARD_DIFFICULTY_QUESTION_PLANS.easy;
    const questionNumber = questionIndex + 1;
    return plans.find((plan) => questionNumber <= plan.through) || plans[plans.length - 1];
  }

  function getDifficultyKeyFromButton(button) {
    if (button.dataset.difficulty) return button.dataset.difficulty;
    const difficultyKeys = ["easy", "normal", "hard"];
    return difficultyKeys[Number(button.dataset.difficultyIndex)] || "easy";
  }

  function pickTargets(difficulty) {
    return shuffle(SHOPPING_ITEMS).slice(0, difficulty.memoryItemCount);
  }

  function pickDistractors(difficulty, targets) {
    const targetIds = new Set(targets.map((item) => item.id));
    const needed = difficulty.answerChoiceCount - targets.length;
    return shuffle(SHOPPING_ITEMS.filter((item) => !targetIds.has(item.id))).slice(0, needed);
  }

  function generateQuestion() {
    const difficulty = getDifficultyConfig(state.difficultyKey);
    const targetItems = pickTargets(difficulty);
    return { id: `${difficulty.key}-${state.questionIndex + 1}-${Date.now()}`, difficultyKey: difficulty.key, difficultyLabel: difficulty.label, targetItems, choiceItems: shuffle([...targetItems, ...pickDistractors(difficulty, targetItems)]), revealMs: difficulty.revealMs, hintUsed: false, inputType: "touch" };
  }

  function formatTime(seconds) { const safe = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`; }
  function renderMemoryCountdown(seconds) {
    return `<span class="memory-countdown-number">${Math.max(1, seconds)}</span>\uCD08 \uD6C4 \uC2DC\uC791`;
  }
  function getHudDifficulty() { return HUD_DIFFICULTIES[state.difficultyKey] || HUD_DIFFICULTIES.easy; }
  function updateRaceUi() {
    if (!els.raceWrap) return;
    const difficulty = getHudDifficulty();
    const start = RACE_POINTS[0];
    const end = RACE_POINTS[2];
    const totalQuestions = getTotalQuestions();
    const progress = totalQuestions <= 1 ? 1 : Math.min(1, state.questionIndex / (totalQuestions - 1));
    const markerLeft = start + (end - start) * progress;
    const fillRatio = (markerLeft - start) / (end - start);
    els.raceWrap.style.setProperty("--marker-left", `${markerLeft}%`);
    els.raceWrap.style.setProperty("--race-fill", `${Math.max(0, Math.min(1, fillRatio)) * 100}%`);
    if (els.raceMarker) els.raceMarker.textContent = difficulty.runner;
    els.raceSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === difficulty.index);
      step.classList.toggle("is-done", index < difficulty.index);
    });
  }
  function updateTopUi() {
    const difficulty = getHudDifficulty();
    const mission = state.phase === "question"
      ? "\uC544\uB798 \uBB3C\uAC74\uC744 \uC7A5\uBC14\uAD6C\uB2C8\uC5D0 \uB2F4\uC544\uC8FC\uC138\uC694!"
      : state.phase === "transition"
        ? "\uC7A0\uC2DC \uD6C4 \uBB3C\uAC74\uC744 \uCC3E\uC544\uC8FC\uC138\uC694!"
        : "\uC544\uB798 \uBB3C\uAC74\uC744 \uAE30\uC5B5\uD574\uC8FC\uC138\uC694!";
    if (els.difficultyLabel) els.difficultyLabel.textContent = mission;
    if (els.stageLabel) els.stageLabel.textContent = difficulty.label;
    if (els.timeLeft) els.timeLeft.textContent = formatTime(state.remainingSeconds);
    if (els.timerBox) els.timerBox.classList.toggle("is-low", state.remainingSeconds <= 10);
    updateRaceUi();
  }
  function updateHud() {
    const total = getTotalQuestions();
    if (els.roundLabel) els.roundLabel.textContent = `${Math.min(state.questionIndex + 1, total)} / ${total}`;
    updateTopUi();
  }

  function startGameTimer(resetTime) {
    clearTimer("game");
    if (resetTime) state.remainingSeconds = runtimeConfig.durationSeconds;
    updateHud();
    timers.game = window.setInterval(() => {
      if (state.phase !== "question") return;
      state.remainingSeconds -= 1;
      updateHud();
      if (state.remainingSeconds <= 0) finishGame("abandoned", "time_up");
    }, 1000);
  }

  function startMemoryCountdownTimer() {
    clearTimer("countdown");
    timers.countdown = window.setInterval(() => {
      state.revealRemaining -= 1;
      const countdown = els.playArea.querySelector(".memory-countdown");
      if (countdown) countdown.innerHTML = renderMemoryCountdown(state.revealRemaining);
    }, 1000);
  }

  function startFlow() {
    if (shouldShowConditionCheck() && !state.condition.completed) { pendingStart = true; renderConditionSleepRows(); els.conditionModal.classList.remove("is-hidden"); return; }
    if (shouldShowDifficultySelect()) { clearAllTimers(); state.phase = "difficulty"; setScreen("difficulty"); return; }
    startGame(runtimeConfig.difficultyKey || "easy");
  }

  function startGame(difficultyKey) {
    clearAllTimers();
    Object.assign(state, { phase: "memory", difficultyKey: difficultyKey || runtimeConfig.difficultyKey || "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, questionLogs: [], startedAt: new Date(), endedAt: null, status: "completed", abandonReason: null, externalInputUsed: false });
    els.pauseButton.classList.remove("is-paused");
    setScreen("game");
    sendBridge(["sendGameStarted", "sendStarted"], { game_id: GAME_ID, session_id: runtimeConfig.sessionId, mode: runtimeConfig.mode, difficulty: state.difficultyKey, started_at: state.startedAt.toISOString() });
    startGameTimer(true);
    beginQuestion();
  }

  function beginQuestion() {
    clearTimer("phase"); clearTimer("countdown"); clearTimer("autoHint");
    state.question = generateQuestion();
    const question = state.question;
    state.selectedIds = []; state.wrongSelectedIds = []; state.collectedItems = []; state.firstResponseAt = null; state.questionStartedAt = null;
    state.revealRemaining = Math.max(1, Math.ceil(state.question.revealMs / 1000));
    state.phase = "memory";
    updateHud();
    warmQuestionAssets(question).then(() => {
      if (state.question !== question || state.phase !== "memory") return;
      renderMemory();
      startMemoryCountdownTimer();
      schedulePhaseTimer(shouldUseStandardDifficultyPlan() ? showQuestion : showTransition, question.revealMs);
    });
  }

  function showTransition() { clearTimer("phase"); clearTimer("countdown"); state.phase = "transition"; renderTransition(); schedulePhaseTimer(showQuestion, TRANSITION_TIME); }
  function showQuestion() {
    clearTimer("phase");
    const question = state.question;
    warmQuestionAssets(question).then(() => {
      if (state.question !== question || (state.phase !== "memory" && state.phase !== "transition")) return;
      state.phase = "question";
      state.questionStartedAt = Date.now();
      renderQuestion();
      if (runtimeConfig.autoHintEnabled && runtimeConfig.hintEnabled) scheduleAutoHintTimer(AUTO_HINT_DELAY_MS);
    });
  }

  function renderMemory() {
    document.body.dataset.gamePhase = "memory";
    updateTopUi();
    const targets = state.question.targetItems;
    const title = "기억할 물건을 잘 보세요!";
    const cards = targets.map((item) => `<div class="fruit-card" aria-label="${escapeHtml(item.name)}"><img class="fruit-image" src="${item.image}" alt="" draggable="false" loading="eager" decoding="async"></div>`).join("");
    els.playArea.innerHTML = `<section class="memory-view"><div class="memory-card"><p class="guide-text">${escapeHtml(title)}</p></div><div class="fruit-grid ${getMemoryGridClass(targets.length)} is-auto-fit" style="--memory-count:${targets.length}; --memory-columns:${targets.length}">${cards}</div><p class="memory-countdown" aria-live="polite">${renderMemoryCountdown(state.revealRemaining)}</p></section>`;
    els.hintButton.classList.add("is-hidden");
    scheduleMemoryLayout();
    window.setTimeout(scheduleMemoryLayout, 60);
  }

  function getMemoryGridClass(count) {
    if (count <= 4) return "is-sparse";
    if (count <= 8) return "is-medium";
    if (count <= 11) return "is-balanced";
    if (count <= 15) return "is-many";
    return "is-dense";
  }

  function scheduleMemoryLayout() {
    if (memoryLayoutFrame) {
      window.cancelAnimationFrame(memoryLayoutFrame);
    }

    memoryLayoutFrame = window.requestAnimationFrame(() => {
      memoryLayoutFrame = null;
      fitMemoryGridToPlayArea();
    });
  }

  function fitMemoryGridToPlayArea() {
    const view = els.playArea.querySelector(".memory-view");
    if (!view || state.phase !== "memory") return;

    const grid = view.querySelector(".fruit-grid");
    const notice = view.querySelector(".memory-card");
    const countdown = view.querySelector(".memory-countdown");
    if (!grid || !notice || grid.children.length === 0) return;

    const count = grid.children.length;
    const viewWidth = view.clientWidth;
    const viewHeight = view.clientHeight;
    const noticeHeight = notice.offsetHeight;
    const countdownHeight = countdown ? countdown.offsetHeight : 0;
    if (viewWidth <= 0 || viewHeight <= 0) return;

    const viewStyle = window.getComputedStyle(view);
    const stackGap = parseCssLength(viewStyle.rowGap || viewStyle.gap);
    const availableWidth = Math.max(1, viewWidth);
    const isShortLandscape = false;
    const verticalSafety = 14;
    const availableHeight = Math.max(1, viewHeight - noticeHeight - countdownHeight - (stackGap * 2) - verticalSafety);
    const columns = Math.min(MEMORY_LAYOUT_MAX_COLUMNS, count);
    const rows = Math.ceil(count / columns);
    const gap = getAdaptiveMemoryGap(availableWidth, availableHeight, count, isShortLandscape);
    const widthLimit = Math.floor((availableWidth - gap * (columns - 1)) / columns);
    const heightLimit = Math.floor((availableHeight - gap * (rows - 1)) / rows);
    const finalSize = Math.max(MEMORY_LAYOUT_MIN_CARD, Math.min(MEMORY_LAYOUT_CARD_SIZE, widthLimit, heightLimit));
    grid.style.setProperty("--memory-columns", columns);
    grid.style.setProperty("--fruit-card-size", `${finalSize}px`);
    grid.style.setProperty("--fruit-grid-gap", `${gap}px`);
    grid.dataset.columns = String(columns);
    grid.dataset.rows = String(rows);
  }

  function getAdaptiveMemoryGap(width, height, count, isShortLandscape) {
    const base = Math.min(width, height) * (isShortLandscape ? 0.018 : 0.022);
    const countAdjustment = count <= 4 ? 1.25 : count <= 8 ? 1 : 0.82;
    return Math.round(clamp(base * countAdjustment, MEMORY_LAYOUT_MIN_GAP, MEMORY_LAYOUT_MAX_GAP));
  }

  function parseCssLength(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function renderTransition() {
    document.body.dataset.gamePhase = "transition";
    updateTopUi();
    const itemName = state.question.targetItems.length === 1 ? state.question.targetItems[0].name : "물건들";
    const title = isCareMode() ? `좋아요. 이제 ${itemName}을 찾아볼까요?` : "이제 장바구니에 담아볼까요?";
    els.playArea.innerHTML = `<section class="shop-round"><div class="transition-card"><div class="transition-icon" aria-hidden="true">🧺</div><h2 class="round-title">${escapeHtml(title)}</h2><p class="round-kicker">양쪽에서 같은 물건을 찾아주세요</p></div></section>`;
  }
  function renderQuestion() {
    document.body.dataset.gamePhase = "question";
    updateTopUi();
    const question = state.question;
    const remainingTargetIds = new Set(question.targetItems.map((item) => item.id));
    state.selectedIds.forEach((id) => remainingTargetIds.delete(id));
    const prompt = "장바구니에 담아주세요";
    const renderChoiceCards = (items) => items.map((item) => {
      const selected = state.selectedIds.includes(item.id);
      const wrong = state.wrongSelectedIds.includes(item.id);
      const hinted = question.hintUsed && remainingTargetIds.has(item.id);
      return `<button class="choice-card ${selected ? "is-selected" : ""} ${wrong ? "is-wrong" : ""} ${hinted ? "is-hinted" : ""}" type="button" data-item-id="${item.id}" aria-label="${escapeHtml(item.name)}" ${selected ? "disabled" : ""}><img src="${getChoiceImage(item)}" alt="" draggable="false" loading="eager" decoding="async"></button>`;
    }).join("");
    els.playArea.innerHTML = `<section class="shop-round question-round"><div class="question-board"><div class="choice-layout"><section class="shelf-zone" aria-label="물건 선택"><img class="shelf-image" src="assets/images/stand2.webp" alt="" draggable="false" loading="eager" decoding="async"><div class="choice-grid" data-choice-count="${question.choiceItems.length}">${renderChoiceCards(question.choiceItems)}</div></section><div class="basket-zone" data-basket-drop-zone="true"><h2 class="round-title basket-prompt">${escapeHtml(prompt)}</h2><div class="basket-image-wrap ${state.collectedItems.length ? "is-bounce" : ""}"><img class="basket-image" src="assets/images/basket2.webp" alt="장바구니" draggable="false" loading="eager" decoding="async"><div class="basket-collected">${state.collectedItems.map((item) => `<img src="${getChoiceImage(item)}" alt="" draggable="false" loading="eager" decoding="async" data-item-id="${item.id}">`).join("")}</div></div></div></div></div></section>`;
    els.hintButton.classList.toggle("is-hidden", runtimeConfig.hintEnabled === false);
  }

  function showFeedback(message, tone) {
    clearTimer("feedback");
    const bubble = document.createElement("div");
    bubble.className = `feedback-bubble ${tone || "soft"}`;
    bubble.textContent = message;
    els.playArea.appendChild(bubble);
    timers.feedback = window.setTimeout(() => { bubble.remove(); timers.feedback = null; }, FEEDBACK_TIME);
  }

  function getChoiceCardByItemId(itemId) {
    return Array.from(els.playArea.querySelectorAll(".choice-card")).find((button) => button.dataset.itemId === itemId) || null;
  }

  function markChoiceCardSelected(itemId, sourceElement) {
    const card = sourceElement || getChoiceCardByItemId(itemId);
    if (!card) return;
    card.classList.add("is-selected", "is-flying-source");
    card.setAttribute("disabled", "");
  }

  function markChoiceCardWrong(itemId) {
    const card = getChoiceCardByItemId(itemId);
    if (!card) return;
    card.classList.remove("is-wrong");
    void card.offsetWidth;
    card.classList.add("is-wrong");
  }

  function appendCollectedItem(item) {
    if (!item) return;
    const collected = els.playArea.querySelector(".basket-collected");
    if (!collected || collected.querySelector(`[data-item-id="${item.id}"]`)) return;
    const image = document.createElement("img");
    image.src = getChoiceImage(item);
    image.alt = "";
    image.draggable = false;
    image.loading = "eager";
    image.decoding = "async";
    image.dataset.itemId = item.id;
    collected.appendChild(image);

    const basket = els.playArea.querySelector(".basket-image-wrap");
    if (basket) {
      basket.classList.remove("is-bounce");
      void basket.offsetWidth;
      basket.classList.add("is-bounce");
      window.setTimeout(() => basket.classList.remove("is-bounce"), 380);
    }
  }

  function updateChoiceHints() {
    const question = state.question;
    if (!question) return;
    const remainingTargetIds = new Set(question.targetItems.map((item) => item.id));
    state.selectedIds.forEach((id) => remainingTargetIds.delete(id));
    els.playArea.querySelectorAll(".choice-card").forEach((card) => {
      card.classList.toggle("is-hinted", Boolean(question.hintUsed && remainingTargetIds.has(card.dataset.itemId)));
    });
  }

  function getItemFromEvent(event) {
    const button = event.target.closest("[data-item-id]");
    if (!button) return null;
    return { item: findItem(button.dataset.itemId), element: button };
  }

  function moveDragGhostToBody() {
    if (els.dragGhost && els.dragGhost.parentElement !== document.body) document.body.appendChild(els.dragGhost);
  }

  function getDragSourceRect(element) {
    if (!element) return null;
    const image = element.querySelector("img");
    return (image || element).getBoundingClientRect();
  }

  function placeDragGhost(session, clientX, clientY) {
    const left = clientX - session.offsetX;
    const top = clientY - session.offsetY;
    els.dragGhost.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }

  function queueDragGhostPlacement(session, clientX, clientY) {
    session.lastX = clientX;
    session.lastY = clientY;
    if (session.frame) return;
    session.frame = window.requestAnimationFrame(() => {
      session.frame = null;
      if (dragSession !== session || !session.active) return;
      placeDragGhost(session, session.lastX, session.lastY);
    });
  }

  function showDragGhost(session, clientX, clientY) {
    els.dragGhost.innerHTML = `<img src="${getChoiceImage(session.item)}" alt="" loading="eager" decoding="async">`;
    els.dragGhost.style.width = `${Math.max(44, session.width)}px`;
    els.dragGhost.style.height = `${Math.max(44, session.height)}px`;
    placeDragGhost(session, clientX, clientY);
    els.dragGhost.classList.remove("is-hidden");
  }

  function hideDragGhost() {
    els.dragGhost.classList.add("is-hidden");
    els.dragGhost.style.transform = "translate3d(-9999px, -9999px, 0)";
  }

  function releaseDragPointer(session, event) {
    if (!session || !session.captureElement || !event || typeof session.captureElement.hasPointerCapture !== "function") return;
    try {
      if (session.captureElement.hasPointerCapture(event.pointerId)) session.captureElement.releasePointerCapture(event.pointerId);
    } catch (error) {}
  }

  function getItemFlyStartRect(sourceElement, startRectOverride) {
    if (startRectOverride && Number.isFinite(startRectOverride.left)) return startRectOverride;
    if (!sourceElement) return null;
    const sourceImage = sourceElement.querySelector("img");
    return (sourceImage || sourceElement).getBoundingClientRect();
  }

  function animateItemToBasket(item, sourceElement, startRectOverride) {
    const startRect = getItemFlyStartRect(sourceElement, startRectOverride);
    const basket = els.playArea.querySelector(".basket-image-wrap") || els.playArea.querySelector("[data-basket-drop-zone]");
    const basketRect = basket && basket.getBoundingClientRect();
    if (!item || !startRect || !basketRect || !Number.isFinite(startRect.width) || !Number.isFinite(basketRect.width)) return Promise.resolve(false);

    const flyItem = document.createElement("img");
    const width = Math.max(44, startRect.width);
    const height = Math.max(44, startRect.height);
    const startX = startRect.left;
    const startY = startRect.top;
    const targetX = basketRect.left + basketRect.width * 0.5 - width * 0.5;
    const targetY = basketRect.top + basketRect.height * 0.55 - height * 0.5;
    const arcLift = Math.min(120, Math.max(46, Math.abs(targetX - startX) * 0.18));
    const midX = startX + (targetX - startX) * 0.58;
    const midY = Math.min(startY, targetY) - arcLift;

    flyItem.className = "basket-fly-item";
    flyItem.src = getChoiceImage(item);
    flyItem.alt = "";
    flyItem.draggable = false;
    flyItem.decoding = "async";
    flyItem.style.width = `${width}px`;
    flyItem.style.height = `${height}px`;
    flyItem.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1) rotate(0deg)`;
    flyItem.style.opacity = "1";
    document.body.appendChild(flyItem);

    return new Promise((resolve) => {
      let finished = false;
      const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reducedMotion ? 950 : 1400;
      const easeInOut = (value) => value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
      const interpolate = (from, to, progress) => from + (to - from) * progress;
      const finish = () => {
        if (finished) return;
        finished = true;
        flyItem.remove();
        resolve(true);
      };
      const startedAt = performance.now();
      const tick = (now) => {
        if (finished) return;
        const rawProgress = Math.min(1, (now - startedAt) / duration);
        const progress = easeInOut(rawProgress);
        let segmentProgress;
        let x;
        let y;
        let scale;
        let rotation;
        let opacity = 1;

        if (progress < 0.56) {
          segmentProgress = progress / 0.56;
          x = interpolate(startX, midX, segmentProgress);
          y = interpolate(startY, midY, segmentProgress);
          scale = interpolate(1, 0.92, segmentProgress);
          rotation = interpolate(0, 5, segmentProgress);
        } else {
          segmentProgress = (progress - 0.56) / 0.44;
          x = interpolate(midX, targetX, segmentProgress);
          y = interpolate(midY, targetY, segmentProgress);
          scale = interpolate(0.92, 0.34, segmentProgress);
          rotation = interpolate(5, -7, segmentProgress);
          opacity = interpolate(1, 0.12, segmentProgress);
        }

        flyItem.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotation}deg)`;
        flyItem.style.opacity = String(opacity);
        if (rawProgress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          finish();
        }
      };
      window.requestAnimationFrame(tick);
      window.setTimeout(finish, duration + 160);
    });
  }

  function shakeWrongChoice(itemId) {
    const card = Array.from(els.playArea.querySelectorAll(".choice-card")).find((button) => button.dataset.itemId === itemId);
    const image = card && card.querySelector("img");
    if (!image) return;
    const duration = 420;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const damp = 1 - progress;
      const x = Math.sin(progress * Math.PI * 8) * 13 * damp;
      const rotation = Math.sin(progress * Math.PI * 8) * 4 * damp;
      image.style.transform = `scale(var(--choice-item-scale, 1)) translateX(${x}px) rotate(${rotation}deg)`;
      if (progress < 1 && state.phase === "question") {
        window.requestAnimationFrame(tick);
      } else {
        image.style.transform = "";
      }
    };
    window.requestAnimationFrame(tick);
  }

  function selectItem(item, inputType, sourceElement, startRectOverride) {
    if (!item || state.phase !== "question") return;
    const question = state.question;
    const questionIndex = state.questionIndex;
    const isTarget = question.targetItems.some((target) => target.id === item.id);
    if (state.selectedIds.includes(item.id)) return;
    state.interactionCount += 1;
    if (!state.firstResponseAt) state.firstResponseAt = Date.now();
    question.inputType = inputType || "touch";
    if (question.inputType === "external") state.externalInputUsed = true;

    if (isTarget) {
      state.selectedIds.push(item.id);
      const selectedElement = sourceElement || getChoiceCardByItemId(item.id);
      markChoiceCardSelected(item.id, selectedElement);
      const questionCompleted = state.selectedIds.length >= question.targetItems.length;
      animateItemToBasket(item, selectedElement, startRectOverride).then(() => {
        if (state.question !== question || state.questionIndex !== questionIndex || state.phase !== "question") return;
        if (!state.collectedItems.some((collected) => collected.id === item.id)) state.collectedItems.push(item);
        appendCollectedItem(item);
        updateChoiceHints();
        if (questionCompleted) {
          clearTimer("autoHint");
          schedulePhaseTimer(() => completeQuestion(true), FEEDBACK_TIME);
        }
      });
      return;
    }

    state.wrongSelectedIds.push(item.id);
    state.retryCount += 1;
    const wrongAttemptCount = state.wrongSelectedIds.length;
    markChoiceCardWrong(item.id);
    showFeedback(isCareMode() ? "조금 헷갈릴 수 있어요. 다시 같이 볼까요?" : "괜찮아요. 다시 기억해볼게요.", "soft");
    clearTimer("autoHint");
    if (wrongAttemptCount >= 3) {
      schedulePhaseTimer(() => completeQuestion(false), FEEDBACK_TIME);
    }
  }

  function completeQuestion(isCorrect) {
    clearTimer("phase"); clearTimer("autoHint");
    const question = state.question;
    if (!question) return;
    const now = Date.now();
    const responseTimeMs = state.questionStartedAt ? now - state.questionStartedAt : 0;
    const firstResponseTimeMs = state.firstResponseAt && state.questionStartedAt ? state.firstResponseAt - state.questionStartedAt : responseTimeMs;
    state.questionLogs.push({
      question_id: question.id,
      question_index: state.questionIndex + 1,
      difficulty: state.difficultyKey,
      target_items: question.targetItems.map((item) => item.id),
      selected_items: [...state.selectedIds, ...state.wrongSelectedIds],
      choice_items: question.choiceItems.map((item) => item.id),
      correct: Boolean(isCorrect),
      hint_used: Boolean(question.hintUsed),
      response_time_ms: responseTimeMs,
      first_response_time_ms: firstResponseTimeMs,
      input_type: question.inputType || "touch"
    });
    if (isCorrect) state.correctCount += 1; else state.wrongCount += 1;
    updateHud();
    if (state.questionIndex + 1 >= getTotalQuestions()) { schedulePhaseTimer(() => finishGame("completed", null), 700); return; }
    state.questionIndex += 1;
    schedulePhaseTimer(beginQuestion, 900);
  }

  function showHint() {
    if (!state.question || state.phase !== "question" || runtimeConfig.hintEnabled === false) return;
    state.question.hintUsed = true;
    state.hintCount += 1;
    updateChoiceHints();
    const names = state.question.targetItems.filter((item) => !state.selectedIds.includes(item.id)).map((item) => item.name).join(", ");
    showFeedback(`힌트: ${names}을 찾아주세요`, "soft");
  }

  function pauseGame() {
    if (!["memory", "transition", "question"].includes(state.phase)) return;
    const previousPhase = state.phase;
    state.pause.previousPhase = previousPhase;
    state.pause.phaseRemainingMs = pauseTimerRemaining(timers.phase, phaseTimerDueAt);
    state.pause.autoHintRemainingMs = pauseTimerRemaining(timers.autoHint, autoHintTimerDueAt);
    state.pause.startedAt = Date.now();
    pausedPhaseTimerCallback = phaseTimerCallback;
    pausedAutoHintTimerCallback = autoHintTimerCallback;
    state.phase = "pause";
    state.pauseCount += 1;
    clearTimer("game"); clearTimer("countdown"); clearTimer("phase"); clearTimer("autoHint");
    els.pauseButton.classList.add("is-paused");
    updatePauseSoundButtons();
    window.requestAnimationFrame(() => {
      if (state.phase === "pause") els.pauseModal.classList.remove("is-hidden");
    });
  }

  function resumeGame() {
    const previousPhase = state.pause.previousPhase;
    const pausedForMs = state.pause.startedAt ? Date.now() - state.pause.startedAt : 0;
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    state.pause.previousPhase = null;
    state.pause.startedAt = 0;

    if (!previousPhase) return;

    state.phase = previousPhase;
    if (state.questionStartedAt && previousPhase === "question") state.questionStartedAt += pausedForMs;
    if (state.firstResponseAt && previousPhase === "question") state.firstResponseAt += pausedForMs;
    startGameTimer(false);

    if (previousPhase === "memory") startMemoryCountdownTimer();
    if (pausedPhaseTimerCallback) {
      schedulePhaseTimer(pausedPhaseTimerCallback, state.pause.phaseRemainingMs);
    }
    if (previousPhase === "question" && pausedAutoHintTimerCallback && state.pause.autoHintRemainingMs > 0) {
      scheduleAutoHintTimer(state.pause.autoHintRemainingMs);
    }

    pausedPhaseTimerCallback = null;
    pausedAutoHintTimerCallback = null;
    state.pause.phaseRemainingMs = 0;
    state.pause.autoHintRemainingMs = 0;
  }

  function finishGame(status, abandonReason) {
    clearAllTimers();
    state.status = status || "completed";
    state.abandonReason = abandonReason || null;
    state.endedAt = new Date();
    if (shouldShowFinishCheck() && !state.postCondition.completed && !state.postCondition.skipped) {
      openPostConditionCheck();
      return;
    }
    completeGameFinish();
  }

  function completeGameFinish() {
    state.phase = "result";
    setScreen("result");
    closePostConditionCheck();
    const previousRecord = readPreviousRecord();
    renderResult(previousRecord);
    const payload = createResultPayload();
    try { window.localStorage.setItem(`${STORAGE_KEY_PREFIX}:${runtimeConfig.mode}`, JSON.stringify(payload)); } catch (error) {}
    sendBridge(["sendGameCompleteResult", "sendComplete"], payload);
  }

  function createResultPayload() {
    const startedAt = state.startedAt || new Date();
    const endedAt = state.endedAt || new Date();
    const totalQuestions = getTotalQuestions();
    const completedQuestionCount = state.questionLogs.length;
    const responseTimes = state.questionLogs.map((log) => log.response_time_ms).filter((value) => Number.isFinite(value));
    const avgResponseTimeMs = responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : 0;
    return {
      session_id: runtimeConfig.sessionId,
      content_id: runtimeConfig.contentId,
      game_key: runtimeConfig.gameKey,
      game_id: runtimeConfig.gameId,
      mode: runtimeConfig.mode,
      difficulty: state.difficultyKey,
      config_snapshot: runtimeConfig,
      status: state.status,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: Math.max(0, endedAt.getTime() - startedAt.getTime()),
      total_questions: totalQuestions,
      completed_question_count: completedQuestionCount,
      correct_count: state.correctCount,
      wrong_count: state.wrongCount,
      hint_count: state.hintCount,
      retry_count: state.retryCount,
      pause_count: state.pauseCount,
      interaction_count: state.interactionCount,
      avg_response_time_ms: avgResponseTimeMs,
      completion_rate: totalQuestions > 0 ? Number((completedQuestionCount / totalQuestions).toFixed(2)) : 0,
      abandoned_at: state.status === "abandoned" ? endedAt.toISOString() : null,
      abandon_reason: state.abandonReason,
      error_code: state.status === "error" ? "GAME_RUNTIME_ERROR" : null,
      error_message: null,
      question_logs: state.questionLogs,
      result_detail_json: { external_input_used: state.externalInputUsed, use_drag: state.settings.useDrag, auto_add_to_cart: runtimeConfig.autoAddToCart !== false, condition: state.condition.completed && !state.condition.skipped ? state.condition : null, finish_check: state.postCondition.completed && !state.postCondition.skipped ? state.postCondition : null, ui: runtimeConfig.ui }
    };
  }

  function getResultRate(total) {
    return total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
  }

  function createCompareText(previous, currentRate) {
    if (!previous || typeof previous.rate !== "number") return "오늘 첫 기록을 남겼어요";
    const diff = currentRate - previous.rate;
    if (diff >= 2) return `지난번보다 ${Math.round(diff)}% 좋아졌어요`;
    if (diff <= -2) return "다음번엔 더 좋아질 수 있어요";
    return "지난번과 비슷해요";
  }

  function normalizePreviousRecord(record) {
    if (!record || typeof record !== "object") return null;
    if (typeof record.rate === "number") return record;
    if (typeof record.correct_count === "number" && typeof record.total_questions === "number" && record.total_questions > 0) {
      return { ...record, rate: Math.round((record.correct_count / record.total_questions) * 100) };
    }
    if (typeof record.completion_rate === "number") return { ...record, rate: Math.round(record.completion_rate * 100) };
    return null;
  }

  function readPreviousRecord() {
    const candidates = [
      runtimeConfig && runtimeConfig.previousResult,
      runtimeConfig && runtimeConfig.previousRecord,
      runtimeConfig && runtimeConfig.lastResult
    ];

    for (const candidate of candidates) {
      const normalized = normalizePreviousRecord(candidate);
      if (normalized) return normalized;
    }

    try {
      return normalizePreviousRecord(JSON.parse(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}:${runtimeConfig.mode}`) || "null"));
    } catch (error) {
      return null;
    }
  }

  function renderResult(previousRecord) {
    const total = getTotalQuestions();
    const completed = state.status === "completed";
    const rate = getResultRate(total);
    if (els.resultEmoji) els.resultEmoji.textContent = completed ? "🤗" : "🙂";
    els.resultTitle.textContent = "오늘의 기억 활동";
    els.resultMessage.textContent = completed ? "천천히 집중해주신 것만으로도 참 좋습니다." : "잠시 멈춰도 괜찮아요. 다음에 다시 천천히 이어가면 됩니다.";
    els.resultCorrect.textContent = String(state.correctCount);
    els.resultTotal.textContent = String(total);
    els.resultHintCount.textContent = `${state.hintCount}회`;
    els.resultRate.textContent = `${rate}%`;
    if (els.resultCompare) els.resultCompare.textContent = createCompareText(previousRecord, rate);
    els.hintButton.classList.add("is-hidden");
  }

  function goHome() {
    clearAllTimers();
    Object.assign(state, { phase: "start", question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [] });
    closePostConditionCheck();
    els.conditionModal.classList.add("is-hidden");
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    setScreen("start");
    els.hintButton.classList.add("is-hidden");
  }
  function sleepIndexAt(offset) {
    const length = CONDITION_SLEEP_HOURS.length;
    return (state.conditionSleepIndex + offset + length) % length;
  }

  function syncConditionSleepHours() {
    state.condition.sleepHours = CONDITION_SLEEP_HOURS[state.conditionSleepIndex];
  }

  function renderConditionSleepRows() {
    if (!els.conditionSleepRows) return;
    syncConditionSleepHours();
    els.conditionSleepRows.replaceChildren();
    [-1, 0, 1].forEach((offset) => {
      const hour = CONDITION_SLEEP_HOURS[sleepIndexAt(offset)];
      const row = document.createElement("span");
      const number = document.createElement("span");
      const unit = document.createElement("span");

      row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
      number.className = "condition-sleep-number";
      number.textContent = String(hour);
      unit.className = "condition-sleep-unit";
      unit.textContent = "\uC2DC\uAC04";
      row.append(number, unit);
      els.conditionSleepRows.appendChild(row);
    });
  }

  function changeConditionSleep(delta) {
    const length = CONDITION_SLEEP_HOURS.length;
    state.conditionSleepIndex = (state.conditionSleepIndex + delta + length) % length;
    renderConditionSleepRows();
  }

  function startConditionSleepDrag(event) {
    if (!els.conditionSleepDial || event.button > 0) return;
    event.preventDefault();
    state.sleepDrag.pointerId = event.pointerId;
    state.sleepDrag.lastStepY = event.clientY;
    els.conditionSleepDial.classList.add("is-dragging");
    if (typeof els.conditionSleepDial.setPointerCapture === "function") {
      els.conditionSleepDial.setPointerCapture(event.pointerId);
    }
  }

  function dragConditionSleep(event) {
    if (state.sleepDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const deltaY = event.clientY - state.sleepDrag.lastStepY;
    const steps = Math.trunc(Math.abs(deltaY) / CONDITION_SLEEP_DRAG_STEP_PX);
    if (steps < 1) return;
    const direction = deltaY > 0 ? -1 : 1;
    state.sleepDrag.lastStepY += direction * -steps * CONDITION_SLEEP_DRAG_STEP_PX;
    changeConditionSleep(direction * steps);
  }

  function endConditionSleepDrag(event) {
    if (state.sleepDrag.pointerId !== event.pointerId) return;
    if (
      els.conditionSleepDial &&
      typeof els.conditionSleepDial.releasePointerCapture === "function" &&
      els.conditionSleepDial.hasPointerCapture(event.pointerId)
    ) {
      els.conditionSleepDial.releasePointerCapture(event.pointerId);
    }
    state.sleepDrag.pointerId = null;
    state.sleepDrag.lastStepY = 0;
    if (els.conditionSleepDial) els.conditionSleepDial.classList.remove("is-dragging");
  }

  function completeConditionCheck(skipped) {
    state.condition.completed = true;
    state.condition.skipped = Boolean(skipped);
    syncConditionSleepHours();
    els.conditionModal.classList.add("is-hidden");
    if (pendingStart) {
      pendingStart = false;
      startFlow();
    }
  }

  function updatePostConditionUi() {
    if (!els.postConditionModal) return;
    els.postConditionPages.forEach((page, index) => { page.hidden = index !== state.postCondition.step; });
    els.postConditionDots.forEach((dot, index) => dot.classList.toggle("is-active", index === state.postCondition.step));
    els.postConditionOptions.forEach((button) => {
      const selected = state.postCondition[button.dataset.postField] === button.dataset.postValue;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function openPostConditionCheck() {
    state.phase = "post-condition";
    state.postCondition.step = 0;
    updatePostConditionUi();
    els.pauseModal.classList.add("is-hidden");
    els.postConditionModal.classList.remove("is-hidden");
  }

  function closePostConditionCheck() {
    if (els.postConditionModal) els.postConditionModal.classList.add("is-hidden");
  }

  function selectPostConditionOption(button) {
    if (!button || !button.dataset.postField) return;
    state.postCondition[button.dataset.postField] = button.dataset.postValue;
    updatePostConditionUi();
  }

  function skipPostConditionCheck() {
    state.postCondition.skipped = true;
    state.postCondition.completed = false;
    completeGameFinish();
  }

  function submitPostConditionCheck() {
    state.postCondition.completed = true;
    state.postCondition.skipped = false;
    completeGameFinish();
  }

  function showNextPostConditionStep() {
    state.postCondition.step = Math.min(1, state.postCondition.step + 1);
    updatePostConditionUi();
  }

  function showPreviousPostConditionStep() {
    state.postCondition.step = Math.max(0, state.postCondition.step - 1);
    updatePostConditionUi();
  }

  function openSettings() {
    updateInputModeButtons();
    els.settingsModal.classList.remove("is-hidden");
    if (els.settingsCloseButton) els.settingsCloseButton.focus();
  }

  function closeSettings() {
    els.settingsModal.classList.add("is-hidden");
  }

  function openConditionCheck() {
    if (!shouldShowConditionCheck() || state.condition.completed || !els.conditionModal) return;
    pendingStart = false;
    renderConditionSleepRows();
    els.conditionModal.classList.remove("is-hidden");
    if (els.conditionConfirmButton) els.conditionConfirmButton.focus();
  }

  function updatePauseSoundButton(button, enabled) {
    if (!button) return;
    const isEnabled = Boolean(enabled);
    button.classList.toggle("is-off", !isEnabled);
    button.setAttribute("aria-pressed", isEnabled ? "true" : "false");
    const label = button.querySelector(".pause-toggle-visual span");
    if (label) label.textContent = isEnabled ? "ON" : "OFF";
  }

  function updatePauseSoundButtons() {
    updatePauseSoundButton(els.pauseBackgroundSoundButton, els.backgroundSoundToggle ? els.backgroundSoundToggle.checked : state.settings.soundEnabled);
    updatePauseSoundButton(els.pauseSoundButton, els.soundToggle ? els.soundToggle.checked : state.settings.soundEnabled);
    updatePauseSoundButton(els.pauseVoiceGuideButton, els.voiceGuideToggle ? els.voiceGuideToggle.checked : state.settings.voiceGuideEnabled);
  }

  function syncSoundToggles(sourceToggle) {
    if (sourceToggle === els.voiceGuideToggle) {
      state.settings.voiceGuideEnabled = els.voiceGuideToggle.checked;
      updatePauseSoundButtons();
      return;
    }
    const nextSoundEnabled = sourceToggle ? sourceToggle.checked : state.settings.soundEnabled;
    state.settings.soundEnabled = nextSoundEnabled;
    if (els.backgroundSoundToggle && els.backgroundSoundToggle !== sourceToggle) els.backgroundSoundToggle.checked = nextSoundEnabled;
    if (els.soundToggle && els.soundToggle !== sourceToggle) els.soundToggle.checked = nextSoundEnabled;
    updatePauseSoundButtons();
  }

  function togglePauseSound(sourceToggle) {
    if (!sourceToggle) return;
    sourceToggle.checked = !sourceToggle.checked;
    syncSoundToggles(sourceToggle);
  }

  function updateInputModeButtons() {
    els.inputModeButtons.forEach((button) => {
      const isSelected = button.dataset.inputMode === (state.settings.useDrag ? "drag" : "touch");
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function selectInputMode(button) {
    if (!button) return;
    state.settings.useDrag = button.dataset.inputMode === "drag" && !isCareMode();
    updateInputModeButtons();
  }

  function openTutorial() { tutorialIndex = 0; renderTutorialStep(); els.tutorialModal.classList.remove("is-hidden"); }
  function openPauseHelp() {
    reopenPauseAfterTutorial = true;
    els.pauseModal.classList.add("is-hidden");
    openTutorial();
  }
  function closeTutorial() {
    els.tutorialModal.classList.add("is-hidden");
    if (reopenPauseAfterTutorial && state.phase === "pause") {
      reopenPauseAfterTutorial = false;
      updatePauseSoundButtons();
      els.pauseModal.classList.remove("is-hidden");
      return;
    }
    reopenPauseAfterTutorial = false;
  }
  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialIndex] || TUTORIAL_STEPS[0];
    els.tutorialMessage.textContent = step.message;
    if (els.tutorialDetail) els.tutorialDetail.hidden = true;
    els.tutorialPreview.classList.remove("has-tap-pointer");
    const cards = step.previewIds.map((id) => {
      const item = findItem(id);
      return item ? `<div class="fruit-card"><img class="fruit-image" src="${item.image}" alt="${escapeHtml(item.name)}" draggable="false"><span class="fruit-name">${escapeHtml(item.name)}</span></div>` : "";
    }).join("");
    els.tutorialPreview.innerHTML = `<div class="tutorial-mini"><div class="tutorial-play-view"><div class="fruit-grid is-sparse">${cards}</div></div></div>`;
    els.tutorialNextButton.textContent = tutorialIndex >= TUTORIAL_STEPS.length - 1 ? "\uB2EB\uAE30" : "\uB2E4\uC74C";
  }

  function requestExit() {
    sendBridge(["sendGameExit", "sendExit", "exitGame", "closeGame"], { game_id: GAME_ID, session_id: runtimeConfig ? runtimeConfig.sessionId : null, requested_at: new Date().toISOString() });
  }

  function getHubReturnUrl() {
    const config = runtimeConfig || {};
    const configuredUrl = config.hubUrl || config.hub_url || config.returnUrl || config.return_url || config.homeUrl || config.home_url || config.exitUrl || config.exit_url;
    if (typeof configuredUrl === "string" && configuredUrl.trim()) {
      try { return new URL(configuredUrl, window.location.href).href; } catch (error) {}
    }
    try { return new URL("../../index.html", window.location.href).href; } catch (error) {}
    return "";
  }

  function returnToHub() {
    requestExit();
    const hubUrl = getHubReturnUrl();
    if (!hubUrl) return;
    window.setTimeout(() => {
      try { window.location.href = hubUrl; } catch (error) {}
    }, 80);
  }

  function handleExternalAnswer(payload) {
    if (!runtimeConfig || runtimeConfig.mode !== "ai_assisted") return { ok: false, reason: "external input is disabled" };
    const rawValue = typeof payload === "string" ? payload : payload && (payload.itemId || payload.item_id || payload.id || payload.value || payload.answer);
    const item = findItem(String(rawValue || ""));
    if (!item) return { ok: false, reason: "item not found" };
    selectItem(item, "external");
    return { ok: true, itemId: item.id };
  }

  function installExternalInputApi() {
    window[EXTERNAL_INPUT_API_NAME] = Object.freeze({ submitAnswer: handleExternalAnswer });
    window.addEventListener("message", (event) => {
      const data = event.data || {};
      if (typeof data === "string") { try { handleExternalAnswer(JSON.parse(data)); } catch (error) {} return; }
      if (data.type === EXTERNAL_ANSWER_MESSAGE_TYPE || data.type === EXTERNAL_ANSWER_MESSAGE_TYPE_ALIAS) handleExternalAnswer(data.payload || data);
    });
  }

  function handlePointerDown(event) {
    if (!state.settings.useDrag || state.phase !== "question") return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = getItemFromEvent(event);
    if (!target || !target.item) return;
    const sourceRect = getDragSourceRect(target.element);
    if (!sourceRect) return;
    const offsetX = Math.min(Math.max(event.clientX - sourceRect.left, 0), sourceRect.width);
    const offsetY = Math.min(Math.max(event.clientY - sourceRect.top, 0), sourceRect.height);
    dragSession = {
      item: target.item,
      element: target.element,
      captureElement: target.element,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      offsetX,
      offsetY,
      width: sourceRect.width,
      height: sourceRect.height,
      active: false,
      frame: null
    };
    if (typeof target.element.setPointerCapture === "function") {
      try { target.element.setPointerCapture(event.pointerId); } catch (error) {}
    }
  }

  function handlePointerMove(event) {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    const moved = Math.abs(event.clientX - dragSession.startX) + Math.abs(event.clientY - dragSession.startY);
    if (!dragSession.active && moved > 12) {
      dragSession.active = true;
      showDragGhost(dragSession, event.clientX, event.clientY);
    }
    if (dragSession.active) {
      event.preventDefault();
      queueDragGhostPlacement(dragSession, event.clientX, event.clientY);
    }
  }

  function handlePointerUp(event) {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    const session = dragSession;
    dragSession = null;
    if (session.frame) window.cancelAnimationFrame(session.frame);
    releaseDragPointer(session, event);
    const ghostRect = els.dragGhost.getBoundingClientRect();
    hideDragGhost();
    if (!session.active) return;
    suppressNextClick = true;
    const basket = els.playArea.querySelector("[data-basket-drop-zone]");
    const rect = basket && basket.getBoundingClientRect();
    if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) selectItem(session.item, "drag", session.element, ghostRect);
  }

  function handlePointerCancel(event) {
    if (!dragSession || dragSession.pointerId !== event.pointerId) return;
    const session = dragSession;
    dragSession = null;
    if (session.frame) window.cancelAnimationFrame(session.frame);
    releaseDragPointer(session, event);
    hideDragGhost();
  }

  function bindEvents() {
    moveDragGhostToBody();
    window.addEventListener("resize", updateGameScale);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", updateGameScale);
    els.startButton.addEventListener("click", startFlow);
    els.startExitButton.addEventListener("click", requestExit);
    els.settingsButton.addEventListener("click", openSettings);
    els.tutorialButton.addEventListener("click", openTutorial);
    els.difficultyBackButton.addEventListener("click", goHome);
    els.difficultyButtons.forEach((button) => button.addEventListener("click", () => startGame(getDifficultyKeyFromButton(button))));
    els.playArea.addEventListener("click", (event) => {
      if (suppressNextClick) { suppressNextClick = false; return; }
      if (dragSession && dragSession.active) return;
      const target = getItemFromEvent(event);
      if (target && state.settings.useDrag && state.phase === "question") return;
      if (target && target.item) selectItem(target.item, "touch", target.element);
    });
    els.playArea.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    els.hintButton.addEventListener("click", showHint);
    els.pauseButton.addEventListener("click", pauseGame);
    els.resumeButton.addEventListener("click", resumeGame);
    els.pauseRestartButton.addEventListener("click", () => { els.pauseModal.classList.add("is-hidden"); startGame(state.difficultyKey); });
    els.pauseQuitButton.addEventListener("click", () => { els.pauseModal.classList.add("is-hidden"); finishGame("abandoned", "user_exit"); });
    els.pauseHelpButton.addEventListener("click", openPauseHelp);
    els.pauseBackgroundSoundButton.addEventListener("click", () => togglePauseSound(els.backgroundSoundToggle));
    els.pauseSoundButton.addEventListener("click", () => togglePauseSound(els.soundToggle));
    els.pauseVoiceGuideButton.addEventListener("click", () => togglePauseSound(els.voiceGuideToggle));
    els.restartButton.addEventListener("click", () => startGame(state.difficultyKey));
    els.resultStartButton.addEventListener("click", goHome);
    els.resultHomeButton.addEventListener("click", requestExit);
    els.errorHomeButton.addEventListener("click", goHome);
    els.conditionButtons.forEach((button) => button.addEventListener("click", () => {
      els.conditionButtons.forEach((item) => { item.classList.remove("is-selected"); item.setAttribute("aria-pressed", "false"); });
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
      state.condition.mood = button.dataset.mood || "good";
    }));
    els.conditionSleepUpButton.addEventListener("click", () => changeConditionSleep(-1));
    els.conditionSleepDownButton.addEventListener("click", () => changeConditionSleep(1));
    if (els.conditionSleepDial) {
      els.conditionSleepDial.addEventListener("pointerdown", startConditionSleepDrag);
      els.conditionSleepDial.addEventListener("pointermove", dragConditionSleep);
      els.conditionSleepDial.addEventListener("pointerup", endConditionSleepDrag);
      els.conditionSleepDial.addEventListener("pointercancel", endConditionSleepDrag);
      els.conditionSleepDial.addEventListener("lostpointercapture", endConditionSleepDrag);
    }
    els.conditionSkipButton.addEventListener("click", () => completeConditionCheck(true));
    els.conditionConfirmButton.addEventListener("click", () => completeConditionCheck(false));
    els.postConditionOptions.forEach((button) => button.addEventListener("click", () => selectPostConditionOption(button)));
    els.postConditionSkipButton.addEventListener("click", skipPostConditionCheck);
    els.postConditionNextButton.addEventListener("click", showNextPostConditionStep);
    els.postConditionBackButton.addEventListener("click", showPreviousPostConditionStep);
    els.postConditionConfirmButton.addEventListener("click", submitPostConditionCheck);
    els.backgroundSoundToggle.addEventListener("change", () => syncSoundToggles(els.backgroundSoundToggle));
    els.soundToggle.addEventListener("change", () => syncSoundToggles(els.soundToggle));
    els.voiceGuideToggle.addEventListener("change", () => syncSoundToggles(els.voiceGuideToggle));
    els.inputModeButtons.forEach((button) => button.addEventListener("click", () => selectInputMode(button)));
    els.settingsCloseButton.addEventListener("click", closeSettings);
    els.settingsExitButton.addEventListener("click", () => { closeSettings(); returnToHub(); });
    els.tutorialCloseButton.addEventListener("click", closeTutorial);
    els.tutorialNextButton.addEventListener("click", () => { if (tutorialIndex >= TUTORIAL_STEPS.length - 1) { closeTutorial(); return; } tutorialIndex += 1; renderTutorialStep(); });
  }

  async function boot() {
    try {
      updateGameScale();
      bindEvents();
      installExternalInputApi();
      const b = bridge();
      if (!b || typeof b.getRuntimeConfig !== "function") throw new Error("App bridge is missing.");
      applyConfig(await b.getRuntimeConfig());
      renderConditionSleepRows();
      updatePostConditionUi();
      updateHud();
      setScreen("start");
      startIntroLoading();
      sendBridge(["sendGameReady", "sendReady"], { game_id: GAME_ID, session_id: runtimeConfig.sessionId, mode: runtimeConfig.mode, ready_at: new Date().toISOString() });
    } catch (error) {
      reportError(error.code || "INITIALIZE_FAILED", error);
    }
  }

  boot();
})();
