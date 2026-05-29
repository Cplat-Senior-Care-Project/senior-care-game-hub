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

## 1. 다중 실행 모드 (Multi-Mode) 인터페이스 아키텍처

`빛나는 전구를 찾아라`는 B2C 대중적 서비스부터 B2B/B2G 요양원, 돌봄기관, 복지케어 환경까지 같은 위치 기억 게임 로직을 유지합니다. 실행 모드별 파라미터 `config`를 조정하여 WebView 화면 구성, 조작 난이도, 피드백 강도, 결과 로그 수준을 제어합니다.

| 모드 | mode | 대상/진입 환경 | 핵심 동작 |
|---|---|---|---|
| 표준 모드 | `standard` | 일반 사용자, B2C 서비스 | 사용자가 난이도를 직접 선택할 수 있고, 타이머/점수/설정/게임 방법/오늘 기분/소감 체크 팝업을 활성화합니다. |
| 알림 모드 | `reminder` | 보호자 알림, 앱 알림 과제 | 보호자 또는 앱이 설정한 난이도로 즉시 시작하고, 완료 후 다시하기를 생략하며 2~3초 완료 화면 표출 후 효담콜 앱으로 자동 복귀합니다. |
| 케어 모드 | `care` | 요양원, 돌봄기관, 복지케어 환경 | 모든 헤더 통계, 타이머, 점수, 난이도 선택, 시작 전 기분 체크를 숨기고 중앙 과제에 집중하도록 구성합니다. |
| AI 연동 모드 | `ai_assisted` | 향후 음성 대화 연동 환경 | WebView가 마이크 권한 획득이나 STT 처리를 직접 하지 않고, 앱이 전달한 음성 텍스트 또는 선택값을 수신하여 상호작용합니다. |

AI 연동 모드에서 게임은 녹음, 음성 인식, AI 판단을 수행하지 않습니다. 앱 또는 AI 레이어가 음성을 텍스트/선택값으로 변환한 뒤 `EXTERNAL_ANSWER` 메시지로 WebView에 전달합니다.

## 2. 실행 모드별 파라미터 호출 규격 (Input Parameter Matrix)

앱은 WebView를 로드하기 전 또는 HTML 내 `window.__GAME_CONFIG__`로 실행 설정을 전달합니다. snake_case와 camelCase는 모두 수신 가능하도록 설계하되, 문서 표준은 snake_case를 기준으로 합니다.

### 2.1 기본 진입값

```json
{
  "session_id": "game_session_3001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "care",
  "difficulty": "easy"
}
```

| 필드 | 타입 | 필수 | 설명 |
|---|---:|---:|---|
| `session_id` | string | 권장 | 앱이 발급한 게임 실행 세션 ID. 없으면 게임이 로컬 세션 ID를 생성합니다. |
| `content_id` | string | 권장 | 콘텐츠 ID. 기본값은 `memory_light_bulb_001`입니다. |
| `game_key` | string | 필수 | 게임 식별자. `light_memory`를 사용합니다. |
| `mode` | string | 필수 | `standard`, `reminder`, `care`, `ai_assisted` 중 하나입니다. |
| `difficulty` | string | 권장 | `easy`, `normal`, `hard` 중 하나입니다. 케어/AI 기본값은 `easy`입니다. |
| `assignment_id` | string | 선택 | 알림, 과제, 기관 배정 ID입니다. |
| `senior_id` | string | 선택 | 시니어 사용자 ID입니다. |
| `guardian_id` | string | 선택 | 보호자 ID입니다. |
| `play_source` | string | 선택 | 실행 출처입니다. 예: `manual`, `reminder`, `care`, `ai_assisted` |
| `config` | object | 권장 | 화면, 난이도, 로그 수준을 제어하는 세부 설정입니다. |

### 2.2 모드별 호출 매트릭스

| 항목 | standard | reminder | care | ai_assisted |
|---|---|---|---|---|
| 권장 진입 URL | `/modes/standard/index.html` | `/modes/reminder/index.html` | `/modes/care/index.html` | `/modes/ai-assisted/index.html` |
| 난이도 결정 | 사용자 직접 선택 | 앱/보호자 지정 | 기관/앱 지정 | 앱/AI 시나리오 지정 |
| 시작 방식 | 사용자가 시작 | 자동 시작 | 자동 시작 | 자동 시작 |
| 완료 후 동작 | 결과 화면 유지 | 자동 복귀 | 자동 복귀 | 자동 복귀 또는 AI 흐름 복귀 |
| 결과 로그 수준 | `standard` | `summary` | `detailed` | `detailed` |
| 입력 방식 | 터치 | 터치 | 터치 | 터치 + 외부 입력 |

