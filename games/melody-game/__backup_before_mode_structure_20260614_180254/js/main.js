(function () {
  "use strict";

  const screens = Array.from(document.querySelectorAll(".screen"));
  const loadingFill = document.getElementById("loadingFill");
  const loadingPercent = document.getElementById("loadingPercent");
  const soundToggle = document.getElementById("soundToggle");
  const volumeRange = document.getElementById("volumeRange");
  const motionToggle = document.getElementById("motionToggle");
  const difficultyCards = Array.from(document.querySelectorAll("[data-difficulty]"));
  const startGameButton = document.getElementById("startGameButton");
  const difficultyStartButton = document.getElementById("difficultyStartButton");
  const retryButton = document.getElementById("retryButton");
  const homeButton = document.getElementById("homeButton");

  let selectedDifficulty = "normal";
  const audio = new window.MelodyAudio();
  const game = new window.MelodyDrumGame({
    audio,
    onFinish(result) {
      window.ResultManager.renderResult(result);
      showScreen("result");
    }
  });

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      return false;
    }
    return true;
  }

  function showScreen(name) {
    screens.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
  }

  function startLoading() {
    let progress = 0;
    const interval = window.setInterval(() => {
      progress = Math.min(100, progress + Math.ceil(Math.random() * 16));
      loadingFill.style.width = `${progress}%`;
      loadingPercent.textContent = `${progress}%`;

      if (progress >= 100) {
        window.clearInterval(interval);
        window.setTimeout(() => showScreen("home"), 260);
      }
    }, 140);
  }

  function selectDifficulty(difficulty) {
    selectedDifficulty = difficulty;
    difficultyCards.forEach((card) => {
      card.classList.toggle("is-selected", card.dataset.difficulty === difficulty);
    });
  }

  function beginGame() {
    audio.ensureContext();
    audio.playClick();
    showScreen("play");
    game.start(selectedDifficulty);
  }

  function loadSettings() {
    const savedVolume = storageGet("melodyDrumVolume");
    const savedSound = storageGet("melodyDrumSound");
    const savedMotion = storageGet("melodyDrumReduceMotion");

    if (savedVolume !== null) {
      volumeRange.value = savedVolume;
    }

    if (savedSound !== null) {
      soundToggle.checked = savedSound === "true";
    }

    if (savedMotion !== null) {
      motionToggle.checked = savedMotion === "true";
    }

    applySettings();
  }

  function applySettings() {
    audio.setEnabled(soundToggle.checked);
    audio.setVolume(Number(volumeRange.value) / 100);
    document.body.classList.toggle("reduce-motion", motionToggle.checked);
    storageSet("melodyDrumVolume", volumeRange.value);
    storageSet("melodyDrumSound", String(soundToggle.checked));
    storageSet("melodyDrumReduceMotion", String(motionToggle.checked));
  }

  function updateScaleVariable() {
    const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    document.documentElement.style.setProperty("--scale", String(Math.max(0.78, Math.min(1.18, scale))));
  }

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("pointerup", () => {
      const target = button.dataset.go;
      audio.playClick();
      showScreen(target);
    });
  });

  difficultyCards.forEach((card) => {
    card.addEventListener("pointerup", () => {
      audio.playClick();
      selectDifficulty(card.dataset.difficulty);
    });
  });

  startGameButton.addEventListener("pointerup", beginGame);
  difficultyStartButton.addEventListener("pointerup", beginGame);
  retryButton.addEventListener("pointerup", beginGame);
  homeButton.addEventListener("pointerup", () => {
    audio.playClick();
    showScreen("home");
  });

  soundToggle.addEventListener("change", applySettings);
  volumeRange.addEventListener("input", applySettings);
  motionToggle.addEventListener("change", applySettings);
  window.addEventListener("resize", updateScaleVariable);
  window.addEventListener("orientationchange", updateScaleVariable);
  window.addEventListener("melody-drum:go-home", () => showScreen("home"));

  loadSettings();
  selectDifficulty(selectedDifficulty);
  updateScaleVariable();
  startLoading();
})();
