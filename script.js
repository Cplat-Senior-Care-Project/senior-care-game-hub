(function () {
  "use strict";

  const TOTAL_PER_DIFFICULTY = 20;
  const QUESTIONS_PER_STAGE = 4;
  const TOTAL_QUESTIONS = 60;
  const DIFFICULTY_TIME = 180;
  const FEEDBACK_TIME = 2400;
  const RETRY_FEEDBACK_TIME = 2200;
  const MAX_WRONG_RETRIES = 2;
  const STORAGE_KEY = "ssok_count_finder_last_result";
  const RACE_POINTS = [13, 50, 87, 97];

  const FRUITS = [
    { id: "apple", name: "사과", emoji: "🍎" },
    { id: "banana", name: "바나나", emoji: "🍌" },
    { id: "watermelon", name: "수박", emoji: "🍉" },
    { id: "grape", name: "포도", emoji: "🍇" },
    { id: "orange", name: "오렌지", emoji: "🍊" }
  ];

  const DIFFICULTIES = [
    {
      key: "easy",
      label: "쉬움",
      runner: "👶",
      revealMs: 3000,
      totalRangeByStage: [[2, 3], [3, 4], [4, 5], [5, 6], [6, 8]]
    },
    {
      key: "normal",
      label: "보통",
      runner: "🧑‍🎓",
      revealMs: 3000,
      totalRangeByStage: [[4, 5], [5, 7], [7, 9], [9, 11], [11, 13]]
    },
    {
      key: "hard",
      label: "어려움",
      runner: "🧑",
      revealMs: 3000,
      totalRangeByStage: [[5, 6], [7, 9], [9, 11], [11, 14], [14, 18]]
    }
  ];

  const els = {
    startScreen: document.getElementById("start-screen"),
    gameScreen: document.getElementById("game-screen"),
    resultScreen: document.getElementById("result-screen"),
    startButton: document.getElementById("start-button"),
    restartButton: document.getElementById("restart-button"),
    pauseButton: document.getElementById("pause-button"),
    resumeButton: document.getElementById("resume-button"),
    homeButton: document.getElementById("home-button"),
    pauseModal: document.getElementById("pause-modal"),
    playArea: document.getElementById("play-area"),
    timeLeft: document.getElementById("time-left"),
    timerBox: document.getElementById("timer-box"),
    difficultyLabel: document.getElementById("difficulty-label"),
    stageLabel: document.getElementById("stage-label"),
    raceWrap: document.querySelector(".race-wrap"),
    raceMarker: document.getElementById("race-marker"),
    raceSteps: Array.from(document.querySelectorAll(".race-step")),
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
    wrongAttempts: 0,
    phase: "start",
    isPaused: false,
    timerId: null,
    phaseTimerId: null,
    phaseStartedAt: 0,
    phaseDuration: 0,
    phaseRemaining: 0,
    phaseCallback: null,
    reachedDifficultyIndex: 0,
    reachedStage: 1
  };

  function startGame() {
    resetState();
    showOnly("game");
    startDifficulty(0);
  }

  function resetState() {
    clearAllTimers();
    state.difficultyIndex = 0;
    state.questionInDifficulty = 0;
    state.correctCount = 0;
    state.timeLeft = DIFFICULTY_TIME;
    state.currentQuestion = null;
    state.wrongAttempts = 0;
    state.phase = "start";
    state.isPaused = false;
    state.phaseRemaining = 0;
    state.phaseCallback = null;
    state.reachedDifficultyIndex = 0;
    state.reachedStage = 1;
    els.pauseModal.classList.add("is-hidden");
  }

  function startDifficulty(index) {
    if (index >= DIFFICULTIES.length) {
      showResult();
      return;
    }

    clearAllTimers();
    state.difficultyIndex = index;
    state.questionInDifficulty = 0;
    state.timeLeft = DIFFICULTY_TIME;
    state.phase = "ready";
    state.isPaused = false;
    updateTopUi();
    startDifficultyTimer();
    showNextQuestion();
  }

  function showNextQuestion() {
    clearPhaseTimer();

    if (state.questionInDifficulty >= TOTAL_PER_DIFFICULTY) {
      startDifficulty(state.difficultyIndex + 1);
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
      completeQuestion(true);
      return;
    }

    state.wrongAttempts += 1;
    if (state.wrongAttempts <= MAX_WRONG_RETRIES) {
      state.phase = "feedback";
      renderRetryFeedbackView(MAX_WRONG_RETRIES - state.wrongAttempts);
      startPhaseTimer(RETRY_FEEDBACK_TIME, showQuestionView);
      return;
    }

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
    const stage = currentStage();

    if (difficulty.key === "easy") {
      return createEasyQuestion(stage);
    }

    if (difficulty.key === "normal") {
      return createMixedQuestion(stage, false);
    }

    return createMixedQuestion(stage, true);
  }

  function createEasyQuestion(stage) {
    const fruit = pickOne(FRUITS);
    const count = randomInRange(...currentDifficulty().totalRangeByStage[stage - 1]);
    const cards = Array.from({ length: count }, () => fruit);

    return {
      cards,
      target: fruit,
      answer: count,
      totalCount: count
    };
  }

  function createMixedQuestion(stage, shouldShuffle) {
    const difficulty = currentDifficulty();
    const totalCount = randomInRange(...difficulty.totalRangeByStage[stage - 1]);
    const typeCount = getTypeCount(stage, shouldShuffle);
    const selectedFruits = shuffle([...FRUITS]).slice(0, typeCount);
    const counts = splitCount(totalCount, typeCount);

    let cards = [];
    selectedFruits.forEach((fruit, index) => {
      cards = cards.concat(Array.from({ length: counts[index] }, () => fruit));
    });

    if (shouldShuffle) {
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

  function getTypeCount(stage, shouldShuffle) {
    if (shouldShuffle) {
      return Math.min(5, Math.max(2, Math.ceil(stage * 0.75) + 1));
    }
    return Math.min(4, Math.max(2, Math.floor((stage + 1) / 2) + 1));
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

    const title = document.createElement("p");
    title.className = "guide-text";
    title.textContent = "잘 보고 기억해주세요";

    const helper = document.createElement("p");
    helper.className = "helper-text";
    helper.textContent = `${currentDifficulty().label} ${currentStage()}단계 · 과일이 잠시 후 사라집니다`;

    const grid = document.createElement("div");
    grid.className = "fruit-grid";
    question.cards.forEach((fruit) => grid.appendChild(createFruitCard(fruit)));

    view.append(title, helper, grid);
    els.playArea.appendChild(view);
  }

  function renderQuestionView(question) {
    els.playArea.innerHTML = "";

    const view = document.createElement("section");
    view.className = "question-view";

    const card = document.createElement("div");
    card.className = "question-card";

    const questionText = document.createElement("p");
    questionText.className = "guide-text";
    questionText.textContent = `${question.target.name}는 몇 개였을까요?`;

    const target = document.createElement("div");
    target.className = "target-fruit";
    target.textContent = `${question.target.emoji} ${question.target.name}`;

    const helper = document.createElement("p");
    helper.className = "helper-text";
    helper.textContent = state.wrongAttempts > 0 ? "다시 한 번 차분히 골라보세요" : "기억나는 개수를 눌러주세요";

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

    card.append(questionText, target, helper, answerGrid);
    view.appendChild(card);
    els.playArea.appendChild(view);
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

    const emoji = document.createElement("span");
    emoji.className = "fruit-emoji";
    emoji.textContent = fruit.emoji;

    const name = document.createElement("span");
    name.className = "fruit-name";
    name.textContent = fruit.name;

    card.append(emoji, name);
    return card;
  }

  function createAnswerOptions(answer, totalCount) {
    const maxOption = Math.max(4, totalCount);
    const optionCount = Math.min(6, maxOption);
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
    state.phaseTimerId = window.setTimeout(callback, duration);
  }

  function clearPhaseTimer() {
    if (state.phaseTimerId) {
      window.clearTimeout(state.phaseTimerId);
      state.phaseTimerId = null;
    }
  }

  function clearAllTimers() {
    clearInterval(state.timerId);
    state.timerId = null;
    clearPhaseTimer();
  }

  function pauseGame() {
    if (state.phase === "start" || state.phase === "result" || state.isPaused) {
      return;
    }

    state.isPaused = true;
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
    els.pauseModal.classList.add("is-hidden");
    startDifficultyTimer();

    if ((state.phase === "memory" || state.phase === "feedback") && state.phaseCallback) {
      startPhaseTimer(state.phaseRemaining, state.phaseCallback);
    }
  }

  function quitGame() {
    state.isPaused = false;
    showResult();
  }

  function goHome() {
    resetState();
    showOnly("start");
  }

  function showResult() {
    clearAllTimers();
    state.phase = "result";
    els.pauseModal.classList.add("is-hidden");
    const totalAnswered = getAnsweredCount();
    const rate = totalAnswered > 0 ? Math.round((state.correctCount / totalAnswered) * 100) : 0;
    const previous = readPreviousRecord();

    els.resultCorrect.textContent = `${state.correctCount}개`;
    els.resultTotal.textContent = `${totalAnswered}문제`;
    els.resultRate.textContent = `${rate}%`;
    els.resultDifficulty.textContent = DIFFICULTIES[state.reachedDifficultyIndex].label;
    els.resultStage.textContent = `${state.reachedStage}단계`;
    els.resultCompare.textContent = createCompareText(previous, rate);

    saveRecord(rate, totalAnswered);
    showOnly("result");
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
    els.gameScreen.classList.toggle("is-hidden", screen !== "game");
    els.resultScreen.classList.toggle("is-hidden", screen !== "result");
  }

  function updateTopUi() {
    const difficulty = currentDifficulty();
    const stage = currentStage();

    els.difficultyLabel.textContent = difficulty.label;
    els.stageLabel.textContent = `${stage}단계`;
    updateRaceUi();
    updateTimerUi();
  }

  function updateRaceUi() {
    const stageProgress = (currentStage() - 1) / ((TOTAL_PER_DIFFICULTY / QUESTIONS_PER_STAGE) - 1);
    const start = RACE_POINTS[state.difficultyIndex];
    const end = RACE_POINTS[state.difficultyIndex + 1] || start;
    const markerLeft = start + (end - start) * stageProgress;
    const fillRatio = (markerLeft - RACE_POINTS[0]) / (RACE_POINTS[RACE_POINTS.length - 1] - RACE_POINTS[0]);

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
    if (state.difficultyIndex > state.reachedDifficultyIndex) {
      state.reachedDifficultyIndex = state.difficultyIndex;
      state.reachedStage = currentStage();
      return;
    }

    if (state.difficultyIndex === state.reachedDifficultyIndex) {
      state.reachedStage = Math.max(state.reachedStage, currentStage());
    }
  }

  function getAnsweredCount() {
    return Math.min(TOTAL_QUESTIONS, state.difficultyIndex * TOTAL_PER_DIFFICULTY + state.questionInDifficulty);
  }

  function currentDifficulty() {
    return DIFFICULTIES[state.difficultyIndex];
  }

  function currentStage() {
    return Math.min(5, Math.floor(state.questionInDifficulty / QUESTIONS_PER_STAGE) + 1);
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
    els.startButton.addEventListener("click", startGame);
    els.restartButton.addEventListener("click", startGame);
    els.resultHomeButton.addEventListener("click", goHome);
    els.pauseButton.addEventListener("click", pauseGame);
    els.resumeButton.addEventListener("click", resumeGame);
    els.homeButton.addEventListener("click", quitGame);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !els.gameScreen.classList.contains("is-hidden")) {
        if (state.isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
      }
    });
  }

  bindEvents();
  updateTimerUi();
})();
