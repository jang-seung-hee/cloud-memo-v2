// Import the scripts within the worker
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker with actual config
firebase.initializeApp({
  apiKey: "AIzaSyCJ-wvDcTuVIDUiFEv6Fvq0YvUJ90LxnPo",
  authDomain: "cloud-memo-v2.firebaseapp.com",
  projectId: "cloud-memo-v2",
  storageBucket: "cloud-memo-v2.firebasestorage.app",
  messagingSenderId: "970334935244",
  appId: "1:970334935244:web:0eb10e464edd9f7c6e7f3b"
});

const messaging = firebase.messaging();

// Handle background messages
// FCM 메시지를 받아서 직접 알림을 표시 (data에 접근 가능)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);
  console.log('[SW] Payload data:', payload.data);
  console.log('[SW] Payload notification:', payload.notification);
  
  const notificationTitle = payload.notification?.title || '새 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    data: payload.data, // 이 data가 notificationclick 이벤트에서 사용됨
    tag: payload.data?.memoId || 'default',
    requireInteraction: false,
  };
  
  console.log('[SW] Showing notification with data:', notificationOptions.data);

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] ========== NOTIFICATION CLICKED ==========');
  console.log('[SW] event.notification:', event.notification);
  console.log('[SW] event.notification.data:', event.notification.data);
  console.log('[SW] event.action:', event.action);
  
  event.notification.close();
  
  // 알림 데이터에서 memoId 추출
  const data = event.notification.data || {};
  const memoId = data.memoId;
  
  console.log('[SW] Extracted memoId:', memoId);
  console.log('[SW] Full data object:', JSON.stringify(data));
  
  // 메모 상세 페이지 URL 생성
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  console.log('[SW] URL to open:', urlToOpen);
  
  // 이미 열린 창이 있는지 확인하고, 있으면 해당 창으로 이동
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[SW] Found', clientList.length, 'client(s)');
        
        // 이미 해당 URL이 열려있는 창 찾기
        for (const client of clientList) {
          console.log('[SW] Checking client:', client.url);
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[SW] ✅ Found exact match, focusing');
            return client.focus();
          }
        }
        
        // 같은 origin의 창이 있으면 해당 창에서 URL 변경
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
            console.log('[SW] ✅ Navigating existing window to:', urlToOpen);
            return client.navigate(urlToOpen).then(c => c.focus());
          }
        }
        
        // 열린 창이 없으면 새 창 열기
        if (clients.openWindow) {
          console.log('[SW] ✅ Opening new window');
          return clients.openWindow(urlToOpen);
        }
        
        console.log('[SW] ❌ No action taken - no clients.openWindow available');
      })
      .catch((error) => {
        console.error('[SW] ❌ Error handling notification click:', error);
      })
  );
  
  console.log('[SW] ========== END NOTIFICATION CLICK ==========');
});
