import { useState, useEffect } from 'react';

export type FontSizeType = 'small' | 'medium-small' | 'medium' | 'medium-large' | 'large';

interface FontSizeClasses {
  text: string;
  title: string;
  content: string;
  date: string;
}

export const useFontSize = () => {
  const [fontSize, setFontSize] = useState<FontSizeType>('medium');

  const fontSizeClasses: Record<FontSizeType, FontSizeClasses> = {
    small: {
      text: 'text-xs',
      title: 'text-sm',
      content: 'text-xs',
      date: 'text-xs'
    },
    'medium-small': {
      text: 'text-sm',
      title: 'text-base',
      content: 'text-sm',
      date: 'text-xs'
    },
    medium: {
      text: 'text-base',
      title: 'text-lg',
      content: 'text-base',
      date: 'text-sm'
    },
    'medium-large': {
      text: 'text-lg',
      title: 'text-xl',
      content: 'text-lg',
      date: 'text-sm'
    },
    large: {
      text: 'text-xl',
      title: 'text-2xl',
      content: 'text-xl',
      date: 'text-base'
    }
  };

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const savedFontSize = localStorage.getItem('fontSize') as FontSizeType;
    if (savedFontSize && ['small', 'medium-small', 'medium', 'medium-large', 'large'].includes(savedFontSize)) {
      setFontSize(savedFontSize);
    }
  }, []);

  // 글씨 크기 변경 함수
  const changeFontSize = (newFontSize: FontSizeType) => {
    setFontSize(newFontSize);
    localStorage.setItem('fontSize', newFontSize);
  };

  // 슬라이더 값을 글씨 크기로 변환
  const getFontSizeFromSlider = (value: number): FontSizeType => {
    const sizes: FontSizeType[] = ['small', 'medium-small', 'medium', 'medium-large', 'large'];
    return sizes[value - 1] || 'medium';
  };

  // 글씨 크기를 슬라이더 값으로 변환
  const getSliderValueFromFontSize = (fontSize: FontSizeType): number => {
    const sizes: FontSizeType[] = ['small', 'medium-small', 'medium', 'medium-large', 'large'];
    return sizes.indexOf(fontSize) + 1;
  };

  return {
    fontSize,
    changeFontSize,
    fontSizeClasses: fontSizeClasses[fontSize],
    getFontSizeFromSlider,
    getSliderValueFromFontSize
  };
}; 