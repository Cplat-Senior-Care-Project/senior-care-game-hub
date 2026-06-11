# DAT-SHOP-001_데이터 수집 항목표_v0.1

# 장바구니 기억하기 데이터 수집 항목표

## 1. 문서 목적

본 문서는 WebView 기반 인지활동 콘텐츠인 `shop-quest-memory-game`에서 수집하거나 앱으로 반환하는 데이터 항목을 정리하기 위한 문서이다.

이 게임은 잠시 보여준 장보기 물건을 기억한 뒤, 동일한 물건을 장바구니에 담는 기억 활동 게임이다. 데이터 수집 항목표는 게임 실행 중 어떤 데이터가 생성되는지, 언제 앱으로 전달되는지, 어떤 목적으로 활용되는지를 한눈에 확인하기 위한 개발 산출물이다.

## 2. 코드 확인 범위

| 구분 | 확인 파일 |
|---|---|
| 화면 및 설정 진입 | `index.html` |
| 런타임 설정 로드 및 앱 브릿지 | `js/app-bridge.js` |
| 외부 config 정규화 | `js/config-normalizer.js` |
| 게임 실행, 문항 생성, 결과 JSON 생성 | `js/game.js` |
| 모드별 동작 보정 | `js/modes/standard.js`, `js/modes/reminder.js`, `js/modes/care.js`, `js/modes/ai_assisted.js` |
| 게임 내부 config | `config/*.config.json`, `config/game.config.json` |
| 허브/상위 config | `../../config/shop-quest-memory-game*.json` |

## 3. 수집 범위 및 원칙

| 구분 | 내용 |
|---|---|
| 수집 목적 | 콘텐츠 참여 여부, 기억 활동 수행 흐름, 도움 필요 정도, 오답/누락 패턴, 중도 종료 여부, 난이도 참고, 보호자/요양원 리포트 활용 |
| 수집 단위 | 게임 1회 실행 세션, 문항별 결과, 사용자 수행 과정, 게임별 상세값 |
| 결과 반환 방식 | 게임 완료 시 WebView가 앱 브릿지로 `GAME_COMPLETED` 메시지를 전달 |
| 준비/시작/종료 이벤트 | `GAME_READY`, `GAME_STARTED`, `GAME_EXIT_REQUESTED`, `GAME_ERROR` 메시지를 별도 전달 |
| 진단 목적 여부 | 의료적 진단, 인지 저하 판정 목적이 아님 |
| 사용자/보호자 식별값 | `user_id`, `senior_id`, `guardian_id`, `assignment_id`, `alarm_id` 등은 앱/서버가 보유 및 결합 |
| 게임별 확장 데이터 | 공통 필드를 계속 늘리지 않고 `result_detail_json`에 게임 전용 상세값을 저장 |
| 케어 모드 수집 방향 | 점수보다 완료 여부, 힌트 사용, 반응 시간, 중도 종료 여부, 누락 물건 수 중심으로 기록 |
| AI 연동 모드 수집 방향 | 게임 자체는 STT/AI 판단을 수행하지 않고, 앱/AI가 전달한 선택값을 외부 입력으로 처리 |

## 4. 브릿지 이벤트 요약

| 이벤트 타입 | 발생 시점 | 대표 payload | 비고 |
|---|---|---|---|
| `GAME_READY` | 설정 로드 및 초기 화면 준비 후 | `game_id`, `session_id`, `mode`, `ready_at` | 앱에서 게임 준비 상태 확인 |
| `GAME_STARTED` | 실제 게임 플레이 시작 시 | `game_id`, `session_id`, `mode`, `difficulty`, `started_at` | 시작 카운트다운 이후 전송 |
| `GAME_COMPLETED` | 결과 화면 진입 시 | 세션/문항/상세 결과 전체 JSON | 본 문서의 핵심 수집 결과 |
| `GAME_EXIT_REQUESTED` | 효담콜/허브로 돌아가기 요청 시 | `game_id`, `session_id`, `requested_at` | 사용자가 나가기 버튼 또는 결과 후 자동 복귀 흐름 사용 |
| `GAME_ERROR` | 초기화 또는 런타임 오류 발생 시 | `status`, `error_code`, `error_message`, `game_id`, `occurred_at` | 정상 완료 결과 JSON과 별도 이벤트 |

## 5. 데이터 구분 요약

