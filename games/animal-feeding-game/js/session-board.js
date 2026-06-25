/* ===========================================================
   4. SESSION + QUEUE
   =========================================================== */
let sessionTimerInterval = null;

function shuffleItems(items) {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const HARD_ONLY_TRASH_ITEM_IDS = new Set(["patjuk", "talisman"]);

function trashItemsForDifficulty(diff) {
  return FOODS.filter(f =>
    f.type === "trash" &&
    (diff === "hard" || !HARD_ONLY_TRASH_ITEM_IDS.has(f.id))
  );
}

function randomTrashSlots(totalRounds, trashCount) {
  const total = Math.max(0, totalRounds);
  const count = Math.max(0, Math.min(trashCount, total));
  if (!count) return new Set();

  const preferredSlots = Array.from(
    { length: Math.max(0, total - 2) },
    (_, i) => i + 1
  );
  const fallbackSlots = Array.from({ length: total }, (_, i) => i);
  const slots = preferredSlots.length >= count ? preferredSlots : fallbackSlots;
  const selected = [];

  shuffleItems(slots).forEach(slot => {
    if (selected.length >= count) return;
    if (selected.some(existing => Math.abs(existing - slot) <= 1)) return;
    selected.push(slot);
  });

  if (selected.length < count) {
    shuffleItems(slots)
      .filter(slot => !selected.includes(slot))
      .forEach(slot => {
        if (selected.length < count) selected.push(slot);
      });
  }

  return new Set(selected);
}

function buildQueue(d) {
  const foodItems  = FOODS.filter(f => f.type === "food"  && d.animals.includes(f.target));
  const trashItems = trashItemsForDifficulty(d.difficulty);
  const trashCount = trashItems.length ? d.trash : 0;
  const nFood = d.rounds - trashCount;

  const qs = [];
  const usedFoodIds = new Set();
  const foodTargets = shuffleItems(d.animals.filter(id => foodItems.some(f => f.target === id)));

  foodTargets.forEach(targetId => {
    if (qs.length >= nFood) return;
    const candidates = shuffleItems(foodItems.filter(f => f.target === targetId && !usedFoodIds.has(f.id)));
    const next = candidates[0] || foodItems.find(f => f.target === targetId);
    if (!next) return;
    qs.push(next);
    usedFoodIds.add(next.id);
  });

  let foods = shuffleItems(foodItems.filter(f => !usedFoodIds.has(f.id)));
  while (qs.length < nFood && foodItems.length) {
    if (!foods.length) foods = shuffleItems(foodItems);
    const last = qs[qs.length - 1];
    let nextIndex = foods.findIndex(f => !last || f.target !== last.target);
    if (nextIndex < 0) nextIndex = 0;
    const [next] = foods.splice(nextIndex, 1);
    qs.push(next);
  }

  if (trashCount > 0) {
    const trashQueue = shuffleItems(Array.from(
      { length: trashCount },
      (_, i) => trashItems[i % trashItems.length]
    ));
    const trashSlots = randomTrashSlots(d.rounds, trashCount);
    const merged = [];
    let foodIndex = 0;
    let trashIndex = 0;

    for (let i = 0; i < d.rounds; i++) {
      if (trashSlots.has(i)) merged.push(trashQueue[trashIndex++]);
      else merged.push(qs[foodIndex++]);
    }

    qs.length = 0;
    qs.push(...merged.filter(Boolean));
  }

  // Avoid consecutive same target, especially trash-to-trash.
  for (let attempt = 0; attempt < 10; attempt++) {
    let fixed = false;
    for (let i = 1; i < qs.length; i++) {
      if (qs[i].target !== qs[i-1].target) continue;
      for (let j = i + 1; j < qs.length; j++) {
        const okSwapPrev = qs[i-1].target !== qs[j].target;
        const okSwapNext = (j+1 >= qs.length) || qs[j+1].target !== qs[i].target;
        if (okSwapPrev && okSwapNext) {
          [qs[i], qs[j]] = [qs[j], qs[i]];
          fixed = true; break;
        }
      }
    }
    if (!fixed) break;
  }
  return qs;
}

function sessionSettings(diff) {
  const base = DIFFS[diff] || DIFFS.easy;
  const requestedAnimals = runtime.targetAnimals || [];
  const requestedCount = requestedAnimals.length && runtime.animalCountSource !== "config"
    ? requestedAnimals.length
    : (runtime.animalCount || base.animals.length);
  const animalCount = Math.max(1, Math.min(ANIMAL_POOL.length, requestedCount));
  const fixedTargets = [...new Set(requestedAnimals)];
  const effectiveCount = Math.max(animalCount, fixedTargets.length);
  const animals = pickSessionAnimals(effectiveCount, fixedTargets);
  const rounds = runtime.questionCount || base.rounds;
  const trash = runtime.trashCount >= 0 ? runtime.trashCount : base.trash;
  const normalizedRounds = Math.max(1, rounds);
  const eligibleTrashItems = trashItemsForDifficulty(diff);
  const normalizedTrash = eligibleTrashItems.length ? trash : 0;
  return {
    difficulty: diff,
    animals,
    rounds: normalizedRounds,
    trash: Math.max(0, Math.min(normalizedTrash, Math.max(0, normalizedRounds - 1))),
  };
}

function renderReadyFriends(animalIds) {
  const readyFriends = document.getElementById("readyFriends");
  if (!readyFriends) return;
  readyFriends.innerHTML = "";
  animalIds.forEach(id => {
    const animal = ANIMALS[id];
    if (!animal) return;
    const img = document.createElement("img");
    img.src = assetUrl(animal.img);
    img.alt = "";
    readyFriends.appendChild(img);
  });
}

function prepareSessionPreview(diff) {
  const settings = sessionSettings(diff);
  pendingSessionSettings = { diff, settings };
  renderReadyFriends(settings.animals);
  return settings;
}

function sessionPayload() {
  const { _t0, _queue, _idx, _results, _animals, _trashCount, _energy, _foodPerAnimal, _timer, ...r } = state;
  return {
    ...r,
    total_questions: r.plannedRounds,
    animal_count: _animals.length,
    target_animals: _animals,
    trash_count: _trashCount,
    choice_count: _animals.length,
  };
}

function shouldDisplaySessionTimer() {
  return !!(
    state &&
    state._status === "running" &&
    runtime.showTimer &&
    runtime.timeLimitMs > 0 &&
    (runtime.mode === "standard" || runtime.mode === "reminder")
  );
}

function getSessionActiveElapsedMs(now = performance.now()) {
  if (!state) return 0;
  if (!state._timer) return Math.max(0, now - state._t0);
  const pausedNow = state._timer.pauseStartedAt ? now - state._timer.pauseStartedAt : 0;
  return Math.max(0, now - state._timer.startedAt - state._timer.pausedMs - pausedNow);
}

function updateSessionTimerGauge() {
  const play = document.getElementById("play");
  const gauge = document.getElementById("timerGauge");
  const fill = document.getElementById("timerGaugeFill");
  const limit = Math.max(0, Number(state?._timer?.timeLimitMs || runtime.timeLimitMs || DEFAULT_TIME_LIMIT_MS) || 0);
  const elapsed = state ? getSessionActiveElapsedMs() : 0;
  const remaining = limit > 0 ? Math.max(0, limit - elapsed) : 0;
  const ratio = limit > 0 ? remaining / limit : 0;
  const visible = shouldDisplaySessionTimer();

  play?.classList.toggle("show-timer", visible);
  if (fill) fill.style.transform = `scaleX(${ratio})`;
  if (gauge) {
    gauge.setAttribute("aria-valuemax", String(Math.ceil(limit / 1000)));
    gauge.setAttribute("aria-valuenow", String(Math.ceil(remaining / 1000)));
    gauge.classList.toggle("is-warning", remaining <= 30000 && remaining > 10000);
    gauge.classList.toggle("is-critical", remaining <= 10000);
  }
  return remaining;
}

function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
  updateSessionTimerGauge();
}

