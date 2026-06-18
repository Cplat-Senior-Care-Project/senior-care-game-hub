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
    const paths = ["assets/images/turn_on.png", "assets/images/turn_off.png"];
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
    voice: true,
    score: true
  };

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
      showFinishCheck(pendingResult);
    }
  });

  function updateStageScale() {
    const viewport = window.visualViewport;
    const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || STAGE_WIDTH;
    const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || STAGE_HEIGHT;
    const scale = Math.max(0.01, Math.min(viewportWidth / STAGE_WIDTH, viewportHeight / STAGE_HEIGHT));
    const horizontalGutter = Math.max(0, (viewportWidth - (STAGE_WIDTH * scale)) / (2 * scale));
    const verticalGutter = Math.max(0, (viewportHeight - (STAGE_HEIGHT * scale)) / (2 * scale));

    document.documentElement.style.setProperty("--game-scale", String(scale));
    document.documentElement.style.setProperty("--stage-scale", String(scale));
    document.documentElement.style.setProperty("--game-viewport-right-gutter", horizontalGutter + "px");
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
      if (!orientationAutoPauseActive && canPauseForOrientationGuard()) {
        orientationAutoPauseActive = true;
        game.pause();
      }
      return;
    }

    if (!orientationAutoPauseActive) {
      return;
    }

    orientationAutoPauseActive = false;
    game.resume();
  }

  function showScreen(name) {
    document.body.dataset.activeScreen = name;
    screenElements.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
    if (name !== "play") {
      clearForcedPlayScreen();
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
          if (runtime.modeConfig.showConditionCheck) {
            openConditionCheck();
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
    toggleOptional(".optional-howto", runtime.modeConfig.showHowTo);
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

  function startGame() {
    if (isPortraitViewport()) {
      waitForLandscapeOrientation().then(startGame);
      return;
    }

    audio.unlock();
    pendingResult = null;
    closeFinishCheck();
    document.getElementById("pauseHelpPanel").hidden = true;
    showScreen("play");
    sendBridgeMessage({
      schemaVersion: "1.0.0",
      sentAt: new Date().toISOString(),
      sessionId: sessionMeta.sessionId,
      contentId: sessionMeta.contentId,
      gameKey: sessionMeta.gameKey,
      type: "GAME_STARTED",
      status: "started",
      mode: runtime.mode,
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
    startGame();
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
    if (!runtime.modeConfig.showFinishCheck || finishCheckState.checkShown) {
      markFinishCheckSkipped();
      showResult(pendingResult);
      return;
    }

    finishCheckState.checkShown = true;
    updateFinishCheckPage(0);
    document.getElementById("pauseOverlay").hidden = true;
    document.getElementById("pauseHelpPanel").hidden = true;
    if (postConditionModal) {
      postConditionModal.classList.remove("is-hidden");
    }
  }

  function closeFinishCheck() {
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
    closeFinishCheck();
    renderResult(result);
    showScreen("result");

    if (runtime.modeConfig.autoReturnMs) {
      setTimeout(() => {
        finishToHost();
      }, runtime.modeConfig.autoReturnMs);
    }
  }

  function renderResult(result) {
    const safeResult = result || {};
    document.getElementById("resultTotal").textContent = safeResult.total_questions || 0;
    document.getElementById("resultCorrect").textContent = safeResult.correct_count || 0;
    document.getElementById("resultRate").textContent = (safeResult.success_rate || 0) + "%";
    document.getElementById("resultHintCount").textContent = (safeResult.hint_triggered_count || 0) + "회";
    document.getElementById("resultCompare").textContent = "오늘 첫 기록을 남겼어요";
    document.getElementById("resultMessage").textContent = safeResult.exitReason === "total_timeout"
      ? "정해진 시간이 지나 활동을 마쳤어요."
      : "천천히 집중해주신 것만으로도 참 좋습니다.";
    applyRuntimeMode();
  }

  function formatSeconds(milliseconds) {
    const seconds = Math.max(0, milliseconds / 1000);
    return seconds.toFixed(seconds >= 10 ? 0 : 1) + "초";
  }

  function finishToHost() {
    sendBridgeMessage(window.__LAST_GAME_RESULT__ || pendingResult, (window.__LAST_GAME_RESULT__ || pendingResult || {}).type || "GAME_COMPLETED");
    closeFinishCheck();
    showScreen("start");
  }

  function sendBridgeMessage(result, fallbackType) {
    const payload = result && result.schemaVersion ? result : { type: fallbackType, result: result || null };

    try {
      window.parent.postMessage(payload, "*");
    } catch (error) {
      if (payload && payload.resultDetail) {
        payload.completeSendFailed = true;
      }
      console.error("completeSendFailed", error);
    }
  }

  function updateTutorial() {
    document.querySelectorAll(".tutorial-page").forEach((page, index) => {
      page.classList.toggle("is-active", index === tutorialIndex);
    });
    document.getElementById("tutorialClose").textContent = tutorialIndex === 0 ? "닫기" : "이전";
    document.getElementById("tutorialNext").hidden = tutorialIndex !== 0;
    document.getElementById("tutorialDone").hidden = tutorialIndex !== 1;
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

  difficultyCards.forEach((card) => {
    card.addEventListener("click", () => {
      selectDifficulty(card.dataset.difficulty);
      if (runtime.modeConfig.showDifficultySelect) {
        startGame();
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
  document.getElementById("startButton").addEventListener("click", openDifficultySelect);
  document.getElementById("hintButton").addEventListener("click", () => game.showHint());
  document.getElementById("pauseButton").addEventListener("click", () => game.pause());
  document.getElementById("resumeButton").addEventListener("click", () => game.resume());
  document.getElementById("pauseRestartButton").addEventListener("click", startGame);
  document.getElementById("pauseHomeButton").addEventListener("click", () => game.exitToHome());
  document.getElementById("pauseHowtoButton").addEventListener("click", () => {
    document.getElementById("pauseHelpPanel").hidden = false;
  });
  document.getElementById("pauseHelpCloseButton").addEventListener("click", () => {
    document.getElementById("pauseHelpPanel").hidden = true;
  });
  document.getElementById("finishNext").addEventListener("click", () => updateFinishCheckPage(1));
  document.getElementById("finishBack").addEventListener("click", () => updateFinishCheckPage(0));
  document.getElementById("finishSubmit").addEventListener("click", submitFinishCheck);
  document.getElementById("finishSkip").addEventListener("click", skipFinishCheck);
  document.getElementById("resultStartButton").addEventListener("click", () => showScreen("start"));
  document.getElementById("resultHomeButton").addEventListener("click", finishToHost);
  document.getElementById("startReturnButton").addEventListener("click", finishToHost);

  document.getElementById("tutorialClose").addEventListener("click", () => {
    if (tutorialIndex > 0) {
      tutorialIndex = 0;
      updateTutorial();
      return;
    }
    const nextScreen = tutorialReturnScreen;
    tutorialReturnScreen = "start";
    showScreen(nextScreen);
  });
  document.getElementById("tutorialNext").addEventListener("click", () => {
    tutorialIndex = 1;
    updateTutorial();
  });
  document.getElementById("tutorialDone").addEventListener("click", () => {
    const nextScreen = tutorialReturnScreen;
    tutorialReturnScreen = "start";
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
      if (key === "score") {
        applyRuntimeMode();
      }
    });
  });

  const fullscreenButton = document.getElementById("fullscreenButton");
  if (fullscreenButton) {
    fullscreenButton.addEventListener("click", () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        return;
      }
      document.documentElement.requestFullscreen();
    });
  }

  window.addEventListener("resize", updateStageScale);
  window.addEventListener("orientationchange", updateStageScale);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateStageScale);
  }
  window.addEventListener("message", (event) => {
    const data = event.data || {};

    if (data.type === "EXTERNAL_ANSWER") {
      game.handleExternalAnswer(data.payload || data);
    }
  });

  updateStageScale();
  applyRuntimeMode();
  applyMelodyStartScreenLabels();
  applyFruitDifficultyScreen();
  selectDifficulty(currentDifficulty);
  renderConditionSleepDial();
  updateTutorial();
  waitForLandscapeOrientation().then(() => loadDeferredGameAssets()).then(() => {
    registerPlayBulbAssets();
    startLoading();
  });
})();
