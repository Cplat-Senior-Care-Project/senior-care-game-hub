(function () {
  "use strict";

  const TOTAL_PER_DIFFICULTY = 10;
  const DIFFICULTY_TIME = 120;
  const START_READY_MESSAGE_TIME = 2000;
  const START_COUNTDOWN_TIME = 3000;
  const CARE_RECALL_TRANSITION_TIME = 3000;
  const DIFFICULTY_SELECT_TRANSITION_DELAY = 0;
  const FEEDBACK_TIME = 2400;
  const RETRY_FEEDBACK_TIME = 2200;
  const CARE_FEEDBACK_TIME = 4000;
  const MAX_WRONG_RETRIES = 2;
  const STORAGE_KEY_PREFIX = "fruit_count_memory_game_last_result";
  const RACE_POINTS = [16, 50, 84, 94];
  const MEMORY_LAYOUT_MIN_CARD = 38;
  const MEMORY_LAYOUT_CARD_SIZE = 162;
  const MEMORY_LAYOUT_MIN_GAP = 4;
  const MEMORY_LAYOUT_MAX_GAP = 8;
  const MAX_MEMORY_CARDS = 7;
  const MEMORY_LAYOUT_MAX_COLUMNS = 7;
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const CONDITION_SLEEP_HOURS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const CONDITION_SLEEP_DRAG_STEP_PX = 42;
  const ASSET_LOAD_TIMEOUT = 6000;
  const DEFAULT_RUN_CONFIG = Object.freeze({
    gameId: "fruit-count-memory-game",
    sessionId: null,
    userId: "",
    anonymousUserId: "",
    deviceId: "",
    appVersion: "",
    gameVersion: "",
    difficultyKey: null,
    difficultyIndex: null,
    durationSeconds: DIFFICULTY_TIME,
    totalQuestions: TOTAL_PER_DIFFICULTY,
    answerChoiceCount: 4,
    maxItemsToRemember: null,
    revealMs: 3000,
    soundEnabled: true,
    voiceGuideEnabled: true,
    collectCondition: true,
    debugMode: false,
    hintEnabled: true,
    autoHintEnabled: true,
    softFeedback: true,
    resultLogLevel: "detailed",
    mode: "standard",
    ui: Object.freeze({
      showTimer: true,
      showProgress: true,
      showScore: true,
      showSettings: true,
      showTutorial: true,
      showDifficultySelect: true,
      showConditionCheck: true,
      showFinishCheck: true
    }),
    previousResult: null,
    previousRecord: null,
    lastResult: null,
    schemaVersion: "mock-v1"
  });
  const ERROR_SCREEN_COPY = Object.freeze({
    CONFIG_MISSING: {
      title: "게임 설정을 불러오지 못했습니다",
      message: "앱을 다시 열어 주세요."
    },
    CONFIG_INVALID: {
      title: "게임 설정을 확인하지 못했습니다",
      message: "앱을 다시 열어 주세요."
    },
    CONFIG_LOAD_FAILED: {
      title: "게임 설정을 불러오지 못했습니다",
      message: "앱을 다시 열어 주세요."
    },
    ASSET_LOAD_FAILED: {
      title: "게임 리소스를 불러오지 못했습니다",
      message: "잠시 후 다시 시도해 주세요."
    },
    INITIALIZE_FAILED: {
      title: "게임을 시작하지 못했습니다",
      message: "앱을 다시 열어 주세요."
    },
    GAME_RUNTIME_ERROR: {
      title: "게임 진행 중 문제가 발생했습니다",
      message: "처음부터 다시 시도해 주세요."
    },
    RESULT_CREATE_FAILED: {
      title: "결과를 정리하지 못했습니다",
      message: "앱으로 돌아가 다시 시도해 주세요."
    },
    COMPLETE_SEND_FAILED: {
      title: "결과를 앱에 전달하지 못했습니다",
      message: "앱으로 돌아가 확인해 주세요."
    },
    STORAGE_FAILED: {
      title: "기록을 저장하지 못했습니다",
      message: "게임은 계속 이용할 수 있습니다."
    },
    default: {
      title: "게임을 불러오지 못했습니다",
      message: "잠시 후 다시 시도해 주세요."
    }
  });
  const DEBUG_ERROR_ALIASES = Object.freeze({
    config: "CONFIG_INVALID",
    asset: "ASSET_LOAD_FAILED",
    init: "INITIALIZE_FAILED",
    runtime: "GAME_RUNTIME_ERROR",
    result: "RESULT_CREATE_FAILED",
    complete: "COMPLETE_SEND_FAILED",
    storage: "STORAGE_FAILED"
  });

  const FRUITS = [
    { id: "apple", name: "사과", image: "assets/images/apple.png" },
    { id: "strawberry", name: "딸기", image: "assets/images/strawberry.png" },
    { id: "watermelon", name: "수박", image: "assets/images/watermelon.png" },
    { id: "grape", name: "포도", image: "assets/images/grapes.png" },
    { id: "korean_melon", name: "참외", image: "assets/images/korean_melon.png" }
  ];

  const ESSENTIAL_ASSET_SOURCES = [
    ...FRUITS.map((fruit) => fruit.image),
    "assets/images/game_title3.png",
    "assets/images/new_backgroud2.png"
  ];

  const AUDIO_SOURCES = Object.freeze({
    button: "assets/audio/button-click.wav",
    toggle: "assets/audio/toggle.wav",
    countdown: "assets/audio/countdown-tick.wav",
    start: "assets/audio/start.wav",
    correct: "assets/audio/correct.wav",
    retry: "assets/audio/retry.wav",
    wrong: "assets/audio/wrong.wav",
    complete: "assets/audio/complete.wav"
  });
  const AUDIO_VOLUMES = Object.freeze({
    button: 0.72,
    toggle: 0.72,
    countdown: 0.68,
    start: 0.72,
    correct: 0.72,
    retry: 0.7,
    wrong: 0.66,
    complete: 0.72
  });
  const AUDIO_POOL_SIZE = 3;

  FRUITS.forEach((fruit) => {
    const image = new Image();
    image.src = fruit.image;
  });

  const DIFFICULTIES = [
    {
      key: "easy",
      label: "쉬움",
      runner: "🙂",
      revealMs: 3000,
      startRange: [2, 3],
      endRange: [3, 4],
      minTypes: 1,
      maxTypes: 1,
      shuffleCards: false
    },
    {
      key: "normal",
      label: "보통",
      runner: "😊",
      revealMs: 3000,
      startRange: [4, 5],
      endRange: [5, 6],
      minTypes: 2,
      maxTypes: 3,
      shuffleCards: false
    },
    {
      key: "hard",
      label: "어려움",
      runner: "🤩",
      revealMs: 3000,
      startRange: [5, 6],
      endRange: [6, 7],
      minTypes: 3,
      maxTypes: 4,
      shuffleCards: true
    }
  ];

  const TUTORIAL_STEPS = [
    {
      type: "memory",
      message: "과일을 잠깐 보여드려요!",
      detail: ""
    },
    {
      type: "question",
      message: "개수를 떠올리고 숫자를 골라요!",
      detail: ""
    }
  ];

  const els = {
    app: document.querySelector(".app"),
    startScreen: document.getElementById("start-screen"),
    startLoading: document.getElementById("start-loading"),
    startLoadingFill: document.getElementById("start-loading-fill"),
    startLoadingText: document.getElementById("start-loading-text"),
    difficultyScreen: document.getElementById("difficulty-screen"),
    gameScreen: document.getElementById("game-screen"),
    resultScreen: document.getElementById("result-screen"),
    errorScreen: document.getElementById("error-screen"),
    errorTitle: document.getElementById("error-title"),
    errorMessage: document.getElementById("error-message"),
    errorCode: document.getElementById("error-code"),
    errorHomeButton: document.getElementById("error-home-button"),
    startButton: document.getElementById("start-button"),
    startExitButton: document.getElementById("start-exit-button"),
    settingsButton: document.getElementById("settings-button"),
    tutorialButton: document.getElementById("tutorial-button"),
    difficultyButtons: Array.from(document.querySelectorAll(".difficulty-option")),
    difficultyBackButton: document.getElementById("difficulty-back-button"),
    restartButton: document.getElementById("restart-button"),
    pauseButton: document.getElementById("pause-button"),
    carePlayControls: document.getElementById("care-play-controls"),
    carePauseButton: document.getElementById("care-pause-button"),
    careHintButton: document.getElementById("care-hint-button"),
    careHintMessage: document.getElementById("care-hint-message"),
    resumeButton: document.getElementById("resume-button"),
    pauseRestartButton: document.getElementById("pause-restart-button"),
    pauseHelpButton: document.getElementById("pause-help-button"),
    homeButton: document.getElementById("home-button"),
    pauseModal: document.getElementById("pause-modal"),
    settingsModal: document.getElementById("settings-modal"),
    settingsCloseButton: document.getElementById("settings-close-button"),
    settingsExitButton: document.getElementById("settings-exit-button"),
    backgroundSoundToggle: document.getElementById("background-sound-toggle"),
    backgroundSoundLabel: document.getElementById("background-sound-label"),
    pauseBackgroundSoundButton: document.getElementById("pause-background-sound-button"),
    soundToggle: document.getElementById("sound-toggle"),
    soundLabel: document.getElementById("sound-label"),
    voiceGuideToggle: document.getElementById("voice-guide-toggle"),
    voiceGuideLabel: document.getElementById("voice-guide-label"),
    pauseSoundButton: document.getElementById("pause-sound-button"),
    pauseVoiceGuideButton: document.getElementById("pause-voice-guide-button"),
    tutorialModal: document.getElementById("tutorial-modal"),
    tutorialPreview: document.getElementById("tutorial-preview"),
    tutorialTitle: document.getElementById("tutorial-title"),
    tutorialMessage: document.getElementById("tutorial-message"),
    tutorialDetail: document.getElementById("tutorial-detail"),
    tutorialCloseButton: document.getElementById("tutorial-close-button"),
    tutorialNextButton: document.getElementById("tutorial-next-button"),
    gameCountdown: document.getElementById("game-countdown"),
    gameCountdownMessage: document.getElementById("game-countdown-message"),
    gameCountdownTimer: document.querySelector(".game-countdown-timer"),
    gameCountdownNumber: document.getElementById("game-countdown-number"),
    playArea: document.getElementById("play-area"),
    timeLeft: document.getElementById("time-left"),
    timerBox: document.getElementById("timer-box"),
    difficultyLabel: document.getElementById("difficulty-label"),
    levelIcon: document.querySelector(".level-icon"),
    stageLabel: document.getElementById("stage-label"),
    raceWrap: document.querySelector(".race-wrap"),
    raceMarker: document.getElementById("race-marker"),
    raceSteps: Array.from(document.querySelectorAll(".race-step")),
    resultEmoji: document.getElementById("result-emoji"),
    resultEyebrow: document.querySelector("#result-screen .eyebrow"),
    resultTitle: document.getElementById("result-title"),
    resultMessage: document.getElementById("result-message"),
    standardResultRecord: document.getElementById("standard-result-record"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultRate: document.getElementById("result-rate"),
    resultStage: document.getElementById("result-stage"),
    resultHintCount: document.getElementById("result-hint-count"),
    resultStartButton: document.getElementById("result-start-button"),
    resultHomeButton: document.getElementById("result-home-button"),
    resultCompare: document.getElementById("result-compare"),
    conditionModal: document.getElementById("condition-modal"),
    conditionMoodButtons: Array.from(document.querySelectorAll(".condition-mood-button")),
    conditionSleepDial: document.querySelector(".condition-sleep-dial"),
    conditionSleepRows: document.getElementById("condition-sleep-rows"),
    conditionSleepUpButton: document.getElementById("condition-sleep-up-button"),
    conditionSleepDownButton: document.getElementById("condition-sleep-down-button"),
    conditionConfirmButton: document.getElementById("condition-confirm-button"),
    postConditionModal: document.getElementById("post-condition-modal"),
    postConditionPages: Array.from(document.querySelectorAll(".post-condition-page")),
    postConditionDots: Array.from(document.querySelectorAll(".post-condition-dot")),
    postConditionOptions: Array.from(document.querySelectorAll(".post-condition-option")),
    postConditionNextButton: document.getElementById("post-condition-next-button"),
    postConditionBackButton: document.getElementById("post-condition-back-button"),
    postConditionConfirmButton: document.getElementById("post-condition-confirm-button")
  };

  const state = {
    difficultyIndex: 0,
    questionInDifficulty: 0,
    correctCount: 0,
    timeLeft: DIFFICULTY_TIME,
    currentQuestion: null,
    hintStep: 0,
    lastMemoryTotalCount: 0,
    wrongAttempts: 0,
    phase: "start",
    isPaused: false,
    timerId: null,
    phaseTimerId: null,
    phaseCountdownId: null,
    startCountdownIntroTimeoutId: null,
    startCountdownFrameId: null,
    hintTimerId: null,
    resultAutoReturnTimerId: null,
    phaseStartedAt: 0,
    phaseDuration: 0,
    phaseRemaining: 0,
    phaseCallback: null,
    reachedDifficultyIndex: 0,
    reachedQuestion: 0,
    tutorialIndex: 0,
    conditionCheckShown: false,
    conditionMood: "good",
    conditionSleepIndex: 3,
    postConditionChecked: false,
    postConditionStep: 0,
    postCondition: {
      moodAfter: "good",
      fatigue: "low",
      perceivedDifficulty: "justRight",
      neededHelp: "none",
      replayIntent: "yes"
    },
    sleepDrag: {
      pointerId: null,
      lastStepY: 0
    },
    soundContext: null
  };
  let memoryLayoutFrame = null;
  let memoryLayoutResizeObserver = null;
  const runtimeConfig = { ...DEFAULT_RUN_CONFIG };
  let runtimeDifficulties = cloneDifficulties(DIFFICULTIES);
  const telemetryState = createEmptyTelemetryState();
  const audioPools = new Map();
  const audioPoolIndexes = new Map();

  function createEmptyTelemetryState() {
    return {
      startedAt: null,
      endedAt: null,
      startedAtMs: 0,
      endedAtMs: 0,
      selectedDifficulty: null,
      exitReason: "not_started",
      questionResults: [],
      currentQuestionRecord: null,
      pauseCount: 0,
      earlyExitQuestionIndex: null
    };
  }

  function resetTelemetryState() {
    const nextState = createEmptyTelemetryState();
    Object.keys(nextState).forEach((key) => {
      telemetryState[key] = nextState[key];
    });
  }

  function cloneDifficulties(difficulties) {
    return difficulties.map((difficulty) => ({
      ...difficulty,
      startRange: [...difficulty.startRange],
      endRange: [...difficulty.endRange]
    }));
  }

  function updateGameScale() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    const verticalGutter = Math.max(0, (viewportHeight - (STAGE_HEIGHT * scale)) / (2 * scale));
    document.documentElement.style.setProperty("--game-scale", String(scale));
    document.documentElement.style.setProperty("--game-viewport-top-gutter", `${Math.min(verticalGutter, 120)}px`);
    return scale;
  }

  function mountCareControlsOverlay() {
    if (!els.carePlayControls || !els.app || els.carePlayControls.parentElement === document.body) {
      return;
    }

    document.body.insertBefore(els.carePlayControls, els.app.nextSibling);
  }

  function shouldAutoStartAfterLoading() {
    return runtimeConfig.mode === "reminder";
  }

  function startIntroLoading() {
    if (!els.startScreen || !els.startLoadingFill || !els.startLoadingText) {
      if (shouldAutoStartAfterLoading()) {
        showDifficultySelect();
      }
      return;
    }

    els.startScreen.classList.add("is-loading");
    els.startScreen.classList.remove("is-loaded");
    els.startScreen.classList.remove("is-intro-revealing");

    const duration = 1800;
    const startedAt = performance.now();

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

      window.setTimeout(() => {
        if (shouldAutoStartAfterLoading()) {
          els.startScreen.classList.remove("is-loading");
          els.startScreen.classList.add("is-loaded");
          showDifficultySelect();
          return;
        }

        els.startScreen.classList.remove("is-loading");
        els.startScreen.classList.add("is-loaded");
        els.startScreen.classList.add("is-intro-revealing");
        window.setTimeout(() => {
          els.startScreen.classList.remove("is-intro-revealing");
          openConditionCheck();
        }, 850);
      }, 260);
    }

    window.requestAnimationFrame(update);
  }

  function showDifficultySelect() {
    const configuredDifficultyIndex = getConfiguredDifficultyIndex();
    const hasConfiguredDifficulty = configuredDifficultyIndex !== null && configuredDifficultyIndex >= 0;
    const shouldStartConfiguredDifficulty = hasConfiguredDifficulty && runtimeConfig.mode !== "reminder";
    if (!shouldShowDifficultySelect() || shouldStartConfiguredDifficulty) {
      startGame(hasConfiguredDifficulty ? configuredDifficultyIndex : 0);
      return;
    }

    resetState();
    state.phase = "difficulty";
    showOnly("difficulty");
  }

  function startGame(index) {
    const difficulties = getDifficulties();
    const difficultyIndex = Number.isInteger(index) && index >= 0 && index < difficulties.length ? index : 0;
    resetState();
    resetTelemetryState();
    showOnly("game");
    startReadyCountdown(difficultyIndex);
  }

  function resetState() {
    clearAllTimers();
    state.difficultyIndex = 0;
    state.questionInDifficulty = 0;
    state.correctCount = 0;
    state.timeLeft = runtimeConfig.durationSeconds;
    state.currentQuestion = null;
    state.hintStep = 0;
    state.hintTimerId = null;
    state.lastMemoryTotalCount = 0;
    state.wrongAttempts = 0;
    state.phase = "start";
    state.isPaused = false;
    state.phaseRemaining = 0;
    state.phaseCallback = null;
    state.reachedDifficultyIndex = 0;
    state.reachedQuestion = 0;
    els.pauseModal.classList.add("is-hidden");
    if (els.postConditionModal) {
      els.postConditionModal.classList.add("is-hidden");
    }
    els.pauseButton.classList.remove("is-paused");
  }

  function startReadyCountdown(index) {
    state.difficultyIndex = index;
    state.timeLeft = runtimeConfig.durationSeconds;
    state.phase = "countdown";
    state.isPaused = false;
    state.reachedDifficultyIndex = index;
    updateTopUi();
    updateCareHintButtonState();

    if (!els.gameCountdown || !els.gameCountdownTimer || !els.gameCountdownNumber) {
      startDifficulty(index);
      return;
    }

    els.playArea.innerHTML = "";
    els.gameCountdown.classList.remove("is-hidden");
    els.gameCountdown.classList.add("is-intro");
    els.gameCountdown.setAttribute("aria-hidden", "false");
    els.gameCountdownNumber.textContent = "3";
    els.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");

    if (!els.gameCountdownMessage) {
      beginReadyCountdown(index);
      return;
    }

    els.gameCountdownMessage.textContent = "게임이 곧 시작돼요!";
    state.startCountdownIntroTimeoutId = window.setTimeout(() => {
      state.startCountdownIntroTimeoutId = null;
      beginReadyCountdown(index);
    }, START_READY_MESSAGE_TIME);
  }

  function beginReadyCountdown(index) {
    if (state.phase !== "countdown" || !els.gameCountdown || !els.gameCountdownTimer || !els.gameCountdownNumber) {
      return;
    }

    const startedAt = performance.now();
    els.gameCountdown.classList.remove("is-intro");
    let lastDisplaySeconds = null;

    function updateCountdown(now) {
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
        startDifficulty(index);
        return;
      }

      state.startCountdownFrameId = window.requestAnimationFrame(updateCountdown);
    }

    updateCountdown(startedAt);
  }

  function startDifficulty(index) {
    clearAllTimers();
    state.difficultyIndex = index;
    state.questionInDifficulty = 0;
    state.lastMemoryTotalCount = 0;
    state.timeLeft = runtimeConfig.durationSeconds;
    state.phase = "ready";
    state.isPaused = false;
    state.reachedDifficultyIndex = index;
    updateTopUi();
    playSound("start");
    startTelemetrySession(index);
    sendGameStarted();
    startDifficultyTimer();
    showNextQuestion();
  }

  function showNextQuestion() {
    clearPhaseTimer();
    clearHintTimer();

    if (state.questionInDifficulty >= getTotalQuestions()) {
      finishGame("all_questions");
      return;
    }

    state.currentQuestion = createQuestion();
    recordQuestionCreated(state.currentQuestion);
    state.hintStep = 0;
    state.wrongAttempts = 0;
    state.phase = "memory";
    updateReachedPoint();
    updateTopUi();
    renderMemoryView(state.currentQuestion);
    recordMemoryStarted();
    startPhaseTimer(getMemoryRevealMs(), isCareMode() ? showCareRecallTransition : showQuestionView);
  }

  function showCareRecallTransition() {
    if (!state.currentQuestion) {
      return;
    }

    clearPhaseTimer();
    state.phase = "recall";
    renderCareRecallTransitionView();
    startPhaseTimer(CARE_RECALL_TRANSITION_TIME, showQuestionView);
  }

  function showQuestionView() {
    if (!state.currentQuestion) {
      return;
    }

    clearPhaseTimer();
    state.phase = "question";
    renderQuestionView(state.currentQuestion);
    recordQuestionShown(state.currentQuestion);
  }

  function answerQuestion(choice) {
    if (state.phase !== "question" && isQuestionViewVisible() && !state.isPaused && state.currentQuestion) {
      state.phase = "question";
      updateCareHintButtonState();
    }

    if (state.phase !== "question" || state.isPaused || !state.currentQuestion) {
      return;
    }

    clearHintTimer();
    const isCorrect = Number(choice) === state.currentQuestion.answer;
    recordAnswerSelected(choice, isCorrect);
    if (isCorrect) {
      state.correctCount += 1;
      playSound("correct");
      completeQuestion(true);
      return;
    }

    state.wrongAttempts += 1;
    if (state.wrongAttempts <= MAX_WRONG_RETRIES) {
      playSound("retry");
      state.phase = "feedback";
      renderRetryFeedbackView(MAX_WRONG_RETRIES - state.wrongAttempts);
      startPhaseTimer(getRetryFeedbackTime(), showQuestionView);
      return;
    }

    playSound("wrong");
    completeQuestion(false);
  }

  function completeQuestion(isCorrect) {
    finalizeCurrentQuestion(isCorrect ? "correct" : "incorrect", isCorrect);
    state.questionInDifficulty += 1;
    if (isCareMode() && state.questionInDifficulty >= getTotalQuestions()) {
      finishCareSessionWithoutFinalFeedback();
      return;
    }

    state.phase = "feedback";
    renderFeedbackView(isCorrect, state.currentQuestion);
    startPhaseTimer(getFeedbackTime(), showNextQuestion);
  }

  function finishCareSessionWithoutFinalFeedback() {
    state.phase = "result";
    state.currentQuestion = null;
    clearHintTimer();
    if (els.playArea) {
      els.playArea.innerHTML = "";
    }
    updateCareHintButtonState();
    finishGame("all_questions");
  }

  function handleTimeExpired() {
    clearAllTimers();
    finalizeCurrentQuestion("timeout", false);
    finishGame("time_expired");
  }

  function createQuestion() {
    if (isCareMode()) {
      return createCareQuestion();
    }

    const difficulty = currentDifficulty();
    const progress = difficultyProgress();

    if (difficulty.key === "easy") {
      return createEasyQuestion(progress);
    }

    return createMixedQuestion(progress);
  }

  function isCareMode() {
    return runtimeConfig.mode === "care" || runtimeConfig.mode === "ai_assisted";
  }

  function isStandardLikeMode() {
    return runtimeConfig.mode === "standard" || runtimeConfig.mode === "reminder";
  }

  function isStandardResultMode() {
    return runtimeConfig.mode === "standard";
  }

  function isCareResultMode() {
    return isCareMode() || runtimeConfig.mode === "reminder";
  }

  function getMemoryRevealMs() {
    return isCareMode() ? runtimeConfig.revealMs : currentDifficulty().revealMs;
  }

  function getFeedbackTime() {
    return isCareMode() ? CARE_FEEDBACK_TIME : FEEDBACK_TIME;
  }

  function getRetryFeedbackTime() {
    return isCareMode() ? CARE_FEEDBACK_TIME : RETRY_FEEDBACK_TIME;
  }

  function createCareQuestion() {
    const questionIndex = state.questionInDifficulty;
    const fruitCountLimit = Math.max(1, Math.min(4, runtimeConfig.maxItemsToRemember || 4));
    const plan = getCareQuestionPlan(currentDifficulty().key, questionIndex, fruitCountLimit);
    const selectedFruits = pickCareFruits(plan.typeCount);
    const counts = splitCareCounts(plan.totalCount, plan.typeCount);
    let cards = [];
    selectedFruits.forEach((fruit, index) => {
      cards = cards.concat(Array.from({ length: counts[index] }, () => fruit));
    });
    if (plan.shuffleCards) {
      cards = shuffle(cards);
    }

    const targetIndex = randomInRange(0, selectedFruits.length - 1);
    const target = selectedFruits[targetIndex];
    const answer = counts[targetIndex];
    const options = createCareAnswerOptions(answer, plan.totalCount);

    return {
      cards,
      target,
      answer,
      totalCount: plan.totalCount,
      options,
      memoryPrompt: `${target.name}${getSubjectParticle(target.name)} 몇 개 있는지 같이 봐볼까요?`,
      questionPrompt: createCareQuestionPrompt(target, options)
    };
  }

  function getCareQuestionPlan(difficultyKey, questionIndex, fruitCountLimit) {
    const plansByDifficulty = {
      easy: [
        { totalCount: 1, typeCount: 1, shuffleCards: false },
        { totalCount: 2, typeCount: 1, shuffleCards: false },
        { totalCount: 2, typeCount: 1, shuffleCards: false },
        { totalCount: 3, typeCount: 1, shuffleCards: false },
        { totalCount: 3, typeCount: 1, shuffleCards: false },
        { totalCount: 4, typeCount: 1, shuffleCards: false },
        { totalCount: 4, typeCount: 1, shuffleCards: false }
      ],
      normal: [
        { totalCount: 1, typeCount: 1, shuffleCards: false },
        { totalCount: 2, typeCount: 1, shuffleCards: false },
        { totalCount: 2, typeCount: 2, shuffleCards: false },
        { totalCount: 3, typeCount: 2, shuffleCards: false },
        { totalCount: 3, typeCount: 2, shuffleCards: false },
        { totalCount: 4, typeCount: 2, shuffleCards: false },
        { totalCount: 4, typeCount: 2, shuffleCards: false }
      ],
      hard: [
        { totalCount: 2, typeCount: 1, shuffleCards: true },
        { totalCount: 2, typeCount: 2, shuffleCards: true },
        { totalCount: 3, typeCount: 2, shuffleCards: true },
        { totalCount: 3, typeCount: 2, shuffleCards: true },
        { totalCount: 4, typeCount: 2, shuffleCards: true },
        { totalCount: 4, typeCount: 3, shuffleCards: true },
        { totalCount: 4, typeCount: 3, shuffleCards: true }
      ]
    };
    const plans = plansByDifficulty[difficultyKey] || plansByDifficulty.easy;
    const basePlan = plans[Math.min(questionIndex, plans.length - 1)];
    const totalCount = Math.max(1, Math.min(basePlan.totalCount, fruitCountLimit));
    const typeCount = Math.max(1, Math.min(basePlan.typeCount, totalCount));
    return { totalCount, typeCount, shuffleCards: Boolean(basePlan.shuffleCards) };
  }

  function pickCareFruits(typeCount) {
    const previousFruitIds = new Set(
      state.currentQuestion && Array.isArray(state.currentQuestion.cards)
        ? state.currentQuestion.cards.map((fruit) => fruit.id)
        : []
    );
    let candidates = FRUITS.filter((fruit) => !previousFruitIds.has(fruit.id));

    if (candidates.length < typeCount && state.currentQuestion && state.currentQuestion.target) {
      const previousTargetId = state.currentQuestion.target.id;
      candidates = FRUITS.filter((fruit) => fruit.id !== previousTargetId);
    }

    if (candidates.length < typeCount) {
      candidates = FRUITS;
    }

    return shuffle(candidates).slice(0, typeCount);
  }

  function splitCareCounts(totalCount, typeCount) {
    if (typeCount <= 1) {
      return [totalCount];
    }

    return splitCount(totalCount, typeCount);
  }

  function createCareAnswerOptions(answer, totalCount) {
    const nearbyOptions = answer > 1 ? [answer - 1, answer + 1] : [answer + 1];
    return shuffle([answer, pickOne(nearbyOptions)]);
  }

  function createCareQuestionPrompt(fruit, options) {
    const optionText = options.map((option) => `${formatCareCountLabel(option)}일까요`).join(", ");
    return `${fruit.name}${getSubjectParticle(fruit.name)} ${optionText}?`;
  }

  function formatCareCountLabel(value) {
    const labels = {
      1: "하나",
      2: "두 개",
      3: "세 개",
      4: "네 개",
      5: "다섯 개"
    };
    return labels[value] || `${value}개`;
  }

  function createEasyQuestion(progress) {
    const fruit = pickOne(FRUITS);
    const count = getProgressiveTotalCount(currentDifficulty(), progress);
    const cards = Array.from({ length: count }, () => fruit);

    return {
      cards,
      target: fruit,
      answer: count,
      totalCount: count
    };
  }

  function createMixedQuestion(progress) {
    const difficulty = currentDifficulty();
    const totalCount = getProgressiveTotalCount(difficulty, progress);
    const typeCount = Math.min(totalCount, getTypeCount(difficulty, progress));
    const selectedFruits = shuffle([...FRUITS]).slice(0, typeCount);
    const counts = splitCount(totalCount, typeCount);

    let cards = [];
    selectedFruits.forEach((fruit, index) => {
      cards = cards.concat(Array.from({ length: counts[index] }, () => fruit));
    });

    if (difficulty.shuffleCards) {
      cards = shuffle(cards);
    }

    const target = pickOne(selectedFruits);
    const answer = cards.filter((fruit) => fruit.id === target.id).length;

    return {
      cards,
      target,
      answer,
      totalCount
    };
  }

  function startTelemetrySession(index) {
    const difficulty = getDifficulties()[index] || getDifficulties()[0];
    const startedAtMs = Date.now();
    telemetryState.startedAtMs = startedAtMs;
    telemetryState.startedAt = new Date(startedAtMs).toISOString();
    telemetryState.endedAt = null;
    telemetryState.endedAtMs = 0;
    telemetryState.exitReason = "playing";
    telemetryState.selectedDifficulty = {
      key: difficulty.key,
      label: difficulty.label,
      index
    };
  }

  function endTelemetrySession(reason) {
    const endedAtMs = Date.now();
    telemetryState.endedAtMs = endedAtMs;
    telemetryState.endedAt = new Date(endedAtMs).toISOString();
    telemetryState.exitReason = reason || telemetryState.exitReason || "unknown";
  }

  function createQuestionInstanceId(questionIndex) {
    const sessionId = runtimeConfig.sessionId || runtimeConfig.gameId || "session";
    return `${sessionId}_q${questionIndex}`;
  }

  function recordQuestionCreated(question) {
    const difficulty = currentDifficulty();
    const questionIndex = state.questionInDifficulty + 1;
    const record = {
      questionInstanceId: createQuestionInstanceId(questionIndex),
      questionIndex,
      difficulty: {
        key: difficulty.key,
        label: difficulty.label,
        index: state.difficultyIndex
      },
      cognitiveDomainMain: "기억력",
      cognitiveDomainSub: ["주의력", "실행기능", "시공간 구성능력"],
      targetFruitId: question.target.id,
      targetFruitName: question.target.name,
      answerCount: question.answer,
      totalFruitCount: question.totalCount,
      fruitTypeCount: new Set(question.cards.map((fruit) => fruit.id)).size,
      answerOptions: [],
      userFinalAnswer: null,
      isCorrect: false,
      attemptCount: 0,
      hintUsed: false,
      hintCount: 0,
      maxHintLevel: 0,
      responseTimeMs: null,
      finalState: "pending",
      internal: {
        memoryStartedAtMs: null,
        questionShownAtMs: null,
        firstResponseTimeMs: null,
        finalResponseTimeMs: null,
        wrongAnswers: [],
        underCountAnswer: false,
        overCountAnswer: false,
        hintClickTimeMs: [],
        pausedInQuestion: false
      }
    };

    telemetryState.currentQuestionRecord = record;
    telemetryState.questionResults.push(record);
  }

  function recordMemoryStarted() {
    const record = telemetryState.currentQuestionRecord;
    if (!record || record.finalState !== "pending") {
      return;
    }

    record.internal.memoryStartedAtMs = Date.now();
  }

  function recordQuestionShown(question) {
    const record = telemetryState.currentQuestionRecord;
    if (!record || record.finalState !== "pending") {
      return;
    }

    record.internal.questionShownAtMs = Date.now();
    record.answerOptions = Array.isArray(question.options) ? [...question.options] : [];
  }

  function recordHintUsed(hintLevel) {
    const record = telemetryState.currentQuestionRecord;
    if (!record || record.finalState !== "pending") {
      return;
    }

    const now = Date.now();
    const baseTime = record.internal.questionShownAtMs || record.internal.memoryStartedAtMs || now;
    record.hintUsed = true;
    record.hintCount += 1;
    record.maxHintLevel = Math.max(record.maxHintLevel, hintLevel);
    record.internal.hintClickTimeMs.push(Math.max(0, now - baseTime));
  }

  function recordAnswerSelected(choice, isCorrect) {
    const record = telemetryState.currentQuestionRecord;
    if (!record || record.finalState !== "pending") {
      return;
    }

    const now = Date.now();
    const selectedValue = Number(choice);
    const questionShownAtMs = record.internal.questionShownAtMs || now;
    const responseTimeMs = Math.max(0, now - questionShownAtMs);

    if (record.internal.firstResponseTimeMs === null) {
      record.internal.firstResponseTimeMs = responseTimeMs;
    }

    record.internal.finalResponseTimeMs = responseTimeMs;
    record.responseTimeMs = responseTimeMs;
    record.userFinalAnswer = selectedValue;
    record.attemptCount += 1;

    if (!isCorrect) {
      record.internal.wrongAnswers.push(selectedValue);
      if (selectedValue < record.answerCount) {
        record.internal.underCountAnswer = true;
      }
      if (selectedValue > record.answerCount) {
        record.internal.overCountAnswer = true;
      }
    }
  }

  function recordQuestionPause() {
    telemetryState.pauseCount += 1;
    const record = telemetryState.currentQuestionRecord;
    if (record && record.finalState === "pending") {
      record.internal.pausedInQuestion = true;
    }
  }

  function finalizeCurrentQuestion(finalState, isCorrect) {
    const record = telemetryState.currentQuestionRecord;
    if (!record || record.finalState !== "pending") {
      return;
    }

    if (record.internal.questionShownAtMs && record.internal.finalResponseTimeMs === null) {
      record.internal.finalResponseTimeMs = Math.max(0, Date.now() - record.internal.questionShownAtMs);
      record.responseTimeMs = record.internal.finalResponseTimeMs;
    }

    record.finalState = finalState;
    record.isCorrect = Boolean(isCorrect);

    if ((finalState === "timeout" || finalState === "quit") && telemetryState.earlyExitQuestionIndex === null) {
      telemetryState.earlyExitQuestionIndex = record.questionIndex;
    }
  }

  function getCountRange(difficulty, progress) {
    return difficulty.startRange.map((start, index) => {
      const end = Math.min(difficulty.endRange[index], MAX_MEMORY_CARDS);
      const safeStart = Math.min(start, end);
      return Math.round(safeStart + (end - safeStart) * progress);
    });
  }

  function getProgressiveTotalCount(difficulty, progress) {
    const [rangeMin, rangeMax] = getCountRange(difficulty, progress);
    const previousCount = state.lastMemoryTotalCount || rangeMin;
    const minCount = Math.min(rangeMax, Math.max(rangeMin, previousCount));
    const totalCount = randomInRange(minCount, rangeMax);
    state.lastMemoryTotalCount = totalCount;
    return totalCount;
  }

  function getTypeCount(difficulty, progress) {
    return Math.round(difficulty.minTypes + (difficulty.maxTypes - difficulty.minTypes) * progress);
  }

  function splitCount(total, parts) {
    const counts = Array(parts).fill(1);
    let remaining = total - parts;

    while (remaining > 0) {
      const index = randomInRange(0, parts - 1);
      counts[index] += 1;
      remaining -= 1;
    }

    return counts;
  }

  function renderMemoryView(question) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "memory-view";

    const notice = document.createElement("div");
    notice.className = "memory-card";

    const title = document.createElement("p");
    title.className = "guide-text";
    title.textContent = question.memoryPrompt || "잘 보고 기억해주세요";

    const countdown = document.createElement("p");
    countdown.className = "memory-countdown";
    countdown.setAttribute("aria-live", "polite");
    countdown.textContent = `${Math.ceil(getMemoryRevealMs() / 1000)}초`;

    notice.append(title, countdown);

    const grid = document.createElement("div");
    grid.className = "fruit-grid";
    grid.classList.add(getFruitGridClass(question.cards.length), "is-auto-fit");
    grid.style.setProperty("--memory-count", question.cards.length);
    question.cards.forEach((fruit) => grid.appendChild(createFruitCard(fruit)));

    if (isCareMode()) {
      const topRegion = document.createElement("div");
      topRegion.className = "care-stage-top";
      const centerRegion = document.createElement("div");
      centerRegion.className = "care-stage-center care-memory-center";
      topRegion.appendChild(notice);
      centerRegion.appendChild(grid);
      view.append(topRegion, centerRegion);
    } else {
      view.append(notice, grid);
    }
    els.playArea.appendChild(view);
    updateCareHintButtonState();
    scheduleMemoryLayout();
    window.setTimeout(scheduleMemoryLayout, 60);
  }

  function renderCareRecallTransitionView() {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "care-recall-view";

    const message = document.createElement("p");
    message.className = "care-recall-text";
    message.textContent = "좋아요. 이제 한 번 떠올려볼까요?";

    view.appendChild(message);
    els.playArea.appendChild(view);
    updateCareHintButtonState();
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
    if (!view || state.phase !== "memory") {
      return;
    }

    const grid = view.querySelector(".fruit-grid");
    const notice = view.querySelector(".memory-card");
    if (!grid || !notice || grid.children.length === 0) {
      return;
    }

    const count = grid.children.length;
    const viewWidth = view.clientWidth;
    const viewHeight = view.clientHeight;
    const noticeHeight = notice.offsetHeight;
    if (viewWidth <= 0 || viewHeight <= 0) {
      return;
    }

    const viewStyle = window.getComputedStyle(view);
    const stackGap = parseCssLength(viewStyle.rowGap || viewStyle.gap);
    const availableWidth = Math.max(1, viewWidth);
    const isShortLandscape = false;
    const verticalSafety = 14;
    const availableHeight = Math.max(1, viewHeight - noticeHeight - stackGap - verticalSafety);
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

  function renderQuestionView(question) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "question-view";

    const card = document.createElement("div");
    card.className = "question-card";

    const questionText = document.createElement("p");
    questionText.className = "guide-text";
    questionText.textContent = question.questionPrompt || `${question.target.name}${getTopicParticle(question.target.name)} 몇 개였을까요?`;

    const questionTopRow = document.createElement("div");
    questionTopRow.className = "question-top-row";

    const questionPromptWrap = document.createElement("div");
    questionPromptWrap.className = "question-prompt-wrap";

    const target = document.createElement("div");
    target.className = "target-fruit";
    target.append(createFruitImage(question.target, "target-fruit-image"), createTargetFruitName(question.target.name));

    const hintArea = document.createElement("div");
    hintArea.className = "hint-area";

    const hintMessage = document.createElement("p");
    hintMessage.className = "hint-message";
    hintMessage.setAttribute("aria-live", "polite");
    hintMessage.textContent = "";
    hintMessage.classList.add("is-hidden");

    const hintButton = document.createElement("button");
    hintButton.className = "game-button hint-button";
    hintButton.type = "button";
    const hintButtonText = document.createElement("span");
    hintButtonText.className = "hint-button-text";
    hintButtonText.textContent = "힌트";
    hintButton.appendChild(hintButtonText);
    hintButton.addEventListener("click", () => {
      playSound("button");
      clearHintTimer();
      state.hintStep = Math.min(state.hintStep + 1, 2);
      recordHintUsed(state.hintStep);
      hintMessage.textContent = getHintMessage(question, state.hintStep);
      hintMessage.classList.remove("is-hidden");
      state.hintTimerId = window.setTimeout(() => {
        hintMessage.textContent = "";
        hintMessage.classList.add("is-hidden");
        state.hintTimerId = null;
      }, 3000);
    });

    hintArea.appendChild(hintButton);

    const answerGrid = document.createElement("div");
    answerGrid.className = "answer-grid";

    if (!question.options) {
      question.options = createAnswerOptions(question.answer, question.totalCount);
    }

    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "game-button number-button";
      button.type = "button";
      button.textContent = formatAnswerOption(option);
      button.addEventListener("click", () => answerQuestion(option));
      answerGrid.appendChild(button);
    });

    questionPromptWrap.append(questionText, hintMessage);
    questionTopRow.append(questionPromptWrap, hintArea);

    if (isCareMode()) {
      const topRegion = document.createElement("div");
      topRegion.className = "care-stage-top";
      const centerRegion = document.createElement("div");
      centerRegion.className = "care-stage-center care-question-center";
      topRegion.appendChild(questionTopRow);
      centerRegion.append(target, answerGrid);
      card.append(topRegion, centerRegion);
    } else {
      card.append(questionTopRow, target, answerGrid);
    }
    view.appendChild(card);
    els.playArea.appendChild(view);
    updateCareHintButtonState();
  }

  function getHintMessage(question, hintStep) {
    if (hintStep <= 1) {
      return getFirstHintMessage(question.answer);
    }

    return getSecondHintMessage(question.answer, question.totalCount);
  }

  function getFirstHintMessage(answer) {
    if (answer <= 1) {
      return "아주 적게 있었어요!";
    }

    return `${answer - 1}개보다 많았어요!`;
  }

  function getSecondHintMessage(answer, totalCount) {
    const maxCount = Math.max(totalCount, answer);
    let min = Math.max(1, answer - 1);
    let max = Math.min(maxCount, answer + 1);

    if (min === max) {
      if (min > 1) {
        min -= 1;
      } else {
        max = Math.min(maxCount, min + 1);
      }
    }

    if (min === max) {
      return "아주 적게 있었어요!";
    }

    return `${min}~${max}개 사이였어요!`;
  }

  function getTopicParticle(text) {
    const lastChar = text.trim().charAt(text.trim().length - 1);
    const code = lastChar.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      return "는";
    }

    return (code - 0xac00) % 28 === 0 ? "는" : "은";
  }

  function getSubjectParticle(text) {
    const lastChar = text.trim().charAt(text.trim().length - 1);
    const code = lastChar.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      return "가";
    }

    return (code - 0xac00) % 28 === 0 ? "가" : "이";
  }

  function formatAnswerOption(value) {
    if (!isCareMode()) {
      return String(value);
    }

    const labels = {
      1: "하나",
      2: "두 개",
      3: "세 개",
      4: "네 개",
      5: "다섯 개"
    };
    return labels[value] || `${value}개`;
  }

  function renderRetryFeedbackView(remainingRetries) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "feedback-view retry-feedback";

    const symbol = document.createElement("div");
    symbol.className = "feedback-symbol is-thinking";
    symbol.textContent = "😊";

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.append("괜찮아요.", document.createElement("br"), "천천히 다시 같이 볼까요?");

    view.append(symbol, title);
    els.playArea.appendChild(view);
    updateCareHintButtonState();
  }

  function renderFeedbackView(isCorrect, question) {
    els.playArea.innerHTML = "";
    const isFinalCareFeedback = isCareMode() && state.questionInDifficulty >= getTotalQuestions();

    const view = document.createElement("section");
    view.className = "feedback-view";

    const symbol = document.createElement("div");
    symbol.className = isFinalCareFeedback
      ? "feedback-symbol is-final-care"
      : `feedback-symbol${isCorrect ? "" : " is-soft"}`;
    symbol.textContent = isFinalCareFeedback ? "🥰" : (isCorrect ? "✓" : "😊");

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.textContent = isFinalCareFeedback
      ? "여기까지 마쳤습니다."
      : isCareMode()
      ? (isCorrect ? "좋습니다. 잘 보셨어요." : "조금 헷갈릴 수 있어요.")
      : (isCorrect ? "좋아요. 잘 보셨어요" : "괜찮아요");

    const message = document.createElement("p");
    message.className = "feedback-message";
    message.textContent = isFinalCareFeedback
      ? "오늘도 차분히 집중해 주셨어요."
      : isCorrect
      ? "하나만 더 해볼까요? 힘드시면 쉬어도 괜찮아요."
      : (isCareMode() ? "괜찮아요. 천천히 다시 같이 볼까요?" : "조금 헷갈릴 수 있어요. 하나만 더 연습해볼까요?");

    view.append(symbol, title, message);
    els.playArea.appendChild(view);
    updateCareHintButtonState();
  }

  function createFruitCard(fruit) {
    const card = document.createElement("div");
    card.className = "fruit-card";
    card.setAttribute("aria-label", fruit.name);

    const image = createFruitImage(fruit, "fruit-image");

    const name = document.createElement("span");
    name.className = "fruit-name";
    name.textContent = fruit.name;

    card.append(image, name);
    return card;
  }

  function createFruitImage(fruit, className) {
    const image = document.createElement("img");
    image.className = className;
    image.src = fruit.image;
    image.alt = "";
    image.draggable = false;
    image.decoding = "async";
    return image;
  }

  function createTargetFruitName(name) {
    const text = document.createElement("span");
    text.className = "target-fruit-name";
    text.textContent = name;
    return text;
  }

  function getFruitGridClass(count) {
    if (count <= 4) {
      return "is-sparse";
    }

    if (count <= 8) {
      return "is-medium";
    }

    if (count <= 11) {
      return "is-balanced";
    }

    if (count <= 15) {
      return "is-many";
    }

    return "is-dense";
  }

  function createAnswerOptions(answer, totalCount) {
    const maxOption = Math.max(4, totalCount);
    const optionCount = Math.max(2, Math.min(6, runtimeConfig.answerChoiceCount || 4));
    const values = new Set([answer]);
    const closeNumbers = [answer - 2, answer - 1, answer + 1, answer + 2, answer + 3, answer - 3];

    closeNumbers.forEach((number) => {
      if (number >= 1 && number <= maxOption && values.size < optionCount) {
        values.add(number);
      }
    });

    while (values.size < optionCount) {
      values.add(randomInRange(1, maxOption));
    }

    return Array.from(values).sort((a, b) => a - b);
  }

  function startDifficultyTimer() {
    clearInterval(state.timerId);
    if (!shouldShowTimer()) {
      state.timerId = null;
      updateTimerUi();
      return;
    }

    updateTimerUi();

    state.timerId = window.setInterval(() => {
      if (state.isPaused || state.phase !== "question") {
        return;
      }

      state.timeLeft = Math.max(0, state.timeLeft - 1);
      updateTimerUi();

      if (state.timeLeft <= 0) {
        handleTimeExpired();
      }
    }, 1000);
  }

  function startPhaseTimer(duration, callback) {
    clearPhaseTimer();
    state.phaseDuration = duration;
    state.phaseRemaining = duration;
    state.phaseStartedAt = Date.now();
    state.phaseCallback = callback;
    if (state.phase === "memory") {
      updateMemoryCountdown();
      state.phaseCountdownId = window.setInterval(updateMemoryCountdown, 100);
    }
    state.phaseTimerId = window.setTimeout(callback, duration);
  }

  function clearPhaseTimer() {
    if (state.phaseTimerId) {
      window.clearTimeout(state.phaseTimerId);
      state.phaseTimerId = null;
    }
    if (state.phaseCountdownId) {
      window.clearInterval(state.phaseCountdownId);
      state.phaseCountdownId = null;
    }
  }

  function updateMemoryCountdown() {
    if (state.phase !== "memory") {
      return;
    }

    const countdown = els.playArea.querySelector(".memory-countdown");
    if (!countdown) {
      return;
    }

    const remaining = Math.max(0, state.phaseDuration - (Date.now() - state.phaseStartedAt));
    countdown.textContent = `${Math.max(1, Math.ceil(remaining / 1000))}초`;
  }

  function clearAllTimers() {
    clearInterval(state.timerId);
    state.timerId = null;
    clearPhaseTimer();
    clearStartCountdown();
    clearHintTimer();
    clearResultAutoReturnTimer();
  }

  function clearResultAutoReturnTimer() {
    if (state.resultAutoReturnTimerId) {
      window.clearTimeout(state.resultAutoReturnTimerId);
      state.resultAutoReturnTimerId = null;
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
    if (els.gameCountdown) {
      els.gameCountdown.classList.add("is-hidden");
      els.gameCountdown.classList.remove("is-intro");
      els.gameCountdown.setAttribute("aria-hidden", "true");
    }
    if (els.gameCountdownTimer) {
      els.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");
    }
  }

  function clearHintTimer() {
    if (state.hintTimerId) {
      window.clearTimeout(state.hintTimerId);
      state.hintTimerId = null;
    }
    hideCareHintMessage();
  }

  function hideCareHintMessage() {
    if (!els.careHintMessage) {
      return;
    }

    els.careHintMessage.textContent = "";
    els.careHintMessage.classList.add("is-hidden");
    if (els.app) {
      els.app.classList.remove("is-care-hint-open");
    }
  }

  function updateCareHintButtonState() {
    const isCare = isCareMode();
    const hasQuestionView = isQuestionViewVisible();
    const isQuestionInputReady = hasQuestionView && !!state.currentQuestion;
    const canPause = isCare && !state.isPaused && (
      isQuestionInputReady || !["start", "difficulty", "countdown", "postCondition", "result"].includes(state.phase)
    );

    if (els.carePauseButton) {
      els.carePauseButton.disabled = !canPause;
      els.carePauseButton.setAttribute("aria-disabled", canPause ? "false" : "true");
    }

    const canUseHint = isCare && isQuestionInputReady && !state.isPaused;
    if (els.careHintButton) {
      els.careHintButton.hidden = !hasQuestionView;
      els.careHintButton.disabled = !canUseHint;
      els.careHintButton.setAttribute("aria-disabled", canUseHint ? "false" : "true");
    }
    if (!hasQuestionView) {
      hideCareHintMessage();
    }
  }

  function isQuestionViewVisible() {
    return !!(els.playArea && els.playArea.querySelector(".question-view"));
  }

  function triggerCareHint() {
    if (els.careHintButton.disabled || !state.currentQuestion) {
      return;
    }

    playSound("button");
    clearHintTimer();
    state.hintStep = Math.min(state.hintStep + 1, 2);
    recordHintUsed(state.hintStep);
    if (els.careHintMessage) {
      els.careHintMessage.textContent = getHintMessage(state.currentQuestion, state.hintStep);
      els.careHintMessage.classList.remove("is-hidden");
      if (els.app) {
        els.app.classList.add("is-care-hint-open");
      }
    }
    state.hintTimerId = window.setTimeout(() => {
      hideCareHintMessage();
      state.hintTimerId = null;
    }, 3000);
  }

  function pauseGame() {
    if (state.phase !== "question" && isQuestionViewVisible() && state.currentQuestion && !state.isPaused) {
      state.phase = "question";
      updateCareHintButtonState();
    }

    if (state.phase === "start" || state.phase === "difficulty" || state.phase === "countdown" || state.phase === "postCondition" || state.phase === "result" || state.isPaused) {
      return;
    }

    state.isPaused = true;
    recordQuestionPause();
    els.pauseButton.classList.add("is-paused");
    if (els.carePauseButton) {
      els.carePauseButton.classList.add("is-paused");
    }
    if (els.app) {
      els.app.classList.add("is-care-paused");
    }
    updateCareHintButtonState();
    clearInterval(state.timerId);
    state.timerId = null;

    if (state.phaseTimerId) {
      state.phaseRemaining = Math.max(0, state.phaseDuration - (Date.now() - state.phaseStartedAt));
      clearPhaseTimer();
    }

    els.pauseModal.classList.remove("is-hidden");
    els.resumeButton.focus();
  }

  function resumeGame() {
    if (!state.isPaused) {
      return;
    }

    state.isPaused = false;
    els.pauseButton.classList.remove("is-paused");
    if (els.carePauseButton) {
      els.carePauseButton.classList.remove("is-paused");
    }
    if (els.app) {
      els.app.classList.remove("is-care-paused");
    }
    els.pauseModal.classList.add("is-hidden");
    updateCareHintButtonState();
    startDifficultyTimer();

    if ((state.phase === "memory" || state.phase === "recall" || state.phase === "feedback") && state.phaseCallback) {
      startPhaseTimer(state.phaseRemaining, state.phaseCallback);
    }
  }

  function quitGame() {
    state.isPaused = false;
    els.pauseButton.classList.remove("is-paused");
    if (els.carePauseButton) {
      els.carePauseButton.classList.remove("is-paused");
    }
    if (els.app) {
      els.app.classList.remove("is-care-paused");
    }
    els.pauseModal.classList.add("is-hidden");
    updateCareHintButtonState();
    if (isCareMode()) {
      state.postConditionChecked = true;
    }
    finishGame("quit");
  }

  function restartPausedGame() {
    const difficultyIndex = state.difficultyIndex;
    state.isPaused = false;
    els.pauseButton.classList.remove("is-paused");
    if (els.carePauseButton) {
      els.carePauseButton.classList.remove("is-paused");
    }
    if (els.app) {
      els.app.classList.remove("is-care-paused");
    }
    els.pauseModal.classList.add("is-hidden");
    updateCareHintButtonState();
    startGame(difficultyIndex);
  }

  function openPauseHelp() {
    openTutorial();
  }

  function goHome() {
    resetState();
    els.startScreen.classList.remove("is-intro-revealing");
    showOnly("start");
  }

  function sleepIndexAt(offset) {
    const length = CONDITION_SLEEP_HOURS.length;
    return (state.conditionSleepIndex + offset + length) % length;
  }

  function sleepLabel(hours) {
    return `${hours}\uC2DC\uAC04`;
  }

  function renderConditionSleepDial() {
    if (!els.conditionSleepRows) {
      return;
    }

    els.conditionSleepRows.replaceChildren();
    [-1, 0, 1].forEach((offset) => {
      const row = document.createElement("span");
      const hours = CONDITION_SLEEP_HOURS[sleepIndexAt(offset)];
      const number = document.createElement("span");
      const unit = document.createElement("span");

      row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
      number.className = "condition-sleep-number";
      number.textContent = String(hours);
      unit.className = "condition-sleep-unit";
      unit.textContent = "\uC2DC\uAC04";
      row.append(number, unit);
      els.conditionSleepRows.appendChild(row);
    });
  }

  function getAppBridge() {
    return window.FruitCountMemoryGameAppBridge || null;
  }

  async function loadRunConfig() {
    const bridge = getAppBridge();
    const getConfig = bridge && (bridge.getRuntimeConfig || bridge.getRunConfig);
    if (typeof getConfig !== "function") {
      return true;
    }

    try {
      const config = await getConfig.call(bridge);
      applyRunConfig(config);
      return true;
    } catch (error) {
      handleFatalError(error.code || "CONFIG_LOAD_FAILED", error, error.detail);
      return false;
    }
  }

  function applyRunConfig(config) {
    const normalizedConfig = normalizeRunConfig(config);
    runtimeDifficulties = normalizedConfig.difficulties;
    delete normalizedConfig.difficulties;
    Object.assign(runtimeConfig, normalizedConfig);
    state.timeLeft = runtimeConfig.durationSeconds;
    applyRuntimeAudioSettings();
    updateSettingClasses();
    applyModeUiSettings();
    applyModeExtension();
  }

  function normalizeGameMode(value) {
    const mode = typeof value === "string" ? value.trim().toLowerCase() : "";
    return ["standard", "reminder", "care", "ai_assisted"].includes(mode) ? mode : DEFAULT_RUN_CONFIG.mode;
  }

  function normalizeUiConfig(source) {
    const base = DEFAULT_RUN_CONFIG.ui;
    const override = source && typeof source === "object" ? source : {};
    return {
      showTimer: readOptionalBoolean(override, "showTimer", base.showTimer),
      showProgress: readOptionalBoolean(override, "showProgress", base.showProgress),
      showSettings: readOptionalBoolean(override, "showSettings", base.showSettings),
      showTutorial: readOptionalBoolean(override, "showTutorial", base.showTutorial),
      showDifficultySelect: readOptionalBoolean(override, "showDifficultySelect", base.showDifficultySelect)
    };
  }

  function applyModeUiSettings() {
    const mode = runtimeConfig.mode || DEFAULT_RUN_CONFIG.mode;
    const ui = runtimeConfig.ui || DEFAULT_RUN_CONFIG.ui;
    document.documentElement.dataset.mode = mode;
    document.body.dataset.mode = mode;
    if (els.app) {
      els.app.dataset.mode = mode;
    }
    if (els.settingsButton) {
      els.settingsButton.hidden = ui.showSettings === false;
    }
    if (els.tutorialButton) {
      els.tutorialButton.hidden = ui.showTutorial === false;
    }
    if (els.timerBox) {
      els.timerBox.hidden = ui.showTimer === false;
    }
    if (els.raceWrap) {
      els.raceWrap.hidden = ui.showProgress === false;
    }
  }

  function getModeExtension() {
    const extension = window.FruitCountMemoryGameMode;
    return extension && typeof extension === "object" ? extension : null;
  }

  function applyModeExtension() {
    const extension = getModeExtension();
    if (!extension || typeof extension.apply !== "function") {
      return;
    }

    extension.apply({
      mode: runtimeConfig.mode,
      config: runtimeConfig,
      elements: els,
      state
    });
  }
  function shouldShowTimer() {
    return !runtimeConfig.ui || runtimeConfig.ui.showTimer !== false;
  }

  function shouldShowDifficultySelect() {
    return !runtimeConfig.ui || runtimeConfig.ui.showDifficultySelect !== false;
  }

  function shouldShowConditionCheck() {
    return runtimeConfig.collectCondition !== false && (!runtimeConfig.ui || runtimeConfig.ui.showConditionCheck !== false);
  }

  function shouldShowFinishCheck() {
    if (isCareMode()) {
      return false;
    }

    if (runtimeConfig.mode === "reminder") {
      return false;
    }

    return !runtimeConfig.ui || runtimeConfig.ui.showFinishCheck !== false;
  }

  function applyRuntimeAudioSettings() {
    if (els.soundToggle) {
      els.soundToggle.checked = runtimeConfig.soundEnabled !== false;
    }
    if (els.voiceGuideToggle) {
      els.voiceGuideToggle.checked = runtimeConfig.voiceGuideEnabled !== false;
    }
  }

  function normalizeExternalRunConfig(config) {
    if (!config || typeof config !== "object") {
      return config;
    }

    const settings = config.config && typeof config.config === "object" && !Array.isArray(config.config) ? config.config : {};
    const normalized = { ...config };
    delete normalized.config;

    if (hasConfigValue(config, "difficulty") && !hasConfigValue(normalized, "difficultyKey")) {
      normalized.difficultyKey = config.difficulty;
    }
    if (hasConfigValue(config, "external_input") && !hasConfigValue(normalized, "externalInput")) {
      normalized.externalInput = config.external_input;
    }
    if (hasConfigValue(settings, "question_count")) {
      normalized.totalQuestions = settings.question_count;
    }
    if (hasConfigValue(settings, "choice_count")) {
      normalized.answerChoiceCount = settings.choice_count;
    }
    if (hasConfigValue(settings, "max_items_to_remember")) {
      normalized.maxItemsToRemember = settings.max_items_to_remember;
    }
    if (hasConfigValue(settings, "duration_seconds")) {
      normalized.durationSeconds = settings.duration_seconds;
    }
    if (hasConfigValue(settings, "reveal_ms")) {
      normalized.revealMs = settings.reveal_ms;
    }
    if (hasConfigValue(settings, "voice_guide_enabled")) {
      normalized.voiceGuideEnabled = settings.voice_guide_enabled;
    }
    if (hasConfigValue(settings, "hint_enabled")) {
      normalized.hintEnabled = settings.hint_enabled;
    }
    if (hasConfigValue(settings, "auto_hint_enabled")) {
      normalized.autoHintEnabled = settings.auto_hint_enabled;
    }
    if (hasConfigValue(settings, "soft_feedback")) {
      normalized.softFeedback = settings.soft_feedback;
    }
    if (hasConfigValue(settings, "result_log_level")) {
      normalized.resultLogLevel = settings.result_log_level;
    }
    if (hasConfigValue(settings, "show_condition_check")) {
      normalized.collectCondition = settings.show_condition_check;
    }

    normalized.ui = {
      ...(normalized.ui && typeof normalized.ui === "object" ? normalized.ui : {}),
      ...(hasConfigValue(settings, "show_timer") ? { showTimer: settings.show_timer } : {}),
      ...(hasConfigValue(settings, "show_progress") ? { showProgress: settings.show_progress } : {}),
      ...(!hasConfigValue(settings, "show_progress") && hasConfigValue(settings, "show_score") ? { showProgress: settings.show_score } : {}),
      ...(hasConfigValue(settings, "show_score") ? { showScore: settings.show_score } : {}),
      ...(hasConfigValue(settings, "show_difficulty_select") ? { showDifficultySelect: settings.show_difficulty_select } : {}),
      ...(hasConfigValue(settings, "show_settings") ? { showSettings: settings.show_settings } : {}),
      ...(hasConfigValue(settings, "show_how_to_play") ? { showTutorial: settings.show_how_to_play } : {}),
      ...(hasConfigValue(settings, "show_condition_check") ? { showConditionCheck: settings.show_condition_check } : {}),
      ...(hasConfigValue(settings, "show_finish_check") ? { showFinishCheck: settings.show_finish_check } : {})
    };

    return normalized;
  }

  function normalizeRunConfig(config) {
    if (!config || typeof config !== "object") {
      throw createGameError("CONFIG_MISSING", "Run config is missing.");
    }

    const source = normalizeExternalRunConfig(config);
    const revealMs = readPositiveIntegerConfig(source, "revealMs", DEFAULT_RUN_CONFIG.revealMs);
    const maxItemsToRemember = hasConfigValue(source, "maxItemsToRemember")
      ? readPositiveIntegerConfig(source, "maxItemsToRemember", DEFAULT_RUN_CONFIG.maxItemsToRemember)
      : DEFAULT_RUN_CONFIG.maxItemsToRemember;
    const difficulties = applyMaxItemsToRemember(normalizeDifficultySettings(source.difficulties, revealMs), maxItemsToRemember);
    const difficultyValue = source.difficultyKey || source.difficulty || source.defaultDifficulty;
    const difficultyKey = normalizeDifficultyKey(difficultyValue, difficulties);
    const difficultyIndex = hasConfigValue(source, "difficultyIndex")
      ? normalizeDifficultyIndex(source.difficultyIndex, difficulties)
      : null;

    if (hasConfigValue(source, "difficultyKey") || hasConfigValue(source, "difficulty") || hasConfigValue(source, "defaultDifficulty")) {
      if (!difficultyKey) {
        throw createGameError("CONFIG_INVALID", "Unknown difficulty key.", { difficulty: difficultyValue });
      }
    }

    if (hasConfigValue(source, "difficultyIndex") && difficultyIndex === null) {
      throw createGameError("CONFIG_INVALID", "Unknown difficulty index.", { difficultyIndex: source.difficultyIndex });
    }

    return {
      gameId: typeof source.gameId === "string" && source.gameId ? source.gameId : DEFAULT_RUN_CONFIG.gameId,
      sessionId: typeof source.sessionId === "string" && source.sessionId ? source.sessionId : DEFAULT_RUN_CONFIG.sessionId,
      userId: typeof source.userId === "string" ? source.userId : DEFAULT_RUN_CONFIG.userId,
      anonymousUserId: typeof source.anonymousUserId === "string" ? source.anonymousUserId : DEFAULT_RUN_CONFIG.anonymousUserId,
      deviceId: typeof source.deviceId === "string" ? source.deviceId : DEFAULT_RUN_CONFIG.deviceId,
      appVersion: typeof source.appVersion === "string" ? source.appVersion : DEFAULT_RUN_CONFIG.appVersion,
      gameVersion: typeof source.gameVersion === "string" ? source.gameVersion : DEFAULT_RUN_CONFIG.gameVersion,
      difficultyKey,
      difficultyIndex,
      durationSeconds: readPositiveIntegerConfig(source, "durationSeconds", DEFAULT_RUN_CONFIG.durationSeconds),
      totalQuestions: readPositiveIntegerConfig(source, "totalQuestions", DEFAULT_RUN_CONFIG.totalQuestions),
      answerChoiceCount: readPositiveIntegerConfig(source, "answerChoiceCount", DEFAULT_RUN_CONFIG.answerChoiceCount),
      maxItemsToRemember,
      revealMs,
      soundEnabled: readBooleanConfig(source, "soundEnabled", DEFAULT_RUN_CONFIG.soundEnabled),
      voiceGuideEnabled: readBooleanConfig(source, "voiceGuideEnabled", DEFAULT_RUN_CONFIG.voiceGuideEnabled),
      collectCondition: readBooleanConfig(source, "collectCondition", DEFAULT_RUN_CONFIG.collectCondition),
      debugMode: readBooleanConfig(source, "debugMode", DEFAULT_RUN_CONFIG.debugMode),
      hintEnabled: readBooleanConfig(source, "hintEnabled", DEFAULT_RUN_CONFIG.hintEnabled),
      autoHintEnabled: readBooleanConfig(source, "autoHintEnabled", DEFAULT_RUN_CONFIG.autoHintEnabled),
      softFeedback: readBooleanConfig(source, "softFeedback", DEFAULT_RUN_CONFIG.softFeedback),
      resultLogLevel: typeof source.resultLogLevel === "string" && source.resultLogLevel ? source.resultLogLevel : DEFAULT_RUN_CONFIG.resultLogLevel,
      mode: normalizeGameMode(source.mode),
      ui: normalizeUiConfig(source.ui),
      previousResult: source.previousResult && typeof source.previousResult === "object" ? source.previousResult : DEFAULT_RUN_CONFIG.previousResult,
      previousRecord: source.previousRecord && typeof source.previousRecord === "object" ? source.previousRecord : DEFAULT_RUN_CONFIG.previousRecord,
      lastResult: source.lastResult && typeof source.lastResult === "object" ? source.lastResult : DEFAULT_RUN_CONFIG.lastResult,
      schemaVersion: typeof source.schemaVersion === "string" && source.schemaVersion ? source.schemaVersion : DEFAULT_RUN_CONFIG.schemaVersion,
      difficulties
    };
  }

  function applyMaxItemsToRemember(difficulties, maxItemsToRemember) {
    if (!Number.isInteger(maxItemsToRemember) || maxItemsToRemember <= 0) {
      return difficulties;
    }

    return difficulties.map((difficulty) => {
      const clampCount = (value) => Math.max(1, Math.min(value, maxItemsToRemember));
      const startRange = difficulty.startRange.map(clampCount);
      const endRange = difficulty.endRange.map(clampCount);
      return {
        ...difficulty,
        startRange,
        endRange: endRange.map((end, index) => Math.max(end, startRange[index])),
        minTypes: Math.max(1, Math.min(difficulty.minTypes, maxItemsToRemember)),
        maxTypes: Math.max(1, Math.min(difficulty.maxTypes, maxItemsToRemember))
      };
    });
  }

  function normalizeDifficultySettings(settings, revealMs = DEFAULT_RUN_CONFIG.revealMs) {
    const nextDifficulties = cloneDifficulties(DIFFICULTIES).map((difficulty) => ({
      ...difficulty,
      revealMs
    }));
    if (!settings) {
      return nextDifficulties;
    }

    const overridesByKey = readDifficultyOverrides(settings);
    nextDifficulties.forEach((difficulty, index) => {
      const override = overridesByKey[difficulty.key];
      if (!override) {
        return;
      }

      nextDifficulties[index] = normalizeDifficultyOverride(difficulty, override);
    });

    return nextDifficulties;
  }

  function readDifficultyOverrides(settings) {
    if (Array.isArray(settings)) {
      return settings.reduce((overrides, item) => {
        if (!item || typeof item !== "object" || typeof item.key !== "string") {
          throw createGameError("CONFIG_INVALID", "Invalid difficulty item.", { difficulty: item });
        }

        assertKnownDifficultyKey(item.key);
        overrides[item.key] = item;
        return overrides;
      }, {});
    }

    if (typeof settings !== "object") {
      throw createGameError("CONFIG_INVALID", "Invalid difficulties config.", { difficulties: settings });
    }

    return Object.keys(settings).reduce((overrides, key) => {
      assertKnownDifficultyKey(key);
      const override = settings[key];
      if (!override || typeof override !== "object") {
        throw createGameError("CONFIG_INVALID", "Invalid difficulty override.", { key, difficulty: override });
      }

      overrides[key] = override;
      return overrides;
    }, {});
  }

  function normalizeDifficultyOverride(baseDifficulty, override) {
    const difficulty = {
      ...baseDifficulty,
      label: readOptionalString(override, "label", baseDifficulty.label),
      runner: readOptionalString(override, "runner", baseDifficulty.runner),
      revealMs: readPositiveIntegerValue(override, "revealMs", baseDifficulty.revealMs),
      startRange: readRangeValue(override, "startRange", baseDifficulty.startRange),
      endRange: readRangeValue(override, "endRange", baseDifficulty.endRange),
      minTypes: readPositiveIntegerValue(override, "minTypes", baseDifficulty.minTypes),
      maxTypes: readPositiveIntegerValue(override, "maxTypes", baseDifficulty.maxTypes),
      shuffleCards: readOptionalBoolean(override, "shuffleCards", baseDifficulty.shuffleCards)
    };

    if (difficulty.minTypes > difficulty.maxTypes) {
      throw createGameError("CONFIG_INVALID", "minTypes cannot be greater than maxTypes.", {
        key: baseDifficulty.key,
        minTypes: difficulty.minTypes,
        maxTypes: difficulty.maxTypes
      });
    }

    difficulty.startRange.forEach((start, index) => {
      const end = difficulty.endRange[index];
      if (start > end) {
        throw createGameError("CONFIG_INVALID", "startRange cannot be greater than endRange.", {
          key: baseDifficulty.key,
          startRange: difficulty.startRange,
          endRange: difficulty.endRange
        });
      }
    });

    return difficulty;
  }

  function assertKnownDifficultyKey(key) {
    if (!DIFFICULTIES.some((difficulty) => difficulty.key === key)) {
      throw createGameError("CONFIG_INVALID", "Unknown difficulty key.", { difficulty: key });
    }
  }

  function readOptionalString(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    if (typeof source[key] !== "string" || !source[key].trim()) {
      throw createGameError("CONFIG_INVALID", `Invalid difficulty ${key}.`, { [key]: source[key] });
    }

    return source[key];
  }

  function readPositiveIntegerValue(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    const number = Number(source[key]);
    if (!Number.isFinite(number) || number <= 0) {
      throw createGameError("CONFIG_INVALID", `Invalid difficulty ${key}.`, { [key]: source[key] });
    }

    return Math.round(number);
  }

  function readRangeValue(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return [...fallback];
    }

    if (!Array.isArray(source[key]) || source[key].length !== 2) {
      throw createGameError("CONFIG_INVALID", `Invalid difficulty ${key}.`, { [key]: source[key] });
    }

    return source[key].map((value) => {
      const number = Number(value);
      if (!Number.isFinite(number) || number <= 0) {
        throw createGameError("CONFIG_INVALID", `Invalid difficulty ${key}.`, { [key]: source[key] });
      }

      return Math.round(number);
    });
  }

  function readOptionalBoolean(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    if (typeof source[key] !== "boolean") {
      throw createGameError("CONFIG_INVALID", `Invalid difficulty ${key}.`, { [key]: source[key] });
    }

    return source[key];
  }

  function hasConfigValue(source, key) {
    return Object.prototype.hasOwnProperty.call(source, key) && source[key] !== null && source[key] !== "";
  }

  function readPositiveIntegerConfig(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    const number = Number(source[key]);
    if (!Number.isFinite(number) || number <= 0) {
      throw createGameError("CONFIG_INVALID", `Invalid ${key}.`, { [key]: source[key] });
    }

    return Math.round(number);
  }

  function readBooleanConfig(source, key, fallback) {
    if (!hasConfigValue(source, key)) {
      return fallback;
    }

    if (typeof source[key] !== "boolean") {
      throw createGameError("CONFIG_INVALID", `Invalid ${key}.`, { [key]: source[key] });
    }

    return source[key];
  }

  function normalizeDifficultyKey(key, difficulties = getDifficulties()) {
    if (typeof key !== "string" || !key) {
      return null;
    }

    return difficulties.some((difficulty) => difficulty.key === key) ? key : null;
  }

  function normalizeDifficultyIndex(index, difficulties = getDifficulties()) {
    if (index === null || index === undefined || index === "") {
      return null;
    }

    const number = Number(index);
    if (!Number.isInteger(number) || number < 0 || number >= difficulties.length) {
      return null;
    }

    return number;
  }

  function createGameError(code, message, detail) {
    const error = new Error(message || code);
    error.code = code;
    error.detail = detail || null;
    return error;
  }

  async function validateEssentialAssets() {
    const results = await Promise.allSettled(ESSENTIAL_ASSET_SOURCES.map(loadImageAsset));
    const failedAssets = results
      .map((result, index) => ({ result, src: ESSENTIAL_ASSET_SOURCES[index] }))
      .filter((item) => item.result.status === "rejected")
      .map((item) => item.src);

    if (failedAssets.length > 0) {
      throw createGameError("ASSET_LOAD_FAILED", "Essential assets failed to load.", { assets: failedAssets });
    }
  }

  function loadImageAsset(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let settled = false;
      const finish = (isLoaded) => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeoutId);
        if (isLoaded) {
          resolve(src);
          return;
        }

        reject(new Error(`Asset failed to load: ${src}`));
      };
      const timeoutId = window.setTimeout(() => finish(false), ASSET_LOAD_TIMEOUT);

      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = src;

      if (image.complete) {
        window.setTimeout(() => finish(image.naturalWidth > 0), 0);
      }
    });
  }

  function getDebugErrorCode() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("debugError");
    if (!requested) {
      return "";
    }

    const normalized = requested.trim();
    return DEBUG_ERROR_ALIASES[normalized] || normalized.toUpperCase();
  }

  function showDebugErrorIfRequested() {
    const debugErrorCode = getDebugErrorCode();
    if (!debugErrorCode) {
      return false;
    }

    handleFatalError(
      debugErrorCode,
      createGameError(debugErrorCode, `Debug error requested: ${debugErrorCode}`, { debug: true }),
      { debug: true }
    );
    return true;
  }

  function getConfiguredDifficultyIndex() {
    if (Number.isInteger(runtimeConfig.difficultyIndex)) {
      return runtimeConfig.difficultyIndex;
    }

    if (runtimeConfig.difficultyKey) {
      return getDifficulties().findIndex((difficulty) => difficulty.key === runtimeConfig.difficultyKey);
    }

    return null;
  }

  function sendGameReady() {
    const payload = {
      eventType: "GAME_READY",
      schemaVersion: runtimeConfig.schemaVersion,
      gameId: runtimeConfig.gameId,
      sessionId: runtimeConfig.sessionId,
      status: "ready",
      readyAt: new Date().toISOString(),
      config: {
        difficultyKey: runtimeConfig.difficultyKey,
        difficultyIndex: runtimeConfig.difficultyIndex,
        durationSeconds: runtimeConfig.durationSeconds,
        totalQuestions: runtimeConfig.totalQuestions,
        collectCondition: runtimeConfig.collectCondition,
        mode: runtimeConfig.mode,
        ui: runtimeConfig.ui
      }
    };

    sendBridgeEvent(["sendGameReady", "sendReady"], payload, "READY_SEND_FAILED");
  }

  function sendGameStarted() {
    const difficulty = currentDifficulty();
    const payload = {
      eventType: "GAME_STARTED",
      schemaVersion: runtimeConfig.schemaVersion,
      gameId: runtimeConfig.gameId,
      sessionId: runtimeConfig.sessionId,
      status: "started",
      startedAt: telemetryState.startedAt || new Date().toISOString(),
      difficultyKey: difficulty.key,
      difficultyLabel: difficulty.label,
      condition: {
        mood: state.conditionMood,
        sleepHours: CONDITION_SLEEP_HOURS[state.conditionSleepIndex]
      }
    };

    sendBridgeEvent(["sendGameStarted", "sendStarted"], payload, "STARTED_SEND_FAILED");
  }

  function sendGameComplete(result) {
    sendBridgeEvent(["sendGameCompleteResult", "sendComplete"], result, "COMPLETE_SEND_FAILED");
  }

  function sendGameExit(payload) {
    return sendBridgeEvent(["sendGameExit", "sendExit", "exitGame", "closeGame"], payload, "EXIT_SEND_FAILED");
  }

  function sendBridgeEvent(methodNames, payload, errorCode) {
    const bridge = getAppBridge();
    const names = Array.isArray(methodNames) ? methodNames : [methodNames];
    const methodName = bridge && names.find((name) => typeof bridge[name] === "function");
    if (!bridge || !methodName) {
      return false;
    }

    try {
      const maybePromise = bridge[methodName](payload);
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch((error) => {
          reportAppError(errorCode, error);
        });
      }
      return true;
    } catch (error) {
      reportAppError(errorCode, error);
      return false;
    }
  }

  function reportAppError(code, error, detail) {
    const bridge = getAppBridge();
    const payload = createErrorResult(code, error, detail);
    const sendErrorMethod = bridge && (bridge.sendGameErrorResult || bridge.sendError);

    if (window.console) {
      window.console.error("[game error]", code, error, detail || null);
    }

    if (typeof sendErrorMethod === "function") {
      try {
        const maybePromise = sendErrorMethod.call(bridge, payload);
        if (maybePromise && typeof maybePromise.catch === "function" && window.console) {
          maybePromise.catch((sendError) => {
            window.console.error("[app bridge] failed to send error", sendError);
          });
        }
        return;
      } catch (sendError) {
        if (window.console) {
          window.console.error("[app bridge] failed to send error", sendError);
        }
      }
    }

    if (window.console) {
      window.console.error("[app bridge]", payload);
    }
  }

  function handleFatalError(code, error, detail) {
    reportAppError(code, error, detail || (error && error.detail));
    showErrorScreen(code, detail || (error && error.detail));
  }

  function showErrorScreen(code, detail) {
    const copy = ERROR_SCREEN_COPY[code] || ERROR_SCREEN_COPY.default;
    clearAllTimers();
    state.phase = "error";
    state.isPaused = false;

    if (els.pauseModal) {
      els.pauseModal.classList.add("is-hidden");
    }
    if (els.settingsModal) {
      els.settingsModal.classList.add("is-hidden");
    }
    if (els.tutorialModal) {
      els.tutorialModal.classList.add("is-hidden");
    }
    if (els.conditionModal) {
      els.conditionModal.classList.add("is-hidden");
    }
    if (els.postConditionModal) {
      els.postConditionModal.classList.add("is-hidden");
    }
    if (els.pauseButton) {
      els.pauseButton.classList.remove("is-paused");
    }

    if (els.errorTitle) {
      els.errorTitle.textContent = copy.title;
    }
    if (els.errorMessage) {
      els.errorMessage.textContent = copy.message;
    }
    if (els.errorCode) {
      els.errorCode.textContent = code ? `오류 코드: ${code}` : "";
      if (detail && detail.assets && detail.assets.length > 0) {
        els.errorCode.textContent = `오류 코드: ${code} / ${detail.assets[0]}`;
      }
    }

    showOnly("error");
    if (els.errorHomeButton) {
      els.errorHomeButton.focus();
    }
  }

  function createErrorResult(code, error, detail) {
    return {
      eventType: "GAME_ERROR",
      schemaVersion: runtimeConfig.schemaVersion,
      gameId: runtimeConfig.gameId,
      sessionId: runtimeConfig.sessionId,
      occurredAt: new Date().toISOString(),
      error: {
        code,
        message: error && error.message ? error.message : String(error || code),
        phase: state.phase || "unknown",
        recoverable: isRecoverableError(code)
      }
    };
  }

  function isRecoverableError(code) {
    return code === "STORAGE_FAILED" || code === "COMPLETE_SEND_FAILED";
  }

  function createCompleteResult(totalAnswered, rate) {
    if (!telemetryState.endedAt) {
      endTelemetrySession(telemetryState.exitReason === "playing" ? "unknown" : telemetryState.exitReason);
    }

    const questionResults = telemetryState.questionResults.map(createPublicQuestionResult);
    const processData = telemetryState.questionResults.map(createPublicProcessData);
    const summary = createSummary(questionResults, processData);
    const resultId = createResultId();
    const idempotencyKey = createIdempotencyKey();

    return {
      eventType: "GAME_COMPLETED",
      schemaVersion: runtimeConfig.schemaVersion,
      gameId: runtimeConfig.gameId,
      sessionId: runtimeConfig.sessionId,
      resultId,
      idempotencyKey,
      userId: runtimeConfig.userId || runtimeConfig.anonymousUserId || "",
      completedAt: telemetryState.endedAt,
      session: createSessionResult(questionResults),
      questionResults,
      processData,
      condition: createConditionResult(),
      summary
    };
  }

  function createExitPayload(source) {
    return {
      eventType: "GAME_EXIT_REQUESTED",
      schemaVersion: runtimeConfig.schemaVersion,
      gameId: runtimeConfig.gameId,
      sessionId: runtimeConfig.sessionId,
      userId: runtimeConfig.userId || runtimeConfig.anonymousUserId || "",
      requestedAt: new Date().toISOString(),
      source: source || "settings",
      phase: state.phase || "unknown"
    };
  }

  function createResultId() {
    return `result_${sanitizeResultIdPart(runtimeConfig.sessionId || runtimeConfig.gameId)}`;
  }

  function createIdempotencyKey() {
    // TODO: 서버 저장 API 확정 후 idempotencyKey 기준 중복 저장 방지 정책 적용
    // TODO: 앱/WebView 종료 또는 네트워크 실패 시 재전송 큐 정책 확정
    // TODO: COMPLETE_SEND_FAILED 발생 시 로컬 임시 저장 및 재전송 방식 협의
    return `${runtimeConfig.gameId}:${runtimeConfig.sessionId || "local-session"}`;
  }

  function sanitizeResultIdPart(value) {
    return String(value || "local-session").replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function createSessionResult(questionResults) {
    const completedQuestions = questionResults.filter((question) => question.finalState === "correct" || question.finalState === "incorrect").length;
    const attemptedQuestions = questionResults.filter((question) => question.attemptCount > 0).length;
    const exitReason = telemetryState.exitReason || "unknown";
    const completed = exitReason === "all_questions";

    return {
      sessionId: runtimeConfig.sessionId,
      userId: runtimeConfig.userId,
      anonymousUserId: runtimeConfig.anonymousUserId,
      deviceId: runtimeConfig.deviceId,
      gameId: runtimeConfig.gameId,
      gameVersion: runtimeConfig.gameVersion,
      startedAt: telemetryState.startedAt,
      endedAt: telemetryState.endedAt,
      totalPlayTimeMs: getTotalPlayTimeMs(),
      selectedDifficulty: telemetryState.selectedDifficulty,
      totalQuestions: getTotalQuestions(),
      attemptedQuestions,
      completedQuestions,
      completed,
      exitedEarly: !completed,
      exitReason
    };
  }

  function createPublicQuestionResult(record) {
    return {
      questionInstanceId: record.questionInstanceId,
      questionIndex: record.questionIndex,
      difficulty: record.difficulty.key,
      cognitiveDomainMain: record.cognitiveDomainMain,
      cognitiveDomainSub: [...record.cognitiveDomainSub],
      targetFruitId: record.targetFruitId,
      targetFruitName: record.targetFruitName,
      answerCount: record.answerCount,
      totalFruitCount: record.totalFruitCount,
      fruitTypeCount: record.fruitTypeCount,
      answerOptions: [...record.answerOptions],
      userFinalAnswer: record.userFinalAnswer,
      isCorrect: record.isCorrect,
      attemptCount: record.attemptCount,
      hintUsed: record.hintUsed,
      hintCount: record.hintCount,
      maxHintLevel: record.maxHintLevel,
      responseTimeMs: record.responseTimeMs,
      finalState: record.finalState
    };
  }

  function createPublicProcessData(record) {
    return {
      questionInstanceId: record.questionInstanceId,
      questionIndex: record.questionIndex,
      firstResponseTimeMs: record.internal.firstResponseTimeMs,
      finalResponseTimeMs: record.internal.finalResponseTimeMs,
      retryCount: record.internal.wrongAnswers.length,
      wrongAnswers: [...record.internal.wrongAnswers],
      underCountAnswer: record.internal.underCountAnswer,
      overCountAnswer: record.internal.overCountAnswer,
      hintClickTimeMs: [...record.internal.hintClickTimeMs],
      pausedInQuestion: record.internal.pausedInQuestion,
      exitedInQuestion: record.finalState === "timeout" || record.finalState === "quit"
    };
  }

  function createConditionResult() {
    return {
      moodBefore: state.conditionMood,
      sleepHours: CONDITION_SLEEP_HOURS[state.conditionSleepIndex],
      moodAfter: state.postCondition.moodAfter,
      fatigue: state.postCondition.fatigue,
      perceivedDifficulty: state.postCondition.perceivedDifficulty,
      neededHelp: state.postCondition.neededHelp,
      replayIntent: state.postCondition.replayIntent
    };
  }

  function createSummary(questionResults, processData) {
    const completedQuestionCount = questionResults.filter((question) => question.finalState === "correct" || question.finalState === "incorrect").length;
    const correctCount = questionResults.filter((question) => question.isCorrect).length;
    const wrongCount = questionResults.filter((question) => question.finalState === "incorrect").length;
    const accuracyRate = completedQuestionCount > 0 ? Math.round((correctCount / completedQuestionCount) * 100) : 0;
    const hintUsedQuestionCount = questionResults.filter((question) => question.hintUsed).length;

    return {
      correctCount,
      wrongCount,
      accuracyRate,
      completedQuestionCount,
      totalPlayTimeMs: getTotalPlayTimeMs(),
      hintUsedQuestionCount,
      averageResponseTimeMs: averageNumber(processData.map((process) => process.finalResponseTimeMs)),
      bestDifficultyReached: getBestDifficultyReached(),
      resultLabel: createResultLabel({
        exitedEarly: telemetryState.exitReason !== "all_questions",
        accuracyRate,
        hintUsedQuestionCount
      })
    };
  }

  function averageNumber(values) {
    const validValues = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    if (validValues.length === 0) {
      return null;
    }

    const total = validValues.reduce((sum, value) => sum + value, 0);
    return Math.round(total / validValues.length);
  }

  function getTotalPlayTimeMs() {
    if (!telemetryState.startedAtMs) {
      return 0;
    }

    const endedAtMs = telemetryState.endedAtMs || Date.now();
    return Math.max(0, endedAtMs - telemetryState.startedAtMs);
  }

  function getBestDifficultyReached() {
    const difficulty = getDifficulties()[state.reachedDifficultyIndex] || currentDifficulty();
    return difficulty ? difficulty.key : "";
  }

  function createResultLabel({ exitedEarly, accuracyRate, hintUsedQuestionCount }) {
    if (exitedEarly) {
      return "중간에 종료했어요";
    }

    if (accuracyRate < 50) {
      return "오늘은 조금 어려워했어요";
    }

    if (hintUsedQuestionCount > 0) {
      return "힌트를 활용해 차분히 풀었어요";
    }

    return "끝까지 잘 참여했어요";
  }

  function changeConditionSleep(delta) {
    const length = CONDITION_SLEEP_HOURS.length;
    state.conditionSleepIndex = (state.conditionSleepIndex + delta + length) % length;
    renderConditionSleepDial();
  }

  function startConditionSleepDrag(event) {
    if (!els.conditionSleepDial || event.button > 0) {
      return;
    }

    event.preventDefault();
    state.sleepDrag.pointerId = event.pointerId;
    state.sleepDrag.lastStepY = event.clientY;
    els.conditionSleepDial.classList.add("is-dragging");

    if (typeof els.conditionSleepDial.setPointerCapture === "function") {
      els.conditionSleepDial.setPointerCapture(event.pointerId);
    }
  }

  function dragConditionSleep(event) {
    if (state.sleepDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaY = event.clientY - state.sleepDrag.lastStepY;
    const steps = Math.trunc(Math.abs(deltaY) / CONDITION_SLEEP_DRAG_STEP_PX);

    if (steps < 1) {
      return;
    }

    const direction = deltaY > 0 ? -1 : 1;
    state.sleepDrag.lastStepY += direction * -steps * CONDITION_SLEEP_DRAG_STEP_PX;
    changeConditionSleep(direction * steps);
    playSound("button");
  }

  function endConditionSleepDrag(event) {
    if (state.sleepDrag.pointerId !== event.pointerId) {
      return;
    }

    if (
      els.conditionSleepDial &&
      typeof els.conditionSleepDial.releasePointerCapture === "function" &&
      els.conditionSleepDial.hasPointerCapture(event.pointerId)
    ) {
      els.conditionSleepDial.releasePointerCapture(event.pointerId);
    }

    state.sleepDrag.pointerId = null;
    state.sleepDrag.lastStepY = 0;

    if (els.conditionSleepDial) {
      els.conditionSleepDial.classList.remove("is-dragging");
    }
  }

  function selectConditionMood(button) {
    state.conditionMood = button.dataset.mood || "good";
    els.conditionMoodButtons.forEach((moodButton) => {
      const isSelected = moodButton === button;
      moodButton.classList.toggle("is-selected", isSelected);
      moodButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function openConditionCheck() {
    if (!shouldShowConditionCheck() || !els.conditionModal || state.conditionCheckShown) {
      return;
    }

    state.conditionCheckShown = true;
    renderConditionSleepDial();
    els.conditionModal.classList.remove("is-hidden");
    if (els.conditionConfirmButton) {
      els.conditionConfirmButton.focus();
    }
  }

  function closeConditionCheck() {
    if (!els.conditionModal) {
      return;
    }

    els.conditionModal.classList.add("is-hidden");
  }

  function renderPostConditionStep() {
    els.postConditionPages.forEach((page, index) => {
      page.hidden = index !== state.postConditionStep;
    });

    els.postConditionDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === state.postConditionStep);
    });
  }

  function openPostConditionCheck() {
    if (!shouldShowFinishCheck() || !els.postConditionModal) {
      showResult();
      return;
    }

    state.phase = "postCondition";
    state.isPaused = false;
    state.postConditionStep = 0;
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    renderPostConditionStep();
    els.postConditionModal.classList.remove("is-hidden");
    if (els.postConditionNextButton) {
      els.postConditionNextButton.focus();
    }
  }

  function closePostConditionCheck() {
    if (!els.postConditionModal) {
      return;
    }

    els.postConditionModal.classList.add("is-hidden");
  }

  function selectPostConditionOption(button) {
    const field = button.dataset.postField;
    const value = button.dataset.postValue;
    if (!field || !value) {
      return;
    }

    state.postCondition[field] = value;
    els.postConditionOptions.forEach((option) => {
      if (option.dataset.postField !== field) {
        return;
      }

      const isSelected = option === button;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function showNextPostConditionStep() {
    state.postConditionStep = Math.min(1, state.postConditionStep + 1);
    renderPostConditionStep();
    if (els.postConditionConfirmButton) {
      els.postConditionConfirmButton.focus();
    }
  }

  function showPreviousPostConditionStep() {
    state.postConditionStep = Math.max(0, state.postConditionStep - 1);
    renderPostConditionStep();
    if (els.postConditionNextButton) {
      els.postConditionNextButton.focus();
    }
  }

  function submitPostConditionCheck() {
    state.postConditionChecked = true;
    closePostConditionCheck();
    showResult();
  }

  function openSettings() {
    els.settingsModal.classList.remove("is-hidden");
    els.settingsCloseButton.focus();
  }

  function closeSettings() {
    els.settingsModal.classList.add("is-hidden");
  }

  function exitGameFromSettings() {
    closeSettings();
    if (isStandardLikeMode()) {
      sendGameExit(createExitPayload("settings"));
      returnToHub();
      return;
    }

    const didSendExit = sendGameExit(createExitPayload("settings"));
    if (!didSendExit) {
      goHome();
    }
  }

  function returnToHub() {
    window.location.href = new URL("../../index.html", window.location.href).href;
  }

  function exitGameFromStart() {
    sendGameExit(createExitPayload("start"));
    returnToHub();
  }

  function exitGameFromResult() {
    sendGameExit(createExitPayload("result"));
    returnToHub();
  }

  function updateSettingClasses() {
    els.app.classList.toggle("is-background-sound-off", els.backgroundSoundToggle && !els.backgroundSoundToggle.checked);
    els.app.classList.toggle("is-sound-off", els.soundToggle && !els.soundToggle.checked);
    els.app.classList.toggle("is-voice-guide-off", els.voiceGuideToggle && !els.voiceGuideToggle.checked);

    if (els.backgroundSoundLabel && els.backgroundSoundToggle) {
      els.backgroundSoundLabel.textContent = els.backgroundSoundToggle.checked ? "배경음 켬" : "배경음 끔";
    }

    if (els.soundLabel && els.soundToggle) {
      els.soundLabel.textContent = els.soundToggle.checked ? "효과음 켬" : "효과음 끔";
    }

    if (els.voiceGuideLabel && els.voiceGuideToggle) {
      els.voiceGuideLabel.textContent = els.voiceGuideToggle.checked ? "안내음성 켬" : "안내음성 끔";
    }

    updatePauseSoundButton(els.pauseBackgroundSoundButton, els.backgroundSoundToggle && els.backgroundSoundToggle.checked);
    updatePauseSoundButton(els.pauseSoundButton, els.soundToggle && els.soundToggle.checked);
    updatePauseSoundButton(els.pauseVoiceGuideButton, els.voiceGuideToggle && els.voiceGuideToggle.checked);
  }

  function updatePauseSoundButton(button, isOn) {
    if (!button) {
      return;
    }

    button.classList.toggle("is-off", !isOn);
    button.setAttribute("aria-pressed", isOn ? "true" : "false");

    const toggleText = button.querySelector(".pause-toggle-visual span");
    if (toggleText) {
      toggleText.textContent = isOn ? "ON" : "OFF";
    }
  }

  function toggleSoundSetting(toggle) {
    if (!toggle) {
      return;
    }

    const wasEffectSoundOn = els.soundToggle && els.soundToggle.checked;
    toggle.checked = !toggle.checked;
    updateSettingClasses();
    const shouldPlayToggleSound = toggle === els.soundToggle ? wasEffectSoundOn || toggle.checked : true;
    if (shouldPlayToggleSound) {
      playSound("toggle", { force: toggle === els.soundToggle && wasEffectSoundOn });
    }
  }

  function handleSettingToggleChange(toggle) {
    const shouldForce = toggle === els.soundToggle && !toggle.checked;
    updateSettingClasses();
    playSound("toggle", { force: shouldForce });
  }

  function getAudioPool(type) {
    const source = AUDIO_SOURCES[type];
    if (!source || typeof Audio !== "function") {
      return [];
    }

    if (!audioPools.has(type)) {
      const pool = Array.from({ length: AUDIO_POOL_SIZE }, () => {
        const audio = new Audio(source);
        audio.preload = "auto";
        audio.volume = AUDIO_VOLUMES[type] || 0.7;
        return audio;
      });
      audioPools.set(type, pool);
      audioPoolIndexes.set(type, 0);
    }

    return audioPools.get(type);
  }

  function preloadAudioAssets() {
    Object.keys(AUDIO_SOURCES).forEach((type) => {
      getAudioPool(type).forEach((audio) => {
        try {
          audio.load();
        } catch (error) {
          // Audio effects are optional; a failed preload should not block the game.
        }
      });
    });
  }

  function playSound(type, options = {}) {
    if (!options.force && (!els.soundToggle || !els.soundToggle.checked)) {
      return;
    }

    const pool = getAudioPool(type);
    if (pool.length === 0) {
      return;
    }

    const nextIndex = audioPoolIndexes.get(type) || 0;
    const audio = pool[nextIndex % pool.length];
    audioPoolIndexes.set(type, (nextIndex + 1) % pool.length);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = AUDIO_VOLUMES[type] || 0.7;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  function openTutorial() {
    state.tutorialIndex = 0;
    renderTutorialStep();
    els.tutorialModal.classList.remove("is-hidden");
    els.tutorialNextButton.focus();
  }

  function closeTutorial() {
    els.tutorialModal.classList.add("is-hidden");
  }

  function handleTutorialCloseButton() {
    if (state.tutorialIndex > 0) {
      state.tutorialIndex -= 1;
      renderTutorialStep();
      els.tutorialNextButton.focus();
      return;
    }

    closeTutorial();
  }

  function showNextTutorialStep() {
    if (state.tutorialIndex >= TUTORIAL_STEPS.length - 1) {
      closeTutorial();
      return;
    }

    state.tutorialIndex += 1;
    renderTutorialStep();
  }

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[state.tutorialIndex];
    els.tutorialTitle.textContent = "진행방법";
    els.tutorialMessage.textContent = step.message;
    els.tutorialDetail.textContent = step.detail;
    els.tutorialDetail.hidden = !step.detail;
    els.tutorialCloseButton.hidden = state.tutorialIndex === 0;
    els.tutorialCloseButton.textContent = state.tutorialIndex > 0 ? "이전" : "";
    els.tutorialNextButton.textContent = state.tutorialIndex === TUTORIAL_STEPS.length - 1 ? "닫기" : "다음";
    els.tutorialPreview.innerHTML = "";
    els.tutorialModal.classList.toggle("is-question-step", step.type === "question");
    els.tutorialPreview.classList.toggle("has-tap-pointer", step.type === "question");
    els.tutorialPreview.appendChild(createTutorialPreview(step.type));
  }

  function createTutorialPreview(type) {
    const preview = document.createElement("div");
    preview.className = `tutorial-mini tutorial-mini-${type}`;

    if (type === "memory") {
      const view = document.createElement("section");
      view.className = "memory-view tutorial-play-view";

      const notice = document.createElement("div");
      notice.className = "memory-card";

      const title = document.createElement("p");
      title.className = "guide-text";
      title.textContent = "잘 보고 기억해주세요";

      const countdown = document.createElement("p");
      countdown.className = "memory-countdown";
      countdown.textContent = "3초";

      const grid = document.createElement("div");
      grid.className = "fruit-grid is-sparse";
      [FRUITS[0], FRUITS[1], FRUITS[3]].forEach((fruit) => {
        grid.appendChild(createFruitCard(fruit));
      });

      notice.append(title, countdown);
      view.append(notice, grid);
      preview.appendChild(view);
      return preview;
    }

    const view = document.createElement("section");
    view.className = "question-view tutorial-play-view";

    const card = document.createElement("div");
    card.className = "question-card";

    const questionText = document.createElement("p");
    questionText.className = "guide-text";
    questionText.textContent = `${FRUITS[1].name}는 몇 개였을까요?`;

    const target = document.createElement("div");
    target.className = "target-fruit";
    target.append(createFruitImage(FRUITS[1], "target-fruit-image"), createTargetFruitName(FRUITS[1].name));

    const answerGrid = document.createElement("div");
    answerGrid.className = "answer-grid";
    [1, 2, 3, 4].forEach((number) => {
      const button = document.createElement("button");
      button.className = "game-button number-button";
      button.type = "button";
      button.textContent = String(number);
      if (number === 1) {
        button.classList.add("tutorial-tap-target");
        const pointer = document.createElement("span");
        pointer.className = "tutorial-tap-pointer";
        pointer.setAttribute("aria-hidden", "true");
        pointer.textContent = "👆";
        button.appendChild(pointer);
      }
      answerGrid.appendChild(button);
    });

    card.append(questionText, target, answerGrid);
    view.appendChild(card);
    preview.appendChild(view);
    return preview;
  }

  function createTutorialEffect(emoji, title) {
    const item = document.createElement("div");
    item.className = "tutorial-effect";
    item.innerHTML = `<span>${emoji}</span><strong>${title}</strong>`;
    return item;
  }

  function finishGame(reason = "all_questions") {
    clearAllTimers();
    const finalReason = reason || "all_questions";
    if (finalReason === "quit") {
      finalizeCurrentQuestion("quit", false);
    }
    if (finalReason !== "all_questions" && telemetryState.earlyExitQuestionIndex === null) {
      telemetryState.earlyExitQuestionIndex = state.questionInDifficulty + 1;
    }
    endTelemetrySession(finalReason);
    if (!state.postConditionChecked) {
      openPostConditionCheck();
      return;
    }

    showResult();
  }

  function showResult() {
    clearAllTimers();
    state.phase = "result";
    closePostConditionCheck();
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    const totalAnswered = getAnsweredCount();
    const resultTotal = getResultTotalCount(totalAnswered);
    const rate = resultTotal > 0 ? Math.round((state.correctCount / resultTotal) * 100) : 0;
    const resultMessage = createResultMessage(totalAnswered, rate);
    const previousRecord = readPreviousRecord();

    updateResultEyebrow();
    els.resultEmoji.textContent = resultMessage.emoji;
    els.resultTitle.textContent = resultMessage.title;
    renderResultMessage(resultMessage.message);
    updateStandardResultRecord(resultTotal, rate, previousRecord);
    playSound("complete");

    try {
      saveRecord(rate, resultTotal);
    } catch (error) {
      reportAppError("STORAGE_FAILED", error);
    }

    try {
      sendGameComplete(createCompleteResult(resultTotal, rate));
    } catch (error) {
      handleFatalError("RESULT_CREATE_FAILED", error);
      return;
    }
    showOnly("result");
    scheduleResultAutoReturn();
  }

  function scheduleResultAutoReturn() {
    clearResultAutoReturnTimer();
    if (runtimeConfig.mode !== "reminder") {
      return;
    }

    state.resultAutoReturnTimerId = window.setTimeout(() => {
      state.resultAutoReturnTimerId = null;
      returnToHub();
    }, 3000);
  }

  function getResultTotalCount(totalAnswered) {
    return isStandardResultMode() ? getTotalQuestions() : totalAnswered;
  }

  function restartCurrentDifficulty() {
    startGame(state.difficultyIndex);
  }

  function updateResultEyebrow() {
    if (!els.resultEyebrow || !isStandardResultMode()) {
      return;
    }

    els.resultEyebrow.textContent = "오늘 기억 활동 정말 잘하셨어요!";
  }

  function updateStandardResultRecord(resultTotal, rate, previousRecord) {
    if (!isStandardResultMode()) {
      return;
    }

    const hintUsedQuestionCount = telemetryState.questionResults.filter((question) => question.hintUsed).length;
    els.resultTitle.textContent = "오늘의 기억 활동";
    if (els.resultCorrect) {
      els.resultCorrect.textContent = String(state.correctCount);
    }
    if (els.resultTotal) {
      els.resultTotal.textContent = String(resultTotal);
    }
    if (els.resultRate) {
      els.resultRate.textContent = `${rate}%`;
    }
    if (els.resultHintCount) {
      els.resultHintCount.textContent = `${hintUsedQuestionCount}회`;
    }
    if (els.resultCompare) {
      els.resultCompare.textContent = createCompareText(previousRecord, rate);
    }
  }

  function createResultMessage(totalAnswered, rate) {
    if (isCareResultMode()) {
      return createCareResultMessage(totalAnswered);
    }

    if (totalAnswered === 0) {
      return {
        emoji: "🙂",
        title: "괜찮아요",
        message: "다시 시작해도 좋아요."
      };
    }

    if (rate >= 80) {
      return {
        emoji: "😊",
        title: "잘하셨어요",
        message: "좋은 훈련이었어요."
      };
    }

    if (rate >= 50) {
      return {
        emoji: "🙂",
        title: "수고하셨어요",
        message: "끝까지 잘했어요."
      };
    }

    return {
      emoji: "😄",
      title: "괜찮아요",
      message: "다시 해도 좋아요."
    };
  }

  function createCareResultMessage(totalAnswered) {
    if (totalAnswered === 0) {
      return {
        emoji: "🤗",
        title: "괜찮습니다.",
        message: "편안한 때에 다시 이어가면 됩니다."
      };
    }

    return {
      emoji: "🤗",
      title: "수고 많으셨습니다.",
      message: "오늘도 차분히 집중해 주셨어요."
    };
  }

  function renderResultMessage(message) {
    const sentenceBreak = ". ";
    const lines = message.includes(sentenceBreak)
      ? message.split(sentenceBreak)
      : [message];
    const firstLine = lines.length > 1 ? `${lines[0]}.` : lines[0];
    const secondLine = lines.length > 1 ? lines.slice(1).join(sentenceBreak) : "";
    const renderedLines = secondLine ? [firstLine, secondLine] : [firstLine];
    const nodes = renderedLines.flatMap((line, index) => {
      const textNode = document.createTextNode(line);
      return index === 0 ? [textNode] : [document.createElement("br"), textNode];
    });

    els.resultMessage.replaceChildren(...nodes);
  }

  function createCompareText(previous, currentRate) {
    if (!previous || typeof previous.rate !== "number") {
      return "오늘 첫 기록을 남겼어요";
    }

    const diff = currentRate - previous.rate;
    if (diff >= 2) {
      return `지난번보다 ${Math.round(diff)}% 좋아졌어요`;
    }

    if (diff <= -2) {
      return "다음번엔 더 좋아질 수 있어요";
    }

    return "지난번과 비슷해요";
  }

  function readPreviousRecord() {
    try {
      return readPreviousRecordForCurrentProfile();
    } catch (error) {
      return null;
    }
  }

  function readPreviousRecordForCurrentProfile() {
    return readPreviousRecordFromRuntimeConfig();
  }

  function readPreviousRecordFromRuntimeConfig() {
    const candidates = [
      runtimeConfig.previousResult,
      runtimeConfig.previousRecord,
      runtimeConfig.lastResult
    ];
    const ownerId = getResultRecordOwnerId();

    return candidates.find((record) => {
      if (!record || typeof record !== "object" || typeof record.rate !== "number") {
        return false;
      }
      if (!record.userId && !record.anonymousUserId && !record.ownerId) {
        return true;
      }
      return [record.userId, record.anonymousUserId, record.ownerId].includes(ownerId);
    }) || null;
  }

  function getResultRecordOwnerId() {
    return runtimeConfig.userId || runtimeConfig.anonymousUserId || runtimeConfig.deviceId || "local-user";
  }

  function getResultStorageKey() {
    const gameId = runtimeConfig.gameId || DEFAULT_RUN_CONFIG.gameId;
    const mode = runtimeConfig.mode || DEFAULT_RUN_CONFIG.mode;
    return [
      STORAGE_KEY_PREFIX,
      sanitizeResultIdPart(gameId),
      sanitizeResultIdPart(mode),
      sanitizeResultIdPart(getResultRecordOwnerId())
    ].join(":");
  }

  function saveRecord(rate, totalAnswered) {
    const record = {
      rate,
      correct: state.correctCount,
      total: totalAnswered,
      gameId: runtimeConfig.gameId || DEFAULT_RUN_CONFIG.gameId,
      mode: runtimeConfig.mode || DEFAULT_RUN_CONFIG.mode,
      userId: runtimeConfig.userId || "",
      anonymousUserId: runtimeConfig.anonymousUserId || "",
      ownerId: getResultRecordOwnerId(),
      playedAt: new Date().toISOString()
    };
    localStorage.setItem(getResultStorageKey(), JSON.stringify(record));
  }

  function showOnly(screen) {
    els.startScreen.classList.toggle("is-hidden", screen !== "start");
    els.difficultyScreen.classList.toggle("is-hidden", screen !== "difficulty");
    els.gameScreen.classList.toggle("is-hidden", screen !== "game");
    els.resultScreen.classList.toggle("is-hidden", screen !== "result");
    els.errorScreen.classList.toggle("is-hidden", screen !== "error");
    if (els.app) {
      els.app.dataset.screen = screen;
      els.app.scrollTop = 0;
      els.app.scrollLeft = 0;
    }
    window.scrollTo(0, 0);
  }

  function updateTopUi() {
    const difficulty = currentDifficulty();

    els.difficultyLabel.textContent = "🧠 기억 활동";
    if (els.levelIcon) {
      els.levelIcon.setAttribute("aria-label", "기억 활동");
    }
    if (els.stageLabel) {
      els.stageLabel.textContent = difficulty.label;
    }
    updateRaceUi();
    updateTimerUi();
  }

  function updateRaceUi() {
    const progress = difficultyProgress();
    const start = RACE_POINTS[0];
    const end = RACE_POINTS[2];
    const markerLeft = start + (end - start) * progress;
    const fillRatio = (markerLeft - start) / (end - start);

    els.raceWrap.style.setProperty("--marker-left", `${markerLeft}%`);
    els.raceWrap.style.setProperty("--race-fill", `${Math.max(0, Math.min(1, fillRatio)) * 100}%`);
    els.raceMarker.textContent = currentDifficulty().runner;

    els.raceSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === state.difficultyIndex);
      step.classList.toggle("is-done", index < state.difficultyIndex);
    });
  }

  function updateTimerUi() {
    if (!els.timeLeft || !els.timerBox) {
      return;
    }
    els.timeLeft.textContent = formatTime(state.timeLeft);
    els.timerBox.classList.toggle("is-low", shouldShowTimer() && state.timeLeft <= 10);
  }

  function updateReachedPoint() {
    const answeredCount = getAnsweredCount();
    if (state.difficultyIndex > state.reachedDifficultyIndex) {
      state.reachedDifficultyIndex = state.difficultyIndex;
      state.reachedQuestion = answeredCount;
      return;
    }

    if (state.difficultyIndex === state.reachedDifficultyIndex) {
      state.reachedQuestion = Math.max(state.reachedQuestion, answeredCount);
    }
  }

  function getAnsweredCount() {
    return Math.min(getTotalQuestions(), state.questionInDifficulty);
  }

  function getTotalQuestions() {
    return runtimeConfig.totalQuestions;
  }

  function getDifficulties() {
    return runtimeDifficulties;
  }

  function currentDifficulty() {
    return getDifficulties()[state.difficultyIndex];
  }

  function difficultyProgress() {
    const totalQuestions = getTotalQuestions();
    if (totalQuestions <= 1) {
      return 1;
    }

    return Math.min(1, state.questionInDifficulty / (totalQuestions - 1));
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickOne(items) {
    return items[randomInRange(0, items.length - 1)];
  }

  function shuffle(items) {
    const copied = [...items];
    for (let index = copied.length - 1; index > 0; index -= 1) {
      const swapIndex = randomInRange(0, index);
      [copied[index], copied[swapIndex]] = [copied[swapIndex], copied[index]];
    }
    return copied;
  }

  function withButtonSound(action) {
    return (event) => {
      playSound("button");
      action(event);
    };
  }

  function bindEvents() {
    els.startButton.addEventListener("click", runAfterStartPress(els.startButton, showDifficultySelect));
    els.settingsButton.addEventListener("click", runAfterStartPress(els.settingsButton, openSettings));
    els.tutorialButton.addEventListener("click", runAfterStartPress(els.tutorialButton, openTutorial));
    els.restartButton.addEventListener("click", withButtonSound(restartCurrentDifficulty));
    els.difficultyButtons.forEach((button) => {
      button.addEventListener("click", runAfterStartPress(button, () => {
        startGame(Number(button.dataset.difficultyIndex));
      }, DIFFICULTY_SELECT_TRANSITION_DELAY));
    });
    els.difficultyBackButton.addEventListener("click", withButtonSound(goHome));
    els.resultStartButton.addEventListener("click", withButtonSound(goHome));
    els.resultHomeButton.addEventListener("click", withButtonSound(exitGameFromResult));
    els.errorHomeButton.addEventListener("click", withButtonSound(goHome));
    els.pauseButton.addEventListener("click", withButtonSound(pauseGame));
    els.carePauseButton.addEventListener("click", withButtonSound(pauseGame));
    els.careHintButton.addEventListener("click", triggerCareHint);
    els.resumeButton.addEventListener("click", withButtonSound(resumeGame));
    els.pauseRestartButton.addEventListener("click", withButtonSound(restartPausedGame));
    els.pauseHelpButton.addEventListener("click", withButtonSound(openPauseHelp));
    els.homeButton.addEventListener("click", withButtonSound(quitGame));
    els.settingsCloseButton.addEventListener("click", withButtonSound(closeSettings));
    els.settingsExitButton.addEventListener("click", withButtonSound(exitGameFromSettings));
    els.startExitButton.addEventListener("click", withButtonSound(exitGameFromStart));
    els.backgroundSoundToggle.addEventListener("change", () => handleSettingToggleChange(els.backgroundSoundToggle));
    els.soundToggle.addEventListener("change", () => handleSettingToggleChange(els.soundToggle));
    els.voiceGuideToggle.addEventListener("change", () => handleSettingToggleChange(els.voiceGuideToggle));
    els.pauseBackgroundSoundButton.addEventListener("click", () => toggleSoundSetting(els.backgroundSoundToggle));
    els.pauseSoundButton.addEventListener("click", () => toggleSoundSetting(els.soundToggle));
    els.pauseVoiceGuideButton.addEventListener("click", () => toggleSoundSetting(els.voiceGuideToggle));
    els.tutorialCloseButton.addEventListener("click", withButtonSound(handleTutorialCloseButton));
    els.tutorialNextButton.addEventListener("click", withButtonSound(showNextTutorialStep));
    els.conditionMoodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        playSound("button");
        selectConditionMood(button);
      });
    });
    els.conditionSleepUpButton.addEventListener("click", () => {
      playSound("button");
      changeConditionSleep(-1);
    });
    els.conditionSleepDownButton.addEventListener("click", () => {
      playSound("button");
      changeConditionSleep(1);
    });
    if (els.conditionSleepDial) {
      els.conditionSleepDial.addEventListener("pointerdown", startConditionSleepDrag);
      els.conditionSleepDial.addEventListener("pointermove", dragConditionSleep);
      els.conditionSleepDial.addEventListener("pointerup", endConditionSleepDrag);
      els.conditionSleepDial.addEventListener("pointercancel", endConditionSleepDrag);
      els.conditionSleepDial.addEventListener("lostpointercapture", endConditionSleepDrag);
    }
    els.conditionConfirmButton.addEventListener("click", withButtonSound(closeConditionCheck));
    els.postConditionOptions.forEach((button) => {
      button.addEventListener("click", () => {
        playSound("button");
        selectPostConditionOption(button);
      });
    });
    els.postConditionNextButton.addEventListener("click", withButtonSound(showNextPostConditionStep));
    els.postConditionBackButton.addEventListener("click", withButtonSound(showPreviousPostConditionStep));
    els.postConditionConfirmButton.addEventListener("click", withButtonSound(submitPostConditionCheck));

    document.addEventListener("keydown", (event) => {
      if (els.postConditionModal && !els.postConditionModal.classList.contains("is-hidden")) {
        return;
      }

      if (event.key === "Escape" && !els.settingsModal.classList.contains("is-hidden")) {
        closeSettings();
        return;
      }

      if (event.key === "Escape" && !els.tutorialModal.classList.contains("is-hidden")) {
        closeTutorial();
        return;
      }

      if (event.key === "Escape" && !els.gameScreen.classList.contains("is-hidden")) {
        if (state.isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
      }
    });

    window.addEventListener("resize", () => {
      updateGameScale();
      scheduleMemoryLayout();
    });
    window.addEventListener("orientationchange", () => {
      updateGameScale();
      window.setTimeout(() => {
        updateGameScale();
        scheduleMemoryLayout();
      }, 160);
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateGameScale);
    }

    if ("ResizeObserver" in window) {
      memoryLayoutResizeObserver = new ResizeObserver(scheduleMemoryLayout);
      memoryLayoutResizeObserver.observe(els.playArea);
      memoryLayoutResizeObserver.observe(els.gameScreen);
    }
  }

  function bindAppErrorEvents() {
    window.addEventListener("error", (event) => {
      handleFatalError("GAME_RUNTIME_ERROR", event.error || event.message);
    });

    window.addEventListener("unhandledrejection", (event) => {
      handleFatalError("GAME_RUNTIME_ERROR", event.reason);
    });
  }

  function runAfterStartPress(button, action, delay = 180) {
    return (event) => {
      event.preventDefault();
      playSound("button");
      button.classList.remove("is-pressed");
      void button.offsetWidth;
      button.classList.add("is-pressed");

      window.setTimeout(() => {
        button.classList.remove("is-pressed");
        action();
      }, delay);
    };
  }

  async function initializeGame() {
    updateGameScale();
    mountCareControlsOverlay();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateGameScale, { once: true });
    }

    bindEvents();
    bindAppErrorEvents();

    if (els.app) {
      els.app.dataset.screen = state.phase;
    }
    preloadAudioAssets();
    updateSettingClasses();
    const didLoadConfig = await loadRunConfig();
    if (!didLoadConfig) {
      return;
    }
    if (showDebugErrorIfRequested()) {
      return;
    }
    try {
      await validateEssentialAssets();
    } catch (error) {
      handleFatalError(error.code || "ASSET_LOAD_FAILED", error, error.detail);
      return;
    }
    sendGameReady();
    updateTimerUi();
    startIntroLoading();
  }

  initializeGame().catch((error) => {
    handleFatalError("INITIALIZE_FAILED", error);
  });
})();
