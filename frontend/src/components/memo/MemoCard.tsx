import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { CategoryBadge } from '../ui/category-badge';
import { IFirebaseMemo } from '../../types/firebase';
import { useNavigate } from 'react-router-dom';
import { useDevice } from '../../hooks/useDevice';
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
  TrashIcon
} from '@heroicons/react/24/outline';
import { handleFirebaseError } from '../../utils/errorHandler';

interface MemoCardProps {
  memo: IFirebaseMemo;
  onMemoUpdate?: () => void;
}

const MemoCardComponent: React.FC<MemoCardProps> = ({ memo, onMemoUpdate }) => {
  const navigate = useNavigate();
  const { isDesktop, getTemplateSidebarWidth } = useDevice();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 날짜 포맷팅 함수를 useMemo로 최적화
  const formattedDate = useMemo(() => {
    const timestamp = memo.createdAt || memo.updatedAt;
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    
    // 날짜만 비교하기 위해 시간을 제거
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 날짜 차이 계산 (밀리초 단위)
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // 시간 포맷팅 (HH:MM)
    const timeString = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (diffDays === 0) {
      return `오늘 (${timeString})`;
    } else if (diffDays === 1) {
      return `어제 (${timeString})`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전 (${timeString})`;
    } else {
      // 모바일 모드일 때는 YYYY/MM/DD 형식으로 표시하고 시간 제외
      if (!isDesktop) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}/${month}/${day}`;
      } else {
        // 데스크톱 모드일 때는 기존 형식 유지
        const dateString = date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        return `${dateString} (${timeString})`;
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
    navigate(`/memo/${memo.id}`);
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
      className={`group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-card border border-border/40 hover:border-border/60 rounded-lg overflow-hidden ${isDesktop ? 'h-[364px]' : 'min-h-[220px]'}`}
      onClick={handleClick}
    >
      <CardHeader className={`pb-3 px-4 pt-4 bg-white dark:bg-card relative ${isDesktop ? 'pb-2' : ''}`}>
        {isDesktop ? (
          <>
            {/* PC 모드: 제목만 표시 */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* 제목만 표시 */}
                <h3 className={`font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors ${fontSizeClasses.title}`}>
                  {getTitleForPC}
                </h3>
              </div>
            </div>
            
            {/* PC 모드: 제목 아래 새로운 행에 카테고리 뱃지, 액션 버튼, 작성시간 배치 */}
            <div className="flex items-center justify-between mt-2 bg-muted/30 dark:bg-muted/20 rounded px-2 py-1.5">
              {/* 왼쪽: 카테고리 뱃지와 작성시간 */}
              <div className="flex items-center gap-3">
                <CategoryBadge category={memo.category || 'temporary'} size="sm" />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ClockIcon className="h-3 w-3" />
                  <span className={`text-xs ${fontSizeClasses.date}`}>
                    {formattedDate}
                  </span>
                </div>
              </div>
              
              {/* 오른쪽: 액션 버튼들 */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleCopy}
                  title="복사"
                >
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleEdit}
                  title="수정"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
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
              </div>
            </div>
          </>
        ) : (
          // 모바일 모드: 카테고리 뱃지와 액션 버튼을 같은 줄에 배치
          <div className="flex items-center justify-between mb-2 bg-muted/30 dark:bg-muted/20 rounded px-2 py-1.5">
            {/* 왼쪽: 카테고리 뱃지와 작성시간 */}
            <div className="flex items-center gap-3">
              <CategoryBadge category={memo.category || 'temporary'} size="sm" />
              <div className="flex items-center gap-1 text-muted-foreground">
                <ClockIcon className="h-3 w-3" />
                <span className={`text-xs ${fontSizeClasses.date}`}>
                  {formattedDate}
                </span>
              </div>
            </div>
            
            {/* 오른쪽: 액션 버튼들 */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleCopy}
                title="복사"
              >
                <DocumentDuplicateIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={handleEdit}
                title="수정"
              >
                <PencilIcon className="h-3.5 w-3.5" />
              </Button>
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
            </div>
          </div>
        )}


      </CardHeader>

      <CardContent className={`px-4 pb-4 pt-0 bg-white dark:bg-card relative ${isDesktop ? 'flex flex-col h-full' : 'flex flex-col h-full'}`}>

        {/* 내용 미리보기 - 이미지 유무에 따라 다른 레이아웃 */}
        {isDesktop ? (
          // PC 모드: 이미지 유무에 따라 최적화된 레이아웃
          <>
            {memo.images.length === 0 ? (
              // 이미지가 없을 때: 더 큰 고정 높이로 텍스트 영역 설정
              <div className="bg-muted/80 dark:bg-muted/70 rounded-lg p-3 mb-4 relative h-[280px] flex flex-col">
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