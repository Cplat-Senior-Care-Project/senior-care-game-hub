/* ---------- Voice (with Korean availability check) ---------- */
function detectVoice() {
  if (!("speechSynthesis" in window)) { voiceAvailable = false; return; }
  const voices = speechSynthesis.getVoices();
  voiceAvailable = voices.some(v => /^ko/i.test(v.lang));
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { detectVoice(); updateAudioControls(); };
}
detectVoice();

function speak(text) {
  if (!voiceOn || !voiceAvailable) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = 0.95; u.pitch = 1;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch(e) {}
}

/* ---------- Sound (WebAudio chimes, iOS-safe lazy init) ---------- */
let ac = null;
let mediaUnlocked = false;
let bgmTimer = null;
let bgmStep = 0;
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
  const status = button.querySelector("strong");
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
  const b = document.getElementById("voiceBtn");
  if (!b) return;
  if (!voiceAvailable) {
    voiceOn = false;
    setToggleState(b, false, true);
    return;
  }
  setToggleState(b, voiceOn);
}

function updateSfxBtn() {
  setToggleState(document.getElementById("sfxToggle"), sfxOn);
}

function updateBgmBtn() {
  setToggleState(document.getElementById("bgmToggle"), bgmOn);
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

function startBackgroundMusic() {
  if (!bgmOn || bgmTimer || !mediaUnlocked) return;
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

function stopBackgroundMusic() {
  if (!bgmTimer) return;
  clearInterval(bgmTimer);
  bgmTimer = null;
}

function syncBackgroundMusic() {
  if (bgmOn) startBackgroundMusic();
  else stopBackgroundMusic();
}

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
  const scale = Math.min(availableWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT);
  document.documentElement.style.setProperty("--stage-scale", Math.max(0.01, scale).toFixed(5));
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
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur);
  } catch(e) {}
}
function dingHappy()  { tone(660,.12,"sine",.07); setTimeout(()=>tone(880,.18,"sine",.07), 120); }
function dingSoft()   { tone(440,.14,"sine",.05); }
