/* ===========================================================
   6. QUESTION LIFECYCLE
   =========================================================== */
let cur = null;
const MAX_WRONG_ATTEMPTS = 3;
const ANSWER_REVEAL_DELAY_MS = 1600;
const NO_TARGET_ID = "no_target";
const NO_TARGET_LABEL = "아무에게도 주지 않음";
const NO_TARGET_AUTO_CORRECT_MS = 2000;
let noTargetAutoCorrectTimer = null;

function isNoTargetQuestion() {
  return !!cur && cur.itemType === "trash" && cur.correctTargetId === NO_TARGET_ID;
}

function correctTargetLabel() {
  if (!cur) return "정답 위치";
  if (cur.correctTargetId === NO_TARGET_ID) return NO_TARGET_LABEL;
  return ANIMALS[cur.correctTargetId]?.label || "정답 위치";
}

function clearNoTargetAutoCorrect() {
  if (noTargetAutoCorrectTimer) {
    clearTimeout(noTargetAutoCorrectTimer);
    noTargetAutoCorrectTimer = null;
  }
  clearNoTargetWaitGauge();
}

function clearNoTargetWaitGauge() {
  const wrap = document.getElementById("itemWrap");
  const gauge = document.getElementById("itemWaitGauge");
  const fill = document.getElementById("itemWaitGaugeFill");
  wrap?.classList.remove("waiting-auto-correct");
  if (fill) {
    fill.style.animation = "none";
    fill.style.transform = "scaleX(0)";
    void fill.offsetWidth;
    fill.style.animation = "";
  }
  gauge?.setAttribute("aria-valuenow", "0");
}

function startNoTargetWaitGauge() {
  const wrap = document.getElementById("itemWrap");
  const gauge = document.getElementById("itemWaitGauge");
  const fill = document.getElementById("itemWaitGaugeFill");
  if (!wrap || !gauge || !fill) return;
  clearNoTargetWaitGauge();
  wrap.style.setProperty("--item-wait-duration", `${NO_TARGET_AUTO_CORRECT_MS}ms`);
  gauge.setAttribute("aria-valuemax", String(Math.ceil(NO_TARGET_AUTO_CORRECT_MS / 1000)));
  gauge.setAttribute("aria-valuetext", "정답 처리 대기 중");
  wrap.classList.add("waiting-auto-correct");
}

function scheduleNoTargetAutoCorrect() {
  clearNoTargetAutoCorrect();
  if (!isNoTargetQuestion() || cur._locked) return;
  noTargetAutoCorrectTimer = setTimeout(autoCorrectNoTargetQuestion, NO_TARGET_AUTO_CORRECT_MS);
  startNoTargetWaitGauge();
}

function autoCorrectNoTargetQuestion() {
  noTargetAutoCorrectTimer = null;
  clearNoTargetWaitGauge();
  if (!isNoTargetQuestion() || !state || state._status !== "running" || cur._locked) return;
  if (state._paused) {
    scheduleNoTargetAutoCorrect();
    return;
  }

  cur._locked = true;
  cur.selectedTargetId = NO_TARGET_ID;
  if (!cur.externalAnswer) cur.inputType = "idle";
  else cur.inputType = cur.inputType || "idle";
  cur.responseTimeMs = Math.round(performance.now() - cur._t0);
  document.getElementById("board")?.classList.remove("answer-warn");
  document.getElementById("board")?.classList.add("answer-good");
  clearTargetHighlights();
  document.querySelectorAll(".spot").forEach(s => s.classList.add("dim"));
  document.getElementById("itemWrap").classList.add("item-delivered");
  dingHappy();
  setPrompt("좋아요. 아무에게도 주지 않고 잘 두었어요.", "good");
  playVoiceGuide("wellDone", "좋아요. 아무에게도 주지 않고 잘 두었어요.");
  state.correctCount++;
  finishQuestion();
}

