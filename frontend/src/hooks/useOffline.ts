import { useState, useEffect, useRef, useCallback } from 'react';

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export const useOffline = (): OfflineStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );
  const [lastOffline, setLastOffline] = useState<Date | null>(
    !navigator.onLine ? new Date() : null
  );
  
  // 디바운싱을 위한 타이머 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 이전 온라인 상태를 저장하여 불필요한 업데이트 방지
  const previousOnlineRef = useRef<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 온라인 상태로 변경됨');
      }
      
      // 이전 상태와 비교하여 실제 변경사항이 있는지 확인
      if (!previousOnlineRef.current) {
        // 디바운싱 적용 (200ms로 단축하여 반응성 향상)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
          previousOnlineRef.current = true;
          setIsOnline(true);
          setLastOnline(new Date());
        }, 200);
      }
    };

    const handleOffline = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📴 오프라인 상태로 변경됨');
      }
      
      // 이전 상태와 비교하여 실제 변경사항이 있는지 확인
      if (previousOnlineRef.current) {
        // 디바운싱 적용 (200ms로 단축하여 반응성 향상)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
          previousOnlineRef.current = false;
          setIsOnline(false);
          setLastOffline(new Date());
        }, 200);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 정리 함수
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // 컴포넌트 언마운트 시 타이머 정리
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    lastOffline
  };
};

// 오프라인 상태에 따른 작업 지연을 위한 유틸리티
export const useOfflineQueue = () => {
  const [pendingActions, setPendingActions] = useState<Array<() => Promise<void>>>([]);
  const { isOnline } = useOffline();

  const addToQueue = useCallback((action: () => Promise<void>) => {
    if (!isOnline) {
      setPendingActions(prev => [...prev, action]);
      if (process.env.NODE_ENV === 'development') {
        console.log('📋 오프라인 상태: 작업을 큐에 추가');
      }
      return false; // 작업이 큐에 추가됨
    }
    return true; // 즉시 실행 가능
  }, [isOnline]);

  const executeQueue = useCallback(async () => {
    if (pendingActions.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${pendingActions.length}개의 대기 중인 작업 실행`);
    }
    
    for (const action of pendingActions) {
      try {
        await action();
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('큐 작업 실행 중 오류:', error);
        }
      }
    }
    
    setPendingActions([]);
  }, [pendingActions]);

  // 온라인 상태가 되면 큐 실행
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      executeQueue();
    }
  }, [isOnline, pendingActions.length]);

  return {
    pendingActions,
    addToQueue,
    executeQueue
  };
}; 