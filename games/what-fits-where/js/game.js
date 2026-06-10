const $ = id => document.getElementById(id);
const shuffle = a => {const x=a.slice();for(let i=x.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[x[i],x[j]]=[x[j],x[i]]}return x};
const pick = (arr,n) => shuffle(arr).slice(0,n);

const state = {
  mode:null, diff:null, diffSource:"user_selected",
  queue:[], qIndex:0,
  startedAt:0,
  correct:0, wrong:0,
  selectedRequired:0, selectedUnnecessary:0,
  removedMismatched:0, wronglyRemovedMatched:0,
  guessedSituations:0, wrongSituationChoices:0,
  situationResponses:[],
  stageStats:[{c:0,w:0},{c:0,w:0},{c:0,w:0}],
  responses:[],
  current:null,
  endedByUser:false, timeOver:false,
  timerId:null, timerLeft:0, paused:false,
  advanceTimer:null,
  scoreScreenEnabled:true,
  lastResult:null,
};
state.conditionData = null;
state.postGameConditionData = null;

const SCORE_SCREEN_STORAGE_KEY = "whatFitsWhere.scoreScreenEnabled";

function loadScoreScreenEnabled(defaultValue){
  try{
    const saved = localStorage.getItem(SCORE_SCREEN_STORAGE_KEY);
    if(saved === "true") return true;
    if(saved === "false") return false;
  }catch(e){}
  return defaultValue;
}

function saveScoreScreenEnabled(value){
  try{ localStorage.setItem(SCORE_SCREEN_STORAGE_KEY, value ? "true" : "false"); }catch(e){}
}

function refreshScoreScreenToggle(){
  const on = state.scoreScreenEnabled !== false;
  document.querySelectorAll('[data-setting="score-screen"]').forEach(btn=>{
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    const t = btn.querySelector(".txt");
    if(t) t.textContent = on ? "On" : "Off";
  });
}

function shouldShowScoreScreen(){
  return (state.appMode || "standard") === "standard" && state.scoreScreenEnabled !== false;
}

/* ===== APP CONFIG (mode-driven UI) ===== */
function applyAppConfig(){
  const appMode = (window.GAME_MODE || "standard");
  const cfg = Object.assign({}, DEFAULT_CONFIG, window.GAME_CONFIG || {});
  if(!state.diff && ["easy", "normal", "hard"].includes(cfg.default_difficulty)){
    state.diff = cfg.default_difficulty;
    state.diffSource = appMode + "_default";
  }
  // sound defaults from config
  soundSettings.bgm = !!cfg.background_music_enabled;
  soundSettings.sfx = !!cfg.sound_effect_enabled;
  soundSettings.voice = !!cfg.voice_guide_enabled;
  refreshSoundToggles();
  state.scoreScreenEnabled = loadScoreScreenEnabled(cfg.show_score !== false);
  refreshScoreScreenToggle();
  // top buttons visibility
  const sBtn = $("btn-settings"), hBtn = $("btn-howto"), hintBtn = $("btn-hint");
  if(sBtn) sBtn.style.display = cfg.show_settings ? "" : "none";
  if(hBtn) hBtn.style.display = cfg.show_how_to_play ? "" : "none";
  if(hintBtn) hintBtn.style.display = appMode === "standard" ? "" : "none";
  ["settings-score-row", "settings-modal-score-row"].forEach(id=>{
    const scoreRow = $(id);
    if(scoreRow) scoreRow.style.display = appMode === "standard" ? "" : "none";
  });
  // difficulty section
  const diffRow = $("diff-row"), diffH = $("diff-heading");
  if(diffRow) diffRow.style.display = cfg.show_difficulty_select ? "" : "none";
  if(diffH) diffH.style.display = cfg.show_difficulty_select ? "" : "none";
  // timer / score in play screen
  const tEl = $("p-timer"); if(tEl) tEl.style.display = cfg.show_timer ? "" : "none";
  // care mode tweaks
  if(appMode === "care"){
    document.body.classList.add("mode-care");
    if(!state.diff){ state.diff = "easy"; state.diffSource = "care_default"; }
  }
  state.appMode = appMode;
  state.appConfig = cfg;
}

