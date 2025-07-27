import React, { useState } from 'react';

interface SimpleImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const SimpleImage: React.FC<SimpleImageProps> = ({
  src,
  alt,
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    console.log('✅ SimpleImage 로드 완료:', src);
    setIsLoaded(true);
  };

  const handleError = () => {
    console.error('❌ SimpleImage 로드 실패:', src);
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      style={{ opacity: isLoaded ? 1 : 0.5 }}
    />
  );
};

// 간단한 이미지 갤러리
export const SimpleImageGallery: React.FC<{
  images: string[];
  className?: string;
  onImageClick?: (imageUrl: string) => void;
}> = ({ images, className = '', onImageClick }) => {
  console.log('🖼️ SimpleImageGallery 렌더링:', images);
  
  if (!images || images.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        첨부된 이미지가 없습니다.
      </div>
    );
  }
  
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {images.map((src, index) => (
        <div 
          key={`${src}-${index}`}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick?.(src)}
        >
          <SimpleImage
            src={src}
            alt={`이미지 ${index + 1}`}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      ))}
    </div>
  );
}; 