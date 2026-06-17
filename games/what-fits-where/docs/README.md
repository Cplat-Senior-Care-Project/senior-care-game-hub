# 오늘의 준비물 README / 실행 가이드

이 문서는 `games/what-fits-where` 폴더를 기준으로 작성한 실행 가이드입니다.

중요: 현재 실제 플레이되는 게임 유형은 `알맞은 물건 고르기` 하나입니다. 코드 안에 과거 실험용 미션 이름이 일부 남아 있어도, 현재 실행 시퀀스는 `choose_matching_items`만 사용합니다.

## 핵심 요약

| 항목 | 내용 |
|---|---|
| 게임 이름 | 오늘의 준비물 |
| 현재 게임 유형 | 알맞은 물건 고르기 |
| 내부 미션 키 | `choose_matching_items` |
| 실행 파일 | `index.html` |
| 권장 실행 방식 | `node tools/server.js` |
| 기본 접속 주소 | `http://127.0.0.1:8080/` |
| 설치 단계 | 없음 |
| 빌드 단계 | 없음 |
| 기본 제한 시간 | 180초 |
| 기본 문항 수 | 표준 모드 10문항, 케어/AI 보조 모드 5문항 |
| 주 데이터 파일 | `docs/situation-templates-draft.json` |

## 빠른 실행

PowerShell에서 게임 폴더로 이동합니다.

```powershell
cd C:\Users\juhye\OneDrive\Desktop\senior-care-game-hub\games\what-fits-where
```

로컬 서버를 실행합니다.

```powershell
node tools/server.js
```

브라우저에서 아래 주소를 엽니다.

접속 주소: `http://127.0.0.1:8080/`

서버를 종료하려면 터미널에서 `Ctrl + C`를 누릅니다.

## 포트 변경 실행

8080 포트를 사용할 수 없으면 다른 포트를 지정합니다.

```powershell
$env:PORT=8090
node tools/server.js
```

접속 주소는 다음과 같습니다.

접속 주소: `http://127.0.0.1:8090/`

## Python 서버로 실행

Node 서버를 쓰기 어려운 경우 게임 폴더에서 Python 정적 서버를 사용할 수 있습니다.

```powershell
py -m http.server 8000
```

접속 주소는 다음과 같습니다.

접속 주소: `http://127.0.0.1:8000/`

`senior-care-game-hub` 루트에서 Python 서버를 실행했다면 주소가 달라집니다.

접속 주소: `http://127.0.0.1:8000/games/what-fits-where/`

`file://`로 `index.html`을 직접 여는 방식은 권장하지 않습니다. 브라우저 보안 정책 때문에 `docs/situation-templates-draft.json`을 불러오지 못할 수 있습니다.

## 현재 게임 유형

현재 활성 게임 유형은 하나입니다.

| 구분 | 값 |
|---|---|
| 화면 이름 | 알맞은 물건 고르기 |
| 내부 키 | `choose_matching_items` |
| 동작 | 상황 문장을 보고 필요한 물건을 고릅니다. |
| 예시 | "비 오는 날 외출해요." 상황에서 우산을 고릅니다. |

이전 구조에서 쓰던 `remove_mismatched_items`, `guess_situation` 관련 코드가 일부 파일에 남아 있을 수 있습니다. 하지만 `config/modes.js`의 `MISSION_SEQUENCE`와 `MISSION_SEQUENCE_BY_DIFF`가 모두 `choose_matching_items`만 가리키므로 현재 플레이 흐름에는 들어오지 않습니다.

## 앱 실행 모드

여기서 말하는 모드는 게임 유형이 아니라 앱 진입 방식입니다. 모든 앱 모드에서 실제 게임 유형은 `알맞은 물건 고르기`입니다.

| 앱 모드 | URL | 동작 |
|---|---|---|
| `standard` | `/?mode=standard` | 컨디션 체크, 난이도 선택, 점수 화면, 게임 후 상태 체크를 사용합니다. |
| `reminder` | `/?mode=reminder` | 기본 난이도로 자동 시작하고 완료 후 복귀합니다. |
| `care` | `/?mode=care` | 쉬움 기본값, 짧은 문항 수, 타이머/점수/설정/진행 카운터 기본 숨김, 자동 복귀를 사용합니다. |
| `ai_assisted` | `/?mode=ai_assisted` | AI 보조 진입용 설정입니다. 기본 UI를 단순화하며 앱/AI 레이어가 `EXTERNAL_ANSWER` 또는 `EXTERNAL_ITEM_SELECT` 메시지로 선택값을 전달할 수 있습니다. |

`ai-assisted`처럼 하이픈으로 전달해도 내부에서 `ai_assisted`로 변환됩니다.

## 추천 실행 URL

| 용도 | URL |
|---|---|
| 표준 확인용 | `http://127.0.0.1:8080/?mode=standard` |
| 케어 모드 확인용 | `http://127.0.0.1:8080/?mode=care&userDifficultyGroup=low` |
| 효담콜 복귀 주소를 함께 전달하는 예시 | `http://127.0.0.1:8080/?mode=care&userDifficultyGroup=low&returnUrl=../../index.html` |

