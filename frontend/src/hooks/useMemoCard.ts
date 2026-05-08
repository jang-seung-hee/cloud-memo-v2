import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IFirebaseMemo, ISharedUser } from '../types/firebase';
import { useDevice } from './useDevice';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { firestoreService } from '../services/firebase/firestore';
import { storageService } from '../services/firebase/storage';
import { handleFirebaseError } from '../utils/errorHandler';
import { playSound } from '../utils/soundPlayer';

interface UseMemoCardProps {
  memo: IFirebaseMemo;
  onMemoUpdate?: () => void;
}

export const useMemoCard = ({ memo, onMemoUpdate }: UseMemoCardProps) => {
  const navigate = useNavigate();
  const { isDesktop } = useDevice();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // n8n 처리 타임아웃 체크 (120초)
  useEffect(() => {
    if (!memo.isProcessing) return;

    const checkTimeout = async () => {
      const updatedAt = memo.updatedAt?.toDate ? memo.updatedAt.toDate() : new Date(memo.updatedAt as any);
      const now = new Date();
      const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000;

      if (diffSeconds > 120) {
        try {
          await firestoreService.updateMemo(memo.id, {
            isProcessing: false,
            n8nStatus: 'timeout',
            n8nError: '처리 시간 초과 (120초)'
          });
          if (onMemoUpdate) onMemoUpdate();
        } catch (err) {
          console.error('Auto timeout update error:', err);
        }
      }
    };

    checkTimeout();
    const timer = setInterval(checkTimeout, 10000);
    
    return () => clearInterval(timer);
  }, [memo.isProcessing, memo.updatedAt, memo.id, onMemoUpdate]);

  // 공유 상태 확인
  const isSentShare = useMemo(() => {
    return user && memo.userId === user.uid && memo.sharedWithUids && memo.sharedWithUids.length > 0;
  }, [user, memo.userId, memo.sharedWithUids]);

  const isReceivedShare = useMemo(() => {
    return user && memo.userId !== user.uid;
  }, [user, memo.userId]);

  // 삭제 권한 확인
  const canDelete = useMemo(() => {
    if (!user || !memo) return false;
    if (memo.userId === user.uid) return true;
    const sharedUser = memo.sharedWith?.find((u: ISharedUser) => u.uid === user.uid);
    return sharedUser?.permissions?.delete === true;
  }, [user, memo]);

  // 수정 권한 확인
  const canEdit = useMemo(() => {
    if (!user || !memo) return false;
    if (memo.userId === user.uid) return true;
    const sharedUser = memo.sharedWith?.find((u: ISharedUser) => u.uid === user.uid);
    return sharedUser?.permissions?.edit === true;
  }, [user, memo]);

  // 날짜 포맷팅
  const formattedDate = useMemo(() => {
    const createdAt = memo.createdAt?.toDate ? memo.createdAt.toDate() : new Date(memo.createdAt as any);
    const updatedAt = memo.updatedAt?.toDate ? memo.updatedAt.toDate() : new Date(memo.updatedAt as any);
    const timestamp = updatedAt > createdAt ? updatedAt : createdAt;
    const date = timestamp;
    const now = new Date();

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const yearShort = String(date.getFullYear()).substring(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateShort = `${yearShort}.${month}.${day}`;

    if (diffDays === 0) {
      return `오늘 ${timeString}`;
    } else if (diffDays === 1) {
      return `어제 ${timeString}`;
    } else {
      if (!isDesktop) {
        return dateShort;
      } else {
        return `${dateShort} ${timeString}`;
      }
    }
  }, [memo.createdAt, memo.updatedAt, isDesktop]);

  // 텍스트 자르기
  const truncatedContent = useMemo(() => {
    const maxLength = isDesktop ? 220 : 150;
    if (memo.content.length <= maxLength) return memo.content;
    return memo.content.substring(0, maxLength) + '...';
  }, [memo.content, isDesktop]);

  // PC 모드용 제목 생성
  const getTitleForPC = useMemo(() => {
    if (!isDesktop) return memo.title || '제목 없음';

    const firstLine = memo.content.split('\n')[0].trim();
    if (!firstLine) return '제목 없음';

    if (firstLine.length > 15) {
      return firstLine.substring(0, 21) + '...';
    }

    return firstLine;
  }, [memo.content, memo.title, isDesktop]);

  // 모바일용 텍스트 처리
  const getMobileContent = useMemo(() => {
    if (isDesktop) return memo.content;

    if (isExpanded) {
      return memo.content;
    } else {
      const contentWithoutNewlines = memo.content.replace(/\n/g, ' ');
      const maxLength = 150;
      if (contentWithoutNewlines.length <= maxLength) return contentWithoutNewlines;
      return contentWithoutNewlines.substring(0, maxLength) + '...';
    }
  }, [memo.content, isDesktop, isExpanded]);

  // 네비게이션
  const handleClick = useCallback(() => {
    const currentSearchParams = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams();

    if (currentSearchParams.get('search')) {
      searchParams.set('search', currentSearchParams.get('search')!);
    }
    if (currentSearchParams.get('category')) {
      searchParams.set('category', currentSearchParams.get('category')!);
    }
    if (currentSearchParams.get('archived')) {
      searchParams.set('archived', currentSearchParams.get('archived')!);
    }
    if (currentSearchParams.get('shared')) {
      searchParams.set('shared', currentSearchParams.get('shared')!);
    }

    const queryString = searchParams.toString();
    const url = `/memo/${memo.id}${queryString ? `?${queryString}` : ''}`;
    navigate(url);
  }, [navigate, memo.id]);

  const handleExpandToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  // 클립보드 복사
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (error) {
      return false;
    }
  };

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const textToCopy = memo.content;
      const success = await copyToClipboard(textToCopy);

      if (success) {
        toast({
          title: "복사 완료",
          description: "메모 내용이 클립보드에 복사되었습니다."
        });
      } else {
        toast({
          title: "복사 실패",
          description: "클립보드 복사에 실패했습니다.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive"
      });
    }
  }, [memo.content, toast]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/memo/${memo.id}/edit`);
  }, [navigate, memo.id]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      // 메모 삭제 (첨부된 이미지 삭제는 서비스 레이어에서 자동 처리됨)
      await firestoreService.deleteMemo(memo.id);

      toast({
        title: "삭제 완료",
        description: "메모가 성공적으로 삭제되었습니다."
      });

      // 삭제 효과음 재생
      playSound('delete');

      if (onMemoUpdate) {
        onMemoUpdate();
      }
    } catch (error) {
      const errorInfo = handleFirebaseError(error);
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [memo.id, memo.images, onMemoUpdate, toast]);

  const handleStopProcessing = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await firestoreService.updateMemo(memo.id, { 
        isProcessing: false,
        n8nStatus: 'error',
        n8nError: '사용자에 의해 중단됨' 
      });
      toast({
        title: "처리 중지됨",
        description: "사용자에 의해 처리가 중지되었습니다."
      });
      if (onMemoUpdate) onMemoUpdate();
    } catch (error) {
      console.error('Stop error:', error);
    }
  }, [memo.id, onMemoUpdate, toast]);

  return {
    isDeleting,
    isExpanded,
    isSentShare,
    isReceivedShare,
    canDelete,
    canEdit,
    formattedDate,
    truncatedContent,
    getTitleForPC,
    getMobileContent,
    handleClick,
    handleExpandToggle,
    handleCopy,
    handleEdit,
    handleDelete,
    handleStopProcessing
  };
};
