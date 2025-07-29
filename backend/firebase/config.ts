import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 객체
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);

// PC 브라우저에서 세션 지속성을 위해 persistence 설정
// 초기화 후 즉시 설정하여 인증 상태 유지
const initializeAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log('Firebase Auth persistence 설정 완료');
  } catch (error) {
    console.error('Firebase Auth persistence 설정 오류:', error);
    // 오류가 발생해도 앱은 계속 실행
  }
};

// 비동기로 persistence 설정 초기화
initializeAuthPersistence();

export const db = getFirestore(app);
export const storage = getStorage(app);

// 기본 내보내기
export default app; 