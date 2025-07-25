// Server-side error reporting and performance monitoring
import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface ErrorReport {
  message: string;
  stack?: string;
  context: {
    component?: string;
    action?: string;
    userId?: string;
    clubId?: string;
    timestamp: string;
    url: string;
    userAgent?: string;
    [key: string]: any;
  };
}

interface PerformanceMetric {
  metric: string;
  value: number;
  context: {
    timestamp: string;
    url: string;
    [key: string]: any;
  };
}

// Store error reports (in production, send to external service)
export const handleErrorReports = (req: Request, res: Response) => {
  try {
    const { errors } = req.body as { errors: ErrorReport[] };
    
    if (!Array.isArray(errors)) {
      return res.status(400).json({ error: 'Invalid error format' });
    }

    // Log each error
    errors.forEach((errorReport) => {
      logger.error('Client Error Report', {
        message: errorReport.message,
        stack: errorReport.stack,
        context: errorReport.context,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });

    // In production, you would send these to your monitoring service
    // Example: Sentry, DataDog, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // sendToMonitoringService(errors);
    }

    res.json({ success: true, processed: errors.length });
  } catch (error) {
    logger.error('Failed to process error reports', { error });
    res.status(500).json({ error: 'Failed to process error reports' });
  }
};

// Store performance metrics
export const handlePerformanceMetrics = (req: Request, res: Response) => {
  try {
    const { metrics } = req.body as { metrics: PerformanceMetric[] };
    
    if (!Array.isArray(metrics)) {
      return res.status(400).json({ error: 'Invalid metrics format' });
    }

    // Log performance issues
    metrics.forEach((metric) => {
      if (metric.value > 1000) { // Log slow operations (>1s)
        logger.warn('Performance Issue', {
          metric: metric.metric,
          value: metric.value,
          context: metric.context,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      }
    });

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // sendPerformanceMetrics(metrics);
    }

    res.json({ success: true, processed: metrics.length });
  } catch (error) {
    logger.error('Failed to process performance metrics', { error });
    res.status(500).json({ error: 'Failed to process performance metrics' });
  }
};

// Enhanced error handling middleware with detailed logging
export const enhancedErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the full error context
  logger.error('Server Error', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.body,
    query: req.query,
    params: req.params,
    userId: (req as any).user?.id,
    sessionId: req.sessionID,
  });

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: {
        type: 'ServerError',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
      },
    });
  } else {
    // In development, provide detailed error information
    res.status(500).json({
      error: {
        type: 'ServerError',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        requestId: res.locals.requestId || 'unknown',
      },
    });
  }
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Database error handler
export const handleDatabaseError = (error: any, context: string) => {
  logger.error('Database Error', {
    message: error.message,
    code: error.code,
    context,
    stack: error.stack,
  });

  // Map specific database errors to user-friendly messages
  switch (error.code) {
    case '23505': // Unique violation
      return {
        type: 'ValidationError',
        message: 'This data already exists in the system',
        field: error.constraint,
      };
    case '23503': // Foreign key violation
      return {
        type: 'ValidationError',
        message: 'Referenced data does not exist',
        field: error.constraint,
      };
    case '23502': // Not null violation
      return {
        type: 'ValidationError',
        message: 'Required field is missing',
        field: error.column,
      };
    default:
      return {
        type: 'DatabaseError',
        message: 'Database operation failed',
      };
  }
};

// Rate limiting error handler
export const handleRateLimitError = (req: Request, res: Response) => {
  logger.warn('Rate Limit Exceeded', {
    ip: req.ip,
    url: req.url,
    userAgent: req.get('User-Agent'),
  });

  res.status(429).json({
    error: {
      type: 'RateLimitError',
      message: 'Too many requests, please try again later',
      retryAfter: 60,
      timestamp: new Date().toISOString(),
    },
  });
};

// Validation error handler
export const handleValidationError = (errors: any[]) => {
  return {
    type: 'ValidationError',
    message: 'Input validation failed',
    errors: errors.map((err) => ({
      field: err.path?.[0] || err.field,
      message: err.message,
      code: err.code,
    })),
  };
};