/* ===== SETTINGS MODAL ===== */
const _settingsBtn = $("btn-settings");
if(_settingsBtn) _settingsBtn.addEventListener("click", ()=>{ $("settings-modal").classList.add("active"); });
$("btn-settings-back").addEventListener("click", ()=>{ $("settings-modal").classList.remove("active"); });
document.querySelectorAll('[data-setting="score-screen"]').forEach(btn=>{
  btn.addEventListener("click", ()=>{
    state.scoreScreenEnabled = !(state.scoreScreenEnabled !== false);
    saveScoreScreenEnabled(state.scoreScreenEnabled);
    refreshScoreScreenToggle();
  });
});

/* ===== HELP / TUTORIAL (multi-page) ===== */
let helpIdx = 0;
function renderHelp(){
  const p = HELP_PAGES[helpIdx];
  const first = helpIdx === 0;
  $("help-title").textContent = p.t;
  $("help-text").textContent = p.b;
  $("help-progress").innerHTML = HELP_PAGES.map((_,i)=>`<span class="dot${i===helpIdx?" on":""}"></span>`).join("");
  $("help-prev").textContent = first ? "건너뛰기" : "이전";
  $("help-prev").disabled = false;
  const last = helpIdx === HELP_PAGES.length - 1;
  $("help-next").style.display = last ? "none" : "";
  $("help-done").style.display = last ? "" : "none";
}
function openHelp(){ helpIdx = 0; renderHelp(); $("help-modal").classList.add("active"); }
const _howtoBtn = $("btn-howto");
if(_howtoBtn) _howtoBtn.addEventListener("click", openHelp);
$("help-prev").addEventListener("click", ()=>{
  if(helpIdx === 0){
    $("help-modal").classList.remove("active");
    return;
  }
  helpIdx--;
  renderHelp();
});
$("help-next").addEventListener("click", ()=>{ if(helpIdx<HELP_PAGES.length-1){ helpIdx++; renderHelp(); } });
$("help-done").addEventListener("click", ()=>{ $("help-modal").classList.remove("active"); });

/* ===== APP EVENT BRIDGE ===== */
function sendGameEvent(type, payload = {}){
  const message = { type, payload, timestamp: new Date().toISOString() };
  try{
    if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    } else {
      console.log("Game Event:", message);
    }
  }catch(e){ console.warn("sendGameEvent error", e); }
}

/* ===== LOADING ===== */
function runLoading(done){
  const fill = $("loading-bar-fill");
  const percent = $("loading-percent");
  const screen = $("loading-screen");
  screen.classList.add("active");
  fill.style.width = "0%";
  if(percent) percent.textContent = "0%";
  let p = 0;
  const id = setInterval(()=>{
    p += 12 + Math.random()*18;
    if(p >= 100){
      p = 100; fill.style.width = "100%"; if(percent) percent.textContent = "100%"; clearInterval(id);
      setTimeout(()=>{ screen.classList.remove("active"); sendGameEvent("GAME_READY"); done && done(); }, 200);
    } else {
      fill.style.width = p + "%";
      if(percent) percent.textContent = Math.floor(p) + "%";
    }
  }, 90);
}
window.addEventListener("DOMContentLoaded", ()=>{
  runLoading(()=>{ maybeShowConditionCheck(); });
});

