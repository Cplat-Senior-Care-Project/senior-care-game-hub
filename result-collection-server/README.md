# 시니어 케어 결과 수집 서버

시니어 WebView 게임의 결과 JSON을 저장하기 위한 경량 결과 수집 API 서버입니다.

WebView 게임은 서버와 직접 통신하지 않습니다. React Native 앱이 WebView 브릿지로 게임 결과 payload를 받은 뒤, 앱 내부 식별자와 결합하여 이 API 서버에 저장 요청을 보냅니다.

## 실행 방법

```bash
cd result-collection-server
copy .env.example .env
node server.js
```

기본 주소:

```text
http://127.0.0.1:8787
```

## 환경변수

| 이름 | 기본값 | 설명 |
| --- | --- | --- |
| `PORT` | `8787` | API 서버 포트 |
| `DATA_DIR` | `./data` | SQLite DB와 JSON 백업 저장 폴더 |
| `DB_PATH` | `./data/game-results.sqlite` | SQLite DB 파일 경로 |
| `CORS_ORIGIN` | `*` | 허용 Origin |
| `API_TOKEN` | 빈 값 | 설정 시 `Authorization: Bearer <API_TOKEN>` 필요 |
| `MAX_BODY_BYTES` | `1048576` | 요청 body 최대 크기 |

## API

### 상태 확인

```bash
curl http://127.0.0.1:8787/health
```

### 결과 저장

```http
POST /api/v1/game-results
Content-Type: application/json
```

기존 로컬 연동 호환을 위해 `POST /api/game-results`도 동일하게 동작합니다.

필수 root 필드:

| 필드 | 설명 |
| --- | --- |
| `senior_id` | 게임을 수행한 시니어 사용자 ID |
| `content_id` | 실행한 콘텐츠 ID |
| `game_key` | 게임 유형 ID |
| `game_version` | 게임 빌드/콘텐츠 버전 |
| `session_id` | 게임 실행 1회를 구분하는 세션 ID |
| `play_source` | `reminder`, `manual`, `history_replay`, `ai_recommendation`, `care_session` |
| `status` | `completed`, `abandoned`, `error` |
| `started_at` | 실제 플레이 시작 시각, ISO 8601 |
| `ended_at` | 실제 플레이 종료 시각, ISO 8601 |
| `duration_ms` | 전체 수행 시간(ms) |
| `game_result` | 게임 결과 원본 JSON |

선택 또는 조건부 필드:

| 필드 | 설명 |
| --- | --- |
| `guardian_id` | 보호자 발송 콘텐츠 또는 보호자 리포트 연결 시 사용 |
| `assignment_id` | 콘텐츠 할당/실행 단위 ID |
| `alarm_id` | 실제 발송 알림 ID |
| `schedule_id` | 예약/반복 알림 원본 ID |
| `client_context` | 앱/기기 운영 정보 |
| `voice_context` | 실제 사용된 음성 프로필 정보. `guardian_id`와 별도 |

성공 응답:

```json
{
  "result_id": "uuid",
  "session_id": "game_session_001",
  "status": "saved",
  "saved_at": "2026-06-15 10:00:00"
}
```

동일한 `(senior_id, session_id)`가 다시 들어오면 중복 레코드를 만들지 않고 `status: "duplicate_ignored"`를 반환합니다.

### 결과 조회

```bash
curl http://127.0.0.1:8787/api/v1/game-results
curl http://127.0.0.1:8787/api/v1/game-results/game_session_001
```

필터 조회:

```bash
curl "http://127.0.0.1:8787/api/v1/game-results?senior_id=senior_001&game_key=counting_fruits&status=completed"
```

지원 필터: `senior_id`, `guardian_id`, `content_id`, `game_key`, `game_version`, `play_source`, `status`, `mode`, `difficulty`, `assignment_id`, `alarm_id`, `schedule_id`, `date_from`, `date_to`, `limit`

## 저장 구조

결과는 SQLite DB에 저장합니다.

```text
data/
  game-results.sqlite
  events.jsonl
  sessions/
    <session_id>.json
```

DB 테이블:

| 테이블 | 역할 |
| --- | --- |
| `game_play_results` | 세션 단위 결과 저장 |
| `game_question_logs` | 문항별 로그 저장 |

`game_result_json`에는 게임이 반환한 원본 결과 JSON을 그대로 보존합니다. 공통 리포트 필드는 별도 컬럼으로 정규화하고, 게임별 특수값은 `result_detail_json` 또는 `raw_log_json`에 저장합니다.

## 샘플 저장 테스트

서버 실행 후 아래 명령으로 저장과 조회를 확인합니다.

```bash
npm run test:samples
```

테스트는 `samples/completed.json`, `samples/abandoned.json`, `samples/error.json`을 `POST /api/v1/game-results`로 저장한 뒤 `GET /api/v1/game-results/:session_id`로 DB 저장 여부를 확인합니다.

## 추가 문서

| 문서 | 목적 |
| --- | --- |
| `docs/API_ERROR_CODES.md` | 오류 응답 코드표 |
| `docs/APP_INTEGRATION_GUIDE.md` | 앱 이식/연동 가이드 |
| `docs/DEPLOYMENT_OPERATIONS.md` | 배포 및 운영 확인 문서 |
| `docs/QUERY_AND_REPORT_POLICY.md` | 조회 필터와 히스토리 재실행 리포트 정책 |
| `docs/TEST_RESULT_API_DB.md` | API/DB 저장 테스트 결과서 |

## 요구사항 대응 요약

| 요구사항 | 대응 |
| --- | --- |
| WebView 게임은 서버와 직접 통신하지 않음 | 앱이 본 API를 호출하는 구조 |
| 앱이 API endpoint로 결과 저장 요청 가능 | `POST /api/v1/game-results` |
| API 호출 시 DB 저장 확인 | SQLite 저장 후 GET 조회 가능 |
| 중복 저장 방지 | `(senior_id, session_id)` unique |
| 원본 JSON 보존 | `game_result_json`, `raw_request_json` 저장 |
| 히스토리 재실행 별도 저장 | 새 `session_id`, `play_source=history_replay`로 저장 |
