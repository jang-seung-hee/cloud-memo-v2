import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  UploadResult,
  StorageReference,
  UploadMetadata
} from 'firebase/storage';
import { storage } from './config';

// Storage 서비스 클래스
export const storageService = {
  // 이미지 업로드
  async uploadImage(
    file: File, 
    userId: string, 
    fileName?: string
  ): Promise<string> {
    try {
      // 파일 크기 검증 제거 - 클라이언트에서 압축 처리

      // 지원 파일 형식 검증
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('지원하지 않는 파일 형식입니다. (JPG, PNG, WebP만 지원)');
      }

      // 파일명 생성
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const finalFileName = fileName || `image_${timestamp}.${fileExtension}`;
      
      // Storage 경로 설정 (사용자별 폴더)
      const storageRef = ref(storage, `users/${userId}/images/${finalFileName}`);
      
      // 메타데이터 설정
      const metadata: UploadMetadata = {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: timestamp.toString(),
          userId: userId
        }
      };

      // 파일 업로드
      const uploadResult: UploadResult = await uploadBytes(storageRef, file, metadata);
      
      // 다운로드 URL 반환
      const downloadURL = await getDownloadURL(uploadResult.ref);
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  },

  // 이미지 URL 가져오기
  async getImageURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('이미지 URL 가져오기 오류:', error);
      throw error;
    }
  },

  // 이미지 삭제
  async deleteImage(url: string): Promise<void> {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      throw error;
    }
  },

  // 사용자별 이미지 목록 가져오기
  async getUserImages(userId: string): Promise<string[]> {
    try {
      // 참고: Firebase Storage는 폴더 목록 조회를 직접 지원하지 않으므로
      // Firestore에 이미지 메타데이터를 저장하여 관리하는 것을 권장합니다.
      // 이 함수는 향후 확장을 위한 플레이스홀더입니다.
      return [];
    } catch (error) {
      console.error('사용자 이미지 목록 가져오기 오류:', error);
      throw error;
    }
  },

  // 이미지 압축 유틸리티 (클라이언트 사이드에서 사용)
  async compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 캔버스 크기 설정 (최대 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, width, height);

        // 압축된 이미지 생성
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('이미지 압축 실패'));
            }
          },
          file.type,
          0.8 // 품질 설정 (0.8 = 80%)
        );
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }
}; 