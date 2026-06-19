/* ---------- Voice (with Korean availability check) ---------- */
function detectVoice() {
  if (!("speechSynthesis" in window)) { voiceAvailable = false; return; }
  const voices = speechSynthesis.getVoices();
  voiceAvailable = voices.some(v => /^ko/i.test(v.lang));
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { detectVoice(); updateVoiceBtn(); };
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

function updateVoiceBtn() {
  const b = document.getElementById("voiceBtn");
  if (!b) return;
  if (!voiceAvailable) {
    b.textContent = "🔇 음성 없음"; b.disabled = true; b.style.opacity = ".55";
    voiceOn = false;
  } else {
    b.textContent = (voiceOn ? "🔊" : "🔇") + " 음성";
    b.disabled = false; b.style.opacity = "";
  }
}

/* ---------- Sound (WebAudio chimes, iOS-safe lazy init) ---------- */
let ac = null;
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
/* Wake media on first user gesture (iOS autoplay policy) */
function unlockMedia() {
  ensureAudio();
  if ("speechSynthesis" in window) {
    try { const u = new SpeechSynthesisUtterance(""); u.volume = 0; speechSynthesis.speak(u); } catch(e){}
  }
  detectVoice(); updateVoiceBtn();
}
window.addEventListener("pointerdown", unlockMedia, { once: true });
window.addEventListener("touchstart", unlockMedia, { once: true, passive: true });

/* ---------- Display mode (fullscreen + landscape handoff) ---------- */
let firstGestureDisplayRequested = false;

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

function updateDisplayState() {
  const portrait = window.innerHeight > window.innerWidth;
  document.body.classList.toggle("portrait-viewport", portrait);
}

window.addEventListener("pointerdown", requestDisplayOnFirstGesture, { once: true });
window.addEventListener("touchstart", requestDisplayOnFirstGesture, { once: true, passive: true });
window.addEventListener("resize", updateDisplayState);
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