| 데이터 구분 | 설명 | 대표 필드 |
|---|---|---|
| 세션 데이터 | 게임 1회 실행 전체에 대한 기본 정보 | `session_id`, `content_id`, `game_key`, `mode`, `difficulty`, `started_at`, `ended_at`, `status` |
| 설정 스냅샷 | 실제 실행에 적용된 UI/난이도/로그 설정 | `config_snapshot.show_timer`, `question_count`, `max_choice_count`, `max_items_to_remember`, `use_drag` |
| 문항별 결과 데이터 | 각 문항에서 기억해야 할 물건, 선택한 물건, 정답 여부, 힌트 사용 여부 | `question_logs`, `target_items`, `selected_items`, `is_correct`, `attempt_count`, `hint_used` |
| 과정 데이터 | 실제 수행 흐름과 상호작용 과정 | `first_response_time_ms`, `response_time_ms`, `wrong_tap_count`, `touch_miss_count`, `pause_count` |
| 오류 데이터 | 게임 실행 중 발생한 오류 정보 | `error_code`, `error_message`, `status`, `GAME_ERROR` payload |
| 게임별 상세값 | 장바구니 기억하기 전용 상세값 | `result_detail_json.max_choice_count`, `max_items_to_remember`, `total_missed_item_count`, `external_input_used` |

## 6. 세션 데이터 수집 항목

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 세션 | 세션 ID | `session_id` | 게임 실행 시/결과 생성 시 | 앱 config 전달 또는 WebView 내부 생성 | 앱 세션과 게임 결과 매칭, 중복 저장 방지 | 필수 |
| 세션 | 콘텐츠 ID | `content_id` | 결과 생성 시 | `runtimeConfig.contentId` | 어떤 콘텐츠가 수행되었는지 식별 | 필수, 기본값 `cognitive_shopping_cart_001` |
| 세션 | 게임 유형 ID | `game_key` | 결과 생성 시 | `runtimeConfig.gameKey` | 게임 유형별 통계 분석 | 필수, 기본값 `shopping_cart_memory` |
| 세션 | 실행 모드 | `mode` | 설정 로드 시/결과 생성 시 | URL mode 또는 config | `standard`, `reminder`, `care`, `ai_assisted` 모드별 결과 해석 | 필수 |
| 세션 | 난이도 | `difficulty` | 게임 시작 시/결과 생성 시 | 사용자 선택 또는 config | 난이도별 수행 결과 비교 | 필수 |
| 세션 | 실행 설정 스냅샷 | `config_snapshot` | 결과 생성 시 | 실제 적용된 runtime config와 JS 계산값 | 실행 조건 재현 및 디버깅 | 필수 |
| 세션 | 실행 상태 | `status` | 종료 시 | 게임 내부 계산 | 완료, 중단, 오류 구분 | 필수, `completed`, `abandoned`, `error` |
| 세션 | 시작 시각 | `started_at` | 실제 플레이 시작 시 | `beginGame()` 내부 기록 | 실제 플레이 시작 시점 확인 | 필수 |
| 세션 | 종료 시각 | `ended_at` | 게임 종료 시 | `finishGame()` 내부 기록 | 실제 플레이 종료 시점 확인 | 필수 |
| 세션 | 전체 소요 시간 | `duration_ms` | 결과 생성 시 | `ended_at - started_at` 계산 | 참여 시간 및 이탈 여부 분석 | 필수 |
| 세션 | 총 문항 수 | `total_questions` | 결과 생성 시 | config 및 모드 확장 적용값 | 결과 해석 기준 | 필수 |
| 세션 | 정답 문항 수 | `correct_count` | 결과 생성 시 | 문항별 결과 합산 | 수행 결과 요약 | 필수 |
| 세션 | 오답 문항 수 | `wrong_count` | 결과 생성 시 | 문항별 결과 합산 | 어려움 정도 참고 | 필수 |
| 세션 | 힌트 사용 횟수 | `hint_count` | 결과 생성 시 | 힌트 이벤트 합산 | 도움 필요 정도 확인 | 필수 |
| 세션 | 오답 선택/재시도 횟수 | `retry_count` | 오답 물건 선택 시 누적 | `state.retryCount` | 잘못 고른 물건 수, 재도전 흐름 확인 | 필수 |
| 세션 | 평균 반응 시간 | `avg_response_time_ms` | 결과 생성 시 | 문항별 `response_time_ms` 평균 | 응답 지연 및 난이도 참고 | 필수 |
| 세션 | 문항별 결과 로그 | `question_logs` | 결과 생성 시 | 문항 로그 배열 | 문항 단위 수행 결과 확인 | 필수, `result_log_level: summary`이면 빈 배열 |
| 세션 | 완료율 | `completion_rate` | 결과 생성 시 | 완료 문항 수 / 전체 문항 수 | 중도 종료 또는 일부 수행 여부 확인 | 필수 |
| 세션 | 일시정지 횟수 | `pause_count` | 일시정지 시 누적 | 일시정지 이벤트 | 피로, 중단 흐름, 백그라운드 이동 참고 | 권장 |
| 세션 | 총 상호작용 수 | `interaction_count` | 물건 선택 시 누적 | 정답/오답 물건 선택 이벤트 | 행동량 및 참여도 분석 | 권장, 현재 힌트/일시정지는 포함하지 않음 |
| 세션 | 중도 종료 시점 | `abandoned_at` | 중도 종료 시 | 종료 시각 사용 | 어느 시점에 이탈했는지 확인 | 권장 |
| 세션 | 중도 종료 사유 | `abandon_reason` | 중도 종료 시 | 게임 내부 이벤트 | 사용자 종료, 시간 만료 등 구분 | 권장, 예: `user_exit`, `time_up` |

