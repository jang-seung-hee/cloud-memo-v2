import { useState, useEffect, useCallback, useRef } from 'react';
import { n8nVoiceDb, ICachedVoice } from '../utils/n8nVoiceDb';
import { useToast } from '../../../hooks/use-toast';

interface UseN8nBackupRestoreProps {
  workflowId: string | undefined;
  workflowName: string | undefined;
  voiceFile: File | null;
  setVoiceFile: (file: File | null) => void;
}

/**
 * n8n 음성 파일 로컬 백업 및 복구를 전담 관리하는 격리 훅
 */
export const useN8nBackupRestore = ({
  workflowId,
  workflowName,
  voiceFile,
  setVoiceFile
}: UseN8nBackupRestoreProps) => {
  const { toast } = useToast();
  const [pendingVoiceBackup, setPendingVoiceBackup] = useState<ICachedVoice | null>(null);
  const [localBackupId, setLocalBackupId] = useState<string | null>(null);
  const pageWakeLockRef = useRef<any>(null); // 업로드 진행 시 적용할 Wake Lock 레퍼런스

  // 1. 페이지 진입 시 해당 워크플로우 전송 실패 오디오 백업 스캔
  useEffect(() => {
    const scanBackup = async () => {
      if (workflowId) {
        try {
          const backup = await n8nVoiceDb.getPendingVoice(workflowId);
          if (backup) {
            setPendingVoiceBackup(backup);
            console.log('🔄 [n8n 로컬 백업 감지] 전송 대기 오디오가 존재합니다:', backup.fileName);
          }
        } catch (err) {
          console.error('❌ [n8n 백업 스캔 실패]:', err);
        }
      }
    };
    scanBackup();
  }, [workflowId]);

  // 2. 음성 파일(voiceFile) 감지 시 자동 로컬 백업 생성
  useEffect(() => {
    const autoBackup = async () => {
      if (voiceFile && workflowId && workflowName) {
        // 이미 보관 키가 생성되어 있다면 중복 방지
        if (!localBackupId) {
          try {
            const id = await n8nVoiceDb.saveVoice(workflowId, workflowName, voiceFile, voiceFile.name);
            setLocalBackupId(id);
            console.log('⚡ [로컬 예비 백업 성공] ID:', id);
          } catch (err) {
            console.error('❌ [로컬 예비 백업 실패]:', err);
          }
        }
      }
    };
    autoBackup();
  }, [voiceFile, workflowId, workflowName, localBackupId]);

  // 3. 녹음 삭제 시 로컬 백업 수동 클린업
  useEffect(() => {
    if (!voiceFile && localBackupId) {
      n8nVoiceDb.deleteVoice(localBackupId);
      setLocalBackupId(null);
      console.log('🧹 [로컬 백업 파기] 녹음 수동 삭제로 백업 정리 완료');
    }
  }, [voiceFile, localBackupId]);

  // 4. 실패한 예비 백업 파일 복구 적용
  const restoreBackup = useCallback(() => {
    if (pendingVoiceBackup) {
      try {
        const restoredFile = new File([pendingVoiceBackup.blob], pendingVoiceBackup.fileName, {
          type: pendingVoiceBackup.blob.type
        });
        setVoiceFile(restoredFile);
        setLocalBackupId(pendingVoiceBackup.id);
        setPendingVoiceBackup(null); // 백업 알림 숨김

        toast({
          title: "🎙️ 음성 파일 복구 완료",
          description: "이전에 전송 실패했던 녹음 파일이 안전하게 복구되었습니다.",
        });
      } catch (err) {
        console.error('❌ [백업 복구 실패]:', err);
        toast({
          title: "복구 실패",
          description: "백업 파일을 재생성하는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
      }
    }
  }, [pendingVoiceBackup, setVoiceFile, toast]);

  // 5. 실패한 백업 파일 완전히 파기
  const discardBackup = useCallback(async () => {
    if (pendingVoiceBackup) {
      if (window.confirm('임시 보존된 예비 음성 파일을 로컬에서 영구히 삭제하시겠습니까?')) {
        try {
          await n8nVoiceDb.deleteVoice(pendingVoiceBackup.id);
          setPendingVoiceBackup(null);
          toast({
            title: "백업 파기 완료",
            description: "임시 보관 오디오 파일이 디스크에서 완전히 제거되었습니다."
          });
        } catch (err) {
          console.error('❌ [백업 파기 실패]:', err);
        }
      }
    }
  }, [pendingVoiceBackup, toast]);

  // 6. 전송 성공 시 최종 클린업 함수
  const cleanupOnSuccess = useCallback(async () => {
    if (localBackupId) {
      await n8nVoiceDb.deleteVoice(localBackupId);
      setLocalBackupId(null);
      console.log('✨ [로컬 백업 완료 클린업] 전송 성공으로 백업 완전 파기 완료');
    }
  }, [localBackupId]);

  // 7. 업로드 웹훅 동작 중 Wake Lock 관리
  const acquirePageWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!pageWakeLockRef.current) {
          pageWakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('⚡ [Page Wake Lock] 대용량 웹훅 업로드 중 화면 유지 작동');
        }
      } catch (err) {
        console.warn('⚠️ [Page Wake Lock] 업로드 중 화면 유지 획득 실패:', err);
      }
    }
  }, []);

  const releasePageWakeLock = useCallback(async () => {
    if (pageWakeLockRef.current) {
      try {
        await pageWakeLockRef.current.release();
        pageWakeLockRef.current = null;
        console.log('🔒 [Page Wake Lock] 업로드 완료로 화면 유지 해제');
      } catch (err) {
        console.error('❌ [Page Wake Lock] 화면 유지 해제 실패:', err);
      }
    }
  }, []);

  return {
    pendingVoiceBackup,
    restoreBackup,
    discardBackup,
    cleanupOnSuccess,
    acquirePageWakeLock,
    releasePageWakeLock,
  };
};
