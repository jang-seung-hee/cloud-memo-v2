import React from 'react';
import { PhotoIcon, CameraIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { ImageUpload } from './ImageUpload';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface MemoEditorProps {
  content: string;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  images: File[];
  onImagesChange: (images: File[]) => void;
  existingImages?: string[];
  onExistingImagesChange?: (images: string[]) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  textareaHeight?: number;
  isMobile: boolean;
  isMobileLightMode?: boolean;
  fontSizeClasses: any;
}

export const MemoEditor: React.FC<MemoEditorProps> = ({
  content,
  onContentChange,
  onPaste,
  images,
  onImagesChange,
  existingImages,
  onExistingImagesChange,
  textareaRef,
  textareaHeight,
  isMobile,
  isMobileLightMode,
  fontSizeClasses
}) => {
  // 모바일 전용 이미지 삭제 처리
  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    onImagesChange(updatedImages);
  };

  if (!isMobile) {
    return (
      <div className="space-y-6">
        {/* 메모 입력 영역 (PC) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="content" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              메모 내용
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {content.length}자
            </span>
          </div>
          <div className="relative">
            <Textarea
              id="content"
              ref={textareaRef}
              value={content}
              onChange={onContentChange}
              onPaste={onPaste}
              placeholder="메모 내용을 입력하세요..."
              className={`min-h-[350px] resize-y border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 ${fontSizeClasses.content}`}
            />
          </div>
        </div>

        {/* 이미지 업로드 영역 (PC) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PhotoIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">이미지 첨부</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200" style={{ minHeight: 'calc(8rem - 30px)' }}>
            <ImageUpload
              images={images}
              onImagesChange={onImagesChange}
              existingImages={existingImages}
              onExistingImagesChange={onExistingImagesChange}
            />
          </div>
        </div>
      </div>
    );
  }

  // 모바일 모드
  return (
    <>
      {/* 메모 입력 영역 (모바일) */}
      <Card className={`flex-1 shadow-sm border-2 mb-2 ${isMobileLightMode ? 'border-gray-200 bg-white' : 'border-gray-200 dark:border-gray-700'}`}>
        <CardContent className="p-4 h-full">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="content" className={`text-sm font-medium ${isMobileLightMode ? 'text-gray-700' : 'text-gray-700 dark:text-gray-300'}`}>
                메모 내용
              </label>
              <span className={`text-xs ${isMobileLightMode ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {content.length}자
              </span>
            </div>
            <div className="flex-1">
              <Textarea
                id="content"
                ref={textareaRef}
                value={content}
                onChange={onContentChange}
                onPaste={onPaste}
                placeholder="메모 내용을 입력하세요..."
                style={{
                  height: textareaHeight,
                  minHeight: '115px'
                }}
                className={`h-full resize-none border-0 focus:ring-0 focus:border-0 bg-transparent ${fontSizeClasses.content} ${isMobileLightMode ? 'text-gray-700 placeholder-gray-400' : 'text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500'}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 이미지 업로드 영역 (모바일) */}
      <Card className={`shadow-sm border-2 mb-2 ${isMobileLightMode ? 'border-gray-200 bg-white' : 'border-gray-200 dark:border-gray-700'}`}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg border-2 border-dashed p-1.5 min-h-[72px] ${isMobileLightMode ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600'}`}>
                {images.length > 0 || (existingImages && existingImages.length > 0) ? (
                  <div className="grid grid-cols-2 gap-1">
                    {/* 기존 이미지 렌더링 */}
                    {existingImages && existingImages.map((image, index) => (
                      <div key={`ext-${index}`} className="relative group">
                        <img
                          src={image}
                          alt={`기존 이미지 ${index + 1}`}
                          className="w-full h-8 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (onExistingImagesChange) {
                              const newExisting = existingImages.filter((_, i) => i !== index);
                              onExistingImagesChange(newExisting);
                            }
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-90"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {/* 새 이미지 렌더링 */}
                    {images.map((image, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={typeof image === 'string' ? image : URL.createObjectURL(image as File)}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-8 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-90"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                    <PhotoIcon className="h-5 w-5 mb-0.5 opacity-50" />
                    <span className="text-[9px] text-center leading-tight">이미지가<br/>없습니다</span>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const cameraInput = document.createElement('input');
                    cameraInput.type = 'file';
                    cameraInput.accept = 'image/*';
                    cameraInput.capture = 'environment';
                    cameraInput.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        onImagesChange([...images, ...Array.from(files)]);
                      }
                    };
                    cameraInput.click();
                  }}
                  className={`w-full h-8 flex items-center justify-center transition-all duration-200 ${isMobileLightMode ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500 dark:hover:from-slate-600 dark:hover:to-slate-500'}`}
                >
                  <CameraIcon className={`h-4 w-4 mr-1 ${isMobileLightMode ? 'text-blue-600' : 'text-blue-600 dark:text-blue-400'}`} />
                  <span className={`text-xs font-medium ${isMobileLightMode ? 'text-blue-700' : 'text-blue-700 dark:text-blue-300'}`}>카메라</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.multiple = true;
                    fileInput.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files.length > 0) {
                        onImagesChange([...images, ...Array.from(files)]);
                      }
                    };
                    fileInput.click();
                  }}
                  className={`w-full h-8 flex items-center justify-center transition-all duration-200 ${isMobileLightMode ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:from-green-100 hover:to-emerald-100 dark:from-slate-700 dark:to-slate-600 dark:border-slate-500 dark:hover:from-slate-600 dark:hover:to-slate-500'}`}
                >
                  <PhotoIcon className={`h-4 w-4 mr-1 ${isMobileLightMode ? 'text-green-600' : 'text-green-600 dark:text-green-400'}`} />
                  <span className={`text-xs font-medium ${isMobileLightMode ? 'text-green-700' : 'text-green-700 dark:text-green-300'}`}>갤러리</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
