(function () {
  "use strict";

  class MelodyDrumGame {
    constructor(options) {
      this.audio = options.audio;
      this.onFinish = options.onFinish;
      this.onRestart = options.onRestart;
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
        pauseRestartButton: document.getElementById("pauseRestartButton"),
        quitButton: document.getElementById("quitButton")
      };

      this.tickHandle = null;
      this.previewAnimationHandle = null;
      this.previewFlightElement = null;
      this.previewFlightAnimation = null;
      this.correctAnimationHandle = null;
      this.correctFlightElement = null;
      this.correctFlightAnimation = null;
      this.successGlowHandle = null;
      this.state = null;
      this.lastTick = 0;
      this.boundTick = this.tick.bind(this);
      this.renderedCurrentPromptKey = "";
      this.renderedNextPromptKey = "";

      this.elements.pauseButton.addEventListener("pointerup", () => this.pause());
      this.elements.resumeButton.addEventListener("pointerup", () => this.resume());
      this.elements.pauseRestartButton && this.elements.pauseRestartButton.addEventListener("pointerup", () => this.restart());
      this.elements.quitButton.addEventListener("pointerup", () => this.quit());
    }

    start(difficulty, runtimeConfig, options) {
      const startPaused = Boolean(options && options.startPaused);
      const runtime = runtimeConfig || (window.MelodyRuntime && window.MelodyRuntime.runtimeSnapshot ? window.MelodyRuntime.runtimeSnapshot() : { difficulty });
      const resolvedDifficulty = runtime.difficulty || difficulty || "normal";
      const config = window.MelodyRuntime && window.MelodyRuntime.resolveDifficultyConfig
        ? window.MelodyRuntime.resolveDifficultyConfig({ ...runtime, difficulty: resolvedDifficulty })
        : (window.GAME_CONFIG[resolvedDifficulty] || window.GAME_CONFIG.normal);
      const song = this.pickSong();
      const symbols = window.SYMBOL_CONFIG.slice(0, config.symbolCount);

      this.stopTick();
      this.resetRenderedPromptKeys();
      this.state = {
        mode: runtime.mode || "standard",
        difficulty: resolvedDifficulty,
        sessionId: runtime.sessionId || `session_${Date.now()}`,
        contentId: runtime.contentId || "cognitive_melody_game_001",
        gameKey: runtime.gameKey || "melody_game",
        runtimeConfig: runtime,
        conditionCheck: runtime.conditionCheck || runtime.condition_check || { skipped: true },
        finishCheck: {},
        startedAt: startPaused ? null : new Date().toISOString(),
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
        wrongTapCount: 0,
        totalTouchMissCount: 0,
        missedCount: 0,
        xPresentCount: 0,
        xSuccessCount: 0,
        xFailCount: 0,
        hintTriggeredCount: 0,
        totalTrials: 0,
        questionLogs: [],
        pauseCount: 0,
        interactionCount: 0,
        firstResponseTimeMs: null,
        abandonedAt: null,
        reactionTimes: [],
        touchInputUsed: false,
        externalInputUsed: false,
        consecutiveWrong: 0,
        currentPrompt: null,
        nextPrompt: null,
        nextSong: null,
        hintShownThisTrial: false,
        paused: startPaused,
        feedbackLocked: false,
        songTransitionLocked: false,
        ended: false,
        status: "playing",
        exitReason: null,
        sessionStarted: false
      };

      if (!startPaused && window.ResultBridge) {
        window.ResultBridge.handleSessionStart(this.state);
        this.state.sessionStarted = true;
      }

      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";
      this.renderPads();
      this.state.nextPrompt = this.generatePrompt(0);
      this.advanceTrial();
      this.renderStaticInfo();
      this.lastTick = performance.now();
      this.tickHandle = window.setInterval(this.boundTick, 100);
      this.render();
    }

    activatePreparedGame() {
      if (!this.state || this.state.ended) {
        return false;
      }

      if (!this.state.startedAt) {
        this.state.startedAt = new Date().toISOString();
      }

      if (window.ResultBridge && !this.state.sessionStarted) {
        window.ResultBridge.handleSessionStart(this.state);
        this.state.sessionStarted = true;
      }

      this.resume();
      return true;
    }

    pickSong(excludeSongId) {
      const songs = window.MELODY_DATA || [];
      const candidates = excludeSongId && songs.length > 1
        ? songs.filter((song) => song.id !== excludeSongId)
        : songs;
      return candidates[Math.floor(Math.random() * candidates.length)] || { id: "fallback", title: "", notes: ["C4"] };
    }

    renderStaticInfo() {
      const config = this.state.config;
      this.elements.previewCard.classList.toggle("is-hidden", !config.previewEnabled);
    }

    resetRenderedPromptKeys() {
      this.renderedCurrentPromptKey = "";
      this.renderedNextPromptKey = "";
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

    getNotesForSong(song) {
      if (!this.state || !song) {
        return ["C4"];
      }

      if (this.state.config.xPatternEnabled && Array.isArray(song.hardNotes) && song.hardNotes.length) {
        return song.hardNotes;
      }

      return Array.isArray(song.notes) && song.notes.length ? song.notes : ["C4"];
    }

    getActiveNotes() {
      return this.getNotesForSong(this.state && this.state.song);
    }

    getNoteAt(index, song) {
      const notes = this.getNotesForSong(song || (this.state && this.state.song));
      const noteIndex = Math.max(0, Math.min(notes.length - 1, index));
      return notes[noteIndex];
    }

    normalizeNoteEntry(noteEntry) {
      if (noteEntry && typeof noteEntry === "object") {
        const duration = Number(noteEntry.duration);
        return {
          name: noteEntry.name || noteEntry.note || "C4",
          duration: Number.isFinite(duration) ? duration : null
        };
      }

      return {
        name: noteEntry,
        duration: null
      };
    }

    getNoteName(noteEntry) {
      return this.normalizeNoteEntry(noteEntry).name;
    }

    getPromptSong(noteIndex) {
      const notes = this.getActiveNotes();

      if (noteIndex < notes.length) {
        return this.state.song;
      }

      if (!this.state.nextSong) {
        this.state.nextSong = this.pickSong(this.state.song && this.state.song.id);
      }

      return this.state.nextSong;
    }

    getPromptNoteIndex(noteIndex, song) {
      const currentNotes = this.getActiveNotes();

      if (song === this.state.song && noteIndex < currentNotes.length) {
        return noteIndex;
      }

      return 0;
    }

    syncSongForCurrentIndex() {
      const notes = this.getActiveNotes();

      if (this.state.currentNoteIndex < notes.length) {
        return false;
      }

      if (this.state.songTransitionLocked) {
        return true;
      }

      this.state.songTransitionLocked = true;
      this.showSongTransition(() => {
        if (!this.state || this.state.ended) {
          return;
        }

        const previousSongId = this.state.song && this.state.song.id;
        this.state.song = this.state.nextSong || this.pickSong(previousSongId);
        this.state.currentNoteIndex = 0;
        this.state.nextSong = null;
        this.state.songTransitionLocked = false;

        if (this.state.nextPrompt && this.state.nextPrompt.songId !== this.state.song.id) {
          this.state.nextPrompt = null;
        }

        this.advanceTrial();
      });

      return true;
    }

    showSongTransition(after) {
      const overlay = this.elements.feedbackOverlay;
      const emoji = document.createElement("div");
      const title = document.createElement("strong");
      const message = document.createElement("p");
      const panel = document.createElement("div");

      emoji.className = "song-transition-emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = "😊";
      title.textContent = "정말 잘하셨어요!";
      message.textContent = "다음 곡으로 넘어갈게요!";
      panel.className = "song-transition-panel";
      panel.append(emoji, title, message);

      this.state.feedbackLocked = true;
      overlay.replaceChildren(panel);
      overlay.className = "feedback-overlay is-visible is-song-transition";
      this.audio.playClap();

      window.setTimeout(() => {
        overlay.className = "feedback-overlay";
        overlay.replaceChildren();
        this.state.feedbackLocked = false;
        this.lastTick = performance.now();
        if (typeof after === "function" && !this.state.ended) {
          after();
        }
      }, 5000);
    }

    isRestNote(noteEntry) {
      const noteName = this.getNoteName(noteEntry);
      return ["REST", "R", "쉼표", "쉼"].includes(String(noteName || "").trim().toUpperCase());
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

    generatePrompt(noteIndex) {
      const { symbols } = this.state;
      const targetNoteIndex = Number.isFinite(noteIndex) ? noteIndex : this.state.currentNoteIndex;
      const promptSong = this.getPromptSong(targetNoteIndex);
      const promptNoteIndex = this.getPromptNoteIndex(targetNoteIndex, promptSong);
      const promptNote = this.getNoteAt(promptNoteIndex, promptSong);
      const shouldShowX = Boolean(this.state.config.xPatternEnabled && this.isRestNote(promptNote));

      if (shouldShowX) {
        return {
          id: "x",
          label: "보라색 X",
          shortLabel: "X",
          shapeClass: "shape-x",
          isX: true,
          noteIndex: promptNoteIndex,
          songId: promptSong.id
        };
      }

      const index = Math.floor(Math.random() * symbols.length);
      return {
        ...symbols[index],
        noteIndex: promptNoteIndex,
        songId: promptSong.id
      };
    }

    generateAlternatePrompt(noteIndex, previousPrompt) {
      let nextPrompt = this.generatePrompt(noteIndex);

      if (!previousPrompt || previousPrompt.isX || nextPrompt.isX) {
        return nextPrompt;
      }

      for (let attempt = 0; attempt < 8 && nextPrompt.id === previousPrompt.id; attempt += 1) {
        nextPrompt = this.generatePrompt(noteIndex);
      }

      return nextPrompt;
    }

    advanceTrial() {
      if (!this.state || this.state.ended) {
        return;
      }

      if (this.syncSongForCurrentIndex()) {
        return;
      }

      const shouldAnimateFromPreview = Boolean(this.state.currentPrompt && this.state.config.previewEnabled);
      const previewRect = shouldAnimateFromPreview && this.elements.nextSymbol
        ? this.elements.nextSymbol.getBoundingClientRect()
        : null;
      this.state.currentPrompt = this.state.nextPrompt || this.generatePrompt(this.state.currentNoteIndex);
      this.state.nextPrompt = this.shouldHoldNextPreviewForFinalX(this.state.currentPrompt)
        ? null
        : this.generatePrompt(this.state.currentNoteIndex + 1);
      this.state.trialElapsed = 0;
      this.state.noTouchElapsed = 0;
      this.state.hintShownThisTrial = false;

      if (this.state.currentPrompt.isX) {
        this.state.xPresentCount += 1;
      }

      this.render();

      if (shouldAnimateFromPreview && previewRect) {
        this.animatePreviewAdvance(previewRect, this.state.currentPrompt);
      }
    }

    shouldHoldNextPreviewForFinalX(prompt) {
      if (!this.state || !prompt || !prompt.isX || prompt.songId !== (this.state.song && this.state.song.id)) {
        return false;
      }

      const notes = this.getActiveNotes();
      return Number.isFinite(prompt.noteIndex) && prompt.noteIndex >= notes.length - 1;
    }

    animatePreviewAdvance(previewRect, incomingPrompt) {
      const currentSymbol = this.elements.currentSymbol;
      const nextSymbol = this.elements.nextSymbol;

      if (!currentSymbol || !nextSymbol || !incomingPrompt) {
        return;
      }

      const currentRect = currentSymbol.getBoundingClientRect();
      const previewCenterX = previewRect.left + previewRect.width / 2;
      const previewCenterY = previewRect.top + previewRect.height / 2;
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;
      const previewScale = currentRect.width > 0
        ? Math.max(0.36, Math.min(0.72, previewRect.width / currentRect.width))
        : 0.58;

      this.clearPreviewAnimation();

      const flightSymbol = document.createElement("div");
      flightSymbol.className = "symbol-flight";
      flightSymbol.innerHTML = this.getSymbolHtml(incomingPrompt);
      flightSymbol.style.left = `${currentRect.left}px`;
      flightSymbol.style.top = `${currentRect.top}px`;
      flightSymbol.style.width = `${currentRect.width}px`;
      flightSymbol.style.height = `${currentRect.height}px`;
      flightSymbol.style.setProperty("--preview-fly-x", `${previewCenterX - currentCenterX}px`);
      flightSymbol.style.setProperty("--preview-fly-y", `${previewCenterY - currentCenterY}px`);
      flightSymbol.style.setProperty("--preview-fly-scale", previewScale.toFixed(3));
      flightSymbol.style.transform = "translate(var(--preview-fly-x), var(--preview-fly-y)) scale(var(--preview-fly-scale))";

      document.body.appendChild(flightSymbol);
      this.previewFlightElement = flightSymbol;
      currentSymbol.classList.add("is-flight-target-hidden");
      nextSymbol.classList.add("is-refreshing");

      const finishPreviewAnimation = () => {
        if (didFinish) {
          return;
        }

        didFinish = true;
        window.clearTimeout(this.previewAnimationHandle);
        if (this.previewFlightElement === flightSymbol) {
          this.previewFlightElement = null;
        }
        if (this.previewFlightAnimation === flightAnimation) {
          this.previewFlightAnimation = null;
        }
        flightSymbol.remove();
        currentSymbol.classList.remove("is-flight-target-hidden");
        nextSymbol.classList.remove("is-refreshing");
        this.previewAnimationHandle = null;
      };

      let didFinish = false;
      const flightAnimation = typeof flightSymbol.animate === "function" ? flightSymbol.animate([
        {
          opacity: 0.72,
          transform: "translate(var(--preview-fly-x), var(--preview-fly-y)) scale(var(--preview-fly-scale))"
        },
        {
          offset: 0.72,
          opacity: 1,
          transform: "translate(-18px, 0) scale(1.07)"
        },
        {
          opacity: 1,
          transform: "translate(0, 0) scale(1)"
        }
      ], {
        duration: 680,
        easing: "cubic-bezier(0.18, 0.88, 0.24, 1)",
        fill: "both"
      }) : null;

      this.previewFlightAnimation = flightAnimation;

      if (flightAnimation) {
        flightAnimation.addEventListener("finish", finishPreviewAnimation, { once: true });
        this.previewAnimationHandle = window.setTimeout(finishPreviewAnimation, 760);
      } else {
        this.previewAnimationHandle = window.setTimeout(finishPreviewAnimation, 120);
      }
    }

    clearPreviewAnimation() {
      window.clearTimeout(this.previewAnimationHandle);
      this.previewAnimationHandle = null;

      if (this.previewFlightElement) {
        this.previewFlightElement.remove();
        this.previewFlightElement = null;
      }

      if (this.previewFlightAnimation) {
        this.previewFlightAnimation.cancel();
        this.previewFlightAnimation = null;
      }

      if (this.elements.currentSymbol) {
        this.elements.currentSymbol.classList.remove("is-from-preview", "is-flight-target-hidden");
      }

      if (this.elements.nextSymbol) {
        this.elements.nextSymbol.classList.remove("is-refreshing");
      }
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
        this.abort("time_over");
        return;
      }

      const xHoldSeconds = Number(this.state.config.xHoldSeconds) || 1.5;
      if (this.state.currentPrompt && this.state.currentPrompt.isX && this.state.noTouchElapsed >= xHoldSeconds) {
        this.handleXSuccess();
        return;
      }

      const hintDelayMs = Number(this.state.config.hintDelayMs) || 10000;
      if (this.state.config.autoHintEnabled !== false && this.state.currentPrompt && !this.state.currentPrompt.isX && this.state.noTouchElapsed >= hintDelayMs / 1000) {
        this.showHint(false);
      }

      this.render();
    }

    handleExternalAnswer(payload) {
      if (!this.state || this.state.ended) {
        return { accepted: false, reason: "game_not_ready" };
      }

      if (this.state.paused || this.state.feedbackLocked) {
        return { accepted: false, reason: "game_not_accepting_input" };
      }

      if (this.state.runtimeConfig && this.state.runtimeConfig.externalInputEnabled === false) {
        return { accepted: false, reason: "external_input_disabled" };
      }

      const normalized = this.normalizeExternalAnswerPayload(payload);
      const button = this.findPadButtonForExternalAnswer(normalized.selectedAnswer);

      if (!button) {
        return {
          accepted: false,
          reason: "unknown_selected_answer",
          selected_answer: normalized.selectedAnswer
        };
      }

      this.handlePadInput(button.dataset.symbolId, button, {
        inputType: "external",
        externalInput: normalized
      });

      return {
        accepted: true,
        selected_answer: normalized.selectedAnswer,
        selected_symbol_id: button.dataset.symbolId,
        input_type: normalized.externalInputType || null
      };
    }

    normalizeExternalAnswerPayload(payload) {
      const source = payload && typeof payload === "object" ? payload : {};
      const selectedAnswer = source.selected_answer !== undefined
        ? source.selected_answer
        : source.selectedAnswer !== undefined
          ? source.selectedAnswer
          : source.answer !== undefined
            ? source.answer
            : source.selected_symbol_id !== undefined
              ? source.selected_symbol_id
              : source.symbol_id;
      const confidence = Number(source.confidence);

      return {
        selectedAnswer: selectedAnswer === undefined || selectedAnswer === null ? "" : String(selectedAnswer).trim(),
        externalInputType: source.input_type || source.inputType || "external",
        rawTranscript: source.raw_transcript || source.rawTranscript || "",
        confidence: Number.isFinite(confidence) ? confidence : null,
        receivedAt: new Date().toISOString()
      };
    }

    findPadButtonForExternalAnswer(selectedAnswer) {
      if (!selectedAnswer) {
        return null;
      }

      const buttons = Array.from(this.elements.padArea.querySelectorAll("[data-symbol-id]"));
      const answer = String(selectedAnswer).trim();
      const answerNumber = Number(answer);

      if (Number.isInteger(answerNumber) && answerNumber >= 1 && answerNumber <= buttons.length) {
        return buttons[answerNumber - 1];
      }

      const normalizedAnswer = answer.toLowerCase();
      return buttons.find((button) => {
        const symbolId = String(button.dataset.symbolId || "").toLowerCase();
        const label = String(button.dataset.label || "").toLowerCase();
        return normalizedAnswer === symbolId || normalizedAnswer === label;
      }) || null;
    }

    handlePadInput(symbolId, button, options) {
      if (!this.state || this.state.ended || this.state.paused || this.state.feedbackLocked) {
        return;
      }

      const inputType = options && options.inputType === "external" ? "external" : "touch";
      const externalInput = options && options.externalInput ? options.externalInput : null;
      if (inputType === "external") {
        this.state.externalInputUsed = true;
      } else {
        this.state.touchInputUsed = true;
      }
      this.recordInteraction();

      this.audio.ensureContext();
      this.audio.playClick();
      if (button && typeof button.blur === "function") {
        button.blur();
      }
      this.state.noTouchElapsed = 0;

      if (this.state.currentPrompt.isX) {
        this.handleXFail(button, symbolId, inputType, externalInput);
        return;
      }

      if (symbolId === this.state.currentPrompt.id) {
        this.handleCorrect(button, inputType, externalInput);
      } else {
        this.handleWrong(button, symbolId, inputType, externalInput);
      }
    }

    recordInteraction() {
      if (!this.state) {
        return;
      }

      this.state.interactionCount += 1;
      if (this.state.firstResponseTimeMs === null) {
        const sessionTime = Number(this.state.config && this.state.config.sessionTime) || 0;
        const remaining = Number(this.state.sessionRemaining) || 0;
        this.state.firstResponseTimeMs = Math.round(Math.max(0, sessionTime - remaining) * 1000);
      }
    }

    appendQuestionLog(updates) {
      if (!this.state || !this.state.currentPrompt) {
        return;
      }

      const prompt = this.state.currentPrompt;
      const questionIndex = this.state.questionLogs.length + 1;
      const questionType = prompt.isX ? "no_go" : "tap";
      const responseMs = Number.isFinite(updates.response_time_ms)
        ? updates.response_time_ms
        : Math.round(this.state.trialElapsed * 1000);
      const correctAnswer = prompt.isX ? "x" : prompt.id || null;
      const selectedAnswer = updates.selected_symbol_id || null;
      const failType = updates.fail_type || null;
      const hintUsed = Boolean(this.state.hintShownThisTrial);
      const isCorrect = Boolean(updates.is_correct);

      this.state.questionLogs.push({
        question_id: `${this.state.sessionId || "melody-session"}_q${questionIndex}`,
        question_index: questionIndex,
        stage: 1,
        question_type: questionType,
        game_mode: "melody_play",
        cognitive_domain: "attention_response",
        difficulty: this.state.difficulty || null,
        target_item: correctAnswer,
        selected_answer: selectedAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        attempt_count: 1,
        hint_used: hintUsed,
        hint_count: hintUsed ? 1 : 0,
        response_time_ms: responseMs,
        first_response_time_ms: null,
        wrong_tap_count: isCorrect ? 0 : failType ? 1 : 0,
        touch_miss_count: ["wrong_symbol", "x_tapped"].includes(failType) ? 1 : 0,
        input_type: updates.input_type || null,
        raw_log_json: {
          prompt_type: questionType,
          correct_symbol_id: correctAnswer,
          selected_symbol_id: selectedAnswer,
          fail_type: failType,
          hint_shown: hintUsed,
          note_index: Number.isFinite(prompt.noteIndex) ? prompt.noteIndex : null,
          song_id: prompt.songId || (this.state.song && this.state.song.id) || null,
          external_input_type: updates.external_input_type || null,
          external_selected_answer: updates.external_selected_answer || null,
          external_raw_transcript: updates.external_raw_transcript || null,
          external_confidence: updates.external_confidence === undefined ? null : updates.external_confidence
        }
      });
    }

    createExternalQuestionFields(externalInput) {
      if (!externalInput) {
        return {};
      }

      return {
        external_input_type: externalInput.externalInputType || null,
        external_selected_answer: externalInput.selectedAnswer || null,
        external_raw_transcript: externalInput.rawTranscript || null,
        external_confidence: externalInput.confidence
      };
    }

    handleCorrect(button, inputType, externalInput) {
      const reactionMs = Math.round(this.state.trialElapsed * 1000);
      const noteIndex = Number.isFinite(this.state.currentPrompt.noteIndex)
        ? this.state.currentPrompt.noteIndex
        : this.state.currentNoteIndex;
      const note = this.normalizeNoteEntry(this.getNoteAt(noteIndex));

      this.appendQuestionLog({
        selected_symbol_id: this.state.currentPrompt.id,
        is_correct: true,
        response_time_ms: reactionMs,
        input_type: inputType || "touch",
        ...this.createExternalQuestionFields(externalInput)
      });
      this.state.totalTrials += 1;
      this.state.correctCount += 1;
      this.state.completedNoteCount += 1;
      this.state.currentNoteIndex = noteIndex + 1;
      this.state.consecutiveWrong = 0;
      this.state.reactionTimes.push(reactionMs);

      if (!this.isRestNote(note)) {
        this.audio.playNote(note.name, noteIndex, note.duration);
      }
      this.flashPad(button, "is-correct");
      this.flashRing("success");

      if (this.shouldCompleteSession()) {
        this.finishAfterSymbolExit("completed");
        return;
      }

      if (this.shouldWaitForSymbolExitBeforeAdvance()) {
        this.state.feedbackLocked = true;
        this.animateSymbolExit("top-left", () => {
          if (!this.state || this.state.ended) {
            return;
          }

          this.state.feedbackLocked = false;
          this.lastTick = performance.now();
          this.advanceTrial();
        });
      } else {
        this.animateSymbolExit("top-left");
        this.advanceTrial();
      }
    }

    shouldWaitForSymbolExitBeforeAdvance() {
      return this.state.currentNoteIndex >= this.getActiveNotes().length;
    }

    isCareAiMode() {
      const mode = this.state && this.state.mode;
      return mode === "care" || mode === "ai_assisted";
    }

    shouldCompleteSongSession() {
      return this.state.currentNoteIndex >= this.getActiveNotes().length;
    }

    shouldCompleteSession() {
      if (this.isCareAiMode()) {
        return this.shouldCompleteSongSession();
      }

      return false;
    }

    finishAfterSymbolExit(reason) {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.feedbackLocked = true;
      this.animateSymbolExit("top-left", () => {
        if (!this.state || this.state.ended) {
          return;
        }

        this.state.feedbackLocked = false;
        this.lastTick = performance.now();
        this.finish(reason || "completed");
      });
    }

    flashRing(tone) {
      const currentSymbol = this.elements.currentSymbol;

      if (!currentSymbol) {
        return;
      }

      window.clearTimeout(this.successGlowHandle);
      currentSymbol.classList.remove("is-success-glow", "is-error-glow");
      void currentSymbol.offsetWidth;
      currentSymbol.classList.add(tone === "error" ? "is-error-glow" : "is-success-glow");
      this.successGlowHandle = window.setTimeout(() => {
        currentSymbol.classList.remove("is-success-glow", "is-error-glow");
        this.successGlowHandle = null;
      }, 520);
    }

    animateSymbolExit(direction, after) {
      const currentSymbol = this.elements.currentSymbol;

      if (!currentSymbol || !this.state || !this.state.currentPrompt) {
        if (typeof after === "function") {
          after();
        }
        return;
      }

      const currentRect = currentSymbol.getBoundingClientRect();
      if (currentRect.width <= 0 || currentRect.height <= 0) {
        if (typeof after === "function") {
          after();
        }
        return;
      }

      this.clearCorrectAnimation();

      const flightSymbol = document.createElement("div");
      flightSymbol.className = "symbol-correct-flight";
      flightSymbol.innerHTML = this.getSymbolHtml(this.state.currentPrompt);
      flightSymbol.style.left = `${currentRect.left}px`;
      flightSymbol.style.top = `${currentRect.top}px`;
      flightSymbol.style.width = `${currentRect.width}px`;
      flightSymbol.style.height = `${currentRect.height}px`;
      const targetX = 18;
      const targetY = direction === "bottom-left"
        ? Math.max(18, window.innerHeight - currentRect.height - 18)
        : 18;
      const rotation = direction === "bottom-left" ? 760 : -760;
      const midRotation = direction === "bottom-left" ? 280 : -280;
      flightSymbol.style.setProperty("--symbol-exit-x", `${targetX - currentRect.left}px`);
      flightSymbol.style.setProperty("--symbol-exit-y", `${targetY - currentRect.top}px`);
      flightSymbol.style.setProperty("--symbol-exit-rotation", `${rotation}deg`);
      flightSymbol.style.setProperty("--symbol-exit-mid-rotation", `${midRotation}deg`);

      document.body.appendChild(flightSymbol);
      this.correctFlightElement = flightSymbol;

      let didFinish = false;
      const finishCorrectAnimation = () => {
        if (didFinish) {
          return;
        }

        didFinish = true;
        window.clearTimeout(this.correctAnimationHandle);
        if (this.correctFlightElement === flightSymbol) {
          this.correctFlightElement = null;
        }
        if (this.correctFlightAnimation === flightAnimation) {
          this.correctFlightAnimation = null;
        }
        flightSymbol.remove();
        this.correctAnimationHandle = null;
        if (typeof after === "function") {
          after();
        }
      };

      const flightAnimation = typeof flightSymbol.animate === "function" ? flightSymbol.animate([
        {
          opacity: 1,
          transform: "translate(0, 0) rotate(0deg) scale(1)"
        },
        {
          offset: 0.42,
          opacity: 0.95,
          transform: "translate(calc(var(--symbol-exit-x) * 0.42), calc(var(--symbol-exit-y) * 0.42)) rotate(var(--symbol-exit-mid-rotation)) scale(0.86)"
        },
        {
          opacity: 0,
          transform: "translate(var(--symbol-exit-x), var(--symbol-exit-y)) rotate(var(--symbol-exit-rotation)) scale(0.28)"
        }
      ], {
        duration: 560,
        easing: "cubic-bezier(0.3, 0.02, 0.28, 1)",
        fill: "both"
      }) : null;

      this.correctFlightAnimation = flightAnimation;

      if (flightAnimation) {
        flightAnimation.addEventListener("finish", finishCorrectAnimation, { once: true });
        this.correctAnimationHandle = window.setTimeout(finishCorrectAnimation, 640);
      } else {
        this.correctAnimationHandle = window.setTimeout(finishCorrectAnimation, 120);
      }
    }

    clearCorrectAnimation() {
      window.clearTimeout(this.correctAnimationHandle);
      this.correctAnimationHandle = null;

      if (this.correctFlightElement) {
        this.correctFlightElement.remove();
        this.correctFlightElement = null;
      }

      if (this.correctFlightAnimation) {
        this.correctFlightAnimation.cancel();
        this.correctFlightAnimation = null;
      }

      if (this.elements.currentSymbol) {
        this.elements.currentSymbol.classList.remove("is-correct-exiting");
      }
    }

    handleWrong(button, symbolId, inputType, externalInput) {
      this.appendQuestionLog({
        selected_symbol_id: symbolId,
        is_correct: false,
        fail_type: "wrong_symbol",
        input_type: inputType || "touch",
        ...this.createExternalQuestionFields(externalInput)
      });
      this.state.totalTrials += 1;
      this.state.wrongCount += 1;
      this.state.wrongTapCount += 1;
      this.state.totalTouchMissCount += 1;
      this.state.consecutiveWrong += 1;
      this.flashPad(button, "is-wrong");
      this.flashRing("error");
    }

    handleMissed() {
      this.appendQuestionLog({
        selected_symbol_id: null,
        is_correct: false,
        fail_type: "no_response",
        input_type: null
      });
      this.state.totalTrials += 1;
      this.state.missedCount += 1;
      this.state.consecutiveWrong = 0;
      this.showFeedback("괜찮아요. 다음 표식으로 가요.", "gentle", 750, () => this.advanceTrial());
    }

    handleXSuccess() {
      const noteIndex = Number.isFinite(this.state.currentPrompt.noteIndex)
        ? this.state.currentPrompt.noteIndex
        : this.state.currentNoteIndex;

      this.appendQuestionLog({
        selected_symbol_id: null,
        is_correct: true,
        response_time_ms: Math.round(this.state.noTouchElapsed * 1000),
        input_type: null
      });
      this.state.totalTrials += 1;
      this.state.xSuccessCount += 1;
      this.state.completedNoteCount += 1;
      this.state.currentNoteIndex = noteIndex + 1;
      this.state.consecutiveWrong = 0;
      this.flashRing("success");

      if (this.shouldCompleteSession()) {
        this.finishAfterSymbolExit("completed");
        return;
      }

      if (this.shouldWaitForSymbolExitBeforeAdvance()) {
        this.state.feedbackLocked = true;
        this.animateSymbolExit("top-left", () => {
          if (!this.state || this.state.ended) {
            return;
          }

          this.state.feedbackLocked = false;
          this.lastTick = performance.now();
          this.advanceTrial();
        });
      } else {
        this.animateSymbolExit("top-left");
        this.advanceTrial();
      }
    }

    handleXFail(button, symbolId, inputType, externalInput) {
      this.appendQuestionLog({
        selected_symbol_id: symbolId,
        is_correct: false,
        fail_type: "x_tapped",
        input_type: inputType || "touch",
        ...this.createExternalQuestionFields(externalInput)
      });
      this.state.totalTrials += 1;
      this.state.xFailCount += 1;
      this.state.wrongCount += 1;
      this.state.totalTouchMissCount += 1;
      this.state.consecutiveWrong += 1;
      this.flashPad(button, "is-wrong");
      this.flashRing("error");
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
        this.flashPad(pad, "is-hint", 2200);
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

    pause(options = {}) {
      const canPauseDuringSongTransition = this.state && this.state.feedbackLocked && this.state.songTransitionLocked;
      if (!this.state || this.state.ended || this.state.feedbackLocked && !canPauseDuringSongTransition) {
        return;
      }

      const wasPaused = this.state.paused;
      this.state.paused = true;
      if (!wasPaused && options.count !== false) {
        this.state.pauseCount += 1;
      }
      if (options.showOverlay === false) {
        this.elements.pauseOverlay.classList.remove("is-visible");
      } else {
        this.elements.pauseOverlay.classList.add("is-visible");
      }
    }

    resume() {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.paused = false;
      this.lastTick = performance.now();
      this.elements.pauseOverlay.classList.remove("is-visible");
    }

    restart() {
      if (!this.state) {
        return;
      }

      const difficulty = this.state.difficulty;
      this.stopTick();
      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";

      if (typeof this.onRestart === "function") {
        this.onRestart(difficulty);
        return;
      }

      this.start(difficulty, this.state.runtimeConfig);
    }

    quit() {
      if (this.state) {
        if (window.ResultBridge && typeof window.ResultBridge.handleGameExitRequested === "function") {
          window.ResultBridge.handleGameExitRequested("user_exit", this.state);
        }
        this.abort("user_exit");
        return;
      }
      this.elements.pauseOverlay.classList.remove("is-visible");
      if (window.ResultBridge) {
        window.ResultBridge.handleGameExitRequested("user_exit");
      }
      window.dispatchEvent(new CustomEvent("melody-drum:go-home"));
    }

    finish(reason) {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.status = "completed";
      this.state.exitReason = reason || "completed";
      this.state.ended = true;
      this.stopTick();
      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";
      const result = window.ResultManager.calculateResult(this.state);
      console.log("result_detail_json", result);
      this.onFinish(result);
    }

    abort(reason) {
      if (!this.state || this.state.ended) {
        return;
      }

      this.state.status = "abandoned";
      this.state.exitReason = reason || "abandoned";
      this.state.abandonedAt = new Date().toISOString();
      this.state.ended = true;
      this.stopTick();
      this.elements.pauseOverlay.classList.remove("is-visible");
      this.elements.feedbackOverlay.className = "feedback-overlay";
      const result = window.ResultManager.calculateResult(this.state);
      result.status = "abandoned";
      result.completed = false;
      result.exit_reason = this.state.exitReason;
      result.ended_reason = this.state.exitReason;
      result.abandon_reason = this.state.exitReason;
      this.onFinish(result);
    }

    stopTick() {
      if (this.tickHandle) {
        window.clearInterval(this.tickHandle);
        this.tickHandle = null;
      }

      this.clearPreviewAnimation();
      this.resetRenderedPromptKeys();
      this.clearCorrectAnimation();
      window.clearTimeout(this.successGlowHandle);
      this.successGlowHandle = null;
      if (this.elements.currentSymbol) {
        this.elements.currentSymbol.classList.remove("is-success-glow", "is-error-glow");
      }
    }

    render() {
      if (!this.state) {
        return;
      }

      const progressRate = this.state.config.sessionTime > 0
        ? Math.max(0, Math.min(1, this.state.sessionRemaining / this.state.config.sessionTime))
        : 0;
      const remainingSeconds = Math.max(0, Math.ceil(this.state.sessionRemaining));
      const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
      const seconds = String(remainingSeconds % 60).padStart(2, "0");
      this.elements.timeText.textContent = `${minutes}:${seconds}`;
      this.elements.progressFill.style.removeProperty("width");
      this.elements.progressFill.style.setProperty("--progress-clip", `${(1 - progressRate) * 100}%`);

      if (this.state.currentPrompt) {
        const currentPromptKey = this.getPromptRenderKey(this.state.currentPrompt);

        this.elements.promptMessage.textContent = "";
        if (this.renderedCurrentPromptKey !== currentPromptKey) {
          this.elements.currentSymbol.innerHTML = this.getSymbolHtml(this.state.currentPrompt);
          this.elements.currentSymbol.setAttribute("aria-label", this.state.currentPrompt.label);
          this.renderedCurrentPromptKey = currentPromptKey;
        }
      }

      if (this.state.config.previewEnabled && this.state.nextPrompt) {
        const nextPromptKey = this.getPromptRenderKey(this.state.nextPrompt);

        if (this.renderedNextPromptKey !== nextPromptKey) {
          this.elements.nextSymbol.innerHTML = this.getSymbolHtml(this.state.nextPrompt);
          this.renderedNextPromptKey = nextPromptKey;
        }
      } else {
        if (this.renderedNextPromptKey !== "") {
          this.elements.nextSymbol.innerHTML = "";
          this.renderedNextPromptKey = "";
        }
      }
    }

    getPromptRenderKey(prompt) {
      if (!prompt) {
        return "";
      }

      return [
        prompt.id || "",
        prompt.label || "",
        prompt.isX ? "x" : "symbol",
        Number.isFinite(prompt.noteIndex) ? prompt.noteIndex : ""
      ].join("|");
    }
  }

  window.MelodyDrumGame = MelodyDrumGame;
})();
