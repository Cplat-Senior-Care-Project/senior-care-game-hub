/* ---------- Voice (recorded guides with TTS fallback) ---------- */
const VOICE_GUIDES = {
  precheckMoodSleep: "audio/voice/precheck-mood-sleep.mp3",
  selectDifficulty: "audio/voice/select-difficulty.mp3",
  gameStartsIn3Seconds: "audio/voice/game-starts-in-3-seconds.mp3",
  whoToFeed: "audio/voice/who-to-feed.mp3",
  whereToCleanup: "audio/voice/where-to-cleanup.mp3",
  tryAgain: "audio/voice/try-again.mp3",
  wellDone: "audio/voice/well-done.mp3",
  sessionComplete: "audio/voice/session-complete.mp3",
  enoughForToday: "audio/voice/enough-for-today.mp3",
  hint: "audio/voice/hint.mp3",
  nextQuestion: "audio/voice/next-question.mp3",
  takingABreak: "audio/voice/taking-a-break.mp3",
  finishCurrentState: "audio/voice/finish-current-state.mp3",
  finishExtraInfo: "audio/voice/finish-extra-info.mp3",
};
const BUTTON_SOUND_SRC = "audio/sfx/button-click.mp3";
const BGM_SRC = "audio/bgm/goblin-fate.mp3";
const BGM_START_SECONDS = 3;
const SFX_VOLUME_SCALE = 0.22;
let activeGuideAudio = null;

function detectVoice() {
  const hasRecordedGuide = typeof Audio !== "undefined" && Object.keys(VOICE_GUIDES).length > 0;
  if (!("speechSynthesis" in window)) { voiceAvailable = hasRecordedGuide; return; }
  const voices = speechSynthesis.getVoices();
  voiceAvailable = hasRecordedGuide || voices.some(v => /^ko/i.test(v.lang));
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { detectVoice(); updateAudioControls(); };
}
detectVoice();

function stopVoiceGuide() {
  if (activeGuideAudio) {
    try {
      activeGuideAudio.pause();
      activeGuideAudio.currentTime = 0;
    } catch(e) {}
    activeGuideAudio = null;
  }
}

