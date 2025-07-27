import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, BookmarkIcon, XMarkIcon, CheckIcon, PhotoIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Layout } from '../components/common/Layout';
import { ImageUpload } from '../components/memo/ImageUpload';
import { CategorySelector, CategoryType } from '../components/ui/category-badge';
import { TemplateSidebar } from '../components/ui/sidebar';
import { IMemoFormData } from '../types/memo';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { useToast } from '../hooks/use-toast';
import { useDevice } from '../hooks/useDevice';
import { useDynamicTextareaHeight } from '../hooks/useDynamicTextareaHeight';
import { useFontSize } from '../hooks/useFontSize';
import { Loader2 } from 'lucide-react';

export const MemoCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createMemo, loading: isSaving } = useMemos();
  const { data: templates, loading: templatesLoading } = useTemplates();
  const { isDesktop, isMobile, getTemplateSidebarWidth } = useDevice();
  const { fontSizeClasses } = useFontSize();
  
  const [formData, setFormData] = useState<IMemoFormData>({
    content: '',
    images: [],
    category: 'temporary'
  });

  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(230); // 기본 높이
  
  // 동적 텍스트 필드 높이 훅 사용
  const { textareaRef } = useDynamicTextareaHeight({
    isMobile,
    dependencies: [formData.images.length] // 이미지 개수 변경 시 높이 재계산
  });

  // 디바이스 크기에 따른 텍스트 필드 높이 계산
  useEffect(() => {
    const calculateTextareaHeight = () => {
      if (!isMobile) return;

      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;
      
      // 기본 높이 계산 (최소 230px)
      let baseHeight = Math.max(230, screenHeight * 0.31);
      
      // 화면 크기에 따른 추가 높이 조정
      if (screenHeight >= 800) {
        // 큰 화면 (800px 이상)
        baseHeight = Math.max(280, screenHeight * 0.35);
      } else if (screenHeight >= 700) {
        // 중간 화면 (700-800px)
        baseHeight = Math.max(260, screenHeight * 0.33);
      } else if (screenHeight >= 600) {
        // 작은 화면 (600-700px)
        baseHeight = Math.max(240, screenHeight * 0.32);
      } else {
        // 매우 작은 화면 (600px 미만)
        baseHeight = Math.max(230, screenHeight * 0.30);
      }
      
      // 가로 세로 비율에 따른 조정
      const aspectRatio = screenWidth / screenHeight;
      if (aspectRatio > 0.5) { // 세로가 더 긴 화면
        baseHeight = Math.min(baseHeight + 20, screenHeight * 0.4);
      }
      
      setTextareaHeight(baseHeight);
    };

    // 초기 계산
    calculateTextareaHeight();

    // 리사이즈 이벤트 리스너
    const handleResize = () => {
      calculateTextareaHeight();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile]);

  // 메모 내용에서 제목 추출 (줄바꿈 제거 후 10자)
  const extractTitle = (content: string): string => {
    const cleanContent = content.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    return cleanContent.substring(0, 10) || '제목 없음';
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 클립보드에 이미지가 있는지 확인
    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault(); // 기본 텍스트 붙여넣기 방지
      
      const newImages: File[] = [];
      
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          // 파일명 생성 (클립보드 이미지는 보통 이름이 없음)
          const timestamp = Date.now();
          const extension = file.type.split('/')[1] || 'png';
          const fileName = `clipboard-image-${timestamp}.${extension}`;
          
          // File 객체 생성
          const imageFile = new File([file], fileName, { type: file.type });
          newImages.push(imageFile);
        }
      }

      if (newImages.length > 0) {
        // 기존 이미지에 새 이미지 추가
        const updatedImages = [...formData.images, ...newImages];
        setFormData(prev => ({ ...prev, images: updatedImages }));
        
        // 사용자에게 알림
        toast({
          title: "이미지 추가됨",
          description: `${newImages.length}개의 이미지가 클립보드에서 추가되었습니다.`,
        });
      }
    }
  };

  const handleCategoryChange = (category: CategoryType) => {
    setFormData(prev => ({ ...prev, category }));
  };

  const handleImagesChange = (images: File[]) => {
    console.log('🖼️ handleImagesChange 호출됨:', images.map(img => img.name));
    setFormData(prev => ({ ...prev, images }));
  };

  // 상용구 사이드바에서 템플릿 선택
  const handleSidebarTemplateSelect = (content: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent = currentContent.substring(0, start) + content + currentContent.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));

    // 커서 위치 업데이트
    setTimeout(() => {
      const newCursorPos = start + content.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

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

  // 상용구 클립보드 복사
  const handleTemplateCopy = async (content: string) => {
    try {
      const success = await copyToClipboard(content);
      
      if (success) {
        toast({
          title: "복사 완료",
          description: "상용구가 클립보드에 복사되었습니다."
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

  const handleSave = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "내용을 입력해주세요",
        description: "메모 내용을 입력한 후 저장해주세요.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('✅ createMemo 호출 시작...');
      
      // 본문의 처음 10자를 제목으로 추출 (줄바꿈 제거)
      const title = extractTitle(formData.content);
      
      // Firebase Firestore에 메모 저장 (전체 content 저장)
      await createMemo({
        title,
        content: formData.content.trim(), // 전체 content를 그대로 저장
        images: formData.images,
        category: formData.category,
        tags: [], // 향후 태그 기능 추가 시 사용
      });

      console.log('🎉 메모 저장 성공!');
      toast({
        title: "메모 저장 완료",
        description: "새 메모가 성공적으로 저장되었습니다."
      });
      navigate('/'); // 메모 목록 페이지로 이동
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
    navigate('/');
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
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리:</span>
                  <CategorySelector
                    selectedCategory={formData.category}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2"
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        저장
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 메모 입력 영역 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    메모 내용
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.content.length}자
                  </span>
                </div>
                <div className="relative">
                  <Textarea
                    id="content"
                    ref={textareaRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    onPaste={handlePaste}
                    placeholder="메모 내용을 입력하세요..."
                    className={`min-h-[350px] resize-none border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 ${fontSizeClasses.content}`}
                  />
                </div>
              </div>

              {/* 이미지 업로드 영역 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">이미지 첨부</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200" style={{ minHeight: 'calc(8rem - 30px)' }}>
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={handleImagesChange}
                  />
                </div>
              </div>


            </CardContent>
          </Card>
        </div>

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
      </Layout>
    );
  }

  // 모바일 모드 - Shadcn UI로 개선된 디자인
  return (
    <Layout title="새 메모 작성" showNewButton={false}>
      <div className="flex flex-col h-full space-y-2">
        {/* 헤더 - 새로운 타이틀 스타일 */}
                  <div className="flex items-center justify-between px-4 py-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 rounded-lg shadow-md">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-white hover:text-blue-100 hover:bg-white/10 rounded-md transition-all duration-200 h-8"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">뒤로가기</span>
          </Button>
          
          {/* 새 메모 작성 라벨 */}
          <div className="flex items-center">
            <div className="w-1 h-1 bg-white rounded-full mr-2"></div>
            <span className="text-sm font-semibold text-white tracking-wide">새 메모 작성</span>
          </div>
        </div>

        {/* 카테고리와 상용구 버튼 - 컴팩트하게 우측 정렬 */}
        <div className="flex items-center justify-end gap-2">
          <CategorySelector
            selectedCategory={formData.category}
            onCategoryChange={handleCategoryChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateSidebarOpen(true)}
            className="flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20 px-2 py-1 h-8"
          >
            <BookmarkIcon className="h-3 w-3" />
            <span className="text-xs">상용구</span>
          </Button>
        </div>

        {/* 메모 입력 영역 - 디바이스에 따른 동적 높이 */}
        <Card className="flex-1 shadow-sm border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4 h-full">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  메모 내용
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.content.length}자
                </span>
              </div>
              <div className="flex-1">
                <Textarea
                  id="content"
                  ref={textareaRef}
                  value={formData.content}
                  onChange={handleContentChange}
                  onPaste={handlePaste}
                  placeholder="메모 내용을 입력하세요..."
                  style={{ 
                    height: textareaHeight,
                    minHeight: '230px'
                  }}
                  className={`h-full resize-none border-0 focus:ring-0 focus:border-0 bg-transparent ${fontSizeClasses.content}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 업로드 영역 - 아이콘과 미리보기 분할 */}
        <Card className="shadow-sm border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* 카메라/갤러리 버튼과 이미지 미리보기 분할 */}
              <div className="grid grid-cols-2 gap-3">
                {/* 왼쪽: 카메라/갤러리 버튼 */}
                <div className="space-y-2">
                  {/* 카메라 버튼 */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const cameraInput = document.createElement('input');
                      cameraInput.type = 'file';
                      cameraInput.accept = 'image/*';
                      cameraInput.capture = 'environment';
                      cameraInput.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          handleImagesChange([...formData.images, ...Array.from(files)]);
                        }
                      };
                      cameraInput.click();
                    }}
                    className="w-full h-10 flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200"
                  >
                    <CameraIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                    <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">카메라</span>
                  </Button>

                  {/* 갤러리 버튼 */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.multiple = true;
                      fileInput.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          handleImagesChange([...formData.images, ...Array.from(files)]);
                        }
                      };
                      fileInput.click();
                    }}
                    className="w-full h-10 flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500 dark:hover:from-slate-600 dark:hover:to-slate-500 transition-all duration-200"
                  >
                    <PhotoIcon className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">갤러리</span>
                  </Button>
                </div>

                {/* 오른쪽: 이미지 미리보기 영역 */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-2 min-h-[84px]">
                  {formData.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-1">
                      {formData.images.slice(0, 4).map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`이미지 ${index + 1}`}
                            className="w-full h-16 object-cover rounded border border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              const newImages = formData.images.filter((_, i) => i !== index);
                              handleImagesChange(newImages);
                            }}
                          >
                            <XMarkIcon className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ))}
                      {formData.images.length > 4 && (
                        <div className="w-full h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500 font-medium">
                            +{formData.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼 - Shadcn UI 스타일 */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 h-12"
          >
            <XMarkIcon className="h-5 w-5 mr-2" />
            취소
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <CheckIcon className="h-5 w-5 mr-2" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

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
    </Layout>
  );
}; 