(function () {
  "use strict";

  const STAGE_WIDTH = 1280;
  const STAGE_HEIGHT = 720;
  const runtime = getRuntimeConfig();
  const screenElements = Array.from(document.querySelectorAll("[data-screen]"));
  const loadingFill = document.getElementById("loadingFill");
  const loadingPercent = document.getElementById("loadingPercent");
  const difficultyCards = Array.from(document.querySelectorAll("[data-difficulty]"));
  const CONDITION_SLEEP_HOURS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  const CONDITION_SLEEP_DRAG_STEP_PX = 42;
  const START_READY_MESSAGE_TIME = 2000;
  const START_COUNTDOWN_TIME = 3000;
  const audio = new GameAudio();
  const runtimeSessionId = runtime.raw.session_id || runtime.raw.sessionId || ResultBuilder.buildSessionId();
  const sessionMeta = LightGameSessionBoard.buildSessionMeta(runtime, runtimeSessionId);

  let currentDifficulty = runtime.difficulty;
  let tutorialIndex = 0;
  let pendingResult = null;
  let finishCheckPage = 0;
  let conditionData = runtime.modeConfig.showConditionCheck ? {} : { skipped: true };
  let tutorialReturnScreen = "start";
  let orientationAutoPauseActive = false;
  let orientationVoicePauseActive = false;
  let startCountdownFrame = null;
  let hubMirrorFallbackActive = false;
  let lastSentResultKey = "";
  const postConditionModal = document.getElementById("post-condition-modal");

  const conditionState = {
    checkShown: false,
    skipped: false,
    mood: "good",
    sleepIndex: 3,
    sleepDrag: {
      pointerId: null,
      lastStepY: 0
    }
  };
  const finishCheckState = {
    checkShown: false
  };

  function registerPlayBulbAssets() {
    const paths = ["assets/images/turn_on.webp", "assets/images/turn_off.webp"];
    let loadedCount = 0;
    let failed = false;

    paths.forEach((path) => {
      const image = new Image();
      image.onload = () => {
        loadedCount += 1;
        if (!failed && loadedCount === paths.length) {
          document.body.classList.add("has-bulb-assets");
        }
      };
      image.onerror = () => {
        failed = true;
        document.body.classList.remove("has-bulb-assets");
      };
      image.src = path;
    });
  }

  function loadDeferredGameAssets() {
    document.querySelectorAll("img[data-deferred-src]").forEach((image) => {
      image.src = image.dataset.deferredSrc;
      image.removeAttribute("data-deferred-src");
    });

    const questionDataScript = document.getElementById("questionDataScript");
    if (!questionDataScript || questionDataScript.src) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      questionDataScript.addEventListener("load", resolve, { once: true });
      questionDataScript.addEventListener("error", resolve, { once: true });
      questionDataScript.src = questionDataScript.dataset.src;
    });
  }
  const conditionElements = {
    moodButtons: Array.from(document.querySelectorAll(".condition-mood-button")),
    sleepDial: document.querySelector(".condition-sleep-dial"),
    sleepRows: document.getElementById("conditionSleepRows"),
    sleepUpButton: document.getElementById("sleepUp"),
    sleepDownButton: document.getElementById("sleepDown"),
    skipButton: document.getElementById("conditionSkip"),
    confirmButton: document.getElementById("conditionSubmit")
  };
  let settings = {
    music: true,
    sfx: true,
    voice: runtime.modeConfig.voiceGuideEnabled !== false,
    score: true
  };
  audio.setVoiceEnabled(settings.voice);

  function sleepIndexAt(offset) {
    const length = CONDITION_SLEEP_HOURS.length;
    return (conditionState.sleepIndex + offset + length) % length;
  }

  function renderConditionSleepDial() {
    if (!conditionElements.sleepRows) {
      return;
    }

    conditionElements.sleepRows.replaceChildren();
    [-1, 0, 1].forEach((offset) => {
      const row = document.createElement("span");
      const number = document.createElement("span");
      const unit = document.createElement("span");

      row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
      number.className = "condition-sleep-number";
      number.textContent = String(CONDITION_SLEEP_HOURS[sleepIndexAt(offset)]);
      unit.className = "condition-sleep-unit";
      unit.textContent = "시간";
      row.append(number, unit);
      conditionElements.sleepRows.appendChild(row);
    });
  }

  function selectedConditionSleepHours() {
    return CONDITION_SLEEP_HOURS[conditionState.sleepIndex];
  }

  function changeConditionSleep(delta) {
    const length = CONDITION_SLEEP_HOURS.length;
    conditionState.sleepIndex = (conditionState.sleepIndex + delta + length) % length;
    renderConditionSleepDial();
  }

  function startConditionSleepDrag(event) {
    if (!conditionElements.sleepDial || event.button > 0) {
      return;
    }

    event.preventDefault();
    conditionState.sleepDrag.pointerId = event.pointerId;
    conditionState.sleepDrag.lastStepY = event.clientY;
    conditionElements.sleepDial.classList.add("is-dragging");

    if (typeof conditionElements.sleepDial.setPointerCapture === "function") {
      conditionElements.sleepDial.setPointerCapture(event.pointerId);
    }
  }

  function dragConditionSleep(event) {
    if (conditionState.sleepDrag.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    const deltaY = event.clientY - conditionState.sleepDrag.lastStepY;
    const steps = Math.trunc(Math.abs(deltaY) / CONDITION_SLEEP_DRAG_STEP_PX);

    if (steps < 1) {
      return;
    }

    const direction = deltaY > 0 ? -1 : 1;
    conditionState.sleepDrag.lastStepY += direction * -steps * CONDITION_SLEEP_DRAG_STEP_PX;
    changeConditionSleep(direction * steps);
  }

  function endConditionSleepDrag(event) {
    if (conditionState.sleepDrag.pointerId !== event.pointerId) {
      return;
    }

    if (
      conditionElements.sleepDial &&
      typeof conditionElements.sleepDial.releasePointerCapture === "function" &&
      conditionElements.sleepDial.hasPointerCapture(event.pointerId)
    ) {
      conditionElements.sleepDial.releasePointerCapture(event.pointerId);
    }

    conditionState.sleepDrag.pointerId = null;
    conditionState.sleepDrag.lastStepY = 0;

    if (conditionElements.sleepDial) {
      conditionElements.sleepDial.classList.remove("is-dragging");
    }
  }

  function selectConditionMood(button) {
    conditionState.mood = button.dataset.mood || "good";
    conditionElements.moodButtons.forEach((moodButton) => {
      const isSelected = moodButton === button;
      moodButton.classList.toggle("is-selected", isSelected);
      moodButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  const game = new MemoryBulbGame({
    audio,
    sessionMeta,
    elements: {
      grid: document.getElementById("bulbGrid"),
      hudProgress: document.querySelector(".hud-progress-pill"),
      hudProgressCurrent: document.getElementById("hud-progress-current"),
      hudProgressTotal: document.getElementById("hud-progress-total"),
      hudProgressSteps: Array.from(document.querySelectorAll(".hud-progress-step")),
      difficulty: document.getElementById("hudDifficulty"),
      phaseTimer: document.getElementById("phaseTimer"),
      phaseTimerBox: document.getElementById("phaseTimerBox"),
      totalTimer: document.getElementById("totalTimer"),
      totalTimerBox: document.getElementById("totalTimerBox"),
      score: document.getElementById("scoreText"),
      remaining: document.getElementById("remainingText"),
      progressText: document.getElementById("progressText"),
      memoryFill: document.getElementById("memoryFill"),
      memoryCountdownGauge: document.getElementById("memoryCountdownGauge"),
      memoryGaugeFill: document.getElementById("memoryGaugeFill"),
      memoryGaugeText: document.getElementById("memoryGaugeText"),
      hintButton: document.getElementById("hintButton"),
      hintCount: document.getElementById("hintCount"),
      playPrompt: document.querySelector(".play-prompt"),
      playArea: document.querySelector(".play-area"),
      roundTransitionMessage: document.getElementById("roundTransitionMessage"),
      statusMessage: document.getElementById("statusMessage"),
      pauseButton: document.getElementById("pauseButton"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      resultNotice: document.getElementById("resultNotice")
    },
    onFinish: (result) => {
      pendingResult = result;
      showFinishCheck(result);
    },
    onExit: (result) => {
      pendingResult = result || window.__LAST_GAME_RESULT__;
      sendSessionResult(pendingResult);
      showFinishCheck(pendingResult);
    }
  });

  const countdownElements = {
    layer: document.getElementById("game-countdown"),
    message: document.getElementById("game-countdown-message"),
    timer: document.querySelector(".game-countdown-timer"),
    number: document.getElementById("game-countdown-number")
  };

  function updateStageScale() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    const horizontalGutter = Math.max(0, (viewportWidth - (STAGE_WIDTH * scale)) / (2 * scale));
    const verticalGutter = Math.max(0, (viewportHeight - (STAGE_HEIGHT * scale)) / (2 * scale));
    const hudDesignWidth = 1536;
    const visibleHudWidth = viewportWidth / scale;
    const hudFitScale = Math.max(0.01, visibleHudWidth / hudDesignWidth);

    document.documentElement.style.setProperty("--game-scale", String(scale));
    document.documentElement.style.setProperty("--stage-scale", String(scale));
    document.documentElement.style.setProperty("--hud-fit-scale", String(hudFitScale));
    document.documentElement.style.setProperty("--game-viewport-right-gutter", horizontalGutter + "px");
    document.documentElement.style.setProperty("--game-viewport-side-gutter", horizontalGutter + "px");
    document.documentElement.style.setProperty("--game-viewport-top-gutter", verticalGutter + "px");
    const isPortrait = isPortraitViewport(viewportWidth, viewportHeight);
    document.body.classList.toggle("is-portrait", isPortrait);
    const portraitLock = document.querySelector(".portrait-lock");
    if (portraitLock) {
      portraitLock.setAttribute("aria-hidden", isPortrait ? "false" : "true");
    }
    syncOrientationPause(isPortrait);
  }

  function isPortraitViewport(viewportWidth, viewportHeight) {
    const width = Number(viewportWidth) || window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const height = Number(viewportHeight) || window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    return height > width;
  }

  function waitForLandscapeOrientation() {
    updateStageScale();
    if (!isPortraitViewport()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let animationFrameId = 0;
      const visualViewport = window.visualViewport;
      const cleanup = () => {
        window.removeEventListener("resize", check);
        window.removeEventListener("orientationchange", check);
        if (visualViewport) {
          visualViewport.removeEventListener("resize", check);
        }
        if (animationFrameId) {
          window.cancelAnimationFrame(animationFrameId);
        }
      };
      const check = () => {
        updateStageScale();
        if (!isPortraitViewport()) {
          cleanup();
          resolve();
          return;
        }
        animationFrameId = window.requestAnimationFrame(check);
      };

      window.addEventListener("resize", check);
      window.addEventListener("orientationchange", check);
      if (visualViewport) {
        visualViewport.addEventListener("resize", check);
      }
      animationFrameId = window.requestAnimationFrame(check);
    });
  }

  function canPauseForOrientationGuard() {
    return document.body.dataset.activeScreen === "play"
      && [GAME_PHASE.MEMORIZE, GAME_PHASE.SELECTING, GAME_PHASE.FEEDBACK].includes(game.phase);
  }

  function syncOrientationPause(isPortrait) {
    if (isPortrait) {
      if (!orientationVoicePauseActive) {
        orientationVoicePauseActive = audio.pauseActiveVoice();
      }
      if (!orientationAutoPauseActive && canPauseForOrientationGuard()) {
        orientationAutoPauseActive = true;
        game.pause({ showOverlay: false, countPause: false });
      }
      return;
    }

    if (orientationVoicePauseActive) {
      orientationVoicePauseActive = false;
      audio.resumeActiveVoice();
    }

    if (!orientationAutoPauseActive) {
      return;
    }

    orientationAutoPauseActive = false;
    game.resume();
  }

  function showScreen(name) {
    if (name !== "play") {
      clearStartCountdown();
    }
    document.body.dataset.activeScreen = name;
    screenElements.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
    if (name !== "play") {
      clearForcedPlayScreen();
    }
    if (name === "start") {
      audio.playBackground({ fadeIn: true });
    }
  }

  function handlePageBackgroundChange(isInBackground) {
    audio.setPageInBackground(isInBackground);
    if (isInBackground) {
      return;
    }

    if (!settings.music) {
      return;
    }

    const activeScreen = document.body.dataset.activeScreen;
    if (activeScreen === "start" || activeScreen === "play") {
      audio.playBackground({ fadeIn: true });
    }
  }

  function clearForcedPlayScreen() {
    const playScreen = document.querySelector('[data-screen="play"]');
    if (!playScreen) {
      return;
    }

    [
      playScreen,
      document.getElementById("gameStage"),
      document.querySelector(".portrait-lock"),
      playScreen.querySelector(".game-hud"),
      playScreen.querySelector(".play-prompt"),
      playScreen.querySelector(".play-area"),
      playScreen.querySelector(".progress-row"),
      playScreen.querySelector(".status-bar"),
      playScreen.querySelector(".hint-button"),
      playScreen.querySelector(".pause-button"),
      playScreen.querySelector(".next-button")
    ].forEach((element) => {
      if (element) {
        element.style.removeProperty("display");
        element.style.removeProperty("visibility");
        element.style.removeProperty("opacity");
      }
    });
  }

  function startLoading() {
    const duration = 1800;
    let activeElapsed = 0;
    let lastFrameAt = performance.now();
    audio.primeBackground();

    function update(now) {
      updateStageScale();
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

      loadingFill.style.width = percent + "%";
      loadingPercent.textContent = percent + "%";

      if (progress < 1) {
        window.requestAnimationFrame(update);
        return;
      }

      loadingFill.style.width = "100%";
      loadingPercent.textContent = "100%";

      setTimeout(() => {
        waitForLandscapeOrientation().then(() => {
          audio.playBackground({ fadeIn: true });

          if (runtime.modeConfig.showConditionCheck) {
            openConditionCheck();
            return;
          }

          if (runtime.mode === "reminder") {
            startReadyCountdown();
            return;
          }

          showScreen("start");
        });
      }, 260);
    }

    window.requestAnimationFrame(update);
  }

  function applyRuntimeMode() {
    document.body.dataset.mode = runtime.mode;
    document.body.classList.toggle("high-contrast", runtime.highContrast);
    document.getElementById("modeLabel").textContent = runtime.modeConfig.label;

    toggleOptional(".optional-difficulty", runtime.modeConfig.showDifficultySelect);
    toggleOptional(".optional-difficulty-label", runtime.modeConfig.showDifficultySelect || runtime.mode === "standard");
    toggleOptional(".optional-settings", runtime.modeConfig.showSettings);
    toggleOptional(".optional-howto", runtime.modeConfig.showHowTo && runtime.mode !== "care" && runtime.mode !== "ai_assisted");
    toggleOptional(".optional-progress", runtime.modeConfig.showProgress);
    toggleOptional(".optional-score", runtime.modeConfig.showScore && settings.score);
    toggleOptional(".optional-timer", runtime.modeConfig.showTimer);
    toggleOptional(".optional-replay", runtime.modeConfig.showReplay);
    document.getElementById("hintButton").hidden = !runtime.modeConfig.hintEnabled;
    document.getElementById("conditionSkip").hidden = !runtime.modeConfig.allowConditionSkip;
    document.getElementById("finishSkip").hidden = !runtime.modeConfig.allowFinishSkip;
  }

  function toggleOptional(selector, visible) {
    document.querySelectorAll(selector).forEach((element) => {
      element.hidden = !visible;
      element.setAttribute("aria-hidden", visible ? "false" : "true");
    });
  }

  function selectDifficulty(difficultyKey) {
    currentDifficulty = DIFFICULTY_CONFIG[difficultyKey] ? difficultyKey : "easy";
    const effectiveKey = runtime.modeConfig.difficultyOverride || currentDifficulty;
    document.getElementById("selectedDifficultyText").textContent = DIFFICULTY_CONFIG[effectiveKey].label;
    difficultyCards.forEach((card) => {
      const isSelected = card.dataset.difficulty === currentDifficulty;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function clearStartCountdown() {
    if (startCountdownFrame) {
      window.cancelAnimationFrame(startCountdownFrame);
      startCountdownFrame = null;
    }

    if (countdownElements.layer) {
      countdownElements.layer.classList.add("is-hidden");
      countdownElements.layer.classList.remove("is-intro");
      countdownElements.layer.setAttribute("aria-hidden", "true");
    }
    document.body.classList.remove("is-start-countdown");

    if (countdownElements.timer) {
      countdownElements.timer.style.setProperty("--countdown-angle", "0deg");
    }
  }

  function startReadyCountdown() {
    if (isPortraitViewport()) {
      waitForLandscapeOrientation().then(startReadyCountdown);
      return;
    }

    audio.unlock();
    clearStartCountdown();
    document.getElementById("pauseHelpPanel").hidden = true;
    if (game.elements.pauseOverlay) {
      game.elements.pauseOverlay.hidden = true;
    }
    prepareCountdownHud();
    showScreen("play");
    document.body.classList.add("is-start-countdown");

    if (!countdownElements.layer || !countdownElements.timer || !countdownElements.number) {
      beginGame();
      return;
    }

    countdownElements.layer.classList.remove("is-hidden");
    countdownElements.layer.classList.add("is-intro");
    countdownElements.layer.setAttribute("aria-hidden", "false");
    countdownElements.number.textContent = "3";
    countdownElements.timer.style.setProperty("--countdown-angle", "0deg");

    if (countdownElements.message) {
      countdownElements.message.textContent = "게임이 곧 시작돼요!";
    }

    audio.play("readyVoice");
    runStartCountdownIntro();
  }

  function runStartCountdownIntro() {
    let remainingMs = START_READY_MESSAGE_TIME;
    let lastFrameAt = performance.now();

    function updateIntro(now) {
      if (isPortraitViewport()) {
        lastFrameAt = now;
        startCountdownFrame = window.requestAnimationFrame(updateIntro);
        return;
      }

      remainingMs -= Math.max(0, now - lastFrameAt);
      lastFrameAt = now;

      if (remainingMs <= 0) {
        startCountdownFrame = null;
        beginReadyCountdown();
        return;
      }

      startCountdownFrame = window.requestAnimationFrame(updateIntro);
    }

    startCountdownFrame = window.requestAnimationFrame(updateIntro);
  }

  function prepareCountdownHud() {
    const effectiveKey = runtime.modeConfig.difficultyOverride || currentDifficulty;
    const difficulty = DIFFICULTY_CONFIG[effectiveKey] || DIFFICULTY_CONFIG.easy;
    const totalQuestions = runtime.modeConfig.totalQuestions || 10;
    const totalLimit = runtime.modeConfig.totalLimitMs || difficulty.totalLimitMs;

    const progressPill = document.querySelector(".hud-progress-pill");
    if (progressPill) {
      progressPill.style.setProperty("--hud-progress", (100 / totalQuestions) + "%");
    }
    document.getElementById("hud-progress-current").textContent = "1";
    document.getElementById("hud-progress-total").textContent = String(totalQuestions);
    document.querySelectorAll(".hud-progress-step").forEach((step, index) => {
      step.classList.toggle("is-active", index === 0);
    });
    document.getElementById("hudDifficulty").textContent = difficulty.label;
    document.getElementById("totalTimer").textContent = formatCountdownClock(totalLimit);
    document.getElementById("totalTimerBox").classList.remove("is-warning");
    document.getElementById("phaseTimer").textContent = "--";
    document.getElementById("scoreText").textContent = "0개";
    document.getElementById("remainingText").textContent = difficulty.targetCount + "개";
    document.getElementById("hintButton").hidden = true;
    document.getElementById("pauseButton").disabled = true;
  }

  function formatCountdownClock(ms) {
    const totalSeconds = Math.max(0, Math.ceil((Number(ms) || 0) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  function beginReadyCountdown() {
    if (!countdownElements.layer || !countdownElements.timer || !countdownElements.number) {
      beginGame();
      return;
    }

    countdownElements.layer.classList.remove("is-intro");
    let activeElapsed = 0;
    let lastFrameAt = performance.now();
    let lastDisplaySeconds = null;

    function updateCountdown(now) {
      if (isPortraitViewport()) {
        lastFrameAt = now;
        startCountdownFrame = window.requestAnimationFrame(updateCountdown);
        return;
      }

      activeElapsed += Math.max(0, now - lastFrameAt);
      lastFrameAt = now;

      const remaining = Math.max(0, START_COUNTDOWN_TIME - activeElapsed);
      const displaySeconds = Math.max(1, Math.ceil(remaining / 1000));
      const secondProgress = (activeElapsed % 1000) / 1000;
      const angle = secondProgress * 360;

      countdownElements.number.textContent = String(displaySeconds);
      countdownElements.timer.style.setProperty("--countdown-angle", angle + "deg");

      if (displaySeconds !== lastDisplaySeconds && remaining > 0) {
        lastDisplaySeconds = displaySeconds;
        audio.play("countdown");
      }

      if (remaining <= 0) {
        countdownElements.timer.style.setProperty("--countdown-angle", "360deg");
        audio.play("start");
        clearStartCountdown();
        beginGame();
        return;
      }

      startCountdownFrame = window.requestAnimationFrame(updateCountdown);
    }

    updateCountdown(lastFrameAt);
  }

  function beginGame() {
    audio.unlock();
    pendingResult = null;
    lastSentResultKey = "";
    closeFinishCheck();
    document.getElementById("pauseHelpPanel").hidden = true;
    showScreen("play");
    sendBridgeMessage({
      schemaVersion: "1.0.0",
      sentAt: new Date().toISOString(),
      sessionId: sessionMeta.sessionId,
      session_id: sessionMeta.sessionId,
      contentId: sessionMeta.contentId,
      content_id: sessionMeta.contentId,
      gameKey: sessionMeta.gameKey,
      game_key: sessionMeta.gameKey,
      game_version: sessionMeta.gameVersion,
      play_source: sessionMeta.playSource,
      type: "GAME_STARTED",
      status: "started",
      mode: runtime.mode,
      app_mode: runtime.mode,
      difficulty: currentDifficulty
    }, "GAME_STARTED");
    game.start({
      difficultyKey: currentDifficulty,
      mode: runtime.mode,
      modeConfig: runtime.modeConfig,
      themeKey: "bulb",
      condition: conditionData,
      sessionMeta
    });
  }

  function openDifficultySelect() {
    audio.unlock();
    if (runtime.modeConfig.showDifficultySelect) {
      showScreen("difficulty");
      return;
    }
    startReadyCountdown();
  }

  function collectChoices(scope) {
    return LightGameSessionBoard.collectChoices(scope);
  }

  function collectPostConditionChoices() {
    const finishData = {};
    document.querySelectorAll(".post-condition-option.is-selected").forEach((button) => {
      finishData[button.dataset.postField] = button.dataset.postValue;
    });
    return finishData;
  }

  function updateFinishCheckPage(pageIndex) {
    finishCheckPage = Math.max(0, Math.min(1, pageIndex));
    document.querySelectorAll("[data-post-condition-page]").forEach((page) => {
      page.hidden = Number(page.dataset.postConditionPage) !== finishCheckPage;
    });
    document.querySelectorAll(".post-condition-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === finishCheckPage);
    });
  }

  function showFinishCheck(result) {
    pendingResult = result || pendingResult || window.__LAST_GAME_RESULT__ || null;
    audio.pauseBackground();
    if (!runtime.modeConfig.showFinishCheck || finishCheckState.checkShown) {
      markFinishCheckSkipped();
      showResult(pendingResult);
      return;
    }

    finishCheckState.checkShown = true;
    updateFinishCheckPage(0);
    document.getElementById("pauseOverlay").hidden = true;
    document.getElementById("pauseHelpPanel").hidden = true;
    document.body.classList.add("is-finish-check-visible");
    if (postConditionModal) {
      postConditionModal.classList.remove("is-hidden");
    }
  }

  function closeFinishCheck() {
    document.body.classList.remove("is-finish-check-visible");
    if (postConditionModal) {
      postConditionModal.classList.add("is-hidden");
    }
  }

  function selectPostConditionOption(button) {
    const field = button.dataset.postField;
    document.querySelectorAll(`.post-condition-option[data-post-field="${field}"]`).forEach((option) => {
      const isSelected = option === button;
      option.classList.toggle("is-selected", isSelected);
      option.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function openConditionCheck() {
    conditionState.checkShown = true;
    renderConditionSleepDial();
    showScreen("condition");
  }

  function submitCondition(skip) {
    conditionState.skipped = Boolean(skip);
    conditionData = skip
      ? { skipped: true }
      : {
          moodBefore: conditionState.mood,
          sleepHours: selectedConditionSleepHours(),
          skipped: false
        };
    if (runtime.mode === "reminder") {
      startReadyCountdown();
      return;
    }
    showScreen("start");
  }

  function submitFinishCheck() {
    const finishData = collectPostConditionChoices();
    if (pendingResult) {
      pendingResult.finish_check = finishData;
      pendingResult.finish_check_skipped = false;
      pendingResult.moodAfter = finishData.moodAfter;
      pendingResult.fatigue = finishData.fatigue;
      pendingResult.perceivedDifficulty = finishData.perceivedDifficulty;
      pendingResult.neededHelp = finishData.neededHelp;
      pendingResult.replayIntent = finishData.replayIntent;
      if (pendingResult.condition) {
        pendingResult.condition.after = finishData;
      }
      if (pendingResult.resultDetail) {
        pendingResult.resultDetail.finish_check_skipped = false;
      }
      if (pendingResult.result_detail_json) {
        pendingResult.result_detail_json.finish_check_skipped = false;
      }
      window.__LAST_GAME_RESULT__ = pendingResult;
    }
    showResult(pendingResult);
  }

  function markFinishCheckSkipped() {
    if (pendingResult) {
      pendingResult.finish_check = { skipped: true };
      pendingResult.finish_check_skipped = true;
      if (pendingResult.condition) {
        pendingResult.condition.after = null;
      }
      if (pendingResult.resultDetail) {
        pendingResult.resultDetail.finish_check_skipped = true;
      }
      if (pendingResult.result_detail_json) {
        pendingResult.result_detail_json.finish_check_skipped = true;
      }
      window.__LAST_GAME_RESULT__ = pendingResult;
    }
  }

  function skipFinishCheck() {
    markFinishCheckSkipped();
    showResult(pendingResult);
  }

  function showResult(result) {
    audio.pauseBackground();
    closeFinishCheck();
    renderResult(result);
    showScreen("result");
    audio.play("complete");

    const autoReturnMs = isCompactResultMode() && !runtime.modeConfig.autoReturnMs ? 3000 : runtime.modeConfig.autoReturnMs;
    if (autoReturnMs) {
      setTimeout(() => {
        finishToHost();
      }, autoReturnMs);
    }
  }

  function renderResult(result) {
    const safeResult = result || {};
    const resultMessage = isCompactResultMode() ? createCompactResultMessage(safeResult) : null;
    const totalQuestions = safeResult.total_questions || 0;
    const correctCount = safeResult.correct_count || 0;
    const successRate = typeof safeResult.success_rate === "number"
      ? safeResult.success_rate
      : totalQuestions
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
    const hintCount = typeof safeResult.hint_triggered_count === "number"
      ? safeResult.hint_triggered_count
      : safeResult.hint_count || 0;

    document.getElementById("resultTotal").textContent = totalQuestions;
    document.getElementById("resultCorrect").textContent = correctCount;
    document.getElementById("resultRate").textContent = successRate + "%";
    document.getElementById("resultHintCount").textContent = hintCount + "회";
    document.getElementById("resultCompare").textContent = "오늘 첫 기록을 남겼어요";
    if (resultMessage) {
      document.getElementById("resultEmoji").textContent = resultMessage.emoji;
      document.getElementById("resultTitle").textContent = resultMessage.title;
      renderResultMessage(resultMessage.message);
    } else {
      document.getElementById("resultMessage").textContent = ["total_timeout", "time_over"].includes(safeResult.exitReason || safeResult.abandon_reason)
        ? "정해진 시간이 지나 활동을 마쳤어요."
        : "천천히 집중해주신 것만으로도 참 좋습니다.";
    }
    applyRuntimeMode();
  }

  function isCompactResultMode() {
    return runtime.mode === "reminder" || runtime.mode === "care" || runtime.mode === "ai_assisted";
  }

  function createCompactResultMessage(result) {
    const rounds = Array.isArray(result.question_results)
      ? result.question_results
      : result.resultDetail && Array.isArray(result.resultDetail.rounds)
        ? result.resultDetail.rounds
        : Array.isArray(result.question_logs)
          ? result.question_logs
          : [];
    const totalAnswered = rounds.length || result.played_round_count || result.completed_count || 0;

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
    const lines = message.includes(sentenceBreak) ? message.split(sentenceBreak) : [message];
    const firstLine = lines.length > 1 ? lines[0] + "." : lines[0];
    const secondLine = lines.length > 1 ? lines.slice(1).join(sentenceBreak) : "";
    const renderedLines = secondLine ? [firstLine, secondLine] : [firstLine];
    const nodes = renderedLines.flatMap((line, index) => {
      const textNode = document.createTextNode(line);
      return index === 0 ? [textNode] : [document.createElement("br"), textNode];
    });

    document.getElementById("resultMessage").replaceChildren(...nodes);
  }

  function formatSeconds(milliseconds) {
    const seconds = Math.max(0, milliseconds / 1000);
    return seconds.toFixed(seconds >= 10 ? 0 : 1) + "초";
  }

  function finishToHost(resultOverride) {
    const result = resultOverride || window.__LAST_GAME_RESULT__ || pendingResult;
    if (result) {
      sendSessionResult(result);
      sendBridgeMessage(createExitRequestPayload("auto_return"), "GAME_EXIT_REQUESTED");
    } else {
      sendBridgeMessage(createAbandonedResultPayload("manual"), "SESSION_ABORT");
      sendBridgeMessage(createExitRequestPayload("manual"), "GAME_EXIT_REQUESTED");
    }
    closeFinishCheck();
    scheduleReturnToHub();
  }

  function getModePlaySource() {
    const modePlaySource = {
      standard: "manual",
      reminder: "reminder",
      care: "care_session",
      ai_assisted: "ai_recommendation"
    };

    return sessionMeta.playSource || modePlaySource[runtime.mode] || "manual";
  }

  function createAbandonedResultPayload(source) {
    const now = new Date().toISOString();
    const gameResult = {
      status: "abandoned",
      mode: runtime.mode,
      app_mode: runtime.mode,
      game_mode: "position_memory",
      difficulty: currentDifficulty,
      total_questions: 0,
      completed_question_count: 0,
      correct_count: 0,
      wrong_count: 0,
      hint_count: 0,
      retry_count: 0,
      pause_count: 0,
      interaction_count: 0,
      avg_response_time_ms: 0,
      completion_rate: 0,
      completed: false,
      exit_reason: source === "time_over" ? "time_over" : "user_exit",
      abandoned_at: now,
      abandon_reason: source === "time_over" ? "time_over" : "user_exit",
      error_code: null,
      error_message: null,
      error_phase: null,
      question_logs: [],
      result_detail_json: {},
      process_data_json: {}
    };

    return {
      session_id: sessionMeta.sessionId,
      senior_id: sessionMeta.seniorId || sessionMeta.userId || sessionMeta.anonymousUserId || null,
      user_id: sessionMeta.userId || null,
      anonymous_user_id: sessionMeta.anonymousUserId || null,
      guardian_id: sessionMeta.guardianId,
      assignment_id: sessionMeta.assignmentId,
      alarm_id: sessionMeta.alarmId,
      schedule_id: sessionMeta.scheduleId,
      tenant_id: sessionMeta.tenantId,
      facility_id: sessionMeta.facilityId,
      program_id: sessionMeta.programId,
      reward_id: sessionMeta.rewardId,
      recommendation_id: sessionMeta.recommendationId,
      content_id: sessionMeta.contentId,
      game_key: sessionMeta.gameKey,
      game_version: sessionMeta.gameVersion || "1.0.0",
      play_source: getModePlaySource(),
      status: "abandoned",
      mode: runtime.mode,
      app_mode: runtime.mode,
      game_mode: "position_memory",
      difficulty: currentDifficulty,
      started_at: now,
      ended_at: now,
      duration_ms: 0,
      total_questions: 0,
      completed_question_count: 0,
      correct_count: 0,
      wrong_count: 0,
      hint_count: 0,
      retry_count: 0,
      pause_count: 0,
      interaction_count: 0,
      avg_response_time_ms: 0,
      completion_rate: 0,
      exit_reason: gameResult.exit_reason,
      abandoned_at: now,
      abandon_reason: gameResult.abandon_reason,
      error_code: null,
      error_message: null,
      error_phase: null,
      question_logs: [],
      result_detail_json: {},
      process_data_json: {},
      client_context: sessionMeta.clientContext,
      voice_context: sessionMeta.voiceContext,
      meta: sessionMeta.meta,
      game_result: gameResult,
      game_result_json: gameResult
    };
  }

  function createExitRequestPayload(source) {
    return {
      schemaVersion: "1.0.0",
      sentAt: new Date().toISOString(),
      sessionId: sessionMeta.sessionId,
      session_id: sessionMeta.sessionId,
      contentId: sessionMeta.contentId,
      content_id: sessionMeta.contentId,
      gameKey: sessionMeta.gameKey,
      game_key: sessionMeta.gameKey,
      game_version: sessionMeta.gameVersion,
      play_source: sessionMeta.playSource,
      type: "GAME_EXIT_REQUESTED",
      status: "exit_requested",
      mode: runtime.mode,
      app_mode: runtime.mode,
      source: source || "manual"
    };
  }

  function returnToHub() {
    window.location.href = new URL("../../index.html", window.location.href).href;
  }

  function requestExitToHub(source) {
    game.stop("user_exit");
    pendingResult = createAbandonedResultPayload(source || "start");
    window.__LAST_GAME_RESULT__ = pendingResult;
    sendSessionResult(pendingResult);
    sendBridgeMessage(createExitRequestPayload(source), "GAME_EXIT_REQUESTED");
    closeFinishCheck();
    scheduleReturnToHub();
  }

  function createResultSendKey(result) {
    if (!result) {
      return "";
    }

    return [
      result.session_id || result.sessionId || sessionMeta.sessionId,
      result.status || "",
      result.ended_at || result.endedAt || result.abandoned_at || ""
    ].join(":");
  }

  function sendSessionResult(result) {
    if (!result) {
      return false;
    }

    const key = createResultSendKey(result);
    if (key && key === lastSentResultKey) {
      return false;
    }

    lastSentResultKey = key;
    sendBridgeMessage(result, resolveSessionEventType(result));
    return true;
  }

  function sendBridgeMessage(result, fallbackType) {
    const isResultPayload = result && (result.schemaVersion || result.session_id || result.question_logs || result.result_detail_json);
    const payload = { type: fallbackType, payload: result || null };
    const targets = [
      {
        name: "ReactNativeWebView",
        post: () => {
          if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }
      },
      {
        name: "parent",
        post: () => {
          if (window.parent && window.parent !== window && typeof window.parent.postMessage === "function") {
            window.parent.postMessage(payload, "*");
          }
        }
      },
      {
        name: "opener",
        post: () => {
          if (window.opener && !window.opener.closed && typeof window.opener.postMessage === "function") {
            window.opener.postMessage(payload, "*");
          }
        }
      }
    ];

    targets.forEach((target) => {
      try {
        target.post();
      } catch (error) {
        if (isResultPayload && result) {
          result.complete_send_failed = true;
        }
        console.error("completeSendFailed:" + target.name, error);
      }
    });

    if (window.console) {
      console.log("[light game bridge] " + fallbackType, result || null);
    }

    mirrorBridgeMessageToHub(payload);
  }

  function normalizeBridgeMessageForHub(message) {
    const payload = message && message.payload ? message.payload : {};
    let type = message && message.type ? message.type : "";

    if (type === "GAME_READY") {
      type = "READY";
    }
    if (type === "GAME_STARTED") {
      type = "SESSION_START";
    }
    if (type === "GAME_EXIT_REQUESTED") {
      type = "RETURN_TO_APP";
    }
    if (type === "GAME_ERROR") {
      type = "ERROR";
    }
    if (type === "GAME_COMPLETED") {
      type = payload.status === "abandoned" || payload.status === "error" ? "SESSION_ABORT" : "SESSION_COMPLETE";
    }

    return {
      type,
      rawType: message.type,
      payload
    };
  }

  function appendMirroredHubEvent(parentDocument, normalizedMessage) {
    const eventLog = parentDocument.getElementById("hub-event-log");
    if (!eventLog) {
      return;
    }

    const emptyLog = eventLog.querySelector(".empty-log");
    if (emptyLog) {
      emptyLog.remove();
    }

    const row = parentDocument.createElement("details");
    const summary = parentDocument.createElement("summary");
    const index = eventLog.querySelectorAll(".event-row").length + 1;
    const number = parentDocument.createElement("span");
    const label = parentDocument.createElement("strong");
    const time = parentDocument.createElement("time");
    const pre = parentDocument.createElement("pre");

    row.className = "event-row";
    row.dataset.lightGameFallback = "true";
    number.textContent = String(index);
    label.textContent = normalizedMessage.type;
    time.textContent = new Date().toLocaleTimeString();
    pre.textContent = JSON.stringify(normalizedMessage.payload || {}, null, 2);
    summary.append(number, label, time);
    row.append(summary, pre);
    eventLog.prepend(row);
  }

  function mirrorBridgeMessageToHub(message) {
    window.setTimeout(() => {
      try {
        if (!window.parent || window.parent === window || !window.parent.document) {
          return;
        }

        const parentDocument = window.parent.document;
        const eventLog = parentDocument.getElementById("hub-event-log");
        const resultJson = parentDocument.getElementById("latest-result-json");
        if (!eventLog && !resultJson) {
          return;
        }

        const normalizedMessage = normalizeBridgeMessageForHub(message);
        const isResultEvent = normalizedMessage.type === "SESSION_COMPLETE" || normalizedMessage.type === "SESSION_ABORT";
        const sessionId = normalizedMessage.payload && (normalizedMessage.payload.session_id || normalizedMessage.payload.sessionId);
        const resultAlreadyRendered = Boolean(
          isResultEvent
          && resultJson
          && sessionId
          && resultJson.textContent
          && resultJson.textContent.includes(sessionId)
        );
        const eventAlreadyRendered = Boolean(
          eventLog
          && eventLog.querySelector(".event-row")
          && !hubMirrorFallbackActive
        );

        if (!isResultEvent && eventAlreadyRendered) {
          return;
        }
        if (isResultEvent && resultAlreadyRendered) {
          return;
        }

        hubMirrorFallbackActive = true;
        appendMirroredHubEvent(parentDocument, normalizedMessage);

        if (isResultEvent && resultJson) {
          resultJson.textContent = JSON.stringify({
            type: normalizedMessage.type,
            payload: normalizedMessage.payload || {}
          }, null, 2);
          const saveResultButton = parentDocument.getElementById("save-result-button");
          if (saveResultButton) {
            saveResultButton.disabled = false;
          }
        }
      } catch (error) {
        if (window.console) {
          console.warn("[light game bridge] hub fallback skipped", error);
        }
      }
    }, 160);
  }

  function scheduleReturnToHub() {
    window.setTimeout(returnToHub, 900);
  }

  function resolveSessionEventType(result) {
    if (result && result.status === "completed") {
      return "SESSION_COMPLETE";
    }
    if (result && result.status === "error") {
      return "GAME_ERROR";
    }
    return "SESSION_ABORT";
  }

  function updateTutorial() {
    document.querySelectorAll(".tutorial-page").forEach((page, index) => {
      page.classList.toggle("is-active", index === tutorialIndex);
    });
    document.getElementById("tutorialClose").textContent = tutorialIndex === 0 ? "닫기" : "이전";
    document.getElementById("tutorialNext").hidden = tutorialIndex !== 0;
    document.getElementById("tutorialDone").hidden = tutorialIndex !== 1;
  }

  function openTutorialOverlay(returnScreen) {
    tutorialReturnScreen = returnScreen;
    tutorialIndex = 0;
    updateTutorial();
    const howtoScreen = document.querySelector('[data-screen="howto"]');
    howtoScreen.classList.add("is-active", "is-pause-overlay");
  }

  function closeTutorialOverlay(nextScreen) {
    const howtoScreen = document.querySelector('[data-screen="howto"]');
    howtoScreen.classList.remove("is-active", "is-pause-overlay");
    if (nextScreen !== "play") {
      showScreen(nextScreen);
    }
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
      updateStageScale();
      return;
    }

    try {
      const requestResult = request.call(target, { navigationUI: "hide" });
      if (requestResult && typeof requestResult.then === "function") {
        requestResult
          .then(() => window.setTimeout(updateStageScale, 250))
          .catch(updateStageScale);
        return;
      }

      window.setTimeout(updateStageScale, 250);
    } catch (error) {
      updateStageScale();
    }
  }

  function handleFullscreenBackgroundPress(event) {
    if (
      event.target
      && typeof event.target.closest === "function"
      && event.target.closest("button, a, input, select, textarea, label")
    ) {
      return;
    }

    requestAppFullscreen();
  }

  function updateToggleControl(control, isOn) {
    if (control.matches('input[type="checkbox"]')) {
      control.checked = isOn;
      return;
    }

    if (control.classList.contains("pause-sound-button")) {
      control.classList.toggle("is-off", !isOn);
      control.setAttribute("aria-pressed", String(isOn));
      const toggleText = control.querySelector(".pause-toggle-visual span");
      if (toggleText) {
        toggleText.textContent = isOn ? "ON" : "OFF";
      }
      return;
    }

    control.classList.toggle("is-on", isOn);
    control.setAttribute("aria-pressed", String(isOn));
    control.textContent = isOn ? "켜짐" : "꺼짐";
  }

  function setToggle(control, isOn) {
    const labelMap = {
      music: document.getElementById("backgroundSoundLabel"),
      sfx: document.getElementById("soundLabel"),
      voice: document.getElementById("voiceGuideLabel")
    };
    const textMap = {
      music: "배경음",
      sfx: "효과음",
      voice: "안내음성"
    };
    const key = control.dataset.settingToggle;

    document.querySelectorAll('[data-setting-toggle="' + key + '"]').forEach((toggleControl) => {
      updateToggleControl(toggleControl, isOn);
    });

    if (labelMap[key]) {
      labelMap[key].textContent = textMap[key] + (isOn ? " 켬" : " 끔");
    }
  }

  function applyMelodyStartScreenLabels() {
    const startButton = document.getElementById("startButton");
    const returnButton = document.getElementById("startReturnButton");
    const howtoButton = document.querySelector('.screen-start [data-screen-target="howto"]');
    const settingsButton = document.querySelector('.screen-start [data-screen-target="settings"]');

    if (startButton) {
      startButton.innerHTML = "<span>게임 시작</span>";
    }
    if (returnButton) {
      returnButton.textContent = "게임 종료";
    }
    if (howtoButton) {
      howtoButton.textContent = "게임 방법";
    }
    if (settingsButton) {
      settingsButton.innerHTML = '<span class="settings-gear" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-.5a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 .5-1a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 .5a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.22.34.42.67.6 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-.5 1z"></path></svg></span>';
      settingsButton.setAttribute("aria-label", "설정");
    }
  }

  function applyFruitDifficultyScreen() {
    const screen = document.querySelector('[data-screen="difficulty"]');
    const panel = screen ? screen.querySelector(".wide-panel") : null;
    const header = screen ? screen.querySelector(".panel-header") : null;
    const list = screen ? screen.querySelector(".difficulty-list") : null;
    const backButton = screen ? screen.querySelector('[data-screen-target="start"]') : null;
    const labels = {
      easy: { index: "0", icon: "🙂", name: "쉬움", note: "천천히 시작!" },
      normal: { index: "1", icon: "😊", name: "보통", note: "차근차근 도전!" },
      hard: { index: "2", icon: "🤩", name: "어려움", note: "집중해서 도전!" }
    };

    if (!screen || !panel || !header || !list) {
      return;
    }

    screen.classList.add("difficulty-screen");
    panel.classList.add("difficulty-content");
    header.innerHTML = '<p class="eyebrow">난이도를 골라주세요</p>';
    list.classList.add("difficulty-options");
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "난이도 선택");

    difficultyCards.forEach((card) => {
      const info = labels[card.dataset.difficulty] || labels.easy;
      card.classList.add("game-button", "difficulty-option");
      card.dataset.difficultyIndex = info.index;
      card.innerHTML = '<span class="difficulty-option-icon" aria-hidden="true">' + info.icon + '</span><strong>' + info.name + '</strong><span>' + info.note + '</span>';
    });

    if (backButton) {
      backButton.id = "difficulty-back-button";
      backButton.className = "game-button secondary-button difficulty-back-button";
      backButton.textContent = "닫기";
    }
  }

  document.querySelectorAll("[data-screen-target]").forEach((button) => {
    button.addEventListener("click", () => {
      audio.unlock();
      if (button.dataset.screenTarget !== "play") {
        game.stop();
      }
      if (button.dataset.screenTarget === "howto") {
        document.querySelector('[data-screen="howto"]').classList.remove("is-pause-overlay");
        tutorialReturnScreen = document.body.dataset.activeScreen || "start";
        tutorialIndex = 0;
        updateTutorial();
      }
      showScreen(button.dataset.screenTarget);
    });
  });

  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    group.addEventListener("click", (event) => {
      const button = event.target.closest(".choice-button");
      if (!button) {
        return;
      }
      if (group.dataset.choiceGroup === "moodBefore" && button.classList.contains("condition-mood-button")) {
        selectConditionMood(button);
        return;
      }
      group.querySelectorAll(".choice-button").forEach((choice) => choice.classList.remove("is-selected"));
      button.classList.add("is-selected");
      group.querySelectorAll(".choice-button").forEach((choice) => choice.setAttribute("aria-pressed", String(choice === button)));
    });
  });

  document.querySelectorAll(".post-condition-option").forEach((button) => {
    button.addEventListener("click", () => selectPostConditionOption(button));
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || button.classList.contains("bulb-card")) {
      return;
    }

    audio.play("button");
  }, true);

  difficultyCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectDifficulty(card.dataset.difficulty);
      if (runtime.modeConfig.showDifficultySelect) {
        startReadyCountdown();
      }
    });
  });

  conditionElements.sleepDownButton.addEventListener("click", () => changeConditionSleep(1));
  conditionElements.sleepUpButton.addEventListener("click", () => changeConditionSleep(-1));
  conditionElements.sleepDial.addEventListener("pointerdown", startConditionSleepDrag);
  conditionElements.sleepDial.addEventListener("pointermove", dragConditionSleep);
  conditionElements.sleepDial.addEventListener("pointerup", endConditionSleepDrag);
  conditionElements.sleepDial.addEventListener("pointercancel", endConditionSleepDrag);
  conditionElements.confirmButton.addEventListener("click", () => submitCondition(false));
  conditionElements.skipButton.addEventListener("click", () => submitCondition(true));
  document.querySelectorAll('[data-screen="loading"], [data-screen="start"]').forEach((screen) => {
    screen.addEventListener("click", handleFullscreenBackgroundPress);
  });
  document.getElementById("startButton").addEventListener("click", () => {
    requestAppFullscreen();
    openDifficultySelect();
  });
  document.getElementById("hintButton").addEventListener("click", () => game.showHint());
  document.getElementById("pauseButton").addEventListener("click", () => {
    audio.pauseBackground();
    audio.pauseActiveVoice();
    game.pause();
  });
  document.getElementById("resumeButton").addEventListener("click", () => {
    audio.playBackground({ fadeIn: true });
    audio.resumeActiveVoice();
    game.resume();
  });
  document.getElementById("pauseRestartButton").addEventListener("click", startReadyCountdown);
  document.getElementById("pauseHomeButton").addEventListener("click", () => game.exitToHome());
  document.getElementById("pauseHowtoButton").addEventListener("click", () => {
    document.getElementById("pauseHelpPanel").hidden = true;
    openTutorialOverlay("play");
  });
  document.getElementById("pauseHelpCloseButton").addEventListener("click", () => {
    document.getElementById("pauseHelpPanel").hidden = true;
  });
  document.getElementById("finishNext").addEventListener("click", () => updateFinishCheckPage(1));
  document.getElementById("finishBack").addEventListener("click", () => updateFinishCheckPage(0));
  document.getElementById("finishSubmit").addEventListener("click", submitFinishCheck);
  document.getElementById("finishSkip").addEventListener("click", skipFinishCheck);
  document.getElementById("resultStartButton").addEventListener("click", () => showScreen("start"));
  document.getElementById("resultHomeButton").addEventListener("click", () => finishToHost());
  document.getElementById("startReturnButton").addEventListener("click", () => requestExitToHub("start"));

  document.getElementById("tutorialClose").addEventListener("click", () => {
    if (tutorialIndex > 0) {
      tutorialIndex = 0;
      updateTutorial();
      return;
    }
    const nextScreen = tutorialReturnScreen;
    tutorialReturnScreen = "start";
    if (document.querySelector('[data-screen="howto"]').classList.contains("is-pause-overlay")) {
      closeTutorialOverlay(nextScreen);
      return;
    }
    showScreen(nextScreen);
  });
  document.getElementById("tutorialNext").addEventListener("click", () => {
    tutorialIndex = 1;
    updateTutorial();
  });
  document.getElementById("tutorialDone").addEventListener("click", () => {
    const nextScreen = tutorialReturnScreen;
    tutorialReturnScreen = "start";
    if (document.querySelector('[data-screen="howto"]').classList.contains("is-pause-overlay")) {
      closeTutorialOverlay(nextScreen);
      return;
    }
    showScreen(nextScreen);
  });

  document.querySelectorAll("[data-setting-toggle]").forEach((control) => {
    const eventName = control.matches('input[type="checkbox"]') ? "change" : "click";
    control.addEventListener(eventName, () => {
      const key = control.dataset.settingToggle;
      settings[key] = control.matches('input[type="checkbox"]') ? control.checked : !settings[key];
      setToggle(control, settings[key]);
      if (key === "sfx") {
        audio.setEnabled(settings[key]);
      }
      if (key === "music") {
        audio.setMusicEnabled(settings[key]);
      }
      if (key === "voice") {
        audio.setVoiceEnabled(settings[key]);
      }
      if (key === "score") {
        applyRuntimeMode();
      }
    });
  });

  const fullscreenButton = document.getElementById("fullscreenButton");
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", () => {
      requestAppFullscreen();
    });
  }

  window.addEventListener("resize", updateStageScale);
  window.addEventListener("orientationchange", () => {
    updateStageScale();
    window.setTimeout(updateStageScale, 160);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateStageScale);
  }
  window.addEventListener("message", (event) => {
    const data = event.data || {};

    if (data.type === "EXTERNAL_ANSWER") {
      game.handleExternalAnswer(data.payload || data);
    }
  });
  window.addEventListener("pagehide", () => handlePageBackgroundChange(true));
  window.addEventListener("beforeunload", () => handlePageBackgroundChange(true));
  window.addEventListener("pageshow", () => {
    handlePageBackgroundChange(document.visibilityState === "hidden");
  });
  document.addEventListener("visibilitychange", () => {
    handlePageBackgroundChange(document.visibilityState === "hidden");
  });

  updateStageScale();
  applyRuntimeMode();
  applyMelodyStartScreenLabels();
  applyFruitDifficultyScreen();
  selectDifficulty(currentDifficulty);
  renderConditionSleepDial();
  updateTutorial();
  sendBridgeMessage({
    schemaVersion: "1.0.0",
    sentAt: new Date().toISOString(),
    sessionId: sessionMeta.sessionId,
    session_id: sessionMeta.sessionId,
    contentId: sessionMeta.contentId,
    content_id: sessionMeta.contentId,
    gameKey: sessionMeta.gameKey,
    game_key: sessionMeta.gameKey,
    game_version: sessionMeta.gameVersion,
    play_source: sessionMeta.playSource,
    status: "ready",
    mode: runtime.mode,
    app_mode: runtime.mode,
    difficulty: currentDifficulty
  }, "GAME_READY");
  waitForLandscapeOrientation().then(() => loadDeferredGameAssets()).then(() => {
    registerPlayBulbAssets();
    startLoading();
  });
})();
