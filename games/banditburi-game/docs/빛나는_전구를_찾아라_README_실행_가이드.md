# 빛나는 전구를 찾아라 README / 실행 가이드

## 1. 개요

`빛나는 전구를 찾아라`는 WebView 기반 위치 기억활동 게임입니다. 사용자는 짧은 시간 동안 불이 켜진 위치를 기억한 뒤, 불이 사라진 후 같은 위치를 다시 선택합니다.

현재 게임 화면의 활동명은 `위치 기억활동`으로 표시되며, 지원 모드는 4가지입니다.

- `standard`: 표준 모드. 난이도 선택, 설정, 게임 방법 보기, 시작/종료 컨디션 체크, 점수 화면을 제공하는 일반 실행 모드입니다.
- `reminder`: 알림 모드. 보호자 또는 앱 알림 흐름에서 바로 실행하는 모드입니다. 게임 종료 후 결과 화면을 잠시 보여주고 허브로 자동 복귀합니다.
- `care`: 케어 모드. 돌봄기관/요양원 환경을 고려하여 타이머, 점수, 난이도 선택 등 주변 UI를 숨기고 중앙 과제에 집중하도록 구성한 모드입니다.
- `ai_assisted`: AI 연동 모드. 게임이 직접 마이크 권한이나 STT 처리를 하지 않고, 앱 또는 AI가 변환한 외부 입력값을 받아 선택에 반영하는 모드입니다.

## 2. 폴더 구조

현재 `banditburi-game` 폴더 안의 주요 구조는 아래와 같습니다.

```text
banditburi-game/
├─ index.html
├─ assets/
├─ config/
├─ css/
├─ docs/
├─ js/
├─ modes/
│  ├─ standard/
│  │  ├─ index.html
│  │  ├─ config/
│  │  │  └─ game.config.json
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ assets/
│  ├─ reminder/
│  │  ├─ index.html
│  │  ├─ config/
│  │  │  └─ game.config.json
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ assets/
│  ├─ care/
│  │  ├─ index.html
│  │  ├─ config/
│  │  │  └─ game.config.json
│  │  ├─ css/
│  │  ├─ js/
│  │  └─ assets/
│  └─ ai-assisted/
│     ├─ index.html
│     ├─ config/
│     │  └─ game.config.json
│     ├─ css/
│     ├─ js/
│     └─ assets/
└─ tools/
```

실제 모드별 실행은 `modes/모드명/index.html`을 기준으로 합니다.

## 3. 실행 방법

`banditburi-game` 폴더에서 정적 서버를 실행합니다.

```powershell
py -m http.server 8000
```

브라우저 또는 WebView에서 아래 URL로 접속합니다.

```text
http://127.0.0.1:8000/modes/standard/index.html
http://127.0.0.1:8000/modes/reminder/index.html
http://127.0.0.1:8000/modes/care/index.html
http://127.0.0.1:8000/modes/ai-assisted/index.html
```

허브 프로젝트 루트(`senior-care-game-hub`)에서 서버를 실행하는 경우에는 아래 경로로 접속합니다.

```text
http://127.0.0.1:8000/games/banditburi-game/modes/standard/index.html
http://127.0.0.1:8000/games/banditburi-game/modes/reminder/index.html
http://127.0.0.1:8000/games/banditburi-game/modes/care/index.html
http://127.0.0.1:8000/games/banditburi-game/modes/ai-assisted/index.html
```

주의: `file://`로 직접 열면 브라우저 보안 정책 때문에 config JSON fetch가 제한될 수 있습니다. 개발 확인은 정적 서버 실행을 권장합니다.

## 4. Config 수정 방법

모드별 기본 config 파일은 각 모드 폴더 안에 있습니다.

```text
modes/standard/config/game.config.json
modes/reminder/config/game.config.json
modes/care/config/game.config.json
modes/ai-assisted/config/game.config.json
```

예를 들어 케어 모드 설정을 바꾸려면 아래 파일을 수정합니다.

