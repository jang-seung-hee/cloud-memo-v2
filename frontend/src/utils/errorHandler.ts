/**
 * Firebase 에러 처리 유틸리티
 * Firebase 관련 에러를 사용자 친화적인 메시지로 변환
 */

import { logWarn, logInfo } from './logger';

export interface FirebaseError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorInfo {
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
}

// Firebase 에러 코드별 사용자 친화적 메시지
const FIREBASE_ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // 인증 관련 에러
  'auth/user-not-found': {
    title: '사용자를 찾을 수 없습니다',
    description: '등록되지 않은 사용자입니다. 다시 로그인해주세요.',
    severity: 'error',
    retryable: true
  },
  'auth/wrong-password': {
    title: '비밀번호가 올바르지 않습니다',
    description: '입력하신 비밀번호를 확인해주세요.',
    severity: 'error',
    retryable: true
  },
  'auth/too-many-requests': {
    title: '너무 많은 요청',
    description: '잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },
  'auth/network-request-failed': {
    title: '네트워크 오류',
    description: '인터넷 연결을 확인해주세요.',
    severity: 'error',
    retryable: true
  },

  // Firestore 관련 에러
  'permission-denied': {
    title: '권한이 없습니다',
    description: '해당 작업을 수행할 권한이 없습니다.',
    severity: 'error',
    retryable: false
  },
  'unavailable': {
    title: '서비스 일시 중단',
    description: '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },
  'deadline-exceeded': {
    title: '요청 시간 초과',
    description: '요청이 시간 초과되었습니다. 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },
  'resource-exhausted': {
    title: '리소스 부족',
    description: '서버 리소스가 부족합니다. 잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },

  // Storage 관련 에러
  'storage/unauthorized': {
    title: '업로드 권한 없음',
    description: '파일 업로드 권한이 없습니다.',
    severity: 'error',
    retryable: false
  },
  'storage/canceled': {
    title: '업로드 취소됨',
    description: '파일 업로드가 취소되었습니다.',
    severity: 'info',
    retryable: true
  },
  'storage/unknown': {
    title: '알 수 없는 오류',
    description: '파일 업로드 중 알 수 없는 오류가 발생했습니다.',
    severity: 'error',
    retryable: true
  }
};

/**
 * Firebase 에러를 사용자 친화적인 메시지로 변환
 */
export const handleFirebaseError = (error: any): ErrorInfo => {
  console.error('Firebase 에러:', error);

  // Firebase 에러 객체에서 코드 추출
  const errorCode = error?.code || error?.message || 'unknown';
  
  // 알려진 에러 코드인 경우 해당 메시지 반환
  if (FIREBASE_ERROR_MESSAGES[errorCode]) {
    return FIREBASE_ERROR_MESSAGES[errorCode];
  }

  // 네트워크 에러 체크
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    return {
      title: '네트워크 오류',
      description: '인터넷 연결을 확인하고 다시 시도해주세요.',
      severity: 'error',
      retryable: true
    };
  }

  // 권한 관련 에러 체크
  if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
    return {
      title: '권한 오류',
      description: '해당 작업을 수행할 권한이 없습니다.',
      severity: 'error',
      retryable: false
    };
  }

  // 기본 에러 메시지
  return {
    title: '오류가 발생했습니다',
    description: error?.message || '알 수 없는 오류가 발생했습니다.',
    severity: 'error',
    retryable: true
  };
};

/**
 * 에러 로깅 및 분석
 */
export const logError = (error: any, context?: string) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    },
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('📊 에러 로그:', errorInfo);
  
  // 향후 에러 분석 서비스 연동 시 사용
  // analytics.logError(errorInfo);
};



/**
 * 재시도 가능한 작업을 위한 래퍼
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`🔄 재시도 ${attempt}/${maxRetries} 실패:`, error);

      if (attempt < maxRetries) {
        // 지수 백오프: 1초, 2초, 4초...
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * 성능 측정을 위한 유틸리티
 */
export const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${operationName} 완료: ${duration.toFixed(2)}ms`);
    
    // 성능 임계값 체크 (10초)
    if (duration > 10000) {
      console.warn(`⚠️ ${operationName}이 10초를 초과했습니다: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.error(`❌ ${operationName} 실패 (${duration.toFixed(2)}ms):`, error);
    throw error;
  }
}; 