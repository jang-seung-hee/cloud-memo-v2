import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/auth';

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

  // 로그인 함수
  const login = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      await authService.login();
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

  // 인증 상태 변경 리스너 설정
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setAuthState({
        user,
        loading: false,
        error: null
      });
    });

    // 컴포넌트 언마운트 시 구독 해제
    return unsubscribe;
  }, []);

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user
  };
}; 