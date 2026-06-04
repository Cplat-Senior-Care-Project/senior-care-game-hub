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

  const SHOPPING_ITEMS = Object.freeze([
    { id: "apple", name: "사과", image: "assets/images/item-cutout-apple.png", category: "fruit", shape: "round", color: "red" },
    { id: "banana", name: "바나나", image: "assets/images/item-cutout-banana.png", category: "fruit", shape: "long", color: "yellow" },
    { id: "orange", name: "오렌지", image: "assets/images/item-cutout-orange.png", category: "fruit", shape: "round", color: "orange" },
    { id: "watermelon", name: "수박", image: "assets/images/item-cutout-watermelon.png", category: "fruit", shape: "round", color: "green" },
    { id: "milk", name: "우유", image: "assets/images/item-cutout-milk.png", category: "drink", shape: "box", color: "white" },
    { id: "water", name: "물", image: "assets/images/item-cutout-water.png", category: "drink", shape: "bottle", color: "blue" },
    { id: "bread", name: "빵", image: "assets/images/item-cutout-bread.png", category: "food", shape: "box", color: "brown" },
    { id: "egg", name: "달걀", image: "assets/images/item-cutout-egg.png", category: "food", shape: "round", color: "white" },
    { id: "cheese", name: "치즈", image: "assets/images/item-cutout-cheese.png", category: "food", shape: "box", color: "yellow" },
    { id: "cookie", name: "과자", image: "assets/images/item-cutout-cookie.png", category: "snack", shape: "round", color: "brown" },
    { id: "can", name: "통조림", image: "assets/images/item-cutout-can.png", category: "food", shape: "round", color: "gray" },
    { id: "carrot", name: "당근", image: "assets/images/item-cutout-carrot.png", category: "vegetable", shape: "long", color: "orange" },
    { id: "vegetable", name: "채소", image: "assets/images/item-cutout-vegetable.png", category: "vegetable", shape: "leaf", color: "green" },
    { id: "fish", name: "생선", image: "assets/images/item-cutout-fish.png", category: "meat", shape: "long", color: "blue" },
    { id: "meat", name: "고기", image: "assets/images/item-cutout-meat.png", category: "meat", shape: "box", color: "red" },
    { id: "tissue", name: "휴지", image: "assets/images/item-cutout-tissue.png", category: "daily", shape: "box", color: "white" }
  ]);

  const DEFAULT_DIFFICULTIES = Object.freeze({
    easy: { key: "easy", label: "쉬움", memoryItemCount: 1, answerChoiceCount: 2, revealMs: 4200 },
    normal: { key: "normal", label: "보통", memoryItemCount: 2, answerChoiceCount: 4, revealMs: 3600 },
    hard: { key: "hard", label: "어려움", memoryItemCount: 3, answerChoiceCount: 6, revealMs: 3200 }
  });

  const TUTORIAL_STEPS = Object.freeze([
    { message: "잠깐 보여주는 물건을 기억해주세요.", previewIds: ["apple", "milk", "bread"] },
    { message: "물건이 사라지면 같은 물건을 찾아 장바구니에 담아주세요.", previewIds: ["banana", "carrot", "egg"] },
    { message: "힌트가 필요하면 힌트 버튼을 눌러 천천히 확인할 수 있어요.", previewIds: ["cheese", "water", "cookie"] }
  ]);

  const CONDITION_SLEEP_HOURS = Object.freeze([4, 5, 6, 7, 8, 9, 10, 11, 12]);

  const $ = (id) => document.getElementById(id);
  const els = {
    app: $("app"), startScreen: $("start-screen"), startLoading: $("start-loading"), startLoadingFill: $("start-loading-fill"), startLoadingText: $("start-loading-text"), difficultyScreen: $("difficulty-screen"), gameScreen: $("game-screen"), resultScreen: $("result-screen"), errorScreen: $("error-screen"),
    errorTitle: $("error-title"), errorMessage: $("error-message"), startButton: $("start-button"), startExitButton: $("start-exit-button"), settingsButton: $("settings-button"), tutorialButton: $("tutorial-button"),
    difficultyButtons: Array.from(document.querySelectorAll("[data-difficulty], [data-difficulty-index]")), difficultyBackButton: $("difficulty-back-button"), playArea: $("play-area"), hintButton: $("hint-button"), dragGhost: $("drag-ghost"),
    pauseButton: $("pause-button"), pauseModal: $("pause-modal"), resumeButton: $("resume-button"), pauseRestartButton: $("pause-restart-button"), pauseQuitButton: $("pause-quit-button"),
    roundLabel: $("round-label"), timeLeft: $("time-left"), scoreLabel: $("score-label"), resultTitle: $("result-title"), resultMessage: $("result-message"), resultCorrect: $("result-correct"), resultTotal: $("result-total"), resultHintCount: $("result-hint-count"), resultRate: $("result-rate"),
    restartButton: $("restart-button"), resultStartButton: $("result-start-button"), resultHomeButton: $("result-home-button"), errorHomeButton: $("error-home-button"),
    conditionModal: $("condition-modal"), conditionButtons: Array.from(document.querySelectorAll("[data-mood]")), conditionSleepRows: $("condition-sleep-rows"), conditionSleepUpButton: $("condition-sleep-up-button"), conditionSleepDownButton: $("condition-sleep-down-button"), conditionSkipButton: $("condition-skip-button"), conditionConfirmButton: $("condition-confirm-button"),
    postConditionModal: $("post-condition-modal"), postConditionPages: Array.from(document.querySelectorAll(".post-condition-page")), postConditionDots: Array.from(document.querySelectorAll(".post-condition-dot")), postConditionOptions: Array.from(document.querySelectorAll(".post-condition-option")), postConditionSkipButton: $("post-condition-skip-button"), postConditionNextButton: $("post-condition-next-button"), postConditionBackButton: $("post-condition-back-button"), postConditionConfirmButton: $("post-condition-confirm-button"),
    settingsModal: $("settings-modal"), settingsCloseButton: $("settings-close-button"), settingsExitButton: $("settings-exit-button"), backgroundSoundToggle: $("background-sound-toggle"), soundToggle: $("sound-toggle"), voiceGuideToggle: $("voice-guide-toggle"),
    tutorialModal: $("tutorial-modal"), tutorialMessage: $("tutorial-message"), tutorialPreview: $("tutorial-preview"), tutorialDetail: $("tutorial-detail"), tutorialCloseButton: $("tutorial-close-button"), tutorialNextButton: $("tutorial-next-button")
  };

  const timers = { phase: null, countdown: null, game: null, feedback: null, autoHint: null };
  let runtimeConfig = null;
  let pendingStart = false;
  let tutorialIndex = 0;
  let dragSession = null;

  const state = {
    phase: "start", difficultyKey: "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, questionLogs: [],
    startedAt: null, endedAt: null, remainingSeconds: 0, revealRemaining: 0, questionStartedAt: null, firstResponseAt: null, status: "completed", abandonReason: null, externalInputUsed: false,
    condition: { completed: false, skipped: false, mood: "good", sleepHours: 8 },
    postCondition: { completed: false, skipped: false, step: 0, moodAfter: "good", fatigue: "low", perceivedDifficulty: "justRight", neededHelp: "none", replayIntent: "yes" },
    settings: { soundEnabled: true, voiceGuideEnabled: true, useDrag: true }
  };

  function updateGameScale() {
    const visualViewport = window.visualViewport;
    const viewportWidth = visualViewport && visualViewport.width ? visualViewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = visualViewport && visualViewport.height ? visualViewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    document.documentElement.style.setProperty("--game-scale", String(Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT))));
  }

  function startIntroLoading() {
    if (!els.startScreen || !els.startLoadingFill || !els.startLoadingText) {
      if (els.startScreen) {
        els.startScreen.classList.remove("is-loading");
        els.startScreen.classList.add("is-loaded");
      }
      return;
    }

    els.startScreen.classList.add("is-loading");
    els.startScreen.classList.remove("is-loaded");
    els.startScreen.classList.remove("is-intro-revealing");
    els.startLoadingFill.style.width = "0%";
    els.startLoadingText.textContent = "0%";

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

  function clearTimer(name) { if (timers[name]) { window.clearTimeout(timers[name]); window.clearInterval(timers[name]); timers[name] = null; } }
  function clearAllTimers() { Object.keys(timers).forEach(clearTimer); }
  function setScreen(name) {
    [els.startScreen, els.difficultyScreen, els.gameScreen, els.resultScreen, els.errorScreen].forEach((screen) => screen && screen.classList.add("is-hidden"));
    if (name === "start") els.startScreen.classList.remove("is-hidden");
    if (name === "difficulty") els.difficultyScreen.classList.remove("is-hidden");
    if (name === "game") els.gameScreen.classList.remove("is-hidden");
    if (name === "result") els.resultScreen.classList.remove("is-hidden");
    if (name === "error") els.errorScreen.classList.remove("is-hidden");
    document.body.dataset.screen = name;
    if (els.app) els.app.dataset.screen = name;
  }

  function bridge() { return window.ShopQuestMemoryGameAppBridge || null; }
  function sendBridge(methods, payload) { const b = bridge(); if (!b) return false; return methods.some((m) => typeof b[m] === "function" && (b[m](payload), true)); }
  function isCareMode() { return runtimeConfig && (runtimeConfig.mode === "care" || runtimeConfig.mode === "ai_assisted"); }
  function getTotalQuestions() { return Math.max(1, runtimeConfig ? runtimeConfig.totalQuestions : 10); }
  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
  function findItem(id) { return SHOPPING_ITEMS.find((item) => item.id === id) || null; }
  function shuffle(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }
  function similarity(a, b) { return Number(a.category === b.category) + Number(a.shape === b.shape) + Number(a.color === b.color); }
  function cohesion(items) { if (items.length < 2) return 0; let score = 0, pairs = 0; for (let i = 0; i < items.length; i += 1) for (let j = i + 1; j < items.length; j += 1) { score += similarity(items[i], items[j]); pairs += 1; } return score / pairs; }
  function maxSimilarity(item, targets) { return Math.max(...targets.map((target) => similarity(item, target))); }
  function targetKey(items) { return items.map((item) => item.id).sort().join("|"); }
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
    if (isCareMode()) { merged.memoryItemCount = 1; merged.answerChoiceCount = 2; merged.revealMs = Math.max(merged.revealMs, 4500); }
    merged.memoryItemCount = Math.max(1, Math.min(merged.memoryItemCount, runtimeConfig.maxItemsToRemember || 3));
    merged.answerChoiceCount = Math.max(merged.memoryItemCount + 1, Math.min(merged.answerChoiceCount, SHOPPING_ITEMS.length));
    return merged;
  }

  function getDifficultyKeyFromButton(button) {
    if (button.dataset.difficulty) return button.dataset.difficulty;
    const difficultyKeys = ["easy", "normal", "hard"];
    return difficultyKeys[Number(button.dataset.difficultyIndex)] || "easy";
  }

  function pickTargets(difficulty) {
    let best = [], bestScore = difficulty.key === "hard" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    const used = new Set(state.questionLogs.map((log) => targetKey(log.target_items.map(findItem).filter(Boolean))));
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = shuffle(SHOPPING_ITEMS).slice(0, difficulty.memoryItemCount);
      if (used.has(targetKey(candidate))) continue;
      const c = cohesion(candidate);
      const score = difficulty.key === "easy" ? c : difficulty.key === "normal" ? Math.abs(c - 0.75) : c;
      if (difficulty.key === "normal" && c === 0 && difficulty.memoryItemCount > 1) continue;
      if ((difficulty.key === "hard" && score > bestScore) || (difficulty.key !== "hard" && score < bestScore)) { best = candidate; bestScore = score; }
    }
    return best.length ? best : shuffle(SHOPPING_ITEMS).slice(0, difficulty.memoryItemCount);
  }

  function pickDistractors(difficulty, targets) {
    const targetIds = new Set(targets.map((item) => item.id));
    const needed = difficulty.answerChoiceCount - targets.length;
    const ranked = shuffle(SHOPPING_ITEMS.filter((item) => !targetIds.has(item.id))).map((item) => ({ item, score: maxSimilarity(item, targets) })).sort((a, b) => a.score - b.score);
    if (difficulty.key === "easy") return ranked.slice(0, needed).map(({ item }) => item);
    if (difficulty.key === "hard") return ranked.reverse().slice(0, needed).map(({ item }) => item);
    const similar = ranked.filter(({ score }) => score > 0).reverse().map(({ item }) => item);
    const different = ranked.filter(({ score }) => score === 0).map(({ item }) => item);
    const mixed = [...similar.slice(0, Math.min(Math.max(1, Math.ceil(needed / 3)), similar.length)), ...shuffle(different)];
    const filler = ranked.map(({ item }) => item).filter((item) => !mixed.some((picked) => picked.id === item.id));
    return [...mixed, ...filler].slice(0, needed);
  }

  function generateQuestion() {
    const difficulty = getDifficultyConfig(state.difficultyKey);
    const targetItems = pickTargets(difficulty);
    return { id: `${difficulty.key}-${state.questionIndex + 1}-${Date.now()}`, difficultyKey: difficulty.key, difficultyLabel: difficulty.label, targetItems, choiceItems: shuffle([...targetItems, ...pickDistractors(difficulty, targetItems)]), revealMs: difficulty.revealMs, hintUsed: false, inputType: "touch" };
  }

  function formatTime(seconds) { const safe = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`; }
  function updateHud() { const total = getTotalQuestions(); if (els.roundLabel) els.roundLabel.textContent = `${Math.min(state.questionIndex + 1, total)} / ${total}`; if (els.timeLeft) els.timeLeft.textContent = formatTime(state.remainingSeconds); if (els.scoreLabel) els.scoreLabel.textContent = String(state.correctCount); }

  function startGameTimer() {
    clearTimer("game");
    state.remainingSeconds = runtimeConfig.durationSeconds;
    updateHud();
    timers.game = window.setInterval(() => {
      if (["pause", "result", "start", "difficulty"].includes(state.phase)) return;
      state.remainingSeconds -= 1;
      updateHud();
      if (state.remainingSeconds <= 0) finishGame("abandoned", "time_up");
    }, 1000);
  }

  function startFlow() {
    if (shouldShowConditionCheck() && !state.condition.completed) { pendingStart = true; els.conditionModal.classList.remove("is-hidden"); return; }
    if (shouldShowDifficultySelect()) { clearAllTimers(); state.phase = "difficulty"; setScreen("difficulty"); return; }
    startGame(runtimeConfig.difficultyKey || "easy");
  }

  function startGame(difficultyKey) {
    clearAllTimers();
    Object.assign(state, { phase: "memory", difficultyKey: difficultyKey || runtimeConfig.difficultyKey || "easy", questionIndex: 0, question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [], correctCount: 0, wrongCount: 0, hintCount: 0, retryCount: 0, pauseCount: 0, interactionCount: 0, questionLogs: [], startedAt: new Date(), endedAt: null, status: "completed", abandonReason: null, externalInputUsed: false });
    resetPostConditionCheck();
    setScreen("game");
    sendBridge(["sendGameStarted", "sendStarted"], { game_id: GAME_ID, session_id: runtimeConfig.sessionId, mode: runtimeConfig.mode, difficulty: state.difficultyKey, started_at: state.startedAt.toISOString() });
    startGameTimer();
    beginQuestion();
  }

  function beginQuestion() {
    clearTimer("phase"); clearTimer("countdown"); clearTimer("autoHint");
    state.question = generateQuestion();
    state.selectedIds = []; state.wrongSelectedIds = []; state.collectedItems = []; state.firstResponseAt = null; state.questionStartedAt = null;
    state.revealRemaining = Math.max(1, Math.ceil(state.question.revealMs / 1000));
    state.phase = "memory";
    updateHud();
    renderMemory();
    timers.countdown = window.setInterval(() => { state.revealRemaining -= 1; const countdown = els.playArea.querySelector(".memory-timer"); if (countdown) countdown.textContent = String(Math.max(0, state.revealRemaining)); }, 1000);
    timers.phase = window.setTimeout(showTransition, state.question.revealMs);
  }

  function showTransition() { clearTimer("phase"); clearTimer("countdown"); state.phase = "transition"; renderTransition(); timers.phase = window.setTimeout(showQuestion, TRANSITION_TIME); }
  function showQuestion() { clearTimer("phase"); state.phase = "question"; state.questionStartedAt = Date.now(); renderQuestion(); if (runtimeConfig.autoHintEnabled && runtimeConfig.hintEnabled) timers.autoHint = window.setTimeout(showHint, AUTO_HINT_DELAY_MS); }

  function renderMemory() {
    const targets = state.question.targetItems;
    const title = isCareMode() ? `${targets[0].name}를 사고 싶어요. 같이 봐볼까요?` : "담아야 할 물건을 기억해주세요";
    els.playArea.innerHTML = `<section class="shop-round"><div class="memory-board"><p class="round-kicker">${state.question.difficultyLabel} · ${state.questionIndex + 1}번째 장보기</p><h2 class="round-title">${escapeHtml(title)}</h2><div class="memory-timer">${state.revealRemaining}</div><div class="memory-items" style="--target-count:${targets.length}">${targets.map((item) => `<div class="memory-item-card"><img src="${item.image}" alt="${escapeHtml(item.name)}" draggable="false"></div>`).join("")}</div></div></section>`;
    els.hintButton.classList.add("is-hidden");
  }

  function renderTransition() {
    const itemName = state.question.targetItems.length === 1 ? state.question.targetItems[0].name : "물건들";
    const title = isCareMode() ? `좋아요. 이제 ${itemName}을 찾아볼까요?` : "이제 장바구니에 담아볼까요?";
    els.playArea.innerHTML = `<section class="shop-round"><div class="transition-card"><div class="transition-icon" aria-hidden="true">🧺</div><h2 class="round-title">${escapeHtml(title)}</h2><p class="round-kicker">진열대에서 같은 물건을 찾아주세요</p></div></section>`;
  }
  function renderQuestion() {
    const question = state.question;
    const remainingTargetIds = new Set(question.targetItems.map((item) => item.id));
    state.selectedIds.forEach((id) => remainingTargetIds.delete(id));
    const prompt = isCareMode() ? "같은 물건을 톡 눌러주세요" : state.settings.useDrag ? "물건을 누르거나 장바구니로 끌어 담아주세요" : "같은 물건을 눌러 장바구니에 담아주세요";
    els.playArea.innerHTML = `<section class="shop-round"><div class="question-board"><p class="round-kicker">${state.questionIndex + 1} / ${getTotalQuestions()}</p><h2 class="round-title">${escapeHtml(prompt)}</h2><div class="choice-layout"><div class="choice-grid">${question.choiceItems.map((item) => {
      const selected = state.selectedIds.includes(item.id);
      const wrong = state.wrongSelectedIds.includes(item.id);
      const hinted = question.hintUsed && remainingTargetIds.has(item.id);
      return `<button class="choice-card ${selected ? "is-selected" : ""} ${wrong ? "is-wrong" : ""} ${hinted ? "is-hinted" : ""}" type="button" data-item-id="${item.id}" ${selected ? "disabled" : ""}><img src="${item.image}" alt="${escapeHtml(item.name)}" draggable="false"><strong>${escapeHtml(item.name)}</strong></button>`;
    }).join("")}</div><div class="basket-zone" data-basket-drop-zone="true"><div class="basket-zone-title">장바구니</div><div class="basket-image-wrap ${state.collectedItems.length ? "is-bounce" : ""}"><img class="basket-image" src="assets/images/basket-green-basket.png" alt="장바구니" draggable="false"><div class="basket-collected">${state.collectedItems.map((item) => `<img src="${item.image}" alt="" draggable="false">`).join("")}</div></div></div></div></div></section>`;
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

  function getItemFromEvent(event) {
    const button = event.target.closest("[data-item-id]");
    if (!button) return null;
    return { item: findItem(button.dataset.itemId), element: button };
  }

  function selectItem(item, inputType) {
    if (!item || state.phase !== "question") return;
    const question = state.question;
    const isTarget = question.targetItems.some((target) => target.id === item.id);
    if (state.selectedIds.includes(item.id)) return;
    state.interactionCount += 1;
    if (!state.firstResponseAt) state.firstResponseAt = Date.now();
    question.inputType = inputType || "touch";
    if (question.inputType === "external") state.externalInputUsed = true;

    if (isTarget) {
      state.selectedIds.push(item.id);
      state.collectedItems.push(item);
      renderQuestion();
      showFeedback(isCareMode() ? "좋아요. 잘 고르셨어요." : "좋아요. 장바구니에 담았어요!", "good");
      if (state.selectedIds.length >= question.targetItems.length) {
        clearTimer("autoHint");
        timers.phase = window.setTimeout(() => completeQuestion(true), FEEDBACK_TIME);
      }
      return;
    }

    state.wrongSelectedIds.push(item.id);
    state.retryCount += 1;
    renderQuestion();
    showFeedback(isCareMode() ? "조금 헷갈릴 수 있어요. 다시 같이 볼까요?" : "괜찮아요. 다시 기억해볼게요.", "soft");
    clearTimer("autoHint");
    timers.phase = window.setTimeout(() => completeQuestion(false), FEEDBACK_TIME);
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
    if (state.questionIndex + 1 >= getTotalQuestions()) { timers.phase = window.setTimeout(() => finishGame("completed", null), 700); return; }
    state.questionIndex += 1;
    timers.phase = window.setTimeout(beginQuestion, 900);
  }

  function showHint() {
    if (!state.question || state.phase !== "question" || runtimeConfig.hintEnabled === false) return;
    state.question.hintUsed = true;
    state.hintCount += 1;
    renderQuestion();
    const names = state.question.targetItems.filter((item) => !state.selectedIds.includes(item.id)).map((item) => item.name).join(", ");
    showFeedback(`힌트: ${names}을 찾아주세요`, "soft");
  }

  function pauseGame() {
    if (!["memory", "transition", "question"].includes(state.phase)) return;
    state.phase = "pause";
    state.pauseCount += 1;
    clearTimer("game"); clearTimer("countdown"); clearTimer("phase"); clearTimer("autoHint");
    els.pauseModal.classList.remove("is-hidden");
  }

  function resumeGame() {
    els.pauseModal.classList.add("is-hidden");
    if (state.question && state.questionStartedAt) { state.phase = "question"; startGameTimer(); renderQuestion(); return; }
    startGameTimer(); beginQuestion();
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
    renderResult();
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

  function renderResult() {
    const total = getTotalQuestions();
    const completed = state.status === "completed";
    els.resultTitle.textContent = completed ? "장보기를 잘 마쳤어요" : "여기까지 함께했어요";
    els.resultMessage.textContent = completed ? "차분하게 기억하고 장바구니에 잘 담아주셨어요. 오늘도 좋은 기억 활동이었습니다." : "잠시 멈춰도 괜찮아요. 다음에 다시 천천히 이어가면 됩니다.";
    els.resultCorrect.textContent = String(state.correctCount);
    els.resultTotal.textContent = String(total);
    els.resultHintCount.textContent = `${state.hintCount}회`;
    els.resultRate.textContent = `${Math.round((state.questionLogs.length / total) * 100)}%`;
    els.hintButton.classList.add("is-hidden");
  }

  function goHome() {
    clearAllTimers();
    Object.assign(state, { phase: "start", question: null, selectedIds: [], wrongSelectedIds: [], collectedItems: [] });
    closePostConditionCheck();
    els.conditionModal.classList.add("is-hidden");
    els.pauseModal.classList.add("is-hidden");
    setScreen("start");
    els.hintButton.classList.add("is-hidden");
  }
  function renderConditionSleepRows() {
    if (!els.conditionSleepRows) return;
    const selectedIndex = Math.max(0, CONDITION_SLEEP_HOURS.indexOf(state.condition.sleepHours));
    const startIndex = Math.max(0, Math.min(selectedIndex - 1, CONDITION_SLEEP_HOURS.length - 3));
    els.conditionSleepRows.innerHTML = CONDITION_SLEEP_HOURS.slice(startIndex, startIndex + 3).map((hour) => {
      const className = hour === state.condition.sleepHours ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
      return `<div class="${className}"><span class="condition-sleep-number">${hour}</span><span class="condition-sleep-unit">\uC2DC\uAC04</span></div>`;
    }).join("");
  }

  function changeConditionSleep(delta) {
    const selectedIndex = Math.max(0, CONDITION_SLEEP_HOURS.indexOf(state.condition.sleepHours));
    const nextIndex = Math.max(0, Math.min(CONDITION_SLEEP_HOURS.length - 1, selectedIndex + delta));
    state.condition.sleepHours = CONDITION_SLEEP_HOURS[nextIndex];
    renderConditionSleepRows();
  }

  function completeConditionCheck(skipped) {
    state.condition.completed = true;
    state.condition.skipped = Boolean(skipped);
    els.conditionModal.classList.add("is-hidden");
    if (pendingStart) {
      pendingStart = false;
      startFlow();
    }
  }

  function resetPostConditionCheck() {
    Object.assign(state.postCondition, {
      completed: false,
      skipped: false,
      step: 0,
      moodAfter: "good",
      fatigue: "low",
      perceivedDifficulty: "justRight",
      neededHelp: "none",
      replayIntent: "yes"
    });
    updatePostConditionUi();
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

  function syncSoundToggles(sourceToggle) {
    if (sourceToggle === els.voiceGuideToggle) {
      state.settings.voiceGuideEnabled = els.voiceGuideToggle.checked;
      return;
    }
    const nextSoundEnabled = sourceToggle ? sourceToggle.checked : state.settings.soundEnabled;
    state.settings.soundEnabled = nextSoundEnabled;
    if (els.backgroundSoundToggle && els.backgroundSoundToggle !== sourceToggle) els.backgroundSoundToggle.checked = nextSoundEnabled;
    if (els.soundToggle && els.soundToggle !== sourceToggle) els.soundToggle.checked = nextSoundEnabled;
  }

  function openTutorial() { tutorialIndex = 0; renderTutorialStep(); els.tutorialModal.classList.remove("is-hidden"); }
  function closeTutorial() { els.tutorialModal.classList.add("is-hidden"); }
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
    const target = getItemFromEvent(event);
    if (!target || !target.item) return;
    dragSession = { item: target.item, startX: event.clientX, startY: event.clientY, active: false };
  }

  function handlePointerMove(event) {
    if (!dragSession) return;
    const moved = Math.abs(event.clientX - dragSession.startX) + Math.abs(event.clientY - dragSession.startY);
    if (!dragSession.active && moved > 12) {
      dragSession.active = true;
      els.dragGhost.innerHTML = `<img src="${dragSession.item.image}" alt="">`;
      els.dragGhost.classList.remove("is-hidden");
    }
    if (dragSession.active) { els.dragGhost.style.left = `${event.clientX}px`; els.dragGhost.style.top = `${event.clientY}px`; }
  }

  function handlePointerUp(event) {
    if (!dragSession) return;
    const session = dragSession;
    dragSession = null;
    els.dragGhost.classList.add("is-hidden");
    if (!session.active) return;
    const basket = els.playArea.querySelector("[data-basket-drop-zone]");
    const rect = basket && basket.getBoundingClientRect();
    if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) selectItem(session.item, "drag");
  }

  function bindEvents() {
    window.addEventListener("resize", updateGameScale);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", updateGameScale);
    els.startButton.addEventListener("click", startFlow);
    els.startExitButton.addEventListener("click", requestExit);
    els.settingsButton.addEventListener("click", openSettings);
    els.tutorialButton.addEventListener("click", openTutorial);
    els.difficultyBackButton.addEventListener("click", goHome);
    els.difficultyButtons.forEach((button) => button.addEventListener("click", () => startGame(getDifficultyKeyFromButton(button))));
    els.playArea.addEventListener("click", (event) => { if (dragSession && dragSession.active) return; const target = getItemFromEvent(event); if (target && target.item) selectItem(target.item, "touch"); });
    els.playArea.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    els.hintButton.addEventListener("click", showHint);
    els.pauseButton.addEventListener("click", pauseGame);
    els.resumeButton.addEventListener("click", resumeGame);
    els.pauseRestartButton.addEventListener("click", () => { els.pauseModal.classList.add("is-hidden"); startGame(state.difficultyKey); });
    els.pauseQuitButton.addEventListener("click", () => { els.pauseModal.classList.add("is-hidden"); finishGame("abandoned", "user_exit"); });
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
    els.settingsCloseButton.addEventListener("click", closeSettings);
    els.settingsExitButton.addEventListener("click", () => { closeSettings(); requestExit(); });
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
