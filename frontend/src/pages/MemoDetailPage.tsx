import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { CategoryBadge } from '../components/ui/category-badge';
import { SimpleImageGallery } from '../components/ui/SimpleImage';
import { IFirebaseMemo, ISharedUser } from '../types/firebase';
import { firestoreService } from '../services/firebase/firestore';
import { ShareSettingsModal } from '../components/memo/ShareSettingsModal';
import { ShareSettingsBadge } from '../components/ui/share-settings-badge';
import { googleCalendarService } from '../services/google/calendar';
import { storageService } from '../services/firebase/storage';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useFontSize } from '../hooks/useFontSize';
import { useDevice } from '../hooks/useDevice';
import { useTheme } from '../hooks/useTheme';
import {
  ArrowLeftIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ShareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { handleFirebaseError } from '../utils/errorHandler';
import { formatLinksInText } from '../utils/linkFormatter';

export const MemoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const { isDesktop, isMobile, getTemplateSidebarWidth } = useDevice();
  const { isDark } = useTheme();
  const [memo, setMemo] = useState<IFirebaseMemo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedWith, setSharedWith] = useState<ISharedUser[]>([]);

  // 공유 상태 확인
  const isSentShare = useMemo(() => {
    return user && memo?.userId === user.uid && memo?.sharedWithUids && memo?.sharedWithUids.length > 0;
  }, [user, memo?.userId, memo?.sharedWithUids]);

  const isReceivedShare = useMemo(() => {
    return user && memo && memo.userId !== user.uid;
  }, [user, memo?.userId]);

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

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

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

  const formatDate = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();

    // 날짜만 비교하기 위해 시간을 제거
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 날짜 차이 계산 (밀리초 단위)
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
      const dateString = date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${dateString} (${timeString})`;
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

  useEffect(() => {
    const loadMemo = async () => {
      if (!id || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const memoData = await firestoreService.getMemo(id);
        if (memoData && (memoData.userId === user.uid || (memoData.sharedWithUids && memoData.sharedWithUids.includes(user.uid)))) {
          setMemo(memoData);
          setSharedWith(memoData.sharedWith || []);
        } else {
          toast({
            title: "메모를 찾을 수 없습니다",
            description: "해당 메모가 존재하지 않거나 접근 권한이 없습니다.",
            variant: "destructive"
          });
          navigate('/memos');
        }
      } catch (error) {
        console.error('메모 로드 중 오류:', error);
        const errorInfo = handleFirebaseError(error);
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive"
        });
        navigate('/memos');
      } finally {
        setIsLoading(false);
      }
    };

    loadMemo();
  }, [id, user, navigate, toast]);

  const handleEdit = () => {
    navigate(`/memo/${id}/edit`);
  };

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
      navigate('/memos');
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

  const handleBack = () => {
    // 현재 URL의 검색 파라미터를 유지하면서 메모 목록으로 이동
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
    const url = `/memos${queryString ? `?${queryString}` : ''}`;
    navigate(url);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  const handleUpdateSharedWith = async (newSharedWith: ISharedUser[]) => {
    if (!memo || !id) return;

    try {
      setSharedWith(newSharedWith);

      // 즉시 Firestore 업데이트
      await firestoreService.updateMemo(id, {
        sharedWith: newSharedWith,
        sharedWithUids: newSharedWith.map(u => u.uid)
      });

      // 로컬 상태 업데이트
      setMemo(prev => prev ? {
        ...prev,
        sharedWith: newSharedWith,
        sharedWithUids: newSharedWith.map(u => u.uid)
      } : null);

      toast({
        title: "공유 설정 반영됨",
        description: "공유 설정이 성공적으로 업데이트되었습니다."
      });
    } catch (error) {
      console.error('공유 설정 업데이트 오류:', error);
      toast({
        title: "업데이트 실패",
        description: "공유 설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="메모 상세보기">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">메모를 불러오는 중...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 로딩이 완료되었지만 메모가 없는 경우 (삭제되었거나 권한이 없는 경우)
  if (!memo && !isLoading) {
    return (
      <Layout title="메모 상세보기">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              메모를 찾을 수 없습니다
            </h2>
            <p className="text-muted-foreground mb-4">
              해당 메모가 삭제되었거나 접근 권한이 없습니다.
            </p>
            <Button onClick={handleBack} className="mt-4">
              목록으로 돌아가기
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // memo가 null인 경우 타입 가드
  if (!memo) {
    return null;
  }

  // PC 모드용 레이아웃
  if (isDesktop) {
    return (
      <Layout title="메모 상세보기">
        <div className="max-w-4xl mx-auto p-3">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    뒤로가기
                  </Button>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    메모 상세보기
                  </h1>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 메모 제목과 액션 버튼 */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h2 className={`font-semibold text-gray-900 dark:text-gray-100 ${fontSizeClasses.title}`}>
                    메모정보
                  </h2>
                </div>

                {/* 카테고리, 작성일, 액션 버튼 */}
                <div className="flex items-center justify-between mt-3">
                  {/* 왼쪽: 카테고리와 작성일 */}
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={memo.category || 'temporary'} size="md" />

                    {!memo.isProcessing && memo.n8nStatus && (
                      <Badge variant="outline" className={`h-8 px-2.5 bg-background text-[11px] font-bold ${memo.n8nStatus === 'success' ? 'text-green-600 border-green-200 bg-green-50' : memo.n8nStatus === 'error' ? 'text-red-600 border-red-200 bg-red-50' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                        {memo.n8nStatus === 'success' ? 'n8n 성공' : memo.n8nStatus === 'error' ? 'n8n 실패' : 'n8n 시간초과'}
                      </Badge>
                    )}

                    {/* 공유 상태 뱃지 (PC) */}
                    {user?.uid === memo.userId && (
                      <ShareSettingsBadge
                        sharedCount={sharedWith.length}
                        onClick={() => setIsShareModalOpen(true)}
                      />
                    )}
                    {isReceivedShare && (
                      <Badge variant="outline" className="h-8 px-2.5 bg-green-50 text-green-600 border-green-200 gap-1.5 flex items-center">
                        <ShareIcon className="h-4 w-4" />
                        <span className="text-xs font-bold">받음</span>
                      </Badge>
                    )}

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
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={isDeleting}
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
                {memo.n8nError && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-xs font-medium">
                    처리 실패 사유: {memo.n8nError}
                  </div>
                )}
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
            </CardContent>
          </Card>
        </div>

        {/* 이미지 전체 보기 모달 */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="relative max-w-[90vw] max-h-[90vh]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseImageModal}
                className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
              >
                <XMarkIcon className="h-6 w-6" />
              </Button>
              <img
                src={selectedImage}
                alt="전체 보기"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* 공유 설정 모달 */}
        {memo && (
          <ShareSettingsModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            sharedWith={sharedWith}
            onUpdateSharedWith={handleUpdateSharedWith}
            memoId={memo.id}
            memoTitle={memo.title}
            currentUser={user ? {
              userId: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || '익명',
              email: user.email || '',
              photoURL: user.photoURL || '',
              emailVerified: user.emailVerified,
              lastLoginAt: {} as any, // 임시
              createdAt: {} as any,
              updatedAt: {} as any,
              id: user.uid,
              settings: { theme: 'light', language: 'ko', notifications: true }
            } : null}
          />
        )}
      </Layout>
    );
  }

  // 모바일 모드 - Shadcn UI로 개선된 디자인
  return (
    <Layout title="메모 상세보기" showNewButton={false}>
      <div className="flex flex-col h-full space-y-2">
        {/* 헤더 - 새로운 타이틀 스타일 */}
        <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg shadow-sm ${isMobileLightMode
          ? 'bg-white border border-gray-200'
          : 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 shadow-md'
          }`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className={`flex items-center gap-1.5 rounded-md transition-all duration-200 h-8 ${isMobileLightMode
              ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              : 'text-white hover:text-blue-100 hover:bg-white/10'
              }`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">뒤로가기</span>
          </Button>

          {/* 메모 상세보기 라벨 */}
          <div className="flex items-center">
            <div className={`w-1 h-1 rounded-full mr-2 ${isMobileLightMode
              ? 'bg-gray-400'
              : 'bg-white'
              }`}></div>
            <span className={`text-sm font-semibold tracking-wide ${isMobileLightMode
              ? 'text-gray-700'
              : 'text-white'
              }`}>메모 상세보기</span>
          </div>
        </div>

        {/* 메모 제목과 액션 버튼 */}
        <Card className={`shadow-sm border-2 ${isMobileLightMode
          ? 'border-gray-200 bg-white'
          : 'border-gray-200 dark:border-gray-700'
          }`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h2 className={`font-semibold flex-1 pr-3 ${fontSizeClasses.title} ${isMobileLightMode
                  ? 'text-gray-900'
                  : 'text-gray-900 dark:text-gray-100'
                  }`}>
                  메모정보
                </h2>

                {/* 글자수와 사진 갯수 */}
                <div className={`flex items-center gap-2 text-xs ${isMobileLightMode
                  ? 'text-gray-600'
                  : 'text-gray-600 dark:text-gray-400'
                  }`}>
                  <span>{memo.content.length}자</span>
                  {memo.images.length > 0 && (
                    <span>• {memo.images.length}개 사진</span>
                  )}
                </div>
              </div>

              {/* 카테고리, 공유, 캘린더, 작성일 (모바일용 2줄 레이아웃) */}
              <div className="flex flex-col gap-2.5">
                {/* 첫 번째 줄: 뱃지들 (우측 맞춤) */}
                <div className="flex items-center justify-end gap-2">
                  <CategoryBadge
                    category={memo.category || 'temporary'}
                    size="sm"
                    className="h-7 px-2 flex items-center justify-center text-[10px]"
                  />

                  {!memo.isProcessing && memo.n8nStatus && (
                    <Badge variant="outline" className={`h-7 px-2 text-[10px] font-bold ${memo.n8nStatus === 'success' ? 'text-green-600 border-green-200 bg-green-50' : memo.n8nStatus === 'error' ? 'text-red-600 border-red-200 bg-red-50' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                      {memo.n8nStatus === 'success' ? '성공' : memo.n8nStatus === 'error' ? '실패' : '시간초과'}
                    </Badge>
                  )}

                  {/* 공유 상태 뱃지 (모바일) */}
                  {user?.uid === memo.userId && (
                    <ShareSettingsBadge
                      sharedCount={sharedWith.length}
                      onClick={() => setIsShareModalOpen(true)}
                    />
                  )}
                  {isReceivedShare && (
                    <Badge variant="outline" className="h-7 px-2 bg-green-50 text-green-600 border-green-200 gap-1 flex items-center">
                      <ShareIcon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold">받음</span>
                    </Badge>
                  )}

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
                    <span className="text-[10px] font-semibold">캘린더등록</span>
                  </Button>
                </div>

                {/* 두 번째 줄: 날짜 정보 (우측 맞춤) */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit self-end ${isMobileLightMode
                  ? 'text-gray-600 bg-gray-50/80 border border-gray-100'
                  : 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
                  }`}>
                  <CalendarIcon className="h-4 w-4" />
                  <span className={`text-xs font-medium ${fontSizeClasses.date}`}>
                    {formatFullDate(memo.updatedAt > memo.createdAt ? memo.updatedAt : memo.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메모 내용 */}
        <Card className={`flex-1 shadow-sm border-2 ${isMobileLightMode
          ? 'border-gray-200 bg-white'
          : 'border-gray-200 dark:border-gray-700'
          }`}>
          <CardContent className="p-4 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <label className={`font-medium ${fontSizeClasses.text} ${isMobileLightMode
                  ? 'text-gray-700'
                  : 'text-gray-700 dark:text-gray-300'
                  }`}>
                  메모 내용
                </label>
                {/* 액션 버튼들 */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 transition-colors ${isMobileLightMode
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                    onClick={handleCopy}
                    title="복사"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 transition-colors ${isMobileLightMode
                        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                      onClick={handleEdit}
                      title="수정"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 w-8 p-0 transition-colors ${isMobileLightMode
                            ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                            : 'text-muted-foreground hover:text-destructive'
                            }`}
                          title="삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
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
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? '삭제 중...' : '삭제'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <div className={`flex-1 p-1.5 rounded-lg ${isMobileLightMode
                ? 'bg-yellow-50 border-0'
                : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-0'
                }`}>
                <div className={`whitespace-pre-wrap leading-relaxed ${fontSizeClasses.content} min-h-[200px] overflow-y-auto ${isMobileLightMode
                  ? 'text-gray-700'
                  : 'text-gray-700 dark:text-gray-300'
                  } ${isMobileLightMode
                    ? 'bg-yellow-50 bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(229,231,235,0.65)_1.5rem,rgba(229,231,235,0.65)_1.6rem)] bg-[length:100%_1.6rem]'
                    : 'dark:bg-gray-800/60 dark:bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(75,85,99,0.25)_1.5rem,rgba(75,85,99,0.25)_1.51rem)] dark:bg-[length:100%_1.6rem]'
                  }`}>
                  {formatLinksInText(memo.content)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 갤러리 */}
        {memo.images.length > 0 && (
          <Card className={`shadow-sm border-2 ${isMobileLightMode
            ? 'border-gray-200 bg-white'
            : 'border-gray-200 dark:border-gray-700'
            }`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PhotoIcon className={`h-4 w-4 ${isMobileLightMode
                    ? 'text-gray-600'
                    : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  <span className={`font-medium ${fontSizeClasses.text} ${isMobileLightMode
                    ? 'text-gray-700'
                    : 'text-gray-700 dark:text-gray-300'
                    }`}>
                    첨부된 이미지 ({memo.images.length}개)
                  </span>
                </div>
                <div className={`p-3 rounded-lg border-2 border-dashed ${isMobileLightMode
                  ? 'bg-gray-50 border-gray-300'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600'
                  }`}>
                  <SimpleImageGallery images={memo.images} onImageClick={handleImageClick} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 이미지 전체 보기 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="relative max-w-[95vw] max-h-[95vh]">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/30 text-white rounded-full p-2"
            >
              <XMarkIcon className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="전체 보기"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* 공유 설정 모달 */}
      {memo && (
        <ShareSettingsModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sharedWith={sharedWith}
          onUpdateSharedWith={handleUpdateSharedWith}
        />
      )}
    </Layout>
  );
}; 