```text
modes/care/config/game.config.json
```

수정 후 브라우저 또는 WebView를 새로고침하면 반영됩니다.

실제 앱 연동 시에는 앱이 `window.__GAME_CONFIG__`로 전달하는 runtime config가 우선 적용되고, 로컬 `game.config.json`은 기본 실행 및 개발 확인용 fallback으로 사용됩니다.

## 5. Config 예시

케어 모드 config 예시입니다.

```json
{
  "gameId": "light-memory-game",
  "gameTitle": "빛나는 전구를 찾아라",
  "schemaVersion": "1.0.0",
  "mode": "care",
  "modeTitle": "케어 모드",
  "runtimeConfig": {
    "show_timer": false,
    "show_score": false,
    "show_difficulty_select": false,
    "show_settings": false,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 4,
    "grid_rows": 2,
    "grid_cols": 2,
    "target_count": 1,
    "exposure_time_ms": 8000,
    "round_time_limit_sec": 0,
    "total_time_limit_sec": 180,
    "hint_enabled": true,
    "auto_hint_enabled": true,
    "auto_hint_delay_sec": 40,
    "auto_start": true,
    "auto_return": true,
    "return_url": "file:///C:/Users/juhye/OneDrive/Desktop/senior-care-game-hub/index.html",
    "soft_feedback": true,
    "flash_effect_level": "low",
    "high_contrast": true,
    "voice_guide_enabled": true,
    "result_log_level": "detailed"
  }
}
```

## 6. 주요 Config 항목

| config | 항목 설명 |
| --- | --- |
| `mode` | 실행 모드입니다. `standard`, `reminder`, `care`, `ai_assisted` 중 하나를 사용합니다. |
| `modeTitle` | 모드 표시명입니다. |
| `show_timer` | 제한 시간 UI 노출 여부입니다. 케어/AI 연동 모드는 내부 제한시간은 사용하지만 화면에는 숨깁니다. |
| `show_score` | 점수 또는 진행 상태 UI 노출 여부입니다. |
| `show_difficulty_select` | 난이도 선택 화면 노출 여부입니다. |
| `show_settings` | 설정 화면 또는 설정 버튼 노출 여부입니다. |
| `show_how_to_play` | 게임 방법 보기 노출 여부입니다. |
| `show_condition_check` | 게임 시작 전 컨디션 체크 노출 여부입니다. |
| `show_finish_check` | 게임 종료 후 컨디션 체크 노출 여부입니다. |
| `show_score_screen` | 표준 모드 종료 후 점수 확인 화면 사용 여부입니다. |
| `question_count` | 총 문항 수입니다. |
| `grid_rows` / `grid_cols` | 보드의 행/열 개수입니다. 예: 2 x 2, 3 x 3, 4 x 4. |
| `target_count` | 한 문항에서 기억해야 하는 정답 위치 개수입니다. |
| `exposure_time_ms` | 정답 위치를 보여주는 시간입니다. 단위는 밀리초(ms)입니다. |
| `round_time_limit_sec` | 문항별 제한 시간입니다. 단위는 초(sec)입니다. |
| `total_time_limit_sec` | 전체 게임 제한 시간입니다. 케어/AI 연동 모드는 180초를 기본으로 사용합니다. |
| `hint_enabled` | 힌트 기능 사용 여부입니다. |
| `auto_hint_enabled` | 자동 힌트 사용 여부입니다. |
| `auto_hint_delay_sec` | 문항 시작 후 자동 힌트가 발동되기까지의 시간입니다. 단위는 초(sec)입니다. |
| `auto_start` | 진입 후 별도 선택 없이 자동 시작할지 여부입니다. |
| `auto_return` | 결과 표시 후 허브 또는 앱으로 자동 복귀할지 여부입니다. |
| `auto_return_delay_ms` | 자동 복귀까지 기다리는 시간입니다. 단위는 밀리초(ms)입니다. |
| `auto_return_url` / `return_url` | 자동 복귀 또는 돌아가기 버튼에서 사용할 허브 URL입니다. |
| `soft_feedback` | 오답 시 부정적인 표현을 피하고 부드러운 안내 문구를 사용할지 여부입니다. |
| `flash_effect_level` | 정답 연출 강도입니다. 시니어 접근성을 위해 케어/AI 연동 모드는 약한 효과를 사용합니다. |
| `high_contrast` | 선택 테두리 등 핵심 구분 요소를 더 명확하게 표시할지 여부입니다. |
| `voice_guide_enabled` | 안내 음성 재생 여부입니다. AI 음성 인식 기능을 의미하지 않습니다. |
| `result_log_level` | 결과 로그 상세 수준입니다. 예: `standard`, `summary`, `detailed`. |