/* ===== CONDITION CHECK ===== */
let _ccMood = null;
let _ccSleepIdx = 4; // default 8시간
function maybeShowConditionCheck(){
  const cfg = state.appConfig || DEFAULT_CONFIG;
  const appMode = state.appMode || "standard";
  const show = (appMode === "standard") ? (cfg.show_condition_check !== false)
             : (appMode === "reminder") ? !!cfg.show_condition_check
             : false;
  if(!show){
    if(cfg.default_mood || cfg.default_sleep_hours){
      state.conditionData = {
        mood: cfg.default_mood || null,
        sleep_hours: cfg.default_sleep_hours || null,
        sleep_range: cfg.default_sleep_hours ? String(cfg.default_sleep_hours) : null,
      };
    }
    switchScreen("screen-start");
    if(cfg.auto_start){
      window.setTimeout(()=>{ startGame(); }, 0);
    }
    return;
  }
  // pre-select defaults
  _ccMood = cfg.default_mood || null;
  const defH = cfg.default_sleep_hours || 8;
  const idx = SLEEP_STEPS.findIndex(s => s.hours === defH);
  _ccSleepIdx = idx >= 0 ? idx : 4; // 8시간
  renderConditionSel();
  const skipBtn = $("cc-skip");
  if(skipBtn) skipBtn.style.display = appMode === "standard" ? "" : "none";
  switchScreen("screen-condition");
}
function renderConditionSel(){
  document.querySelectorAll("#cc-mood-row .mood-btn").forEach(b=>{
    b.classList.toggle("sel", b.dataset.mood === _ccMood);
  });
  // sleep stepper: show idx-1 / idx / idx+1
  const up   = SLEEP_STEPS[_ccSleepIdx + 1];
  const mid  = SLEEP_STEPS[_ccSleepIdx];
  const down = SLEEP_STEPS[_ccSleepIdx - 1];
  const upEl = $("cc-sleep-up"), midEl = $("cc-sleep-mid"), downEl = $("cc-sleep-down");
  if(upEl)   upEl.textContent   = up   ? up.label   : "";
  if(midEl)  midEl.textContent  = mid  ? mid.label  : "";
  if(downEl) downEl.textContent = down ? down.label : "";
  if(upEl)   upEl.classList.toggle("empty", !up);
  if(downEl) downEl.classList.toggle("empty", !down);
  const upBtn = $("cc-sleep-up-btn"), downBtn = $("cc-sleep-down-btn");
  if(upBtn)   upBtn.disabled   = _ccSleepIdx >= SLEEP_STEPS.length - 1;
  if(downBtn) downBtn.disabled = _ccSleepIdx <= 0;
  // 수면시간은 기본값(8시간)으로 항상 선택된 상태 → 기분만 선택되면 활성화
  $("cc-confirm").disabled = !_ccMood;
}
document.getElementById("cc-mood-row").addEventListener("click", e=>{
  const b = e.target.closest(".mood-btn"); if(!b) return;
  _ccMood = b.dataset.mood; renderConditionSel();
});
document.getElementById("cc-sleep-up-btn").addEventListener("click", ()=>{
  if(_ccSleepIdx < SLEEP_STEPS.length - 1){ _ccSleepIdx++; renderConditionSel(); }
});
document.getElementById("cc-sleep-down-btn").addEventListener("click", ()=>{
  if(_ccSleepIdx > 0){ _ccSleepIdx--; renderConditionSel(); }
});
document.getElementById("cc-confirm").addEventListener("click", ()=>{
  if(!_ccMood) return;
  const sel = SLEEP_STEPS[_ccSleepIdx];
  state.conditionData = {
    mood: _ccMood,
    sleep_hours: sel.hours,
    sleep_range: sel.range,
  };
  switchScreen("screen-start");
});
document.getElementById("cc-skip").addEventListener("click", ()=>{
  state.conditionData = {
    skipped: true,
    mood: null,
    sleep_hours: null,
    sleep_range: null,
  };
  switchScreen("screen-start");
});
window.addEventListener("error", e=>{
  showError(e?.message || "알 수 없는 오류가 발생했어요.");
});

/* ===== COUNTDOWN ===== */
function runCountdown(onDone){
  const modal = $("countdown-modal");
  const numEl = $("countdown-num");
  let n = 3;
  numEl.textContent = n;
  modal.classList.add("active");
  const tick = setInterval(()=>{
    n--;
    if(n <= 0){
      clearInterval(tick);
      modal.classList.remove("active");
      onDone && onDone();
    } else {
      numEl.textContent = n;
      // re-trigger pulse anim
      numEl.style.animation = "none"; void numEl.offsetWidth; numEl.style.animation = "";
    }
  }, 1000);
}

/* ===== ERROR ===== */
function showError(msg){
  $("error-msg").textContent = msg || "잠시 후 다시 시도해주세요.";
  $("error-modal").classList.add("active");
  sendGameEvent("GAME_ERROR", { message: msg || "unknown" });
}
$("btn-error-retry").addEventListener("click", ()=>{
  $("error-modal").classList.remove("active");
});
$("btn-error-exit").addEventListener("click", ()=>{
  $("error-modal").classList.remove("active");
  state.endedByUser = true; finishGame(true, false);
});

/* ===== START ===== */
$("btn-start").addEventListener("click", ()=>{
  const appMode = state.appMode || "standard";
  if(appMode === "reminder" || appMode === "care" || appMode === "ai_assisted"){
    if(!state.diff){
      state.diff = "easy";
      state.diffSource = appMode + "_default";
    }
    startGame(); return;
  }
  // care: 항상 easy 바로 시작. reminder/ai_assisted: diff가 이미 주어졌으면 바로 시작.
  if(appMode === "care"){
    state.diff = "easy"; state.diffSource = "care_default";
    startGame(); return;
  }
  if((appMode === "reminder" || appMode === "ai_assisted") && state.diff){
    startGame(); return;
  }
  // standard: 난이도 선택 화면으로 이동
  switchScreen("screen-difficulty");
});

