import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMemos, useTemplates } from '../hooks/useFirestore';
import { useDevice } from '../hooks/useDevice';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  BookOpen, 
  FileText, 
  LogIn, 
  User, 
  Smartphone, 
  Monitor, 
  Sun, 
  Moon,
  QrCode,
  ArrowRight,
  Sparkles,
  Shield,
  Cloud,
  ChevronRight,
  Plus
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuth();
  const { data: memos, loading: memosLoading } = useMemos();
  const { data: templates, loading: templatesLoading } = useTemplates();
  const { isDesktop, isMobile } = useDevice();
  const { isDark, toggleTheme } = useTheme();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // QR 코드 생성 (현재 페이지 URL)
  useEffect(() => {
    const currentUrl = window.location.href;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`;
    setQrCodeUrl(qrApiUrl);
  }, []);

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

  // 로그인 전 홈 페이지
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#4682b4] to-[#2c5aa0] dark:from-[#1a1a1c] dark:to-[#0f0f11]">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a84ff] rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Cloud Memo
            </h1>
            <p className="text-base text-white/80 max-w-2xl mx-auto">
              생각을 담고, 아이디어를 연결하세요
            </p>
          </div>

          {/* 기능 소개 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                <Cloud className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                클라우드 동기화
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs">
                모든 기기에서 실시간으로 메모를 동기화하고 접근하세요
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                상용구 관리
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs">
                자주 사용하는 텍스트를 상용구로 저장하고 빠르게 재사용하세요
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
              <div className="w-8 h-8 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                안전한 보관
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs">
                Firebase의 강력한 보안으로 안전하게 메모를 보관하세요
              </p>
            </div>
          </div>

          {/* QR 코드 및 로그인 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            {/* QR 코드 */}
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]">
              <div className="text-center">
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code" 
                      className="w-full max-w-36 h-auto border-4 border-white dark:border-[#6b7280] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 로그인 섹션 */}
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
              <div className="text-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                  <LogIn className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                  시작하기
                </h3>
                <p className="text-gray-600 dark:text-[#a5b4fc] text-xs mb-3">
                  Google 계정으로 간편하게 로그인하고 서비스를 이용하세요
                </p>
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white font-medium py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Google로 로그인
                </Button>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-[#a5b4fc] space-y-0.5">
                  <p>• 개인정보는 안전하게 보호됩니다</p>
                  <p>• 언제든지 로그아웃할 수 있습니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* 디바이스 및 테마 정보 */}
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-1">
              <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 rounded-full border-white/30 bg-white/20 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105">
                {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                <span className="text-xs font-medium">{isMobile ? '모바일' : '데스크톱'}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 rounded-full border-white/30 bg-white/20 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105">
                {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                <span className="text-xs font-medium">{isDark ? '다크 모드' : '라이트 모드'}</span>
              </Badge>
            </div>
            <p className="text-xs text-white/70">
              최적화된 환경으로 제공됩니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 후 홈 페이지
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4682b4] to-[#2c5aa0] dark:from-[#1a1a1c] dark:to-[#0f0f11]">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0a84ff] rounded-full flex items-center justify-center">
                <Sparkles className="w-2 h-2 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Cloud Memo
          </h1>
          <p className="text-base text-white/80">
            안녕하세요, <span className="font-semibold text-white">{user?.displayName || user?.email}</span>님!
          </p>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-[#f4f4f5] mb-0.5">
                {memosLoading ? '...' : memoCount}
              </div>
              <p className="text-xs text-gray-600 dark:text-[#a5b4fc] font-medium">총 메모</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-2 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
            <div className="text-center">
              <div className="w-6 h-6 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-[#f4f4f5] mb-0.5">
                {templatesLoading ? '...' : templateCount}
              </div>
              <p className="text-xs text-gray-600 dark:text-[#a5b4fc] font-medium">상용구</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* 메모 목록으로 이동 */}
          <div className="group">
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer" onClick={handleGoToMemos}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-3 h-3 text-white" />
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-[#a5b4fc] transition-colors duration-300 group-hover:translate-x-1" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                메모 관리
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs mb-2">
                저장된 메모를 확인하고 관리하세요
              </p>
              <div className="flex items-center text-[#4682b4] dark:text-[#87ceeb] font-medium text-xs group-hover:translate-x-1 transition-transform duration-300">
                메모 목록 보기
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>

          {/* 템플릿 관리 */}
          <div className="group">
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer" onClick={handleGoToTemplates}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-[#a5b4fc] transition-colors duration-300 group-hover:translate-x-1" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                상용구 관리
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs mb-2">
                자주 사용하는 텍스트를 관리하세요
              </p>
              <div className="flex items-center text-[#4682b4] dark:text-[#87ceeb] font-medium text-xs group-hover:translate-x-1 transition-transform duration-300">
                상용구 관리
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>

          {/* 새 메모 작성 */}
          <div className="group">
            <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] cursor-pointer" onClick={() => navigate('/memos/create')}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-6 h-6 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-3 h-3 text-white" />
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-[#a5b4fc] transition-colors duration-300 group-hover:translate-x-1" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                새 메모
              </h3>
              <p className="text-gray-600 dark:text-[#a5b4fc] text-xs mb-2">
                새로운 메모를 작성하세요
              </p>
              <div className="flex items-center text-[#4682b4] dark:text-[#87ceeb] font-medium text-xs group-hover:translate-x-1 transition-transform duration-300">
                메모 작성
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </div>
        </div>

        {/* QR 코드 및 사용자 정보 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* QR 코드 */}
          <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]">
            <div className="text-center">
              {qrCodeUrl && (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-full max-w-32 h-auto border-4 border-white dark:border-[#6b7280] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="bg-white/80 dark:bg-[#23232a]/80 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50 dark:border-[#6b7280]/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] group">
            <div className="text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-[#87ceeb] to-[#4682b4] rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform duration-300">
                <User className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] mb-1">
                계정 정보
              </h3>
              <div className="mb-2">
                <p className="font-semibold text-gray-900 dark:text-[#f4f4f5] text-xs">
                  {user?.displayName || '사용자'}
                </p>
                <p className="text-xs text-gray-600 dark:text-[#a5b4fc] mt-0.5">
                  {user?.email}
                </p>
              </div>
              
              <Separator className="my-2 bg-gray-200 dark:bg-[#6b7280]" />
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="w-full py-1 rounded-lg border-gray-300 dark:border-[#6b7280] text-gray-700 dark:text-[#a5b4fc] hover:bg-gray-50 dark:hover:bg-[#2c2c34] transition-all duration-300 text-xs hover:scale-[1.02] hover:-translate-y-0.5"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        {/* 디바이스 및 테마 정보 */}
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 rounded-full border-white/30 bg-white/20 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105">
              {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              <span className="text-xs font-medium">{isMobile ? '모바일' : '데스크톱'}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 rounded-full border-white/30 bg-white/20 text-white hover:bg-white/30 transition-all duration-300 hover:scale-105">
              {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              <span className="text-xs font-medium">{isDark ? '다크 모드' : '라이트 모드'}</span>
            </Badge>
          </div>
          <p className="text-xs text-white/70">
            최적화된 환경으로 제공됩니다
          </p>
        </div>
      </div>
    </div>
  );
}; 