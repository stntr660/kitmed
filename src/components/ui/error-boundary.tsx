'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Log specific details about undefined component errors
    if (error.message.includes('Element type is invalid')) {
      console.error('Component import error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return (
        <DefaultErrorFallback 
          error={this.state.error!} 
          retry={this.retry}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  retry: () => void;
  errorInfo?: React.ErrorInfo;
}

function DefaultErrorFallback({ error, retry, errorInfo }: DefaultErrorFallbackProps) {
  const isComponentError = error.message.includes('Element type is invalid');
  
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          {isComponentError ? 'Component Error' : 'Something went wrong'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-red-600">
          {isComponentError ? (
            <div>
              <p className="font-medium mb-2">A component failed to render properly.</p>
              <p className="text-xs">This is usually caused by:</p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                <li>Missing component export</li>
                <li>Incorrect import statement</li>
                <li>Mixed default and named imports</li>
              </ul>
            </div>
          ) : (
            <p>{error.message}</p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs">
            <summary className="cursor-pointer text-red-600 hover:text-red-700">
              Technical Details
            </summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto max-h-48">
              {error.stack}
              {errorInfo?.componentStack && (
                <>
                  {'\n\nComponent Stack:'}
                  {errorInfo.componentStack}
                </>
              )}
            </pre>
          </details>
        )}

        <Button 
          onClick={retry} 
          variant="outline" 
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

// Utility hook for error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    
    // In development, show more detailed error info
    if (process.env.NODE_ENV === 'development') {
      console.group('Error Details');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  };
}

export default ErrorBoundary;