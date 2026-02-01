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

// Handle background messages - FCM이 자동으로 알림을 표시하므로 이 핸들러는 제거
// (중복 알림 방지)
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Background message received:', payload);
//   
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/logo192.png',
//     data: payload.data,
//     tag: payload.data?.memoId || 'default',
//     requireInteraction: false,
//   };
//
//   self.registration.showNotification(notificationTitle, notificationOptions);
// });

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  
  event.notification.close(); // 알림 닫기
  
  // 알림 데이터에서 memoId 추출
  const data = event.notification.data || {};
  const memoId = data.memoId;
  
  console.log('[firebase-messaging-sw.js] Extracted memoId:', memoId);
  console.log('[firebase-messaging-sw.js] Full data:', data);
  
  // 메모 상세 페이지 URL 생성
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  console.log('[firebase-messaging-sw.js] Opening URL:', urlToOpen);
  
  // 이미 열린 창이 있는지 확인하고, 있으면 해당 창으로 이동
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('[firebase-messaging-sw.js] Found clients:', clientList.length);
        
        // 이미 해당 URL이 열려있는 창 찾기
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[firebase-messaging-sw.js] Found exact match, focusing');
            return client.focus();
          }
        }
        
        // 같은 origin의 창이 있으면 해당 창에서 URL 변경
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
            console.log('[firebase-messaging-sw.js] Navigating existing window to:', urlToOpen);
            return client.navigate(urlToOpen).then(client => client.focus());
          }
        }
        
        // 열린 창이 없으면 새 창 열기
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
