"use strict";
(function () {
  const GAME_KEY = "what_fits_where";
  const GAME_VERSION = "1.0.0";
  const allowedModes = { standard: true, reminder: true, care: true, ai_assisted: true };
  const params = new URLSearchParams(window.location.search || "");
  const difficultyMap = { low: "easy", middle: "normal", high: "hard" };
  const allowedDifficulties = { easy: true, normal: true, hard: true };

  function normalizeMode(value) {
    let mode = (value || "standard").trim();
    if (mode === "ai-assisted") mode = "ai_assisted";
    return allowedModes[mode] ? mode : "standard";
  }

  function normalizeDifficulty(value) {
    const raw = (value || "").trim();
    const mapped = difficultyMap[raw] || raw;
    return allowedDifficulties[mapped] ? mapped : null;
  }

  function parseConfigParam(value) {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("Invalid game config parameter", error);
      return {};
    }
  }

  function readQueryConfig() {
    const config = Object.assign({},
      parseConfigParam(params.get("config")),
      parseConfigParam(params.get("gameConfig")),
      parseConfigParam(params.get("appConfig")),
    );

    [
      "session_id", "content_id", "senior_id", "guardian_id",
      "assignment_id", "alarm_id", "schedule_id", "play_source",
      "voice_id", "voice_profile_id", "voice_owner_type", "voice_owner_id",
      "device_id", "platform", "app_version", "timezone",
      "user_id", "anonymous_user_id",
      "tenant_id", "facility_id", "program_id", "reward_id", "recommendation_id",
    ].forEach(key => {
      if (params.has(key)) config[key] = params.get(key);
    });

    [
      ["client_context", "client_context"],
      ["clientContext", "client_context"],
      ["voice_context", "voice_context"],
      ["voiceContext", "voice_context"],
    ].forEach(([paramName, configKey]) => {
      if (!params.has(paramName)) return;
      const parsed = parseConfigParam(params.get(paramName));
      if (Object.keys(parsed).length) config[configKey] = parsed;
    });

    ["show_condition_check", "show_finish_check", "show_settings", "show_how_to_play", "show_timer", "show_score",
      "show_difficulty_select", "show_pause", "show_hint", "show_question_counter",
      "background_music_enabled", "sound_effect_enabled", "voice_guide_enabled",
      "auto_start", "auto_return_to_hub"].forEach(key => {
      if (!params.has(key)) return;
      const value = params.get(key);
      config[key] = value === "true" || value === "1" || value === "yes";
    });

    ["question_count", "time_limit_sec"].forEach(key => {
      if (!params.has(key)) return;
      const value = Number(params.get(key));
      if (Number.isFinite(value) && value > 0) config[key] = Math.floor(value);
    });

    const diff = normalizeDifficulty(params.get("difficulty") || params.get("userDifficultyGroup"));
    if (diff) config.default_difficulty = diff;

    return config;
  }

  function normalizeConfig(config) {
    const normalized = Object.assign({}, config);
    ["show_condition_check", "show_finish_check", "show_settings", "show_how_to_play", "show_timer", "show_score",
      "show_difficulty_select", "show_pause", "show_hint", "show_question_counter",
      "background_music_enabled", "sound_effect_enabled", "voice_guide_enabled",
      "auto_start", "auto_return_to_hub"].forEach(key => {
      if (typeof normalized[key] === "string") {
        normalized[key] = normalized[key] === "true" || normalized[key] === "1" || normalized[key] === "yes";
      }
    });

    const diff = normalizeDifficulty(normalized.default_difficulty || normalized.difficulty);
    if (diff) normalized.default_difficulty = diff;

    const questionCount = Number(normalized.question_count);
    if (Number.isFinite(questionCount) && questionCount > 0) {
      const count = Math.floor(questionCount);
      normalized.question_count = count;
      normalized.question_counts_by_diff = {
        easy: [count],
        normal: [count],
        hard: [count],
      };
    }

    const timeLimit = Number(normalized.time_limit_sec);
    if (Number.isFinite(timeLimit) && timeLimit > 0) {
      normalized.time_limit_sec = Math.floor(timeLimit);
    }

    return normalized;
  }

  const requestedMode = normalizeMode(params.get("mode"));
  const mode = normalizeMode(window.GAME_MODE || requestedMode);
  window.GAME_KEY = window.GAME_KEY || GAME_KEY;
  window.GAME_VERSION = window.GAME_VERSION || GAME_VERSION;
  window.GAME_MODE = mode;
  window.HUB_RETURN_URL = window.HUB_RETURN_URL || params.get("returnUrl") || "../../index.html";

  const difficulty = normalizeDifficulty(params.get("difficulty") || params.get("userDifficultyGroup"));
  if (difficulty) {
    window.USER_DIFFICULTY_GROUP = difficulty;
  }

  const modeConfigs = {
    standard: {
      play_source: "manual",
    },
    reminder: {
      show_condition_check: false,
      show_settings: false,
      show_how_to_play: false,
      show_difficulty_select: false,
      show_score: false,
      background_music_enabled: true,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      auto_start: true,
      auto_return_to_hub: true,
      play_source: "reminder",
    },
    care: {
      show_condition_check: false,
      show_settings: true,
      show_how_to_play: false,
      show_timer: false,
      show_score: false,
      show_finish_check: false,
      show_difficulty_select: false,
      show_pause: true,
      show_question_counter: false,
      background_music_enabled: true,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      question_counts_by_diff: {
        easy: [5],
        normal: [5],
        hard: [5],
      },
      auto_return_to_hub: true,
      play_source: "care_session",
    },
    ai_assisted: {
      show_condition_check: false,
      show_settings: true,
      show_how_to_play: false,
      show_timer: false,
      show_score: false,
      show_finish_check: false,
      show_difficulty_select: false,
      show_pause: true,
      show_question_counter: false,
      background_music_enabled: true,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      question_counts_by_diff: {
        easy: [5],
        normal: [5],
        hard: [5],
      },
      auto_return_to_hub: true,
      play_source: "ai_recommendation",
    },
  };
  window.GAME_MODE_CONFIGS = modeConfigs;
  const queryConfig = readQueryConfig();
  window.GAME_CONFIG = normalizeConfig(Object.assign({
    game_key: window.GAME_KEY,
    game_version: window.GAME_VERSION,
    mode,
  }, modeConfigs[mode], queryConfig, window.GAME_CONFIG || {}));
})();

