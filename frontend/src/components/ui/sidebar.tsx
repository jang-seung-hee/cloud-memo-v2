import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { 
  XMarkIcon, 
  DocumentDuplicateIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useCategories } from '../../hooks/useCategories';
import { useFontSize } from '../../hooks/useFontSize';
import { useDevice } from '../../hooks/useDevice';
import { IFirebaseTemplate } from '../../types/firebase';

interface TemplateSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  templates: IFirebaseTemplate[];
  onTemplateSelect: (content: string) => void;
  onTemplateCopy: (content: string) => void;
}

export const TemplateSidebar: React.FC<TemplateSidebarProps> = ({
  isOpen,
  onClose,
  templates,
  onTemplateSelect,
  onTemplateCopy
}) => {
  const { activeCategories } = useCategories();
  const { fontSizeClasses } = useFontSize();
  const { getTemplateSidebarWidth } = useDevice();
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // props 로깅
  useEffect(() => {
    console.log('🔧 TemplateSidebar props 확인:', {
      isOpen,
      templatesLength: templates?.length,
      onTemplateSelect: typeof onTemplateSelect,
      onTemplateCopy: typeof onTemplateCopy,
      onClose: typeof onClose
    });
    
    // onTemplateSelect 함수의 실제 내용 확인
    if (onTemplateSelect) {
      console.log('🔧 onTemplateSelect 함수 내용:', onTemplateSelect.toString().substring(0, 100) + '...');
    }
  }, [isOpen, templates, onTemplateSelect, onTemplateCopy, onClose]);

  // 사이드바 넓이 동적 계산
  useEffect(() => {
    const updateSidebarWidth = () => {
      const newWidth = getTemplateSidebarWidth();
      setSidebarWidth(newWidth);
    };

    updateSidebarWidth();
    
    // 리사이즈와 방향 변경 시 넓이 재계산
    const handleResize = () => {
      updateSidebarWidth();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [getTemplateSidebarWidth]);

  // 카테고리 필터링
  const filteredTemplates = selectedCategory === '전체' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  // 사용 가능한 카테고리 목록 생성
  const availableCategories = ['전체', ...activeCategories.map(cat => cat.name)];

  // templates 데이터 로깅
  useEffect(() => {
    console.log('📋 TemplateSidebar templates 데이터:', {
      templates,
      templatesLength: templates?.length,
      filteredTemplates,
      filteredLength: filteredTemplates?.length,
      selectedCategory,
      availableCategories
    });
  }, [templates, filteredTemplates, selectedCategory, availableCategories]);

  const handleTemplateClick = (template: IFirebaseTemplate) => {
    console.log('🔍 TemplateSidebar handleTemplateClick 호출됨:', {
      template,
      content: template.content,
      contentLength: template.content?.length,
      title: template.title,
      id: template.id
    });
    
    // content가 비어있거나 undefined인 경우 처리
    if (!template.content || template.content.trim() === '') {
      console.error('❌ template.content가 비어있습니다:', template);
      return;
    }
    
    console.log('✅ content 전달:', template.content);
    console.log('📞 onTemplateSelect 콜백 호출 시작');
    console.log('📞 onTemplateSelect 함수 타입:', typeof onTemplateSelect);
    console.log('📞 onTemplateSelect 함수 내용:', onTemplateSelect?.toString().substring(0, 100) + '...');
    
    try {
      onTemplateSelect(template.content);
      console.log('✅ onTemplateSelect 콜백 호출 완료');
    } catch (error) {
      console.error('❌ onTemplateSelect 콜백 호출 중 오류:', error);
    }
    
    console.log('📞 onClose 콜백 호출');
    onClose();
  };

  const handleCopyClick = (e: React.MouseEvent, content: string) => {
    e.stopPropagation();
    onTemplateCopy(content);
    // 클립보드 복사 후 사이드바 자동 닫기
    onClose();
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* 사이드바 - 동적 넓이 적용 */}
      <div 
        className={cn(
          'fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 z-50 transform transition-all duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className={`font-semibold text-gray-900 dark:text-gray-100 ${fontSizeClasses.title}`}>
            상용구
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* 카테고리 필터 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {availableCategories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className={`px-1 py-1 text-xs h-6 ${fontSizeClasses.text}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* 상용구 목록 - 스크롤 가능한 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <DocumentDuplicateIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className={`text-gray-500 dark:text-gray-400 ${fontSizeClasses.text}`}>
                {selectedCategory === '전체' 
                  ? '등록된 상용구가 없습니다'
                  : `'${selectedCategory}' 카테고리의 상용구가 없습니다`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group relative bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleTemplateClick(template)}
                >
                  {/* 제목 */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${fontSizeClasses.title}`}>
                      {template.title}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleCopyClick(e, template.content)}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      title="클립보드에 복사"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* 내용 미리보기 */}
                  <p className={`text-gray-600 dark:text-gray-400 line-clamp-3 ${fontSizeClasses.content}`}>
                    {template.content}
                  </p>
                  
                  {/* 카테고리 */}
                  {template.category && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded ${fontSizeClasses.text}`}>
                        {template.category}
                      </span>
                    </div>
                  )}
                  
                  {/* 선택 표시 */}
                  <ChevronRightIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
