# 조회 및 리포트 정책

## 조회 API

```http
GET /api/v1/game-results
```

지원 query parameter:

| 파라미터 | 예시 | 설명 |
| --- | --- | --- |
| `senior_id` | `senior_001` | 시니어별 조회 |
| `tenant_id` | `tenant_001` | 테넌트별 조회 |
| `facility_id` | `facility_001` | 시설/기관별 조회 |
| `program_id` | `program_001` | 프로그램/캠페인별 조회 |
| `reward_id` | `reward_001` | 보상/리워드별 조회 |
| `recommendation_id` | `rec_001` | AI 추천 결과별 조회 |
| `guardian_id` | `guardian_001` | 보호자 발송/리포트 연결 기준 조회 |
| `content_id` | `cognitive_count_fruit_001` | 콘텐츠별 조회 |
| `game_key` | `counting_fruits` | 게임 유형별 조회 |
| `game_version` | `1.0.0` | 게임 버전별 조회 |
| `play_source` | `history_replay` | 실행 출처별 조회 |
| `status` | `completed` | 저장 상태별 조회 |
| `mode` | `care` | 실행 모드별 조회 |
| `difficulty` | `easy` | 난이도별 조회 |
| `assignment_id` | `assign_001` | 할당 단위 조회 |
| `alarm_id` | `alarm_001` | 알림 단위 조회 |
| `schedule_id` | `schedule_001` | 예약/반복 알림 단위 조회 |
| `date_from` / `started_from` | `2026-06-01T00:00:00+09:00` | 시작 시각 이후 결과 |
| `date_to` / `started_to` | `2026-06-30T23:59:59+09:00` | 시작 시각 이전 결과 |
| `limit` | `50` | 1~500, 기본 200 |

예시:

```powershell
Invoke-RestMethod "http://127.0.0.1:8787/api/v1/game-results?senior_id=senior_001&game_key=counting_fruits&date_from=2026-06-01T00:00:00+09:00"
```

## 히스토리 재실행 리포트 정책

- 히스토리 재실행은 새 결과 레코드로 저장합니다.
- 앱은 새 `session_id`를 발급해야 합니다.
- `play_source`는 `history_replay`로 저장합니다.
- 최근 활동 이력에는 포함할 수 있지만, 보호자 알림 수행률 계산은 기본적으로 `play_source=reminder`만 포함하는 것을 권장합니다.
- 추이 리포트에서는 `history_replay` 포함/제외 필터를 제공하는 것을 권장합니다.
