// Import the scripts within the worker
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: self.location.search.split('apiKey=')[1]?.split('&')[0] || 'dummy-api-key',
  authDomain: self.location.search.split('authDomain=')[1]?.split('&')[0] || 'dummy-project.firebaseapp.com',
  projectId: self.location.search.split('projectId=')[1]?.split('&')[0] || 'dummy-project',
  storageBucket: self.location.search.split('storageBucket=')[1]?.split('&')[0] || 'dummy-project.appspot.com',
  messagingSenderId: self.location.search.split('messagingSenderId=')[1]?.split('&')[0] || '123456789',
  appId: self.location.search.split('appId=')[1]?.split('&')[0] || 'dummy-app-id',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    data: payload.data,
    tag: payload.data?.memoId || 'default', // 같은 메모는 하나의 알림으로 묶기
    requireInteraction: false, // 자동으로 사라지도록
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification);
  
  event.notification.close(); // 알림 닫기
  
  // 알림 데이터에서 memoId 추출
  const data = event.notification.data;
  const memoId = data?.memoId;
  
  // 메모 상세 페이지 URL 생성
  const urlToOpen = memoId 
    ? `${self.location.origin}/memo/${memoId}`
    : self.location.origin;
  
  console.log('[firebase-messaging-sw.js] Opening URL:', urlToOpen);
  
  // 이미 열린 창이 있는지 확인하고, 있으면 해당 창으로 이동
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 해당 URL이 열려있는 창 찾기
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // 같은 origin의 창이 있으면 해당 창에서 URL 변경
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'navigate' in client) {
            return client.navigate(urlToOpen).then(client => client.focus());
          }
        }
        
        // 열린 창이 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
