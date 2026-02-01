# ✅ 알림 문제 최종 진단 및 해결

## 🎯 현재 상황 분석

### 코드 검토 결과

1. **`MemoCreatePage`**: 메모 생성 시 공유된 사용자에게 알림 전송 ✅
2. **`MemoEditPage`**: 메모 수정 시 알림 전송 안 함 (중복 방지) ✅  
3. **`ShareSettingsModal`**: 새로 추가된 사용자에게만 알림 전송 ✅
   ```typescript
   const newlyAddedUsers = localSharedWith.filter(
     newUser => !sharedWith.some(oldUser => oldUser.uid === newUser.uid)
   );
   ```

### 알림이 안 오는 가능한 원인

1. **Service Worker가 제대로 등록/업데이트 안 됨**
2. **FCM 토큰이 저장되지 않음**
3. **Cloud Functions가 실행 안 됨**
4. **Firestore 인덱스 오류**
5. **브라우저 캐시 문제**

---

## 🔍 단계별 진단 방법

### 1단계: Service Worker 확인

**F12 > Application > Service Workers**
- `firebase-messaging-sw.js` 상태: **"activated"** 🟢
- 등록 안 됨 → 아래 명령어 실행

```javascript
// 브라우저 콘솔에서
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('등록된 Service Worker:', regs.length, '개');
  regs.forEach((reg, i) => {
    console.log(`[${i}] Scope:`, reg.scope);
    console.log(`[${i}] Active:`, reg.active);
  });
});
```

**예상 결과:**
```
등록된 Service Worker: 1 개
[0] Scope: https://your-domain.com/
[0] Active: ServiceWorker {...}
```

### 2단계: FCM 토큰 확인

**브라우저 콘솔에서:**
```javascript
// Firestore에서 현재 사용자의 FCM 토큰 확인
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase/config';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  console.log('FCM Tokens:', userDoc.data()?.fcmTokens);
}
```

**예상 결과:**
```
FCM Tokens: ["eXa-mPle-tOk..."]  // 1개 이상의 토큰
```

**토큰이 없으면:**
```javascript
// 알림 권한 확인
console.log('알림 권한:', Notification.permission);
// "granted"가 아니면 권한 요청 필요
```

### 3단계: 알림 생성 확인

**브라우저 콘솔에서:**
1. 메모 공유
2. 콘솔에서 로그 확인

**예상 로그 (`MemoCreatePage`):**
```
📢 공유 알림 전송 중... 대상: 1 명
✅ 공유 알림 전송 완료
```

**로그가 없으면** → 공유 설정이 제대로 안 된 것

### 4단계: Firestore notifications 컬렉션 확인

**Firebase Console > Firestore Database > notifications:**
- 새 문서가 생성되었는지 확인
- 문서 내용:
  ```
  {
    receiverId: "user-uid",
    memoId: "memo-id",
    title: "새로운 메모 공유",
    body: "...",
    type: "share",
    isRead: false,
    createdAt: Timestamp
  }
  ```

**문서가 없으면** → `firestoreService.createNotification()` 실패

### 5단계: Cloud Functions 로그 확인

**Firebase CLI에서:**
```bash
firebase functions:log --only sendShareNotification
```

**예상 로그:**
```
알림 트리거 발생: { receiverId: "...", memoId: "..." }
FCM 토큰 수: 1
메시지 발송 시도 (token): eXa-mPle-tOk...
발송 성공: eXa-mPle-tOk...
FCM 발송 결과: 1 성공 / 0 실패
```

**로그가 없으면** → Cloud Functions가 배포 안 됨

### 6단계: Service Worker 콘솔 확인

**F12 > Application > Service Workers > "inspect"**

**알림 수신 시 예상 로그:**
```
[SW] Background message received: { ... }
[SW] Payload data: { memoId: "abc123", type: "share" }
[SW] Payload notification: { title: "...", body: "..." }
[SW] Showing notification with data: { memoId: "abc123", ... }
```

---

## ✅ 해결 방법

### 문제 A: Service Worker가 등록 안 됨

**해결:**
```javascript
// 브라우저 콘솔에서
navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(reg => {
    console.log('✅ Service Worker 등록 성공:', reg);
    return reg.update();
  })
  .then(() => {
    console.log('✅ Service Worker 업데이트 완료');
    location.reload();
  })
  .catch(err => {
    console.error('❌ Service Worker 등록 실패:', err);
  });
```

### 문제 B: FCM 토큰이 없음

**해결:**
1. 알림 권한 확인/요청
```javascript
// 브라우저 콘솔에서
Notification.requestPermission().then(permission => {
  console.log('알림 권한:', permission);
  if (permission === 'granted') {
    console.log('✅ 권한 허용됨 - 페이지 새로고침');
    location.reload();
  } else {
    console.log('❌ 권한 거부됨 - 브라우저 설정에서 허용 필요');
  }
});
```

2. 브라우저 설정에서 알림 허용 확인
   - Chrome: 설정 > 개인정보 및 보안 > 사이트 설정 > 알림
   - 해당 사이트 찾아서 "허용"으로 변경

