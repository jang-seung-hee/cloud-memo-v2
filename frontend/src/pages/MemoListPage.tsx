import React, { useState, useEffect } from 'react';
import { Layout } from '../components/common/Layout';
import { MemoCard } from '../components/memo/MemoCard';
import { useMemos } from '../hooks/useFirestore';
import { DocumentTextIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MemoListSkeleton } from '../components/ui/skeleton';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useOffline } from '../hooks/useOffline';
import { useDevice } from '../hooks/useDevice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate } from 'react-router-dom';
import { CategoryType } from '../components/ui/category-badge';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export const MemoListPage: React.FC = () => {
  const { data: memos, loading: isLoading, error, refresh } = useMemos();
  const { isOffline } = useOffline();
  const { isDesktop, getTemplateSidebarWidth } = useDevice();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const navigate = useNavigate();

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

  // 검색 및 카테고리 필터링
  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         memo.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || memo.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleNewMemo = () => {
    navigate('/create');
  };

  const handleCategoryChange = (category: CategoryType | 'all') => {
    setSelectedCategory(category);
  };

  // 메모 업데이트 후 목록 새로고침
  const handleMemoUpdate = () => {
    // 로컬 상태가 이미 업데이트되었으므로 추가 새로고침 불필요
    // setTimeout(() => {
    //   refresh();
    // }, 100);
  };

  if (isLoading) {
    return (
      <Layout title="Cloud Memo">
        <div className="space-y-8">
          {isOffline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 shadow-sm">
              📴 오프라인 모드: 인터넷 연결을 확인해주세요.
            </div>
          )}
          
          {/* 상단 영역 스켈레톤 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-card rounded-xl border border-border shadow-sm">
            <div className="h-10 w-32 bg-muted rounded-lg animate-pulse"></div>
            <div className="h-10 w-80 bg-muted rounded-lg animate-pulse"></div>
          </div>
          
          <MemoListSkeleton count={8} />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Cloud Memo">
        <div className="text-center py-12">
          <div className="bg-destructive/10 rounded-xl p-8 border border-destructive/20">
            <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <p className="text-destructive mb-2 font-medium">메모를 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-sm text-destructive/70">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (memos.length === 0) {
    return (
      <Layout title="Cloud Memo">
        <div className="text-center py-12">
          <div className={`rounded-xl p-8 border ${
            isMobileLightMode 
              ? 'bg-white border-gray-200 shadow-sm' 
              : 'bg-muted/50 border-border/50'
          }`}>
            <DocumentTextIcon className={`h-12 w-12 mx-auto mb-4 ${
              isMobileLightMode 
                ? 'text-gray-400' 
                : 'text-muted-foreground'
            }`} />
            <p className={`mb-2 font-medium ${
              isMobileLightMode 
                ? 'text-gray-600' 
                : 'text-muted-foreground'
            }`}>아직 저장된 메모가 없습니다.</p>
            <p className={`text-sm mb-6 ${
              isMobileLightMode 
                ? 'text-gray-500' 
                : 'text-muted-foreground/70'
            }`}>새 메모를 작성해보세요!</p>
            <Button
              onClick={handleNewMemo}
              className={`flex items-center gap-2 mx-auto shadow-sm hover:shadow-md transition-all ${
                isMobileLightMode 
                  ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white' 
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <PlusIcon className="h-4 w-4" />
              첫 번째 메모 작성하기
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Cloud Memo">
      <ErrorBoundary>
        <div className={`${isDesktop ? 'space-y-6' : 'space-y-3'}`}>

              {/* 모바일에서만 새로운 타이틀 스타일 적용 */}
              {!isDesktop && (
            <div className={`flex items-center justify-between px-4 py-1.5 rounded-lg shadow-sm ${
              isMobileLightMode 
                ? 'bg-white border border-gray-200' 
                : 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 shadow-md'
            }`}>
              {/* 왼쪽: 카테고리 드롭다운 */}
              <div className="flex items-center">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
                  className={`border rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 ${
                    isMobileLightMode 
                      ? 'bg-white text-gray-700 border-gray-300 focus:ring-blue-500/50' 
                      : 'bg-white/20 text-white border-white/30 focus:ring-white/50'
                  }`}
                >
                  <option value="all" className="text-gray-800">전체</option>
                  <option value="temporary" className="text-gray-800">임시</option>
                  <option value="memory" className="text-gray-800">기억</option>
                  <option value="archive" className="text-gray-800">보관</option>
                </select>
              </div>
              
              {/* 우측: 타이틀 라벨 */}
              <div className="flex items-center">
                <div className={`w-1 h-1 rounded-full mr-2 ${
                  isMobileLightMode 
                    ? 'bg-gray-400' 
                    : 'bg-white'
                }`}></div>
                <span className={`text-sm font-semibold tracking-wide ${
                  isMobileLightMode 
                    ? 'text-gray-700' 
                    : 'text-white'
                }`}>메모 목록</span>
              </div>
            </div>
          )}

          {/* 상단 버튼 및 검색 영역 */}
          <div className={`${isDesktop ? 'flex items-center gap-4' : 'space-y-2'}`}>
            {/* 새 메모 버튼 - 데스크톱에서만 표시 */}
            {isDesktop && (
              <Button
                onClick={handleNewMemo}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all font-medium w-auto px-6 h-10"
              >
                <PlusIcon className="h-5 w-5" />
                + 새 메모
              </Button>
            )}
            
            {/* 카테고리 드롭다운과 검색 필드 - PC 모드 */}
            {isDesktop && (
              <div className="flex items-center gap-2 flex-1 max-w-2xl">
                {/* 카테고리 드롭다운 */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'all')}
                  className="px-3 py-2 text-sm border border-border/40 rounded-md bg-white dark:bg-background focus:border-ring focus:ring-ring/20 focus:outline-none min-w-[120px]"
                >
                  <option value="all">전체</option>
                  <option value="temporary">임시</option>
                  <option value="memory">기억</option>
                  <option value="archive">보관</option>
                </select>
                
                {/* 검색 필드 */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="메모 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-border/40 focus:border-ring focus:ring-ring/20 bg-white dark:bg-background h-10"
                  />
                </div>
              </div>
            )}
            
            {/* 검색 영역 - 모바일 모드 */}
            {!isDesktop && (
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isMobileLightMode 
                    ? 'text-gray-400' 
                    : 'text-muted-foreground'
                }`} />
                <Input
                  type="text"
                  placeholder="메모 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 py-3 ${
                    isMobileLightMode 
                      ? 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white' 
                      : 'border-border/40 focus:border-ring focus:ring-ring/20 bg-white dark:bg-background'
                  }`}
                />
              </div>
            )}
          </div>

          {/* 메모 리스트 - PC에서는 4개씩 그리드, 모바일에서는 세로 스택 */}
          <div className={isDesktop ? "grid grid-cols-4 gap-4" : "space-y-3"}>
            {filteredMemos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} onMemoUpdate={handleMemoUpdate} />
            ))}
          </div>

          {filteredMemos.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className={`rounded-xl p-8 border ${
                isMobileLightMode 
                  ? 'bg-white border-gray-200 shadow-sm' 
                  : 'bg-muted/50 border-border/50'
              }`}>
                <MagnifyingGlassIcon className={`h-12 w-12 mx-auto mb-4 ${
                  isMobileLightMode 
                    ? 'text-gray-400' 
                    : 'text-muted-foreground'
                }`} />
                <p className={`mb-2 font-medium ${
                  isMobileLightMode 
                    ? 'text-gray-600' 
                    : 'text-muted-foreground'
                }`}>검색 결과가 없습니다.</p>
                <p className={`text-sm ${
                  isMobileLightMode 
                    ? 'text-gray-500' 
                    : 'text-muted-foreground/70'
                }`}>다른 키워드로 검색해보세요.</p>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </Layout>
  );
}; 