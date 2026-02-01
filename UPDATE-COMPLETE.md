# ✅ Functions 업데이트 완료!

## 변경 사항

### 1. Firebase Admin SDK 업데이트
- **이전**: firebase-admin@11.0.0
- **이후**: firebase-admin@12.0.0 ✅

### 2. Firebase Functions SDK 업데이트
- **이전**: firebase-functions@4.0.0
- **이후**: firebase-functions@5.0.0 ✅

### 3. 프로젝트 ID 명시적 지정
```javascript
admin.initializeApp({
    projectId: 'cloud-memo-v2'
});
```

### 4. Functions 재배포 완료
```
+  functions[sendShareNotification(us-central1)] Successful update operation.
+  Deploy complete!
```

---

## 🎯 다음 단계

### ⚡ 필수 API 활성화 확인

**방법 1: 자동 스크립트 실행 (가장 빠름)**

터미널에서 실행:
```cmd
cd e:\05.Python_Project\19.cloud-memo.v2
activate-fcm-apis.bat
```

이 스크립트가 자동으로:
- Firebase Management API 활성화 페이지 열기
- Firebase Cloud Messaging API 활성화 페이지 열기
- Cloud Messaging 설정 페이지 열기
- IAM 권한 확인 페이지 열기

**방법 2: 수동으로 확인**

다음 링크들을 하나씩 열어서 확인:

1. **Firebase Management API** (가장 중요!)
   ```
   https://console.cloud.google.com/apis/library/firebase.googleapis.com?project=cloud-memo-v2
   ```
   → "API 사용 설정됨" 확인 또는 "사용 설정" 클릭

2. **Firebase Cloud Messaging API**
   ```
   https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=cloud-memo-v2
   ```
   → "API 사용 설정됨" 확인 또는 "사용 설정" 클릭

3. **Cloud Messaging API (V1)**
   ```
   https://console.firebase.google.com/project/cloud-memo-v2/settings/cloudmessaging
   ```
   → "Cloud Messaging API (V1)" 섹션에서 "사용 설정됨" 확인

4. **서비스 계정 권한**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=cloud-memo-v2
   ```
   → `cloud-memo-v2@appspot.gserviceaccount.com` 찾기
   → "Cloud Messaging 관리자" 역할 확인

---

## ⏰ 테스트

### 1. 5-10분 대기
API 활성화가 Google Cloud 인프라에 전파되는 시간입니다.

### 2. 브라우저 새로고침
Ctrl+Shift+R (Windows) 또는 Cmd+Shift+R (Mac)

### 3. 메모 공유 테스트
1. 메모 작성
2. 공유 설정에서 친구 추가
3. 저장

### 4. 로그 확인
```powershell
firebase functions:log
```

**성공 시 로그:**
```
알림 트리거 발생: { type: 'share', ... }
메시지 발송 시도: { notification: {...}, tokens: [...] }
FCM 발송 결과: 1 성공 / 0 실패
Function execution took 500 ms, finished with status: 'ok'
```

**실패 시 (404 에러 계속 발생):**
```
messaging/unknown-error
The requested URL /batch was not found
```
→ API가 아직 활성화되지 않았거나 충분히 대기하지 않음

---

## 🔍 추가 디버깅

### 친구가 알림을 못 받는 경우 (Functions는 성공)

1. **FCM 토큰 확인**
   - Firebase Console > Firestore Database
   - `users/{친구_userId}` 문서
   - `fcmTokens` 배열에 토큰이 있는지 확인

2. **친구의 알림 권한 확인**
   - 브라우저 주소창 왼쪽 자물쇠 아이콘
   - "알림" 권한이 "허용"인지 확인

3. **Service Worker 확인**
   - F12 > Application 탭
   - Service Workers 섹션
   - `firebase-messaging-sw.js` 등록 확인

---

## 💡 핵심 요약

### 완료된 작업:
✅ Firebase Admin SDK 12.0.0으로 업데이트
✅ Firebase Functions SDK 5.0.0으로 업데이트
✅ 프로젝트 ID 명시적 지정
✅ Functions 재배포 완료

### 남은 작업:
🔲 3개 필수 API 활성화 확인
🔲 서비스 계정 권한 확인
🔲 5-10분 대기
🔲 테스트

---

## 🆘 여전히 안 되는 경우

다음 정보를 확인해주세요:

1. **API 대시보드 스크린샷**
   ```
   https://console.cloud.google.com/apis/dashboard?project=cloud-memo-v2
   ```
   - 활성화된 API 목록 확인

2. **Functions 로그**
   ```powershell
   firebase functions:log > logs.txt
   ```

3. **Firestore 데이터**
   - `notifications` 컬렉션에 문서가 생성되는지
   - `users/{친구_userId}`에 `fcmTokens`가 있는지

위 정보를 공유하면 추가 지원이 가능합니다.
