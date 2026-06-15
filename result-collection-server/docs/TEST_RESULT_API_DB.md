# API/DB 저장 테스트 결과서

테스트 날짜: 2026-06-15

## 테스트 범위

`completed`, `abandoned`, `error` 상태의 게임 결과 payload가 API를 통해 저장되고, DB 기반 조회 endpoint로 다시 확인되는지 검증합니다.

## 실행 명령

```powershell
cd C:\Users\tpwls\Desktop\senior-care-game-hub\result-collection-server
npm run test:samples
```

## 결과

```text
completed.json: saved 또는 duplicate_ignored (sample-counting-fruits-completed)
abandoned.json: saved 또는 duplicate_ignored (sample-counting-fruits-abandoned)
error.json: saved 또는 duplicate_ignored (sample-counting-fruits-error)
```

`saved`는 새 DB row가 생성되었다는 뜻입니다. `duplicate_ignored`는 동일한 `(senior_id, session_id)`가 이미 저장되어 중복 row를 만들지 않았다는 뜻입니다.

## DB 직접 확인

```powershell
node -e "const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync('data/game-results.sqlite',{readOnly:true}); console.log(db.prepare('select status, count(*) c from game_play_results group by status').all()); console.log('questions', db.prepare('select count(*) c from game_question_logs').get().c); db.close();"
```

기대 결과:

- `completed` row 1건 이상
- `abandoned` row 1건 이상
- `error` row 1건 이상
- completed 샘플의 문항 로그 row 1건 이상

## 요구사항 대응

| 요구사항 | 증빙 |
| --- | --- |
| completed 저장 | `samples/completed.json` 저장/조회 |
| abandoned 저장 | `samples/abandoned.json` 저장/조회 |
| error 저장 | `samples/error.json` 저장/조회 |
| 중복 저장 방지 | 재실행 시 `duplicate_ignored` 반환 |
| DB 저장 확인 | `session_id` 기준 GET 조회로 결과 확인 |