## 7. 모드별 기본값 요약

| 항목 | standard | reminder | care | ai_assisted |
| --- | --- | --- | --- | --- |
| 기본 용도 | 일반 사용자 실행 | 알림 진입 실행 | 돌봄기관/케어 환경 | 앱/AI 외부 입력 연동 |
| 문항 수 | 10 | 5 | 4 | 4 |
| 난이도 선택 | 표시 | 숨김 | 숨김 | 숨김 |
| 설정 화면 | 표시 | 숨김 | 숨김 | 숨김 |
| 게임 방법 보기 | 표시 | 숨김 | 숨김 | 숨김 |
| 시작 전 컨디션 체크 | 표시 | 숨김 | 숨김 | 숨김 |
| 종료 후 컨디션 체크 | 표시 | 숨김 | 숨김 | 숨김 |
| 점수 화면 | 기본 On | 사용 안 함 | 사용 안 함 | 사용 안 함 |
| 타이머 UI | 표시 | 표시 | 숨김 | 숨김 |
| 자동 시작 | 사용 안 함 | 사용 | 사용 | 사용 |
| 자동 힌트 | 사용 안 함 | 사용 안 함 | 40초 후 발동 | 40초 후 발동 |
| 전체 제한시간 | 사용 안 함 | 사용 안 함 | 180초 | 180초 |
| 자동 복귀 | 사용 안 함 | 결과 후 자동 복귀 | 버튼/결과 후 복귀 | 버튼/결과 후 복귀 |
| 결과 로그 수준 | standard | summary | detailed | detailed |

## 8. 앱 연동 구조

앱은 WebView 로드 전에 `window.__GAME_CONFIG__`를 주입하여 runtime config를 전달할 수 있습니다.

```javascript
window.__GAME_CONFIG__ = {
  session_id: "session-001",
  content_id: "memory_light_bulb_001",
  assignment_id: "assignment-001",
  senior_id: "senior-001",
  guardian_id: "guardian-001",
  game_key: "light_memory",
  mode: "care",
  difficulty: "easy",
  runtimeConfig: {
    show_timer: false,
    show_score: false,
    show_difficulty_select: false,
    question_count: 4,
    grid_rows: 2,
    grid_cols: 2,
    target_count: 1,
    exposure_time_ms: 8000,
    total_time_limit_sec: 180,
    auto_hint_enabled: true,
    auto_hint_delay_sec: 40,
    voice_guide_enabled: true
  }
};
```

게임은 앱으로 메시지를 보낼 때 아래 브리지를 사용합니다.

```javascript
window.ReactNativeWebView.postMessage(JSON.stringify(payload));
window.webkit.messageHandlers.gameBridge.postMessage(payload);
```

브리지가 없는 로컬 브라우저 환경에서는 콘솔에 `[MOCK_GAME_MESSAGE]`로 출력됩니다.

게임에서 앱으로 전달하는 주요 메시지 타입은 아래와 같습니다.

- `GAME_READY`: 게임 로딩 및 초기화 완료
- `GAME_STARTED`: 플레이 시작
- `GAME_COMPLETED`: 정상 완료
- `GAME_ABANDONED`: 중도 종료
- `GAME_RETURN_REQUESTED`: 허브 또는 효담콜로 돌아가기 요청
- `EXTERNAL_ANSWER_APPLIED`: AI 연동 모드 외부 입력 적용

