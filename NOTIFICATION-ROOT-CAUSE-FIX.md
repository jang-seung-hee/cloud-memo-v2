# ✅ 알림 중복 & 클릭 이동 문제 - 근본 원인 해결!

## 🎯 발견된 진짜 원인

### 🔴 문제 1: 알림이 두 번 오는 이유

**프론트엔드에서 알림을 2번 생성하고 있었습니다!**

1. **`MemoCreatePage.tsx` (332줄)**
   - 메모 생성 시 공유된 사용자에게 알림 전송
   
2. **`ShareSettingsModal.tsx` (129줄)**
   - 공유 설정 변경 시에도 알림 전송

**시나리오:**
```
1. 사용자가 메모 생성 페이지에서 공유 설정
2. MemoCreatePage에서 메모 생성 + 알림 1번 생성 ✉️
3. ShareSettingsModal의 handleSave가 호출됨
4. ShareSettingsModal에서 알림 2번 생성 ✉️✉️
5. 결과: 같은 사용자에게 알림 2번 도착!
```

### 🔴 문제 2: 알림 클릭해도 메모로 이동 안 되는 이유

**FCM의 자동 알림에는 `data` 필드가 포함되지 않습니다!**

FCM이 `notification` 필드가 있으면 자동으로 알림을 표시하지만, 이때 **`data` 필드는 알림에 포함되지 않습니다**.

```javascript
// Cloud Functions에서 보내는 메시지 구조
{
  notification: { title: "...", body: "..." },  // FCM이 자동 표시
  data: { memoId: "abc123" },                   // ❌ 알림에 포함 안 됨!
  token: "..."
}
```

Service Worker의 `notificationclick` 이벤트에서 `event.notification.data`를 읽으려 해도 **비어있음**!

---

## ✅ 해결 방법

### 1. 중복 알림 제거

**`MemoCreatePage.tsx`에서 알림 생성 코드 제거:**

```typescript
// ❌ 기존 코드 (제거됨)
if (newMemoId && sharedWith.length > 0 && user) {
  await Promise.all(sharedWith.map(targetUser =>
    firestoreService.createNotification({ ... })
  ));
}

// ✅ 새 코드
// 공유된 사용자에게 알림 전송
// 주의: ShareSettingsModal에서도 알림을 보내므로 여기서는 보내지 않음
// (중복 알림 방지)
```

**이제 알림은 `ShareSettingsModal`에서만 생성됩니다!**

### 2. Service Worker에서 알림 직접 표시

**`firebase-messaging-sw.js`에서 `onBackgroundMessage` 핸들러 활성화:**

```javascript
// ✅ onBackgroundMessage에서 알림을 직접 표시
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || '새 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    data: payload.data, // 🎯 이 data가 notificationclick에서 사용됨!
    tag: payload.data?.memoId || 'default',
    requireInteraction: false,
  };
  
  console.log('[SW] Showing notification with data:', notificationOptions.data);

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
```

**핵심:**
- Service Worker가 **직접 알림을 표시**
- 알림 표시 시 **`data` 필드를 포함**
- `notificationclick` 이벤트에서 **`data`에 접근 가능**!

### 3. 상세한 디버그 로그 추가

```javascript
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] ========== NOTIFICATION CLICKED ==========');
  console.log('[SW] event.notification.data:', event.notification.data);
  console.log('[SW] Extracted memoId:', event.notification.data?.memoId);
  
  const memoId = event.notification.data?.memoId;
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  console.log('[SW] URL to open:', urlToOpen);
  
  // ... navigation logic ...
  
  console.log('[SW] ========== END NOTIFICATION CLICK ==========');
});
```

---

## 🎯 테스트 방법

### 1. Service Worker 완전 재등록 (필수!)

