/* ===========================================================
   9. FINISH SESSION → DONE
   =========================================================== */
function doneCopy(completed) {
  if (!completed) {
    return {
      title: "여기까지도 충분해요",
      sub: "잠시 쉬어가도 괜찮아요",
      note: "",
    };
  }
  if (runtime.mode === "reminder") {
    return {
      title: "정리했어요",
      sub: "짧은 활동을 조용히 마쳤어요",
      note: "잠시 후 허브로 돌아갑니다",
      badge: "정리 완료",
    };
  }
  if (runtime.mode === "care" || runtime.mode === "ai_assisted") {
    return {
      title: "오늘도 잘 돌봤어요",
      sub: "도깨비 친구들과 천천히 함께 했어요",
      note: runtime.autoReturnMs > 0 ? "잠시 후 허브로 돌아갑니다" : "",
      badge: "참여 완료",
    };
  }
  return {
    title: runtime.softFeedback ? "오늘도 잘 참여해주셨어요" : "오늘 활동을 마쳤어요",
    sub: runtime.softFeedback ? "천천히 끝까지 함께해 주셨어요" : "도깨비 친구들과 잘 함께했어요",
    note: "",
    badge: "활동 완료",
  };
}

function isQuestionCorrect(r) {
  return !!r && !r.answerRevealed && r.selectedTargetId === r.correctTargetId;
}

function answerLabel(answerId) {
  if (typeof NO_TARGET_ID !== "undefined" && answerId === NO_TARGET_ID) return NO_TARGET_LABEL;
  return ANIMALS[answerId]?.label || null;
}

function doneStatsHtml() {
  if (runtime.mode !== "standard" || !runtime.showScore) return "";
  const total = Math.max(state._results.length || state.completedRounds || 0, 0);
  const correct = state._results.filter(isQuestionCorrect).length;
  const wrong = Math.max(total - correct, 0);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  return `
    <div class="stat score-stat"><b>${correct}</b><span>정답 문항수</span></div>
    <div class="stat score-stat"><b>${wrong}</b><span>오답 문항수</span></div>
    <div class="stat score-stat"><b>${accuracy}%</b><span>정답률</span></div>
  `;
}

const DONE_REACTIONS = {
  tiger: "든든해요",
  monkey: "신나요",
  squirrel: "좋아요",
  panda: "고마워요",
};

let autoReturnTimer = null;

function getHubReturnUrl() {
  const configuredUrl = runtime.returnUrl;
  if (typeof configuredUrl === "string" && configuredUrl.trim()) {
    try { return new URL(configuredUrl, window.location.href).href; } catch(_) {}
  }
  try { return new URL("../../index.html", window.location.href).href; } catch(_) {}
  return "";
}

function navigateToHub() {
  const hubUrl = getHubReturnUrl();
  if (!hubUrl) return;
  try { window.location.assign(hubUrl); }
  catch(_) {
    try { window.location.href = hubUrl; } catch(__) {}
  }
}

function returnToHost(extra = {}, options = {}) {
  RN({
    type:"RETURN_TO_APP",
    payload:{
      session_id: state?.sessionId || null,
      status: state?._status || "completed",
      mode: runtime.mode,
      ...extra,
    },
  });
  if (options.navigateToHub) {
    setTimeout(navigateToHub, options.navigationDelayMs ?? 80);
  }
}

function scheduleAutoReturn(delayOverrideMs = runtime.autoReturnMs) {
  if (autoReturnTimer) clearTimeout(autoReturnTimer);
  const delayMs = Math.max(0, Number(delayOverrideMs) || 0);
  if (!delayMs) return;
  autoReturnTimer = setTimeout(() => {
    autoReturnTimer = null;
    returnToHost({ auto_return: true }, { navigateToHub: true });
  }, delayMs);
}

function shouldShowFinishCheck(completed, reason) {
  if (!runtime.showFinishCheck) return false;
  if (completed) return true;
  return runtime.mode === "standard" && reason === "user_quit";
}

