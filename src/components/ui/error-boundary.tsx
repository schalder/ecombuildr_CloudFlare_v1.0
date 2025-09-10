import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button variant="outline" size="sm" onClick={this.retry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Simple error fallback for React elements
export const SimpleErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-4 text-center border border-destructive/20 rounded-lg bg-destructive/5">
    <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
    <h3 className="text-sm font-medium mb-2">Content Error</h3>
    <p className="text-xs text-muted-foreground mb-3">
      {error?.message || 'Content could not be displayed'}
    </p>
    <Button variant="outline" size="sm" onClick={retry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </div>
);

// Enhanced element-specific error fallback with detailed diagnostics
export const ElementErrorBoundary: React.FC<{ elementId?: string; elementType?: string; children: React.ReactNode }> = ({ 
  elementId, 
  elementType, 
  children 
}) => {
  const handleError = (error: Error) => {
    // Enhanced error logging with stack trace and context
    console.error(`[CRITICAL] Element error in ${elementType} (${elementId}):`, {
      error: error.message,
      stack: error.stack,
      elementId,
      elementType,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Check if this is a React error #310 (hooks issue)
    if (error.message.includes('310') || error.stack?.includes('310')) {
      console.error(`[HOOKS ERROR] React error #310 detected in element ${elementType} (${elementId})`);
      console.error('This indicates conditional hook usage - hooks must be called in the same order every time');
    }
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={({ error, retry }) => (
        <div className="p-3 border border-red-300 bg-red-50 rounded-lg text-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="font-semibold text-red-800">Element Error</span>
          </div>
          <div className="text-red-700 mb-2">
            <div><strong>Type:</strong> {elementType}</div>
            <div><strong>ID:</strong> {elementId}</div>
            {error?.message.includes('310') && (
              <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                <strong>React Error #310:</strong> This element has conditional hook usage
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={retry} className="mt-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry Element
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

// Chart-specific error fallback
export const ChartErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center h-[300px] text-center p-6 border border-dashed border-muted-foreground/25 rounded-lg">
    <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
    <h3 className="text-sm font-medium mb-2">Chart unavailable</h3>
    <p className="text-xs text-muted-foreground mb-4">
      {error?.message || 'Unable to load chart data'}
    </p>
    <Button variant="outline" size="sm" onClick={retry}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </div>
);