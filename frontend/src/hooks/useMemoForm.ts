import { useState, useEffect, useCallback, useRef } from 'react';
import { IMemoFormData } from '../types/memo';
import { ISharedUser } from '../types/firebase';
import { CategoryType } from '../components/ui/category-badge';
import { useToast } from './use-toast';
import { useDevice } from './useDevice';
import { useTheme } from './useTheme';

export interface UseMemoFormProps {
  initialData?: Partial<IMemoFormData>;
  initialSharedWith?: ISharedUser[];
}

export const useMemoForm = ({ initialData, initialSharedWith }: UseMemoFormProps = {}) => {
  const { toast } = useToast();
  const { isDesktop, isMobile } = useDevice();
  const { isDark } = useTheme();
  
  const isMobileLightMode = !isDesktop && !isDark;

  const [formData, setFormData] = useState<IMemoFormData>({
    content: initialData?.content || '',
    images: initialData?.images || [],
    category: initialData?.category || 'temporary'
  });

  const [sharedWith, setSharedWith] = useState<ISharedUser[]>(initialSharedWith || []);
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(230);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 디바이스 크기에 따른 텍스트 필드 높이 계산
  useEffect(() => {
    const calculateTextareaHeight = () => {
      if (!isMobile) return;

      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      let baseHeight = Math.max(115, screenHeight * 0.155);

      if (screenHeight >= 800) {
        baseHeight = Math.max(140, screenHeight * 0.175);
      } else if (screenHeight >= 700) {
        baseHeight = Math.max(130, screenHeight * 0.165);
      } else if (screenHeight >= 600) {
        baseHeight = Math.max(120, screenHeight * 0.16);
      } else {
        baseHeight = Math.max(115, screenHeight * 0.15);
      }

      const aspectRatio = screenWidth / screenHeight;
      if (aspectRatio > 0.5) {
        baseHeight = Math.min(baseHeight + 10, screenHeight * 0.2);
      }

      setTextareaHeight(baseHeight);
    };

    calculateTextareaHeight();

    const handleResize = () => calculateTextareaHeight();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isMobile, formData.images.length]);

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

  const handleCategoryChange = useCallback((category: CategoryType) => {
    setFormData(prev => ({ ...prev, category }));
  }, []);

  const handleImagesChange = useCallback((images: File[]) => {
    setFormData(prev => ({ ...prev, images }));
  }, []);

  const handleSidebarTemplateSelect = useCallback((content: string) => {
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
  }, [formData.content]);

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

  const handleTemplateCopy = useCallback(async (content: string) => {
    const success = await copyToClipboard(content);
    if (success) {
      toast({ title: "복사 완료", description: "상용구가 클립보드에 복사되었습니다." });
    } else {
      toast({ title: "복사 실패", description: "클립보드 복사에 실패했습니다.", variant: "destructive" });
    }
  }, [toast]);

  return {
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
    isMobile,
    isDesktop,
    isMobileLightMode,
    extractTitle,
    handleContentChange,
    handlePaste,
    handleCategoryChange,
    handleImagesChange,
    handleSidebarTemplateSelect,
    handleTemplateCopy
  };
};