function finishSession(completed, reason = "user_quit", error = null) {
  if (!state) return;
  if (state._status !== "running") return;
  state.endedAt = new Date().toISOString();
  state.durationMs = Math.round(
    typeof getSessionActiveElapsedMs === "function"
      ? getSessionActiveElapsedMs()
      : performance.now() - state._t0
  );
  clearPauseUiState({ resetState: true });
  state.completed = !!completed;
  state.aborted = !completed;
  state._status = error ? "error" : (completed ? "completed" : "abandoned");
  state._abandonReason = completed ? null : reason;
  state.timedOut = state.timedOut || reason === "time_limit";
  state._errorCode = error?.code || null;
  state._errorMessage = error?.message || null;
  if (typeof stopSessionTimer === "function") stopSessionTimer();
  try { speechSynthesis.cancel(); } catch(_) {}
  if (typeof stopVoiceGuide === "function") stopVoiceGuide();

  // hero row of session animals
  const row = document.getElementById("doneHero");
  document.getElementById("done")?.classList.toggle("session-complete", !!completed);
  document.getElementById("done")?.classList.toggle("session-rest", !completed);
  row.innerHTML = "";
  state._animals.forEach(a => {
    const friend = document.createElement("div");
    friend.className = `done-friend done-${a}`;
    friend.dataset.target = a;
    if (ANIMALS[a]?.baseImg) friend.style.setProperty("--done-base-image", `url("${new URL(assetUrl(ANIMALS[a].baseImg), window.location.href).href}")`);
    friend.dataset.reaction = completed ? (DONE_REACTIONS[a] || "좋아요") : "쉬어가요";
    const i = new Image();
    i.src = assetUrl(ANIMALS[a].img); i.alt = ANIMALS[a].label;
    i.className = "done-animal";
    const joy = document.createElement("div");
    joy.className = "done-joy";
    joy.textContent = friend.dataset.reaction;
    const name = document.createElement("div");
    name.className = "done-friend-name";
    name.textContent = ANIMALS[a].label;
    friend.append(joy, i, name);
    row.appendChild(friend);
  });

  const stats = doneStatsHtml();
  const doneStats = document.getElementById("doneStats");
  doneStats.innerHTML = stats;
  doneStats.classList.toggle("hidden", !stats);

  const copy = doneCopy(completed);
  const doneEyebrow = document.querySelector("#done .done-eyebrow");
  if (completed && runtime.showScore) {
    if (doneEyebrow) doneEyebrow.textContent = "점수 확인";
    document.getElementById("doneTitle").textContent = "오늘 활동 점수예요";
    document.getElementById("doneSub").textContent = "잘 맞힌 문항과 다시 볼 문항을 확인해요";
  } else {
    if (doneEyebrow) doneEyebrow.textContent = copy.badge || "활동 완료";
    document.getElementById("doneTitle").textContent = copy.title;
    document.getElementById("doneSub").textContent = copy.sub;
  }
  document.getElementById("doneReturnNote").textContent = copy.note;

  const shouldFinishCheck = shouldShowFinishCheck(completed, reason);
  if (shouldFinishCheck) resetFinishCheck();
  const againBtn = document.getElementById("againBtn");
  const doneBtn = document.getElementById("doneBtn");
  if (againBtn) againBtn.classList.toggle("hidden", !!completed || shouldFinishCheck);
  if (doneBtn) doneBtn.textContent = shouldFinishCheck ? "마무리 체크" : (completed ? "확인" : "오늘은 여기까지");
  show("done");
  if (completed) {
    playVoiceGuide("sessionComplete", runtime.softFeedback ? "오늘은 여기까지 해도 충분해요. 잘 참여해주셨어요." : "오늘도 잘 해내셨어요");
  } else {
    playVoiceGuide("enoughForToday", "여기까지도 충분해요");
  }

  const legacyPayload = {
    ...sessionPayload(),
    results: state._results,
    process: aggregate(state._results),
    reward: {
      participated: true,
      missionApplied: completed,
      rewardEligible: completed,
      growthDelta: completed ? 1 : 0.5,
      streakApplied: completed,
      careAction: "water_plant",
    },
  };
  const payload = {
    ...legacyPayload,
    ...toCommonSessionLog(legacyPayload),
  };
  const completionMessage = { type: completed ? "SESSION_COMPLETE" : "SESSION_ABORT", payload };
  if (shouldFinishCheck) {
    pendingCompletionMessage = completionMessage;
    pendingAutoReturnMs = runtime.autoReturnMs;
    return;
  }
  RN(completionMessage);
  if (completed && runtime.autoReturnMs > 0) {
    scheduleAutoReturn();
  }
}

