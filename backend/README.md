# Cloud Memo Backend - Firebase 설정

## 📋 설정 완료 상태

✅ **Firebase SDK 설치 완료**
✅ **백엔드 폴더 구조 생성 완료**
✅ **Firebase 설정 파일 생성 완료**
✅ **보안 규칙 파일 생성 완료**

## 🚨 중요: Firebase 프로젝트 설정 필요

현재 Firebase 환경변수가 설정되지 않아 인증 시스템이 작동하지 않습니다. 다음 단계를 따라 Firebase 프로젝트를 설정하세요.

## 🔧 Firebase 프로젝트 설정 단계

### 1. Firebase Console에서 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 만들기" 클릭
3. 프로젝트 이름: `cloud-memo-v2` (또는 원하는 이름)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 2. 웹 앱 등록

1. 프로젝트 대시보드에서 "웹 앱 추가" (</> 아이콘) 클릭
2. 앱 닉네임: `cloud-memo-web`
3. "Firebase Hosting 설정" 체크 해제
4. "앱 등록" 클릭

### 3. 환경변수 설정 (중요!)

1. 프로젝트 루트 폴더에 `.env` 파일 생성
2. Firebase Console에서 제공된 설정 정보를 입력:

```env
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_actual_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id

# 개발 환경 설정
NODE_ENV=development

# 앱 설정
REACT_APP_NAME=Cloud Memo
REACT_APP_VERSION=1.0.0
```

**⚠️ 주의사항:**
- `.env` 파일은 절대 Git에 커밋하지 마세요
- `backend/config/env.example` 파일을 참조하여 설정하세요
- 환경변수 설정 후 개발 서버를 재시작하세요

### 4. Firebase 서비스 활성화

#### Authentication 설정
1. Firebase Console > Authentication > 시작하기
2. "로그인 방법" 탭에서 "Google" 활성화
3. 프로젝트 지원 이메일 설정

#### Firestore Database 설정
1. Firebase Console > Firestore Database > 데이터베이스 만들기
2. 보안 규칙: "테스트 모드에서 시작" 선택
3. 위치: `asia-northeast3 (서울)` 선택

#### Storage 설정
1. Firebase Console > Storage > 시작하기
2. 보안 규칙: "테스트 모드에서 시작" 선택
3. 위치: `asia-northeast3 (서울)` 선택

### 5. 보안 규칙 배포

Firebase CLI를 사용하여 보안 규칙을 배포:

```bash
# Firebase CLI 설치 (전역)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 보안 규칙 배포
firebase deploy --only firestore:rules
firebase deploy --only storage

# CORS 설정 배포 (이미지 로딩 문제 해결)
gsutil cors set security/cors.json gs://YOUR_PROJECT_ID.appspot.com
```

## 📁 생성된 파일 구조

```
backend/
├── firebase/
│   ├── config.ts          # Firebase 초기화 설정
│   ├── auth.ts            # 인증 서비스
│   ├── firestore.ts       # Firestore 서비스
│   └── storage.ts         # Storage 서비스
├── security/
│   ├── firestore.rules    # Firestore 보안 규칙
│   └── storage.rules      # Storage 보안 규칙
├── config/
│   └── env.example        # 환경변수 설정 예시
└── README.md              # 이 파일
```

## 🔒 보안 규칙 요약

### Firestore 규칙
- 사용자는 자신의 데이터만 접근 가능
- 인증되지 않은 사용자 접근 차단
- 메모, 템플릿, 사용자 데이터 보호

### Storage 규칙
- 사용자는 자신의 이미지만 업로드/다운로드 가능
- 파일 크기 2MB 이하 제한
- 이미지 파일 형식만 허용

## ✅ 설정 완료 확인

모든 설정이 완료되면 다음 작업으로 진행:
- Firebase 인증 시스템 구현 ✅
- Firestore 데이터베이스 구조 설계
- 기존 컴포넌트 Firebase 연동

## 🚨 문제 해결

### Firebase API 키 오류가 발생하는 경우:
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 환경변수 이름이 정확한지 확인 (REACT_APP_ 접두사 필수)
3. 개발 서버 재시작
4. 브라우저 캐시 삭제

### 인증이 작동하지 않는 경우:
1. Firebase Console에서 Google 로그인 활성화 확인
2. 허용된 도메인에 localhost 추가
3. 프로젝트 설정에서 웹 앱이 올바르게 등록되었는지 확인

## 📞 지원

Firebase 설정에 문제가 있으면 다음을 확인하세요:
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- 프로젝트의 `backend/README.md` 파일 