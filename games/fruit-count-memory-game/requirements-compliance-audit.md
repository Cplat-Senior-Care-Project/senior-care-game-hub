# 요구사항 구현 점검 보고서

- 점검일: 2026-06-15
- 대상 프로젝트: `fruit-count-memory-game` / 쏙쏙 개수 찾기
- 기준 문서: `시니어_WebView_게임_요구사항정의서_리스트형.xlsx`
- 보조 기준: `agents.md` 프로젝트 개요, 로컬 구현 파일
- 참고 URL: ClickUp 설계 문서 URL은 접근을 시도했으나 본문을 확인하지 못해 로컬 요구사항 정의서와 구현 파일을 우선 근거로 판정함.

## 판정 기준

- 충족: 현재 파일/코드에서 요구사항을 직접 확인할 수 있음.
- 부분충족: 핵심 구현은 있으나 문서, 런타임 검증, 일부 이벤트/산출물 등이 부족함.
- 미충족: 요구사항에 대응하는 파일, 문서, 구현이 현재 프로젝트 폴더에서 확인되지 않음.
- 확인필요: 앱 WebView, 실제 기기, 서버/API, 수동 QA 등 현재 로컬 정적 분석만으로 확정할 수 없음.
- 범위밖: 이 게임 클라이언트 폴더가 아니라 API 서버/DB 쪽 산출물에 해당함.

## 요약

| 영역 | 판정 | 요약 |
|---|---|---|
| 게임 클라이언트 실행 구조 | 부분충족 | `index.html`, `css`, `js`, `assets`, `config` 기반의 정적 HTML5 WebView 게임 구조는 있음. 다만 실행 가이드/URL 명세 문서가 별도 산출물로 없음. |
| 모드/config 처리 | 충족 | `standard`, `reminder`, `care`, `ai_assisted` 모드별 config와 CSS/JS 모드 자산 분기가 구현됨. |
| 케어/AI 모드 | 충족 | 케어/AI 모드는 5문항, 60초, 보기 2개, UI 축소, soft feedback, 자동 힌트가 config에 반영됨. |
| 앱 연동 | 부분충족 | bridge, ready/started/completed/error/exit 이벤트, 결과 payload가 있음. 단 `GAME_ABANDONED` 별도 이벤트는 없고 `GAME_COMPLETED` + `status=abandoned` 구조임. |
| 결과 로그 | 충족 | session/content/game/mode/difficulty/config/status/time/counts/question_logs/result_detail/error 필드가 구현됨. |
| UI/접근성 | 부분충족 | safe area, 가로 방향 안내, 자동 일시정지, 큰 버튼/텍스트, reduced motion 대응이 있음. 실제 기기/브라우저 렌더 QA는 별도 수행 필요. |
| 오디오 | 부분충족 | 효과음/BGM/음성 안내, config 토글, 종료/일시정지 제어가 있음. 실제 WebView 백그라운드 잔류음은 기기 검증 필요. |
| 문구/피드백 | 부분충족 | 금지 의학 표현은 검색상 화면 문구에서 발견되지 않았고 오답 문구도 부드러운 편임. 단 전체 문구 리스트 산출물이 없음. |
| 에셋/용량 | 부분충족 | 로컬 이미지/오디오 사용, 전체 assets 약 6.83MB로 권장 범위 안. 라이선스 목록과 대표 썸네일 산출물이 없음. |
| API/DB 서버 | 범위밖/미충족 | 요구사항 정의서에는 서버/API/DB 산출물이 있으나 현재 게임 폴더에는 서버 소스, API 명세, DB 스키마, 마이그레이션이 없음. |

## 주요 충족 근거