## 3. 종료 상태별 결과 반환 스키마 명세 (Output Log Status Spec)

게임은 앱 브릿지를 통해 JSON 메시지를 반환합니다. 브릿지 우선순위는 `window.ReactNativeWebView.postMessage`, `window.webkit.messageHandlers.gameBridge.postMessage`, 콘솔 mock 로그 순서입니다.

### 3.1 게임 → 앱 메시지 타입

| type | 전송 시점 | 설명 |
|---|---|---|
| `GAME_READY` | 게임 로딩 완료 | WebView 게임 초기화 완료 및 config 수신 가능 상태 |
| `GAME_STARTED` | 세션 시작 | 시작 시간과 `config_snapshot` 전달 |
| `GAME_COMPLETED` | 모든 문항 완료 | 최종 결과와 상세 로그 전달 |
| `GAME_ABANDONED` | 중도 종료/이탈 | 중단 시점까지의 결과와 이탈 사유 전달 |
| `GAME_RETURN_REQUESTED` | 완료 후 자동 복귀 또는 홈 버튼 | 앱 화면으로 돌아가야 함을 요청 |
| `EXTERNAL_ANSWER_APPLIED` | AI/앱 외부 입력 적용 | 외부 선택값이 게임 선택으로 반영되었음을 알림 |

### 3.2 종료 상태값

| status | 정의 | 필수/권장 필드 |
|---|---|---|
| `completed` | 모든 문항을 끝마친 경우 | `session_id`, `content_id`, `game_key`, `mode`, `difficulty`, `started_at`, `ended_at`, `duration_ms`, `correct_count`, `wrong_count`, `result_detail_json` |
| `abandoned` | 사용자가 중도 종료하거나 앱이 이탈한 경우 | `status`, `abandoned_at`, `abandoned_reason`, `question_logs` |
| `error` | 에셋 누락, 런타임 예외, config 오류 등 | `status`, `error_code`, `error_message` |

### 3.3 결과 payload 기본 구조

