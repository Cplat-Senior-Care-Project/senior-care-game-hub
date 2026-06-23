# 도깨비야! 무슨 색을 먹니? 코드 README / 실행 가이드

## 1. 개요

`도깨비야! 무슨 색을 먹니?`은 동물에게 맞는 먹이를 주고, 정리 물건은 정리 구역으로 보내는 WebView 기반 시니어 인지 활동 게임입니다.

지원 모드는 4가지입니다.

| 모드 | mode 값 | 설명 |
|---|---|---|
| 표준 모드 | `standard` | 게임 안에서 난이도를 선택하고 진행 표시, 도움, 안내 화면을 제공합니다. |
| 알림 모드 | `reminder` | 앱 config로 바로 짧게 실행하는 모드입니다. |
| 케어 모드 | `care` | 큰 선택지와 낮은 자극을 우선하는 쉬운 모드입니다. |
| AI 연동 모드 | `ai_assisted` | AI 대화 중 짧은 활동으로 실행하고 대화 복귀를 안내합니다. |

## 2. 폴더 구조

```text
제출코드/
├─ index.html
├─ js/
│  ├─ core-config.js
│  ├─ audio-display.js
│  ├─ screen-flow.js
│  ├─ session-board.js
│  ├─ play-input.js
│  └─ result-bridge.js
├─ data/
│  └─ animal-feeding-content.json
├─ css/
│  ├─ base.css
│  ├─ screens.css
│  ├─ game-layout.css
│  ├─ responsive.css
│  ├─ feedback.css
│  └─ farm-theme.css
└─ image/
   ├─ farm-background.png
   ├─ animal-pen.png
   ├─ cleanup-zone.png
   ├─ feed-tray.png
   ├─ nameplate.png
   ├─ game-title.png
   ├─ red_goblin.png
   ├─ red_goblin_correct.png
   ├─ green_goblin.png
   ├─ green_goblin_correct.png
   ├─ white_goblin.png
   ├─ white_goblin_correct.png
   ├─ yellow_goblin.png
   ├─ yellow_goblin_correct.png
   ├─ mystery_goblin.png
   ├─ tomato.png
   ├─ cherry.png
   ├─ apple.png
   ├─ red_chili_pepper.png
   ├─ red_bell_pepper.png
   ├─ strawberry.png
   ├─ kiwi.png
   ├─ green_grape.png
   ├─ pea_pod.png
   ├─ broccoli.png
   ├─ cucumber.png
   ├─ green_apple.png
   ├─ garlic.png
   ├─ onion.png
   ├─ pear.png
   ├─ peach.png
   ├─ mushroom.png
   ├─ radish.png
   ├─ chamoe.png
   ├─ corn.png
   ├─ pineapple.png
   ├─ yellow_bell_pepper.png
   ├─ yellow_banana.png
   ├─ talisman.png
   └─ bin.png
```

별도 `config/` 폴더는 없습니다. 실행 설정은 URL query 또는 앱 WebView 메시지로 전달합니다. `data/animal-feeding-content.json`은 검토용 콘텐츠/문항/모드 기본값 명세이며, 실행 로직은 WebView 안정성을 위해 JS 내부 상수와 동일한 구조를 사용합니다.

JS는 번들러 없이 WebView와 `file://` 미리보기에 안전한 일반 `<script>` 순서 로딩 방식입니다.

| 파일 | 담당 범위 |
|---|---|
| `js/core-config.js` | 상수, 동물/먹이 데이터, 런타임 config, 앱 브릿지 수신 |
| `js/audio-display.js` | 음성 안내, 효과음, 전체화면/가로모드 요청 |
| `js/screen-flow.js` | 로딩, 시작 화면, 난이도 선택, 안내/카운트다운 |
| `js/session-board.js` | 세션 생성, 문항 큐, 동물 우리/정리 구역 렌더링 |
| `js/play-input.js` | 문항 표시, 터치/드래그 입력, 정답/오답 피드백, 도움 |
| `js/result-bridge.js` | 완료/중단, 체크 화면, 결과 로그, 앱 복귀/오류 처리 |
| `data/animal-feeding-content.json` | 동물, 먹이, 정리 물건, 난이도/모드 기본값 명세 |

유지보수 기준:

- 새 동물/먹이는 `core-config.js`의 `ANIMALS`, `FOODS`, `ANIMAL_POOL`에 추가합니다.
- 모드/config 규칙은 `core-config.js`의 `normalizeRuntimeConfig`에서만 수정합니다.
- 문제 수, 정리 문항 수, 세션 동물 선택 규칙은 `session-board.js`에서 수정합니다.
- 게임 중 조작감과 피드백은 `play-input.js`에서 수정합니다.
- 앱으로 넘기는 결과 필드는 `result-bridge.js`의 `toQuestionLog`, `toQuestionStartPayload`, `toCommonSessionLog`에서 관리합니다.

## 3. 로컬 실행 방법

정적 서버로 `제출코드` 폴더를 실행합니다. 상위 `제출정리` 폴더에서 실행할 경우:

```bash
cd 제출코드
python3 -m http.server 8000
```

이미 `제출코드` 폴더 안에 있다면 `python3 -m http.server 8000`만 실행합니다.

브라우저 또는 WebView에서 접속합니다.

```text
http://127.0.0.1:8000/index.html?mode=standard
```

### 다른 컴퓨터에서 실행하기

실행할 컴퓨터, 태블릿, 휴대폰이 서버를 실행한 컴퓨터와 같은 네트워크에 있어야 합니다.

서버 컴퓨터에서 실행합니다.

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

서버 컴퓨터의 로컬 IP를 확인합니다.

```bash
ipconfig getifaddr en0
```

다른 기기에서는 아래 형식으로 접속합니다.

```text
http://서버컴퓨터IP:8000/index.html?mode=standard
```

예: 서버 컴퓨터 IP가 `192.168.0.12`이면 `http://192.168.0.12:8000/index.html?mode=standard`로 접속합니다.

모드별 실행 URL 예시:

```text
http://127.0.0.1:8000/index.html?mode=standard
http://127.0.0.1:8000/index.html?mode=reminder
http://127.0.0.1:8000/index.html?mode=care
http://127.0.0.1:8000/index.html?mode=ai_assisted
```

주의: `file://`로 직접 열 수도 있으나, WebView/브라우저 정책 차이를 줄이기 위해 정적 서버 실행을 권장합니다.

## 4. URL Config 예시

```text
http://127.0.0.1:8000/index.html?mode=care&difficulty=easy&question_count=5&animal_count=2&trash_count=0&show_progress=false&show_help=false&use_drag=true&auto_start=false
```

URL query로 전달 가능한 주요 값:

| 항목 | 설명 |
|---|---|
| `mode` | 실행 모드. `standard`, `reminder`, `care`, `ai_assisted` |
| `difficulty` | 난이도. `easy`, `normal`, `hard` |
| `question_count` | 총 문항 수 |
| `animal_count` | 표시할 동물 수. 대상 동물은 세션 시작 시 1회 랜덤 선택 |
| `target_animals` | 특정 동물 고정 옵션. 예: `tiger,panda` |
| `choice_count` | 선택지 수 |
| `trash_count` | 정리 문항 수 |
| `auto_return_ms` | 완료 후 앱 복귀 대기 시간 |
| `show_timer` | 타이머 표시 여부 |
| `show_score` | 점수/통계 표시 여부 |
| `show_difficulty_select` | 난이도 선택 표시 여부 |
| `show_settings` | 시작 화면 설정 표시 여부 |
| `show_help` | 도움 버튼 표시 여부 |
| `show_how_to_play` | 진행방법 화면 표시 여부 |
| `show_finish_check` | 완료 후 컨디션/마무리 체크 표시 여부 |
| `show_progress` | 진행 표시 표시 여부 |
| `use_drag` | 드래그 조작 사용 여부 |
| `auto_start` | 로딩 후 자동 시작 여부 |
| `soft_feedback` | 부드러운 피드백 문구 사용 여부 |
| `voice_guide_enabled` | 안내 음성 사용 여부 |
| `effect_sound_enabled` | 효과음 사용 여부 |

모드별 권장 config:

| 모드 | 권장 실행 방식 | 난이도 처리 | 기본 선택지 |
|---|---|---|---|
| `standard` | 시작 화면에서 사용자가 난이도 선택 | `easy`, `normal`, `hard` 사용자 선택 | 난이도 기준 동물 + 정리 구역 |
| `reminder` | 앱 config로 자동 시작 | 앱이 `difficulty` 전달. 없으면 `normal` 기본값 | 난이도 기준 동물 + 정리 구역 |
| `care` | 표준 모드와 같은 초기 화면에서 `시작하기` 버튼으로 시작 | `easy` 고정 | 4마리 중 세션 시작 시 2마리 랜덤, 정리 구역 없음 |
| `ai_assisted` | 표준 모드와 같은 초기 화면에서 `시작하기` 버튼으로 시작 | `easy` 고정 | 4마리 중 세션 시작 시 2마리 랜덤, 정리 구역 없음 |