## 7. 설정 스냅샷 수집 항목

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 설정 | 타이머 표시 여부 | `config_snapshot.show_timer` | 결과 생성 시 | UI config | 화면 조건 재현 | 필수 |
| 설정 | 점수 표시 여부 | `config_snapshot.show_score` | 결과 생성 시 | UI config | 케어/AI 모드 결과 해석 | 필수 |
| 설정 | 진행도 표시 여부 | `config_snapshot.show_progress` | 결과 생성 시 | UI config | 화면 조건 재현 | 권장 |
| 설정 | 난이도 선택 표시 여부 | `config_snapshot.show_difficulty_select` | 결과 생성 시 | UI config 및 모드 | 사용자 선택 가능 여부 확인 | 권장 |
| 설정 | 설정 버튼 표시 여부 | `config_snapshot.show_settings` | 결과 생성 시 | UI config | 입력 방식/사운드 변경 가능 여부 확인 | 권장 |
| 설정 | 진행 방법 표시 여부 | `config_snapshot.show_how_to_play` | 결과 생성 시 | UI config | 튜토리얼 노출 여부 확인 | 권장 |
| 설정 | 사전 컨디션 체크 표시 여부 | `config_snapshot.show_condition_check` | 결과 생성 시 | UI config | 컨디션 UI 노출 여부 확인 | 권장, 현재 컨디션 응답값은 결과 JSON 미포함 |
| 설정 | 종료 후 체크 표시 여부 | `config_snapshot.show_finish_check` | 결과 생성 시 | UI config | 종료 후 설문 UI 노출 여부 확인 | 권장, 현재 응답값은 결과 JSON 미포함 |
| 설정 | 문항 수 | `config_snapshot.question_count` | 결과 생성 시 | 모드 확장 후 값 | 실행 조건 재현 | 필수 |
| 설정 | 최대 선택지 수 | `config_snapshot.max_choice_count` | 결과 생성 시 | 난이도별 계산값 | 선택 난이도 확인 | 필수 |
| 설정 | 최대 기억 물건 수 | `config_snapshot.max_items_to_remember` | 결과 생성 시 | 난이도별 계산값 | 기억 부담 정도 확인 | 필수 |
| 설정 | 기억 노출 시간 | `config_snapshot.reveal_ms` | 결과 생성 시 | 난이도별 계산값 | 기억 단계 노출 시간 확인 | 필수 |
| 설정 | 힌트 사용 가능 여부 | `config_snapshot.hint_enabled` | 결과 생성 시 | config | 도움 기능 조건 확인 | 필수 |
| 설정 | 자동 힌트 여부 | `config_snapshot.auto_hint_enabled` | 결과 생성 시 | config | 자동 도움 제공 여부 확인 | 필수 |
| 설정 | 부드러운 피드백 여부 | `config_snapshot.soft_feedback` | 결과 생성 시 | config 및 모드 기본값 | 케어형 문구/피드백 적용 여부 | 권장 |
| 설정 | 드래그 사용 여부 | `config_snapshot.use_drag` | 결과 생성 시 | config 및 사용자 설정 | 입력 방식 조건 확인 | 필수 |
| 설정 | 음성 안내 여부 | `config_snapshot.voice_guide_enabled` | 결과 생성 시 | config | 접근성/안내 조건 확인 | 권장 |
| 설정 | 결과 로그 수준 | `config_snapshot.result_log_level` | 결과 생성 시 | config | 상세 로그 포함 여부 확인 | 필수 |

