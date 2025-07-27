/**
 * 성능 테스트 유틸리티
 * PRD 성공 지표(KPI) 달성을 위한 성능 측정
 */

export interface PerformanceMetrics {
  operationName: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface KPIMetrics {
  memoCreationTime: number;
  actionClickCount: number;
  imageUploadTime: number;
  pageLoadTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTimes: Map<string, number> = new Map();

  /**
   * 작업 시작 시간 기록
   */
  startOperation(operationName: string): void {
    this.startTimes.set(operationName, performance.now());
    console.log(`⏱️ ${operationName} 시작`);
  }

  /**
   * 작업 완료 시간 측정
   */
  endOperation(operationName: string, success: boolean = true, error?: string): number {
    const startTime = this.startTimes.get(operationName);
    if (!startTime) {
      console.warn(`⚠️ ${operationName}의 시작 시간이 기록되지 않았습니다.`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetrics = {
      operationName,
      duration,
      timestamp: Date.now(),
      success,
      error
    };

    this.metrics.push(metric);
    this.startTimes.delete(operationName);

    console.log(`⏱️ ${operationName} 완료: ${duration.toFixed(2)}ms`);

    // KPI 체크
    this.checkKPI(operationName, duration);

    return duration;
  }

  /**
   * KPI 달성 여부 체크
   */
  private checkKPI(operationName: string, duration: number): void {
    const kpiThresholds: Record<string, number> = {
      '메모 생성': 10000, // 10초
      '이미지 업로드': 5000, // 5초
      '페이지 로드': 3000, // 3초
      '템플릿 로드': 2000, // 2초
    };

    const threshold = kpiThresholds[operationName];
    if (threshold && duration > threshold) {
      console.warn(`⚠️ KPI 미달성: ${operationName}이 ${threshold}ms를 초과했습니다 (${duration.toFixed(2)}ms)`);
    } else if (threshold) {
      console.log(`✅ KPI 달성: ${operationName} (${duration.toFixed(2)}ms < ${threshold}ms)`);
    }
  }

  /**
   * 성능 메트릭 가져오기
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * 특정 작업의 평균 성능 계산
   */
  getAveragePerformance(operationName: string): number {
    const operationMetrics = this.metrics.filter(m => m.operationName === operationName);
    if (operationMetrics.length === 0) return 0;

    const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / operationMetrics.length;
  }

  /**
   * 성능 메트릭 초기화
   */
  clearMetrics(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * 성능 리포트 생성
   */
  generateReport(): string {
    const report = {
      totalOperations: this.metrics.length,
      successfulOperations: this.metrics.filter(m => m.success).length,
      failedOperations: this.metrics.filter(m => !m.success).length,
      averagePerformance: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      operationsByType: this.metrics.reduce((acc, m) => {
        acc[m.operationName] = (acc[m.operationName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return JSON.stringify(report, null, 2);
  }
}

// 전역 성능 모니터 인스턴스
export const performanceMonitor = new PerformanceMonitor();

/**
 * 성능 측정 데코레이터 (함수용)
 */
export const measurePerformance = <T extends any[], R>(
  operationName: string,
  fn: (...args: T) => Promise<R>
) => {
  return async (...args: T): Promise<R> => {
    performanceMonitor.startOperation(operationName);
    
    try {
      const result = await fn(...args);
      performanceMonitor.endOperation(operationName, true);
      return result;
    } catch (error) {
      performanceMonitor.endOperation(operationName, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
};

/**
 * 클릭 수 추적
 */
export class ClickTracker {
  private clickCounts: Map<string, number> = new Map();
  private targetClickCount = 3; // PRD 요구사항: 3클릭 이내

  trackClick(actionName: string): void {
    const currentCount = this.clickCounts.get(actionName) || 0;
    this.clickCounts.set(actionName, currentCount + 1);
    
    console.log(`🖱️ ${actionName} 클릭: ${currentCount + 1}회`);
    
    if (currentCount + 1 > this.targetClickCount) {
      console.warn(`⚠️ ${actionName}이 ${this.targetClickCount}클릭을 초과했습니다 (${currentCount + 1}회)`);
    }
  }

  getClickCount(actionName: string): number {
    return this.clickCounts.get(actionName) || 0;
  }

  resetClicks(): void {
    this.clickCounts.clear();
  }
}

export const clickTracker = new ClickTracker();

/**
 * 페이지 로드 성능 측정
 */
export const measurePageLoad = () => {
  const startTime = performance.now();
  
  window.addEventListener('load', () => {
    const loadTime = performance.now() - startTime;
    performanceMonitor.endOperation('페이지 로드', true);
    
    console.log(`📄 페이지 로드 완료: ${loadTime.toFixed(2)}ms`);
  });
};

/**
 * 메모리 사용량 모니터링
 */
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('💾 메모리 사용량:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
    });
  }
}; 