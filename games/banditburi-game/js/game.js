    const IMAGES = {"off":"assets/images/image-02-6e6b97b5.png","yellow":"assets/images/image-03-b8c398ec.png","flower":"assets/images/image-04-5ed55c22.png"};
    const TEXT = {"lang":"마다","title":"빛나는 전구를 찾아라","startIntro":"난이도를 고르면 곧바로 시작됩니다.","start":"시작하기","next":"다음 문제","reset":"홈으로","level":"난이도","high":"HARD","middle":"NORMAL","low":"EASY","choose":"골라주세요.","selecting":"선택","correct":"정답입니다.","wrong":"잘 찾아 보세요. 기억하실 수 있을 거예요.","done":"정말 잘하셨어요.","yellow":"빛나는 전구","offBulb":"불이 꺼진 전구","flower":"무궁화","objectBase":"등장 오브젝트: 불이 꺼진 전구, 빛나는 전구","objectOne":"6번째부터 무궁화가 나와요.","remaining":"남은 개수","round":"진행","time":"남은 시간","pause":"일시정지","resume":"계속하기","restart":"다시 시작하기","paused":"잠시 쉬는 중입니다.","timeUp":"괜찮아요. 다음 문제로 천천히 이어가볼게요.","final":"오늘은 기억력 훈련을 했어요. 끝까지 함께해 주셔서 감사합니다.","chooseDifficulty":"난이도를 골라주세요.","homeConfirm":"초기 화면으로 가시겠습니까?","yes":"네","no":"아니오","wrongLimit":"괜찮아요. 다음 문제로 천천히 넘어가볼게요.","wrongLimitFinal":"괜찮아요. 결과화면으로 넘어가겠습니다."};

    const svgData = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    const THEME_IMAGES = {
      bulb: {
        label: TEXT.yellow,
        offLabel: TEXT.offBulb,
        on: IMAGES.yellow,
        off: IMAGES.off,
      },
      bird: {
        label: "새",
        offLabel: "새",
        on: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="84" fill="none"/><ellipse cx="242" cy="266" rx="145" ry="118" fill="#ffd56f"/><circle cx="188" cy="188" r="78" fill="#ffbf5d"/><path d="M88 187c-32-12-63 3-78 30 38 13 73 7 103-19z" fill="#f49c38"/><path d="M272 248c66-57 146-32 180 42-72 22-143 6-205-47z" fill="#ffaf47"/><path d="M151 174c-16-22-13-48 5-72 28 16 39 42 30 72z" fill="#f29a38"/><circle cx="211" cy="172" r="13" fill="#453016"/><path d="M252 374c-30 34-75 44-122 25 37-16 63-35 79-64z" fill="#f59d35"/><path d="M177 412l-20 36M225 412l-10 39" stroke="#9b6a22" stroke-width="18" stroke-linecap="round"/></svg>`),
        off: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="84" fill="none"/><ellipse cx="242" cy="266" rx="145" ry="118" fill="#c9ddc6"/><circle cx="188" cy="188" r="78" fill="#b6ceb6"/><path d="M88 187c-32-12-63 3-78 30 38 13 73 7 103-19z" fill="#a8c2aa"/><path d="M272 248c66-57 146-32 180 42-72 22-143 6-205-47z" fill="#b7d0b6"/><path d="M151 174c-16-22-13-48 5-72 28 16 39 42 30 72z" fill="#a8c2aa"/><circle cx="211" cy="172" r="13" fill="#6c826d"/><path d="M252 374c-30 34-75 44-122 25 37-16 63-35 79-64z" fill="#aac4aa"/><path d="M177 412l-20 36M225 412l-10 39" stroke="#9aa576" stroke-width="18" stroke-linecap="round"/></svg>`),
      },
      phone: {
        label: "휴대폰",
        offLabel: "휴대폰",
        on: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="84" fill="none"/><rect x="134" y="58" width="244" height="396" rx="42" fill="#48515c"/><rect x="158" y="96" width="196" height="296" rx="24" fill="#82d9ff"/><path d="M171 115h170v128c-41 18-86 15-134-8-20-10-32-15-36-15z" fill="#b9efff" opacity=".86"/><circle cx="256" cy="421" r="18" fill="#d8dee5"/><rect x="216" y="76" width="80" height="10" rx="5" fill="#cfd7df"/></svg>`),
        off: svgData(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="84" fill="none"/><rect x="134" y="58" width="244" height="396" rx="42" fill="#7e8a88"/><rect x="158" y="96" width="196" height="296" rx="24" fill="#c6d9cc"/><path d="M171 115h170v128c-41 18-86 15-134-8-20-10-32-15-36-15z" fill="#edf7ee" opacity=".42"/><circle cx="256" cy="421" r="18" fill="#b5beb3"/><rect x="216" y="76" width="80" height="10" rx="5" fill="#b5beb3"/></svg>`),
      },
    };
    // BEGIN custom bird theme image
    THEME_IMAGES.bird.on = "assets/images/image-05-5aebd85a.png";
    THEME_IMAGES.bird.off = THEME_IMAGES.bird.on;
    // END custom bird theme image


    const difficultySettings = {
      high: { label: TEXT.high, gridSize: 4, targetCount: 4 },
      medium: { label: TEXT.middle, gridSize: 3, targetCount: 3 },
      low: { label: TEXT.low, gridSize: 2, targetCount: 2 },
    };

    const tutorialSteps = [
      {
        title: "인지 훈련 게임입니다.",
        text: "빛나는 위치를 기억하고 다시 찾는 기억력 훈련입니다.",
        demo: "intro",
      },
      {
        title: "위치를 기억해요.",
        text: "처음 5초 동안 빛나는 위치를 보여줍니다.",
        demo: "preview",
      },
      {
        title: "같은 위치를 골라요.",
        text: "보기가 사라지면 같은 위치를 눌러주세요.",
        demo: "choose",
      },
      {
        title: "필요하면 힌트를 눌러요.",
        text: "힌트를 누르면 정답 위치가 잠깐 깜박입니다.",
        demo: "hint",
      },
      {
        title: "차분히 끝까지 해봐요.",
        text: "총 10문제를 차분히 진행합니다.",
        demo: "done",
      },
    ];

    const objectTypes = {
      yellow: { label: TEXT.yellow, src: IMAGES.yellow },
      flower: { label: TEXT.flower, src: IMAGES.flower },
      off: { label: TEXT.offBulb, src: IMAGES.off },
    };

    const loadingScreen = document.getElementById("loadingScreen");
    const introModal = document.getElementById("introModal");
    const tutorialModal = document.getElementById("tutorialModal");
    const settingsModal = document.getElementById("settingsModal");
    const themeModal = document.getElementById("themeModal");
    const checkinModal = document.getElementById("checkinModal");
    const postGameModal = document.getElementById("postGameModal");
    const pauseModal = document.getElementById("pauseModal");
    const introStartButton = document.getElementById("introStartButton");
    const introSettingsButton = document.getElementById("introSettingsButton");
    const introHowToButton = document.getElementById("introHowToButton");
    const themeOpenButton = document.getElementById("themeOpenButton");
    const musicToggleButton = document.getElementById("musicToggleButton");
    const effectToggleButton = document.getElementById("effectToggleButton");
    const voiceToggleButton = document.getElementById("voiceToggleButton");
    const settingsBackButton = document.getElementById("settingsBackButton");
    const themeBackButton = document.getElementById("themeBackButton");
    const themeOptionButtons = [...document.querySelectorAll("[data-theme-option]")];
    const moodButtons = [...document.querySelectorAll("[data-mood]")];
    const sleepButtons = [...document.querySelectorAll("[data-sleep]")];
    const sleepPrevValue = document.getElementById("sleepPrevValue");
    const sleepValue = document.getElementById("sleepValue");
    const sleepNextValue = document.getElementById("sleepNextValue");
    const sleepUpButton = document.getElementById("sleepUpButton");
    const sleepDownButton = document.getElementById("sleepDownButton");
    const checkinNextButton = document.getElementById("checkinNextButton");
    const postMoodButtons = [...document.querySelectorAll("[data-post-mood]")];
    const postDifficultyButtons = [...document.querySelectorAll("[data-post-difficulty]")];
    const postFatigueButtons = [...document.querySelectorAll("[data-post-fatigue]")];
    const postHelpButtons = [...document.querySelectorAll("[data-post-help]")];
    const postReplayButtons = [...document.querySelectorAll("[data-post-replay]")];
    const postGameNextButton = document.getElementById("postGameNextButton");
    const postGamePageOne = document.getElementById("postGamePageOne");
    const postGamePageTwo = document.getElementById("postGamePageTwo");
    const skipTutorialButton = document.getElementById("skipTutorialButton");
    const tutorialNextButton = document.getElementById("tutorialNextButton");
    const tutorialPageText = document.getElementById("tutorialPageText");
    const tutorialStepTitle = document.getElementById("tutorialStepTitle");
    const tutorialStepText = document.getElementById("tutorialStepText");
    const tutorialVisual = document.getElementById("tutorialVisual");
    const howToButton = document.getElementById("howToButton");
    const resumeButton = document.getElementById("resumeButton");
    const exitButton = document.getElementById("exitButton");
    const pauseMusicButton = document.getElementById("pauseMusicButton");
    const pauseEffectButton = document.getElementById("pauseEffectButton");
    const pauseVoiceButton = document.getElementById("pauseVoiceButton");
    const celebrationLayer = document.getElementById("celebrationLayer");
    const board = document.getElementById("board");
    const message = document.getElementById("message");
    const levelText = document.getElementById("levelText");
    const remainText = document.getElementById("remainText");
    const roundText = document.getElementById("roundText");
    const timeText = document.getElementById("timeText");
    const guideTitle = document.getElementById("guideTitle");
    const guideText = document.getElementById("guideText");
    const startButton = document.getElementById("startButton");
    const hintButton = document.getElementById("hintButton");
    const pauseButton = document.getElementById("pauseButton");
    const resetButton = document.getElementById("resetButton");
    const difficultyModal = document.getElementById("difficultyModal");
    const homeConfirmModal = document.getElementById("homeConfirmModal");
    const homeYesButton = document.getElementById("homeYesButton");
    const homeNoButton = document.getElementById("homeNoButton");
    const startDifficultyButtons = [...document.querySelectorAll("[data-start-difficulty]")];

    let currentDifficulty = "low";
    let boardItems = [];
    let targetType = "yellow";
    let targetIndexes = new Set();
    let chosenCorrect = new Set();
    let chosenWrong = new Set();
    let roundActive = false;
    let previewTimer = null;
    let previewCountdownTimer = null;
    let hintTimer = null;
    let hintCountdownTimer = null;
    let roundTimer = null;
    let betweenTimer = null;
    let isPreviewing = false;
    let isHinting = false;
    let isPaused = false;
    let pausedPhase = null;
    let homePausedByDialog = false;
    let currentTheme = "bulb";
    let musicEnabled = true;
    let soundEnabled = true;
    let voiceEnabled = true;
    const sleepHourOptions = [4, 5, 6, 7, 8, 9, 10, 11, 12];
    let todayMood = "";
    let sleepHourIndex = 4;
    let sleepTime = `${sleepHourOptions[sleepHourIndex]}시간`;
    let postMood = "";
    let postDifficulty = "";
    let postFatigue = "";
    let postHelpNeeded = "";
    let postReplayWanted = "";
    let postGamePage = 1;
    let tutorialReturnTarget = "difficulty";
    let tutorialStepIndex = 0;
    let currentPhase = "home";
    let currentRound = 0;
    let timeLeft = 60;
    let previewSecondsLeft = 5;
    let hintSecondsLeft = 5;
    const maxRounds = 10;
    const roundTimeLimit = 60;
    const gameSchemaVersion = "1.0.0";
    const defaultGameConfig = window.__GAME_CONFIG__ || {};
    let gameSessionId = defaultGameConfig.sessionId || `local-${Date.now()}`;
    let gameTelemetry = null;
    let roundTelemetry = null;
    let roundClosed = false;
    const BUTTON_CLICK_SOUND_SRC = "assets/audio/audio-01-7e204aa7.mp3";
    const CORRECT_SOUND_SRC = "assets/audio/audio-01-7e204aa7.mp3";
    const WRONG_SOUND_SRC = "assets/audio/audio-01-7e204aa7.mp3";
    const INTRO_MUSIC_SRC = "assets/audio/audio-02-7642c099.mp3";
    const PLAY_MUSIC_SRC = "assets/audio/audio-03-e0e7d5be.mp3";
    const buttonClickSound = new Audio(BUTTON_CLICK_SOUND_SRC);
    buttonClickSound.preload = "auto";
    buttonClickSound.volume = 1;
    const introMusic = new Audio(INTRO_MUSIC_SRC);
    introMusic.preload = "auto";
    introMusic.loop = true;
    introMusic.volume = 0.72;
    const playMusic = new Audio(PLAY_MUSIC_SRC);
    playMusic.preload = "auto";
    playMusic.loop = false;
    playMusic.volume = 0.72;
    let currentMusicMode = "";

    function shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function targetPool(roundNumber = currentRound) {
      const pool = ["yellow"];
      if (currentDifficulty === "high" && roundNumber > 5) {
        pool.push("flower");
      }
      return pool;
    }

    function distractorPool(roundNumber = currentRound) {
      return ["off", ...targetPool(roundNumber).filter((type) => type !== targetType)];
    }

    function updateDifficultyButtons() {
      levelText.textContent = difficultySettings[currentDifficulty].label;
      startDifficultyButtons.forEach((button) => {
        const isActive = button.dataset.startDifficulty === currentDifficulty;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });
      updateGuide();
    }

    function updateGuide() {
      const setting = difficultySettings[currentDifficulty];
      guideTitle.textContent = "안내";
      if (currentDifficulty === "high") {
        guideText.textContent = `4 x 4, ${setting.targetCount}개 찾기. ${TEXT.objectOne}`;
        return;
      }
      guideText.textContent = `${setting.gridSize} x ${setting.gridSize}, ${objectTypes.yellow.label} ${setting.targetCount}개 찾기.`;
    }

    function targetPhrase(count) {
      if (targetType === "flower") return `빛나는 무궁화 ${count}송이`;
      if (currentTheme === "bird") return `빛나는 새 ${count}마리`;
      if (currentTheme === "phone") return `빛나는 휴대폰 ${count}개`;
      return `빛나는 전구 ${count}개`;
    }

    function updateHeroImages() {
      document.querySelectorAll("[data-hero-object]").forEach((image) => {
        const type = image.dataset.heroObject;
        image.src = objectTypes[type].src;
        image.alt = objectTypes[type].label;
      });
    }

    function updateThemeButtons() {
      themeOptionButtons.forEach((button) => {
        const active = button.dataset.themeOption === currentTheme;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    }

    function updateCheckinButtons() {
      moodButtons.forEach((button) => {
        const active = button.dataset.mood === todayMood;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      updateSleepDial();
      checkinNextButton.disabled = !(todayMood && sleepTime);
    }

    function updateSleepDial() {
      const currentHour = sleepHourOptions[sleepHourIndex];
      sleepTime = `${currentHour}시간`;

      if (!sleepValue || !sleepPrevValue || !sleepNextValue) return;

      const upperHour = sleepHourOptions[sleepHourIndex + 1];
      const lowerHour = sleepHourOptions[sleepHourIndex - 1];
      sleepPrevValue.textContent = upperHour ? `${upperHour}시간` : "";
      sleepValue.textContent = sleepTime;
      sleepNextValue.textContent = lowerHour ? `${lowerHour}시간` : "";

      if (sleepDownButton) sleepDownButton.disabled = sleepHourIndex === 0;
      if (sleepUpButton) sleepUpButton.disabled = sleepHourIndex === sleepHourOptions.length - 1;
    }

    function changeSleepHour(step) {
      const nextIndex = Math.max(0, Math.min(sleepHourOptions.length - 1, sleepHourIndex + step));
      if (nextIndex === sleepHourIndex) return;
      sleepHourIndex = nextIndex;
      updateCheckinButtons();
      speakGuide(`수면시간은 ${sleepTime}으로 선택했습니다.`);
    }

    function updatePostGameButtons() {
      postMoodButtons.forEach((button) => {
        const active = button.dataset.postMood === postMood;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      postDifficultyButtons.forEach((button) => {
        const active = button.dataset.postDifficulty === postDifficulty;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      postFatigueButtons.forEach((button) => {
        const active = button.dataset.postFatigue === postFatigue;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      postHelpButtons.forEach((button) => {
        const active = button.dataset.postHelp === postHelpNeeded;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      postReplayButtons.forEach((button) => {
        const active = button.dataset.postReplay === postReplayWanted;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      renderPostGamePage();
    }

    function renderPostGamePage() {
      if (postGamePageOne) postGamePageOne.classList.toggle("is-hidden", postGamePage !== 1);
      if (postGamePageTwo) postGamePageTwo.classList.toggle("is-hidden", postGamePage !== 2);
      postGameNextButton.textContent = postGamePage === 1 ? "다음" : "나가기";
      postGameNextButton.disabled = postGamePage === 1
        ? !(postMood && postDifficulty && postFatigue)
        : !(postHelpNeeded && postReplayWanted);
    }

    function resetPostGameState() {
      postMood = "";
      postDifficulty = "";
      postFatigue = "";
      postHelpNeeded = "";
      postReplayWanted = "";
      postGamePage = 1;
      updatePostGameButtons();
    }

    function normalizeVoiceText(text) {
      return String(text)
        .replace(/10\s*문제/g, "열 문제")
        .replace(/10\s*번째/g, "열 번째");
    }

    function speakGuide(text, interrupt = true) {
      if (!voiceEnabled || !("speechSynthesis" in window) || !text) return;
      const cleanText = normalizeVoiceText(text).replace(/[_<>]/g, "").replace(/\s+/g, " ").trim();
      if (!cleanText) return;
      if (interrupt) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "ko-KR";
      utterance.rate = 0.86;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }

    function roundTransitionVoice(doneMessage) {
      const isFinalRound = currentRound >= maxRounds;
      const isSuccess = doneMessage === TEXT.done;
      if (isSuccess && isFinalRound) return "잘하셨어요. 결과 화면으로 갈게요.";
      if (isSuccess) return "잘하셨어요. 다음 문제로 갈게요.";
      if (isFinalRound) return "괜찮아요. 결과 화면으로 갈게요.";
      return "괜찮아요. 다음 문제로 갈게요.";
    }

    function stopVoiceGuide() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }

    function playEffectSound(src) {
      if (!soundEnabled) return;
      try {
        const sound = new Audio(src);
        sound.volume = 1;
        sound.play().catch(() => {});
      } catch (error) {
        // Some WebViews block audio until the first user gesture.
      }
    }

    function nowIso() {
      return new Date().toISOString();
    }

    function createTelemetry() {
      gameSessionId = defaultGameConfig.sessionId || `local-${Date.now()}`;
      return {
        sessionId: gameSessionId,
        startedAt: null,
        endedAt: null,
        durationMs: 0,
        totalElapsedMs: 0,
        roundTotal: maxRounds,
        playedRoundCount: 0,
        correctRoundCount: 0,
        failedRoundCount: 0,
        timeoutRoundCount: 0,
        correctClickCount: 0,
        wrongClickCount: 0,
        hintCount: 0,
        attemptCount: 0,
        interactionCount: 0,
        abandoned: false,
        rounds: [],
      };
    }

    function ensureTelemetry() {
      if (!gameTelemetry) {
        gameTelemetry = createTelemetry();
      }
      return gameTelemetry;
    }

    function sendGameMessage(message) {
      const payload = {
        schemaVersion: gameSchemaVersion,
        sentAt: nowIso(),
        sessionId: gameSessionId,
        contentId: defaultGameConfig.contentId || "memory_light_bulb_001",
        assignmentId: defaultGameConfig.assignmentId || "",
        seniorId: defaultGameConfig.seniorId || "",
        guardianId: defaultGameConfig.guardianId || "",
        gameKey: defaultGameConfig.gameKey || "light_memory",
        playSource: defaultGameConfig.playSource || "manual",
        ...message,
      };

      try {
        const serialized = JSON.stringify(payload);
        if (window.ReactNativeWebView?.postMessage) {
          window.ReactNativeWebView.postMessage(serialized);
        } else if (window.webkit?.messageHandlers?.gameBridge) {
          window.webkit.messageHandlers.gameBridge.postMessage(payload);
        } else {
          console.log("[MOCK_GAME_MESSAGE]", payload);
        }
      } catch (error) {
        console.log("[MOCK_GAME_MESSAGE_ERROR]", error);
      }
    }

    function startTelemetrySession() {
      gameTelemetry = createTelemetry();
      gameTelemetry.startedAt = nowIso();
      sendGameMessage({
        type: "GAME_STARTED",
        difficulty: difficultySettings[currentDifficulty].label,
        condition: {
          before: {
            mood: todayMood,
            sleepDurationGroup: sleepTime,
          },
          after: {
            mood: postMood,
            perceivedDifficulty: postDifficulty,
            fatigue: postFatigue,
            neededHelp: postHelpNeeded === "네",
            wantsReplay: postReplayWanted === "네",
          },
        },
      });
    }

    function startRoundTelemetry(roundNo) {
      roundClosed = false;
      roundTelemetry = {
        roundNo,
        targetType,
        targetCount: targetIndexes.size,
        gridSize: difficultySettings[currentDifficulty].gridSize,
        startedAt: Date.now(),
        correctClickCount: 0,
        wrongClickCount: 0,
        hintCount: 0,
      };
    }

    function closeRoundTelemetry(reason) {
      const telemetry = ensureTelemetry();
      if (roundClosed || !roundTelemetry) return;

      roundClosed = true;
      const correct = reason === "success";
      const timeout = reason === "timeout";
      const durationMs = Math.max(0, Date.now() - roundTelemetry.startedAt);
      telemetry.playedRoundCount += 1;
      telemetry.durationMs += durationMs;
      if (correct) telemetry.correctRoundCount += 1;
      if (!correct) telemetry.failedRoundCount += 1;
      if (timeout) telemetry.timeoutRoundCount += 1;
      telemetry.rounds.push({
        ...roundTelemetry,
        correct,
        failReason: correct ? "" : reason,
        durationMs,
      });
    }

    function buildResultPayload(status, extra = {}) {
      const telemetry = ensureTelemetry();
      const endedAt = nowIso();
      const totalElapsedMs = telemetry.startedAt ? Math.max(0, Date.now() - Date.parse(telemetry.startedAt)) : 0;
      const attemptCount = telemetry.correctClickCount + telemetry.wrongClickCount;
      const clickAccuracy = attemptCount ? Number((telemetry.correctClickCount / attemptCount).toFixed(3)) : 0;
      const roundAccuracy = telemetry.roundTotal ? Number((telemetry.correctRoundCount / telemetry.roundTotal).toFixed(3)) : 0;
      const completionRate = telemetry.roundTotal ? Number((telemetry.playedRoundCount / telemetry.roundTotal).toFixed(3)) : 0;

      telemetry.endedAt = endedAt;
      telemetry.totalElapsedMs = totalElapsedMs;
      telemetry.attemptCount = attemptCount;
      telemetry.interactionCount = attemptCount + telemetry.hintCount;

      return {
        type: status === "completed" ? "GAME_COMPLETED" : "GAME_ABANDONED",
        status,
        difficulty: difficultySettings[currentDifficulty].label,
        startedAt: telemetry.startedAt,
        endedAt,
        durationMs: telemetry.durationMs,
        totalElapsedMs,
        metrics: {
          roundTotal: telemetry.roundTotal,
          playedRoundCount: telemetry.playedRoundCount,
          correctRoundCount: telemetry.correctRoundCount,
          failedRoundCount: telemetry.failedRoundCount,
          timeoutRoundCount: telemetry.timeoutRoundCount,
          correctClickCount: telemetry.correctClickCount,
          wrongClickCount: telemetry.wrongClickCount,
          hintCount: telemetry.hintCount,
          attemptCount,
          interactionCount: telemetry.interactionCount,
          clickAccuracy,
          roundAccuracy,
          completionRate,
        },
        condition: {
          before: {
            mood: todayMood,
            sleepDurationGroup: sleepTime,
          },
        },
        resultDetail: {
          theme: currentTheme,
          gridSize: difficultySettings[currentDifficulty].gridSize,
          targetCountPerRound: difficultySettings[currentDifficulty].targetCount,
          timeLimitSec: roundTimeLimit,
          maxWrongPerRound: 3,
          flowerEnabledFromRound: currentDifficulty === "high" ? 6 : null,
          rounds: telemetry.rounds,
        },
        ...extra,
      };
    }

    function sendCompletedResult() {
      sendGameMessage(buildResultPayload("completed"));
    }

    function sendAbandonedResult(reason) {
      const telemetry = ensureTelemetry();
      if (telemetry.endedAt || currentPhase === "home" || currentPhase === "result") return;
      telemetry.abandoned = true;
      sendGameMessage(buildResultPayload("abandoned", {
        abandoned: true,
        abandonedReason: reason,
        abandonedAt: nowIso(),
      }));
    }

    function playButtonClickSound() {
      playEffectSound(BUTTON_CLICK_SOUND_SRC);
    }

    function playCorrectSound() {
      playEffectSound(CORRECT_SOUND_SRC);
    }

    function playWrongSound() {
      playEffectSound(WRONG_SOUND_SRC);
    }

    function stopBackgroundMusic() {
      introMusic.pause();
      playMusic.pause();
    }

    function startAudioTrack(track, startAt = 0) {
      if (!musicEnabled) return;
      track.volume = 0.72;
      if (track.paused) {
        try {
          track.currentTime = startAt;
        } catch (error) {
          // Some browsers delay seeking until the audio is ready.
        }
      }
      track.play().catch(() => {});
    }

    function playIntroMusic() {
      if (currentMusicMode === "intro" && !introMusic.paused) return;
      currentMusicMode = "intro";
      playMusic.pause();
      startAudioTrack(introMusic, 0);
    }

    function playGameMusic() {
      if (currentMusicMode === "game" && !playMusic.paused) return;
      currentMusicMode = "game";
      introMusic.pause();
      startAudioTrack(playMusic, 1.5);
    }

    function refreshBackgroundMusic() {
      if (!musicEnabled) {
        stopBackgroundMusic();
        return;
      }
      if (currentMusicMode === "game") {
        playGameMusic();
      } else {
        playIntroMusic();
      }
    }

    function syncAudioButtons() {
      musicToggleButton.textContent = musicEnabled ? "음악 On" : "음악 Off";
      pauseMusicButton.textContent = musicEnabled ? "음악 On" : "음악 Off";
      effectToggleButton.textContent = soundEnabled ? "효과음 On" : "효과음 Off";
      pauseEffectButton.textContent = soundEnabled ? "효과음 On" : "효과음 Off";
      voiceToggleButton.textContent = voiceEnabled ? "음성안내 On" : "음성안내 Off";
      pauseVoiceButton.textContent = voiceEnabled ? "음성안내 On" : "음성안내 Off";
    }

    function applyTheme(theme) {
      currentTheme = theme;
      document.body.classList.remove("theme-bulb", "theme-bird", "theme-phone");
      document.body.classList.add(`theme-${theme}`);
      const selected = THEME_IMAGES[theme];
      objectTypes.yellow.label = selected.label;
      objectTypes.yellow.src = selected.on;
      objectTypes.off.label = selected.offLabel;
      objectTypes.off.src = selected.off;
      updateHeroImages();
      updateThemeButtons();
      if (currentPhase === "home") {
        clearBoard();
      } else if (["preview", "playing", "hint"].includes(currentPhase)) {
        renderBoard(isHinting ? "hint" : isPreviewing ? "preview" : "hidden");
      }
    }

    function clearBoard(resetItems = true) {
      const setting = difficultySettings[currentDifficulty];
      board.style.setProperty("--grid-size", setting.gridSize);
      board.dataset.gridSize = String(setting.gridSize);
      board.innerHTML = "";
      const total = setting.gridSize * setting.gridSize;
      if (resetItems || boardItems.length !== total) {
        boardItems = Array.from({ length: total }, () => "off");
      }
      boardItems.forEach((type, index) => {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.setAttribute("aria-label", objectTypes[type].label);
        cell.dataset.index = String(index);
        cell.disabled = true;
        cell.addEventListener("click", () => chooseCell(index));
        const image = document.createElement("img");
        image.className = "object-img";
        image.src = objectTypes[type].src;
        image.alt = objectTypes[type].label;
        cell.appendChild(image);
        board.appendChild(cell);
      });
    }

    function renderBoard(mode = "hidden") {
      [...board.children].forEach((cell, index) => {
        const isChosenAnswer = chosenCorrect.has(index);
        const isWrongChoice = chosenWrong.has(index);
        const isUnchosenTarget = targetIndexes.has(index) && !isChosenAnswer;
        let type = null;

        if (mode === "preview") type = boardItems[index];
        if (mode === "hint" && isUnchosenTarget) type = targetType;
        if (isChosenAnswer) type = targetType;

        if (mode !== "hint" || (!cell.classList.contains("correct") && !cell.classList.contains("wrong"))) {
          cell.className = "cell";
        }
        if (isWrongChoice) type = "off";
        cell.classList.toggle("empty", !type);
        cell.classList.toggle("hint", mode === "hint" && isUnchosenTarget && !isWrongChoice);
        cell.classList.toggle("preview-glow", mode === "preview" && targetIndexes.has(index) && type === targetType && type !== "off");
        if (type && type !== "off" && !isChosenAnswer) cell.classList.add(`object-${type}`);
        if (isChosenAnswer) cell.classList.add("correct");
        if (isWrongChoice) cell.classList.add("wrong");
        cell.disabled = mode === "preview" || !roundActive;

        const labelType = type || "off";
        cell.setAttribute("aria-label", objectTypes[labelType].label);
        const image = cell.querySelector("img");
        image.src = objectTypes[labelType].src;
        image.alt = objectTypes[labelType].label;
      });
    }

    function clearHintTimer() {
      if (hintTimer) {
        clearTimeout(hintTimer);
        hintTimer = null;
      }
      if (hintCountdownTimer) {
        clearInterval(hintCountdownTimer);
        hintCountdownTimer = null;
      }
      isHinting = false;
      hintButton.disabled = false;
    }

    function clearPreviewTimer() {
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = null;
      }
      if (previewCountdownTimer) {
        clearInterval(previewCountdownTimer);
        previewCountdownTimer = null;
      }
      isPreviewing = false;
    }

    function formatTime(seconds) {
      return `${Math.max(0, seconds)}초`;
    }

    function updateTimeDisplay() {
      timeText.textContent = formatTime(timeLeft);
    }

    function updateRoundDisplay() {
      roundText.textContent = `${Math.min(currentRound, maxRounds)} / ${maxRounds}`;
    }

    function updateRemaining() {
      const setting = difficultySettings[currentDifficulty];
      remainText.textContent = String(setting.targetCount - chosenCorrect.size);
    }

    function showCelebration() {
      celebrationLayer.innerHTML = "";
      const text = document.createElement("div");
      text.className = "celebration-text";
      text.textContent = "정말 잘하셨어요.";
      celebrationLayer.appendChild(text);

      const colors = ["#ffd95b", "#ff7f91", "#8ed7ff", "#b8ef9f", "#d8b7ff", "#ffffff"];
      const points = [
        [22, 24], [46, 18], [72, 26], [30, 58], [60, 55], [84, 62], [48, 78],
      ];
      points.forEach(([x, y], index) => {
        const item = document.createElement("span");
        item.className = "firework";
        item.style.setProperty("--x", `${x}%`);
        item.style.setProperty("--y", `${y}%`);
        item.style.setProperty("--c", colors[index % colors.length]);
        item.style.animationDelay = `${index * 90}ms`;
        celebrationLayer.appendChild(item);
      });

      setTimeout(() => {
        celebrationLayer.innerHTML = "";
      }, 2300);
    }

    function clearRoundTimer() {
      if (roundTimer) {
        clearInterval(roundTimer);
        roundTimer = null;
      }
    }

    function setPauseReady(enabled) {
      pauseButton.disabled = !enabled;
      pauseButton.textContent = isPaused ? TEXT.resume : TEXT.pause;
    }

    function clearBetweenTimer() {
      if (betweenTimer) {
        clearInterval(betweenTimer);
        betweenTimer = null;
      }
    }

    function resetSessionState() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      currentRound = 0;
      timeLeft = roundTimeLimit;
      isPaused = false;
      pausedPhase = null;
      currentPhase = "home";
      roundTelemetry = null;
      roundClosed = false;
      resetPostGameState();
      updateRoundDisplay();
      updateTimeDisplay();
      setPauseReady(false);
      board.parentElement.classList.remove("result-mode");
    }

    function startRoundTimer() {
      clearRoundTimer();
      timeLeft = roundTimeLimit;
      updateTimeDisplay();
      roundTimer = setInterval(() => {
        if (currentPhase !== "playing" || isPaused || isPreviewing) return;
        timeLeft -= 1;
        updateTimeDisplay();
        if (timeLeft <= 0) {
          finishRound(TEXT.timeUp, "timeout");
        }
      }, 1000);
    }

    function showIntroScreen() {
      currentMusicMode = "intro";
      refreshBackgroundMusic();
      introModal.classList.add("open");
      difficultyModal.classList.remove("open");
      checkinModal.classList.remove("open");
      postGameModal.classList.remove("open");
      tutorialModal.classList.remove("open");
      settingsModal.classList.remove("open");
      themeModal.classList.remove("open");
    }

    function showCheckinScreen() {
      currentMusicMode = "intro";
      refreshBackgroundMusic();
      introModal.classList.remove("open");
      tutorialModal.classList.remove("open");
      settingsModal.classList.remove("open");
      themeModal.classList.remove("open");
      difficultyModal.classList.remove("open");
      postGameModal.classList.remove("open");
      checkinModal.classList.add("open");
      updateCheckinButtons();
      speakGuide("게임을 시작하기 전에 오늘의 기분과 수면시간을 선택해 주세요.");
    }

    function showDifficultyScreen() {
      currentMusicMode = "intro";
      refreshBackgroundMusic();
      introModal.classList.remove("open");
      tutorialModal.classList.remove("open");
      settingsModal.classList.remove("open");
      themeModal.classList.remove("open");
      checkinModal.classList.remove("open");
      postGameModal.classList.remove("open");
      difficultyModal.classList.add("open");
      speakGuide("난이도를 골라주세요. 쉬움, 보통, 어려움 중에서 선택할 수 있습니다.");
    }

    function renderTutorialVisual(mode) {
      const litIndexes = new Set([0, 4, 7]);
      const pickedIndexes = new Set(mode === "choose" ? [0] : []);
      const hintIndexes = new Set(mode === "hint" ? [4, 7] : []);
      const doneIndexes = new Set(mode === "done" ? [0, 4, 7] : []);
      const showAllObjects = mode === "intro";
      const showPreview = mode === "preview" || mode === "hint" || mode === "done";
      const captions = {
        intro: "게임판에서 빛난 자리를 기억해요.",
        preview: "보기: 빛나는 위치를 5초 동안 봅니다.",
        choose: "선택: 사라진 뒤 같은 자리를 눌러요.",
        hint: "힌트: 남은 정답 위치가 깜박입니다.",
        done: "정답을 모두 찾으면 다음 문제로 넘어갑니다.",
      };

      const cells = Array.from({ length: 9 }, (_, index) => {
        const isAnswer = litIndexes.has(index);
        const isPicked = pickedIndexes.has(index);
        const isHint = hintIndexes.has(index);
        const isDone = doneIndexes.has(index);
        const shouldLight = (showPreview && isAnswer) || isPicked || isHint || isDone;
        const shouldShowOff = showAllObjects || mode === "preview";
        const shouldShowImage = shouldLight || shouldShowOff;
        const classes = [
          "tutorial-demo-cell",
          shouldLight ? "is-lit" : "",
          isPicked ? "is-picked" : "",
          isHint ? "is-hint" : "",
          isDone ? "is-done" : "",
          shouldShowImage ? "" : "is-blank",
        ].filter(Boolean).join(" ");
        const imageSrc = shouldLight ? IMAGES.yellow : IMAGES.off;
        return `<span class="${classes}"><img src="${imageSrc}" alt=""></span>`;
      }).join("");

      tutorialVisual.innerHTML = `<div class="tutorial-demo-grid">${cells}</div><span class="tutorial-demo-caption">${captions[mode] || captions.intro}</span>`;
    }

    function renderTutorialStep() {
      const step = tutorialSteps[tutorialStepIndex];
      tutorialPageText.textContent = `${tutorialStepIndex + 1} / ${tutorialSteps.length}`;
      tutorialStepTitle.textContent = step.title;
      tutorialStepText.textContent = step.text;
      renderTutorialVisual(step.demo);
      tutorialNextButton.textContent = tutorialStepIndex >= tutorialSteps.length - 1 ? "완료" : "다음";
      speakGuide(`${step.title}. ${step.text}`);
    }

    function openTutorial(returnTarget) {
      tutorialReturnTarget = returnTarget;
      tutorialStepIndex = 0;
      renderTutorialStep();
      introModal.classList.remove("open");
      pauseModal.classList.remove("open");
      tutorialModal.classList.add("open");
    }

    function closeTutorial() {
      tutorialModal.classList.remove("open");
      stopVoiceGuide();
      if (tutorialReturnTarget === "pause") {
        pauseModal.classList.add("open");
        speakGuide("일시정지 화면입니다. 계속하기를 누르면 게임으로 돌아갑니다.");
        return;
      }
      if (tutorialReturnTarget === "intro") {
        showIntroScreen();
        return;
      }
      showDifficultyScreen();
    }

    function nextTutorialStep() {
      if (tutorialStepIndex >= tutorialSteps.length - 1) {
        closeTutorial();
        return;
      }
      tutorialStepIndex += 1;
      renderTutorialStep();
    }

    function showPostGameScreen() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      roundActive = false;
      isPaused = false;
      currentPhase = "postgame";
      hintButton.disabled = true;
      setPauseReady(false);
      resetPostGameState();
      postGameModal.classList.add("open");
      speakGuide("마무리 상태를 선택해 주세요.");
    }

    function showResultScreen() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      sendCompletedResult();
      postGameModal.classList.remove("open");
      roundActive = false;
      isPaused = false;
      currentPhase = "result";
      currentMusicMode = "intro";
      refreshBackgroundMusic();
      message.textContent = "수고하셨습니다. >_<";
      speakGuide("수고하셨습니다. 오늘도 차분하게 잘 집중해 주셨어요.");
      startButton.textContent = TEXT.restart;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
      remainText.textContent = "-";
      board.parentElement.classList.add("result-mode");
      board.innerHTML = `<div class="result-card"><p>${TEXT.final}</p><button id="activityReturnButton" class="primary" type="button">완료</button></div>`;
      document.getElementById("activityReturnButton").addEventListener("click", () => {
        resetToHome();
        showIntroScreen();
      });
    }

    function completePostGameAndExit() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      sendCompletedResult();
      postGameModal.classList.remove("open");
      resetToHome();
      showIntroScreen();
    }

    function finishRound(doneMessage, reason = "unknown") {
      closeRoundTelemetry(reason);
      clearRoundTimer();
      clearHintTimer();
      clearBetweenTimer();
      roundActive = false;
      currentPhase = "between";
      currentRound = Math.min(maxRounds, currentRound);
      updateRoundDisplay();
      startButton.textContent = currentRound >= maxRounds ? TEXT.restart : TEXT.next;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
      [...board.children].forEach((item) => {
        item.disabled = true;
      });

      let secondsLeft = 3;
      const updateBetweenMessage = () => {
        const nextText = currentRound >= maxRounds ? "결과 화면으로 이동합니다." : "다음 문제로 넘어갑니다.";
        message.textContent = `${doneMessage} ${secondsLeft}초 후 ${nextText}`;
      };
      updateBetweenMessage();
      speakGuide(roundTransitionVoice(doneMessage));
      betweenTimer = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          updateBetweenMessage();
          return;
        }
        clearBetweenTimer();
        if (currentRound >= maxRounds) {
          showPostGameScreen();
          return;
        }
        startRound();
      }, 1000);
    }

    function beginSelectionPhase() {
      clearPreviewTimer();
      currentPhase = "playing";
      roundActive = true;
      isPaused = false;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = false;
      setPauseReady(true);
      message.textContent = `${targetPhrase(targetIndexes.size)}가 있었던 위치를 골라주세요.`;
      speakGuide(`${targetPhrase(targetIndexes.size)}가 있었던 위치를 골라주세요.`);
      renderBoard("hidden");
      startRoundTimer();
    }

    function startPreviewCountdown() {
      const updatePreviewMessage = () => {
        message.textContent = `${targetPhrase(targetIndexes.size)}의 위치를 기억하세요. ${previewSecondsLeft}초`;
      };
      updatePreviewMessage();
      speakGuide(`${targetPhrase(targetIndexes.size)}의 위치를 기억하세요.`);
      previewCountdownTimer = setInterval(() => {
        if (isPaused) return;
        previewSecondsLeft -= 1;
        if (previewSecondsLeft > 0) {
          updatePreviewMessage();
          return;
        }
        beginSelectionPhase();
      }, 1000);
    }

    function startRound() {
      currentMusicMode = "game";
      refreshBackgroundMusic();
      if (currentPhase === "result" || currentRound >= maxRounds) {
        resetSessionState();
      }
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      board.parentElement.classList.remove("result-mode");
      const setting = difficultySettings[currentDifficulty];
      const total = setting.gridSize * setting.gridSize;
      const nextRound = currentRound + 1;
      const possibleTargets = targetPool(nextRound);
      targetType = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
      const targetCount = Math.min(setting.targetCount, total);
      const positions = shuffle(Array.from({ length: total }, (_, index) => index));
      targetIndexes = new Set(positions.slice(0, targetCount));
      chosenCorrect.clear();
      chosenWrong.clear();
      const distractors = distractorPool(nextRound);
      boardItems = Array.from({ length: total }, (_, index) => {
        if (targetIndexes.has(index)) return targetType;
        return distractors[Math.floor(Math.random() * distractors.length)];
      });
      currentRound = nextRound;
      startRoundTelemetry(currentRound);
      updateRoundDisplay();
      if (currentDifficulty === "high" && currentRound > 5) {
        guideTitle.textContent = "안내";
        guideText.textContent = `${objectTypes[targetType].label}를 골라주세요.`;
      } else {
        updateGuide();
      }
      roundActive = false;
      isPreviewing = true;
      isHinting = false;
      isPaused = false;
      currentPhase = "preview";
      previewSecondsLeft = 5;
      timeLeft = roundTimeLimit;
      updateTimeDisplay();
      startButton.textContent = TEXT.next;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(true);
      clearBoard(false);
      renderBoard("preview");
      updateRemaining();
      startPreviewCountdown();
    }

    function chooseCell(index) {
      if (!roundActive || isPreviewing || isPaused) return;
      const cell = board.children[index];
      if (cell.classList.contains("correct") || cell.classList.contains("wrong")) return;

      if (targetIndexes.has(index)) {
        const telemetry = ensureTelemetry();
        telemetry.correctClickCount += 1;
        if (roundTelemetry) roundTelemetry.correctClickCount += 1;
        playCorrectSound();
        cell.classList.remove("empty", "hint");
        cell.classList.add("correct", "just-correct");
        setTimeout(() => cell.classList.remove("just-correct"), 520);
        const image = cell.querySelector("img");
        image.src = objectTypes[targetType].src;
        image.alt = objectTypes[targetType].label;
        cell.setAttribute("aria-label", objectTypes[targetType].label);
        chosenCorrect.add(index);
        updateRemaining();
        if (chosenCorrect.size >= targetIndexes.size) {
          chosenCorrect.forEach((targetIndex) => {
            board.children[targetIndex]?.classList.add("round-complete");
          });
          showCelebration();
          finishRound(TEXT.done, "success");
        } else {
          message.textContent = TEXT.correct;
          speakGuide("정답입니다. 잘하셨어요.");
        }
        return;
      }

      chosenWrong.add(index);
      const telemetry = ensureTelemetry();
      telemetry.wrongClickCount += 1;
      if (roundTelemetry) roundTelemetry.wrongClickCount += 1;
      playWrongSound();
      cell.classList.remove("empty", "hint");
      cell.classList.add("wrong");
      const wrongImage = cell.querySelector("img");
      wrongImage.src = objectTypes.off.src;
      wrongImage.alt = objectTypes.off.label;
      cell.setAttribute("aria-label", objectTypes.off.label);
      if (chosenWrong.size >= 3) {
        finishRound(currentRound >= maxRounds ? TEXT.wrongLimitFinal : TEXT.wrongLimit, "wrong_limit");
        return;
      }
      message.textContent = TEXT.wrong;
      speakGuide(TEXT.wrong);
    }

    function resetToHome() {
      resetSessionState();
      roundActive = false;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      chosenCorrect.clear();
      chosenWrong.clear();
      targetIndexes.clear();
      updateDifficultyButtons();
      clearBoard();
      remainText.textContent = "-";
      message.textContent = TEXT.startIntro;
      startButton.textContent = TEXT.start;
    }

    function setDifficulty(mode) {
      currentDifficulty = mode;
      resetToHome();
    }

    function openDifficultyModal() {
      if (["preview", "playing", "hint"].includes(currentPhase) && !isPaused) {
        togglePause();
      }
      difficultyModal.classList.add("open");
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
    }

    function closeDifficultyModal() {
      difficultyModal.classList.remove("open");
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
    }

    function beginStartCountdown() {
      startTelemetrySession();
      clearBetweenTimer();
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      currentPhase = "countdown";
      roundActive = false;
      isPreviewing = false;
      isHinting = false;
      isPaused = false;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
      updateRoundDisplay();
      updateTimeDisplay();
      clearBoard(false);

      let secondsLeft = 3;
      const updateCountdownMessage = () => {
        message.textContent = `${secondsLeft}초 후 게임이 시작됩니다.`;
      };
      updateCountdownMessage();
      speakGuide("3초 후 게임이 시작됩니다. 준비해 주세요.");
      betweenTimer = setInterval(() => {
        secondsLeft -= 1;
        if (secondsLeft > 0) {
          updateCountdownMessage();
          return;
        }
        clearBetweenTimer();
        startRound();
      }, 1000);
    }

    function chooseDifficulty(mode) {
      setDifficulty(mode);
      closeDifficultyModal();
      beginStartCountdown();
    }

    function openHomeConfirm() {
      if (!homeConfirmModal.classList.contains("open")) {
        homePausedByDialog = false;
        if (["preview", "playing", "hint"].includes(currentPhase) && !isPaused) {
          togglePause();
          homePausedByDialog = true;
        }
        homeConfirmModal.classList.add("open");
      }
    }

    function closeHomeConfirm() {
      homeConfirmModal.classList.remove("open");
      if (homePausedByDialog && isPaused && currentPhase === "paused") {
        togglePause();
      }
      homePausedByDialog = false;
    }

    function showHint() {
      if (isPreviewing || isPaused || isHinting || !targetIndexes.size || chosenCorrect.size >= targetIndexes.size) return;
      const telemetry = ensureTelemetry();
      telemetry.hintCount += 1;
      if (roundTelemetry) roundTelemetry.hintCount += 1;
      clearHintTimer();
      isHinting = true;
      currentPhase = "playing";
      roundActive = true;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(true);
      hintSecondsLeft = 5;
      const updateHintMessage = () => {
        message.textContent = `힌트입니다. 남은 정답이 깜박입니다. ${hintSecondsLeft}초 안에도 고를 수 있어요.`;
      };
      updateHintMessage();
      speakGuide("힌트입니다. 아직 고르지 않은 정답 위치가 깜박입니다. 지금 눌러도 선택됩니다.");
      renderBoard("hint");
      hintCountdownTimer = setInterval(() => {
        if (isPaused) return;
        hintSecondsLeft -= 1;
        if (hintSecondsLeft > 0) {
          updateHintMessage();
          renderBoard("hint");
          return;
        }
        clearHintTimer();
        currentPhase = "playing";
        roundActive = true;
        startButton.classList.add("is-hidden");
        startButton.disabled = true;
        hintButton.disabled = false;
        setPauseReady(true);
        const remaining = targetIndexes.size - chosenCorrect.size;
        message.textContent = `${objectTypes[targetType].label} ${remaining}개가 있던 위치를 골라주세요.`;
        speakGuide(`${objectTypes[targetType].label} ${remaining}개가 있던 위치를 골라주세요.`);
        renderBoard("hidden");
      }, 1000);
    }

    function resumeGame() {
      pauseModal.classList.remove("open");
      isPaused = false;
      currentPhase = pausedPhase || "playing";
      pausedPhase = null;
      setPauseReady(true);
      if (currentPhase === "preview") {
        isPreviewing = true;
        renderBoard("preview");
        message.textContent = `${objectTypes[targetType].label} ${targetIndexes.size}개의 위치를 기억하세요. ${previewSecondsLeft}초`;
        speakGuide("계속합니다. 위치를 기억해 주세요.");
        return;
      }
      if (currentPhase === "hint") {
        currentPhase = "playing";
        isHinting = true;
        renderBoard("hint");
        message.textContent = `힌트입니다. 남은 정답이 깜박입니다. ${hintSecondsLeft}초 안에도 고를 수 있어요.`;
        speakGuide("계속합니다. 힌트를 보고 고르셔도 괜찮아요.");
        return;
      }
      if (isHinting) {
        currentPhase = "playing";
        roundActive = true;
        renderBoard("hint");
        message.textContent = `힌트입니다. 남은 정답이 깜박입니다. ${hintSecondsLeft}초 안에도 고를 수 있어요.`;
        speakGuide("계속합니다. 힌트를 보고 고르셔도 괜찮아요.");
        return;
      }
      currentPhase = "playing";
      roundActive = true;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = false;
      const remaining = targetIndexes.size - chosenCorrect.size;
      message.textContent = `${objectTypes[targetType].label} ${remaining}개가 있던 위치를 골라주세요.`;
      speakGuide("계속합니다. 기억나는 위치를 골라주세요.");
      renderBoard("hidden");
    }

    function togglePause() {
      if (!["preview", "playing", "hint"].includes(currentPhase) && !isPaused) return;
      if (!isPaused) {
        isPaused = true;
        pausedPhase = currentPhase;
        currentPhase = "paused";
        roundActive = false;
        message.textContent = TEXT.paused;
        speakGuide("잠시 쉬는 중입니다. 계속하려면 계속하기 버튼을 눌러주세요.");
        startButton.disabled = true;
        hintButton.disabled = true;
        setPauseReady(true);
        renderBoard("hidden");
        pauseModal.classList.add("open");
        return;
      }
      resumeGame();
    }

    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      if (button.classList.contains("cell")) return;
      playButtonClickSound();
      refreshBackgroundMusic();
    }, true);

    window.addEventListener("beforeunload", () => {
      sendAbandonedResult("webview_closed");
    });

    playMusic.addEventListener("ended", () => {
      if (musicEnabled && currentMusicMode === "game") {
        startAudioTrack(playMusic, 1.5);
      }
    });

    startButton.addEventListener("click", startRound);
    hintButton.addEventListener("click", showHint);
    pauseButton.addEventListener("click", togglePause);
    resetButton.addEventListener("click", openHomeConfirm);
    introStartButton.addEventListener("click", showCheckinScreen);
    introSettingsButton.addEventListener("click", () => {
      settingsModal.classList.add("open");
      speakGuide("설정 화면입니다. 테마, 음악, 효과음, 음성 안내를 바꿀 수 있습니다.");
    });
    introHowToButton.addEventListener("click", () => {
      openTutorial("intro");
    });
    themeOpenButton.addEventListener("click", () => {
      settingsModal.classList.remove("open");
      themeModal.classList.add("open");
      speakGuide("테마를 골라주세요. 전구, 새, 휴대폰 중에서 고를 수 있습니다.");
    });
    settingsBackButton.addEventListener("click", () => {
      settingsModal.classList.remove("open");
    });
    themeBackButton.addEventListener("click", () => {
      themeModal.classList.remove("open");
      settingsModal.classList.add("open");
    });
    musicToggleButton.addEventListener("click", () => {
      musicEnabled = !musicEnabled;
      syncAudioButtons();
      refreshBackgroundMusic();
    });
    effectToggleButton.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      syncAudioButtons();
      playButtonClickSound();
    });
    voiceToggleButton.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      if (!voiceEnabled) {
        stopVoiceGuide();
      }
      syncAudioButtons();
      speakGuide(voiceEnabled ? "음성 안내를 켰습니다." : "");
    });
    themeOptionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeOption);
        themeModal.classList.remove("open");
        settingsModal.classList.add("open");
        speakGuide(`${objectTypes.yellow.label} 테마로 바꾸었습니다.`);
      });
    });
    moodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        todayMood = button.dataset.mood;
        updateCheckinButtons();
        speakGuide(`오늘 기분은 ${todayMood}으로 선택했습니다.`);
      });
    });
    if (sleepUpButton) {
      sleepUpButton.addEventListener("click", () => changeSleepHour(1));
    }
    if (sleepDownButton) {
      sleepDownButton.addEventListener("click", () => changeSleepHour(-1));
    }
    checkinNextButton.addEventListener("click", () => {
      if (!todayMood || !sleepTime) return;
      showDifficultyScreen();
    });
    postMoodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        postMood = button.dataset.postMood;
        updatePostGameButtons();
      });
    });
    postDifficultyButtons.forEach((button) => {
      button.addEventListener("click", () => {
        postDifficulty = button.dataset.postDifficulty;
        updatePostGameButtons();
      });
    });
    postFatigueButtons.forEach((button) => {
      button.addEventListener("click", () => {
        postFatigue = button.dataset.postFatigue;
        updatePostGameButtons();
      });
    });
    postHelpButtons.forEach((button) => {
      button.addEventListener("click", () => {
        postHelpNeeded = button.dataset.postHelp;
        updatePostGameButtons();
      });
    });
    postReplayButtons.forEach((button) => {
      button.addEventListener("click", () => {
        postReplayWanted = button.dataset.postReplay;
        updatePostGameButtons();
      });
    });
    postGameNextButton.addEventListener("click", () => {
      if (postGameNextButton.disabled) return;
      if (postGamePage === 1) {
        postGamePage = 2;
        updatePostGameButtons();
        speakGuide("마지막으로 도움이 필요했는지와 다시 하고 싶은지 알려주세요.");
        return;
      }
      completePostGameAndExit();
    });
    skipTutorialButton.addEventListener("click", () => {
      closeTutorial();
    });
    tutorialNextButton.addEventListener("click", nextTutorialStep);
    howToButton.addEventListener("click", () => {
      openTutorial("pause");
    });
    resumeButton.addEventListener("click", resumeGame);
    exitButton.addEventListener("click", () => {
      sendAbandonedResult("user_exit");
      pauseModal.classList.remove("open");
      resetToHome();
      showIntroScreen();
    });
    pauseMusicButton.addEventListener("click", () => {
      musicEnabled = !musicEnabled;
      syncAudioButtons();
      refreshBackgroundMusic();
    });
    pauseEffectButton.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      syncAudioButtons();
      playButtonClickSound();
    });
    pauseVoiceButton.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      if (!voiceEnabled) {
        stopVoiceGuide();
      }
      syncAudioButtons();
      speakGuide(voiceEnabled ? "음성 안내를 켰습니다." : "");
    });
    startDifficultyButtons.forEach((button) => {
      button.addEventListener("click", () => chooseDifficulty(button.dataset.startDifficulty));
    });
    homeYesButton.addEventListener("click", () => {
      sendAbandonedResult("home_confirm");
      homeConfirmModal.classList.remove("open");
      resetToHome();
      showIntroScreen();
    });
    homeNoButton.addEventListener("click", closeHomeConfirm);

    applyTheme(currentTheme);
    syncAudioButtons();
    setDifficulty(currentDifficulty);
    difficultyModal.classList.remove("open");
    setTimeout(() => {
      loadingScreen.classList.add("is-hidden");
      sendGameMessage({ type: "GAME_READY" });
      showIntroScreen();
    }, 900);