동물 랜덤 규칙:

- 세션 시작 시 필요한 동물 수만큼 `빨간 도깨비`, `초록 도깨비`, `하얀 도깨비`, `노란 도깨비` 중에서 랜덤 선택합니다.
- 한 세션이 시작되면 선택된 동물은 세션 문항 수 동안 고정됩니다.
- 문항 중에는 동물 구성이 바뀌지 않습니다.
- 앱이 `target_animals`를 전달하면 해당 동물을 우선 사용합니다.

## 5. 앱 Config 메시지 예시

앱은 WebView로 `CONFIG` 메시지를 전달할 수 있습니다.

```json
{
  "type": "CONFIG",
  "payload": {
    "mode": "care",
    "difficulty": "easy",
    "userAlias": "사용자",
    "fontScale": 1.2,
    "reducedMotion": false,
    "voice": true,
    "config": {
      "show_progress": false,
      "show_help": false,
      "show_how_to_play": false,
      "show_finish_check": false,
      "question_count": 5,
      "animal_count": 2,
      "target_animals": ["tiger", "panda"],
      "trash_count": 0,
      "use_drag": true,
      "auto_start": false,
      "auto_return_ms": 3000,
      "soft_feedback": true,
      "voice_guide_enabled": true,
      "result_log_level": "detailed"
    }
  }
}
```

## 6. 앱 연동 구조

게임은 아래 브리지 순서로 앱에 이벤트를 전달합니다.

1. `window.ReactNativeWebView.postMessage`
2. `window.webkit.messageHandlers.gameBridge.postMessage`
3. `window.AndroidBridge.onMessage`
4. 브리지 없음: 로컬 미리보기용으로 조용히 무시

앱에서 게임으로 보낼 수 있는 메시지:

| type | 설명 |
|---|---|
| `CONFIG` | 런타임 config 적용 |
| `PAUSE` | 게임 일시정지 |
| `RESUME` | 게임 재개 |
| `MUTE` / `UNMUTE` | 음성/효과음 음소거 제어 |
| `SET_AUDIO` | 음성/효과음 개별 제어 |
| `QUIT` | 앱 명령으로 게임 종료 |
| `EXTERNAL_ANSWER` | 앱 접근성 UI 등 외부 선택값 전달 |
| `ENTER_DISPLAY` / `ENTER_FULLSCREEN` / `LOCK_ORIENTATION` | 화면 전환/가로모드 요청 |

게임에서 앱으로 보내는 주요 이벤트:

| type | 설명 |
|---|---|
| `READY` | 게임 로딩 및 준비 완료 |
| `CONFIG_APPLIED` | 앱 config 적용 완료 |
| `DISPLAY_REQUEST` | 전체화면/가로모드 진입 요청 |
| `SESSION_START` | 세션 시작 |
| `QUESTION_START` | 문항 표시 시작 |
| `QUESTION_RESULT` | 문항별 결과 |
| `CONDITION_CHECK` | 게임 완료 후 통합 체크의 컨디션 응답 |
| `FINISH_CHECK` | 게임 완료 후 통합 체크의 수면시간 응답 |
| `SESSION_COMPLETE` | 정상 완료 |
| `SESSION_ABORT` | 중단 종료 |
| `SESSION_PAUSE` / `SESSION_RESUME` | 일시정지/재개 |
| `AUDIO_APPLIED` | 오디오 설정 적용 |
| `ERROR` | 오류 발생 |
| `RETURN_TO_APP` | 앱 복귀 요청 |

`SESSION_START` payload에는 세션 시작 시 확정된 `target_animals`, `animal_count`, `trash_count`, `choice_count`, `total_questions`가 포함됩니다.

### 앱 저장 권장 기준

앱에서 모든 이벤트를 같은 방식으로 저장할 필요는 없습니다. 권장 기준은 아래와 같습니다.

