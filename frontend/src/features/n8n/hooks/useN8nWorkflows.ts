import { useState, useEffect } from 'react';
import { FirestoreService } from '../../../services/firebase/firestore';
import { IN8nWorkflow, N8nWorkflowCreateData, N8nWorkflowUpdateData } from '../../../types/n8n';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/use-toast';

/**
 * n8n 워크플로우 리스트 관리 및 CRUD를 담당하는 커스텀 훅
 */
export const useN8nWorkflows = () => {
  const [workflows, setWorkflows] = useState<IN8nWorkflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const firestore = FirestoreService.getInstance();

  // 실시간 리스너 설정
  useEffect(() => {
    // 인증 정보 로딩 중이면 대기
    if (authLoading) return;

    if (!user) {
      setWorkflows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = firestore.onN8nWorkflowsSnapshot(user.uid, (data) => {
      setWorkflows(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 워크플로우 추가
  const addWorkflow = async (data: N8nWorkflowCreateData) => {
    if (!user) return;
    try {
      await firestore.createN8nWorkflow(user.uid, data);
      toast({ title: '✅ 추가 완료', description: 'n8n 워크플로우가 등록되었습니다.' });
    } catch (error) {
      toast({ title: '❌ 추가 실패', description: '워크플로우 등록 중 오류가 발생했습니다.', variant: 'destructive' });
      throw error;
    }
  };

  // 워크플로우 수정
  const updateWorkflow = async (id: string, data: N8nWorkflowUpdateData) => {
    try {
      await firestore.updateN8nWorkflow(id, data);
      toast({ title: '✅ 수정 완료', description: '워크플로우 정보가 업데이트되었습니다.' });
    } catch (error) {
      toast({ title: '❌ 수정 실패', description: '정보 업데이트 중 오류가 발생했습니다.', variant: 'destructive' });
      throw error;
    }
  };

  // 워크플로우 삭제
  const deleteWorkflow = async (id: string) => {
    try {
      await firestore.deleteN8nWorkflow(id);
      toast({ title: '✅ 삭제 완료', description: '워크플로우가 삭제되었습니다.' });
    } catch (error) {
      toast({ title: '❌ 삭제 실패', description: '워크플로우 삭제 중 오류가 발생했습니다.', variant: 'destructive' });
      throw error;
    }
  };

  return {
    workflows,
    isLoading,
    addWorkflow,
    updateWorkflow,
    deleteWorkflow
  };
};
