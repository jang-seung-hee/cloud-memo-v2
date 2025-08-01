import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  User,
  AuthError,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth } from './config';

// Google 인증 제공업체
const googleProvider = new GoogleAuthProvider();

// PC 브라우저에서 third-party cookies 문제 해결을 위한 추가 설정
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // PC 브라우저에서 더 안정적인 인증을 위한 설정
  access_type: 'offline',
  include_granted_scopes: 'true'
});


// 환경변수 확인
const isFirebaseConfigured = process.env.REACT_APP_FIREBASE_API_KEY && 
  process.env.REACT_APP_FIREBASE_API_KEY !== 'dummy-api-key';

// Google 로그인 함수 (PC 브라우저 호환성을 위해 팝업 사용)
export const signInWithGoogle = async (): Promise<User> => {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase가 설정되지 않았습니다. 환경변수를 확인하세요.');
  }

  try {
    // PC 브라우저에서 세션 지속성을 위해 persistence 설정
    await setPersistence(auth, browserLocalPersistence);
    
    // PC 브라우저에서 더 안정적인 팝업 방식 사용
    const result = await signInWithPopup(auth, googleProvider);
    
    // 로그인 완료 후 즉시 사용자 정보 반환
    if (result.user) {
      console.log('Google 로그인 성공:', result.user.email);
      return result.user;
    } else {
      throw new Error('로그인 후 사용자 정보를 가져올 수 없습니다.');
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