// 난이도 선택
$("diff-row-select").addEventListener("click", e=>{
  const b = e.target.closest(".opt-card"); if(!b) return;
  state.diff = b.dataset.diff; state.diffSource = "user_selected";
  startGame();
});
$("btn-diff-back").addEventListener("click", ()=>{ switchScreen("screen-start"); });

(function applyProfile(){
  const g = window.USER_DIFFICULTY_GROUP;
  const map = {low:"easy", middle:"normal", high:"hard"};
  if(g && map[g]){
    state.diff = map[g]; state.diffSource = "profile_based";
  }
})();
/* apply app-level config (mode, sound defaults, UI visibility) */
applyAppConfig();

/* ===== BUILD QUEUE ===== */
function buildQueue(){
  const q = [];
  const diff = state.diff || "easy";
  const qps = Q_PER_STAGE_BY_DIFF[diff] || Q_PER_STAGE_BY_DIFF.normal;
  // 각 미션마다 모드별 문제 빌더를 사용해 순서대로 진행
  MISSION_SEQUENCE.forEach((mode, mi)=>{
    const stageNo = mi + 1;
    const count = qps[mi];
    if(count <= 0) return;
    q.push(...getGameMode(mode).buildQuestions({ mode, diff, stageNo, count }));
  });
  return q;
}

/* ===== GAME ===== */
function startGame(){
  try{
    if(!state.diff) state.diff = "easy";
    state.mode = MISSION_SEQUENCE[0];
    state.queue = buildQueue();
  }catch(e){
    showError("게임 데이터를 불러오지 못했습니다.");
    return;
  }
  state.qIndex = 0;
  state.startedAt = Date.now();
  state.correct = 0; state.wrong = 0;
  state.selectedRequired=0; state.selectedUnnecessary=0;
  state.removedMismatched=0; state.wronglyRemovedMatched=0;
  state.guessedSituations=0; state.wrongSituationChoices=0;
  state.situationResponses=[];
  state.stageStats = [{c:0,w:0},{c:0,w:0},{c:0,w:0}];
  state.responses = [];
  state.postGameConditionData = null;
  state.endedByUser = false; state.timeOver = false;
  state.paused = false;
  switchScreen("screen-play");
  $("p-diff").textContent = DIFF_LABEL[state.diff];
  // 총 문제 수 (난이도별)
  const qps = Q_PER_STAGE_BY_DIFF[state.diff] || Q_PER_STAGE_BY_DIFF.normal;
  state.totalQ = qps.reduce((a,b)=>a+b,0);
  // Pause until countdown completes
  state.paused = true;
  runCountdown(()=>{
    startGlobalTimer();
    sendGameEvent("GAME_STARTED", { mode: state.mode, difficulty: state.diff });
    // 첫 미션 안내
    showMissionIntro(MISSION_SEQUENCE[0], ()=>{
      state.paused = false;
      renderQuestion();
    });
  });
}

function showMissionIntro(mode, onStart){
  state.paused = true;
  $("mission-title").textContent = MODE_LABEL[mode];
  $("mission-text").textContent = MISSION_INTRO[mode] || "";
  const modal = $("mission-modal");
  modal.classList.add("active");
  const btn = $("btn-mission-start");
  const handler = ()=>{
    btn.removeEventListener("click", handler);
    modal.classList.remove("active");
    state.paused = false;
    onStart && onStart();
  };
  btn.addEventListener("click", handler);
}

function switchScreen(id){
  document.querySelectorAll(".screen").forEach(s=>s.classList.toggle("active", s.id===id));
}

function clearAdvance(){ if(state.advanceTimer){ clearTimeout(state.advanceTimer); state.advanceTimer=null; } }

function getGameMode(mode){
  const modeDef = window.GAME_MODES && window.GAME_MODES[mode];
  if(!modeDef) throw new Error(`Unknown game mode: ${mode}`);
  return modeDef;
}

