/**
 * n8n Webhook 전송 전용 이미지 압축 유틸리티
 *
 * ⚠️ 이 함수는 n8n 메모 전송 전용입니다.
 * 일반 메모의 Firebase Storage 업로드에는 src/utils/imageCompression.ts를 사용하세요.
 *
 * 복제 시 참고: 이 유틸은 n8n 연동 전용이며, 다른 고객사 연동 시 옵션값만 조정하면 됩니다.
 */

export type CompressImageForUploadOptions = {
  /** 이미지 가로 최대 크기 (px), 기본값: 1600 */
  maxWidth?: number;
  /** 이미지 세로 최대 크기 (px), 기본값: 1600 */
  maxHeight?: number;
  /** JPEG 출력 품질 (0.0~1.0), 기본값: 0.75 */
  quality?: number;
  /** 이 크기 이하인 파일은 압축하지 않음 (MB), 기본값: 1.5 */
  maxSizeMB?: number;
};

/**
 * n8n Webhook 전송 전 이미지를 압축합니다.
 *
 * - 이미지가 아닌 파일은 원본 그대로 반환합니다.
 * - maxSizeMB 이하의 파일은 불필요한 압축을 건너뜁니다.
 * - 압축 실패 시 원본 파일을 fallback으로 반환합니다 (전송 중단 없음).
 * - 출력 포맷은 항상 image/jpeg이며, 파일명에 _compressed.jpg가 붙습니다.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageForUploadOptions = {}
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.75,
    maxSizeMB = 1.5,
  } = options;

  // 이미지 파일이 아닌 경우 원본 반환
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const maxBytes = maxSizeMB * 1024 * 1024;

  // 이미 목표 크기 이하인 경우 압축 불필요
  if (file.size <= maxBytes) {
    console.log(
      `[n8n 이미지] ${file.name}: ${Math.round(file.size / 1024)}KB → 크기 기준 이하, 압축 건너뜀`
    );
    return file;
  }

  try {
    // createImageBitmap으로 이미지 디코딩 (메모리 효율적)
    const imageBitmap = await createImageBitmap(file);

    // 비율 유지하며 목표 크기 계산
    const scale = Math.min(
      maxWidth / imageBitmap.width,
      maxHeight / imageBitmap.height,
      1
    );

    const targetWidth = Math.round(imageBitmap.width * scale);
    const targetHeight = Math.round(imageBitmap.height * scale);

    // Canvas 생성 및 이미지 그리기
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[n8n 이미지] Canvas context 생성 실패, 원본 파일로 전송합니다.', file.name);
      return file;
    }

    ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

    // JPEG로 변환
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });

    // 메모리 해제
    imageBitmap.close();
    canvas.width = 0;
    canvas.height = 0;

    if (!blob) {
      console.warn('[n8n 이미지] Blob 생성 실패, 원본 파일로 전송합니다.', file.name);
      return file;
    }

    // 파일명 생성: photo.jpg → photo_compressed.jpg
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const compressedFile = new File([blob], `${baseName}_compressed.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });

    console.log(
      `[n8n 이미지] ${file.name}: ${Math.round(file.size / 1024)}KB →`,
      `${Math.round(compressedFile.size / 1024)}KB`,
      `(${Math.round((1 - compressedFile.size / file.size) * 100)}% 감소, ${targetWidth}×${targetHeight}px)`
    );

    return compressedFile;
  } catch (error) {
    console.warn('[n8n 이미지] 압축 실패, 원본 파일로 전송합니다.', file.name, error);
    return file;
  }
}
