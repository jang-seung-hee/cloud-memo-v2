import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useDevice } from '../../hooks/useDevice';
import { useMemos, useTemplates } from '../../hooks/useFirestore';
import { useTheme } from '../../hooks/useTheme';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showNewButton?: boolean;
  showSettingsButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title, 
  showNewButton = false, 
  showSettingsButton = false 
}) => {
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const { data: memos } = useMemos();
  const { data: templates } = useTemplates();

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;
  
  // PC + 라이트 모드일 때의 스타일 조건
  const isDesktopLightMode = isDesktop && !isDark;

  return (
    <div className={`min-h-screen ${
      isMobileLightMode || isDesktopLightMode
        ? 'bg-gradient-to-br from-[#8bc0e0] to-[#6a9bd0]' 
        : 'bg-gradient-to-b from-sky-200 via-blue-300 to-cyan-400 dark:from-slate-800 dark:via-slate-900 dark:to-gray-950'
    }`}>
      <Header 
        title={title} 
        showNewButton={showNewButton} 
        showSettingsButton={showSettingsButton}
        isDesktop={isDesktop}
        memoCount={memos.length}
        templateCount={templates.length}
      />
      <main className={`${isDesktop ? 'pt-4 pb-14' : 'pt-20 pb-12'} px-4 ${isDesktop ? 'max-w-none mx-0' : 'max-w-7xl mx-auto'}`}>
        <div className={isDesktop ? 'mx-[150px]' : ''}>
          {children}
        </div>
      </main>
      <Navigation />
    </div>
  );
}; 