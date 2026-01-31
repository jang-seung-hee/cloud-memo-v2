import React from 'react';
import { Button } from './button';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Badge } from './badge';

interface ShareSettingsBadgeProps {
    sharedCount: number;
    onClick: () => void;
    className?: string;
}

export const ShareSettingsBadge: React.FC<ShareSettingsBadgeProps> = ({
    sharedCount,
    onClick,
    className = ""
}) => {
    const isShared = sharedCount > 0;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={`flex items-center gap-1.5 h-7 px-2.5 transition-all ${isShared
                ? 'border-solid border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300'
                : 'border-dashed border-gray-300 text-muted-foreground hover:text-blue-600 dark:border-gray-700'
                } ${className}`}
        >
            <UsersIcon className="h-4 w-4" />
            <span className="text-[10px] font-semibold">
                {isShared ? '공유' : '공유등록'}
            </span>
            {isShared && (
                <Badge variant="secondary" className="h-4 px-1 min-w-[16px] flex items-center justify-center text-[10px] bg-blue-600 text-white border-none ml-0.5">
                    {sharedCount}
                </Badge>
            )}
        </Button>
    );
};
