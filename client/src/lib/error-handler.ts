// Centralized client-side error handling and reporting
import { toast } from '@/hooks/use-toast';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  context?: any;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorReport[] = [];
  private isOnline = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupEventListeners() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'promise',
        promise: event.promise,
      });
    });

    // Network status listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  handleError(error: Error | any, context?: any) {
    const errorReport: ErrorReport = {
      message: error?.message || String(error),
      stack: error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      context,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    // Add to queue for sending to server
    this.errorQueue.push(errorReport);

    // Show user-friendly error message
    this.showUserError(error, context);

    // Attempt to send error report
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  private showUserError(error: any, context?: any) {
    // Don't show errors for network issues or expected errors
    if (this.isNetworkError(error) || this.isExpectedError(error)) {
      return;
    }

    let title = 'An error occurred';
    let description = 'Something went wrong. Please try again.';

    // Customize based on error type
    if (error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk')) {
      title = 'Loading Error';
      description = 'Failed to load application resources. Please refresh the page.';
    } else if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
      title = 'Network Error';
      description = 'Unable to connect to the server. Please check your connection.';
    } else if (context?.type === 'promise') {
      title = 'Unexpected Error';
      description = 'An unexpected error occurred. The team has been notified.';
    }

    toast({
      title,
      description,
      variant: 'destructive',
    });
  }

  private isNetworkError(error: any): boolean {
    return error?.name === 'NetworkError' ||
           error?.message?.includes('fetch') ||
           error?.message?.includes('network');
  }

  private isExpectedError(error: any): boolean {
    // Add patterns for errors that should not show user notifications
    const expectedPatterns = [
      'AbortError',
      'User cancelled',
      'Navigation cancelled',
    ];

    return expectedPatterns.some(pattern => 
      error?.name?.includes(pattern) || error?.message?.includes(pattern)
    );
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
      });
    } catch (error) {
      // If sending fails, add errors back to queue
      this.errorQueue.unshift(...errors);
      console.warn('Failed to send error reports:', error);
    }
  }

  // Manual error reporting for caught exceptions
  reportError(error: Error, context?: any) {
    this.handleError(error, { ...context, manual: true });
  }

  // Performance monitoring
  reportPerformance(metric: string, value: number, context?: any) {
    if (process.env.NODE_ENV === 'production') {
      // Send performance metrics to monitoring service
      console.log('Performance metric:', { metric, value, context });
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const handleApiError = (error: any, operation: string) => {
  errorHandler.reportError(error, { operation, type: 'api' });
};

export const handleFormError = (error: any, formName: string) => {
  errorHandler.reportError(error, { formName, type: 'form' });
};

export const handleRouteError = (error: any, route: string) => {
  errorHandler.reportError(error, { route, type: 'routing' });
};