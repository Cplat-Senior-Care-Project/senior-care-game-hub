    const IMAGES = {"off":"../../assets/images/image-02-6e6b97b5.png","yellow":"../../assets/images/image-03-b8c398ec.png","flower":"../../assets/images/image-04-5ed55c22.png"};
    const TEXT = {"lang":"마다","title":"빛나는 전구를 찾아라","startIntro":"난이도를 고르면 곧바로 시작됩니다.","start":"시작하기","next":"다음 문제","reset":"홈으로","level":"난이도","high":"HARD","middle":"NORMAL","low":"EASY","choose":"골라주세요.","selecting":"선택","correct":"정답입니다.","wrong":"잘 찾아 보세요. 기억하실 수 있을 거예요.","done":"정말 잘하셨어요.","yellow":"빛나는 전구","offBulb":"불이 꺼진 전구","flower":"무궁화","objectBase":"등장 오브젝트: 불이 꺼진 전구, 빛나는 전구","objectOne":"6번째부터 무궁화가 나와요.","remaining":"남은 개수","round":"진행","time":"남은 시간","pause":"일시정지","resume":"계속하기","restart":"다시 시작하기","paused":"잠시 쉬는 중입니다.","timeUp":"괜찮아요. 다음 문제로 천천히 이어가볼게요.","final":"오늘은 위치 기억활동을 했어요. 끝까지 함께해 주셔서 감사합니다.","chooseDifficulty":"난이도를 골라주세요.","homeConfirm":"초기 화면으로 가시겠습니까?","yes":"네","no":"아니오","wrongLimit":"괜찮아요. 다음 문제로 천천히 넘어가볼게요.","wrongLimitFinal":"괜찮아요. 결과화면으로 넘어가겠습니다."};

    const svgData = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    const THEME_IMAGES = {
      bulb: {
        label: TEXT.yellow,
        offLabel: TEXT.offBulb,
        on: "../../assets/images/bulb-on-fit.png",
        off: "../../assets/images/bulb-off-fit.png",
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
    THEME_IMAGES.bird.on = "../../assets/images/image-05-5aebd85a.png";
    THEME_IMAGES.bird.off = THEME_IMAGES.bird.on;
    // END custom bird theme image


    const difficultySettings = {
      high: { label: TEXT.high, gridSize: 4, targetCount: 4, totalTimeLimitSec: 360 },
      medium: { label: TEXT.middle, gridSize: 3, targetCount: 3, totalTimeLimitSec: 480 },
      low: { label: TEXT.low, gridSize: 2, targetCount: 2, totalTimeLimitSec: 600 },
    };
    const baseDifficultySettings = JSON.parse(JSON.stringify(difficultySettings));

    const mergeGameConfig = (baseConfig, fileConfig) => ({
      ...baseConfig,
      ...fileConfig,
      config: {
        ...(baseConfig.config || {}),
        ...(fileConfig.config || {}),
      },
    });

    function normalizeGameConfigFile(rawConfig) {
      const runtimeConfig = rawConfig.runtimeConfig || {};
      const directConfig = rawConfig.config || {};
      const normalized = {
        ...rawConfig,
        config: {
          ...directConfig,
          ...runtimeConfig,
        },
      };
      delete normalized.runtimeConfig;
      delete normalized.runtimeConfigNote;
      return normalized;
    }

    function parseGameConfigText(configText) {
      try {
        return JSON.parse(configText);
      } catch (error) {
        const normalizedText = configText.replace(/(:\s*)(True|False)(?=\s*[,}])/g, (_match, prefix, value) => {
          return `${prefix}${value.toLowerCase()}`;
        });
        return JSON.parse(normalizedText);
      }
    }

    function loadGameConfig() {
      const inlineConfig = window.__GAME_CONFIG__ || {};
      try {
        const request = new XMLHttpRequest();
        request.open("GET", `config/game.config.json?v=${Date.now()}`, false);
        request.overrideMimeType("application/json");
        request.send(null);

        const hasResponse = request.responseText && request.responseText.trim();
        const isOk = (request.status >= 200 && request.status < 300) || (request.status === 0 && hasResponse);
        if (!isOk || !hasResponse) return inlineConfig;

        return mergeGameConfig(inlineConfig, normalizeGameConfigFile(parseGameConfigText(request.responseText)));
      } catch (error) {
        console.warn("Could not load config/game.config.json. Using inline game config.", error);
        return inlineConfig;
      }
    }

    const defaultGameConfig = loadGameConfig();
    const MODE_DEFAULTS = {
      standard: {
        difficulty: "easy",
        show_timer: true,
        show_score: true,
        show_difficulty_select: true,
        show_settings: true,
        show_how_to_play: true,
        show_condition_check: true,
        show_finish_check: true,
        question_count: 10,
        exposure_time_ms: 5000,
        round_time_limit_sec: 0,
        hint_enabled: true,
        auto_hint_enabled: false,
        auto_start: false,
        auto_return: false,
        soft_feedback: false,
        voice_guide_enabled: true,
        flash_effect_level: "standard",
        high_contrast: false,
        result_log_level: "standard",
      },
      reminder: {
        difficulty: "normal",
        show_timer: true,
        show_score: true,
        show_difficulty_select: false,
        show_settings: true,
        show_how_to_play: true,
        show_condition_check: false,
        show_finish_check: false,
        question_count: 5,
        exposure_time_ms: 5000,
        round_time_limit_sec: 0,
        total_time_limit_sec: 480,
        hint_enabled: true,
        auto_hint_enabled: false,
        auto_start: true,
        auto_return: true,
        soft_feedback: false,
        voice_guide_enabled: true,
        flash_effect_level: "standard",
        high_contrast: false,
        result_log_level: "summary",
      },
      care: {
        difficulty: "easy",
        show_timer: false,
        show_score: false,
        show_difficulty_select: false,
        show_settings: false,
        show_how_to_play: false,
        show_condition_check: false,
        show_finish_check: false,
        question_count: 4,
        grid_rows: 2,
        grid_cols: 2,
        target_count: 1,
        exposure_time_ms: 8000,
        round_time_limit_sec: 0,
        total_time_limit_sec: 180,
        hint_enabled: true,
        auto_hint_enabled: true,
        auto_hint_delay_sec: 40,
        auto_start: false,
        auto_return: true,
        soft_feedback: true,
        voice_guide_enabled: true,
        flash_effect_level: "low",
        high_contrast: true,
        result_log_level: "detailed",
      },
      ai_assisted: {
        difficulty: "easy",
        show_timer: false,
        show_score: false,
        show_difficulty_select: false,
        show_settings: false,
        show_how_to_play: false,
        show_condition_check: false,
        show_finish_check: false,
        question_count: 4,
        grid_rows: 2,
        grid_cols: 2,
        target_count: 1,
        exposure_time_ms: 8000,
        round_time_limit_sec: 0,
        hint_enabled: true,
        auto_hint_enabled: true,
        auto_hint_delay_sec: 40,
        total_time_limit_sec: 180,
        auto_start: false,
        auto_return: true,
        soft_feedback: true,
        voice_guide_enabled: true,
        flash_effect_level: "low",
        high_contrast: true,
        result_log_level: "detailed",
      },
    };
    const normalizeMode = (mode) => (MODE_DEFAULTS[mode] ? mode : "standard");
    let gameMode = normalizeMode(defaultGameConfig.mode || "standard");
    const appliedGameConfig = {
      ...MODE_DEFAULTS[gameMode],
      ...(defaultGameConfig.config || {}),
      mode: gameMode,
    };
    const difficultyMap = { easy: "low", normal: "medium", hard: "high", low: "low", medium: "medium", high: "high" };
    let defaultDifficultyKey = difficultyMap[defaultGameConfig.difficulty || appliedGameConfig.difficulty] || "low";

    if (appliedGameConfig.grid_rows && appliedGameConfig.grid_cols) {
      difficultySettings.low.gridSize = Math.max(2, Number(appliedGameConfig.grid_rows));
    }
    if (appliedGameConfig.target_count) {
      difficultySettings.low.targetCount = Math.max(1, Number(appliedGameConfig.target_count));
    }

    const tutorialSteps = [
      {
        title: "인지 훈련 게임입니다.",
        text: "빛나는 위치를 기억하고 다시 찾는 위치 기억활동입니다.",
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
    const loadingProgressFill = document.getElementById("loadingProgressFill");
    const loadingProgressText = document.getElementById("loadingProgressText");
    const loadingProgressBar = loadingProgressFill ? loadingProgressFill.closest(".loading-bar") : null;
    let loadingProgressValue = 0;
    let loadingProgressTimer = null;

    function setLoadingProgress(percent) {
      loadingProgressValue = Math.max(0, Math.min(100, Math.round(percent)));
      if (loadingProgressFill) loadingProgressFill.style.width = `${loadingProgressValue}%`;
      if (loadingProgressText) loadingProgressText.textContent = `게임을 준비하고 있어요 ${loadingProgressValue}%`;
      if (loadingProgressBar) loadingProgressBar.setAttribute("aria-valuenow", String(loadingProgressValue));
    }

    function startLoadingProgress() {
      setLoadingProgress(0);
      loadingProgressTimer = setInterval(() => {
        if (loadingProgressValue >= 96) return;
        setLoadingProgress(loadingProgressValue + Math.max(1, Math.ceil((96 - loadingProgressValue) / 12)));
      }, 80);
    }

    function finishLoadingProgress(callback) {
      clearInterval(loadingProgressTimer);
      setLoadingProgress(100);
      setTimeout(callback, 180);
    }

    startLoadingProgress();
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
    const introExitButton = document.getElementById("introExitButton");
    const themeOpenButton = document.getElementById("themeOpenButton");
    const musicToggleButton = document.getElementById("musicToggleButton");
    const effectToggleButton = document.getElementById("effectToggleButton");
    const voiceToggleButton = document.getElementById("voiceToggleButton");
    const settingsVolumeControls = document.getElementById("settingsVolumeControls");
    const pauseVolumeControls = document.getElementById("pauseVolumeControls");
    const musicVolumeSlider = document.getElementById("musicVolumeSlider");
    const effectVolumeSlider = document.getElementById("effectVolumeSlider");
    const voiceVolumeSlider = document.getElementById("voiceVolumeSlider");
    const pauseMusicVolumeSlider = document.getElementById("pauseMusicVolumeSlider");
    const pauseEffectVolumeSlider = document.getElementById("pauseEffectVolumeSlider");
    const pauseVoiceVolumeSlider = document.getElementById("pauseVoiceVolumeSlider");
    const musicVolumeValue = document.getElementById("musicVolumeValue");
    const effectVolumeValue = document.getElementById("effectVolumeValue");
    const voiceVolumeValue = document.getElementById("voiceVolumeValue");
    const pauseMusicVolumeValue = document.getElementById("pauseMusicVolumeValue");
    const pauseEffectVolumeValue = document.getElementById("pauseEffectVolumeValue");
    const pauseVoiceVolumeValue = document.getElementById("pauseVoiceVolumeValue");
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
    const postGameSkipButton = document.getElementById("postGameSkipButton");
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
    levelText.closest(".stat").classList.add("level-stat");
    remainText.closest(".stat").classList.add("remain-stat");
    roundText.closest(".stat").classList.add("round-stat");
    const timeStat = timeText.closest(".stat");
    timeStat.classList.add("time-stat");
    timeStat.innerHTML = "";
    const totalTimeLabel = document.createElement("span");
    totalTimeLabel.textContent = "전체 문항 남은 시간";
    timeText.textContent = "";
    timeText.setAttribute("aria-label", "전체 문항 남은 시간");
    timeStat.append(totalTimeLabel, timeText);
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

    let currentDifficulty = defaultDifficultyKey;
    let boardItems = [];
    let targetType = "yellow";
    let targetIndexes = new Set();
    let chosenCorrect = new Set();
    let chosenWrong = new Set();
    let chosenWrongTypes = new Map();
    let roundActive = false;
    let previewTimer = null;
    let previewCountdownTimer = null;
    let hintTimer = null;
    let hintCountdownTimer = null;
    let roundTimer = null;
    let totalTimer = null;
    let totalTimeLeft = 0;
    let betweenTimer = null;
    let autoReturnTimer = null;
    let autoReturnSequence = 0;
    let startCountdownSecondsLeft = 0;
    let isPreviewing = false;
    let isHinting = false;
    let isPaused = false;
    let pausedPhase = null;
    let homePausedByDialog = false;
    let currentTheme = "bulb";
    let musicEnabled = true;
    let soundEnabled = true;
    let voiceEnabled = appliedGameConfig.voice_guide_enabled !== false;
    let musicVolume = normalizeVolume(appliedGameConfig.music_volume ?? appliedGameConfig.musicVolume, 0.72);
    let soundVolume = normalizeVolume(appliedGameConfig.effect_volume ?? appliedGameConfig.effectVolume ?? appliedGameConfig.sound_volume ?? appliedGameConfig.soundVolume, 1);
    let voiceVolume = normalizeVolume(appliedGameConfig.voice_volume ?? appliedGameConfig.voiceVolume, 1);
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
    let timeLeft = Math.max(0, Number(appliedGameConfig.round_time_limit_sec) || 0);
    let previewSecondsLeft = Math.max(1, Math.round((Number(appliedGameConfig.exposure_time_ms) || 5000) / 1000));
    let hintSecondsLeft = 5;
    let maxRounds = Math.max(1, Number(appliedGameConfig.question_count) || 10);
    let roundTimeLimit = Math.max(0, Number(appliedGameConfig.round_time_limit_sec) || 0);
    let autoReturnDelayMs = Math.max(0, Number(appliedGameConfig.auto_return_delay_ms) || 0);
    let autoReturnFallbackDelayMs = Math.max(autoReturnDelayMs, 3500);
    const urlParams = new URLSearchParams(window.location.search);
    const queryReturnUrl = urlParams.get("auto_return_url") || urlParams.get("return_url");
    let configuredHubReturnUrl =
      queryReturnUrl ||
      appliedGameConfig.return_url ||
      appliedGameConfig.auto_return_url ||
      "file:///C:/Users/juhye/OneDrive/Desktop/senior-care-game-hub/index.html";
    const gameSchemaVersion = "1.0.0";
    let gameSessionId = defaultGameConfig.sessionId || `local-${Date.now()}`;
    let gameTelemetry = null;
    let roundTelemetry = null;
    let roundClosed = false;
    let lastRuntimeConfigSignature = JSON.stringify(defaultGameConfig);
    const BUTTON_CLICK_SOUND_SRC = "../../assets/audio/audio-01-7e204aa7.mp3";
    const BOARD_SELECT_SOUND_SRC = "../../assets/audio/board-select.mp3";
    const INTRO_MUSIC_SRC = "../../assets/audio/audio-02-7642c099.mp3";
    const PLAY_MUSIC_SRC = "../../assets/audio/audio-03-e0e7d5be.mp3";
    const STANDARD_VOICE_BASE = "../../assets/audio/voice/standard/";
    const VOICE_CLIPS = {
      settings: `${STANDARD_VOICE_BASE}settings.mp3`,
      themeSelect: `${STANDARD_VOICE_BASE}theme-select.mp3`,
      tutorialIntro: `${STANDARD_VOICE_BASE}tutorial-intro.mp3`,
      tutorialPreview: `${STANDARD_VOICE_BASE}tutorial-preview.mp3`,
      tutorialChoose: `${STANDARD_VOICE_BASE}tutorial-choose.mp3`,
      tutorialHint: `${STANDARD_VOICE_BASE}tutorial-hint.mp3`,
      tutorialTotal: `${STANDARD_VOICE_BASE}tutorial-total.mp3`,
      skipTutorial: `${STANDARD_VOICE_BASE}skip-tutorial.mp3`,
      preCheckin: `${STANDARD_VOICE_BASE}pre-checkin.mp3`,
      skipPreCheckin: `${STANDARD_VOICE_BASE}skip-pre-checkin.mp3`,
      pause: `${STANDARD_VOICE_BASE}pause.mp3`,
      difficultySelect: `${STANDARD_VOICE_BASE}difficulty-select.mp3`,
      resume: `${STANDARD_VOICE_BASE}resume.mp3`,
      gameStartCountdown: `${STANDARD_VOICE_BASE}game-start-countdown.mp3`,
      hint: `${STANDARD_VOICE_BASE}hint.mp3`,
      correct: `${STANDARD_VOICE_BASE}correct.mp3`,
      encourage: `${STANDARD_VOICE_BASE}encourage.mp3`,
      nextRound: `${STANDARD_VOICE_BASE}next-round.mp3`,
      resultScreen: `${STANDARD_VOICE_BASE}result-screen.mp3`,
      finishThanks: `${STANDARD_VOICE_BASE}finish-thanks.mp3`,
      targetBulbRemember: `${STANDARD_VOICE_BASE}target-bulb-remember.mp3`,
      targetBulbChoose: `${STANDARD_VOICE_BASE}target-bulb-choose.mp3`,
      targetBirdRemember: `${STANDARD_VOICE_BASE}target-bird-remember.mp3`,
      targetBirdChoose: `${STANDARD_VOICE_BASE}target-bird-choose.mp3`,
      targetPhoneRemember: `${STANDARD_VOICE_BASE}target-phone-remember.mp3`,
      targetPhoneChoose: `${STANDARD_VOICE_BASE}target-phone-choose.mp3`,
      targetFlowerRemember: `${STANDARD_VOICE_BASE}target-flower-remember.mp3`,
      targetFlowerChoose: `${STANDARD_VOICE_BASE}target-flower-choose.mp3`,
    };
    const buttonClickSound = new Audio(BUTTON_CLICK_SOUND_SRC);
    buttonClickSound.preload = "auto";
    buttonClickSound.volume = soundVolume;
    const introMusic = new Audio(INTRO_MUSIC_SRC);
    introMusic.preload = "auto";
    introMusic.loop = true;
    introMusic.volume = musicVolume;
    const playMusic = new Audio(PLAY_MUSIC_SRC);
    playMusic.preload = "auto";
    playMusic.loop = false;
    playMusic.volume = musicVolume;
    const voiceClipAudio = new Audio();
    voiceClipAudio.preload = "auto";
    voiceClipAudio.volume = voiceVolume;
    let currentMusicMode = "";
    let autoStartConsumed = false;

    function normalizeVolume(value, fallback = 1) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return Math.min(1, Math.max(0, fallback));
      const normalized = parsed > 1 ? parsed / 100 : parsed;
      return Math.min(1, Math.max(0, normalized));
    }

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
        guideText.textContent = `4 x 4 격자에서\n${setting.targetCount}개를 찾아요.\n\n${TEXT.objectOne}`;
        return;
      }
      guideText.textContent = `${setting.gridSize} x ${setting.gridSize} 격자에서\n${objectTypes.yellow.label} ${setting.targetCount}개를 찾아요.`;
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
      if (postGameSkipButton) postGameSkipButton.textContent = postGamePage === 1 ? "건너뛰기" : "이전";
      postGameNextButton.textContent = postGamePage === 1 ? "다음" : "완료";
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
        .replace(/10\s*번째/g, "열 번째")
        .replace(/갈게요/g, "갈께요");
    }

    function playVoiceClip(voiceKey, fallbackText = "", interrupt = true) {
      if (!voiceEnabled) return;
      const src = VOICE_CLIPS[voiceKey];
      if (!src) {
        if (fallbackText) speakGuide(fallbackText, interrupt);
        return;
      }
      try {
        if (interrupt) stopVoiceGuide();
        voiceClipAudio.pause();
        voiceClipAudio.currentTime = 0;
        voiceClipAudio.src = src;
        voiceClipAudio.play().catch(() => {});
      } catch (error) {
        if (fallbackText) speakGuide(fallbackText, interrupt);
      }
    }

    function playVoiceClipAndWait(voiceKey, fallbackText = "", interrupt = true) {
      return new Promise((resolve) => {
        if (!voiceEnabled) {
          resolve();
          return;
        }

        const src = VOICE_CLIPS[voiceKey];
        if (!src) {
          if (fallbackText) {
            speakGuideAndWait(fallbackText, interrupt).then(resolve);
            return;
          }
          resolve();
          return;
        }

        let settled = false;
        let fallbackTimer = null;
        const cleanup = () => {
          voiceClipAudio.removeEventListener("ended", finish);
          voiceClipAudio.removeEventListener("error", finish);
          if (fallbackTimer) clearTimeout(fallbackTimer);
        };
        const finish = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };

        try {
          if (interrupt) stopVoiceGuide();
          voiceClipAudio.pause();
          voiceClipAudio.currentTime = 0;
          voiceClipAudio.src = src;
          voiceClipAudio.addEventListener("ended", finish, { once: true });
          voiceClipAudio.addEventListener("error", finish, { once: true });
          fallbackTimer = setTimeout(finish, 12000);
          const playPromise = voiceClipAudio.play();
          if (playPromise?.catch) playPromise.catch(finish);
        } catch (error) {
          cleanup();
          if (fallbackText) {
            speakGuideAndWait(fallbackText, interrupt).then(resolve);
            return;
          }
          resolve();
        }
      });
    }

    function targetVoiceObjectKey() {
      if (targetType === "flower") return "Flower";
      if (currentTheme === "bird") return "Bird";
      if (currentTheme === "phone") return "Phone";
      return "Bulb";
    }

    function getVoiceClipKey(text) {
      const value = String(text || "");
      if (value.includes("설정 화면입니다")) return "settings";
      if (value.includes("테마를 골라주세요")) return "themeSelect";
      if (value.includes("게임을 시작하기 전에 오늘의 기분과 수면시간")) return "preCheckin";
      if (value.includes("난이도를 골라주세요")) return "difficultySelect";
      if (value.includes("잠시 쉬는 중입니다") || value.includes("일시정지 화면입니다")) return "pause";
      if (value.includes("계속합니다")) return "resume";
      if (value.includes("3초 후 게임이 시작됩니다") || value.includes("3초후 게임이 시작됩니다")) return "gameStartCountdown";
      if (value.includes("힌트입니다")) return "hint";
      if (value.includes("정답입니다") || value.includes("좋아요. 천천히")) return "correct";
      if (value.includes("잘 찾아") || value.includes("기억하실 수 있을 거예요")) return "encourage";
      if (value.includes("결과 화면으로 갈") || value.includes("결과 화면으로 이동") || value.includes("결과화면으로 넘어")) return "resultScreen";
      if (value.includes("수고하셨습니다")) return "finishThanks";
      if (value.includes("다음 문제로 갈") || value.includes("다음 문제로 넘어갑니다") || value.includes("다음 문제로 천천히")) return "nextRound";
      if (value.includes("위치를 기억") || value.includes("위치의 기억")) return `target${targetVoiceObjectKey()}Remember`;
      if ((value.includes("위치를") || value.includes("위치가") || value.includes("위치")) && value.includes("골라주세요")) return `target${targetVoiceObjectKey()}Choose`;
      return "";
    }

    function speakGuide(text, interrupt = true) {
      if (!voiceEnabled || !text) return;
      const voiceKey = getVoiceClipKey(text);
      if (voiceKey) {
        playVoiceClip(voiceKey, "", interrupt);
        return;
      }
      if (!("speechSynthesis" in window)) return;
      const cleanText = normalizeVoiceText(text).replace(/[_<>]/g, "").replace(/\s+/g, " ").trim();
      if (!cleanText) return;
      if (interrupt) stopVoiceGuide();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "ko-KR";
      utterance.rate = 0.86;
      utterance.pitch = 1;
      utterance.volume = voiceVolume;
      window.speechSynthesis.speak(utterance);
    }

    function speakGuideAndWait(text, interrupt = true) {
      return new Promise((resolve) => {
        if (!voiceEnabled || !text) {
          resolve();
          return;
        }
        const voiceKey = getVoiceClipKey(text);
        if (voiceKey) {
          playVoiceClipAndWait(voiceKey, "", interrupt).then(resolve);
          return;
        }
        if (!("speechSynthesis" in window)) {
          resolve();
          return;
        }
        const cleanText = normalizeVoiceText(text).replace(/[_<>]/g, "").replace(/\s+/g, " ").trim();
        if (!cleanText) {
          resolve();
          return;
        }

        let settled = false;
        let fallbackTimer = null;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          resolve();
        };

        if (interrupt) stopVoiceGuide();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "ko-KR";
        utterance.rate = 0.86;
        utterance.pitch = 1;
        utterance.volume = voiceVolume;
        utterance.onend = finish;
        utterance.onerror = finish;
        fallbackTimer = setTimeout(finish, 12000);
        window.speechSynthesis.speak(utterance);
      });
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
      try {
        voiceClipAudio.pause();
        voiceClipAudio.currentTime = 0;
      } catch (error) {
        // Ignore audio cleanup failures in restricted WebViews.
      }
    }

    function playEffectSound(src) {
      if (!soundEnabled) return;
      try {
        const sound = new Audio(src);
        sound.volume = soundVolume;
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
        session_id: gameSessionId,
        content_id: defaultGameConfig.contentId || defaultGameConfig.content_id || "memory_light_bulb_001",
        assignment_id: defaultGameConfig.assignmentId || defaultGameConfig.assignment_id || "",
        senior_id: defaultGameConfig.seniorId || defaultGameConfig.senior_id || "",
        guardian_id: defaultGameConfig.guardianId || defaultGameConfig.guardian_id || "",
        game_key: defaultGameConfig.gameKey || defaultGameConfig.game_key || "light_memory",
        mode: gameMode,
        difficulty: defaultGameConfig.difficulty || appliedGameConfig.difficulty,
        config_snapshot: appliedGameConfig,
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
        difficulty: defaultGameConfig.difficulty || appliedGameConfig.difficulty,
        config_snapshot: appliedGameConfig,
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
        question_id: `q${roundNo}`,
        question_type: "position_memory",
        cognitive_domain: "memory_activity",
        prompt_type: "image",
        targetType,
        targetCount: targetIndexes.size,
        gridSize: difficultySettings[currentDifficulty].gridSize,
        exposure_time_ms: Number(appliedGameConfig.exposure_time_ms) || 5000,
        targetPositions: [...targetIndexes].map((index) => {
          const gridSize = difficultySettings[currentDifficulty].gridSize;
          return `r${Math.floor(index / gridSize) + 1}c${(index % gridSize) + 1}`;
        }),
        selectedPositions: [],
        startedAt: Date.now(),
        correctClickCount: 0,
        wrongClickCount: 0,
        hintCount: 0,
        inputType: "touch",
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
        response_time_ms: durationMs,
      });
    }

    function buildQuestionLogs(rounds) {
      return rounds.map((round) => ({
        question_id: round.question_id || `q${round.roundNo}`,
        question_type: round.question_type || "position_memory",
        cognitive_domain: round.cognitive_domain || "memory_activity",
        difficulty: defaultGameConfig.difficulty || appliedGameConfig.difficulty,
        prompt_type: round.prompt_type || "image",
        grid_rows: round.gridSize,
        grid_cols: round.gridSize,
        target_count: round.targetCount,
        exposure_time_ms: round.exposure_time_ms,
        target_positions: round.targetPositions || [],
        selected_positions: round.selectedPositions || [],
        is_correct: round.correct,
        attempt_count: round.correctClickCount + round.wrongClickCount,
        hint_used: round.hintCount > 0,
        hint_count: round.hintCount,
        replay_count: 0,
        response_time_ms: round.response_time_ms || round.durationMs,
        first_response_time_ms: round.firstResponseTimeMs || null,
        changed_answer_count: 0,
        wrong_tap_count: round.wrongClickCount,
        drag_fail_count: 0,
        input_type: round.inputType || "touch",
      }));
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
        session_id: gameSessionId,
        content_id: defaultGameConfig.contentId || defaultGameConfig.content_id || "memory_light_bulb_001",
        game_key: defaultGameConfig.gameKey || defaultGameConfig.game_key || "light_memory",
        mode: gameMode,
        difficulty: defaultGameConfig.difficulty || appliedGameConfig.difficulty,
        config_snapshot: appliedGameConfig,
        started_at: telemetry.startedAt,
        ended_at: endedAt,
        duration_ms: telemetry.durationMs,
        total_elapsed_ms: totalElapsedMs,
        total_questions: telemetry.roundTotal,
        correct_count: telemetry.correctRoundCount,
        wrong_count: telemetry.failedRoundCount,
        hint_count: telemetry.hintCount,
        retry_count: 0,
        avg_response_time_ms: telemetry.playedRoundCount ? Math.round(telemetry.durationMs / telemetry.playedRoundCount) : 0,
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
        question_logs: buildQuestionLogs(telemetry.rounds),
        result_detail_json: {
          grid_size: `${difficultySettings[currentDifficulty].gridSize}x${difficultySettings[currentDifficulty].gridSize}`,
          target_count: difficultySettings[currentDifficulty].targetCount,
          max_target_count: difficultySettings[currentDifficulty].targetCount,
          exposure_time_ms: Number(appliedGameConfig.exposure_time_ms) || 5000,
          flash_effect_level: appliedGameConfig.flash_effect_level,
          near_miss_count: 0,
          replay_count: 0,
          difficulty_downshifted: false,
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
      playEffectSound(BOARD_SELECT_SOUND_SRC);
    }

    function playWrongSound() {
      playEffectSound(BOARD_SELECT_SOUND_SRC);
    }

    function stopBackgroundMusic() {
      introMusic.pause();
      playMusic.pause();
    }

    function applyAudioVolumes() {
      buttonClickSound.volume = soundVolume;
      voiceClipAudio.volume = voiceVolume;
      introMusic.volume = musicVolume;
      playMusic.volume = musicVolume;
    }

    function startAudioTrack(track, startAt = 0) {
      if (!musicEnabled) return;
      track.volume = musicVolume;
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

    function syncVolumeControls() {
      const groups = [
        {
          volume: musicVolume,
          sliders: [musicVolumeSlider, pauseMusicVolumeSlider],
          values: [musicVolumeValue, pauseMusicVolumeValue],
        },
        {
          volume: soundVolume,
          sliders: [effectVolumeSlider, pauseEffectVolumeSlider],
          values: [effectVolumeValue, pauseEffectVolumeValue],
        },
        {
          volume: voiceVolume,
          sliders: [voiceVolumeSlider, pauseVoiceVolumeSlider],
          values: [voiceVolumeValue, pauseVoiceVolumeValue],
        },
      ];

      groups.forEach(({ volume, sliders, values }) => {
        const percentNumber = Math.round(normalizeVolume(volume) * 100);
        const percentText = `${percentNumber}%`;
        sliders.forEach((slider) => {
          if (!slider) return;
          slider.value = String(percentNumber);
          slider.setAttribute("aria-valuetext", percentText);
        });
        values.forEach((valueElement) => {
          if (valueElement) valueElement.textContent = percentText;
        });
      });
    }

    function syncAudioButtons() {
      musicToggleButton.textContent = musicEnabled ? "음악 On" : "음악 Off";
      pauseMusicButton.textContent = musicEnabled ? "음악 On" : "음악 Off";
      effectToggleButton.textContent = soundEnabled ? "효과음 On" : "효과음 Off";
      pauseEffectButton.textContent = soundEnabled ? "효과음 On" : "효과음 Off";
      voiceToggleButton.textContent = voiceEnabled ? "음성안내 On" : "음성안내 Off";
      pauseVoiceButton.textContent = voiceEnabled ? "음성안내 On" : "음성안내 Off";
      musicToggleButton.setAttribute("aria-pressed", String(musicEnabled));
      pauseMusicButton.setAttribute("aria-pressed", String(musicEnabled));
      effectToggleButton.setAttribute("aria-pressed", String(soundEnabled));
      pauseEffectButton.setAttribute("aria-pressed", String(soundEnabled));
      voiceToggleButton.setAttribute("aria-pressed", String(voiceEnabled));
      pauseVoiceButton.setAttribute("aria-pressed", String(voiceEnabled));
      syncVolumeControls();
    }

    function setElementVisible(element, visible) {
      if (!element) return;
      element.hidden = !visible;
      element.classList.toggle("mode-hidden", !visible);
    }

    function syncRuntimeConfig(nextDefaultConfig = defaultGameConfig) {
      const nextMode = normalizeMode(nextDefaultConfig.mode || gameMode);
      const nextAppliedConfig = {
        ...MODE_DEFAULTS[nextMode],
        ...(nextDefaultConfig.config || {}),
        mode: nextMode,
      };

      Object.keys(defaultGameConfig).forEach((key) => delete defaultGameConfig[key]);
      Object.assign(defaultGameConfig, nextDefaultConfig);
      Object.keys(appliedGameConfig).forEach((key) => delete appliedGameConfig[key]);
      Object.assign(appliedGameConfig, nextAppliedConfig);

      gameMode = nextMode;
      defaultDifficultyKey = difficultyMap[defaultGameConfig.difficulty || appliedGameConfig.difficulty] || "low";
      Object.keys(baseDifficultySettings).forEach((key) => {
        difficultySettings[key] = { ...baseDifficultySettings[key] };
      });
      if (appliedGameConfig.grid_rows && appliedGameConfig.grid_cols) {
        difficultySettings.low.gridSize = Math.max(2, Number(appliedGameConfig.grid_rows));
      }
      if (appliedGameConfig.target_count) {
        difficultySettings.low.targetCount = Math.max(1, Number(appliedGameConfig.target_count));
      }
      maxRounds = Math.max(1, Number(appliedGameConfig.question_count) || 10);
      roundTimeLimit = Math.max(0, Number(appliedGameConfig.round_time_limit_sec) || 0);
      autoReturnDelayMs = Math.max(0, Number(appliedGameConfig.auto_return_delay_ms) || 0);
      autoReturnFallbackDelayMs = Math.max(autoReturnDelayMs, 3500);
      configuredHubReturnUrl =
        queryReturnUrl ||
        appliedGameConfig.return_url ||
        appliedGameConfig.auto_return_url ||
        configuredHubReturnUrl;

      if (currentPhase === "home" || currentPhase === "result" || currentPhase === "postgame") {
        timeLeft = roundTimeLimit;
      }
      if (currentPhase === "home") {
        setDifficulty(defaultDifficultyKey);
        if (checkinModal.classList.contains("open") && !appliedGameConfig.show_condition_check) {
          showDifficultyScreen();
        } else if (difficultyModal.classList.contains("open") && appliedGameConfig.show_condition_check) {
          showCheckinScreen();
        } else if (difficultyModal.classList.contains("open") && !appliedGameConfig.show_difficulty_select) {
          showDifficultyScreen();
        }
      }

      voiceEnabled = appliedGameConfig.voice_guide_enabled !== false;
      musicVolume = normalizeVolume(appliedGameConfig.music_volume ?? appliedGameConfig.musicVolume, musicVolume);
      soundVolume = normalizeVolume(appliedGameConfig.effect_volume ?? appliedGameConfig.effectVolume ?? appliedGameConfig.sound_volume ?? appliedGameConfig.soundVolume, soundVolume);
      voiceVolume = normalizeVolume(appliedGameConfig.voice_volume ?? appliedGameConfig.voiceVolume, voiceVolume);

      applyModeUi();
      applyAudioVolumes();
      syncAudioButtons();
      updateRoundDisplay();
      updateRemaining();
      updateTimeDisplay();
      updateLevelUi();
      if (currentPhase === "home") clearBoard();
    }

    function reloadRuntimeConfigIfChanged() {
      try {
        const nextDefaultConfig = loadGameConfig();
        const nextSignature = JSON.stringify(nextDefaultConfig);
        if (nextSignature === lastRuntimeConfigSignature) return;
        lastRuntimeConfigSignature = nextSignature;
        syncRuntimeConfig(nextDefaultConfig);
        console.info("game.config.json changes applied.", appliedGameConfig);
      } catch (error) {
        console.warn("Could not hot-reload game config.", error);
      }
    }

    window.__reloadGameConfig = reloadRuntimeConfigIfChanged;

    function applyModeUi() {
      document.body.dataset.mode = gameMode;
      document.body.classList.toggle("mode-care", gameMode === "care");
      document.body.classList.toggle("mode-reminder", gameMode === "reminder");
      document.body.classList.toggle("mode-ai-assisted", gameMode === "ai_assisted");
      document.body.classList.toggle("mode-soft-feedback", Boolean(appliedGameConfig.soft_feedback));
      document.body.classList.toggle("mode-high-contrast", Boolean(appliedGameConfig.high_contrast));

      setElementVisible(timeText.closest(".stat"), appliedGameConfig.show_timer);
      setElementVisible(roundText.closest(".stat"), appliedGameConfig.show_score);
      setElementVisible(remainText.closest(".stat"), appliedGameConfig.show_score);
      setElementVisible(introSettingsButton, appliedGameConfig.show_settings);
      setElementVisible(introHowToButton, appliedGameConfig.show_how_to_play);
      setElementVisible(howToButton, appliedGameConfig.show_how_to_play);
      setElementVisible(hintButton, appliedGameConfig.hint_enabled);
      setElementVisible(musicToggleButton, appliedGameConfig.show_settings);
      setElementVisible(effectToggleButton, appliedGameConfig.show_settings);
      setElementVisible(voiceToggleButton, appliedGameConfig.show_settings);
      setElementVisible(pauseMusicButton, appliedGameConfig.show_settings);
      setElementVisible(pauseEffectButton, appliedGameConfig.show_settings);
      setElementVisible(pauseVoiceButton, appliedGameConfig.show_settings);
      setElementVisible(settingsVolumeControls, appliedGameConfig.show_settings);
      setElementVisible(pauseVolumeControls, appliedGameConfig.show_settings);
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
        if (type === "off") cell.classList.add("object-off");
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
        if (isWrongChoice) type = chosenWrongTypes.get(index) || boardItems[index] || targetType;
        cell.classList.toggle("empty", !type);
        cell.classList.toggle("hint", mode === "hint" && isUnchosenTarget && !isWrongChoice);
        cell.classList.toggle("preview-glow", mode === "preview" && targetIndexes.has(index) && type === targetType && type !== "off");
        if (type && type !== "off" && !isChosenAnswer) cell.classList.add(`object-${type}`);
        if (type === "off") cell.classList.add("object-off");
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
      const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
      if (safeSeconds < 60) return `${safeSeconds}초`;
      return `${Math.floor(safeSeconds / 60)}분 ${safeSeconds % 60}초`;
    }

    function getTotalTimeLimit() {
      const setting = difficultySettings[currentDifficulty] || difficultySettings.low;
      return Math.max(0, Number(setting.totalTimeLimitSec) || Number(appliedGameConfig.total_time_limit_sec) || 0);
    }

    function updateTimeDisplay() {
      const totalDisplaySeconds = totalTimer || totalTimeLeft > 0 ? totalTimeLeft : getTotalTimeLimit();
      timeText.textContent = formatTime(totalDisplaySeconds);
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
      text.textContent = appliedGameConfig.soft_feedback ? "좋습니다. 잘 보셨어요." : "정말 잘하셨어요.";
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

    function clearTotalTimer() {
      if (totalTimer) {
        clearInterval(totalTimer);
        totalTimer = null;
      }
    }

    function handleTotalTimeUp() {
      clearTotalTimer();
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearBetweenTimer();
      if (roundTelemetry && !roundClosed) {
        closeRoundTelemetry("total_timeout");
      }
      roundActive = false;
      isPreviewing = false;
      isHinting = false;
      isPaused = false;
      currentPhase = "between";
      totalTimeLeft = 0;
      timeLeft = 0;
      remainText.textContent = "-";
      updateRoundDisplay();
      updateTimeDisplay();
      message.textContent = "전체 시간이 끝났습니다. 결과 화면으로 이동합니다.";
      speakGuide("결과 화면으로 넘어갑니다.");
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
      setTimeout(showResultScreen, 900);
    }

    function startTotalTimer() {
      clearTotalTimer();
      totalTimeLeft = getTotalTimeLimit();
      updateTimeDisplay();
      if (totalTimeLeft <= 0) return;
      totalTimer = setInterval(() => {
        if (["home", "countdown", "postgame", "result"].includes(currentPhase) || isPaused) {
          return;
        }
        totalTimeLeft = Math.max(0, totalTimeLeft - 1);
        updateTimeDisplay();
        if (totalTimeLeft <= 0) {
          handleTotalTimeUp();
        }
      }, 1000);
    }

    function setPauseReady(enabled) {
      pauseButton.disabled = !enabled;
      pauseButton.textContent = TEXT.pause;
    }

    function clearBetweenTimer() {
      if (betweenTimer) {
        clearInterval(betweenTimer);
        betweenTimer = null;
      }
    }

    function clearAutoReturnTimer() {
      autoReturnSequence += 1;
      if (autoReturnTimer) {
        clearTimeout(autoReturnTimer);
        autoReturnTimer = null;
      }
    }

    function resolveHubReturnUrl() {
      const marker = "/games/banditburi-game/";
      const configuredUrl = String(configuredHubReturnUrl || "");
      const isHostedPage = window.location.protocol === "http:" || window.location.protocol === "https:";
      if (isHostedPage && configuredUrl.startsWith("file:") && window.location.pathname.includes(marker)) {
        const hubPath = `${window.location.pathname.split(marker)[0]}/index.html`;
        return `${window.location.origin}${hubPath}`;
      }
      if (isHostedPage && configuredUrl.startsWith("file:")) {
        const reminderMarker = "/modes/reminder/";
        if (window.location.pathname.includes(reminderMarker)) {
          const hubPath = `${window.location.pathname.split(reminderMarker)[0]}/index.html`;
          return `${window.location.origin}${hubPath}`;
        }
        return new URL("../../index.html", window.location.href).href;
      }
      return configuredUrl || "../../index.html";
    }

    function scheduleAutoReturnAfterVoice(voicePromise) {
      if (!appliedGameConfig.auto_return) return;
      clearAutoReturnTimer();
      const sequence = ++autoReturnSequence;

      const returnOnce = () => {
        if (sequence !== autoReturnSequence || currentPhase !== "result") return;
        clearAutoReturnTimer();
        requestActivityReturn("auto_return");
      };

      autoReturnTimer = setTimeout(returnOnce, autoReturnFallbackDelayMs);
      Promise.resolve(voicePromise)
        .then(() => {
          if (sequence !== autoReturnSequence || currentPhase !== "result") return;
          if (autoReturnTimer) {
            clearTimeout(autoReturnTimer);
            autoReturnTimer = null;
          }
          const delayAfterVoice = voiceEnabled ? autoReturnDelayMs : autoReturnFallbackDelayMs;
          autoReturnTimer = setTimeout(returnOnce, delayAfterVoice);
        })
        .catch(returnOnce);
    }

    function requestActivityReturn(reason) {
      sendGameMessage({ type: "GAME_RETURN_REQUESTED", reason });
      const hubReturnUrl = resolveHubReturnUrl();
      if (!hubReturnUrl) return;
      try {
        window.location.assign(hubReturnUrl);
      } catch (error) {
        window.location.href = hubReturnUrl;
      }
    }

    function resetSessionState() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearTotalTimer();
      clearBetweenTimer();
      clearAutoReturnTimer();
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
      document.body.classList.remove("is-result-mode");
    }

    function startRoundTimer() {
      clearRoundTimer();
      timeLeft = roundTimeLimit;
      updateTimeDisplay();
      if (roundTimeLimit <= 0) return;
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
      difficultyModal.classList.remove("open");
      checkinModal.classList.remove("open");
      postGameModal.classList.remove("open");
      tutorialModal.classList.remove("open");
      settingsModal.classList.remove("open");
      themeModal.classList.remove("open");
      if (gameMode === "reminder" && appliedGameConfig.auto_start && !autoStartConsumed) {
        autoStartConsumed = true;
        introModal.classList.remove("open");
        startModeFlow();
        return;
      }
      introModal.classList.add("open");
      if (appliedGameConfig.auto_start && !autoStartConsumed) {
        autoStartConsumed = true;
        setTimeout(startModeFlow, 600);
      }
    }

    function startModeFlow() {
      reloadRuntimeConfigIfChanged();
      if (appliedGameConfig.show_condition_check) {
        showCheckinScreen();
        return;
      }
      showDifficultyScreen();
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
      if (!appliedGameConfig.show_difficulty_select) {
        introModal.classList.remove("open");
        chooseDifficulty(defaultDifficultyKey);
        return;
      }
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

      tutorialVisual.innerHTML = `<div class="tutorial-demo-board"><div class="tutorial-demo-grid">${cells}</div></div><span class="tutorial-demo-caption">${captions[mode] || captions.intro}</span>`;
    }

    function renderTutorialStep() {
      const step = tutorialSteps[tutorialStepIndex];
      tutorialPageText.textContent = `${tutorialStepIndex + 1} / ${tutorialSteps.length}`;
      tutorialStepTitle.textContent = step.title;
      tutorialStepText.textContent = step.text;
      renderTutorialVisual(step.demo);
      skipTutorialButton.textContent = tutorialStepIndex === 0 ? "건너뛰기" : "이전";
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

    function previousTutorialStep() {
      if (tutorialStepIndex <= 0) {
        closeTutorial();
        return;
      }
      tutorialStepIndex -= 1;
      renderTutorialStep();
    }

    function showPostGameScreen() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearTotalTimer();
      clearBetweenTimer();
      if (!appliedGameConfig.show_finish_check) {
        showResultScreen();
        return;
      }
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
      clearTotalTimer();
      clearBetweenTimer();
      sendCompletedResult();
      postGameModal.classList.remove("open");
      roundActive = false;
      isPaused = false;
      currentPhase = "result";
      currentMusicMode = "intro";
      refreshBackgroundMusic();
      message.textContent = "수고하셨습니다. >_<";
      const resultVoice = playVoiceClipAndWait("finishThanks", TEXT.final);
      startButton.textContent = TEXT.restart;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(false);
      remainText.textContent = "-";
      board.parentElement.classList.add("result-mode");
      document.body.classList.add("is-result-mode");
      board.innerHTML = `<div class="result-card"><p>${TEXT.final}</p></div>`;
      scheduleAutoReturnAfterVoice(resultVoice);
    }

    function completePostGameAndExit() {
      clearPreviewTimer();
      clearHintTimer();
      clearRoundTimer();
      clearTotalTimer();
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
        if (currentRound >= maxRounds) {
          message.textContent = `${doneMessage}\n${secondsLeft}초`;
          return;
        }
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
      message.textContent = `${targetPhrase(targetIndexes.size)}가 있었던 위치를\n골라주세요.`;
      speakGuide(`${targetPhrase(targetIndexes.size)}가 있었던 위치를 골라주세요.`);
      renderBoard("hidden");
      startRoundTimer();
    }

    function startPreviewCountdown() {
      const updatePreviewMessage = () => {
        message.textContent = `${targetPhrase(targetIndexes.size)}의 위치를\n기억하세요. ${previewSecondsLeft}초`;
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
      document.body.classList.remove("is-result-mode");
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
      chosenWrongTypes.clear();
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
      previewSecondsLeft = Math.max(1, Math.round((Number(appliedGameConfig.exposure_time_ms) || 5000) / 1000));
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

    function chooseCell(index, inputType = "touch") {
      if (!roundActive || isPreviewing || isPaused) return;
      const cell = board.children[index];
      if (cell.classList.contains("correct") || cell.classList.contains("wrong")) return;
      if (roundTelemetry) {
        roundTelemetry.inputType = inputType;
        const gridSize = difficultySettings[currentDifficulty].gridSize;
        roundTelemetry.selectedPositions.push(`r${Math.floor(index / gridSize) + 1}c${(index % gridSize) + 1}`);
        if (!roundTelemetry.firstResponseTimeMs) {
          roundTelemetry.firstResponseTimeMs = Math.max(0, Date.now() - roundTelemetry.startedAt);
        }
      }

      if (targetIndexes.has(index)) {
        const telemetry = ensureTelemetry();
        telemetry.correctClickCount += 1;
        if (roundTelemetry) roundTelemetry.correctClickCount += 1;
        playCorrectSound();
        cell.classList.remove("empty", "hint");
        cell.classList.add(`object-${targetType}`);
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
          finishRound(appliedGameConfig.soft_feedback ? "좋습니다. 잘 보셨어요." : TEXT.done, "success");
        } else {
          message.textContent = appliedGameConfig.soft_feedback ? "좋아요. 천천히 하나 더 찾아볼까요?" : TEXT.correct;
          speakGuide(appliedGameConfig.soft_feedback ? "좋아요. 천천히 하나 더 찾아볼까요?" : "정답입니다. 잘하셨어요.");
        }
        return;
      }

      chosenWrong.add(index);
      const wrongType = boardItems[index] || "off";
      chosenWrongTypes.set(index, wrongType);
      const telemetry = ensureTelemetry();
      telemetry.wrongClickCount += 1;
      if (roundTelemetry) roundTelemetry.wrongClickCount += 1;
      playWrongSound();
      cell.classList.remove("empty", "hint");
      cell.classList.add("wrong");
      const wrongImage = cell.querySelector("img");
      wrongImage.src = objectTypes[wrongType].src;
      wrongImage.alt = objectTypes[wrongType].label;
      cell.setAttribute("aria-label", objectTypes[wrongType].label);
      if (chosenWrong.size >= 3) {
        const limitText = appliedGameConfig.soft_feedback
          ? "괜찮아요. 하나만 더 같이 해볼까요?"
          : (currentRound >= maxRounds ? TEXT.wrongLimitFinal : TEXT.wrongLimit);
        finishRound(limitText, "wrong_limit");
        return;
      }
      const wrongText = appliedGameConfig.soft_feedback
        ? "조금 헷갈릴 수 있어요. 제가 힌트를 드릴게요."
        : TEXT.wrong;
      message.textContent = wrongText;
      speakGuide(wrongText);
    }

    function resetToHome() {
      resetSessionState();
      roundActive = false;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      chosenCorrect.clear();
      chosenWrong.clear();
      chosenWrongTypes.clear();
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
      clearTotalTimer();
      currentPhase = "countdown";
      roundActive = false;
      isPreviewing = false;
      isHinting = false;
      isPaused = false;
      startButton.classList.add("is-hidden");
      startButton.disabled = true;
      hintButton.disabled = true;
      setPauseReady(true);
      updateRoundDisplay();
      startTotalTimer();
      updateTimeDisplay();
      clearBoard(false);

      let secondsLeft = 3;
      startCountdownSecondsLeft = secondsLeft;
      const updateCountdownMessage = () => {
        message.textContent = `${secondsLeft}초 후 게임이 시작됩니다.`;
      };
      updateCountdownMessage();
      speakGuide("3초 후 게임이 시작됩니다. 준비해 주세요.");
      betweenTimer = setInterval(() => {
        if (isPaused) return;
        secondsLeft -= 1;
        startCountdownSecondsLeft = secondsLeft;
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
        message.textContent = `${objectTypes[targetType].label} ${remaining}개가 있던 위치를\n골라주세요.`;
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
      if (currentPhase === "countdown") {
        message.textContent = `${startCountdownSecondsLeft}초 후 게임이 시작됩니다.`;
        return;
      }
      if (currentPhase === "preview") {
        isPreviewing = true;
        renderBoard("preview");
        message.textContent = `${objectTypes[targetType].label} ${targetIndexes.size}개의 위치를\n기억하세요. ${previewSecondsLeft}초`;
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
      message.textContent = `${objectTypes[targetType].label} ${remaining}개가 있던 위치를\n골라주세요.`;
      speakGuide("계속합니다. 기억나는 위치를 골라주세요.");
      renderBoard("hidden");
    }

    function togglePause() {
      if (!["countdown", "preview", "playing", "hint"].includes(currentPhase) && !isPaused) return;
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

    function bindVolumeSliders(sliders, updateVolume) {
      sliders.forEach((slider) => {
        if (!slider) return;
        slider.addEventListener("input", () => {
          updateVolume(normalizeVolume(slider.value));
          applyAudioVolumes();
          syncVolumeControls();
        });
      });
    }

    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button || button.disabled) return;
      if (button.classList.contains("cell")) return;
      playButtonClickSound();
      refreshBackgroundMusic();
    }, true);

    function parseBridgeMessage(data) {
      if (!data) return null;
      if (typeof data === "string") {
        try {
          return JSON.parse(data);
        } catch (error) {
          return null;
        }
      }
      return data;
    }

    function handleExternalAnswer(payload = {}) {
      const rawIndex = payload.selected_index ?? payload.selected_position_index ?? payload.selected_answer;
      const selectedIndex = Number(rawIndex);
      if (!Number.isFinite(selectedIndex)) return;
      const cellIndex = selectedIndex > 0 ? selectedIndex - 1 : selectedIndex;
      if (!board.children[cellIndex]) return;
      if (roundTelemetry) roundTelemetry.inputType = "external";
      chooseCell(cellIndex, "external");
      sendGameMessage({
        type: "EXTERNAL_ANSWER_APPLIED",
        input_type: payload.input_type || "external",
        selected_answer: payload.selected_answer,
        raw_transcript: payload.raw_transcript,
        confidence: payload.confidence,
      });
    }

    function handleBridgeMessage(event) {
      const bridgeMessage = parseBridgeMessage(event.data);
      if (bridgeMessage?.type === "EXTERNAL_ANSWER") {
        handleExternalAnswer(bridgeMessage.payload);
      }
    }

    window.addEventListener("message", handleBridgeMessage);

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
    introStartButton.addEventListener("click", startModeFlow);
    introSettingsButton.addEventListener("click", () => {
      settingsModal.classList.add("open");
      speakGuide("설정 화면입니다. 테마, 음악, 효과음, 음성 안내를 바꿀 수 있습니다.");
    });
    introHowToButton.addEventListener("click", () => {
      openTutorial("intro");
    });
    introExitButton?.addEventListener("click", () => {
      sendAbandonedResult("intro_exit");
      requestActivityReturn("intro_exit");
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
    });
    themeOptionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyTheme(button.dataset.themeOption);
        themeModal.classList.remove("open");
        settingsModal.classList.add("open");
      });
    });
    moodButtons.forEach((button) => {
      button.addEventListener("click", () => {
        todayMood = button.dataset.mood;
        updateCheckinButtons();
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
    if (postGameSkipButton) {
      postGameSkipButton.addEventListener("click", () => {
        if (postGamePage === 2) {
          postGamePage = 1;
          updatePostGameButtons();
          speakGuide("마무리 상태를 선택해 주세요.");
          return;
        }
        completePostGameAndExit();
      });
    }
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
      previousTutorialStep();
    });
    tutorialNextButton.addEventListener("click", nextTutorialStep);
    howToButton.addEventListener("click", () => {
      openTutorial("pause");
    });
    resumeButton.addEventListener("click", resumeGame);
    exitButton.addEventListener("click", openHomeConfirm);
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
    });
    startDifficultyButtons.forEach((button) => {
      button.addEventListener("click", () => chooseDifficulty(button.dataset.startDifficulty));
    });
    homeYesButton.addEventListener("click", () => {
      sendAbandonedResult("home_confirm");
      homeConfirmModal.classList.remove("open");
      pauseModal.classList.remove("open");
      requestActivityReturn("manual_return");
    });
    homeNoButton.addEventListener("click", closeHomeConfirm);
    bindVolumeSliders([musicVolumeSlider, pauseMusicVolumeSlider], (volume) => {
      musicVolume = volume;
    });
    bindVolumeSliders([effectVolumeSlider, pauseEffectVolumeSlider], (volume) => {
      soundVolume = volume;
    });
    bindVolumeSliders([voiceVolumeSlider, pauseVoiceVolumeSlider], (volume) => {
      voiceVolume = volume;
    });

    applyTheme(currentTheme);
    applyModeUi();
    applyAudioVolumes();
    syncAudioButtons();
    setDifficulty(currentDifficulty);
    window.addEventListener("focus", reloadRuntimeConfigIfChanged);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) reloadRuntimeConfigIfChanged();
    });
    setInterval(reloadRuntimeConfigIfChanged, 1000);
    difficultyModal.classList.remove("open");
    setTimeout(() => {
      finishLoadingProgress(() => {
      loadingScreen.classList.add("is-hidden");
      sendGameMessage({ type: "GAME_READY" });
      showIntroScreen();
      });
    }, 900);