function formatDur(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m === 0) return `${r}초`;
  return `${m}분 ${r}초`;
}

function aggregate(rs) {
  if (!rs.length) return {};
  const sum = k => rs.reduce((a, b) => a + (b[k] || 0), 0);
  const respN = Math.max(1, rs.filter(r => r.responseTimeMs).length);
  return {
    avgFirstReactionMs: Math.round(sum("firstReactionMs") / rs.length),
    avgResponseMs:      Math.round(sum("responseTimeMs") / respN),
    totalWrongDrop:     sum("wrongDropCount"),
    totalDragFail:      sum("dragFailCount"),
    totalTargetChange:  sum("targetChangeCount"),
    hintUsedCount:      rs.filter(r => r.hintUsed).length,
  };
}

function currentScreenId() {
  return SCREENS.find(s => document.getElementById(s)?.classList.contains("on")) || null;
}

function toQuestionLog(r) {
  return {
    session_id: state?.sessionId || null,
    content_id: state?.contentId || DEFAULT_CONTENT_ID,
    game_key: state?.gameKey || GAME_ID,
    question_id: r.questionId,
    question_index: r.questionIndex || (state ? state._idx + 1 : null),
    total_questions: state?.plannedRounds || null,
    mode: state?.mode || runtime.mode,
    question_type: r.questionType,
    cognitive_domain: r.cognitiveDomain,
    difficulty: state?.difficulty || selectedDiff,
    prompt_type: "image",
    correct_answer: r.correctTargetId,
    selected_answer: r.selectedTargetId,
    is_correct: isQuestionCorrect(r),
    attempt_count: r.attempts,
    answer_revealed: !!r.answerRevealed,
    forced_advance_reason: r.forcedAdvanceReason || null,
    hint_used: !!r.hintUsed,
    hint_count: r.hintUsed ? 1 : 0,
    replay_count: 0,
    response_time_ms: r.responseTimeMs,
    first_response_time_ms: r.firstReactionMs,
    changed_answer_count: r.targetChangeCount,
    wrong_tap_count: r.wrongDropCount,
    drag_fail_count: r.dragFailCount,
    input_type: r.inputType || "touch",
    external_input: r.externalAnswer || null,
    item_id: r.itemId,
    item_label: r.itemLabel,
    item_type: r.itemType,
    correct_answer_label: answerLabel(r.correctTargetId),
    selected_answer_label: answerLabel(r.selectedTargetId),
  };
}

function toQuestionStartPayload(q, item) {
  const choices = state._animals.map(id => ({
    answer_id: id,
    label: ANIMALS[id].label,
    type: "animal",
    image_src: ANIMALS[id].img,
  }));
  if (item.type === "trash") {
    choices.push({
      answer_id: NO_TARGET_ID,
      label: NO_TARGET_LABEL,
      type: "idle",
      image_src: null,
    });
  }
  return {
    session_id: state.sessionId,
    content_id: state.contentId,
    game_key: state.gameKey,
    mode: state.mode,
    difficulty: state.difficulty,
    question_id: q.questionId,
    question_index: state._idx + 1,
    total_questions: state.plannedRounds,
    question_type: q.questionType,
    cognitive_domain: q.cognitiveDomain,
    prompt_text: item.type === "trash" ? "아무에게도 주지 말고 그대로 두세요." : "누구에게 줄까요?",
    prompt_type: "image",
    item: {
      item_id: item.id,
      label: item.label,
      type: item.type,
      image_src: item.img,
    },
    choices,
    correct_answer: q.correctTargetId,
    correct_answer_label: answerLabel(q.correctTargetId),
    input_modes_enabled: item.type === "trash"
      ? ["idle", ...(runtime.useDrag ? ["touch", "drag", "external"] : ["touch", "external"])]
      : (runtime.useDrag ? ["touch", "drag", "external"] : ["touch", "external"]),
  };
}

