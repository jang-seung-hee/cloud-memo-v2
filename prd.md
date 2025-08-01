# Cloud Memo PRD (Product Requirements Document)

---

## 1. 제품 개요

### 1.1 제품명

* Cloud Memo

### 1.2 개발 배경 및 목적

* Cloud Memo는 누구나 빠르게 메모를 남기고, 사진이나 인용구를 첨부하며, 원하는 정보를 쉽고 빠르게 기록하고 다시 꺼내볼 수 있는 ‘진짜 실용적인’ 메모 앱을 목표로 한다.
* 기존의 무거운 노트 앱이나 사용성이 복잡한 앱이 아니라, “10초 만에 기록하고, 3초 만에 다시 꺼내볼 수 있는” 명확한 사용성 중심 컨셉을 지향한다

---

## 2. 핵심 가치/차별점

* 로그인을 하면 나만의 온라인 메모장을 가질 수 있다
* PC에서 메모를 작성하고, 휴대폰으로도 볼 수 있고, 휴대폰으로 작성한 메모를 PC에서도 볼 수 있다
* 온라인에 ID별로 하나의 DB가 생기고 거기에 메모가 저장되고, 수정되고 삭제되는 단순한 구조이다.
* 메모는 글자 뿐만 아니라, 카메라, 갤러리, 클립보드에 저장된 사진도 첨부를 할 수 있다
* 반복적으로 사용하는 인용구나 단골문구, 전화번호 등을 2~3클릭안에 완료한다.
* 디자인은 라이트/다크모드 자동 전환, 군더더기 없는 심플 UI/UX, 기존 작업물의 안정적인 스타일을 참고함.
* 디자인시 Tailwind CSS, Shadcn UI, heroicon, React Router, Lucide의 컴포넌트를 적극 활용 한다.
* 기능은 반드시 개발 가이드 지침을 따른다
---

## 3. 주요 기능(상세)

### 3.1 메모 작성/저장

* 새 메모 누르면 본문 필드 바로 제공
* 작성 화면에서 \[사진 첨부], \[상용구 삽입], \[저장], \[삭제], \[뒤로] 등 직관적인 버튼 배치

### 3.2 이미지 첨부/업로드

* \[사진 찍기] 또는 [가져오기]버튼으로 모바일 카메라 즉시 호출, 또는 \[갤러리에서 선택], 또는 캡쳐 후 클립보드 이미지 붙여넣기
* 첨부 이미지는 메모 본문 내에 썸네일로 미리보기 지원
* 업로드한 이미지는 Firebase Storage로 저장 (단, 업로드시 리사이즈 처리한다 1280 * 800이하로 리사이즈)

### 3.3 상용구 관리기능

* 자주 쓰는 문구나 상용구를 미리 등록해두고, 버튼 하나로 본문 커서 위치에 바로 붙여 넣기
* 모바일 환경에서는 메모 작성 화면 내에 토글 버튼을 통해, 우측 슬라이드 형태로 상용구 리스트가 나타나도록 구성한다.
* 상용구 리스트 항목은 클릭 시 즉시 본문 커서 위치에 삽입, 또는 클립보드 복사가 바로 실행되도록 한다.
* 그 외에는 상용구는 별도의 관리 기능 통해, 제목, 내용을 각각 추가/수정/삭제 가능

### 3.4 메모 리스트 및 상세

* 최신순 정렬, 각 메모는 미리보기 형태로 리스트에 노출
* 리스트에서 클릭 시 상세 화면(전체 본문, 첨부 이미지, 생성/수정일자, 편집/삭제 등)

### 3.5 반응형 UI/UX

* PC/모바일 자동 최적화(Responsive), 사이즈와 터치 조작까지 전면 고려
* 라이트/다크 모드 시스템 자동 감지. 모드 강제 전환 옵션(2차 추가)
* 주요 액션(메모 추가/수정/삭제/첨부 등)은 2\~3클릭 이내 도달 가능

### 3.6 저장 방식/데이터 동기화

* MVP: 처음부터 Firebase Firestore에 저장, Google 로그인으로 기기 간 동기화 지원
* 메모/이미지 데이터 모두 Firebase에 효율적으로 저장 (단 이미지는 3MB이하로 가공 후 저장)

### 3.7 기타

* 검색, 폴더, 태그 등은 확장 기능으로 3차 이후 지원
* 기존 작업물, 디자인 리소스, 이미지 등은 직접 제작 혹은 AI 활용 가능

---

## 4. 사용자 시나리오

### 4.1 일반 사용자

