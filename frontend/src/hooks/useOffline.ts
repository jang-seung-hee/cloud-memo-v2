import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 온라인 상태로 변경됨');
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      console.log('📴 오프라인 상태로 변경됨');
      setIsOnline(false);
      setLastOffline(new Date());
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 정리 함수
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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

  const addToQueue = (action: () => Promise<void>) => {
    if (!isOnline) {
      setPendingActions(prev => [...prev, action]);
      console.log('📋 오프라인 상태: 작업을 큐에 추가');
      return false; // 작업이 큐에 추가됨
    }
    return true; // 즉시 실행 가능
  };

  const executeQueue = async () => {
    if (pendingActions.length === 0) return;

    console.log(`🔄 ${pendingActions.length}개의 대기 중인 작업 실행`);
    
    for (const action of pendingActions) {
      try {
        await action();
      } catch (error) {
        console.error('큐 작업 실행 중 오류:', error);
      }
    }
    
    setPendingActions([]);
  };

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