function renderQuestion(){
  clearAdvance();
  if(state.qIndex >= state.queue.length){ finishGame(false, false); return; }
  const q = state.queue[state.qIndex];
  // 문제 모드 갱신 + 미션 그룹 전환 시 인트로
  if(q.mode && q.mode !== state.mode){
    state.mode = q.mode;
    showMissionIntro(q.mode, ()=>renderQuestion());
    return;
  }
  state.mode = q.mode || state.mode;
  $("p-mode").textContent = MODE_LABEL[state.mode];
  // area-badges removed per UI request
  state.current = { q, picked:new Set(), removed:new Set(), guessAnswered:false, wrongCount:0, revealed:false, qStart:Date.now() };

  $("p-stage").textContent = `단계 ${q.stage}`;
  $("p-qnum").textContent = `${state.qIndex+1} / ${state.totalQ || state.queue.length}`;
  $("p-situation").textContent = q.sit;
  $("p-feedback").textContent = ""; $("p-feedback").className = "fb-msg";
  closeHintModal(true);
  updateHintButton();

  const modeDef = getGameMode(state.mode);
  const targetText = modeDef.getTargetText(q) || "";
  const targetEl = $("p-target");
  targetEl.textContent = targetText;
  targetEl.style.display = targetText ? "" : "none";
  modeDef.renderContext(q);

  renderChoices();
}

function renderChoices(){
  const grid = $("p-choices");
  grid.innerHTML = "";
  getGameMode(state.mode).renderChoices(state.current);
}

function showFeedback(text, kind){
  const el = $("p-feedback");
  el.textContent = text;
  el.className = "fb-msg " + kind;
}

function isStandardMode(){
  return (state.appMode || "standard") === "standard";
}

function updateHintButton(){
  const btn = $("btn-hint");
  if(!btn) return;
  const show = isStandardMode();
  btn.style.display = show ? "" : "none";
  btn.disabled = !show || !state.current || state.current.revealed;
}

function hintItemText(item){
  return (item && item.h) || "생활 속에서 쓰임새를 떠올려 보세요.";
}

function remainingAnswerItems(q, doneKeys){
  const answers = new Set(q.answers || []);
  return (q.items || []).filter(item => answers.has(item.k) && !doneKeys.has(item.k));
}

function describeHint(){
  const cur = state.current;
  if(!cur || !cur.q){
    return { title:"힌트", lines:[{ text:"문제가 시작되면 힌트를 볼 수 있어요." }] };
  }
  const q = cur.q;

  if(state.mode === "choose_matching_items"){
    const remaining = remainingAnswerItems(q, cur.picked);
    if(!remaining.length){
      return { title:"힌트", lines:[{ text:"아직 고르지 않은 물건이 없어요. 잘 고르셨어요." }] };
    }
    return {
      title:"물건의 쓰임새",
      lines: remaining.map(item => ({
        text: hintItemText(item),
      })),
    };
  }

  if(state.mode === "remove_mismatched_items"){
    const remaining = remainingAnswerItems(q, cur.removed);
    if(!remaining.length){
      return { title:"힌트", lines:[{ text:"아직 살펴볼 물건이 없어요. 잘 찾으셨어요." }] };
    }
    return {
      title:"물건의 쓰임새",
      lines: remaining.map(item => ({
        text: hintItemText(item),
      })),
    };
  }

  if(state.mode === "guess_situation"){
    const lines = q.items.map(item => ({
      text: hintItemText(item),
    }));
    return { title:"물건 단서", lines };
  }

  return { title:"힌트", lines:[{ text:"물건들을 하나씩 천천히 살펴보세요." }] };
}

function renderHintModal(){
  const hint = describeHint();
  const title = $("hint-title");
  const list = $("hint-list");
  if(title) title.textContent = hint.title || "힌트";
  if(!list) return;
  list.innerHTML = "";
  (hint.lines || []).forEach(line=>{
    const row = document.createElement("div");
    row.className = "hint-line";
    const text = document.createElement("span");
    text.textContent = line.text || "";
    row.appendChild(text);
    list.appendChild(row);
  });
}

function openHintModal(){
  if(!isStandardMode() || !state.current || state.current.revealed) return;
  renderHintModal();
  state.hintWasPaused = !!state.paused;
  state.paused = true;
  $("hint-modal").classList.add("active");
  sendGameEvent("HINT_OPENED", { mode: state.mode, question_index: state.qIndex + 1 });
}

function closeHintModal(keepPaused){
  const modal = $("hint-modal");
  if(modal) modal.classList.remove("active");
  if(!keepPaused && !state.hintWasPaused){
    state.paused = false;
  }
  state.hintWasPaused = false;
}

function finishQuestion(success, delay){
  const cur = state.current; const q = cur.q;
  cur.revealed = true;
  state.responses.push((Date.now()-cur.qStart)/1000);
  if(success){ state.correct++; state.stageStats[q.stage-1].c++; }
  else { state.wrong++; state.stageStats[q.stage-1].w++; }
  updateHintButton();
  state.advanceTimer = setTimeout(()=>{ state.qIndex++; renderQuestion(); }, delay||1200);
}