| 요구사항 | 판정 | 근거 |
|---|---|---|
| REQ-RUN-001 WebView 실행 | 부분충족 | HTML/CSS/JS 정적 구조: `index.html`, `css/`, `js/`, `assets/`. 실제 Android WebView 실행 캡처는 없음. |
| REQ-RUN-002 외부 의존 최소화 | 충족 | 외부 CDN 없이 로컬 CSS/JS/assets 사용. 앱 bridge도 로컬 `js/app-bridge.js`. |
| REQ-RUN-005 로딩 상태 | 충족 | `index.html`의 `start-loading`, `js/game.js`의 `startIntroLoading()`에서 진행률 표시. |
| REQ-RUN-006 로딩 실패 처리 | 충족 | `validateEssentialAssets()`, `showErrorScreen()`, `createErrorResult()`로 에셋/초기화 오류 처리. |
| REQ-UI-003 Safe Area | 충족 | `css/base.css`의 `env(safe-area-inset-*)` 변수와 screen padding 적용. |
| REQ-UI-005 방향 전환 중 일시정지 | 충족 | `syncOrientationGuardPause()`가 세로 방향에서 `pauseGame()` 호출, 해제 시 재개. |
| REQ-UI-008 원격 웹폰트 지양 | 충족 | 시스템/앱 공통 폰트 스택 사용. 원격 폰트 import 없음. |
| REQ-AUDIO-001 음성 안내 제어 | 충족 | `voice_guide_enabled` config, 설정 토글, voice guide 재생 제어 확인. |
| REQ-AUDIO-002 효과음/BGM 제어 | 충족 | 배경음/효과음/음성 토글, `audio-manifest.json`, `AUDIO_TRACKS` 구현. |
| REQ-CONTENT-001 난이도 | 충족 | easy/normal/hard 난이도 설정과 난이도 선택 UI 존재. |
| REQ-CONTENT-002 config override | 충족 | `config-normalizer.js`가 `question_count`, `choice_count`, `reveal_ms`, `hint_enabled` 등을 내부 설정으로 변환. |
| REQ-COPY-001 의학적 효과 표현 금지 | 충족 | `치매`, `기억력 개선`, `치료`, `훈련 효과` 등 금지 표현 검색 결과 화면 문구에서 발견되지 않음. |
| REQ-COPY-002 부드러운 오답 문구 | 충족 | “괜찮아요”, “천천히 다시 기억해 볼까요?”, “조금 헷갈릴 수 있어요” 등으로 구현. |
| REQ-MODE-001 모드 지원 | 충족 | `index.html?mode=...`로 `standard/reminder/care/ai_assisted` config, CSS, JS 분기. |
| REQ-MODE-003 reminder 바로 실행 | 충족 | `shouldAutoStartAfterLoading()`가 reminder 모드 자동 시작을 처리. |
| REQ-MODE-004 care UI 단순화 | 충족 | `care.config.json`에서 timer/progress/score/settings/tutorial/condition 숨김 설정. |
| REQ-MODE-005 care 1~3분 활동 | 충족 | `care.config.json`: 60초, 5문항, 5000ms 노출, 2개 보기. |
| REQ-MODE-006 AI 연동 모드 | 충족 | `ai_assisted.config.json`의 `external_input.enabled`, `FruitCountMemoryGameExternalInput`, `FRUIT_COUNT_EXTERNAL_ANSWER` 구현. |
| REQ-IF-001 config 수신 | 충족 | app bridge가 inline/query/file/stored config를 읽고 normalize/apply. |
| REQ-IF-002 postMessage 통신 | 충족 | mock bridge가 parent/opener `postMessage`로 이벤트 전송. |
| REQ-IF-004 결과 JSON 반환 | 충족 | 완료/중단/오류 payload 생성 및 bridge 전송 구조 존재. |
| REQ-IF-006 config_snapshot 반환 | 충족 | `createConfigSnapshot()` 구현. |
| REQ-IF-007/010 외부 입력 | 충족 | `value`, `answer`, `choice`, `selected_answer`, `raw_transcript`, `confidence` 수용. |
| REQ-IF-008 서버 직접 통신 금지 | 충족 | 게임 결과 저장용 API 호출 없음. `fetch()`는 로컬 config 파일 로드 용도. |
| REQ-LOG-001~020 결과 로그 | 충족 | `createResultPayload()`, `createQuestionLog()`, `createResultDetailJson()`에서 필수/권장 로그 대부분 생성. |
| FB-COUNT-001 방향 전환 모달 중 게임 진행 | 충족 | 현재 구현은 방향 전환 guard 표시 중 자동 일시정지/재개 처리됨. |

## 부분충족 또는 미충족 항목

