import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { CategoryBadge } from '../ui/category-badge';
import { IFirebaseMemo } from '../../types/firebase';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useFontSize } from '../../hooks/useFontSize';
import { firestoreService } from '../../services/firebase/firestore';
import { storageService } from '../../services/firebase/storage';
import {
  PhotoIcon,
  ClockIcon,
  DocumentTextIcon,
  StarIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { handleFirebaseError } from '../../utils/errorHandler';
import { Loader2 } from 'lucide-react';

interface MemoCardProps {
  memo: IFirebaseMemo;
  onMemoUpdate?: () => void;
}

const MemoCardComponent: React.FC<MemoCardProps> = ({ memo, onMemoUpdate }) => {
  const navigate = useNavigate();
  const { isDesktop, getTemplateSidebarWidth } = useDevice();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // n8n 처리 타임아웃 체크 (120초)
  useEffect(() => {
    if (!memo.isProcessing) return;

    const checkTimeout = async () => {
      const updatedAt = memo.updatedAt?.toDate ? memo.updatedAt.toDate() : new Date(memo.updatedAt);
      const now = new Date();
      const diffSeconds = (now.getTime() - updatedAt.getTime()) / 1000;

      if (diffSeconds > 120) {
        console.log(`[MemoCard] Auto-timing out stuck memo: ${memo.id}`);
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

    // 처음 한 번 체크하고, 10초마다 체크
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
    const sharedUser = memo.sharedWith?.find(u => u.uid === user.uid);
    return sharedUser?.permissions.delete === true;
  }, [user, memo]);

  // 수정 권한 확인
  const canEdit = useMemo(() => {
    if (!user || !memo) return false;
    if (memo.userId === user.uid) return true;
    const sharedUser = memo.sharedWith?.find(u => u.uid === user.uid);
    return sharedUser?.permissions.edit === true;
  }, [user, memo]);

  // 날짜 포맷팅 함수를 useMemo로 최적화
  const formattedDate = useMemo(() => {
    // 작성일자와 수정일자 중 최신 날짜 선택
    const createdAt = memo.createdAt?.toDate ? memo.createdAt.toDate() : new Date(memo.createdAt);
    const updatedAt = memo.updatedAt?.toDate ? memo.updatedAt.toDate() : new Date(memo.updatedAt);
    const timestamp = updatedAt > createdAt ? updatedAt : createdAt;
    const date = timestamp;
    const now = new Date();

    // 날짜만 비교하기 위해 시간을 제거
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 날짜 차이 계산 (밀리초 단위)
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 시간 포맷팅 (HH:mm)
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
      // 모바일 모드일 때는 최대한 축약 (YY.MM.DD)
      if (!isDesktop) {
        return dateShort;
      } else {
        // 데스크톱 모드에서도 축약된 형식 사용 (YY.MM.DD HH:mm)
        return `${dateShort} ${timeString}`;
      }
    }
  }, [memo.createdAt, memo.updatedAt, isDesktop]);

  // 텍스트 자르기 함수를 useMemo로 최적화
  const truncatedContent = useMemo(() => {
    const maxLength = isDesktop ? 220 : 150;
    if (memo.content.length <= maxLength) return memo.content;
    return memo.content.substring(0, maxLength) + '...';
  }, [memo.content, isDesktop]);

  // PC 모드용 제목 생성 함수 (본문 첫 줄 사용)
  const getTitleForPC = useMemo(() => {
    if (!isDesktop) return memo.title || '제목 없음';

    // 본문의 첫 줄 추출
    const firstLine = memo.content.split('\n')[0].trim();
    if (!firstLine) return '제목 없음';

    // 15자가 넘으면 ... 표시
    if (firstLine.length > 15) {
      return firstLine.substring(0, 21) + '...';
    }

    return firstLine;
  }, [memo.content, memo.title, isDesktop]);

  // 모바일용 텍스트 처리 함수 (줄바꿈 제거)
  const getMobileContent = useMemo(() => {
    if (isDesktop) return memo.content;

    if (isExpanded) {
      // 펼쳐진 상태: 원본 텍스트 그대로 표시 (줄바꿈 유지)
      return memo.content;
    } else {
      // 접힌 상태: 줄바꿈 제거하고 일렬로 붙여서 표시
      const contentWithoutNewlines = memo.content.replace(/\n/g, ' ');
      const maxLength = 150;
      if (contentWithoutNewlines.length <= maxLength) return contentWithoutNewlines;
      return contentWithoutNewlines.substring(0, maxLength) + '...';
    }
  }, [memo.content, isDesktop, isExpanded]);

  // 이벤트 핸들러들을 useCallback으로 최적화
  const handleClick = useCallback(() => {
    // 현재 URL의 검색 파라미터를 유지하면서 메모 상세 페이지로 이동
    const currentSearchParams = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams();

    // 검색 관련 파라미터들만 복사
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

  // 모바일 호환 클립보드 복사 함수
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // 1. 먼저 navigator.clipboard API 시도 (최신 브라우저)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // 2. fallback: document.execCommand 사용 (구형 브라우저, 모바일)
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
      console.error('클립보드 복사 실패:', error);
      return false;
    }
  };

  // 복사 기능
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

  // 수정 기능
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/memo/${memo.id}/edit`);
  }, [navigate, memo.id]);

  // 삭제 기능
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      // 이미지가 있으면 먼저 삭제
      if (memo.images && memo.images.length > 0) {
        for (const imageUrl of memo.images) {
          try {
            await storageService.deleteImage(imageUrl);
          } catch (error) {
            console.warn('이미지 삭제 실패:', error);
          }
        }
      }

      // 메모 삭제
      await firestoreService.deleteMemo(memo.id);

      toast({
        title: "삭제 완료",
        description: "메모가 성공적으로 삭제되었습니다."
      });

      // 부모 컴포넌트에 업데이트 알림
      if (onMemoUpdate) {
        onMemoUpdate();
      }
    } catch (error) {
      console.error('메모 삭제 중 오류:', error);
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

  return (
    <Card
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-card border border-border/40 hover:border-border/60 rounded-lg overflow-hidden relative ${isDesktop ? 'h-[364px]' : 'min-h-[220px]'}`}
      onClick={handleClick}
    >
      {/* n8n 처리 중 오버레이 */}
      {memo.isProcessing && (
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 z-20 flex flex-col items-center justify-center backdrop-blur-[2px] transition-all duration-500" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl flex flex-col items-center border border-purple-100 dark:border-purple-900/50">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400 mb-3" />
            <span className="text-sm font-bold text-purple-700 dark:text-purple-300 animate-pulse">n8n 처리 중...</span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-3">완료되면 자동으로 업데이트됩니다</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-3 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
              onClick={async (e) => {
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
              }}
            >
              중지
            </Button>
          </div>
        </div>
      )}
      <CardHeader className={`pb-3 pt-4 bg-white dark:bg-card relative ${isDesktop ? 'pb-2 px-4' : 'px-2'}`}>
        {isDesktop ? (
          <>
            {/* PC 모드: 제목 표시 */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors ${fontSizeClasses.title}`}>
                  {getTitleForPC}
                </h3>
              </div>
            </div>

            {/* PC 모드: 상단 바 (카테고리, 공유, 날짜, 액션) */}
            <div className="flex items-center justify-between mt-2 bg-muted/30 dark:bg-muted/20 rounded px-1.5 py-1">
              {/* 왼쪽: 카테고리 뱃지 및 공유 상태 */}
              <div className="flex items-center gap-1.5">
                <CategoryBadge category={memo.category || 'temporary'} size="sm" />
                {!memo.isProcessing && memo.n8nStatus && (
                  <span className={`text-[11px] font-bold px-1 ${memo.n8nStatus === 'success' ? 'text-green-600 dark:text-green-400' : memo.n8nStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {memo.n8nStatus === 'success' ? '성공' : memo.n8nStatus === 'error' ? '실패' : '시간초과'}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  {isSentShare && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-blue-50 text-blue-600 border-blue-200 gap-0.5 flex items-center whitespace-nowrap">
                      <UsersIcon className="h-3 w-3" />
                      <span className="text-[10px] font-bold">공유</span>
                    </Badge>
                  )}
                  {isReceivedShare && (
                    <Badge variant="outline" className="h-5 px-1.5 bg-green-50 text-green-600 border-green-200 gap-0.5 flex items-center whitespace-nowrap">
                      <ShareIcon className="h-3 w-3" />
                      <span className="text-[10px] font-bold">받음</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* 오른쪽: 날짜 + 액션 버튼들 */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center text-muted-foreground mr-0.5">
                  <span className={`text-[11px] whitespace-nowrap ${fontSizeClasses.date}`}>
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 border-l border-border/30 pl-1.5 ml-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={handleCopy}
                    title="복사"
                  >
                    <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={handleEdit}
                      title="수정"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="삭제"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>메모 삭제</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 메모를 삭제하시겠습니까?
                            {memo.images && memo.images.length > 0 && (
                              <span className="block mt-2 text-destructive">
                                첨부된 이미지 {memo.images.length}개도 함께 삭제됩니다.
                              </span>
                            )}
                            이 작업은 되돌릴 수 없습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={(e) => e.stopPropagation()}>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                          >
                            {isDeleting ? '삭제 중...' : '삭제'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          // 모바일 모드: 카테고리 뱃지와 액션 버튼을 같은 줄에 배치
          <div className="flex items-center justify-between mb-2 bg-muted/30 dark:bg-muted/20 rounded px-1 py-1">
            {/* 왼쪽: 카테고리 뱃지와 공유 상태 */}
            <div className="flex items-center gap-1">
              <CategoryBadge category={memo.category || 'temporary'} size="xs" />
              {!memo.isProcessing && memo.n8nStatus && (
                <span className={`text-[10px] font-bold px-1 ${memo.n8nStatus === 'success' ? 'text-green-600 dark:text-green-400' : memo.n8nStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {memo.n8nStatus === 'success' ? '성공' : memo.n8nStatus === 'error' ? '실패' : '시간초과'}
                </span>
              )}
              <div className="flex items-center gap-0.5">
                {isSentShare && (
                  <Badge variant="outline" className="h-4.5 px-1 bg-blue-50 text-blue-600 border-blue-200 gap-0.5 flex items-center whitespace-nowrap">
                    <UsersIcon className="h-2 w-2" />
                    <span className="text-[9px] font-bold">공유</span>
                  </Badge>
                )}
                {isReceivedShare && (
                  <Badge variant="outline" className="h-4.5 px-1 bg-green-50 text-green-600 border-green-200 gap-0.5 flex items-center whitespace-nowrap">
                    <ShareIcon className="h-2 w-2" />
                    <span className="text-[9px] font-bold">받음</span>
                  </Badge>
                )}
              </div>
            </div>

            {/* 오른쪽: 날짜 + 액션 버튼들 */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-muted-foreground">
                <span className={`text-[10px] leading-none whitespace-nowrap ${fontSizeClasses.date}`}>
                  {formattedDate}
                </span>
              </div>

              <div className="flex items-center gap-0.5 border-l border-border/30 pl-1 ml-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleCopy}
                  title="복사"
                >
                  <DocumentDuplicateIcon className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleEdit}
                  title="수정"
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      title="삭제"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>메모 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        이 메모를 삭제하시겠습니까?
                        {memo.images && memo.images.length > 0 && (
                          <span className="block mt-2 text-destructive">
                            첨부된 이미지 {memo.images.length}개도 함께 삭제됩니다.
                          </span>
                        )}
                        이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => e.stopPropagation()}>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                      >
                        {isDeleting ? '삭제 중...' : '삭제'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={`pb-4 pt-0 bg-white dark:bg-card relative ${isDesktop ? 'px-4 flex flex-col h-full' : 'px-2 flex flex-col h-full'}`}>

        {/* 내용 미리보기 - 이미지 유무에 따라 다른 레이아웃 */}
        {isDesktop ? (
          // PC 모드: 이미지 유무에 따라 최적화된 레이아웃
          <>
            {memo.images.length === 0 ? (
              // 이미지가 없을 때: 더 큰 고정 높이로 텍스트 영역 설정
              <div className="bg-muted/80 dark:bg-muted/70 rounded-lg p-3 mb-4 relative h-[280px] flex flex-col">
                {memo.n8nError && (
                  <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                    처리 실패: {memo.n8nError}
                  </div>
                )}
                <p className={`text-muted-foreground line-clamp-7 leading-tight whitespace-pre-wrap flex-1 ${fontSizeClasses.content}`}>
                  {truncatedContent}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[40px] bg-white dark:bg-card rounded-b-lg"></div>
              </div>
            ) : (
              // 이미지가 있을 때: 절대 위치로 이미지를 하단에 고정
              <div className="relative h-full">
                {/* 텍스트 영역 - 고정 높이로 설정 */}
                <div className="h-[220px] pb-22">
                  <div className="bg-muted/80 dark:bg-muted/70 rounded-lg p-3 h-full flex flex-col">
                    {memo.n8nError && (
                      <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                        처리 실패: {memo.n8nError}
                      </div>
                    )}
                    <p className={`text-muted-foreground line-clamp-7 leading-normal whitespace-pre-wrap flex-1 ${fontSizeClasses.content}`}>
                      {truncatedContent}
                    </p>
                  </div>
                </div>

                {/* 이미지 표시 - 절대 위치로 하단에 고정 */}
                <div className="absolute bottom-10 left-0 right-0 bg-white dark:bg-card rounded-lg border border-border/30 p-2 shadow-sm">
                  <div className="flex gap-2 overflow-hidden justify-start">
                    {memo.images.slice(0, 3).map((imageUrl, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={`이미지 ${index + 1}`}
                          className="w-16 h-16 object-cover rounded-md border border-border/30"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                    {memo.images.length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 bg-muted/50 rounded-md border border-border/30 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground font-medium">
                          +{memo.images.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* 작성일자 표시 (PC 모드만) */}
                  {isDesktop && (
                    <div className="absolute right-4 -bottom-8 flex items-center gap-2 text-muted-foreground">
                      <ClockIcon className="h-3 w-3" />
                      <span className={fontSizeClasses.date}>{formattedDate}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          // 모바일 모드: flexbox 레이아웃으로 변경
          <>
            {/* 텍스트 영역 - flex-1로 남은 공간 차지 */}
            <div className="flex-1">
              {memo.n8nError && (
                <div className="mb-2 p-1.5 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-[10px] font-bold">
                  처리 실패: {memo.n8nError}
                </div>
              )}
              <p className={`text-muted-foreground mb-2 leading-normal ${isExpanded ? 'whitespace-pre-wrap' : 'whitespace-normal'} ${fontSizeClasses.content} ${isExpanded ? '' : 'line-clamp-6'}`}>
                {getMobileContent}
              </p>
              {(memo.content.length > 150 || (memo.content.includes('\n') && !isDesktop)) && (
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="text-primary hover:text-primary/80 text-base font-semibold transition-colors"
                  >
                    {isExpanded ? '접기' : '더보기'}
                  </button>
                </div>
              )}
            </div>

            {/* 이미지 표시 - 하단에 배치 */}
            {memo.images.length > 0 && (
              <div className="mb-2 bg-muted/30 dark:bg-muted/20 rounded-lg border border-border/30 p-1.5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <PhotoIcon className="h-3.5 w-3.5 text-primary" />
                  <span className={`font-medium ${fontSizeClasses.text}`}>{memo.images.length}개 이미지</span>
                </div>
                <div className="flex gap-2 overflow-hidden">
                  {memo.images.slice(0, 3).map((imageUrl, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={`이미지 ${index + 1}`}
                        className="w-12 h-12 object-cover rounded-md border border-border/30"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ))}
                  {memo.images.length > 3 && (
                    <div className="flex-shrink-0 w-12 h-12 bg-muted/50 rounded-md border border-border/30 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-medium">
                        +{memo.images.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* 하단 정보 */}
        <div className={`flex items-center justify-between pt-2 border-t border-border/30 ${isDesktop ? 'mt-auto' : 'mt-auto'}`}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`bg-background/50 dark:bg-background/30 ${fontSizeClasses.text}`}>
              {memo.content.length}자
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// React.memo로 컴포넌트 최적화
export const MemoCard = React.memo(MemoCardComponent); 