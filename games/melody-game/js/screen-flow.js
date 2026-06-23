(function () {
  "use strict";

  class MelodyScreenFlow {
    constructor(options) {
      this.audio = options.audio;
      this.game = options.game;
      this.app = document.getElementById("app");
      this.screens = Array.from(document.querySelectorAll(".screen"));
      this.homeScreen = document.getElementById("homeScreen");
      this.loadingFill = document.getElementById("loadingFill");
      this.loadingPercent = document.getElementById("loadingPercent");
      this.backgroundSoundToggle = document.getElementById("background-sound-toggle");
      this.backgroundSoundLabel = document.getElementById("background-sound-label");
      this.soundToggle = document.getElementById("sound-toggle");
      this.soundLabel = document.getElementById("sound-label");
      this.voiceGuideToggle = document.getElementById("voice-guide-toggle");
      this.voiceGuideLabel = document.getElementById("voice-guide-label");
      this.pauseBackgroundSoundButton = document.getElementById("pause-background-sound-button");
      this.pauseSoundButton = document.getElementById("pause-sound-button");
      this.pauseVoiceGuideButton = document.getElementById("pause-voice-guide-button");
      this.difficultyCards = Array.from(document.querySelectorAll("[data-difficulty]"));
      this.startGameButton = document.getElementById("startGameButton");
      this.difficultyStartButton = document.getElementById("difficultyStartButton");
      this.exitGameButton = document.getElementById("exitGameButton");
      this.retryButton = document.getElementById("retryButton");
      this.homeButton = document.getElementById("homeButton");
      this.hostReturnButton = document.getElementById("hostReturnButton");
      this.howtoScreen = document.getElementById("howtoScreen");
      this.howtoPageOne = document.querySelector(".howto-page-one");
      this.howtoPageTwo = document.querySelector(".howto-page-two");
      this.howtoNextButton = document.getElementById("howtoNextButton");
      this.howtoPrevButton = null;
      this.howtoReturnScreen = "home";
      this.playScreen = document.getElementById("playScreen");
      this.playTopbar = this.playScreen ? this.playScreen.querySelector(".play-topbar") : null;
      this.progressWrap = this.playScreen ? this.playScreen.querySelector(".progress-wrap") : null;
      this.playCenter = this.playScreen ? this.playScreen.querySelector(".play-center") : null;
      this.padArea = document.getElementById("padArea");
      this.pauseButton = document.getElementById("pauseButton");
      this.gameCountdown = document.getElementById("game-countdown");
      this.gameCountdownMessage = document.getElementById("game-countdown-message");
      this.gameCountdownTimer = document.querySelector(".game-countdown-timer");
      this.gameCountdownNumber = document.getElementById("game-countdown-number");
      this.conditionSleepHours = [4, 5, 6, 7, 8, 9, 10, 11, 12];
      this.conditionSleepDragStepPx = 42;
      this.conditionElements = {
        moodButtons: Array.from(document.querySelectorAll(".condition-mood-button")),
        sleepDial: document.querySelector(".condition-sleep-dial"),
        sleepRows: document.getElementById("conditionSleepRows"),
        sleepUpButton: document.getElementById("sleepUp"),
        sleepDownButton: document.getElementById("sleepDown"),
        skipButton: document.getElementById("conditionSkip"),
        confirmButton: document.getElementById("conditionSubmit")
      };
      this.postConditionModal = document.getElementById("post-condition-modal");
      this.finishNextButton = document.getElementById("finishNext");
      this.finishBackButton = document.getElementById("finishBack");
      this.finishSubmitButton = document.getElementById("finishSubmit");
      this.finishSkipButton = document.getElementById("finishSkip");
      this.selectedDifficulty = (window.MelodyRuntime && window.MelodyRuntime.runtime.difficulty) || "normal";
      this.loadingComplete = false;
      this.orientationAutoPauseActive = false;
      this.orientationMusicPauseActive = false;
      this.conditionData = { skipped: true };
      this.conditionNextAction = "home";
      this.conditionCheckHandled = false;
      this.conditionState = {
        mood: "good",
        sleepIndex: 3,
        sleepDrag: {
          pointerId: null,
          lastStepY: 0
        }
      };
      this.pendingResult = null;
      this.pendingResultOptions = null;
      this.finishCheckPage = 0;
      this.finishCheckShown = false;
      this.countdownIntroDuration = 2000;
      this.countdownDuration = 3000;
      this.countdownIntroHandle = null;
      this.countdownFrameHandle = null;
      this.countdownActive = false;
      this.pendingCountdownRuntime = null;
      this.resultHubReturnHandle = null;
    }

    init() {
      this.prepareHowtoPages();
      this.bindEvents();
      this.loadSettings();
      this.selectDifficulty(this.selectedDifficulty, false);
      this.updateScaleVariable();
      this.applyRuntimeUi();
      this.startLoading();

      if (window.DisplayBridge) {
        window.DisplayBridge.requestDisplay("load");
      }
    }

    bindEvents() {
      document.querySelectorAll("[data-go]").forEach((button) => {
        button.addEventListener("pointerup", () => {
          const target = button.dataset.go;
          this.audio.playClick();
          this.handleScreenNavigation(target);
        });
      });

      this.difficultyCards.forEach((card) => {
        card.addEventListener("pointerup", () => {
          this.selectDifficulty(card.dataset.difficulty, true);
          this.beginGame();
        });
      });

      this.startGameButton && this.startGameButton.addEventListener("pointerup", () => {
        this.handleStartGameAction();
      });
      this.homeScreen && this.homeScreen.addEventListener("pointerup", (event) => this.handleHomeBackgroundPress(event));
      this.difficultyStartButton && this.difficultyStartButton.addEventListener("pointerup", () => this.beginGame());
      this.exitGameButton && this.exitGameButton.addEventListener("pointerup", () => this.handleExitAction());
      this.retryButton && this.retryButton.addEventListener("pointerup", () => this.beginGame());
      this.homeButton && this.homeButton.addEventListener("pointerup", () => this.handleHomeAction());
      this.hostReturnButton && this.hostReturnButton.addEventListener("pointerup", () => this.handleHostReturnAction());
      this.howtoNextButton && this.howtoNextButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.showHowtoPage(2);
      });
      this.howtoPrevButton && this.howtoPrevButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.showHowtoPage(1);
      });
      this.conditionElements.moodButtons.forEach((button) => {
        button.addEventListener("pointerup", () => {
          this.audio.playClick();
          this.selectConditionMood(button);
        });
      });
      this.conditionElements.sleepUpButton && this.conditionElements.sleepUpButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.changeConditionSleep(1);
      });
      this.conditionElements.sleepDownButton && this.conditionElements.sleepDownButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.changeConditionSleep(-1);
      });
      this.conditionElements.sleepDial && this.conditionElements.sleepDial.addEventListener("pointerdown", (event) => this.startConditionSleepDrag(event));
      this.conditionElements.sleepDial && this.conditionElements.sleepDial.addEventListener("pointermove", (event) => this.dragConditionSleep(event));
      this.conditionElements.sleepDial && this.conditionElements.sleepDial.addEventListener("pointerup", (event) => this.endConditionSleepDrag(event));
      this.conditionElements.sleepDial && this.conditionElements.sleepDial.addEventListener("pointercancel", (event) => this.endConditionSleepDrag(event));
      this.conditionElements.confirmButton && this.conditionElements.confirmButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.submitCondition(false);
      });
      this.conditionElements.skipButton && this.conditionElements.skipButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.submitCondition(true);
      });
      document.querySelectorAll(".post-condition-option").forEach((button) => {
        button.addEventListener("pointerup", () => {
          this.audio.playClick();
          this.selectPostConditionOption(button);
        });
      });
      this.finishNextButton && this.finishNextButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.updateFinishCheckPage(1);
      });
      this.finishBackButton && this.finishBackButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.updateFinishCheckPage(0);
      });
      this.finishSubmitButton && this.finishSubmitButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.submitFinishCheck();
      });
      this.finishSkipButton && this.finishSkipButton.addEventListener("pointerup", () => {
        this.audio.playClick();
        this.skipFinishCheck();
      });

      this.backgroundSoundToggle && this.backgroundSoundToggle.addEventListener("change", () => this.applySettings());
      this.soundToggle && this.soundToggle.addEventListener("change", () => this.applySettings());
      this.voiceGuideToggle && this.voiceGuideToggle.addEventListener("change", () => this.applySettings());
      this.pauseBackgroundSoundButton && this.pauseBackgroundSoundButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.backgroundSoundToggle));
      this.pauseSoundButton && this.pauseSoundButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.soundToggle));
      this.pauseVoiceGuideButton && this.pauseVoiceGuideButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.voiceGuideToggle));
      window.addEventListener("resize", () => this.updateScaleVariable());
      window.addEventListener("orientationchange", () => this.updateScaleVariable());
      window.addEventListener("pointerdown", () => this.syncBackgroundMusic(), { passive: true });
      window.addEventListener("touchstart", () => this.syncBackgroundMusic(), { passive: true });
      window.addEventListener("pointerup", () => this.syncBackgroundMusic());
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", () => this.updateScaleVariable());
      }
      window.addEventListener("melody-drum:go-home", () => this.showScreen("home"));
      window.addEventListener("melody-runtime:changed", () => this.applyRuntimeUi());
    }

    storageGet(key) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        return null;
      }
    }

    storageSet(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        return false;
      }
      return true;
    }

    requestDisplayFromGesture(source) {
      if (window.DisplayBridge) {
        window.DisplayBridge.requestDisplay(source || "user_gesture");
      }
    }

    handleHomeBackgroundPress(event) {
      if (
        event.target
        && typeof event.target.closest === "function"
        && event.target.closest("button, a, input, select, textarea, label")
      ) {
        return;
      }

      this.requestDisplayFromGesture("home_background");
    }

    showScreen(name) {
      document.body.classList.remove("is-howto-over-play");
      if (name !== "result") {
        this.clearResultHubReturn();
      }
      if (name === "howto") {
        this.showHowtoPage(1);
      }
      document.body.dataset.activeScreen = name;
      this.screens.forEach((screen) => {
        screen.classList.toggle("is-active", screen.dataset.screen === name);
      });
      this.applyPlayStatusLayout();
      this.syncBackgroundMusic();
    }

    handleScreenNavigation(target) {
      if (target === "difficulty" && !this.shouldShowDifficultySelect()) {
        this.beginGame();
        return;
      }

      if (target === "howto") {
        if (this.isScreenActive("play")) {
          this.howtoReturnScreen = "play";
          this.showHowtoOverPlay();
          return;
        }

        this.howtoReturnScreen = "home";
        this.showScreen("howto");
        return;
      }

      if (target === "home" && this.isScreenActive("howto") && this.howtoReturnScreen === "play") {
        this.closeHowtoOverPlay();
        this.howtoReturnScreen = "home";
        return;
      }

      this.howtoReturnScreen = "home";
      this.showScreen(target);
    }

    shouldShowDifficultySelect() {
      const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime ? window.MelodyRuntime.runtime : {};
      return Boolean(runtime.showDifficultySelect);
    }

    isScreenActive(name) {
      return this.screens.some((screen) => screen.dataset.screen === name && screen.classList.contains("is-active"));
    }

    showHowtoOverPlay() {
      this.showHowtoPage(1);
      document.body.dataset.activeScreen = "play";
      document.body.classList.add("is-howto-over-play");
      this.screens.forEach((screen) => {
        const screenName = screen.dataset.screen;
        screen.classList.toggle("is-active", screenName === "play" || screenName === "howto");
      });
      this.applyPlayStatusLayout();
      this.syncBackgroundMusic();
    }

    closeHowtoOverPlay() {
      document.body.dataset.activeScreen = "play";
      document.body.classList.remove("is-howto-over-play");
      if (this.howtoScreen) {
        this.howtoScreen.classList.remove("is-active");
      }
      if (this.playScreen) {
        this.playScreen.classList.add("is-active");
      }
      this.applyPlayStatusLayout();
      this.syncBackgroundMusic();
    }

    prepareHowtoPages() {
      if (!this.howtoPageOne || !this.howtoPageTwo || this.howtoPageTwo.children.length) {
        return;
      }

      const clone = this.howtoPageOne.cloneNode(true);
      const actions = clone.querySelector(".howto-actions");
      const previewShape = clone.querySelector(".howto-preview-symbol .symbol-shape");
      const attentionText = clone.querySelector(".howto-attention-text");
      const tapHand = clone.querySelector(".howto-tap-hand");

      if (tapHand) {
        tapHand.remove();
      }

      if (attentionText) {
        attentionText.textContent = "X가 나오면 누르지 말고 기다리세요!";
      }

      if (previewShape) {
        previewShape.className = "symbol-shape shape-x";
      }

      if (actions) {
        actions.className = "howto-actions howto-actions-final";
        actions.innerHTML = [
          '<button id="howtoPrevButton" class="secondary-button howto-action-button howto-close-button" type="button">이전</button>',
          '<button class="secondary-button howto-action-button howto-close-button howto-green-button" type="button" data-go="home">닫기</button>'
        ].join("");
      }

      this.howtoPageTwo.replaceChildren(...Array.from(clone.childNodes));
      this.howtoPrevButton = document.getElementById("howtoPrevButton");
    }

    showHowtoPage(pageNumber) {
      const showSecondPage = Number(pageNumber) === 2;
      if (this.howtoPageOne) {
        this.howtoPageOne.classList.toggle("is-active", !showSecondPage);
        this.howtoPageOne.setAttribute("aria-hidden", String(showSecondPage));
      }
      if (this.howtoPageTwo) {
        this.howtoPageTwo.classList.toggle("is-active", showSecondPage);
        this.howtoPageTwo.setAttribute("aria-hidden", String(!showSecondPage));
      }
    }

    shouldShowConditionCheck() {
      const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime ? window.MelodyRuntime.runtime : {};
      return Boolean(runtime.showConditionCheck);
    }

    shouldShowFinishCheck() {
      const runtime = window.MelodyRuntime && window.MelodyRuntime.runtime ? window.MelodyRuntime.runtime : {};
      return Boolean(runtime.showFinishCheck);
    }

    createGameRuntime() {
      const conditionCheck = this.shouldShowConditionCheck() ? this.conditionData : { skipped: true };
      const runtime = {
        ...window.MelodyRuntime.runtimeSnapshot(),
        conditionCheck,
        condition_check: conditionCheck
      };
      this.selectedDifficulty = runtime.difficulty || this.selectedDifficulty;
      this.selectDifficulty(this.selectedDifficulty, false);
      return runtime;
    }

    sleepIndexAt(offset) {
      const length = this.conditionSleepHours.length;
      return (this.conditionState.sleepIndex + offset + length) % length;
    }

    selectedConditionSleepHours() {
      return this.conditionSleepHours[this.conditionState.sleepIndex];
    }

    renderConditionSleepDial() {
      const sleepRows = this.conditionElements.sleepRows;
      if (!sleepRows) {
        return;
      }

      sleepRows.replaceChildren();
      [-1, 0, 1].forEach((offset) => {
        const row = document.createElement("span");
        const number = document.createElement("span");
        const unit = document.createElement("span");

        row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
        number.className = "condition-sleep-number";
        number.textContent = String(this.conditionSleepHours[this.sleepIndexAt(offset)]);
        unit.className = "condition-sleep-unit";
        unit.textContent = "시간";
        row.append(number, unit);
        sleepRows.appendChild(row);
      });
    }

    changeConditionSleep(delta) {
      const length = this.conditionSleepHours.length;
      this.conditionState.sleepIndex = (this.conditionState.sleepIndex + delta + length) % length;
      this.renderConditionSleepDial();
    }

    startConditionSleepDrag(event) {
      if (!this.conditionElements.sleepDial || event.button > 0) {
        return;
      }

      event.preventDefault();
      this.conditionState.sleepDrag.pointerId = event.pointerId;
      this.conditionState.sleepDrag.lastStepY = event.clientY;
      this.conditionElements.sleepDial.classList.add("is-dragging");

      if (typeof this.conditionElements.sleepDial.setPointerCapture === "function") {
        this.conditionElements.sleepDial.setPointerCapture(event.pointerId);
      }
    }

    dragConditionSleep(event) {
      const dragState = this.conditionState.sleepDrag;
      if (dragState.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const deltaY = event.clientY - dragState.lastStepY;
      const steps = Math.trunc(Math.abs(deltaY) / this.conditionSleepDragStepPx);

      if (steps < 1) {
        return;
      }

      const direction = deltaY > 0 ? -1 : 1;
      dragState.lastStepY += direction * -steps * this.conditionSleepDragStepPx;
      this.changeConditionSleep(direction * steps);
    }

    endConditionSleepDrag(event) {
      const sleepDial = this.conditionElements.sleepDial;
      if (this.conditionState.sleepDrag.pointerId !== event.pointerId) {
        return;
      }

      if (
        sleepDial
        && typeof sleepDial.releasePointerCapture === "function"
        && sleepDial.hasPointerCapture(event.pointerId)
      ) {
        sleepDial.releasePointerCapture(event.pointerId);
      }

      this.conditionState.sleepDrag.pointerId = null;
      this.conditionState.sleepDrag.lastStepY = 0;

      if (sleepDial) {
        sleepDial.classList.remove("is-dragging");
      }
    }

    selectConditionMood(button) {
      this.conditionState.mood = button.dataset.mood || "good";
      this.conditionElements.moodButtons.forEach((moodButton) => {
        const isSelected = moodButton === button;
        moodButton.classList.toggle("is-selected", isSelected);
        moodButton.setAttribute("aria-pressed", String(isSelected));
      });
    }

    openConditionCheck(nextAction) {
      this.conditionNextAction = nextAction || "home";
      this.renderConditionSleepDial();
      this.showScreen("condition");
    }

    submitCondition(skip) {
      this.conditionCheckHandled = true;
      this.conditionData = skip
        ? { skipped: true }
        : {
            moodBefore: this.conditionState.mood,
            sleepHours: this.selectedConditionSleepHours(),
            skipped: false
          };

      if (this.conditionNextAction === "autoStart") {
        this.beginGame();
        return;
      }

      this.showScreen("home");
    }

    collectPostConditionChoices() {
      const finishData = {};
      document.querySelectorAll(".post-condition-option.is-selected").forEach((button) => {
        finishData[button.dataset.postField] = button.dataset.postValue;
      });
      return finishData;
    }

    updateFinishCheckPage(pageIndex) {
      this.finishCheckPage = Math.max(0, Math.min(1, pageIndex));
      document.querySelectorAll("[data-post-condition-page]").forEach((page) => {
        page.hidden = Number(page.dataset.postConditionPage) !== this.finishCheckPage;
      });
      document.querySelectorAll(".post-condition-dot").forEach((dot, index) => {
        dot.classList.toggle("is-active", index === this.finishCheckPage);
      });
    }

    selectPostConditionOption(button) {
      const field = button.dataset.postField;
      document.querySelectorAll(`.post-condition-option[data-post-field="${field}"]`).forEach((option) => {
        const isSelected = option === button;
        option.classList.toggle("is-selected", isSelected);
        option.setAttribute("aria-pressed", String(isSelected));
      });
    }

    closeFinishCheck() {
      document.body.classList.remove("is-finish-check-visible");
      if (this.postConditionModal) {
        this.postConditionModal.classList.add("is-hidden");
      }
    }

    markFinishCheckSkipped() {
      if (!this.pendingResult) {
        return;
      }

      this.pendingResult.finish_check = { skipped: true };
      this.pendingResult.finish_check_skipped = true;
      if (this.pendingResult.condition) {
        this.pendingResult.condition.after = null;
      }
      window.__LAST_GAME_RESULT__ = this.pendingResult;
    }

    submitFinishCheck() {
      const finishData = this.collectPostConditionChoices();
      if (this.pendingResult) {
        this.pendingResult.finish_check = finishData;
        this.pendingResult.finish_check_skipped = false;
        this.pendingResult.moodAfter = finishData.moodAfter;
        this.pendingResult.fatigue = finishData.fatigue;
        this.pendingResult.perceivedDifficulty = finishData.perceivedDifficulty;
        this.pendingResult.neededHelp = finishData.neededHelp;
        this.pendingResult.replayIntent = finishData.replayIntent;
        if (this.pendingResult.condition) {
          this.pendingResult.condition.after = finishData;
        }
        window.__LAST_GAME_RESULT__ = this.pendingResult;
      }
      this.completePendingResult();
    }

    skipFinishCheck() {
      this.markFinishCheckSkipped();
      this.completePendingResult();
    }

    handleGameFinish(result, options) {
      const shouldSubmit = !options || options.submit !== false;
      this.pendingResult = result || this.pendingResult || window.__LAST_GAME_RESULT__ || null;
      this.pendingResultOptions = { submit: shouldSubmit };
      const resultStatus = this.pendingResult && this.pendingResult.status || "completed";

      if (this.audio && typeof this.audio.stopBackgroundMusic === "function") {
        this.audio.stopBackgroundMusic();
      }

      if (resultStatus !== "completed" || !this.shouldShowFinishCheck() || this.finishCheckShown) {
        this.markFinishCheckSkipped();
        this.completePendingResult();
        return;
      }

      this.finishCheckShown = true;
      this.updateFinishCheckPage(0);
      document.body.classList.add("is-finish-check-visible");
      if (this.postConditionModal) {
        this.postConditionModal.classList.remove("is-hidden");
      }
      this.syncBackgroundMusic();
    }

    completePendingResult() {
      const result = this.pendingResult;
      const options = this.pendingResultOptions || {};
      const shouldSubmit = options.submit !== false;

      this.closeFinishCheck();
      window.__LAST_GAME_RESULT__ = result;
      if (result && shouldSubmit && window.ResultBridge) {
        this.submitResultToHost(result);
      }
      window.ResultManager.renderResult(result || {});
      this.showScreen("result");
      this.scheduleResultHubReturn(result);
      this.pendingResult = null;
      this.pendingResultOptions = null;
    }

    submitResultToHost(result) {
      const status = result.status || "completed";

      if (status === "error" && typeof window.ResultBridge.handleGameError === "function") {
        window.ResultBridge.handleGameError(result, result);
        return;
      }

      if (status === "abandoned" && typeof window.ResultBridge.handleSessionAbort === "function") {
        window.ResultBridge.handleSessionAbort(result, result.exit_reason || result.ended_reason || "abandoned");
        return;
      }

      window.ResultBridge.handleSessionComplete(result);
    }

    startLoading() {
      const duration = 1800;
      const startedAt = window.performance ? window.performance.now() : Date.now();
      let lastPercent = -1;

      const completeLoading = () => {
        window.setTimeout(() => {
          this.loadingComplete = true;
          const runtime = window.MelodyRuntime.runtime;
          if (this.shouldShowConditionCheck() && !this.conditionCheckHandled) {
            this.openConditionCheck(runtime.autoStart ? "autoStart" : "home");
            return;
          }
          if (runtime.autoStart) {
            this.beginGame();
            return;
          }
          this.showScreen("home");
        }, 260);
      };

      const animate = (timestamp) => {
        const now = typeof timestamp === "number" ? timestamp : Date.now();
        const elapsed = Math.max(0, now - startedAt);
        const progress = Math.min(1, elapsed / duration);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const percent = Math.min(100, Math.round(easedProgress * 100));

        if (this.loadingFill) this.loadingFill.style.width = `${easedProgress * 100}%`;
        if (this.loadingPercent && percent !== lastPercent) {
          this.loadingPercent.textContent = `${percent}%`;
          lastPercent = percent;
        }

        if (progress < 1) {
          window.requestAnimationFrame(animate);
          return;
        }

        if (this.loadingFill) this.loadingFill.style.width = "100%";
        if (this.loadingPercent) this.loadingPercent.textContent = "100%";
        completeLoading();
      };

      window.requestAnimationFrame(animate);
    }

    selectDifficulty(difficulty, updateRuntime) {
      this.selectedDifficulty = difficulty || "normal";
      this.difficultyCards.forEach((card) => {
        card.classList.toggle("is-selected", card.dataset.difficulty === this.selectedDifficulty);
      });

      if (updateRuntime && window.MelodyRuntime) {
        window.MelodyRuntime.applyRuntimeConfig({ difficulty: this.selectedDifficulty });
      }
    }

    beginGame() {
      if (this.countdownActive) {
        return;
      }

      const runtime = this.createGameRuntime();
      this.audio.ensureContext();
      this.audio.playClick();
      if (window.DisplayBridge) {
        window.DisplayBridge.requestDisplay("game_start");
      }
      this.startGameCountdown(runtime);
    }

    restartGame(difficulty) {
      if (difficulty) {
        this.selectedDifficulty = difficulty;
        if (window.MelodyRuntime) {
          window.MelodyRuntime.applyRuntimeConfig({ difficulty });
        }
        this.selectDifficulty(difficulty, false);
      }

      this.beginGame();
    }

    startGameCountdown(runtime) {
      const nextRuntime = runtime || this.createGameRuntime();
      this.closeFinishCheck();
      this.clearGameCountdown();
      this.pendingCountdownRuntime = nextRuntime;
      this.showScreen("play");
      if (this.game && typeof this.game.start === "function") {
        this.game.start(nextRuntime.difficulty || this.selectedDifficulty, nextRuntime, { startPaused: true });
      }

      if (!this.gameCountdown || !this.gameCountdownTimer || !this.gameCountdownNumber) {
        this.startGameAfterCountdown(this.pendingCountdownRuntime);
        return;
      }

      this.countdownActive = true;
      this.gameCountdown.classList.remove("is-hidden");
      this.gameCountdown.classList.add("is-intro");
      this.gameCountdown.setAttribute("aria-hidden", "false");
      this.gameCountdownNumber.textContent = "3";
      this.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");
      if (this.gameCountdownMessage) {
        this.gameCountdownMessage.textContent = "게임이 곧 시작돼요!";
      }
      this.syncBackgroundMusic();

      this.countdownIntroHandle = window.setTimeout(() => {
        this.countdownIntroHandle = null;
        this.beginCountdownNumbers();
      }, this.countdownIntroDuration);
    }

    beginCountdownNumbers() {
      if (!this.countdownActive || !this.gameCountdown || !this.gameCountdownTimer || !this.gameCountdownNumber) {
        return;
      }

      this.gameCountdown.classList.remove("is-intro");
      let startedAt = performance.now();
      let lastDisplaySeconds = null;

      const updateCountdown = (timestamp) => {
        if (!this.countdownActive) {
          return;
        }

        const now = typeof timestamp === "number" ? timestamp : performance.now();
        const elapsed = Math.max(0, now - startedAt);
        const remaining = Math.max(0, this.countdownDuration - elapsed);
        const displaySeconds = Math.max(1, Math.ceil(remaining / 1000));
        const secondProgress = (elapsed % 1000) / 1000;
        const angle = secondProgress * 360;

        this.gameCountdownNumber.textContent = String(displaySeconds);
        this.gameCountdownTimer.style.setProperty("--countdown-angle", `${angle}deg`);

        if (displaySeconds !== lastDisplaySeconds && remaining > 0) {
          lastDisplaySeconds = displaySeconds;
          if (this.audio && typeof this.audio.playCountdownTick === "function") {
            this.audio.playCountdownTick();
          }
        }

        if (remaining <= 0) {
          const runtime = this.pendingCountdownRuntime;
          this.gameCountdownTimer.style.setProperty("--countdown-angle", "360deg");
          this.clearGameCountdown();
          this.startGameAfterCountdown(runtime);
          return;
        }

        this.countdownFrameHandle = window.requestAnimationFrame(updateCountdown);
      };

      this.countdownFrameHandle = window.requestAnimationFrame((timestamp) => {
        startedAt = typeof timestamp === "number" ? timestamp : performance.now();
        updateCountdown(startedAt);
      });
    }

    clearGameCountdown() {
      if (this.countdownIntroHandle) {
        window.clearTimeout(this.countdownIntroHandle);
        this.countdownIntroHandle = null;
      }

      if (this.countdownFrameHandle) {
        window.cancelAnimationFrame(this.countdownFrameHandle);
        this.countdownFrameHandle = null;
      }

      this.countdownActive = false;
      this.pendingCountdownRuntime = null;
      if (this.gameCountdown) {
        this.gameCountdown.classList.add("is-hidden");
        this.gameCountdown.classList.remove("is-intro");
        this.gameCountdown.setAttribute("aria-hidden", "true");
      }
      if (this.gameCountdownTimer) {
        this.gameCountdownTimer.style.setProperty("--countdown-angle", "0deg");
      }
    }

    startGameAfterCountdown(runtime) {
      const resolvedRuntime = runtime || this.createGameRuntime();
      this.pendingCountdownRuntime = null;
      this.selectedDifficulty = resolvedRuntime.difficulty || this.selectedDifficulty;
      this.selectDifficulty(this.selectedDifficulty, false);
      this.showScreen("play");
      if (this.game && typeof this.game.activatePreparedGame === "function" && this.game.activatePreparedGame()) {
        return;
      }
      this.game.start(this.selectedDifficulty, resolvedRuntime);
    }

    handleStartGameAction() {
      this.requestDisplayFromGesture("home_start");

      if (this.shouldShowDifficultySelect()) {
        this.audio.playClick();
        this.showScreen("difficulty");
        return;
      }

      this.beginGame();
    }

    handleHomeAction() {
      this.audio.playClick();
      this.showScreen("home");
    }

    handleHostReturnAction() {
      this.audio.playClick();
      const runtime = window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot
        ? window.MelodyRuntime.runtimeSnapshot()
        : {};
      const mode = (window.__LAST_GAME_RESULT__ && window.__LAST_GAME_RESULT__.mode) || runtime.mode;
      if (window.ResultBridge && typeof window.ResultBridge.handleGameExitRequested === "function") {
        window.ResultBridge.handleGameExitRequested("user_complete", runtime);
      }
      if (this.shouldReturnResultToHub(mode)) {
        this.returnToHub("user_complete");
        return;
      }
      if (window.ResultBridge) {
        window.ResultBridge.returnToHost("user_complete");
      }
    }

    shouldReturnResultToHub(mode) {
      return ["reminder", "care", "ai_assisted"].includes(mode);
    }

    isEmbeddedInHost() {
      return window.parent && window.parent !== window;
    }

    scheduleResultHubReturn(result) {
      const runtime = window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot
        ? window.MelodyRuntime.runtimeSnapshot()
        : {};
      const mode = (result && result.mode) || runtime.mode;

      this.clearResultHubReturn();
      if (!this.shouldReturnResultToHub(mode)) {
        return;
      }

      this.resultHubReturnHandle = window.setTimeout(() => {
        this.resultHubReturnHandle = null;
        this.returnToHub("auto_complete");
      }, 3000);
    }

    clearResultHubReturn() {
      if (!this.resultHubReturnHandle) {
        return;
      }

      window.clearTimeout(this.resultHubReturnHandle);
      this.resultHubReturnHandle = null;
    }

    returnToHub(reason) {
      this.clearResultHubReturn();
      if (window.ResultBridge) {
        window.ResultBridge.returnToHost(reason || "user_complete");
      }
      if (this.isEmbeddedInHost()) {
        return;
      }
      window.location.href = new URL("../../index.html", window.location.href).href;
    }

    handleExitAction() {
      this.audio.playClick();
      if (window.ResultBridge && typeof window.ResultBridge.handleGameExitRequested === "function") {
        window.ResultBridge.handleGameExitRequested("user_exit");
      }
      if (window.ResultBridge) {
        window.ResultBridge.returnToHost("user_exit");
      }
      if (this.isEmbeddedInHost()) {
        return;
      }
      window.location.href = new URL("../../index.html", window.location.href).href;
    }

    loadSettings() {
      const savedBackgroundSound = this.storageGet("melodyDrumBackgroundSound");
      const savedSound = this.storageGet("melodyDrumEffectSound") || this.storageGet("melodyDrumSound");
      const savedVoiceGuide = this.storageGet("melodyDrumVoiceGuide");

      if (savedBackgroundSound !== null && this.backgroundSoundToggle) {
        this.backgroundSoundToggle.checked = savedBackgroundSound === "true";
      }

      if (savedSound !== null && this.soundToggle) {
        this.soundToggle.checked = savedSound === "true";
      }

      if (savedVoiceGuide !== null && this.voiceGuideToggle) {
        this.voiceGuideToggle.checked = savedVoiceGuide === "true";
      }

      this.applySettings();
    }

    applySettings() {
      if (this.soundToggle) this.audio.setEnabled(this.soundToggle.checked);
      if (this.backgroundSoundToggle) this.audio.setBackgroundEnabled(this.backgroundSoundToggle.checked);
      if (this.backgroundSoundLabel && this.backgroundSoundToggle) {
        this.backgroundSoundLabel.textContent = this.backgroundSoundToggle.checked ? "배경음 켬" : "배경음 끔";
      }
      if (this.soundLabel && this.soundToggle) {
        this.soundLabel.textContent = this.soundToggle.checked ? "효과음 켬" : "효과음 끔";
      }
      if (this.voiceGuideLabel && this.voiceGuideToggle) {
        this.voiceGuideLabel.textContent = this.voiceGuideToggle.checked ? "안내음성 켬" : "안내음성 끔";
      }
      if (this.backgroundSoundToggle) this.storageSet("melodyDrumBackgroundSound", String(this.backgroundSoundToggle.checked));
      if (this.soundToggle) this.storageSet("melodyDrumEffectSound", String(this.soundToggle.checked));
      if (this.voiceGuideToggle) this.storageSet("melodyDrumVoiceGuide", String(this.voiceGuideToggle.checked));
      this.updatePauseSoundButton(this.pauseBackgroundSoundButton, this.backgroundSoundToggle && this.backgroundSoundToggle.checked);
      this.updatePauseSoundButton(this.pauseSoundButton, this.soundToggle && this.soundToggle.checked);
      this.updatePauseSoundButton(this.pauseVoiceGuideButton, this.voiceGuideToggle && this.voiceGuideToggle.checked);
      this.syncBackgroundMusic();
    }

    syncBackgroundMusic() {
      if (!this.audio || typeof this.audio.startBackgroundMusic !== "function") {
        return;
      }

      if (document.body.classList.contains("is-portrait")) {
        this.audio.stopBackgroundMusic();
        return;
      }

      const activeScreen = document.body.dataset.activeScreen;
      const shouldPlay = this.loadingComplete
        && activeScreen !== "play"
        && activeScreen !== "countdown"
        && activeScreen !== "loading"
        && activeScreen !== "result"
        && !this.countdownActive
        && (!this.backgroundSoundToggle || this.backgroundSoundToggle.checked);

      if (shouldPlay) {
        this.audio.startBackgroundMusic();
      } else {
        this.audio.stopBackgroundMusic();
      }
    }

    isPortraitViewport(viewportWidth, viewportHeight) {
      const width = Number(viewportWidth) || window.innerWidth || document.documentElement.clientWidth || 1280;
      const height = Number(viewportHeight) || window.innerHeight || document.documentElement.clientHeight || 720;
      return height > width;
    }

    canPauseForOrientationGuard() {
      return document.body.dataset.activeScreen === "play"
        && this.game
        && this.game.state
        && !this.game.state.ended
        && !this.game.state.paused;
    }

    syncOrientationPause(isPortrait) {
      if (isPortrait) {
        const isBackgroundPlaying = this.audio
          && typeof this.audio.isBackgroundPlaying === "function"
          && this.audio.isBackgroundPlaying();

        if (!this.orientationMusicPauseActive && isBackgroundPlaying) {
          this.orientationMusicPauseActive = true;
          this.audio.stopBackgroundMusic();
        }

        if (!this.orientationAutoPauseActive && this.canPauseForOrientationGuard()) {
          this.orientationAutoPauseActive = true;
          this.game.pause({ showOverlay: false });
        }
        return;
      }

      if (this.orientationMusicPauseActive) {
        this.orientationMusicPauseActive = false;
        if (!document.hidden && (!this.backgroundSoundToggle || this.backgroundSoundToggle.checked)) {
          this.audio.startBackgroundMusic();
        }
      }

      if (!this.orientationAutoPauseActive) {
        return;
      }

      this.orientationAutoPauseActive = false;
      this.game.resume();
    }

    togglePauseSoundSetting(toggle) {
      if (!toggle) {
        return;
      }

      toggle.checked = !toggle.checked;
      this.audio.playClick();
      this.applySettings();
    }

    updatePauseSoundButton(button, enabled) {
      if (!button) {
        return;
      }

      const isEnabled = Boolean(enabled);
      const toggleText = button.querySelector(".pause-toggle-visual span");
      button.classList.toggle("is-off", !isEnabled);
      button.setAttribute("aria-pressed", String(isEnabled));
      if (toggleText) {
        toggleText.textContent = isEnabled ? "ON" : "OFF";
      }
    }

    updateScaleVariable() {
      const stageWidth = 1280;
      const stageHeight = 720;
      const viewport = window.visualViewport;
      const viewportWidth = viewport && viewport.width ? viewport.width : window.innerWidth || document.documentElement.clientWidth || stageWidth;
      const viewportHeight = viewport && viewport.height ? viewport.height : window.innerHeight || document.documentElement.clientHeight || stageHeight;
      const scale = Math.max(0.01, Math.min(viewportWidth / stageWidth, viewportHeight / stageHeight));
      const horizontalGutter = Math.max(0, (viewportWidth - (stageWidth * scale)) / (2 * scale));
      const verticalGutter = Math.max(0, (viewportHeight - (stageHeight * scale)) / (2 * scale));
      const isPortrait = this.isPortraitViewport(viewportWidth, viewportHeight);

      document.documentElement.style.setProperty("--game-scale", String(scale));
      document.documentElement.style.setProperty("--game-viewport-side-gutter", `${horizontalGutter}px`);
      document.documentElement.style.setProperty("--game-viewport-right-gutter", `${horizontalGutter}px`);
      document.documentElement.style.setProperty("--game-viewport-top-gutter", `${Math.min(verticalGutter, 120)}px`);
      document.body.classList.toggle("portrait-viewport", isPortrait);
      document.body.classList.toggle("is-portrait", isPortrait);
      const orientationNotice = document.getElementById("orientationNotice");
      if (orientationNotice) {
        orientationNotice.setAttribute("aria-hidden", isPortrait ? "false" : "true");
      }
      this.syncOrientationPause(isPortrait);
      this.applyPlayStatusLayout(viewportWidth, viewportHeight);
    }

    applyPlayStatusLayout() {
      if (!this.playScreen || !this.playTopbar || !this.progressWrap || !this.playCenter || !this.padArea) {
        return;
      }

      const isPlaying = this.playScreen.classList.contains("is-active");

      if (this.app) {
        this.app.style.overflow = isPlaying ? "visible" : "";
      }

      this.playScreen.style.overflow = isPlaying ? "visible" : "";
      this.playScreen.style.gridTemplateRows = "150px minmax(0, 1fr) 248px";
      this.playScreen.style.gap = "0";

      this.playTopbar.style.position = "";
      this.playTopbar.style.top = "";
      this.playTopbar.style.left = "";
      this.playTopbar.style.right = "";
      this.playTopbar.style.gridRow = "1";
      this.playTopbar.style.alignSelf = "start";
      this.playTopbar.style.alignContent = "start";
      this.playTopbar.style.width = "";
      this.playTopbar.style.minHeight = "";
      this.playTopbar.style.zIndex = "5";
      this.playTopbar.style.transform = "";
      this.playTopbar.style.transformOrigin = "top center";

      this.progressWrap.style.justifySelf = "center";
      this.progressWrap.style.margin = "0 auto";
      this.progressWrap.style.transform = "";

      if (this.pauseButton) {
        this.pauseButton.style.justifySelf = "";
        this.pauseButton.style.gridColumn = "";
      }

      this.playCenter.style.gridRow = "2";
      this.playCenter.style.minHeight = "0";

      this.padArea.style.gridRow = "3";
      this.padArea.style.minHeight = "0";
      this.padArea.style.paddingBottom = "18px";
      this.padArea.style.transform = "translate(-24px, -18px)";
    }

    applyRuntimeUi() {
      const runtime = window.MelodyRuntime.runtime;
      this.selectDifficulty(runtime.difficulty || this.selectedDifficulty, false);
      if (this.retryButton) this.retryButton.classList.toggle("is-hidden", !runtime.allowReplay);
      if (this.homeButton) {
        this.homeButton.textContent = "\ud648\uc73c\ub85c \ub3cc\uc544\uac00\uae30";
      }
      if (this.hostReturnButton) {
        this.hostReturnButton.textContent = "\ud6a8\ub2f4\ucf5c\ub85c \ub3cc\uc544\uac00\uae30";
      }
      if (this.startGameButton) {
        const startButtonLabel = this.startGameButton.querySelector("span");
        if (startButtonLabel) {
          startButtonLabel.textContent = runtime.autoStart ? "\ud65c\ub3d9 \uc2dc\uc791" : "\uac8c\uc784 \uc2dc\uc791";
        }
      }
    }
  }

  window.MelodyScreenFlow = MelodyScreenFlow;
})();
