import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BookmarkIcon, XMarkIcon, CheckIcon, PhotoIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Layout } from '../components/common/Layout';
import { ImageUpload } from '../components/memo/ImageUpload';
import { CategoryType } from '../components/ui/category-badge';
import { TemplateSidebar } from '../components/ui/sidebar';
import { MemoEditor } from '../components/memo/MemoEditor';
import { MemoCategoryBar } from '../components/memo/MemoCategoryBar';
import { MemoActionButtons } from '../components/memo/MemoActionButtons';
import { IMemoFormData } from '../types/memo';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useDevice } from '../hooks/useDevice';
import { useDynamicTextareaHeight } from '../hooks/useDynamicTextareaHeight';
import { useFontSize } from '../hooks/useFontSize';
import { useTheme } from '../hooks/useTheme';
import { Loader2 } from 'lucide-react';
import { storageService } from '../services/firebase/storage';
import { IFirebaseTemplate } from '../types/firebase';
import { ShareSettingsBadge } from '../components/ui/share-settings-badge';
import { ShareSettingsModal } from '../components/memo/ShareSettingsModal';
import { useMemoForm } from '../hooks/useMemoForm';

export const MemoEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { memoId } = useParams<{ memoId: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { getMemoById, updateMemo, loading: isSaving } = useMemos();
  const { data: templates } = useTemplates();
  const { isDesktop, isMobile } = useDevice();
  const { fontSizeClasses } = useFontSize();
  const { isDark } = useTheme();

  const {
    formData,
    setFormData,
    sharedWith,
    setSharedWith,
    isTemplateSidebarOpen,
    setIsTemplateSidebarOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    isUploading,
    setIsUploading,
    textareaHeight,
    textareaRef,
    isMobileLightMode,
    extractTitle,
    handleContentChange,
    handlePaste,
    handleCategoryChange,
    handleImagesChange,
    handleSidebarTemplateSelect,
    handleTemplateCopy
  } = useMemoForm();

  const [isLoading, setIsLoading] = useState(true);
  const [originalImages, setOriginalImages] = useState<string[]>([]);

  // 기존 메모 데이터 로딩
  useEffect(() => {
    const loadMemo = async () => {
      console.log('🔍 MemoEditPage loadMemo 시작:', { memoId });

      if (!memoId) {
        console.log('❌ memoId가 없음');
        return;
      }

      // 인증 상태 체크 - 인증이 완료되지 않았으면 대기
      if (authLoading || !isAuthenticated || !user) {
        console.log('⏳ 인증 상태 대기 중...', { authLoading, isAuthenticated, user: !!user });
        return;
      }

      try {
        setIsLoading(true);
        console.log('📡 getMemoById 호출 중...');
        const memo = await getMemoById(memoId);
        console.log('📡 getMemoById 결과:', memo);

        if (memo) {
          console.log('✅ 메모 찾음:', memo);

          // 권한 체크
          const isOwner = memo.userId === user.uid;
          const sharedUser = memo.sharedWith?.find(u => u.uid === user.uid);
          const canEdit = isOwner || sharedUser?.permissions.edit === true;

          if (!canEdit) {
            toast({
              title: "권한 없음",
              description: "이 메모를 수정할 권한이 없습니다.",
              variant: "destructive"
            });
            navigate('/memos');
            return;
          }

          // 본문만 편집 필드에 표시 (제목은 제외)
          setFormData({
            content: memo.content || '',
            images: [], // 기존 이미지는 별도 관리
            category: memo.category || 'temporary'
          });

          // 기존 이미지 URL 저장
          setOriginalImages(memo.images || []);

          // 공유 정보 저장
          setSharedWith(memo.sharedWith || []);
        } else {
          console.log('❌ 메모를 찾을 수 없음');
          toast({
            title: "메모를 찾을 수 없습니다",
            description: "요청하신 메모가 존재하지 않습니다.",
            variant: "destructive"
          });
          // navigate('/'); // 임시로 주석 처리
        }
      } catch (error) {
        console.error('❌ 메모 로딩 실패:', error);
        toast({
          title: "메모 로딩 실패",
          description: "메모를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive"
        });
        // navigate('/'); // 임시로 주석 처리
      } finally {
        setIsLoading(false);
      }
    };

    loadMemo();
  }, [memoId, getMemoById, toast, authLoading, isAuthenticated, user]);

  const handleExistingImagesChange = (images: string[]) => {
    console.log('🖼️ handleExistingImagesChange 호출됨:', images);
    setOriginalImages(images);
  };

  const handleSave = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "내용을 입력해주세요",
        description: "메모 내용을 입력한 후 저장해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!memoId) {
      toast({
        title: "메모 ID가 없습니다",
        description: "수정할 메모를 찾을 수 없습니다.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('✅ updateMemo 호출 시작...');

      // 본문의 처음 10자를 제목으로 추출 (줄바꿈 제거)
      const title = extractTitle(formData.content);

      // 새로 추가된 이미지들을 업로드
      const uploadedImageUrls: string[] = [];
      if (formData.images.length > 0) {
        console.log('📤 새로 추가된 이미지 업로드 시작:', formData.images.length, '개');

        for (const imageFile of formData.images) {
          try {
            const imageUrl = await storageService.uploadImage(imageFile, user?.uid || '');
            uploadedImageUrls.push(imageUrl);
            console.log('✅ 이미지 업로드 완료:', imageUrl);
          } catch (error) {
            console.error('❌ 이미지 업로드 실패:', error);
            toast({
              title: "이미지 업로드 실패",
              description: `${imageFile.name} 업로드 중 오류가 발생했습니다.`,
              variant: "destructive"
            });
            throw error;
          }
        }
      }

      // 기존 이미지와 새로 업로드된 이미지를 합쳐서 저장
      const allImages = [...originalImages, ...uploadedImageUrls];

      // Firebase Firestore에 메모 업데이트
      await updateMemo(memoId, {
        title,
        content: formData.content.trim(),
        images: allImages, // 기존 이미지 + 새로 업로드된 이미지
        category: formData.category,
        tags: [], // 향후 태그 기능 추가 시 사용
        sharedWith,
        sharedWithUids: sharedWith.map(u => u.uid)
      });

      console.log('🎉 메모 업데이트 성공!');
      toast({
        title: "메모 수정 완료",
        description: "메모가 성공적으로 수정되었습니다."
      });
      navigate('/memos'); // 메모 목록 페이지로 이동
    } catch (error) {
      console.error('메모 수정 중 오류:', error);
      toast({
        title: "메모 수정 실패",
        description: "메모 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/memos');
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <Layout title="메모 수정" showNewButton={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="p-6 shadow-lg">
            <CardContent className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">메모를 불러오는 중...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // PC 모드용 개선된 레이아웃
  if (isDesktop) {
    return (
      <Layout title="메모 수정" showNewButton={false}>
        <div className="max-w-4xl mx-auto p-3">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    뒤로가기
                  </Button>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    메모 수정
                  </CardTitle>
                </div>

                {/* 상용구 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTemplateSidebarOpen(true)}
                  className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
                >
                  <BookmarkIcon className="h-4 w-4" />
                  상용구
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 카테고리 선택과 액션 버튼 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <MemoCategoryBar
                  category={formData.category}
                  onCategoryChange={handleCategoryChange}
                  sharedCount={sharedWith.length}
                  onShareClick={() => setIsShareModalOpen(true)}
                  isMobile={false}
                />
                <MemoActionButtons
                  onCancel={handleCancel}
                  onSave={handleSave}
                  isSaving={isSaving}
                  isMobile={false}
                  saveButtonText="수정"
                  savingText="수정 중..."
                />
              </div>

              <MemoEditor
                content={formData.content}
                onContentChange={handleContentChange}
                onPaste={handlePaste}
                images={formData.images}
                onImagesChange={handleImagesChange}
                existingImages={originalImages}
                onExistingImagesChange={handleExistingImagesChange}
                textareaRef={textareaRef}
                isMobile={false}
                fontSizeClasses={fontSizeClasses}
              />


            </CardContent>
          </Card>
        </div>

        {/* 상용구 사이드바 */}
        <TemplateSidebar
          isOpen={isTemplateSidebarOpen}
          onClose={() => setIsTemplateSidebarOpen(false)}
          templates={templates && templates.length > 0 ? templates : [
            {
              id: 'test-template-1',
              userId: 'test-user',
              title: '테스트 상용구 1',
              content: '안녕하세요! 이것은 테스트 상용구입니다.',
              category: '테스트',
              usageCount: 0,
              isPublic: false,
              createdAt: { toDate: () => new Date() } as any,
              updatedAt: { toDate: () => new Date() } as any
            } as IFirebaseTemplate,
            {
              id: 'test-template-2',
              userId: 'test-user',
              title: '테스트 상용구 2',
              content: '두 번째 테스트 상용구입니다.',
              category: '테스트',
              usageCount: 0,
              isPublic: false,
              createdAt: { toDate: () => new Date() } as any,
              updatedAt: { toDate: () => new Date() } as any
            } as IFirebaseTemplate
          ]}
          onTemplateSelect={(content) => {
            console.log('🎯 MemoEditPage TemplateSidebar에서 직접 호출된 onTemplateSelect:', content);
            handleSidebarTemplateSelect(content);
          }}
          onTemplateCopy={handleTemplateCopy}
        />

        {/* 이미지 업로드 중 로딩 오버레이 */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 shadow-lg max-w-sm w-full mx-4">
              <CardContent className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    이미지 업로드 중
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {formData.images.length}개의 이미지를 처리하고 있습니다...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 공유 설정 모달 */}
        <ShareSettingsModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sharedWith={sharedWith}
          onUpdateSharedWith={setSharedWith}
        />
      </Layout>
    );
  }

  // 모바일 모드 - Shadcn UI로 개선된 디자인
  return (
    <Layout title="메모 수정" showNewButton={false}>
      <div className="flex flex-col h-full space-y-2">
        {/* 헤더 - 새로운 타이틀 스타일 */}
        <div className={`flex items-center justify-between px-4 py-1.5 rounded-lg shadow-sm ${isMobileLightMode
          ? 'bg-white border border-gray-200'
          : 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 shadow-md'
          }`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className={`flex items-center gap-1.5 rounded-md transition-all duration-200 h-8 ${isMobileLightMode
              ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              : 'text-white hover:text-blue-100 hover:bg-white/10'
              }`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">뒤로가기</span>
          </Button>

          {/* 메모 수정 라벨 */}
          <div className="flex items-center">
            <div className={`w-1 h-1 rounded-full mr-2 ${isMobileLightMode
              ? 'bg-gray-400'
              : 'bg-white'
              }`}></div>
            <span className={`text-sm font-semibold tracking-wide ${isMobileLightMode
              ? 'text-gray-700'
              : 'text-white'
              }`}>메모 수정</span>
          </div>
        </div>

      </div>

      {/* 상용구 사이드바 */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setIsTemplateSidebarOpen(false)}
        templates={templates && templates.length > 0 ? templates : [
          {
            id: 'test-template-1',
            userId: 'test-user',
            title: '테스트 상용구 1',
            content: '안녕하세요! 이것은 테스트 상용구입니다.',
            category: '테스트',
            usageCount: 0,
            isPublic: false,
            createdAt: { toDate: () => new Date() } as any,
            updatedAt: { toDate: () => new Date() } as any
          },
          {
            id: 'test-template-2',
            userId: 'test-user',
            title: '테스트 상용구 2',
            content: '두 번째 테스트 상용구입니다.',
            category: '테스트',
            usageCount: 0,
            isPublic: false,
            createdAt: { toDate: () => new Date() } as any,
            updatedAt: { toDate: () => new Date() } as any
          }
        ]}
        onTemplateSelect={(content) => {
          console.log('🎯 MemoEditPage TemplateSidebar에서 직접 호출된 onTemplateSelect:', content);
          handleSidebarTemplateSelect(content);
        }}
        onTemplateCopy={handleTemplateCopy}
      />

      {/* 이미지 업로드 중 로딩 오버레이 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 shadow-lg max-w-sm w-full mx-4">
            <CardContent className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  이미지 업로드 중
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formData.images.length}개의 이미지를 처리하고 있습니다...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* 공유 설정 모달 */}
      <ShareSettingsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        sharedWith={sharedWith}
        onUpdateSharedWith={setSharedWith}
        memoId={memoId}
        memoTitle={extractTitle(formData.content)}
        currentUser={user ? {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || '익명',
          email: user.email || '',
          photoURL: user.photoURL || '',
          emailVerified: user.emailVerified,
          lastLoginAt: {} as any,
          createdAt: {} as any,
          updatedAt: {} as any,
          id: user.uid,
          settings: { theme: 'light', language: 'ko', notifications: true }
        } : null}
      />
    </Layout>
  );
};

export default MemoEditPage; 