function revealAndAdvance(){
  const cur = state.current; const q = cur.q;
  cur.revealed = true;
  updateHintButton();
  state.wrong++; state.stageStats[q.stage-1].w++;
  state.responses.push((Date.now()-cur.qStart)/1000);

  const modal = $("reveal-modal");
  const content = $("reveal-content");
  const explain = $("reveal-explain");
  getGameMode(state.mode).renderReveal(q, content, explain);
  modal.classList.add("active");
  state.advanceTimer = setTimeout(()=>{
    modal.classList.remove("active");
    state.qIndex++; renderQuestion();
  }, 3000);
}

/* ===== TIMER ===== */
function fmtTime(s){ s=Math.max(0,s|0); const m=(s/60)|0, r=s%60; return `${String(m).padStart(2,"0")}:${String(r).padStart(2,"0")}`; }
function startGlobalTimer(){
  stopTimer();
  state.timerLeft = GAME_TIME_LIMIT;
  updateTimerDisplay();
  state.timerId = setInterval(()=>{
    if(state.paused) return;
    state.timerLeft--;
    updateTimerDisplay();
    if(state.timerLeft<=0){ stopTimer(); state.timeOver=true; finishGame(false,true); }
  }, 1000);
}
function updateTimerDisplay(){
  const el = $("p-timer");
  el.textContent = `⏱ ${fmtTime(state.timerLeft)}`;
  el.classList.toggle("warn", state.timerLeft<=20);
}
function stopTimer(){ if(state.timerId){ clearInterval(state.timerId); state.timerId=null; } }

/* ===== PAUSE MENU ===== */
const _hintBtn = $("btn-hint");
if(_hintBtn) _hintBtn.addEventListener("click", openHintModal);
const _hintCloseBtn = $("btn-hint-close");
if(_hintCloseBtn) _hintCloseBtn.addEventListener("click", ()=>{ closeHintModal(false); });

$("btn-pause").addEventListener("click", ()=>{
  state.paused = true;
  $("pause-modal").classList.add("active");
});
$("btn-resume").addEventListener("click", ()=>{
  $("pause-modal").classList.remove("active");
  // 3s countdown before resuming
  runCountdown(()=>{ state.paused = false; });
});
$("btn-restart").addEventListener("click", ()=>{
  $("pause-modal").classList.remove("active");
  stopTimer(); clearAdvance();
  sendGameEvent("GAME_RESTARTED", { mode: state.mode, difficulty: state.diff });
  startGame();
});
$("btn-help").addEventListener("click", ()=>{
  openHelp();
});
$("btn-pause-end").addEventListener("click", ()=>{
  $("pause-modal").classList.remove("active");
  $("exit-modal").classList.add("active");
});
$("btn-keep").addEventListener("click", ()=>{
  $("exit-modal").classList.remove("active");
  $("pause-modal").classList.add("active");
});
$("btn-end").addEventListener("click", ()=>{
  $("exit-modal").classList.remove("active");
  state.endedByUser = true;
  finishGame(true, false);
});

/* ===== POST GAME CONDITION CHECK ===== */
let _postGameCondition = null;
const POST_STEP_1_FIELDS = ["mood", "difficulty_feel", "fatigue"];
const POST_STEP_2_FIELDS = ["needed_help", "want_replay"];

function resetPostGameConditionCheck(){
  _postGameCondition = {
    mood: null,
    difficulty_feel: null,
    fatigue: null,
    needed_help: null,
    want_replay: null,
    skipped: false,
  };
  renderPostGameConditionCheck();
}

function renderPostGameConditionCheck(){
  const data = _postGameCondition || {};
  document.querySelectorAll("[data-post-group]").forEach(group=>{
    const field = group.dataset.postGroup;
    group.querySelectorAll("button").forEach(btn=>{
      btn.classList.toggle("sel", data[field] === btn.dataset.value);
    });
  });
  const step1Done = POST_STEP_1_FIELDS.every(field => !!data[field]);
  const step2Done = POST_STEP_2_FIELDS.every(field => !!data[field]);
  const nextBtn = $("post-next-1");
  const completeBtn = $("post-complete-2");
  if(nextBtn) nextBtn.disabled = !step1Done;
  if(completeBtn) completeBtn.disabled = !step2Done;
}

function startPostGameConditionCheck(){
  resetPostGameConditionCheck();
  switchScreen("screen-post-check-1");
}

