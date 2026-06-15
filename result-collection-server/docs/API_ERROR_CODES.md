# API 오류 코드표

결과 수집 API의 오류 응답은 아래 형식을 사용합니다.

```json
{
  "error_code": "MISSING_REQUIRED_FIELD",
  "message": "required field is missing",
  "details": {
    "field": "senior_id"
  }
}
```

| HTTP | error_code | 발생 조건 | 앱 처리 기준 |
| --- | --- | --- | --- |
| 400 | `INVALID_REQUEST` | JSON 파싱 실패, 날짜 형식 오류, 요청 구조 오류 | 앱의 요청 생성 로직 확인 |
| 400 | `MISSING_REQUIRED_FIELD` | 필수 root 필드 누락 | `details.field`에 표시된 필드를 추가 후 재전송 |
| 400 | `INVALID_ENUM_VALUE` | `play_source`, `status` 등이 허용값이 아님 | 앱 config 또는 게임 버전 확인 |
| 401 | `UNAUTHORIZED` | `API_TOKEN` 설정 상태에서 토큰 누락 또는 불일치 | 인증 토큰 확인 후 재시도 |
| 404 | `NOT_FOUND` | endpoint 또는 session 결과 없음 | endpoint 경로 또는 `session_id` 확인 |
| 413 | `REQUEST_BODY_TOO_LARGE` | 요청 body가 `MAX_BODY_BYTES` 초과 | payload 축소 또는 서버 제한값 조정 |
| 422 | `INVALID_DURATION` | `duration_ms`가 음수 | 플레이 시간 계산 로직 확인 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 또는 DB 예외 | 서버 로그 확인 후 복구/재시도 |

중복 저장 요청은 오류가 아니라 멱등 성공 응답으로 처리합니다.

```json
{
  "result_id": "existing-result-id",
  "session_id": "same-session-id",
  "status": "duplicate_ignored",
  "saved_at": "2026-06-15 06:16:32"
}
```
