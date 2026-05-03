import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

export interface MemoActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  isMobile: boolean;
  isMobileLightMode?: boolean;
  saveButtonText?: string;
  savingText?: string;
}

export const MemoActionButtons: React.FC<MemoActionButtonsProps> = ({
  onCancel,
  onSave,
  isSaving,
  isMobile,
  isMobileLightMode,
  saveButtonText = "저장",
  savingText = "저장 중..."
}) => {
  if (!isMobile) {
    return (
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2"
        >
          <XMarkIcon className="h-4 w-4 mr-2" />
          취소
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {savingText}
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              {saveButtonText}
            </>
          )}
        </Button>
      </div>
    );
  }

  // 모바일 모드
  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="lg"
        onClick={onCancel}
        disabled={isSaving}
        className={`flex-1 h-12 ${isMobileLightMode ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : ''}`}
      >
        <XMarkIcon className="h-5 w-5 mr-2" />
        취소
      </Button>
      <Button
        size="lg"
        onClick={onSave}
        disabled={isSaving}
        className={`flex-1 h-12 ${isMobileLightMode ? 'bg-gradient-to-r from-[#87ceeb] to-[#4682b4] hover:from-[#7bb8d9] hover:to-[#3d6b9a] text-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5' : 'bg-blue-600 hover:bg-blue-700 dark:bg-slate-600 dark:hover:bg-slate-500'}`}
      >
        {isSaving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {savingText}
          </>
        ) : (
          <>
            <CheckIcon className="h-5 w-5 mr-2" />
            {saveButtonText}
          </>
        )}
      </Button>
    </div>
  );
};