function toCommonSessionLog(payload) {
  const rs = state._results;
  const process = payload.process || aggregate(rs);
  const totalQuestions = state.plannedRounds;
  const correctCount = rs.filter(isQuestionCorrect).length;
  const wrongCount = Math.max(0, rs.length - correctCount);
  const questionLogs = rs.map(toQuestionLog);
  const sessionSummary = {
    session_id: state.sessionId,
    content_id: state.contentId,
    game_key: state.gameKey,
    mode: state.mode,
    difficulty: state.difficulty,
    status: state._status,
    started_at: state.startedAt,
    ended_at: state.endedAt,
    duration_ms: state.durationMs,
    time_limit_ms: state.timeLimitMs || 0,
    timed_out: !!state.timedOut,
    total_questions: totalQuestions,
    completed_questions: state.completedRounds,
    correct_count: correctCount,
    wrong_count: wrongCount,
    hint_count: rs.filter(r => r.hintUsed).length,
    retry_count: rs.reduce((sum, r) => sum + Math.max(0, (r.attempts || 1) - 1), 0),
    pause_count: state._pauseCount,
    help_open_count: state._helpOpenCount,
    interaction_count: state._interactionCount,
    avg_response_time_ms: process.avgResponseMs || 0,
    completion_rate: totalQuestions ? state.completedRounds / totalQuestions : 0,
  };
  const abandonInfo = {
    abandoned_at: state._status === "abandoned" ? state.endedAt : null,
    abandon_reason: state._status === "abandoned" ? state._abandonReason : null,
    abandon_step: state._status === "abandoned" ? {
      screen: currentScreenId(),
      question_index: state._idx + 1,
      completed_questions: state.completedRounds,
      current_question_id: cur?.questionId || null,
    } : null,
    error_code: state._errorCode,
    error_message: state._errorMessage,
  };
  return {
    ...sessionSummary,
    config_snapshot: state.configSnapshot,
    ...abandonInfo,
    question_logs: questionLogs,
    result_detail_json: {
      session: sessionSummary,
      config_snapshot: state.configSnapshot,
      question_logs: questionLogs,
      raw_results: rs,
      process,
      reward: payload.reward || null,
      pre_condition_check: state.preConditionCheck || null,
      finish_check: null,
      condition_check: null,
      abandon: abandonInfo,
      animal_count: state._animals.length,
      choice_count: state._animals.length,
      target_animals: state._animals,
      item_count: rs.length,
      trash_count: state._trashCount,
      used_drag: rs.some(r => r.inputType === "drag"),
      input_modes_enabled: runtime.useDrag ? ["touch", "drag", "external"] : ["touch", "external"],
      soft_feedback: runtime.softFeedback,
      auto_hint_enabled: runtime.autoHintEnabled,
      help_open_count: state._helpOpenCount,
      difficulty_downshifted: false,
    },
  };
}

document.getElementById("againBtn").addEventListener("click", () => {
  // Same difficulty again
  beginIntroFlow(state ? state.difficulty : selectedDiff);
});
document.getElementById("doneBtn").addEventListener("click", () => {
  if (autoReturnTimer) {
    clearTimeout(autoReturnTimer);
    autoReturnTimer = null;
  }
  if (pendingCompletionMessage) {
    showFinishStep(1);
    show("finish");
    setTimeout(() => playVoiceGuide("finishCurrentState", "지금의 상태를 알려주세요."), 80);
    return;
  }
  returnToHost({}, { navigateToHub: true });
  if (typeof showStartIntro === "function") showStartIntro(true);
  else show("start");
});

