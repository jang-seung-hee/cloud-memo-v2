import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { firestoreService } from '../services/firebase/firestore';
import { ICategory } from '../types/template';
import { IFirebaseCategory } from '../types/firebase';

interface UseCategoriesReturn {
  categories: ICategory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  activeCategories: ICategory[];
}

export const useCategories = (): UseCategoriesReturn => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<{
    categories: ICategory[];
    loading: boolean;
    error: string | null;
  }>({
    categories: [],
    loading: true,
    error: null
  });

  // 카테고리 목록 로드
  const loadCategories = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, categories: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const firebaseCategories = await firestoreService.getCategoriesByUserId(user.uid);
      
      // Firebase 데이터를 ICategory 형식으로 변환
      const convertedCategories: ICategory[] = firebaseCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
        order: cat.order,
        createdAt: cat.createdAt.toDate(),
        updatedAt: cat.updatedAt.toDate()
      }));
      
      setState({ 
        categories: convertedCategories, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '카테고리 로드 실패';
      setState({ categories: [], loading: false, error: errorMessage });
    }
  }, [isAuthenticated, user]);

  // 실시간 리스너 설정
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState(prev => ({ ...prev, loading: false, categories: [] }));
      return;
    }

    const unsubscribe = firestoreService.onCategoriesSnapshot(user.uid, (firebaseCategories) => {
      // Firebase 데이터를 ICategory 형식으로 변환
      const convertedCategories: ICategory[] = firebaseCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        isActive: cat.isActive,
        order: cat.order,
        createdAt: cat.createdAt.toDate(),
        updatedAt: cat.updatedAt.toDate()
      }));
      
      setState(prev => ({ 
        ...prev, 
        categories: convertedCategories, 
        loading: false, 
        error: null 
      }));
    });

    return () => unsubscribe();
  }, [isAuthenticated, user]);

  // 활성화된 카테고리(지정안함 제외)
  const activeCategories = state.categories.filter(
    cat => cat.isActive && cat.name !== '지정안함'
  );

  return {
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    refresh: loadCategories,
    activeCategories
  };
}; 