function speak(text) {
  if (!voiceOn || !voiceAvailable) return;
  stopVoiceGuide();
  if (!("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch(e) {}
}

function playVoiceGuide(key, fallbackText = "") {
  if (!voiceOn || !voiceAvailable) return Promise.resolve(false);
  const src = VOICE_GUIDES[key];
  if (!src || typeof Audio === "undefined") {
    if (fallbackText) speak(fallbackText);
    return Promise.resolve(false);
  }
  try {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    stopVoiceGuide();
    const audio = new Audio(assetUrl(src));
    activeGuideAudio = audio;
    audio.preload = "auto";
    audio.volume = 1;
    audio.addEventListener("ended", () => {
      if (activeGuideAudio === audio) activeGuideAudio = null;
    }, { once: true });
    audio.addEventListener("error", () => {
      if (activeGuideAudio === audio) activeGuideAudio = null;
      if (fallbackText) speak(fallbackText);
    }, { once: true });
    return audio.play().then(() => true).catch(() => {
      if (activeGuideAudio === audio) activeGuideAudio = null;
      if (fallbackText) speak(fallbackText);
      return false;
    });
  } catch(e) {
    if (fallbackText) speak(fallbackText);
    return Promise.resolve(false);
  }
}

/* ---------- Sound (WebAudio chimes, iOS-safe lazy init) ---------- */
let ac = null;
let mediaUnlocked = false;
let bgmTimer = null;
let bgmStep = 0;
let bgmAudio = null;
function ensureAudio() {
  if (ac) { if (ac.state === "suspended") ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    // iOS silent unlock
    const buf = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buf; src.connect(ac.destination); src.start(0);
    if (ac.state === "suspended") ac.resume();
  } catch(e) { ac = null; }
}

function setToggleState(button, on, unavailable = false) {
  if (!button) return;
  const isInput = button.matches?.("input.setting-toggle");
  const row = isInput ? button.closest(".setting-row") : button;
  const status = row?.querySelector("strong") || button.querySelector?.("strong");
  if (isInput) {
    const label = button.dataset.settingLabel || status?.dataset.settingLabel || "";
    button.checked = !!on;
    button.disabled = unavailable;
    row?.classList.toggle("is-off", !on || unavailable);
    if (row) row.style.opacity = unavailable ? ".64" : "";
    if (status) status.textContent = unavailable ? `${label} 없음` : `${label} ${on ? "켬" : "끔"}`;
    return;
  }
  if (status) {
    status.textContent = unavailable ? "없음" : (on ? "켜짐" : "꺼짐");
  } else {
    button.textContent = unavailable ? "없음" : (on ? "켜짐" : "꺼짐");
  }
  button.classList.toggle("is-off", !on || unavailable);
  button.disabled = unavailable;
  button.style.opacity = unavailable ? ".64" : "";
}

function updateVoiceBtn() {
  const buttons = ["voiceBtn", "playVoiceBtn"].map(id => document.getElementById(id)).filter(Boolean);
  if (!buttons.length) return;
  if (!voiceAvailable) {
    voiceOn = false;
    buttons.forEach(b => setToggleState(b, false, true));
    return;
  }
  buttons.forEach(b => setToggleState(b, voiceOn));
}

function updateSfxBtn() {
  ["sfxToggle", "playSfxToggle"].forEach(id => setToggleState(document.getElementById(id), sfxOn));
}

function updateBgmBtn() {
  ["bgmToggle", "playBgmToggle"].forEach(id => setToggleState(document.getElementById(id), bgmOn));
}

function playBgmNote(freq, dur = 0.42) {
  if (!bgmOn || !mediaUnlocked) return;
  try {
    ensureAudio(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.018, ac.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur);
  } catch(e) {}
}

function seekBgmStart(audio) {
  try {
    audio.currentTime = BGM_START_SECONDS;
  } catch(e) {
    audio.addEventListener("loadedmetadata", () => {
      try { audio.currentTime = BGM_START_SECONDS; } catch(_) {}
    }, { once: true });
  }
}

function getBgmAudio() {
  if (typeof Audio === "undefined") return null;
  if (bgmAudio) return bgmAudio;
  try {
    bgmAudio = new Audio(assetUrl(BGM_SRC));
    bgmAudio.preload = "auto";
    bgmAudio.volume = 0.28;
    bgmAudio.addEventListener("ended", () => {
      if (!bgmOn || !mediaUnlocked || document.hidden) return;
      seekBgmStart(bgmAudio);
      bgmAudio.play().catch(() => startSynthBackgroundMusic());
    });
    bgmAudio.addEventListener("error", () => startSynthBackgroundMusic());
    seekBgmStart(bgmAudio);
    return bgmAudio;
  } catch(e) {
    bgmAudio = null;
    return null;
  }
}

function startRecordedBackgroundMusic() {
  if (document.hidden) return false;
  const audio = getBgmAudio();
  if (!audio) return false;
  try {
    if (audio.paused) {
      if (!audio.currentTime || audio.currentTime < BGM_START_SECONDS) seekBgmStart(audio);
      audio.play().catch(() => startSynthBackgroundMusic());
    }
    return true;
  } catch(e) {
    return false;
  }
}

function startSynthBackgroundMusic() {
  if (!bgmOn || bgmTimer || !mediaUnlocked || document.hidden) return;
  const notes = [392, 440, 523.25, 440, 349.23, 392, 493.88, 392];
  playBgmNote(notes[bgmStep % notes.length]);
  bgmTimer = setInterval(() => {
    if (!bgmOn) {
      stopBackgroundMusic();
      return;
    }
    bgmStep++;
    playBgmNote(notes[bgmStep % notes.length]);
  }, 1200);
}

function startBackgroundMusic() {
  if (!bgmOn || !mediaUnlocked || document.hidden) return;
  if (startRecordedBackgroundMusic()) return;
  startSynthBackgroundMusic();
}

function stopBackgroundMusic() {
  if (bgmAudio) {
    try {
      bgmAudio.pause();
      seekBgmStart(bgmAudio);
    } catch(e) {}
  }
  if (bgmTimer) {
    clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

function syncBackgroundMusic() {
  if (bgmOn && !document.hidden) startBackgroundMusic();
  else stopBackgroundMusic();
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopBackgroundMusic();
});

window.addEventListener("pagehide", stopBackgroundMusic);

function updateAudioControls() {
  updateVoiceBtn();
  updateSfxBtn();
  updateBgmBtn();
  syncBackgroundMusic();
}

/* Wake media on first user gesture (iOS autoplay policy) */
function unlockMedia() {
  mediaUnlocked = true;
  ensureAudio();
  if ("speechSynthesis" in window) {
    try { const u = new SpeechSynthesisUtterance(""); u.volume = 0; speechSynthesis.speak(u); } catch(e){}
  }
  detectVoice(); updateAudioControls();
}
window.addEventListener("pointerdown", unlockMedia, { once: true });
window.addEventListener("touchstart", unlockMedia, { once: true, passive: true });

function playButtonSound() {
  if (!sfxOn || typeof Audio === "undefined") return;
  try {
    const audio = new Audio(assetUrl(BUTTON_SOUND_SRC));
    audio.volume = 0.16;
    audio.play().catch(() => {});
  } catch(e) {}
}

document.addEventListener("click", e => {
  const button = e.target.closest?.("button");
  if (!button || button.disabled) return;
  playButtonSound();
}, true);

/* ---------- Display mode (fullscreen + landscape handoff) ---------- */
let firstGestureDisplayRequested = false;
const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function displayCapabilities() {
  const el = document.documentElement;
  return {
    fullscreen_api: !!(el.requestFullscreen || el.webkitRequestFullscreen),
    fullscreen_active: !!fullscreenElement(),
    orientation_api: !!(screen.orientation && typeof screen.orientation.lock === "function"),
    orientation_type: screen.orientation?.type || null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.innerWidth >= window.innerHeight ? "landscape" : "portrait",
    },
  };
}

function displayRequestPayload(reason) {
  return {
    reason,
    fullscreen: !!runtime.requestFullscreen,
    orientation_lock: runtime.orientationLock,
    css_landscape_fallback: !!runtime.cssLandscapeFallback,
    native_required: !!runtime.nativeDisplayRequest,
    capabilities: displayCapabilities(),
    native_hint: {
      android: "Use Activity/WebView immersive fullscreen and requestedOrientation=landscape.",
      ios: "Present the WebView in a landscape-capable fullscreen controller or lock supportedInterfaceOrientations for this game screen.",
    },
  };
}

function emitDisplayRequest(reason, force = false) {
  if (!runtime.nativeDisplayRequest && !runtime.requestFullscreen && !runtime.orientationLock) return;
  if (displayRequestEmitted && !force) return;
  displayRequestEmitted = true;
  RN({ type:"DISPLAY_REQUEST", payload: displayRequestPayload(reason) });
}

async function requestWebFullscreen() {
  if (!runtime.requestFullscreen || fullscreenElement()) return { attempted:false, ok:!!fullscreenElement(), error:null };
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI:"hide" });
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else {
      return { attempted:false, ok:false, error:"unsupported" };
    }
    return { attempted:true, ok:!!fullscreenElement(), error:null };
  } catch (error) {
    return { attempted:true, ok:false, error:error?.name || String(error) };
  }
}

