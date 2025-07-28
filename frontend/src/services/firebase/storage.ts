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
import { compressImage, validateImageFile, formatFileSize } from '../../utils/imageCompression';
import { logDebug, logInfo, logError } from '../../utils/logger';

// 이미지 캐시를 위한 Map (메모리 최적화)
const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시

// Storage 서비스 클래스
export const storageService = {
  // 이미지 업로드
  async uploadImage(
    file: File, 
    userId: string, 
    fileName?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      logDebug('uploadImage 호출됨:', { 
        fileName: file.name, 
        userId,
        originalSize: formatFileSize(file.size)
      });
      
      // 파일 형식 검증만 수행 (용량은 압축으로 처리)
      const validationError = validateImageFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // 이미지 압축
      logDebug('이미지 압축 시작...');
      const compressedFile = await compressImage(file);
      logInfo('이미지 압축 완료:', {
        originalSize: formatFileSize(file.size),
        compressedSize: formatFileSize(compressedFile.size),
        compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
      });

      // 파일명 생성
      const timestamp = Date.now();
      const fileExtension = compressedFile.name.split('.').pop();
      const finalFileName = fileName || `image_${timestamp}.${fileExtension}`;
      
      logDebug('파일명 생성:', finalFileName);
      
      // Storage 경로 설정 (사용자별 폴더)
      const storageRef = ref(storage, `users/${userId}/images/${finalFileName}`);
      logDebug('Storage 경로:', `users/${userId}/images/${finalFileName}`);
      
      // 메타데이터 설정
      const metadata: UploadMetadata = {
        contentType: compressedFile.type,
        customMetadata: {
          originalName: file.name,
          originalSize: file.size.toString(),
          compressedSize: compressedFile.size.toString(),
          uploadedAt: timestamp.toString(),
          userId: userId
        }
      };

      logDebug('파일 업로드 시작...');
      
      // 진행률 콜백이 있으면 시뮬레이션 (Firebase Storage는 진행률을 직접 제공하지 않음)
      if (onProgress) {
        onProgress(10); // 압축 완료
        setTimeout(() => onProgress(30), 100);
        setTimeout(() => onProgress(60), 200);
        setTimeout(() => onProgress(90), 300);
      }
      
      // 파일 업로드
      const uploadResult: UploadResult = await uploadBytes(storageRef, compressedFile, metadata);
      logInfo('파일 업로드 완료:', uploadResult);
      
      if (onProgress) {
        onProgress(100); // 업로드 완료
      }
      
      // 다운로드 URL 반환
      logDebug('다운로드 URL 생성 중...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      logInfo('다운로드 URL 생성 완료:', downloadURL);
      return downloadURL;
    } catch (error) {
      logError('이미지 업로드 오류:', error);
      throw error;
    }
  },

  // 이미지 URL 가져오기 (캐싱 적용)
  async getImageURL(path: string): Promise<string> {
    try {
      // 캐시 확인
      const cached = imageCache.get(path);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        logDebug('캐시된 이미지 URL 사용:', path);
        return cached.url;
      }
      
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      // 캐시에 저장
      imageCache.set(path, { url, timestamp: now });
      
      // 캐시 크기 제한 (메모리 누수 방지)
      if (imageCache.size > 100) {
        const oldestKey = imageCache.keys().next().value;
        imageCache.delete(oldestKey);
      }
      
      return url;
    } catch (error) {
      logError('이미지 URL 가져오기 오류:', error);
      throw error;
    }
  },

  // 이미지 삭제
  async deleteImage(url: string): Promise<void> {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
      logInfo('이미지 삭제 완료:', url);
    } catch (error) {
      logError('이미지 삭제 오류:', error);
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
      logError('사용자 이미지 목록 가져오기 오류:', error);
      throw error;
    }
  },


}; 