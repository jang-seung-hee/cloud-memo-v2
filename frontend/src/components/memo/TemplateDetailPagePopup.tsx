import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { ITemplate } from '../../types/template';
import { useToast } from '../../hooks/use-toast';
import { useFontSize } from '../../hooks/useFontSize';
import { useDevice } from '../../hooks/useDevice';
import { useTheme } from '../../hooks/useTheme';
import { 
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { formatLinksInText } from '../../utils/linkFormatter';

interface TemplateDetailPagePopupProps {
  template: ITemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (template: ITemplate) => void;
  onDelete: (template: ITemplate) => void;
}

export const TemplateDetailPagePopup: React.FC<TemplateDetailPagePopupProps> = ({ 
  template, 
  isOpen, 
  onClose,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const { isDesktop, isMobile } = useDevice();
  const { isDark } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCopy = async () => {
    if (!template) return;
    
    const success = await copyToClipboard(template.content);
    if (success) {
      toast({
        title: "복사 완료",
        description: "상용구 내용이 클립보드에 복사되었습니다.",
        duration: 2000,
      });
    } else {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // ESC 키로 팝업 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const isMobileLightMode = !isDesktop && !isDark;

  // 모바일 레이아웃 (MemoDetailPage 모바일 뷰 참고)
  if (!isDesktop) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-950 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* 헤더 */}
        <div className={`flex items-center justify-between px-4 py-3 sticky top-0 z-10 ${
          isMobileLightMode 
            ? 'bg-white border-b border-gray-200 shadow-sm' 
            : 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:from-slate-900 dark:to-slate-900 shadow-md text-white'
        }`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`flex items-center gap-1.5 h-9 ${
              isMobileLightMode ? 'text-gray-700' : 'text-white hover:bg-white/10'
            }`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-semibold">닫기</span>
          </Button>

          <div className="flex items-center">
            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isMobileLightMode ? 'bg-blue-500' : 'bg-white'}`} />
            <span className="text-sm font-bold tracking-tight">상용구 상세보기</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 상용구 정보 카드 */}
          <Card className={`shadow-sm border-2 ${isMobileLightMode ? 'border-gray-200 bg-white' : 'border-gray-700 dark:bg-slate-900'}`}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <h2 className={`font-bold flex-1 pr-4 leading-tight ${fontSizeClasses.title} ${isMobileLightMode ? 'text-gray-900' : 'text-white'}`}>
                  {template.title}
                </h2>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">{template.content.length}자</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] px-2 py-0.5">
                    {template.category || '기타'}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${
                  isMobileLightMode ? 'bg-gray-50 text-gray-500' : 'bg-slate-800 text-gray-400'
                }`}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className={`text-[10px] font-medium ${fontSizeClasses.date}`}>
                    {formatFullDate(template.updatedAt)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 상용구 내용 카드 */}
          <Card className={`shadow-sm border-2 overflow-hidden flex flex-col min-h-[300px] ${
            isMobileLightMode ? 'border-gray-200 bg-white' : 'border-gray-700 dark:bg-slate-900'
          }`}>
            <CardContent className="p-4 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50 dark:border-gray-800">
                <label className="text-sm font-bold text-gray-500 dark:text-gray-400">상용구 내용</label>
                
                {/* 액션 버튼들 */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600">
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { onClose(); onEdit(template); }} className="h-9 w-9 p-0 text-gray-500 hover:text-amber-600">
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-gray-500 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>상용구 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{template.title}" 상용구를 삭제하시겠습니까?
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={async () => {
                            setIsDeleting(true);
                            await onDelete(template);
                            setIsDeleting(false);
                            onClose();
                          }}
                          disabled={isDeleting}
                          className="bg-red-600 text-white"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className={`flex-1 p-4 rounded-xl relative ${
                isMobileLightMode 
                  ? 'bg-yellow-50/50' 
                  : 'bg-slate-800/50'
              }`}>
                <div className={`whitespace-pre-wrap leading-relaxed ${fontSizeClasses.content} ${
                  isMobileLightMode 
                    ? 'text-gray-700 bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(229,231,235,0.5)_1.5rem,rgba(229,231,235,0.5)_1.6rem)] bg-[length:100%_1.6rem]' 
                    : 'text-gray-200 bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(75,85,99,0.3)_1.5rem,rgba(75,85,99,0.3)_1.6rem)] bg-[length:100%_1.6rem]'
                }`}>
                  {formatLinksInText(template.content)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 데스크톱 레이아웃 (기존 유지)
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-120px)] overflow-hidden mx-4 flex flex-col ${
          isMobileLightMode ? 'bg-white border-gray-200' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border py-3 px-4 flex-shrink-0">
          <h2 className="font-semibold text-card-foreground text-xl">
            상용구 상세보기
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* 내용 영역 */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* 상용구 정보 */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <h3 className={`font-bold text-gray-900 dark:text-gray-100 ${fontSizeClasses.title}`}>
                {template.title}
              </h3>
              
              <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-medium px-2 py-1">
                    <TagIcon className="w-3 h-3 mr-1" />
                    {template.category || '기타'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{formatFullDate(template.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-600 transition-colors"
                    onClick={handleCopy}
                    title="복사"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600 transition-colors"
                    onClick={() => {
                      onClose();
                      onEdit(template);
                    }}
                    title="수정"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 transition-colors"
                        title="삭제"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>상용구 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{template.title}" 상용구를 삭제하시겠습니까?
                          이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={async () => {
                            setIsDeleting(true);
                            await onDelete(template);
                            setIsDeleting(false);
                            onClose();
                          }}
                          disabled={isDeleting}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          {isDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* 본문 내용 */}
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  상용구 내용
                </label>
              </div>
              <div className="p-5 bg-blue-50/30 dark:bg-gray-800/40 rounded-xl border border-blue-100/50 dark:border-gray-700/50 min-h-[200px]">
                <div className={`whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed ${fontSizeClasses.content} bg-[linear-gradient(transparent_0%,transparent_1.5rem,rgba(59,130,246,0.1)_1.5rem,rgba(59,130,246,0.1)_1.6rem)] bg-[length:100%_1.6rem]`}>
                  {formatLinksInText(template.content)}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 하단 닫기 버튼 (모바일용 - 데스크톱 뷰에서 작게 보일 때를 대비) */}
        {!isDesktop && (
          <div className="p-4 border-t border-border bg-gray-50 dark:bg-gray-900/20">
            <Button onClick={onClose} className="w-full" variant="outline">
              닫기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
