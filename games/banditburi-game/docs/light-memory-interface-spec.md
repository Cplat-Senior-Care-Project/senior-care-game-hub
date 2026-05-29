# 시니어 인지 웹게임 인터페이스 명세서

## 빛나는 전구를 찾아라

- 게임명: 빛나는 전구를 찾아라
- game_key: `light_memory`
- content_id: `memory_light_bulb_001`
- 인지 활동 영역: 기억 활동
- 문항 유형: 위치 기억 `position_memory`
- 기본 입력 방식: 터치 `touch`
- AI 연동 입력 방식: 외부 입력 `external`
- WebView 실행 방식: 온디바이스 실행, 게임 중 지속 통신 없음
- 결과 반환 방식: 게임 종료 후 앱 브릿지로 세션 결과 전송

## 1. 다중 실행 모드 인터페이스 아키텍처

`빛나는 전구를 찾아라`는 동일한 위치 기억 게임 로직을 유지하되, 실행 모드에 따라 UX, 난이도 노출, 결과 로그 수준을 다르게 적용합니다.

| 모드 | mode | 대상 | 핵심 동작 |
|---|---|---|---|
| 표준 모드 | `standard` | 액티브 시니어, 일반 사용자 | 난이도 선택, 타이머, 진행 정보, 설정, 컨디션 체크, 마무리 체크 유지 |
| 알림 모드 | `reminder` | 보호자 알림으로 콘텐츠를 수행하는 사용자 | 보호자/앱이 지정한 난이도로 바로 실행, 설정/체크 흐름 축소, 완료 후 앱 복귀 |
| 케어 모드 | `care` | 요양원, 주야간보호센터, 데이케어센터 등 | 타이머/점수/난이도/설정/컨디션 체크 숨김, 2x2 쉬운 활동, 부드러운 피드백 |
| AI 연동 모드 | `ai_assisted` | AI 대화형 서비스 | 케어 모드와 유사한 쉬운 화면, 앱/AI가 변환한 외부 선택값 수신 가능 |

게임 자체는 마이크 권한 요청, 녹음, STT, AI 판단을 수행하지 않습니다. AI 연동 모드에서는 앱 또는 AI 레이어가 음성 인식 결과를 선택값으로 변환한 뒤 `EXTERNAL_ANSWER` 메시지로 WebView에 전달합니다.

## 2. 실행 모드별 파라미터 호출 규격

앱은 WebView를 로드하기 전 또는 HTML 내 `window.__GAME_CONFIG__`로 실행 설정을 전달합니다.

```js
window.__GAME_CONFIG__ = {
  mode: "care",
  difficulty: "easy",
  sessionId: "game_session_3001",
  contentId: "memory_light_bulb_001",
  gameKey: "light_memory",
  assignmentId: "",
  seniorId: "",
  guardianId: "",
  playSource: "care",
  config: {
    show_timer: false,
    show_score: false,
    show_difficulty_select: false,
    show_settings: false,
    show_how_to_play: false,
    show_condition_check: false,
    show_finish_check: false,
    question_count: 3,
    grid_rows: 2,
    grid_cols: 2,
    target_count: 1,
    exposure_time_ms: 8000,
    round_time_limit_sec: 0,
    hint_enabled: true,
    auto_hint_enabled: true,
    auto_start: true,
    auto_return: true,
    soft_feedback: true,
    flash_effect_level: "low",
    high_contrast: true,
    voice_guide_enabled: true,
    result_log_level: "detailed"
  }
};
```

### 2.1 상위 호출 필드

| 필드 | 타입 | 필수 | 설명 |
|---|---|---:|---|
| `mode` | string | 권장 | 실행 모드. `standard`, `reminder`, `care`, `ai_assisted` |
| `difficulty` | string | 권장 | 기본 난이도. `easy`, `normal`, `hard` |
| `sessionId` 또는 `session_id` | string | 권장 | 앱이 전달하는 게임 실행 세션 ID. 없으면 게임이 local ID 생성 |
| `contentId` 또는 `content_id` | string | 권장 | 콘텐츠 ID. 기본 `memory_light_bulb_001` |
| `gameKey` 또는 `game_key` | string | 권장 | 게임 유형 ID. 기본 `light_memory` |
| `assignmentId` 또는 `assignment_id` | string | 선택 | 알림/과제/기관 배정 ID |
| `seniorId` 또는 `senior_id` | string | 선택 | 시니어 사용자 ID |
| `guardianId` 또는 `guardian_id` | string | 선택 | 보호자 ID |
| `playSource` | string | 선택 | 실행 출처. `manual`, `reminder`, `care`, `ai_assisted` 등 |
| `config` | object | 권장 | 모드별 UX 및 난이도 override |

