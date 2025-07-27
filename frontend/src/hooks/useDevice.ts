import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  const [screenHeight, setScreenHeight] = useState(0);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?=.*\b(?!.*mobile))/i.test(userAgent);
      
      // 데스크톱: 모바일이 아니고 태블릿도 아닌 경우
      const isDesktopDevice = !isMobileDevice && !isTablet;
      
      setIsDesktop(isDesktopDevice);
      setIsMobile(isMobileDevice);
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // 모바일에서 상용구 사이드바의 동적 넓이 계산
  const getTemplateSidebarWidth = () => {
    if (!isMobile) {
      return 416; // 데스크톱 기본 넓이 (320px * 1.3 = 416px)
    }

    // 기본 넓이 (320px)
    let baseWidth = 320;
    
    // 화면 넓이에 따른 추가 넓이 계산
    if (screenWidth >= 480) {
      // 큰 모바일 화면 (480px 이상)
      baseWidth = Math.min(400, screenWidth * 0.85);
    } else if (screenWidth >= 400) {
      // 중간 모바일 화면 (400-480px)
      baseWidth = Math.min(380, screenWidth * 0.90);
    } else if (screenWidth >= 360) {
      // 작은 모바일 화면 (360-400px)
      baseWidth = Math.min(360, screenWidth * 0.92);
    } else {
      // 매우 작은 모바일 화면 (360px 미만)
      baseWidth = Math.min(340, screenWidth * 0.95);
    }

    // 세로 모드에서 더 넓게 표시
    if (screenHeight > screenWidth) {
      baseWidth = Math.min(baseWidth + 20, screenWidth * 0.95);
    }

    return Math.max(280, baseWidth); // 최소 280px 보장
  };

  return { 
    isDesktop, 
    isMobile, 
    screenWidth, 
    screenHeight,
    getTemplateSidebarWidth 
  };
}; 