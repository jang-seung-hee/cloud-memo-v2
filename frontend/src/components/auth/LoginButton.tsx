import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { 
  ArrowRightOnRectangleIcon, 
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface LoginButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  className = '', 
  variant = 'default',
  size = 'default'
}) => {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await login();
    } catch (error) {
      console.error('로그인 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '로그인에 실패했습니다.';
      setError(errorMessage);
    }
  };

  const handleLogout = async () => {
    try {
      setError(null);
      await logout();
    } catch (error) {
      console.error('로그아웃 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '로그아웃에 실패했습니다.';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={className} 
        disabled
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        로딩 중...
      </Button>
    );
  }

  // Firebase 설정 오류가 있는 경우
  if (error && error.includes('Firebase가 설정되지 않았습니다')) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="destructive" 
          size={size} 
          className={className}
          disabled
        >
          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
          Firebase 설정 필요
        </Button>
        <div className="text-xs text-muted-foreground max-w-32">
          Firebase Console에서 프로젝트를 설정하세요
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || '사용자'} 
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <UserCircleIcon className="w-6 h-6" />
          )}
          <span className="text-sm font-medium hidden sm:inline">
            {user.displayName || user.email}
          </span>
        </div>
        <Button 
          variant={variant} 
          size={size} 
          onClick={handleLogout}
          className={className}
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleLogin}
      className={className}
    >
      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
      Google 로그인
    </Button>
  );
}; 