function finishPostGameConditionCheck(skipped){
  const data = Object.assign({}, _postGameCondition || {}, {
    skipped: !!skipped,
    completed_at: new Date().toISOString(),
  });
  if(skipped){
    data.mood = null;
    data.difficulty_feel = null;
    data.fatigue = null;
    data.needed_help = null;
    data.want_replay = null;
  }
  state.postGameConditionData = data;
  sendGameEvent(skipped ? "POST_GAME_CONDITION_SKIPPED" : "POST_GAME_CONDITION_COMPLETED", data);
  resetToStartScreen();
}

document.querySelectorAll("[data-post-group]").forEach(group=>{
  group.addEventListener("click", e=>{
    const btn = e.target.closest("button");
    if(!btn || !_postGameCondition) return;
    _postGameCondition[group.dataset.postGroup] = btn.dataset.value;
    renderPostGameConditionCheck();
  });
});
$("post-skip-1").addEventListener("click", ()=>{ finishPostGameConditionCheck(true); });
$("post-next-1").addEventListener("click", ()=>{
  if(POST_STEP_1_FIELDS.every(field => !!(_postGameCondition && _postGameCondition[field]))){
    switchScreen("screen-post-check-2");
  }
});
$("post-prev-2").addEventListener("click", ()=>{ switchScreen("screen-post-check-1"); });
$("post-complete-2").addEventListener("click", ()=>{
  if(POST_STEP_2_FIELDS.every(field => !!(_postGameCondition && _postGameCondition[field]))){
    finishPostGameConditionCheck(false);
  }
});

function resetToStartScreen(){
  stopTimer(); clearAdvance();
  ["reveal-modal", "hint-modal", "pause-modal", "exit-modal", "help-modal", "countdown-modal", "mission-modal", "error-modal"].forEach(id=>{
    const el = $(id);
    if(el) el.classList.remove("active");
  });
  state.mode = null;
  state.queue = [];
  state.qIndex = 0;
  state.current = null;
  state.paused = false;
  state.endedByUser = false;
  state.timeOver = false;
  switchScreen("screen-start");
}

/* ===== FINISH ===== */
function recommendNext(){
  const c = state.correct;
  if(c>=8) return state.diff==="easy" ? "normal" : state.diff==="normal" ? "hard" : "hard";
  if(c>=5) return state.diff;
  return state.diff==="hard" ? "normal" : state.diff==="normal" ? "easy" : "easy";
}

function returnToHub(){
  const appMode = state.appMode || "standard";
  sendGameEvent("RETURN_TO_HUB", { app_mode: appMode });
  try{
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:"RETURN_TO_HUB", app_mode: appMode }));
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:"RETURN_TO_HYODAM_CALL", app_mode: appMode }));
    }
  }catch(e){ console.warn(e); }
  if(window.HUB_RETURN_URL){
    window.location.href = window.HUB_RETURN_URL;
  }
}

