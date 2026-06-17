# 결과서버 운영·배포 문서

ClickUp 공통 문서 등록 제목: `OPS-CMN-003_결과서버 운영·배포 문서_v0.1`

이 문서는 공통 결과 수집 서버(`result-collection-server`)의 운영·배포 산출물입니다. React Native 앱이 WebView 게임에서 받은 결과 payload를 `POST /api/v1/game-results`로 전달하면, 서버는 공통 결과 컬럼과 게임별 JSON을 분리해 SQLite에 저장합니다.

## 산출물 커버리지

| 산출물 ID | 항목 | 본 문서 위치 | 상태 |
| --- | --- | --- | --- |
| `DELIV-SERVER-005` | 환경변수 목록 | 환경변수 목록 | 포함 |
| `DELIV-SERVER-006` | 로컬 실행 방법 | 로컬 실행 방법 | 포함 |
| `DELIV-SERVER-007` | 배포/운영 문서 | 배포 절차, 운영 점검, 장애 대응 | 포함 |
| `DELIV-SERVER-008` | 서버 저장 테스트 결과 | 서버 저장 테스트 결과 | 포함 |
| `DELIV-SERVER-010` | 내부 이식용 서버 구조 설명 | 내부 이식용 서버 구조 | 포함 |
| `DELIV-SERVER-013` | 확장/변경 가이드 | 확장/변경 가이드 | 포함 |

## 서버 개요

| 항목 | 내용 |
| --- | --- |
| 런타임 | Node.js 24 이상 |
| HTTP 서버 | Node.js 내장 `http` |
| 저장소 | Node.js 내장 `node:sqlite` 기반 SQLite |
| 기본 포트 | `8787` |
| 주요 endpoint | `GET /health`, `POST /api/v1/game-results`, `GET /api/v1/game-results`, `GET /api/v1/game-results/:session_id` |
| 호환 endpoint | `POST /api/game-results`, `GET /api/game-results`, `GET /api/game-results/:session_id` |
| 인증 | `API_TOKEN` 설정 시 `Authorization: Bearer <token>` |
| 중복 방지 | 동일 `session_id` 또는 동일 `assignment_id + session_id` 중복 저장 방지 |

## DELIV-SERVER-005 환경변수 목록

서버는 시작 시 `result-collection-server/.env`를 읽고, 이미 OS 환경변수로 지정된 값은 덮어쓰지 않습니다.

| 이름 | 필수 여부 | 기본값 | 운영 권장값 | 설명 |
| --- | --- | --- | --- | --- |
| `PORT` | 선택 | `8787` | 배포 환경에서 할당된 내부 포트 | HTTP 서버 listen 포트 |
| `DATA_DIR` | 선택 | `./data` | 영속 디스크 또는 볼륨 경로 | SQLite DB, JSON 백업, 이벤트 로그 저장 폴더 |
| `DB_PATH` | 선택 | `${DATA_DIR}/game-results.sqlite` | 명시 경로 권장 | SQLite DB 파일 경로. 지정하면 `DATA_DIR` 하위 기본값보다 우선 |
| `CORS_ORIGIN` | 선택 | `*` | 앱/관리 도메인 origin으로 제한 | 브라우저 CORS 허용 origin |
| `API_TOKEN` | 로컬 선택, 운영 필수 | 빈 값 | 배포 환경 secret | 설정 시 모든 API 요청에 bearer token 필요 |
| `MAX_BODY_BYTES` | 선택 | `1048576` | 게임 payload 크기에 맞춰 조정 | 요청 body 최대 byte 크기 |

운영 환경에서는 `API_TOKEN`을 반드시 설정하고, `CORS_ORIGIN=*`는 내부 테스트 용도에만 사용합니다. `DATA_DIR` 또는 `DB_PATH`는 서버 재시작 후에도 보존되는 디스크를 가리켜야 합니다.

예시 `.env`:

```dotenv
PORT=8787
DATA_DIR=./data
DB_PATH=./data/game-results.sqlite
CORS_ORIGIN=https://app.example.com
API_TOKEN=change-me
MAX_BODY_BYTES=1048576
```

## DELIV-SERVER-006 로컬 실행 방법