## 난이도 전달

URL에서 `userDifficultyGroup` 값을 전달하면 프로필 기반 난이도로 적용됩니다.

| 전달 값 | 적용 난이도 | 화면 표시 |
|---|---|---|
| `low` | `easy` | 쉬움 |
| `middle` | `normal` | 보통 |
| `high` | `hard` | 어려움 |

`difficulty=easy|normal|hard`처럼 직접 난이도를 전달해도 같은 방식으로 적용됩니다.

## 문항 수와 난이도 규칙

| 모드 | 문항 수 | 난이도 선택 |
|---|---|---|
| `standard` | 10문항 | 사용자가 쉬움/보통/어려움을 선택합니다. |
| `reminder` | 10문항 | 기본값은 쉬움입니다. |
| `care` | 5문항 | 기본값은 쉬움입니다. |
| `ai_assisted` | 5문항 | 기본값은 쉬움입니다. |

난이도별 선택지 구성은 현재 `js/game.js`의 `QUESTION_RULES_BY_DIFF`를 따릅니다.

| 난이도 | 선택지 | 정답 수 |
|---|---|---|
| 쉬움 | 2개 | 1개 |
| 보통 | 3개 | 1개 |
| 어려움 | 4개 | 2개 |

## 화면 흐름

`standard` 모드 흐름:

1. 로딩
2. 컨디션 체크
3. 시작 화면
4. 난이도 선택
5. 3초 카운트다운
6. 알맞은 물건 고르기
7. 결과 화면
8. 점수 화면
9. 게임 후 상태 체크

`care`, `reminder`, `ai_assisted` 모드는 컨디션 체크와 난이도 선택을 줄이고, 설정값에 따라 바로 시작하거나 완료 후 효담콜 복귀를 요청합니다.

## 폴더 구조

| 경로 | 역할 |
|---|---|
| `index.html` | 화면 마크업과 스크립트 로딩 순서 |
| `config/modes.js` | 앱 모드, 난이도, 문항 수, UI 표시 여부 설정 |
| `js/game.js` | 게임 흐름, 타이머, 힌트, 결과 payload, WebView 이벤트 |
| `modes/registry.js` | 현재 미션의 선택지 렌더링과 정답 처리 |
| `js/items.js` | 물건 키, 한글 이름, 이미지 경로, 힌트 문구 |
| `js/questions.js` | 기본 문제 풀 |
| `js/situation-templates.js` | JSON 로드 실패 시 쓰는 내장 템플릿 |
| `docs/situation-templates-draft.json` | 우선 적용되는 상황 템플릿 데이터 |
| `assets/goods/` | 물건 이미지 |
| `assets/audio/` | 배경음, 효과음, 안내 음성 |
| `tools/server.js` | 로컬 정적 서버 |

## 데이터 수정 위치

상황 문장과 정답 후보를 수정하려면 먼저 `docs/situation-templates-draft.json`을 수정합니다. 이 파일은 서버 실행 시 `fetch`로 우선 로드됩니다.

물건을 추가하거나 이미지 경로를 바꾸려면 `js/items.js`와 `assets/goods/`를 함께 수정합니다. 템플릿에 쓰는 물건 키는 `js/items.js`에 등록되어 있어야 합니다.

JSON 로드에 실패했을 때 사용할 내장 데이터를 맞추려면 `js/situation-templates.js`도 함께 갱신합니다.

## Config 수정 위치

기본 설정은 `config/modes.js`에서 관리합니다.

자주 보는 값:

| 값 | 설명 |
|---|---|
| `MISSION_SEQUENCE` | 현재 게임에서 실행할 미션 순서입니다. 현재는 `choose_matching_items` 하나입니다. |
| `MISSION_SEQUENCE_BY_DIFF` | 난이도별 미션 순서입니다. 현재 모두 `choose_matching_items` 하나입니다. |
| `Q_PER_STAGE_BY_DIFF` | 기본 문항 수입니다. 표준 모드는 난이도별 10문항입니다. |
| `question_counts_by_diff` | 특정 앱 모드에서 문항 수를 덮어씁니다. `care`, `ai_assisted`는 5문항입니다. |
| `session_id`, `content_id`, `game_key` | 앱/API 결과 저장에 필요한 실행 식별자입니다. URL 파라미터, `window.GAME_CONFIG`, 앱 메시지로 전달할 수 있습니다. |
| `question_count` | 모든 난이도 문항 수를 같은 값으로 덮어쓰는 단축 설정입니다. |
| `show_condition_check` | 게임 전 컨디션 체크 표시 여부입니다. |
| `show_difficulty_select` | 난이도 선택 화면 사용 여부입니다. |
| `show_timer`, `show_score`, `show_pause`, `show_hint`, `show_question_counter` | 모드별 부가 UI 표시 여부입니다. |
| `auto_start` | 시작 화면 진입 후 자동 시작 여부입니다. |
| `auto_return_to_hub` | 결과 화면 후 자동 복귀 여부입니다. |