| 요구사항 | 판정 | 사유/보완 |
|---|---|---|
| REQ-RUN-003 파일 구조 명세 | 부분충족 | 실제 구조는 있으나 `docs/실행가이드` 같은 명세 문서 없음. |
| REQ-RUN-004 모드별 실행 경로 명세 | 부분충족 | 구현은 `index.html?mode=...` 방식이나 최종 실행 URL 표 산출물이 없음. |
| REQ-RUN-007 저사양 최적화 | 확인필요 | assets 총량은 약 6.83MB로 적정하나 실제 저사양 기기 FPS/발열 테스트 결과 없음. |
| REQ-RUN-008 용량 정보 | 부분충족 | 파일 용량 확인은 가능하나 용량 정보표 산출물 없음. |
| REQ-UI-001/002/007 반응형/Y축/스크롤 | 확인필요 | CSS상 스케일링/overflow 제어는 있으나 실제 주요 기기 렌더 캡처가 없음. |
| REQ-UI-004 화면 방향 정책 명시 | 부분충족 | 가로 안내 UI는 있으나 설계 설명서 내 정책 명시 산출물은 확인 안 됨. |
| REQ-AUDIO-003 종료/백그라운드 사운드 정지 | 확인필요 | pause/exit/background 제어 코드는 있으나 실제 RN WebView 백그라운드 검증 필요. |
| REQ-CONTENT-003 문제/에셋 데이터 분리 | 부분충족 | 에셋은 분리되어 있으나 과일 목록/문항 생성 로직은 `js/game.js` 내부에 있음. 별도 data/config 문제은행은 아님. |
| REQ-CONTENT-005 콘텐츠 DB 난이도 저장 | 미충족 | DB 저장 방식 제안 문서 없음. |
| REQ-CONTENT-006 content_id/game_key 연결 | 부분충족 | 결과 payload에는 포함되나 콘텐츠 DB 연결 문서/스키마 없음. |
| REQ-CONTENT-007 인지활동 영역 | 부분충족 | 결과 로그에 `memory_activity`는 있으나 설계 설명서 산출물로 명시된 문서 없음. |
| REQ-IP-001 상용 게임 모방 금지 | 확인필요 | 코드만으로는 직접 모방 근거 없음. 법무/기획 검토 필요. |
| REQ-IP-002 에셋 라이선스 제출 | 미충족 | `audio-manifest.json`은 있으나 이미지/오디오/폰트 라이선스 목록 문서 없음. |
| REQ-ASSET-001 4:3 썸네일 | 미충족 | `thumbnail` 또는 대표 썸네일로 식별되는 4:3 이미지 없음. |
| REQ-MODE-007 모드별 종료 화면 | 부분충족 | 모드별 CSS 제어는 있으나 reminder CSS에 과거/중복 규칙이 섞여 있어 실제 화면 검증 필요. |
| REQ-IF-003 이벤트 구조 | 부분충족 | `GAME_READY`, `GAME_STARTED`, `GAME_COMPLETED`, `GAME_ERROR`, `GAME_EXIT_REQUESTED` 있음. `GAME_ABANDONED` 별도 이벤트는 없고 abandoned status로 반환. 명세 정리 필요. |
| REQ-IF-009 히스토리 재실행 신규 세션 | 확인필요 | 게임은 session_id를 수용/생성하지만 히스토리 재실행 정책은 앱 책임이라 현재 폴더만으로 검증 불가. |
| REQ-LOG-022 중복 저장 식별 | 부분충족 | `session_id` 반환은 있으나 서버 측 idempotency/unique constraint 없음. |
| REQ-LOG-023~025 컨디션/보상/랭킹 확장 | 부분충족 | 컨디션 데이터는 일부 구현. 보상/랭킹은 서버/앱 확장 설계 문서 없음. |

## 산출물 체크리스트 판정