/* ===== APP MODE CONFIG ===== */

const DEFAULT_CONFIG = {
  show_settings:true, show_how_to_play:true, show_timer:true, show_score:true,
  show_difficulty_select:true, show_pause:true, show_hint:true, show_question_counter:true,
  background_music_enabled:true, sound_effect_enabled:true, voice_guide_enabled:true,
  soft_feedback:false,
  show_condition_check:true, show_finish_check:true, default_mood:null, default_sleep_hours:null,
  auto_start:false, auto_return_to_hub:false, play_source:"manual",
  time_limit_sec:180, game_key:window.GAME_KEY || "what_fits_where", game_version:window.GAME_VERSION || "1.0.0",
};

/* ===== GAME FLOW CONFIG ===== */

const STAGES = 1;
const Q_PER_STAGE_BY_DIFF = {
  easy:   [10],
  normal: [10],
  hard:   [10],
};
const MISSION_SEQUENCE = ["choose_matching_items"];
const MISSION_SEQUENCE_BY_DIFF = {
  easy: ["choose_matching_items"],
  normal: ["choose_matching_items"],
  hard: ["choose_matching_items"],
};
function getMissionSequenceForDiff(diff){
  return MISSION_SEQUENCE_BY_DIFF[diff] || MISSION_SEQUENCE;
}
function getQuestionCountsForDiff(diff){
  const configured = window.GAME_CONFIG && window.GAME_CONFIG.question_counts_by_diff;
  if(configured && Array.isArray(configured[diff])) return configured[diff];
  return Q_PER_STAGE_BY_DIFF[diff] || Q_PER_STAGE_BY_DIFF.normal;
}
const DIFF_LABEL = {easy:"쉬움", normal:"보통", hard:"어려움"};
const MODE_LABEL = {
  choose_matching_items:"알맞은 물건 고르기",
  remove_mismatched_items:"어울리지 않는 물건 고르기",
  guess_situation:"상황 맞추기",
};
const COGNITIVE_AREAS = {
  choose_matching_items: ["언어·의미 활동","집중 활동","손 조작 활동"],
  remove_mismatched_items: ["집중 활동","언어·의미 활동","손 조작 활동"],
  guess_situation: ["언어·의미 활동","기억 활동","집중 활동"],
};
const SIT_CHOICES = {easy:3, normal:3, hard:6};
const PRAISE_PICK = ["잘 고르셨어요.","좋아요. 잘 찾았어요.","맞아요."];
const PRAISE_REMOVE = ["잘 찾았어요.","좋아요.","맞아요."];
const PRAISE_SIT = ["맞아요.","좋아요.","잘 고르셨어요."];
const SOFT_WRONG_PICK = ["천천히 골라보세요."];
const SOFT_WRONG_REMOVE = ["천천히 골라보세요."];
const SOFT_WRONG_SIT = ["천천히 골라보세요."];
const pickMsg = arr => arr[(Math.random()*arr.length)|0];

const GAME_TIME_LIMIT = 180;
const AUTO_HINT_DELAY_MS = 20000;

/* ===== CONDITION CHECK CONFIG ===== */

const SLEEP_STEPS = [
  {range:"4", hours:4, label:"4시간"},
  {range:"5",         hours:5, label:"5시간"},
  {range:"6",         hours:6, label:"6시간"},
  {range:"7",         hours:7, label:"7시간"},
  {range:"8",         hours:8, label:"8시간"},
  {range:"9",         hours:9, label:"9시간"},
  {range:"10",        hours:10, label:"10시간"},
  {range:"11",        hours:11, label:"11시간"},
  {range:"12", hours:12, label:"12시간"},
];

/* ===== HELP CONFIG ===== */

const HELP_PAGES = [
  { t:"오늘의 준비물은 어떤 게임인가요?", b:"상황을 보고 알맞은 물건을 고르는 인지활동 게임입니다.\n천천히 보고 필요한 물건을 골라 주세요." },
  { t:"알맞은 물건 고르기", b:"상황을 보고 필요한 물건을 골라 주세요.\n\n예시) \"비 오는 날 외출해요.\"\n→ 우산을 고르면 좋아요." },
  { t:"천천히 해도 괜찮아요", b:"잘 모르겠으면 힌트를 눌러도 괜찮아요.\n다시 봐도 괜찮습니다.\n천천히 살펴보면 됩니다." },
];
