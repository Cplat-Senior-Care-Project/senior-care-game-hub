/* ===========================================================
   6. QUESTION LIFECYCLE
   =========================================================== */
let cur = null;

function nextQuestion() {
  if (!state || state._status !== "running") return;
  if (state._idx >= state.plannedRounds) { finishSession(true); return; }
  document.getElementById("board")?.classList.remove("answer-good", "answer-warn");
  const item = state._queue[state._idx];
  cur = {
    questionId: uid(),
    questionType: item.type === "trash" ? "sort_trash" : "feed_animal",
    cognitiveDomain: item.type === "trash" ? "selective_attention" : "semantic_memory",
    itemId: item.id, itemLabel: item.label, itemType: item.type,
    correctTargetId: item.target, selectedTargetId: null,
    attempts: 0, hintUsed: false,
    responseTimeMs: 0, firstReactionMs: 0,
    wrongDropCount: 0, dragFailCount: 0, targetChangeCount: 0,
    inputType: null,
    _t0: performance.now(),
    _firstReacted: false, _picked: null,
  };
  const it = document.getElementById("item");
  const wrap = document.getElementById("itemWrap");
  it.style.backgroundImage = `url('${assetUrl(item.img)}')`;
  it.setAttribute("aria-label", `${item.label} 선택`);
  wrap.dataset.itemType = item.type;
  resetItemPos();
  it.classList.remove("picked", "dragging");
  wrap.classList.add("has-glow");
  document.getElementById("itemLabel").textContent = item.label;
  clearSpotStates();
  renderDots();
  setPrompt(item.type === "trash" ? "어디에 정리할까요?" : "누구에게 줄까요?", item.type === "trash" ? "dark" : null);
  speak(item.label);
  RN({ type:"QUESTION_START", payload: toQuestionStartPayload(cur, item) });
}

function setPrompt(t, kind) {
  const p = document.getElementById("prompt");
  p.textContent = t;
  p.classList.remove("good", "warn", "dark");
  if (kind) p.classList.add(kind);
}

function clearSpotStates() {
  document.getElementById("board")?.classList.remove("answer-good", "answer-warn");
  document.querySelectorAll(".spot, .bin").forEach(s => {
    s.classList.remove("target", "hint", "good", "bad", "soft-guide", "dim", "react-tiger", "react-monkey", "react-squirrel", "react-panda", "react-bin");
    const targetId = s.dataset.target;
    const normalImg = ANIMALS[targetId]?.img;
    const pic = s.querySelector(".pic");
    if (pic && normalImg) pic.style.backgroundImage = `url('${assetUrl(normalImg)}')`;
  });
}

function resetItemPos() {
  const it = document.getElementById("item");
  const wrap = document.getElementById("itemWrap");
  it.style.left = ""; it.style.top = ""; it.style.transform = "";
  wrap.style.left = ""; wrap.style.top = ""; wrap.style.transform = "";
  wrap.style.opacity = "";
  wrap.classList.remove("item-delivered");
}

function burstHearts(spotEl) {
  const board = document.getElementById("board");
  const r = spotEl.getBoundingClientRect(), b = board.getBoundingClientRect();
  const cx = r.left - b.left + r.width / 2;
  const cy = r.top - b.top + r.height * 0.3;
  const emojis = ["💛","✨","💛","🌿","💛"];
  for (let i = 0; i < 5; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.textContent = emojis[i % emojis.length];
    h.style.left = (cx + (Math.random() * 60 - 30)) + "px";
    h.style.top = cy + "px";
    h.style.transform = "translate(-50%, 0)";
    board.appendChild(h);
    setTimeout(() => h.remove(), 1300);
  }
}

/* ===========================================================
   7. INTERACTION — click-to-pick + drag-and-drop
   =========================================================== */
const item = document.getElementById("item");
const board = document.getElementById("board");

function markFirstReaction() {
  if (state?._paused) return;
  if (cur && !cur._firstReacted) {
    cur._firstReacted = true;
    cur.firstReactionMs = Math.round(performance.now() - cur._t0);
  }
}

// Click pick (tap on item highlights all spots; tap a spot resolves)
item.addEventListener("click", e => {
  if (state?._paused) return;
  if (item.classList.contains("dragging")) return;
  markFirstReaction();
  const picked = !item.classList.contains("picked");
  item.classList.toggle("picked", picked);
  document.querySelectorAll(".spot, .bin").forEach(s => s.classList.toggle("target", picked));
  document.getElementById("itemWrap").classList.toggle("has-glow", !picked);
});