### 2.2 모드별 호출 매트릭스

| 모드 | 진입 경로 | 권장 config | UI 제어 상태 |
|---|---|---|---|
| `standard` | 사용자가 직접 게임 선택 | `show_difficulty_select: true`, `show_timer: true`, `show_score: true` | 난이도 선택, 설정, 게임 방법, 컨디션/마무리 체크 노출 |
| `reminder` | 보호자 알림 또는 앱 알림 | `show_difficulty_select: false`, `show_condition_check: false`, `auto_start: true`, `auto_return: true` | 지정 난이도로 즉시 실행, 완료 후 앱 복귀 |
| `care` | 돌봄기관 또는 케어 앱 | `show_timer: false`, `show_score: false`, `show_settings: false`, `target_count: 1` | 헤더/타이머/점수/난이도 숨김, 중앙 과제 집중 |
| `ai_assisted` | AI 대화 중 게임 호출 | `show_condition_check: false`, `voice_guide_enabled: true`, `result_log_level: "detailed"` | AI/앱 외부 입력 메시지 대기, 게임 자체 STT 없음 |

## 3. 공통 config 명세

| config 항목 | 타입 | 설명 |
|---|---:|---|
| `show_timer` | boolean | 남은 시간 UI 표시 여부 |
| `show_score` | boolean | 진행/남은 개수 등 기록 UI 표시 여부 |
| `show_difficulty_select` | boolean | 난이도 선택 화면 표시 여부 |
| `show_settings` | boolean | 설정, 음악, 효과음, 음성 안내 토글 표시 여부 |
| `show_how_to_play` | boolean | 게임 방법 버튼 표시 여부 |
| `show_condition_check` | boolean | 시작 전 컨디션 체크 표시 여부 |
| `show_finish_check` | boolean | 종료 후 마무리 체크 표시 여부 |
| `soft_feedback` | boolean | 실패/오답 표현을 완화한 피드백 사용 여부 |
| `voice_guide_enabled` | boolean | 브라우저 TTS 음성 안내 사용 여부 |
| `hint_enabled` | boolean | 힌트 버튼 또는 힌트 기능 사용 여부 |
| `result_log_level` | string | 결과 로그 수준. `standard`, `summary`, `detailed` |
| `auto_start` | boolean | 인트로 이후 자동 시작 여부 |
| `auto_return` | boolean | 완료 후 앱 복귀 요청 메시지 자동 전송 여부 |

## 4. 게임 전용 config 명세

| config 항목 | 타입 | 설명 |
|---|---:|---|
| `question_count` | number | 총 문항 수 |
| `grid_rows` | number | 격자 행 수. 케어/AI 기본 2 |
| `grid_cols` | number | 격자 열 수. 케어/AI 기본 2 |
| `target_count` | number | 한 문항에서 기억해야 할 불빛 개수 |
| `exposure_time_ms` | number | 불빛 제시 시간(ms) |
| `round_time_limit_sec` | number | 선택 제한 시간(sec). `0`이면 타이머 비활성 |
| `auto_hint_enabled` | boolean | 자동 힌트 확장용 필드 |
| `flash_effect_level` | string | 불빛 효과 강도. `standard`, `low` |
| `high_contrast` | boolean | 고대비/명확한 선택 영역 적용 여부 |

## 5. 모드별 기본 config 값

