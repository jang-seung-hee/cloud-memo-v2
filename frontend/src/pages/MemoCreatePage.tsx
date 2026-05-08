import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { firestoreService } from '../services/firebase/firestore';
import { useToast } from '../hooks/use-toast';
import { useDevice } from '../hooks/useDevice';
import { useDynamicTextareaHeight } from '../hooks/useDynamicTextareaHeight';
import { useFontSize } from '../hooks/useFontSize';
import { useTheme } from '../hooks/useTheme';
import { Loader2 } from 'lucide-react';
import { IFirebaseTemplate } from '../types/firebase';
import { ShareSettingsBadge } from '../components/ui/share-settings-badge';
import { ShareSettingsModal } from '../components/memo/ShareSettingsModal';
import { useMemoForm } from '../hooks/useMemoForm';
import { playSound } from '../utils/soundPlayer';

export const MemoCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { createMemo, loading: isSaving } = useMemos();
  const { data: templates, loading: templatesLoading } = useTemplates();
  const { isDesktop, isMobile } = useDevice();
  const { fontSizeClasses } = useFontSize();
  const { isDark } = useTheme();

  // templates 데이터 로깅 (개발 환경에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 MemoCreatePage templates 데이터:', {
        templates,
        templatesLength: templates?.length,
        firstTemplate: templates?.[0],
        templatesLoading,
        templatesType: typeof templates
      });

      // templates가 비어있는 경우 안내 메시지
      if (templates && templates.length === 0 && !templatesLoading) {
        console.log('ℹ️ 템플릿이 없습니다. 새 템플릿을 만들어보세요.');
      }
    }
  }, [templates, templatesLoading]);

  const {
    formData,
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

  const handleSave = async () => {
    let contentToSave = formData.content.trim();
    if (!contentToSave) {
      if (formData.images.length > 0) {
        contentToSave = '[이미지첨부]';
      } else {
        toast({
          title: "내용을 입력해주세요",
          description: "메모 내용을 입력한 후 저장해주세요.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsUploading(true);

    try {
      console.log('✅ createMemo 호출 시작...');

      // 본문의 처음 10자를 제목으로 추출 (줄바꿈 제거)
      const title = extractTitle(contentToSave);

      // Firebase Firestore에 메모 저장 (전체 content 저장)
      const newMemoId = await createMemo({
        title,
        content: contentToSave, // 전체 content를 그대로 저장
        images: formData.images,
        category: formData.category,
        tags: [], // 향후 태그 기능 추가 시 사용
        sharedWith,
        sharedWithUids: sharedWith.map(u => u.uid)
      });

      // 공유된 사용자에게 알림 전송 (메모 생성 시)
      if (newMemoId && sharedWith.length > 0 && user) {
        try {
          console.log('📢 공유 알림 전송 중... 대상:', sharedWith.length, '명');
          await Promise.all(sharedWith.map(targetUser =>
            firestoreService.createNotification({
              type: 'share',
              title: '새로운 메모 공유',
              body: `${user.displayName || user.email?.split('@')[0]}님이 메모를 공유했습니다.`,
              senderId: user.uid,
              senderName: user.displayName || user.email?.split('@')[0] || '익명',
              receiverId: targetUser.uid,
              memoId: newMemoId
            })
          ));
          console.log('✅ 공유 알림 전송 완료');
        } catch (error) {
          console.error('알림 전송 중 오류 발생:', error);
        }
      }

      console.log('🎉 메모 저장 성공!');
        toast({
          title: "메모 저장 완료",
          description: "새 메모가 성공적으로 저장되었습니다."
        });

        // 성공 효과음 재생
        playSound('success');

        navigate('/memos'); // 메모 목록 페이지로 이동
    } catch (error) {
      console.error('메모 저장 중 오류:', error);
      toast({
        title: "메모 저장 실패",
        description: "메모 저장 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    navigate('/memos');
  };

  // PC 모드용 개선된 레이아웃
  if (isDesktop) {
    return (
      <Layout title="새 메모 작성" showNewButton={false}>
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
                    새 메모 작성
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
                />
              </div>

              <MemoEditor
                content={formData.content}
                onContentChange={handleContentChange}
                onPaste={handlePaste}
                images={formData.images}
                onImagesChange={handleImagesChange}
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
          onClose={() => {
            console.log('🔧 MemoCreatePage onClose 호출됨');
            setIsTemplateSidebarOpen(false);
          }}
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
            console.log('🎯 MemoCreatePage TemplateSidebar에서 직접 호출된 onTemplateSelect:', content);
            console.log('🎯 onTemplateSelect 함수 타입:', typeof content);
            handleSidebarTemplateSelect(content);
          }}
          onTemplateCopy={(content) => {
            console.log('🎯 MemoCreatePage TemplateSidebar에서 직접 호출된 onTemplateCopy:', content);
            handleTemplateCopy(content);
          }}
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
          currentUser={null} // CreatePage에서는 저장 시점에 발송하므로 여기서는 null 또는 생략 가능
        />
      </Layout>
    );
  }

  // 모바일 모드 - Shadcn UI로 개선된 디자인
  return (
    <Layout title="새 메모 작성" showNewButton={false}>
      <div className="flex flex-col h-full space-y-2">
        {/* 헤더 - 새로운 타이틀 스타일 */}
        <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg shadow-sm ${isMobileLightMode
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

          {/* 새 메모 작성 라벨 */}
          <div className="flex items-center">
            <div className={`w-1 h-1 rounded-full mr-2 ${isMobileLightMode
              ? 'bg-gray-400'
              : 'bg-white'
              }`}></div>
            <span className={`text-sm font-semibold tracking-wide ${isMobileLightMode
              ? 'text-gray-700'
              : 'text-white'
              }`}>새 메모 작성</span>
          </div>
        </div>

        {/* 카테고리와 상용구 버튼 - 전체 너비로 정돈된 레이아웃 */}
        <MemoCategoryBar
          category={formData.category}
          onCategoryChange={handleCategoryChange}
          sharedCount={sharedWith.length}
          onShareClick={() => setIsShareModalOpen(true)}
          onTemplateClick={() => setIsTemplateSidebarOpen(true)}
          isMobile={true}
          isMobileLightMode={isMobileLightMode}
        />

        <MemoEditor
          content={formData.content}
          onContentChange={handleContentChange}
          onPaste={handlePaste}
          images={formData.images}
          onImagesChange={handleImagesChange}
          textareaRef={textareaRef}
          textareaHeight={textareaHeight}
          isMobile={true}
          isMobileLightMode={isMobileLightMode}
          fontSizeClasses={fontSizeClasses}
        />

        {/* 액션 버튼 */}
        <MemoActionButtons
          onCancel={handleCancel}
          onSave={handleSave}
          isSaving={isSaving}
          isMobile={true}
          isMobileLightMode={isMobileLightMode}
        />

        {/* 상용구 사이드바 */}
        <TemplateSidebar
          isOpen={isTemplateSidebarOpen}
          onClose={() => setIsTemplateSidebarOpen(false)}
          templates={templates || []}
          onTemplateSelect={handleSidebarTemplateSelect}
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
          currentUser={null} // CreatePage에서는 저장 시점에 발송하므로 여기서는 null 또는 생략 가능
        />
      </div>
    </Layout>
  );
};
