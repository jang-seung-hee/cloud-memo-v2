import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { firestoreService } from '../services/firebase/firestore';
import {
  IFirebaseMemo,
  IFirebaseTemplate,
  IMemoCreateData,
  ITemplateCreateData,
  IMemoUpdateData,
  ITemplateUpdateData,
  IQueryOptions
} from '../types/firebase';

// Firestore 데이터 상태 인터페이스
interface FirestoreState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

// Firestore 훅 반환 타입
interface UseFirestoreReturn<T> extends FirestoreState<T> {
  create: (data: any) => Promise<string>;
  update: (id: string, data: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// 메모 전용 훅 반환 타입
interface UseMemosReturn extends UseFirestoreReturn<IFirebaseMemo> {
  createMemo: (data: IMemoCreateData) => Promise<string>;
  updateMemo: (id: string, data: IMemoUpdateData) => Promise<void>;
  pinMemo: (id: string, isPinned: boolean) => Promise<void>;
  archiveMemo: (id: string, isArchived: boolean) => Promise<void>;
  getMemoById: (id: string) => Promise<IFirebaseMemo | null>;
}

// 템플릿 관련 훅

// === 메모 관리 훅 ===
export const useMemos = (options?: IQueryOptions): UseMemosReturn => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<FirestoreState<IFirebaseMemo>>({
    data: [],
    loading: true,
    error: null
  });

  // 디바운싱을 위한 타이머 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 이전 데이터를 저장하여 불필요한 업데이트 방지
  const previousDataRef = useRef<IFirebaseMemo[]>([]);

  // 메모 목록 로드
  const loadMemos = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const memos = await firestoreService.getMemosByUserId(user.uid, options);

      // 기존 메모에 카테고리 필드가 없는 경우 기본값 설정
      const processedMemos = memos.map(memo => ({
        ...memo,
        category: memo.category || 'temporary'
      }));

      setState({ data: processedMemos, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메모 로드 실패';
      setState({ data: [], loading: false, error: errorMessage });
    }
  }, [isAuthenticated, user, options]);

  // 실시간 리스너 설정 (즉시 반응하도록 최적화)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    const unsubscribe = firestoreService.onMemosSnapshot(user.uid, (memos) => {
      // 기존 메모에 카테고리 필드가 없는 경우 기본값 설정
      const processedMemos = memos.map(memo => ({
        ...memo,
        category: memo.category || 'temporary'
      }));

      // 이전 데이터와 비교하여 실제 변경사항이 있는지 확인
      const hasChanged = JSON.stringify(processedMemos) !== JSON.stringify(previousDataRef.current);