| config 항목 | 설명 | standard | reminder | care easy | care normal | care hard | ai_assisted |
|---|---|---:|---:|---:|---:|---:|---:|
| `show_timer` | 타이머 표시 | true | true 또는 false | false | false | false | false |
| `show_score` | 점수/진행 표시 | true | false | false | false | false | false |
| `show_difficulty_select` | 난이도 선택 | true | false | false | false | false | false |
| `show_settings` | 설정 표시 | true | false | false | false | false | false |
| `show_how_to_play` | 게임 방법 표시 | true | false | false | false | false | false |
| `show_condition_check` | 시작 전 체크 | true | false | false | false | false | false |
| `show_finish_check` | 종료 후 체크 | true | false | false | false | false | false |
| `question_count` | 문항 수 | 10 | 5 | 3 | 5 | 7 | 3 |
| `grid_rows` | 격자 행 | 난이도별 | 앱 지정 | 2 | 3 | 4 | 2 |
| `grid_cols` | 격자 열 | 난이도별 | 앱 지정 | 2 | 3 | 4 | 2 |
| `target_count` | 기억할 불빛 수 | 2/3/4 | 앱 지정 | 1 | 2 | 3 | 1 |
| `exposure_time_ms` | 제시 시간 | 5000 | 5000 | 8000 | 7000 | 6000 | 8000 |
| `round_time_limit_sec` | 제한 시간 | 60 | 60 또는 0 | 0 | 0 | 0 | 0 |
| `hint_enabled` | 힌트 | true | true | true | true | true | true |
| `auto_hint_enabled` | 자동 힌트 | false | false | true | true | false | true |
| `auto_start` | 자동 시작 | false | true | true | true | true | true |
| `auto_return` | 자동 복귀 | false | true | true | true | true | true |
| `soft_feedback` | 완화 피드백 | false | true | true | true | true | true |
| `flash_effect_level` | 플래시 강도 | standard | standard | low | low | low | low |
| `high_contrast` | 고대비 | false | false | true | true | true | true |
| `voice_guide_enabled` | 음성 안내 | true | true | true | true | true | true |
| `result_log_level` | 로그 수준 | standard | summary | detailed | detailed | detailed | detailed |

현재 구현된 케어/AI 기본값은 `care easy` 기준입니다. `care normal`, `care hard`는 향후 기관/앱 설정에서 확장 가능한 권장값입니다.

## 6. 케어 모드 접근성 설계

케어 모드는 검사처럼 느껴지는 표현을 피하고, 쉬운 인지활동처럼 진행합니다.

### 6.1 진행 흐름

1. 안내/제시 단계
   - 예: "빛나는 전구 1개의 위치를 기억하세요."
   - 불빛이 켜진 위치를 충분히 보여줌

2. 가림/전환 단계
   - 예: "이제 같은 곳을 찾아볼까요?"
   - 불빛을 끄고 같은 격자만 보여줌

3. 답변 단계
   - 예: "방금 불이 켜졌던 곳을 눌러주세요."
   - 사용자가 같은 위치를 터치

4. 피드백 단계
   - 정답: "좋습니다. 잘 보셨어요."
   - 오답: "조금 헷갈릴 수 있어요. 제가 힌트를 드릴게요."

### 6.2 접근성 규칙

- 타이머 UI는 숨기고 내부 반응 시간만 기록
- 점수/성공률을 직접 노출하지 않음
- 실패/틀림 표현을 지양
- 빠른 깜빡임과 강한 플래시 효과 금지
- 2x2 격자, 불빛 1개부터 시작
- 버튼과 선택 영역을 크게 유지
- 모바일 세로/가로 WebView에서 잘림이 없도록 케어/AI 전용 레이아웃 사용

## 7. AI 연동 입력 인터페이스

AI 연동 모드에서는 WebView가 음성 인식을 직접 수행하지 않습니다. 앱/AI가 음성 인식 결과를 선택값으로 변환한 뒤 다음 메시지를 WebView에 전달합니다.

```js
window.postMessage({
  type: "EXTERNAL_ANSWER",
  payload: {
    input_type: "voice",
    selected_answer: "2",
    selected_index: 2,
    raw_transcript: "두 번째",
    confidence: 0.86
  }
});
```

### 7.1 EXTERNAL_ANSWER payload

| 필드 | 타입 | 설명 |
|---|---:|---|
| `input_type` | string | 외부 입력 종류. 예: `voice`, `ai`, `remote` |
| `selected_answer` | string/number | 앱/AI가 판단한 선택값 |
| `selected_index` | number | 선택 위치 index. 1 이상이면 1-based index로 처리 |
| `selected_position_index` | number | 위치 선택 index 대체 필드 |
| `raw_transcript` | string | STT 원문 |
| `confidence` | number | STT/AI 판단 신뢰도 |

게임은 `selected_index`, `selected_position_index`, `selected_answer` 중 숫자로 변환 가능한 값을 사용해 셀 선택을 수행합니다. 외부 입력으로 적용된 경우 결과 로그의 `input_type`은 `external`로 기록할 수 있습니다.

## 8. 앱 브릿지 메시지

