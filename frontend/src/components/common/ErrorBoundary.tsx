import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { logError } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary에서 에러 발생:', error, errorInfo);
    
    // 에러 로깅
    logError(error, 'ErrorBoundary');
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                예상치 못한 오류가 발생했습니다. 다시 시도해주세요.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  페이지 새로고침
                </Button>
              </div>

              {/* 개발 모드에서만 에러 상세 정보 표시 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-muted rounded text-xs">
                  <summary className="cursor-pointer font-medium mb-2">
                    에러 상세 정보 (개발 모드)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>에러:</strong>
                      <pre className="mt-1 p-2 bg-background rounded overflow-auto">
                        {this.state.error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>컴포넌트 스택:</strong>
                        <pre className="mt-1 p-2 bg-background rounded overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트용 에러 바운더리 래퍼
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 