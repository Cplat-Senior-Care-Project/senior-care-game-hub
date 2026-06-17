# 오늘의 준비물 API/DB 연동 가이드

이 문서는 `시니어_WebView_게임_요구사항정의서_리스트형 (4).xlsx`의 `요구사항_API_DB`, `API요청_DB기본안` 탭 기준으로 앱 개발팀이 결과 저장 API에 전달할 payload와 DB 저장 기준을 정리한 문서다.

## 연동 원칙

- WebView 게임은 API 서버를 직접 호출하지 않는다.
- 게임은 `window.ReactNativeWebView.postMessage`로 결과 payload를 호스트 앱에 전달한다.
- 호스트 앱은 전달받은 payload를 결과 저장 API로 전송한다.
- 서버는 정규화 컬럼과 별개로 게임 원본 결과를 `game_result_json`에 보존한다.
- 동일 `session_id` 또는 내부 정책상 `assignment_id + session_id` 조합으로 중복 저장을 막는다.
- 히스토리 재실행은 기존 결과를 덮어쓰지 않고 새 `session_id`, `play_source=history_replay`로 저장한다.

## 게임 이벤트

| 이벤트 | 상태 | 설명 |
|---|---|---|
| `GAME_COMPLETED` | `completed` | 모든 문항을 완료한 정상 종료 |
| `GAME_ABANDONED` | `abandoned` | 사용자 종료 또는 제한시간 종료 |
| `GAME_ERROR` | `error` | 런타임 오류 또는 데이터 로드 실패 |

`time_over`는 API 저장 상태가 아니라 `exit_reason`과 `legacy_status`에만 남긴다. API/DB 저장 상태는 `completed`, `abandoned`, `error` 중 하나다.

## 결과 저장 API 기본안

| 항목 | 값 |
|---|---|
| Endpoint | `POST /api/game-results` |
| Auth | 내부망 토큰 또는 앱 서버 전용 Bearer token 협의 |
| Content-Type | `application/json` |
| Idempotency | `session_id` unique 또는 `senior_id + session_id` unique |

### Request body

게임 payload 자체가 API 요청 기본안과 맞도록 root 필드를 포함한다. 앱은 아래 구조를 그대로 전달하거나, 내부 API 명세에 맞게 동일 의미 필드로 매핑한다.

```json
{
  "senior_id": "senior_001",
  "guardian_id": "guardian_001",
  "content_id": "content_what_fits_where",
  "game_key": "what_fits_where",
  "game_version": "1.0.0",
  "session_id": "session_1781650000000_ab12cd",
  "play_source": "reminder",
  "assignment_id": "assign_001",
  "alarm_id": "alarm_001",
  "schedule_id": "schedule_001",
  "status": "completed",
  "started_at": "2026-06-17T01:00:00.000Z",
  "ended_at": "2026-06-17T01:02:10.000Z",
  "duration_ms": 130000,
  "game_result": {
    "mode": "choose_matching_items",
    "app_mode": "reminder",
    "difficulty": "easy",
    "total_questions": 10,
    "correct_count": 8,
    "wrong_count": 2,
    "hint_count": 1,
    "question_logs": [],
    "result_detail_json": {}
  },
  "game_result_json": {
    "mode": "choose_matching_items",
    "app_mode": "reminder",
    "difficulty": "easy",
    "question_logs": [],
    "result_detail_json": {}
  },
  "result_detail_json": {},
  "client_context": {
    "device_id": "device_001",
    "platform": "react-native-webview",
    "app_version": "1.2.0",
    "timezone": "Asia/Seoul"
  },
  "voice_context": {
    "voice_profile_id": "voice_guardian_001",
    "voice_owner_type": "guardian",
    "voice_owner_id": "guardian_001"
  }
}
```

### Response body

```json
{
  "ok": true,
  "result_id": "8d80d6b7-2a4c-4c40-9a55-111111111111",
  "session_id": "session_1781650000000_ab12cd",
  "status": "completed",
  "saved_at": "2026-06-17T01:02:11.000Z"
}
```

### Error codes

| HTTP | error_code | 처리 기준 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 필수 필드 누락 또는 타입 오류 |
| 401 | `UNAUTHORIZED` | 인증 토큰 누락 또는 불일치 |
| 409 | `DUPLICATE_SESSION` | 동일 `session_id` 재전송. 기존 저장 결과를 반환하거나 성공으로 간주 가능 |
| 500 | `INTERNAL_ERROR` | 서버 저장 실패. 앱에서 재시도 큐에 보관 |

## 상태별 샘플

### completed

```json
{
  "status": "completed",
  "exit_reason": "completed",
  "completed": true,
  "answered_questions": 10,
  "total_questions": 10,
  "game_result": {
    "status": "completed",
    "exit_reason": "completed",
    "question_logs": []
  }
}
```

### abandoned: user_exit

```json
{
  "status": "abandoned",
  "exit_reason": "user_exit",
  "completed": false,
  "ended_by_user": true,
  "game_result": {
    "status": "abandoned",
    "exit_reason": "user_exit",
    "question_logs": []
  }
}
```

### abandoned: time_over

```json
{
  "status": "abandoned",
  "legacy_status": "time_over",
  "exit_reason": "time_over",
  "completed": false,
  "time_over": true,
  "game_result": {
    "status": "abandoned",
    "exit_reason": "time_over",
    "question_logs": []
  }
}
```

### error

```json
{
  "status": "error",
  "error_code": "GAME_ERROR",
  "error_message": "게임 데이터를 불러오지 못했습니다.",
  "game_result": {
    "status": "error",
    "error_code": "GAME_ERROR",
    "result_detail_json": {
      "error_phase": "runtime"
    }
  }
}
```

## DB 저장 기준

- `game_play_results`는 결과 1회 실행 단위다.
- `game_question_logs`는 문항별 로그이며 `result_id` 또는 `session_id`로 결과와 연결한다.
- `game_result_json`은 게임이 반환한 원본 결과 JSON이다.
- `result_detail_json`은 리포트용 상세 통계와 게임별 확장 데이터를 담는다.
- `client_context_json`, `voice_context_json`은 nullable JSON으로 저장한다.
- `guardian_id`와 `voice_context.voice_owner_id`는 같은 의미가 아니다.

초기 DB 기준안은 [cplat-game-results-schema.sql](sql/cplat-game-results-schema.sql)에 둔다.

## 로컬 확인

정적 서버 실행:

```powershell
node tools/server.js
```

문법 확인:

```powershell
node --check js/game.js
node --check config/modes.js
node --check modes/registry.js
```

브라우저 콘솔 또는 WebView 메시지에서 `GAME_COMPLETED`, `GAME_ABANDONED`, `GAME_ERROR` payload의 root 필드와 `game_result_json`을 확인한다.
