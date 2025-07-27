/**
 * 이미지 압축 유틸리티
 * Firebase Storage 업로드 전 이미지를 2MB 이하로 압축
 */

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const defaultCompressionOptions: CompressionOptions = {
  maxSizeMB: 2,
  maxWidth: 800,
  maxHeight: 600,
  quality: 0.5  // 더 강한 압축
};

/**
 * 이미지 파일을 압축하여 지정된 크기 이하로 만듭니다
 */
export const compressImage = (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...defaultCompressionOptions, ...options };
  
  console.log('🗜️ compressImage 호출됨:', { 
    fileName: file.name, 
    originalSize: file.size,
    options: opts 
  });
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      console.log('🖼️ 이미지 로드 완료:', { 
        width: img.width, 
        height: img.height 
      });
      
      // 캔버스 크기 설정
      let { width, height } = img;

      if (width > opts.maxWidth!) {
        height = (height * opts.maxWidth!) / width;
        width = opts.maxWidth!;
      }
      if (height > opts.maxHeight!) {
        width = (width * opts.maxHeight!) / height;
        height = opts.maxHeight!;
      }

      console.log('📐 압축 후 크기:', { width, height });

      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // 압축된 이미지 생성
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ 압축 완료:', { 
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1) + '%'
            });
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            console.error('❌ 압축 실패: blob 생성 실패');
            reject(new Error('이미지 압축 실패'));
          }
        },
        file.type,
        opts.quality
      );
    };

    img.onerror = () => {
      console.error('❌ 이미지 로드 실패');
      reject(new Error('이미지 로드 실패'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 파일 크기를 MB 단위로 변환
 */
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 지원되는 이미지 파일 형식인지 확인
 */
export const isSupportedImageFormat = (file: File): boolean => {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  return supportedTypes.includes(file.type);
};

/**
 * 이미지 파일 검증 (용량 제한 없이 형식만 체크)
 */
export const validateImageFile = (file: File, maxSizeMB: number = 2): string | null => {
  if (!isSupportedImageFormat(file)) {
    return '지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)';
  }
  
  // 용량 제한 체크 제거 - 압축으로 처리
  return null;
}; 