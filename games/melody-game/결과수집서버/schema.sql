-- Reference schema for production DB implementation.
-- The included local server stores JSON files, while this schema documents
-- the fields expected by the app/server integration.

CREATE TABLE game_result_sessions (
  session_id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('standard', 'reminder', 'care', 'ai_assisted')),
  difficulty TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'abandoned', 'error')),
  started_at TEXT,
  ended_at TEXT,
  duration_ms INTEGER,
  total_questions INTEGER,
  completed_questions INTEGER,
  correct_count INTEGER,
  wrong_count INTEGER,
  hint_count INTEGER,
  retry_count INTEGER,
  avg_response_time_ms INTEGER,
  completion_rate REAL,
  abandon_reason TEXT,
  error_code TEXT,
  result_detail_json TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_result_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL REFERENCES game_result_sessions(session_id),
  question_id TEXT NOT NULL,
  question_index INTEGER,
  question_type TEXT,
  cognitive_domain TEXT,
  difficulty TEXT,
  correct_answer TEXT,
  selected_answer TEXT,
  is_correct INTEGER,
  attempt_count INTEGER,
  hint_used INTEGER,
  hint_count INTEGER,
  replay_count INTEGER,
  response_time_ms INTEGER,
  first_response_time_ms INTEGER,
  changed_answer_count INTEGER,
  wrong_tap_count INTEGER,
  drag_fail_count INTEGER,
  input_type TEXT,
  raw_question_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, question_id)
);

CREATE INDEX idx_game_result_sessions_content ON game_result_sessions(content_id, game_key);
CREATE INDEX idx_game_result_sessions_mode ON game_result_sessions(mode, difficulty);
CREATE INDEX idx_game_result_sessions_status ON game_result_sessions(status, ended_at);
CREATE INDEX idx_game_result_questions_session ON game_result_questions(session_id, question_index);
