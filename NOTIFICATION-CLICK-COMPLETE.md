# ✅ 알림 클릭 시 메모 이동 기능 완료!

## 🎉 문제 해결

### 문제
- 알림은 정상적으로 수신됨 ✅
- 하지만 알림 클릭 시 해당 메모로 이동하지 않음 ❌

### 해결
알림 클릭 이벤트 핸들러 추가 및 메모 ID 전달

---

## 🔧 변경 사항

### 1. Service Worker 업데이트 (`firebase-messaging-sw.js`)

#### 알림 클릭 이벤트 핸들러 추가:
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // 알림 닫기
  
  // 메모 ID 추출
  const memoId = event.notification.data?.memoId;
  
  // 메모 상세 페이지 URL 생성
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  // 이미 열린 창이 있으면 해당 창으로 이동, 없으면 새 창 열기
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // 같은 origin의 창이 있으면 해당 창에서 URL 변경
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin)) {
            return client.navigate(urlToOpen).then(client => client.focus());
          }
        }
        // 열린 창이 없으면 새 창 열기
        return clients.openWindow(urlToOpen);
      })
  );
});
```

#### 알림 옵션 개선:
```javascript
const notificationOptions = {
  body: payload.notification.body,
  icon: '/logo192.png',
  data: payload.data,
  tag: payload.data?.memoId || 'default', // 같은 메모는 하나로 묶기
  requireInteraction: false, // 자동으로 사라지도록
};
```

### 2. useNotifications 훅 업데이트

#### 포그라운드 알림에 "보기" 버튼 추가:
```javascript
toast({
  title: payload.notification.title,
  description: payload.notification.body,
  action: memoId ? {
    label: '보기',
    onClick: () => {
      window.location.href = `/memo/${memoId}`;
    }
  } : undefined
});
```

---

## 🎯 작동 방식

### 백그라운드 알림 (앱이 닫혀있거나 다른 탭일 때)
1. 알림 수신
2. 알림 클릭
3. **Service Worker가 알림 클릭 감지**
4. **메모 ID를 URL에 포함하여 `/memo/{memoId}` 페이지로 이동**
5. 이미 열린 창이 있으면 해당 창을 사용, 없으면 새 창 열기

### 포그라운드 알림 (앱이 열려있을 때)
1. 알림 수신 (토스트로 표시)
2. **토스트에 "보기" 버튼 표시**
3. **"보기" 버튼 클릭 시 메모 상세 페이지로 이동**

---

## 🧪 테스트 방법

### 1. Service Worker 재등록 (중요!)

Service Worker가 업데이트되었으므로 재등록이 필요합니다:

**방법 1: 브라우저 새로고침 (권장)**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

**방법 2: Service Worker 수동 업데이트**
1. F12 > Application 탭
2. Service Workers 섹션
3. "Update" 버튼 클릭

### 2. 알림 테스트

#### 백그라운드 테스트:
1. 친구가 다른 탭으로 이동하거나 브라우저 최소화
2. 메모 공유
3. 알림 수신 확인
4. **알림 클릭**
5. **메모 상세 페이지가 열리는지 확인**

#### 포그라운드 테스트:
1. 친구가 앱을 열어둠
2. 메모 공유
3. 토스트 알림 수신 확인
4. **"보기" 버튼 클릭**
5. **메모 상세 페이지로 이동하는지 확인**

---

## 📱 URL 형식

알림 클릭 시 이동하는 URL:
```
https://your-domain.com/memo/{memoId}
```

예시:
```
https://cloud-memo-v2.web.app/memo/abc123xyz
```

---

## 🔍 디버깅

### Service Worker 콘솔 확인

1. **F12 > Application 탭 > Service Workers**
2. **"firebase-messaging-sw.js" 옆 "inspect" 클릭**
3. **새 개발자 도구 창이 열림**
4. **Console 탭에서 로그 확인:**
   ```
   [firebase-messaging-sw.js] Notification clicked: ...
   [firebase-messaging-sw.js] Opening URL: https://...
   ```

### 알림 클릭이 작동하지 않는 경우

1. **Service Worker가 업데이트되었는지 확인**
   - 브라우저 완전 새로고침 (Ctrl+Shift+R)
   - 또는 Service Worker 수동 업데이트

2. **메모 ID가 전달되는지 확인**
   - Firebase Functions 로그: `memoId: 'abc123'`
   - Service Worker 콘솔: `Opening URL: .../memo/abc123`

3. **라우팅이 설정되어 있는지 확인**
   - React Router에서 `/memo/:id` 경로가 정의되어 있어야 함

---

## ✅ 완료 체크리스트

- [x] Service Worker에 알림 클릭 이벤트 핸들러 추가
- [x] 메모 ID를 URL에 포함하여 이동
- [x] 이미 열린 창이 있으면 해당 창 사용
- [x] 포그라운드 토스트에 "보기" 버튼 추가
- [x] 알림 옵션 개선 (tag, requireInteraction)

---

## 🎉 결과

이제 알림 클릭 시:
1. ✅ 백그라운드: 알림 클릭 → 메모 상세 페이지로 즉시 이동
2. ✅ 포그라운드: 토스트 "보기" 버튼 → 메모 상세 페이지로 이동
3. ✅ 이미 열린 창이 있으면 새 창을 열지 않고 기존 창 사용
4. ✅ 같은 메모의 여러 알림은 하나로 묶임 (tag 사용)

**테스트해보시고 결과를 알려주세요!** 🚀
