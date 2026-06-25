/* ---------- Screen routing ---------- */
const SCREENS = ["loading", "start", "precheck", "how", "ready", "countdown", "play", "finish", "done", "mood", "error"];
let difficultyStartTimer = null;
const CONDITION_SLEEP_HOURS = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const CONDITION_SLEEP_DRAG_STEP_PX = 42;
const precheckSleepDrag = { pointerId: null, lastStepY: 0 };
let precheckSleepIndex = 3;

function show(id) {
  SCREENS.forEach(s => document.getElementById(s).classList.toggle("on", s === id));
  SCREENS.forEach(s => document.body.classList.toggle(`screen-${s}`, s === id));
}

function resetDifficultyStartState(clearSelection = false) {
  if (difficultyStartTimer) {
    clearTimeout(difficultyStartTimer);
    difficultyStartTimer = null;
  }
  document.querySelectorAll(".diff").forEach(button => {
    const selected = !clearSelection && button.dataset.diff === selectedDiff;
    button.classList.toggle("selected", selected);
    button.classList.remove("is-starting");
    button.removeAttribute("aria-disabled");
    button.setAttribute("aria-pressed", String(selected));
  });
}

function setDifficultyButtonState(activeButton, isStarting = false) {
  document.querySelectorAll(".diff").forEach(button => {
    const selected = button === activeButton;
    button.classList.toggle("selected", selected);
    button.classList.toggle("is-starting", isStarting && selected);
    button.setAttribute("aria-pressed", String(selected));
    if (isStarting) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
  });
}

function setStartStage(stage) {
  const start = document.getElementById("start");
  if (!start) return;
  const difficultyReady = stage === "difficulty";
  start.classList.toggle("precheck-pending", !difficultyReady);
  start.classList.toggle("difficulty-ready", difficultyReady);

  const startBtn = document.getElementById("startBtn");
  if (startBtn) {
    const label = startBtn.querySelector("span") || startBtn;
    label.textContent = "게임 시작";
  }
}

function getInitialStartStage() {
  const standardStart = typeof shouldUseStandardStartScreen === "function" && shouldUseStandardStartScreen();
  if (!runtime.showDifficultySelect && standardStart) return "intro";
  return startDifficultyUnlocked ? "difficulty" : "intro";
}

function showStartIntro(resetCheck = false) {
  resetDifficultyStartState(true);
  if (resetCheck) {
    resetPreGameCheckState();
    startDifficultyUnlocked = !runtime.showDifficultySelect;
  }
  const stage = getInitialStartStage();
  setStartStage(stage);
  show("start");
  if (stage === "difficulty") {
    setTimeout(() => playVoiceGuide("selectDifficulty", "난이도를 선택해주세요."), 80);
  }
}

function showInitialStartScreen() {
  pendingDiff = null;
  resetDifficultyStartState(true);
  if (!preGameCheck?.completed) resetPreGameCheckState();
  startDifficultyUnlocked = !runtime.showDifficultySelect;
  setStartStage("intro");
  show("start");
}

function showDifficultySelection() {
  resetDifficultyStartState(true);
  startDifficultyUnlocked = true;
  setStartStage("difficulty");
  show("start");
  setTimeout(() => playVoiceGuide("selectDifficulty", "난이도를 선택해주세요."), 80);
}

function resetPreGameCheckState() {
  if (preGameCheck?.completed) return;
  preGameCheck = { mood: "good", sleepHours: CONDITION_SLEEP_HOURS[precheckSleepIndex], skipped: false, completed: false };
  resetPrecheckUi();
}

function shouldStartWithPrecheck() {
  const standardStart = typeof shouldUseStandardStartScreen === "function" && shouldUseStandardStartScreen();
  return standardStart && runtime.showDifficultySelect && !runtime.autoStart && !preGameCheck?.completed;
}

function showEntryPrecheck(resetCheck = false) {
  if (preGameCheck?.completed) {
    if (runtime.showDifficultySelect) showDifficultySelection();
    else showStartIntro(false);
    return;
  }
  resetDifficultyStartState(true);
  if (resetCheck) {
    resetPreGameCheckState();
    startDifficultyUnlocked = !runtime.showDifficultySelect;
  }
  showPrecheck();
}

function showPrecheck() {
  show("precheck");
  setTimeout(() => playVoiceGuide("precheckMoodSleep", "오늘의 기분과 수면시간을 알려주세요."), 80);
}

function preloadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = assetUrl(src);
  });
}

/* ===========================================================
   1. LOADING — preload images then move to start
   =========================================================== */