## 8. 문항별 결과 데이터 수집 항목

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 문항별 결과 | 문항 ID | `question_id` | 문항 완료 시 | `q1`, `q2` 형식 생성 | 문항 단위 결과 식별 | 필수 |
| 문항별 결과 | 문항 유형 | `question_type` | 문항 완료 시 | 고정값 | 장바구니 기억 게임 문항 구분 | 필수, `shopping_cart_memory` |
| 문항별 결과 | 인지 활동 영역 | `cognitive_domain` | 문항 완료 시 | 고정값 | 기억 활동 영역 분류 | 필수, `memory_activity` |
| 문항별 결과 | 문항 난이도 | `difficulty` | 문항 완료 시 | 현재 난이도 | 난이도별 문항 분석 | 필수 |
| 문항별 결과 | 제시 방식 | `prompt_type` | 문항 완료 시 | 고정값 | 이미지 제시 방식 구분 | 필수, `image` |
| 문항별 결과 | 정답 물건 목록 | `correct_answer` | 문항 완료 시 | 기억 단계 목표 물건 ID 배열 | 정답 판정 기준 | 필수 |
| 문항별 결과 | 사용자 선택 물건 목록 | `selected_items` | 문항 완료 시 | 선택한 정답 물건 + 오답 물건 ID 배열 | 사용자가 고른 물건 확인 | 필수 |
| 문항별 결과 | 목표 물건 목록 | `target_items` | 문항 완료 시 | 기억 단계 목표 물건 ID 배열 | 기억해야 했던 물건 확인 | 필수 |
| 문항별 결과 | 목표 물건 수 | `target_count` | 문항 완료 시 | `target_items.length` | 기억 부담 정도 확인 | 필수 |
| 문항별 결과 | 제시된 선택지 수 | `items_shown` | 문항 완료 시 | `choiceItems.length` | 선택 난이도 확인 | 필수 |
| 문항별 결과 | 정답 여부 | `is_correct` | 문항 완료 시 | 게임 내부 계산 | 문항별 성공 여부 확인 | 필수 |
| 문항별 결과 | 시도 횟수 | `attempt_count` | 문항 완료 시 | `selected_items.length` | 재시도 여부 및 어려움 정도 확인 | 필수 |
| 문항별 결과 | 힌트 사용 여부 | `hint_used` | 문항 완료 시 | 힌트 이벤트 여부 | 도움 필요 여부 확인 | 필수 |
| 문항별 결과 | 힌트 단계/횟수 | `hint_count` | 문항 완료 시 | 문항별 힌트 레벨 | 도움 필요 정도 확인 | 필수, 현재 0~2 |
| 문항별 결과 | 다시 보기 횟수 | `replay_count` | 문항 완료 시 | 현재 고정값 | 향후 다시 보기 기능 확장 대비 | 현재 항상 `0` |
| 문항별 결과 | 최종 반응 시간 | `response_time_ms` | 문항 완료 시 | 질문 화면 표시 후 완료까지 계산 | 문항 해결 시간 분석 | 필수 |
| 문항별 결과 | 첫 반응 시간 | `first_response_time_ms` | 첫 물건 선택 시 | 질문 화면 표시 후 첫 선택까지 계산 | 문제 이해 및 초기 반응 속도 참고 | 권장 |
| 문항별 결과 | 오답 선택 횟수 | `wrong_tap_count` | 문항 완료 시 | 오답 물건 선택 수 | 헷갈린 정도 확인 | 필수 |
| 문항별 결과 | 누락 물건 수 | `missed_item_count` | 문항 완료 시 | 목표 물건 중 미선택 수 | 기억 실패/중도 종료성 오답 분석 | 필수 |
| 문항별 결과 | 터치 실패 횟수 | `touch_miss_count` | 문항 완료 시 | 선택 카드 내부 유효 터치 영역 밖 클릭 누적 | 버튼 크기 및 터치 영역 개선 참고 | 권장 |
| 문항별 결과 | 입력 방식 | `input_type` | 문항 완료 시 | 사용자 입력 이벤트 | `touch`, `drag`, `external` 구분 | 필수 |

