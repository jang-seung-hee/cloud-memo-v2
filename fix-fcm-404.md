# FCM 404 에러 긴급 수정 가이드

## 🔴 현재 상황
Firebase Functions 로그에 다음 에러 발생:
```
messaging/unknown-error
The requested URL /batch was not found on this server. Status code: 404.
```

이 에러는 **FCM API v1 엔드포인트를 찾을 수 없다**는 의미입니다.

## ✅ 즉시 수행할 해결책 (5단계)

### 1단계: API 활성화 (3개 모두 필수!)

**중요:** 아래 3개 링크를 **각각** 열어서 모두 "사용 설정" 클릭하세요:

1. **Firebase Management API** (가장 중요!)
   ```
   https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
   ```
   → "사용 설정" 버튼 클릭

2. **Firebase Cloud Messaging API**
   ```
   https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=cloud-memo-v2
   ```
   → "사용 설정" 버튼 클릭

3. **Cloud Messaging (레거시)**
   ```
   https://console.cloud.google.com/apis/library/googlecloudmessaging.googleapis.com?project=cloud-memo-v2
   ```
   → "사용 설정" 버튼 클릭

### 2단계: Cloud Messaging API (V1) 활성화 확인

1. **Firebase Console** 접속
   ```
   https://console.firebase.google.com/project/cloud-memo-v2/settings/cloudmessaging
   ```

2. **"Cloud Messaging API (V1)" 섹션 확인**
   - "사용 설정됨" 상태인지 확인
   - 만약 "사용 중지됨"이면 **"API 사용 설정"** 버튼 클릭

### 3단계: 서비스 계정 권한 추가

1. **IAM 페이지** 접속
   ```
   https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
   ```

2. **서비스 계정 찾기**
   - 이메일: `cloud-memo-v2@appspot.gserviceaccount.com`
   - 찾기: Ctrl+F로 "appspot" 검색

3. **권한 추가**
   - 서비스 계정 오른쪽 "수정" (연필 아이콘) 클릭
   - "다른 역할 추가" 클릭
   - 역할 선택: **"Cloud Messaging 관리자"** 또는 **"Firebase Admin"**
   - "저장" 클릭

### 4단계: Functions 완전 재배포 (필수!)

터미널에서 **반드시** 다음 명령어를 순서대로 실행:

```powershell
# 1. 프로젝트 디렉토리로 이동
cd e:\05.Python_Project\19.cloud-memo.v2

# 2. 기존 Functions 삭제 (선택사항이지만 권장)
firebase functions:delete sendShareNotification

# 3. Functions 의존성 재설치
cd functions
npm install
cd ..

# 4. Functions 재배포
firebase deploy --only functions
```

### 5단계: 10분 대기 후 테스트

**중요:** API 활성화와 권한 변경이 완전히 적용되려면 **최소 5-10분** 기다려야 합니다!

1. **10분 대기**
   - Google Cloud 인프라에 변경사항이 전파되는 시간

2. **앱 새로고침**
   - 본인과 친구 모두 브라우저에서 Ctrl+Shift+R (완전 새로고침)

3. **메모 공유 테스트**
   - 친구에게 메모 공유

4. **로그 확인**
   ```powershell
   firebase functions:log
   ```
   - 더 이상 404 에러가 없고 "FCM 발송 결과: 1 성공" 메시지가 나타나야 함

## 🔍 로그에서 확인해야 할 것

### ✅ 성공 시 로그 예시:
```
알림 트리거 발생: { type: 'share', title: '새로운 메모 공유', ... }
메시지 발송 시도: { notification: {...}, tokens: [...] }
FCM 발송 결과: 1 성공 / 0 실패
```

### ❌ 실패 시 로그 예시:
```
messaging/unknown-error
The requested URL /batch was not found on this server. Status code: 404.
```
→ 아직 API가 활성화되지 않았거나 대기 시간이 부족함

## 🚨 여전히 404 에러가 나는 경우

### 체크리스트:

- [ ] 위 1-3단계의 **모든 API를 활성화**했는가?
- [ ] **10분 이상 대기**했는가?
- [ ] Functions를 **재배포**했는가?
- [ ] Firebase 프로젝트가 **Blaze 플랜**(종량제)인가?
  - Spark 플랜에서는 외부 API 호출이 제한됨
  - 확인: https://console.firebase.google.com/project/cloud-memo-v2/usage
  - 업그레이드: "Blaze 플랜으로 업그레이드" 버튼 클릭

### Blaze 플랜으로 업그레이드 (무료 할당량 포함)

Firebase Spark 플랜에서는 Cloud Functions가 외부 API를 호출할 수 없습니다!

1. **Firebase Console > 사용량 및 결제** 이동
   ```
   https://console.firebase.google.com/project/cloud-memo-v2/usage
   ```

2. **"Blaze 플랜으로 업그레이드" 클릭**
   - Blaze 플랜은 종량제이지만 **무료 할당량**이 매우 넉넉함
   - Cloud Functions 호출: 월 200만 회 무료
   - FCM 발송: 완전 무료 (무제한)
   - 결제 카드 등록 필요 (실제 과금은 거의 없음)

3. **결제 계정 연결**
   - Google Cloud Billing 계정 생성 또는 선택
   - 신용카드 등록

## 💡 추가 디버깅

친구가 알림을 받지 못하는 다른 원인:

### 1. 친구의 FCM 토큰이 없는 경우

**확인 방법:**
1. Firebase Console > Firestore Database
2. `users/{친구_userId}` 문서 열기
3. `fcmTokens` 필드에 배열이 비어있거나 없음

**해결:**
- 친구에게 **로그아웃 후 재로그인** 요청
- 알림 권한 프롬프트에서 **"허용"** 클릭 확인

### 2. Service Worker가 등록되지 않음

**친구의 브라우저에서 확인:**
1. F12 > Application 탭 > Service Workers
2. `firebase-messaging-sw.js`가 등록되어 있는지 확인

**해결:**
- 브라우저 캐시 완전 삭제 후 재접속
- PWA 재설치 (홈 화면에서 삭제 후 다시 추가)

### 3. 알림 권한이 차단됨

**친구의 브라우저에서 확인:**
1. 주소창 왼쪽 자물쇠 아이콘 클릭
2. "알림" 권한이 "허용"인지 확인

**해결:**
- "알림" 권한을 "허용"으로 변경
- 페이지 새로고침

## 📞 추가 지원이 필요한 경우

위 모든 단계를 수행했는데도 안 된다면:

1. **Firebase Functions 로그 전체 복사**
   ```powershell
   firebase functions:log > logs.txt
   ```

2. **Firestore 스크린샷**
   - `notifications` 컬렉션 스크린샷
   - `users/{친구_userId}` 문서 스크린샷

3. **친구의 브라우저 콘솔 로그**
   - F12 > Console 탭 내용 복사

위 정보를 공유하면 더 정확한 진단이 가능합니다.