function finishGame(userExit, timeOver){
  stopTimer(); clearAdvance();
  $("reveal-modal").classList.remove("active");
  $("hint-modal").classList.remove("active");
  $("pause-modal").classList.remove("active");
  $("exit-modal").classList.remove("active");

  const answeredQs = state.correct + state.wrong;
  const duration = Math.round((Date.now()-state.startedAt)/1000);
  const avg = state.responses.length ? +(state.responses.reduce((a,b)=>a+b,0)/state.responses.length).toFixed(1) : 0;
  const accuracy = answeredQs ? Math.round(state.correct/answeredQs*100) : 0;
  const nextDiff = recommendNext();
  const avgSit = state.situationResponses.length ? +(state.situationResponses.reduce((a,b)=>a+b,0)/state.situationResponses.length).toFixed(1) : 0;

  const result = {
    game_mode: state.mode, game_mode_label: MODE_LABEL[state.mode],
    mode: state.mode, mode_label: MODE_LABEL[state.mode],
    cognitive_areas: COGNITIVE_AREAS[state.mode],
    start_difficulty: state.diff, difficulty_label: DIFF_LABEL[state.diff],
    difficulty_source: state.diffSource,
    total_stages: STAGES, questions_per_stage: (Q_PER_STAGE_BY_DIFF[state.diff]||Q_PER_STAGE_BY_DIFF.normal), total_questions: (state.totalQ||state.queue.length),
    answered_questions: answeredQs,
    correct_count: state.correct, wrong_count: state.wrong, accuracy_percent: accuracy,
    avg_response_sec: avg, duration_sec: duration,
    completed: !userExit && !timeOver, ended_by_user: userExit, time_over: timeOver,
    time_limit_sec: GAME_TIME_LIMIT, remaining_time_sec: Math.max(0, state.timerLeft|0),
    exit_reason: userExit ? "user_exit" : (timeOver ? "time_over" : "completed"),
    status: userExit ? "abandoned" : (timeOver ? "time_over" : "completed"),
    app_mode: state.appMode || "standard",
    selected_required_items: state.selectedRequired,
    selected_unnecessary_items: state.selectedUnnecessary,
    removed_mismatched_items: state.removedMismatched,
    wrongly_removed_matched_items: state.wronglyRemovedMatched,
    guessed_situations_count: state.guessedSituations,
    wrong_situation_choices: state.wrongSituationChoices,
    average_situation_response_time_sec: avgSit,
    recommended_next_difficulty: nextDiff,
    recommended_next_difficulty_label: DIFF_LABEL[nextDiff],
    stage_results: state.stageStats.map((s,i)=>{const qps=Q_PER_STAGE_BY_DIFF[state.diff]||Q_PER_STAGE_BY_DIFF.normal; return {stage:i+1, total_questions:qps[i]||0, correct_count:s.c, wrong_count:s.w};}),
    condition_data: state.conditionData || null,
    score_screen_enabled: shouldShowScoreScreen(),
  };
  state.lastResult = result;

  let hero, msg;
  if(timeOver){
    hero = "오늘의 활동 시간이 끝났어요";
    msg = "고생 많으셨어요. 천천히 하나씩 잘 해주셨어요.";
  } else if(userExit){
    hero = "오늘도 함께해주셔서 고맙습니다";
    msg = "참여해주신 것만으로도 충분해요. 다음에 또 만나요.";
  } else {
    hero = "수고하셨어요";
    msg = "오늘의 준비물 미션을 끝까지 잘 마무리하셨어요.";
  }
  const areaText = getGameMode(state.mode).resultText;
  msg = msg + "\n\n" + areaText;
  $("r-hero").textContent = hero;
  $("r-msg").textContent = msg;
  $("r-msg").style.whiteSpace = "pre-line";

  // Mode-specific UI: show 다시 하기 only for standard mode
  const appMode = state.appMode || "standard";
  const againBtn = $("btn-again");
  const returnBtn = $("btn-return");
  if(appMode === "standard"){
    againBtn.style.display = "";
    returnBtn.textContent = "다음";
  } else {
    againBtn.style.display = "none";
    returnBtn.textContent = "허브로 돌아가기";
  }
  switchScreen("screen-result");

  try{
    if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(result)); }
    else { console.log("GAME_RESULT", result); }
  }catch(e){ console.warn(e); }
  sendGameEvent("GAME_COMPLETED", result);
  if((state.appConfig || {}).auto_return_to_hub){
    window.setTimeout(()=>{ returnToHub(); }, 1200);
  }
}

function renderScoreScreen(result){
  const data = result || state.lastResult || {};
  const correct = data.correct_count || 0;
  const wrong = data.wrong_count || 0;
  const accuracy = data.accuracy_percent || 0;
  $("score-correct").textContent = `${correct}문항`;
  $("score-wrong").textContent = `${wrong}문항`;
  $("score-accuracy").textContent = `${accuracy}%`;
  switchScreen("screen-score");
}

$("btn-again").addEventListener("click", ()=>{ startGame(); });
$("btn-return").addEventListener("click", ()=>{
  if((state.appMode || "standard") === "standard"){
    if(shouldShowScoreScreen()){
      renderScoreScreen();
      return;
    }
    startPostGameConditionCheck();
    return;
  }
  returnToHub(); return;
  // Notify host app to return to 효담콜
  sendGameEvent("RETURN_TO_HYODAM_CALL", { app_mode: state.appMode || "standard" });
  try{
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({ type:"RETURN_TO_HYODAM_CALL", app_mode: state.appMode || "standard" }));
    }
  }catch(e){ console.warn(e); }
  // Fallback: reset to start screen
  state.mode=null;
  if((state.appMode||"standard")==="standard"){ state.diff="easy"; state.diffSource="default_easy"; }
  const g = window.USER_DIFFICULTY_GROUP;
  const map = {low:"easy", middle:"normal", high:"hard"};
  if(g && map[g]){ state.diff = map[g]; state.diffSource="profile_based"; }
  switchScreen("screen-start");
});
$("btn-score-next").addEventListener("click", ()=>{
  startPostGameConditionCheck();
});
