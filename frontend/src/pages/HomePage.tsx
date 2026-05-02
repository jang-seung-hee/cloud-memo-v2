import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { useDevice } from '../hooks/useDevice';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { 
  BookOpen, 
  FileText, 
  User, 
  ArrowRight,
  Shield,
  Cloud
} from 'lucide-react';
import { Navigation } from '../components/common/Navigation';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { data: memos } = useMemos();
  const { data: templates } = useTemplates();
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  const [hasAutoRedirected, setHasAutoRedirected] = useState(() => {
    return sessionStorage.getItem('hasAutoRedirected') === 'true';
  });

  useEffect(() => {
    const appUrl = 'https://cloud-memo-v2.netlify.app';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl)}`;
    setQrCodeUrl(qrApiUrl);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !hasAutoRedirected && location.pathname === '/') {
      setHasAutoRedirected(true);
      sessionStorage.setItem('hasAutoRedirected', 'true');
      navigate('/memos');
    }
  }, [isAuthenticated, navigate, hasAutoRedirected, location.pathname]);

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
      setHasAutoRedirected(false);
      sessionStorage.removeItem('hasAutoRedirected');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const handleQrCodeClick = async () => {
    const appUrl = 'https://cloud-memo-v2.netlify.app';
    try {
      await navigator.clipboard.writeText(appUrl);
      toast({
        title: "URL이 복사되었습니다!",
        description: "클립보드에 앱 링크가 복사되었습니다.",
        duration: 3000,
      });
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#8bc0e0] to-[#6a9bd0] dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 flex items-center justify-center">
        <div className="w-full max-w-md px-3 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cloud Memo</h1>
            <p className="text-gray-600 dark:text-gray-300">메모를 클라우드에 저장하고 동기화하세요</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">로그인</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-4">Google 계정으로 로그인하여 시작하세요</p>
            <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
              <ArrowRight className="w-4 h-4 mr-2" />
              로그인
            </Button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">주요 기능</h2>
            <div className="flex items-start gap-4">
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
              <div className="relative">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={handleQrCodeClick} title="클릭하여 URL 복사" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8bc0e0] to-[#6a9bd0] dark:bg-gradient-to-b dark:from-slate-800 dark:via-slate-900 dark:to-gray-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-3 py-8 pb-28">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cloud Memo</h1>
            <p className="text-gray-600 dark:text-gray-300">
              안녕하세요, <span className="font-semibold text-gray-900 dark:text-white">{user?.displayName || user?.email}</span>님!
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto mb-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-md" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">로그인 정보</h2>
              <div className="mb-3">
                <p className="font-medium text-gray-900 dark:text-white text-xs">{user?.displayName || '사용자'}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{user?.email}</p>
              </div>
              <Separator className="my-2 bg-gray-200 dark:bg-gray-600" />
              <Button onClick={handleLogout} variant="outline" className="w-full py-1.5 rounded-lg border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 text-xs">
                로그아웃
              </Button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-4">주요 기능</h2>
            <div className="flex items-start gap-4">
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
              <div className="relative">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-20 h-20 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={handleQrCodeClick} title="클릭하여 URL 복사" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Navigation />
    </div>
  );
};