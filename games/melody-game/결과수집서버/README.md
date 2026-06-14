# 작은 먹이 농장 결과 수집 서버

React Native 앱이 WebView 게임에서 받은 `SESSION_COMPLETE` / `SESSION_ABORT` payload를 저장하기 위한 경량 API 예시입니다.

이 서버는 실시간 게임 서버가 아니라 결과 수집용 서버입니다. 외부 의존성 없이 Node.js 기본 모듈만 사용하며, 로컬 검수와 연동 초안 확인을 위해 JSON 파일로 저장합니다. 실제 운영 DB에 붙일 때는 `schema.sql`을 기준으로 테이블을 구성합니다.

## 실행

```bash
cd 결과수집서버
cp .env.example .env
node server.js
```

기본 주소:

```text
http://127.0.0.1:8787
```

## 환경변수

| 이름 | 기본값 | 설명 |
|---|---|---|
| `PORT` | `8787` | API 서버 포트 |
| `DATA_DIR` | `./data` | JSON 저장 폴더 |
| `CORS_ORIGIN` | `*` | 허용 Origin |
| `API_TOKEN` | 빈 값 | 설정 시 `Authorization: Bearer <token>` 필요 |

## API

### 상태 확인

```bash
curl http://127.0.0.1:8787/health
```

### 결과 저장

앱은 WebView에서 받은 최종 이벤트를 그대로 전달할 수 있습니다.

```bash
curl -X POST http://127.0.0.1:8787/api/game-results \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "SESSION_COMPLETE",
    "payload": {
      "session_id": "sample-session-001",
      "content_id": "cognitive_animal_feeding_001",
      "game_key": "animal_feeding",
      "mode": "care",
      "difficulty": "easy",
      "status": "completed",
      "result_detail_json": {
        "question_logs": []
      }
    }
  }'
```

동일 `session_id`가 다시 들어오면 중복 저장하지 않고 `duplicate: true`를 반환합니다.

### 결과 조회

```bash
curl http://127.0.0.1:8787/api/game-results
curl http://127.0.0.1:8787/api/game-results/sample-session-001
```

## 저장 구조

```text
data/
├─ sessions/
│  └─ <session_id>.json
└─ events.jsonl
```

운영 서버에서는 앱/서버가 가진 `user_id`, `senior_id`, `guardian_id`, `assignment_id`, `alarm_id` 등을 최종 payload와 결합해 저장합니다. WebView 게임은 개인정보를 직접 만들지 않고 앱이 전달한 `session_id`, `content_id`, `game_key`, `mode`, `difficulty`, `config_snapshot`, `result_detail_json` 중심으로 결과를 반환합니다.
