# ✅ 알림 중복 & 클릭 이동 문제 완벽 해결!

## 🔴 발견된 문제들

### 1. 알림이 두 번 오는 문제
- **원인**: Service Worker의 `onBackgroundMessage` 핸들러가 알림을 표시
- **동시에**: FCM이 자동으로도 알림을 표시
- **결과**: 같은 알림이 2번 표시됨!

### 2. 알림 클릭해도 메모로 이동 안 되는 문제
- **원인 1**: Service Worker의 Firebase 설정이 URL 파라미터에서 읽도록 되어있었지만 실제로는 전달되지 않음
- **원인 2**: `event.notification.data`가 올바르게 파싱되지 않음
- **원인 3**: 로그가 부족해서 디버깅 어려움

---

## ✅ 해결 방법

### 1. 중복 알림 제거

`frontend/public/firebase-messaging-sw.js`에서:

```javascript
// ❌ 제거됨 - onBackgroundMessage 핸들러
// FCM이 자동으로 알림을 표시하므로 중복 방지
// messaging.onBackgroundMessage((payload) => { ... });
```

**FCM의 기본 동작:**
- `notification` 필드가 있으면 **자동으로 알림 표시**
- 수동으로 `showNotification()` 호출하면 **중복 발생**

### 2. Firebase Config 하드코딩

Service Worker는 URL 파라미터를 받지 못하므로 직접 설정:

```javascript
firebase.initializeApp({
  apiKey: "AIzaSyCJ-wvDcTuVIDUiFEv6Fvq0YvUJ90LxnPo",
  authDomain: "cloud-memo-v2.firebaseapp.com",
  projectId: "cloud-memo-v2",
  storageBucket: "cloud-memo-v2.firebasestorage.app",
  messagingSenderId: "970334935244",
  appId: "1:970334935244:web:0eb10e464edd9f7c6e7f3b"
});
```

### 3. 알림 클릭 핸들러 강화

더 자세한 로그 추가 및 데이터 파싱 개선:

```javascript
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  
  event.notification.close();
  
  // 데이터 안전하게 추출
  const data = event.notification.data || {};
  const memoId = data.memoId;
  
  console.log('[firebase-messaging-sw.js] Extracted memoId:', memoId);
  console.log('[firebase-messaging-sw.js] Full data:', data);
  
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  console.log('[firebase-messaging-sw.js] Opening URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[firebase-messaging-sw.js] Found clients:', clientList.length);
        
        // 1. 이미 열린 URL 찾기
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[firebase-messaging-sw.js] Found exact match, focusing');
            return client.focus();
          }
        }
        
        // 2. 같은 origin 창에서 이동
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
            console.log('[firebase-messaging-sw.js] Navigating existing window to:', urlToOpen);
            return client.navigate(urlToOpen).then(client => client.focus());
          }
        }
        
        // 3. 새 창 열기
        if (clients.openWindow) {
          console.log('[firebase-messaging-sw.js] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[firebase-messaging-sw.js] Error handling notification click:', error);
      })
  );
});
```

---

## 🎯 테스트 방법

### 1. Service Worker 완전 재등록 (필수!)

**방법 1: 브라우저 캐시 삭제**
1. `F12` 개발자 도구 열기
2. `Application` 탭
3. `Clear storage` 섹션
4. `Clear site data` 버튼 클릭
5. 페이지 새로고침 (`Ctrl+Shift+R`)

**방법 2: Service Worker 수동 제거**
```javascript
// 브라우저 콘솔에서 실행
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => {
    console.log('Unregistering:', reg);
    reg.unregister();
  });
  console.log('모든 Service Worker 제거 완료!');
  setTimeout(() => {
    location.reload();
  }, 1000);
});
```

### 2. Service Worker 등록 확인

**F12 > Application 탭:**
- **Service Workers** 섹션
- `firebase-messaging-sw.js` 확인
- **Status**: "activated" 🟢

**콘솔 로그:**
```
Service Worker registered: ServiceWorkerRegistration { ... }
```

### 3. 알림 테스트

#### Step 1: 메모 공유
1. 메모 열기
2. 공유 버튼 클릭
3. 친구 이메일 입력
4. 권한 설정 (읽기/수정)
5. 저장

#### Step 2: 알림 수신 확인
**친구 폰/브라우저에서:**
- ✅ 알림이 **1번만** 표시되는지 확인
- ✅ 알림 내용: "새로운 메모 공유", "Seung hee님이 메모를 공유했습니다"

#### Step 3: 알림 클릭 테스트
1. 알림 클릭
2. **앱이 자동으로 열림**
3. **해당 메모 페이지(`/memo/{memoId}`)로 이동**
4. **메모 내용이 표시됨** ✅

---

## 🔍 디버깅 가이드

### Service Worker 콘솔 확인

1. **F12 > Application 탭**
2. **Service Workers** 섹션에서 `firebase-messaging-sw.js` 찾기
3. **"inspect"** 링크 클릭
4. **새 DevTools 창 > Console 탭**

### 예상 로그 (알림 클릭 시)

