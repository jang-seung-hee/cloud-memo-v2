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
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