document.querySelectorAll("[data-finish]").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.finish;
    finishCheck[key] = btn.dataset.value;
    document.querySelectorAll(`[data-finish="${key}"]`).forEach(x => x.classList.toggle("selected", x === btn));
    updateFinishActionState();
  });
});

const FINISH_STEP_ONE_KEYS = ["mood", "fatigue", "difficulty"];
const FINISH_STEP_TWO_KEYS = ["help", "replay"];

function isFinishStepComplete(step) {
  const keys = step === 2 ? FINISH_STEP_TWO_KEYS : FINISH_STEP_ONE_KEYS;
  return keys.every(key => !!finishCheck[key]);
}

function setButtonDisabled(btn, disabled) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.setAttribute("aria-disabled", String(disabled));
}

function updateFinishActionState() {
  setButtonDisabled(document.getElementById("finishNextBtn"), !isFinishStepComplete(1));
  setButtonDisabled(document.getElementById("finishConfirmBtn"), !isFinishStepComplete(2));
}

function resetFinishCheck() {
  finishCheck = { mood: null, fatigue: null, difficulty: null, help: null, replay: null };
  document.querySelectorAll("[data-finish]").forEach(x => x.classList.remove("selected"));
  showFinishStep(1);
  updateFinishActionState();
}

function showFinishStep(step) {
  const isSecond = step === 2;
  document.getElementById("finishStepOne")?.classList.toggle("on", !isSecond);
  document.getElementById("finishStepTwo")?.classList.toggle("on", isSecond);
  document.getElementById("finishActionsOne")?.classList.toggle("on", !isSecond);
  document.getElementById("finishActionsTwo")?.classList.toggle("on", isSecond);
  updateFinishActionState();
}

function finishCheckPayload(skipped = false) {
  const hasMood = !!finishCheck.mood;
  const hasFatigue = !!finishCheck.fatigue;
  const hasDifficulty = !!finishCheck.difficulty;
  const hasHelp = !!finishCheck.help;
  const hasReplay = !!finishCheck.replay;
  return {
    phase: "post_combined",
    skipped,
    condition_skipped: skipped || !hasMood,
    fatigue_skipped: skipped || !hasFatigue,
    difficulty_skipped: skipped || !hasDifficulty,
    help_skipped: skipped || !hasHelp,
    replay_skipped: skipped || !hasReplay,
    finish_skipped: skipped,
    condition_mood: skipped ? null : finishCheck.mood,
    fatigue_value: skipped ? null : finishCheck.fatigue,
    difficulty_value: skipped ? null : finishCheck.difficulty,
    help_needed: skipped ? null : finishCheck.help,
    replay_wanted: skipped ? null : finishCheck.replay,
    condition_check: {
      phase: "post",
      skipped: skipped || !hasMood,
      mood: skipped ? null : finishCheck.mood,
    },
    fatigue_check: {
      phase: "post",
      skipped: skipped || !hasFatigue,
      value: skipped ? null : finishCheck.fatigue,
    },
    difficulty_check: {
      phase: "post",
      skipped: skipped || !hasDifficulty,
      value: skipped ? null : finishCheck.difficulty,
    },
    help_check: {
      phase: "post",
      skipped: skipped || !hasHelp,
      needed: skipped ? null : finishCheck.help,
    },
    replay_check: {
      phase: "post",
      skipped: skipped || !hasReplay,
      wanted: skipped ? null : finishCheck.replay,
    },
    finish_check: {
      skipped,
      mood: skipped ? null : finishCheck.mood,
      fatigue: skipped ? null : finishCheck.fatigue,
      difficulty: skipped ? null : finishCheck.difficulty,
      help_needed: skipped ? null : finishCheck.help,
      replay_wanted: skipped ? null : finishCheck.replay,
    },
  };
}