function nextQuestion() {
  if (!state || state._status !== "running") return;
  if (state._idx >= state.plannedRounds) { finishSession(true); return; }
  clearNoTargetAutoCorrect();
  document.getElementById("board")?.classList.remove("answer-good", "answer-warn");
  const item = state._queue[state._idx];
  const noTarget = item.type === "trash";
  cur = {
    questionId: uid(),
    questionType: noTarget ? "leave_item" : "feed_animal",
    cognitiveDomain: item.type === "trash" ? "selective_attention" : "semantic_memory",
    itemId: item.id, itemLabel: item.label, itemType: item.type,
    correctTargetId: noTarget ? NO_TARGET_ID : item.target, selectedTargetId: null,
    attempts: 0, hintUsed: false,
    responseTimeMs: 0, firstReactionMs: 0,
    wrongDropCount: 0, dragFailCount: 0, targetChangeCount: 0,
    inputType: null,
    answerRevealed: false, forcedAdvanceReason: null,
    _t0: performance.now(),
    _firstReacted: false, _picked: null, _locked: false,
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
  const promptText = item.type === "trash" ? "아무에게도 주지 말고 그대로 두세요." : "누구에게 줄까요?";
  setPrompt(promptText, item.type === "trash" ? "dark" : null);
  if (item.type === "trash") playVoiceGuide("whereToCleanup", promptText);
  else playVoiceGuide("whoToFeed", promptText);
  RN({ type:"QUESTION_START", payload: toQuestionStartPayload(cur, item) });
  if (noTarget) scheduleNoTargetAutoCorrect();
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

function clearTargetHighlights() {
  document.querySelectorAll(".spot, .bin").forEach(s => s.classList.remove("target"));
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
  if (isNoTargetQuestion()) scheduleNoTargetAutoCorrect();
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
  if (isNoTargetQuestion()) clearNoTargetAutoCorrect();
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
  if (!moved) {
    if (isNoTargetQuestion()) scheduleNoTargetAutoCorrect();
    return;
  }
  if (target) resolve(target.dataset.target, target, "drag");
  else {
    cur.dragFailCount++;
    snapBack();
    if (isNoTargetQuestion()) scheduleNoTargetAutoCorrect();
  }
});

item.addEventListener("pointercancel", () => {
  drag = null;
  item.classList.remove("dragging");
  snapBack();
  if (isNoTargetQuestion()) scheduleNoTargetAutoCorrect();
});

function rectFromDomRect(r) {
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

function insetRect(r, xRatio, yRatio) {
  const dx = r.width * xRatio;
  const dy = r.height * yRatio;
  return {
    left: r.left + dx,
    top: r.top + dy,
    right: r.right - dx,
    bottom: r.bottom - dy,
    width: Math.max(0, r.width - dx * 2),
    height: Math.max(0, r.height - dy * 2),
  };
}

function expandRect(r, xRatio, yRatio) {
  const dx = r.width * xRatio;
  const dy = r.height * yRatio;
  return {
    left: r.left - dx,
    top: r.top - dy,
    right: r.right + dx,
    bottom: r.bottom + dy,
    width: r.width + dx * 2,
    height: r.height + dy * 2,
  };
}

function overlapArea(a, b) {
  const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
  const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  return x * y;
}

function targetHitRect(el) {
  const pic = el.querySelector(".pic");
  const source = el.classList.contains("spot") && pic ? pic : el;
  const r = rectFromDomRect(source.getBoundingClientRect());
  return expandRect(r, el.classList.contains("spot") ? 0.12 : 0.04, el.classList.contains("spot") ? 0.08 : 0.04);
}

function spotFromItemOverlap() {
  if (!drag) return null;
  const itemRect = insetRect(rectFromDomRect(item.getBoundingClientRect()), 0.18, 0.16);
  let best = null;
  let bestArea = 0;
  document.querySelectorAll(".spot, .bin").forEach(el => {
    const area = overlapArea(itemRect, targetHitRect(el));
    if (area > bestArea) {
      best = el;
      bestArea = area;
    }
  });
  return best;
}

function spotAt(x, y) {
  const overlapped = spotFromItemOverlap();
  if (overlapped) return overlapped;

  const els = document.elementsFromPoint(x, y);
  const direct = els
    .map(el => el.closest?.(".spot, .bin"))
    .find(Boolean);
  if (direct) return direct;

  let nearest = null;
  let nearestDistance = Infinity;
  document.querySelectorAll(".spot, .bin").forEach(el => {
    const r = targetHitRect(el);
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
  clearTargetHighlights();
}

function showCorrectAnswer() {
  if (!cur) return;
  const targetId = cur.correctTargetId;
  const correctEl = document.querySelector(`.spot[data-target="${targetId}"], .bin[data-target="${targetId}"]`);
  if (!correctEl) return;

  correctEl.classList.add("hint", "soft-guide", "good", `react-${targetId}`);
  const correctImg = ANIMALS[targetId]?.correctImg;
  const pic = correctEl.querySelector(".pic");
  if (pic && correctImg) pic.style.backgroundImage = `url('${assetUrl(correctImg)}')`;
  const bub = correctEl.querySelector(".bubble");
  if (bub) bub.textContent = "정답";
  document.querySelectorAll(".spot, .bin").forEach(s => {
    if (s !== correctEl) s.classList.add("dim");
  });
}

function resolve(targetId, spotEl, inputType = "touch") {
  if (!cur || !state || state._status !== "running" || state._paused || cur._locked) return;
  clearNoTargetAutoCorrect();
  state._interactionCount++;
  cur.attempts++;
  cur.inputType = inputType;
  if (cur._picked && cur._picked !== targetId) cur.targetChangeCount++;
  cur._picked = targetId;
  item.classList.remove("picked");
  document.getElementById("itemWrap").classList.remove("has-glow");

  if (targetId === cur.correctTargetId) {
    cur._locked = true;
    document.getElementById("board")?.classList.remove("answer-warn");
    document.getElementById("board")?.classList.add("answer-good");
    clearTargetHighlights();
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
    playVoiceGuide("wellDone", msg);
    document.getElementById("itemWrap").classList.add("item-delivered");
    state.correctCount++;
    finishQuestion();
  } else {
    document.getElementById("board")?.classList.remove("answer-good");
    document.getElementById("board")?.classList.add("answer-warn");
    cur.selectedTargetId = targetId;
    cur.wrongDropCount++;
    spotEl.classList.add("bad");
    dingSoft();
    setTimeout(() => spotEl.classList.remove("bad"), 600);
    snapBack();
    if (cur.wrongDropCount >= MAX_WRONG_ATTEMPTS) {
      cur._locked = true;
      cur.answerRevealed = true;
      cur.forcedAdvanceReason = "max_wrong_attempts";
      cur.responseTimeMs = Math.round(performance.now() - cur._t0);
      showCorrectAnswer();
      const msg = isNoTargetQuestion()
        ? "아무에게도 주지 않는 것이 정답이에요. 다음 문제로 넘어갈게요."
        : `정답은 ${correctTargetLabel()}이에요. 다음 문제로 넘어갈게요.`;
      setPrompt(msg, "warn");
      playVoiceGuide("hint", msg);
      finishQuestion(ANSWER_REVEAL_DELAY_MS);
      return;
    }
    if (isNoTargetQuestion()) {
      const msg = "아무에게도 주지 말고 그대로 두세요.";
      setPrompt(msg, "warn");
      playVoiceGuide("tryAgain", msg);
      scheduleNoTargetAutoCorrect();
      return;
    }
    if (runtime.hintEnabled && runtime.autoHintEnabled && cur.attempts >= 2 && !cur.hintUsed) {
      cur.hintUsed = true;
      const h = document.querySelector(`.spot[data-target="${cur.correctTargetId}"], .bin[data-target="${cur.correctTargetId}"]`);
      if (h) h.classList.add("hint", "soft-guide");
      const msg = runtime.softFeedback ? "조금 헷갈릴 수 있어요. 제가 힌트를 드릴게요." : "이 친구가 좋아할 것 같아요";
      setPrompt(msg, "warn");
      playVoiceGuide("hint", msg);
    } else {
      const h = document.querySelector(`.spot[data-target="${cur.correctTargetId}"], .bin[data-target="${cur.correctTargetId}"]`);
      if (h) h.classList.add("soft-guide");
      const msg = runtime.softFeedback ? "괜찮아요. 천천히 다시 같이 볼까요?" : "다시 한 번 살펴볼까요?";
      setPrompt(msg, "warn");
      playVoiceGuide("tryAgain", msg);
    }
  }
}

function finishQuestion(nextDelayMs = 1100) {
  clearNoTargetAutoCorrect();
  const { _t0, _firstReacted, _picked, _locked, ...result } = cur;
  result.questionIndex = state._idx + 1;
  state._results.push(result);
  state.completedRounds++;
  RN({ type:"QUESTION_RESULT", payload: { ...result, question_log: toQuestionLog(result) } });
  state._idx++;
  setTimeout(() => {
    clearSpotStates();
    nextQuestion();
  }, nextDelayMs);
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
  pauseSession("user_pause");
  playVoiceGuide("takingABreak", "잠시 쉬겠습니다.");
  const [title, message] = quitCopy();
  document.getElementById("quitTitle").textContent = title;
  document.getElementById("quitMessage").innerHTML = message;
  quitModal.classList.add("on");
});
document.getElementById("contBtn").addEventListener("click", () => {
  quitModal.classList.remove("on");
  resumeSession("user_resume");
});
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
  const targetLabel = correctTargetLabel();
  const msg = isNoTargetQuestion()
    ? "그대로 두세요."
    : (runtime.softFeedback
      ? `괜찮아요. ${targetLabel}을 봐주세요.`
      : `${targetLabel}에게 보내요`);
  setPrompt(msg, "warn");
  playVoiceGuide("hint", msg);
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
