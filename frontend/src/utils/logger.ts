/**
 * 조건부 로깅 유틸리티
 * 개발 환경에서만 콘솔 로그가 출력되도록 제어
 */

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

// 로그 레벨 정의
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// 로그 설정 인터페이스
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

// 기본 로거 설정
const defaultConfig: LoggerConfig = {
  enabled: isDevelopment,
  level: LogLevel.INFO,
  prefix: '[Cloud Memo]'
};

// 로거 클래스
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || '';
    return `${prefix} [${level.toUpperCase()}] [${timestamp}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message), ...args);
    }
  }

  // 성능 측정용 로그 (항상 출력)
  performance(message: string, ...args: any[]): void {
    if (isDevelopment) {
      console.log(`⏱️ ${message}`, ...args);
    }
  }

  // 에러 로그 (항상 출력)
  criticalError(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  // 설정 업데이트
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 전역 로거 인스턴스
export const logger = new Logger();

// 편의 함수들
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logPerformance = (message: string, ...args: any[]) => logger.performance(message, ...args);
export const logCriticalError = (message: string, ...args: any[]) => logger.criticalError(message, ...args); 