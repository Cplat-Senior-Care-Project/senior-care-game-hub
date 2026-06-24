# 도깨비야! 무슨 색을 먹니? README / 실행 가이드

## 핵심 요약

`도깨비야! 무슨 색을 먹니?`는 화면에 나온 먹이를 같은 색 도깨비에게 전해 주는 WebView 기반 시니어 인지 활동 게임입니다.

폴더명과 내부 식별자는 이전 구조 때문에 `animal-feeding-game`, `animal_feeding`, `tiger`, `monkey`, `squirrel`, `panda`로 남아 있습니다. 실제 화면과 에셋에서는 각각 빨간 도깨비, 초록 도깨비, 하얀 도깨비, 노란 도깨비로 표시됩니다.

## 빠른 실행

PowerShell에서 게임 폴더로 이동합니다.

```powershell
cd C:\Users\juhye\OneDrive\Desktop\senior-care-game-hub\games\animal-feeding-game
```

Python 정적 서버를 실행합니다.

```powershell
py -m http.server 8000
```

브라우저에서 아래 주소를 엽니다.

```text
http://127.0.0.1:8000/index.html?mode=standard
```

서버를 종료하려면 터미널에서 `Ctrl + C`를 누릅니다.

## 포트 변경 실행

8000 포트를 사용할 수 없으면 다른 포트를 지정합니다.

```powershell
py -m http.server 8090
```

접속 주소는 다음과 같습니다.

```text
http://127.0.0.1:8090/index.html?mode=standard
```

`py` 명령을 사용할 수 없으면 아래처럼 실행합니다.

```powershell
python -m http.server 8000
```

## 루트 폴더에서 실행

`senior-care-game-hub` 루트에서 Python 서버를 실행했다면 주소가 달라집니다.

```powershell
cd C:\Users\juhye\OneDrive\Desktop\senior-care-game-hub
py -m http.server 8000
```

접속 주소는 다음과 같습니다.

```text
http://127.0.0.1:8000/games/animal-feeding-game/index.html?mode=standard
```

`file://`로 `index.html`을 직접 여는 방식은 권장하지 않습니다. 화면은 열릴 수 있지만 WebView, 오디오, 전체화면, 가로모드 동작을 실제 환경과 비슷하게 확인하려면 정적 서버로 실행하는 편이 안전합니다.

## 현재 게임 유형

현재 활성 게임 유형은 하나입니다.

| 게임 유형     | 설명                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `feed_animal` | 먹이 색에 맞는 도깨비를 선택합니다.                                                                                        |
| `leave_item`  | 정리 문항입니다. 현재 코드에서는 hard 난이도에서 팥죽/부적이 나오며, 아무 도깨비에게도 주지 않고 기다리는 것이 정답입니다. |

내부 ID는 이전 동물 이름을 그대로 씁니다.

| 내부 ID    | 화면 라벨   | 대표 먹이              |
| ---------- | ----------- | ---------------------- |
| `tiger`    | 빨간 도깨비 | 토마토, 사과, 딸기     |
| `monkey`   | 초록 도깨비 | 브로콜리, 완두콩, 오이 |
| `squirrel` | 하얀 도깨비 | 무, 양파, 마늘         |
| `panda`    | 노란 도깨비 | 바나나, 참외, 옥수수   |

## 앱 실행 모드

여기서 말하는 모드는 게임 유형이 아니라 앱 진입 방식입니다. 모든 앱 모드에서 실제 핵심 플레이는 색에 맞는 도깨비 고르기입니다.

| 모드         | URL 값        | 기본 동작                                                             |
| ------------ | ------------- | --------------------------------------------------------------------- |
| 표준 모드    | `standard`    | 컨디션 체크, 난이도 선택, 진행방법, 점수, 마무리 체크를 표시합니다.   |
| 알림 모드    | `reminder`    | 기본 난이도 `normal`로 자동 시작하고, 완료 후 허브 복귀를 요청합니다. |
| 케어 모드    | `care`        | 쉬운 난이도, 2개 선택지, 짧은 문항 수, 부드러운 피드백을 사용합니다.  |
| AI 연동 모드 | `ai_assisted` | 케어 모드와 비슷하게 짧게 실행하고 AI 대화 복귀 문구를 사용합니다.    |

`ai-assisted`처럼 하이픈으로 전달해도 내부에서 `ai_assisted`로 변환됩니다. `ai`, `ai_assist`, `ai_assistant`도 `ai_assisted`로 처리됩니다. `alarm`, `alert`는 `reminder`로 처리됩니다.

## 추천 실행 URL

```text
http://127.0.0.1:8000/index.html?mode=standard
http://127.0.0.1:8000/index.html?mode=reminder
http://127.0.0.1:8000/index.html?mode=care
http://127.0.0.1:8000/index.html?mode=ai_assisted
```

