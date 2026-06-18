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
  const STANDARD_RETRY_FEEDBACK_TIME = 2000;
  const RETRY_FEEDBACK_TIME = 5000;
  const CARE_RETRY_FEEDBACK_TIME = 4000;
  const CORRECT_FEEDBACK_TIME = 3000;
  const FINAL_WRONG_FEEDBACK_TIME = 3000;
  const START_READY_MESSAGE_TIME = 2000;
  const START_COUNTDOWN_TIME = 3000;
  const TRANSITION_TIME = 4000;
  const AUTO_HINT_DELAY_MS = 10000;
  const VOICE_GUIDE_STAGE_DELAY_MS = 140;
  const VOICE_GUIDE_FEEDBACK_DELAY_MS = 220;
  const STANDARD_REVEAL_MS_BY_DIFFICULTY = Object.freeze({
    easy: 5000,
    normal: 4000,
    hard: 3000
  });
  const MAX_MEMORY_ITEMS = 6;
  const RACE_POINTS = Object.freeze([16, 50, 84, 94]);
  const MEMORY_LAYOUT_FIXED_CARD_SIZE = 164;
  const MEMORY_LAYOUT_FIXED_GAP = 22;
  const MEMORY_LAYOUT_MAX_COLUMNS = 7;
  const ITEM_GLOW_ASSET_VERSION = "20260609-choice-glow";
  const CHOICE_TOUCH_HITBOXES = Object.freeze({
    apple: Object.freeze({ x: 0.18, y: 0.24, w: 0.64, h: 0.55 }),
    banana: Object.freeze({ x: 0.10, y: 0.32, w: 0.80, h: 0.28 }),
    orange: Object.freeze({ x: 0.18, y: 0.23, w: 0.64, h: 0.55 }),
    watermelon: Object.freeze({ x: 0.14, y: 0.31, w: 0.72, h: 0.39 }),
    bread: Object.freeze({ x: 0.16, y: 0.25, w: 0.68, h: 0.52 }),
    cheese: Object.freeze({ x: 0.20, y: 0.30, w: 0.60, h: 0.42 }),
    carrot: Object.freeze({ x: 0.10, y: 0.35, w: 0.82, h: 0.24 }),
    vegetable: Object.freeze({ x: 0.13, y: 0.27, w: 0.74, h: 0.42 }),
    fish: Object.freeze({ x: 0.09, y: 0.37, w: 0.82, h: 0.23 }),
    meat: Object.freeze({ x: 0.15, y: 0.32, w: 0.70, h: 0.35 })
  });
  const STATIC_IMAGE_ASSETS = Object.freeze([
    "assets/images/background2.webp",
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
  const AUDIO_CACHE_BUST = String(Date.now());
  const AUDIO_TRACKS = Object.freeze({
    button: { src: "assets/audio/button-click2.wav", volume: 0.22, poolSize: 3 },
    toggle: { src: "assets/audio/button-click2.wav", volume: 0.22, poolSize: 3 },
    countdown: { src: "assets/audio/countdown-tick.wav", volume: 0.68, poolSize: 3 },
    start: { src: "assets/audio/start.wav", volume: 0.72, poolSize: 3 },
    correct: { src: "assets/audio/correct2.wav", volume: 0.26, poolSize: 3 },
    retry: { src: "assets/audio/retry2.wav", volume: 0.24, poolSize: 3 },
    wrong: { src: "assets/audio/retry2.wav", volume: 0.24, poolSize: 3 },
    complete: { src: "assets/audio/complete2.wav", volume: 0.26, poolSize: 3 },
    background: { src: "assets/audio/background.wav", volume: 0.22, menuVolume: 0.34, unlockVolume: 0.01, loop: false, poolSize: 2, channel: "background", crossfadeSeconds: 2.4 },
    voiceReady: { src: "assets/audio/voice-ready.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceMemory: { src: "assets/audio/voice-memory.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceQuestion: { src: "assets/audio/voice-question.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceCorrect: { src: "assets/audio/voice-correct.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceRetry: { src: "assets/audio/voice-retry.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceRetry3: { src: "assets/audio/voice-retry3.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceCareResult1: { src: "assets/audio/voice-care-result1.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceCareResult2: { src: "assets/audio/voice-care-result2.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackCorrect: { src: "assets/audio/voice-soft_feedback_correct.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackMemory: { src: "assets/audio/voice-soft_feedback_memory.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackQuestion: { src: "assets/audio/voice-soft_feedback_question.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackRetry: { src: "assets/audio/voice-soft_feedback_retry.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackRetry3: { src: "assets/audio/voice-soft_feedback_retry3.wav", volume: 0.72, poolSize: 1, channel: "voice" },
    voiceSoftFeedbackThink: { src: "assets/audio/voice-soft_feedback_think.wav", volume: 0.72, poolSize: 1, channel: "voice" }
  });
  window.__SHOP_QUEST_AUDIO_TRACKS__ = AUDIO_TRACKS;

  const SHOPPING_ITEMS = Object.freeze([
    { id: "apple", name: "사과", image: `assets/images/item-cutout-apple-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/apple-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "fruit", shape: "round", color: "red" },
    { id: "banana", name: "바나나", image: `assets/images/item-cutout-banana-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/banana-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "fruit", shape: "long", color: "yellow" },
    { id: "orange", name: "오렌지", image: `assets/images/item-cutout-orange-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/orange-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "fruit", shape: "round", color: "orange" },
    { id: "watermelon", name: "수박", image: `assets/images/item-cutout-watermelon-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/watermelon-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "fruit", shape: "round", color: "green" },
    { id: "bread", name: "빵", image: `assets/images/item-cutout-bread-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/bread-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "food", shape: "box", color: "brown" },
    { id: "cheese", name: "치즈", image: `assets/images/item-cutout-cheese-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/cheese-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "food", shape: "box", color: "yellow" },
    { id: "carrot", name: "당근", image: `assets/images/item-cutout-carrot-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/carrot-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "vegetable", shape: "long", color: "orange" },
    { id: "vegetable", name: "채소", image: `assets/images/item-cutout-vegetable-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/baechu-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "vegetable", shape: "leaf", color: "green" },
    { id: "fish", name: "생선", image: `assets/images/item-cutout-fish-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/fish-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "meat", shape: "long", color: "blue" },
    { id: "meat", name: "고기", image: `assets/images/item-cutout-meat-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, choiceImage: `assets/images/meat-glow.webp?v=${ITEM_GLOW_ASSET_VERSION}`, category: "meat", shape: "box", color: "red" }
  ]);
  const ITEM_CATEGORY_LABELS = Object.freeze({
    fruit: "과일",
    food: "식품",
    vegetable: "채소",
    meat: "생선/고기"
  });

  const DEFAULT_DIFFICULTIES = Object.freeze({
    easy: { key: "easy", label: "쉬움", memoryItemCount: 1, answerChoiceCount: 2, revealMs: 3000 },
    normal: { key: "normal", label: "보통", memoryItemCount: 2, answerChoiceCount: 4, revealMs: 3000 },
    hard: { key: "hard", label: "어려움", memoryItemCount: 3, answerChoiceCount: 6, revealMs: 3000 }
  });

  const STANDARD_MAX_ANSWER_CHOICES = 10;
  const STANDARD_DIFFICULTY_QUESTION_PLANS = Object.freeze({
    easy: Object.freeze([
      { through: 5, memoryItemCount: 1, answerChoiceCount: 4 },
      { through: 8, memoryItemCount: 2, answerChoiceCount: 5 },
      { through: 10, memoryItemCount: 3, answerChoiceCount: 6 }
    ]),
    normal: Object.freeze([
      { through: 3, memoryItemCount: 2, answerChoiceCount: 5 },
      { through: 7, memoryItemCount: 3, answerChoiceCount: 7 },
      { through: 10, memoryItemCount: 4, answerChoiceCount: 8 }
    ]),
    hard: Object.freeze([
      { through: 3, memoryItemCount: 3, answerChoiceCount: 7 },
      { through: 6, memoryItemCount: 4, answerChoiceCount: 8 },
      { through: 8, memoryItemCount: 5, answerChoiceCount: 9 },
      { through: 10, memoryItemCount: 6, answerChoiceCount: 10 }
    ])
  });

  const CARE_REVEAL_MS = 5000;
  const CARE_DIFFICULTY_QUESTION_PLANS = Object.freeze({
    easy: Object.freeze([
      Object.freeze({ through: 5, memoryItemCount: 1, answerChoiceCount: 2 })
    ]),
    normal: Object.freeze([
      Object.freeze({ through: 5, memoryItemCount: 2, answerChoiceCount: 4 })
    ]),
    hard: Object.freeze([
      Object.freeze({ through: 4, memoryItemCount: 3, answerChoiceCount: 6 }),
      Object.freeze({ through: 5, memoryItemCount: 4, answerChoiceCount: 6 })
    ])
  });

  const TUTORIAL_STEPS = Object.freeze([
    { message: "잠깐 보여주는 물건을 기억해주세요.", previewIds: ["apple", "orange", "bread"], mode: "memory" },
    { message: "물건을 톡 누르면 장바구니에 담아져요", previewIds: ["carrot", "banana", "vegetable"], mode: "touch" },
    { message: "물건을 끌어서 담을 수 있어요", previewIds: ["carrot", "banana", "vegetable"], mode: "drag" }
  ]);

  const CONDITION_SLEEP_HOURS = Object.freeze([4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const CONDITION_SLEEP_DRAG_STEP_PX = 42;

  const $ = (id) => document.getElementById(id);
  const els = {
    app: $("app"), orientationGuard: $("orientation-guard"), startScreen: $("start-screen"), startLoading: $("start-loading"), startLoadingFill: $("start-loading-fill"), startLoadingText: $("start-loading-text"), difficultyScreen: $("difficulty-screen"), gameScreen: $("game-screen"), resultScreen: $("result-screen"), errorScreen: $("error-screen"),
    errorTitle: $("error-title"), errorMessage: $("error-message"), startButton: $("start-button"), startExitButton: $("start-exit-button"), settingsButton: $("settings-button"), cornerSettingsButton: $("corner-settings-button"), tutorialButton: $("tutorial-button"),
    difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty], [data-difficulty-index]")), difficultyBackButton: $("difficulty-back-button"), playArea: $("play-area"), hintButton: $("hint-button"), dragGhost: $("drag-ghost"), gameCountdown: $("game-countdown"), gameCountdownMessage: $("game-countdown-message"), gameCountdownTimer: document.querySelector(".game-countdown-timer"), gameCountdownNumber: $("game-countdown-number"),
    pauseButton: $("pause-button"), pauseModal: $("pause-modal"), resumeButton: $("resume-button"), pauseRestartButton: $("pause-restart-button"), pauseQuitButton: $("home-button"), pauseHelpButton: $("pause-help-button"),
    roundLabel: $("round-label"), timeLeft: $("time-left"), timerBox: $("timer-box"), difficultyLabel: $("difficulty-label"), stageLabel: $("stage-label"), hudProgress: document.querySelector(".hud-progress-pill"), hudProgressCurrent: $("hud-progress-current"), hudProgressTotal: $("hud-progress-total"), hudProgressSteps: Array.from(document.querySelectorAll(".hud-progress-step")), raceWrap: document.querySelector(".race-wrap"), raceMarker: $("race-marker"), raceSteps: Array.from(document.querySelectorAll(".race-step")), resultEmoji: $("result-emoji"), resultTitle: $("result-title"), resultMessage: $("result-message"), resultCorrect: $("result-correct"), resultTotal: $("result-total"), resultHintCount: $("result-hint-count"), resultRate: $("result-rate"), resultCompare: $("result-compare"),
    restartButton: $("restart-button"), resultStartButton: $("result-start-button"), resultHomeButton: $("result-home-button"), errorHomeButton: $("error-home-button"),
    conditionModal: $("condition-modal"), conditionButtons: Array.from(document.querySelectorAll("[data-mood]")), conditionSleepDial: document.querySelector(".condition-sleep-dial"), conditionSleepRows: $("condition-sleep-rows"), conditionSleepUpButton: $("condition-sleep-up-button"), conditionSleepDownButton: $("condition-sleep-down-button"), conditionSkipButton: $("condition-skip-button"), conditionConfirmButton: $("condition-confirm-button"),
    postConditionModal: $("post-condition-modal"), postConditionPages: Array.from(document.querySelectorAll(".post-condition-page")), postConditionDots: Array.from(document.querySelectorAll(".post-condition-dot")), postConditionOptions: Array.from(document.querySelectorAll(".post-condition-option")), postConditionSkipButton: $("post-condition-skip-button"), postConditionNextButton: $("post-condition-next-button"), postConditionBackButton: $("post-condition-back-button"), postConditionConfirmButton: $("post-condition-confirm-button"),
    settingsModal: $("settings-modal"), settingsCloseButton: $("settings-close-button"), settingsExitButton: $("settings-exit-button"), inputModeButtons: Array.from(document.querySelectorAll("[data-input-mode]")), backgroundSoundToggle: $("background-sound-toggle"), soundToggle: $("sound-toggle"), voiceGuideToggle: $("voice-guide-toggle"), pauseBackgroundSoundButton: $("pause-background-sound-button"), pauseSoundButton: $("pause-sound-button"), pauseVoiceGuideButton: $("pause-voice-guide-button"),
    tutorialModal: $("tutorial-modal"), tutorialMessage: $("tutorial-message"), tutorialPreview: $("tutorial-preview"), tutorialDetail: $("tutorial-detail"), tutorialCloseButton: $("tutorial-close-button"), tutorialNextButton: $("tutorial-next-button")
  };

  const timers = { phase: null, countdown: null, game: null, feedback: null, autoHint: null, resultReturn: null };
  let runtimeConfig = null;
  let pendingStart = false;
  let tutorialIndex = 0;
  let dragSession = null;
  let suppressNextClick = false;
  let memoryLayoutFrame = null;
  let memoryProgressFrame = null;
  let preloadGameAssetsPromise = null;
  let phaseTimerDueAt = 0;
  let phaseTimerCallback = null;
  let autoHintTimerDueAt = 0;
  let autoHintTimerCallback = null;
  let pausedPhaseTimerCallback = null;
  let pausedAutoHintTimerCallback = null;
  let orientationAutoPauseActive = false;
  let wasPausedBeforeOrientation = false;
  let reopenPauseAfterTutorial = false;
  const imageReadyCache = new Map();
  const audioPools = new Map();
  const audioPoolIndexes = new Map();
  let activeVoiceGuideAudio = null;
  let voiceGuideTimerId = null;
  let audioUnlocked = false;
  let backgroundAudio = null;
  let backgroundAudioIndex = 0;
  let backgroundLoopFrameId = null;
  let backgroundFadeFrameId = null;
  let backgroundCrossfadeActive = false;

  const state = {
    phase: "start", difficultyKey: "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, touchMissCount: 0, questionTouchMissCount: 0, missedItemCount: 0, questionLogs: [],
    startedAt: null, endedAt: null, remainingSeconds: 0, revealRemaining: 0, questionStartedAt: null, firstResponseAt: null, status: "completed", abandonReason: null, externalInputUsed: false,
    startCountdownIntroTimeoutId: null, startCountdownFrameId: null, startCountdownIntroStartedAt: 0, startCountdownIntroRemainingMs: 0, startCountdownPausedAt: 0,
    condition: { completed: false, skipped: false, mood: "good", sleepHours: 7 },
    conditionSleepIndex: 3,
    postCondition: { completed: false, skipped: false, step: 0, moodAfter: "good", fatigue: "low", perceivedDifficulty: "justRight", neededHelp: "none", replayIntent: "yes" },
    sleepDrag: { pointerId: null, lastStepY: 0 },
    pause: { previousPhase: null, phaseRemainingMs: 0, autoHintRemainingMs: 0, startedAt: 0 },
    settings: { backgroundSoundEnabled: true, soundEnabled: true, voiceGuideEnabled: true, useDrag: true }
  };

  function updateGameScale() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    const verticalGutter = Math.max(0, (viewportHeight - (STAGE_HEIGHT * scale)) / (2 * scale));
    const horizontalGutter = Math.max(0, (viewportWidth - (STAGE_WIDTH * scale)) / (2 * scale));
    const hudDesignWidth = 1536;
    const visibleHudWidth = viewportWidth / scale;
    const hudFitScale = Math.max(0.01, visibleHudWidth / hudDesignWidth);
    document.documentElement.style.setProperty("--game-scale", String(scale));
    document.documentElement.style.setProperty("--hud-fit-scale", String(hudFitScale));
    document.documentElement.style.setProperty("--game-viewport-top-gutter", `${verticalGutter}px`);
    document.documentElement.style.setProperty("--game-viewport-side-gutter", `${horizontalGutter}px`);
    updateOrientationGuard(viewportWidth, viewportHeight);
  }

  function updateOrientationGuard(viewportWidth, viewportHeight) {
    const width = Number(viewportWidth) || window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const height = Number(viewportHeight) || window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const isPortrait = isPortraitViewport(width, height);

    document.body.classList.toggle("is-portrait-orientation", isPortrait);
    if (els.orientationGuard) {
      els.orientationGuard.setAttribute("aria-hidden", isPortrait ? "false" : "true");
    }
    syncOrientationGuardPause(isPortrait);
  }

  function isPortraitViewport(viewportWidth, viewportHeight) {
    const width = Number(viewportWidth) || window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const height = Number(viewportHeight) || window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    return height > width;
  }

  function canPauseForOrientationGuard() {
    return ["countdown", "memory", "transition", "question"].includes(state.phase);
  }

  function clearOrientationGuardPauseState() {
    orientationAutoPauseActive = false;
    wasPausedBeforeOrientation = false;
  }

  function syncOrientationGuardPause(isPortrait) {
    if (isPortrait) {
      if (!orientationAutoPauseActive && canPauseForOrientationGuard()) {
        orientationAutoPauseActive = true;
        wasPausedBeforeOrientation = state.phase === "pause";
        if (state.phase !== "pause") {
          pauseGame({ showPauseModal: false, countPause: false });
        }
      }
      return;
    }

    if (!orientationAutoPauseActive) return;

    const shouldResume = !wasPausedBeforeOrientation && state.phase === "pause";
    clearOrientationGuardPauseState();
    if (shouldResume) resumeGame({ hidePauseModal: false });
  }

  function isMobileLandscape() {
    return window.matchMedia("(orientation: landscape) and (pointer: coarse)").matches;
  }

  function requestAppFullscreen() {
    if (
      !isMobileLandscape()
      || document.fullscreenElement
      || document.webkitFullscreenElement
    ) {
      return;
    }

    const target = document.documentElement;
    const request = target.requestFullscreen || target.webkitRequestFullscreen;

    if (typeof request !== "function") {
      updateGameScale();
      return;
    }

    try {
      const requestResult = request.call(target, { navigationUI: "hide" });
      if (requestResult && typeof requestResult.then === "function") {
        requestResult
          .then(() => window.setTimeout(updateGameScale, 250))
          .catch(updateGameScale);
        return;
      }

      window.setTimeout(updateGameScale, 250);
    } catch (error) {
      updateGameScale();
    }
  }

  function runAfterStartButtonPress() {
    return (event) => {
      requestAppFullscreen();
      startFlow(event);
    };
  }

  function handleStartScreenBackgroundPress(event) {
    if (
      event.target
      && typeof event.target.closest === "function"
      && event.target.closest("button, a, input, select, textarea, label")
    ) {
      return;
    }

    requestAppFullscreen();
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
      runWhenLandscape(() => {
        if (els.startScreen) {
          els.startScreen.classList.remove("is-loading");
          els.startScreen.classList.add("is-loaded");
        }
        document.body.dataset.loading = "false";
        completeIntroLoading();
      });
      return;
    }

    document.body.dataset.loading = "true";
    els.startScreen.classList.add("is-loading");
    els.startScreen.classList.remove("is-loaded");
    els.startScreen.classList.remove("is-intro-revealing");
    els.startLoadingFill.style.width = "0%";
    els.startLoadingText.textContent = "0%";

    const duration = 1800;
    let activeElapsed = 0;
    let lastFrameAt = performance.now();
    const assetsReady = preloadGameAssets();

    function update(now) {
      updateOrientationGuard();
      if (isPortraitViewport()) {
        lastFrameAt = now;
        window.requestAnimationFrame(update);
        return;
      }

      activeElapsed += Math.max(0, now - lastFrameAt);
      lastFrameAt = now;
      const progress = Math.min(1, activeElapsed / duration);
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

      assetsReady.then(() => runWhenLandscape(() => window.setTimeout(() => {
        runWhenLandscape(() => {
          els.startScreen.classList.remove("is-loading");
          els.startScreen.classList.add("is-loaded");
          document.body.dataset.loading = "false";
          if (shouldAutoStartAfterLoading()) {
            completeIntroLoading();
            return;
          }
          els.startScreen.classList.add("is-intro-revealing");
          window.setTimeout(() => {
            runWhenLandscape(() => {
              els.startScreen.classList.remove("is-intro-revealing");
              completeIntroLoading();
            });
          }, 850);
        });
      }, 260)));
    }

    window.requestAnimationFrame(update);
  }

  function runWhenLandscape(callback) {
    updateOrientationGuard();
    if (!isPortraitViewport()) {
      callback();
      return;
    }

    window.requestAnimationFrame(() => runWhenLandscape(callback));
  }

  function completeIntroLoading() {
    if (shouldAutoStartAfterLoading()) {
      startFlow();
      return;
    }
    openConditionCheck();
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
  function clearStartCountdown() {
    if (state.startCountdownFrameId) {
      window.cancelAnimationFrame(state.startCountdownFrameId);
      state.startCountdownFrameId = null;
    }
    if (state.startCountdownIntroTimeoutId) {
      window.clearTimeout(state.startCountdownIntroTimeoutId);
      state.startCountdownIntroTimeoutId = null;
    }
    state.startCountdownIntroStartedAt = 0;
    state.startCountdownIntroRemainingMs = 0;
    state.startCountdownPausedAt = 0;
    if (els.gameCountdown) {
      els.gameCountdown.classList.add("is-hidden");
      els.gameCountdown.classList.remove("is-intro");
      els.gameCountdown.setAttribute("aria-hidden", "true");
    }
    if (els.gameCountdownTimer) {
      els.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");
    }
  }
  function clearAllTimers() {
    Object.keys(timers).forEach(clearTimer);
    clearStartCountdown();
    cancelMemoryProgressAnimation();
    stopVoiceGuide();
  }

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

  function createAudioSource(src) {
    return `${src}?v=${AUDIO_CACHE_BUST}`;
  }

  function getAudioPool(type) {
    const track = AUDIO_TRACKS[type];
    if (!track || !track.src || typeof Audio !== "function") return [];
    if (!audioPools.has(type)) {
      const poolSize = Math.max(1, Number(track.poolSize) || 1);
      const pool = Array.from({ length: poolSize }, () => {
        const audio = new Audio(createAudioSource(track.src));
        audio.loop = track.loop === true;
        audio.preload = "auto";
        audio.volume = track.volume || 0.7;
        return audio;
      });
      audioPools.set(type, pool);
      audioPoolIndexes.set(type, 0);
    }
    return audioPools.get(type);
  }

  function preloadAudioAssets() {
    Object.keys(AUDIO_TRACKS).forEach((type) => {
      getAudioPool(type).forEach((audio) => {
        try {
          audio.load();
        } catch (error) {
          // Voice guidance is optional and should not block the game.
        }
      });
    });
  }

  function unlockAudioFromGesture() {
    if (audioUnlocked || typeof Audio !== "function") return;
    audioUnlocked = true;
    Object.keys(AUDIO_TRACKS).forEach((type) => {
      if (AUDIO_TRACKS[type].channel === "background") return;
      const audio = getAudioPool(type)[0];
      if (!audio) return;
      const originalMuted = audio.muted;
      const originalVolume = audio.volume;
      audio.dataset.audioUnlocking = "true";
      audio.muted = true;
      audio.volume = 0;
      const playPromise = audio.play();
      const reset = () => {
        if (audio.dataset.audioUnlocking !== "true") return;
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch (error) {
          // Best effort unlock only.
        }
        audio.muted = originalMuted;
        audio.volume = originalVolume;
        delete audio.dataset.audioUnlocking;
      };
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.then(reset).catch(reset);
        return;
      }
      reset();
    });
    syncBackgroundMusic();
  }

  function playSound(type, options = {}) {
    const track = AUDIO_TRACKS[type];
    if (!track || track.channel === "voice") return;
    if (track.channel === "background") {
      playBackgroundMusic();
      return;
    }
    if (!options.force && (!els.soundToggle || !els.soundToggle.checked)) return;
    const pool = getAudioPool(type);
    if (pool.length === 0) return;
    const nextIndex = audioPoolIndexes.get(type) || 0;
    const audio = pool[nextIndex % pool.length];
    audioPoolIndexes.set(type, (nextIndex + 1) % pool.length);
    delete audio.dataset.audioUnlocking;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (error) {
      // Effects are optional; keep the game moving if the browser refuses.
    }
    audio.muted = false;
    audio.volume = track.volume || 0.7;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  function getBackgroundAudio() {
    const pool = getAudioPool("background");
    backgroundAudio = pool[backgroundAudioIndex] || pool[0] || null;
    return backgroundAudio;
  }

  function getBackgroundAudioPool() {
    getBackgroundAudio();
    return getAudioPool("background");
  }

  function isBackgroundSoundEnabled() {
    return !els.backgroundSoundToggle || els.backgroundSoundToggle.checked;
  }

  function shouldPlayBackgroundMusic() {
    const screen = document.body.dataset.screen || (els.app && els.app.dataset.screen) || "";
    return isBackgroundSoundEnabled()
      && screen !== "result"
      && screen !== "error"
      && ["start", "difficulty", "countdown", "memory", "transition", "question"].includes(state.phase);
  }

  function getBackgroundMusicVolume() {
    return state.phase === "start" || state.phase === "difficulty"
      ? AUDIO_TRACKS.background.menuVolume
      : AUDIO_TRACKS.background.volume;
  }

  function playBackgroundMusic() {
    if (!shouldPlayBackgroundMusic()) {
      pauseBackgroundMusic();
      return;
    }
    if (backgroundCrossfadeActive) return;
    const audio = getBackgroundAudio();
    if (!audio) return;
    delete audio.dataset.audioUnlocking;
    audio.muted = false;
    audio.loop = false;
    audio.volume = getBackgroundMusicVolume();
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise
        .then(startBackgroundLoopWatch)
        .catch(() => {});
      return;
    }
    startBackgroundLoopWatch();
  }

  function pauseBackgroundMusic(reset = false) {
    stopBackgroundLoopWatch();
    stopBackgroundCrossfade();
    getBackgroundAudioPool().forEach((audio) => {
      audio.pause();
      audio.volume = 0;
      if (reset) {
        try {
          audio.currentTime = 0;
        } catch (error) {
          // Optional background audio should never block navigation.
        }
      }
    });
    backgroundAudioIndex = 0;
    backgroundAudio = getBackgroundAudioPool()[0] || null;
  }

  function syncBackgroundMusic() {
    if (!isBackgroundSoundEnabled() || !shouldPlayBackgroundMusic()) {
      pauseBackgroundMusic(!isBackgroundSoundEnabled());
      return;
    }
    if (backgroundCrossfadeActive) return;
    playBackgroundMusic();
  }

  function stopBackgroundLoopWatch() {
    if (backgroundLoopFrameId) {
      window.cancelAnimationFrame(backgroundLoopFrameId);
      backgroundLoopFrameId = null;
    }
  }

  function stopBackgroundCrossfade() {
    backgroundCrossfadeActive = false;
    if (backgroundFadeFrameId) {
      window.cancelAnimationFrame(backgroundFadeFrameId);
      backgroundFadeFrameId = null;
    }
  }

  function startBackgroundLoopWatch() {
    if (backgroundCrossfadeActive) return;
    stopBackgroundLoopWatch();

    function watchLoop() {
      if (!shouldPlayBackgroundMusic()) {
        stopBackgroundLoopWatch();
        return;
      }

      const pool = getBackgroundAudioPool();
      const current = pool[backgroundAudioIndex];
      const nextIndex = (backgroundAudioIndex + 1) % pool.length;
      const next = pool[nextIndex];
      const fadeSeconds = Math.max(0.1, Number(AUDIO_TRACKS.background.crossfadeSeconds) || 2.4);

      if (!current) return;

      if (current.paused) {
        try {
          current.currentTime = 0;
        } catch (error) {
          // Optional background recovery.
        }
        playBackgroundMusic();
        return;
      }

      if (
        next &&
        Number.isFinite(current.duration) &&
        current.duration > fadeSeconds &&
        current.duration - current.currentTime <= fadeSeconds &&
        next.paused
      ) {
        crossfadeBackgroundAudio(current, next, nextIndex, fadeSeconds);
        return;
      }

      backgroundLoopFrameId = window.requestAnimationFrame(watchLoop);
    }

    backgroundLoopFrameId = window.requestAnimationFrame(watchLoop);
  }

  function crossfadeBackgroundAudio(current, next, nextIndex, fadeSeconds) {
    if (backgroundCrossfadeActive) return;
    backgroundCrossfadeActive = true;
    stopBackgroundLoopWatch();
    const startedAt = performance.now();
    next.pause();
    try {
      next.currentTime = 0;
    } catch (error) {
      // Best effort; a failed seek just means the natural loop resumes later.
    }
    next.loop = false;
    next.muted = false;
    next.volume = 0;

    const playPromise = next.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        next.pause();
        next.volume = 0;
        stopBackgroundCrossfade();
        startBackgroundLoopWatch();
      });
    }

    function step(now) {
      if (!backgroundCrossfadeActive) return;
      if (!shouldPlayBackgroundMusic()) {
        current.volume = 0;
        next.volume = 0;
        stopBackgroundCrossfade();
        return;
      }

      const progress = Math.min(1, (now - startedAt) / (fadeSeconds * 1000));
      const targetVolume = getBackgroundMusicVolume();
      current.volume = targetVolume * (1 - progress);
      next.volume = targetVolume * progress;

      if (progress < 1) {
        backgroundFadeFrameId = window.requestAnimationFrame(step);
        return;
      }

      current.pause();
      try {
        current.currentTime = 0;
      } catch (error) {
        // Optional background audio cleanup.
      }
      backgroundAudioIndex = nextIndex;
      backgroundAudio = next;
      next.volume = targetVolume;
      backgroundFadeFrameId = null;
      backgroundCrossfadeActive = false;
      startBackgroundLoopWatch();
    }

    backgroundFadeFrameId = window.requestAnimationFrame(step);
  }

  function handleButtonClickSound(event) {
    const button = event.target && typeof event.target.closest === "function"
      ? event.target.closest("button")
      : null;
    if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return;
    if (button.classList.contains("choice-card")) return;
    if (button.classList.contains("pause-sound-button")) return;
    playSound("button");
  }

  function playToggleSound(sourceToggle) {
    playSound("toggle", { force: sourceToggle === els.soundToggle });
  }

  function isVoiceGuideEnabled() {
    return !els.voiceGuideToggle || els.voiceGuideToggle.checked;
  }

  function stopVoiceGuide() {
    if (voiceGuideTimerId) {
      window.clearTimeout(voiceGuideTimerId);
      voiceGuideTimerId = null;
    }
    if (!activeVoiceGuideAudio) return;
    activeVoiceGuideAudio.pause();
    try {
      activeVoiceGuideAudio.currentTime = 0;
    } catch (error) {
      // Some browsers reject currentTime changes before metadata is ready.
    }
    activeVoiceGuideAudio = null;
  }

  function playVoiceGuide(type, options = {}) {
    const track = AUDIO_TRACKS[type];
    if (!track || track.channel !== "voice") return;
    stopVoiceGuide();
    const delayMs = Math.max(0, Number(options.delayMs) || 0);
    if (delayMs > 0) {
      voiceGuideTimerId = window.setTimeout(() => {
        voiceGuideTimerId = null;
        startVoiceGuide(type);
      }, delayMs);
      return;
    }
    startVoiceGuide(type);
  }

  function startVoiceGuide(type) {
    const track = AUDIO_TRACKS[type];
    if (!track || track.channel !== "voice" || !isVoiceGuideEnabled() || state.phase === "pause") return;
    const pool = getAudioPool(type);
    const audio = pool[0];
    if (!audio) return;
    delete audio.dataset.audioUnlocking;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (error) {
      // Best effort: voice guidance should never block game flow.
    }
    audio.muted = false;
    audio.volume = track.volume || 0.7;
    activeVoiceGuideAudio = audio;
    audio.onended = () => {
      if (activeVoiceGuideAudio === audio) activeVoiceGuideAudio = null;
    };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (activeVoiceGuideAudio === audio) activeVoiceGuideAudio = null;
      });
    }
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
    syncBackgroundMusic();
  }

  function bridge() { return window.ShopQuestMemoryGameAppBridge || null; }
  function sendBridge(methods, payload) { const b = bridge(); if (!b) return false; return methods.some((m) => typeof b[m] === "function" && (b[m](payload), true)); }
  function isCareMode() { return runtimeConfig && (runtimeConfig.mode === "care" || runtimeConfig.mode === "ai_assisted"); }
  function canUseDragMode() { return runtimeConfig && runtimeConfig.useDrag !== false && !isCareMode(); }
  function usesSoftFeedback() { return runtimeConfig && runtimeConfig.softFeedback === true; }
  function shouldUseDirectFeedback() { return runtimeConfig && runtimeConfig.softFeedback === false; }
  function isCareResultMode() { return runtimeConfig && (runtimeConfig.mode === "reminder" || (runtimeConfig.ui && runtimeConfig.ui.showScore === false)); }
  function shouldAutoReturnToHubAfterResult() { return runtimeConfig && ["reminder", "care", "ai_assisted"].includes(runtimeConfig.mode); }
  function getMemoryVoiceGuideType() { return shouldUseDirectFeedback() ? "voiceMemory" : "voiceSoftFeedbackMemory"; }
  function getQuestionVoiceGuideType() { return shouldUseDirectFeedback() ? "voiceQuestion" : "voiceSoftFeedbackQuestion"; }
  function getRetryVoiceGuideType(wrongAttempts) {
    const isThirdWrong = Number(wrongAttempts) >= 3;
    if (shouldUseDirectFeedback()) return isThirdWrong ? "voiceRetry3" : "voiceRetry";
    return isThirdWrong ? "voiceSoftFeedbackRetry3" : "voiceSoftFeedbackRetry";
  }
  function getFeedbackVoiceGuideType(isCorrect) {
    if (isCorrect) return shouldUseDirectFeedback() ? "voiceCorrect" : "voiceSoftFeedbackCorrect";
    return getRetryVoiceGuideType(state.wrongSelectedIds.length);
  }
  function getCareResultVoiceGuideType() {
    if (shouldAutoReturnToHubAfterResult()) return null;
    if (shouldUseDirectFeedback() || !isCareResultMode()) return null;
    return state.questionLogs.length > 0 ? "voiceCareResult2" : "voiceCareResult1";
  }
  function getRetryFeedbackTime() {
    if (runtimeConfig && runtimeConfig.mode === "standard") return STANDARD_RETRY_FEEDBACK_TIME;
    return isCareMode() ? CARE_RETRY_FEEDBACK_TIME : RETRY_FEEDBACK_TIME;
  }
  function getTotalQuestions() { return Math.max(1, runtimeConfig ? runtimeConfig.totalQuestions : 10); }
  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
  function findItem(id) { return SHOPPING_ITEMS.find((item) => item.id === id) || null; }
  function getChoiceImage(item) { return item && (item.choiceImage || item.image); }
  function getBasketItemImage(item) { return item && (item.image || item.choiceImage); }
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
    state.settings.backgroundSoundEnabled = runtimeConfig.soundEnabled !== false;
    state.settings.voiceGuideEnabled = runtimeConfig.voiceGuideEnabled !== false;
    state.settings.useDrag = runtimeConfig.defaultInputMode === "drag" && canUseDragMode();
    const ui = runtimeConfig.ui || {};
    const mode = runtimeConfig.mode || "standard";
    const showScore = ui.showScore !== false;
    const resultStyle = !showScore || mode === "reminder" ? "care" : "standard";
    document.documentElement.dataset.mode = mode;
    document.documentElement.dataset.difficultyKey = state.difficultyKey || runtimeConfig.difficultyKey || "easy";
    document.documentElement.dataset.resultStyle = resultStyle;
    document.documentElement.dataset.showTimer = ui.showTimer === false ? "false" : "true";
    document.documentElement.dataset.showProgress = ui.showProgress === false ? "false" : "true";
    document.documentElement.dataset.showScore = showScore ? "true" : "false";
    document.documentElement.dataset.showSettings = ui.showSettings === false ? "false" : "true";
    document.documentElement.dataset.showTutorial = ui.showTutorial === false ? "false" : "true";
    document.documentElement.dataset.showConditionCheck = ui.showConditionCheck === false ? "false" : "true";
    document.documentElement.dataset.showFinishCheck = ui.showFinishCheck === false ? "false" : "true";
    if (els.app) {
      els.app.dataset.mode = mode;
      els.app.dataset.resultStyle = resultStyle;
      els.app.dataset.showScore = showScore ? "true" : "false";
    }
    if (els.backgroundSoundToggle) els.backgroundSoundToggle.checked = state.settings.backgroundSoundEnabled;
    if (els.soundToggle) els.soundToggle.checked = state.settings.soundEnabled;
    if (els.voiceGuideToggle) els.voiceGuideToggle.checked = state.settings.voiceGuideEnabled;
    updatePauseSoundButtons();
    updateInputModeButtons();
  }

  function shouldShowConditionCheck() { return runtimeConfig && runtimeConfig.collectCondition !== false && runtimeConfig.ui && runtimeConfig.ui.showConditionCheck !== false; }
  function shouldShowFinishCheck() { return runtimeConfig && runtimeConfig.ui && runtimeConfig.ui.showFinishCheck !== false; }
  function shouldShowDifficultySelect() { return runtimeConfig && runtimeConfig.ui && runtimeConfig.ui.showDifficultySelect !== false; }
  function shouldAutoStartAfterLoading() { return runtimeConfig && runtimeConfig.mode === "reminder"; }

  function getDifficultyConfigForQuestion(key, questionIndex) {
    const base = DEFAULT_DIFFICULTIES[key] || DEFAULT_DIFFICULTIES.easy;
    const override = runtimeConfig && runtimeConfig.difficulties && runtimeConfig.difficulties[key] ? runtimeConfig.difficulties[key] : {};
    const merged = { ...base, ...override, key };
    if (runtimeConfig.memoryItemCount) merged.memoryItemCount = runtimeConfig.memoryItemCount;
    if (runtimeConfig.answerChoiceCount) merged.answerChoiceCount = runtimeConfig.answerChoiceCount;
    if (runtimeConfig.revealMs) merged.revealMs = runtimeConfig.revealMs;
    if (shouldUseStandardDifficultyPlan()) {
      const plan = getStandardDifficultyQuestionPlan(key, questionIndex);
      if (plan) {
        merged.memoryItemCount = plan.memoryItemCount;
        merged.answerChoiceCount = plan.answerChoiceCount;
      }
      merged.revealMs = STANDARD_REVEAL_MS_BY_DIFFICULTY[key] || STANDARD_REVEAL_MS_BY_DIFFICULTY.easy;
    }
    if (isCareMode()) {
      const plan = getCareDifficultyQuestionPlan(key, state.questionIndex);
      merged.memoryItemCount = plan.memoryItemCount;
      merged.answerChoiceCount = plan.answerChoiceCount;
      merged.revealMs = CARE_REVEAL_MS;
    }
    const configuredMaxMemoryItems = runtimeConfig.maxItemsToRemember || MAX_MEMORY_ITEMS;
    const configuredMaxAnswerChoices = runtimeConfig.answerChoiceCount || (shouldUseStandardDifficultyPlan() ? STANDARD_MAX_ANSWER_CHOICES : SHOPPING_ITEMS.length);
    const maxMemoryItems = Math.min(configuredMaxMemoryItems, MAX_MEMORY_ITEMS);
    const maxAnswerChoices = Math.min(configuredMaxAnswerChoices, SHOPPING_ITEMS.length);
    merged.memoryItemCount = Math.max(1, Math.min(merged.memoryItemCount, maxMemoryItems));
    merged.answerChoiceCount = Math.max(merged.memoryItemCount + 1, Math.min(merged.answerChoiceCount, maxAnswerChoices));
    return merged;
  }

  function getDifficultyConfig(key) {
    return getDifficultyConfigForQuestion(key, state.questionIndex);
  }

  function shouldUseStandardDifficultyPlan() {
    return runtimeConfig && (runtimeConfig.mode === "standard" || runtimeConfig.mode === "reminder") && !isCareMode();
  }

  function getStandardDifficultyQuestionPlan(key, questionIndex) {
    const plans = STANDARD_DIFFICULTY_QUESTION_PLANS[key] || STANDARD_DIFFICULTY_QUESTION_PLANS.easy;
    const questionNumber = questionIndex + 1;
    return plans.find((plan) => questionNumber <= plan.through) || plans[plans.length - 1];
  }

  function getCareDifficultyQuestionPlan(key, questionIndex) {
    const plans = CARE_DIFFICULTY_QUESTION_PLANS[key] || CARE_DIFFICULTY_QUESTION_PLANS.easy;
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
    return { id: `${difficulty.key}-${state.questionIndex + 1}-${Date.now()}`, difficultyKey: difficulty.key, difficultyLabel: difficulty.label, targetItems, choiceItems: shuffle([...targetItems, ...pickDistractors(difficulty, targetItems)]), revealMs: difficulty.revealMs, hintUsed: false, hintLevel: 0, choiceHintUsed: false, inputType: "touch" };
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
    if (els.stageLabel) els.stageLabel.textContent = difficulty.label;
    if (els.timeLeft) els.timeLeft.textContent = formatTime(state.remainingSeconds);
    if (els.timerBox) els.timerBox.classList.toggle("is-low", state.remainingSeconds <= 10);
    updateRaceUi();
  }
  function updateHud() {
    const total = getTotalQuestions();
    const current = Math.min(state.questionIndex + 1, total);
    if (els.roundLabel) els.roundLabel.textContent = `${current} / ${total}`;
    if (els.hudProgress) {
      const ratio = Math.max(0, Math.min(1, current / total));
      els.hudProgress.style.setProperty("--hud-progress", `${ratio * 100}%`);
      els.hudProgress.setAttribute("aria-valuemax", String(total));
      els.hudProgress.setAttribute("aria-valuenow", String(current));
    }
    if (els.hudProgressCurrent) els.hudProgressCurrent.textContent = String(current);
    if (els.hudProgressTotal) els.hudProgressTotal.textContent = String(total);
    els.hudProgressSteps.forEach((step, index) => {
      const stepRatio = els.hudProgressSteps.length <= 1 ? 1 : index / (els.hudProgressSteps.length - 1);
      step.classList.toggle("is-active", stepRatio <= Math.max(0, Math.min(1, current / total)));
    });
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
      updateMemoryProgress();
    }, 1000);
  }

  function startFlow() {
    if (shouldShowConditionCheck() && !state.condition.completed) { pendingStart = true; renderConditionSleepRows(); els.conditionModal.classList.remove("is-hidden"); return; }
    if (shouldShowDifficultySelect()) { clearAllTimers(); state.phase = "difficulty"; setScreen("difficulty"); return; }
    startGame(runtimeConfig.difficultyKey || "easy");
  }

  function startGame(difficultyKey) {
    clearOrientationGuardPauseState();
    startReadyCountdown(difficultyKey);
  }

  function resetRunState(phase, difficultyKey, startedAt) {
    Object.assign(state, { phase, difficultyKey: difficultyKey || runtimeConfig.difficultyKey || "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, touchMissCount: 0, questionTouchMissCount: 0, missedItemCount: 0, questionLogs: [], startedAt: startedAt || null, endedAt: null, status: "completed", abandonReason: null, externalInputUsed: false });
  }

  function startReadyCountdown(difficultyKey) {
    clearAllTimers();
    const nextDifficultyKey = difficultyKey || runtimeConfig.difficultyKey || "easy";
    resetRunState("countdown", nextDifficultyKey, null);
    els.pauseButton.classList.remove("is-paused");
    setScreen("game");
    document.body.dataset.gamePhase = "countdown";
    if (els.playArea) els.playArea.innerHTML = "";
    updateHud();
    els.hintButton.classList.add("is-hidden");

    if (!els.gameCountdown || !els.gameCountdownTimer || !els.gameCountdownNumber) {
      beginGame(nextDifficultyKey);
      return;
    }

    els.gameCountdown.classList.remove("is-hidden");
    els.gameCountdown.classList.add("is-intro");
    els.gameCountdown.setAttribute("aria-hidden", "false");
    els.gameCountdownNumber.textContent = "3";
    els.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");

    if (!els.gameCountdownMessage) {
      beginReadyCountdown(nextDifficultyKey);
      syncOrientationGuardPause(isPortraitViewport());
      return;
    }

    els.gameCountdownMessage.textContent = "\uAC8C\uC784\uC774 \uACE7 \uC2DC\uC791\uB3FC\uC694!";
    playVoiceGuide("voiceReady", { delayMs: VOICE_GUIDE_STAGE_DELAY_MS });
    scheduleReadyCountdownIntro(nextDifficultyKey, START_READY_MESSAGE_TIME);
    syncOrientationGuardPause(isPortraitViewport());
  }

  function scheduleReadyCountdownIntro(difficultyKey, delay) {
    const remaining = Math.max(0, Number(delay) || 0);
    state.startCountdownIntroRemainingMs = remaining;
    state.startCountdownIntroStartedAt = performance.now();
    state.startCountdownIntroTimeoutId = window.setTimeout(() => {
      state.startCountdownIntroTimeoutId = null;
      state.startCountdownIntroStartedAt = 0;
      state.startCountdownIntroRemainingMs = 0;
      beginReadyCountdown(difficultyKey);
    }, remaining);
  }

  function beginReadyCountdown(difficultyKey) {
    if (state.phase !== "countdown" || !els.gameCountdown || !els.gameCountdownTimer || !els.gameCountdownNumber) return;
    let startedAt = performance.now();
    state.startCountdownPausedAt = 0;
    els.gameCountdown.classList.remove("is-intro");
    let lastDisplaySeconds = null;

    function updateCountdown(now) {
      if (state.phase === "pause") {
        if (!state.startCountdownPausedAt) state.startCountdownPausedAt = now;
        state.startCountdownFrameId = window.requestAnimationFrame(updateCountdown);
        return;
      }

      if (state.startCountdownPausedAt) {
        startedAt += now - state.startCountdownPausedAt;
        state.startCountdownPausedAt = 0;
      }

      const elapsed = Math.max(0, now - startedAt);
      const remaining = Math.max(0, START_COUNTDOWN_TIME - elapsed);
      const displaySeconds = Math.max(1, Math.ceil(remaining / 1000));
      const secondProgress = (elapsed % 1000) / 1000;
      const angle = secondProgress * 360;

      els.gameCountdownNumber.textContent = String(displaySeconds);
      els.gameCountdownTimer.style.setProperty("--countdown-angle", `${angle}deg`);
      if (displaySeconds !== lastDisplaySeconds && remaining > 0) {
        lastDisplaySeconds = displaySeconds;
        playSound("countdown");
      }

      if (remaining <= 0) {
        els.gameCountdownTimer.style.setProperty("--countdown-angle", "360deg");
        clearStartCountdown();
        beginGame(difficultyKey);
        return;
      }

      state.startCountdownFrameId = window.requestAnimationFrame(updateCountdown);
    }

    updateCountdown(startedAt);
  }

  function beginGame(difficultyKey) {
    clearAllTimers();
    const startedAt = new Date();
    resetRunState("memory", difficultyKey || runtimeConfig.difficultyKey || "easy", startedAt);
    els.pauseButton.classList.remove("is-paused");
    setScreen("game");
    sendBridge(["sendGameStarted", "sendStarted"], { game_id: GAME_ID, session_id: runtimeConfig.sessionId, mode: runtimeConfig.mode, difficulty: state.difficultyKey, started_at: state.startedAt.toISOString() });
    playSound("start");
    startGameTimer(true);
    beginQuestion();
    syncOrientationGuardPause(isPortraitViewport());
  }

  function beginQuestion() {
    clearTimer("phase"); clearTimer("countdown"); clearTimer("autoHint");
    state.question = generateQuestion();
    const question = state.question;
    state.selectedIds = []; state.wrongSelectedIds = []; state.collectedItems = []; state.firstResponseAt = null; state.questionStartedAt = null; state.questionTouchMissCount = 0;
    state.revealRemaining = Math.max(1, Math.ceil(state.question.revealMs / 1000));
    state.phase = "memory";
    updateHud();
    warmQuestionAssets(question).then(() => {
      if (state.question !== question || state.phase !== "memory") return;
      renderMemory();
      syncBackgroundMusic();
      playVoiceGuide(getMemoryVoiceGuideType(), { delayMs: VOICE_GUIDE_STAGE_DELAY_MS });
      startMemoryCountdownTimer();
      schedulePhaseTimer(shouldUseStandardDifficultyPlan() ? showQuestion : showTransition, question.revealMs);
    });
  }

  function showTransition() {
    clearTimer("phase");
    clearTimer("countdown");
    state.phase = "transition";
    renderTransition();
    syncBackgroundMusic();
    if (!shouldUseDirectFeedback()) {
      playVoiceGuide("voiceSoftFeedbackThink", { delayMs: VOICE_GUIDE_STAGE_DELAY_MS });
    }
    schedulePhaseTimer(showQuestion, TRANSITION_TIME);
  }
  function showQuestion() {
    clearTimer("phase");
    const question = state.question;
    warmQuestionAssets(question).then(() => {
      if (state.question !== question || (state.phase !== "memory" && state.phase !== "transition")) return;
      state.phase = "question";
      state.questionStartedAt = Date.now();
      renderQuestion();
      syncBackgroundMusic();
      playVoiceGuide(getQuestionVoiceGuideType(), { delayMs: VOICE_GUIDE_STAGE_DELAY_MS });
      if (runtimeConfig.autoHintEnabled && runtimeConfig.hintEnabled) scheduleAutoHintTimer(AUTO_HINT_DELAY_MS);
    });
  }

  function renderMemoryRibbon(title) {
    return `<div class="memory-card memory-ribbon-card"><svg class="memory-ribbon-svg" viewBox="0 0 1120 180" aria-hidden="true" focusable="false"><defs><linearGradient id="memoryRibbonFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff9b31" /><stop offset="100%" stop-color="#ff6412" /></linearGradient><linearGradient id="memoryRibbonFold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f47b18" /><stop offset="100%" stop-color="#c84c08" /></linearGradient></defs><g class="memory-ribbon-shadow"><path d="M70 70 L180 64 L180 122 L70 128 L105 96 Z" /><path d="M1050 70 L940 64 L940 122 L1050 128 L1015 96 Z" /><path d="M175 40 H945 Q970 40 970 65 V115 Q970 140 945 140 H175 Q150 140 150 115 V65 Q150 40 175 40 Z" /></g><path class="memory-ribbon-tail" d="M70 70 L180 64 L180 122 L70 128 L105 96 Z" /><path class="memory-ribbon-tail" d="M1050 70 L940 64 L940 122 L1050 128 L1015 96 Z" /><path class="memory-ribbon-fold" d="M180 122 L255 140 L180 140 Z" /><path class="memory-ribbon-fold" d="M940 122 L865 140 L940 140 Z" /><rect class="memory-ribbon-main" x="150" y="40" width="820" height="100" rx="24" /><rect class="memory-ribbon-highlight" x="167" y="57" width="786" height="66" rx="18" /></svg><p class="guide-text memory-ribbon-text">${escapeHtml(title)}</p></div>`;
  }

  function renderTutorialMemoryPreview(step) {
    const targets = step.previewIds.map((id) => findItem(id)).filter(Boolean);
    const title = "기억할 물건을 잘 보세요!";
    const cards = targets.map((item) => `<div class="fruit-card" aria-label="${escapeHtml(item.name)}"><img class="fruit-image" src="${item.image}" alt="" draggable="false" loading="eager" decoding="async"></div>`).join("");
    return `<div class="tutorial-mini tutorial-memory-mini"><div class="tutorial-play-view"><div class="tutorial-memory-frame"><div class="tutorial-memory-stage"><section class="memory-view">${renderMemoryRibbon(title)}<div class="memory-items-panel" data-memory-count="${targets.length}"><div class="fruit-grid ${getMemoryGridClass(targets.length)} is-auto-fit" style="--memory-count:${targets.length}; --memory-columns:${targets.length}; --fruit-card-size:${MEMORY_LAYOUT_FIXED_CARD_SIZE}px; --fruit-grid-gap:${MEMORY_LAYOUT_FIXED_GAP}px;">${cards}</div></div><div class="memory-progress" role="progressbar" aria-label="기억 시간" aria-valuemin="0" aria-valuemax="3000" aria-valuenow="3000"><span class="memory-progress-fill"></span></div></section></div></div></div></div>`;
  }

  function renderTutorialSelectionPreview(step, mode = "touch") {
    const isDragMode = mode === "drag";
    const targetIds = new Set(step.previewIds);
    const choiceIds = [...step.previewIds, "apple", "bread", "orange"].filter((id, index, list) => list.indexOf(id) === index);
    const tapItem = findItem("carrot") || choiceIds.map((id) => findItem(id)).find(Boolean);
    const choiceCards = choiceIds.map((id, index) => {
      const item = findItem(id);
      if (!item) return "";
      const isTapTarget = tapItem && item.id === tapItem.id;
      return `<button class="choice-card ${isTapTarget ? "tutorial-tap-target" : ""}" type="button" data-item-id="${item.id}" aria-label="${escapeHtml(item.name)}"><img src="${getChoiceImage(item)}" alt="" draggable="false" loading="eager" decoding="async"></button>`;
    }).join("");
    const slots = Array.from({ length: Math.max(1, targetIds.size) }, (_, index) => {
      const previewItem = index === 0 && tapItem ? `<img class="tutorial-slot-item" src="${getChoiceImage(tapItem)}" alt="" draggable="false" loading="eager" decoding="async">` : "";
      return `<div class="basket-slot" data-slot-index="${index}">${previewItem}</div>`;
    }).join("");
    const flyingClass = isDragMode ? "tutorial-flying-choice is-drag-motion" : "tutorial-flying-choice";
    const flyingItem = tapItem ? `<img class="${flyingClass}" src="${getChoiceImage(tapItem)}" alt="" draggable="false" loading="eager" decoding="async">` : "";
    const stagePointer = tapItem ? `<span class="${isDragMode ? "tutorial-stage-drag-pointer" : "tutorial-stage-touch-pointer"}" aria-hidden="true">👆</span>` : "";
    return `<div class="tutorial-mini tutorial-selection-mini"><div class="tutorial-play-view"><div class="tutorial-selection-stage ${isDragMode ? "is-drag-mode" : "is-touch-mode"}"><div class="selection-instruction">${renderMemoryRibbon("장바구니에 담아주세요!")}</div><div class="selection-progress" role="progressbar" aria-label="남은 개수" aria-valuemin="0" aria-valuemax="${targetIds.size}" aria-valuenow="0"><div class="selection-progress-track"><span class="selection-progress-fill"></span></div><span class="selection-progress-label">남은 개수</span><strong class="selection-progress-count">0/${targetIds.size}</strong></div><section class="shelf-zone" aria-label="물건 선택"><img class="shelf-image" src="assets/images/stand2.webp" alt="" draggable="false" loading="eager" decoding="async"><div class="choice-grid" data-choice-count="${choiceIds.length}">${choiceCards}</div><div class="basket-zone" data-basket-drop-zone="true"><div class="basket-image-wrap"><div class="basket-ground-shadow" aria-hidden="true"></div><img class="basket-image" src="assets/images/basket2.webp" alt="장바구니" draggable="false" loading="eager" decoding="async"><div class="basket-collected" style="--basket-slot-count: ${targetIds.size};">${slots}</div></div></div></section>${flyingItem}${stagePointer}</div></div></div>`;
  }

  function renderMemory() {
    document.body.dataset.gamePhase = "memory";
    updateTopUi();
    const targets = state.question.targetItems;
    const title = usesSoftFeedback() ? `상품 ${targets.length}개를 사고 싶어요!` : "기억할 물건을 잘 보세요!";
    const cards = targets.map((item) => `<div class="fruit-card" aria-label="${escapeHtml(item.name)}"><img class="fruit-image" src="${item.image}" alt="" draggable="false" loading="eager" decoding="async"></div>`).join("");
    els.playArea.innerHTML = `<section class="memory-view">${renderMemoryRibbon(title)}<div class="memory-items-panel" data-memory-count="${targets.length}"><div class="fruit-grid ${getMemoryGridClass(targets.length)} is-auto-fit" style="--memory-count:${targets.length}; --memory-columns:${targets.length}">${cards}</div></div><div class="memory-progress" role="progressbar" aria-label="기억 시간" aria-valuemin="0" aria-valuemax="${state.question.revealMs}" aria-valuenow="${state.question.revealMs}"><span class="memory-progress-fill"></span></div></section>`;
    animateMemoryProgress(state.question.revealMs);
    els.hintButton.classList.add("is-hidden");
    scheduleMemoryLayout();
    window.setTimeout(scheduleMemoryLayout, 60);
  }

  function updateMemoryProgress() {
    const progress = els.playArea.querySelector(".memory-progress");
    if (!progress || !state.question) return;
    const totalSeconds = Math.max(1, Math.ceil(state.question.revealMs / 1000));
    const remainingSeconds = Math.max(0, state.revealRemaining);
    const ratio = Math.min(1, remainingSeconds / totalSeconds);
    progress.setAttribute("aria-valuenow", String(Math.round(ratio * state.question.revealMs)));
  }

  function cancelMemoryProgressAnimation() {
    if (!memoryProgressFrame) return;
    window.cancelAnimationFrame(memoryProgressFrame);
    memoryProgressFrame = null;
  }

  function setMemoryProgressVisual(progress, fill, remainingMs) {
    const totalMs = Math.max(1, state.question ? state.question.revealMs : 1);
    const safeRemainingMs = Math.max(0, Math.min(totalMs, Number(remainingMs) || 0));
    const ratio = safeRemainingMs / totalMs;
    fill.style.transition = "none";
    fill.style.width = "100%";
    fill.style.transform = `scaleX(${ratio})`;
    progress.setAttribute("aria-valuenow", String(Math.round(safeRemainingMs)));
  }

  function animateMemoryProgress(remainingMs, shouldAnimate = true) {
    const progress = els.playArea.querySelector(".memory-progress");
    const fill = progress && progress.querySelector(".memory-progress-fill");
    if (!progress || !fill || !state.question) return;
    cancelMemoryProgressAnimation();
    const totalMs = Math.max(1, state.question.revealMs);
    const safeRemainingMs = Math.max(0, Math.min(totalMs, Number(remainingMs) || 0));
    const startedAt = window.performance && window.performance.now ? window.performance.now() : Date.now();
    const endsAt = startedAt + safeRemainingMs;
    setMemoryProgressVisual(progress, fill, safeRemainingMs);
    if (!shouldAnimate || safeRemainingMs <= 0) return;

    const tick = (now) => {
      if (state.phase !== "memory" || !fill.isConnected) {
        memoryProgressFrame = null;
        return;
      }
      const remaining = Math.max(0, endsAt - now);
      setMemoryProgressVisual(progress, fill, remaining);
      if (remaining <= 0) {
        memoryProgressFrame = null;
        return;
      }
      memoryProgressFrame = window.requestAnimationFrame(tick);
    };
    memoryProgressFrame = window.requestAnimationFrame(tick);
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
    const panel = view.querySelector(".memory-items-panel");
    if (!grid || !panel || grid.children.length === 0) return;

    const count = grid.children.length;
    const columns = Math.min(MEMORY_LAYOUT_MAX_COLUMNS, count);
    grid.style.setProperty("--memory-columns", columns);
    grid.style.setProperty("--fruit-card-size", `${MEMORY_LAYOUT_FIXED_CARD_SIZE}px`);
    grid.style.setProperty("--fruit-grid-gap", `${MEMORY_LAYOUT_FIXED_GAP}px`);
    grid.dataset.columns = String(columns);
    grid.dataset.rows = String(Math.ceil(count / columns));
  }

  function renderTransition() {
    document.body.dataset.gamePhase = "transition";
    updateTopUi();
    const itemName = state.question.targetItems.length === 1 ? state.question.targetItems[0].name : "물건";
    const title = usesSoftFeedback() ? "좋아요. 장바구니에 하나씩 담아볼까요?" : isCareMode() ? `좋아요. 이제 ${itemName}을 찾아볼까요?` : "이제 장바구니에 담아볼까요?";
    if (usesSoftFeedback()) {
      els.playArea.innerHTML = `<section class="shop-round transition-message-only"><div class="transition-soft-message"><p>좋아요.<br>장바구니에 하나씩 담아볼까요?</p></div></section>`;
      return;
    }
    els.playArea.innerHTML = `<section class="shop-round"><div class="transition-card"><div class="transition-icon" aria-hidden="true">🧺</div><h2 class="round-title">${escapeHtml(title)}</h2><p class="round-kicker">양쪽에서 같은 물건을 찾아주세요</p></div></section>`;
  }
  function renderBasketSlots(question) {
    const slotCount = Math.max(1, question ? question.targetItems.length : 1);
    return Array.from({ length: slotCount }, (_, index) => {
      const item = state.collectedItems[index];
      const content = item
        ? `<img src="${getBasketItemImage(item)}" alt="" draggable="false" loading="eager" decoding="async" data-item-id="${item.id}">`
        : "";
      return `<div class="basket-slot ${item ? "is-filled" : ""}" data-slot-index="${index}" ${item ? `data-item-id="${item.id}"` : ""}>${content}</div>`;
    }).join("");
  }

  function getBasketSlotBoxWidth(slotCount) {
    const count = Math.max(1, Math.min(6, Number(slotCount) || 1));
    return 16 + (count * 62) + ((count - 1) * 5);
  }

  function renderQuestion() {
    document.body.dataset.gamePhase = "question";
    updateTopUi();
    const question = state.question;
    const remainingTargetIds = new Set(question.targetItems.map((item) => item.id));
    state.selectedIds.forEach((id) => remainingTargetIds.delete(id));
    const prompt = usesSoftFeedback() ? "무엇을 사야 할까요?" : "장바구니에 담아주세요!";
    const renderChoiceCards = (items) => items.map((item) => {
      const selected = state.selectedIds.includes(item.id);
      const wrong = state.wrongSelectedIds.includes(item.id);
      const hinted = question.choiceHintUsed && remainingTargetIds.has(item.id);
      return `<button class="choice-card ${selected ? "is-selected" : ""} ${wrong ? "is-wrong" : ""} ${hinted ? "is-hinted" : ""}" type="button" data-item-id="${item.id}" aria-label="${escapeHtml(item.name)}" ${selected ? "disabled" : ""}><img src="${getChoiceImage(item)}" alt="" draggable="false" loading="eager" decoding="async"></button>`;
    }).join("");
    els.playArea.innerHTML = `<section class="shop-round question-round"><div class="question-board"><div class="choice-layout"><section class="shelf-zone" aria-label="물건 선택"><img class="shelf-image" src="assets/images/stand2.webp" alt="" draggable="false" loading="eager" decoding="async"><div class="choice-grid" data-choice-count="${question.choiceItems.length}">${renderChoiceCards(question.choiceItems)}</div><div class="basket-zone" data-basket-drop-zone="true"><h2 class="round-title basket-prompt">${escapeHtml(prompt)}</h2><div class="basket-image-wrap ${state.collectedItems.length ? "is-bounce" : ""}"><div class="basket-ground-shadow" aria-hidden="true"></div><img class="basket-image" src="assets/images/basket2.webp" alt="장바구니" draggable="false" loading="eager" decoding="async"><div class="basket-collected" style="--basket-slot-count: ${question.targetItems.length}; --basket-slot-box-width: ${getBasketSlotBoxWidth(question.targetItems.length)}px;">${renderBasketSlots(question)}</div></div></div></section></div></div></section>`;
    const questionBoard = els.playArea.querySelector(".question-board");
    if (questionBoard) {
      questionBoard.insertAdjacentHTML("afterbegin", `<div class="selection-instruction">${renderMemoryRibbon(prompt)}</div><div class="selection-progress" role="progressbar" aria-label="&#xB0A8;&#xC740; &#xAC1C;&#xC218;" aria-valuemin="0" aria-valuemax="${question.targetItems.length}" aria-valuenow="0"><div class="selection-progress-track"><span class="selection-progress-fill"></span></div><span class="selection-progress-label">&#xB0A8;&#xC740; &#xAC1C;&#xC218;</span><strong class="selection-progress-count">0/${question.targetItems.length}</strong></div>`);
      if (els.hintButton) {
        const infoBar = document.querySelector(".game-header .info-bar");
        const missionPill = infoBar && infoBar.querySelector(".hud-mission-pill");
        if (isCareMode() && infoBar) {
          infoBar.insertBefore(els.hintButton, missionPill || null);
        } else {
          questionBoard.appendChild(els.hintButton);
        }
      }
    }
    updateSelectionProgress();
    updateHintButtonState();
    els.hintButton.classList.toggle("is-hidden", runtimeConfig.hintEnabled === false);
  }

  function updateSelectionProgress() {
    const progress = els.playArea.querySelector(".selection-progress");
    if (!progress || !state.question) return;
    const selectedCount = state.selectedIds.length;
    const totalCount = state.question.targetItems.length;
    const ratio = totalCount > 0 ? Math.min(1, selectedCount / totalCount) : 0;
    progress.style.setProperty("--selection-progress", `${ratio * 100}%`);
    progress.setAttribute("aria-valuemax", String(totalCount));
    progress.setAttribute("aria-valuenow", String(selectedCount));
    const count = progress.querySelector(".selection-progress-count");
    if (count) count.textContent = `${selectedCount}/${totalCount}`;
  }

  function showFeedback(message, tone, duration = FEEDBACK_TIME) {
    clearTimer("feedback");
    clearFeedbackBubbles();
    const bubble = document.createElement("div");
    bubble.className = `feedback-bubble ${tone || "soft"}`;
    bubble.textContent = message;
    els.playArea.appendChild(bubble);
    timers.feedback = window.setTimeout(() => { bubble.remove(); timers.feedback = null; }, duration);
  }

  function showHintItemsFeedback(items, duration = FEEDBACK_TIME) {
    clearTimer("feedback");
    clearFeedbackBubbles();
    const bubble = document.createElement("div");
    bubble.className = "feedback-bubble hint hint-items";
    const list = document.createElement("div");
    list.className = "hint-item-list";
    items.forEach((item) => {
      const frame = document.createElement("div");
      frame.className = "hint-item-frame";
      const image = document.createElement("img");
      image.src = getBasketItemImage(item);
      image.alt = "";
      image.draggable = false;
      image.loading = "eager";
      image.decoding = "async";
      frame.appendChild(image);
      list.appendChild(frame);
    });
    bubble.appendChild(list);
    els.playArea.appendChild(bubble);
    timers.feedback = window.setTimeout(() => { bubble.remove(); timers.feedback = null; }, duration);
  }

  function clearFeedbackBubbles() {
    els.playArea.querySelectorAll(".feedback-bubble").forEach((bubble) => bubble.remove());
  }

  function createFeedbackMessageBox(...nodes) {
    const box = document.createElement("div");
    box.className = "feedback-message-box";
    box.append(...nodes);
    return box;
  }

  function renderFinalWrongFeedback() {
    clearTimer("feedback");
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "feedback-view";

    const symbol = document.createElement("div");
    symbol.className = "feedback-symbol is-soft";
    symbol.textContent = "😊";

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.textContent = usesSoftFeedback() ? "조금 헷갈릴 수 있어요." : "괜찮아요!";

    const message = document.createElement("p");
    message.className = "feedback-message";
    message.textContent = usesSoftFeedback() ? "괜찮아요. 천천히 다시 같이 가볼까요?" : "다음 문제로 가볼까요?";

    view.append(createFeedbackMessageBox(symbol, title, message));
    els.playArea.appendChild(view);
  }

  function renderCorrectFeedback() {
    clearTimer("feedback");
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "feedback-view";

    const symbol = document.createElement("div");
    symbol.className = "feedback-symbol";
    symbol.textContent = "✓";

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.textContent = usesSoftFeedback() ? "좋습니다. 잘 보셨어요." : "잘 기억하셨어요!";

    const message = document.createElement("p");
    message.className = "feedback-message";
    if (usesSoftFeedback()) message.classList.add("is-one-line");
    message.textContent = usesSoftFeedback() ? "하나만 더 해볼까요? 힘드시면 쉬어도 괜찮아요." : "좋습니다. 다음 문제로 넘어갈게요.";

    view.append(createFeedbackMessageBox(symbol, title, message));
    els.playArea.appendChild(view);
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
    const slot = collected.querySelector(".basket-slot:not(.is-filled)") || collected;
    const image = document.createElement("img");
    image.src = getBasketItemImage(item);
    image.alt = "";
    image.draggable = false;
    image.loading = "eager";
    image.decoding = "async";
    image.dataset.itemId = item.id;
    slot.appendChild(image);
    if (slot.classList && slot.classList.contains("basket-slot")) {
      slot.classList.add("is-filled");
      slot.dataset.itemId = item.id;
    }

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
      card.classList.toggle("is-hinted", Boolean(question.choiceHintUsed && remainingTargetIds.has(card.dataset.itemId)));
    });
  }

  function getQuestionHintLevel(question) {
    return Math.max(0, Math.min(2, Number(question && question.hintLevel) || 0));
  }

  function getRemainingTargetItems(question) {
    if (!question) return [];
    return question.targetItems.filter((item) => !state.selectedIds.includes(item.id));
  }

  function updateHintButtonState() {
    if (!els.hintButton || !state.question) return;
    const remainingHints = Math.max(0, 2 - getQuestionHintLevel(state.question));
    els.hintButton.dataset.hintStepCount = String(remainingHints);
  }

  function isInsideChoiceTouchHitbox(event, element) {
    if (!event || !element || typeof event.clientX !== "number" || typeof event.clientY !== "number") return true;
    if (event.type === "click" && event.detail === 0) return true;
    const image = element.querySelector("img");
    const rect = (image || element).getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0 || !Number.isFinite(rect.left) || !Number.isFinite(rect.top)) return true;
    const hitbox = CHOICE_TOUCH_HITBOXES[element.dataset.itemId];
    if (!hitbox) return true;
    const left = rect.left + rect.width * hitbox.x;
    const top = rect.top + rect.height * hitbox.y;
    const right = left + rect.width * hitbox.w;
    const bottom = top + rect.height * hitbox.h;
    return event.clientX >= left
      && event.clientX <= right
      && event.clientY >= top
      && event.clientY <= bottom;
  }

  function getItemFromEvent(event) {
    const button = event.target.closest(".choice-card[data-item-id]");
    if (!button) return null;
    if (!isInsideChoiceTouchHitbox(event, button)) return null;
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
    els.dragGhost.innerHTML = `<img src="${getBasketItemImage(session.item)}" alt="" loading="eager" decoding="async">`;
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
    const targetSlot = els.playArea.querySelector(".basket-slot:not(.is-filled)");
    const targetRect = targetSlot ? targetSlot.getBoundingClientRect() : basketRect;

    const flyItem = document.createElement("img");
    const width = Math.max(44, startRect.width);
    const height = Math.max(44, startRect.height);
    const startX = startRect.left;
    const startY = startRect.top;
    const targetX = targetRect.left + targetRect.width * 0.5 - width * 0.5;
    const targetY = targetRect.top + targetRect.height * 0.5 - height * 0.5;
    const arcLift = Math.min(120, Math.max(46, Math.abs(targetX - startX) * 0.18));
    const midX = startX + (targetX - startX) * 0.58;
    const midY = Math.min(startY, targetY) - arcLift;

    flyItem.className = "basket-fly-item";
    flyItem.src = getBasketItemImage(item);
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
      updateSelectionProgress();
      const selectedElement = sourceElement || getChoiceCardByItemId(item.id);
      markChoiceCardSelected(item.id, selectedElement);
      const questionCompleted = state.selectedIds.length >= question.targetItems.length;
      animateItemToBasket(item, selectedElement, startRectOverride).then(() => {
        if (state.question !== question || state.questionIndex !== questionIndex || state.phase !== "question") return;
        if (!state.collectedItems.some((collected) => collected.id === item.id)) state.collectedItems.push(item);
        appendCollectedItem(item);
        playSound("correct");
        updateChoiceHints();
        if (questionCompleted) {
          clearTimer("autoHint");
          renderCorrectFeedback();
          playVoiceGuide(getFeedbackVoiceGuideType(true), { delayMs: VOICE_GUIDE_FEEDBACK_DELAY_MS });
          schedulePhaseTimer(() => completeQuestion(true), CORRECT_FEEDBACK_TIME);
        }
      });
      return;
    }

    state.wrongSelectedIds.push(item.id);
    state.retryCount += 1;
    const wrongAttemptCount = state.wrongSelectedIds.length;
    markChoiceCardWrong(item.id);
    clearTimer("autoHint");
    if (wrongAttemptCount >= 3) {
      playSound("wrong");
      renderFinalWrongFeedback();
      playVoiceGuide(getRetryVoiceGuideType(wrongAttemptCount), { delayMs: VOICE_GUIDE_FEEDBACK_DELAY_MS });
      schedulePhaseTimer(() => completeQuestion(false), FINAL_WRONG_FEEDBACK_TIME);
      return;
    }
    playSound("retry");
    showFeedback(usesSoftFeedback() ? "😊 괜찮아요. 천천히 다시 골라볼까요?" : "다시 한 번 생각해보세요!", "soft", getRetryFeedbackTime());
    playVoiceGuide(getRetryVoiceGuideType(wrongAttemptCount), { delayMs: VOICE_GUIDE_FEEDBACK_DELAY_MS });
  }

  function completeQuestion(isCorrect) {
    clearTimer("phase"); clearTimer("autoHint");
    const question = state.question;
    if (!question) return;
    const now = Date.now();
    const responseTimeMs = state.questionStartedAt ? now - state.questionStartedAt : 0;
    const firstResponseTimeMs = state.firstResponseAt && state.questionStartedAt ? state.firstResponseAt - state.questionStartedAt : responseTimeMs;
    const missedItemCount = question.targetItems.filter((item) => !state.selectedIds.includes(item.id)).length;
    const selectedItems = [...state.selectedIds, ...state.wrongSelectedIds];
    state.missedItemCount += missedItemCount;
    const questionLog = {
      question_id: `q${state.questionIndex + 1}`,
      question_type: "shopping_cart_memory",
      cognitive_domain: "memory_activity",
      difficulty: state.difficultyKey,
      prompt_type: "image",
      correct_answer: question.targetItems.map((item) => item.id),
      selected_answer: selectedItems,
      selected_items: selectedItems,
      target_items: question.targetItems.map((item) => item.id),
      target_count: question.targetItems.length,
      items_shown: question.choiceItems.length,
      is_correct: Boolean(isCorrect),
      attempt_count: selectedItems.length,
      hint_used: Boolean(question.hintUsed),
      hint_count: getQuestionHintLevel(question),
      response_time_ms: responseTimeMs,
      first_response_time_ms: firstResponseTimeMs,
      wrong_tap_count: state.wrongSelectedIds.length,
      missed_item_count: missedItemCount,
      touch_miss_count: state.questionTouchMissCount,
      input_type: question.inputType || "touch"
    };
    questionLog.raw_log_json = { ...questionLog };
    state.questionLogs.push(questionLog);
    if (isCorrect) state.correctCount += 1; else state.wrongCount += 1;
    updateHud();
    if (state.questionIndex + 1 >= getTotalQuestions()) { schedulePhaseTimer(() => finishGame("completed", null), 700); return; }
    state.questionIndex += 1;
    schedulePhaseTimer(beginQuestion, 900);
  }

  function showHint() {
    if (!state.question || state.phase !== "question" || runtimeConfig.hintEnabled === false) return;
    const remainingItems = getRemainingTargetItems(state.question);
    if (!remainingItems.length) return;
    const currentHintLevel = getQuestionHintLevel(state.question);
    const repeatFinalCareHint = isCareMode() && currentHintLevel >= 2;
    if (currentHintLevel >= 2 && !repeatFinalCareHint) return;
    const nextHintLevel = repeatFinalCareHint ? 2 : currentHintLevel + 1;
    state.question.hintLevel = nextHintLevel;
    state.question.hintUsed = true;
    if (!repeatFinalCareHint) {
      state.hintCount += 1;
    }
    updateHintButtonState();

    if (nextHintLevel === 1) {
      const categoryLabels = Array.from(new Set(remainingItems.map((item) => ITEM_CATEGORY_LABELS[item.category] || "물건")));
      const message = `${categoryLabels.join(", ")}입니다`;
      showFeedback(message, "hint", 3000);
      return;
    }

    showHintItemsFeedback(remainingItems, 3000);
  }

  function pauseGame(options = {}) {
    const showPauseModal = options.showPauseModal !== false;
    const countPause = options.countPause !== false;
    if (!["countdown", "memory", "transition", "question"].includes(state.phase)) return;
    const previousPhase = state.phase;
    state.pause.previousPhase = previousPhase;
    state.pause.phaseRemainingMs = pauseTimerRemaining(timers.phase, phaseTimerDueAt);
    state.pause.autoHintRemainingMs = pauseTimerRemaining(timers.autoHint, autoHintTimerDueAt);
    if (state.startCountdownIntroTimeoutId) {
      state.startCountdownIntroRemainingMs = Math.max(0, state.startCountdownIntroRemainingMs - (performance.now() - state.startCountdownIntroStartedAt));
      window.clearTimeout(state.startCountdownIntroTimeoutId);
      state.startCountdownIntroTimeoutId = null;
      state.startCountdownIntroStartedAt = 0;
    }
    state.pause.startedAt = Date.now();
    pausedPhaseTimerCallback = phaseTimerCallback;
    pausedAutoHintTimerCallback = autoHintTimerCallback;
    if (previousPhase === "memory") animateMemoryProgress(state.pause.phaseRemainingMs, false);
    state.phase = "pause";
    if (countPause) state.pauseCount += 1;
    clearTimer("game"); clearTimer("countdown"); clearTimer("phase"); clearTimer("autoHint");
    stopVoiceGuide();
    syncBackgroundMusic();
    els.pauseButton.classList.add("is-paused");
    updatePauseSoundButtons();
    if (showPauseModal) {
      window.requestAnimationFrame(() => {
        if (state.phase === "pause") els.pauseModal.classList.remove("is-hidden");
      });
    }
  }

  function resumeGame(options = {}) {
    const hidePauseModal = options.hidePauseModal !== false;
    const previousPhase = state.pause.previousPhase;
    const pausedForMs = state.pause.startedAt ? Date.now() - state.pause.startedAt : 0;
    if (hidePauseModal) els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    state.pause.previousPhase = null;
    state.pause.startedAt = 0;

    if (!previousPhase) return;

    state.phase = previousPhase;
    syncBackgroundMusic();
    if (state.questionStartedAt && previousPhase === "question") state.questionStartedAt += pausedForMs;
    if (state.firstResponseAt && previousPhase === "question") state.firstResponseAt += pausedForMs;
    if (previousPhase === "question") startGameTimer(false);

    if (previousPhase === "countdown" && state.startCountdownIntroRemainingMs > 0 && !state.startCountdownIntroTimeoutId) {
      scheduleReadyCountdownIntro(state.difficultyKey, state.startCountdownIntroRemainingMs);
    }
    if (previousPhase === "memory") {
      startMemoryCountdownTimer();
      animateMemoryProgress(state.pause.phaseRemainingMs);
    }
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
    clearOrientationGuardPauseState();
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
    clearOrientationGuardPauseState();
    state.phase = "result";
    setScreen("result");
    closePostConditionCheck();
    const previousRecord = readPreviousRecord();
    renderResult(previousRecord);
    playSound("complete");
    playVoiceGuide(getCareResultVoiceGuideType(), { delayMs: VOICE_GUIDE_FEEDBACK_DELAY_MS });
    const payload = createResultPayload();
    try { window.localStorage.setItem(`${STORAGE_KEY_PREFIX}:${runtimeConfig.mode}`, JSON.stringify(payload)); } catch (error) {}
    sendBridge(["sendGameCompleteResult", "sendComplete"], payload);
    scheduleResultAutoReturn();
  }

  function scheduleResultAutoReturn() {
    clearTimer("resultReturn");
    if (!shouldAutoReturnToHubAfterResult()) return;
    timers.resultReturn = window.setTimeout(() => {
      timers.resultReturn = null;
      if (state.phase === "result") returnToHub();
    }, 3000);
  }

  function getSelectedDifficultyRunConfig() {
    const key = state.difficultyKey || runtimeConfig.difficultyKey || "easy";
    const totalQuestions = getTotalQuestions();
    let maxChoiceCount = 0;
    let maxItemsToRemember = 0;
    let revealMs = 0;
    for (let index = 0; index < totalQuestions; index += 1) {
      const difficulty = getDifficultyConfigForQuestion(key, index);
      maxChoiceCount = Math.max(maxChoiceCount, difficulty.answerChoiceCount || 0);
      maxItemsToRemember = Math.max(maxItemsToRemember, difficulty.memoryItemCount || 0);
      if (!revealMs) revealMs = difficulty.revealMs || 0;
    }
    return { maxChoiceCount, maxItemsToRemember, revealMs };
  }

  function createResultDetailJson() {
    const selectedRunConfig = getSelectedDifficultyRunConfig();
    return {
      max_choice_count: selectedRunConfig.maxChoiceCount,
      max_items_to_remember: selectedRunConfig.maxItemsToRemember,
      auto_hint_enabled: runtimeConfig.autoHintEnabled !== false,
      reveal_ms: selectedRunConfig.revealMs,
      difficulty_downshifted: false,
      total_touch_miss_count: state.touchMissCount,
      external_input_used: state.externalInputUsed,
      use_drag: state.settings.useDrag,
      total_missed_item_count: state.missedItemCount,
      wrong_count: state.wrongCount,
      extra_selected_count: state.retryCount
    };
  }

  function createProcessDataJson() {
    const externalInput = runtimeConfig.externalInput || {};
    return {
      condition_check: shouldShowConditionCheck() ? {
        completed: state.condition.completed,
        skipped: state.condition.skipped,
        mood: state.condition.mood,
        sleep_hours: state.condition.sleepHours
      } : null,
      post_condition_check: shouldShowFinishCheck() ? {
        completed: state.postCondition.completed,
        skipped: state.postCondition.skipped,
        mood_after: state.postCondition.moodAfter,
        fatigue: state.postCondition.fatigue,
        perceived_difficulty: state.postCondition.perceivedDifficulty,
        needed_help: state.postCondition.neededHelp,
        replay_intent: state.postCondition.replayIntent
      } : null,
      external_input: {
        enabled: externalInput.enabled === true,
        source: externalInput.source || "none",
        used: state.externalInputUsed
      },
      interaction_summary: {
        pause_count: state.pauseCount,
        touch_miss_count: state.touchMissCount,
        missed_item_count: state.missedItemCount
      },
      ...(runtimeConfig.processData || {})
    };
  }

  function createMetaJson() {
    return {
      game_id: GAME_ID,
      schema_version: runtimeConfig.schemaVersion || null,
      config_source: runtimeConfig.configSource || null,
      received_at: runtimeConfig.receivedAt || null,
      ...(runtimeConfig.meta || {})
    };
  }

  function createConfigSnapshot() {
    const ui = runtimeConfig.ui || {};
    const selectedRunConfig = getSelectedDifficultyRunConfig();
    return {
      show_timer: ui.showTimer !== false,
      show_score: ui.showScore !== false,
      show_progress: ui.showProgress !== false,
      show_difficulty_select: shouldShowDifficultySelect(),
      show_settings: ui.showSettings !== false,
      show_how_to_play: ui.showTutorial !== false,
      show_condition_check: shouldShowConditionCheck(),
      show_finish_check: shouldShowFinishCheck(),
      question_count: getTotalQuestions(),
      max_choice_count: selectedRunConfig.maxChoiceCount,
      max_items_to_remember: selectedRunConfig.maxItemsToRemember,
      reveal_ms: selectedRunConfig.revealMs,
      hint_enabled: runtimeConfig.hintEnabled !== false,
      auto_hint_enabled: runtimeConfig.autoHintEnabled !== false,
      soft_feedback: runtimeConfig.softFeedback,
      use_drag: state.settings.useDrag,
      voice_guide_enabled: runtimeConfig.voiceGuideEnabled !== false,
      result_log_level: runtimeConfig.resultLogLevel || "detailed"
    };
  }

  function createClientContext() {
    return {
      device_id: runtimeConfig.deviceId || null,
      platform: runtimeConfig.platform || "react-native-webview",
      app_version: runtimeConfig.appVersion || null,
      timezone: runtimeConfig.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || null),
      ...(runtimeConfig.clientContext || {})
    };
  }

  function createVoiceContext() {
    if (!runtimeConfig.voiceContext || typeof runtimeConfig.voiceContext !== "object") {
      return null;
    }
    const context = runtimeConfig.voiceContext;
    return {
      voice_profile_id: context.voice_profile_id || context.voiceProfileId || null,
      voice_owner_type: context.voice_owner_type || context.voiceOwnerType || null,
      voice_owner_id: context.voice_owner_id || context.voiceOwnerId || null,
      ...context
    };
  }

  function createGameResultJson(totalQuestions, completedQuestionCount, avgResponseTimeMs, detailed) {
    return {
      mode: runtimeConfig.mode,
      difficulty: state.difficultyKey,
      config_snapshot: createConfigSnapshot(),
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
      abandoned_at: state.status === "abandoned" && state.endedAt ? state.endedAt.toISOString() : null,
      abandon_reason: state.abandonReason,
      question_logs: detailed ? state.questionLogs : [],
      result_detail_json: detailed ? createResultDetailJson() : {}
    };
  }

  function createResultPayload() {
    const startedAt = state.startedAt || new Date();
    const endedAt = state.endedAt || new Date();
    const totalQuestions = getTotalQuestions();
    const completedQuestionCount = state.questionLogs.length;
    const detailed = runtimeConfig.resultLogLevel !== "summary";
    const responseTimes = state.questionLogs.map((log) => log.response_time_ms).filter((value) => Number.isFinite(value));
    const avgResponseTimeMs = responseTimes.length ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length) : 0;
    const gameResult = createGameResultJson(totalQuestions, completedQuestionCount, avgResponseTimeMs, detailed);
    const payload = {
      senior_id: runtimeConfig.seniorId || runtimeConfig.userId || runtimeConfig.anonymousUserId,
      guardian_id: runtimeConfig.guardianId || null,
      tenant_id: runtimeConfig.tenantId || null,
      facility_id: runtimeConfig.facilityId || null,
      program_id: runtimeConfig.programId || null,
      reward_id: runtimeConfig.rewardId || null,
      recommendation_id: runtimeConfig.recommendationId || null,
      session_id: runtimeConfig.sessionId,
      content_id: runtimeConfig.contentId,
      game_key: runtimeConfig.gameKey,
      game_version: runtimeConfig.gameVersion,
      play_source: runtimeConfig.playSource,
      assignment_id: runtimeConfig.assignmentId || null,
      alarm_id: runtimeConfig.alarmId || null,
      schedule_id: runtimeConfig.scheduleId || null,
      mode: runtimeConfig.mode,
      difficulty: state.difficultyKey,
      status: state.status,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      duration_ms: Math.max(0, endedAt.getTime() - startedAt.getTime()),
      game_result: gameResult,
      game_result_json: gameResult,
      client_context: createClientContext(),
      voice_context: createVoiceContext(),
      config_snapshot: gameResult.config_snapshot,
      total_questions: totalQuestions,
      completed_question_count: completedQuestionCount,
      correct_count: state.correctCount,
      wrong_count: state.wrongCount,
      hint_count: state.hintCount,
      retry_count: state.retryCount,
      pause_count: state.pauseCount,
      interaction_count: state.interactionCount,
      avg_response_time_ms: avgResponseTimeMs,
      completion_rate: gameResult.completion_rate,
      abandoned_at: gameResult.abandoned_at,
      abandon_reason: state.abandonReason,
      error_code: state.status === "error" ? "GAME_RUNTIME_ERROR" : null,
      error_message: null,
      question_logs: gameResult.question_logs,
      result_detail_json: gameResult.result_detail_json,
      process_data_json: createProcessDataJson(),
      meta: createMetaJson()
    };
    return Object.assign(payload, createResultErrorFields(state.status));
  }

  function createResultErrorFields(status, options = {}) {
    const isError = status === "error";
    const errorCode = isError ? options.errorCode || "GAME_RUNTIME_ERROR" : null;
    return {
      error_code: errorCode,
      error_message: isError ? options.errorMessage || null : null,
      error_phase: isError ? options.errorPhase || null : null,
      complete_send_failed: errorCode === "COMPLETE_SEND_FAILED"
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
    const isCareResult = runtimeConfig && (runtimeConfig.mode === "reminder" || (runtimeConfig.ui && runtimeConfig.ui.showScore === false));
    if (isCareResult) {
      const totalAnswered = state.questionLogs.length;
      if (els.resultEmoji) els.resultEmoji.textContent = "🤗";
      els.resultTitle.textContent = totalAnswered > 0 ? "수고 많으셨습니다." : "괜찮습니다.";
      els.resultMessage.textContent = totalAnswered > 0 ? "오늘도 차분히 집중해 주셨어요." : "편안한 때에 다시 이어가면 됩니다.";
    } else {
      if (els.resultEmoji) els.resultEmoji.textContent = completed ? "🤗" : "🙂";
      els.resultTitle.textContent = "오늘의 기억 활동";
      els.resultMessage.textContent = completed ? "천천히 집중해주신 것만으로도 참 좋습니다." : "잠시 멈춰도 괜찮아요. 다음에 다시 천천히 이어가면 됩니다.";
    }
    els.resultCorrect.textContent = String(state.correctCount);
    els.resultTotal.textContent = String(total);
    els.resultHintCount.textContent = `${state.hintCount}회`;
    els.resultRate.textContent = `${rate}%`;
    if (els.resultCompare) els.resultCompare.textContent = createCompareText(previousRecord, rate);
    els.hintButton.classList.add("is-hidden");
  }

  function goHome() {
    clearOrientationGuardPauseState();
    clearAllTimers();
    stopVoiceGuide();
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
    clearOrientationGuardPauseState();
    state.phase = "post-condition";
    state.postCondition.step = 0;
    syncBackgroundMusic();
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
    playToggleSound(sourceToggle);
    if (sourceToggle === els.voiceGuideToggle) {
      state.settings.voiceGuideEnabled = els.voiceGuideToggle.checked;
      if (!state.settings.voiceGuideEnabled) stopVoiceGuide();
      updatePauseSoundButtons();
      return;
    }
    if (sourceToggle === els.backgroundSoundToggle) {
      state.settings.backgroundSoundEnabled = els.backgroundSoundToggle.checked;
      updatePauseSoundButtons();
      syncBackgroundMusic();
      return;
    }
    if (sourceToggle === els.soundToggle) {
      state.settings.soundEnabled = els.soundToggle.checked;
      updatePauseSoundButtons();
      return;
    }
    updatePauseSoundButtons();
  }

  function togglePauseSound(sourceToggle) {
    if (!sourceToggle) return;
    sourceToggle.checked = !sourceToggle.checked;
    syncSoundToggles(sourceToggle);
  }

  function updateInputModeButtons() {
    els.inputModeButtons.forEach((button) => {
      const isDragButton = button.dataset.inputMode === "drag";
      const isDisabled = isDragButton && !canUseDragMode();
      const isSelected = button.dataset.inputMode === (state.settings.useDrag ? "drag" : "touch");
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      button.disabled = isDisabled;
      button.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    });
  }

  function selectInputMode(button) {
    if (!button) return;
    state.settings.useDrag = button.dataset.inputMode === "drag" && canUseDragMode();
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
    const title = $("tutorial-title");
    const icon = document.querySelector(".tutorial-question-icon");
    const heading = document.querySelector(".tutorial-heading");
    const isTapModeStep = step.mode === "touch";
    const isDragModeStep = step.mode === "drag";
    const isInputModeStep = isTapModeStep || isDragModeStep;
    if (title) title.textContent = isTapModeStep ? "누르기 모드" : isDragModeStep ? "끌기 모드" : "진행방법";
    if (heading) {
      heading.classList.toggle("is-touch-heading", isTapModeStep);
      heading.classList.toggle("is-mode-heading", isInputModeStep);
    }
    if (icon) {
      icon.classList.toggle("is-image", isInputModeStep);
      icon.innerHTML = isTapModeStep
        ? `<img src="assets/images/ui-touch2.webp" alt="" draggable="false" loading="eager" decoding="async">`
        : isDragModeStep
          ? `<img src="assets/images/ui-drag2.webp" alt="" draggable="false" loading="eager" decoding="async">`
          : "?";
    }
    els.tutorialMessage.textContent = step.message;
    if (els.tutorialDetail) els.tutorialDetail.hidden = true;
    els.tutorialPreview.classList.remove("has-tap-pointer");
    els.tutorialPreview.classList.toggle("is-touch-step", isTapModeStep);
    els.tutorialPreview.classList.toggle("is-drag-step", isDragModeStep);
    if (tutorialIndex === 0) {
      els.tutorialPreview.innerHTML = renderTutorialMemoryPreview(step);
      els.tutorialCloseButton.textContent = "닫기";
      els.tutorialNextButton.textContent = tutorialIndex >= TUTORIAL_STEPS.length - 1 ? "\uB2EB\uAE30" : "\uB2E4\uC74C";
      return;
    }
    if (isTapModeStep || isDragModeStep) {
      els.tutorialPreview.innerHTML = renderTutorialSelectionPreview(step, isDragModeStep ? "drag" : "touch");
      els.tutorialCloseButton.textContent = "이전";
      els.tutorialNextButton.textContent = tutorialIndex >= TUTORIAL_STEPS.length - 1 ? "\uB2EB\uAE30" : "\uB2E4\uC74C";
      return;
    }
    const cards = step.previewIds.map((id) => {
      const item = findItem(id);
      return item ? `<div class="fruit-card"><img class="fruit-image" src="${item.image}" alt="${escapeHtml(item.name)}" draggable="false"><span class="fruit-name">${escapeHtml(item.name)}</span></div>` : "";
    }).join("");
    els.tutorialPreview.innerHTML = `<div class="tutorial-mini"><div class="tutorial-play-view"><div class="fruit-grid is-sparse">${cards}</div></div></div>`;
    els.tutorialCloseButton.textContent = tutorialIndex > 0 ? "이전" : "닫기";
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
    window.addEventListener("orientationchange", () => {
      updateGameScale();
      window.setTimeout(() => {
        updateGameScale();
        scheduleMemoryLayout();
      }, 160);
    });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", updateGameScale);
    els.startScreen.addEventListener("click", handleStartScreenBackgroundPress);
    els.startButton.addEventListener("click", runAfterStartButtonPress());
    els.startExitButton.addEventListener("click", returnToHub);
    els.settingsButton.addEventListener("click", openSettings);
    if (els.cornerSettingsButton) els.cornerSettingsButton.addEventListener("click", openSettings);
    els.tutorialButton.addEventListener("click", openTutorial);
    els.difficultyBackButton.addEventListener("click", goHome);
    els.difficultyButtons.forEach((button) => button.addEventListener("click", () => startGame(getDifficultyKeyFromButton(button))));
    els.playArea.addEventListener("click", (event) => {
      if (suppressNextClick) { suppressNextClick = false; return; }
      if (dragSession && dragSession.active) return;
      const target = getItemFromEvent(event);
      if (!target && state.phase === "question" && event.target.closest(".choice-card[data-item-id]")) {
        state.touchMissCount += 1;
        state.questionTouchMissCount += 1;
        return;
      }
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
    els.resultHomeButton.addEventListener("click", returnToHub);
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
    els.tutorialCloseButton.addEventListener("click", () => {
      if (tutorialIndex > 0) {
        tutorialIndex -= 1;
        renderTutorialStep();
        return;
      }
      closeTutorial();
    });
    els.tutorialNextButton.addEventListener("click", () => { if (tutorialIndex >= TUTORIAL_STEPS.length - 1) { closeTutorial(); return; } tutorialIndex += 1; renderTutorialStep(); });
    document.addEventListener("click", handleButtonClickSound, true);
    document.addEventListener("pointerdown", unlockAudioFromGesture, true);
    document.addEventListener("keydown", unlockAudioFromGesture, true);
  }

  async function boot() {
    try {
      updateGameScale();
      bindEvents();
      installExternalInputApi();
      const b = bridge();
      if (!b || typeof b.getRuntimeConfig !== "function") throw new Error("App bridge is missing.");
      applyConfig(await b.getRuntimeConfig());
      preloadAudioAssets();
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
