(function () {
  "use strict";

  class MelodyDrumGame {
    constructor(options) {
      this.audio = options.audio;
      this.onFinish = options.onFinish;
      this.elements = {
        timeText: document.getElementById("timeText"),
        progressFill: document.getElementById("progressFill"),
        progressText: document.getElementById("progressText"),
        difficultyText: document.getElementById("difficultyText"),
        songTitleText: document.getElementById("songTitleText"),
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

    start(difficulty) {
      const config = window.GAME_CONFIG[difficulty] || window.GAME_CONFIG.normal;
      const song = this.pickSong(config.targetNoteCount);
      const symbols = window.SYMBOL_CONFIG.slice(0, config.symbolCount);

      this.stopTick();
      this.state = {
        difficulty,
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
      this.elements.difficultyText.textContent = config.label;
      this.elements.songTitleText.textContent = this.state.song.title;
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
        button.innerHTML = this.getSymbolHtml(symbol);
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

    generatePrompt() {
      const { config, symbols } = this.state;
      const shouldShowX = config.xPatternEnabled && Math.random() < 0.22;

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

      if (this.state.completedNoteCount >= this.state.config.targetNoteCount) {
        this.finish();
        return;
      }

      this.state.currentPrompt = this.state.nextPrompt || this.generatePrompt();
      this.state.nextPrompt = this.generatePrompt();
      this.state.trialElapsed = 0;
      this.state.noTouchElapsed = 0;
      this.state.hintShownThisTrial = false;

      if (this.state.currentPrompt.isX) {
        this.state.xPresentCount += 1;
      }

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

      if (this.state.trialElapsed >= this.state.config.trialTimeLimit) {
        if (this.state.currentPrompt.isX) {
          this.handleXSuccess();
        } else {
          this.handleMissed();
        }
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

      if (this.state.completedNoteCount >= this.state.config.targetNoteCount) {
        window.setTimeout(() => this.finish(), 260);
        this.render();
        return;
      }

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
        this.elements.promptMessage.textContent = "기다려 주세요.";
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

      const progressRate = Math.min(100, Math.round((this.state.completedNoteCount / this.state.config.targetNoteCount) * 100));
      this.elements.timeText.textContent = `${Math.ceil(this.state.sessionRemaining)}초`;
      this.elements.progressFill.style.width = `${progressRate}%`;
      this.elements.progressText.textContent = `${progressRate}%`;

      if (this.state.currentPrompt) {
        const message = this.state.currentPrompt.isX ? "빨간 X가 나오면 기다려요" : `${this.state.currentPrompt.label}를 찾아 눌러주세요`;
        if (!this.state.hintShownThisTrial || !this.state.currentPrompt.isX) {
          this.elements.promptMessage.textContent = message;
        }
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
