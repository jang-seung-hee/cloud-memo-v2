import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MemoListPage } from './pages/MemoListPage';
import { MemoCreatePage } from './pages/MemoCreatePage';
import { MemoEditPage } from './pages/MemoEditPage';
import { MemoDetailPage } from './pages/MemoDetailPage';
import { TemplateManagePage } from './pages/TemplateManagePage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { QuoteModal } from './components/common/QuoteModal';
import { TemplateProvider } from './contexts/TemplateContext';
import { useDevice } from './hooks/useDevice';
import { measurePageLoad, monitorMemoryUsage } from './utils/performanceTest';

function App() {
  // 환경 변수 확인용 로그 추가
  console.log('Firebase API Key loaded:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Not loaded');
  
  const { isDesktop } = useDevice();
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    // 성능 모니터링 초기화
    measurePageLoad();
    
    // 메모리 사용량 모니터링 (5초마다)
    const memoryInterval = setInterval(monitorMemoryUsage, 5000);
    
    // 모바일 모드에서 앱 시작 시 명언 모달 표시
    if (!isDesktop) {
      const hasShownQuoteToday = localStorage.getItem('quoteShownDate') === new Date().toDateString();
      if (!hasShownQuoteToday) {
        // 1초 후에 모달 표시 (페이지 로딩 완료 후)
        const timer = setTimeout(() => {
          setShowQuoteModal(true);
          localStorage.setItem('quoteShownDate', new Date().toDateString());
        }, 1000);
        
        return () => {
          clearTimeout(timer);
          clearInterval(memoryInterval);
        };
      }
    }
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, [isDesktop]);

  const handleCloseQuoteModal = () => {
    setShowQuoteModal(false);
  };

  return (
    <TemplateProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
          {/* 공개 라우트 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          
          {/* 보호된 라우트 */}
          <Route path="/memos" element={
            <ProtectedRoute>
              <MemoListPage />
            </ProtectedRoute>
          } />
          <Route path="/create" element={
            <ProtectedRoute>
              <MemoCreatePage />
            </ProtectedRoute>
          } />
          <Route path="/memo/:id" element={
            <ProtectedRoute>
              <MemoDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/memo/:memoId/edit" element={
            <ProtectedRoute>
              <MemoEditPage />
            </ProtectedRoute>
          } />
          <Route path="/templates" element={
            <ProtectedRoute>
              <TemplateManagePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          </Routes>
          
          {/* 명언 모달 */}
          <QuoteModal isOpen={showQuoteModal} onClose={handleCloseQuoteModal} />
        </Router>
      </ErrorBoundary>
    </TemplateProvider>
  );
}

export default App;
