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

// Element-specific error fallback
export const ElementErrorBoundary: React.FC<{ elementId?: string; elementType?: string; children: React.ReactNode }> = ({ 
  elementId, 
  elementType, 
  children 
}) => {
  const handleError = (error: Error) => {
    console.error(`Element error in ${elementType} (${elementId}):`, error);
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallback={({ retry }) => (
        <div className="p-2 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-800">
          Element "{elementType}" failed to render
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