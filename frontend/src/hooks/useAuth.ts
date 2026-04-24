import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/auth';
import { firestoreService } from '../services/firebase/firestore';

// 인증 상태 타입
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// 인증 훅 반환 타입
export interface UseAuthReturn extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

// 인증 상태 관리 훅
export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // 타임아웃을 위한 타이머 ref
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 이전 사용자 상태를 저장하여 불필요한 업데이트 방지
  const previousUserRef = useRef<User | null>(null);

  // 로그인 함수
  const login = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      const user = await authService.login();

      // 로그인 성공 직후 즉시 프로필 동기화 시도
      if (user) {
        await firestoreService.syncUserProfile(user);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 로그아웃 함수
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await authService.logout();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      throw error;
    }
  }, []);

  // 인증 상태 변경 리스너 설정 (타임아웃 적용)
  useEffect(() => {
    // Firebase Auth 초기화 지연을 위한 타임아웃 설정 (최대 10초)
    const authTimeout = setTimeout(() => {
      setAuthState(prev => prev.loading ? { ...prev, loading: false } : prev);
    }, 10000);

    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (authTimeout) clearTimeout(authTimeout);

      // 이전 사용자와 비교하여 실제 변경사항이 있는지 확인
      const hasChanged = user?.uid !== previousUserRef.current?.uid;

      if (hasChanged) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Auth state changed:', user ? `User: ${user.email}` : 'No user');
        }
        
        previousUserRef.current = user;
        setAuthState({
          user,
          loading: false,
          error: null
        });

        // 사용자 프로필 동기화 (FirestoreService 내부에서 중복 방지 처리됨)
        if (user) {
          firestoreService.syncUserProfile(user);
        }
      } else {
        // UID가 같아도 로딩 중이었다면 로딩 해제
        setAuthState(prev => prev.loading ? { ...prev, loading: false } : prev);
      }
    });

    // 컴포넌트 언마운트 시 구독 해제 및 타이머 정리
    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []); // 의존성 배열을 비워 한 번만 실행되도록 함

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user
  };
}; 