## 9. 결과 로그

게임 완료, 중단, 외부 입력 적용 시 앱으로 payload를 전달합니다.

정상 완료 예시:

```json
{
  "type": "GAME_COMPLETED",
  "status": "completed",
  "session_id": "session-001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "standard",
  "difficulty": "easy",
  "config_snapshot": {},
  "started_at": "2026-06-05T10:00:00.000Z",
  "ended_at": "2026-06-05T10:03:00.000Z",
  "duration_ms": 180000,
  "total_elapsed_ms": 180000,
  "total_questions": 10,
  "correct_count": 8,
  "wrong_count": 2,
  "hint_count": 1,
  "retry_count": 0,
  "avg_response_time_ms": 2400,
  "metrics": {
    "first_response_time_ms": 1300,
    "changed_answer_count": 1,
    "touch_miss_count": 0
  },
  "condition": {
    "before": {},
    "after": {}
  },
  "question_logs": [],
  "result_detail_json": {}
}
```

중도 종료 예시:

```json
{
  "type": "GAME_ABANDONED",
  "status": "abandoned",
  "session_id": "session-001",
  "content_id": "memory_light_bulb_001",
  "game_key": "light_memory",
  "mode": "care",
  "abandoned": true,
  "abandonedReason": "user_return_requested",
  "abandonedAt": "2026-06-05T10:01:00.000Z"
}
```

## 10. AI 연동 모드 외부 입력

AI 연동 모드는 게임이 직접 음성 인식, 마이크 권한 요청, AI 판단을 수행하지 않습니다.

앱 또는 AI가 음성 인식 결과를 위치 선택값으로 변환한 뒤 게임에 전달해야 합니다.

외부 입력 예시:

```javascript
window.postMessage({
  type: "EXTERNAL_ANSWER",
  payload: {
    selected_index: 1,
    input_type: "ai_assisted",
    raw_transcript: "왼쪽 위",
    confidence: 0.92
  }
}, "*");
```

허용되는 선택값 필드:

- `selected_index`
- `selected_position_index`
- `selected_answer`

앱 연동 시에는 1부터 시작하는 위치 번호를 권장합니다. 예를 들어 2 x 2 보드 기준으로 `1`은 첫 번째 칸, `4`는 네 번째 칸입니다.

## 11. 개발 확인용 콘솔 명령

현재 앱에서 주입한 config 확인:

```javascript
window.__GAME_CONFIG__
```

AI 연동 모드 외부 입력 테스트:

```javascript
window.postMessage({
  type: "EXTERNAL_ANSWER",
  payload: {
    selected_index: 1,
    raw_transcript: "첫 번째",
    confidence: 0.9
  }
}, "*");
```

로컬 브라우저에서 앱 메시지 전송 확인:

```text
브라우저 개발자도구 Console에서 [MOCK_GAME_MESSAGE] 로그 확인
```

## 12. 주의사항

- config JSON 값은 게임 시작 시 읽힙니다. 수정 후에는 새로고침 또는 재실행이 필요합니다.
- 실제 앱 연동 시에는 앱이 전달하는 `window.__GAME_CONFIG__` 값이 우선 적용됩니다.
- 로컬 `game.config.json`은 앱 연동 전 테스트와 기본 실행을 위한 fallback 용도입니다.
- `voice_guide_enabled`는 안내 음성 재생 여부만 제어하며, AI 음성 인식 기능을 의미하지 않습니다.
- `ai_assisted` 모드는 외부 입력값을 받을 뿐, 게임 내부에서 STT 또는 AI 판단을 수행하지 않습니다.
- 케어 모드와 AI 연동 모드는 제한시간을 화면에 표시하지 않지만, 내부적으로 전체 제한시간과 자동 힌트 시간을 사용합니다.
- 알림 모드는 결과 메시지 표시 후 허브 페이지로 자동 복귀하도록 구성되어 있습니다.
