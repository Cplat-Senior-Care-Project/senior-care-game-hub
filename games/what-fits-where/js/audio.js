/* ===== SOUND SETTINGS ===== */
const soundSettings = { bgm:true, sfx:true, voice:true };
function playBgm(){ /* hook for future bgm */ }
function stopBgm(){ /* hook for future bgm */ }
function playSfx(/*name*/){ /* hook for future sfx */ }
function playVoice(/*name*/){ /* hook for future voice */ }
function applySoundSettings(){
  if(soundSettings.bgm) playBgm(); else stopBgm();
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
