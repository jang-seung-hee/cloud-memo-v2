import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 객체
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'dummy-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'dummy-project.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'dummy-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || 'dummy-app-id',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || 'dummy-measurement-id'
};

// 개발 모드에서 환경변수가 설정되지 않은 경우 경고
if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_FIREBASE_API_KEY) {
  console.warn('⚠️ Firebase 환경변수가 설정되지 않았습니다.');
  console.warn('Firebase Console에서 프로젝트를 생성하고 환경변수를 설정하세요.');
  console.warn('자세한 내용은 backend/README.md를 참조하세요.');
}

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 기본 내보내기
export default app; 