import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User,
  AuthError 
} from 'firebase/auth';
import { auth } from './config';

// Google 인증 제공업체
const googleProvider = new GoogleAuthProvider();

// Google 로그인 함수
export const signInWithGoogle = async (): Promise<User> => {
  try {
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