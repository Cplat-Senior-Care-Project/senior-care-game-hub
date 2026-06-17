# 오늘의 준비물 - 모드별 실행 URL 명세서

본 문서는 호스트 애플리케이션(효담콜 앱, AI 브릿지 레이어 등)에서 WebView를 통해 `오늘의 준비물` 게임에 진입할 때 사용하는 모드별 실행 URL 및 쿼리 파라미터 규격을 정의합니다.

---

## 1. 지원 쿼리 파라미터 명세

WebView를 호출할 때 URL 뒤에 다음 쿼리 파라미터들을 조합하여 전달할 수 있습니다.

| 파라미터 키 | 허용 값 | 필수 여부 | 설명 |
| :--- | :--- | :---: | :--- |
| **`mode`** | `standard` \| `reminder` \| `care` \| `ai_assisted` | 선택 | **진입 모드**를 설정합니다. (생략 시 기본값: `standard`) <br> *※ `ai-assisted`와 같이 하이픈(-) 형태의 별칭도 자동 변환 및 지원합니다.* |
| **`userDifficultyGroup`** | `low` \| `middle` \| `high` | 선택 | **사용자 프로필 기반 난이도 그룹**을 설정합니다. <br> - `low`: 쉬움 (`easy`) <br> - `middle`: 보통 (`normal`) <br> - `high`: 어려움 (`hard`) |
| **`difficulty`** | `easy` \| `normal` \| `hard` | 선택 | 난이도를 명시적으로 직접 지정할 때 사용합니다. (`userDifficultyGroup`보다 높은 우선순위) |
| **`returnUrl`** | URL 경로 (예: `../../index.html`) | 선택 | 게임 완료 또는 강제 종료 후 효담콜 허브(목록 화면 등)로 복귀할 대상 페이지의 주소입니다. |
| **`session_id`** | 문자열 (임의 고유값) | 선택 | API 연동 및 분석 결과 식별을 위한 실행 세션 ID입니다. (생략 시 무작위 난수 생성) |
| **`content_id`** | 문자열 | 선택 | 콘텐츠 고유 ID입니다. (기본값: `content_what_fits_where`) |
| **`game_key`** | `what_fits_where` | 선택 | 게임 종류 고유 식별자 키입니다. |
| **`config`** | URL 인코딩된 JSON 문자열 | 선택 | 부가적인 런타임 설정(타이머 숨김, 다시하기 방지 등)을 객체 형태로 직접 오버라이드합니다. |

---

## 2. 모드별 실행 URL 명세 및 동작 규격

### 2-1. 표준 모드 (Standard Mode)
사용자가 직접 난이도를 고르고, 기분 상태 체크 및 점수/사후 피드백을 진행하는 정석적인 플레이 모드입니다.

* **동작 흐름**: 컨디션 체크 $\rightarrow$ 난이도 선택 $\rightarrow$ 3초 카운트다운 $\rightarrow$ 게임 플레이 (10문항) $\rightarrow$ 점수 화면 $\rightarrow$ 사후 기분/피로도 체크 $\rightarrow$ 메인 화면 복귀
* **권장 URL 예시**:
  ```http
  http://127.0.0.1:8080/?mode=standard&session_id=sess_std_01&returnUrl=../../index.html
  ```

### 2-2. 알림 모드 (Reminder Mode)
푸시 알림 또는 정기 예약 일정을 통해 진입하여 정해진 난이도로 자동 시작하고 완료 후 즉시 허브로 복귀하는 모드입니다.

* **동작 흐름**: (컨디션 체크 생략) $\rightarrow$ 시작 타이틀 화면 (설정된 난이도로 자동 시작) $\rightarrow$ 3초 카운트다운 $\rightarrow$ 게임 플레이 (10문항) $\rightarrow$ 완료 피드백 화면 $\rightarrow$ 1.2초 후 허브로 자동 복귀 (`returnUrl` 이동)
* **권장 URL 예시**:
  * **쉬움 난이도로 진행 시**:
    ```http
    http://127.0.0.1:8080/?mode=reminder&userDifficultyGroup=low&session_id=sess_rem_01&returnUrl=../../index.html
    ```
  * **보통 난이도로 진행 시**:
    ```http
    http://127.0.0.1:8080/?mode=reminder&userDifficultyGroup=middle&session_id=sess_rem_02&returnUrl=../../index.html
    ```

### 2-3. 케어 모드 (Care Mode)
시니어 사용자의 인지 저하 및 조작 피로도를 줄이기 위해 모든 보조 UI를 간소화하고 짧게 푸는 치유 특화 모드입니다.

* **동작 흐름**: (컨디션 체크, 난이도 선택 생략) $\rightarrow$ 쉬움 난이도로 자동 시작 $\rightarrow$ 3초 카운트다운 $\rightarrow$ 게임 플레이 (**5문항**, 화면 내 타이머 게이지 및 점수 노출 안 됨) $\rightarrow$ 20초간 무반응 시 **자동 힌트 안내** $\rightarrow$ 완료 피드백 화면 $\rightarrow$ 1.2초 후 허브로 자동 복귀 (`returnUrl` 이동)
* **권장 URL 예시**:
  ```http
  http://127.0.0.1:8080/?mode=care&userDifficultyGroup=low&session_id=sess_care_01&returnUrl=../../index.html
  ```

### 2-4. AI 연동 모드 (AI Assisted Mode)
앱 외부에 탑재된 AI 서비스나 음성 비서 레이어가 WebView 게임의 입력을 제어하거나 보조할 때 사용하는 개발 모드입니다.

* **동작 흐름**: (컨디션 체크, 난이도 선택 생략) $\rightarrow$ 쉬움 난이도로 시작 $\rightarrow$ 5문항 풀이 $\rightarrow$ AI 브릿지 메시지(`EXTERNAL_ANSWER` 등)의 전달을 대기하고 수동 터치 없이 정답 확인 $\rightarrow$ 완료 피드백 화면 $\rightarrow$ 허브로 자동 복귀
* **권장 URL 예시**:
  ```http
  http://127.0.0.1:8080/?mode=ai_assisted&session_id=sess_ai_01&returnUrl=../../index.html
  ```

---

## 3. 로컬 테스트 주소 빠른 참조 (Port 8090 기준)

현재 로컬 개발 서버가 `8090` 포트에서 작동 중일 때의 테스트 링크입니다:

* **[표준 모드 시작](http://127.0.0.1:8090/?mode=standard)**
* **[알림 모드 시작 - 보통 난이도](http://127.0.0.1:8090/?mode=reminder&userDifficultyGroup=middle)**
* **[케어 모드 시작 - 5문항, UI 간소화](http://127.0.0.1:8090/?mode=care&userDifficultyGroup=low)**
* **[AI 연동 모드 시작](http://127.0.0.1:8090/?mode=ai_assisted)**

---
*문서 작성일자: 2026-06-17 | 적용 게임 버전: 1.0.0*
