/**
 * 사이트 전역 설정 및 시각적 변수 정의
 * 가이드라인에 따라 모든 시각적 변수는 여기서 관리합니다.
 */
export const siteConfig = {
  name: 'Cloud Memo v2',
  description: 'AI 기반 스마트 메모 라이브러리',
  version: '2.0.0',
  
  // 테마 및 디자인 시스템 토큰
  theme: {
    primary: '#4682b4', // SteelBlue
    secondary: '#87ceeb', // SkyBlue
    accent: '#f0f9ff',
    borderRadius: '0.5rem',
  },
  
  // n8n 연동 관련 설정
  n8n: {
    enabled: true,
    defaultHeaderName: 'X-N8N-TOKEN', // 보안 토큰을 보낼 기본 헤더 이름
  },
  
  // 사운드 효과 설정
  sounds: {
    success: '/sounds/ksjsbwuil-apple-pay-success-sound-effect-481188.mp3',
    error: '/sounds/freesound_community-beep-warning-6387.mp3',
    delete: '/sounds/freesound_community-pulling-tissue-from-box-86881.mp3',
  }
};

export type SiteConfig = typeof siteConfig;