| 산출물 | 판정 | 비고 |
|---|---|---|
| DELIV-GAME-001 실행 파일 | 충족 | `index.html`, CSS/JS/assets/config 존재. |
| DELIV-GAME-002 소스코드 | 충족 | 게임 로직, config 처리, 결과 반환부 존재. |
| DELIV-GAME-003 모드별 config 샘플 | 부분충족 | 4개 모드 config는 있음. easy/normal/hard 조합별 별도 샘플은 부족. |
| DELIV-GAME-004 실행 URL 명세 | 미충족 | 별도 문서 없음. |
| DELIV-GAME-005 앱 연동 인터페이스 명세 | 미충족 | 코드 구현은 있으나 문서 산출물 없음. |
| DELIV-GAME-006 결과 JSON 샘플 | 미충족 | completed/abandoned/error 샘플 JSON 문서 없음. |
| DELIV-GAME-007 데이터 수집 항목표 | 미충족 | 결과 필드는 코드에 있으나 항목표 문서 없음. |
| DELIV-GAME-008 문구 리스트 | 미충족 | 사용자 노출 문구 목록 산출물 없음. |
| DELIV-GAME-009 대표 썸네일 | 미충족 | 4:3 대표 썸네일 파일 없음. |
| DELIV-GAME-010 에셋/라이선스 목록 | 미충족 | 라이선스 문서 없음. |
| DELIV-GAME-011 용량 정보 | 미충족 | 용량 정보 문서 없음. 현재 assets 약 6.83MB. |
| DELIV-GAME-012 QA 테스트 결과 | 미충족 | 실제 WebView/기기 QA 결과 문서 없음. |
| DELIV-GAME-013 게임별 설계 설명서 | 부분충족 | `agents.md`에 개요는 있으나 정식 설계 설명서 산출물로 보기 부족. |
| DELIV-SERVER-001~014 | 범위밖/미충족 | 현재 게임 클라이언트 폴더에는 API 서버, DB 스키마, 마이그레이션, 서버 문서 없음. |

## API/DB 요구사항 상세 판정

현재 폴더는 WebView 게임 클라이언트 산출물 중심이다. `요구사항_API_DB` 시트의 `REQ-SERVER-001~026`은 서버/API/DB 구현 또는 문서 산출물에 해당하며, 현재 프로젝트 폴더 안에서는 대응 구현을 확인하지 못했다.

| 요구사항 | 판정 | 비고 |
|---|---|---|
| REQ-SERVER-001 결과 수집 API 서버 | 범위밖/미충족 | 서버 소스코드 없음. |
| REQ-SERVER-002 API 명세 | 미충족 | endpoint/method/request/response/error code 문서 없음. |
| REQ-SERVER-003 DB 스키마 | 미충족 | SQL/스키마 문서 없음. |
| REQ-SERVER-004 앱 결합 식별자 수용 | 확인필요 | 게임 결과에는 일부 식별자가 있으나 API 수용 여부는 서버가 없어 검증 불가. |
| REQ-SERVER-005 중복 저장 방지 | 미충족 | unique constraint/idempotency 구현 없음. |
| REQ-SERVER-006 result_detail_json 저장 | 확인필요 | 게임은 `result_detail_json`을 반환하지만 DB 저장 구조 없음. |
| REQ-SERVER-007 완료/중단/오류 저장 | 미충족 | 저장 API/DB 없음. |
| REQ-SERVER-008 API 오류 응답 | 미충족 | API 오류 코드표 없음. |
| REQ-SERVER-009 인증/보안 | 미충족 | API 인증 방식 문서 없음. |
| REQ-SERVER-010 결과 조회/리포트 | 미충족 | 조회 API/리포트 구조 없음. |
| REQ-SERVER-011 환경변수 목록 | 미충족 | 서버 환경변수 문서 없음. |
| REQ-SERVER-012 로컬 실행 방법 | 미충족 | 서버 로컬 실행 문서 없음. |
| REQ-SERVER-013 배포/운영 문서 | 미충족 | 배포/로그/장애 확인 문서 없음. |
| REQ-SERVER-014 서버 저장 테스트 결과 | 미충족 | completed/abandoned/error 저장 테스트 결과 없음. |
| REQ-SERVER-015 앱 이식 가이드 | 미충족 | API 호출 순서와 예시 문서 없음. |
| REQ-SERVER-016 기본 요청 필드 수용 | 확인필요 | 게임 결과 payload는 많은 필드를 제공하지만 API 수용 여부는 검증 불가. |
| REQ-SERVER-017 발송/예약 식별자 | 미충족 | assignment/alarm/schedule 저장 구조 없음. |
| REQ-SERVER-018 client_context | 미충족 | API 수용 구조 없음. |
| REQ-SERVER-019 내부 이식 가능 구조 | 미충족 | 서버 모듈 구조 없음. |
| REQ-SERVER-020 후속 식별자 확장 | 미충족 | API/DB 확장 설계 없음. |
| REQ-SERVER-021 원본 JSON 보존 | 미충족 | `game_result_json` 저장 구조 없음. |
| REQ-SERVER-022 마이그레이션 | 미충족 | 초기화 SQL/마이그레이션 없음. |
| REQ-SERVER-023 테스트 요청/응답 샘플 | 미충족 | API 테스트 샘플 없음. |
| REQ-SERVER-024 히스토리 재실행 별도 저장 | 미충족 | 서버 저장 정책 없음. |
| REQ-SERVER-025 play_source=history_replay | 확인필요 | 게임 config/result에서 확장 가능하나 서버 저장 정책 없음. |
| REQ-SERVER-026 리포트 반영 기준 | 미충족 | 리포트 정책 제안 문서 없음. |