function loading(){
  const loadingScreen = document.getElementById("loading");
  const bar = document.getElementById("start-loading-fill") || document.getElementById("bar");
  const pct = document.getElementById("start-loading-text") || document.getElementById("pct");
  const all = [
    ...Object.values(ANIMALS).map(a => a.img),
    ...Object.values(ANIMALS).map(a => a.correctImg).filter(Boolean),
    ...Object.values(ANIMALS).map(a => a.baseImg).filter(Boolean),
    ...FOODS.map(f => f.img),
  ];
  let loaded = 0;
  let assetErrors = 0;
  const total = all.length;
  let lastProgressEvent = -1;
  function emitLoadingProgress(progress) {
    const rounded = Math.max(0, Math.min(100, Math.round(progress)));
    if (rounded !== 0 && rounded !== 100 && rounded - lastProgressEvent < 20) return;
    lastProgressEvent = rounded;
    RN({ type:"LOADING_PROGRESS", payload:{ progress: rounded } });
  }
  emitLoadingProgress(0);
  loadingScreen?.classList.add("is-loading");
  loadingScreen?.classList.remove("is-loaded");
  all.forEach(src => {
    preloadImage(src).then(ok => {
      loaded++;
      if (!ok) assetErrors++;
    });
  });

  const duration = 1800;
  let activeElapsed = 0;
  let lastFrameAt = performance.now();
  let completed = false;

  function setLoadingProgress(progress) {
    const percent = Math.max(0, Math.min(100, Math.round(progress)));
    if (bar) bar.style.width = `${percent}%`;
    if (pct) pct.textContent = `${percent}%`;
    emitLoadingProgress(percent);
  }

  function finishLoading() {
    if (completed) return;
    completed = true;
    setLoadingProgress(100);
    setTimeout(() => {
      loadingScreen?.classList.remove("is-loading");
      loadingScreen?.classList.add("is-loaded");
      assetsReady = true;
      if (assetErrors) {
        fatalError = reportError({
          code:"asset_load_failed",
          message:`${assetErrors} assets failed to load`,
          recoverable:true,
          phase:"loading",
        }, { showScreen:true });
        return;
      }
      RN({ type:"READY", payload:{ version: VERSION } });
      emitDisplayRequest("ready");
      if (runtime.autoStart) maybeAutoStart();
      else if (shouldStartWithPrecheck()) showEntryPrecheck(true);
      else showStartIntro(true);
    }, 260);
  }

  function update(now) {
    const totalAssets = Math.max(1, total);
    activeElapsed += Math.max(0, now - lastFrameAt);
    lastFrameAt = now;

    const timeProgress = Math.min(1, activeElapsed / duration);
    const easedProgress = 1 - Math.pow(1 - timeProgress, 3);
    const assetsProgress = Math.min(1, loaded / totalAssets);
    const progress = Math.min(easedProgress, assetsProgress < 1 ? 0.99 : 1);

    setLoadingProgress(progress * 100);

    if (timeProgress >= 1 && loaded >= total) {
      finishLoading();
      return;
    }

    window.requestAnimationFrame(update);
  }

  window.requestAnimationFrame(update);
}

loading();

/* ===========================================================
   2. START — voice/font toggles + difficulty
   =========================================================== */
const settingsMenus = [
  { button: document.getElementById("settingsBtn"), panel: document.getElementById("settingsPanel") },
  { button: document.getElementById("playSettingsBtn"), panel: document.getElementById("playSettingsPanel") },
].filter(menu => menu.button && menu.panel);
function closeSettingsMenus() {
  settingsMenus.forEach(({ button, panel }) => {
    panel.classList.remove("open");
    button.setAttribute("aria-expanded", "false");
  });
}
settingsMenus.forEach(({ button, panel }) => {
  button.addEventListener("click", e => {
    e.stopPropagation();
    const open = !panel.classList.contains("open");
    closeSettingsMenus();
    panel.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  });
  panel.addEventListener("click", e => e.stopPropagation());
});
document.querySelectorAll("[data-settings-close]").forEach(button => {
  button.addEventListener("click", () => closeSettingsMenus());
});
function bindSettingsToggle(ids, apply) {
  ids.forEach(id => {
    const control = document.getElementById(id);
    if (!control) return;
    const eventName = control.matches?.("input.setting-toggle") ? "change" : "click";
    control.addEventListener(eventName, () => {
      apply(control.matches?.("input.setting-toggle") ? control.checked : undefined);
      updateAudioControls();
    });
  });
}
bindSettingsToggle(["sfxToggle", "playSfxToggle"], checked => {
  sfxOn = typeof checked === "boolean" ? checked : !sfxOn;
});
bindSettingsToggle(["bgmToggle", "playBgmToggle"], checked => {
  bgmOn = typeof checked === "boolean" ? checked : !bgmOn;
});
bindSettingsToggle(["voiceBtn", "playVoiceBtn"], checked => {
  if (!voiceAvailable) return;
  voiceOn = typeof checked === "boolean" ? checked : !voiceOn;
});
updateAudioControls();
document.getElementById("fontBtn")?.addEventListener("click", e => {
  document.body.classList.toggle("large");
  const on = document.body.classList.contains("large");
  e.currentTarget.textContent = on ? "글씨 보통" : "글씨 크게";
});
document.getElementById("displayBtn")?.addEventListener("click", () => {
  enterGameDisplay("display_button");
});

