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
  let conditionData = runtime.modeConfig.showConditionCheck ? {} : { skipped: true };
  let tutorialReturnScreen = "start";
  registerPlayBulbAssets();

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
    score: true,
    theme: "bulb"
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
      hintCount: document.getElementById("hintCount"),
      statusMessage: document.getElementById("statusMessage"),
      pauseButton: document.getElementById("pauseButton"),
      pauseOverlay: document.getElementById("pauseOverlay"),
      resultNotice: document.getElementById("resultNotice")
    },
    onFinish: (result) => {
      pendingResult = result;
      if (runtime.modeConfig.showFinishCheck) {
        showScreen("finish-check");
      } else {
        showResult(result);
      }
    },
    onExit: (result) => {
      sendBridgeMessage(result || window.__LAST_GAME_RESULT__, "GAME_ABANDONED");
      showScreen("start");
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
    document.body.classList.toggle("is-portrait", viewportHeight > viewportWidth);
  }

  function showScreen(name) {
    document.body.dataset.activeScreen = name;
    screenElements.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
    if (name === "play") {
      forcePlayScreenVisible();
    } else {
      clearForcedPlayScreen();
    }
  }

  function setImportantStyle(element, property, value) {
    if (!element) {
      return;
    }
    element.style.setProperty(property, value, "important");
  }

  function forcePlayScreenVisible() {
    const playScreen = document.querySelector('[data-screen="play"]');
    if (!playScreen) {
      return;
    }

    const gameStage = document.getElementById("gameStage");
    const portraitLock = document.querySelector(".portrait-lock");
    document.body.classList.remove("is-portrait");
    setImportantStyle(gameStage, "visibility", "visible");
    setImportantStyle(gameStage, "opacity", "1");
    setImportantStyle(portraitLock, "display", "none");

    setImportantStyle(playScreen, "display", "block");
    setImportantStyle(playScreen, "visibility", "visible");
    setImportantStyle(playScreen, "opacity", "1");

    [
      [".game-hud", "grid"],
      [".play-prompt", "flex"],
      [".play-area", "flex"],
      [".progress-row", "block"],
      [".pause-button", "flex"]
    ].forEach(([selector, display]) => {
      const element = playScreen.querySelector(selector);
      setImportantStyle(element, "display", display);
      setImportantStyle(element, "visibility", "visible");
      setImportantStyle(element, "opacity", "1");
    });
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
    const startedAt = performance.now();

    function update(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
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
        if (runtime.modeConfig.showConditionCheck) {
          openConditionCheck();
          return;
        }

        showScreen("start");
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
    audio.unlock();
    pendingResult = null;
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
      themeKey: settings.theme,
      condition: conditionData,
      sessionMeta
    });
    forcePlayScreenVisible();
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
    const finishData = collectChoices(document.querySelector('[data-screen="finish-check"]'));
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

  function skipFinishCheck() {
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
    showResult(pendingResult);
  }

  function showResult(result) {
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
    document.getElementById("resultTotal").textContent = (safeResult.total_questions || 0) + "개";
    document.getElementById("resultCorrect").textContent = (safeResult.correct_count || 0) + "개";
    document.getElementById("resultWrong").textContent = (safeResult.wrong_count || 0) + "개";
    document.getElementById("resultRate").textContent = (safeResult.success_rate || 0) + "%";
    document.getElementById("resultAverage").textContent = formatSeconds(safeResult.average_response_time_ms || 0);
    document.getElementById("resultTotalTime").textContent = formatSeconds(safeResult.totalPlayTimeMs || 0);
    document.getElementById("resultDifficulty").textContent = DIFFICULTY_CONFIG[safeResult.effectiveDifficulty || safeResult.difficulty || currentDifficulty].label;
    document.getElementById("resultHints").textContent = (safeResult.hint_triggered_count || 0) + "회";
    document.getElementById("resultNotice").textContent = safeResult.exitReason === "total_timeout" ? "정해진 시간이 지나 활동을 마쳤어요." : "";
    applyRuntimeMode();
  }

  function formatSeconds(milliseconds) {
    const seconds = Math.max(0, milliseconds / 1000);
    return seconds.toFixed(seconds >= 10 ? 0 : 1) + "초";
  }

  function finishToHost() {
    sendBridgeMessage(window.__LAST_GAME_RESULT__ || pendingResult, (window.__LAST_GAME_RESULT__ || pendingResult || {}).type || "GAME_COMPLETED");
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
    document.getElementById("tutorialProgress").textContent = tutorialIndex + 1 + " / 5";
    document.getElementById("tutorialPrev").disabled = tutorialIndex === 0;
    document.getElementById("tutorialNext").hidden = tutorialIndex === 4;
    document.getElementById("tutorialDone").hidden = tutorialIndex !== 4;
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

    if (control.matches('input[type="checkbox"]')) {
      control.checked = isOn;
    } else {
      control.classList.toggle("is-on", isOn);
      control.setAttribute("aria-pressed", String(isOn));
      control.textContent = isOn ? "켜짐" : "꺼짐";
    }

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
  document.getElementById("pauseHomeButton").addEventListener("click", () => game.exitToHome());
  document.getElementById("pauseHowtoButton").addEventListener("click", () => {
    tutorialReturnScreen = "play";
    showScreen("howto");
  });
  document.getElementById("finishSubmit").addEventListener("click", submitFinishCheck);
  document.getElementById("finishSkip").addEventListener("click", skipFinishCheck);
  document.getElementById("playAgainButton").addEventListener("click", startGame);
  document.getElementById("resultHomeButton").addEventListener("click", finishToHost);
  document.getElementById("startReturnButton").addEventListener("click", finishToHost);

  document.getElementById("tutorialPrev").addEventListener("click", () => {
    tutorialIndex = Math.max(0, tutorialIndex - 1);
    updateTutorial();
  });
  document.getElementById("tutorialNext").addEventListener("click", () => {
    tutorialIndex = Math.min(4, tutorialIndex + 1);
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

  const themeButtons = document.getElementById("themeButtons");
  if (themeButtons) {
    themeButtons.addEventListener("click", (event) => {
      const button = event.target.closest(".theme-button");
      if (!button) {
        return;
      }
      settings.theme = button.dataset.theme;
      document.body.dataset.theme = settings.theme;
      document.querySelectorAll(".theme-button").forEach((item) => item.classList.toggle("is-selected", item === button));
    });
  }

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
  startLoading();
})();
