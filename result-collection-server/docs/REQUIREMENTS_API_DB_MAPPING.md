# 요구사항_API_DB 대응표

기준 문서: `시니어_WebView_게임_요구사항정의서.xlsx`의 `요구사항_API_DB` 탭

| 요구사항 ID | 대응 상태 | 구현/산출물 |
| --- | --- | --- |
| REQ-SERVER-001 | 대응 | `POST /api/v1/game-results`, SQLite 저장 |
| REQ-SERVER-002 | 대응 | `README.md`, `docs/API_ERROR_CODES.md`, `docs/APP_INTEGRATION_GUIDE.md` |
| REQ-SERVER-003 | 대응 | `schema.sql`: `game_play_results`, `game_question_logs`, JSON 확장 컬럼 |
| REQ-SERVER-004 | 대응 | `senior_id`, `guardian_id`, `assignment_id`, `alarm_id`, `content_id`, `session_id`, `play_source` 저장 |
| REQ-SERVER-005 | 대응 | 동일 `session_id` 또는 `assignment_id + session_id` 중복 저장 방지 |
| REQ-SERVER-006 | 대응 | `result_detail_json`, `process_data_json`, `raw_log_json` 저장 |
| REQ-SERVER-007 | 대응 | `completed`, `abandoned`, `error` 허용 및 샘플 테스트 |
| REQ-SERVER-008 | 대응 | `error_code`, `message`, `details` 오류 응답 |
| REQ-SERVER-009 | 대응 | `API_TOKEN` bearer token, `CORS_ORIGIN` 환경변수 |
| REQ-SERVER-010 | 대응 | `GET /api/v1/game-results`, `GET /api/v1/game-results/:session_id` |
| REQ-SERVER-011 | 대응 | `.env.example`, README 환경변수 표 |
| REQ-SERVER-012 | 대응 | README, `run-result-server.bat`, `npm start` |
| REQ-SERVER-013 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md` |
| REQ-SERVER-014 | 대응 | `samples/*.json`, `npm run test:samples`, `docs/TEST_RESULT_API_DB.md` |
| REQ-SERVER-015 | 대응 | `docs/APP_INTEGRATION_GUIDE.md` |
| REQ-SERVER-016 | 대응 | MVP 필수 필드 검증 및 저장 |
| REQ-SERVER-017 | 대응 | `assignment_id`, `alarm_id`, `schedule_id` nullable 저장 |
| REQ-SERVER-018 | 대응 | `client_context_json` 저장 |
| REQ-SERVER-019 | 대응 | 단일 `server.js`, `schema.sql`, 문서 기반 이식 가능 구조 |
| REQ-SERVER-020 | 대응 | `tenant_id`, `facility_id`, `program_id`, `reward_id`, `recommendation_id`, `meta_json` |
| REQ-SERVER-021 | 대응 | `game_result_json`, `raw_request_json` 원본 보존 |
| REQ-SERVER-022 | 대응 | `schema.sql`, `npm run db:init`, 서버 시작 시 보강 마이그레이션 |
| REQ-SERVER-023 | 대응 | `samples/completed.json`, `samples/abandoned.json`, `samples/error.json` |
| REQ-SERVER-024 | 대응 | 새 `session_id`는 별도 레코드 저장 |
| REQ-SERVER-025 | 대응 | `play_source=history_replay` 허용 |
| REQ-SERVER-026 | 대응 | `docs/QUERY_AND_REPORT_POLICY.md`에서 히스토리 재실행 리포트 정책 제안 |

## 산출물 체크리스트 대응

| 산출물 ID | 대응 상태 | 구현/산출물 |
| --- | --- | --- |
| DELIV-SERVER-005 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 환경변수 목록 |
| DELIV-SERVER-006 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 로컬 실행 방법 |
| DELIV-SERVER-007 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 배포 절차, 운영 점검, 장애 대응 |
| DELIV-SERVER-008 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 서버 저장 테스트 결과, `docs/TEST_RESULT_API_DB.md` |
| DELIV-SERVER-010 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 내부 이식용 서버 구조 |
| DELIV-SERVER-013 | 대응 | `docs/DEPLOYMENT_OPERATIONS.md`의 확장/변경 가이드 |

## 저장 구조 요약

공통 리포트/조회 필드는 `game_play_results`와 `game_question_logs`의 정규화 컬럼에 저장합니다.

게임별 상세값과 향후 내부 DB 재가공이 필요한 원본 데이터는 아래 JSON 컬럼에 보존합니다.

| 컬럼 | 목적 |
| --- | --- |
| `game_result_json` | 게임이 반환한 원본 결과 JSON |
| `result_detail_json` | 게임별 상세 결과값 |
| `process_data_json` | 진행 과정/중간 이벤트 데이터 |
| `raw_request_json` | API에 들어온 전체 요청 원본 |
| `raw_log_json` | 문항별 원본 로그 |
| `meta_json` | 후속 확장 메타데이터 |