## WebView 연동

React Native WebView 환경에서는 `window.ReactNativeWebView.postMessage`로 이벤트를 보냅니다. 로컬 브라우저에서는 콘솔에 `Game Event` 또는 `GAME_RESULT`로 출력됩니다.

API/DB 저장 연동 기준은 `요구사항_API_DB`, `API요청_DB기본안` 탭을 반영한 [api-db-integration.md](api-db-integration.md)를 기준으로 확인합니다.

주요 이벤트:

| 이벤트 | 시점 |
|---|---|
| `GAME_READY` | 로딩 완료 |
| `GAME_STARTED` | 게임 시작 |
| `CONFIG_APPLIED` | 앱/URL/직접 호출 config 적용 |
| `HINT_OPENED` | 힌트 열림 |
| `GAME_RESTARTED` | 다시하기 |
| `GAME_ERROR` | 오류 발생 |
| `GAME_COMPLETED` | 정상 완료 |
| `GAME_ABANDONED` | 사용자 중단 또는 시간 종료 |
| `POST_GAME_CONDITION_COMPLETED` | 게임 후 상태 체크 완료 |
| `POST_GAME_CONDITION_SKIPPED` | 게임 후 상태 체크 건너뜀 |
| `RETURN_TO_HUB` | 효담콜 복귀 요청 |

앱에서 게임으로는 `APP_CONFIG`/`GAME_CONFIG`, `PAUSE_GAME`, `RESUME_GAME`, `EXTERNAL_ANSWER`, `EXTERNAL_ITEM_SELECT` 메시지를 전달할 수 있습니다. 동일 기능은 `window.applyGameRuntimeConfig(payload)` 직접 호출로도 적용할 수 있습니다.

| 상태 | `status` | `exit_reason` |
|---|---|---|
| 정상 완료 | `completed` | `completed` |
| 사용자 중단 | `abandoned` | `user_exit` |
| 시간 종료 | `abandoned` | `time_over` |

## 결과 payload 주요 값

| 필드 | 설명 |
|---|---|
| `game_mode` | 현재는 `choose_matching_items` |
| `game_mode_label` | 알맞은 물건 고르기 |
| `session_id`, `content_id`, `game_key`, `game_version` | 앱/API 저장용 식별자 |
| `mode`, `app_mode` | 앱 진입 모드 |
| `difficulty`, `start_difficulty` | 시작 난이도 |
| `config_snapshot` | 실제 적용된 config와 fallback/default 값 |
| `difficulty_source` | `user_selected`, `profile_based`, `care_default` 등 |
| `total_questions` | 전체 문항 수 |
| `answered_questions` | 응답한 문항 수 |
| `correct_count` | 정답 문항 수 |
| `wrong_count` | 오답 문항 수 |
| `hint_count`, `retry_count` | 힌트 사용 수와 재시도 수 |
| `question_logs` | 문항별 상황, 선택, 정답, 응답 시간, 상태 로그 |
| `result_detail_json` | 게임별 상세 통계 |
| `accuracy_percent` | 정답률 |
| `avg_response_sec` | 평균 응답 시간 |
| `started_at`, `ended_at`, `duration_ms` | 실행 시작/종료 시각과 총 소요 시간 |
| `duration_sec` | 전체 진행 시간 |
| `condition_data` | 게임 전 컨디션 체크 값 |
| `recommended_next_difficulty` | 추천 다음 난이도 |

## 검증 명령

서버 파일 문법 확인:

```powershell
node --check tools/server.js
```

상황 템플릿 JSON 파싱 확인:

```powershell
node -e "const fs=require('fs'); const data=JSON.parse(fs.readFileSync('docs/situation-templates-draft.json','utf8')); console.log(data.templates.length);"
```

현재 `docs/situation-templates-draft.json` 기준 템플릿 수는 50개입니다.

## 문제 해결

| 증상 | 확인할 것 |
|---|---|
| 화면은 뜨지만 문제가 이상함 | `docs/situation-templates-draft.json`이 서버에서 정상 로드되는지 콘솔의 `window.SITUATION_TEMPLATE_STATUS`를 확인합니다. |
| JSON이 적용되지 않음 | `file://`로 열지 말고 `node tools/server.js` 또는 `py -m http.server`로 실행합니다. |
| 8080 접속 실패 | 포트가 이미 사용 중일 수 있으니 `PORT`를 바꿔 실행합니다. |
| 난이도 전달이 안 됨 | URL에는 `userDifficultyGroup=low`, `middle`, `high` 중 하나를 사용합니다. |
| 다른 게임 유형이 나온다고 착각됨 | 현재 실행 시퀀스는 `choose_matching_items` 하나입니다. 과거 미션 키가 코드에 남아 있어도 활성 흐름이 아닙니다. |
