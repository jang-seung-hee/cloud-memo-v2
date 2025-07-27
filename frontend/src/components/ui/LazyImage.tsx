import React, { useState } from 'react';
import { Skeleton } from './skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    console.log('✅ LazyImage 로드 완료:', src);
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    console.error('❌ LazyImage 로드 실패:', src);
    setHasError(true);
    onError?.();
  };

  // 에러 상태일 때 플레이스홀더 표시
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
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <Skeleton className="w-full h-full absolute inset-0" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};

// 이미지 갤러리용 최적화된 컴포넌트
export const OptimizedImageGallery: React.FC<{
  images: string[];
  className?: string;
}> = ({ images, className = '' }) => {
  console.log('🖼️ OptimizedImageGallery 렌더링:', images);
  
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
        <LazyImage
          key={`${src}-${index}`}
          src={src}
          alt={`이미지 ${index + 1}`}
          className="w-full h-48 object-cover rounded-lg"
        />
      ))}
    </div>
  );
}; 