선행 조건:

- Node.js `v24.15.0` 이상 또는 `node:sqlite`를 지원하는 Node.js 24 이상
- `result-collection-server/data` 폴더를 생성할 수 있는 파일 쓰기 권한
- 앱 또는 테스트 도구에서 `http://127.0.0.1:8787` 접근 가능

실행:

```powershell
cd C:\Users\tpwls\Desktop\senior-care-game-hub\result-collection-server
copy .env.example .env
npm run db:init
npm start
```

상태 확인:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

정상 응답:

```json
{
  "ok": true,
  "service": "senior-care-result-api",
  "storage": "sqlite",
  "db_path": "C:\\...\\result-collection-server\\data\\game-results.sqlite"
}
```

샘플 저장 테스트:

```powershell
npm run test:samples
```

`API_TOKEN`을 설정한 로컬 서버를 검증할 때는 같은 token을 테스트 환경변수에도 지정합니다.

```powershell
$env:API_TOKEN="local-test-token"
npm start
```

다른 터미널:

```powershell
$env:API_TOKEN="local-test-token"
npm run test:samples
```

## DELIV-SERVER-007 배포/운영 문서

### 배포 절차

1. Node.js 24 이상 런타임을 준비합니다.
2. `result-collection-server/` 폴더를 배포 대상 서버에 복사합니다.
3. 운영 secret 저장소 또는 서버 환경변수에 `PORT`, `DATA_DIR`, `DB_PATH`, `CORS_ORIGIN`, `API_TOKEN`, `MAX_BODY_BYTES`를 설정합니다.
4. `DATA_DIR`가 영속 볼륨에 연결되어 있고 서버 프로세스가 쓰기 가능한지 확인합니다.
5. `npm run db:init`으로 DB 파일과 스키마를 먼저 생성합니다.
6. 프로세스 매니저 또는 서비스 관리자에서 `npm start`를 실행합니다.
7. `GET /health`가 200을 반환하는지 확인합니다.
8. `npm run test:samples` 또는 운영 smoke payload로 저장/조회가 되는지 확인합니다.

현재 구현은 경량 파일럿과 내부 공통 결과 서버 검증에 맞춘 단일 프로세스 구조입니다. 외부 공개 운영 환경에서는 TLS termination, 접근 제어, secret rotation, 구조화 로그 수집, DB 백업 자동화, 마이그레이션 버전 관리를 배포 환경에서 보강해야 합니다.

### 운영 점검 항목

| 점검 항목 | 확인 방법 | 정상 기준 |
| --- | --- | --- |
| 서버 상태 | `GET /health` | `ok: true` |
| 저장 API | `POST /api/v1/game-results` | 신규 저장 시 `201`, `status: "saved"` |
| 중복 요청 | 같은 `session_id` 재전송 | `200`, `status: "duplicate_ignored"` |
| 조회 API | `GET /api/v1/game-results/:session_id` | 저장된 결과와 `question_logs` 반환 |
| DB 파일 | `DATA_DIR/game-results.sqlite` | 파일 존재, WAL 파일 생성 가능 |
| 이벤트 로그 | `DATA_DIR/events.jsonl` | 저장/중복 이벤트 append |
| JSON 백업 | `DATA_DIR/sessions/<session_id>.json` | 수신 payload 백업 생성 |

### 로그 및 저장 위치

| 파일 | 목적 | 운영 관리 |
| --- | --- | --- |
| `data/game-results.sqlite` | 메인 SQLite DB | 정기 백업 필요 |
| `data/game-results.sqlite-wal` | SQLite WAL | DB와 함께 백업/복구 관리 |
| `data/game-results.sqlite-shm` | SQLite shared memory | 런타임 파일 |
| `data/events.jsonl` | 저장/중복 요청 이벤트 로그 | 로그 수집 또는 rotation 필요 |
| `data/sessions/<session_id>.json` | 요청 원본/메타 백업 | 개인정보 정책에 맞춘 보관 기간 적용 |

### 장애 대응 순서