WebView 이벤트를 QA용 parent/opener 창에서 받고 싶으면 `qa=1`을 붙입니다.

```text
http://127.0.0.1:8000/index.html?mode=standard&qa=1
```

주의: 단독 브라우저 탭에서는 WebView 이벤트가 콘솔에 자동 출력되지 않습니다. `qa=1`은 iframe 부모 창이나 `window.open`으로 연 창에 `postMessage`를 보내는 확인용 옵션입니다.

## 난이도 전달

URL의 `difficulty` 값은 `easy`, `normal`, `hard`를 직접 사용합니다.

```text
http://127.0.0.1:8000/index.html?mode=standard&difficulty=easy
http://127.0.0.1:8000/index.html?mode=reminder&difficulty=hard
```

주의: `care`, `ai_assisted` 모드는 현재 코드에서 난이도를 항상 `easy`로 고정합니다. 외부에서 난이도를 바꾸려면 `standard` 또는 `reminder` 모드를 사용하거나 코드의 `normalizeRuntimeConfig` 규칙을 수정해야 합니다.

특정 도깨비만 고정하려면 `target_animals`를 사용합니다.

```text
http://127.0.0.1:8000/index.html?mode=standard&difficulty=hard&target_animals=tiger,panda
```

## 문항 수와 난이도 규칙

현재 `js/core-config.js`와 `js/session-board.js` 기준 기본 규칙은 다음과 같습니다.

| 난이도                 | 문항 수 | 도깨비 수 | 정리 문항 |
| ---------------------- | ------: | --------: | --------: |
| `easy`                 |      10 |         2 |         0 |
| `normal`               |      10 |         3 |         0 |
| `hard`                 |      10 |         4 |         2 |
| `care` / `ai_assisted` |       5 |         2 |         0 |

보충 규칙:

- 세션 시작 시 필요한 수만큼 4종 도깨비 중 랜덤 선택합니다.
- 한 세션이 시작되면 선택된 도깨비 구성은 문항이 끝날 때까지 유지됩니다.
- `question_count`로 총 문항 수를 바꿀 수 있습니다.
- `animal_count`로 표시할 도깨비 수를 바꿀 수 있습니다.
- `target_animals=tiger,panda`처럼 전달하면 해당 도깨비를 우선 포함합니다.
- 현재 정리 아이템인 `patjuk`, `talisman`은 `HARD_ONLY_TRASH_ITEM_IDS`에 들어 있어 hard 난이도에서만 등장합니다.

## 화면 흐름

`standard` 모드 흐름:

```text
로딩
컨디션 체크
시작 화면
난이도 선택
진행방법 화면
준비 화면
3초 카운트다운
도깨비에게 먹이 주기
결과/점수 화면
마무리 체크
허브 복귀 요청
```

진행방법 화면은 `localStorage`에 `af_seen_how=1`이 저장된 뒤에는 생략될 수 있습니다.

`reminder` 모드 흐름:

```text
로딩
자동 시작
준비 화면
3초 카운트다운
도깨비에게 먹이 주기
결과 화면
3초 후 허브 복귀 요청
```

`care`, `ai_assisted` 모드 흐름:

```text
로딩
시작 화면
준비 화면
3초 카운트다운
도깨비에게 먹이 주기
결과 화면
3초 후 허브 복귀 요청
```

## 폴더 구조

```text
animal-feeding-game/
├─ index.html
├─ README.md
├─ css/
│  ├─ base.css
│  ├─ farm-theme.css
│  ├─ feedback.css
│  ├─ game-layout.css
│  ├─ responsive.css
│  └─ screens.css
├─ js/
│  ├─ core-config.js
│  ├─ audio-display.js
│  ├─ screen-flow.js
│  ├─ session-board.js
│  ├─ play-input.js
│  └─ result-bridge.js
├─ data/
│  └─ animal-feeding-content.json
├─ image/
│  ├─ red_goblin.png
│  ├─ green_goblin.png
│  ├─ white_goblin.png
│  ├─ yellow_goblin.png
│  ├─ *_goblin_correct.png
│  ├─ goblin_straw_base.png
│  ├─ tomato.png
│  ├─ apple.png
│  ├─ strawberry.png
│  ├─ broccoli.png
│  ├─ pea_pod.png
│  ├─ cucumber.png
│  ├─ radish.png
│  ├─ onion.png
│  ├─ garlic.png
│  ├─ yellow_banana.png
│  ├─ chamoe.png
│  ├─ corn.png
│  ├─ patjuk.png
│  ├─ talisman.png
│  └─ feed-basket.png
└─ audio/
   ├─ bgm/
   ├─ sfx/
   └─ voice/
```

