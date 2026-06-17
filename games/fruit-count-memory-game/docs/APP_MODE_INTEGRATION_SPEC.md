# 앱 연동 및 실행 모드 명세

대상 게임: 쏙쏙 개수 찾기 (`fruit-count-memory-game`)

## 목적

`요구사항_실행모드_앱연동` 탭의 실행 모드와 앱-게임 인터페이스 요구사항을 구현 기준으로 정리한다.

## 실행 URL

| 모드 | 실행 예시 | 기본 동작 |
|---|---|---|
| `standard` | `index.html?mode=standard` | 난이도 선택, 점수/기록, 설정, 컨디션 체크 노출 |
| `reminder` | `index.html?mode=reminder` | 앱/보호자 알림 설정값으로 바로 실행 |
| `care` | `index.html?mode=care` | 5문항, 60초, 부가 UI 축소 |
| `ai_assisted` | `index.html?mode=ai_assisted` | 케어형 UI와 외부 입력 인터페이스 활성화 |

`configUrl`을 전달하면 해당 config 파일을 우선 사용한다.

```text
index.html?mode=care&configUrl=config/care.config.json
```

## 앱에서 전달하는 주요 config

앱은 실행마다 아래 값을 전달한다. snake_case와 camelCase는 `config-normalizer.js`에서 정규화한다.

| 필드 | 필수 여부 | 설명 |
|---|---|---|
| `session_id` / `sessionId` | 필수 | 1회 플레이를 구분하는 세션 ID |
| `content_id` / `contentId` | 필수 | 실행 콘텐츠 ID |
| `game_key` / `gameKey` | 필수 | 게임 종류 키, 기본값 `counting_fruits` |
| `game_version` / `gameVersion` | 필수 | 게임 버전 |
| `mode` | 필수 | `standard`, `reminder`, `care`, `ai_assisted` |
| `difficulty` / `difficultyKey` | 조건부 | 앱이 지정한 난이도 |
| `play_source` / `playSource` | 필수 | `manual`, `reminder`, `care_session`, `ai_recommendation`, `history_replay` |
| `assignment_id`, `alarm_id`, `schedule_id` | 선택 | 알림/예약/할당 식별자 |
| `client_context` | 선택 | 기기, 앱 버전, timezone 등 |
| `voice_context` | 선택 | 실제 사용 음성 프로필 정보 |

## 게임에서 앱으로 보내는 이벤트

게임은 `window.FruitCountMemoryGameAppBridge`를 통해 이벤트를 전달한다. 로컬 mock bridge는 `ReactNativeWebView.postMessage()`, `parent.postMessage()` 또는 `opener.postMessage()`로 같은 이벤트를 송신한다.

| 이벤트 | 발생 시점 | payload |
|---|---|---|
| `GAME_READY` | config 적용 및 초기화 완료 | 실행 config 요약, 외부 입력 상태 |
| `GAME_STARTED` | 실제 플레이 시작 | 세션, 모드, 난이도, 시작 시각 |
| `SESSION_COMPLETE` | 정상 완료 | `status: "completed"` 결과 JSON |
| `SESSION_ABORT` | 중단/시간 초과/닫힘 | `status: "abandoned"` 결과 JSON |
| `GAME_ERROR` | 게임 내부 오류 | `status: "error"` 결과 JSON |
| `GAME_EXIT_REQUESTED` | 앱/허브 복귀 요청 | 복귀 위치와 세션 정보 |

신규 앱과 결과 서버 연동은 실제 브릿지 기준 이벤트명인 `SESSION_COMPLETE` / `SESSION_ABORT`를 사용한다.

## 결과 상태

| status | 의미 | 대표 사유 |
|---|---|---|
| `completed` | 모든 문항 완료 | `all_questions` |
| `abandoned` | 중단 또는 미완료 종료 | `user_quit`, `timeout`, `webview_closed`, `app_background` |
| `error` | 게임 내부 오류 | config 오류, 에셋 로드 실패, 초기화 실패 |

서버/API 저장 오류는 게임 클라이언트 책임이 아니다. 게임은 결과 JSON을 앱에 반환하고, 앱이 결과 수집 API를 호출한다.

## 외부 입력

`ai_assisted` 모드에서 앱/AI는 다음 방식 중 하나로 선택값을 전달할 수 있다.

```js
window.FruitCountMemoryGameExternalInput.submitAnswer({
  selected_answer: 3,
  input_type: "external",
  raw_transcript: "세 개",
  confidence: 0.91,
  request_id: "ai-input-001"
});
```

또는 `postMessage`:

```js
window.postMessage({
  type: "EXTERNAL_ANSWER",
  payload: {
    selected_answer: 3,
    input_type: "external",
    raw_transcript: "세 개",
    confidence: 0.91,
    request_id: "ai-input-001"
  }
}, "*");
```

게임은 STT나 AI 판단을 직접 수행하지 않고, 앱/AI가 변환한 선택값만 처리한다.

## 히스토리 재실행

히스토리에서 동일 콘텐츠를 다시 실행할 때 앱은 반드시 새 `session_id`를 발급한다.

| 항목 | 기준 |
|---|---|
| `content_id` | 기존 콘텐츠와 같아도 됨 |
| `game_key` | 기존 게임과 같아도 됨 |
| `session_id` | 반드시 새 값 |
| `play_source` | `history_replay` |

기존 결과를 재사용하거나 덮어쓰지 않는다. 결과 수집 서버는 새 `session_id`를 별도 row로 저장한다.
