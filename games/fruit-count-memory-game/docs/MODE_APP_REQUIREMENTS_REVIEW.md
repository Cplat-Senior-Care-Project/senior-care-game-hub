# 요구사항_실행모드_앱연동 반영 검토 결과

검토일: 2026-06-15

대상 게임: 쏙쏙 개수 찾기 (`fruit-count-memory-game`)

기준 문서: `시니어_WebView_게임_요구사항정의서_리스트형.xlsx` / `요구사항_실행모드_앱연동`

## 최종 판정

| 구분 | 개수 | 비고 |
|---|---:|---|
| 충족 | 16 | 코드 또는 문서 기준 반영 |
| 확인 필요 | 1 | 앱/WebView 실제 연동 책임 포함 |
| 미충족 | 0 | 현재 확인 기준 |

## 요구사항별 판정

| ID | 요구사항 | 판정 | 근거 |
|---|---|---|---|
| REQ-MODE-001 | 실행 모드 지원 | 충족 | `index.html?mode=...`로 `standard`, `reminder`, `care`, `ai_assisted` 분기 |
| REQ-MODE-002 | 표준 모드 | 충족 | 난이도 선택, 점수/기록, 설정, 컨디션 체크 노출 |
| REQ-MODE-003 | 알림 모드 바로 실행 | 충족 | `reminder` 모드는 난이도 선택 생략 후 자동 시작 |
| REQ-MODE-004 | 케어 모드 단순화 | 충족 | `care.config.json`에서 timer/score/settings/tutorial/condition 숨김 |
| REQ-MODE-005 | 케어 모드 1~3분 활동 | 충족 | 60초, 5문항, 보기 2개 기준 config |
| REQ-MODE-006 | AI 연동 모드 | 충족 | `ai_assisted` config와 외부 입력 인터페이스 구현 |
| REQ-MODE-007 | 모드별 종료 화면/재실행 버튼 제어 | 충족 | `reminder/care/ai_assisted` 자동 복귀 기준 문서화 및 QA 체크리스트 추가 |
| REQ-IF-001 | 앱 config 수신 | 충족 | `session_id`, `content_id`, `game_key`, `mode`, `difficulty`, `config` 정규화 |
| REQ-IF-002 | postMessage 기반 통신 | 충족 | mock bridge가 `parent/opener.postMessage()`로 이벤트 송신 |
| REQ-IF-003 | 이벤트 구조 정의 | 충족 | `GAME_READY`, `GAME_STARTED`, `GAME_COMPLETED`, `GAME_ABANDONED`, `GAME_ERROR`, `GAME_EXIT_REQUESTED` 정의 |
| REQ-IF-004 | 게임 결과 JSON 반환 | 충족 | 완료/중단/오류 결과 payload 생성 |
| REQ-IF-005 | 오류 책임 구분 | 충족 | 게임 내부 오류는 `GAME_ERROR`; 서버/API 저장 오류는 앱/API 책임으로 문서화 |
| REQ-IF-006 | config_snapshot 반환 | 충족 | 실제 적용 config를 결과에 포함 |
| REQ-IF-007 | 외부 입력 인터페이스 | 충족 | `EXTERNAL_ANSWER`와 `FruitCountMemoryGameExternalInput.submitAnswer()` 지원 |
| REQ-IF-008 | 서버 직접 통신 금지 | 충족 | 결과 저장 API 직접 호출 없음. `fetch()`는 config 파일 로딩 용도 |
| REQ-IF-009 | 히스토리 재실행 신규 세션 | 확인 필요 | 게임은 `session_id`/`history_replay` 수용. 실제 신규 세션 발급은 앱 연동 테스트 필요 |
| REQ-IF-010 | EXTERNAL_ANSWER 상세값 수용 | 충족 | `selected_answer`, `input_type`, `raw_transcript`, `confidence`, `request_id` 수용 |

## 보완 반영 내역

1. 중단 결과 전송을 `GAME_ABANDONED` 별도 이벤트로 분리했다.
2. 이전 앱 브릿지와의 호환을 위해 중단 이벤트 미지원 시 `GAME_COMPLETED` 계열 fallback을 유지했다.
3. 앱 연동 및 실행 모드 명세를 추가했다: `docs/APP_MODE_INTEGRATION_SPEC.md`
4. 실행 모드 및 앱 연동 QA 체크리스트를 추가했다: `docs/MODE_APP_INTEGRATION_QA_CHECKLIST.md`

## 남은 검수

`REQ-IF-009`는 게임 코드만으로 최종 통과 처리할 수 없다. 앱에서 히스토리 재실행 시 매번 새 `session_id`를 생성하고 `play_source=history_replay`를 전달하는지 실제 앱 연동 로그와 결과 수집 API 저장 row로 확인해야 한다.