function submitFinishCheck(skipped = false) {
  const payload = finishCheckPayload(skipped);
  RN({ type:"CONDITION_CHECK", payload: payload.condition_check });
  RN({ type:"FINISH_CHECK", payload });
  const shouldReturnAfterFinishCheck = pendingCompletionMessage?.type === "SESSION_ABORT";
  if (pendingCompletionMessage) {
    pendingCompletionMessage.payload.condition_check = payload.condition_check;
    pendingCompletionMessage.payload.fatigue_check = payload.fatigue_check;
    pendingCompletionMessage.payload.difficulty_check = payload.difficulty_check;
    pendingCompletionMessage.payload.help_check = payload.help_check;
    pendingCompletionMessage.payload.replay_check = payload.replay_check;
    pendingCompletionMessage.payload.finish_check = payload.finish_check;
    pendingCompletionMessage.payload.finish_check_payload = payload;
    if (pendingCompletionMessage.payload.result_detail_json) {
      pendingCompletionMessage.payload.result_detail_json.condition_check = payload.condition_check;
      pendingCompletionMessage.payload.result_detail_json.fatigue_check = payload.fatigue_check;
      pendingCompletionMessage.payload.result_detail_json.difficulty_check = payload.difficulty_check;
      pendingCompletionMessage.payload.result_detail_json.help_check = payload.help_check;
      pendingCompletionMessage.payload.result_detail_json.replay_check = payload.replay_check;
      pendingCompletionMessage.payload.result_detail_json.finish_check = payload.finish_check;
      pendingCompletionMessage.payload.result_detail_json.finish_check_payload = payload;
    }
    RN(pendingCompletionMessage);
    if (shouldReturnAfterFinishCheck) {
      returnToHost({}, { navigateToHub: true });
    } else if (pendingAutoReturnMs > 0) {
      scheduleAutoReturn(pendingAutoReturnMs);
    }
    pendingCompletionMessage = null;
    pendingAutoReturnMs = 0;
  }
  if (shouldReturnAfterFinishCheck) return;
  if (typeof showStartIntro === "function") showStartIntro(true);
  else show("start");
}

document.getElementById("finishNextBtn")?.addEventListener("click", () => {
  if (!isFinishStepComplete(1)) return;
  showFinishStep(2);
  setTimeout(() => playVoiceGuide("finishExtraInfo", "추가로 이것만 더 알려주세요."), 80);
});
document.getElementById("finishPrevBtn")?.addEventListener("click", () => {
  showFinishStep(1);
  setTimeout(() => playVoiceGuide("finishCurrentState", "지금의 상태를 알려주세요."), 80);
});
document.getElementById("finishConfirmBtn")?.addEventListener("click", () => {
  if (!isFinishStepComplete(2)) return;
  submitFinishCheck(false);
});
document.getElementById("finishSkipBtn")?.addEventListener("click", () => {
  submitFinishCheck(true);
});

/* ===========================================================
   10. MOOD CHECK
   =========================================================== */
document.querySelectorAll(".mood-card").forEach(c => {
  c.addEventListener("click", () => {
    document.querySelectorAll(".mood-card").forEach(x => x.classList.toggle("selected", x === c));
    RN({ type:"MOOD_CHECK", payload:{ phase:"post", mood: +c.dataset.mood } });
    setTimeout(() => {
      returnToHost({ mood: +c.dataset.mood });
      show("start");
    }, 600);
  });
});
document.getElementById("moodSkip").addEventListener("click", () => {
  RN({ type:"MOOD_CHECK", payload:{ phase:"post", mood:null, skipped:true } });
  returnToHost({ mood: null, mood_skipped: true });
  show("start");
});

/* ===========================================================
   11. INBOUND CONFIG (from native app)
   =========================================================== */
window.addEventListener("message", e => receiveNativeMessage(e.data));
document.addEventListener("message", e => receiveNativeMessage(e.data));

