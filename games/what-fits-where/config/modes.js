"use strict";
(function () {
  const allowedModes = { standard: true, reminder: true, care: true, ai_assisted: true };
  const params = new URLSearchParams(window.location.search || "");
  let mode = params.get("mode") || "standard";
  if (mode === "ai-assisted") mode = "ai_assisted";
  if (!allowedModes[mode]) mode = "standard";
  window.GAME_MODE = window.GAME_MODE || mode;
  window.HUB_RETURN_URL = window.HUB_RETURN_URL || params.get("returnUrl") || "../../index.html";

  const difficulty = params.get("difficulty") || params.get("userDifficultyGroup");
  if (difficulty) {
    window.USER_DIFFICULTY_GROUP = difficulty;
  }

  const modeConfigs = {
    standard: {},
    reminder: {
      show_condition_check: false,
      show_settings: false,
      show_how_to_play: true,
      background_music_enabled: false,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      auto_start: true,
      auto_return_to_hub: true,
    },
    care: {
      show_condition_check: false,
      show_settings: false,
      show_how_to_play: false,
      background_music_enabled: false,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      auto_return_to_hub: true,
    },
    ai_assisted: {
      show_condition_check: false,
      show_settings: false,
      show_how_to_play: true,
      background_music_enabled: false,
      voice_guide_enabled: true,
      soft_feedback: true,
      default_difficulty: "easy",
      auto_return_to_hub: true,
    },
  };
  window.GAME_CONFIG = Object.assign({}, modeConfigs[mode], window.GAME_CONFIG || {});
})();

/* ===== APP MODE CONFIG ===== */

const DEFAULT_CONFIG = {
  show_settings:true, show_how_to_play:true, show_timer:true, show_score:true,
  show_difficulty_select:true,
  background_music_enabled:true, sound_effect_enabled:true, voice_guide_enabled:true,
  soft_feedback:false,
  show_condition_check:true, default_mood:null, default_sleep_hours:null,
};

/* ===== GAME FLOW CONFIG ===== */

const STAGES = 3;
const Q_PER_STAGE_BY_DIFF = {
  easy:   [3, 3, 4],
  normal: [3, 3, 4],
  hard:   [3, 3, 4],
};
const MISSION_SEQUENCE = ["choose_matching_items","remove_mismatched_items","guess_situation"];
const MISSION_INTRO = {
  choose_matching_items: "이번에는 필요한 물건을 골라볼게요.",
  remove_mismatched_items: "이번에는 어울리지 않는 물건을 찾아볼게요.",
  guess_situation: "이번에는 물건을 보고 상황을 맞혀볼게요.",
};
const DIFF_LABEL = {easy:"쉬움", normal:"보통", hard:"어려움"};
const MODE_LABEL = {
  choose_matching_items:"알맞은 물건 고르기",
  remove_mismatched_items:"어울리지 않는 물건 빼기",
  guess_situation:"상황을 맞춰보세요",
};
const COGNITIVE_AREAS = {
  choose_matching_items: ["주의력","의미기억","범주화","실행 기능"],
  remove_mismatched_items: ["주의력","범주화","억제력","판단력"],
  guess_situation: ["추론력","의미기억","범주화","상황 인식"],
};
const SIT_CHOICES = {easy:3, normal:4, hard:5};
const PRAISE_PICK = ["잘 고르셨어요.","좋아요. 필요한 물건이에요.","맞아요. 잘 챙겼어요."];
const PRAISE_REMOVE = ["잘 찾았어요.","좋아요. 어울리지 않는 물건이에요.","맞아요. 빼는 게 좋아요."];
const PRAISE_SIT = ["맞아요. 이 상황에 잘 어울려요.","좋아요. 잘 추론하셨어요.","정확해요."];
const SOFT_WRONG_PICK = ["다시 한 번 살펴볼까요?","다른 물건도 살펴봐요.","천천히 골라보세요."];
const SOFT_WRONG_REMOVE = ["이 물건은 이 상황에 필요해요.","다른 물건을 살펴봐요.","다시 한 번 살펴볼까요?"];
const SOFT_WRONG_SIT = ["어떤 상황에서 쓰는 물건인지 다시 생각해봐요.","다른 상황도 살펴볼까요?"];
const pickMsg = arr => arr[(Math.random()*arr.length)|0];

const GAME_TIME_LIMIT = 120;

/* ===== CONDITION CHECK CONFIG ===== */

const SLEEP_STEPS = [
  {range:"4_or_less", hours:4, label:"4시간 이하"},
  {range:"5",         hours:5, label:"5시간"},
  {range:"6",         hours:6, label:"6시간"},
  {range:"7",         hours:7, label:"7시간"},
  {range:"8",         hours:8, label:"8시간"},
  {range:"9",         hours:9, label:"9시간"},
  {range:"10",        hours:10, label:"10시간"},
  {range:"11",        hours:11, label:"11시간"},
  {range:"12_or_more", hours:12, label:"12시간 이상"},
];

/* ===== HELP CONFIG ===== */

const HELP_PAGES = [
  { t:"오늘의 준비물은 어떤 게임인가요?", b:"상황을 보고 알맞은 물건을 고르는 인지활동 게임입니다.\n천천히 보고 필요한 물건을 골라 주세요." },
  { t:"알맞은 물건 고르기", b:"상황을 보고 필요한 물건을 골라 주세요.\n\n예시) \"비 오는 날 외출해요.\"\n→ 우산을 고르면 좋아요." },
  { t:"어울리지 않는 물건 빼기", b:"상황에 맞지 않는 물건을 찾아 빼는 활동입니다.\n\n예시) \"병원에 가요.\"\n→ 수영복처럼 어울리지 않는 물건을 빼요." },
  { t:"상황을 맞춰보세요", b:"보이는 물건들을 보고 어떤 상황인지 골라 주세요.\n\n예시) 우산, 장화, 비옷\n→ 비 오는 날 외출" },
  { t:"천천히 해도 괜찮아요", b:"잘 모르겠으면 힌트를 눌러도 괜찮아요.\n틀려도 괜찮습니다.\n천천히 다시 보면 됩니다." },
];