## QA 체크리스트 판정

| QA | 판정 | 비고 |
|---|---|---|
| REQ-QA-001 WebView 실행 | 확인필요 | 로컬 브라우저 자동화가 sandbox 오류로 실패. Android WebView 캡처 필요. |
| REQ-QA-002 네트워크 의존성 | 부분충족 | 정적 구조상 로컬 에셋 기반. 실제 네트워크 차단 테스트 결과 없음. |
| REQ-QA-003 모드별 실행 URL | 부분충족 | `index.html?mode=...` 구현. 실제 URL 테스트 및 명세 문서 필요. |
| REQ-QA-004~006 반응형/Safe Area | 확인필요 | CSS 근거는 있으나 주요 기기 캡처 없음. |
| REQ-QA-007 방향 전환 일시정지 | 부분충족 | 코드상 충족. 실제 방향 전환 관찰 필요. |
| REQ-QA-008 care 모드 UI | 부분충족 | config/CSS 근거 있음. 실제 화면 캡처 필요. |
| REQ-QA-009 reminder 모드 | 부분충족 | 자동 시작 코드 있음. 실제 화면 캡처 필요. |
| REQ-QA-010~011 문구 | 부분충족 | 검색상 금지 표현 없음, 오답 문구 부드러움. 전체 문구 리스트 기반 전수 검수 필요. |
| REQ-QA-012~013 오디오 | 확인필요 | 코드/에셋은 있음. 실제 WebView 오디오 동작 검증 필요. |
| REQ-QA-014~016 로그 | 부분충족 | 코드상 결과 payload 있음. 실제 completed/abandoned/error 샘플 캡처 필요. |
| REQ-QA-017~019 API/DB | 범위밖/미충족 | 서버/API 구현 및 테스트 산출물 없음. |
| REQ-QA-020 산출물 누락 | 미충족 | 문서, 썸네일, 라이선스, 서버 산출물이 누락됨. |

## 우선 보완 권장사항

1. `docs/` 폴더를 만들고 실행 URL 명세, 앱 연동 이벤트 명세, 결과 JSON 샘플, 데이터 수집 항목표를 추가한다.
2. 4:3 대표 썸네일 이미지를 추가한다.
3. 이미지/오디오/폰트/외부 코드의 출처와 라이선스 목록을 만든다.
4. Android WebView 또는 동등 브라우저에서 `standard`, `reminder`, `care`, `ai_assisted` 모드별 캡처와 QA 결과를 남긴다.
5. completed/abandoned/error 세 가지 결과 JSON 샘플을 실제 실행 로그로 생성한다.
6. 서버/API/DB가 이번 납품 범위라면 별도 서버 프로젝트, API 명세, DB 스키마, 중복 저장 방지 설계를 추가한다. 게임 클라이언트 범위라면 해당 항목은 범위밖으로 명시한다.
7. `GAME_ABANDONED`를 별도 이벤트로 요구한다면 구현을 추가하거나, 현재처럼 `GAME_COMPLETED` + `status=abandoned`로 처리한다는 인터페이스 명세를 확정한다.

## 검증 한계

- ClickUp 설계 문서 본문은 현재 환경에서 확인하지 못했다.
- in-app Browser 자동화는 Windows sandbox 오류로 실행하지 못했다.
- 백그라운드 로컬 서버 유지가 불안정해 실제 브라우저 렌더 캡처는 남기지 못했다.
- 따라서 화면 잘림, 오디오 잔류, 실제 WebView 이벤트 수신은 코드 근거만으로는 최종 통과 처리하지 않았다.
