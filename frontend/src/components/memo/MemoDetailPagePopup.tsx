import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { CategoryBadge } from '../ui/category-badge';
import { SimpleImageGallery } from '../ui/SimpleImage';
import { IFirebaseMemo } from '../../types/firebase';
import { firestoreService } from '../../services/firebase/firestore';
import { googleCalendarService } from '../../services/google/calendar';
import { storageService } from '../../services/firebase/storage';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useFontSize } from '../../hooks/useFontSize';
import { useDevice } from '../../hooks/useDevice';
import { useTheme } from '../../hooks/useTheme';
import { 
  CalendarIcon, 
  PhotoIcon, 
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { handleFirebaseError } from '../../utils/errorHandler';
import { formatLinksInText } from '../../utils/linkFormatter';

interface MemoDetailPagePopupProps {
  memoId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemoUpdate?: () => void;
  onCloseWithSearchState?: () => void;
}

export const MemoDetailPagePopup: React.FC<MemoDetailPagePopupProps> = ({ 
  memoId, 
  isOpen, 
  onClose, 
  onMemoUpdate,
  onCloseWithSearchState
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const [memo, setMemo] = useState<IFirebaseMemo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 모바일 호환 클립보드 복사 함수
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
      console.error('클립보드 복사 실패:', error);
      return false;
    }
  };

  // 메모 복사 함수
  const handleCopy = async () => {
    if (!memo) return;
    
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
  };

  const formatFullDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 메모 로드
  useEffect(() => {
    if (isOpen && memoId) {
      const loadMemo = async () => {
        try {
          setIsLoading(true);
          const memoData = await firestoreService.getMemo(memoId);
          if (memoData) {
            setMemo(memoData);
          } else {
            toast({
              title: "메모를 찾을 수 없습니다",
              description: "요청하신 메모가 존재하지 않습니다.",
              variant: "destructive"
            });
            onClose();
          }
        } catch (error) {
          console.error('메모 로드 오류:', error);
          const errorInfo = handleFirebaseError(error);
          toast({
            title: errorInfo.title,
            description: errorInfo.description,
            variant: "destructive"
          });
          onClose();
        } finally {
          setIsLoading(false);
        }
      };
      
      loadMemo();
    }
  }, [memoId, isOpen, toast, onClose]);

  // 수정 버튼 클릭
  const handleEdit = () => {
    if (memo) {
      window.open(`/memo/${memo.id}/edit`, '_blank');
    }
  };

  // 삭제 버튼 클릭
  const handleDelete = async () => {
    if (!memo) return;
    
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
      
      onClose();
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
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // 이미지 모달 닫기
  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onCloseWithSearchState) {
          onCloseWithSearchState();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose, onCloseWithSearchState]);

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={() => {
          if (onCloseWithSearchState) {
            onCloseWithSearchState();
          } else {
            onClose();
          }
        }}
      >
        {/* 팝업 컨테이너 */}
        <div 
          className="bg-white dark:bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[calc(100vh-120px)] overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-border py-3 px-4">
            <h2 className="font-semibold text-card-foreground text-xl">
              메모 상세보기
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (onCloseWithSearchState) {
                  onCloseWithSearchState();
                } else {
                  onClose();
                }
              }}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* 내용 */}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">메모를 불러오는 중입니다.</p>
                </div>
              </div>
            ) : memo ? (
              <div className="space-y-6">
                {/* 메모 제목과 액션 버튼 */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${fontSizeClasses.title}`}>
                      메모정보
                    </h3>
                  </div>
                  
                  {/* 카테고리, 작성일, 액션 버튼 */}
                  <div className="flex items-center justify-between mt-3">
                    {/* 왼쪽: 카테고리와 작성일 */}
                    <div className="flex items-center gap-3">
                      <CategoryBadge category={memo.category || 'temporary'} size="md" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-blue-600 transition-colors border-blue-500 border"
                        onClick={() => {
                          const now = new Date();
                          googleCalendarService.openCalendarEvent(memo, now, 60);
                        }}
                        title="구글 캘린더에 등록"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                        <span className="text-xs">캘린더등록</span>
                      </Button>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-md">
                        <CalendarIcon className="h-4 w-4" />
                        <span className={fontSizeClasses.date}>{formatFullDate(memo.updatedAt > memo.createdAt ? memo.updatedAt : memo.createdAt)}</span>
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
                            title="삭제"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
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
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDelete}
                              disabled={isDeleting}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isDeleting ? '삭제 중...' : '삭제'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>

                {/* 메모 내용 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`font-medium text-gray-700 dark:text-gray-300 ${fontSizeClasses.text}`}>
                      메모 내용
                    </label>
                    <span className={`text-gray-500 dark:text-gray-400 ${fontSizeClasses.text}`}>
                      {memo.content.length}자
                    </span>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-gray-800/60 rounded-lg border-0 min-h-[200px]">
                    <div className={`whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed ${fontSizeClasses.content} bg-yellow-50 bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(229,231,235,0.65)_1.5rem,rgba(229,231,235,0.65)_1.6rem)] bg-[length:100%_1.6rem] dark:bg-gray-800/60 dark:bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(75,85,99,0.25)_1.5rem,rgba(75,85,99,0.25)_1.51rem)] dark:bg-[length:100%_1.6rem]`}>
                      {formatLinksInText(memo.content)}
                    </div>
                  </div>
                </div>

                {/* 이미지 갤러리 */}
                {memo.images.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <PhotoIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className={`font-medium text-gray-700 dark:text-gray-300 ${fontSizeClasses.text}`}>
                        첨부된 이미지 ({memo.images.length}개)
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <SimpleImageGallery images={memo.images} onImageClick={handleImageClick} />
                    </div>
                  </div>
                )}

                {/* 태그 */}
                {memo.tags && memo.tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${fontSizeClasses.text} text-gray-700 dark:text-gray-300`}>
                        태그
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memo.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 rounded-md text-xs bg-muted text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  메모를 찾을 수 없습니다
                </h3>
                <p className="text-muted-foreground">
                  해당 메모가 삭제되었거나 접근 권한이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이미지 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={handleCloseImageModal}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={selectedImage} 
              alt="확대된 이미지"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseImageModal}
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 text-white hover:bg-black/70"
            >
              <XMarkIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}; 