이 게임 폴더에는 현재 `tools/server.js`가 없습니다. 로컬 실행은 Python 정적 서버 기준으로 안내합니다.

## 데이터 수정 위치

실제 실행 데이터는 `js/core-config.js`의 상수를 사용합니다.

| 수정 대상                           | 위치                                               |
| ----------------------------------- | -------------------------------------------------- |
| 도깨비 라벨, 이미지, 정답 이미지    | `js/core-config.js`의 `ANIMALS`                    |
| 먹이/정리 아이템, 정답 도깨비       | `js/core-config.js`의 `FOODS`                      |
| 기본 난이도 문항 수와 도깨비 수     | `js/core-config.js`의 `DIFFS`                      |
| hard 전용 정리 아이템 규칙          | `js/session-board.js`의 `HARD_ONLY_TRASH_ITEM_IDS` |
| 세션 문항 생성 규칙                 | `js/session-board.js`                              |
| 터치/드래그 조작과 정답/오답 피드백 | `js/play-input.js`                                 |
| 결과 payload와 WebView 이벤트       | `js/result-bridge.js`                              |
| 화면 진입, 컨디션 체크, 카운트다운  | `js/screen-flow.js`                                |
| 오디오, 전체화면, 가로모드 요청     | `js/audio-display.js`                              |

`data/animal-feeding-content.json`은 콘텐츠 검토용 명세입니다. 실행 중 fetch로 우선 로드되는 구조가 아니므로, 먹이나 도깨비를 바꿀 때는 `js/core-config.js`를 먼저 수정하고 JSON 명세도 함께 맞추는 방식이 안전합니다.

## Config 수정 위치

기본 실행 설정은 `js/core-config.js`의 `normalizeRuntimeConfig`에서 관리합니다.

자주 보는 값:

| 값                                     | 설명                                              |
| -------------------------------------- | ------------------------------------------------- |
| `mode`                                 | `standard`, `reminder`, `care`, `ai_assisted`     |
| `difficulty`                           | `easy`, `normal`, `hard`                          |
| `question_count`                       | 총 문항 수                                        |
| `animal_count`                         | 표시할 도깨비 수                                  |
| `target_animals`                       | 고정할 도깨비 ID 목록                             |
| `trash_count`                          | 정리 문항 수                                      |
| `time_limit_ms` / `time_limit_seconds` | 제한 시간                                         |
| `show_timer`                           | 타이머 표시 여부                                  |
| `show_score`                           | 점수 표시 여부                                    |
| `show_help`                            | 도움 버튼 표시 여부                               |
| `show_finish_check`                    | 완료 후 마무리 체크 표시 여부                     |
| `show_progress`                        | 진행률 표시 여부                                  |
| `use_drag`                             | 드래그 조작 사용 여부                             |
| `auto_start`                           | 자동 시작 여부. 현재 `reminder`에서만 적용됩니다. |
| `auto_return_ms`                       | 완료 후 허브 복귀 대기 시간                       |
| `voice_guide_enabled`                  | 음성 안내 사용 여부                               |
| `effect_sound_enabled`                 | 효과음 사용 여부                                  |
| `background_music_enabled`             | 배경음 사용 여부                                  |
| `return_url`                           | 복귀할 허브 URL                                   |

URL query 예시:

```text
http://127.0.0.1:8000/index.html?mode=care&question_count=5&animal_count=2&show_progress=false&show_help=false
```

## WebView 연동

React Native WebView 환경에서는 `window.ReactNativeWebView.postMessage`로 이벤트를 보냅니다. iOS `webkit.messageHandlers.gameBridge`, Android `AndroidBridge.onMessage`도 지원합니다.

앱에서 게임으로 보낼 수 있는 주요 메시지:

| type                                                      | 설명                                 |
| --------------------------------------------------------- | ------------------------------------ |
| `CONFIG`                                                  | 실행 config 적용                     |
| `PAUSE` / `RESUME`                                        | 세션 일시정지/재개                   |
| `MUTE` / `UNMUTE` / `SET_AUDIO`                           | 음성, 효과음, 배경음 제어            |
| `QUIT`                                                    | 앱 명령으로 세션 종료                |
| `EXTERNAL_ANSWER`                                         | 접근성/음성 인식 등 외부 선택값 전달 |
| `ENTER_DISPLAY` / `ENTER_FULLSCREEN` / `LOCK_ORIENTATION` | 전체화면/가로모드 재요청             |

게임에서 앱으로 보내는 주요 이벤트:

