(function () {
  "use strict";

  class MelodyDrumGame {
    constructor(options) {
      this.audio = options.audio;
      this.onFinish = options.onFinish;
      this.elements = {
        timeText: document.getElementById("timeText"),
        progressFill: document.getElementById("progressFill"),
        currentSymbol: document.getElementById("currentSymbol"),
        nextSymbol: document.getElementById("nextSymbol"),
        previewCard: document.getElementById("previewCard"),
        padArea: document.getElementById("padArea"),
        promptMessage: document.getElementById("promptMessage"),
        feedbackOverlay: document.getElementById("feedbackOverlay"),
        pauseOverlay: document.getElementById("pauseOverlay"),
        pauseButton: document.getElementById("pauseButton"),
        resumeButton: document.getElementById("resumeButton"),
        quitButton: document.getElementById("quitButton")
      };

      this.tickHandle = null;
      this.state = null;
      this.lastTick = 0;
      this.boundTick = this.tick.bind(this);

      this.elements.pauseButton.addEventListener("pointerup", () => this.pause());
      this.elements.resumeButton.addEventListener("pointerup", () => this.resume());
      this.elements.quitButton.addEventListener("pointerup", () => this.quit());
    }

    start(difficulty, runtimeConfig) {
      const runtime = runtimeConfig || (window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot ? window.MelodyRuntime.runtimeSnapshot() : { difficulty });
      const resolvedDifficulty = runtime.difficulty || difficulty || "normal";
      const config = window.MelodyRuntime && window.MelodyRuntime.resolveDifficultyConfig
        ? window.MelodyRuntime.resolveDifficultyConfig({ ...runtime, difficulty: resolvedDifficulty })
        : (window.GAME_CONFIG[resolvedDifficulty] || window.GAME_CONFIG.normal);
      const song = this.pickSong(config.targetNoteCount);
      const symbols = window.SYMBOL_CONFIG.slice(0, config.symbolCount);

      this.stopTick();
      this.state = {
        mode: runtime.mode || "standard",
        difficulty: resolvedDifficulty,
        sessionId: runtime.sessionId || `session_${Date.now()}`,
        contentId: runtime.contentId || "kungjak_melody_drum",
        gameKey: runtime.gameKey || "kungjak_melody_drum",
        runtimeConfig: runtime,
        startedAt: new Date().toISOString(),
        config,
        song,
        symbols,
        sessionRemaining: config.sessionTime,
        trialElapsed: 0,
        noTouchElapsed: 0,
        completedNoteCount: 0,
        currentNoteIndex: 0,
        correctCount: 0,
        wrongCount: 0,
        missedCount: 0,
        xPresentCount: 0,
        xSuccessCount: 0,
        xFailCount: 0,
        hintTriggeredCount: 0,
        totalTrials: 0,
        reactionTimes: [],
        consecutiveWrong: 0,
        currentPrompt: null,
        nextPrompt: null,
        hintShownThisTrial: false,
        paused: false,
        feedbackLocked: false,
        ended: false
      };

      if (window.ResultBridge) {
        window.ResultBridge.handleSessionStart(this.state);
      }

      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";
      this.renderPads();
      this.state.nextPrompt = this.generatePrompt();
      this.advanceTrial();
      this.renderStaticInfo();
      this.lastTick = performance.now();
      this.tickHandle = window.setInterval(this.boundTick, 100);
      this.render();
    }

    pickSong(targetNoteCount) {
      const songs = window.MELODY_DATA || [];
      return songs.find((song) => song.notes.length >= targetNoteCount) || songs[0];
    }

    renderStaticInfo() {
      const config = this.state.config;
      this.elements.previewCard.classList.toggle("is-hidden", !config.previewEnabled);
    }

    renderPads() {
      const fragment = document.createDocumentFragment();
      this.elements.padArea.innerHTML = "";

      this.state.symbols.slice(0, this.state.config.padCount).forEach((symbol) => {
        const button = document.createElement("button");
        button.className = `drum-pad pad-${symbol.id}`;
        button.type = "button";
        button.dataset.symbolId = symbol.id;
        button.dataset.label = symbol.shortLabel;
        button.setAttribute("aria-label", `${symbol.label} 멜로디 드럼`);
        button.innerHTML = this.getPadSvgHtml(symbol);
        button.addEventListener("pointerup", (event) => {
          event.preventDefault();
          this.handlePadInput(symbol.id, button);
        });
        fragment.appendChild(button);
      });

      this.elements.padArea.appendChild(fragment);
    }

    getSymbolHtml(symbol) {
      if (!symbol) {
        return "";
      }

      if (symbol.id === "x") {
        return '<span class="symbol" aria-hidden="true"><span class="symbol-shape shape-x"></span></span>';
      }

      return `<span class="symbol" aria-hidden="true"><span class="symbol-shape ${symbol.shapeClass}"></span></span>`;
    }

    getPadSvgHtml(symbol) {
      if (!symbol) {
        return "";
      }

      const palettes = {
        triangle: { top: "#ff7b4b", mid: "#ff4b2d", bottom: "#f0351f", sideTop: "#d23a25", sideBottom: "#9e251a", lower: "#db3d20", edge: "#8a2a18" },
        square: { top: "#74b8f8", mid: "#3b91e5", bottom: "#2473c8", sideTop: "#2e77b4", sideBottom: "#174d7c", lower: "#2f7ec0", edge: "#174767" },
        circle: { top: "#a8dc53", mid: "#79c63a", bottom: "#59a72b", sideTop: "#55982b", sideBottom: "#346d1d", lower: "#5fa42f", edge: "#315f1b" },
        star: { top: "#ffe07a", mid: "#ffc23e", bottom: "#ed9d25", sideTop: "#d18420", sideBottom: "#965411", lower: "#df9227", edge: "#7c4813" }
      };
      const palette = palettes[symbol.id] || palettes.triangle;
      const faceId = `melodyPadFace-${symbol.id}`;
      const sideId = `melodyPadSide-${symbol.id}`;
      const lowerId = `melodyPadLower-${symbol.id}`;
      const shapeMarkup = this.getPadShapeSvg(symbol.id);

      return `
        <span class="melody-pad-art" aria-hidden="true">
          <svg class="melody-pad-svg" viewBox="0 0 220 186" focusable="false">
            <defs>
              <linearGradient id="${faceId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${palette.top}" />
                <stop offset="52%" stop-color="${palette.mid}" />
                <stop offset="100%" stop-color="${palette.bottom}" />
              </linearGradient>
              <linearGradient id="${sideId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${palette.sideTop}" />
                <stop offset="100%" stop-color="${palette.sideBottom}" />
              </linearGradient>
              <linearGradient id="${lowerId}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${palette.lower}" />
                <stop offset="100%" stop-color="${palette.sideBottom}" />
              </linearGradient>
            </defs>
            <path class="melody-pad-lower" d="M14 101 C14 78 55 64 110 64 C165 64 206 78 206 101 L206 118 A96 60 0 0 1 14 118 Z" fill="url(#${lowerId})" stroke="${palette.edge}" />
            <path class="melody-pad-side" d="M25 74 C25 40 62 18 110 18 C158 18 195 40 195 74 L195 100 C195 131 158 155 110 155 C62 155 25 131 25 100 Z" fill="url(#${sideId})" stroke="${palette.edge}" />
            <path class="melody-pad-lower-top-rim" d="M14 101 A96 60 0 0 0 206 101" stroke="${palette.edge}" />
            <ellipse class="melody-pad-face" cx="110" cy="69" rx="82" ry="55" fill="url(#${faceId})" stroke="${palette.edge}" />
            <ellipse class="melody-pad-inner-rim" cx="110" cy="69" rx="77" ry="50" />
            ${shapeMarkup}
          </svg>
        </span>`;
    }

    getPadShapeSvg(symbolId) {
      const common = 'class="melody-pad-center-shape"';
      if (symbolId === "triangle") {
        return `<polygon ${common} points="110 37 144 100 76 100" />`;
      }
      if (symbolId === "square") {
        return `<rect ${common} x="80" y="40" width="60" height="60" rx="9" />`;
      }
      if (symbolId === "circle") {
        return `<circle ${common} cx="110" cy="70" r="32" />`;
      }
      if (symbolId === "star") {
        return `<polygon ${common} points="110 31 120 57 148 58 127 75 134 104 110 88 86 104 93 75 72 58 100 57" />`;
      }
      return "";
    }

    generatePrompt() {
      const { symbols } = this.state;
      const shouldShowX = false;

      if (shouldShowX) {
        return {
          id: "x",
          label: "빨간색 X",
          shortLabel: "X",
          shapeClass: "shape-x",
          isX: true
        };
      }

      const index = Math.floor(Math.random() * symbols.length);
      return symbols[index];
    }

    advanceTrial() {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.currentPrompt = this.state.nextPrompt || this.generatePrompt();
      this.state.nextPrompt = this.generatePrompt();
      this.state.trialElapsed = 0;
      this.state.noTouchElapsed = 0;
      this.state.hintShownThisTrial = false;

      this.render();
    }

    tick() {
      if (!this.state || this.state.ended || this.state.paused || this.state.feedbackLocked) {
        this.lastTick = performance.now();
        return;
      }

      const now = performance.now();
      const delta = Math.max(0, (now - this.lastTick) / 1000);
      this.lastTick = now;

      this.state.sessionRemaining = Math.max(0, this.state.sessionRemaining - delta);
      this.state.trialElapsed += delta;
      this.state.noTouchElapsed += delta;

      if (this.state.sessionRemaining <= 0) {
        this.finish();
        return;
      }

      if (!this.state.hintShownThisTrial && this.state.noTouchElapsed >= 3) {
        this.showHint();
      }

      this.render();
    }

    handlePadInput(symbolId, button) {
      if (!this.state || this.state.ended || this.state.paused || this.state.feedbackLocked) {
        return;
      }

      this.audio.ensureContext();
      this.audio.playClick();
      this.state.noTouchElapsed = 0;

      if (this.state.currentPrompt.isX) {
        this.handleXFail(button);
        return;
      }

      if (symbolId === this.state.currentPrompt.id) {
        this.handleCorrect(button);
      } else {
        this.handleWrong(button);
      }
    }

    handleCorrect(button) {
      const reactionMs = Math.round(this.state.trialElapsed * 1000);
      const notes = this.state.song.notes;
      const noteName = notes[this.state.currentNoteIndex % notes.length];

      this.state.totalTrials += 1;
      this.state.correctCount += 1;
      this.state.completedNoteCount += 1;
      this.state.currentNoteIndex += 1;
      this.state.consecutiveWrong = 0;
      this.state.reactionTimes.push(reactionMs);

      this.audio.playNote(noteName, this.state.currentNoteIndex - 1);
      this.flashPad(button, "is-correct");

      this.advanceTrial();
    }

    handleWrong(button) {
      this.state.totalTrials += 1;
      this.state.wrongCount += 1;
      this.state.consecutiveWrong += 1;
      this.flashPad(button, "is-wrong");

      const shouldHint = this.state.consecutiveWrong >= 2;
      this.showFeedback("아쉬워요! 다시 해볼까요?", "gentle", 1000, () => {
        if (shouldHint) {
          this.showHint(true);
        }
      });
      this.render();
    }

    handleMissed() {
      this.state.totalTrials += 1;
      this.state.missedCount += 1;
      this.state.consecutiveWrong = 0;
      this.showFeedback("괜찮아요. 다음 표식으로 가요.", "gentle", 750, () => this.advanceTrial());
    }

    handleXSuccess() {
      this.state.totalTrials += 1;
      this.state.xSuccessCount += 1;
      this.state.consecutiveWrong = 0;
      this.showFeedback("잘 기다렸어요!", "positive", 650, () => this.advanceTrial());
    }

    handleXFail(button) {
      this.state.totalTrials += 1;
      this.state.xFailCount += 1;
      this.state.wrongCount += 1;
      this.state.consecutiveWrong += 1;
      this.flashPad(button, "is-wrong");
      this.showFeedback("X 표식은 기다리는 표식이에요.", "gentle", 1000, () => this.advanceTrial());
      this.render();
    }

    showFeedback(message, tone, duration, after) {
      const overlay = this.elements.feedbackOverlay;
      this.state.feedbackLocked = true;
      overlay.textContent = message;
      overlay.className = `feedback-overlay is-visible is-${tone}`;

      window.setTimeout(() => {
        overlay.className = "feedback-overlay";
        this.state.feedbackLocked = false;
        this.lastTick = performance.now();
        if (typeof after === "function" && !this.state.ended) {
          after();
        }
      }, duration);
    }

    showHint(force) {
      if (!this.state || this.state.ended || this.state.hintShownThisTrial && !force) {
        return;
      }

      this.state.hintShownThisTrial = true;
      this.state.hintTriggeredCount += 1;

      if (this.state.currentPrompt.isX) {
        this.elements.promptMessage.textContent = "";
        return;
      }

      const pad = this.elements.padArea.querySelector(`[data-symbol-id="${this.state.currentPrompt.id}"]`);
      if (pad) {
        this.flashPad(pad, "is-hint", 2000);
      }
    }

    flashPad(button, className, duration) {
      if (!button) {
        return;
      }

      const delay = duration || 650;
      button.classList.remove(className);
      void button.offsetWidth;
      button.classList.add(className);
      window.setTimeout(() => button.classList.remove(className), delay);
    }

    pause() {
      if (!this.state || this.state.ended || this.state.feedbackLocked) {
        return;
      }

      this.state.paused = true;
      this.elements.pauseOverlay.classList.add("is-visible");
    }

    resume() {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.paused = false;
      this.lastTick = performance.now();
      this.elements.pauseOverlay.classList.remove("is-visible");
    }

    quit() {
      this.stopTick();
      if (this.state) {
        if (window.ResultBridge) {
          window.ResultBridge.handleSessionAbort(this.state, "user_quit");
        }
        this.state.ended = true;
      }
      this.elements.pauseOverlay.classList.remove("is-visible");
      window.dispatchEvent(new CustomEvent("melody-drum:go-home"));
    }

    finish() {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.ended = true;
      this.stopTick();
      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";
      const result = window.ResultManager.calculateResult(this.state);
      console.log("result_detail_json", result);
      this.onFinish(result);
    }

    stopTick() {
      if (this.tickHandle) {
        window.clearInterval(this.tickHandle);
        this.tickHandle = null;
      }
    }

    render() {
      if (!this.state) {
        return;
      }

      const progressRate = this.state.config.sessionTime > 0
        ? Math.max(0, Math.round((this.state.sessionRemaining / this.state.config.sessionTime) * 100))
        : 0;
      const remainingSeconds = Math.max(0, Math.ceil(this.state.sessionRemaining));
      const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
      const seconds = String(remainingSeconds % 60).padStart(2, "0");
      this.elements.timeText.textContent = `${minutes}:${seconds}`;
      this.elements.progressFill.style.width = `${progressRate}%`;

      if (this.state.currentPrompt) {
        this.elements.promptMessage.textContent = "";
        this.elements.currentSymbol.innerHTML = this.getSymbolHtml(this.state.currentPrompt);
        this.elements.currentSymbol.setAttribute("aria-label", this.state.currentPrompt.label);
      }

      if (this.state.config.previewEnabled && this.state.nextPrompt) {
        this.elements.nextSymbol.innerHTML = this.getSymbolHtml(this.state.nextPrompt);
      } else {
        this.elements.nextSymbol.innerHTML = "";
      }
    }
  }

  window.MelodyDrumGame = MelodyDrumGame;
})();
