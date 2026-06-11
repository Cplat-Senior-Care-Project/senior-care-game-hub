/* ===== SOUND SETTINGS ===== */
const soundSettings = { bgm:true, sfx:true, voice:true };
const SFX_FILES = {
  button: "assets/audio/button.mp3",
  choice: "assets/audio/choice.mp3",
};
const VOICE_FILES = {
  preGameCondition: "assets/audio/voice/pre-game-condition.mp3",
  chooseDifficulty: "assets/audio/voice/choose-difficulty.mp3",
  countdownStart: "assets/audio/voice/countdown-start.mp3",
  chooseMatchingIntro: "assets/audio/voice/choose-matching-intro.mp3",
  removeMismatchIntro: "assets/audio/voice/remove-mismatch-intro.mp3",
  guessSituationIntro: "assets/audio/voice/guess-situation-intro.mp3",
  chooseMatchingPrompt: "assets/audio/voice/choose-matching-prompt.mp3",
  removeMismatchPrompt: "assets/audio/voice/remove-mismatch-prompt.mp3",
  guessSituationPrompt: "assets/audio/voice/guess-situation-prompt.mp3",
  hint: "assets/audio/voice/hint.mp3",
  pause: "assets/audio/voice/pause.mp3",
  wellDone: "assets/audio/voice/well-done.mp3",
  scoreScreen: "assets/audio/voice/score-screen.mp3",
  postCheckStatus: "assets/audio/voice/post-check-status.mp3",
  postCheckMore: "assets/audio/voice/post-check-more.mp3",
};
const BGM_FILES = {
  pregame: { src: "assets/audio/bgm-pregame.mp3", startAt: 1 },
  gameplay: { src: "assets/audio/bgm-gameplay.mp3", startAt: 0 },
};
const BGM_VOLUME = 0.35;
const sfxPlayers = {};
const voicePlayers = {};
const bgmPlayers = {};
let activeVoice = null;
let pendingVoice = null;
let activeBgmName = null;
let pendingBgmName = null;

function getSfxPlayer(name){
  const src = SFX_FILES[name];
  if(!src) return null;
  if(!sfxPlayers[name]){
    const audio = new Audio(src);
    audio.preload = "auto";
    sfxPlayers[name] = audio;
  }
  return sfxPlayers[name];
}

function replayAudio(audio){
  try{
    const player = audio.cloneNode ? audio.cloneNode(true) : new Audio(audio.src);
    player.currentTime = 0;
    const playPromise = player.play();
    if(playPromise && typeof playPromise.catch === "function"){
      playPromise.catch(()=>{});
    }
  }catch(e){}
}

function seekAudio(audio, time){
  const run = ()=>{
    try{ audio.currentTime = time || 0; }catch(e){}
  };
  if(audio.readyState >= 1){
    run();
  } else {
    audio.addEventListener("loadedmetadata", run, { once:true });
  }
}

function getBgmPlayer(name){
  const cfg = BGM_FILES[name];
  if(!cfg) return null;
  if(!bgmPlayers[name]){
    const audio = new Audio(cfg.src);
    audio.preload = "auto";
    audio.volume = BGM_VOLUME;
    audio.addEventListener("ended", ()=>{
      if(activeBgmName !== name || !soundSettings.bgm) return;
      seekAudio(audio, cfg.startAt || 0);
      const playPromise = audio.play();
      if(playPromise && typeof playPromise.catch === "function"){
        playPromise.catch(()=>{
          if(soundSettings.bgm && activeBgmName === name) pendingBgmName = name;
        });
      }
    });
    bgmPlayers[name] = audio;
  }
  return bgmPlayers[name];
}

