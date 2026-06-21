/* ===========================================================
   4. SESSION + QUEUE
   =========================================================== */
function shuffleItems(items) {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildQueue(d) {
  const foodItems  = FOODS.filter(f => f.type === "food"  && d.animals.includes(f.target));
  const trashItems = FOODS.filter(f => f.type === "trash");
  const nFood = d.rounds - d.trash;

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

  for (let i = 0; i < d.trash; i++) {
    const trash = trashItems[i % trashItems.length];
    const desired = Math.round(((i + 1) * d.rounds) / (d.trash + 1));
    const min = Math.min(2, qs.length);
    const max = Math.max(min, qs.length - 1);
    const at = Math.max(min, Math.min(max, desired - 1));
    qs.splice(at, 0, trash);
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
  return {
    animals,
    rounds: Math.max(1, rounds),
    trash: Math.max(0, Math.min(trash, Math.max(0, rounds - 1))),
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
  const { _t0, _queue, _idx, _results, _animals, _trashCount, _energy, _foodPerAnimal, ...r } = state;
  return {
    ...r,
    total_questions: r.plannedRounds,
    animal_count: _animals.length,
    target_animals: _animals,
    trash_count: _trashCount,
    choice_count: _animals.length + (_trashCount > 0 ? 1 : 0),
  };
}

function startSession(diff) {
  const prepared = pendingSessionSettings && pendingSessionSettings.diff === diff
    ? pendingSessionSettings.settings
    : null;
  const d = prepared || sessionSettings(diff);
  pendingSessionSettings = null;
  state = {
    sessionId: runtime.sessionId || uid(),
    contentId: runtime.contentId,
    gameKey: runtime.gameKey,
    gameId: GAME_ID,
    version: VERSION,
    mode: runtime.mode,
    configSnapshot: runtime.configSnapshot || runtimeSnapshot(),
    preConditionCheck: preGameCheck?.completed ? { ...preGameCheck } : null,
    userAlias: cfg.userAlias,
    difficulty: diff,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMs: 0,
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
    _energy: Object.fromEntries([...d.animals, "bin"].map(a => [a, 0])),
    _interactionCount: 0,
    _pauseCount: 0,
    _helpOpenCount: 0,
    _paused: false,
    _abandonReason: null,
    _errorCode: null,
    _errorMessage: null,
    _status: "running",
  };
  RN({ type:"SESSION_START", payload: sessionPayload() });
  buildBoard();
  renderDots();
  nextQuestion();
  show("play");
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
  board.classList.add(`animals-${state._animals.length}`, state._trashCount > 0 ? "has-bin" : "no-bin");

  const positions = SLOT_POS[state._animals.length];
  // expected fills per animal for energy bar
  const foodCount = state.plannedRounds - state._trashCount;
  state._foodPerAnimal = Math.max(1, Math.ceil(foodCount / state._animals.length));

  state._animals.forEach((a, i) => {
    const A = ANIMALS[a];
    const el = document.createElement("div");
    el.className = "spot " + positions[i];
    el.dataset.target = a;
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

  if (state._trashCount > 0) {
    const bin = document.createElement("div");
    bin.className = "bin";
    bin.dataset.target = "bin";
    bin.setAttribute("role", "button");
    bin.setAttribute("tabindex", "0");
    bin.setAttribute("aria-label", `${ANIMALS.bin.label} 선택`);
    bin.innerHTML = `
      <div class="zone-kicker">정리 구역</div>
      <div class="pic" style="background-image:url('${assetUrl(ANIMALS.bin.img)}')"></div>
      <div class="name">${ANIMALS.bin.label}</div>
    `;
    board.appendChild(bin);
  }
}

function renderDots() {
  const dots = document.getElementById("dots");
  dots.innerHTML = "";
  for (let i = 0; i < state.plannedRounds; i++) {
    const d = document.createElement("i");
    if (i < state._idx) d.classList.add("done", "leaf");
    else if (i === state._idx) d.classList.add("cur", "sprout");
    else d.classList.add("seed");
    dots.appendChild(d);
  }
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
