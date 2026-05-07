import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, BookmarkIcon, XMarkIcon, CheckIcon, PhotoIcon, CameraIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Layout } from '../components/common/Layout';
import { ImageUpload } from '../components/memo/ImageUpload';
import { TemplateSidebar } from '../components/ui/sidebar';
import { IMemoFormData } from '../types/memo';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { firestoreService } from '../services/firebase/firestore';
import { db } from '../services/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useDevice } from '../hooks/useDevice';
import { useDynamicTextareaHeight } from '../hooks/useDynamicTextareaHeight';
import { useFontSize } from '../hooks/useFontSize';
import { useTheme } from '../hooks/useTheme';
import { Loader2 } from 'lucide-react';
import { useN8nWorkflows } from '../features/n8n/hooks/useN8nWorkflows';
import { n8nWebhookService } from '../features/n8n/services/n8nWebhookService';
import { playSound } from '../utils/soundPlayer';

export const N8nMemoCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { workflowId } = useParams<{ workflowId: string }>();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { createMemo, loading: isSaving } = useMemos();
  const { data: templates } = useTemplates();
  const { isDesktop, isMobile } = useDevice();
  const { fontSizeClasses } = useFontSize();
  const { isDark } = useTheme();

  const { workflows, isLoading: isWorkflowsLoading } = useN8nWorkflows();
  const workflow = workflows.find(w => w.id === workflowId);

  const [formData, setFormData] = useState<IMemoFormData>({
    content: '',
    images: [],
    category: 'n8n'
  });

  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingMemoId, setProcessingMemoId] = useState<string | null>(null);
  const [textareaHeight, setTextareaHeight] = useState(230); // 기본 높이

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

  // 동적 텍스트 필드 높이 훅 사용
  const { textareaRef } = useDynamicTextareaHeight({
    isMobile,
    dependencies: [formData.images.length]
  });

  // 디바이스 크기에 따른 텍스트 필드 높이 계산
  useEffect(() => {
    const calculateTextareaHeight = () => {
      if (!isMobile) return;
      const screenHeight = window.innerHeight;
      let baseHeight = Math.max(230, screenHeight * 0.31);
      if (screenHeight >= 800) baseHeight = Math.max(280, screenHeight * 0.35);
      else if (screenHeight >= 700) baseHeight = Math.max(260, screenHeight * 0.33);
      else if (screenHeight >= 600) baseHeight = Math.max(240, screenHeight * 0.32);
      else baseHeight = Math.max(230, screenHeight * 0.30);
      setTextareaHeight(baseHeight);
    };
    calculateTextareaHeight();
    window.addEventListener('resize', calculateTextareaHeight);
    window.addEventListener('orientationchange', calculateTextareaHeight);
    return () => {
      window.removeEventListener('resize', calculateTextareaHeight);
      window.removeEventListener('orientationchange', calculateTextareaHeight);
    };
  }, [isMobile]);

  useEffect(() => {
    // 모든 로딩이 끝난 후에만 워크플로우 존재 여부 확인
    if (!authLoading && !isWorkflowsLoading && !workflow) {
      toast({
        title: "워크플로우를 찾을 수 없습니다.",
        description: "선택한 n8n 워크플로우가 존재하지 않거나 권한이 없습니다.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [authLoading, isWorkflowsLoading, workflow, navigate, toast]);

  // Firestore 리스너 제거 (HTTP 응답 방식으로 통합됨에 따라 불필요)

  const extractTitle = useCallback((content: string): string => {
    const cleanContent = content.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ');
    return cleanContent.substring(0, 10) || '제목 없음';
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
  }, []);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      const newImages: File[] = [];
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          const timestamp = Date.now();
          const extension = file.type.split('/')[1] || 'png';
          const fileName = `clipboard-image-${timestamp}.${extension}`;
          const imageFile = new File([file], fileName, { type: file.type });
          newImages.push(imageFile);
        }
      }
      if (newImages.length > 0) {
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        toast({
          title: "이미지 추가됨",
          description: `${newImages.length}개의 이미지가 클립보드에서 추가되었습니다.`,
        });
      }
    }
  };

  const handleImagesChange = (images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleSidebarTemplateSelect = (content: string) => {
    if (!content || content.trim() === '') return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    const newContent = currentContent.substring(0, start) + content + currentContent.substring(end);
    const newCursorPos = start + content.length;

    setFormData(prev => ({ ...prev, content: newContent }));

    requestAnimationFrame(() => {
      const updatedTextarea = textareaRef.current;
      if (updatedTextarea) {
        updatedTextarea.setSelectionRange(newCursorPos, newCursorPos);
        updatedTextarea.focus();
      }
    });
  };

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

  const handleTemplateCopy = async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast({ title: "복사 완료", description: "상용구가 클립보드에 복사되었습니다." });
    } else {
      toast({ title: "복사 실패", description: "클립보드 복사에 실패했습니다.", variant: "destructive" });
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
    if (!workflow) return;

    setIsUploading(true);

    try {
      const title = extractTitle(formData.content);

      // 1. 파이어베이스 저장용 텍스트 구성 (첨부파일 이름 추가)
      let finalContent = `n8n : [${workflow.name}]\n\n${formData.content.trim()}`;
      if (formData.images.length > 0) {
        const fileNames = formData.images.map(img => img.name).join(', ');
        finalContent += `\n\n[첨부파일: ${fileNames}]`;
      }

      // 2. Firestore에 먼저 저장하여 ID 확보 (isProcessing: true 설정)
      const memoId = await createMemo({
        title,
        content: finalContent,
        images: [],
        category: 'n8n',
        tags: [],
        isProcessing: true, // 비동기 처리 중임을 표시
        sharedWith: [],
        sharedWithUids: []
      });

      // processing 상태 설정하여 오버레이 유지 및 리스너 활성화
      if (memoId) {
        setProcessingMemoId(memoId);
      }

      // 3. n8n 웹훅 전송 (120초 타임아웃 적용)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120초 타임아웃 설정

      try {
        const result = await n8nWebhookService.sendMemoToN8n(
          workflow.url,
          workflow.token,
          {
            title,
            content: formData.content,
            memoId: memoId
          },
          formData.images,
          controller.signal
        );

        clearTimeout(timeoutId); // 요청 완료 시 타이머 해제

        const data = result.data || {};

        // 에러 필드가 실제로 유의미한 값을 가지는지 확인하는 헬퍼 함수
        const hasActualError = (val: any) => {
          if (!val) return false; // null, undefined, false, ""
          if (typeof val === 'string') return val.trim().length > 0;
          if (typeof val === 'object') return Object.keys(val).length > 0; // {} 나 [] 은 에러로 보지 않음
          return true;
        };

        // 최종 성공 조건 검증 (빈 객체 예외 처리 완벽 적용)
        const isLogicalError =
          (data.status && ['error', 'fail', 'failed'].includes(String(data.status).toLowerCase())) ||
          data.success === false ||
          hasActualError(data.error) ||
          hasActualError(data.errorMessage);

        const isFinalSuccess = result.success && !isLogicalError;

        if (isFinalSuccess) {
          // 성공 처리 (생략...)
          setIsUploading(false);
          setProcessingMemoId(null);

          // 성공 효과음 재생
          playSound('success');

          if (memoId) {
            const updateData: any = {
              isProcessing: false,
              n8nStatus: 'success'
            };

            // n8n 응답 데이터 반영 (output/title)
            if (data.output) updateData.content = data.output;
            if (data.title) updateData.title = data.title;

            await firestoreService.updateMemo(memoId, updateData);
          }

          toast({
            title: "n8n 처리 완료",
            description: "n8n으로부터 응답을 받아 메모가 성공적으로 업데이트되었습니다."
          });
          navigate('/memos');
        } else {
          // 실패 효과음 재생
          playSound('error');
          // 실패 처리 (에러 메시지 우선순위 추출 보완)
          const errorMsg =
            (data.error && typeof data.error === 'object' && data.error.message) ||
            (data.error && typeof data.error === 'string' && data.error) ||
            data.errorMessage || // n8n 표준 에러 메시지 우선 순위 상향
            data.message ||
            data.output ||
            result.statusText ||
            "알 수 없는 오류";

          setIsUploading(false);
          setProcessingMemoId(null);

          if (memoId) {
            await firestoreService.updateMemo(memoId, {
              isProcessing: false,
              n8nStatus: 'error',
              n8nError: errorMsg
            });
          }

          toast({
            title: "⚠️ n8n 처리 중 문제가 발생했어요",
            description: `${errorMsg}\n\n일시적인 문제일 수 있습니다. 메모는 저장되었으니 잠시 후 n8n을 다시 시도해 보세요.`,
            variant: "warning" as any,
          });
        }
      } catch (error: any) {
        clearTimeout(timeoutId);

        // 오류 효과음 재생
        playSound('error');

        let errorMsg = "메모를 저장하는 중 오류가 발생했습니다.";
        if (error.name === 'AbortError') {
          errorMsg = "n8n 응답 시간이 초과되었습니다.";
        }

        setIsUploading(false);
        setProcessingMemoId(null);

        if (memoId) {
          await firestoreService.updateMemo(memoId, {
            isProcessing: false,
            n8nStatus: 'error',
            n8nError: errorMsg
          });
        }

        toast({
          title: error.name === 'AbortError' ? "⏱️ 응답 시간이 초과되었어요" : "⚠️ 전송 중 문제가 발생했어요",
          description: error.name === 'AbortError'
            ? "네트워크 상태나 n8n 서버 부하에 따라 응답이 느릴 수 있어요. 메모는 저장되었으니 잠시 후 다시 시도해 보세요."
            : `${errorMsg}\n\n메모는 저장되었습니다. 잠시 후 n8n 전송을 다시 시도해 보세요.`,
          variant: "warning" as any,
        });
      }
    } catch (error) {
      console.error('n8n 저장 중 오류:', error);

      // 오류 효과음 재생
      playSound('error');

      toast({
        title: "⚠️ 저장 중 문제가 생겼어요",
        description: "메모를 저장하는 중 예기치 않은 문제가 발생했어요. \n네트워크 연결을 확인하고 다시 시도해 보세요.",
        variant: "warning" as any,
      });
      setIsUploading(false);
      setProcessingMemoId(null);
    }
  };

  const handleCancel = () => {
    navigate('/memos');
  };

  if (authLoading || isWorkflowsLoading) {
    return (
      <Layout title="n8n 자동화 작성" showNewButton={false}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </Layout>
    );
  }

  if (!workflow) {
    return null;
  }

  // PC 모드
  if (isDesktop) {
    return (
      <Layout title="n8n 자동화 작성" showNewButton={false}>
        <div className="max-w-4xl mx-auto p-3">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={handleCancel} className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <ArrowLeftIcon className="h-4 w-4" />
                    뒤로가기
                  </Button>
                  <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <BoltIcon className="h-6 w-6 text-purple-500" />
                    n8n 자동화 작성
                  </CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsTemplateSidebarOpen(true)} className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20">
                  <BookmarkIcon className="h-4 w-4" />
                  상용구
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">선택된 워크플로우:</span>
                  <span className="font-bold text-purple-700 dark:text-purple-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-md shadow-sm">
                    {workflow.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleCancel} disabled={isUploading} className="px-4 py-2">
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isUploading} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white">
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />전송 중...</>
                    ) : (
                      <><BoltIcon className="h-4 w-4 mr-2" />웹훅 전송 및 저장</>
                    )}
                  </Button>
                </div>
              </div>

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
                    placeholder="n8n으로 보낼 내용을 입력하세요..."
                    className={`min-h-[350px] resize-y border-2 border-purple-100 dark:border-purple-900/50 focus:border-purple-500 dark:focus:border-purple-400 transition-colors duration-200 ${fontSizeClasses.content}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhotoIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    첨부파일 (n8n 웹훅으로만 전송되며 Storage에는 저장되지 않습니다)
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors duration-200" style={{ minHeight: 'calc(8rem - 30px)' }}>
                  <ImageUpload images={formData.images} onImagesChange={handleImagesChange} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TemplateSidebar
          isOpen={isTemplateSidebarOpen}
          onClose={() => setIsTemplateSidebarOpen(false)}
          templates={templates || []}
          onTemplateSelect={handleSidebarTemplateSelect}
          onTemplateCopy={handleTemplateCopy}
        />

        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 shadow-lg max-w-sm w-full mx-4">
              <CardContent className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {processingMemoId ? 'n8n 처리 중...' : 'n8n 전송 중'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
                    {processingMemoId
                      ? '웹훅 처리 결과를 기다리고 있습니다. 최대 120초가 소요될 수 있습니다.'
                      : '웹훅으로 데이터를 보내고 있습니다...'}
                  </p>
                </div>
                {/* 제어 버튼 제거: 한번 전송하면 결과를 기다리도록 일원화 */}
              </CardContent>
            </Card>
          </div>
        )}
      </Layout>
    );
  }

  // 모바일 모드
  return (
    <Layout title="n8n 자동화 작성" showNewButton={false}>
      <div className="flex flex-col h-full space-y-2">
        <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg shadow-sm ${isMobileLightMode ? 'bg-white border border-gray-200' : 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-md'}`}>
          <Button variant="ghost" size="sm" onClick={handleCancel} className={`flex items-center gap-1.5 rounded-md transition-all duration-200 h-8 ${isMobileLightMode ? 'text-gray-700 hover:bg-gray-50' : 'text-white hover:bg-white/10'}`}>
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">뒤로</span>
          </Button>
          <div className="flex items-center">
            <BoltIcon className={`w-4 h-4 mr-1 ${isMobileLightMode ? 'text-purple-600' : 'text-white'}`} />
            <span className={`text-sm font-semibold tracking-wide ${isMobileLightMode ? 'text-gray-800' : 'text-white'}`}>n8n 작성</span>
          </div>
        </div>

        <div className={`w-full px-1.5 py-2 rounded-lg ${isMobileLightMode ? 'bg-purple-50/50 border border-purple-100' : 'bg-gray-800/50 border border-gray-700/60'}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center max-w-[65%]">
              <span className={`text-xs font-bold truncate px-2 py-1 rounded bg-white dark:bg-gray-800 shadow-sm border ${isMobileLightMode ? 'text-purple-700 border-purple-200' : 'text-purple-400 border-purple-800'}`}>
                {workflow.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsTemplateSidebarOpen(true)} className={`flex items-center gap-1 px-2 py-1 h-8 ${isMobileLightMode ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-blue-200 text-blue-700'}`}>
                <BookmarkIcon className="h-3 w-3" />
                <span className="text-xs">상용구</span>
              </Button>
            </div>
          </div>

          <Card className={`flex-1 shadow-sm border-2 mt-2 ${isMobileLightMode ? 'border-purple-100 bg-white' : 'border-gray-700'}`}>
            <CardContent className="p-4 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="content" className={`text-sm font-medium ${isMobileLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                    내용
                  </label>
                  <span className={`text-xs ${isMobileLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
                    placeholder="n8n으로 보낼 내용을 입력하세요..."
                    style={{ height: textareaHeight, minHeight: '230px' }}
                    className={`h-full resize-none border-0 focus:ring-0 focus:border-0 bg-transparent ${fontSizeClasses.content} ${isMobileLightMode ? 'text-gray-700' : 'text-gray-300'}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-4 mt-2">
            <Button variant="outline" size="lg" onClick={handleCancel} disabled={isUploading} className={`flex-1 h-12 ${isMobileLightMode ? 'border-gray-300 text-gray-700' : ''}`}>
              <XMarkIcon className="h-5 w-5 mr-2" />
              취소
            </Button>
            <Button size="lg" onClick={handleSave} disabled={isUploading} className={`flex-1 h-12 ${isMobileLightMode ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-sm' : 'bg-purple-600 hover:bg-purple-700'}`}>
              {isUploading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />전송 중...</>
              ) : (
                <><BoltIcon className="h-5 w-5 mr-2" />전송/저장</>
              )}
            </Button>
          </div>

          <Card className={`shadow-sm border-2 mt-2 ${isMobileLightMode ? 'border-gray-200 bg-white' : 'border-gray-700'}`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Button type="button" variant="outline" onClick={() => {
                      const cameraInput = document.createElement('input');
                      cameraInput.type = 'file'; cameraInput.accept = 'image/*'; cameraInput.capture = 'environment';
                      cameraInput.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) handleImagesChange([...formData.images, ...Array.from(files)]);
                      };
                      cameraInput.click();
                    }}
                      className={`w-full h-10 flex items-center justify-center transition-all ${isMobileLightMode ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-700 border-slate-500 text-blue-300'}`}
                    >
                      <CameraIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">카메라</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.multiple = true;
                      fileInput.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) handleImagesChange([...formData.images, ...Array.from(files)]);
                      };
                      fileInput.click();
                    }}
                      className={`w-full h-10 flex items-center justify-center transition-all ${isMobileLightMode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-700 border-slate-500 text-green-300'}`}
                    >
                      <PhotoIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">갤러리</span>
                    </Button>
                  </div>
                  <div className={`rounded-lg border-2 border-dashed p-2 min-h-[84px] ${isMobileLightMode ? 'bg-gray-50 border-gray-300' : 'bg-gray-800/50 border-gray-600'}`}>
                    {formData.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-1">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img src={URL.createObjectURL(image)} alt={`Upload ${index}`} className="w-full h-10 object-cover rounded" />
                            <button onClick={() => {
                              const newImages = [...formData.images];
                              newImages.splice(index, 1);
                              handleImagesChange(newImages);
                            }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-80 hover:opacity-100">
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <PhotoIcon className="h-6 w-6 mb-1 opacity-50" />
                        <span className="text-[10px] text-center">웹훅 전송 전용<br />(저장안됨)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <TemplateSidebar
          isOpen={isTemplateSidebarOpen}
          onClose={() => setIsTemplateSidebarOpen(false)}
          templates={templates || []}
          onTemplateSelect={handleSidebarTemplateSelect}
          onTemplateCopy={handleTemplateCopy}
        />

        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 shadow-lg max-w-sm w-full mx-4">
              <CardContent className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {processingMemoId ? 'n8n 처리 중...' : 'n8n 전송 중'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-4">
                    {processingMemoId
                      ? '웹훅 처리 결과를 기다리고 있습니다. 최대 120초가 소요될 수 있습니다.'
                      : '웹훅으로 데이터를 보내고 있습니다...'}
                  </p>
                </div>
                {/* 모바일에서도 제어 버튼 제거 */}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