function pauseSession(reason = "unknown") {
  if (!state || state._status !== "running" || state._paused) return;
  state._paused = true;
  if (typeof clearNoTargetAutoCorrect === "function") clearNoTargetAutoCorrect();
  document.body.classList.add("paused");
  state._pauseCount++;
  if (typeof pauseSessionTimer === "function") pauseSessionTimer();
  try { speechSynthesis.cancel(); } catch(_) {}
  if (typeof stopVoiceGuide === "function") stopVoiceGuide();
  RN({ type:"SESSION_PAUSE", payload:{ session_id: state.sessionId, reason } });
}

function resumeSession(reason = "unknown") {
  if (!state || state._status !== "running" || !state._paused) return;
  state._paused = false;
  document.body.classList.remove("paused");
  if (typeof resumeSessionTimer === "function") resumeSessionTimer();
  if (typeof scheduleNoTargetAutoCorrect === "function") scheduleNoTargetAutoCorrect();
  RN({ type:"SESSION_RESUME", payload:{ session_id: state.sessionId, reason } });
}

function applyAudioCommand(payload) {
  if (typeof payload.muted === "boolean") {
    voiceOn = !payload.muted;
    sfxOn = !payload.muted;
    bgmOn = !payload.muted;
  }
  if (typeof payload.voice === "boolean") voiceOn = payload.voice;
  if (typeof payload.voice_guide_enabled === "boolean") voiceOn = payload.voice_guide_enabled;
  if (typeof payload.effect_sound_enabled === "boolean") sfxOn = payload.effect_sound_enabled;
  if (typeof payload.background_music_enabled === "boolean") bgmOn = payload.background_music_enabled;
  if (typeof payload.backgroundMusic === "boolean") bgmOn = payload.backgroundMusic;
  if (!voiceOn) {
    try { speechSynthesis.cancel(); } catch(_) {}
    if (typeof stopVoiceGuide === "function") stopVoiceGuide();
  }
  updateAudioControls();
  RN({ type:"AUDIO_APPLIED", payload:{ voice: voiceOn, effect_sound_enabled: sfxOn, background_music_enabled: bgmOn } });
}

function handleExternalAnswer(payload) {
  if (!cur) return;
  const raw = String(payload.selected_answer || payload.selectedAnswer || "").trim();
  const noTargetAliases = ["no_target", "none", "idle", "wait", "아무에게도 주지 않음"];
  if (typeof NO_TARGET_ID !== "undefined" && noTargetAliases.includes(raw)) {
    cur.externalAnswer = {
      inputType: payload.input_type || payload.inputType || "external",
      rawTranscript: payload.raw_transcript || payload.rawTranscript || null,
      confidence: payload.confidence ?? null,
    };
    cur.inputType = cur.externalAnswer.inputType;
    autoCorrectNoTargetQuestion();
    return;
  }
  const aliasTargetId = raw === "쓰레기통" || raw === "휴지통" ? "bin" : null;
  const target = Object.values(ANIMALS).find(a => a.id === raw || a.label === raw);
  const targetId = aliasTargetId || (target ? target.id : raw);
  const spot = document.querySelector(`.spot[data-target="${targetId}"], .bin[data-target="${targetId}"]`);
  if (!spot) return;
  cur.externalAnswer = {
    inputType: payload.input_type || payload.inputType || "external",
    rawTranscript: payload.raw_transcript || payload.rawTranscript || null,
    confidence: payload.confidence ?? null,
  };
  resolve(targetId, spot, "external");
}

window.addEventListener("error", e => {
  const error = { code:"runtime", message:String(e.message || e), recoverable:true, phase:currentScreenId() || "runtime" };
  if (state && state._status === "running") {
    finishSession(false, "runtime_error", error);
  }
  fatalError = reportError(error, { showScreen:!(state && state._status === "error") });
});

document.getElementById("errorReturnBtn")?.addEventListener("click", () => {
  RN({
    type:"RETURN_TO_APP",
    payload:{
      session_id: state?.sessionId || runtime.sessionId || null,
      status: state?._status || "error",
      error_code: fatalError?.code || "unknown",
    },
  });
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseSession("app_background");
});

window.addEventListener("pagehide", () => {
  if (state && state._status === "running") {
    finishSession(false, "pagehide");
  }
});