| 구분 | 이벤트 | 권장 처리 |
|---|---|---|
| 최종 저장 필수 | `SESSION_COMPLETE`, `SESSION_ABORT` | 세션 결과와 문항별 `results` 전체 저장 |
| 문항별 실시간 저장 선택 | `QUESTION_RESULT` | 중도 이탈 전까지의 문항별 진행 상태가 필요할 때 저장 |
| 체크 응답 저장 | `CONDITION_CHECK`, `FINISH_CHECK`, `MOOD_CHECK` | 완료 후 체크 기능을 사용하는 경우 저장 |
| 상태/제어 참고 | `READY`, `DISPLAY_REQUEST`, `CONFIG_APPLIED`, `RETURN_TO_APP`, `ERROR` | 앱 화면 전환, 오류 처리, QA 확인에 사용 |
| 저장 비권장 | `LOADING_PROGRESS`, `DISPLAY_APPLIED`, `QUESTION_START`, `AUDIO_APPLIED`, `SESSION_PAUSE`, `SESSION_RESUME`, `HELP_USED` | 일반적으로 UI 상태 또는 과정 참고용 |
 
문항 수와 관계없이 앱 저장은 최종 이벤트 1건에 전체 문항 결과가 포함되는 구조입니다. 최종 이벤트 payload의 `result_detail_json`에는 세션 요약, 문항별 로그, 원본 results, 과정 통계, 보상 참고값, 컨디션/수면 체크값이 함께 들어갑니다. 실시간 분석이 필요하지 않다면 `QUESTION_RESULT`는 진행 표시 또는 QA 확인용으로만 사용할 수 있습니다.

앱은 `SESSION_COMPLETE` / `SESSION_ABORT` payload를 그대로 결과 수집 API로 전달할 수 있습니다. 제출본에는 연동 초안 검수를 위한 `../결과수집서버`가 포함되어 있으며, 중복 저장 방지는 `session_id` 기준으로 처리합니다.

### 전체화면/가로모드 처리

게임은 로딩이 끝나고 `READY`를 보낸 직후 `DISPLAY_REQUEST`를 함께 전송합니다. 또한 시작 버튼, 전체화면 버튼, 첫 사용자 터치 시점에도 브라우저가 허용하는 범위에서 Fullscreen API와 Orientation Lock을 다시 시도합니다. 앱은 `DISPLAY_REQUEST`를 받으면 WebView 화면을 전체화면 가로모드로 전환하는 것을 권장합니다.

- Android: 게임 Activity 또는 WebView 컨테이너에서 immersive fullscreen과 landscape orientation을 적용합니다.
- iOS: 게임 화면을 landscape 지원 ViewController로 표시하고, 해당 화면에서 supported orientations를 landscape 기준으로 제한합니다.
- 일반 모바일 브라우저의 주소창은 HTML/JS만으로 항상 숨길 수 없습니다. 브라우저 정책상 사용자 제스처 없는 Fullscreen API 호출이 제한되므로, 제출 앱에서는 네이티브 WebView 레벨의 전체화면 처리가 필요합니다.
- 세로 뷰포트로 진입하는 경우 게임 내부 CSS fallback이 가로 화면처럼 회전 표시하며, 별도의 “가로로 돌려주세요” 화면은 기본적으로 노출하지 않습니다.

정상 완료 시 통합 체크가 켜져 있으면 이벤트 순서는 아래와 같습니다.

```text
QUESTION_START → QUESTION_RESULT ... → CONDITION_CHECK → FINISH_CHECK → SESSION_COMPLETE
```

## 7. 결과 로그 예시

정상 완료 시 `SESSION_COMPLETE` payload에는 아래 항목이 포함됩니다.

```json
{
  "session_id": "session-id",
  "content_id": "cognitive_animal_feeding_001",
  "game_key": "animal_feeding",
  "mode": "standard",
  "difficulty": "easy",
  "status": "completed",
  "total_questions": 10,
  "completed_questions": 10,
  "correct_count": 10,
  "wrong_count": 0,
  "hint_count": 0,
  "duration_ms": 120000,
  "question_logs": [],
  "result_detail_json": {
    "session": {},
    "question_logs": [],
    "raw_results": [],
    "process": {},
    "reward": {},
    "condition_check": null,
    "sleep_check": null,
    "finish_check": null
  }
}
```

문항이 화면에 표시될 때는 `QUESTION_START`를 먼저 전달합니다.

