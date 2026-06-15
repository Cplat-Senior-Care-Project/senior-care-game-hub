# 실행 모드 및 앱 연동 QA 체크리스트

대상 게임: 쏙쏙 개수 찾기 (`fruit-count-memory-game`)

## 사전 준비

- React Native WebView 또는 동등한 WebView 테스트 환경에서 실행한다.
- 앱 브릿지가 `GAME_READY`, `GAME_STARTED`, `GAME_COMPLETED`, `GAME_ABANDONED`, `GAME_ERROR`, `GAME_EXIT_REQUESTED`를 로그로 확인할 수 있어야 한다.
- 결과 수집 API 저장 검수는 앱이 게임 결과 JSON을 받은 뒤 별도 API 서버에 요청하는 흐름으로 확인한다.

## 실행 모드 검수

| 요구사항 | 확인 방법 | 기대 결과 |
|---|---|---|
| REQ-MODE-001 | `mode=standard/reminder/care/ai_assisted` 각각 실행 | 모드별 config, CSS, JS 분기 정상 |
| REQ-MODE-002 | `standard` 실행 | 난이도 선택, 점수, 기록, 설정, 컨디션 체크 사용 가능 |
| REQ-MODE-003 | `reminder` 실행 | 난이도 선택 없이 앱 지정 난이도로 바로 시작 |
| REQ-MODE-004 | `care` 실행 | 타이머, 점수, 난이도 선택, 설정, 진행방법, 컨디션 체크 등 부가 UI 미노출 |
| REQ-MODE-005 | `care` 1회 플레이 | 60초/5문항 기준으로 1~3분 내 완료 가능 |
| REQ-MODE-006 | `ai_assisted` 실행 후 외부 입력 전송 | `input_type=external` 문항 로그 생성 |
| REQ-MODE-007 | `reminder/care/ai_assisted` 결과 화면 확인 | 재실행 유도 버튼 없이 앱 플로우로 자동 복귀 |

## 앱 이벤트 검수

| 요구사항 | 확인 방법 | 기대 결과 |
|---|---|---|
| REQ-IF-001 | 앱 config로 `session_id`, `content_id`, `game_key`, `mode`, `difficulty` 전달 | 전달값이 실행 모드와 결과 JSON에 반영 |
| REQ-IF-002 | 앱 WebView message log 확인 | postMessage 기반 이벤트 수신 가능 |
| REQ-IF-003 | 완료/중단/오류 흐름 각각 실행 | `GAME_COMPLETED`, `GAME_ABANDONED`, `GAME_ERROR` 구분 수신 |
| REQ-IF-004 | 완료/중단/오류 결과 payload 확인 | 각 payload에 `status`와 결과 JSON 포함 |
| REQ-IF-005 | 잘못된 config 또는 에셋 실패 상황 유도 | `GAME_ERROR`가 게임 내부 오류 코드와 메시지 포함 |
| REQ-IF-006 | 결과 JSON 확인 | `config_snapshot`에 실제 적용값 포함 |
| REQ-IF-007 | `EXTERNAL_ANSWER` 전송 | 게임이 STT 없이 앱/AI 변환 선택값 처리 |
| REQ-IF-008 | 네트워크 호출 로그 확인 | 게임 클라이언트가 결과 저장 API를 직접 호출하지 않음 |
| REQ-IF-009 | 히스토리에서 동일 콘텐츠 재실행 | 앱이 새 `session_id`, `play_source=history_replay` 전달 |
| REQ-IF-010 | 외부 입력 상세값 포함 전송 | `raw_transcript`, `confidence`, `request_id`가 로그에 남음 |

## 중단 이벤트 테스트 예시

1. `standard` 또는 `care` 모드로 게임을 시작한다.
2. 플레이 중 WebView를 닫거나 일시정지 화면에서 종료한다.
3. 앱 로그에서 `GAME_ABANDONED` 이벤트를 확인한다.
4. payload의 `status`가 `abandoned`인지 확인한다.
5. `abandon_reason`이 `user_quit`, `timeout`, `webview_closed` 중 하나인지 확인한다.

## 히스토리 재실행 테스트 예시

1. 동일 `senior_id`, `content_id`, `game_key`로 첫 실행을 완료한다.
2. 히스토리에서 다시 실행한다.
3. 앱이 새 `session_id`를 전달하고 `play_source`를 `history_replay`로 설정했는지 확인한다.
4. 결과 수집 API 조회 시 기존 결과와 신규 결과가 별도 row로 저장되었는지 확인한다.

## 서버 직접 통신 금지 확인

게임 폴더의 결과 저장 관련 네트워크 호출은 없어야 한다.

- 허용: config 파일 로딩용 `fetch(configUrl)`
- 금지: 게임 클라이언트에서 `/api/v1/game-results` 직접 호출
- 저장 책임: 앱 또는 앱이 호출하는 결과 수집 API 서버
