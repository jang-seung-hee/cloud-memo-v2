import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User,
  AuthError 
} from 'firebase/auth';
import { auth } from './config';

// Google 인증 제공업체
const googleProvider = new GoogleAuthProvider();



// 환경변수 확인
const isFirebaseConfigured = process.env.REACT_APP_FIREBASE_API_KEY && 
  process.env.REACT_APP_FIREBASE_API_KEY !== 'dummy-api-key';

// Google 로그인 함수 (팝업 대신 리다이렉트 사용)
export const signInWithGoogle = async (): Promise<User> => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase가 설정되지 않았습니다. 환경변수를 확인하세요.');
  }

  try {
    // 팝업 대신 리다이렉트 사용
    await signInWithRedirect(auth, googleProvider);
    // 리다이렉트 후 결과 처리
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    } else {
      throw new Error('인증이 취소되었습니다.');
    }
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error as AuthError;
  }
};

// 로그아웃 함수
export const signOutUser = async (): Promise<void> => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase가 설정되지 않았습니다. 환경변수를 확인하세요.');
  }

  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error as AuthError;
  }
};

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!isFirebaseConfigured) {
    // Firebase가 설정되지 않은 경우 즉시 null 호출
    callback(null);
    return () => {}; // 빈 구독 해제 함수
  }

  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  if (!isFirebaseConfigured) {
    return null;
  }
  return auth.currentUser;
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  if (!isFirebaseConfigured) {
    return false;
  }
  return auth.currentUser !== null;
}; 