function tickSessionTimer() {
  if (!state || state._status !== "running") {
    stopSessionTimer();
    return;
  }
  const remaining = updateSessionTimerGauge();
  if (state._paused) return;
  if (remaining <= 0 && state._timer && !state._timer.timedOut) {
    state._timer.timedOut = true;
    state.timedOut = true;
    finishSession(false, "time_limit");
  }
}

function startSessionTimer() {
  stopSessionTimer();
  if (!state) return;
  const timeLimitMs = Math.max(0, Number(state.timeLimitMs || runtime.timeLimitMs || DEFAULT_TIME_LIMIT_MS) || 0);
  state.timeLimitMs = timeLimitMs;
  state._timer = {
    timeLimitMs,
    startedAt: performance.now(),
    pausedMs: 0,
    pauseStartedAt: null,
    timedOut: false,
  };
  updateSessionTimerGauge();
  if (timeLimitMs > 0) {
    sessionTimerInterval = setInterval(tickSessionTimer, 250);
  }
}

function pauseSessionTimer() {
  if (!state?._timer || state._timer.pauseStartedAt) return;
  state._timer.pauseStartedAt = performance.now();
  updateSessionTimerGauge();
}

function resumeSessionTimer() {
  if (!state?._timer || !state._timer.pauseStartedAt) return;
  state._timer.pausedMs += performance.now() - state._timer.pauseStartedAt;
  state._timer.pauseStartedAt = null;
  updateSessionTimerGauge();
}

