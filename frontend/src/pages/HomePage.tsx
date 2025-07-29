import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { useDevice } from '../hooks/useDevice';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { TemplateSidebar } from '../components/ui/sidebar';
import { 
  BookOpen, 
  FileText, 
  LogIn, 
  User, 
  Smartphone, 
  Monitor, 
  Sun, 
  Moon,
  ArrowRight,
  Sparkles,
  Shield,
  Cloud,
  ChevronRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { data: memos, loading: memosLoading } = useMemos();
  const { data: templates, loading: templatesLoading } = useTemplates();
  const { isMobile } = useDevice();
  const { isDark } = useTheme();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isTemplateSidebarOpen, setIsTemplateSidebarOpen] = useState(false);
  const [hasAutoRedirected, setHasAutoRedirected] = useState(() => {
    // sessionStorage에서 자동 리다이렉트 상태 확인
    return sessionStorage.getItem('hasAutoRedirected') === 'true';
  });

  // QR 코드 생성 (고정된 앱 링크)
  useEffect(() => {
    const appUrl = 'https://cloud-memo-v2.netlify.app';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl)}`;
    setQrCodeUrl(qrApiUrl);
  }, []);

  // 로그인 후 메모 목록으로 자동 이동 (로그인 직후에만)
  useEffect(() => {
    if (isAuthenticated && !hasAutoRedirected && location.pathname === '/') {
      // 로그인 직후에만 자동 이동하고, 이후에는 홈화면을 유지
      setHasAutoRedirected(true);
      sessionStorage.setItem('hasAutoRedirected', 'true');
      navigate('/memos');
    }
  }, [isAuthenticated, navigate, hasAutoRedirected, location.pathname]);

  // 메모 및 템플릿 개수 계산
  const memoCount = memos?.length || 0;
  const templateCount = templates?.length || 0;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // 로그아웃 시 자동 리다이렉트 상태 초기화
      setHasAutoRedirected(false);
      sessionStorage.removeItem('hasAutoRedirected');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleGoToMemos = () => {
    navigate('/memos');
  };

  const handleGoToTemplates = () => {
    navigate('/templates');
  };

  const handleCreateMemo = () => {
    navigate('/create');
  };

  const handleTemplateSelect = (content: string) => {
    // 템플릿 선택 시 클립보드에 복사
    navigator.clipboard.writeText(content).then(() => {
      console.log('템플릿이 클립보드에 복사되었습니다:', content);
    }).catch((error) => {
      console.error('클립보드 복사 실패:', error);
    });
  };

  const handleTemplateCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      console.log('템플릿이 클립보드에 복사되었습니다:', content);
    }).catch((error) => {
      console.error('클립보드 복사 실패:', error);
    });
  };

  // 로그인 전 홈 페이지
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8bc0e0] to-[#6a9bd0] dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="w-full max-w-md px-6 py-8">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cloud Memo
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              메모를 클라우드에 저장하고 동기화하세요
            </p>
          </div>

          {/* 로그인 박스 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              로그인
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-4">
              Google 계정으로 로그인하여 시작하세요
            </p>
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              로그인
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              로그인하면 메모가 클라우드에 자동으로 동기화됩니다.
            </p>
          </div>

          {/* 주요 기능 및 QR 코드 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">
              주요 기능
            </h2>
            
            <div className="flex items-start gap-4">
              {/* 주요 기능 목록 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">클라우드 동기화</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">모든 기기에서 접근</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">안전한 데이터 보호</span>
                </div>
              </div>

              {/* QR 코드 */}
              <div className="relative">
                {qrCodeUrl && (
                  <div className="relative">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-20 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 후 홈 페이지
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8bc0e0] to-[#6a9bd0] dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 flex flex-col">
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 pb-28">
        <div className="w-full max-w-md">
          {/* 로고 및 타이틀 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cloud Memo
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              안녕하세요, <span className="font-semibold text-gray-900 dark:text-white">{user?.displayName || user?.email}</span>님!
            </p>
          </div>

          {/* 로그인 정보 박스 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                로그인 정보
              </h2>
              <div className="mb-3">
                <p className="font-medium text-gray-900 dark:text-white text-xs">
                  {user?.displayName || '사용자'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {user?.email}
                </p>
              </div>
              
              <Separator className="my-2 bg-gray-200 dark:bg-gray-600" />
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full py-1.5 rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-xs"
              >
                로그아웃
              </Button>
            </div>
          </div>

          {/* 주요 기능 및 QR 코드 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">
              주요 기능
            </h2>
            
            <div className="flex items-start gap-4">
              {/* 주요 기능 목록 */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">클라우드 동기화</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">모든 기기에서 접근</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">안전한 데이터 보호</span>
                </div>
              </div>

              {/* QR 코드 */}
              <div className="relative">
                {qrCodeUrl && (
                  <div className="relative">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-20 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 바텀 고정 메뉴 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex justify-around items-center py-3 px-6">
          {/* 홈 */}
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mb-1">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-blue-500 font-medium">홈</span>
          </div>

          {/* 메모목록 */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleGoToMemos}
          >
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-1">
              <FileText className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">메모목록</span>
          </div>

          {/* 퀵 사용구 */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsTemplateSidebarOpen(true)}
          >
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-1">
              <Sparkles className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">퀵 사용구</span>
          </div>

          {/* 새메모 */}
          <div 
            className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleCreateMemo}
          >
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-1">
              <ArrowRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">새메모</span>
          </div>
        </div>
      </div>

      {/* 상용구 사이드바 */}
      <TemplateSidebar
        isOpen={isTemplateSidebarOpen}
        onClose={() => setIsTemplateSidebarOpen(false)}
        templates={templates || []}
        onTemplateSelect={handleTemplateSelect}
        onTemplateCopy={handleTemplateCopy}
      />
    </div>
  );
}; 