document.querySelectorAll(".diff").forEach(b => {
  b.setAttribute("aria-pressed", String(b.classList.contains("selected")));
  b.addEventListener("click", () => {
    if (difficultyStartTimer) return;
    selectedDiff = b.dataset.diff;
    setDifficultyButtonState(b, true);

    if (!startDifficultyUnlocked && runtime.showDifficultySelect) {
      resetDifficultyStartState();
      showEntryPrecheck();
      return;
    }

    enterGameDisplay("difficulty_card");
    pendingDiff = selectedDiff;
    difficultyStartTimer = setTimeout(() => {
      difficultyStartTimer = null;
      beginIntroFlow(selectedDiff);
    }, 180);
  });
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (!startDifficultyUnlocked && runtime.showDifficultySelect) {
    if (preGameCheck?.completed) showDifficultySelection();
    else showEntryPrecheck();
    return;
  }
  enterGameDisplay("start_button");
  beginStandardStartFlow();
});

document.getElementById("difficultyCloseBtn")?.addEventListener("click", () => {
  resetDifficultyStartState(true);
  startDifficultyUnlocked = false;
  setStartStage("intro");
  show("start");
});

document.getElementById("howAgainBtn")?.addEventListener("click", () => show("how"));
document.getElementById("startReturnBtn")?.addEventListener("click", () => {
  const payload = { status: "abandoned", reason: "start_return", source: "start_screen" };
  if (typeof returnToHost === "function") {
    returnToHost(payload, { navigateToHub: true });
    return;
  }
  RN({
    type:"RETURN_TO_APP",
    payload:{
      session_id: runtime.sessionId || null,
      mode: runtime.mode,
      ...payload,
    },
  });
  if (typeof navigateToHub === "function") navigateToHub();
});

function beginStandardStartFlow() {
  pendingDiff = selectedDiff;
  beginActivityIntro();
}

function beginActivityIntro() {
  const seenHow = localStorage.getItem("af_seen_how") === "1";
  if (runtime.showHowToPlay && !seenHow) {
    show("how");
    return;
  }
  beginIntroFlow(pendingDiff || selectedDiff);
}

function beginIntroFlow(diff) {
  clearPauseUiState({ resetState: true });
  pendingDiff = diff || selectedDiff;
  if (typeof prepareSessionPreview === "function") prepareSessionPreview(pendingDiff);
  show("ready");
  playVoiceGuide("gameStartsIn3Seconds", "3초 뒤 게임이 시작됩니다.");
  setTimeout(() => runCountdown(pendingDiff), 900);
}

function runCountdown(diff) {
  clearInterval(countdownTimer);
  let n = 3;
  const num = document.getElementById("countdownNum");
  if (num) num.textContent = n;
  show("countdown");
  countdownTimer = setInterval(() => {
    n--;
    if (num) num.textContent = Math.max(0, n);
    if (n <= 0) {
      clearInterval(countdownTimer);
      startSession(diff || selectedDiff);
    }
  }, 760);
}

/* ===========================================================
   3. HOW TO PLAY
   =========================================================== */
document.getElementById("howStartBtn").addEventListener("click", () => {
  enterGameDisplay("how_start_button");
  localStorage.setItem("af_seen_how", "1");
  if (!startDifficultyUnlocked && runtime.showDifficultySelect) {
    if (preGameCheck?.completed) showDifficultySelection();
    else showEntryPrecheck();
    return;
  }
  beginIntroFlow(pendingDiff || selectedDiff);
});
document.getElementById("howSkipBtn").addEventListener("click", () => {
  showInitialStartScreen();
});

/* ===========================================================
   3b. PRE CHECK
   =========================================================== */
function precheckSleepIndexAt(offset) {
  const length = CONDITION_SLEEP_HOURS.length;
  return (precheckSleepIndex + offset + length) % length;
}

function renderPrecheckSleepDial() {
  const rows = document.getElementById("conditionSleepRows");
  if (!rows) return;

  rows.replaceChildren();
  [-1, 0, 1].forEach(offset => {
    const row = document.createElement("span");
    const number = document.createElement("span");
    const unit = document.createElement("span");

    row.className = offset === 0 ? "condition-sleep-row is-selected" : "condition-sleep-row is-muted";
    number.className = "condition-sleep-number";
    number.textContent = String(CONDITION_SLEEP_HOURS[precheckSleepIndexAt(offset)]);
    unit.className = "condition-sleep-unit";
    unit.textContent = "시간";
    row.append(number, unit);
    rows.appendChild(row);
  });
}

