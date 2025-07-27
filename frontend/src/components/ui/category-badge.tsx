import React from 'react';
import { Badge } from './badge';
import { cn } from '../../lib/utils';

export type CategoryType = 'temporary' | 'memory' | 'archive';

interface CategoryBadgeProps {
  category: CategoryType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const categoryConfig = {
  temporary: {
    label: '임시',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/30'
  },
  memory: {
    label: '기억',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/30'
  },
  archive: {
    label: '보관',
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30'
  }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  className,
  size = 'md'
}) => {
  // 안전장치: category가 undefined이거나 잘못된 값일 때 기본값 사용
  const safeCategory = category && categoryConfig[category] ? category : 'temporary';
  const config = categoryConfig[safeCategory];
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        'font-medium border rounded-none',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

// 카테고리 선택 컴포넌트
interface CategorySelectorProps {
  selectedCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onCategoryChange,
  className
}) => {
  // 안전장치: selectedCategory가 undefined이거나 잘못된 값일 때 기본값 사용
  const safeSelectedCategory = selectedCategory && categoryConfig[selectedCategory] ? selectedCategory : 'temporary';
  
  return (
    <div className={cn('flex gap-2', className)}>
      {(['temporary', 'memory', 'archive'] as CategoryType[]).map((category) => {
        const isSelected = safeSelectedCategory === category;
        const config = categoryConfig[category];
        
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              'transition-all duration-200 rounded-none border px-1.5 py-0.5 text-xs font-medium relative',
              isSelected
                ? [
                    config.color,
                    'shadow-md shadow-black/10 dark:shadow-black/20',
                    'scale-105',
                    'ring-2 ring-offset-1 ring-offset-background',
                    category === 'temporary' ? 'ring-green-300 dark:ring-green-600' : '',
                    category === 'memory' ? 'ring-orange-300 dark:ring-orange-600' : '',
                    category === 'archive' ? 'ring-red-300 dark:ring-red-600' : ''
                  ]
                : [
                    'bg-white dark:bg-gray-800',
                    'text-gray-600 dark:text-gray-300',
                    'border-gray-300 dark:border-gray-600',
                    'hover:bg-gray-50 dark:hover:bg-gray-700',
                    'hover:border-gray-400 dark:hover:border-gray-500',
                    'hover:scale-102'
                  ]
            )}
          >
            <span className={cn(
              'font-medium',
              isSelected ? 'font-semibold' : 'font-normal'
            )}>
              {config.label}
            </span>
            
            {/* 선택된 상태 표시 */}
            {isSelected && (
              <div className={cn(
                'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-800',
                category === 'temporary' ? 'bg-green-500' : '',
                category === 'memory' ? 'bg-orange-500' : '',
                category === 'archive' ? 'bg-red-500' : ''
              )} />
            )}
          </button>
        );
      })}
    </div>
  );
}; 