| type                               | 설명                                       |
| ---------------------------------- | ------------------------------------------ |
| `LOADING_PROGRESS`                 | 로딩 진행률                                |
| `READY`                            | 에셋 로딩과 초기 준비 완료                 |
| `CONFIG_APPLIED`                   | 앱 config 적용 완료                        |
| `DISPLAY_REQUEST`                  | 전체화면/가로모드 전환 요청                |
| `DISPLAY_APPLIED`                  | 브라우저 전체화면/방향 잠금 시도 결과      |
| `SESSION_START`                    | 세션 시작                                  |
| `QUESTION_START`                   | 문항 시작                                  |
| `QUESTION_RESULT`                  | 문항별 결과                                |
| `HELP_USED`                        | 도움 버튼 사용                             |
| `CONDITION_CHECK`                  | 시작 전 컨디션 체크 또는 종료 후 상태 체크 |
| `FINISH_CHECK`                     | 완료 후 마무리 체크                        |
| `SESSION_COMPLETE`                 | 정상 완료                                  |
| `SESSION_ABORT`                    | 사용자 중단, 시간 종료, 오류 등으로 중단   |
| `SESSION_PAUSE` / `SESSION_RESUME` | 일시정지/재개                              |
| `AUDIO_APPLIED`                    | 오디오 설정 적용                           |
| `ERROR`                            | 오류 발생                                  |
| `RETURN_TO_APP`                    | 허브/앱 복귀 요청                          |

사용자 중단과 시간 종료는 별도 완료 이벤트가 아니라 `SESSION_ABORT` payload에서 구분합니다. 시간 종료는 `timed_out: true`, `abandon_reason: "time_limit"`로 확인합니다.

## 결과 payload 주요 값

`SESSION_COMPLETE`와 `SESSION_ABORT` payload에는 다음 값이 포함됩니다.

| 값                                                    | 설명                                         |
| ----------------------------------------------------- | -------------------------------------------- |
| `session_id`                                          | 세션 ID                                      |
| `content_id`                                          | 기본값 `cognitive_animal_feeding_001`        |
| `game_key`                                            | 기본값 `animal_feeding`                      |
| `mode`                                                | 실행 모드                                    |
| `difficulty`                                          | 적용 난이도                                  |
| `status`                                              | `completed`, `abandoned`, `error`            |
| `started_at`, `ended_at`                              | 시작/종료 시각                               |
| `duration_ms`                                         | 실제 진행 시간                               |
| `time_limit_ms`, `timed_out`                          | 제한 시간과 시간 종료 여부                   |
| `total_questions`, `completed_questions`              | 전체/완료 문항 수                            |
| `correct_count`, `wrong_count`                        | 정답/오답 수                                 |
| `hint_count`, `retry_count`                           | 도움/재시도 집계                             |
| `pause_count`, `help_open_count`, `interaction_count` | 진행 중 상호작용 집계                        |
| `avg_response_time_ms`                                | 평균 응답 시간                               |
| `completion_rate`                                     | 완료율                                       |
| `abandon_reason`, `abandon_step`                      | 중단 사유와 중단 위치                        |
| `question_logs`                                       | 문항별 상세 로그                             |
| `result_detail_json`                                  | 세션, 문항, 과정, 체크 결과를 묶은 상세 JSON |

문항별 `question_log`에는 `question_id`, `question_index`, `question_type`, `item_id`, `item_label`, `correct_answer`, `selected_answer`, `is_correct`, `attempt_count`, `hint_used`, `response_time_ms`, `input_type` 등이 들어갑니다.

## 검증 명령

JS 문법 확인:

```powershell
node --check js/core-config.js
node --check js/audio-display.js
node --check js/screen-flow.js
node --check js/session-board.js
node --check js/play-input.js
node --check js/result-bridge.js
```

콘텐츠 JSON 파싱 확인:

```powershell
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('data/animal-feeding-content.json','utf8')); console.log(data.title, data.items.length);"
```

현재 `data/animal-feeding-content.json` 기준 아이템 수는 14개입니다.

## 문제 해결

- 접속이 안 되면 서버를 실행한 터미널에서 현재 폴더가 `animal-feeding-game`인지 확인합니다.
- 루트 폴더에서 서버를 실행했다면 `/games/animal-feeding-game/index.html` 경로로 접속해야 합니다.
- 오디오가 바로 재생되지 않는 것은 모바일 브라우저와 WebView의 자동재생 정책 때문일 수 있습니다. 첫 터치 후 재생됩니다.
- 전체화면과 가로모드는 브라우저 API만으로 항상 강제할 수 없습니다. 실제 앱에서는 WebView 컨테이너에서 immersive fullscreen과 landscape orientation을 적용하는 것을 권장합니다.
- `care`, `ai_assisted`에서 `difficulty=hard`를 전달해도 현재 코드는 `easy`로 고정합니다.
- 정리 문항이 안 나오면 현재 난이도가 `hard`인지 확인합니다. 현재 정리 아이템은 hard 전용으로 제한되어 있습니다.
