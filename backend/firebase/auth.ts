import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  AuthError,
  setPersistence,
  browserLocalPersistence
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

// Google 로그인 함수
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // PC 브라우저에서 세션 지속성을 위해 persistence 설정
    await setPersistence(auth, browserLocalPersistence);
    
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google 로그인 오류:', error);
    throw error as AuthError;
  }
};

// 로그아웃 함수
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error as AuthError;
  }
};

// 인증 상태 변경 리스너
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 인증 상태 확인
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
}; 