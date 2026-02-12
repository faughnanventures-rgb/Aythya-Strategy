'use client';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 * 
 * PRODUCTION:
 * - Logs errors to console (replace with Sentry in production)
 * - Shows user-friendly error message
 * - Provides recovery options
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (replace with Sentry or similar in production)
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({ errorInfo });
    
    // TODO: Send to error reporting service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="card-elevated text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              
              <h1 className="font-display text-display-sm text-stone-800 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-stone-500 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-stone-100 rounded-lg text-left overflow-auto max-h-40">
                  <p className="text-xs font-mono text-red-600">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try again
                </button>
                
                <Link
                  href="/dashboard"
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              </div>

              <p className="mt-6 text-xs text-stone-400">
                If this keeps happening, please{' '}
                <a href="mailto:support@aythya.com" className="text-sage-600 hover:text-sage-700">
                  contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to trigger error boundary (for testing)
 */
export function useErrorTrigger() {
  const [shouldThrow, setShouldThrow] = React.useState(false);
  
  if (shouldThrow) {
    throw new Error('Test error triggered');
  }
  
  return () => setShouldThrow(true);
}

export default ErrorBoundary;