board.addEventListener("click", e => {
  if (state?._paused) return;
  const target = e.target.closest(".spot, .bin");
  if (!target) return;
  if (!runtime.useDrag) {
    markFirstReaction();
    resolve(target.dataset.target, target, "touch");
    return;
  }
  if (!item.classList.contains("picked")) return;
  resolve(target.dataset.target, target, "touch");
});

board.addEventListener("keydown", e => {
  if (state?._paused) return;
  if (e.key !== "Enter" && e.key !== " ") return;
  const target = e.target.closest(".spot, .bin");
  if (!target) return;
  e.preventDefault();
  markFirstReaction();
  resolve(target.dataset.target, target, "keyboard");
});

// Drag (pointer events)
let drag = null;
item.addEventListener("pointerdown", e => {
  if (state?._paused) return;
  if (!runtime.useDrag) return;
  item.setPointerCapture(e.pointerId);
  const r = item.getBoundingClientRect();
  drag = { x:e.clientX, y:e.clientY, ox:r.left, oy:r.top, w:r.width, h:r.height, moved:false };
  item.classList.add("dragging");
  markFirstReaction();
});

item.addEventListener("pointermove", e => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
  item.style.transform = `translate(${dx}px, ${dy}px)`;
  const target = spotAt(e.clientX, e.clientY);
  document.querySelectorAll(".spot, .bin").forEach(s => s.classList.toggle("target", s === target));
});

item.addEventListener("pointerup", e => {
  if (!drag) return;
  const moved = drag.moved;
  item.classList.remove("dragging");
  const target = spotAt(e.clientX, e.clientY);
  drag = null;
  if (!moved) return;
  if (target) resolve(target.dataset.target, target, "drag");
  else { cur.dragFailCount++; snapBack(); }
});

item.addEventListener("pointercancel", () => {
  drag = null;
  item.classList.remove("dragging");
  snapBack();
});