```json
{
  "type": "GAME_COMPLETED",
  "status": "completed",
  "session_id": "game_session_3001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "care",
  "difficulty": "easy",
  "config_snapshot": {},
  "started_at": "2026-05-29T10:00:00+09:00",
  "ended_at": "2026-05-29T10:01:40+09:00",
  "duration_ms": 100000,
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

## 4. 케어 모드 시니어 접근성 (AX) 설계 의도

케어 모드는 검사나 평가처럼 느껴지지 않도록 화면 정보를 줄이고, 사용자가 과제 하나에 편안하게 집중하도록 설계합니다.

### 4.1 제시 → 가림 → 답변 3단계 학습 루프

1. 제시 단계: 빛나는 전구 위치를 먼저 충분히 보여줍니다.
2. 가림 단계: 전구를 꺼서 위치 기억을 유도합니다.
3. 답변 단계: 같은 위치를 다시 터치하도록 안내합니다.

이 게임은 과일 개수 선택형 게임이 아니라 위치 기억형 게임이므로, 선택지는 한글 숫자 카드가 아니라 큰 격자 셀입니다. 다만 의도는 동일하게 “먼저 보여주고, 가린 뒤, 부담 없는 선택으로 답변”하는 구조입니다.

### 4.2 시니어 존중 격려 가이드라인

| 상황 | 지양 표현 | 권장 표현 |
|---|---|---|
| 오답 | 틀렸어요 | 조금 헷갈릴 수 있어요. 힌트를 드릴게요. |
| 재시도 | 다시 하세요 | 천천히 다시 찾아볼까요? |
| 성공 | 정답입니다 | 좋습니다. 잘 보셨어요. |
| 완료 | 종료 | 오늘은 기억력 훈련을 했어요. 끝까지 함께해 주셔서 감사합니다. |

### 4.3 화면 접근성 규칙

- 타이머, 점수, 성공률, 헤더 통계는 숨기고 내부 로그로만 기록합니다.
- 빠른 깜빡임과 강한 플래시 효과를 낮춥니다.
- 케어 기본은 `2x2` 격자와 불빛 `1개`로 시작합니다.
- 버튼과 선택 영역을 크게 유지합니다.
- 모바일 세로/가로 WebView에서 보드와 완료 카드가 잘리지 않도록 케어/AI 전용 레이아웃을 사용합니다.

## 5. 인지 활동 게임별 Config 파라미터 상세 명세

### ■ 빛나는 전구를 찾아라 (game_key: `light_memory`)

### 5.1 기본 진입값

```json
{
  "session_id": "",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "standard",
  "difficulty": "easy"
}
```

### 5.2 공통 config (모드별 기본값)

```json
{
  "show_timer": true,
  "show_score": true,
  "show_difficulty_select": true,
  "show_settings": true,
  "show_how_to_play": true,
  "show_condition_check": true,
  "show_finish_check": true,
  "soft_feedback": false,
  "voice_guide_enabled": true,
  "hint_enabled": true,
  "result_log_level": "standard"
}
```

| config 항목 | 타입 | 설명 |
|---|---:|---|
| `show_timer` | boolean | 남은 시간 UI 표시 여부입니다. |
| `show_score` | boolean | 진행/점수/남은 개수 등 기록 UI 표시 여부입니다. |
| `show_difficulty_select` | boolean | 난이도 선택 화면 표시 여부입니다. |
| `show_settings` | boolean | 설정, 음악, 효과음, 음성 안내 토글 표시 여부입니다. |
| `show_how_to_play` | boolean | 게임 방법 버튼 표시 여부입니다. |
| `show_condition_check` | boolean | 시작 전 컨디션 체크 표시 여부입니다. |
| `show_finish_check` | boolean | 종료 후 소감/상태 체크 표시 여부입니다. |
| `soft_feedback` | boolean | 실패/오답 표현을 완화한 피드백 사용 여부입니다. |
| `voice_guide_enabled` | boolean | 브라우저 TTS 음성 안내 사용 여부입니다. |
| `hint_enabled` | boolean | 힌트 버튼 또는 힌트 기능 사용 여부입니다. |
| `result_log_level` | string | 결과 로그 수준입니다. `standard`, `summary`, `detailed` |

### 5.3 게임 전용 config (이 게임에만 해당하는 항목)

```json
{
  "question_count": 3,
  "grid_rows": 2,
  "grid_cols": 2,
  "target_count": 1,
  "exposure_time_ms": 8000,
  "round_time_limit_sec": 0,
  "auto_hint_enabled": true,
  "auto_start": true,
  "auto_return": true,
  "flash_effect_level": "low",
  "high_contrast": true,
  "external_input_enabled": false
}
```

| config 항목 | 타입 | 설명 |
|---|---:|---|
| `question_count` | number | 총 문항 수입니다. 케어 기본값은 3문항입니다. |
| `grid_rows` | number | 격자 행 수입니다. 케어/AI 기본값은 2입니다. |
| `grid_cols` | number | 격자 열 수입니다. 케어/AI 기본값은 2입니다. |
| `target_count` | number | 한 문항에서 기억해야 할 불빛 개수입니다. |
| `exposure_time_ms` | number | 불빛을 먼저 보여주는 시간(ms)입니다. |
| `round_time_limit_sec` | number | 답변 제한 시간(sec)입니다. `0`이면 타이머를 비활성화합니다. |
| `auto_hint_enabled` | boolean | 일정 시간이 지나면 힌트를 자동 제공할 수 있는 확장 필드입니다. |
| `auto_start` | boolean | 인트로 이후 자동으로 게임을 시작할지 여부입니다. |
| `auto_return` | boolean | 완료 후 앱 복귀 요청 메시지를 자동 전송할지 여부입니다. |
| `flash_effect_level` | string | 불빛 효과 강도입니다. `standard`, `low` |
| `high_contrast` | boolean | 고대비/명확한 선택 영역 적용 여부입니다. |
| `external_input_enabled` | boolean | 앱/AI가 전달한 외부 선택 입력을 허용할지 여부입니다. AI 연동 모드에서 true를 권장합니다. |

### 5.4 모드별 전용 config 기본값 표

| config 항목 | standard | reminder | care | ai_assisted |
|---|---:|---:|---:|---:|
| `show_timer` | true | true | false | false |
| `show_score` | true | false | false | false |
| `show_difficulty_select` | true | false | false | false |
| `show_settings` | true | false | false | false |
| `show_how_to_play` | true | false | false | false |
| `show_condition_check` | true | false | false | false |
| `show_finish_check` | true | false | false | false |
| `question_count` | 10 | 5 | 3 | 3 |
| `grid_rows` | 난이도별 | 앱 지정 | 2 | 2 |
| `grid_cols` | 난이도별 | 앱 지정 | 2 | 2 |
| `target_count` | 난이도별 | 앱 지정 | 1 | 1 |
| `exposure_time_ms` | 5000 | 5000 | 8000 | 8000 |
| `round_time_limit_sec` | 60 | 60 또는 0 | 0 | 0 |
| `hint_enabled` | true | true | true | true |
| `auto_hint_enabled` | false | false | true | true |
| `auto_start` | false | true | true | true |
| `auto_return` | false | true | true | true |
| `soft_feedback` | false | true | true | true |
| `flash_effect_level` | `standard` | `standard` | `low` | `low` |
| `high_contrast` | false | false | true | true |
| `voice_guide_enabled` | true | true | true | true |
| `external_input_enabled` | false | false | false | true |
| `result_log_level` | `standard` | `summary` | `detailed` | `detailed` |

### 5.5 result_detail_json (게임별 상세 결과값)

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
    "difficulty_downshifted": false,
    "external_input_used": false
  }
}
```