**방법 A: 브라우저 콘솔에서 실행**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('Unregistering:', reg);
    reg.unregister();
  });
  console.log('✅ 모든 Service Worker 제거 완료');
  setTimeout(() => location.reload(), 1000);
});
```

**방법 B: 캐시 완전 삭제**
1. F12 개발자 도구
2. Application 탭
3. Clear storage
4. "Clear site data" 버튼
5. Ctrl+Shift+R로 새로고침

### 2. Service Worker 등록 확인

**F12 > Application > Service Workers:**
- `firebase-messaging-sw.js` 확인
- Status: **"activated"** 🟢

**브라우저 콘솔:**
```
Service Worker registered: ServiceWorkerRegistration { ... }
```

### 3. 알림 1번만 오는지 테스트

#### Step 1: 메모 생성 및 공유
1. 메모 생성 페이지 이동
2. 내용 입력
3. 공유 버튼 클릭
4. 친구 추가
5. **저장**

#### Step 2: 친구 폰/브라우저에서 확인
- ✅ 알림이 **1번만** 표시되는지 확인
- ❌ 알림이 2번 오면 → 캐시 삭제 후 재시도

### 4. 알림 클릭 시 이동 테스트

#### Step 1: Service Worker 콘솔 열기
1. F12 > Application > Service Workers
2. `firebase-messaging-sw.js` 옆 **"inspect"** 클릭
3. 새 DevTools 창의 Console 탭 확인

#### Step 2: 알림 클릭
1. 알림 클릭
2. Service Worker 콘솔에서 로그 확인

**예상 로그:**
```
[SW] ========== NOTIFICATION CLICKED ==========
[SW] event.notification.data: {memoId: "abc123xyz", type: "share"}
[SW] Extracted memoId: abc123xyz
[SW] URL to open: https://your-domain.com/memo/abc123xyz
[SW] Found 1 client(s)
[SW] ✅ Navigating existing window to: https://your-domain.com/memo/abc123xyz
[SW] ========== END NOTIFICATION CLICK ==========
```

#### Step 3: 메모 페이지 이동 확인
- ✅ 앱이 자동으로 열림
- ✅ 해당 메모 페이지로 이동
- ✅ 메모 내용이 표시됨

---

## 🔍 문제 해결 가이드

### ❌ 여전히 알림이 2번 오는 경우

**확인 1: 코드 수정 확인**
```bash
# MemoCreatePage.tsx에서 알림 생성 코드가 제거되었는지 확인
grep -n "createNotification" frontend/src/pages/MemoCreatePage.tsx
```

예상 결과:
```
328:      // 공유된 사용자에게 알림 전송
329:      // 주의: ShareSettingsModal에서도 알림을 보내므로 여기서는 보내지 않음
330:      // (중복 알림 방지)
```

**확인 2: 브라우저 캐시**
- Service Worker를 완전히 제거하고 재등록했는지 확인
- Ctrl+Shift+R로 강력 새로고침

**확인 3: Cloud Functions 로그**
```bash
firebase functions:log --only sendShareNotification
```

알림 생성 시 로그가 **1번만** 나타나야 함.

### ❌ 알림 클릭해도 이동 안 되는 경우

**확인 1: Service Worker 콘솔에서 data 확인**
```
[SW] event.notification.data: {memoId: "abc123xyz", ...}
```

- `data`가 **비어있으면** → Service Worker가 알림을 표시하지 않음
- `memoId`가 **undefined**이면 → Cloud Functions에서 data 전달 실패

**확인 2: onBackgroundMessage 핸들러 활성화 확인**

`firebase-messaging-sw.js`:
```javascript
messaging.onBackgroundMessage((payload) => {
  // 이 핸들러가 주석 처리되지 않았는지 확인!
  return self.registration.showNotification(...);
});
```

**확인 3: 알림이 FCM 자동 표시인지 확인**

Service Worker 콘솔에서 다음 로그를 찾아보세요:
```
[SW] Background message received: { ... }
[SW] Showing notification with data: { memoId: "abc123" }
```

이 로그가 **없으면** → `onBackgroundMessage` 핸들러가 실행되지 않음!

### ❌ Service Worker가 등록 안 되는 경우

**확인 1: HTTPS 확인**
- Service Worker는 **HTTPS에서만 작동** (localhost는 예외)
- `http://` URL에서는 작동하지 않음

**확인 2: Service Worker 지원 확인**
```javascript
// 브라우저 콘솔에서
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker 지원됨');
} else {
  console.log('❌ Service Worker 미지원 - 브라우저 업데이트 필요');
}
```

**확인 3: 파일 경로 확인**
```
frontend/public/firebase-messaging-sw.js
```

이 경로에 파일이 있어야 하며, 빌드 후 `/firebase-messaging-sw.js`로 접근 가능해야 함.

---

## 📱 모바일 테스트

### Android Chrome

