# 배포 및 운영 문서

이 서버는 Node.js 내장 `node:sqlite` 모듈을 사용하는 경량 API 서버입니다.

## 선행 조건

- Node.js 24 이상
- SQLite DB와 JSON 백업을 저장할 쓰기 가능한 데이터 폴더
- 앱 또는 테스트 기기에서 API 서버로 접근 가능한 네트워크

## 로컬 실행

```powershell
cd C:\Users\tpwls\Desktop\senior-care-game-hub\result-collection-server
copy .env.example .env
node server.js
```

DB만 먼저 생성하거나 스키마를 검증하려면 아래 명령을 실행합니다.

```powershell
npm run db:init
```

상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

## 환경변수

| 이름 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `PORT` | N | `8787` | HTTP 포트 |
| `DATA_DIR` | N | `./data` | 데이터 저장 폴더 |
| `DB_PATH` | N | `./data/game-results.sqlite` | SQLite DB 경로 |
| `CORS_ORIGIN` | N | `*` | 허용 브라우저 Origin |
| `API_TOKEN` | 운영: Y | 빈 값 | API 호출 bearer token |
| `MAX_BODY_BYTES` | N | `1048576` | 요청 body 크기 제한 |

운영 또는 공동 테스트 환경에서는 `API_TOKEN`을 설정하고 `CORS_ORIGIN`을 제한하는 것을 권장합니다.

## 로그 및 저장 위치

| 파일 | 목적 |
| --- | --- |
| `data/game-results.sqlite` | 메인 SQLite DB |
| `data/events.jsonl` | 저장/중복 요청 이벤트 로그 |
| `data/sessions/<session_id>.json` | 수신 요청 메타 JSON 백업 |

## 장애 확인 순서

1. `/health` 응답 확인
2. 서버 프로세스 실행 여부 확인
3. `data/events.jsonl`에서 최근 저장 또는 중복 이벤트 확인
4. DB 파일 존재 및 쓰기 권한 확인
5. 복구 후 `npm run test:samples` 실행

## 배포 메모

현재 구현은 로컬 연동 및 경량 파일럿 검증에 적합합니다. 서버 시작 시 `schema.sql`을 적용하고 기존 DB에 누락된 확장 컬럼을 추가합니다. 운영 배포 시에는 프로세스 관리, TLS, 구조화 로그, DB 백업 정책, 토큰 교체 정책, 별도 마이그레이션 버전 관리가 추가로 필요합니다.
