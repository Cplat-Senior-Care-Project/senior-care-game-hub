CREATE TABLE IF NOT EXISTS game_play_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id TEXT NOT NULL,
  guardian_id TEXT NULL,
  tenant_id TEXT NULL,
  facility_id TEXT NULL,
  program_id TEXT NULL,
  reward_id TEXT NULL,
  recommendation_id TEXT NULL,
  content_id TEXT NOT NULL,
  game_key TEXT NOT NULL,
  game_version TEXT NOT NULL,
  session_id TEXT NOT NULL,
  play_source TEXT NOT NULL,
  assignment_id TEXT NULL,
  alarm_id TEXT NULL,
  schedule_id TEXT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'abandoned', 'error')),
  mode TEXT NULL,
  difficulty TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  abandoned_at TIMESTAMPTZ NULL,
  abandon_reason TEXT NULL,
  error_code TEXT NULL,
  error_message TEXT NULL,
  error_phase TEXT NULL,
  total_questions INTEGER NULL,
  completed_question_count INTEGER NULL,
  correct_count INTEGER NULL,
  wrong_count INTEGER NULL,
  hint_count INTEGER NULL,
  retry_count INTEGER NULL,
  pause_count INTEGER NULL,
  interaction_count INTEGER NULL,
  avg_response_time_ms INTEGER NULL,
  completion_rate NUMERIC(6,4) NULL,
  game_result_json JSONB NOT NULL,
  result_detail_json JSONB NULL,
  process_data_json JSONB NULL,
  raw_request_json JSONB NULL,
  client_context_json JSONB NULL,
  voice_context_json JSONB NULL,
  meta_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_game_play_results_session
  ON game_play_results (session_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_game_play_results_assignment_session
  ON game_play_results (assignment_id, session_id)
  WHERE assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_game_play_results_senior_started
  ON game_play_results (senior_id, started_at DESC);

CREATE INDEX IF NOT EXISTS ix_game_play_results_tenant_started
  ON game_play_results (tenant_id, started_at DESC)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_game_play_results_facility_started
  ON game_play_results (facility_id, started_at DESC)
  WHERE facility_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_game_play_results_content_started
  ON game_play_results (content_id, started_at DESC);

CREATE INDEX IF NOT EXISTS ix_game_play_results_assignment
  ON game_play_results (assignment_id)
  WHERE assignment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_game_play_results_alarm
  ON game_play_results (alarm_id)
  WHERE alarm_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_game_play_results_play_source
  ON game_play_results (play_source);

CREATE INDEX IF NOT EXISTS ix_game_play_results_status_started
  ON game_play_results (status, started_at DESC);

CREATE TABLE IF NOT EXISTS game_question_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id UUID NULL REFERENCES game_play_results(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_type TEXT NULL,
  difficulty TEXT NULL,
  is_correct BOOLEAN NULL,
  selected_answer JSONB NULL,
  correct_answer JSONB NULL,
  attempt_count INTEGER NULL,
  hint_count INTEGER NULL,
  response_time_ms INTEGER NULL,
  input_type TEXT NULL,
  raw_log_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_game_question_logs_result
  ON game_question_logs (result_id);

CREATE INDEX IF NOT EXISTS ix_game_question_logs_session
  ON game_question_logs (session_id, question_index);
