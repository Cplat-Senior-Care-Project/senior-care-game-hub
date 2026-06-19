(function () {
  "use strict";

  class MelodyScreenFlow {
    constructor(options) {
      this.audio = options.audio;
      this.game = options.game;
      this.app = document.getElementById("app");
      this.screens = Array.from(document.querySelectorAll(".screen"));
      this.loadingFill = document.getElementById("loadingFill");
      this.loadingPercent = document.getElementById("loadingPercent");
      this.backgroundSoundToggle = document.getElementById("background-sound-toggle");
      this.backgroundSoundLabel = document.getElementById("background-sound-label");
      this.soundToggle = document.getElementById("sound-toggle");
      this.soundLabel = document.getElementById("sound-label");
      this.voiceGuideToggle = document.getElementById("voice-guide-toggle");
      this.voiceGuideLabel = document.getElementById("voice-guide-label");
      this.difficultyCards = Array.from(document.querySelectorAll("[data-difficulty]"));
      this.startGameButton = document.getElementById("startGameButton");
      this.difficultyStartButton = document.getElementById("difficultyStartButton");
      this.exitGameButton = document.getElementById("exitGameButton");
      this.retryButton = document.getElementById("retryButton");
      this.homeButton = document.getElementById("homeButton");
      this.playScreen = document.getElementById("playScreen");
      this.playTopbar = this.playScreen ? this.playScreen.querySelector(".play-topbar") : null;
      this.progressWrap = this.playScreen ? this.playScreen.querySelector(".progress-wrap") : null;
      this.playCenter = this.playScreen ? this.playScreen.querySelector(".play-center") : null;
      this.padArea = document.getElementById("padArea");
      this.pauseButton = document.getElementById("pauseButton");
      this.selectedDifficulty = (window.MelodyRuntime && window.MelodyRuntime.runtime.difficulty) || "normal";
    }

    init() {
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
          this.showScreen(target);
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
        this.showScreen("difficulty");
      });
      this.difficultyStartButton && this.difficultyStartButton.addEventListener("pointerup", () => this.beginGame());
      this.exitGameButton && this.exitGameButton.addEventListener("pointerup", () => this.handleExitAction());
      this.retryButton && this.retryButton.addEventListener("pointerup", () => this.beginGame());
      this.homeButton && this.homeButton.addEventListener("pointerup", () => this.handleHomeAction());

      this.backgroundSoundToggle && this.backgroundSoundToggle.addEventListener("change", () => this.applySettings());
      this.soundToggle && this.soundToggle.addEventListener("change", () => this.applySettings());
      this.voiceGuideToggle && this.voiceGuideToggle.addEventListener("change", () => this.applySettings());
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

    showScreen(name) {
      document.body.dataset.activeScreen = name;
      this.screens.forEach((screen) => {
        screen.classList.toggle("is-active", screen.dataset.screen === name);
      });
      this.applyPlayStatusLayout();
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
      const runtime = window.MelodyRuntime.runtime;
      this.audio.playClick();
      if (runtime.mode === "standard") {
        this.showScreen("home");
        return;
      }
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
        this.homeButton.textContent = runtime.mode === "ai_assisted" ? "AI \ub300\ud654\ub85c \ub3cc\uc544\uac00\uae30" : "\ucc98\uc74c\uc73c\ub85c";
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
