import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MemoListPage } from './pages/MemoListPage';
import { MemoCreatePage } from './pages/MemoCreatePage';
import { MemoEditPage } from './pages/MemoEditPage';
import { MemoDetailPage } from './pages/MemoDetailPage';
import { TemplateManagePage } from './pages/TemplateManagePage';
import { SnippetsPage } from './pages/SnippetsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { QuoteModal } from './components/common/QuoteModal';
import { TemplateProvider } from './contexts/TemplateContext';
import { Toaster } from './components/ui/toaster';
import { useDevice } from './hooks/useDevice';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { measurePageLoad, monitorMemoryUsage, finalPerformanceValidation, checkOptimizationCompletion } from './utils/performanceTest';

function App() {
  // 환경 변수 확인용 로그 추가 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase API Key loaded:', process.env.REACT_APP_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Not loaded');
    console.log('API Key (first 10 chars):', process.env.REACT_APP_FIREBASE_API_KEY ? process.env.REACT_APP_FIREBASE_API_KEY.substring(0, 10) + '...' : 'Not loaded');
  }

  const { isDesktop } = useDevice();
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.uid);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    // 성능 모니터링 초기화
    measurePageLoad();

    // 메모리 사용량 모니터링 (10초마다로 조정하여 CPU 사용량 감소)
    const memoryInterval = setInterval(monitorMemoryUsage, 10000);

    // 최종 성능 검증 (5초 후 실행)
    const validationTimer = setTimeout(() => {
      finalPerformanceValidation();
      checkOptimizationCompletion();
    }, 5000);

    // 모바일 모드에서 앱 시작 시 명언 모달 표시
    if (!isDesktop) {
      const hasShownQuoteToday = localStorage.getItem('quoteShownDate') === new Date().toDateString();
      if (!hasShownQuoteToday) {
        // 1초 후에 모달 표시 (페이지 로딩 완료 후)
        const quoteTimer = setTimeout(() => {
          setShowQuoteModal(true);
          localStorage.setItem('quoteShownDate', new Date().toDateString());
        }, 1000);

        return () => {
          clearTimeout(quoteTimer);
          clearTimeout(validationTimer);
          clearInterval(memoryInterval);
        };
      }
    }

    return () => {
      clearTimeout(validationTimer);
      clearInterval(memoryInterval);
    };
  }, [isDesktop]);

  const handleCloseQuoteModal = useCallback(() => {
    setShowQuoteModal(false);
  }, []);

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
            <Route path="/snippets" element={
              <ProtectedRoute>
                <SnippetsPage />
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
        <Toaster />
      </ErrorBoundary>
    </TemplateProvider>
  );
}

export default App;
