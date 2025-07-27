import React, { useState, useEffect } from 'react';
import { PlusIcon, Cog6ToothIcon, CloudIcon, WifiIcon, ArrowRightOnRectangleIcon, ArrowPathIcon, ChevronDownIcon, DocumentTextIcon, PlayIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { LoginButton } from '../auth/LoginButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useOffline } from '../../hooks/useOffline';
import { useTheme } from '../../hooks/useTheme';
import { useDevice } from '../../hooks/useDevice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HeaderProps {
  title: string;
  showNewButton?: boolean;
  showSettingsButton?: boolean;
  showLoginButton?: boolean;
  isDesktop?: boolean;
  memoCount?: number;
  templateCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showNewButton = false, 
  showSettingsButton = false,
  showLoginButton = true,
  isDesktop = false,
  memoCount,
  templateCount
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isOffline } = useOffline();
  const { isDark, toggleTheme } = useTheme();
  const { isMobile } = useDevice();
  const [quote, setQuote] = useState<string>('');

  // 명언록 데이터
  const quotes = [
    "작은 진전이라도 매일 이루어내면 큰 변화를 만들 수 있습니다.",
    "성공의 비밀은 시작하는 것입니다.",
    "오늘 할 수 있는 일을 내일로 미루지 마세요.",
    "실패는 성공의 어머니입니다.",
    "긍정적인 마음가짐이 모든 것을 바꿉니다.",
    "꾸준함이 최고의 재능입니다.",
    "작은 습관이 큰 차이를 만듭니다.",
    "도전은 성장의 기회입니다.",
    "인내는 쓴 약이지만 그 열매는 달콤합니다.",
    "자신을 믿으면 무엇이든 가능합니다."
  ];

  // 명언록 표시
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleTemplateManage = () => {
    navigate('/templates');
  };

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = isMobile && !isDark;
  
  // PC + 라이트 모드일 때의 스타일 조건
  const isDesktopLightMode = !isMobile && !isDark;

  return (
    <header className={`${isDesktop ? 'relative' : 'fixed top-0 left-0 right-0 z-50'} ${
      isMobileLightMode 
        ? 'bg-gradient-to-br from-[#4682b4] to-[#2c5aa0] shadow-lg hover:shadow-2xl transition-all duration-300' 
        : isDesktopLightMode
          ? 'bg-gradient-to-br from-[#4682b4] to-[#2c5aa0] shadow-lg hover:shadow-2xl transition-all duration-300'
          : 'bg-gradient-to-b from-sky-300/90 via-blue-400/90 to-cyan-500/90 dark:from-gray-950/90 dark:via-slate-900/90 dark:to-slate-800/90 border-b border-border/40 backdrop-blur-md'
    }`}>
      <div className="flex flex-col">
        {/* 메인 헤더 */}
        <div className={`flex items-center justify-between px-4 ${isDesktop ? 'h-12' : 'h-14'}`}>
          {/* 왼쪽: 로고 */}
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
            title="홈으로 이동"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isMobileLightMode || isDesktopLightMode
                ? 'bg-gradient-to-br from-[#87ceeb] to-[#4682b4] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105' 
                : ''
            }`}>
              <CloudIcon className={`h-5 w-5 ${
                isMobileLightMode || isDesktopLightMode
                  ? 'text-white' 
                  : 'text-blue-600 dark:text-blue-400'
              }`} />
            </div>
            <h1 className={`text-lg font-semibold ${
              isMobileLightMode || isDesktopLightMode
                ? 'text-white' 
                : 'text-gray-800 dark:text-gray-100'
            }`}>Cloud Memo</h1>
          </div>

          {/* 오른쪽: 버튼들 */}
          <div className={`flex items-center gap-2 ${isDesktop ? 'ml-auto' : ''}`}>
            {showNewButton && isDesktop && (
              <Button
                onClick={() => navigate('/create')}
                size="sm"
                className={`flex items-center gap-1 ${
                  isDesktopLightMode
                    ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
              >
                <PlusIcon className="h-4 w-4" />
                새 메모
              </Button>
            )}
            
            {showSettingsButton && (
              <Button
                onClick={() => navigate('/settings')}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-1 ${
                  isMobileLightMode || isDesktopLightMode
                    ? 'text-white hover:text-white/80 hover:bg-white/10' 
                    : ''
                }`}
              >
                <Cog6ToothIcon className="h-4 w-4" />
                설정
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${
                  isMobileLightMode || isDesktopLightMode
                    ? 'text-white hover:text-white/80 hover:bg-white/10' 
                    : ''
                }`}>
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || '프로필'} 
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isMobileLightMode || isDesktopLightMode
                        ? 'bg-gradient-to-br from-[#87ceeb] to-[#4682b4] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105' 
                        : 'bg-primary'
                    }`}>
                      <span className={`text-xs font-medium ${
                        isMobileLightMode || isDesktopLightMode
                          ? 'text-white' 
                          : 'text-primary-foreground'
                      }`}>
                        {user?.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className={`text-sm font-medium ${
                    isMobileLightMode || isDesktopLightMode
                      ? 'text-white' 
                      : ''
                  }`}>{user?.displayName || '사용자'}</span>
                  <ChevronDownIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  환경설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {isDark ? (
                    <>
                      <SunIcon className="h-4 w-4 mr-2" />
                      라이트 모드
                    </>
                  ) : (
                    <>
                      <MoonIcon className="h-4 w-4 mr-2" />
                      다크 모드
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleTemplateManage}>
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  상용구관리
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 상태 표시 바 - PC 모드에서만 표시 */}
        {isDesktop && (
          <div className={`flex items-center justify-between px-4 py-1 ${
            isMobileLightMode || isDesktopLightMode
              ? 'bg-white/10 backdrop-blur-sm border-t border-white/20' 
              : 'bg-sky-200/80 dark:bg-slate-600/80 backdrop-blur-sm border-t border-border/20'
          }`}>
            <div className={`flex items-center gap-4 text-xs ${
              isMobileLightMode || isDesktopLightMode
                ? 'text-white/90' 
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              <div className="flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                <span>메모 {memoCount || 0}개</span>
              </div>
              <div className="flex items-center gap-1">
                <PlayIcon className="h-3 w-3" />
                <span>상용구 {templateCount || 0}개</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={`h-6 w-6 p-0 ${
                    isMobileLightMode || isDesktopLightMode
                      ? 'hover:bg-white/20 text-white' 
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={isDark ? '라이트 모드로 변경' : '다크 모드로 변경'}
                >
                  {isDark ? (
                    <SunIcon className="h-3 w-3" />
                  ) : (
                    <MoonIcon className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`text-xs max-w-xs truncate ${
                isMobileLightMode || isDesktopLightMode
                  ? 'text-white/90' 
                  : 'text-gray-600 dark:text-gray-300'
              }`}>
                {quote}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${
                  isMobileLightMode || isDesktopLightMode
                    ? 'hover:bg-white/20 text-white' 
                    : ''
                }`}>
                  <ArrowPathIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}; 