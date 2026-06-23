/* ---------- Screen routing ---------- */
const SCREENS = ["loading", "start", "precheck", "how", "ready", "countdown", "play", "finish", "done", "mood", "error"];
let difficultyStartTimer = null;

function show(id) {
  SCREENS.forEach(s => document.getElementById(s).classList.toggle("on", s === id));
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
    startBtn.textContent = "시작하기";
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
  resetPreGameCheckState();
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
  preGameCheck = { mood: "normal", sleepHours: 8, skipped: false, completed: false };
  resetPrecheckUi();
}

function shouldStartWithPrecheck() {
  const standardStart = typeof shouldUseStandardStartScreen === "function" && shouldUseStandardStartScreen();
  return standardStart && runtime.showDifficultySelect && !runtime.autoStart;
}

function showEntryPrecheck(resetCheck = false) {
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
  const bar = document.getElementById("bar");
  const pct = document.getElementById("pct");
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
  all.forEach(src => {
    preloadImage(src).then(ok => {
      loaded++;
      if (!ok) assetErrors++;
    });
  });
  let p = 0;
  const t = setInterval(() => {
    const real = (loaded / total) * 100;
    p = Math.min(100, Math.max(p + 6, Math.min(p + 16, real)));
    bar.style.width = p + "%";
    pct.textContent = Math.round(p) + "%";
    emitLoadingProgress(p);
    if (p >= 100 && loaded >= total) {
      clearInterval(t);
      setTimeout(() => {
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
      }, 400);
    }
  }, 160);
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
document.addEventListener("click", () => {
  closeSettingsMenus();
});
["sfxToggle", "playSfxToggle"].forEach(id => document.getElementById(id)?.addEventListener("click", () => {
  sfxOn = !sfxOn;
  updateAudioControls();
}));
["bgmToggle", "playBgmToggle"].forEach(id => document.getElementById(id)?.addEventListener("click", () => {
  bgmOn = !bgmOn;
  updateAudioControls();
}));
["voiceBtn", "playVoiceBtn"].forEach(id => document.getElementById(id)?.addEventListener("click", e => {
  if (!voiceAvailable) return;
  voiceOn = !voiceOn;
  updateAudioControls();
}));
updateAudioControls();
document.getElementById("fontBtn").addEventListener("click", e => {
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
function updateSleepValue() {
  const range = document.getElementById("preSleepRange");
  const value = document.getElementById("preSleepValue");
  if (!range || !value) return;
  preGameCheck.sleepHours = Number(range.value) || 8;
  value.textContent = `${preGameCheck.sleepHours}시간`;
}

function resetPrecheckUi() {
  document.querySelectorAll("[data-pre-mood]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.preMood === "normal");
  });
  const range = document.getElementById("preSleepRange");
  if (range) range.value = "8";
  updateSleepValue();
}

document.querySelectorAll("[data-pre-mood]").forEach(btn => {
  btn.addEventListener("click", () => {
    preGameCheck.mood = btn.dataset.preMood;
    document.querySelectorAll("[data-pre-mood]").forEach(x => x.classList.toggle("selected", x === btn));
  });
});

document.getElementById("preSleepRange")?.addEventListener("input", updateSleepValue);

function submitPrecheck(skipped = false) {
  const moodLabels = { good: "좋음", normal: "보통", bad: "나쁨" };
  updateSleepValue();
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

document.getElementById("precheckNextBtn")?.addEventListener("click", () => submitPrecheck(false));
document.getElementById("precheckSkipBtn")?.addEventListener("click", () => submitPrecheck(true));

resetPrecheckUi();
