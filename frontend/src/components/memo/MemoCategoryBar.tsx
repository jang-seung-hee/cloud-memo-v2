import React from 'react';
import { CategoryType, CategorySelector } from '../ui/category-badge';
import { ShareSettingsBadge } from '../ui/share-settings-badge';
import { Button } from '../ui/button';
import { BookmarkIcon } from '@heroicons/react/24/outline';

export interface MemoCategoryBarProps {
  category: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  sharedCount: number;
  onShareClick: () => void;
  onTemplateClick?: () => void;
  isMobile: boolean;
  isMobileLightMode?: boolean;
}

export const MemoCategoryBar: React.FC<MemoCategoryBarProps> = ({
  category,
  onCategoryChange,
  sharedCount,
  onShareClick,
  onTemplateClick,
  isMobile,
  isMobileLightMode
}) => {
  if (!isMobile) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">카테고리:</span>
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={onCategoryChange}
        />
        <ShareSettingsBadge
          sharedCount={sharedCount}
          onClick={onShareClick}
        />
      </div>
    );
  }

  // 모바일 모드
  return (
    <div className={`w-full px-3 py-2 rounded-lg ${isMobileLightMode ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60'}`}>
      <div className="flex items-center justify-between gap-2">
        <CategorySelector
          selectedCategory={category}
          onCategoryChange={onCategoryChange}
        />
        <div className="flex items-center gap-2">
          <ShareSettingsBadge
            sharedCount={sharedCount}
            onClick={onShareClick}
            className="h-8"
          />
          {onTemplateClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTemplateClick}
              className={`flex items-center gap-1 px-2 py-1 h-8 ${isMobileLightMode ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20'}`}
            >
              <BookmarkIcon className="h-3 w-3" />
              <span className="text-xs">상용구</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
