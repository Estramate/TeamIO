import winston from 'winston';

// Create centralized logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'teamio-api' },
  transports: [
    // Write to all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Custom error types for better error handling
export class ValidationError extends Error {
  public statusCode: number = 400;
  public type: string = 'ValidationError';
  
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  public statusCode: number = 403;
  public type: string = 'AuthorizationError';
  
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public statusCode: number = 404;
  public type: string = 'NotFoundError';
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  public statusCode: number = 500;
  public type: string = 'DatabaseError';
  
  constructor(message: string = 'Database operation failed', public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Error response interface
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
    field?: string;
    timestamp: string;
    requestId: string;
  };
}

// Global error handler middleware
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  const requestId = req.id || Math.random().toString(36).substr(2, 9);
  
  // Log the error
  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.claims?.sub || 'anonymous',
    ip: req.ip,
  });

  // Determine error type and status code
  let statusCode = 500;
  let errorType = 'InternalServerError';
  let message = 'An unexpected error occurred';
  let field: string | undefined;

  if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    errorType = err.type;
    message = err.message;
    field = err.field;
  } else if (err instanceof AuthorizationError) {
    statusCode = err.statusCode;
    errorType = err.type;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = err.statusCode;
    errorType = err.type;
    message = err.message;
  } else if (err instanceof DatabaseError) {
    statusCode = err.statusCode;
    errorType = err.type;
    message = process.env.NODE_ENV === 'production' 
      ? 'Database operation failed' 
      : err.message;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    errorType = 'ValidationError';
    message = 'Invalid input data';
    field = err.issues?.[0]?.path?.join('.') || undefined;
  }

  const errorResponse: ErrorResponse = {
    error: {
      type: errorType,
      message,
      field,
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(statusCode).json(errorResponse);
};

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  req.id = requestId;
  
  const startTime = Date.now();
  
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.claims?.sub || 'anonymous',
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.claims?.sub || 'anonymous',
    });
  });

  next();
};