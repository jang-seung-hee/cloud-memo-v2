import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Layout } from '../components/common/Layout';
import { MemoCard } from '../components/memo/MemoCard';
import { useMemos, useSharedMemos } from '../hooks/useFirestore';
import { DocumentTextIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MemoListSkeleton } from '../components/ui/skeleton';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { useOffline } from '../hooks/useOffline';
import { useDevice } from '../hooks/useDevice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CategoryType } from '../components/ui/category-badge';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useN8nWorkflows } from '../features/n8n/hooks/useN8nWorkflows';

export const MemoListPage: React.FC = () => {
  const { data: memos, loading: isLoading, error } = useMemos();
  const { isOffline } = useOffline();
  const { isDesktop } = useDevice();
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { workflows } = useN8nWorkflows();
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // URL 파라미터에서 검색 상태 복원
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = (searchParams.get('category') as CategoryType | 'all') || 'all';
  const showArchivedOnly = searchParams.get('archived') === 'true';
  const showSharedOnly = searchParams.get('shared') === 'true';

  const { data: sharedMemos } = useSharedMemos();

  // 검색 입력을 위한 로컬 상태 (실시간 반영)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // URL 파라미터가 변경될 때 로컬 검색 상태 동기화
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // 모바일 + 라이트 모드일 때의 스타일 조건
  const isMobileLightMode = !isDesktop && !isDark;

  // 검색 및 카테고리 필터링을 useMemo로 최적화
  const filteredMemos = useMemo(() => {
    // 공유 메모만 보기 모드일 때
    if (showSharedOnly) {
      return sharedMemos.filter(memo => {
        const matchesSearch = memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memo.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
    }

    return memos.filter(memo => {
      const matchesSearch = memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.content.toLowerCase().includes(searchQuery.toLowerCase());

      // 검색 중일 때는 모든 메모를 검색 대상으로 포함
      if (searchQuery.trim()) {
        return matchesSearch;
      }

      // 보관 메모만 보기 모드일 때
      if (showArchivedOnly) {
        return memo.category === 'archive';
      }

      // 일반 모드일 때는 보관 메모 제외
      const matchesCategory = selectedCategory === 'all' || memo.category === selectedCategory;
      return matchesSearch && matchesCategory && memo.category !== 'archive';
    });
  }, [memos, sharedMemos, searchQuery, selectedCategory, showArchivedOnly, showSharedOnly]);

  // 보관 메모 개수 계산
  const archivedMemosCount = useMemo(() => {
    return memos.filter(memo => memo.category === 'archive').length;
  }, [memos]);

  // 일반 메모 개수 계산 (보관 제외)
  const normalMemosCount = useMemo(() => {
    return memos.filter(memo => memo.category !== 'archive').length;
  }, [memos]);

  // URL 파라미터 업데이트 함수들
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams(prevParams => {
      const newSearchParams = new URLSearchParams(prevParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });
      return newSearchParams;
    });
  }, [setSearchParams]);

  // 이벤트 핸들러들을 useCallback으로 최적화
  const handleNewMemo = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  const handleCategoryChange = useCallback((category: CategoryType | 'all') => {
    updateSearchParams({
      category: category === 'all' ? null : category,
      archived: null // 카테고리 변경 시 보관 모드 해제
    });
  }, [updateSearchParams]);

  const handleArchivedToggle = useCallback(() => {
    const newArchivedValue = !showArchivedOnly;
    updateSearchParams({
      archived: newArchivedValue ? 'true' : null,
      category: null, // 보관 모드 토글 시 카테고리를 전체로 리셋
      shared: null
    });
  }, [showArchivedOnly, updateSearchParams]);

  const handleSharedToggle = useCallback(() => {
    const newSharedValue = !showSharedOnly;
    updateSearchParams({
      shared: newSharedValue ? 'true' : null,
      category: null,
      archived: null
    });
  }, [showSharedOnly, updateSearchParams]);

  const handleSearchChange = useCallback((query: string) => {
    // 로컬 상태 즉시 업데이트 (실시간 반영)
    setLocalSearchQuery(query);

    // 이전 타이머가 있으면 취소
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // 디바운싱 적용 (300ms 후에 URL 업데이트)
    searchTimeoutRef.current = setTimeout(() => {
      updateSearchParams({
        search: query || null
      });
    }, 300);
  }, [updateSearchParams]);

  // 메모 업데이트 후 목록 새로고침
  const handleMemoUpdate = useCallback(() => {
    // 로컬 상태가 이미 업데이트되었으므로 추가 새로고침 불필요
    // setTimeout(() => {
    //   refresh();
    // }, 100);
  }, []);

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
          <div className={`rounded-xl p-8 border ${isMobileLightMode
            ? 'bg-white border-gray-200 shadow-sm'
            : 'bg-muted/50 border-border/50'
            }`}>
            <DocumentTextIcon className={`h-12 w-12 mx-auto mb-4 ${isMobileLightMode
              ? 'text-gray-400'
              : 'text-muted-foreground'
              }`} />
            <p className={`mb-2 font-medium ${isMobileLightMode
              ? 'text-gray-600'
              : 'text-muted-foreground'
              }`}>아직 저장된 메모가 없습니다.</p>
            <p className={`text-sm mb-6 ${isMobileLightMode
              ? 'text-gray-500'
              : 'text-muted-foreground/70'
              }`}>새 메모를 작성해보세요!</p>
            <Button
              onClick={handleNewMemo}
              className={`flex items-center gap-2 mx-auto shadow-sm hover:shadow-md transition-all ${isMobileLightMode
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
            <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg shadow-sm ${isMobileLightMode
              ? 'bg-white border border-gray-200'
              : 'bg-gradient-to-r from-sky-400 via-blue-500 to-cyan-500 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 shadow-md'
              }`}>
              {/* 왼쪽: 카테고리 드롭다운과 보관메모 버튼 */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as CategoryType | 'all')}
                  className={`border rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 ${isMobileLightMode
                    ? 'bg-white text-gray-700 border-gray-300 focus:ring-blue-500/50'
                    : 'bg-white/20 text-white border-white/30 focus:ring-white/50'
                    }`}
                >
                  <option value="all" className="text-gray-800">전체</option>
                  <option value="temporary" className="text-gray-800">임시</option>
                  <option value="memory" className="text-gray-800">기억</option>
                  {workflows.length > 0 && <option value="n8n" className="text-gray-800">n8n</option>}
                </select>

                {/* 공유받은 메모 버튼 */}
                <Button
                  variant={showSharedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={handleSharedToggle}
                  className={`px-2 py-1 text-xs font-medium ${showSharedOnly ? (
                    isMobileLightMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-blue-600 hover:bg-white/90'
                  ) : (
                    isMobileLightMode
                      ? 'border-blue-200 text-blue-600 hover:bg-blue-50'
                      : 'border-white/30 text-white hover:bg-white/10'
                  )
                    }`}
                >
                  공유
                  <span className={`ml-1 px-1 py-0.5 text-xs rounded-full ${showSharedOnly ? (
                    isMobileLightMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white/20 text-white'
                  ) : (
                    isMobileLightMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white/20 text-white'
                  )
                    }`}>
                    {sharedMemos.length}
                  </span>
                </Button>

                {/* 보관메모/일반메모 토글 버튼 */}
                <Button
                  variant={showArchivedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={handleArchivedToggle}
                  className={`px-2 py-1 text-xs font-medium ${showArchivedOnly ? (
                    isMobileLightMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-blue-600 hover:bg-white/90'
                  ) : (
                    isMobileLightMode
                      ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'border-white/30 text-white hover:bg-white/10'
                  )
                    }`}
                >
                  {showArchivedOnly ? '일반' : '보관'}
                  <span className={`ml-1 px-1 py-0.5 text-xs rounded-full ${showArchivedOnly ? (
                    isMobileLightMode
                      ? 'bg-white/20 text-white'
                      : 'bg-white/20 text-white'
                  ) : (
                    isMobileLightMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white/20 text-white'
                  )
                    }`}>
                    {showArchivedOnly ? normalMemosCount : archivedMemosCount}
                  </span>
                </Button>
              </div>

              {/* 우측: 타이틀 라벨 */}
              <div className="flex items-center">
                <div className={`w-1 h-1 rounded-full mr-2 ${isMobileLightMode
                  ? 'bg-gray-400'
                  : 'bg-white'
                  }`}></div>
                <span className={`text-sm font-semibold tracking-wide ${isMobileLightMode
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
                  onChange={(e) => handleCategoryChange(e.target.value as CategoryType | 'all')}
                  className="px-3 py-2 text-sm border border-border/40 rounded-md bg-white dark:bg-background focus:border-ring focus:ring-ring/20 focus:outline-none min-w-[120px]"
                >
                  <option value="all">전체</option>
                  <option value="temporary">임시</option>
                  <option value="memory">기억</option>
                  {workflows.length > 0 && <option value="n8n">n8n</option>}
                </select>

                {/* 검색 필드 */}
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="메모 검색..."
                    value={localSearchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 border-border/40 focus:border-ring focus:ring-ring/20 bg-white dark:bg-background h-10"
                  />
                </div>

                {/* 보관메모/일반메모 토글 버튼 */}
                <Button
                  variant={showArchivedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={handleArchivedToggle}
                  className="px-3 py-2 text-sm"
                >
                  {showArchivedOnly ? '일반메모' : '보관메모'}
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${showArchivedOnly
                    ? 'bg-white/20 text-white'
                    : 'bg-primary/10 text-primary'
                    }`}>
                    {showArchivedOnly ? normalMemosCount : archivedMemosCount}
                  </span>
                </Button>

                {/* 공유받은 메모 버튼 - PC 모드 */}
                <Button
                  variant={showSharedOnly ? "default" : "outline"}
                  size="sm"
                  onClick={handleSharedToggle}
                  className="px-3 py-2 text-sm"
                >
                  공유받은 메모
                  <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${showSharedOnly
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 text-blue-600 dark:bg-blue-900/10 dark:text-blue-400'
                    }`}>
                    {sharedMemos.length}
                  </span>
                </Button>
              </div>
            )}

            {/* 검색 영역 - 모바일 모드 */}
            {!isDesktop && (
              <div className="relative">
                <MagnifyingGlassIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isMobileLightMode
                  ? 'text-gray-400'
                  : 'text-muted-foreground'
                  }`} />
                <Input
                  type="text"
                  placeholder="메모 검색..."
                  value={localSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`pl-10 py-3 ${isMobileLightMode
                    ? 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 bg-white'
                    : 'border-border/40 focus:border-ring focus:ring-ring/20 bg-white dark:bg-background'
                    }`}
                />
              </div>
            )}
          </div>

          {/* 메모 리스트 - PC에서는 반응형 그리드, 모바일에서는 세로 스택 */}
          <div className={isDesktop ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
            {filteredMemos.map((memo) => (
              <MemoCard key={memo.id} memo={memo} onMemoUpdate={handleMemoUpdate} />
            ))}
          </div>

          {filteredMemos.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <div className={`rounded-xl p-8 border ${isMobileLightMode
                ? 'bg-white border-gray-200 shadow-sm'
                : 'bg-muted/50 border-border/50'
                }`}>
                <MagnifyingGlassIcon className={`h-12 w-12 mx-auto mb-4 ${isMobileLightMode
                  ? 'text-gray-400'
                  : 'text-muted-foreground'
                  }`} />
                <p className={`mb-2 font-medium ${isMobileLightMode
                  ? 'text-gray-600'
                  : 'text-muted-foreground'
                  }`}>검색 결과가 없습니다.</p>
                <p className={`text-sm ${isMobileLightMode
                  ? 'text-gray-500'
                  : 'text-muted-foreground/70'
                  }`}>다른 키워드로 검색해보세요.</p>
              </div>
            </div>
          )}

          {/* 보관 메모 모드일 때 안내 메시지 */}
          {showArchivedOnly && filteredMemos.length === 0 && !searchQuery && (
            <div className="text-center py-12">
              <div className={`rounded-xl p-8 border ${isMobileLightMode
                ? 'bg-white border-gray-200 shadow-sm'
                : 'bg-muted/50 border-border/50'
                }`}>
                <DocumentTextIcon className={`h-12 w-12 mx-auto mb-4 ${isMobileLightMode
                  ? 'text-gray-400'
                  : 'text-muted-foreground'
                  }`} />
                <p className={`mb-2 font-medium ${isMobileLightMode
                  ? 'text-gray-600'
                  : 'text-muted-foreground'
                  }`}>보관된 메모가 없습니다.</p>
                <p className={`text-sm ${isMobileLightMode
                  ? 'text-gray-500'
                  : 'text-muted-foreground/70'
                  }`}>메모를 보관으로 설정하면 여기에 표시됩니다.</p>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </Layout >
  );
}; 