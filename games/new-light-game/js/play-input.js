(function (global) {
  "use strict";

  const LAST_CORRECT_FEEDBACK_DELAY_MS = 900;
  const CORRECT_TRANSITION_DELAY_MS = 450;
  const CARE_GUIDE_STAGE_MS = 2000;
  const CARE_COVER_STAGE_MS = 4000;

  class MemoryBulbGame {
    constructor(options) {
      this.elements = options.elements;
      this.audio = options.audio;
      this.onFinish = options.onFinish;
      this.onExit = options.onExit;
      this.sessionMeta = options.sessionMeta;
      this.resetState();
    }

    resetState() {
      this.phase = GAME_PHASE.IDLE;
      this.phaseBeforePause = GAME_PHASE.IDLE;
      this.difficultyKey = "easy";
      this.effectiveDifficultyKey = "easy";
      this.difficulty = DIFFICULTY_CONFIG.easy;
      this.mode = "standard";
      this.modeConfig = MODE_CONFIG.standard;
      this.themeKey = "bulb";
      this.theme = THEME_CONFIG.bulb;
      this.targetObject = "bulb";
      this.totalQuestions = 10;
      this.currentQuestionNumber = 0;
      this.targetIndexes = [];
      this.selectedIndexes = [];
      this.questionResults = [];
      this.currentRoundStartAt = 0;
      this.selectStartedAt = 0;
      this.firstResponseAt = 0;
      this.currentQuestionHintUsed = false;
      this.currentQuestionHintCount = 0;
      this.currentWrongCount = 0;
      this.currentCorrectClickCount = 0;
      this.currentSelections = [];
      this.currentInputTypes = [];
      this.hintTriggeredCount = 0;
      this.hintActive = false;
      this.hintTimer = null;
      this.autoHintTimer = null;
      this.hintEndAt = 0;
      this.hintTargets = [];
      this.pauseCount = 0;
      this.interactionCount = 0;
      this.externalInputs = [];
      this.startedAt = 0;
      this.startedAtIso = "";
      this.endedAt = 0;
      this.sessionId = "";
      this.exitedEarly = false;
      this.exitReason = "";
      this.totalEndAt = 0;
      this.totalRemainingMs = 0;
      this.roundEndAt = 0;
      this.phaseEndAt = 0;
      this.memoryGaugeEndAt = 0;
      this.memoryGaugeDurationMs = 3000;
      this.feedbackEndAt = 0;
      this.feedbackAction = "";
      this.roundTransitionDelayUntil = 0;
      this.careFlowStep = "";
      this.carePresentationVisible = false;
      this.pausedRemaining = null;
      this.promptFeedbackTimer = null;
      this.condition = {};
      this.finishCheck = {};
      this.timers = [];
      this.intervals = [];
      this.totalInterval = null;
    }

    start(options) {
      this.stop();
      this.resetState();

      this.mode = options.mode || "standard";
      this.modeConfig = options.modeConfig || MODE_CONFIG.standard;
      this.difficultyKey = options.difficultyKey || "easy";
      this.effectiveDifficultyKey = this.modeConfig.difficultyOverride || this.difficultyKey;
      this.difficulty = this.resolveDifficultyConfig();
      this.themeKey = "bulb";
      this.theme = THEME_CONFIG.bulb;
      this.totalQuestions = this.modeConfig.totalQuestions;
      this.condition = options.condition || {};
      this.finishCheck = {};
      this.sessionMeta = options.sessionMeta || this.sessionMeta || {};
      this.sessionId = this.sessionMeta.sessionId || ResultBuilder.buildSessionId();
      this.startedAt = performance.now();
      this.startedAtIso = new Date().toISOString();

      const totalLimit = this.modeConfig.totalLimitMs || this.difficulty.totalLimitMs;
      this.totalRemainingMs = totalLimit;
      this.totalEndAt = 0;
      this.elements.pauseOverlay.hidden = true;
      this.elements.resultNotice.textContent = "";
      this.startNextQuestion();
      this.startTotalTimer();
    }

    resolveDifficultyConfig() {
      const base = Object.assign({}, DIFFICULTY_CONFIG[this.effectiveDifficultyKey] || DIFFICULTY_CONFIG[this.difficultyKey] || DIFFICULTY_CONFIG.easy);

      if (this.modeConfig.gridRows) {
        base.gridRows = this.modeConfig.gridRows;
        this.effectiveDifficultyKey = this.modeConfig.difficultyOverride || "custom";
      }

      if (this.modeConfig.gridCols) {
        base.gridCols = this.modeConfig.gridCols;
        this.effectiveDifficultyKey = this.modeConfig.difficultyOverride || "custom";
      }

      if (this.modeConfig.targetCount) {
        base.targetCount = this.modeConfig.targetCount;
        this.effectiveDifficultyKey = this.modeConfig.difficultyOverride || "custom";
      }

      if (this.usesCareGuidedFlow()) {
        const careTargetCounts = {
          easy: 1,
          normal: 2,
          hard: 3
        };
        if (careTargetCounts[this.effectiveDifficultyKey]) {
          base.targetCount = careTargetCounts[this.effectiveDifficultyKey];
        }
      }

      if (this.modeConfig.totalLimitMs) {
        base.totalLimitMs = this.modeConfig.totalLimitMs;
      }

      if (!base.label && this.effectiveDifficultyKey === "custom") {
        base.label = "맞춤 활동";
      }

      return base;
    }

    stop(exitReason) {
      this.clearAllTimers();
      this.stopMemoryCountdownGauge();
      this.phase = GAME_PHASE.IDLE;

      if (this.elements && this.elements.grid) {
        this.elements.grid.innerHTML = "";
      }

      this.hideRoundTransition();
      this.clearPromptFeedback();

      if (this.elements && this.elements.pauseOverlay) {
        this.elements.pauseOverlay.hidden = true;
      }

      if (exitReason && this.startedAt) {
        this.exitedEarly = true;
        this.exitReason = exitReason;
      }
    }

    startNextQuestion() {
      this.clearRoundTimers();
      this.hideRoundTransition();
      this.clearPromptFeedback();

      if (this.currentQuestionNumber >= this.totalQuestions) {
        this.finish();
        return;
      }

      if (this.totalRemainingMs <= 0) {
        this.finish("total_timeout");
        return;
      }

      this.currentQuestionNumber += 1;
      this.phase = GAME_PHASE.MEMORIZE;
      this.targetObject = "bulb";
      this.targetIndexes = this.pickIndexes(this.difficulty.targetCount, []);
      this.feedbackEndAt = 0;
      this.feedbackAction = "";
      this.careFlowStep = "";
      this.carePresentationVisible = false;
      this.selectedIndexes = [];
      this.currentSelections = [];
      this.clearHintState();
      this.currentQuestionHintUsed = false;
      this.currentQuestionHintCount = 0;
      this.currentWrongCount = 0;
      this.currentCorrectClickCount = 0;
      this.currentInputTypes = [];
      this.firstResponseAt = 0;
      this.currentRoundStartAt = performance.now();
      this.renderGrid(false);
      this.updateHud();
      this.updatePhaseTimer(0);

      if (this.usesCareGuidedFlow()) {
        this.startCareGuideStage();
        return;
      }

      this.phaseEndAt = performance.now() + this.modeConfig.exposureTimeMs;
      this.startMemoryCountdownGauge(this.modeConfig.exposureTimeMs);
      this.setStatus(this.buildMemoryPrompt());
      this.audio.play("sparkle");
      if (this.usesStandardReminderVoice()) {
        this.audio.play("memoryVoice");
      }

      this.setTimer(() => {
        this.flipToSelecting();
      }, this.modeConfig.exposureTimeMs);
    }

    usesCareGuidedFlow() {
      return this.mode === "care" || this.mode === "ai_assisted";
    }

    usesSoftCareFeedback() {
      return this.usesCareGuidedFlow() && this.modeConfig.softFeedback;
    }

    usesStandardReminderVoice() {
      return this.mode === "standard" || this.mode === "reminder";
    }

    startCareGuideStage() {
      if (this.phase !== GAME_PHASE.MEMORIZE) {
        return;
      }

      this.careFlowStep = "guide";
      this.carePresentationVisible = false;
      this.stopMemoryCountdownGauge();
      this.renderGrid(false);
      this.updatePhaseTimer(0);
      this.phaseEndAt = performance.now() + CARE_GUIDE_STAGE_MS;
      this.setStatus("불이 켜지는 곳을 같이 볼까요?");
      this.audio.play("careMemoryVoice");
      this.updatePauseButton();
      this.setTimer(() => this.startCarePresentationStage(), CARE_GUIDE_STAGE_MS);
    }

    startCarePresentationStage() {
      if (this.phase !== GAME_PHASE.MEMORIZE) {
        return;
      }

      this.careFlowStep = "presentation";
      this.carePresentationVisible = true;
      this.renderGrid(false);
      this.updatePhaseTimer(0);
      this.phaseEndAt = performance.now() + this.modeConfig.exposureTimeMs;
      this.startMemoryCountdownGauge(this.modeConfig.exposureTimeMs);
      this.setStatus("불이 켜지는 곳을 같이 볼까요?");
      this.audio.play("sparkle");
      this.updatePauseButton();
      this.setTimer(() => this.startCareCoverStage(), this.modeConfig.exposureTimeMs);
    }

    startCareCoverStage() {
      if (this.phase !== GAME_PHASE.MEMORIZE) {
        return;
      }

      this.careFlowStep = "cover";
      this.carePresentationVisible = false;
      this.stopMemoryCountdownGauge();
      this.renderGrid(false);
      this.updatePhaseTimer(0);
      this.phaseEndAt = performance.now() + CARE_COVER_STAGE_MS;
      this.setStatus("좋아요. 이제 같은 곳을 찾아볼까요?");
      this.audio.play("careHideVoice");
      this.updatePauseButton();
      this.setTimer(() => this.flipToSelecting(), CARE_COVER_STAGE_MS);
    }

    pickIndexes(count, excluded) {
      const totalCells = this.difficulty.gridRows * this.difficulty.gridCols;
      const indexes = [];

      while (indexes.length < count && indexes.length + excluded.length < totalCells) {
        const index = Math.floor(Math.random() * totalCells);

        if (!indexes.includes(index) && !excluded.includes(index)) {
          indexes.push(index);
        }
      }

      return indexes.sort((a, b) => a - b);
    }

    getObjectLabel() {
      return "전구";
    }

    buildMemoryPrompt() {
      if (this.usesCareGuidedFlow()) {
        return "불이 켜지는 곳을 같이 볼까요?";
      }

      const objectLabel = this.getObjectLabel(this.targetObject);

      if (objectLabel === "전구") {
        return "빛나는 전구의 위치를 기억하세요!";
      }

      return "빛나는 " + objectLabel + "의 위치를 기억하세요!";
    }

    buildSelectionPrompt() {
      if (this.usesCareGuidedFlow()) {
        return "방금 불이 켜졌던 곳을 눌러주세요.";
      }

      return "빛나는 전구가 있었던 위치를 골라주세요!";
    }

    flipToSelecting() {
      if (this.phase !== GAME_PHASE.MEMORIZE) {
        return;
      }

      this.clearRoundTimers();
      this.stopMemoryCountdownGauge();
      this.careFlowStep = "";
      this.carePresentationVisible = false;
      this.phase = GAME_PHASE.SELECTING;
      this.selectStartedAt = performance.now();
      this.resumeTotalCountdown();
      this.roundEndAt = 0;
      this.renderGrid(true);
      this.updatePhaseTimer(0);
      this.setStatus(this.buildSelectionPrompt());
      this.audio.play("flip");
      if (this.usesStandardReminderVoice()) {
        this.audio.play("questionVoice");
      } else if (this.usesCareGuidedFlow()) {
        this.audio.play("careSelectVoice");
      }
      this.updatePauseButton();

      this.scheduleAutoHint();
    }

    renderGrid(isSelecting) {
      const totalCells = this.difficulty.gridRows * this.difficulty.gridCols;
      const grid = this.elements.grid;

      grid.innerHTML = "";
      grid.className = "bulb-grid grid-" + this.difficulty.gridRows;
      if (this.difficulty.gridRows === 3 && this.difficulty.gridCols === 4) {
        grid.classList.add("grid-3x4");
      }
      if (this.elements.playArea) {
        this.elements.playArea.classList.toggle("is-grid-3x4", this.difficulty.gridRows === 3 && this.difficulty.gridCols === 4);
      }
      if (this.elements.playPrompt) {
        this.elements.playPrompt.classList.toggle("is-grid-3x4", this.difficulty.gridRows === 3 && this.difficulty.gridCols === 4);
      }
      grid.style.setProperty("--grid-cols", String(this.difficulty.gridCols));
      grid.style.setProperty("--grid-rows", String(this.difficulty.gridRows));
      this.updateBoardFrameSize();

      for (let index = 0; index < totalCells; index += 1) {
        const button = document.createElement("button");
        const isTarget = this.targetIndexes.includes(index);

        button.type = "button";
        button.className = "bulb-card";
        button.dataset.index = String(index);
        button.setAttribute("aria-label", "전구 위치 " + (index + 1));
        button.disabled = !isSelecting;

        if (isSelecting) {
          button.classList.add("is-hidden-face");
        }

        if (this.phase === GAME_PHASE.MEMORIZE && isTarget && this.shouldShowMemoryTarget()) {
          if (this.usesCareGuidedFlow()) {
            button.classList.add("is-care-lighting");
          } else {
            button.classList.add("is-sparkling");
          }
        }

        button.innerHTML = this.createCardHtml();
        this.applyCardInlineStyles(button);
        button.addEventListener("pointerup", (event) => {
          event.preventDefault();
          this.handleCellSelect(index);
        });

        grid.appendChild(button);
      }
    }

    shouldShowMemoryTarget() {
      return this.usesCareGuidedFlow() ? this.carePresentationVisible : true;
    }

    updateBoardFrameSize() {
      const grid = this.elements.grid;
      const playArea = this.elements.playArea;
      const cardMetrics = {
        2: { card: 205, gap: 18 },
        3: { card: 148, gap: 14 },
        4: { card: 110, gap: 10 }
      };
      const metrics = this.difficulty.gridRows === 3 && this.difficulty.gridCols === 4
        ? { card: 145, gap: 14 }
        : cardMetrics[this.difficulty.gridRows] || cardMetrics[3];
      const padding = 48;
      const gridWidth = (this.difficulty.gridCols * metrics.card) + ((this.difficulty.gridCols - 1) * metrics.gap) + padding;
      const gridHeight = (this.difficulty.gridRows * metrics.card) + ((this.difficulty.gridRows - 1) * metrics.gap) + padding;
      const boardTop = 190 + ((520 - gridHeight) / 2);

      if (grid) {
        grid.style.setProperty("--board-width", gridWidth + "px");
        grid.style.setProperty("--board-height", gridHeight + "px");
        grid.style.setProperty("--board-top", boardTop + "px");
      }
      if (playArea) {
        playArea.style.setProperty("--board-width", gridWidth + "px");
        playArea.style.setProperty("--board-height", gridHeight + "px");
        playArea.style.setProperty("--board-top", boardTop + "px");
      }
    }

    createCardHtml() {
      const visual = [
        '    <span class="bulb-icon" aria-hidden="true">',
        '      <img class="bulb-image bulb-image-off" src="assets/images/turn_off.webp" alt="" />',
        '      <img class="bulb-image bulb-image-on" src="assets/images/turn_on.webp" alt="" />',
        "    </span>"
      ].join("");
      return [
        '<span class="card-inner">',
        '  <span class="card-face card-front">',
        visual,
        "  </span>",
        '  <span class="card-face card-back" aria-hidden="true">',
        '    <span class="back-mark"></span>',
        "  </span>",
        "</span>"
      ].join("");
    }

    applyCardInlineStyles(button) {
      const metricsByRows = {
        2: { width: 205, height: 205 },
        3: { width: 160, height: 160 },
        4: { width: 120, height: 120 }
      };
      const metrics = metricsByRows[this.difficulty.gridRows] || metricsByRows[3];
      const inner = button.querySelector(".card-inner");
      const faces = button.querySelectorAll(".card-face");
      const bulbIcon = button.querySelector(".bulb-icon");
      const bulbImages = button.querySelectorAll(".bulb-image");

      button.style.position = "relative";
      button.style.display = "block";
      button.style.width = metrics.width + "px";
      button.style.height = metrics.height + "px";
      button.style.padding = "0";
      button.style.border = "0";
      button.style.background = "transparent";

      if (inner) {
        inner.style.position = "relative";
        inner.style.display = "block";
        inner.style.width = "100%";
        inner.style.height = "100%";
      }

      faces.forEach((face) => {
        face.style.position = "absolute";
        face.style.inset = "0";
        face.style.display = "flex";
        face.style.alignItems = "center";
        face.style.justifyContent = "center";
        face.style.width = "100%";
        face.style.height = "100%";
      });

      if (bulbIcon) {
        bulbIcon.style.position = "relative";
        bulbIcon.style.display = "block";
        bulbIcon.style.width = "76%";
        bulbIcon.style.height = "88%";
      }

      bulbImages.forEach((image) => {
        image.style.position = "absolute";
        image.style.inset = "0";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "contain";
      });
    }

    handleCellSelect(index, inputType) {
      if (this.phase !== GAME_PHASE.SELECTING || this.hintActive) {
        return;
      }

      this.interactionCount += 1;
      this.resetAutoHintInactivityTimer();

      if (!this.firstResponseAt) {
        this.firstResponseAt = performance.now();
      }

      if (this.selectedIndexes.includes(index)) {
        return;
      }

      this.selectedIndexes.push(index);
      this.currentSelections.push(index);
      this.currentInputTypes.push(inputType || "touch");
      const button = this.findCell(index);
      const isCorrect = this.targetIndexes.includes(index);

      if (isCorrect) {
        this.currentCorrectClickCount += 1;
        if (button) {
          button.classList.remove("is-hidden-face");
          button.classList.add("is-selected", "is-correct");
        }
        this.audio.play("correct");

        if (this.targetIndexes.every((target) => this.selectedIndexes.includes(target))) {
          this.clearRoundTimers();
          this.freezeTotalCountdown();
          this.updateHud();
          this.finishRound(true, "");
          return;
        }

        this.updateHud();
        return;
      }

      this.currentWrongCount += 1;
      if (button) {
        button.classList.add("is-wrong");
      }
      if (this.usesStandardReminderVoice()) {
        this.audio.play("retry");
      } else if (!this.usesCareGuidedFlow()) {
        this.audio.play("wrong");
      }

      if (this.currentWrongCount >= 3) {
        if (this.usesStandardReminderVoice()) {
          this.audio.play("retry3Voice");
        }
        this.finishRound(false, "wrong_limit");
        return;
      }

      if (this.usesStandardReminderVoice()) {
        this.audio.play("retryVoice");
      } else if (this.usesCareGuidedFlow()) {
        this.audio.play("wrong");
        this.audio.play("careRetryVoice");
      } else {
        this.audio.play("wrong");
      }

      const wrongFeedbackMessage = this.usesSoftCareFeedback()
        ? "괜찮아요. 천천히 다시 기억해 볼까요?"
        : "다시 골라보세요.";
      this.showPromptFeedback(wrongFeedbackMessage, "wrong");
      this.updateHud();
    }

    finishRound(isCorrect, failReason) {
      if (this.phase !== GAME_PHASE.SELECTING && this.phase !== GAME_PHASE.FEEDBACK) {
        return;
      }

      this.clearRoundTimers();
      this.freezeTotalCountdown();
      this.phase = GAME_PHASE.FEEDBACK;
      const now = performance.now();
      const selected = this.currentSelections.slice();
      const responseTime = Math.round(now - this.selectStartedAt);
      const firstResponseTime = this.firstResponseAt ? Math.round(this.firstResponseAt - this.selectStartedAt) : 0;

      const isLastQuestion = this.currentQuestionNumber >= this.totalQuestions;

      if (isCorrect) {
        this.revealTargets("is-correct");
        if (!isLastQuestion) {
          this.roundTransitionDelayUntil = performance.now() + CORRECT_TRANSITION_DELAY_MS;
          if (this.usesSoftCareFeedback()) {
            this.showRoundTransition("좋습니다. 잘 보셨어요.", "하나만 더 해볼까요?", "힘드시면 쉬어도 괜찮아요.", "softFeedbackCorrectVoice");
          } else {
            this.showRoundTransition("잘 기억하셨어요!", "다음 문제로 넘어갈게요.", "", this.usesStandardReminderVoice() ? "correctVoice" : "");
          }
        } else {
          this.setStatus("");
        }
      } else {
        if (failReason === "wrong_limit") {
          if (this.usesSoftCareFeedback()) {
            this.showRoundTransition("조금 헷갈릴 수 있어요.", "천천히 다시 같이 가볼까요?", "", this.usesCareGuidedFlow() ? "softFeedbackRetry3Voice" : "");
          } else {
            this.showRoundTransition("괜찮아요", "다음 문제로 넘어갈게요.");
          }
        } else {
          this.setStatus(failReason === "timeout" ? "시간이 지나 다음 문제로 넘어갈게요." : "괜찮아요. 다음 문제로 넘어가볼게요.");
        }
      }

      this.questionResults.push({
        question_index: this.currentQuestionNumber,
        questionInstanceId: this.sessionId + "-" + this.currentQuestionNumber,
        difficulty: this.difficultyKey,
        effectiveDifficulty: this.effectiveDifficultyKey,
        grid_rows: this.difficulty.gridRows,
        grid_cols: this.difficulty.gridCols,
        grid_size: this.difficulty.gridRows + "x" + this.difficulty.gridCols,
        target_count: this.difficulty.targetCount,
        max_target_count: this.difficulty.targetCount,
        exposure_time_ms: this.modeConfig.exposureTimeMs,
        question_type: "position_memory",
        cognitive_domain: "memory_activity",
        target_object: this.targetObject,
        target_object_label: this.getObjectLabel(this.targetObject),
        target_positions: this.targetIndexes.slice(),
        selected_positions: selected,
        input_types: this.currentInputTypes.slice(),
        is_correct: isCorrect,
        durationMs: Math.round(now - this.currentRoundStartAt),
        attempt_count: selected.length,
        correctClickCount: this.currentCorrectClickCount,
        wrongClickCount: this.currentWrongCount,
        wrong_tap_count: this.currentWrongCount,
        first_response_time_ms: firstResponseTime,
        response_time_ms: responseTime,
        hint_used: this.currentQuestionHintUsed,
        hint_count: this.currentQuestionHintCount,
        failReason: failReason || ""
      });

      this.updateHud();
      const wrongLimitDelay = this.usesCareGuidedFlow() ? 4000 : 3000;
      const nextDelay = isLastQuestion && isCorrect ? LAST_CORRECT_FEEDBACK_DELAY_MS : (isCorrect ? 3000 : (failReason === "wrong_limit" ? wrongLimitDelay : 5000));
      this.feedbackEndAt = performance.now() + nextDelay;
      this.feedbackAction = "startNextQuestion";
      this.setTimer(() => {
        this.startNextQuestion();
      }, nextDelay);
    }

    showHint() {
      if (this.phase !== GAME_PHASE.SELECTING || !this.modeConfig.hintEnabled || this.hintActive || (this.currentQuestionHintUsed && !this.keepsHintButtonActive())) {
        return;
      }

      const notFoundTargets = this.targetIndexes.filter((index) => !this.selectedIndexes.includes(index));

      if (!notFoundTargets.length) {
        return;
      }

      this.currentQuestionHintUsed = true;
      this.currentQuestionHintCount += 1;
      this.hintTriggeredCount += 1;
      this.interactionCount += 1;
      this.clearAutoHintTimer();
      this.hintActive = true;
      this.hintTargets = notFoundTargets.slice();
      this.hintEndAt = performance.now() + 3000;
      if (this.elements.playArea) {
        this.elements.playArea.classList.add("is-hinting");
      }
      if (this.elements.hintButton) {
        this.elements.hintButton.disabled = !this.keepsHintButtonActive();
      }
      this.audio.play("hint");
      this.setStatus("잠시 동안 보여 드릴게요!");
      if (this.elements.playPrompt) {
        this.elements.playPrompt.classList.add("is-hint-message");
      }
      notFoundTargets.forEach((index) => {
        const button = this.findCell(index);
        if (button) {
          button.classList.add("is-hint");
        }
      });

      this.scheduleHintClear(3000);
      this.updateHud();
    }

    pause(options = {}) {
      if (this.phase !== GAME_PHASE.MEMORIZE && this.phase !== GAME_PHASE.SELECTING && this.phase !== GAME_PHASE.FEEDBACK) {
        return;
      }

      this.phaseBeforePause = this.phase;
      if (this.phaseBeforePause === GAME_PHASE.SELECTING) {
        this.freezeTotalCountdown();
      }
      this.phase = GAME_PHASE.PAUSED;
      if (options.countPause !== false) {
        this.pauseCount += 1;
        this.interactionCount += 1;
      }
      this.pausedRemaining = {
        phase: this.phaseEndAt ? Math.max(0, this.phaseEndAt - performance.now()) : null,
        memoryGauge: this.getMemoryGaugeRemaining(),
        memoryGaugeDuration: this.memoryGaugeDurationMs,
        round: this.roundEndAt ? Math.max(0, this.roundEndAt - performance.now()) : null,
        feedback: this.feedbackEndAt ? Math.max(0, this.feedbackEndAt - performance.now()) : null,
        hint: this.hintActive && this.hintEndAt ? Math.max(0, this.hintEndAt - performance.now()) : null,
        total: this.getTotalRemaining(),
        careFlowStep: this.careFlowStep
      };
      this.clearAllTimers();
      this.elements.pauseOverlay.hidden = options.showOverlay === false;
      if (options.showOverlay !== false) {
        this.setStatus("잠시 쉬는 중이에요.");
      }
      this.updatePauseButton();
    }

    resume() {
      if (this.phase !== GAME_PHASE.PAUSED) {
        return;
      }

      this.elements.pauseOverlay.hidden = true;

      if (this.pausedRemaining && this.pausedRemaining.total !== null) {
        this.totalRemainingMs = this.pausedRemaining.total;
        this.totalEndAt = 0;
      }

      this.startTotalTimer();

      if (this.phaseBeforePause === GAME_PHASE.MEMORIZE) {
        if (this.usesCareGuidedFlow()) {
          this.resumeCareGuidedFlow();
          return;
        }

        this.phase = GAME_PHASE.MEMORIZE;
        this.setStatus(this.buildMemoryPrompt());
        const remaining = this.pausedRemaining && this.pausedRemaining.phase ? this.pausedRemaining.phase : 1200;
        this.setTimer(() => this.flipToSelecting(), remaining);
        this.updatePhaseTimer(0);
        this.phaseEndAt = performance.now() + remaining;
        const gaugeDuration = this.pausedRemaining && this.pausedRemaining.memoryGaugeDuration ? this.pausedRemaining.memoryGaugeDuration : this.modeConfig.exposureTimeMs;
        const gaugeRemaining = this.pausedRemaining && this.pausedRemaining.memoryGauge !== null ? this.pausedRemaining.memoryGauge : Math.min(gaugeDuration, remaining);
        this.startMemoryCountdownGauge(gaugeDuration, Math.min(gaugeRemaining, remaining));
        this.updatePauseButton();
        return;
      }

      if (this.phaseBeforePause === GAME_PHASE.FEEDBACK) {
        this.phase = GAME_PHASE.FEEDBACK;
        const remaining = this.pausedRemaining && this.pausedRemaining.feedback ? this.pausedRemaining.feedback : 1000;
        this.feedbackEndAt = performance.now() + remaining;
        if (this.feedbackAction === "finishRoundCorrect") {
          this.setTimer(() => this.finishRound(true, ""), remaining);
        } else {
          this.setTimer(() => this.startNextQuestion(), remaining);
        }
        this.updatePauseButton();
        return;
      }

      this.phase = GAME_PHASE.SELECTING;
      this.resumeTotalCountdown();
      this.roundEndAt = 0;
      this.updatePhaseTimer(0);
      if (this.hintActive) {
        const hintRemaining = this.pausedRemaining && this.pausedRemaining.hint !== null ? this.pausedRemaining.hint : 0;
        if (hintRemaining > 0) {
          this.setStatus("잠시 동안 보여 드릴게요!");
          if (this.elements.playPrompt) {
            this.elements.playPrompt.classList.add("is-hint-message");
          }
          if (this.elements.playArea) {
            this.elements.playArea.classList.add("is-hinting");
          }
          this.hintEndAt = performance.now() + hintRemaining;
          this.scheduleHintClear(hintRemaining);
        } else {
          this.finishHintDisplay();
        }
      } else {
        this.setStatus(this.buildSelectionPrompt());
        this.scheduleAutoHint();
      }
      this.updatePauseButton();
    }

    resumeCareGuidedFlow() {
      this.phase = GAME_PHASE.MEMORIZE;
      const step = this.pausedRemaining && this.pausedRemaining.careFlowStep ? this.pausedRemaining.careFlowStep : "guide";
      const remaining = this.pausedRemaining && this.pausedRemaining.phase ? this.pausedRemaining.phase : CARE_GUIDE_STAGE_MS;

      this.careFlowStep = step;
      this.carePresentationVisible = step === "presentation";
      this.phaseEndAt = performance.now() + remaining;
      this.renderGrid(false);
      this.updatePhaseTimer(0);

      if (step === "presentation") {
        const gaugeDuration = this.pausedRemaining && this.pausedRemaining.memoryGaugeDuration ? this.pausedRemaining.memoryGaugeDuration : this.modeConfig.exposureTimeMs;
        const gaugeRemaining = this.pausedRemaining && this.pausedRemaining.memoryGauge !== null ? this.pausedRemaining.memoryGauge : Math.min(gaugeDuration, remaining);
        this.startMemoryCountdownGauge(gaugeDuration, Math.min(gaugeRemaining, remaining));
        this.setStatus("불이 켜지는 곳을 같이 볼까요?");
        this.setTimer(() => this.startCareCoverStage(), remaining);
      } else if (step === "cover") {
        this.stopMemoryCountdownGauge();
        this.setStatus("좋아요. 이제 같은 곳을 찾아볼까요?");
        this.setTimer(() => this.flipToSelecting(), remaining);
      } else {
        this.stopMemoryCountdownGauge();
        this.setStatus("불이 켜지는 곳을 같이 볼까요?");
        this.setTimer(() => this.startCarePresentationStage(), remaining);
      }

      this.updatePauseButton();
    }

    handleExternalAnswer(payload) {
      if (!this.modeConfig.externalInputEnabled || this.phase !== GAME_PHASE.SELECTING) {
        return false;
      }

      const answer = payload && (
        payload.selected_answer
        || payload.selectedAnswer
        || payload.selected_position
        || payload.selectedPosition
        || payload.selected_index
        || payload.selectedIndex
        || payload.answer
      );
      const rawTranscript = payload && (payload.raw_transcript || payload.rawTranscript || "");
      let index = this.externalAnswerToIndex(answer);
      if (index < 0 && rawTranscript) {
        index = this.externalAnswerToIndex(rawTranscript);
      }

      this.externalInputs.push({
        input_type: payload.input_type || payload.inputType || "external",
        selected_answer: answer,
        selected_position: index >= 0 ? this.indexToPosition(index) : "",
        selected_index: index,
        raw_transcript: rawTranscript,
        confidence: payload.confidence || null,
        received_at: new Date().toISOString()
      });

      if (index < 0) {
        return false;
      }

      this.handleCellSelect(index, payload.input_type || "external");
      return true;
    }

    externalAnswerToIndex(answer) {
      if (typeof answer === "number") {
        return this.positionToIndex(answer - 1);
      }

      if (typeof answer !== "string") {
        return -1;
      }

      const trimmed = answer.trim();
      if (!trimmed) {
        return -1;
      }

      const positionIndex = this.positionToIndex(trimmed);
      if (positionIndex >= 0) {
        return positionIndex;
      }

      const numericAnswer = this.parseSpokenNumber(trimmed);
      if (numericAnswer === null) {
        return -1;
      }

      return this.positionToIndex(numericAnswer - 1);
    }

    parseSpokenNumber(value) {
      const normalized = String(value)
        .trim()
        .replace(/\s+/g, "")
        .replace(/번째|번|개|칸|위치|전구|정답|답/g, "");
      const directNumber = Number(normalized);

      if (Number.isInteger(directNumber)) {
        return directNumber;
      }

      const koreanNumbers = {
        "일": 1,
        "하나": 1,
        "한개": 1,
        "한": 1,
        "이": 2,
        "둘": 2,
        "두개": 2,
        "두": 2,
        "삼": 3,
        "셋": 3,
        "세개": 3,
        "세": 3,
        "사": 4,
        "넷": 4,
        "네개": 4,
        "네": 4,
        "오": 5,
        "다섯": 5,
        "육": 6,
        "여섯": 6,
        "칠": 7,
        "일곱": 7,
        "팔": 8,
        "여덟": 8,
        "구": 9,
        "아홉": 9,
        "십": 10,
        "열": 10,
        "십일": 11,
        "열하나": 11,
        "십이": 12,
        "열둘": 12,
        "십삼": 13,
        "열셋": 13,
        "십사": 14,
        "열넷": 14,
        "십오": 15,
        "열다섯": 15,
        "십육": 16,
        "열여섯": 16
      };

      return koreanNumbers[normalized] || null;
    }

    indexToPosition(index) {
      if (typeof index !== "number" || index < 0 || index >= this.difficulty.gridRows * this.difficulty.gridCols) {
        return "";
      }

      return "r" + (Math.floor(index / this.difficulty.gridCols) + 1) + "c" + ((index % this.difficulty.gridCols) + 1);
    }

    positionToIndex(position) {
      if (typeof position === "number") {
        return position >= 0 && position < this.difficulty.gridRows * this.difficulty.gridCols ? position : -1;
      }

      if (typeof position !== "string") {
        return -1;
      }

      const match = position.match(/^r(\d+)c(\d+)$/i);

      if (!match) {
        return -1;
      }

      const row = Number(match[1]) - 1;
      const col = Number(match[2]) - 1;

      if (row < 0 || col < 0 || row >= this.difficulty.gridRows || col >= this.difficulty.gridCols) {
        return -1;
      }

      return row * this.difficulty.gridCols + col;
    }

    exitToHome() {
      this.exitedEarly = true;
      this.exitReason = "user_exit";
      this.endedAt = performance.now();
      const result = this.buildCurrentResult();
      this.stop("user_exit");
      if (typeof this.onExit === "function") {
        this.onExit(result);
      }
    }

    finish(exitReason) {
      if (this.phase === GAME_PHASE.FINISHED) {
        return;
      }

      this.clearAllTimers();
      this.phase = GAME_PHASE.FINISHED;
      this.endedAt = performance.now();
      this.exitReason = exitReason || this.exitReason;
      this.updatePauseButton();

      const result = this.buildCurrentResult();

      if (typeof this.onFinish === "function") {
        this.onFinish(result);
      }
    }

    buildCurrentResult() {
      return ResultBuilder.build({
        sessionId: this.sessionId,
        userId: this.sessionMeta.userId,
        gameId: this.sessionMeta.gameId,
        gameVersion: this.sessionMeta.gameVersion,
        mode: this.mode,
        difficultyKey: this.difficultyKey,
        effectiveDifficultyKey: this.effectiveDifficultyKey,
        difficulty: this.difficulty,
        modeConfig: this.modeConfig,
        themeKey: this.themeKey,
        theme: this.theme,
        totalQuestions: this.totalQuestions,
        startedAt: this.startedAt,
        startedAtIso: this.startedAtIso,
        endedAt: this.endedAt,
        exitedEarly: this.exitedEarly,
        exitReason: this.exitReason,
        hintTriggeredCount: this.hintTriggeredCount,
        pauseCount: this.pauseCount,
        interactionCount: this.interactionCount,
        externalInputs: this.externalInputs,
        sessionMeta: this.sessionMeta,
        questionResults: this.questionResults,
        condition: this.condition,
        finishCheck: this.finishCheck
      });
    }

    setFinishCheck(finishCheck) {
      this.finishCheck = finishCheck || {};
    }

    revealTargets(className) {
      this.targetIndexes.forEach((index) => {
        const button = this.findCell(index);
        if (button) {
          button.classList.remove("is-hidden-face");
          button.classList.add(className);
        }
      });
    }

    findCell(index) {
      return this.elements.grid.querySelector('[data-index="' + index + '"]');
    }

    updateHud() {
      const correctRounds = this.questionResults.filter((item) => item.is_correct).length;
      const current = Math.min(this.currentQuestionNumber, this.totalQuestions);
      const ratio = Math.max(0, Math.min(1, current / this.totalQuestions));
      const progress = Math.round(ratio * 100);
      const remainingTargets = Math.max(0, this.difficulty.targetCount - this.targetIndexes.filter((target) => this.selectedIndexes.includes(target)).length);

      if (this.elements.hudProgress) {
        this.elements.hudProgress.style.setProperty("--hud-progress", `${ratio * 100}%`);
        this.elements.hudProgress.setAttribute("aria-valuemax", String(this.totalQuestions));
        this.elements.hudProgress.setAttribute("aria-valuenow", String(current));
      }
      if (this.elements.hudProgressCurrent) {
        this.elements.hudProgressCurrent.textContent = String(current);
      }
      if (this.elements.hudProgressTotal) {
        this.elements.hudProgressTotal.textContent = String(this.totalQuestions);
      }
      if (this.elements.hudProgressSteps) {
        this.elements.hudProgressSteps.forEach((step, index) => {
          const stepRatio = this.elements.hudProgressSteps.length <= 1 ? 1 : index / (this.elements.hudProgressSteps.length - 1);
          step.classList.toggle("is-active", stepRatio <= ratio);
        });
      }
      this.elements.difficulty.textContent = this.difficulty.label;
      this.elements.score.textContent = correctRounds + "개";
      this.elements.remaining.textContent = remainingTargets + "개";
      this.elements.progressText.textContent = progress + "%";
      this.elements.hintCount.textContent = this.currentQuestionHintCount + "회";
      this.updatePauseButton();
    }

    updateHintButton() {
      if (!this.elements.hintButton) {
        return;
      }
      const canShowHint = this.phase === GAME_PHASE.SELECTING && this.modeConfig.hintEnabled;
      this.elements.hintButton.hidden = !canShowHint;
      this.elements.hintButton.disabled = !canShowHint || (!this.keepsHintButtonActive() && (this.hintActive || this.currentQuestionHintUsed));
    }

    keepsHintButtonActive() {
      return this.mode === "care" || this.mode === "ai_assisted";
    }

    clearHintState() {
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
        this.hintTimer = null;
      }

      this.hintActive = false;
      this.hintEndAt = 0;
      this.hintTargets = [];

      if (this.elements.playArea) {
        this.elements.playArea.classList.remove("is-hinting");
      }

      if (this.elements.playPrompt) {
        this.elements.playPrompt.classList.remove("is-hint-message");
      }

      if (this.elements.hintButton) {
        this.elements.hintButton.disabled = !this.keepsHintButtonActive() && this.currentQuestionHintUsed;
      }

      if (this.elements.grid) {
        this.elements.grid.querySelectorAll(".bulb-card.is-hint").forEach((button) => {
          button.classList.remove("is-hint");
        });
      }
    }

    scheduleHintClear(delay) {
      if (this.hintTimer) {
        clearTimeout(this.hintTimer);
        this.hintTimer = null;
      }

      this.hintTimer = this.setTimer(() => {
        this.hintTimer = null;
        this.finishHintDisplay();
      }, delay);
    }

    finishHintDisplay() {
      this.hintTargets.forEach((index) => {
        const button = this.findCell(index);
        if (button) {
          button.classList.remove("is-hint");
        }
      });
      this.clearHintState();
      if (this.phase === GAME_PHASE.SELECTING) {
        this.setStatus(this.buildSelectionPrompt());
        this.scheduleAutoHint();
      }
    }

    updatePhaseTimer(durationMs) {
      if (!durationMs || durationMs <= 0) {
        this.phaseEndAt = 0;
        this.elements.phaseTimer.textContent = "--";
        this.elements.memoryFill.style.width = "0%";
        this.elements.phaseTimerBox.classList.remove("is-warning");
        return;
      }

      const start = performance.now();
      this.phaseEndAt = start + durationMs;
      this.elements.memoryFill.style.width = "100%";

      this.setInterval(() => {
        const elapsed = performance.now() - start;
        const remaining = Math.max(0, durationMs - elapsed);
        const ratio = durationMs ? remaining / durationMs : 0;
        this.elements.phaseTimer.textContent = Math.ceil(remaining / 1000) + "초";
        this.elements.memoryFill.style.width = Math.round(ratio * 100) + "%";
        this.elements.phaseTimerBox.classList.toggle("is-warning", remaining <= 10000 && this.phase === GAME_PHASE.SELECTING);
      }, 100);
    }

    startMemoryCountdownGauge(durationMs, remainingMs) {
      const gauge = this.elements.memoryCountdownGauge;
      const fill = this.elements.memoryGaugeFill;
      const text = this.elements.memoryGaugeText;

      if (!this.elements.playPrompt) {
        return;
      }

      const duration = Math.max(1, durationMs || 3000);
      const initialRemaining = Math.max(0, Math.min(duration, remainingMs === undefined ? duration : remainingMs));
      const start = performance.now();
      const showPromptSeconds = this.mode !== "care" && this.mode !== "ai_assisted";
      this.memoryGaugeDurationMs = duration;
      this.memoryGaugeEndAt = start + initialRemaining;
      if (showPromptSeconds) {
        this.elements.playPrompt.classList.add("has-memory-seconds");
        this.elements.playPrompt.dataset.memorySeconds = Math.max(0, Math.ceil(initialRemaining / 1000)) + "초";
      } else {
        this.elements.playPrompt.classList.remove("has-memory-seconds");
        delete this.elements.playPrompt.dataset.memorySeconds;
      }
      if (gauge) {
        gauge.hidden = true;
      }
      if (fill) {
        fill.style.height = "0%";
      }
      if (text) {
        text.textContent = String(Math.max(0, Math.ceil(initialRemaining / 1000)));
      }

      this.setInterval(() => {
        const remaining = Math.max(0, this.memoryGaugeEndAt - performance.now());
        const ratio = duration ? remaining / duration : 0;
        if (showPromptSeconds) {
          this.elements.playPrompt.dataset.memorySeconds = Math.max(0, Math.ceil(remaining / 1000)) + "초";
        }
        if (fill) {
          fill.style.height = Math.round(ratio * 100) + "%";
        }
        if (text) {
          text.textContent = String(Math.max(0, Math.ceil(remaining / 1000)));
        }
      }, 100);
    }

    stopMemoryCountdownGauge() {
      const gauge = this.elements && this.elements.memoryCountdownGauge;
      const fill = this.elements && this.elements.memoryGaugeFill;
      const text = this.elements && this.elements.memoryGaugeText;

      if (!gauge) {
        if (this.elements && this.elements.playPrompt) {
          this.elements.playPrompt.classList.remove("has-memory-seconds");
          delete this.elements.playPrompt.dataset.memorySeconds;
        }
        this.memoryGaugeEndAt = 0;
        return;
      }

      gauge.hidden = true;
      this.memoryGaugeEndAt = 0;
      if (this.elements && this.elements.playPrompt) {
        this.elements.playPrompt.classList.remove("has-memory-seconds");
        delete this.elements.playPrompt.dataset.memorySeconds;
      }

      if (fill) {
        fill.style.height = "0%";
      }

      if (text) {
        text.textContent = "3";
      }
    }

    getMemoryGaugeRemaining() {
      if (!this.memoryGaugeEndAt) {
        return 0;
      }

      return Math.max(0, this.memoryGaugeEndAt - performance.now());
    }

    getTotalRemaining() {
      if (this.phase === GAME_PHASE.SELECTING && this.totalEndAt) {
        this.totalRemainingMs = Math.max(0, this.totalEndAt - performance.now());
      }

      return Math.max(0, this.totalRemainingMs || 0);
    }

    resumeTotalCountdown() {
      const remaining = this.getTotalRemaining();
      this.totalEndAt = remaining > 0 ? performance.now() + remaining : 0;
    }

    freezeTotalCountdown() {
      this.totalRemainingMs = this.getTotalRemaining();
      this.totalEndAt = 0;
    }

    startTotalTimer() {
      clearInterval(this.totalInterval);
      const tick = () => {
        const remaining = this.getTotalRemaining();
        this.elements.totalTimer.textContent = this.formatClock(remaining);
        this.elements.totalTimerBox.classList.toggle("is-warning", remaining <= 10000);

        if (remaining <= 0 && this.phase === GAME_PHASE.SELECTING) {
          this.finish("total_timeout");
        }
      };

      this.totalInterval = setInterval(tick, 250);
      tick();
    }

    formatClock(ms) {
      const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return minutes + ":" + String(seconds).padStart(2, "0");
    }

    setStatus(message) {
      this.clearPromptFeedback();

      if (this.phase === GAME_PHASE.MEMORIZE) {
        if (this.elements.playPrompt) {
          this.elements.playPrompt.textContent = message;
        }
        this.elements.statusMessage.textContent = message;
        return;
      }

      if (this.phase === GAME_PHASE.SELECTING) {
        if (this.elements.playPrompt) {
          this.elements.playPrompt.textContent = message;
        }
        if (this.usesCareGuidedFlow()) {
          this.elements.statusMessage.textContent = message;
          return;
        }
        this.elements.statusMessage.textContent = "방금 켜졌던 전구를 찾아주세요";
        return;
      }

      this.elements.statusMessage.textContent = message;
    }

    showPromptFeedback(message, type) {
      this.clearPromptFeedback();

      if (this.elements.playPrompt) {
        this.elements.playPrompt.textContent = message;
        this.elements.playPrompt.classList.add("is-feedback", "is-feedback-" + type);
      }

      this.elements.statusMessage.textContent = message;
      this.promptFeedbackTimer = this.setTimer(() => {
        this.promptFeedbackTimer = null;

        if (this.phase === GAME_PHASE.SELECTING) {
          this.setStatus(this.buildSelectionPrompt());
        }
      }, 2000);
    }

    clearPromptFeedback() {
      if (this.promptFeedbackTimer) {
        clearTimeout(this.promptFeedbackTimer);
        this.promptFeedbackTimer = null;
      }

      if (this.elements && this.elements.playPrompt) {
        this.elements.playPrompt.classList.remove("is-feedback", "is-feedback-correct", "is-feedback-wrong");
      }
    }

    showRoundTransition(title, subtitle, note, voiceName) {
      const delay = Math.max(0, (this.roundTransitionDelayUntil || 0) - performance.now());
      if (delay > 0) {
        this.roundTransitionDelayUntil = 0;
        this.setTimer(() => {
          if (this.phase === GAME_PHASE.FEEDBACK) {
            this.showRoundTransition(title, subtitle, note, voiceName);
          }
        }, delay);
        return;
      }

      this.clearPromptFeedback();
      const message = [title, subtitle, note].filter(Boolean).join("\n");

      if (this.elements.playArea) {
        this.elements.playArea.classList.add("is-transitioning");
      }

      if (this.elements.playPrompt) {
        this.elements.playPrompt.textContent = "";
      }

      this.elements.statusMessage.textContent = message;

      if (this.elements.roundTransitionMessage) {
        this.elements.roundTransitionMessage.hidden = false;
        this.elements.roundTransitionMessage.innerHTML = "";
        const lines = [
          ["round-transition-emoji", "😊"],
          ["round-transition-title", title]
        ];
        if (subtitle) {
          lines.push(["round-transition-subtitle", subtitle]);
        }
        if (note) {
          lines.push(["round-transition-note", note]);
        }
        lines.forEach(([className, text]) => {
          const line = document.createElement("span");
          line.className = className;
          line.textContent = text;
          this.elements.roundTransitionMessage.appendChild(line);
        });
      }

      if (voiceName) {
        this.audio.play(voiceName);
      }
    }

    hideRoundTransition() {
      if (this.elements && this.elements.playArea) {
        this.elements.playArea.classList.remove("is-transitioning");
      }

      if (this.elements && this.elements.roundTransitionMessage) {
        this.elements.roundTransitionMessage.hidden = true;
        this.elements.roundTransitionMessage.textContent = "";
        this.elements.roundTransitionMessage.innerHTML = "";
      }
    }

    updatePauseButton() {
      const canPause = this.phase === GAME_PHASE.MEMORIZE || this.phase === GAME_PHASE.SELECTING || this.phase === GAME_PHASE.FEEDBACK;
      this.elements.pauseButton.disabled = !canPause;
      this.updateHintButton();
    }

    scheduleAutoHint() {
      this.clearAutoHintTimer();
      if (
        this.phase !== GAME_PHASE.SELECTING
        || !this.modeConfig.hintEnabled
        || !this.modeConfig.autoHintEnabled
        || !this.modeConfig.autoHintAfterMs
        || this.hintActive
      ) {
        return;
      }

      this.autoHintTimer = this.setTimer(() => {
        this.autoHintTimer = null;
        if (this.phase !== GAME_PHASE.SELECTING || this.hintActive) {
          return;
        }
        this.setStatus("조금 헷갈릴 수 있어요. 제가 힌트를 드릴게요.");
        this.showHint();
      }, this.modeConfig.autoHintAfterMs);
    }

    resetAutoHintInactivityTimer() {
      if (!this.modeConfig.autoHintEnabled) {
        return;
      }

      this.scheduleAutoHint();
    }

    clearAutoHintTimer() {
      if (!this.autoHintTimer) {
        return;
      }

      clearTimeout(this.autoHintTimer);
      this.autoHintTimer = null;
    }

    setTimer(callback, delay) {
      const id = setTimeout(callback, delay);
      this.timers.push(id);
      return id;
    }

    setInterval(callback, delay) {
      const id = setInterval(callback, delay);
      this.intervals.push(id);
      callback();
      return id;
    }

    clearRoundTimers() {
      this.timers.forEach((id) => clearTimeout(id));
      this.intervals.forEach((id) => clearInterval(id));
      this.timers = [];
      this.intervals = [];
      this.hintTimer = null;
      this.autoHintTimer = null;
    }

    clearAllTimers() {
      this.clearRoundTimers();
      clearInterval(this.totalInterval);
      this.totalInterval = null;
    }
  }

  global.MemoryBulbGame = MemoryBulbGame;
})(window);