function startSession(diff) {
  clearPauseUiState({ resetState: true });
  const prepared = pendingSessionSettings && pendingSessionSettings.diff === diff
    ? pendingSessionSettings.settings
    : null;
  const d = prepared || sessionSettings(diff);
  pendingSessionSettings = null;
  state = {
    sessionId: runtime.sessionId || uid(),
    seniorId: getRuntimeSeniorId(runtime),
    userId: runtime.userId || null,
    anonymousUserId: runtime.anonymousUserId || null,
    guardianId: runtime.guardianId || null,
    assignmentId: runtime.assignmentId || null,
    alarmId: runtime.alarmId || null,
    scheduleId: runtime.scheduleId || null,
    tenantId: runtime.tenantId || null,
    facilityId: runtime.facilityId || null,
    programId: runtime.programId || null,
    rewardId: runtime.rewardId || null,
    recommendationId: runtime.recommendationId || null,
    contentId: runtime.contentId,
    gameKey: runtime.gameKey,
    gameId: GAME_ID,
    version: runtime.gameVersion || VERSION,
    gameVersion: runtime.gameVersion || VERSION,
    playSource: normalizePlaySourceForApi(runtime.playSource, runtime.mode),
    clientContext: createClientContext(runtime),
    voiceContext: createVoiceContext(runtime),
    meta: runtime.meta || null,
    mode: runtime.mode,
    configSnapshot: runtime.configSnapshot || runtimeSnapshot(),
    preConditionCheck: preGameCheck?.completed ? { ...preGameCheck } : null,
    userAlias: cfg.userAlias,
    difficulty: diff,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: 0,
    timeLimitMs: Math.max(0, Number(runtime.timeLimitMs || DEFAULT_TIME_LIMIT_MS) || 0),
    timedOut: false,
    completed: false,
    aborted: false,
    plannedRounds: d.rounds,
    completedRounds: 0,
    correctCount: 0,
    _t0: performance.now(),
    _animals: d.animals,
    _trashCount: d.trash,
    _queue: buildQueue(d),
    _idx: 0,
    _results: [],
    _energy: Object.fromEntries(d.animals.map(a => [a, 0])),
    _interactionCount: 0,
    _pauseCount: 0,
    _helpOpenCount: 0,
    _paused: false,
    _abandonReason: null,
    _errorCode: null,
    _errorMessage: null,
    _errorPhase: null,
    _status: "running",
  };
  RN({ type:"SESSION_START", payload: sessionPayload() });
  buildBoard();
  renderDots();
  nextQuestion();
  show("play");
  startSessionTimer();
}

/* ===========================================================
   5. BOARD BUILDING
   =========================================================== */
function buildBoard() {
  const board = document.getElementById("board");
  board.querySelectorAll(".spot").forEach(n => n.remove());
  // remove old bin too (we re-create)
  const existingBin = board.querySelector(".bin");
  if (existingBin) existingBin.remove();
  board.classList.remove("animals-2", "animals-3", "animals-4", "has-bin", "no-bin");
  board.classList.add(`animals-${state._animals.length}`, "no-bin");

  const positions = SLOT_POS[state._animals.length];
  // expected fills per animal for energy bar
  const foodCount = state.plannedRounds - state._trashCount;
  state._foodPerAnimal = Math.max(1, Math.ceil(foodCount / state._animals.length));

  state._animals.forEach((a, i) => {
    const A = ANIMALS[a];
    const el = document.createElement("div");
    el.className = "spot " + positions[i];
    el.dataset.target = a;
    if (A.baseImg) el.style.setProperty("--spot-base-image", `url("${new URL(assetUrl(A.baseImg), window.location.href).href}")`);
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `${A.label} 선택`);
    el.innerHTML = `
      <div class="bubble"></div>
      <div class="hint-arrow">
        <svg width="30" height="40" viewBox="0 0 30 40">
          <path d="M15 4 L15 28 M6 20 L15 32 L24 20"
            stroke="#C28A4E" stroke-width="4" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="pic" style="background-image:url('${assetUrl(A.img)}')"></div>
      <div class="name">${A.label}</div>
      <div class="energy"><span></span></div>
    `;
    board.appendChild(el);
  });
}

function renderDots() {
  const dots = document.getElementById("dots");
  const fill = document.getElementById("progressGaugeFill");
  if (!dots || !fill) return;

  const total = Math.max(1, Number(state?.plannedRounds || 0));
  const current = Math.min(total, Math.max(1, Number(state?._idx || 0) + 1));
  dots.setAttribute("aria-valuemax", String(total));
  dots.setAttribute("aria-valuenow", String(current));
  fill.style.transform = `scaleX(${current / total})`;
}

function updateEnergy(targetId) {
  const spot = document.querySelector(`.spot[data-target="${targetId}"], .bin[data-target="${targetId}"]`);
  if (!spot) return;
  const bar = spot.querySelector(".energy>span");
  if (!bar) return;
  const cap = targetId === "bin" ? state._trashCount : state._foodPerAnimal;
  const cur = state._energy[targetId] = (state._energy[targetId] || 0) + 1;
  bar.style.width = Math.min(100, (cur / cap) * 100) + "%";
}
