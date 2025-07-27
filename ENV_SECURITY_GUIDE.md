# 🔒 환경 변수 보안 가이드

## 📋 개요

이 문서는 Firebase API 키 및 환경 변수 보안 관리에 대한 가이드입니다. GitHub에서 .env 파일이 노출되는 보안 사고를 방지하고, 안전한 API 키 관리 방법을 제공합니다.

## 🚨 발생한 보안 사고

### 문제 상황
- **날짜**: 2025년 7월 27일
- **문제**: `frontend/.env` 파일이 Git에 커밋되어 GitHub에 노출
- **노출된 정보**: Firebase API 키 및 모든 설정값
- **위험도**: 🔴 높음 (API 키 악용 가능성)

### 노출된 정보
```
REACT_APP_FIREBASE_API_KEY=AIzaSyDsm66igsEE31y2HemTSI2BGyKQA9-ksn0
REACT_APP_FIREBASE_AUTH_DOMAIN=cloud-memo-v2.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=cloud-memo-v2
REACT_APP_FIREBASE_STORAGE_BUCKET=cloud-memo-v2.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=527848937463
REACT_APP_FIREBASE_APP_ID=1:527848937463:web:2883b4e0409473223e80f2
REACT_APP_FIREBASE_MEASUREMENT_ID=G-GEX9RSTYSP
```

## ✅ 해결 과정

### 1단계: 즉시 대응
- [x] **Git에서 .env 파일 제거**: `git rm --cached frontend/.env`
- [x] **루트 .gitignore 생성**: 환경 변수 파일 보호
- [x] **frontend/.gitignore 업데이트**: `.env` 추가
- [x] **변경사항 커밋**: 보안 관련 변경사항 기록

### 2단계: API 키 재발급
- [x] **Google Cloud Console 접속**: https://console.cloud.google.com/apis/credentials
- [x] **새 API 키 생성**: `AIzaSyCb3OZ55R3bQXbwdUl2Lm0CIzzzPkO84cQ`
- [x] **기존 키 삭제**: 노출된 키 완전 제거
- [x] **로컬 .env 파일 업데이트**: 새 키로 교체

### 3단계: 보안 설정
- [x] **웹사이트 제한 설정**:
  - `http://localhost:*`
  - `https://*.netlify.app`
  - `http://192.168.0.19`
- [x] **API 제한 설정**: Firebase 관련 API만 허용
- [x] **OAuth 동의 화면 설정**: 외부 사용자 유형 선택

### 4단계: 문제 해결
- [x] **API 키 제한 해제**: 로컬 개발 환경에서 정상 작동 확인
- [x] **Firebase Authentication 설정**: Google 로그인 활성화
- [x] **승인된 도메인 설정**: localhost 및 배포 도메인 추가

## 📁 파일 구조

### 보안 관련 파일들
```
project-root/
├── .gitignore                    # 루트 .gitignore (환경 변수 보호)
├── frontend/
│   ├── .gitignore               # frontend .gitignore (환경 변수 보호)
│   ├── .env                     # 실제 환경 변수 (Git에서 제외됨)
│   └── env.example              # 환경 변수 템플릿
├── backend/
│   └── config/
│       └── env.example          # 백엔드 환경 변수 템플릿
└── ENV_SECURITY_GUIDE.md        # 이 문서
```

### .gitignore 설정
```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🔧 환경 변수 설정

### 필수 환경 변수
```bash
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_api_key_here
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

### 설정 방법
1. `env.example` 파일을 `.env`로 복사
2. Firebase Console에서 실제 값으로 교체
3. 절대 Git에 커밋하지 않음

## 🛡️ 보안 모범 사례

### API 키 관리
- ✅ **환경 변수 사용**: 하드코딩 금지
- ✅ **Git 제외**: .env 파일은 절대 커밋하지 않음
- ✅ **정기적 교체**: 보안을 위해 주기적으로 API 키 교체
- ✅ **제한 설정**: 가능한 경우 도메인 및 API 제한 설정

### 개발 환경
- ✅ **로컬 .env**: 개발자별 로컬 환경 변수
- ✅ **템플릿 제공**: env.example로 설정 가이드 제공
- ✅ **문서화**: 설정 방법 명확히 문서화

### 배포 환경
- ✅ **환경 변수**: Netlify, Vercel 등에서 환경 변수 설정
- ✅ **비밀 관리**: 배포 플랫폼의 비밀 관리 기능 활용
- ✅ **접근 제한**: 필요한 개발자만 접근 권한 부여

## 🚨 긴급 상황 대응

### API 키 노출 시 즉시 조치
1. **Google Cloud Console에서 기존 키 삭제**
2. **새 API 키 생성**
3. **모든 환경에서 환경 변수 업데이트**
4. **팀원들에게 알림**
5. **보안 감사 수행**

### 복구 체크리스트
- [ ] 기존 API 키 삭제 완료
- [ ] 새 API 키 생성 완료
- [ ] 로컬 .env 파일 업데이트
- [ ] Netlify 환경 변수 업데이트
- [ ] 배포된 사이트 테스트
- [ ] 팀원들과 새 키 공유

## 📚 참고 자료

### Firebase 보안
- [Firebase 보안 규칙](https://firebase.google.com/docs/rules)
- [Firebase Authentication 보안](https://firebase.google.com/docs/auth)
- [API 키 보안 모범 사례](https://cloud.google.com/apis/design/security)

### 환경 변수 관리
- [React 환경 변수](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Node.js 환경 변수](https://nodejs.org/en/learn/getting-started/environment-variables)

## 📝 변경 이력

| 날짜 | 변경 내용 | 담당자 |
|------|-----------|--------|
| 2025-07-27 | 보안 가이드 문서 생성 | 개발팀 |
| 2025-07-27 | API 키 노출 사고 대응 | 개발팀 |
| 2025-07-27 | 환경 변수 보안 설정 완료 | 개발팀 |

## ⚠️ 주의사항

1. **절대 .env 파일을 Git에 커밋하지 마세요**
2. **API 키를 코드에 하드코딩하지 마세요**
3. **정기적으로 API 키를 교체하세요**
4. **보안 설정을 주기적으로 검토하세요**
5. **팀원들과 보안 정책을 공유하세요**

---

**마지막 업데이트**: 2025년 7월 27일  
**문서 버전**: 1.0  
**보안 등급**: 🔒 높음 