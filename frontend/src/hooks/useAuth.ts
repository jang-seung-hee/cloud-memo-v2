import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // 디바운싱을 위한 타이머 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 이전 사용자 상태를 저장하여 불필요한 업데이트 방지
  const previousUserRef = useRef<User | null>(null);

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

  // 인증 상태 변경 리스너 설정 (디바운싱 적용)
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      // 이전 사용자와 비교하여 실제 변경사항이 있는지 확인
      const hasChanged = user?.uid !== previousUserRef.current?.uid;
      
      if (hasChanged) {
        // 디바운싱 적용 (100ms로 단축하여 반응성 향상)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
          previousUserRef.current = user;
          setAuthState({
            user,
            loading: false,
            error: null
          });
        }, 100);
      }
    });

    // 컴포넌트 언마운트 시 구독 해제 및 타이머 정리
    return () => {
      unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...authState,
    login,
    logout,
    isAuthenticated: !!authState.user
  };
}; 