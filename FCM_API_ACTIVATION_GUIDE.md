# Firebase Cloud Messaging API 활성화 가이드 (완전판)

## 문제 상황
친구에게 공유 알림이 전송되지 않는 이유는 **Firebase Cloud Messaging API가 제대로 활성화되지 않았거나 Firebase 프로젝트 설정이 누락되었기 때문**입니다.

Firebase Functions 로그에서 다음 에러 발생:
```
messaging/unknown-error
The requested URL /batch was not found on this server. Status code: 404.
```

이 에러는 FCM v1 API가 활성화되지 않았거나, 서비스 계정에 필요한 권한이 없을 때 발생합니다.

## 🔧 해결 방법 (중요도 순서대로 수행)

### ✅ 1단계: Firebase Cloud Messaging API (V1) 활성화

#### 방법 A: 직접 링크 사용 (가장 빠름)
1. 다음 링크를 클릭하여 바로 활성화 페이지로 이동:
   ```
   https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
   ```

2. **"Firebase Management API"** 활성화
   ```
   https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
   ```

3. **"Firebase Cloud Messaging API"** 활성화
   ```
   https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=cloud-memo-v2
   ```

4. **"Firebase Cloud Messaging API (V1)"** 활성화 (가장 중요!)
   - Google Cloud Console > API 및 서비스 > 라이브러리
   - "FCM" 또는 "Firebase Cloud Messaging" 검색
   - 모든 FCM 관련 API를 "사용 설정" 클릭

#### 방법 B: Google Cloud Console에서 수동 활성화

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/
   
2. **프로젝트 선택**
   - 상단의 프로젝트 선택 드롭다운에서 **`cloud-memo-v2`** 프로젝트 선택
   
3. **API 및 서비스 > 라이브러리**로 이동
   
4. **다음 API들을 모두 검색하여 활성화**:
   - ✅ Firebase Management API
   - ✅ Firebase Cloud Messaging API
   - ✅ Cloud Messaging (레거시)
   
5. **각 API 활성화**
   - 각 API 클릭 후 **"사용 설정"** 또는 **"Enable"** 버튼 클릭

### ✅ 2단계: Firebase 프로젝트 설정 확인

1. **Firebase Console 접속**
   - https://console.firebase.google.com/
   
2. **프로젝트 설정 > 클라우드 메시징 탭** 이동
   
3. **"Cloud Messaging API (V1) 사용 설정" 확인**
   - "Cloud Messaging API (V1)"이 "사용 설정됨"으로 표시되어야 함
   - 만약 "사용 중지됨"이면 "사용 설정" 버튼 클릭

### ✅ 3단계: 서비스 계정 권한 확인

1. **Google Cloud Console > IAM 및 관리자 > IAM** 이동
   ```
   https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
   ```

2. **Firebase Admin SDK 서비스 계정 찾기**
   - 이메일 형식: `[프로젝트ID]@appspot.gserviceaccount.com`
   - 예: `cloud-memo-v2@appspot.gserviceaccount.com`

3. **필요한 역할 확인 및 추가**
   - ✅ "Firebase Admin SDK 관리자 서비스 에이전트" 또는
   - ✅ "Cloud Messaging 관리자" 또는
   - ✅ "편집자"
   
4. **역할 추가 방법** (권한이 없는 경우):
   - 서비스 계정 옆의 "수정" (연필 아이콘) 클릭
   - "다른 역할 추가" 클릭
   - "Cloud Messaging 관리자" 또는 "Firebase Cloud Messaging 관리자" 선택
   - "저장" 클릭

### ✅ 4단계: Functions 재배포 (필수!)

API와 권한을 활성화한 후 **반드시** Functions를 재배포해야 합니다:

```bash
cd e:\05.Python_Project\19.cloud-memo.v2
firebase deploy --only functions
```

재배포 이유:
- 서비스 계정 권한 변경사항 반영
- 새로운 API 엔드포인트 정보 업데이트

