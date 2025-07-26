import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Zentrale Fehlerbehandlung
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error properties
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  // Log error details
  logger.error('Application Error:', {
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous'
  });

  // Development vs Production error responses
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      error: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    });
  } else {
    // Production - don't leak error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        error: err.message
      });
    } else {
      res.status(500).json({
        error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.'
      });
    }
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as AppError;
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

// Validation Error Handler
export const validationErrorHandler = (errors: any[]) => {
  const error = new Error('Validation failed') as AppError;
  error.statusCode = 400;
  error.isOperational = true;
  
  // Add validation details
  (error as any).validationErrors = errors.map(err => ({
    field: err.path,
    message: err.message,
    value: err.received
  }));
  
  return error;
};