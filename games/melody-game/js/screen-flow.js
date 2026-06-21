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
      this.selectedDifficulty = (window.MelodyRuntime && window.MelodyRuntime.runtime.difficulty) || "normal";
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
        this.audio.playClick();
        this.requestDisplayFromGesture("home_start");
        this.showScreen("difficulty");
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

      this.backgroundSoundToggle && this.backgroundSoundToggle.addEventListener("change", () => this.applySettings());
      this.soundToggle && this.soundToggle.addEventListener("change", () => this.applySettings());
      this.voiceGuideToggle && this.voiceGuideToggle.addEventListener("change", () => this.applySettings());
      this.pauseBackgroundSoundButton && this.pauseBackgroundSoundButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.backgroundSoundToggle));
      this.pauseSoundButton && this.pauseSoundButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.soundToggle));
      this.pauseVoiceGuideButton && this.pauseVoiceGuideButton.addEventListener("pointerup", () => this.togglePauseSoundSetting(this.voiceGuideToggle));
      window.addEventListener("resize", () => this.updateScaleVariable());
      window.addEventListener("orientationchange", () => this.updateScaleVariable());
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
      if (name === "howto") {
        this.showHowtoPage(1);
      }
      document.body.dataset.activeScreen = name;
      this.screens.forEach((screen) => {
        screen.classList.toggle("is-active", screen.dataset.screen === name);
      });
      this.applyPlayStatusLayout();
    }

    handleScreenNavigation(target) {
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

    startLoading() {
      const duration = 1800;
      const startedAt = window.performance ? window.performance.now() : Date.now();
      let lastPercent = -1;

      const completeLoading = () => {
        window.setTimeout(() => {
          this.showScreen("home");
          const runtime = window.MelodyRuntime.runtime;
          if (runtime.autoStart) {
            window.setTimeout(() => this.beginGame(), 180);
          }
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
      const runtime = window.MelodyRuntime.runtimeSnapshot();
      this.selectedDifficulty = runtime.difficulty || this.selectedDifficulty;
      this.selectDifficulty(this.selectedDifficulty, false);
      this.audio.ensureContext();
      this.audio.playClick();
      if (window.DisplayBridge) {
        window.DisplayBridge.requestDisplay("game_start");
      }
      this.showScreen("play");
      this.game.start(this.selectedDifficulty, runtime);
    }

    handleHomeAction() {
      this.audio.playClick();
      this.showScreen("home");
    }

    handleHostReturnAction() {
      this.audio.playClick();
      if (window.ResultBridge) {
        window.ResultBridge.returnToHost("user_complete");
      }
    }

    handleExitAction() {
      this.audio.playClick();
      if (window.ResultBridge) {
        window.ResultBridge.returnToHost("user_exit");
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

      document.documentElement.style.setProperty("--game-scale", String(scale));
      document.documentElement.style.setProperty("--game-viewport-right-gutter", `${horizontalGutter}px`);
      document.documentElement.style.setProperty("--game-viewport-top-gutter", `${Math.min(verticalGutter, 120)}px`);
      document.body.classList.toggle("portrait-viewport", viewportWidth < viewportHeight);
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

      this.playTopbar.style.position = "relative";
      this.playTopbar.style.top = "auto";
      this.playTopbar.style.left = "auto";
      this.playTopbar.style.right = "auto";
      this.playTopbar.style.gridRow = "1";
      this.playTopbar.style.alignSelf = "start";
      this.playTopbar.style.alignContent = "start";
      this.playTopbar.style.width = "100%";
      this.playTopbar.style.minHeight = "0";
      this.playTopbar.style.zIndex = "5";
      this.playTopbar.style.transform = isPlaying ? "translateY(calc(var(--game-viewport-top-gutter, 0px) * -1))" : "";
      this.playTopbar.style.transformOrigin = "top center";

      this.progressWrap.style.justifySelf = "center";
      this.progressWrap.style.margin = "0 auto";
      this.progressWrap.style.transform = "none";

      if (this.pauseButton) {
        this.pauseButton.style.justifySelf = "stretch";
        this.pauseButton.style.gridColumn = "3";
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