## 9. 과정 데이터 수집 항목

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 과정 데이터 | 첫 반응 시간 | `question_logs[].first_response_time_ms` | 문항에서 첫 선택 발생 시 | 게임 내부 시간 계산 | 초기 반응 속도 분석 | 권장 |
| 과정 데이터 | 최종 반응 시간 | `question_logs[].response_time_ms` | 문항 완료 시 | 게임 내부 시간 계산 | 난이도 조정 및 수행 흐름 분석 | 필수 |
| 과정 데이터 | 오답 선택 횟수 | `question_logs[].wrong_tap_count` | 오답 물건 선택 시 | 선택 이벤트 누적 | 헷갈린 선택지 확인 | 필수 |
| 과정 데이터 | 터치 실패 횟수 | `question_logs[].touch_miss_count`, `result_detail_json.total_touch_miss_count` | 선택 카드 터치 실패 시 | 터치 이벤트 누적 | UI 터치 영역 개선 | 권장 |
| 과정 데이터 | 힌트 사용 여부/횟수 | `question_logs[].hint_used`, `question_logs[].hint_count`, `hint_count` | 힌트 사용 시 | 힌트 이벤트 누적 | 도움 필요 정도 확인 | 필수 |
| 과정 데이터 | 다시 보기 횟수 | `question_logs[].replay_count` | 문항 완료 시 | 현재 고정값 | 기억 단계 재확인 필요 여부 | 현재 항상 `0` |
| 과정 데이터 | 전체 일시정지 횟수 | `pause_count` | 일시정지 시 | 일시정지 이벤트 누적 | 피로도 및 플레이 흐름 참고 | 권장 |
| 과정 데이터 | 중도 종료 시점 | `abandoned_at` | 중도 종료 시 | 게임 내부 기록 | 어느 단계에서 이탈했는지 확인 | 권장 |
| 과정 데이터 | 중도 종료 사유 | `abandon_reason` | 중도 종료 시 | 게임 내부 또는 타이머 이벤트 | 사용자 종료, 시간 만료 구분 | 권장 |
| 과정 데이터 | 총 상호작용 수 | `interaction_count` | 물건 선택 시 | 선택 이벤트 합산 | 참여도 및 행동량 분석 | 권장 |
| 과정 데이터 | 외부 입력 사용 여부 | `result_detail_json.external_input_used` | 외부 입력 사용 시 | 앱/AI 입력 인터페이스 | AI 연동 모드 입력 사용 여부 확인 | AI 연동 모드 |

## 10. 오류 데이터 수집 항목

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 오류 데이터 | 오류 코드 | `error_code` | 오류 발생 시 | 게임 내부 오류 처리 | 오류 원인 추적 | `GAME_ERROR` 이벤트 payload에 포함 |
| 오류 데이터 | 오류 메시지 | `error_message` | 오류 발생 시 | 게임 내부 오류 처리 | 내부 디버깅 | 사용자 노출 문구와 별도 |
| 오류 데이터 | 실행 상태 | `status` | 오류 발생 또는 종료 시 | 게임 내부 계산 | `completed`, `abandoned`, `error` 구분 | 필수 |
| 오류 데이터 | 게임 ID | `game_id` | 오류 발생 시 | 고정값 | 어떤 게임에서 오류가 났는지 식별 | `GAME_ERROR` 이벤트 전용 |
| 오류 데이터 | 오류 발생 시각 | `occurred_at` | 오류 발생 시 | 게임 내부 기록 | 오류 타임라인 추적 | `GAME_ERROR` 이벤트 전용 |
| 오류 데이터 | 오류 발생 단계 | `error_phase` | 오류 발생 시 | 미수집 | 시작/기억/답변/결과 반환 단계 확인 | 향후 권장 |
| 오류 데이터 | 결과 반환 실패 여부 | `complete_send_failed` | 앱 결과 전달 실패 시 | 미수집 | 앱 연동 오류 추적 | 향후 권장 |

## 11. 게임별 상세값 수집 항목

게임별 상세값은 `shop-quest-memory-game`에서만 의미 있는 특수 데이터이다. 공통 결과 필드를 계속 늘리지 않고 `result_detail_json` 내부에 저장한다.