function selectedPrecheckSleepHours() {
  return CONDITION_SLEEP_HOURS[precheckSleepIndex];
}

function changePrecheckSleep(delta) {
  const length = CONDITION_SLEEP_HOURS.length;
  precheckSleepIndex = (precheckSleepIndex + delta + length) % length;
  preGameCheck.sleepHours = selectedPrecheckSleepHours();
  renderPrecheckSleepDial();
}

function startPrecheckSleepDrag(event) {
  const dial = document.querySelector(".condition-sleep-dial");
  if (!dial || event.button > 0) return;

  event.preventDefault();
  precheckSleepDrag.pointerId = event.pointerId;
  precheckSleepDrag.lastStepY = event.clientY;
  dial.classList.add("is-dragging");

  if (typeof dial.setPointerCapture === "function") {
    dial.setPointerCapture(event.pointerId);
  }
}

function dragPrecheckSleep(event) {
  if (precheckSleepDrag.pointerId !== event.pointerId) return;

  event.preventDefault();
  const deltaY = event.clientY - precheckSleepDrag.lastStepY;
  const steps = Math.trunc(Math.abs(deltaY) / CONDITION_SLEEP_DRAG_STEP_PX);

  if (steps < 1) return;

  const direction = deltaY > 0 ? -1 : 1;
  precheckSleepDrag.lastStepY += direction * -steps * CONDITION_SLEEP_DRAG_STEP_PX;
  changePrecheckSleep(direction * steps);
}

function endPrecheckSleepDrag(event) {
  if (precheckSleepDrag.pointerId !== event.pointerId) return;

  const dial = document.querySelector(".condition-sleep-dial");
  if (
    dial &&
    typeof dial.releasePointerCapture === "function" &&
    dial.hasPointerCapture(event.pointerId)
  ) {
    dial.releasePointerCapture(event.pointerId);
  }

  precheckSleepDrag.pointerId = null;
  precheckSleepDrag.lastStepY = 0;
  dial?.classList.remove("is-dragging");
}

function selectPrecheckMood(button) {
  preGameCheck.mood = button.dataset.mood || button.dataset.preMood || "good";
  document.querySelectorAll(".condition-mood-button").forEach(moodButton => {
    const isSelected = moodButton === button;
    moodButton.classList.toggle("is-selected", isSelected);
    moodButton.classList.toggle("selected", isSelected);
    moodButton.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
}

function resetPrecheckUi() {
  precheckSleepIndex = 3;
  preGameCheck.mood = "good";
  preGameCheck.sleepHours = selectedPrecheckSleepHours();
  document.querySelectorAll(".condition-mood-button").forEach(btn => {
    const isSelected = (btn.dataset.mood || btn.dataset.preMood) === "good";
    btn.classList.toggle("is-selected", isSelected);
    btn.classList.toggle("selected", isSelected);
    btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
  renderPrecheckSleepDial();
}

document.querySelectorAll(".condition-mood-button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectPrecheckMood(btn);
  });
});

document.getElementById("sleepDown")?.addEventListener("click", () => changePrecheckSleep(1));
document.getElementById("sleepUp")?.addEventListener("click", () => changePrecheckSleep(-1));
document.querySelector(".condition-sleep-dial")?.addEventListener("pointerdown", startPrecheckSleepDrag);
document.querySelector(".condition-sleep-dial")?.addEventListener("pointermove", dragPrecheckSleep);
document.querySelector(".condition-sleep-dial")?.addEventListener("pointerup", endPrecheckSleepDrag);
document.querySelector(".condition-sleep-dial")?.addEventListener("pointercancel", endPrecheckSleepDrag);

function submitPrecheck(skipped = false) {
  const moodLabels = { good: "좋음", normal: "보통", bad: "나쁨" };
  preGameCheck.sleepHours = selectedPrecheckSleepHours();
  preGameCheck = {
    phase: "pre",
    skipped,
    completed: true,
    mood: skipped ? null : preGameCheck.mood,
    mood_label: skipped ? null : (moodLabels[preGameCheck.mood] || null),
    sleep_hours: skipped ? null : preGameCheck.sleepHours,
  };
  RN({ type:"CONDITION_CHECK", payload: preGameCheck });
  showStartIntro(false);
}

document.getElementById("conditionSubmit")?.addEventListener("click", () => submitPrecheck(false));
document.getElementById("conditionSkip")?.addEventListener("click", () => submitPrecheck(true));

resetPrecheckUi();
