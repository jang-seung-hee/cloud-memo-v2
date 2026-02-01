# ✅ FCM 발송 방식 변경 완료!

## 🔧 변경 사항

### 문제 원인
- `sendMulticast()` 메서드가 `/batch` 엔드포인트를 사용
- 이 엔드포인트에 접근할 수 없어서 404 에러 발생
- Firebase 프로젝트 설정 또는 API 활성화 문제로 추정

### 해결 방법
**배치 발송 방식에서 개별 발송 방식으로 변경**

#### 이전 코드 (sendMulticast):
```javascript
const message = {
    notification: {...},
    data: {...},
    tokens: tokens,  // 여러 토큰을 한 번에
};
const response = await admin.messaging().sendMulticast(message);
// → /batch 엔드포인트 사용 → 404 에러!
```

#### 변경된 코드 (개별 send):
```javascript
const sendPromises = tokens.map(token => {
    const message = {
        notification: {...},
        data: {...},
        token: token,  // 각 토큰마다 개별 요청
    };
    return admin.messaging().send(message);
});
const results = await Promise.allSettled(sendPromises);
// → 개별 엔드포인트 사용 → /batch 우회!
```

### 장점
- ✅ `/batch` 엔드포인트를 사용하지 않음
- ✅ API 활성화 문제 우회
- ✅ 각 토큰별로 더 상세한 에러 로그
- ✅ 실패한 토큰만 정확히 식별 가능

### 배포 완료
```
+  functions[sendShareNotification(us-central1)] Successful update operation.
+  Deploy complete!
```

---

## 🎯 테스트 방법

### 1. 2-3분 대기
Functions 배포가 완전히 적용될 때까지 대기

### 2. 메모 공유 테스트
1. 메모 작성
2. 공유 설정에서 친구 추가
3. 저장

### 3. 로그 확인
```powershell
firebase functions:log
```

**이제 성공 로그가 나타날 것입니다:**
```
알림 트리거 발생: { ... }
FCM 토큰 수: 1
메시지 발송 시도 (token): dXpqR3ZwN2xRYm5sOTc...
발송 성공: dXpqR3ZwN2xRYm5sOTc...
FCM 발송 결과: 1 성공 / 0 실패
Function execution took 800 ms, finished with status: 'ok'
```

**더 이상 404 에러가 나타나지 않습니다!**

---

## 📱 친구가 알림을 받으려면

Functions가 성공해도 친구가 알림을 못 받을 수 있습니다:

### 체크리스트:

1. **친구가 로그인했는지**
   - FCM 토큰은 로그인 시 등록됨

2. **친구가 알림 권한을 허용했는지**
   - 브라우저 주소창 자물쇠 > "알림" > "허용"

3. **FCM 토큰이 Firestore에 저장되었는지**
   - Firebase Console > Firestore Database
   - `users/{친구_userId}` 문서
   - `fcmTokens` 배열에 토큰 존재 확인

4. **Service Worker가 등록되었는지** (PWA)
   - F12 > Application 탭 > Service Workers
   - `firebase-messaging-sw.js` 확인

5. **친구의 브라우저 콘솔 확인**
   - F12 > Console
   - "FCM 토큰 저장 완료" 메시지 확인

---

## 💡 왜 이 방법이 작동하는가?

### sendMulticast (배치 방식)
- 한 번의 HTTP 요청으로 여러 토큰에 발송
- FCM v1 API의 `/batch` 엔드포인트 사용
- **문제**: `/batch` 엔드포인트에 접근 불가 → 404 에러

### send (개별 방식)
- 각 토큰마다 별도의 HTTP 요청
- FCM v1 API의 기본 엔드포인트 사용
- **해결**: 기본 엔드포인트는 정상 작동!

**성능 차이:**
- 배치: 1000개 토큰 → 1개 요청 (빠름)
- 개별: 1000개 토큰 → 1000개 요청 (느림)

**하지만:**
- 개인 프로젝트에서는 동시에 수십 명에게 알림을 보낼 일이 거의 없음
- 보통 1-5개 토큰 정도만 처리하므로 성능 차이 무시 가능

---

## 🔍 추가 디버깅

### 여전히 에러가 발생하는 경우

1. **Functions 로그 전체 확인**
   ```powershell
   firebase functions:log > debug-log.txt
   ```

2. **Firestore에서 알림 문서 확인**
   - Firebase Console > Firestore Database
   - `notifications` 컬렉션에 새 문서가 생성되는지
   - 생성되지 않으면: 프론트엔드 코드 문제

3. **친구의 userId 확인**
   - 공유 설정에서 올바른 사용자를 선택했는지
   - Firestore에서 해당 userId가 존재하는지

---

## 🎉 기대되는 결과

이제 다음과 같이 작동해야 합니다:

1. ✅ 메모 공유 시 Firestore `notifications` 컬렉션에 문서 생성
2. ✅ Functions가 트리거됨
3. ✅ 친구의 FCM 토큰 조회 성공
4. ✅ 각 토큰에 개별적으로 메시지 발송 성공
5. ✅ 친구의 폰/브라우저에 푸시 알림 표시

**테스트를 해보시고 결과를 알려주세요!** 🚀