게임은 다음 우선순위로 앱에 메시지를 보냅니다.

1. `window.ReactNativeWebView.postMessage(JSON.stringify(payload))`
2. `window.webkit.messageHandlers.gameBridge.postMessage(payload)`
3. 브릿지가 없으면 `console.log("[MOCK_GAME_MESSAGE]", payload)`

### 8.1 게임 → 앱 메시지 타입

| type | 전송 시점 | 설명 |
|---|---|---|
| `GAME_READY` | 로딩 완료 | WebView 게임 초기화 완료 |
| `GAME_STARTED` | 게임 세션 시작 | 세션 시작 및 config snapshot 전달 |
| `GAME_COMPLETED` | 모든 문항 완료 | 완료 결과 로그 전달 |
| `GAME_ABANDONED` | 중도 종료/이탈 | 중단 시점까지의 결과 로그 전달 |
| `GAME_RETURN_REQUESTED` | 결과 화면 버튼 또는 자동 복귀 | 앱 화면으로 돌아가야 함 |
| `EXTERNAL_ANSWER_APPLIED` | 외부 입력 적용 | AI/앱 입력값이 게임 선택으로 반영됨 |

## 9. 종료 상태별 결과 반환 스키마

| 종료 상태 | 정의 | 주요 필드 |
|---|---|---|
| `completed` | 모든 문항을 끝마친 경우 | `status: "completed"`, `completion_rate: 1.0`, `abandon_reason: null` |
| `abandoned` | 사용자가 종료 또는 앱 이탈한 경우 | `status: "abandoned"`, `abandoned_at`, `abandonedReason` |
| `error` | 에셋 누락 또는 예외 발생 | 향후 확장. `status: "error"`, `error_code`, `error_message` |

현재 구현은 `completed`, `abandoned` 중심이며, `error`는 추후 에러 바운더리 적용 시 확장합니다.

## 10. 결과 payload 예시

```json
{
  "type": "GAME_COMPLETED",
  "status": "completed",
  "session_id": "game_session_3001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "care",
  "difficulty": "easy",
  "config_snapshot": {
    "show_timer": false,
    "show_score": false,
    "show_difficulty_select": false,
    "show_settings": false,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 3,
    "grid_rows": 2,
    "grid_cols": 2,
    "target_count": 1,
    "exposure_time_ms": 8000,
    "round_time_limit_sec": 0,
    "hint_enabled": true,
    "auto_hint_enabled": true,
    "auto_start": true,
    "auto_return": true,
    "soft_feedback": true,
    "flash_effect_level": "low",
    "high_contrast": true,
    "voice_guide_enabled": true,
    "result_log_level": "detailed",
    "mode": "care"
  },
  "started_at": "2026-05-29T10:00:00+09:00",
  "ended_at": "2026-05-29T10:01:40+09:00",
  "duration_ms": 100000,
  "total_elapsed_ms": 100000,
  "total_questions": 3,
  "correct_count": 2,
  "wrong_count": 1,
  "hint_count": 1,
  "retry_count": 0,
  "avg_response_time_ms": 5200,
  "question_logs": [],
  "result_detail_json": {}
}
```

## 11. question_logs 문항별 로그

```json
{
  "question_id": "q1",
  "question_type": "position_memory",
  "cognitive_domain": "memory_activity",
  "difficulty": "easy",
  "prompt_type": "image",
  "grid_rows": 2,
  "grid_cols": 2,
  "target_count": 1,
  "exposure_time_ms": 8000,
  "target_positions": ["r1c2"],
  "selected_positions": ["r1c2"],
  "is_correct": true,
  "attempt_count": 1,
  "hint_used": false,
  "hint_count": 0,
  "replay_count": 0,
  "response_time_ms": 5300,
  "first_response_time_ms": 3600,
  "changed_answer_count": 0,
  "wrong_tap_count": 0,
  "drag_fail_count": 0,
  "input_type": "touch"
}
```

