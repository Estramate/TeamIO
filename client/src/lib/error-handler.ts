// Centralized error handling utilities
interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  clubId?: string;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  [key: string]: any;
}

interface PerformanceMetric {
  metric: string;
  value: number;
  context: ErrorContext;
}

class ErrorHandler {
  private isProduction = process.env.NODE_ENV === 'production';
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private performanceQueue: PerformanceMetric[] = [];

  // Log error to console (development) or external service (production)
  logError(error: Error, context: ErrorContext = {}) {
    const enrichedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (this.isProduction) {
      // In production, send to monitoring service
      this.queueError(error, enrichedContext);
    } else {
      // In development, log to console
      console.error('Error:', error);
      console.error('Context:', enrichedContext);
    }
  }

  // Handle API errors consistently
  handleApiError(response: Response, context: ErrorContext = {}) {
    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    this.logError(error, {
      ...context,
      apiStatus: response.status,
      apiUrl: response.url,
    });
  }

  // Handle async operation errors
  handleAsyncError(promise: Promise<any>, context: ErrorContext = {}) {
    return promise.catch((error) => {
      this.logError(error, context);
      throw error; // Re-throw to allow component-level handling
    });
  }

  // Report performance issues
  reportPerformance(metric: string, value: number, context: ErrorContext = {}) {
    const performanceMetric: PerformanceMetric = {
      metric,
      value,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
    };

    if (this.isProduction) {
      this.performanceQueue.push(performanceMetric);
      this.flushPerformanceQueue();
    } else {
      console.warn(`Performance Issue - ${metric}:`, value, 'ms', context);
    }
  }

  // Queue errors for batch sending in production
  private queueError(error: Error, context: ErrorContext) {
    this.errorQueue.push({ error, context });
    
    // Flush queue when it gets too large or after a timeout
    if (this.errorQueue.length >= 5) {
      this.flushErrorQueue();
    } else {
      setTimeout(() => this.flushErrorQueue(), 5000);
    }
  }

  // Send queued errors to monitoring service
  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    try {
      // Here you would send to your monitoring service
      // Example: Sentry, LogRocket, DataDog, etc.
      const payload = this.errorQueue.map(({ error, context }) => ({
        message: error.message,
        stack: error.stack,
        context,
      }));

      // Example API call to your error logging endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: payload }),
      });

      this.errorQueue = [];
    } catch (sendError) {
      console.error('Failed to send error reports:', sendError);
      // Keep errors in queue for retry
    }
  }

  // Send performance metrics
  private async flushPerformanceQueue() {
    if (this.performanceQueue.length === 0) return;

    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: this.performanceQueue }),
      });

      this.performanceQueue = [];
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  // Create error boundary helper
  createErrorBoundary(componentName: string) {
    return (error: Error, errorInfo: any) => {
      this.logError(error, {
        component: componentName,
        errorBoundary: true,
        componentStack: errorInfo.componentStack,
      });
    };
  }

  // Wrap async functions with error handling
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context: ErrorContext = {}
  ): T {
    return ((...args: Parameters<T>) => {
      return this.handleAsyncError(fn(...args), context);
    }) as T;
  }

  // Create a fetch wrapper with error handling
  safeFetch = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        this.handleApiError(response, { fetchUrl: url, fetchMethod: options.method || 'GET' });
      }
      
      return response;
    } catch (error) {
      this.logError(error as Error, { 
        fetchUrl: url, 
        fetchMethod: options.method || 'GET',
        networkError: true 
      });
      throw error;
    }
  };
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios
export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T => {
  return errorHandler.wrapAsync(fn, context);
};

export const logError = (error: Error, context?: ErrorContext) => {
  errorHandler.logError(error, context);
};

export const reportPerformance = (metric: string, value: number, context?: ErrorContext) => {
  errorHandler.reportPerformance(metric, value, context);
};