function spotAt(x, y) {
  const els = document.elementsFromPoint(x, y);
  const direct = els.find(el => el.classList && (el.classList.contains("spot") || el.classList.contains("bin")));
  if (direct) return direct;

  let nearest = null;
  let nearestDistance = Infinity;
  document.querySelectorAll(".spot, .bin").forEach(el => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const radius = Math.max(r.width, r.height) * (runtime.useDrag ? 0.62 : 0.5);
    if (distance <= radius && distance < nearestDistance) {
      nearest = el;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function snapBack() {
  item.style.left = ""; item.style.top = ""; item.style.transform = "";
  document.querySelectorAll(".spot, .bin").forEach(s => s.classList.remove("target"));
}

function resolve(targetId, spotEl, inputType = "touch") {
  if (!cur || !state || state._status !== "running" || state._paused) return;
  state._interactionCount++;
  cur.attempts++;
  cur.inputType = inputType;
  if (cur._picked && cur._picked !== targetId) cur.targetChangeCount++;
  cur._picked = targetId;
  item.classList.remove("picked");
  document.getElementById("itemWrap").classList.remove("has-glow");

  if (targetId === cur.correctTargetId) {
    document.getElementById("board")?.classList.remove("answer-warn");
    document.getElementById("board")?.classList.add("answer-good");
    cur.selectedTargetId = targetId;
    cur.responseTimeMs = Math.round(performance.now() - cur._t0);
    spotEl.classList.add("good", `react-${targetId}`);
    const correctImg = ANIMALS[targetId]?.correctImg;
    const pic = spotEl.querySelector(".pic");
    if (pic && correctImg) pic.style.backgroundImage = `url('${assetUrl(correctImg)}')`;
    // set a random cheer for THIS round
    const bub = spotEl.querySelector(".bubble");
    if (bub) bub.textContent = pickCheer(targetId);
    // dim the other animals
    document.querySelectorAll(".spot").forEach(s => {
      if (s !== spotEl) s.classList.add("dim");
    });
    burstHearts(spotEl);
    dingHappy();
    updateEnergy(targetId);
    const animal = ANIMALS[targetId];
    const msg = runtime.softFeedback
      ? (targetId === "bin" ? "좋아요. 정리했어요." : "좋아요. 잘 보셨어요.")
      : (targetId === "bin" ? "정리 구역에 잘 보냈어요" : `${animal.label}가 좋아해요`);
    setPrompt(msg, "good");
    speak(msg);
    document.getElementById("itemWrap").classList.add("item-delivered");
    state.correctCount++;
    finishQuestion();
  } else {
    document.getElementById("board")?.classList.remove("answer-good");
    document.getElementById("board")?.classList.add("answer-warn");
    cur.wrongDropCount++;
    spotEl.classList.add("bad");
    dingSoft();
    setTimeout(() => spotEl.classList.remove("bad"), 600);
    snapBack();
    if (runtime.hintEnabled && runtime.autoHintEnabled && cur.attempts >= 2 && !cur.hintUsed) {
      cur.hintUsed = true;
      const h = document.querySelector(`.spot[data-target="${cur.correctTargetId}"], .bin[data-target="${cur.correctTargetId}"]`);
      if (h) h.classList.add("hint", "soft-guide");
      const msg = runtime.softFeedback ? "조금 헷갈릴 수 있어요. 제가 힌트를 드릴게요." : "이 친구가 좋아할 것 같아요";
      setPrompt(msg, "warn");
      speak(msg);
    } else {
      const h = document.querySelector(`.spot[data-target="${cur.correctTargetId}"], .bin[data-target="${cur.correctTargetId}"]`);
      if (h) h.classList.add("soft-guide");
      const msg = runtime.softFeedback ? "괜찮아요. 천천히 다시 같이 볼까요?" : "다시 한 번 살펴볼까요?";
      setPrompt(msg, "warn");
      speak(msg);
    }
  }
}

function finishQuestion() {
  const { _t0, _firstReacted, _picked, ...result } = cur;
  result.questionIndex = state._idx + 1;
  state._results.push(result);
  state.completedRounds++;
  RN({ type:"QUESTION_RESULT", payload: { ...result, question_log: toQuestionLog(result) } });
  state._idx++;
  setTimeout(() => {
    clearSpotStates();
    nextQuestion();
  }, 1100);
}

/* ===========================================================
   8. QUIT / HELP
   =========================================================== */
const quitModal = document.getElementById("quitModal");
function quitCopy() {
  if (runtime.mode === "care") return ["농장 벤치에서 쉬어 갈까요?", "여기까지도 충분해요.<br/>천천히 쉬어도 좋아요."];
  if (runtime.mode === "ai_assisted") return ["잠깐 쉬고 대화로 돌아갈까요?", "활동은 여기까지 해도 괜찮아요.<br/>준비되면 대화로 돌아가요."];
  if (runtime.mode === "reminder") return ["오늘 활동을 마칠까요?", "짧게 잘 참여했어요.<br/>이제 효담콜로 돌아갈 수 있어요."];
  return ["농장 벤치에서 쉬어 갈까요?", "여기까지도 충분해요.<br/>잠시 쉬고 다시 와도 좋아요."];
}
document.getElementById("quitBtn").addEventListener("click", () => {
  const [title, message] = quitCopy();
  document.getElementById("quitTitle").textContent = title;
  document.getElementById("quitMessage").innerHTML = message;
  quitModal.classList.add("on");
});
document.getElementById("contBtn").addEventListener("click", () => quitModal.classList.remove("on"));
document.getElementById("stopBtn").addEventListener("click", () => {
  quitModal.classList.remove("on");
  finishSession(false, "user_quit");
});

document.getElementById("helpBtn").addEventListener("click", () => {
  if (!cur || !runtime.hintEnabled || !runtime.showHelp) return;
  state._helpOpenCount++;
  cur.hintUsed = true;
  const h = document.querySelector(`.spot[data-target="${cur.correctTargetId}"], .bin[data-target="${cur.correctTargetId}"]`);
  if (h) h.classList.add("hint");
  const targetLabel = ANIMALS[cur.correctTargetId]?.label || "반짝이는 곳";
  const msg = runtime.softFeedback
    ? `괜찮아요. 반짝이는 ${targetLabel}을 봐주세요.`
    : `반짝이는 ${targetLabel}에게 보내요`;
  setPrompt(msg, "warn");
  speak(msg);
  RN({
    type: "HELP_USED",
    payload: {
      session_id: state.sessionId,
      content_id: state.contentId,
      game_key: state.gameKey,
      question_id: cur.questionId,
      question_index: state._idx + 1,
    },
  });
});
