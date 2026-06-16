"use strict";

(function () {
  function flattenStagePool(pool) {
    return [].concat(pool[1] || [], pool[2] || [], pool[3] || []);
  }

  function buildPackQuestions(mode, diff, stageNo, count) {
    const pool = POOL[mode][diff];
    return pick(flattenStagePool(pool), count).map((tpl, idx) => ({
      mode,
      kind: "pack",
      stage: stageNo,
      stageIdx: idx,
      sit: tpl.sit,
      items: shuffle(tpl.items.map(k => it(k))),
      answers: tpl.answers.slice(),
    }));
  }

  function buildGuessQuestions(mode, diff, stageNo, count) {
    const pool = GUESS_POOL[diff];
    const sitCount = SIT_CHOICES[diff];
    return pick(flattenStagePool(pool), count).map((tpl, idx) => {
      let choices = tpl.choices.slice();
      if (choices.length > sitCount) {
        const others = choices.filter(c => c !== tpl.answer);
        choices = shuffle(others).slice(0, sitCount - 1).concat([tpl.answer]);
      }

      return {
        mode,
        kind: "guess",
        stage: stageNo,
        stageIdx: idx,
        sit: "이 물건들은 어떤 상황에 어울릴까요?",
        items: tpl.items.map(k => it(k)),
        choices: shuffle(choices),
        answer: tpl.answer,
        explanation: tpl.explanation,
      };
    });
  }

  function hideSeenItems() {
    const seen = $("p-seen");
    seen.style.display = "none";
    seen.innerHTML = "";
  }

  function renderSeenItems(q) {
    const seen = $("p-seen");
    seen.style.display = "flex";
    seen.innerHTML = q.items
      .map(i => `<div class="seen-item"><div class="ph">${phHtml(i)}</div><div class="n">${i.n}</div></div>`)
      .join("");
  }

  function renderPackChoices(cur, modeDef) {
    const q = cur.q;
    const grid = $("p-choices");
    grid.className = "choices n" + q.items.length;
    q.items.forEach(item => {
      const b = document.createElement("button");
      b.className = "choice";
      b.dataset.key = item.k;
      b.innerHTML = `<div class="ph">${phHtml(item)}</div><div class="n">${item.n}</div>`;
      if (modeDef.isMarked(cur, item.k)) b.classList.add(modeDef.markedClass);
      b.addEventListener("click", () => modeDef.handleChoice(item.k, b));
      grid.appendChild(b);
    });
  }

  function renderPackReveal(q, content, explain) {
    const items = q.answers.map(k => {
      const i = I[k];
      return `<div class="answer-item"><div class="ph">${phHtml(i)}</div><div class="n">${i.n}</div></div>`;
    }).join("");
    content.innerHTML = `<div class="answer-items">${items}</div>`;
    explain.textContent = "";
  }

  function answerCount(q) {
    if (Array.isArray(q.answers)) return q.answers.length;
    if (q.answer) return 1;
    return 0;
  }

  function countGuide(q, targetText, verbText) {
    const count = answerCount(q);
    return count > 0 ? `${targetText} ${count}개를 ${verbText}.` : "";
  }

  const chooseMatchingItems = {
    key: "choose_matching_items",
    markedClass: "picked",
    resultText: "오늘은 언어·의미 활동과 집중 활동을 함께 해보셨어요. 상황에 맞는 물건을 고르며 일상생활 판단을 차분히 살펴보셨어요.",
    buildQuestions({ mode, diff, stageNo, count }) {
      return buildPackQuestions(mode, diff, stageNo, count);
    },
    getTargetText(q) {
      return countGuide(q, "필요한 물건", "골라주세요");
    },
    renderContext() {
      hideSeenItems();
    },
    renderChoices(cur) {
      renderPackChoices(cur, this);
    },
    isMarked(cur, key) {
      return cur.picked.has(key);
    },
    handleChoice(key, btn) {
      const cur = state.current;
      if (!cur || cur.revealed || state.paused || cur.picked.has(key)) return;
      const q = cur.q;
      const isAnswer = q.answers.includes(key);
      if (typeof recordChoiceAction === "function") {
        recordChoiceAction({
          action: "select_item",
          key,
          item_name: I[key] ? I[key].n : key,
          correct: isAnswer,
        });
      }
      if (isAnswer) {
        cur.picked.add(key);
        state.selectedRequired++;
        btn.classList.add("picked");
        showFeedback(pickMsg(PRAISE_PICK), "ok");
        if (q.answers.every(a => cur.picked.has(a))) finishQuestion(true, 1200);
        return;
      }

      cur.wrongCount++;
      state.selectedUnnecessary++;
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 350);
      showFeedback(pickMsg(SOFT_WRONG_PICK), "no");
      if (cur.wrongCount >= 2) revealAndAdvance();
    },
    renderReveal(q, content, explain) {
      renderPackReveal(q, content, explain);
    },
  };

  const removeMismatchedItems = {
    key: "remove_mismatched_items",
    markedClass: "removed-state",
    resultText: "오늘은 집중 활동과 언어·의미 활동을 함께 해보셨어요. 어울리지 않는 물건을 가려내며 일상생활 판단을 차분히 살펴보셨어요.",
    buildQuestions({ mode, diff, stageNo, count }) {
      return buildPackQuestions(mode, diff, stageNo, count);
    },
    getTargetText(q) {
      return countGuide(q, "어울리지 않는 물건", "골라주세요");
    },
    renderContext() {
      hideSeenItems();
    },
    renderChoices(cur) {
      renderPackChoices(cur, this);
    },
    isMarked(cur, key) {
      return cur.removed.has(key);
    },
    handleChoice(key, btn) {
      const cur = state.current;
      if (!cur || cur.revealed || state.paused || cur.removed.has(key)) return;
      const q = cur.q;
      const isAnswer = q.answers.includes(key);
      if (typeof recordChoiceAction === "function") {
        recordChoiceAction({
          action: "remove_item",
          key,
          item_name: I[key] ? I[key].n : key,
          correct: isAnswer,
        });
      }
      if (isAnswer) {
        cur.removed.add(key);
        state.removedMismatched++;
        btn.classList.add("removed-state");
        showFeedback(pickMsg(PRAISE_REMOVE), "ok");
        if (q.answers.every(a => cur.removed.has(a))) finishQuestion(true, 1200);
        return;
      }

      cur.wrongCount++;
      state.wronglyRemovedMatched++;
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 350);
      showFeedback(pickMsg(SOFT_WRONG_REMOVE), "no");
      if (cur.wrongCount >= 2) revealAndAdvance();
    },
    renderReveal(q, content, explain) {
      renderPackReveal(q, content, explain);
    },
  };

  const guessSituation = {
    key: "guess_situation",
    resultText: "오늘은 언어·의미 활동과 기억 활동을 함께 해보셨어요. 상황에 맞는 물건을 떠올리며 일상생활 판단을 차분히 살펴보셨어요.",
    buildQuestions({ mode, diff, stageNo, count }) {
      return buildGuessQuestions(mode, diff, stageNo, count);
    },
    getTargetText(q) {
      return countGuide(q, "보이는 물건에 맞는 상황", "골라주세요");
    },
    renderContext(q) {
      renderSeenItems(q);
    },
    renderChoices(cur) {
      const q = cur.q;
      const grid = $("p-choices");
      grid.className = "choices sit-n" + q.choices.length;
      q.choices.forEach(label => {
        const b = document.createElement("button");
        b.className = "choice sit";
        b.innerHTML = `<div class="n">${label}</div>`;
        b.addEventListener("click", () => this.handleChoice(label, b));
        grid.appendChild(b);
      });
    },
    handleChoice(label, btn) {
      const cur = state.current;
      if (!cur || cur.revealed || cur.guessAnswered || state.paused) return;
      const q = cur.q;
      const rt = typeof getQuestionElapsedMs === "function"
        ? getQuestionElapsedMs(cur) / 1000
        : (Date.now() - cur.qStart) / 1000;
      if (typeof recordChoiceAction === "function") {
        recordChoiceAction({
          action: "choose_situation",
          label,
          correct: label === q.answer,
        });
      }
      if (label === q.answer) {
        cur.guessAnswered = true;
        btn.classList.add("picked");
        state.guessedSituations++;
        state.situationResponses.push(rt);
        showFeedback(pickMsg(PRAISE_SIT), "ok");
        finishQuestion(true, 1200);
        return;
      }

      cur.wrongCount++;
      state.wrongSituationChoices++;
      btn.classList.add("shake", "removed-state");
      btn.disabled = true;
      setTimeout(() => btn.classList.remove("shake"), 350);
      showFeedback(pickMsg(SOFT_WRONG_SIT), "no");
      if (cur.wrongCount >= 2) revealAndAdvance();
    },
    renderReveal(q, content, explain) {
      content.innerHTML = `<div class="sit-answer">정답: ${q.answer}</div>`;
      explain.textContent = q.explanation || "";
    },
  };

  window.GAME_MODES = {
    choose_matching_items: chooseMatchingItems,
    remove_mismatched_items: removeMismatchedItems,
    guess_situation: guessSituation,
  };
})();