1. `/health` 응답과 `db_path`를 확인합니다.
2. 서버 프로세스가 실행 중인지 확인합니다.
3. `API_TOKEN` 설정 여부와 요청 `Authorization` 헤더를 확인합니다.
4. `DATA_DIR`와 `DB_PATH`의 쓰기 권한 및 디스크 용량을 확인합니다.
5. `events.jsonl`에서 최근 `duplicate` 또는 저장 이벤트를 확인합니다.
6. `GET /api/v1/game-results/:session_id`로 저장 여부를 확인합니다.
7. 복구 후 `npm run test:samples`를 실행해 completed/abandoned/error 저장을 재검증합니다.

## DELIV-SERVER-008 서버 저장 테스트 결과

테스트 일시: 2026-06-17  
테스트 방식: 임시 `DATA_DIR=tmp/result-ops-test-20260617b`, 임시 포트 `8802`에서 서버를 기동한 뒤 `scripts/smoke-test.js` 실행  
테스트 데이터: `samples/completed.json`, `samples/abandoned.json`, `samples/error.json`

실행 명령 요약:

```powershell
cd C:\Users\tpwls\Desktop\senior-care-game-hub
# 임시 DATA_DIR/PORT로 서버 기동 후 scripts/smoke-test.js 실행
```

실행 결과:

```text
completed.json: saved (sample-counting-fruits-completed)
abandoned.json: saved (sample-counting-fruits-abandoned)
error.json: saved (sample-counting-fruits-error)
```

DB 확인 결과:

```json
[
  { "status": "abandoned", "count": 1 },
  { "status": "completed", "count": 1 },
  { "status": "error", "count": 1 }
]
```

문항 로그 확인:

```json
{ "count": 1 }
```

판정:

| 검수 항목 | 결과 |
| --- | --- |
| `completed` 저장 | 통과 |
| `abandoned` 저장 | 통과 |
| `error` 저장 | 통과 |
| 저장 후 `GET /api/v1/game-results/:session_id` 조회 | 통과 |
| completed 샘플 문항 로그 저장 | 통과 |

## DELIV-SERVER-010 내부 이식용 서버 구조

| 파일 | 역할 | 이식 시 유지/변경 기준 |
| --- | --- | --- |
| `server.js` | HTTP routing, request validation, DB 저장, 조회, 오류 응답 | 내부 프레임워크로 옮길 때 controller/service/repository로 분리 가능 |
| `schema.sql` | `game_play_results`, `game_question_logs` 테이블 및 인덱스 | 운영 DBMS에 맞춰 타입과 제약식 변환 |
| `scripts/init-db.js` | SQLite DB 초기화 및 안전한 인덱스 생성 | 배포 파이프라인 migration 단계로 이식 |
| `scripts/smoke-test.js` | 샘플 payload 저장/조회 smoke test | CI 또는 배포 후 검증 스크립트로 유지 |
| `samples/*.json` | completed/abandoned/error 저장 샘플 | 앱 연동 계약 테스트 fixture로 유지 |
| `docs/*.md` | API 오류, 앱 연동, 조회/리포트, 운영 문서 | 내부 위키 또는 ClickUp 공통 문서로 등록 |
| `data/` | 로컬 DB, 이벤트 로그, session JSON 백업 | 운영에서는 영속 볼륨 또는 관리형 DB/스토리지로 대체 |

저장 계층 이식 기준:

- 공통 결과 필드는 `game_play_results` 정규화 컬럼으로 유지합니다.
- 게임별 상세값은 `game_result_json`, `result_detail_json`, `process_data_json`, `meta_json`에 보존합니다.
- 문항별 로그는 `game_question_logs`에 저장하고 원본 문항 로그는 `raw_log_json`에 보존합니다.
- `voice_context_json`은 `guardian_id`와 분리해서 저장합니다.
- 히스토리 재실행은 기존 결과를 덮어쓰지 않고 새 `session_id`로 별도 row를 저장합니다.

권장 내부 레이어 분리:

| 레이어 | 현재 위치 | 내부 이식 예시 |
| --- | --- | --- |
| API route | `handle()` | `GameResultController` |
| 인증 | `authorized()` | API gateway, middleware |
| 요청 파싱/검증 | `readBody()`, `normalizeResultRequest()`, `validateRow()` | DTO validator, schema validator |
| 저장 | `saveResult()` | `GameResultRepository` |
| 조회 | `listResults()`, `readResult()` | query service |
| 이벤트/백업 | `appendEvent()`, `writeJsonBackup()` | audit log, object storage |

