/* ---------- Screen routing ---------- */
const SCREENS = ["loading", "start", "precheck", "how", "ready", "countdown", "play", "finish", "done", "mood", "error"];
function show(id) {
  SCREENS.forEach(s => document.getElementById(s).classList.toggle("on", s === id));
}

function setStartStage(stage) {
  const start = document.getElementById("start");
  if (!start) return;
  const difficultyReady = stage === "difficulty" || !runtime.showDifficultySelect;
  start.classList.toggle("precheck-pending", !difficultyReady);
  start.classList.toggle("difficulty-ready", difficultyReady);
}

function showStartIntro(resetCheck = false) {
  if (resetCheck) {
    preGameCheck = { mood: "normal", sleepHours: 8, skipped: false, completed: false };
    startDifficultyUnlocked = !runtime.showDifficultySelect;
    resetPrecheckUi();
  }
  setStartStage(startDifficultyUnlocked ? "difficulty" : "intro");
  show("start");
}

function showDifficultySelection() {
  startDifficultyUnlocked = true;
  setStartStage("difficulty");
  show("start");
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
        else showStartIntro(true);
      }, 400);
    }
  }, 160);
}

loading();

/* ===========================================================
   2. START — voice/font toggles + difficulty
   =========================================================== */
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
settingsBtn?.addEventListener("click", e => {
  e.stopPropagation();
  const open = !settingsPanel?.classList.contains("open");
  settingsPanel?.classList.toggle("open", open);
  settingsBtn.setAttribute("aria-expanded", String(open));
});
settingsPanel?.addEventListener("click", e => e.stopPropagation());
document.addEventListener("click", () => {
  settingsPanel?.classList.remove("open");
  settingsBtn?.setAttribute("aria-expanded", "false");
});
document.getElementById("sfxToggle")?.addEventListener("click", () => {
  sfxOn = !sfxOn;
  updateAudioControls();
});
document.getElementById("bgmToggle")?.addEventListener("click", () => {
  bgmOn = !bgmOn;
  updateAudioControls();
});
document.getElementById("voiceBtn").addEventListener("click", e => {
  if (!voiceAvailable) return;
  voiceOn = !voiceOn;
  updateAudioControls();
});
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
  b.addEventListener("click", () => {
    selectedDiff = b.dataset.diff;
    document.querySelectorAll(".diff").forEach(x => x.classList.toggle("selected", x === b));
  });
});

document.getElementById("startBtn").addEventListener("click", () => {
  if (!startDifficultyUnlocked && runtime.showDifficultySelect) {
    show("precheck");
    return;
  }
  enterGameDisplay("start_button");
  beginStandardStartFlow();
});

document.getElementById("howAgainBtn")?.addEventListener("click", () => show("how"));

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
    show("precheck");
    return;
  }
  beginIntroFlow(pendingDiff || selectedDiff);
});
document.getElementById("howSkipBtn").addEventListener("click", () => {
  localStorage.setItem("af_seen_how", "1");
  if (pendingDiff) {
    beginIntroFlow(pendingDiff || selectedDiff);
    return;
  }
  showStartIntro();
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
  showDifficultySelection();
}

document.getElementById("precheckNextBtn")?.addEventListener("click", () => submitPrecheck(false));
document.getElementById("precheckSkipBtn")?.addEventListener("click", () => submitPrecheck(true));

resetPrecheckUi();