async function lockWebOrientation() {
  if (!runtime.orientationLock) return { attempted:false, ok:false, error:null };
  if (!screen.orientation || typeof screen.orientation.lock !== "function") {
    return { attempted:false, ok:false, error:"unsupported" };
  }
  try {
    await screen.orientation.lock(runtime.orientationLock);
    return { attempted:true, ok:true, error:null };
  } catch (error) {
    return { attempted:true, ok:false, error:error?.name || String(error) };
  }
}

async function enterGameDisplay(reason = "user_gesture") {
  emitDisplayRequest(reason, true);
  const fullscreen = await requestWebFullscreen();
  const orientation = await lockWebOrientation();
  updateDisplayState();
  RN({
    type:"DISPLAY_APPLIED",
    payload:{
      reason,
      fullscreen,
      orientation,
      capabilities: displayCapabilities(),
    },
  });
}

function requestDisplayOnFirstGesture() {
  if (firstGestureDisplayRequested) return;
  firstGestureDisplayRequested = true;
  enterGameDisplay("first_user_gesture");
}

function updateStageScale(portrait = window.innerHeight > window.innerWidth) {
  const useCssLandscape = document.body.classList.contains("force-landscape-css") && portrait;
  const availableWidth = useCssLandscape ? window.innerHeight : window.innerWidth;
  const availableHeight = useCssLandscape ? window.innerWidth : window.innerHeight;
  const scaleX = availableWidth / STAGE_WIDTH;
  const scaleY = availableHeight / STAGE_HEIGHT;
  const fallbackScale = Math.min(scaleX, scaleY);
  document.documentElement.style.setProperty("--stage-scale", Math.max(0.01, fallbackScale).toFixed(5));
  document.documentElement.style.setProperty("--stage-scale-x", Math.max(0.01, fallbackScale).toFixed(5));
  document.documentElement.style.setProperty("--stage-scale-y", Math.max(0.01, fallbackScale).toFixed(5));

  const fixedUiScale = Math.min(1, Math.max(0.58, fallbackScale));
  document.documentElement.style.setProperty("--fixed-ui-scale", fixedUiScale.toFixed(5));
  document.documentElement.style.setProperty("--fixed-settings-button-size", `${Math.round(82 * fixedUiScale)}px`);
  document.documentElement.style.setProperty("--fixed-settings-icon-size", `${Math.round(58 * fixedUiScale)}px`);
  document.documentElement.style.setProperty("--fixed-settings-button-font-size", `${Math.round(56 * fixedUiScale)}px`);
}

function updateDisplayState() {
  const portrait = window.innerHeight > window.innerWidth;
  document.body.classList.toggle("portrait-viewport", portrait);
  updateStageScale(portrait);
}

window.addEventListener("pointerdown", requestDisplayOnFirstGesture, { once: true });
window.addEventListener("touchstart", requestDisplayOnFirstGesture, { once: true, passive: true });
window.addEventListener("resize", updateDisplayState);
if (window.visualViewport) window.visualViewport.addEventListener("resize", updateDisplayState);
window.addEventListener("orientationchange", () => setTimeout(updateDisplayState, 120));
document.addEventListener("fullscreenchange", updateDisplayState);
document.addEventListener("webkitfullscreenchange", updateDisplayState);
updateDisplayState();

function tone(freq, dur=0.18, type="sine", vol=0.06) {
  if (!sfxOn) return;
  try {
    ensureAudio(); if (!ac) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol * SFX_VOLUME_SCALE;
    o.connect(g); g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur);
  } catch(e) {}
}
function dingHappy()  { tone(660,.12,"sine",.07); setTimeout(()=>tone(880,.18,"sine",.07), 120); }
function dingSoft()   { tone(440,.14,"sine",.05); }