| 필드 | 설명 |
|---|---|
| `grid_size` | 실행 격자 크기입니다. 예: `2x2`, `3x3` |
| `target_count` | 실제 문항당 불빛 수입니다. |
| `max_target_count` | 해당 세션에서 허용한 최대 불빛 수입니다. |
| `exposure_time_ms` | 불빛 제시 시간입니다. |
| `flash_effect_level` | 플래시 효과 강도입니다. |
| `near_miss_count` | 정답 위치 주변을 잘못 누른 횟수입니다. 향후 확장 지표입니다. |
| `replay_count` | 다시 보기 횟수입니다. 현재 기본 0입니다. |
| `difficulty_downshifted` | 수행 중 난이도 자동 완화 여부입니다. |
| `external_input_used` | AI/앱 외부 입력이 실제 답변에 사용되었는지 여부입니다. |

## 6. 텔레메트리 로그 공통 확장 필드

모든 게임에 공통으로 적용되는 수집 지표이며, `question_logs`의 문항별 필드 또는 세션 집계 필드로 저장할 수 있습니다.

| 필드 | 타입 | 수집 단위 | 설명 |
|---|---:|---|---|
| `first_response_time_ms` | number | 문항별 | 문제 자극이 답변 단계로 전환된 후 어르신이 첫 반응을 할 때까지 걸린 시간(ms)입니다. 초기 인지 처리 속도 측정에 활용합니다. |
| `changed_answer_count` | number | 문항별/세션 | 최종 제출 전 다른 선택지를 탭하여 선택을 바꾼 횟수입니다. 확신 부족 또는 시각 혼동 수준 수치화에 활용합니다. |
| `touch_miss_count` | number | 문항별/세션 | 선택 카드 또는 격자 영역 밖을 터치한 횟수입니다. 운동기능 저하, 손떨림, 터치 실수 탐지 및 버튼 크기 튜닝 지표로 활용합니다. |
| `wrong_tap_count` | number | 문항별/세션 | 잘못된 격자 셀을 누른 횟수입니다. `touch_miss_count`와 달리 게임 영역 안의 오답 선택입니다. |
| `drag_fail_count` | number | 문항별/세션 | 드래그 기반 게임 공통 확장 필드입니다. 이 게임은 터치 선택형이므로 기본값은 0입니다. |
| `replay_count` | number | 문항별/세션 | 다시 보기 또는 반복 안내 횟수입니다. |

### 6.1 question_logs 문항별 예시

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
  "touch_miss_count": 0,
  "wrong_tap_count": 0,
  "drag_fail_count": 0,
  "input_type": "touch"
}
```

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

| 필드 | 타입 | 설명 |
|---|---:|---|
| `input_type` | string | 외부 입력 종류입니다. 예: `voice`, `ai`, `remote` |
| `selected_answer` | string/number | 앱/AI가 판단한 선택값입니다. |
| `selected_index` | number | 선택 위치 index입니다. 1 이상이면 1-based index로 처리합니다. |
| `selected_position_index` | number | 위치 선택 index 대체 필드입니다. |
| `raw_transcript` | string | STT 원문입니다. |
| `confidence` | number | STT/AI 판단 신뢰도입니다. |

게임은 `selected_index`, `selected_position_index`, `selected_answer` 중 숫자로 변환 가능한 값을 사용해 셀 선택을 수행합니다. 외부 입력으로 적용된 경우 결과 로그의 `input_type`은 `external`로 기록할 수 있습니다.

## 8. 모드별 호출 예시

### 8.1 표준 모드

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

### 8.2 알림 모드

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

### 8.3 케어 모드

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

### 8.4 AI 연동 모드

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
    "external_input_enabled": true,
    "result_log_level": "detailed"
  }
}
```
