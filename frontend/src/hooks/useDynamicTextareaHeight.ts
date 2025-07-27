import { useEffect, useRef, useState, useCallback } from 'react';

interface UseDynamicTextareaHeightProps {
  isMobile: boolean;
  dependencies?: any[];
}

export const useDynamicTextareaHeight = ({ 
  isMobile, 
  dependencies = [] 
}: UseDynamicTextareaHeightProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState<number | undefined>(undefined);

  const calculateHeight = useCallback(() => {
    if (!isMobile) return;

    // 뷰포트 높이
    const viewportHeight = window.innerHeight;
    
    // 보수적인 고정 영역 높이 계산 (실제 UI에 맞춤)
    const headerHeight = 56; // 헤더 높이
    const categoryHeight = 56; // 카테고리/상용구 버튼 영역 (여백 포함)
    const imageHeight = 80; // 이미지 업로드 영역 (여백 포함)
    const buttonHeight = 64; // 저장/취소 버튼 영역 (여백 포함)
    const pagePadding = 40; // 페이지 상하 패딩
    const sectionGap = 32; // 섹션 간 간격
    const extraMargin = 100; // 추가 여유 공간 (100px)
    
    // 텍스트 필드가 차지할 수 있는 최대 높이
    const availableHeight = viewportHeight - headerHeight - categoryHeight - imageHeight - buttonHeight - pagePadding - sectionGap - extraMargin;
    
    // 최소 높이 보장 (150px)
    const minHeight = 150;
    const calculatedHeight = Math.max(availableHeight, minHeight);
    
    setTextareaHeight(calculatedHeight);
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      setTextareaHeight(undefined);
      return;
    }

    // 초기 계산 (DOM 렌더링 완료 후)
    const timer = setTimeout(() => {
      calculateHeight();
    }, 100);

    // 리사이즈 이벤트 리스너 (디바운싱 적용)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        calculateHeight();
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, calculateHeight, ...dependencies]);

  return {
    textareaRef,
    textareaHeight,
    calculateHeight
  };
}; 