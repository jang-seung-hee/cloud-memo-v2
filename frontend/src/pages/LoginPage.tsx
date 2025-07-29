import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginButton } from '../components/auth/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const LoginPage: React.FC = () => {
  const { user, loading, isAuthenticated, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginTimeout, setLoginTimeout] = useState(false);

  // 이전 페이지 정보 가져오기
  const from = location.state?.from?.pathname || '/';

  // 로그인 타임아웃 처리
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoginTimeout(true);
        console.warn('로그인 확인 타임아웃 - 30초 초과');
      }, 30000); // 30초 타임아웃

      return () => clearTimeout(timeout);
    } else {
      setLoginTimeout(false);
    }
  }, [loading]);

  // 이미 인증된 경우 이전 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, loading, navigate, from]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <span className="text-xl block mb-2">로그인 확인 중...</span>
          {loginTimeout && (
            <p className="text-sm text-muted-foreground">
              로딩이 지연되고 있습니다. 페이지를 새로고침해보세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-200 via-blue-300 to-cyan-400 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600 p-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        {/* 로그인 카드 */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">M</span>
            </div>
            <CardTitle className="text-2xl font-bold">Cloud Memo</CardTitle>
            <CardDescription className="text-lg">
              메모를 클라우드에 안전하게 저장하세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <div className="space-y-4">
              <LoginButton 
                className="w-full h-12 text-lg"
                size="lg"
              />
              
              <p className="text-center text-sm text-muted-foreground">
                Google 계정으로 간편하게 로그인하세요
              </p>
            </div>

            {/* 기능 설명 */}
            <div className="space-y-3 pt-6 border-t">
              <h3 className="font-semibold text-center mb-4">주요 기능</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>클라우드 기반 메모 저장</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>기기 간 동기화</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>이미지 첨부 지원</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>템플릿 기능</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 푸터 */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>© 2024 Cloud Memo. 모든 데이터는 안전하게 보호됩니다.</p>
        </div>
      </div>
    </div>
  );
}; 