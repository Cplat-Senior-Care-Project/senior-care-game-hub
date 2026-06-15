# 앱 이식/연동 가이드

WebView 게임은 서버와 직접 통신하지 않습니다. React Native 앱이 게임 완료 payload를 받은 뒤 결과 수집 API를 호출합니다.

## 처리 흐름

1. 앱이 런타임 config와 함께 WebView 게임을 실행합니다.
2. 게임이 앱 브릿지로 `GAME_COMPLETED` payload를 전달합니다.
3. 앱이 `senior_id`, `guardian_id`, `assignment_id`, `alarm_id`, `schedule_id` 등 앱 보유 식별자를 결합합니다.
4. 앱이 `POST /api/v1/game-results`를 호출합니다.
5. 서버가 SQLite DB에 저장하고 `saved` 또는 `duplicate_ignored`를 반환합니다.

## Endpoint

```http
POST /api/v1/game-results
Content-Type: application/json
Authorization: Bearer <API_TOKEN>
```

`Authorization`은 서버에 `API_TOKEN`이 설정된 경우에만 필수입니다.

## 최소 요청 예시

```json
{
  "senior_id": "senior_001",
  "content_id": "cognitive_count_fruit_001",
  "game_key": "counting_fruits",
  "game_version": "1.0.0",
  "session_id": "session_001",
  "play_source": "manual",
  "status": "completed",
  "started_at": "2026-06-15T10:00:00+09:00",
  "ended_at": "2026-06-15T10:01:20+09:00",
  "duration_ms": 80000,
  "game_result": {
    "mode": "standard",
    "difficulty": "easy",
    "config_snapshot": {},
    "question_logs": [],
    "result_detail_json": {}
  }
}
```

## 실패 시 처리 기준

| 상황 | 앱 처리 |
| --- | --- |
| `MISSING_REQUIRED_FIELD` | 누락 필드 추가 후 재전송 |
| `INVALID_ENUM_VALUE` | 실행 모드/출처 매핑과 앱 config 확인 |
| `UNAUTHORIZED` | API 토큰 확인 또는 갱신 |
| `REQUEST_BODY_TOO_LARGE` | payload 축소 또는 서버 제한값 협의 |
| `INTERNAL_SERVER_ERROR` | 나중에 재시도하고 로컬 pending 결과 보존 |
| `duplicate_ignored` | 저장 성공으로 간주하고 새 세션을 만들지 않음 |

## 히스토리 재실행

히스토리에서 게임을 다시 실행하는 경우 앱은 새 `session_id`를 발급하고 `play_source: "history_replay"`로 전송해야 합니다. 서버는 기존 결과를 덮어쓰지 않고 별도 결과 레코드로 저장합니다.