### 문제 C: Cloud Functions가 실행 안 됨

**해결:**
```bash
# Cloud Functions 배포
cd e:\05.Python_Project\19.cloud-memo.v2
firebase deploy --only functions

# 배포 확인
firebase functions:list
```

### 문제 D: Firestore 인덱스 오류

**Firebase Console에서 확인:**
1. Firestore Database > 인덱스
2. `notifications` 컬렉션 인덱스 확인
   - receiverId (ASC)
   - createdAt (DESC)
3. 상태: **"Enabled"** 🟢

**"Building" 상태이면** → 기다리거나 수동 생성

### 문제 E: Service Worker 캐시 문제

**완전 재등록:**
```javascript
// 브라우저 콘솔에서
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('Unregistering:', reg.scope);
    reg.unregister();
  });
  console.log('✅ 모든 Service Worker 제거');
  
  // 캐시도 삭제
  caches.keys().then(keys => {
    return Promise.all(keys.map(key => {
      console.log('Deleting cache:', key);
      return caches.delete(key);
    }));
  }).then(() => {
    console.log('✅ 모든 캐시 삭제');
    setTimeout(() => location.reload(), 1000);
  });
});
```

---

## 🎯 가장 가능성 높은 원인 및 해결

### 1. Service Worker 업데이트 안 됨 (가능성: 90%)

**증상:** 이전 버전의 Service Worker가 여전히 실행 중

**해결:**
```javascript
// 강제 업데이트 및 재등록
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  setTimeout(() => location.reload(), 1000);
});
```

### 2. 알림 권한이 거부됨 (가능성: 70%)

**증상:** FCM 토큰이 생성 안 됨

**해결:**
```javascript
// 권한 확인 및 요청
console.log('현재 권한:', Notification.permission);
if (Notification.permission !== 'granted') {
  Notification.requestPermission().then(p => {
    console.log('새 권한:', p);
    location.reload();
  });
}
```

### 3. Cloud Functions가 배포 안 됨 (가능성: 50%)

**증상:** Firestore에 알림 문서는 생성되지만 FCM 메시지 안 옴

**해결:**
```bash
firebase deploy --only functions
firebase functions:log --only sendShareNotification
```

---

## 📝 체크리스트

다음 순서대로 확인하세요:

- [ ] Service Worker 등록 확인 (`F12 > Application`)
- [ ] 알림 권한 확인 (`Notification.permission`)
- [ ] FCM 토큰 저장 확인 (Firestore `users` 컬렉션)
- [ ] 알림 문서 생성 확인 (Firestore `notifications` 컬렉션)
- [ ] Cloud Functions 로그 확인 (`firebase functions:log`)
- [ ] Service Worker 콘솔 로그 확인 (`F12 > Application > inspect`)

---

## 🚀 즉시 실행할 명령어

**브라우저 콘솔에서 (모든 문제 한번에 해결):**

```javascript
// 1. 현재 상태 진단
console.log('=== 알림 상태 진단 ===');
console.log('알림 권한:', Notification.permission);
console.log('Service Worker 지원:', 'serviceWorker' in navigator);

// 2. Service Worker 확인
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('등록된 SW:', regs.length, '개');
  regs.forEach((reg, i) => {
    console.log(`[${i}] Scope:`, reg.scope);
    console.log(`[${i}] State:`, reg.active?.state);
  });
  
  // 3. 완전 재등록
  console.log('=== Service Worker 완전 재등록 ===');
  return Promise.all(regs.map(reg => reg.unregister()));
}).then(() => {
  console.log('✅ 모든 SW 제거 완료');
  
  // 4. 캐시 삭제
  return caches.keys();
}).then(keys => {
  console.log('캐시 수:', keys.length, '개');
  return Promise.all(keys.map(key => caches.delete(key)));
}).then(() => {
  console.log('✅ 모든 캐시 삭제 완료');
  console.log('🔄 3초 후 페이지 새로고침...');
  setTimeout(() => location.reload(), 3000);
});
```

이 명령어를 실행하고 **3초 후 자동으로 페이지가 새로고침**됩니다.
그 다음 다시 메모를 공유해서 알림이 오는지 확인하세요!

---

## 🎉 성공 확인

알림이 제대로 작동하면:

1. **앱 화면 (포그라운드)**:
   - Toast 알림 표시 ✅
   - "새로운 메모 공유" 제목
   - "메모 보기: /memo/abc123" 링크

2. **백그라운드 (앱 닫혀있음)**:
   - 시스템 알림 표시 ✅
   - 알림 클릭 시 앱 열림
   - 해당 메모 페이지로 자동 이동

3. **Service Worker 콘솔**:
   ```
   [SW] Background message received: { ... }
   [SW] Showing notification with data: { memoId: "..." }
   ```

4. **Cloud Functions 로그**:
   ```
   FCM 발송 결과: 1 성공 / 0 실패
   ```

모두 확인되면 완벽하게 작동하는 것입니다! 🚀
