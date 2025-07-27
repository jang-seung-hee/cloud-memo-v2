import React, { useState } from 'react';
import { ImageUpload } from './ImageUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export const ImageUploadExample: React.FC = () => {
  const [images, setImages] = useState<File[]>([]);

  const handleImagesChange = (newImages: File[]) => {
    console.log('📸 이미지 변경:', newImages.map(f => f.name));
    setImages(newImages);
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>이미지 업로드 테스트</CardTitle>
          <CardDescription>
            이미지를 선택하고 미리보기를 확인해보세요.
            자동으로 2MB 이하로 압축됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={images}
            onImagesChange={handleImagesChange}
            maxSize={2}
          />
        </CardContent>
      </Card>

      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>선택된 이미지 목록</CardTitle>
            <CardDescription>
              현재 선택된 이미지들입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {images.map((image, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`선택된 이미지 ${index + 1}`}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{image.name}</p>
                      <p className="text-xs text-muted-foreground">
                        크기: {(image.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 