### ✅ 5단계: 활성화 후 테스트

1. **5-10분 대기** (중요!)
   - API 활성화가 완전히 적용될 때까지 대기
   - 서비스 계정 권한이 전파될 때까지 대기

2. **앱 새로고침**
   - 브라우저에서 앱 완전 새로고침 (Ctrl+Shift+R 또는 Cmd+Shift+R)
   - 친구도 앱을 새로고침해야 함

3. **테스트**
   - 앱에서 친구에게 메모를 공유
   - 친구의 폰에서 푸시 알림이 수신되는지 확인

4. **로그 확인**
   ```bash
   firebase functions:log
   ```
   - 에러 없이 "FCM 발송 결과: X 성공 / 0 실패" 메시지가 출력되어야 합니다

### ✅ 6단계: 실시간 디버깅

**친구의 브라우저에서 확인:**

1. **개발자 도구 콘솔 열기** (F12)
   
2. **FCM 토큰 확인**
   ```javascript
   // 콘솔에 다음 코드 붙여넣기
   console.log('Notification permission:', Notification.permission);
   ```
   - 결과: `"granted"` 여야 함
   - 만약 `"denied"` 또는 `"default"`라면 알림 권한 재요청 필요

3. **Service Worker 확인**
   ```javascript
   // 콘솔에 다음 코드 붙여넣기
   navigator.serviceWorker.getRegistrations().then(regs => {
     console.log('Service Workers:', regs.length);
     regs.forEach(reg => console.log('SW scope:', reg.scope));
   });
   ```
   - 최소 1개 이상의 Service Worker가 등록되어 있어야 함

4. **Firestore에서 FCM 토큰 확인**
   - Firebase Console > Firestore Database
   - `users/{친구_userId}` 문서 확인
   - `fcmTokens` 배열에 토큰이 저장되어 있는지 확인
   - 없다면: 친구가 로그인 후 알림 권한을 허용하지 않은 것

**본인의 Firebase Console에서 확인:**

1. **Firestore에서 알림 문서 확인**
   - Firebase Console > Firestore Database
   - `notifications` 컬렉션에 새 문서가 생성되었는지 확인
   - 문서 내용: `senderId`, `receiverId`, `title`, `body`, `memoId` 등

2. **Cloud Functions 실행 로그 확인**
   - Firebase Console > Functions > 대시보드
   - `sendShareNotification` 함수 클릭
   - "로그" 탭에서 에러 메시지 확인

3. **Functions 실행 횟수 확인**
   - 그래프에서 실행 횟수가 증가했는지 확인
   - 실행되지 않았다면 Firestore triggers가 제대로 설정되지 않은 것

## 🚨 여전히 안 되는 경우 (체크리스트)

### ✅ 친구 측 체크리스트:

- [ ] **PWA 설치 여부**
  - iOS: Safari에서 "홈 화면에 추가" 필수
  - Android: Chrome에서 "홈 화면에 추가" 권장 (브라우저에서도 가능)
  - 데스크톱: Chrome에서 주소창 오른쪽 "설치" 아이콘 클릭

- [ ] **알림 권한 허용**
  - 브라우저 주소창 왼쪽 자물쇠 아이콘 클릭
  - "알림" 또는 "Notifications" 권한이 "허용"으로 설정되어 있는지 확인
  - 차단되어 있다면: 설정 변경 후 페이지 새로고침

- [ ] **로그인 상태**
  - 친구가 로그인되어 있어야 FCM 토큰이 등록됨

- [ ] **FCM 토큰 등록 확인** (F12 개발자 도구에서)
  ```javascript
  // 콘솔에 입력
  console.log('알림 권한:', Notification.permission);
  // 결과: "granted" 여야 함
  ```

### ✅ 본인 측 체크리스트:

- [ ] **모든 API 활성화 확인**
  - https://console.cloud.google.com/apis/dashboard?project=cloud-memo-v2
  - Firebase Management API ✅
  - Firebase Cloud Messaging API ✅
  - Cloud Messaging (레거시) ✅

- [ ] **서비스 계정 권한 확인**
  - https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
  - `cloud-memo-v2@appspot.gserviceaccount.com` 찾기
  - "Cloud Messaging 관리자" 역할 확인

- [ ] **Functions 재배포 완료**
  ```bash
  firebase deploy --only functions
  ```

- [ ] **Firestore에 알림 문서 생성 확인**
  - Firebase Console > Firestore Database > `notifications` 컬렉션

- [ ] **Functions 로그에서 에러 없음 확인**
  ```bash
  firebase functions:log
  ```
  - "FCM 발송 결과" 메시지 확인
  - 404 에러가 사라졌는지 확인

## 🔧 고급 문제 해결

### 문제 1: FCM 토큰이 생성되지 않음

**증상:** 브라우저 콘솔에 "FCM 토큰 저장 완료" 메시지가 나타나지 않음

**해결:**
1. Service Worker가 제대로 등록되었는지 확인
   - 개발자 도구 > Application 탭 > Service Workers
   - `firebase-messaging-sw.js`가 등록되어 있어야 함

2. VAPID 키 확인
   - `frontend/.env` 파일에 `REACT_APP_FIREBASE_VAPID_KEY` 값이 올바른지 확인
   - Firebase Console > 프로젝트 설정 > 클라우드 메시징 > "웹 푸시 인증서" 확인

3. HTTPS 연결 확인
   - FCM은 localhost 또는 HTTPS에서만 작동
   - HTTP 환경에서는 작동하지 않음

### 문제 2: Functions가 트리거되지 않음

**증상:** Firestore에 알림 문서는 생성되지만 Functions가 실행되지 않음

**해결:**
1. Functions 배포 확인
   ```bash
   firebase functions:list
   ```
   - `sendShareNotification`이 목록에 있는지 확인

2. Firestore Triggers 확인
   - `functions/index.js`의 경로가 정확한지 확인: `notifications/{notificationId}`
   - Firestore 컬렉션 이름이 `notifications`인지 확인

3. Functions 재배포
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```

### 문제 3: Functions는 실행되지만 FCM 발송 실패

**증상:** Functions 로그에 "해당 사용자에게 등록된 FCM 토큰이 없습니다" 메시지

**해결:**
1. 친구의 FCM 토큰이 Firestore에 저장되었는지 확인
   - Firebase Console > Firestore > `users/{친구_userId}`
   - `fcmTokens` 배열 확인

2. 친구가 알림 권한을 허용했는지 재확인

3. 친구에게 다시 로그인 요청
   - 로그아웃 후 재로그인하면 FCM 토큰이 새로 생성됨

### 문제 4: 여전히 404 에러가 발생

**증상:** Functions 로그에 계속 `/batch was not found` 에러

**해결:**
1. **가장 중요!** 다음 명령어로 Functions 완전 재배포:
   ```bash
   # 기존 Functions 삭제
   firebase functions:delete sendShareNotification
   
   # Functions 재배포
   firebase deploy --only functions
   ```

2. Firebase 프로젝트를 Blaze 플랜으로 업그레이드 확인
   - Spark (무료) 플랜에서는 외부 API 호출이 제한될 수 있음
   - https://console.firebase.google.com/project/cloud-memo-v2/usage

3. Google Cloud Billing 활성화 확인
   - https://console.cloud.google.com/billing?project=cloud-memo-v2
   - 결제 계정이 연결되어 있는지 확인

## 참고

- FCM API 활성화는 **무료**입니다
- Firebase Spark (무료) 플랜에서도 사용 가능합니다
- API 할당량: 기본적으로 충분히 높게 설정되어 있습니다 (일일 수백만 건)