| 구분 | 수집 항목 | 코드 필드명 | 수집 시점 | 수집 방법/출처 | 수집 목적 | 비고 |
|---|---|---|---|---|---|---|
| 게임별 상세값 | 최대 선택지 수 | `result_detail_json.max_choice_count` | 결과 생성 시 | 난이도별 계산값 | 선택 난이도 확인 | 장바구니 기억 전용 |
| 게임별 상세값 | 최대 기억 물건 수 | `result_detail_json.max_items_to_remember` | 결과 생성 시 | 난이도별 계산값 | 기억 부담 정도 확인 | 장바구니 기억 전용 |
| 게임별 상세값 | 자동 힌트 사용 여부 | `result_detail_json.auto_hint_enabled` | 결과 생성 시 | config | 도움 제공 방식 확인 | 케어/AI 모드에서 주로 true |
| 게임별 상세값 | 기억 노출 시간 | `result_detail_json.reveal_ms` | 결과 생성 시 | 난이도별 계산값 | 기억 단계 노출 시간 확인 | 장바구니 기억 전용 |
| 게임별 상세값 | 난이도 자동 완화 여부 | `result_detail_json.difficulty_downshifted` | 결과 생성 시 | 현재 고정값 | 난이도 조정 이력 확인 | 현재 항상 `false`, 향후 확장 |
| 게임별 상세값 | 총 터치 실패 횟수 | `result_detail_json.total_touch_miss_count` | 결과 생성 시 | 터치 이벤트 누적 | 버튼 크기 및 터치 영역 개선 참고 | 권장 |
| 게임별 상세값 | 외부 입력 사용 여부 | `result_detail_json.external_input_used` | 결과 생성 시 | 외부 입력 이벤트 | 앱/AI 입력 사용 여부 확인 | AI 연동 모드 |
| 게임별 상세값 | 드래그 사용 여부 | `result_detail_json.use_drag` | 결과 생성 시 | 설정 및 사용자 선택 | 입력 방식 조건 확인 | standard에서 사용 가능 |
| 게임별 상세값 | 총 누락 물건 수 | `result_detail_json.total_missed_item_count` | 결과 생성 시 | 문항별 누락 수 합산 | 기억 실패 패턴 확인 | 장바구니 기억 전용 |
| 게임별 상세값 | 오답 문항 수 | `result_detail_json.wrong_count` | 결과 생성 시 | 문항별 결과 합산 | 실패 문항 수 확인 | 세션 `wrong_count`와 동일 |
| 게임별 상세값 | 추가/오답 선택 수 | `result_detail_json.extra_selected_count` | 결과 생성 시 | `retry_count` | 잘못 고른 물건 수 확인 | 장바구니 기억 전용 |

## 12. 모드별 수집 차이

| 수집 항목 | standard | reminder | care | ai_assisted | 비고 |
|---|---|---|---|---|---|
| 세션 데이터 | 수집 | 수집 | 수집 | 수집 | 모든 모드 공통 |
| 문항별 결과 데이터 | 수집 | 수집 | 수집 | 수집 | 모든 모드 공통 |
| 과정 데이터 | 수집 | 수집 | 수집 | 수집 | 가능한 항목 중심 |
| 반응 시간 | 수집 | 수집 | 수집 | 수집 | 케어/AI 모드는 시간 압박을 화면에 노출하지 않음 |
| 점수 표시 | 표시 | 표시 | 미표시 | 미표시 | 결과 데이터의 정답/오답 수는 계속 수집 |
| 타이머 표시 | 표시 | 표시 | 미표시 | 미표시 | 내부 제한 시간은 config 기준으로 동작 가능 |
| 난이도 선택 | 사용자 선택 | config/앱 지정 | config/기관 지정 | config/앱/AI 지정 | `standard`만 난이도 선택 화면 노출 |
| 컨디션 체크 UI | 표시 가능 | 미표시 | 미표시 | 미표시 | 현재 결과 JSON에는 컨디션 응답값 미포함 |
| 종료 후 체크 UI | 표시 가능 | 미표시 | 미표시 | 미표시 | 현재 결과 JSON에는 종료 후 응답값 미포함 |
| 힌트 사용 | 수집 | 수집 | 수집 | 수집 | 도움 필요 정도 분석 |
| 자동 힌트 | 기본 미사용 | 기본 미사용 | 사용 | 사용 | config 기준, 자동 힌트 지연은 현재 10초 |
| 드래그 입력 | 사용 가능 | 현재 config상 미사용 | 미사용 | 미사용 | `input_type: drag`는 standard에서 가능 |
| 외부 입력값 | 미사용 | 미사용 | 미사용 | 수집 가능 | 앱/AI가 선택값 전달 시 `input_type: external` |
| 오류 데이터 | 수집 | 수집 | 수집 | 수집 | 모든 모드 공통 |
| 게임별 상세값 | 수집 | 수집 | 수집 | 수집 | `result_detail_json`으로 관리 |