```
[firebase-messaging-sw.js] Notification clicked: Notification { ... }
[firebase-messaging-sw.js] Extracted memoId: abc123xyz
[firebase-messaging-sw.js] Full data: { memoId: "abc123xyz", type: "share" }
[firebase-messaging-sw.js] Opening URL: https://your-domain.com/memo/abc123xyz
[firebase-messaging-sw.js] Found clients: 1
[firebase-messaging-sw.js] Navigating existing window to: https://your-domain.com/memo/abc123xyz
```

### 문제 해결

#### 1. 여전히 알림이 2번 오는 경우

**확인 사항:**
- Service Worker가 제대로 업데이트 되었는지 확인
- `onBackgroundMessage` 핸들러가 주석 처리되었는지 확인

**해결:**
```javascript
// 브라우저 콘솔에서
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update());
  console.log('Service Worker 강제 업데이트 완료');
});
```

#### 2. 알림 클릭해도 이동 안 되는 경우

**Service Worker 콘솔 확인:**
- `memoId`가 올바르게 추출되는지 확인
- `Opening URL:` 로그에서 URL이 올바른지 확인

**데이터가 없는 경우:**
```
[firebase-messaging-sw.js] Extracted memoId: undefined
```

**Cloud Functions 확인 (`functions/index.js`):**
```javascript
data: {
  memoId: notification.memoId || '',  // 이 부분 확인
  type: notification.type || 'system',
},
```

#### 3. Service Worker가 등록 안 되는 경우

**브라우저 콘솔 확인:**
```javascript
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker 지원됨');
} else {
  console.log('❌ Service Worker 미지원');
}
```

**HTTPS 확인:**
- Service Worker는 **HTTPS에서만 작동** (localhost는 예외)
- 배포 후에도 HTTPS 필수

---

## 📱 모바일 테스트

### Android Chrome

1. **앱 백그라운드 상태로 전환**
2. **메모 공유 받기**
3. **알림 수신 (1번만!)**
4. **알림 클릭**
5. **앱 자동 열림 → 메모 페이지 표시** ✅

### iOS Safari (PWA 설치 필수)

**PWA 설치:**
1. Safari에서 앱 열기
2. 공유 버튼 (⬆️)
3. "홈 화면에 추가"

**테스트:**
1. PWA 앱 백그라운드로
2. 메모 공유 받기
3. 알림 클릭
4. 메모 페이지로 이동 ✅

---

## 🎉 완료 후 확인 사항

### ✅ 체크리스트

- [x] Service Worker Firebase Config 하드코딩
- [x] `onBackgroundMessage` 핸들러 제거 (중복 알림 방지)
- [x] `notificationclick` 이벤트 핸들러 강화 (로그 추가)
- [x] 데이터 파싱 안전성 개선
- [ ] Service Worker 재등록 (사용자)
- [ ] 알림 1번만 오는지 확인 (사용자)
- [ ] 알림 클릭 시 메모 페이지 이동 확인 (사용자)

### 🚀 예상 결과

1. ✅ **알림이 1번만 표시됨**
2. ✅ **알림 클릭 시 메모 페이지로 이동**
3. ✅ **이미 열린 창 재사용 (새 창 열지 않음)**
4. ✅ **백그라운드/포그라운드 모두 작동**
5. ✅ **모바일에서도 완벽하게 작동**

---

## 🔧 추가 개선 사항 (선택)

### 1. 알림에 이미지 추가

`functions/index.js`:
```javascript
const message = {
  notification: {
    title: notification.title || '새 알림',
    body: notification.body || '',
    image: 'https://your-domain.com/logo512.png', // 추가
  },
  // ...
};
```

### 2. 알림 액션 버튼 추가

`firebase-messaging-sw.js`:
```javascript
self.registration.showNotification(title, {
  body: body,
  icon: '/logo192.png',
  actions: [
    { action: 'open', title: '열기' },
    { action: 'close', title: '닫기' }
  ],
  data: data
});

self.addEventListener('notificationclick', (event) => {
  if (event.action === 'open') {
    // 메모 열기
  } else if (event.action === 'close') {
    // 알림만 닫기
    event.notification.close();
  }
});
```

### 3. 알림 뱃지 카운트

`frontend/src/hooks/useNotifications.ts`:
```typescript
useEffect(() => {
  if ('setAppBadge' in navigator && unreadCount > 0) {
    (navigator as any).setAppBadge(unreadCount);
  } else if ('clearAppBadge' in navigator) {
    (navigator as any).clearAppBadge();
  }
}, [unreadCount]);
```

---

## 📝 참고사항

### FCM 메시지 구조

**Notification 메시지** (자동 표시):
```javascript
{
  notification: {
    title: "제목",
    body: "내용"
  },
  data: {
    memoId: "abc123"
  }
}
```

**Data 메시지** (수동 처리):
```javascript
{
  data: {
    title: "제목",
    body: "내용",
    memoId: "abc123"
  }
}
```

현재는 **Notification 메시지** 사용 중 → FCM이 자동으로 알림 표시

### Service Worker 생명주기

1. **등록** (`index.tsx`에서 `register()`)
2. **설치** (Service Worker 다운로드)
3. **활성화** (이전 버전 교체)
4. **대기** (이벤트 수신 대기)
5. **업데이트** (파일 변경 시 자동 업데이트)

---

**이제 Service Worker를 재등록하고 테스트하세요!** 🚀

**재등록 명령어 (브라우저 콘솔):**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  setTimeout(() => location.reload(), 1000);
});
```