function playBgm(name = activeBgmName){
  if(!soundSettings.bgm || !name) return;
  const cfg = BGM_FILES[name];
  const audio = getBgmPlayer(name);
  if(!cfg || !audio) return;
  activeBgmName = name;
  pendingBgmName = null;
  if(audio.ended || audio.currentTime < (cfg.startAt || 0)){
    seekAudio(audio, cfg.startAt || 0);
  }
  try{
    const playPromise = audio.play();
    if(playPromise && typeof playPromise.catch === "function"){
      playPromise.catch(()=>{
        if(soundSettings.bgm && activeBgmName === name) pendingBgmName = name;
      });
    }
  }catch(e){
    if(soundSettings.bgm && activeBgmName === name) pendingBgmName = name;
  }
}

function stopBgm(reset = false){
  pendingBgmName = null;
  if(!activeBgmName) return;
  const cfg = BGM_FILES[activeBgmName];
  const audio = bgmPlayers[activeBgmName];
  if(!audio) return;
  try{
    audio.pause();
    if(reset) seekAudio(audio, (cfg && cfg.startAt) || 0);
  }catch(e){}
}

function setBgmTrack(name){
  if(name && !BGM_FILES[name]) return;
  if(activeBgmName === name){
    if(name && soundSettings.bgm) playBgm(name);
    return;
  }
  stopBgm(true);
  activeBgmName = name || null;
  pendingBgmName = null;
  if(activeBgmName && soundSettings.bgm) playBgm(activeBgmName);
}

function playSfx(name = "button"){
  if(!soundSettings.sfx) return;
  const audio = getSfxPlayer(name);
  if(!audio) return;
  replayAudio(audio);
}
function getVoicePlayer(name){
  const src = VOICE_FILES[name];
  if(!src) return null;
  if(!voicePlayers[name]){
    const audio = new Audio(src);
    audio.preload = "auto";
    voicePlayers[name] = audio;
  }
  return voicePlayers[name];
}
function stopVoice(){
  if(!activeVoice) return;
  try{
    activeVoice.pause();
    activeVoice.currentTime = 0;
  }catch(e){}
  activeVoice = null;
}
function playVoice(name){
  if(!soundSettings.voice) return;
  const audio = getVoicePlayer(name);
  if(!audio) return;
  stopVoice();
  try{
    audio.currentTime = 0;
    activeVoice = audio;
    pendingVoice = null;
    const playPromise = audio.play();
    if(playPromise && typeof playPromise.catch === "function"){
      playPromise.catch(()=>{
        if(soundSettings.voice) pendingVoice = name;
        if(activeVoice === audio) activeVoice = null;
      });
    }
  }catch(e){
    if(soundSettings.voice) pendingVoice = name;
    if(activeVoice === audio) activeVoice = null;
  }
}
function retryPendingVoice(){
  if(!pendingVoice || !soundSettings.voice) return;
  const name = pendingVoice;
  pendingVoice = null;
  playVoice(name);
}
function retryPendingBgm(){
  if(!pendingBgmName || !soundSettings.bgm) return;
  const name = pendingBgmName;
  pendingBgmName = null;
  playBgm(name);
}
function applySoundSettings(){
  if(soundSettings.bgm) playBgm(); else stopBgm();
  if(!soundSettings.voice) stopVoice();
}
function refreshSoundToggles(){
  document.querySelectorAll(".toggle[data-sound]").forEach(btn=>{
    const k = btn.dataset.sound;
    const on = !!soundSettings[k];
    btn.classList.toggle("on", on);
    const t = btn.querySelector(".txt"); if(t) t.textContent = on ? "켜짐" : "꺼짐";
  });
}
document.querySelectorAll(".toggle[data-sound]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const k = btn.dataset.sound;
    soundSettings[k] = !soundSettings[k];
    refreshSoundToggles();
    applySoundSettings();
  });
});

document.addEventListener("click", e=>{
  const btn = e.target.closest("button");
  if(!btn || btn.disabled) return;
  const isProblemChoice = !!btn.closest("#screen-play #p-choices .choice");
  playSfx(isProblemChoice ? "choice" : "button");
}, true);
document.addEventListener("pointerdown", retryPendingBgm, true);
document.addEventListener("keydown", retryPendingBgm, true);
document.addEventListener("pointerdown", retryPendingVoice, true);
document.addEventListener("keydown", retryPendingVoice, true);