| 필드 | 설명 |
|---|---|
| `question_id` | 문항 ID |
| `question_type` | `position_memory` |
| `cognitive_domain` | `memory_activity` |
| `difficulty` | 해당 문항 난이도 |
| `prompt_type` | `image` |
| `grid_rows`, `grid_cols` | 격자 크기 |
| `target_count` | 기억해야 할 불빛 수 |
| `exposure_time_ms` | 제시 시간 |
| `target_positions` | 정답 위치 배열 |
| `selected_positions` | 사용자가 선택한 위치 배열 |
| `is_correct` | 정답 여부 |
| `attempt_count` | 선택 시도 수 |
| `hint_used` | 힌트 사용 여부 |
| `hint_count` | 힌트 사용 횟수 |
| `replay_count` | 다시 보기 횟수. 현재 기본 0 |
| `response_time_ms` | 최종 응답까지 걸린 시간 |
| `first_response_time_ms` | 첫 반응까지 걸린 시간 |
| `changed_answer_count` | 선택 변경 횟수. 현재 기본 0 |
| `wrong_tap_count` | 오답/잘못 누른 횟수 |
| `drag_fail_count` | 드래그 실패 횟수. 이 게임은 기본 0 |
| `input_type` | `touch`, `external` |

## 12. result_detail_json 게임별 상세값

```json
{
  "result_detail_json": {
    "grid_size": "2x2",
    "target_count": 1,
    "max_target_count": 1,
    "exposure_time_ms": 8000,
    "flash_effect_level": "low",
    "near_miss_count": 0,
    "replay_count": 0,
    "difficulty_downshifted": false
  }
}
```

| 필드 | 설명 |
|---|---|
| `grid_size` | 실행 격자 크기 |
| `target_count` | 실제 문항당 불빛 수 |
| `max_target_count` | 해당 세션에서 허용한 최대 불빛 수 |
| `exposure_time_ms` | 불빛 제시 시간 |
| `flash_effect_level` | 플래시 효과 강도 |
| `near_miss_count` | 정답 근처 오탭 수. 향후 확장 |
| `replay_count` | 다시 보기 횟수. 향후 확장 |
| `difficulty_downshifted` | 수행 중 난이도 자동 완화 여부 |

## 13. 예시 config

### 13.1 표준 모드

```json
{
  "session_id": "game_session_1001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "standard",
  "difficulty": "easy",
  "config": {
    "show_timer": true,
    "show_score": true,
    "show_difficulty_select": true,
    "show_settings": true,
    "show_how_to_play": true,
    "show_condition_check": true,
    "show_finish_check": true,
    "question_count": 10,
    "exposure_time_ms": 5000,
    "round_time_limit_sec": 60,
    "hint_enabled": true,
    "auto_start": false,
    "auto_return": false,
    "soft_feedback": false,
    "voice_guide_enabled": true,
    "result_log_level": "standard"
  }
}
```

### 13.2 알림 모드

```json
{
  "session_id": "game_session_2001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "reminder",
  "difficulty": "normal",
  "config": {
    "show_timer": true,
    "show_score": false,
    "show_difficulty_select": false,
    "show_settings": false,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 5,
    "exposure_time_ms": 5000,
    "round_time_limit_sec": 60,
    "hint_enabled": true,
    "auto_start": true,
    "auto_return": true,
    "soft_feedback": true,
    "voice_guide_enabled": true,
    "result_log_level": "summary"
  }
}
```

### 13.3 케어 모드

```json
{
  "session_id": "game_session_3001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "care",
  "difficulty": "easy",
  "config": {
    "show_timer": false,
    "show_score": false,
    "show_difficulty_select": false,
    "show_settings": false,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 3,
    "grid_rows": 2,
    "grid_cols": 2,
    "target_count": 1,
    "exposure_time_ms": 8000,
    "round_time_limit_sec": 0,
    "hint_enabled": true,
    "auto_hint_enabled": true,
    "auto_start": true,
    "auto_return": true,
    "soft_feedback": true,
    "flash_effect_level": "low",
    "high_contrast": true,
    "voice_guide_enabled": true,
    "result_log_level": "detailed"
  }
}
```

### 13.4 AI 연동 모드

```json
{
  "session_id": "game_session_4001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "ai_assisted",
  "difficulty": "easy",
  "config": {
    "show_timer": false,
    "show_score": false,
    "show_difficulty_select": false,
    "show_settings": false,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 3,
    "grid_rows": 2,
    "grid_cols": 2,
    "target_count": 1,
    "exposure_time_ms": 8000,
    "round_time_limit_sec": 0,
    "hint_enabled": true,
    "auto_start": true,
    "auto_return": true,
    "soft_feedback": true,
    "flash_effect_level": "low",
    "high_contrast": true,
    "voice_guide_enabled": true,
    "result_log_level": "detailed"
  }
}
```

