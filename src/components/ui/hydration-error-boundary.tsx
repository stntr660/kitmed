'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface HydrationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface HydrationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log hydration-specific errors
    if (error.message?.includes('Hydration') ||
        error.message?.includes('hydrating') ||
        error.message?.includes('Server HTML') ||
        error.message?.includes('client-side')) {

    } else {
      // Log other errors normally
      console.error('[ERROR BOUNDARY]', error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback for hydration errors
      if (this.state.error?.message?.includes('Hydration') ||
          this.state.error?.message?.includes('hydrating') ||
          this.state.error?.message?.includes('Server HTML')) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-light text-blue-500">
                kit<span className="text-blue-600">Med</span>
              </h1>
              <p className="text-xl text-gray-600">Medical equipment solutions</p>
              <p className="text-sm text-gray-500">Initializing application...</p>
            </div>
          </div>
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600">Please refresh the page to try again</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}