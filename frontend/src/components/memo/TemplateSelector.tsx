import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BookmarkIcon, ChevronDownIcon, DocumentDuplicateIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ITemplate } from '../../types/template';
import { firestoreService } from '../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { useFontSize } from '../../hooks/useFontSize';

interface TemplateSelectorProps {
  onTemplateSelect: (template: ITemplate) => void;
  templates?: ITemplate[];
}

// 기본 템플릿 데이터 제거 - 사용자가 직접 생성하도록 변경
const defaultTemplates: ITemplate[] = [];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  templates: propTemplates
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { fontSizeClasses } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [templates, setTemplates] = useState<ITemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());

  // 템플릿 데이터 로드
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        console.log('🔄 TemplateSelector 템플릿 로드 시작...');
        // props로 전달된 템플릿이 있으면 우선 사용
        if (propTemplates && propTemplates.length > 0) {
          setTemplates(propTemplates);
          setIsLoading(false);
          return;
        }

        // Firebase에서 사용자 템플릿 로드
        if (user) {
          const userTemplates = await firestoreService.getTemplatesByUserId(user.uid);
          const convertedTemplates: ITemplate[] = userTemplates.map(template => ({
            id: template.id,
            title: template.title,
            content: template.content,
            category: template.category || '기타',
            createdAt: template.createdAt.toDate(),
            updatedAt: template.updatedAt.toDate()
          }));
          
          // 클라이언트에서 정렬 (제목 기준, 같은 제목이면 최신순)
          const sortedTemplates = convertedTemplates.sort((a, b) => {
            // 먼저 제목으로 정렬 (가나다순)
            const titleComparison = a.title.localeCompare(b.title, 'ko');
            
            // 제목이 같으면 최신글이 위로
            if (titleComparison === 0) {
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            }
            
            return titleComparison;
          });
          
          setTemplates(sortedTemplates);
        } else {
          // 사용자가 로그인하지 않은 경우 빈 배열 사용
          setTemplates([]);
        }
      } catch (error) {
        console.error('템플릿 로드 중 오류:', error);
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [propTemplates, user]);

  // Sheet가 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const categories = ['전체', ...Array.from(new Set(templates.map(t => t.category)))];

  // 카테고리 및 검색어 필터링
  const filteredTemplates = templates.filter(template => {
    const categoryMatch = selectedCategory === '전체' || template.category === selectedCategory;
    const searchMatch = !searchTerm || 
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.content.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleTemplateSelect = (template: ITemplate) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  // 클립보드 복사 기능
  const handleCopy = async (e: React.MouseEvent, template: ITemplate) => {
    e.stopPropagation();
    try {
      const textToCopy = `${template.title}\n\n${template.content}`;
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "복사 완료",
        description: "상용구 내용이 클립보드에 복사되었습니다."
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 상용구 삭제 기능
  const handleDelete = async (e: React.MouseEvent, template: ITemplate) => {
    e.stopPropagation();
    if (window.confirm('이 상용구를 삭제하시겠습니까?')) {
      try {
        await firestoreService.deleteTemplate(template.id);
        // 로컬 상태에서도 제거
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        toast({
          title: "삭제 완료",
          description: "상용구가 성공적으로 삭제되었습니다."
        });
      } catch (error) {
        console.error('상용구 삭제 중 오류:', error);
        toast({
          title: "삭제 실패",
          description: "상용구 삭제에 실패했습니다.",
          variant: "destructive"
        });
      }
    }
  };

  // 더보기/접기 토글 기능
  const handleToggleExpand = (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setExpandedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const isExpanded = (templateId: string) => expandedTemplates.has(templateId);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <BookmarkIcon className="h-4 w-4" />
          상용구
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] overflow-hidden">
        <SheetHeader>
          <SheetTitle>상용구 선택</SheetTitle>
        </SheetHeader>
        <div className="sr-only">상용구를 선택하여 메모에 삽입할 수 있습니다.</div>
        
        <div className="mt-6 space-y-4 h-full flex flex-col">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1 flex-shrink-0">
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="px-1 py-1 text-xs h-6"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* 검색 필드 */}
          <div className="flex-shrink-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="상용구 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 상용구 목록 - 스크롤 가능한 영역 */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <BookmarkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">
                  {selectedCategory === '전체' && !searchTerm
                    ? '등록된 상용구가 없습니다.' 
                    : searchTerm
                      ? `'${searchTerm}' 검색 결과가 없습니다.`
                      : '선택된 카테고리에 상용구가 없습니다.'}
                </p>
                {selectedCategory === '전체' && !searchTerm && (
                  <p className="text-sm">
                    상용구 관리에서 자주 사용하는 문구를 등록해보세요!
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className={`mb-2 ${fontSizeClasses.title}`}>{template.title}</CardTitle>
                      <div className="flex items-center justify-between">
                        <span className={`text-muted-foreground bg-muted px-2 py-1 rounded ${fontSizeClasses.text}`}>
                          {template.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                            onClick={(e) => handleCopy(e, template)}
                            title="복사"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-destructive/30"
                            onClick={(e) => handleDelete(e, template)}
                            title="삭제"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="relative">
                        <p className={`text-muted-foreground ${fontSizeClasses.content} ${
                          isExpanded(template.id) ? '' : 'line-clamp-3'
                        }`}>
                          {template.content}
                        </p>
                        
                        {/* 더보기/접기 버튼 - 오른쪽 정렬 */}
                        {template.content.length > 150 && (
                          <div className="flex justify-end mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleToggleExpand(e, template.id)}
                              className="h-6 px-3 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              {isExpanded(template.id) ? '접기' : '더보기'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 