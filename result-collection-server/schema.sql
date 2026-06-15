CREATE TABLE IF NOT EXISTS game_play_results (
  id TEXT PRIMARY KEY,
  senior_id TEXT NOT NULL,
  guardian_id TEXT,
  content_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  game_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  play_source TEXT NOT NULL CHECK (
    play_source IN ('reminder', 'manual', 'history_replay', 'ai_recommendation', 'care_session')
  ),
  assignment_id TEXT,
  alarm_id TEXT,
  schedule_id TEXT,
  mode TEXT,
  difficulty TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'abandoned', 'error')),
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  total_questions INTEGER,
  completed_question_count INTEGER,
  correct_count INTEGER,
  wrong_count INTEGER,
  hint_count INTEGER,
  retry_count INTEGER,
  pause_count INTEGER,
  interaction_count INTEGER,
  avg_response_time_ms INTEGER,
  completion_rate REAL,
  abandoned_at TEXT,
  abandon_reason TEXT,
  error_code TEXT,
  error_message TEXT,
  error_phase TEXT,
  game_result_json TEXT NOT NULL,
  result_detail_json TEXT,
  client_context_json TEXT,
  voice_context_json TEXT,
  meta_json TEXT,
  raw_request_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(senior_id, session_id)
);

CREATE TABLE IF NOT EXISTS game_question_logs (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL REFERENCES game_play_results(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_index INTEGER,
  question_type TEXT,
  cognitive_domain TEXT,
  difficulty TEXT,
  prompt_type TEXT,
  target_item TEXT,
  target_count INTEGER,
  items_shown INTEGER,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct INTEGER,
  attempt_count INTEGER,
  hint_used INTEGER,
  hint_count INTEGER,
  replay_count INTEGER,
  response_time_ms INTEGER,
  first_response_time_ms INTEGER,
  changed_answer_count INTEGER,
  wrong_tap_count INTEGER,
  touch_miss_count INTEGER,
  input_type TEXT,
  raw_log_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(result_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_game_play_results_senior_started_at
  ON game_play_results(senior_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_play_results_content
  ON game_play_results(content_id);

CREATE INDEX IF NOT EXISTS idx_game_play_results_game_key
  ON game_play_results(game_key);

CREATE INDEX IF NOT EXISTS idx_game_play_results_play_source
  ON game_play_results(play_source);

CREATE INDEX IF NOT EXISTS idx_game_play_results_status
  ON game_play_results(status);

CREATE INDEX IF NOT EXISTS idx_game_play_results_guardian
  ON game_play_results(guardian_id)
  WHERE guardian_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_play_results_alarm
  ON game_play_results(alarm_id)
  WHERE alarm_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_question_logs_result_id
  ON game_question_logs(result_id);

CREATE INDEX IF NOT EXISTS idx_game_question_logs_session_id
  ON game_question_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_game_question_logs_question_id
  ON game_question_logs(question_id);

CREATE INDEX IF NOT EXISTS idx_game_question_logs_difficulty
  ON game_question_logs(difficulty);

CREATE INDEX IF NOT EXISTS idx_game_question_logs_target_item
  ON game_question_logs(target_item);

CREATE INDEX IF NOT EXISTS idx_game_question_logs_is_correct
  ON game_question_logs(is_correct);
