/**
 * Google Calendar API 에러 처리 유틸리티
 * Google Calendar API 관련 에러를 사용자 친화적인 메시지로 변환
 */

export interface GoogleCalendarError {
  code: number;
  message: string;
  status: string;
}

export interface CalendarErrorInfo {
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  retryable: boolean;
  action?: string;
}

// Google Calendar API 에러 코드별 사용자 친화적 메시지
const GOOGLE_CALENDAR_ERROR_MESSAGES: Record<number, CalendarErrorInfo> = {
  // 인증 관련 에러
  401: {
    title: '인증이 필요합니다',
    description: 'Google 계정으로 다시 로그인해주세요.',
    severity: 'error',
    retryable: true,
    action: '로그인'
  },
  403: {
    title: '권한이 없습니다',
    description: 'Google Calendar 접근 권한을 허용해주세요.',
    severity: 'error',
    retryable: false,
    action: '권한 설정'
  },

  // API 할당량 관련 에러
  429: {
    title: '요청 한도 초과',
    description: '잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },

  // 서버 에러
  500: {
    title: 'Google 서버 오류',
    description: 'Google 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },
  502: {
    title: '서비스 일시 중단',
    description: 'Google Calendar 서비스가 일시적으로 사용할 수 없습니다.',
    severity: 'warning',
    retryable: true
  },
  503: {
    title: '서비스 점검 중',
    description: 'Google Calendar 서비스가 점검 중입니다. 잠시 후 다시 시도해주세요.',
    severity: 'warning',
    retryable: true
  },

  // 클라이언트 에러
  400: {
    title: '잘못된 요청',
    description: '요청 정보를 확인해주세요.',
    severity: 'error',
    retryable: false
  },
  404: {
    title: '캘린더를 찾을 수 없습니다',
    description: '요청한 캘린더가 존재하지 않습니다.',
    severity: 'error',
    retryable: false
  }
};

/**
 * Google Calendar API 에러를 사용자 친화적인 메시지로 변환
 */
export const handleGoogleCalendarError = (error: any): CalendarErrorInfo => {
  console.error('📅 Google Calendar API 에러:', error);

  // HTTP 상태 코드 추출
  const statusCode = error?.status || error?.code || error?.error?.code;
  
  // 알려진 에러 코드인 경우 해당 메시지 반환
  if (statusCode && GOOGLE_CALENDAR_ERROR_MESSAGES[statusCode]) {
    return GOOGLE_CALENDAR_ERROR_MESSAGES[statusCode];
  }

  // OAuth 관련 에러 체크
  if (error?.message?.includes('access_denied') || error?.message?.includes('unauthorized')) {
    return {
      title: '접근 권한이 거부되었습니다',
      description: 'Google Calendar 접근 권한을 허용해주세요.',
      severity: 'error',
      retryable: false,
      action: '권한 설정'
    };
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
  if (error?.message?.includes('permission') || error?.message?.includes('scope')) {
    return {
      title: 'Calendar 권한이 필요합니다',
      description: 'Google Calendar 접근 권한을 허용해주세요.',
      severity: 'error',
      retryable: false,
      action: '권한 설정'
    };
  }

  // 기본 에러 메시지
  return {
    title: '캘린더 등록 실패',
    description: error?.message || '알 수 없는 오류가 발생했습니다.',
    severity: 'error',
    retryable: true
  };
};

/**
 * Google Calendar 권한 확인
 */
export const checkCalendarPermission = async (): Promise<boolean> => {
  try {
    // Google Calendar API 호출 시도
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1', {
      headers: {
        'Authorization': `Bearer ${await getGoogleToken()}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Calendar 권한 확인 실패:', error);
    return false;
  }
};

/**
 * Google 토큰 획득 (Firebase Auth에서)
 */
const getGoogleToken = async (): Promise<string> => {
  // Firebase Auth에서 Google 토큰 획득 로직
  // 실제 구현은 Firebase Auth 서비스에서 처리
  throw new Error('Google 토큰 획득은 Firebase Auth 서비스에서 처리해야 합니다.');
};

/**
 * 에러 로깅 및 분석
 */
export const logCalendarError = (error: any, context?: string) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      stack: error?.stack
    },
    userAgent: navigator.userAgent,
    url: window.location.href
  };

  console.error('📊 Google Calendar 에러 로그:', errorInfo);
};

/**
 * 재시도 가능한 Calendar 작업을 위한 래퍼
 */
export const withCalendarRetry = async <T>(
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
      const errorInfo = handleGoogleCalendarError(error);
      
      console.warn(`🔄 Calendar 재시도 ${attempt}/${maxRetries} 실패:`, errorInfo);

      // 재시도 불가능한 에러인 경우 즉시 중단
      if (!errorInfo.retryable) {
        throw error;
      }

      if (attempt < maxRetries) {
        // 지수 백오프: 1초, 2초, 4초...
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}; 