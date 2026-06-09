# 오늘의 준비물 - 순수 HTML/CSS/JavaScript 변환본

이 폴더는 React/TanStack 구조를 거치지 않고 VS Code에서 바로 열어보고 수정할 수 있도록 정리한 정적 게임 코드입니다.

## 최상위 구조

- `index.html`: 화면 구조와 스크립트 로딩 순서
- `assets/`: 로고와 물건 이미지
- `css/`: 전체 UI 스타일
- `js/`: 게임 데이터, 사운드 훅, 진행 로직
- `config/`: 앱 모드, 난이도, 미션, 도움말, 제한 시간 설정
- `modes/`: 게임 모드 등록 및 모드별 처리
- `tools/`: 로컬 실행용 개발 도구
- `docs/`: 문서

## 실행

브라우저에서 `index.html`을 바로 열어도 됩니다.

이미지 경로 확인까지 같이 하려면 `converted-game` 폴더에서 아래 명령을 실행하세요.

```bash
node tools/server.js
```

기본 주소는 `http://127.0.0.1:8080`입니다.
