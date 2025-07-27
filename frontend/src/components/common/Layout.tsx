import React from 'react';
import { Header } from './Header';
import { Navigation } from './Navigation';
import { useDevice } from '../../hooks/useDevice';
import { useMemos, useTemplates } from '../../hooks/useFirestore';

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
  const { data: memos } = useMemos();
  const { data: templates } = useTemplates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-blue-300 to-cyan-400 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600">
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