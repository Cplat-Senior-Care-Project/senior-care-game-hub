# Senior Care Result Collection Server

React Native 앱이 WebView 게임에서 받은 결과 JSON을 저장하기 위한 경량 결과 수집 API 서버입니다.

WebView 게임은 서버와 직접 통신하지 않습니다. 게임은 앱 브릿지로 결과 payload를 전달하고, 앱이 이 API 서버에 저장 요청을 보냅니다.

## 실행

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
| `DB_PATH` | `./data/game-results.sqlite` | SQLite DB 파일 |
| `CORS_ORIGIN` | `*` | 허용 Origin |
| `API_TOKEN` | 빈 값 | 설정 시 `Authorization: Bearer <API_TOKEN>` 필요 |
| `MAX_BODY_BYTES` | `1048576` | 최대 request body 크기 |

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
| `session_id` | 게임 실행 1회 세션 ID |
| `play_source` | `reminder`, `manual`, `history_replay`, `ai_recommendation`, `care_session` |
| `status` | `completed`, `abandoned`, `error` |
| `started_at` | 실제 플레이 시작 시각, ISO 8601 |
| `ended_at` | 실제 플레이 종료 시각, ISO 8601 |
| `duration_ms` | 전체 수행 시간(ms) |
| `game_result` | 게임 결과 원본 JSON |

선택/조건부 필드:

| 필드 | 설명 |
| --- | --- |
| `guardian_id` | 보호자 발송 콘텐츠 또는 보호자 리포트 연결 시 사용 |
| `assignment_id` | 콘텐츠 할당/실행 단위 ID |
| `alarm_id` | 실제 발송 알림 ID |
| `schedule_id` | 예약/반복 알림 원본 ID |
| `client_context` | 앱/기기 운영 정보 |
| `voice_context` | 실제 적용된 음성 안내 정보. `guardian_id`와 별도 |

성공 응답:

```json
{
  "result_id": "uuid",
  "session_id": "game_session_001",
  "status": "saved",
  "saved_at": "2026-06-15 10:00:00"
}
```

동일 `(senior_id, session_id)`가 다시 들어오면 중복 저장하지 않고 `status: "duplicate_ignored"`를 반환합니다.

### 결과 조회

```bash
curl http://127.0.0.1:8787/api/v1/game-results
curl http://127.0.0.1:8787/api/v1/game-results/game_session_001
```

기존 호환 endpoint:

```bash
curl http://127.0.0.1:8787/api/game-results
curl http://127.0.0.1:8787/api/game-results/game_session_001
```

## 저장 구조

실제 저장은 SQLite DB에 수행합니다.

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

`game_result_json`에는 게임이 반환한 원본 결과 JSON을 보존합니다. 공통 리포트 컬럼은 별도 컬럼으로 정규화하고, 게임별 특수값은 `result_detail_json`과 `raw_log_json`에 저장합니다.

## 샘플 저장 테스트

서버 실행 후 아래 명령으로 completed, abandoned, error 샘플 저장과 조회를 확인할 수 있습니다.

```bash
npm run test:samples
```

테스트는 `samples/completed.json`, `samples/abandoned.json`, `samples/error.json`을 `POST /api/v1/game-results`로 저장한 뒤 `GET /api/v1/game-results/:session_id`로 DB 저장 여부를 확인합니다.

## 요구사항 대응

| 요구사항 | 대응 |
| --- | --- |
| WebView 게임은 서버와 직접 통신하지 않음 | 앱이 본 API를 호출하는 구조 |
| 앱이 API endpoint로 결과 저장 요청 가능 | `POST /api/v1/game-results` |
| API 호출 시 DB 저장 확인 | SQLite `game_play_results`, `game_question_logs` 저장 후 GET 조회 가능 |
| 중복 저장 방지 | `(senior_id, session_id)` unique |
| 원본 JSON 보존 | `game_result_json`, `raw_request_json` 저장 |
| 히스토리 재실행 별도 저장 | 새 `session_id`, `play_source=history_replay`로 저장 |
