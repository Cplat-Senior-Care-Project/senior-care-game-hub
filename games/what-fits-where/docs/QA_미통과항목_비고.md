# QA 미통과/공란 항목 비고 근거

확인일: 2026-06-17

기준 자료:
- `agents.md` 프로젝트 지침
- `시니어_WebView_게임_요구사항정의서_리스트형 (4).xlsx`
- `docs/게임_결과_데이터_정의서.md`
- `docs/api-db-integration.md`
- `docs/오늘의_준비물_이벤트_및_상태전이_정의서.md`

참고: ClickUp에서 `PLN_PRP_001_v0.2_게임 개요 보고서` 정확한 문서명은 검색되지 않았고, 관련 프로젝트 `Daily Scrum` 문서만 검색됨. 따라서 로컬 요구사항 엑셀과 프로젝트 문서를 1차 근거로 사용함.

| 화면 | 모드 구분 | 테스트 항목 | 판정 | 비고 |
|---|---|---|---|---|
| 로딩 화면 | 모든 모드 | 로딩 실패 시 오류 안내 및 앱 오류 상태 전달이 정상 동작하는가 | 부분 통과 | `showError()`가 오류 모달을 표시하고 `GAME_ERROR` payload를 전송함(`js/game.js:884-960`). 다만 템플릿 fetch 실패는 내장 데이터 fallback으로 처리되어 즉시 오류로 가지 않으며, 로딩 실패 전체를 브라우저 런타임으로 재현 검증하지는 못함. |
| 컨디션 체크 화면 | 표준모드 | 건너뛰기 시 moodBefore/sleepHours가 null로 저장되는가 | 통과 | 건너뛰기 클릭 시 `state.conditionData = { skipped:true, mood:null, sleep_hours:null, sleep_range:null }`로 저장됨(`js/game.js:835-842`). 결과 payload에는 `result_detail_json.condition_data`로 포함됨(`js/game.js:2214`, `js/game.js:2335`). |
| 문제 화면 | 모든 모드 | 힌트 문구가 없는 경우 기본 문구가 출력되는가 | 통과 | `hintItemText()`가 힌트가 없을 때 `생활 속에서 쓰임새를 떠올려 보세요.`를 반환함(`js/game.js:1718-1720`). |
| 결과 화면 | 모든 모드 | 세션 데이터(status, started_at, ended_at, duration_ms, total_questions, correct_count, wrong_count, hint_count)가 정확히 저장되는가 | 통과(정적 확인) | `finishGame()`에서 해당 필드들을 root result와 `game_result`에 생성함(`js/game.js:2228-2276`, `js/game.js:2281-2324`). 문법 검증 `node --check js/game.js config/modes.js modes/registry.js` 통과. |
| 결과 화면 | 모든 모드 | question_logs 배열에 문항별 정답 여부, 선택값, 응답 시간, 힌트 사용 여부가 정확히 저장되는가 | 통과(정적 확인) | `buildQuestionLog()`가 `selected_keys`, `correct/is_correct`, `response_time_ms`, `hint_count`, `attempts`, `input_type` 등을 기록함(`js/game.js:1852-1905`). |
| 결과 화면 | 모든 모드 | 과정 데이터(first_response_time_ms, changed_answer_count, wrong_tap_count, paused_count 등)가 정확히 기록되는가 | 부분 통과 | 오답 터치는 `retry_count`, `wrongCount`, `attempts`로 기록됨(`js/game.js:1837-1846`, `js/game.js:1883-1888`). 하지만 `first_response_time_ms`, `changed_answer_count`, `paused_count/pause_count` 필드명은 구현 검색 결과 없음. |
| 결과 화면 | 모든 모드 | result_detail_json에 게임 상세값(situation_count, required_item_count, wrong_item_count, option_count 등)이 정확히 저장되는가 | 부분 통과 | `result_detail_json`에는 선택/오답/추천/단계/컨디션 값이 저장됨(`js/game.js:2202-2217`). `situation_count`는 문항 로그에 있음(`js/game.js:1872`)이나, 예시의 `required_item_count`, `wrong_item_count`, `option_count` 집계 필드는 `result_detail_json`에 없음. |
| 결과 화면 | 모든 모드 | 게임 종료 시 postMessage로 결과 데이터가 앱에 정상 전달되는가 | 통과(정적 확인) | `sendGameEvent()`가 `window.ReactNativeWebView.postMessage(JSON.stringify({type,payload,timestamp}))`를 사용함(`js/game.js:499-508`). 종료 시 `GAME_COMPLETED` 또는 `GAME_ABANDONED`를 전송함(`js/game.js:2341-2343`). |
| 결과 화면 | 케어/AI연동 모드 | config에 따라 자동 복귀 또는 AI 대화 세션 복귀가 정상 동작하는가 | 부분 통과 | `care`, `ai_assisted` 기본 config에 `auto_return_to_hub:true`가 있고, 결과 화면 후 `returnToHub()`가 3초 뒤 호출됨. 단 AI 대화 세션 전용 복귀 이벤트는 별도 구현 없이 `RETURN_TO_HUB`/`RETURN_TO_HYODAM_CALL`만 전송함. |
| 일시정지 모달 | 모든 모드 | 게임 나가기 시 중도 종료로 처리되고 현재까지 결과 데이터가 앱에 전달되는가 | 통과(정적 확인) | 나가기 확인 후 `state.endedByUser=true; finishGame(true,false)` 호출(`js/game.js:2028-2031`). `finishGame()`은 `status:"abandoned"`, `exit_reason:"user_exit"`와 현재 문항 partial log를 포함해 전송함(`js/game.js:2194-2200`, `js/game.js:2342`). |
| 일시정지 모달 | 모든 모드 | 일시정지 횟수(pause_count)가 정확히 기록되는가 | 미구현 | `state.paused`와 문항별 pause 누적시간은 있으나(`js/game.js:171-189`), `pause_count` 또는 `paused_count` 필드 저장 구현은 검색되지 않음. |
| 공통/앱 연동 | 모든 모드 | 앱이 전달한 session_id, content_id, game_key, mode, difficulty, config 값이 정상 반영되는가 | 통과(정적 확인) | URL/config/message에서 주요 값을 읽고 정규화함(`config/modes.js:33-80`, `config/modes.js:116-196`). 런타임 메시지 config도 `applyRuntimeConfig()`에서 반영함(`js/game.js:547-571`). |
| 공통/앱 연동 | 모든 모드 | 앱의 음소거/일시정지/재개 명령 수신 시 정상 처리되는가 | 부분 통과 | `PAUSE_GAME`/`RESUME_GAME` 수신 처리는 구현됨(`js/game.js:628-634`). 음소거는 `APP_CONFIG`의 `background_music_enabled`, `sound_effect_enabled`, `voice_guide_enabled` 또는 UI 토글로 반영되지만(`js/game.js:247-252`, `js/audio.js:253-268`), 별도 `MUTE_GAME` 명령은 없음. |
| 공통/앱 연동 | 모든 모드 | 앱의 종료 요청 수신 시 정상 처리되는가 | 미구현 | 앱에서 게임으로 들어오는 메시지는 `APP_CONFIG/GAME_CONFIG/CONFIG`, `PAUSE_GAME`, `RESUME_GAME`, `EXTERNAL_ANSWER`, `EXTERNAL_ITEM_SELECT`만 처리함(`js/game.js:617-640`). 별도 종료 요청 타입은 없음. |
| 공통/앱 연동 | AI연동 모드 | 외부 입력값(EXTERNAL_ANSWER) 수신 시 사용자 선택값으로 정상 처리되는가 | 통과(정적 확인) | `EXTERNAL_ANSWER`/`EXTERNAL_ITEM_SELECT`가 선택지 `data-key` 또는 텍스트와 매칭되어 버튼 클릭으로 처리됨(`js/game.js:586-614`, `js/game.js:636-638`). |
| 공통/앱 연동 | 모든 모드 | postMessage 변수명·JSON 구조가 공통 명세서 기준과 일치하는가 | 통과(단, 브리지 범위 제한) | 이벤트 래퍼 `{ type, payload, timestamp }` 구조는 문서와 구현이 일치함(`docs/오늘의_준비물_이벤트_및_상태전이_정의서.md:192-202`, `js/game.js:499-508`). 현재 구현 브리지는 ReactNativeWebView 중심이며 `webkit.messageHandlers` 경로는 문서상 미포함으로 명시됨(`docs/오늘의_준비물_이벤트_및_상태전이_정의서.md:391`). |
| 공통/앱 연동 | 모든 모드 | 모드별 config(show_timer, show_score, hint_enabled, voice_guide_enabled 등)가 정상 반영되는가 | 부분 통과 | `show_timer`, `show_pause`, `show_hint`, `voice_guide_enabled` 등은 config와 UI에 반영됨(`config/modes.js:62-68`, `js/game.js:247-273`, `js/game.js:1677-1685`). 다만 명세의 `hint_enabled`가 아니라 `show_hint`를 사용하며, `show_score`는 파싱되지만 `shouldShowScoreScreen()`이 항상 false라 점수 화면 제어에는 실효성이 낮음(`js/game.js:191-193`). |
| 오류 처리 | 모든 모드 | 물건 카드 이미지 로딩 실패 시 대체 이미지 또는 오류 화면이 표시되는가 | 통과 | `phHtml()`의 `img onerror`가 이미지 대신 물건명 텍스트 fallback(`span.ph-fallback`)으로 교체함(`js/items.js:212-218`). |
| 오류 처리 | 모든 모드 | 상황 템플릿/questionPatterns/requiredPool/wrongPool 데이터 누락 시 오류 처리되는가 | 부분 통과 | `requiredPool` 누락/빈 값은 `templateToPackQuestion()`에서 제외되고, 사용 가능한 템플릿이 없으면 오류 처리됨(`js/game.js:1093-1107`, `js/game.js:1075`). `questionPatterns` 누락은 기본 문구로 fallback됨(`js/game.js:1101-1105`). |
| 오류 처리 | 모든 모드 | requiredPool 또는 wrongPool 후보 수가 추출 개수보다 부족할 경우 해당 템플릿이 출제 대상에서 제외되는가 | 부분 통과 | 정답 수가 부족한 템플릿은 우선 후보에서 밀리지만 완전히 제외되지는 않음(`js/game.js:1283-1289`). 보기 수 부족은 전체 아이템 풀 filler로 보강됨(`js/game.js:1166-1175`). |
| 오류 처리 | 어려움 | 필터링 후 오답 후보 부족 시 다른 템플릿 조합으로 재추출되는가 | 미구현/부분 통과 | 충돌 오답 필터링은 구현됨(`js/game.js:1144-1150`, `js/game.js:1400-1404`). 하지만 필터링 후 부족할 때 조합을 재추출하는 루프는 없고, 전체 아이템 filler로 보강하는 방식임(`js/game.js:1166-1175`, `js/game.js:1429-1438`). |
| 오류 처리 | 모든 모드 | 게임 실행 중 예외 발생 시 오류 코드가 앱에 전달되는가 | 통과 | 전역 `window.error`에서 `showError()` 호출(`js/game.js:858-860`), `showError()`가 `error_code:"GAME_ERROR"`와 `GAME_ERROR` 이벤트를 전송함(`js/game.js:895-960`). |
| 오류 처리 | 모든 모드 | 초기 설정값 누락 시 오류 화면이 표시되는가 | 미구현/명세와 다름 | `session_id`는 없으면 생성되고(`js/game.js:59-64`), `mode`/난이도/config도 기본값으로 보정됨(`config/modes.js:10-19`, `config/modes.js:116-196`). 누락 자체를 오류 화면으로 처리하지 않음. |
| 오류 처리 | 모든 모드 | 네트워크 지연 시 빈 화면 없이 로딩 상태가 유지되는가 | 부분 통과 | 로딩 UI는 존재하고(`index.html:558-570`), 템플릿 준비가 끝난 뒤 화면 전환을 시도함(`js/game.js:709-712`). 다만 fetch timeout/장기 지연 전용 오류나 재시도 처리는 없음. |
| 오류 처리 | 모든 모드 | 게임 중 앱 복귀 후 재진입 시 정상 처리되는가 | 부분 통과 | 브라우저/앱 visibility 복귀 시 pause/resume 처리가 있음(`js/game.js:844-856`, `js/audio.js:282-289`). 완전 앱 종료 후 재진입 상태 복원은 별도 저장 없이 새 세션/초기화 흐름에 의존함. |
| 오류 처리 | 모든 모드 | 중도 종료 후 재시작 시 이전 상태가 정상 초기화되는가 | 통과(정적 확인) | `startGame()`이 점수, 로그, 힌트, 종료 플래그 등을 초기화함(`js/game.js:1512-1526`). `resetToStartScreen()`도 큐/현재 문항/플래그를 초기화함(`js/game.js:2127-2145`). |
| 반응형 | 모든 모드 | 소형(5인치대)/중형(6인치대)/태블릿 기기에서 UI가 정상 표시되는가 | 확인 필요 | `viewport-fit=cover`, stage scale 계산, 다수 반응형 CSS는 구현되어 있음(`index.html:6-27`, `css/styles.css:1638-1649`). 다만 이번 환경에 브라우저 자동화 패키지가 없어 실제 기기 크기별 화면 캡처 검증은 미수행. |
| 반응형 | 모든 모드 | 가로 모드 기준으로 UI가 정상 표시되는가 | 확인 필요 | 가로 화면 메타와 host fullscreen/orientation 요청은 구현됨(`index.html:10`, `js/game.js:326-371`). 실제 가로 모드 렌더링은 브라우저/기기 QA 필요. |
| 반응형 | 모든 모드 | Safe Area / 노치 / 하단 제스처 영역을 침범하지 않는가 | 부분 통과 | `env(safe-area-inset-*)` 변수를 정의하고 하단/모달 padding에 다수 적용함(`css/styles.css:1646-1649` 외). 실제 노치/제스처 영역 기기 검증은 미수행. |
| 반응형 | 모든 모드 | UI, 텍스트 줄바꿈 등이 정상 표시되는가 | 확인 필요 | 프롬프트 줄바꿈/강조 렌더링은 별도 처리됨(`js/game.js:1199-1260`). 실제 소형/태블릿 화면별 시각 검증은 자동 브라우저 부재로 미수행. |
| 에셋 | 모든 모드 | 외부 CDN 의존성이 제거되었는가 | 통과 | `index.html`의 CSS/JS 참조가 모두 로컬 경로이며(`index.html:29`, `index.html:582-588`), `rg` 검색에서도 외부 CDN script/link 참조가 발견되지 않음. |
