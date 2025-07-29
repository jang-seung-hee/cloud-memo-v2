import { User, AuthError } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange, 
  getCurrentUser, 
  isAuthenticated 
} from './firebase/auth';

// 인증 서비스 클래스
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private authStateListeners: ((user: User | null) => void)[] = [];

  private constructor() {
    // 싱글톤 패턴
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Google 로그인
  async login(): Promise<User> {
    try {
      const user = await signInWithGoogle();
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
      return user;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error as AuthError;
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    try {
      await signOutUser();
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error as AuthError;
    }
  }

  // 현재 사용자 가져오기
  getCurrentUser(): User | null {
    if (!this.currentUser) {
      this.currentUser = getCurrentUser();
    }
    return this.currentUser;
  }

  // 인증 상태 확인
  isAuthenticated(): boolean {
    return isAuthenticated();
  }

  // 인증 상태 변경 리스너 등록
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    // 리스너 등록
    this.authStateListeners.push(callback);
    
    // 즉시 현재 상태 전달 (Firebase Auth 초기화 지연 방지)
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      callback(currentUser);
    } else {
      // 현재 사용자가 없으면 null 전달하여 로딩 상태 해제
      callback(null);
    }
    
    // Firebase 인증 상태 변경 리스너 등록
    const unsubscribe = onAuthStateChange((user) => {
      // PC 브라우저에서 안정성을 위해 상태 변경 전 로깅
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthService: User state changed', user ? `from ${this.currentUser?.email} to ${user.email}` : 'to null');
      }
      
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });

    // 구독 해제 함수 반환
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
      unsubscribe();
    };
  }

  // 인증 상태 변경 알림
  private notifyAuthStateListeners(user: User | null): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('인증 상태 리스너 오류:', error);
      }
    });
  }

  // 사용자 프로필 정보 가져오기
  getUserProfile() {
    const user = this.getCurrentUser();
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const authService = AuthService.getInstance(); 