import React from 'react';
import { Button } from './button';
import { UserGroupIcon } from '@heroicons/react/24/outline';
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
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className={`flex items-center gap-1.5 h-8 px-2.5 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300 transition-all ${className}`}
        >
            <UserGroupIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">공유설정</span>
            {sharedCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1 min-w-[16px] flex items-center justify-center text-[10px] bg-blue-600 text-white border-none ml-0.5">
                    {sharedCount}
                </Badge>
            )}
        </Button>
    );
};
