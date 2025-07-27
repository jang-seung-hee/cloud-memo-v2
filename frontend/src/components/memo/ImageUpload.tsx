import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { PhotoIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useDevice } from '../../hooks/useDevice';
import { validateImageFile, formatFileSize } from '../../utils/imageCompression';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  existingImages?: string[]; // 기존 이미지 URL 배열
  onExistingImagesChange?: (images: string[]) => void; // 기존 이미지 변경 콜백
  maxSize?: number; // MB 단위
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onImagesChange,
  existingImages = [],
  onExistingImagesChange,
  maxSize
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { user } = useAuth();
  const { isDesktop } = useDevice();

  const handleFileSelect = (files: FileList | null) => {
    console.log('🔍 handleFileSelect 호출됨:', files);
    if (!files) return;

    const newImages: File[] = [];

    Array.from(files).forEach((file) => {
      console.log('📁 파일 정보:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // 파일 형식 검증만 수행 (용량은 압축으로 처리)
      const validationError = validateImageFile(file);
      if (validationError) {
        console.log('❌ 파일 검증 실패:', file.name, validationError);
        alert(`${file.name}: ${validationError}`);
        return;
      }

      console.log('✅ 이미지 파일 추가:', file.name);
      newImages.push(file);
    });

    if (newImages.length > 0) {
      console.log('📸 최종 이미지 목록:', newImages.map(f => f.name));
      const updatedImages = [...images, ...newImages];
      onImagesChange(updatedImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleRemoveExistingImage = (index: number) => {
    if (onExistingImagesChange) {
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      onExistingImagesChange(newExistingImages);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {isDesktop ? (
        // PC 모드: 기존 드래그 앤 드롭 방식 유지
        <div className="grid grid-cols-2 gap-4">
          {/* 첫 번째 칸: 드래그 앤 드롭 영역 */}
          <div
            className={`border-2 border-dashed rounded-lg p-1 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <PhotoIcon className="h-3 w-3 mx-auto mb-0.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mb-0.5">
              이미지를 드래그하거나 클릭하여 업로드하세요
            </p>
            <p className="text-xs text-muted-foreground mb-0.5">
              이미지 파일만 가능 (업로드 시 자동으로 리사이즈됩니다)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
              className="h-4 px-2 text-xs"
            >
              이미지 선택
            </Button>
          </div>

          {/* 두 번째 칸: 이미지 미리보기 */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium">첨부된 이미지 ({images.length + existingImages.length}개)</h3>
            {(images.length > 0 || existingImages.length > 0) ? (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ minHeight: 'calc(4rem - 30px)' }}>
                {/* 기존 이미지들 */}
                {existingImages.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={`기존 이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveExistingImage(index)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {/* 새로 추가된 이미지들 */}
                {images.map((image, index) => (
                  <div key={`new-${index}`} className="relative group flex-shrink-0">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`선택된 이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-muted-foreground" style={{ minHeight: 'calc(4rem - 30px)' }}>
                <PhotoIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">첨부된 이미지가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 모바일 모드: 카메라/갤러리 버튼 방식
        <div className="space-y-4">
          {/* 카메라/갤러리 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCameraClick}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <CameraIcon className="h-4 w-4" />
              카메라
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <PhotoIcon className="h-4 w-4" />
              갤러리 선택
            </Button>
          </div>

          {/* 이미지 미리보기 */}
          {(images.length > 0 || existingImages.length > 0) && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">첨부된 이미지 ({images.length + existingImages.length}개)</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {/* 기존 이미지들 */}
                {existingImages.map((imageUrl, index) => (
                  <div key={`existing-${index}`} className="relative group flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={`기존 이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveExistingImage(index)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {/* 새로 추가된 이미지들 */}
                {images.map((image, index) => (
                  <div key={`new-${index}`} className="relative group flex-shrink-0">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`선택된 이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};