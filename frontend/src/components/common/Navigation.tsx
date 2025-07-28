import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { 
  HomeIcon, 
  PlusIcon, 
  SparklesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { TemplateSidebar } from '../ui/sidebar';
import { useDevice } from '../../hooks/useDevice';
import { useToast } from '../../hooks/use-toast';
import { firestoreService } from '../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useTemplates } from '../../hooks/useFirestore';
import { useTemplateContext } from '../../contexts/TemplateContext';
import { useTheme } from '../../hooks/useTheme';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDesktop, getTemplateSidebarWidth } = useDevice();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: templates } = useTemplates();
  const { insertTemplateText } = useTemplateContext();
  const { isDark } = useTheme();
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);

  const isMemoList = location.pathname === '/memos';

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;
  
  // PC + 라이트 모드일 때의 스타일 조건
  const isDesktopLightMode = isDesktop && !isDark;

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
        // 3. 최후의 fallback: 사용자에게 수동 복사 안내
        toast({
          title: "수동 복사 필요",
          description: "아래 텍스트를 수동으로 복사해주세요.",
          variant: "destructive"
        });
        
        // 모바일에서 선택 가능한 텍스트 영역 생성
        if (!isDesktop) {
          const textArea = document.createElement('textarea');
          textArea.value = content;
          textArea.style.position = 'fixed';
          textArea.style.top = '50%';
          textArea.style.left = '50%';
          textArea.style.transform = 'translate(-50%, -50%)';
          textArea.style.width = '80%';
          textArea.style.height = '200px';
          textArea.style.zIndex = '9999';
          textArea.style.border = '2px solid #ccc';
          textArea.style.padding = '10px';
          textArea.style.fontSize = '16px';
          textArea.style.backgroundColor = 'white';
          textArea.style.color = 'black';
          
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          // 3초 후 자동 제거
          setTimeout(() => {
            if (document.body.contains(textArea)) {
              document.body.removeChild(textArea);
            }
          }, 3000);
        }
      }
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <nav className={`fixed bottom-0 left-0 right-0 z-50 ${
        isDesktop 
          ? (isMobileLightMode || isDesktopLightMode)
            ? 'bg-gray-200 border-t border-gray-300 shadow-sm' 
            : 'bg-white/95 dark:bg-gray-950/95 border-t border-gray-200/60 dark:border-slate-800/60 backdrop-blur-md'
          : 'bg-gray-200 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 shadow-lg'
      } nav-stable ${isDesktop ? 'h-14' : ''}`}>
        <div className={isDesktop ? "relative w-full h-full nav-stable" : ""}>
          {/* PC 모드: 고정된 위치 레이아웃 */}
          {isDesktop ? (
            <div className="relative w-full h-full flex justify-around items-center px-4">
              {/* 홈 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-auto rounded-xl transition-colors duration-200 nav-button-stable p-2 flex-1 max-w-20",
                  location.pathname === '/' 
                    ? (isMobileLightMode || isDesktopLightMode)
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-primary text-primary-foreground shadow-md"
                    : (isMobileLightMode || isDesktopLightMode)
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <HomeIcon className={cn("transition-transform duration-200 h-5 w-5", location.pathname === '/' && "scale-110")} />
                  <span className="font-medium transition-all duration-200 text-xs leading-none">홈</span>
                </div>
              </Button>

              {/* 메모 목록 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/memos')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-auto rounded-xl transition-colors duration-200 nav-button-stable p-2 flex-1 max-w-20",
                  isMemoList 
                    ? (isMobileLightMode || isDesktopLightMode)
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-primary text-primary-foreground shadow-md"
                    : (isMobileLightMode || isDesktopLightMode)
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <HomeIcon className={cn("transition-transform duration-200 h-5 w-5", isMemoList && "scale-110")} />
                  <span className="font-medium transition-all duration-200 text-xs leading-none">메모 목록</span>
                </div>
              </Button>

              {/* 퀵 상용구 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTemplateSidebarOpen(!isTemplateSidebarOpen)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-auto rounded-xl transition-colors duration-200 nav-button-stable p-2 flex-1 max-w-20",
                  isTemplateSidebarOpen 
                    ? (isMobileLightMode || isDesktopLightMode)
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      : "text-primary bg-primary/10 hover:bg-primary/20"
                    : (isMobileLightMode || isDesktopLightMode)
                      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <SparklesIcon className="transition-transform duration-200 h-5 w-5" />
                  <span className="font-medium transition-all duration-200 text-xs leading-none">퀵 상용구</span>
                </div>
              </Button>

              {/* 새 메모 버튼 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/create')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-auto rounded-xl transition-colors duration-200 nav-button-stable p-2 flex-1 max-w-20",
                  (isMobileLightMode || isDesktopLightMode)
                    ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  <PlusIcon className="transition-transform duration-200 h-5 w-5" />
                  <span className="font-medium transition-all duration-200 text-xs leading-none">새 메모</span>
                </div>
              </Button>
            </div>
          ) : (
            /* 모바일 모드: 홈 화면과 동일한 디자인 */
            <div className="flex justify-around items-center py-3 px-6">
              {/* 홈 */}
              <div 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/')}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center mb-1",
                  location.pathname === '/' 
                    ? "bg-blue-500" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <HomeIcon className={cn(
                    "w-3 h-3",
                    location.pathname === '/' 
                      ? "text-white" 
                      : "text-gray-600 dark:text-gray-300"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  location.pathname === '/' 
                    ? "text-blue-500" 
                    : "text-gray-600 dark:text-gray-300"
                )}>홈</span>
              </div>

              {/* 메모목록 */}
              <div 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/memos')}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center mb-1",
                  isMemoList 
                    ? "bg-blue-500" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <DocumentTextIcon className={cn(
                    "w-3 h-3",
                    isMemoList 
                      ? "text-white" 
                      : "text-gray-600 dark:text-gray-300"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isMemoList 
                    ? "text-blue-500" 
                    : "text-gray-600 dark:text-gray-300"
                )}>메모목록</span>
              </div>

              {/* 퀵 사용구 */}
              <div 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsTemplateSidebarOpen(!isTemplateSidebarOpen)}
              >
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center mb-1",
                  isTemplateSidebarOpen 
                    ? "bg-blue-500" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}>
                  <SparklesIcon className={cn(
                    "w-3 h-3",
                    isTemplateSidebarOpen 
                      ? "text-white" 
                      : "text-gray-600 dark:text-gray-300"
                  )} />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isTemplateSidebarOpen 
                    ? "text-blue-500" 
                    : "text-gray-600 dark:text-gray-300"
                )}>퀵 사용구</span>
              </div>

              {/* 새메모 */}
              <div 
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/create')}
              >
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-1">
                  <PlusIcon className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">새메모</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* 상용구 사이드바 */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setIsTemplateSidebarOpen(false)}
        templates={templates || []}
        onTemplateSelect={(content) => {
          // 퀵 상용구에서는 템플릿 선택 시 텍스트 필드에 삽입
          insertTemplateText(content);
          setIsTemplateSidebarOpen(false);
        }}
        onTemplateCopy={handleTemplateCopy}
      />
    </>
  );
}; 