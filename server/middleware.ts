// Enhanced middleware for improved API performance and reliability
import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Request timeout middleware
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          url: req.url,
          method: req.method,
          timeout: timeoutMs,
          requestId: (req as any).id,
        });
        
        res.status(408).json({
          error: {
            type: 'TimeoutError',
            message: 'Request timeout',
            timestamp: new Date().toISOString(),
            requestId: (req as any).id,
          },
        });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    
    next();
  };
};

// Request size validation middleware
export const validateRequestSize = (maxSizeBytes: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSizeBytes) {
      logger.warn('Request too large', {
        contentLength,
        maxSize: maxSizeBytes,
        url: req.url,
        requestId: (req as any).id,
      });
      
      return res.status(413).json({
        error: {
          type: 'PayloadTooLargeError',
          message: `Request payload too large. Maximum size: ${maxSizeBytes} bytes`,
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    }
    
    next();
  };
};

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction) => {
  // Set API version header
  res.setHeader('API-Version', '1.0.0');
  
  // Check for client version compatibility if needed
  const clientVersion = req.get('Client-Version');
  if (clientVersion) {
    logger.debug('Client version', { clientVersion, requestId: (req as any).id });
  }
  
  next();
};

// Enhanced CORS for specific origins
export const enhancedCors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://teamio.app',
    process.env.REPLIT_DOMAINS || '',
    process.env.ALLOWED_DOMAINS || '',
  ].filter(Boolean);

  if (origin && allowedOrigins.some(allowed => origin.includes(allowed))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Client-Version');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
  };

  res.json(health);
};