## DELIV-SERVER-013 확장/변경 가이드

### 새 게임 추가

1. 앱/게임에서 공통 root 필드(`senior_id`, `content_id`, `game_key`, `game_version`, `session_id`, `play_source`, `status`, `started_at`, `ended_at`, `duration_ms`, `game_result`)를 유지합니다.
2. 공통 리포트에 필요한 값만 root 또는 공통 컬럼 후보로 올립니다.
3. 게임별 상세 결과는 `game_result`, `result_detail_json`, `process_data_json`에 보존합니다.
4. 문항 로그가 필요한 게임은 `question_logs`를 포함합니다.
5. `samples/<game>-completed.json` 같은 fixture를 추가하고 smoke test를 확장합니다.

### 필드 추가

| 변경 유형 | 처리 기준 |
| --- | --- |
| 리포트/검색에 자주 쓰는 공통 필드 | DB 컬럼 추가, 인덱스 검토, 요청 검증 추가 |
| 게임별 상세 필드 | JSON 컬럼에 저장, 즉시 컬럼화하지 않음 |
| 앱/운영 추적 필드 | `client_context_json` 또는 `meta_json` 우선 검토 |
| 음성 관련 필드 | `voice_context_json`에 추가, `guardian_id`와 혼합 금지 |
| 추천/보상/기관 확장 | 기존 `tenant_id`, `facility_id`, `program_id`, `reward_id`, `recommendation_id`, `meta_json` 활용 |

### enum 변경

`play_source`와 `status`는 DB CHECK 제약과 서버 검증이 함께 존재합니다.

- `play_source` 추가 시 `VALID_PLAY_SOURCES`, `schema.sql` CHECK, 관련 문서와 샘플을 함께 수정합니다.
- `status` 추가 시 `VALID_STATUSES`, `schema.sql` CHECK, 오류 코드/리포트 정책, 저장 테스트를 함께 수정합니다.
- 운영 DB에서는 CHECK 변경이 필요한 DBMS별 migration을 별도로 작성합니다.

### DB 변경

1. `schema.sql`에 신규 테이블/컬럼/인덱스를 반영합니다.
2. 기존 SQLite DB 호환이 필요하면 `server.js`의 `runMigrations()` 또는 별도 migration에 보강합니다.
3. `scripts/init-db.js`에도 같은 스키마 초기화 정책을 반영합니다.
4. 샘플 payload와 `npm run test:samples`를 업데이트합니다.
5. `README.md`, `APP_INTEGRATION_GUIDE.md`, 본 문서를 함께 갱신합니다.

### API 계약 변경

API는 앱이 호출하는 공통 결과 저장 계약입니다. breaking change는 피하고, 가능한 선택 필드 추가로 확장합니다.

- 기존 필드명을 변경하지 않습니다.
- 필수 필드 추가는 앱 배포 버전과 서버 배포 순서를 맞춘 뒤 진행합니다.
- wrapper `{ "type": "SESSION_COMPLETE", "payload": { ... } }`와 payload 단독 요청을 계속 허용합니다.
- 중복 저장 정책은 `session_id` 중심으로 유지합니다.

## ClickUp 공통 문서 등록 기준

공통 문서 목록에는 아래 항목으로 등록합니다.

| 항목 | 값 |
| --- | --- |
| 문서명 | `OPS-CMN-003_결과서버 운영·배포 문서_v0.1` |
| 분류 | 공통 결과 서버 / 운영·배포 |
| 연결 산출물 | `DELIV-SERVER-005`, `DELIV-SERVER-006`, `DELIV-SERVER-007`, `DELIV-SERVER-008`, `DELIV-SERVER-010`, `DELIV-SERVER-013` |
| 원본 파일 | `result-collection-server/docs/DEPLOYMENT_OPERATIONS.md` |
| 관련 문서 | `DEV-CMN-001_API 명세서_v0.1`, `DAT-CMN-002_DB 스키마 설계서_v0.1` |