## 13. 현재 config 기준 실행 조건 요약

| 모드/난이도 | 문항 수 | 제한 시간 | 최대 선택지 수 | 최대 기억 물건 수 | 타이머/점수 | 힌트 | 자동 힌트 | 드래그 | 비고 |
|---|---:|---:|---:|---:|---|---|---|---|---|
| `standard` | 10 | 120초 | 실행 config에 따름 | 실행 config에 따름 | 표시 | 사용 | 미사용 | 사용 가능 | 로컬 config는 10/6, 상위 config는 4/3으로 확인됨 |
| `reminder.easy` | 10 | 120초 | 6 | 3 | 표시 | 사용 | 미사용 | 미사용 | 난이도 선택 화면 숨김 |
| `reminder.normal` | 10 | 120초 | 8 | 4 | 표시 | 사용 | 미사용 | 미사용 | 난이도 선택 화면 숨김 |
| `reminder.hard` | 10 | 120초 | 10 | 6 | 표시 | 사용 | 미사용 | 미사용 | 난이도 선택 화면 숨김 |
| `care.easy` | 5 | 90초 | 2 | 1 | 미표시 | 사용 | 사용 | 미사용 | 부드러운 피드백 사용 |
| `care.normal` | 5 | 90초 | 4 | 2 | 미표시 | 사용 | 사용 | 미사용 | 부드러운 피드백 사용 |
| `care.hard` | 5 | 90초 | 6 | 4 | 미표시 | 사용 | 사용 | 미사용 | 5번째 문항에서 기억 물건 수 증가 가능 |
| `ai_assisted.easy` | 5 | 90초 | 2 | 1 | 미표시 | 사용 | 사용 | 미사용 | 외부 입력 API 사용 가능 |
| `ai_assisted.normal` | 5 | 90초 | config 및 JS 계산값 | config 및 JS 계산값 | 미표시 | 사용 | 사용 | 미사용 | 실제 결과는 `config_snapshot` 기준으로 해석 |
| `ai_assisted.hard` | 5 | 90초 | config 및 JS 계산값 | config 및 JS 계산값 | 미표시 | 사용 | 사용 | 미사용 | 실제 결과는 `config_snapshot` 기준으로 해석 |

## 14. 수집 제외 또는 현재 결과 JSON 미포함 항목

| 항목 | 제외/미포함 이유 | 처리 방향 |
|---|---|---|
| `user_id` | 사용자 식별값은 앱/서버가 보유 | 앱/서버에서 `session_id`와 결합 |
| `senior_id` | 시니어 사용자 식별값은 앱/서버가 보유 | 앱/서버에서 결합 |
| `guardian_id` | 보호자 정보는 앱/서버에서 관리 | 앱/서버에서 결합 |
| `assignment_id` | 과제 또는 배정 정보는 앱/서버에서 관리 | 앱/서버에서 결합 |
| `alarm_id` | 알림 정보는 앱/서버에서 관리 | 앱/서버에서 결합 |
| 의료적 진단 결과 | 본 게임 결과는 인지 저하 판정 목적이 아님 | 저장하지 않음 |
| 음성 원본 데이터 | 게임은 마이크 권한 요청, 음성 녹음, STT 처리를 직접 수행하지 않음 | 앱/AI 영역에서 별도 관리 |
| AI 판단 결과 | 게임 자체는 AI 판단을 수행하지 않음 | 앱/AI가 전달한 선택값만 입력으로 처리 |
| 사전 컨디션 응답값 | UI state에는 있으나 현재 `GAME_COMPLETED` 결과 JSON에 포함되지 않음 | 필요 시 `condition_json` 등으로 향후 추가 |
| 종료 후 체크 응답값 | UI state에는 있으나 현재 `GAME_COMPLETED` 결과 JSON에 포함되지 않음 | 필요 시 `post_condition_json` 등으로 향후 추가 |
| 힌트 클릭 시각 | 힌트 사용 여부/횟수만 있고 클릭 경과 시간은 미수집 | 필요 시 `hint_click_time_ms` 추가 |
| 일시정지 구간 상세 | 전체 `pause_count`만 수집 | 필요 시 `pause_logs` 추가 |
| 결과 반환 실패 여부 | `postMessage` 성공/실패를 별도 추적하지 않음 | 필요 시 `complete_send_failed` 추가 |