      if (hasChanged) {
        // 즉시 업데이트 (디바운싱 제거로 반응성 향상)
        previousDataRef.current = processedMemos;
        setState(prev => ({ ...prev, data: processedMemos, loading: false, error: null }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user]);

  // 메모 생성
  const createMemo = useCallback(async (data: IMemoCreateData): Promise<string> => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 useMemos.createMemo 호출됨:', { isAuthenticated, user: user?.uid, data });
    }

    if (!isAuthenticated || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 인증되지 않음:', { isAuthenticated, user: user?.uid });
      }
      throw new Error('인증이 필요합니다.');
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 인증 확인됨, firestoreService.createMemo 호출...');
      }
      const memoId = await firestoreService.createMemo(user.uid, data);
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ 메모 생성 완료:', memoId);
      }
      return memoId;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ 메모 생성 실패:', error);
      }
      const errorMessage = error instanceof Error ? error.message : '메모 생성 실패';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isAuthenticated, user]);

  // 메모 업데이트
  const updateMemo = useCallback(async (id: string, data: IMemoUpdateData): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('인증이 필요합니다.');
    }

    try {
      await firestoreService.updateMemo(id, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메모 업데이트 실패';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isAuthenticated, user]);

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    if (!isAuthenticated || !user) {
      throw new Error('인증이 필요합니다.');
    }

    try {
      // 로컬 상태를 먼저 업데이트하여 UI가 즉시 반응하도록 함
      setState(prev => ({
        ...prev,
        data: prev.data.filter(memo => memo.id !== id)
      }));

      // 실제 삭제 작업 수행
      await firestoreService.deleteMemo(id);
    } catch (error) {
      // 삭제 실패 시 원래 상태로 복원
      setState(prev => ({
        ...prev,
        error: '메모 삭제 실패'
      }));

      // 실패 시 목록을 다시 로드하여 정확한 상태 복원
      await loadMemos();

      const errorMessage = error instanceof Error ? error.message : '메모 삭제 실패';
      throw error;
    }
  }, [isAuthenticated, user, loadMemos]);

  // 메모 고정/해제
  const pinMemo = useCallback(async (id: string, isPinned: boolean): Promise<void> => {
    await updateMemo(id, { isPinned });
  }, [updateMemo]);

  // 메모 보관/해제
  const archiveMemo = useCallback(async (id: string, isArchived: boolean): Promise<void> => {
    await updateMemo(id, { isArchived });
  }, [updateMemo]);

  // 특정 메모 조회
  const getMemoById = useCallback(async (id: string): Promise<IFirebaseMemo | null> => {
    if (!isAuthenticated || !user) {
      throw new Error('인증이 필요합니다.');
    }

    try {
      return await firestoreService.getMemo(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '메모 조회 실패';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [isAuthenticated, user]);

  // 데이터 새로고침
  const refresh = useCallback(async () => {
    await loadMemos();
  }, [loadMemos]);

  return {
    ...state,
    create: createMemo,
    update: updateMemo,
    delete: deleteMemo,
    refresh,
    createMemo,
    updateMemo,
    pinMemo,
    archiveMemo,
    getMemoById
  };
};

// === 공유받은 메모 관리 훅 ===
export const useSharedMemos = (): FirestoreState<IFirebaseMemo> => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<FirestoreState<IFirebaseMemo>>({
    data: [],
    loading: true,
    error: null
  });
  const previousDataRef = useRef<IFirebaseMemo[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    const unsubscribe = firestoreService.onSharedMemosSnapshot(user.uid, (memos) => {
      const processedMemos = memos.map(memo => ({
        ...memo,
        category: memo.category || 'temporary'
      }));

      const hasChanged = JSON.stringify(processedMemos) !== JSON.stringify(previousDataRef.current);

      if (hasChanged) {
        previousDataRef.current = processedMemos;
        setState(prev => ({ ...prev, data: processedMemos, loading: false, error: null }));
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  return state;
};

// === 템플릿 관리 훅 ===
export const useTemplates = (): {
  data: IFirebaseTemplate[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<{
    data: IFirebaseTemplate[];
    loading: boolean;
    error: string | null;
  }>({
    data: [],
    loading: true,
    error: null
  });

  // 템플릿 목록 로드
  const loadTemplates = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const templates = await firestoreService.getTemplatesByUserId(user.uid);

      // 클라이언트에서 정렬 (제목 기준, 같은 제목이면 최신순)
      const sortedTemplates = templates.sort((a, b) => {
        // 먼저 제목으로 정렬 (가나다순)
        const titleComparison = a.title.localeCompare(b.title, 'ko');

        // 제목이 같으면 최신글이 위로
        if (titleComparison === 0) {
          return b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime();
        }

        return titleComparison;
      });

      setState({ data: sortedTemplates, loading: false, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '템플릿 로드 실패';
      setState({ data: [], loading: false, error: errorMessage });
    }
  }, [isAuthenticated, user]);

  // 실시간 리스너 설정
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, data: [] }));
      return;
    }

    const unsubscribe = firestoreService.onTemplatesSnapshot(user.uid, (templates) => {
      // 클라이언트에서 정렬 (제목 기준, 같은 제목이면 최신순)
      const sortedTemplates = templates.sort((a, b) => {
        // 먼저 제목으로 정렬 (가나다순)
        const titleComparison = a.title.localeCompare(b.title, 'ko');

        // 제목이 같으면 최신글이 위로
        if (titleComparison === 0) {
          return b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime();
        }

        return titleComparison;
      });

      setState(prev => ({ ...prev, data: sortedTemplates, loading: false, error: null }));
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: loadTemplates
  };
}; 