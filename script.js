(function () {
  "use strict";

  const TOTAL_PER_DIFFICULTY = 10;
  const TOTAL_QUESTIONS = TOTAL_PER_DIFFICULTY;
  const DIFFICULTY_TIME = 120;
  const FEEDBACK_TIME = 2400;
  const RETRY_FEEDBACK_TIME = 2200;
  const MAX_WRONG_RETRIES = 2;
  const STORAGE_KEY = "ssok_count_finder_last_result";
  const RACE_POINTS = [16, 50, 84, 94];
  const MEMORY_LAYOUT_MIN_CARD = 38;
  const MEMORY_LAYOUT_CARD_SIZE = 162;
  const MEMORY_LAYOUT_MIN_GAP = 4;
  const MEMORY_LAYOUT_MAX_GAP = 8;
  const MAX_MEMORY_CARDS = 7;
  const MEMORY_LAYOUT_MAX_COLUMNS = 7;
  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;

  const FRUITS = [
    { id: "apple", name: "사과", image: "image/assets/apple.png" },
    { id: "strawberry", name: "딸기", image: "image/assets/strawberry.png" },
    { id: "watermelon", name: "수박", image: "image/assets/watermelon.png" },
    { id: "grape", name: "포도", image: "image/assets/grapes.png" },
    { id: "korean_melon", name: "참외", image: "image/assets/korean_melon.png" }
  ];

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
    difficultyScreen: document.getElementById("difficulty-screen"),
    gameScreen: document.getElementById("game-screen"),
    resultScreen: document.getElementById("result-screen"),
    startButton: document.getElementById("start-button"),
    settingsButton: document.getElementById("settings-button"),
    tutorialButton: document.getElementById("tutorial-button"),
    difficultyButtons: Array.from(document.querySelectorAll(".difficulty-option")),
    difficultyBackButton: document.getElementById("difficulty-back-button"),
    restartButton: document.getElementById("restart-button"),
    pauseButton: document.getElementById("pause-button"),
    resumeButton: document.getElementById("resume-button"),
    homeButton: document.getElementById("home-button"),
    pauseModal: document.getElementById("pause-modal"),
    settingsModal: document.getElementById("settings-modal"),
    settingsCloseButton: document.getElementById("settings-close-button"),
    settingsExitButton: document.getElementById("settings-exit-button"),
    backgroundSoundToggle: document.getElementById("background-sound-toggle"),
    backgroundSoundLabel: document.getElementById("background-sound-label"),
    soundToggle: document.getElementById("sound-toggle"),
    soundLabel: document.getElementById("sound-label"),
    tutorialModal: document.getElementById("tutorial-modal"),
    tutorialPreview: document.getElementById("tutorial-preview"),
    tutorialTitle: document.getElementById("tutorial-title"),
    tutorialMessage: document.getElementById("tutorial-message"),
    tutorialDetail: document.getElementById("tutorial-detail"),
    tutorialCloseButton: document.getElementById("tutorial-close-button"),
    tutorialNextButton: document.getElementById("tutorial-next-button"),
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
    resultTitle: document.getElementById("result-title"),
    resultMessage: document.getElementById("result-message"),
    resultCorrect: document.getElementById("result-correct"),
    resultTotal: document.getElementById("result-total"),
    resultRate: document.getElementById("result-rate"),
    resultDifficulty: document.getElementById("result-difficulty"),
    resultStage: document.getElementById("result-stage"),
    resultHomeButton: document.getElementById("result-home-button"),
    resultCompare: document.getElementById("result-compare")
  };

  const state = {
    difficultyIndex: 0,
    questionInDifficulty: 0,
    correctCount: 0,
    timeLeft: DIFFICULTY_TIME,
    currentQuestion: null,
    lastMemoryTotalCount: 0,
    wrongAttempts: 0,
    phase: "start",
    isPaused: false,
    timerId: null,
    phaseTimerId: null,
    phaseCountdownId: null,
    phaseStartedAt: 0,
    phaseDuration: 0,
    phaseRemaining: 0,
    phaseCallback: null,
    reachedDifficultyIndex: 0,
    reachedQuestion: 0,
    tutorialIndex: 0,
    soundContext: null
  };
  let memoryLayoutFrame = null;
  let memoryLayoutResizeObserver = null;

  function updateGameScale() {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    document.documentElement.style.setProperty("--game-scale", String(scale));
    return scale;
  }

  function renderLucideIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function") {
      return;
    }

    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
        focusable: "false"
      }
    });
  }

  function showDifficultySelect() {
    resetState();
    state.phase = "difficulty";
    showOnly("difficulty");
  }

  function startGame(index) {
    const difficultyIndex = Number.isInteger(index) && index >= 0 && index < DIFFICULTIES.length ? index : 0;
    resetState();
    showOnly("game");
    startDifficulty(difficultyIndex);
  }

  function resetState() {
    clearAllTimers();
    state.difficultyIndex = 0;
    state.questionInDifficulty = 0;
    state.correctCount = 0;
    state.timeLeft = DIFFICULTY_TIME;
    state.currentQuestion = null;
    state.lastMemoryTotalCount = 0;
    state.wrongAttempts = 0;
    state.phase = "start";
    state.isPaused = false;
    state.phaseRemaining = 0;
    state.phaseCallback = null;
    state.reachedDifficultyIndex = 0;
    state.reachedQuestion = 0;
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
  }

  function startDifficulty(index) {
    clearAllTimers();
    state.difficultyIndex = index;
    state.questionInDifficulty = 0;
    state.lastMemoryTotalCount = 0;
    state.timeLeft = DIFFICULTY_TIME;
    state.phase = "ready";
    state.isPaused = false;
    state.reachedDifficultyIndex = index;
    updateTopUi();
    startDifficultyTimer();
    showNextQuestion();
  }

  function showNextQuestion() {
    clearPhaseTimer();

    if (state.questionInDifficulty >= TOTAL_PER_DIFFICULTY) {
      showResult();
      return;
    }

    state.currentQuestion = createQuestion();
    state.wrongAttempts = 0;
    state.phase = "memory";
    updateReachedPoint();
    updateTopUi();
    renderMemoryView(state.currentQuestion);
    startPhaseTimer(currentDifficulty().revealMs, showQuestionView);
  }

  function showQuestionView() {
    if (!state.currentQuestion) {
      return;
    }

    clearPhaseTimer();
    state.phase = "question";
    renderQuestionView(state.currentQuestion);
  }

  function answerQuestion(choice) {
    if (state.phase !== "question" || state.isPaused || !state.currentQuestion) {
      return;
    }

    const isCorrect = Number(choice) === state.currentQuestion.answer;
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
      startPhaseTimer(RETRY_FEEDBACK_TIME, showQuestionView);
      return;
    }

    playSound("wrong");
    completeQuestion(false);
  }

  function completeQuestion(isCorrect) {
    state.phase = "feedback";
    state.questionInDifficulty += 1;
    renderFeedbackView(isCorrect, state.currentQuestion);
    startPhaseTimer(FEEDBACK_TIME, showNextQuestion);
  }

  function handleTimeExpired() {
    clearAllTimers();
    showResult();
  }

  function createQuestion() {
    const difficulty = currentDifficulty();
    const progress = difficultyProgress();

    if (difficulty.key === "easy") {
      return createEasyQuestion(progress);
    }

    return createMixedQuestion(progress);
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
    title.textContent = "잘 보고 기억해주세요";

    const countdown = document.createElement("p");
    countdown.className = "memory-countdown";
    countdown.setAttribute("aria-live", "polite");
    countdown.textContent = `${Math.ceil(currentDifficulty().revealMs / 1000)}초`;

    notice.append(title, countdown);

    const grid = document.createElement("div");
    grid.className = "fruit-grid";
    grid.classList.add(getFruitGridClass(question.cards.length), "is-auto-fit");
    grid.style.setProperty("--memory-count", question.cards.length);
    question.cards.forEach((fruit) => grid.appendChild(createFruitCard(fruit)));

    view.append(notice, grid);
    els.playArea.appendChild(view);
    scheduleMemoryLayout();
    window.setTimeout(scheduleMemoryLayout, 60);
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
    questionText.textContent = `${question.target.name}${getTopicParticle(question.target.name)} 몇 개였을까요?`;

    const target = document.createElement("div");
    target.className = "target-fruit";
    target.append(createFruitImage(question.target, "target-fruit-image"), createTargetFruitName(question.target.name));

    const answerGrid = document.createElement("div");
    answerGrid.className = "answer-grid";

    if (!question.options) {
      question.options = createAnswerOptions(question.answer, question.totalCount);
    }

    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.className = "game-button number-button";
      button.type = "button";
      button.textContent = String(option);
      button.addEventListener("click", () => answerQuestion(option));
      answerGrid.appendChild(button);
    });

    card.append(questionText, target, answerGrid);
    view.appendChild(card);
    els.playArea.appendChild(view);
  }

  function getTopicParticle(text) {
    const lastChar = text.trim().charAt(text.trim().length - 1);
    const code = lastChar.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) {
      return "는";
    }

    return (code - 0xac00) % 28 === 0 ? "는" : "은";
  }

  function renderRetryFeedbackView(remainingRetries) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "feedback-view retry-feedback";

    const symbol = document.createElement("div");
    symbol.className = "feedback-symbol is-thinking";
    symbol.textContent = "?";

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.textContent = "다시 한 번 생각해보세요!";

    const message = document.createElement("p");
    message.className = "feedback-message";
    message.textContent = remainingRetries > 0 ? "조금 더 기억해보고 다시 골라보세요." : "마지막으로 한 번 더 골라볼까요?";

    view.append(symbol, title, message);
    els.playArea.appendChild(view);
  }

  function renderFeedbackView(isCorrect, question) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "feedback-view";

    const symbol = document.createElement("div");
    symbol.className = `feedback-symbol${isCorrect ? "" : " is-soft"}`;
    symbol.textContent = isCorrect ? "✓" : "!";

    const title = document.createElement("p");
    title.className = "feedback-title";
    title.textContent = isCorrect ? "잘 기억하셨어요!" : "괜찮아요";

    const message = document.createElement("p");
    message.className = "feedback-message";
    message.textContent = isCorrect
      ? "좋습니다. 다음 문제로 넘어갈게요."
      : `정답은 ${question.answer}개였어요. 다음 문제로 가볼까요?`;

    view.append(symbol, title, message);
    els.playArea.appendChild(view);
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
    const optionCount = 4;
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
    updateTimerUi();

    state.timerId = window.setInterval(() => {
      if (state.isPaused) {
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
  }

  function pauseGame() {
    if (state.phase === "start" || state.phase === "difficulty" || state.phase === "result" || state.isPaused) {
      return;
    }

    state.isPaused = true;
    els.pauseButton.classList.add("is-paused");
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
    els.pauseModal.classList.add("is-hidden");
    startDifficultyTimer();

    if ((state.phase === "memory" || state.phase === "feedback") && state.phaseCallback) {
      startPhaseTimer(state.phaseRemaining, state.phaseCallback);
    }
  }

  function quitGame() {
    state.isPaused = false;
    els.pauseButton.classList.remove("is-paused");
    showResult();
  }

  function goHome() {
    resetState();
    showOnly("start");
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
    goHome();
  }

  function updateSettingClasses() {
    els.app.classList.toggle("is-background-sound-off", els.backgroundSoundToggle && !els.backgroundSoundToggle.checked);
    els.app.classList.toggle("is-sound-off", els.soundToggle && !els.soundToggle.checked);

    if (els.backgroundSoundLabel && els.backgroundSoundToggle) {
      els.backgroundSoundLabel.textContent = els.backgroundSoundToggle.checked ? "배경음 켬" : "배경음 끔";
    }

    if (els.soundLabel && els.soundToggle) {
      els.soundLabel.textContent = els.soundToggle.checked ? "효과음 켬" : "효과음 끔";
    }
  }

  function playSound(type) {
    if (!els.soundToggle || !els.soundToggle.checked) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      return;
    }

    if (!state.soundContext) {
      state.soundContext = new AudioContext();
    }

    const context = state.soundContext;
    if (context.state === "suspended") {
      context.resume();
    }

    const patterns = {
      correct: [523.25, 659.25],
      retry: [392],
      wrong: [261.63]
    };
    const notes = patterns[type] || patterns.retry;
    const start = context.currentTime;

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = start + index * 0.11;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.045, noteStart + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + 0.18);
    });
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
    renderLucideIcons();
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

  function showResult() {
    clearAllTimers();
    state.phase = "result";
    els.pauseModal.classList.add("is-hidden");
    els.pauseButton.classList.remove("is-paused");
    const totalAnswered = getAnsweredCount();
    const rate = totalAnswered > 0 ? Math.round((state.correctCount / totalAnswered) * 100) : 0;
    const resultMessage = createResultMessage(totalAnswered, rate);

    els.resultEmoji.textContent = resultMessage.emoji;
    els.resultTitle.textContent = resultMessage.title;
    renderResultMessage(resultMessage.message);

    saveRecord(rate, totalAnswered);
    showOnly("result");
  }

  function restartCurrentDifficulty() {
    startGame(state.difficultyIndex);
  }

  function createResultMessage(totalAnswered, rate) {
    if (totalAnswered === 0) {
      return {
        emoji: "🙂",
        title: "괜찮아요",
        message: "잠시 쉬어가셔도 좋습니다. 준비되시면 천천히 다시 시작해볼까요?"
      };
    }

    if (rate >= 80) {
      return {
        emoji: "😊",
        title: "참 잘하셨어요",
        message: "차분히 기억해내신 모습이 정말 좋았습니다. 오늘도 머리를 잘 깨워주셨어요."
      };
    }

    if (rate >= 50) {
      return {
        emoji: "🙂",
        title: "수고하셨어요",
        message: "끝까지 집중해주셔서 좋았습니다. 천천히 하셔도 충분히 잘하고 계세요."
      };
    }

    return {
      emoji: "😄",
      title: "오늘도 고생하셨어요",
      message: "맞고 틀리는 것보다 함께 기억해본 시간이 더 중요합니다. 편안하게 다시 해보셔도 좋아요."
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
      return "첫 기록입니다!";
    }

    const diff = currentRate - previous.rate;
    if (diff >= 2) {
      return `지난번보다 ${Math.round(diff)}% 좋아졌어요!`;
    }

    if (diff <= -2) {
      return "다음에는 더 좋아질 수 있어요!";
    }

    return "지난번과 비슷해요.";
  }

  function readPreviousRecord() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return null;
    }
  }

  function saveRecord(rate, totalAnswered) {
    const record = {
      rate,
      correct: state.correctCount,
      total: totalAnswered,
      playedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }

  function showOnly(screen) {
    els.startScreen.classList.toggle("is-hidden", screen !== "start");
    els.difficultyScreen.classList.toggle("is-hidden", screen !== "difficulty");
    els.gameScreen.classList.toggle("is-hidden", screen !== "game");
    els.resultScreen.classList.toggle("is-hidden", screen !== "result");
    if (els.app) {
      els.app.dataset.screen = screen;
      els.app.scrollTop = 0;
      els.app.scrollLeft = 0;
    }
    window.scrollTo(0, 0);
  }

  function updateTopUi() {
    const difficulty = currentDifficulty();

    els.difficultyLabel.textContent = difficulty.label;
    if (els.levelIcon) {
      els.levelIcon.textContent = difficulty.runner;
      els.levelIcon.setAttribute("aria-label", `${difficulty.label} 난이도`);
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
    els.timeLeft.textContent = formatTime(state.timeLeft);
    els.timerBox.classList.toggle("is-low", state.timeLeft <= 10);
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
    return Math.min(TOTAL_QUESTIONS, state.questionInDifficulty);
  }

  function currentDifficulty() {
    return DIFFICULTIES[state.difficultyIndex];
  }

  function difficultyProgress() {
    if (TOTAL_PER_DIFFICULTY <= 1) {
      return 1;
    }

    return Math.min(1, state.questionInDifficulty / (TOTAL_PER_DIFFICULTY - 1));
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

  function bindEvents() {
    els.startButton.addEventListener("click", runAfterStartPress(els.startButton, showDifficultySelect));
    els.settingsButton.addEventListener("click", runAfterStartPress(els.settingsButton, openSettings));
    els.tutorialButton.addEventListener("click", runAfterStartPress(els.tutorialButton, openTutorial));
    els.restartButton.addEventListener("click", restartCurrentDifficulty);
    els.difficultyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        startGame(Number(button.dataset.difficultyIndex));
      });
    });
    els.difficultyBackButton.addEventListener("click", goHome);
    els.resultHomeButton.addEventListener("click", goHome);
    els.pauseButton.addEventListener("click", pauseGame);
    els.resumeButton.addEventListener("click", resumeGame);
    els.homeButton.addEventListener("click", quitGame);
    els.settingsCloseButton.addEventListener("click", closeSettings);
    els.settingsExitButton.addEventListener("click", exitGameFromSettings);
    els.backgroundSoundToggle.addEventListener("change", updateSettingClasses);
    els.soundToggle.addEventListener("change", updateSettingClasses);
    els.tutorialCloseButton.addEventListener("click", handleTutorialCloseButton);
    els.tutorialNextButton.addEventListener("click", showNextTutorialStep);

    document.addEventListener("keydown", (event) => {
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

  function runAfterStartPress(button, action) {
    return (event) => {
      event.preventDefault();
      button.classList.remove("is-pressed");
      void button.offsetWidth;
      button.classList.add("is-pressed");

      window.setTimeout(() => {
        button.classList.remove("is-pressed");
        action();
      }, 180);
    };
  }

  updateGameScale();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateGameScale, { once: true });
  }
  bindEvents();
  renderLucideIcons();
  if (els.app) {
    els.app.dataset.screen = state.phase;
  }
  updateSettingClasses();
  updateTimerUi();
})();