* 앱 진입 > 메모 리스트 확인 > \[+] 버튼 클릭 > 제목/본문 입력 > 필요시 사진 첨부 > 저장 > 리스트에서 바로 확인
* 평소에 반복적으로 쓰는 연락처, 계좌번호, 명언, 업무 멘트 등은 \[상용구 문구 추가]에 등록 → 메모 작성 시 토글 버튼 통해 슬라이딩 리스트 나올때 선택 하면 바로 텍스트 필드 커서 위치에 삽입

### 4.2 시니어/비전문가

* 앱 실행만으로 곧바로 메모 쓰기 화면 진입
* 별도의 메뉴/탭 전환 없이 직관적으로 입력 및 저장
* 최근 작성한 메모 맨 위에 고정 표시, 작성 날짜별 정렬

---

## 5. 기술 스택 및 개발환경

* **프론트엔드:** React, TailwindCSS, React Router, heroicon, Shadcn UI (적용 완료)
  - **Shadcn UI:** CRA 환경에서는 공식적으로 CLI 설치를 지원하지 않음.  
    대신, 컴포넌트/스타일/유틸 파일을 직접 복사하여 수동 방식으로 적용.

* **백엔드:** Firebase Firestore, Firebase Storage, Firebase Authentication (아직 미설정)

* **호스팅:** Netlify (자동 배포 및 롤백 지원)

* **프로젝트 구조:** 프론트엔드와 백엔드 코드를 별도 폴더로 분리
  - **프론트엔드:** `./frontend/`  
  - **백엔드:** `./backend/`

* **디자인:** `.design_cloud_memo` 폴더의 인터페이스를 기반으로 하되,  
  Tailwind CSS + heroicon + Shadcn UI 조합을 통해  
  **간결하면서도 독립적인 사용자 UI 흐름**을 구성.


---

## 6. 개발 로드맵/일정

### 1차: 디자인 UI/UX MVP (3\~7일)

* 디자인 및 UI/UX 설계개발
* 프론트엔드 폴더 구조 설정 (`./frontend/`)

### 2차: 클라우드 확장

* Firebase 인증 및 DB 연동
* 구글 계정 로그인, 기기 간 동기화
* 메모 CRUD(생성/조회/수정/삭제)
* 이미지 첨부, 인용구 삽입, 반응형 UI
* Netlify 배포, 간단한 접근권한/공유 기능
* 백엔드 폴더 구조 설정 (`./backend/`) - 필요시

### 3차: 부가 기능

* 검색/태그/폴더 관리
* 메모 공유/협업, 알림 기능, 백업/복원, OCR/음성메모
* UX/UI 고도화, 실사용자 피드백 반영
* 백엔드 및 프론트엔드 폴더 구조 완성

---

## 7. 성공 지표(KPI)

* 최초 진입 후 메모 저장까지 평균 소요시간 10초 이내
* 1차 배포 후 1주일간 치명적 버그 없음
* 동기화 성공률 99%(Firebase 적용 후)
* 메모 작성/삭제/수정/첨부 등 모든 주요 액션 3클릭 이내

---

## 8. 와이어프레임(설명)

* .design_cloud_memo 인터페이스를 참고하되, 그 밖에는 독창적 개발한다.
* Tailwind CSS, Shadcn UI, heroicon 조합을 구성
* 클래스 단에서 라이트/다크모드, 반응형 레이아웃
* \[메인]: 상단 로고 + 메모 리스트 + \[+] 버튼(새 메모)
* \[작성]: 제목, 본문, 사진 첨부, 단골문구, 저장/취소 버튼
* \[상세]: 전체 내용, 첨부 이미지, 편집/삭제
* \[문구 관리]: 자주 쓰는 문구 리스트, 추가/수정/삭제
* [설정](2차): 로그인/로그아웃, 라이트/다크모드 선택

---

## 9. 금지사항

- ❌ 반응형 디자인을 고려하지 않은 고정 레이아웃 구현
- ❌ Shadcn UI, heroicon등 컴포넌트를 사용하지 않고 직접 구현
- ❌ 이미 있는 기능의 함수를 이중 제작하기
- ❌ 데이터, 함수의 이중 제작관리
- ❌ Firebase에 이미 저장된 데이터를 로컬스토리지에 중복 저장하거나 관리하지 말 것
- ❌ 큰 이미지 파일을 압축 없이 업로드
- ❌ 사용자 허가 없는 추가 기능의 확대 구현
- ❌ 백엔드와 프론트엔드 코드를 같은 폴더에 혼재
- ❌ 프론트엔드 코드를 백엔드 폴더에 저장하거나 그 반대