```json
{
  "type": "QUESTION_START",
  "payload": {
    "session_id": "session-id",
    "content_id": "cognitive_animal_feeding_001",
    "game_key": "animal_feeding",
    "mode": "reminder",
    "difficulty": "easy",
    "question_id": "question-id",
    "question_index": 1,
    "total_questions": 10,
    "question_type": "feed_animal",
    "cognitive_domain": "semantic_memory",
    "prompt_text": "누구에게 줄까요?",
    "prompt_type": "image",
    "item": {
      "item_id": "green_grape",
      "label": "청포도",
      "type": "food",
      "image_src": "image/green_grape.png"
    },
    "choices": [
      { "answer_id": "tiger", "label": "빨간 도깨비", "type": "animal", "image_src": "image/red_goblin.png" },
      { "answer_id": "monkey", "label": "초록 도깨비", "type": "animal", "image_src": "image/green_goblin.png" },
      { "answer_id": "bin", "label": "휴지통", "type": "cleanup", "image_src": "image/bin.png" }
    ],
    "correct_answer": "monkey",
    "correct_answer_label": "초록 도깨비",
    "input_modes_enabled": ["touch", "drag", "external"]
  }
}
```

문항을 맞히거나 완료했을 때는 `QUESTION_RESULT`를 전달하고, `question_log`를 함께 포함합니다.

```json
{
  "type": "QUESTION_RESULT",
  "payload": {
    "question_log": {
      "question_id": "question-id",
      "question_index": 1,
      "total_questions": 10,
      "mode": "reminder",
      "question_type": "feed_animal",
      "cognitive_domain": "semantic_memory",
      "difficulty": "easy",
      "correct_answer": "monkey",
      "selected_answer": "monkey",
      "is_correct": true,
      "attempt_count": 1,
      "hint_used": false,
      "response_time_ms": 2400,
      "input_type": "touch",
      "item_id": "green_grape",
      "item_label": "청포도",
      "item_type": "food",
      "correct_answer_label": "초록 도깨비",
      "selected_answer_label": "초록 도깨비"
    }
  }
}
```

## 8. 기본 실행 체크

| 항목 | 확인 기준 |
|---|---|
| 로딩 | 로딩률 100% 후 시작 화면 진입 |
| 표준 모드 | 난이도 선택 후 진행방법, 카운트다운, 플레이 진입 |
| 알림 | config에 따라 자동 시작 가능 |
| 케어/AI | 표준 모드와 같은 초기 화면에서 시작 버튼으로 진입. 난이도 선택/컨디션 체크/게임 방법 보기는 생략 |
| 모바일 가로 | 896 x 414 기준 가로/세로 스크롤 없음 |
| 이미지 | 배경, 동물 우리, 먹이판, 정리 구역, 동물/먹이 이미지 표시 |
| 앱 연동 | `READY`, `SESSION_START`, `QUESTION_RESULT`, `SESSION_COMPLETE` 수신 |

### 모드별 종료 화면

| 모드 | 다시 하기 | 복귀 처리 |
|---|---|---|
| 표준 | 기본 노출 | `효담콜로 돌아가기` 버튼으로 `RETURN_TO_APP` 전송 |
| 알림 | 기본 숨김 | 완료 화면 3초 표시 후 자동 `RETURN_TO_APP` 전송 및 허브 이동 |
| 케어 | 기본 숨김 | 완료 화면 3초 표시 후 자동 `RETURN_TO_APP` 전송 및 허브 이동 |
| AI 연동 | 기본 숨김 | 완료 화면 3초 표시 후 자동 `RETURN_TO_APP` 전송 및 허브 이동 |

## 9. 주의 사항

- 최종 앱 연동 시 WebView는 가로 모드 기준으로 실행합니다.
- 보상/성장 처리 자체는 게임 내부가 아니라 앱에서 처리합니다.
- 표준 모드는 게임 완료 후 컨디션 상태와 수면시간 체크를 기본 표시합니다. 알림/케어/AI 모드는 기본 숨김이며, 앱 config에서 `show_finish_check=true`를 전달한 경우에만 표시합니다.
- 사용자가 답변이 부담스러울 경우 `선택 없이 완료`로 넘어갈 수 있습니다.
- 기본 문항 수는 표준/알림 모드 10문항, 케어/AI 모드 5문항입니다. 앱 config가 `question_count`를 주면 해당 값을 우선합니다.
- 표준/알림 모드의 쉬움도 기본 정리 문항 1개를 포함합니다. 케어/AI 모드는 기본적으로 정리 문항을 제외합니다.
- 모드 키는 앱 연동 실수를 줄이기 위해 일부 별칭을 허용합니다. `mode=ai`, `mode=ai_assist`, `mode=ai_assistant`는 `ai_assisted`로, `mode=alarm`, `mode=alert`는 `reminder`로 처리됩니다.
- 알림/케어/AI 모드는 앱 config가 우선합니다.