## 15. 결과 로그 반환 구조 예시

```json
{
  "session_id": "shop-session-3001",
  "content_id": "cognitive_shopping_cart_001",
  "game_key": "shopping_cart_memory",
  "mode": "care",
  "difficulty": "easy",
  "config_snapshot": {
    "show_timer": false,
    "show_score": false,
    "show_progress": false,
    "show_difficulty_select": false,
    "show_settings": true,
    "show_how_to_play": false,
    "show_condition_check": false,
    "show_finish_check": false,
    "question_count": 5,
    "max_choice_count": 2,
    "max_items_to_remember": 1,
    "reveal_ms": 5000,
    "hint_enabled": true,
    "auto_hint_enabled": true,
    "soft_feedback": true,
    "use_drag": false,
    "voice_guide_enabled": true,
    "result_log_level": "detailed"
  },
  "status": "completed",
  "started_at": "2026-06-11T10:00:00.000Z",
  "ended_at": "2026-06-11T10:02:12.000Z",
  "duration_ms": 132000,
  "total_questions": 5,
  "correct_count": 4,
  "wrong_count": 1,
  "hint_count": 1,
  "retry_count": 1,
  "pause_count": 0,
  "interaction_count": 6,
  "avg_response_time_ms": 7100,
  "completion_rate": 1,
  "abandoned_at": null,
  "abandon_reason": null,
  "error_code": null,
  "error_message": null,
  "question_logs": [
    {
      "question_id": "q1",
      "question_type": "shopping_cart_memory",
      "cognitive_domain": "memory_activity",
      "difficulty": "easy",
      "prompt_type": "image",
      "correct_answer": ["apple"],
      "selected_items": ["apple"],
      "target_items": ["apple"],
      "target_count": 1,
      "items_shown": 2,
      "is_correct": true,
      "attempt_count": 1,
      "hint_used": false,
      "hint_count": 0,
      "replay_count": 0,
      "response_time_ms": 5200,
      "first_response_time_ms": 3600,
      "wrong_tap_count": 0,
      "missed_item_count": 0,
      "touch_miss_count": 0,
      "input_type": "touch"
    }
  ],
  "result_detail_json": {
    "max_choice_count": 2,
    "max_items_to_remember": 1,
    "auto_hint_enabled": true,
    "reveal_ms": 5000,
    "difficulty_downshifted": false,
    "total_touch_miss_count": 0,
    "external_input_used": false,
    "use_drag": false,
    "total_missed_item_count": 1,
    "wrong_count": 1,
    "extra_selected_count": 1
  }
}
```

## 16. 개발 확인 메모

| 항목 | 현재 코드 기준 판단 |
|---|---|
| 원 PDF의 `counting_fruits` 구조 | 현재 게임에는 맞지 않음. `shopping_cart_memory`로 변경 필요 |
| 원 PDF의 `selected_answer` | 현재 코드는 단일 답이 아니라 복수 물건 배열인 `selected_items` 사용 |
| 원 PDF의 `target_item` | 현재 코드는 복수 목표 물건이 가능하므로 `target_items` 사용 |
| 원 PDF의 `choice_count` | 현재 결과 상세값은 `max_choice_count`로 반환 |
| 원 PDF의 `items_shown` | 현재 문항별 `items_shown`은 선택지 총 개수 의미 |
| 컨디션/종료 후 체크 | 화면 state는 있으나 결과 JSON에 미포함. 실제 수집 항목으로 보려면 코드 추가 필요 |
| `interaction_count` | 현재는 물건 선택 이벤트만 카운트. 힌트/일시정지/설정 변경은 포함하지 않음 |
| 오류 상세 | `GAME_ERROR` 이벤트는 있으나 `error_phase`, `complete_send_failed`는 아직 없음 |