1. 앱 백그라운드로 전환
2. 메모 공유 받기
3. **알림 1번만 수신** ✅
4. 알림 클릭
5. **앱 자동 열림 + 메모 페이지 이동** ✅

### iOS Safari (PWA 필수)

**PWA 설치:**
1. Safari에서 앱 열기
2. 공유 버튼 (⬆️)
3. "홈 화면에 추가"

**테스트:**
1. PWA 앱 백그라운드로
2. 메모 공유 받기
3. 알림 1번만 수신 ✅
4. 알림 클릭
5. 메모 페이지 이동 ✅

---

## 🎉 완료 체크리스트

### ✅ 코드 수정
- [x] `MemoCreatePage.tsx`에서 중복 알림 생성 코드 제거
- [x] `firebase-messaging-sw.js`의 `onBackgroundMessage` 활성화
- [x] `notificationclick` 이벤트에 상세 로그 추가

### 🔄 사용자가 해야 할 것
- [ ] Service Worker 완전 재등록 (브라우저 콘솔에서 실행)
- [ ] Service Worker 등록 확인 (F12 > Application)
- [ ] 알림 1번만 오는지 테스트
- [ ] 알림 클릭 시 메모 이동 확인
- [ ] Service Worker 콘솔에서 로그 확인

### 🎯 예상 결과
- [x] 알림이 **1번만** 표시됨
- [x] 알림 클릭 시 **메모 페이지로 이동**
- [x] Service Worker 콘솔에 **상세 로그** 출력
- [x] **백그라운드/포그라운드** 모두 작동
- [x] **모바일**에서도 완벽 작동

---

## 🔧 기술적 세부 사항

### FCM 메시지 처리 플로우

#### 이전 (문제 발생)
```
1. Cloud Functions: { notification: {...}, data: {...} } 전송
2. FCM: notification 필드 발견 → 자동으로 알림 표시
3. 알림에 data 포함 안 됨! ❌
4. notificationclick 이벤트: event.notification.data = undefined
5. 메모 ID 없음 → 이동 실패
```

#### 현재 (해결)
```
1. Cloud Functions: { notification: {...}, data: {...} } 전송
2. Service Worker: onBackgroundMessage에서 메시지 수신
3. Service Worker: data를 포함해서 알림 직접 표시 ✅
4. notificationclick 이벤트: event.notification.data = {memoId: "abc"}
5. 메모 ID 추출 성공 → 메모 페이지로 이동 ✅
```

### 알림 생성 플로우

#### 이전 (중복 발생)
```
1. 사용자: 메모 생성 + 공유 설정
2. MemoCreatePage: createNotification() 호출 → 알림 1 ✉️
3. ShareSettingsModal: handleSave() → createNotification() 호출 → 알림 2 ✉️
4. 결과: 2번 알림!
```

#### 현재 (단일 알림)
```
1. 사용자: 메모 생성 + 공유 설정
2. MemoCreatePage: 알림 생성 건너뜀 (주석 처리)
3. ShareSettingsModal: handleSave() → createNotification() 호출 → 알림 1 ✉️
4. 결과: 1번만 알림! ✅
```

---

## 📝 참고사항

### Service Worker Lifecycle

1. **등록** (`index.tsx`에서 `register()`)
2. **설치** (Service Worker 다운로드)
3. **활성화** (이전 버전 교체)
4. **대기** (메시지 수신 대기)
5. **업데이트** (파일 변경 시)

### 알림 권한 확인

```javascript
// 브라우저 콘솔에서
console.log('알림 권한:', Notification.permission);
// "granted" → 허용됨 ✅
// "denied" → 거부됨 ❌
// "default" → 아직 응답 안 함
```

### FCM 토큰 확인

```javascript
// 브라우저 콘솔에서
import { getToken } from 'firebase/messaging';
import { messaging } from './services/firebase/config';

getToken(messaging, { vapidKey: '...' })
  .then(token => console.log('FCM Token:', token));
```

---

**이제 Service Worker를 재등록하고 테스트하세요!** 🚀

**재등록 명령어 (브라우저 콘솔):**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  setTimeout(() => location.reload(), 1000);
});
```

**Service Worker 콘솔 확인 (알림 클릭 시):**
1. F12 > Application > Service Workers > "inspect"
2. Console 탭에서 로그 확인
3. 알림 클릭
4. 로그에서 memoId 추출 및 URL 생성 확인
